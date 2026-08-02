from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role
from .models import (
    Department,
    ComplaintCategory,
    ComplaintStatus,
    Complaint,
    OfficerAssignment,
    ComplaintEvidence,
    EscalationHistory,
    OfficerPerformance
)
from .services_officer import OfficerWorkflowService

User = get_user_model()

class OfficerOperationsTests(APITestCase):
    def setUp(self):
        # Create roles
        self.officer_role = Role.objects.create(role_name='officer')
        self.citizen_role = Role.objects.create(role_name='citizen')
        
        # Create users
        self.officer = User.objects.create_user(
            email='officer@example.com', full_name='Officer One', role=self.officer_role
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen Two', role=self.citizen_role
        )

        # Create master data
        self.dept = Department.objects.create(department_name="Road Department")
        self.dept2 = Department.objects.create(department_name="Electricity Department")
        self.category = ComplaintCategory.objects.create(
            category_name="Pothole", department=self.dept
        )
        
        # Setup statuses
        self.status_pending = ComplaintStatus.objects.create(status="Pending", sequence=1)
        self.status_accepted = ComplaintStatus.objects.create(status="Accepted", sequence=2)
        self.status_travelling = ComplaintStatus.objects.create(status="Travelling", sequence=3)
        self.status_resolved = ComplaintStatus.objects.create(status="Resolved", sequence=4)

        # Create complaint
        self.complaint = Complaint.objects.create(
            complaint_number="COMP-OFF-1",
            citizen=self.citizen,
            category=self.category,
            department=self.dept,
            status=self.status_pending,
            title="Broken Road Corner",
            description="Deep holes causing bicycle accidents."
        )

        # Assign to officer
        self.assignment = OfficerAssignment.objects.create(
            complaint=self.complaint,
            officer=self.officer,
            status="Assigned"
        )

    def test_accept_assignment(self):
        self.client.force_authenticate(user=self.officer)
        resp = self.client.put(f'/api/officer/status/{self.complaint.id}/', {"status": "Accepted"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        
        # Check database
        self.assignment.refresh_from_db()
        self.assertEqual(self.assignment.status, "Accepted")
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status.status, "Accepted")

    def test_status_workflow(self):
        self.client.force_authenticate(user=self.officer)
        
        # Transition to Travelling
        resp = self.client.put(f'/api/officer/status/{self.complaint.id}/', {"status": "Travelling", "notes": "Travelling to site."})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status.status, "Travelling")

        # Resolve ticket
        resp_resolved = self.client.put(f'/api/officer/status/{self.complaint.id}/', {"status": "Resolved", "notes": "Pothole filled with concrete."})
        self.assertEqual(resp_resolved.status_code, status.HTTP_200_OK)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status.status, "Resolved")
        self.assertIsNotNone(self.complaint.resolved_at)

    def test_upload_evidence(self):
        self.client.force_authenticate(user=self.officer)
        payload = {
            "complaint": str(self.complaint.id),
            "image_url": "https://supabase-bucket.co/evidence.jpg",
            "evidence_type": "After",
            "description": "Evidence showing resolved pothole site."
        }
        resp = self.client.post('/api/officer/upload-evidence/', payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(ComplaintEvidence.objects.filter(complaint=self.complaint, evidence_type="After").exists())

    def test_escalate_and_reroute(self):
        self.client.force_authenticate(user=self.officer)
        payload = {
            "complaint": str(self.complaint.id),
            "reason": "Requires high voltage maintenance support.",
            "new_department": str(self.dept2.id)
        }
        resp = self.client.post('/api/officer/escalate/', payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        
        # Verify rerouting
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.department, self.dept2)
        self.assertEqual(self.complaint.status.status, "Escalated")
        self.assertTrue(EscalationHistory.objects.filter(complaint=self.complaint).exists())
