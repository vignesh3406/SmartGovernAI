import secrets
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from .models import EmailVerificationToken
from .emails import VerificationEmailSender

User = get_user_model()

class EmailVerificationService:
    @staticmethod
    def generate_token(user) -> str:
        """
        Generates a secure verification token and registers it in the DB.
        """
        token_str = secrets.token_urlsafe(32)
        expiry = timezone.now() + timedelta(hours=24)
        
        # Invalidate old tokens for this user first
        EmailVerificationService.invalidate_old_tokens(user)
        
        # Create new token
        EmailVerificationToken.objects.create(
            user=user,
            token=token_str,
            expires_at=expiry
        )
        return token_str

    @staticmethod
    def invalidate_old_tokens(user):
        """
        Marks all active/unused tokens for the user as used/invalidated.
        """
        EmailVerificationToken.objects.filter(user=user, is_used=False).update(is_used=True)

    @staticmethod
    def send_verification_email(user) -> bool:
        """
        Generates a token and dispatches the verification email.
        """
        token_str = EmailVerificationService.generate_token(user)
        return VerificationEmailSender.send_verification_email(user, token_str)

    @staticmethod
    @transaction.atomic
    def verify_token(token_str: str) -> tuple[bool, str]:
        """
        Verifies the given token string.
        Returns (success: bool, message: str)
        """
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except ObjectDoesNotExist:
            return False, "Invalid token"

        if token_obj.is_used:
            return False, "This verification link has already been used"

        if token_obj.expires_at < timezone.now():
            return False, "This verification link has expired"

        # Valid token: Mark email verified and activate user
        user = token_obj.user
        if user.is_verified:
            return False, "Email is already verified"

        user.is_verified = True
        user.is_active = True
        user.save()

        # Mark token as used
        token_obj.is_used = True
        token_obj.save()

        # Invalidate all other tokens for this user
        EmailVerificationService.invalidate_old_tokens(user)

        return True, "Email successfully verified and account activated"

    @staticmethod
    def resend_verification(email: str) -> tuple[bool, str]:
        """
        Resends email verification if the user exists and is not verified.
        """
        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return False, "No account associated with this email address"

        if user.is_verified:
            return False, "This email address is already verified"

        success = EmailVerificationService.send_verification_email(user)
        if success:
            return True, "Verification email resent successfully"
        return False, "Failed to send verification email. Please try again later."
