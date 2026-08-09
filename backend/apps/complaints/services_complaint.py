import random
from datetime import datetime
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from .models import (
    Complaint,
    ComplaintImage,
    ComplaintTimeline,
    ComplaintFeedback,
    Department,
    ComplaintCategory,
    ComplaintStatus,
    Priority,
    Severity
)
from .services_ai import AIService

class ComplaintService:
    @staticmethod
    def _generate_complaint_number() -> str:
        """
        Generates a unique complaint number in the format COMP-YYYYMMDD-XXXX
        """
        date_str = datetime.now().strftime("%Y%m%d")
        rand_num = random.randint(1000, 9999)
        return f"COMP-{date_str}-{rand_num}"

    @staticmethod
    @transaction.atomic
    def create_complaint(citizen, data: dict, image_urls: list = None) -> Complaint:
        """
        Creates a new complaint, triggers AI analysis, updates initial status and logs timeline.
        """
        title = data.get('title')
        description = data.get('description')
        category_id = data.get('category')
        
        # Get category object
        category = ComplaintCategory.objects.get(id=category_id)
        
        # Get default pending status
        status_pending, _ = ComplaintStatus.objects.get_or_create(
            status="Pending",
            defaults={"sequence": 1, "color": "#64748b"}
        )

        # 1. Trigger AI analysis
        ai_analysis = AIService.analyze_complaint(title, description)
        
        # Map AI fields to actual database relations
        dept_name = ai_analysis.get("department")
        priority_name = ai_analysis.get("priority")
        severity_name = ai_analysis.get("severity")
        
        # Find or use default relations
        dept, _ = Department.objects.get_or_create(
            department_name=dept_name,
            defaults={"description": f"AI recommended department: {dept_name}"}
        )
        
        prio, _ = Priority.objects.get_or_create(
            priority=priority_name,
            defaults={"color": "#3b82f6", "weight": 2}
        )
        
        sev, _ = Severity.objects.get_or_create(
            severity=severity_name,
            defaults={"weight": 2}
        )

        # 2. Create Complaint
        complaint = Complaint.objects.create(
            complaint_number=ComplaintService._generate_complaint_number(),
            citizen=citizen,
            category=category,
            department=dept,
            title=title,
            description=description,
            priority=prio,
            severity=sev,
            status=status_pending,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            address=data.get('address'),
            ai_summary=ai_analysis.get("summary"),
            ai_category=ai_analysis.get("category"),
            ai_confidence=ai_analysis.get("confidence")
        )

        # 3. Add Images
        if image_urls:
            for url in image_urls:
                ComplaintImage.objects.create(
                    complaint=complaint,
                    image_url=url,
                    is_resolution=False
                )

        # Trigger Phase 3 AI Engine Analysis
        try:
            from .services_ai_engine import AIEngineService
            AIEngineService.run_complaint_analysis(complaint)
        except Exception:
            pass

        # 4. Auto-assign to an available officer
        from django.contrib.auth import get_user_model
        User = get_user_model()

        target_email = "municipality@example.com" # default fallback
        if dept_name:
            dept_lower = dept_name.lower()
            if "road" in dept_lower:
                target_email = "road@example.com"
            elif "water" in dept_lower:
                target_email = "water@example.com"
            elif "electric" in dept_lower:
                target_email = "electricity@example.com"
            elif "sanitation" in dept_lower:
                target_email = "sanitation@example.com"
            elif "traffic" in dept_lower:
                target_email = "traffic@example.com"
                
        assigned_officer = User.objects.filter(email=target_email, is_active=True).first()
        if not assigned_officer:
            # Fallback to any active officer
            assigned_officer = User.objects.filter(role__role_name='officer', is_active=True).first()
        
        if assigned_officer:
            from .models import OfficerAssignment
            OfficerAssignment.objects.create(
                complaint=complaint,
                officer=assigned_officer,
                status="Assigned"
            )
            # Log assignment timeline activity
            ComplaintTimeline.objects.create(
                complaint=complaint,
                status_name="Assigned",
                notes=f"Auto-assigned to {assigned_officer.full_name}.",
                performed_by=citizen
            )

        # 5. Log timeline activity for submission
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name="Submitted",
            notes="Complaint submitted successfully by Citizen.",
            performed_by=citizen
        )

        # 6. Dispatch email notification
        ComplaintService.dispatch_status_email(complaint, "Submitted")

        return complaint

    @staticmethod
    @transaction.atomic
    def update_status(complaint: Complaint, status_name: str, notes: str, performed_by) -> Complaint:
        """
        Updates complaint status, creates timeline logs and dispatches emails.
        """
        status_obj = ComplaintStatus.objects.get(status=status_name)
        complaint.status = status_obj
        
        if status_name == "Resolved":
            complaint.resolved_at = timezone.now()
            
        complaint.save()

        # Log timeline activity
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name=status_name,
            notes=notes,
            performed_by=performed_by
        )

        # Dispatch email notification
        ComplaintService.dispatch_status_email(complaint, status_name)

        return complaint

    @staticmethod
    @transaction.atomic
    def submit_feedback(complaint: Complaint, rating: int, comment: str) -> ComplaintFeedback:
        """
        Submits feedback for a resolved complaint and automatically closes it.
        """
        feedback = ComplaintFeedback.objects.create(
            complaint=complaint,
            rating=rating,
            comment=comment
        )
        
        # Advance status to Closed
        closed_status, _ = ComplaintStatus.objects.get_or_create(
            status="Closed",
            defaults={"sequence": 8, "color": "#0f172a"}
        )
        complaint.status = closed_status
        complaint.save()

        # Log timeline activity
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name="Closed",
            notes=f"Feedback submitted: {rating} Stars. Closed by citizen feedback.",
            performed_by=complaint.citizen
        )

        return feedback

    @staticmethod
    def dispatch_status_email(complaint: Complaint, status_name: str):
        """
        Sends email alert on status changes.
        """
        subject = f"SmartGov AI: Complaint {complaint.complaint_number} Updated to {status_name}"
        message = f"""
        Hello {complaint.citizen.full_name},

        Your complaint with ID {complaint.complaint_number} has been updated.
        New Status: {status_name}
        Title: {complaint.title}
        
        You can check the timeline and progress from your dashboard.

        Sincerely,
        SmartGov AI Support Team
        """
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [complaint.citizen.email],
                fail_silently=True
            )
        except Exception:
            pass
        
        # Log to audit security log file
        logger_name = "Security"
        import logging
        logging.getLogger(logger_name).info(f"Notification Sent: {complaint.complaint_number} status changed to {status_name} for user {complaint.citizen.email}")
