from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, F
from .models import (
    Complaint,
    ComplaintStatus,
    ComplaintTimeline,
    ComplaintImage,
    OfficerAssignment,
    ComplaintEvidence,
    EscalationHistory,
    OfficerPerformance,
    Department
)

class OfficerWorkflowService:
    @staticmethod
    @transaction.atomic
    def accept_assignment(complaint: Complaint, officer) -> OfficerAssignment:
        """
        Accepts a complaint assignment and registers timeline updates.
        """
        status_accepted, _ = ComplaintStatus.objects.get_or_create(
            status="Accepted",
            defaults={"sequence": 4, "color": "#06b6d4"}
        )

        if complaint.status == status_accepted:
            assignment = OfficerAssignment.objects.filter(complaint=complaint, officer=officer).first()
            if assignment:
                return assignment
        complaint.status = status_accepted
        complaint.save()

        # Update assignment
        assignment, _ = OfficerAssignment.objects.update_or_create(
            complaint=complaint,
            officer=officer,
            defaults={"status": "Accepted"}
        )

        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name="Accepted",
            notes="Assignment accepted by resolving officer.",
            performed_by=officer
        )

        return assignment

    @staticmethod
    @transaction.atomic
    def update_officer_status(complaint: Complaint, status_name: str, notes: str, officer) -> Complaint:
        """
        Handles transition flows: Travelling, Arrived, In Progress, Resolved.
        """
        status_obj = ComplaintStatus.objects.get(status=status_name)
        
        if complaint.status == status_obj:
            return complaint

        complaint.status = status_obj
        
        # Track timing
        if status_name == "Resolved":
            complaint.resolved_at = timezone.now()
        complaint.save()

        # Sync assignment status
        OfficerAssignment.objects.filter(complaint=complaint, officer=officer).update(
            status=status_name,
            resolved_at=timezone.now() if status_name == "Resolved" else None
        )

        # Write timeline log
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name=status_name,
            notes=notes or f"Workflow updated to {status_name}.",
            performed_by=officer
        )

        # Trigger performance score recalculation on resolution
        if status_name == "Resolved":
            OfficerWorkflowService.recalculate_performance(officer)

        return complaint

    @staticmethod
    @transaction.atomic
    def upload_evidence(complaint: Complaint, image_url: str, evidence_type: str, officer) -> ComplaintEvidence:
        """
        Logs work evidence. If 'After' type, automatically registers to ComplaintImage.
        """
        evidence = ComplaintEvidence.objects.create(
            complaint=complaint,
            image_url=image_url,
            evidence_type=evidence_type,
            uploaded_by=officer
        )

        if evidence_type == "After":
            ComplaintImage.objects.create(
                complaint=complaint,
                image_url=image_url,
                is_resolution=True
            )

        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name=complaint.status.status,
            notes=f"Uploaded {evidence_type} work evidence proof.",
            performed_by=officer
        )

        return evidence

    @staticmethod
    @transaction.atomic
    def escalate_complaint(complaint: Complaint, reason: str, new_dept_id: str, officer) -> EscalationHistory:
        """
        Escalates complaint and routes to another department.
        """
        new_dept = Department.objects.get(id=new_dept_id)
        prev_dept = complaint.department

        # Log Escalation
        escalation = EscalationHistory.objects.create(
            complaint=complaint,
            escalated_by=officer,
            previous_department=prev_dept,
            new_department=new_dept,
            reason=reason
        )

        # Update Complaint Routing & Status
        status_escalated, _ = ComplaintStatus.objects.get_or_create(
            status="Escalated",
            defaults={"sequence": 7, "color": "#ef4444"}
        )
        
        complaint.department = new_dept
        complaint.status = status_escalated
        complaint.save()

        # Update assignment state
        OfficerAssignment.objects.filter(complaint=complaint, officer=officer).update(status="Escalated")

        # Write timeline logs
        ComplaintTimeline.objects.create(
            complaint=complaint,
            status_name="Escalated",
            notes=f"Escalated from {prev_dept.department_name} to {new_dept.department_name}. Reason: {reason}",
            performed_by=officer
        )

        return escalation

    @staticmethod
    def recalculate_performance(officer):
        """
        Calculates avg resolution times and ratings, and builds an aggregate 0-100 performance score.
        """
        # Get resolved assignments
        resolved = OfficerAssignment.objects.filter(officer=officer, status="Resolved").select_related('complaint')
        completed_count = resolved.count()

        if completed_count == 0:
            return

        total_hours = 0.0
        for item in resolved:
            duration = item.resolved_at - item.assigned_at
            total_hours += duration.total_seconds() / 3600.0
        avg_res_time = total_hours / completed_count

        # Get feedback ratings
        feedbacks = resolved.filter(complaint__feedback__isnull=False)
        feedback_count = feedbacks.count()
        rating_avg = 5.0
        if feedback_count > 0:
            rating_avg = sum([item.complaint.feedback.rating for item in feedbacks]) / feedback_count

        # Compute composite Score out of 100
        # Formula weights: 60% completion rate/latency (speed), 40% citizen rating
        speed_score = max(0, 100 - (avg_res_time * 2)) # penalize longer hours
        rating_score = (rating_avg / 5.0) * 100
        composite_score = (speed_score * 0.6) + (rating_score * 0.4)

        OfficerPerformance.objects.update_or_create(
            officer=officer,
            defaults={
                "completed_complaints": completed_count,
                "average_resolution_time": avg_res_time,
                "rating_average": rating_avg,
                "performance_score": min(100.0, max(0.0, composite_score))
            }
        )
