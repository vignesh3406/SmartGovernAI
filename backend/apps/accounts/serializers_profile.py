from rest_framework import serializers
from .models import User, UserProfile

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    profile_picture_url = serializers.URLField(source='user.profile_picture_url', read_only=True)
    role = serializers.CharField(source='user.role.role_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'full_name', 
            'email', 
            'phone', 
            'role', 
            'profile_picture_url',
            'address', 
            'city', 
            'state', 
            'country', 
            'postal_code', 
            'bio', 
            'date_of_birth', 
            'gender', 
            'timezone', 
            'language', 
            'created_at', 
            'updated_at'
        ]

class ProfileUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(max_length=20, required=False, allow_blank=True)
    timezone = serializers.CharField(max_length=50, required=False)
    language = serializers.CharField(max_length=10, required=False)

class AvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField(required=True, help_text="Avatar image file (PNG, JPEG, GIF under 2MB)")
