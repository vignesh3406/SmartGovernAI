from rest_framework import serializers
from .models import User, Role, UserProfile

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role_name', 'description', 'is_active', 'created_at', 'updated_at']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
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

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'full_name', 
            'email', 
            'phone', 
            'profile_picture_url', 
            'is_verified', 
            'is_active', 
            'role', 
            'profile', 
            'created_at', 
            'updated_at'
        ]
