from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .models import AIAnalysis, AIRequestLog, Complaint
from .serializers_ai import AIAnalysisSerializer, AIRequestLogSerializer
from .services_ai_engine import AIEngineService

class AIAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Trigger manual AI analysis on a complaint",
        responses={200: AIAnalysisSerializer}
    )
    def post(self, request):
        complaint_id = request.data.get('complaint_id')
        if not complaint_id:
            return APIResponse(message="complaint_id is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Citizens can only analyze their own complaints, Officers/Admins can analyze any
        if request.user.role.role_name not in ['admin', 'officer'] and complaint.citizen != request.user:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        analysis = AIEngineService.run_complaint_analysis(complaint)
        serializer = AIAnalysisSerializer(analysis)
        return APIResponse(data=serializer.data, message="Complaint successfully analyzed by AI Engine.")

class AIResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Fetch AI analysis result for a complaint",
        responses={200: AIAnalysisSerializer}
    )
    def get(self, request, complaint_id):
        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        # Check permissions
        if request.user.role.role_name not in ['admin', 'officer'] and complaint.citizen != request.user:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        try:
            analysis = AIAnalysis.objects.get(complaint=complaint)
            serializer = AIAnalysisSerializer(analysis)
            return APIResponse(data=serializer.data, message="AI analysis fetched successfully.")
        except AIAnalysis.DoesNotExist:
            return APIResponse(message="No AI analysis found for this complaint. Run analyze first.", success=False, status_code=status.HTTP_404_NOT_FOUND)

class AILogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Fetch AI API request logs",
        responses={200: AIRequestLogSerializer(many=True)}
    )
    def get(self, request):
        # Admin only view
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        logs = AIRequestLog.objects.all().order_by('-created_at')
        serializer = AIRequestLogSerializer(logs, many=True)
        return APIResponse(data=serializer.data, message="AI Logs fetched successfully.")

class AIReanalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Force Admin-only re-analysis on a complaint",
        responses={200: AIAnalysisSerializer}
    )
    def post(self, request):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        complaint_id = request.data.get('complaint_id')
        if not complaint_id:
            return APIResponse(message="complaint_id is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return APIResponse(message="Complaint not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

        analysis = AIEngineService.run_complaint_analysis(complaint)
        serializer = AIAnalysisSerializer(analysis)
        return APIResponse(data=serializer.data, message="Complaint successfully re-analyzed by AI Engine.")
