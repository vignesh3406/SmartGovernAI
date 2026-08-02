import io
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image
from .models import Role, UserProfile

User = get_user_model()

class ProfileAPITests(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen')
        self.user = User.objects.create_user(
            email='citizen@example.com',
            full_name='Citizen User',
            password='Password123!',
            role=self.role
        )
        self.client.force_authenticate(user=self.user)

    def generate_test_image(self):
        file = io.BytesIO()
        image = Image.new('RGBA', size=(100, 100), color=(155, 0, 0))
        image.save(file, 'png')
        file.name = 'test_avatar.png'
        file.seek(0)
        return file

    def test_get_profile(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['full_name'], 'Citizen User')
        self.assertEqual(response.data['data']['country'], 'India')

    def test_update_profile(self):
        update_data = {
            'full_name': 'Updated Name',
            'phone': '9876543210',
            'city': 'Hyderabad',
            'state': 'Telangana',
            'country': 'India',
            'postal_code': '500001',
            'bio': 'My Profile Bio',
            'language': 'te'
        }
        response = self.client.put('/api/profile/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['full_name'], 'Updated Name')
        self.assertEqual(response.data['data']['city'], 'Hyderabad')
        self.assertEqual(response.data['data']['language'], 'te')

        # Verify db changes
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Updated Name')
        self.assertEqual(self.user.phone, '9876543210')

    def test_avatar_upload_and_delete(self):
        # Generate dummy image file
        image_file = self.generate_test_image()

        response = self.client.patch('/api/profile/avatar/', {'avatar': image_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['profile_picture_url'])

        # Delete avatar
        delete_response = self.client.delete('/api/profile/avatar/')
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)
        self.assertIsNone(delete_response.data['data']['profile_picture_url'])
