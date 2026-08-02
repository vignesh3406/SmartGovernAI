from rest_framework import serializers

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, help_text="Email address associated with the account")

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, help_text="Secure reset token received in email")
    new_password = serializers.CharField(required=True, min_length=8, max_length=64)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8, max_length=64)
