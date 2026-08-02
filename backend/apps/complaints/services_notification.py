from django.core.mail import send_mail
from django.conf import settings
from .models import Notification, NotificationPreference, Complaint

class NotificationService:
    @staticmethod
    def send_notification(user, notification_type: str, title: str, message: str):
        """
        Creates an in-app Notification record.
        If user preferences allow, dispatches a notification email via SMTP.
        """
        # Fetch or initialize preferences
        pref, _ = NotificationPreference.objects.get_or_create(user=user)

        # 1. Save In-App Log if enabled
        if pref.in_app_notifications:
            Notification.objects.create(
                recipient=user,
                notification_type=notification_type,
                title=title,
                message=message
            )

        # 2. Dispatch Email alert if enabled
        if pref.email_notifications:
            subject = f"[SmartGov AI] {title}"
            email_body = f"""
            Hello {user.full_name},
            
            You have a new update regarding your civic dashboard:
            
            --------------------------------------------------
            {message}
            --------------------------------------------------
            
            Best regards,
            SmartGov AI Team
            """
            try:
                send_mail(
                    subject=subject,
                    message=email_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True
                )
            except Exception:
                pass
                
    @staticmethod
    def notify_workflow_update(complaint: Complaint, status_name: str):
        """
        Triggered when a complaint transitions status.
        Notifies the citizen creator.
        """
        title = f"Grievance status changed to {status_name}"
        message = f"Your grievance ticket COMP-{complaint.complaint_number} ({complaint.title}) status has been updated to '{status_name}'."
        NotificationService.send_notification(complaint.citizen, "Status Update", title, message)
