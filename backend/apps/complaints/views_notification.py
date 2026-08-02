from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .models import Notification, NotificationPreference, Announcement
from .serializers_notification import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    AnnouncementSerializer
)

class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.all().order_by('-created_at')

    def get_queryset(self):
        return self.queryset.filter(recipient=self.request.user)

    @extend_schema(summary="List User In-app notifications")
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = NotificationSerializer(queryset, many=True)
        return APIResponse(data=serializer.data, message="Notifications loaded successfully")

    @extend_schema(summary="Mark all user notifications as read")
    def read_all(self, request):
        self.get_queryset().update(is_read=True)
        return APIResponse(message="All notifications marked as read.")

    @extend_schema(summary="Mark single notification as read")
    def update(self, request, pk=None):
        try:
            notif = Notification.objects.get(id=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return APIResponse(message="Notification marked as read.")
        except Notification.DoesNotExist:
            return APIResponse(message="Notification not found", success=False, status_code=status.HTTP_404_NOT_FOUND)

class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        # Target filtering based on role
        role = self.request.user.role.role_name
        return self.queryset.filter(target_role__in=['all', role])

    @extend_schema(summary="List targeted bulletins/announcements")
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = AnnouncementSerializer(queryset, many=True)
        return APIResponse(data=serializer.data, message="Announcements loaded successfully")

    @extend_schema(summary="Create a broadcast announcement bulletin (Admin Only)")
    def create(self, request):
        if request.user.role.role_name != 'admin':
            return APIResponse(message="Permission Denied", success=False, status_code=status.HTTP_403_FORBIDDEN)

        title = request.data.get('title')
        content = request.data.get('content')
        target_role = request.data.get('target_role', 'all')

        if not title or not content:
            return APIResponse(message="title and content are required", success=False, status_code=status.HTTP_400_BAD_REQUEST)

        announcement = Announcement.objects.create(
            sender=request.user,
            title=title,
            content=content,
            target_role=target_role
        )
        serializer = AnnouncementSerializer(announcement)
        return APIResponse(data=serializer.data, message="Announcement broadcasted successfully.")

class NotificationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get User Notification Preferences")
    def get(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref)
        return APIResponse(data=serializer.data, message="Preferences loaded successfully")

    @extend_schema(summary="Update User Notification Preferences")
    def put(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        
        email_notif = request.data.get('email_notifications')
        in_app_notif = request.data.get('in_app_notifications')
        updates = request.data.get('complaint_updates')
        ann = request.data.get('announcements')

        if email_notif is not None:
            pref.email_notifications = email_notif
        if in_app_notif is not None:
            pref.in_app_notifications = in_app_notif
        if updates is not None:
            pref.complaint_updates = updates
        if ann is not None:
            pref.announcements = ann
        pref.save()

        serializer = NotificationPreferenceSerializer(pref)
        return APIResponse(data=serializer.data, message="Preferences updated successfully.")
