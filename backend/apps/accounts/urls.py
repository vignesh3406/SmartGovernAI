from django.urls import path
from .views_auth import RegisterView, LoginView
from .views_verification import VerifyEmailView, ResendVerificationView, VerificationStatusView
from .views_profile import ProfileView, AvatarUploadView
from .views_password import ForgotPasswordView, ResetPasswordView, ChangePasswordView

urlpatterns = [
    # Auth registration & login endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),

    # Verification endpoints
    path('auth/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('auth/resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('auth/verification-status/', VerificationStatusView.as_view(), name='verification-status'),

    # Profile endpoints
    path('auth/profile/', ProfileView.as_view(), name='profile-detail'),
    path('profile/', ProfileView.as_view(), name='profile-detail-alt'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='profile-avatar'),

    # Password endpoints
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
]
