from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema
from apps.common.responses import APIResponse
from .serializers_profile import ProfileSerializer, ProfileUpdateSerializer, AvatarSerializer
from .services_profile import ProfileService
from .services_audit import AuditLogService

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get User Profile",
        responses={200: ProfileSerializer}
    )
    def get(self, request):
        """
        Retrieve current authenticated user's profile.
        """
        profile = ProfileService.get_profile(request.user)
        serializer = ProfileSerializer(profile)
        return APIResponse(data=serializer.data, message="Profile fetched successfully")

    @extend_schema(
        summary="Update User Profile",
        request=ProfileUpdateSerializer,
        responses={200: ProfileSerializer}
    )
    def put(self, request):
        """
        Update user profile information.
        """
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        profile = ProfileService.update_profile(request.user, serializer.validated_data)
        response_serializer = ProfileSerializer(profile)
        
        # Audit logging
        AuditLogService.log_action(request.user, "Profile Updated", request)
        
        return APIResponse(data=response_serializer.data, message="Profile updated successfully")

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload User Avatar",
        request=AvatarSerializer,
        responses={200: ProfileSerializer}
    )
    def patch(self, request):
        """
        Upload profile avatar picture.
        """
        serializer = AvatarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            file_obj = serializer.validated_data['avatar']
            public_url = ProfileService.upload_avatar(request.user, file_obj)
            profile = ProfileService.get_profile(request.user)
            response_serializer = ProfileSerializer(profile)
            
            # Audit logging
            AuditLogService.log_action(request.user, "Avatar Uploaded", request)
            
            return APIResponse(data=response_serializer.data, message="Avatar uploaded successfully")
        except ValueError as e:
            return APIResponse(message=str(e), success=False, status_code=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete User Avatar",
        responses={200: ProfileSerializer}
    )
    def delete(self, request):
        """
        Delete user profile avatar picture.
        """
        ProfileService.delete_avatar(request.user)
        profile = ProfileService.get_profile(request.user)
        response_serializer = ProfileSerializer(profile)
        
        # Audit logging
        AuditLogService.log_action(request.user, "Avatar Deleted", request)
        
        return APIResponse(data=response_serializer.data, message="Avatar deleted successfully")
