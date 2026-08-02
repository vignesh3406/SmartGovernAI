from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from .models import Role, AuditLog
from .services_audit import AuditLogService

User = get_user_model()

class AuditLogTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            role=self.role
        )

    def test_log_action_anonymous(self):
        # Log action without request/user
        log = AuditLogService.log_action(None, "Anonymous Action")
        self.assertEqual(log.action, "Anonymous Action")
        self.assertIsNone(log.user)

    def test_log_action_with_user_and_request(self):
        request = self.factory.get('/dummy/', HTTP_USER_AGENT='Mozilla/5.0', REMOTE_ADDR='192.168.1.1')
        request.user = self.user
        
        log = AuditLogService.log_action(self.user, "User Login", request)
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, "User Login")
        self.assertEqual(log.ip_address, '192.168.1.1')
        self.assertEqual(log.user_agent, 'Mozilla/5.0')
        
    def test_log_action_x_forwarded_for(self):
        request = self.factory.get('/dummy/', HTTP_X_FORWARDED_FOR='10.0.0.1, 192.168.1.1', HTTP_USER_AGENT='Firefox')
        request.user = self.user
        
        log = AuditLogService.log_action(self.user, "User Action", request)
        self.assertEqual(log.ip_address, '10.0.0.1')
