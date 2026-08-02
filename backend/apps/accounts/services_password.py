import secrets
import re
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import PasswordResetToken

User = get_user_model()

class PasswordService:
    @staticmethod
    def validate_strength(password: str) -> None:
        """
        Validates password strength based on required complexity rules.
        """
        if len(password) < 8 or len(password) > 64:
            raise ValidationError("Password must be between 8 and 64 characters.")
        if not re.search(r"[A-Z]", password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r"[a-z]", password):
            raise ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r"[0-9]", password):
            raise ValidationError("Password must contain at least one number.")
        if not re.search(r"[^A-Za-z0-9]", password):
            raise ValidationError("Password must contain at least one special character.")

    @staticmethod
    def generate_reset_token(user) -> str:
        """
        Generates a secure password reset token and saves it in the DB.
        """
        token_str = secrets.token_urlsafe(32)
        expiry = timezone.now() + timedelta(minutes=30)
        
        # Invalidate old reset tokens
        PasswordService.invalidate_tokens(user)
        
        PasswordResetToken.objects.create(
            user=user,
            token=token_str,
            expires_at=expiry
        )
        return token_str

    @staticmethod
    def invalidate_tokens(user):
        """
        Invalidates active password reset tokens for the user.
        """
        PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

    @staticmethod
    @transaction.atomic
    def forgot_password(email: str) -> bool:
        """
        Processes a forgot password request, sending email if user exists.
        Returns True regardless of user existence to avoid enumeration.
        """
        try:
            user = User.objects.get(email=email)
        except ObjectDoesNotExist:
            return True

        token_str = PasswordService.generate_reset_token(user)
        
        # Build and send email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        reset_url = f"{frontend_url}/reset-password?token={token_str}"

        context = {
            'full_name': user.full_name,
            'reset_url': reset_url,
        }

        try:
            html_content = render_to_string('emails/reset_password_email.html', context)
            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject="Reset Your Password - SmartGov AI",
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        except Exception:
            pass  # Do not block success return if sending fails

        return True

    @staticmethod
    @transaction.atomic
    def reset_password(token_str: str, new_password: str) -> tuple[bool, str]:
        """
        Validates token and resets user password.
        """
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except ObjectDoesNotExist:
            return False, "Invalid token"

        if token_obj.is_used:
            return False, "This password reset link has already been used"

        if token_obj.expires_at < timezone.now():
            return False, "This password reset link has expired"

        # Validate strength
        try:
            PasswordService.validate_strength(new_password)
        except ValidationError as e:
            return False, str(e.detail[0] if hasattr(e, 'detail') else e.message)

        # Update password
        user = token_obj.user
        user.set_password(new_password)
        user.save()

        # Mark token used
        token_obj.is_used = True
        token_obj.save()

        # Invalidate all active refresh tokens for the user
        PasswordService.blacklist_outstanding_tokens(user)

        return True, "Password reset successfully"

    @staticmethod
    @transaction.atomic
    def change_password(user, current_password: str, new_password: str) -> tuple[bool, str]:
        """
        Allows an authenticated user to change password after entering current password.
        """
        if not user.check_password(current_password):
            return False, "Incorrect current password"

        if current_password == new_password:
            return False, "New password cannot be the same as current password"

        try:
            PasswordService.validate_strength(new_password)
        except ValidationError as e:
            return False, str(e.detail[0] if hasattr(e, 'detail') else e.message)

        user.set_password(new_password)
        user.save()

        # Blacklist active refresh tokens
        PasswordService.blacklist_outstanding_tokens(user)

        return True, "Password updated successfully"

    @staticmethod
    def blacklist_outstanding_tokens(user):
        """
        Blacklists all outstanding/active refresh tokens of the user to force logout on all devices.
        """
        try:
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
            outstanding = OutstandingToken.objects.filter(user=user)
            for token in outstanding:
                BlacklistedToken.objects.get_or_create(token=token)
        except Exception:
            pass
