from rest_framework.permissions import BasePermission

class IsCitizen(BasePermission):
    """
    Allows access only to citizen users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role.role_name == 'citizen')

class IsOfficer(BasePermission):
    """
    Allows access only to officer users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role.role_name == 'officer')

class IsAdmin(BasePermission):
    """
    Allows access only to admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role.role_name == 'admin' or request.user.is_superuser))

class IsAuthenticatedUser(BasePermission):
    """
    Allows access only to authenticated users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

# Aliases to match specific Phase 1 requirements exactly
CitizenPermission = IsCitizen
OfficerPermission = IsOfficer
AdminPermission = IsAdmin
AuthenticatedPermission = IsAuthenticatedUser

class IsOwner(BasePermission):
    """
    Object-level permission to only allow owners of an object to access or edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Assumes the model instance has a 'user' attribute or is the user instance itself.
        if obj == request.user:
            return True
        return bool(hasattr(obj, 'user') and obj.user == request.user)

OwnerPermission = IsOwner
AuthenticatedPermission = IsAuthenticatedUser
