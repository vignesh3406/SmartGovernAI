from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg, Count
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from apps.accounts.models import AuditLog, Role
from .models import (
    Complaint,
    Department,
    OfficerAssignment,
    OfficerPerformance,
    AIAnalysis
)
from .serializers import ComplaintSerializer
from .serializers_officer import OfficerPerformanceSerializer

User = get_user_model()

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get executive dashboard statistics metrics for Admin Dashboard")
    def get(self, request):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        total_citizens = User.objects.filter(role__role_name='citizen').count()
        total_officers = User.objects.filter(role__role_name='officer').count()
        total_departments = Department.objects.count()
        
        # Complaint states
        complaints = Complaint.objects.all()
        total_complaints = complaints.count()
        pending = complaints.filter(status__status='Pending').count()
        in_progress = complaints.filter(status__status='In Progress').count()
        resolved = complaints.filter(status__status='Resolved').count()
        closed = complaints.filter(status__status='Closed').count()
        escalated = complaints.filter(status__status='Escalated').count()
        critical = complaints.filter(priority__priority='Critical').count()
        
        # Today's complaints
        today = timezone.now().date()
        todays_count = complaints.filter(created_at__date=today).count()

        # AI metrics
        ai_analyzed = AIAnalysis.objects.count()

        # Avg resolution time
        avg_res = OfficerPerformance.objects.aggregate(Avg('average_resolution_time'))['average_resolution_time__avg'] or 0.0

        total_resolved_all = resolved + closed
        resolution_rate = round((total_resolved_all / total_complaints * 100), 1) if total_complaints > 0 else 0.0

        data = {
            "metrics": {
                "total_citizens": total_citizens,
                "total_officers": total_officers,
                "total_departments": total_departments,
                "total_complaints": total_complaints,
                "issues_raised": total_complaints,
                "issues_resolved": total_resolved_all,
                "pending_complaints": pending,
                "in_progress_complaints": in_progress,
                "resolved_complaints": resolved,
                "closed_complaints": closed,
                "escalated_complaints": escalated,
                "critical_complaints": critical,
                "todays_complaints": todays_count,
                "ai_analysis_completed": ai_analyzed,
                "average_resolution_time": avg_res,
                "resolution_rate_percent": resolution_rate
            }
        }
        return APIResponse(data=data, message="Admin dashboard metrics loaded successfully")

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all().order_by('-created_at')

    def get_queryset(self):
        if self.request.user.role.role_name != 'admin':
            return User.objects.none()
        return super().get_queryset()

    @extend_schema(summary="Get users listing for Admin dashboard")
    def list(self, request, *args, **kwargs):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)
        
        users = self.get_queryset()
        
        # Simple search filter
        search = request.query_params.get('search')
        if search:
            users = users.filter(email__icontains=search) | users.filter(full_name__icontains=search)
            
        data = [{
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.role_name,
            "is_active": u.is_active,
            "date_joined": u.created_at
        } for u in users]
        return APIResponse(data=data, message="Users loaded successfully")

    @extend_schema(summary="Toggle user active status (Suspend/Unsuspend)")
    def update(self, request, pk=None):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return APIResponse(message="User not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get('is_active')
        if is_active is not None:
            target_user.is_active = is_active
            target_user.save()
            action = "activated" if is_active else "suspended"
            return APIResponse(message=f"User account successfully {action}.")

        # Role change updates
        role_name = request.data.get('role')
        if role_name:
            try:
                role = Role.objects.get(role_name=role_name)
                target_user.role = role
                target_user.save()
                return APIResponse(message=f"User role updated to {role_name}.")
            except Role.DoesNotExist:
                return APIResponse(message="Role not found", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        return APIResponse(message="No updates processed.", success=False, status_code=status.HTTP_400_BAD_REQUEST)

class AdminManualAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Manually assign or override complaint to resolving officer")
    def post(self, request):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        complaint_id = request.data.get('complaint_id')
        officer_id = request.data.get('officer_id')

        if not complaint_id or not officer_id:
            return APIResponse(message="complaint_id and officer_id are required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.get(id=complaint_id)
            officer = User.objects.get(id=officer_id, role__role_name='officer')
        except (Complaint.DoesNotExist, User.DoesNotExist):
            return APIResponse(message="Complaint or Officer not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Update assignment
        assignment, created = OfficerAssignment.objects.update_or_create(
            complaint=complaint,
            defaults={"officer": officer, "status": "Assigned"}
        )

        return APIResponse(message=f"Complaint manual override successfully routed to {officer.full_name}.")

class AdminAuditLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Fetch global transaction Audit logs")
    def get(self, request):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        logs = AuditLog.objects.all().order_by('-created_at')
        data = [{
            "id": l.id,
            "user_email": l.user.email if l.user else "Anonymous",
            "action": l.action,
            "ip_address": l.ip_address,
            "user_agent": l.user_agent,
            "timestamp": l.created_at
        } for l in logs]

        return APIResponse(data=data, message="Audit logs loaded successfully")
