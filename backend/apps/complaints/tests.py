from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role
from .models import Department, ComplaintCategory, ComplaintStatus, Priority, Severity, Complaint, ComplaintTimeline
from .services_complaint import ComplaintService

User = get_user_model()

class ComplaintWorkflowTests(APITestCase):
    def setUp(self):
        # Create roles
        self.citizen_role = Role.objects.create(role_name='citizen')
        self.officer_role = Role.objects.create(role_name='officer')
        self.admin_role = Role.objects.create(role_name='admin')

        # Create users
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen User', role=self.citizen_role
        )
        self.officer = User.objects.create_user(
            email='officer@example.com', full_name='Officer User', role=self.officer_role
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin User', role=self.admin_role
        )

        # Create master data
        self.dept = Department.objects.create(department_name="Road Department")
        self.category = ComplaintCategory.objects.create(
            category_name="Pothole", department=self.dept
        )
        self.status_pending = ComplaintStatus.objects.create(status="Pending", sequence=1)
        self.status_accepted = ComplaintStatus.objects.create(status="Accepted", sequence=4)
        self.status_resolved = ComplaintStatus.objects.create(status="Resolved", sequence=6)

    def test_citizen_submit_complaint(self):
        self.client.force_authenticate(user=self.citizen)

        payload = {
            "title": "Big Pothole",
            "description": "Massive pothole in the middle of the road.",
            "category": str(self.category.id),
            "latitude": 17.385044,
            "longitude": 78.486671,
            "address": "Hyderabad, Telangana",
            "images": ["https://mockstorage.supabase.co/img.png"]
        }

        response = self.client.post('/api/complaints/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        # Verify db
        complaint = Complaint.objects.get(title="Big Pothole")
        self.assertEqual(complaint.citizen, self.citizen)
        self.assertEqual(complaint.category, self.category)
        self.assertEqual(complaint.status, self.status_pending)
        self.assertEqual(complaint.images.count(), 1)
        
        # Verify timeline
        self.assertEqual(complaint.timeline.count(), 1)
        self.assertEqual(complaint.timeline.first().status_name, "Submitted")

    def test_duplicate_detection(self):
        # Create a complaint manually
        complaint = Complaint.objects.create(
            complaint_number="COMP-123",
            citizen=self.citizen,
            category=self.category,
            status=self.status_pending,
            title="Pothole Issue",
            description="Bad potholes on the main street",
            latitude=17.385044,
            longitude=78.486671
        )

        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(
            f'/api/complaints/duplicates/?latitude=17.385050&longitude=78.486680&category={self.category.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should detect the complaint we just created because it's within the bounding box
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['id'], str(complaint.id))

    def test_officer_accept_and_resolve_complaint(self):
        # Setup active complaint
        complaint = Complaint.objects.create(
            complaint_number="COMP-345",
            citizen=self.citizen,
            category=self.category,
            status=self.status_pending,
            title="Pothole Issue",
            description="Bad potholes on the main street"
        )

        # 1. Accept complaint
        self.client.force_authenticate(user=self.officer)
        response = self.client.post(f'/api/complaints/{complaint.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, self.status_accepted)

        # 2. Resolve complaint
        res_payload = {
            "status": "Resolved",
            "notes": "Pothole filled with concrete.",
            "images": ["https://mockstorage.supabase.co/resolved.png"]
        }
        res_response = self.client.post(f'/api/complaints/{complaint.id}/update-status/', res_payload, format='json')
        self.assertEqual(res_response.status_code, status.HTTP_200_OK)
        
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, self.status_resolved)
        self.assertIsNotNone(complaint.resolved_at)

    def test_citizen_feedback_and_close(self):
        complaint = Complaint.objects.create(
            complaint_number="COMP-678",
            citizen=self.citizen,
            category=self.category,
            status=self.status_resolved,
            title="Pothole Issue",
            description="Bad potholes on the main street"
        )

        self.client.force_authenticate(user=self.citizen)
        payload = {
            "rating": 5,
            "comment": "Excellent and prompt service!"
        }
        response = self.client.post(f'/api/complaints/{complaint.id}/feedback/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        complaint.refresh_from_db()
        self.assertEqual(complaint.status.status, "Closed")
        self.assertEqual(complaint.feedback.rating, 5)
