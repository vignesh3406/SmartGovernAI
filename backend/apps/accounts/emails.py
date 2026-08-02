import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)

class VerificationEmailSender:
    @staticmethod
    def send_verification_email(user, token_str: str) -> bool:
        """
        Builds and sends verification HTML email using Django mail framework.
        """
        # Frontend URL for email verification routing
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        verification_url = f"{frontend_url}/verify-email/{token_str}"

        context = {
            'full_name': user.full_name,
            'verification_url': verification_url,
        }

        try:
            html_content = render_to_string('emails/verification_email.html', context)
            text_content = strip_tags(html_content)

            subject = "Verify Your Email - SmartGov AI"
            from_email = settings.DEFAULT_FROM_EMAIL

            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[user.email]
            )
            msg.attach_alternative(html_content, "text/html")
            
            logger.info(f"Dispatching verification email to {user.email}")
            msg.send()
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False
