from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from .models import Role, UserProfile
from .serializers import RoleSerializer, UserSerializer, UserProfileSerializer
from .permissions import IsCitizen, IsOfficer, IsAdmin, IsAuthenticatedUser

User = get_user_model()

class IdentityModelTests(TestCase):
    def setUp(self):
        self.citizen_role = Role.objects.create(role_name='citizen', description='Citizen role')
        self.officer_role = Role.objects.create(role_name='officer', description='Officer role')
        self.admin_role = Role.objects.create(role_name='admin', description='Admin role')

    def test_role_creation(self):
        self.assertEqual(self.citizen_role.role_name, 'citizen')
        self.assertTrue(self.citizen_role.is_active)

    def test_user_creation_auto_profile(self):
        user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='Password123!',
            role=self.citizen_role
        )
        self.assertEqual(user.email, 'test@example.com')
        # Check signal auto-created profile
        self.assertTrue(UserProfile.objects.filter(user=user).exists())
        self.assertEqual(user.profile.country, 'India')

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            full_name='Admin User',
            password='AdminPassword123!'
        )
        self.assertEqual(admin.role.role_name, 'admin')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)


class SerializerTests(TestCase):
    def setUp(self):
        self.role = Role.objects.create(role_name='citizen', description='Citizen role')
        self.user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='Password123!',
            role=self.role
        )

    def test_role_serializer(self):
        serializer = RoleSerializer(self.role)
        self.assertEqual(serializer.data['role_name'], 'citizen')

    def test_profile_serializer(self):
        serializer = UserProfileSerializer(self.user.profile)
        self.assertEqual(serializer.data['country'], 'India')

    def test_user_serializer(self):
        serializer = UserSerializer(self.user)
        self.assertEqual(serializer.data['email'], 'test@example.com')
        self.assertEqual(serializer.data['role']['role_name'], 'citizen')


class PermissionTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.citizen_role = Role.objects.create(role_name='citizen')
        self.officer_role = Role.objects.create(role_name='officer')
        self.admin_role = Role.objects.create(role_name='admin')

        self.citizen_user = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen User', role=self.citizen_role
        )
        self.officer_user = User.objects.create_user(
            email='officer@example.com', full_name='Officer User', role=self.officer_role
        )
        self.admin_user = User.objects.create_user(
            email='admin@example.com', full_name='Admin User', role=self.admin_role
        )

    def test_citizen_permission(self):
        perm = IsCitizen()
        request = self.factory.get('/dummy/')
        
        request.user = self.citizen_user
        self.assertTrue(perm.has_permission(request, None))
        
        request.user = self.officer_user
        self.assertFalse(perm.has_permission(request, None))

    def test_officer_permission(self):
        perm = IsOfficer()
        request = self.factory.get('/dummy/')
        
        request.user = self.officer_user
        self.assertTrue(perm.has_permission(request, None))
        
        request.user = self.citizen_user
        self.assertFalse(perm.has_permission(request, None))

    def test_admin_permission(self):
        perm = IsAdmin()
        request = self.factory.get('/dummy/')
        
        request.user = self.admin_user
        self.assertTrue(perm.has_permission(request, None))
        
        request.user = self.citizen_user
        self.assertFalse(perm.has_permission(request, None))

    def test_owner_permission(self):
        from .permissions import IsOwner
        class MockObj:
            def __init__(self, user):
                self.user = user

        perm = IsOwner()
        request = self.factory.get('/dummy/')
        request.user = self.citizen_user

        # Citizen owns the object
        obj_owned = MockObj(self.citizen_user)
        self.assertTrue(perm.has_object_permission(request, None, obj_owned))

        # Citizen does not own the object
        obj_not_owned = MockObj(self.officer_user)
        self.assertFalse(perm.has_object_permission(request, None, obj_not_owned))

