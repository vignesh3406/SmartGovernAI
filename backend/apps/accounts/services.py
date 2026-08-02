from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from .models import User, Role

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashes a plain-text password.
        """
        return make_password(password)

    @staticmethod
    def validate_password(password: str, hashed_password: str) -> bool:
        """
        Checks if a plain password matches the hash.
        """
        return check_password(password, hashed_password)

    @staticmethod
    def generate_username_if_needed(email: str) -> str:
        """
        Generates username if needed (simply returns normalized email prefix or email).
        """
        return email.split('@')[0]

    @staticmethod
    @transaction.atomic
    def create_user(email: str, full_name: str, password: str = None, phone: str = None, **extra_fields) -> User:
        """
        Creates a regular citizen user.
        """
        citizen_role, _ = Role.objects.get_or_create(role_name='citizen')
        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role=citizen_role,
            phone=phone,
            **extra_fields
        )
        return user

    @staticmethod
    @transaction.atomic
    def create_officer(email: str, full_name: str, password: str = None, phone: str = None, **extra_fields) -> User:
        """
        Creates an officer user.
        """
        officer_role, _ = Role.objects.get_or_create(role_name='officer')
        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role=officer_role,
            phone=phone,
            **extra_fields
        )
        return user

    @staticmethod
    @transaction.atomic
    def create_admin(email: str, full_name: str, password: str = None, phone: str = None, **extra_fields) -> User:
        """
        Creates an admin user.
        """
        admin_role, _ = Role.objects.get_or_create(role_name='admin')
        user = User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role=admin_role,
            phone=phone,
            is_staff=True,
            **extra_fields
        )
        return user
