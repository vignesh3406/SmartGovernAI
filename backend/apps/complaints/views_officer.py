from rest_framework import status, permissions
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .models import Complaint, OfficerAssignment, OfficerPerformance, ComplaintEvidence, EscalationHistory
from .serializers import ComplaintSerializer
from .serializers_officer import (
    OfficerAssignmentSerializer,
    ComplaintEvidenceSerializer,
    EscalationHistorySerializer,
    OfficerPerformanceSerializer
)
from .services_officer import OfficerWorkflowService

class OfficerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get Officer Dashboard statistics metrics")
    def get(self, request):
        if request.user.role.role_name not in ['officer', 'admin']:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        # Retrieve performance metrics
        try:
            perf = OfficerPerformance.objects.get(officer=request.user)
            perf_data = OfficerPerformanceSerializer(perf).data
        except OfficerPerformance.DoesNotExist:
            perf_data = {
                "completed_complaints": 0,
                "average_resolution_time": 0.0,
                "rating_average": 5.0,
                "performance_score": 100.0
            }

        # Calculate counts
        assignments = OfficerAssignment.objects.filter(officer=request.user)
        pending = assignments.filter(status='Assigned').count()
        accepted = assignments.filter(status='Accepted').count()
        in_progress = assignments.filter(status='In Progress').count()
        completed = assignments.filter(status='Resolved').count()
        escalated = assignments.filter(status='Escalated').count()

        data = {
            "performance": perf_data,
            "counts": {
                "pending": pending,
                "accepted": accepted,
                "in_progress": in_progress,
                "completed": completed,
                "escalated": escalated,
                "total": assignments.count()
            }
        }
        return APIResponse(data=data, message="Dashboard loaded successfully")

class OfficerAssignedListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List Officer's Assigned Complaints",
        responses={200: OfficerAssignmentSerializer(many=True)}
    )
    def get(self, request):
        if request.user.role.role_name not in ['officer', 'admin']:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        assignments = OfficerAssignment.objects.filter(officer=request.user).select_related('complaint', 'complaint__status', 'complaint__priority')
        serializer = OfficerAssignmentSerializer(assignments, many=True)
        return APIResponse(data=serializer.data, message="Assigned tasks fetched successfully")

class OfficerComplaintDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Fetch specific complaint for officer",
        responses={200: ComplaintSerializer}
    )
    def get(self, request, pk):
        try:
            complaint = Complaint.objects.get(id=pk)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Enforce that officers can only see their own assigned complaints
        if request.user.role.role_name == 'officer':
            assigned = OfficerAssignment.objects.filter(complaint=complaint, officer=request.user).exists()
            if not assigned:
                return APIResponse(message="Permission Denied. Ticket not assigned to you.", success=False, status_code=status.HTTP_403_FORBIDDEN)

        serializer = ComplaintSerializer(complaint)
        return APIResponse(data=serializer.data, message="Complaint details loaded successfully")

class OfficerStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Update Complaint Status")
    def put(self, request, pk):
        try:
            complaint = Complaint.objects.get(id=pk)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Enforce assignment mapping check
        if request.user.role.role_name == 'officer':
            assigned = OfficerAssignment.objects.filter(complaint=complaint, officer=request.user).exists()
            if not assigned:
                return APIResponse(message="Permission Denied. Ticket not assigned to you.", success=False, status_code=status.HTTP_403_FORBIDDEN)

        status_name = request.data.get('status')
        notes = request.data.get('notes', '')

        if not status_name:
            return APIResponse(message="status parameter is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        # Execute accepted transition check
        if status_name == "Accepted":
            OfficerWorkflowService.accept_assignment(complaint, request.user)
        else:
            OfficerWorkflowService.update_officer_status(complaint, status_name, notes, request.user)

        serializer = ComplaintSerializer(complaint)
        return APIResponse(data=serializer.data, message=f"Status successfully transitioned to {status_name}")

class OfficerUploadEvidenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Upload Work Evidence Photos",
        request=ComplaintEvidenceSerializer,
        responses={201: ComplaintEvidenceSerializer}
    )
    def post(self, request):
        complaint_id = request.data.get('complaint')
        image_url = request.data.get('image_url')
        evidence_type = request.data.get('evidence_type') # Before / After
        description = request.data.get('description', '')

        if not complaint_id or not image_url or not evidence_type:
            return APIResponse(message="complaint, image_url, and evidence_type are required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        evidence = OfficerWorkflowService.upload_evidence(complaint, image_url, evidence_type, request.user)
        serializer = ComplaintEvidenceSerializer(evidence)
        return APIResponse(data=serializer.data, message="Evidence successfully logged.")

class OfficerEscalateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Escalate complaint routing assignment",
        request=EscalationHistorySerializer,
        responses={201: EscalationHistorySerializer}
    )
    def post(self, request):
        complaint_id = request.data.get('complaint')
        reason = request.data.get('reason')
        new_department_id = request.data.get('new_department')

        if not complaint_id or not reason or not new_department_id:
            return APIResponse(message="complaint, reason, and new_department are required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        escalation = OfficerWorkflowService.escalate_complaint(complaint, reason, new_department_id, request.user)
        serializer = EscalationHistorySerializer(escalation)
        return APIResponse(data=serializer.data, message="Complaint escalated and rerouted successfully.")

class OfficerPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get Officer Performance Analytics",
        responses={200: OfficerPerformanceSerializer}
    )
    def get(self, request):
        try:
            perf = OfficerPerformance.objects.get(officer=request.user)
            serializer = OfficerPerformanceSerializer(perf)
            return APIResponse(data=serializer.data, message="Performance stats loaded successfully")
        except OfficerPerformance.DoesNotExist:
            # Return zero-state defaults for new officers
            return APIResponse(data={
                "completed_complaints": 0,
                "average_resolution_time": 0.0,
                "rating_average": 0.0,
                "performance_score": 0.0
            }, message="Performance tracking begins once you resolve your first complaint.")

