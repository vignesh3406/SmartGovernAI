from django.contrib.auth import get_user_model
from .models import AuditLog

User = get_user_model()

class AuditLogService:
    @staticmethod
    def log_action(user, action: str, request=None) -> AuditLog:
        """
        Extracts client details and logs a user action safely.
        """
        try:
            ip_address = None
            user_agent = None

            if request:
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0].strip()
                else:
                    ip = request.META.get('REMOTE_ADDR')
                
                if ip and ':' in ip and '.' in ip:
                    ip = ip.split(':')[0]
                ip_address = ip
                user_agent = request.META.get('HTTP_USER_AGENT')

            log_user = user if (user and getattr(user, 'is_authenticated', False)) else None

            return AuditLog.objects.create(
                user=log_user,
                action=action,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception:
            return None
