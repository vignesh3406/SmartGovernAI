from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role
from .models import Department, ComplaintCategory, ComplaintStatus, Complaint, AIAnalysis, AIRequestLog
from .services_ai_engine import AIEngineService

User = get_user_model()

class AIEngineTests(APITestCase):
    def setUp(self):
        # Create roles
        self.citizen_role = Role.objects.create(role_name='citizen')
        self.admin_role = Role.objects.create(role_name='admin')

        # Create users
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen User', role=self.citizen_role
        )
        self.admin = User.objects.create_user(
            email='admin@example.com', full_name='Admin User', role=self.admin_role
        )

        # Create master data
        self.dept = Department.objects.create(department_name="Municipality")
        self.category = ComplaintCategory.objects.create(
            category_name="Other", department=self.dept
        )
        self.status_pending = ComplaintStatus.objects.create(status="Pending", sequence=1)

        # Create complaint
        self.complaint = Complaint.objects.create(
            complaint_number="COMP-101",
            citizen=self.citizen,
            category=self.category,
            status=self.status_pending,
            title="Broken Street Light",
            description="Dark street light causing accidents at night."
        )

    def test_run_local_fallback_analysis(self):
        analysis = AIEngineService.run_complaint_analysis(self.complaint)
        self.assertEqual(analysis.complaint, self.complaint)
        self.assertEqual(analysis.predicted_category, "Street Light")
        self.assertEqual(analysis.predicted_department, "Electricity Department")
        self.assertEqual(analysis.status, "Success")
        
        # Verify request logging
        self.assertTrue(AIRequestLog.objects.filter(endpoint="/api/ai/analyze/").exists())

    def test_api_reanalyze_permissions(self):
        self.client.force_authenticate(user=self.citizen)
        
        # Citizens cannot call reanalyze
        resp = self.client.post('/api/ai/reanalyze/', {"complaint_id": str(self.complaint.id)})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can call reanalyze
        self.client.force_authenticate(user=self.admin)
        resp_admin = self.client.post('/api/ai/reanalyze/', {"complaint_id": str(self.complaint.id)})
        self.assertEqual(resp_admin.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_admin.data['success'])
        self.assertEqual(resp_admin.data['data']['predicted_category'], "Street Light")

    def test_api_logs_permissions(self):
        # Admin can view logs
        self.client.force_authenticate(user=self.admin)
        resp = self.client.get('/api/ai/logs/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Citizen cannot view logs
        self.client.force_authenticate(user=self.citizen)
        resp_citizen = self.client.get('/api/ai/logs/')
        self.assertEqual(resp_citizen.status_code, status.HTTP_403_FORBIDDEN)
