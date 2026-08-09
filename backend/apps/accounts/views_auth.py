from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema
from django.contrib.auth import authenticate, get_user_model
from apps.common.responses import APIResponse
from .services import AuthService
from .services_verification import EmailVerificationService
from .services_audit import AuditLogService
from .serializers import UserSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Register a new citizen account")
    def post(self, request):
        try:
            raw_email = request.data.get('email') or ''
            raw_name = request.data.get('full_name') or ''
            raw_pass = request.data.get('password') or ''
            raw_phone = request.data.get('phone') or ''
            raw_role = request.data.get('role') or 'citizen'

            email = str(raw_email).strip().lower()
            full_name = str(raw_name).strip()
            password = str(raw_pass)
            phone = str(raw_phone).strip() or None
            role = str(raw_role).strip().lower()

            # Basic validation
            if not email or not full_name or not password:
                return APIResponse(
                    message="email, full_name and password are required.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if len(password) < 8:
                return APIResponse(
                    message="Password must be at least 8 characters.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                return APIResponse(
                    message="An account with this email already exists.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            if role == 'admin':
                user = AuthService.create_admin(
                    email=email,
                    full_name=full_name,
                    password=password,
                    phone=phone
                )
            elif role == 'officer':
                user = AuthService.create_officer(
                    email=email,
                    full_name=full_name,
                    password=password,
                    phone=phone
                )
            else:
                user = AuthService.create_user(
                    email=email,
                    full_name=full_name,
                    password=password,
                    phone=phone
                )

            # Dispatch verification email safely
            try:
                EmailVerificationService.send_verification_email(user)
            except Exception as email_err:
                pass

            AuditLogService.log_action(user, "User Registration", request)

            return APIResponse(
                data={"email": user.email},
                message="Account created successfully. Please verify your email to continue.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return APIResponse(
                message=f"Registration failed: {str(e)}",
                success=False,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(summary="Login and obtain JWT tokens")
    def post(self, request):
        try:
            raw_email = request.data.get('email') or ''
            raw_pass = request.data.get('password') or ''
            email = str(raw_email).strip().lower()
            password = str(raw_pass)

            if not email or not password:
                return APIResponse(
                    message="Email and password are required.",
                    success=False,
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            user = authenticate(request, username=email, password=password)

            if not user:
                AuditLogService.log_action(None, f"Failed login attempt for {email}", request)
                return APIResponse(
                    message="Invalid email or password.",
                    success=False,
                    status_code=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                return APIResponse(
                    message="Your account has been suspended. Please contact support.",
                    success=False,
                    status_code=status.HTTP_403_FORBIDDEN
                )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            AuditLogService.log_action(user, "User Login", request)

            return APIResponse(
                data={
                    "user": UserSerializer(user).data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                message=f"Welcome back, {user.full_name}!"
            )
        except Exception as e:
            return APIResponse(
                message=f"Login failed: {str(e)}",
                success=False,
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
