from rest_framework import serializers

class VerificationSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, help_text="Email verification token string")

class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, help_text="Email address to resend verification link")
