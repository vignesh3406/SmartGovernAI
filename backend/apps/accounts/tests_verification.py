from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Role, EmailVerificationToken
from .services_verification import EmailVerificationService

User = get_user_model()

class VerificationServiceTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            role=self.role
        )

    def test_token_generation_and_expiry(self):
        token_str = EmailVerificationService.generate_token(self.user)
        self.assertTrue(token_str)
        
        token_obj = EmailVerificationToken.objects.get(token=token_str)
        self.assertEqual(token_obj.user, self.user)
        self.assertFalse(token_obj.is_used)
        self.assertGreater(token_obj.expires_at, timezone.now())

    def test_verify_valid_token(self):
        token_str = EmailVerificationService.generate_token(self.user)
        success, message = EmailVerificationService.verify_token(token_str)
        
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        self.assertTrue(self.user.is_active)

    def test_verify_expired_token(self):
        token_str = EmailVerificationService.generate_token(self.user)
        token_obj = EmailVerificationToken.objects.get(token=token_str)
        token_obj.expires_at = timezone.now() - timedelta(seconds=1)
        token_obj.save()
        
        success, message = EmailVerificationService.verify_token(token_str)
        self.assertFalse(success)
        self.assertEqual(message, "This verification link has expired")

    def test_verify_already_used_token(self):
        token_str = EmailVerificationService.generate_token(self.user)
        EmailVerificationService.verify_token(token_str)
        
        success, message = EmailVerificationService.verify_token(token_str)
        self.assertFalse(success)
        self.assertEqual(message, "This verification link has already been used")


class VerificationAPITests(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            role=self.role
        )

    def test_api_verify_email(self):
        token_str = EmailVerificationService.generate_token(self.user)
        response = self.client.get(f'/api/auth/verify-email/{token_str}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_api_resend_verification(self):
        response = self.client.post('/api/auth/resend-verification/', {'email': 'citizen@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_api_verification_status(self):
        response = self.client.get('/api/auth/verification-status/', {'email': 'citizen@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['is_verified'])
