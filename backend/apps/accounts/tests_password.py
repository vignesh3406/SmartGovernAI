from datetime import timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import Role, PasswordResetToken
from .services_password import PasswordService

User = get_user_model()

class PasswordServiceTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            password='CurrentPassword123!',
            role=self.role
        )

    def test_validate_strength(self):
        # Valid
        PasswordService.validate_strength("ValidPwd123!")

        # Too short
        with self.assertRaises(ValidationError):
            PasswordService.validate_strength("Pwd1!")

        # No uppercase
        with self.assertRaises(ValidationError):
            PasswordService.validate_strength("pwd12345!")

        # No special
        with self.assertRaises(ValidationError):
            PasswordService.validate_strength("Pwd123456")

    def test_forgot_password_generic_return(self):
        # Existing email
        self.assertTrue(PasswordService.forgot_password('citizen@example.com'))
        # Non-existing email (returns True for safety)
        self.assertTrue(PasswordService.forgot_password('missing@example.com'))

    def test_reset_password_flow(self):
        token_str = PasswordService.generate_reset_token(self.user)
        
        success, message = PasswordService.reset_password(token_str, "NewPassword123!")
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))

    def test_change_password_flow(self):
        success, message = PasswordService.change_password(
            self.user, "CurrentPassword123!", "NewPassword123!"
        )
        self.assertTrue(success)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))

        # Same password reject
        success, message = PasswordService.change_password(
            self.user, "NewPassword123!", "NewPassword123!"
        )
        self.assertFalse(success)


class PasswordAPITests(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            password='CurrentPassword123!',
            role=self.role
        )

    def test_api_forgot_password(self):
        response = self.client.post('/api/auth/forgot-password/', {'email': 'citizen@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_reset_password(self):
        token_str = PasswordService.generate_reset_token(self.user)
        response = self.client.post('/api/auth/reset-password/', {
            'token': token_str,
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_api_change_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put('/api/auth/change-password/', {
            'current_password': 'CurrentPassword123!',
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
