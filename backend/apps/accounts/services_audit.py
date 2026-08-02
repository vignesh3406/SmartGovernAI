from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()

class AuditLogService:
    @staticmethod
    def log_action(user, action: str, request=None) -> AuditLog:
        """
        Extracts client details and logs a user action.
        """
        ip_address = None
        user_agent = None

        if request:
            # Extract IP Address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            
            # Extract User Agent
            user_agent = request.META.get('HTTP_USER_AGENT')

        # Check if user is anonymous (e.g. during failed login attempt)
        log_user = user if isinstance(user, User) and user.is_authenticated else None

        return AuditLog.objects.create(
            user=log_user,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent
        )
