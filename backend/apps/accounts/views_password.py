from rest_framework import status, permissions
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .serializers_password import ForgotPasswordSerializer, ResetPasswordSerializer, ChangePasswordSerializer
from .services_password import PasswordService
from .services_audit import AuditLogService
from .models import PasswordResetToken
from django.contrib.auth import get_user_model

User = get_user_model()

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Request Password Reset Link",
        request=ForgotPasswordSerializer,
        responses={200: ForgotPasswordSerializer}
    )
    def post(self, request):
        """
        Submits request to generate and email a reset password link.
        """
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        # Process and send (returns True always for security)
        PasswordService.forgot_password(email)

        # Audit log (find user if exists)
        try:
            user = User.objects.get(email=email)
            AuditLogService.log_action(user, "Password Reset Requested", request)
        except User.DoesNotExist:
            AuditLogService.log_action(None, f"Password Reset Requested for non-existent: {email}", request)
        
        return APIResponse(
            message="If an account exists with that email, a password reset link has been sent.",
            success=True
        )

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Reset Password with Token",
        request=ResetPasswordSerializer,
        responses={200: ResetPasswordSerializer}
    )
    def post(self, request):
        """
        Resets user password using the verification reset token.
        """
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        success, message = PasswordService.reset_password(token, new_password)
        if success:
            try:
                t_obj = PasswordResetToken.objects.select_related('user').get(token=token)
                AuditLogService.log_action(t_obj.user, "Password Reset Succeeded", request)
            except Exception:
                pass
            return APIResponse(message=message, success=True)
            
        try:
            t_obj = PasswordResetToken.objects.select_related('user').get(token=token)
            AuditLogService.log_action(t_obj.user, "Password Reset Failed", request)
        except Exception:
            AuditLogService.log_action(None, "Password Reset Failed (Invalid Token)", request)
            
        return APIResponse(message=message, success=False, status_code=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Change Password",
        request=ChangePasswordSerializer,
        responses={200: ChangePasswordSerializer}
    )
    def put(self, request):
        """
        Update user password after validating current password.
        """
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        current_pwd = serializer.validated_data['current_password']
        new_pwd = serializer.validated_data['new_password']

        success, message = PasswordService.change_password(request.user, current_pwd, new_pwd)
        if success:
            AuditLogService.log_action(request.user, "Password Change Succeeded", request)
            return APIResponse(message=message, success=True)
            
        AuditLogService.log_action(request.user, "Password Change Failed", request)
        return APIResponse(message=message, success=False, status_code=status.HTTP_400_BAD_REQUEST)
