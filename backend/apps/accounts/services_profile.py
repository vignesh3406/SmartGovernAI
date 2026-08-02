import uuid
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.common.services import StorageService
from .models import UserProfile

User = get_user_model()

class ProfileService:
    @staticmethod
    def get_profile(user) -> UserProfile:
        """
        Retrieves the profile of the user (creates one if missing).
        """
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    @staticmethod
    @transaction.atomic
    def update_profile(user, data: dict) -> UserProfile:
        """
        Updates profile data and user model's full_name/phone if provided.
        """
        profile = ProfileService.get_profile(user)

        # Update User model fields if they are in data
        user_updated = False
        if 'full_name' in data:
            user.full_name = data['full_name']
            user_updated = True
        if 'phone' in data:
            user.phone = data['phone']
            user_updated = True
        if user_updated:
            user.save()

        # Update profile fields
        profile_fields = [
            'address', 'city', 'state', 'country', 
            'postal_code', 'bio', 'date_of_birth', 
            'gender', 'timezone', 'language'
        ]
        
        for field in profile_fields:
            if field in data:
                setattr(profile, field, data[field])
                
        profile.save()
        return profile

    @staticmethod
    @transaction.atomic
    def upload_avatar(user, file) -> str:
        """
        Uploads a new avatar, deletes the old one if exists, and updates user profile picture URL.
        """
        # Validate format
        content_type = file.content_type
        if content_type not in ['image/jpeg', 'image/png', 'image/gif']:
            raise ValueError("Unsupported image format. Allowed formats: PNG, JPEG, GIF.")

        # Validate size (Max 2MB)
        if file.size > 2 * 1024 * 1024:
            raise ValueError("File size exceeds maximum limit of 2MB.")

        # If user already has an avatar, delete it first
        if user.profile_picture_url:
            try:
                # Extract file name from URL
                old_file_name = user.profile_picture_url.split('/')[-1]
                StorageService.delete_file(old_file_name)
            except Exception:
                pass  # Ignore delete failures of old file

        # Generate unique file name
        ext = file.name.split('.')[-1]
        file_name = f"avatar_{user.id}_{uuid.uuid4().hex}.{ext}"

        # Upload
        public_url = StorageService.upload_file(file_name, file.read(), content_type)

        # Update user
        user.profile_picture_url = public_url
        user.save()

        return public_url

    @staticmethod
    @transaction.atomic
    def delete_avatar(user):
        """
        Deletes the avatar image from storage and removes the URL reference.
        """
        if user.profile_picture_url:
            try:
                old_file_name = user.profile_picture_url.split('/')[-1]
                StorageService.delete_file(old_file_name)
            except Exception:
                pass

            user.profile_picture_url = None
            user.save()
