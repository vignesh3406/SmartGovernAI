from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission, SAFE_METHODS
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from apps.common.responses import APIResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import (
    Department,
    ComplaintCategory,
    ComplaintStatus,
    Priority,
    Severity,
    Complaint,
    ComplaintImage,
    ComplaintTimeline,
    ComplaintFeedback
)
from .serializers import (
    DepartmentSerializer,
    ComplaintCategorySerializer,
    ComplaintStatusSerializer,
    PrioritySerializer,
    SeveritySerializer,
    ComplaintSerializer,
    ComplaintCreateSerializer,
    ComplaintTimelineSerializer,
    ComplaintFeedbackSerializer
)
from .services_complaint import ComplaintService
from .services_ai import AIService

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role.role_name == 'admin' or request.user.is_superuser)
        )

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by('department_name')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class ComplaintCategoryViewSet(viewsets.ModelViewSet):
    queryset = ComplaintCategory.objects.all().order_by('category_name')
    serializer_class = ComplaintCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class ComplaintStatusViewSet(viewsets.ModelViewSet):
    queryset = ComplaintStatus.objects.all().order_by('sequence')
    serializer_class = ComplaintStatusSerializer
    permission_classes = [IsAdminOrReadOnly]

class PriorityViewSet(viewsets.ModelViewSet):
    queryset = Priority.objects.all().order_by('-weight')
    serializer_class = PrioritySerializer
    permission_classes = [IsAdminOrReadOnly]

class SeverityViewSet(viewsets.ModelViewSet):
    queryset = Severity.objects.all().order_by('-weight')
    serializer_class = SeveritySerializer
    permission_classes = [IsAdminOrReadOnly]


class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status__status', 'priority__priority', 'category__id', 'department__id']
    search_fields = ['complaint_number', 'title', 'description', 'address']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        role_name = user.role.role_name

        if role_name == 'admin':
            return Complaint.objects.all().order_by('-created_at')
        elif role_name == 'officer':
            # Officers view complaints of their department (if assigned)
            # For simplicity, they can view all complaints to allow self-assignment, or filter by department.
            return Complaint.objects.all().order_by('-created_at')
        else:
            # Citizens view only their own complaints
            return Complaint.objects.filter(citizen=user).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ComplaintCreateSerializer
        return ComplaintSerializer

    @extend_schema(
        summary="Submit a New Complaint",
        request=ComplaintCreateSerializer,
        responses={201: ComplaintSerializer}
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_class()(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Extract images if provided
        images = serializer.validated_data.pop('images', [])
        
        complaint = ComplaintService.create_complaint(
            citizen=request.user,
            data=serializer.validated_data,
            image_urls=images
        )
        
        response_serializer = ComplaintSerializer(complaint)
        return APIResponse(
            data=response_serializer.data, 
            message="Complaint submitted successfully", 
            status_code=status.HTTP_201_CREATED
        )

    @extend_schema(summary="Detect Potential Duplicate Complaints")
    @decorators.action(detail=False, methods=['get'], url_path='duplicates')
    def detect_duplicates(self, request):
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        category_id = request.query_params.get('category')

        if not latitude or not longitude or not category_id:
            return APIResponse(
                message="latitude, longitude, and category query parameters are required",
                success=False,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        duplicates = AIService.detect_duplicates(latitude, longitude, category_id)
        serializer = ComplaintSerializer(duplicates, many=True)
        return APIResponse(data=serializer.data, message="Duplicates checked successfully")

    @extend_schema(summary="Accept Assigned Complaint")
    @decorators.action(detail=True, methods=['post'], url_path='accept')
    def accept_complaint(self, request, pk=None):
        complaint = self.get_object()
        notes = request.data.get('notes', 'Complaint accepted by resolving officer.')
        
        # Check permissions (only Officer/Admin)
        if request.user.role.role_name not in ['officer', 'admin']:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        updated = ComplaintService.update_status(complaint, "Accepted", notes, request.user)
        serializer = ComplaintSerializer(updated)
        return APIResponse(data=serializer.data, message="Complaint status updated to Accepted")

    @extend_schema(summary="Reject Assigned Complaint")
    @decorators.action(detail=True, methods=['post'], url_path='reject')
    def reject_complaint(self, request, pk=None):
        complaint = self.get_object()
        notes = request.data.get('notes', 'Complaint assignment rejected.')

        if request.user.role.role_name not in ['officer', 'admin']:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        updated = ComplaintService.update_status(complaint, "Rejected", notes, request.user)
        serializer = ComplaintSerializer(updated)
        return APIResponse(data=serializer.data, message="Complaint status updated to Rejected")

    @extend_schema(summary="Update Complaint Status Workflow")
    @decorators.action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        status_name = request.data.get('status')
        notes = request.data.get('notes', '')
        resolution_images = request.data.get('images', [])

        if request.user.role.role_name not in ['officer', 'admin']:
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        if not status_name:
            return APIResponse(message="status parameter is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        updated = ComplaintService.update_status(complaint, status_name, notes, request.user)

        # Handle resolution images upload if provided
        if resolution_images and status_name == "Resolved":
            for url in resolution_images:
                ComplaintImage.objects.create(
                    complaint=updated,
                    image_url=url,
                    is_resolution=True
                )

        serializer = ComplaintSerializer(updated)
        return APIResponse(data=serializer.data, message=f"Status successfully updated to {status_name}")

    @extend_schema(summary="Submit Complaint Feedback")
    @decorators.action(detail=True, methods=['post'], url_path='feedback')
    def submit_feedback(self, request, pk=None):
        complaint = self.get_object()
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')

        # Only Citizen who submitted the complaint can leave feedback
        if complaint.citizen != request.user:
            return APIResponse(message="Permission Denied. Only complaint creator can leave feedback.", success=False, status_code=status.HTTP_403_FORBIDDEN)

        if not rating or not (1 <= int(rating) <= 5):
            return APIResponse(message="Valid rating (1 to 5) is required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        feedback = ComplaintService.submit_feedback(complaint, int(rating), comment)
        serializer = ComplaintFeedbackSerializer(feedback)
        return APIResponse(data=serializer.data, message="Feedback submitted and complaint closed successfully")

    @extend_schema(summary="Get Complaint Timeline")
    @decorators.action(detail=True, methods=['get'], url_path='timeline')
    def get_timeline(self, request, pk=None):
        complaint = self.get_object()
        timeline = complaint.timeline.all().order_by('created_at')
        serializer = ComplaintTimelineSerializer(timeline, many=True)
        return APIResponse(data=serializer.data, message="Timeline fetched successfully")

    @extend_schema(summary="Upload Complaint Image to Supabase Storage")
    @decorators.action(detail=False, methods=['post'], url_path='upload-image',
                       parser_classes=[__import__('rest_framework.parsers', fromlist=['MultiPartParser']).MultiPartParser,
                                       __import__('rest_framework.parsers', fromlist=['FormParser']).FormParser])
    def upload_image(self, request):
        import uuid as _uuid
        from apps.common.services import StorageService

        file = request.FILES.get('image')
        if not file:
            return APIResponse(message="No image file provided. Send multipart/form-data with key 'image'.",
                               success=False, status_code=status.HTTP_400_BAD_REQUEST)

        allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed:
            return APIResponse(message=f"Unsupported format: {file.content_type}. Use JPEG, PNG, WEBP, or GIF.",
                               success=False, status_code=status.HTTP_400_BAD_REQUEST)

        ext = file.name.split('.')[-1].lower()
        file_name = f"complaints/{request.user.id}/{_uuid.uuid4()}.{ext}"

        try:
            url = StorageService.upload_file(file_name, file.read(), file.content_type)
            return APIResponse(data={"url": url}, message="Image uploaded successfully")
        except Exception as e:
            return APIResponse(message=f"Upload failed: {str(e)}", success=False,
                               status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

