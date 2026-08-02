from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role, AuditLog
from .models import Department, ComplaintCategory, ComplaintStatus, Complaint, OfficerAssignment

User = get_user_model()

class AdminOperationsTests(APITestCase):
    def setUp(self):
        # Create roles
        self.admin_role = Role.objects.create(role_name='admin')
        self.officer_role = Role.objects.create(role_name='officer')
        self.citizen_role = Role.objects.create(role_name='citizen')

        # Create users
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin User', role=self.admin_role
        )
        self.officer = User.objects.create_user(
            email='officer@example.com', full_name='Officer User', role=self.officer_role
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen User', role=self.citizen_role
        )

        # Create master data
        self.dept = Department.objects.create(department_name="Road Department")
        self.category = ComplaintCategory.objects.create(
            category_name="Pothole", department=self.dept
        )
        self.status_pending = ComplaintStatus.objects.create(status="Pending", sequence=1)

        # Create complaint
        self.complaint = Complaint.objects.create(
            complaint_number="COMP-ADM-1",
            citizen=self.citizen,
            category=self.category,
            status=self.status_pending,
            title="Broken Road Corner",
            description="Deep holes causing bicycle accidents."
        )

    def test_get_dashboard_metrics(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/admin/dashboard/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data['success'])
        metrics = resp.data['data']['metrics']
        self.assertEqual(metrics['total_citizens'], 1)
        self.assertEqual(metrics['total_officers'], 1)
        self.assertEqual(metrics['total_complaints'], 1)

    def test_list_users(self):
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/admin/users/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Search check
        resp_search = self.client.get('/api/admin/users/?search=officer')
        self.assertEqual(len(resp_search.data['data']), 1)

    def test_suspend_unsuspend_user(self):
        self.client.force_authenticate(user=self.admin)
        
        # Suspend
        resp = self.client.put(f'/api/admin/users/{self.citizen.id}/', {"is_active": False})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertFalse(self.citizen.is_active)

        # Unsuspend
        resp_active = self.client.put(f'/api/admin/users/{self.citizen.id}/', {"is_active": True})
        self.assertEqual(resp_active.status_code, status.HTTP_200_OK)
        self.citizen.refresh_from_db()
        self.assertTrue(self.citizen.is_active)

    def test_manual_assign(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "complaint_id": str(self.complaint.id),
            "officer_id": str(self.officer.id)
        }
        resp = self.client.post('/api/admin/assign/', payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(OfficerAssignment.objects.filter(complaint=self.complaint, officer=self.officer).exists())

    def test_get_audit_logs(self):
        # Create some audit logs
        AuditLog.objects.create(
            user=self.citizen,
            action="LOGIN",
            ip_address="127.0.0.1",
            user_agent="Mozilla"
        )
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/admin/audit/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['data']), 1)
