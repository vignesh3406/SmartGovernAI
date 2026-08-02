from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .serializers_verification import VerificationSerializer, ResendVerificationSerializer
from .services_verification import EmailVerificationService
from .services_audit import AuditLogService
from .models import EmailVerificationToken
from django.contrib.auth import get_user_model

User = get_user_model()

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Verify User Email",
        responses={200: VerificationSerializer}
    )
    def get(self, request, token):
        """
        Verify user email using the verification token.
        """
        success, message = EmailVerificationService.verify_token(token)
        if success:
            try:
                t_obj = EmailVerificationToken.objects.select_related('user').get(token=token)
                AuditLogService.log_action(t_obj.user, "Email Verification Succeeded", request)
            except Exception:
                pass
            return APIResponse(message=message, success=True, status_code=status.HTTP_200_OK)
        
        # Log failure attempt
        try:
            t_obj = EmailVerificationToken.objects.select_related('user').get(token=token)
            AuditLogService.log_action(t_obj.user, "Email Verification Failed", request)
        except Exception:
            AuditLogService.log_action(None, f"Email Verification Failed (Token: {token})", request)
            
        return APIResponse(message=message, success=False, status_code=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Resend Verification Email",
        request=ResendVerificationSerializer,
        responses={200: ResendVerificationSerializer}
    )
    def post(self, request):
        """
        Resend email verification token.
        """
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        success, message = EmailVerificationService.resend_verification(email)
        if success:
            try:
                user = User.objects.get(email=email)
                AuditLogService.log_action(user, "Verification Resend Succeeded", request)
            except Exception:
                pass
            return APIResponse(message=message, success=True, status_code=status.HTTP_200_OK)
            
        try:
            user = User.objects.get(email=email)
            AuditLogService.log_action(user, "Verification Resend Failed", request)
        except Exception:
            AuditLogService.log_action(None, f"Verification Resend Failed (Email: {email})", request)
            
        return APIResponse(message=message, success=False, status_code=status.HTTP_400_BAD_REQUEST)

class VerificationStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        summary="Check Verification Status",
        parameters=[
            {'name': 'email', 'type': str, 'required': True, 'location': 'query', 'description': 'User email'}
        ]
    )
    def get(self, request):
        """
        Check whether an email is verified.
        """
        email = request.query_params.get('email')
        if not email:
            return APIResponse(message="Email query parameter is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            data = {
                "email": user.email,
                "is_verified": user.is_verified,
                "is_active": user.is_active
            }
            return APIResponse(data=data, message="Status fetched successfully", success=True)
        except User.DoesNotExist:
            return APIResponse(message="User not found", success=False, status_code=status.HTTP_404_NOT_FOUND)
