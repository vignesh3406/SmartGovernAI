from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Role
from .models import Notification, NotificationPreference, Announcement
from .services_notification import NotificationService

User = get_user_model()

class NotificationOperationsTests(APITestCase):
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

    def test_send_in_app_notification(self):
        NotificationService.send_notification(
            user=self.citizen,
            notification_type="System",
            title="Welcome!",
            message="Welcome to SmartGov AI."
        )
        self.assertTrue(Notification.objects.filter(recipient=self.citizen, title="Welcome!").exists())

    def test_get_notifications_api(self):
        self.client.force_authenticate(user=self.citizen)
        Notification.objects.create(
            recipient=self.citizen,
            notification_type="System",
            title="Update",
            message="Dashboard updated."
        )
        resp = self.client.get('/api/notifications/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data['data']), 1)

    def test_update_preferences(self):
        self.client.force_authenticate(user=self.citizen)
        resp = self.client.put('/api/preferences/', {
            "email_notifications": False,
            "in_app_notifications": True
        })
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        pref = NotificationPreference.objects.get(user=self.citizen)
        self.assertFalse(pref.email_notifications)

    def test_admin_broadcast_announcements(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "title": "Main Maintenance Bulletin",
            "content": "Water pipeline shutdown this Sunday.",
            "target_role": "all"
        }
        resp = self.client.post('/api/announcements/', payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(Announcement.objects.filter(title="Main Maintenance Bulletin").exists())
