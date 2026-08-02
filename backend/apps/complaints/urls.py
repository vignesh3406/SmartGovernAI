from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet,
    ComplaintCategoryViewSet,
    ComplaintStatusViewSet,
    PriorityViewSet,
    SeverityViewSet,
    ComplaintViewSet
)
from .views_ai import (
    AIAnalyzeView,
    AIResultView,
    AILogsView,
    AIReanalyzeView
)
from .views_officer import (
    OfficerDashboardView,
    OfficerAssignedListView,
    OfficerComplaintDetailView,
    OfficerStatusUpdateView,
    OfficerUploadEvidenceView,
    OfficerEscalateView,
    OfficerPerformanceView
)
from .views_admin import (
    AdminDashboardView,
    AdminUserViewSet,
    AdminManualAssignView,
    AdminAuditLogsView
)
from .views_notification import (
    NotificationViewSet,
    AnnouncementViewSet,
    NotificationPreferenceView
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'categories', ComplaintCategoryViewSet, basename='category')
router.register(r'status', ComplaintStatusViewSet, basename='status')
router.register(r'priorities', PriorityViewSet, basename='priority')
router.register(r'severity', SeverityViewSet, basename='severity')
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('', include(router.urls)),
    
    # AI Engine Endpoints
    path('ai/analyze/', AIAnalyzeView.as_view(), name='ai-analyze'),
    path('ai/result/<uuid:complaint_id>/', AIResultView.as_view(), name='ai-result'),
    path('ai/logs/', AILogsView.as_view(), name='ai-logs'),
    path('ai/reanalyze/', AIReanalyzeView.as_view(), name='ai-reanalyze'),
    
    # Officer Operations Endpoints
    path('officer/dashboard/', OfficerDashboardView.as_view(), name='officer-dashboard'),
    path('officer/assigned/', OfficerAssignedListView.as_view(), name='officer-assigned'),
    path('officer/complaint/<uuid:pk>/', OfficerComplaintDetailView.as_view(), name='officer-complaint-detail'),
    path('officer/status/<uuid:pk>/', OfficerStatusUpdateView.as_view(), name='officer-status-update'),
    path('officer/upload-evidence/', OfficerUploadEvidenceView.as_view(), name='officer-upload-evidence'),
    path('officer/escalate/', OfficerEscalateView.as_view(), name='officer-escalate'),
    path('officer/performance/', OfficerPerformanceView.as_view(), name='officer-performance'),

    # Admin Operations Endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/users/', AdminUserViewSet.as_view({'get': 'list'}), name='admin-users-list'),
    path('admin/users/<uuid:pk>/', AdminUserViewSet.as_view({'put': 'update'}), name='admin-user-update'),
    path('admin/assign/', AdminManualAssignView.as_view(), name='admin-manual-assign'),
    path('admin/audit/', AdminAuditLogsView.as_view(), name='admin-audit-logs'),

    # Notification & Announcements Endpoints
    path('notifications/', NotificationViewSet.as_view({'get': 'list', 'put': 'read_all'}), name='notifications-list'),
    path('notifications/<uuid:pk>/', NotificationViewSet.as_view({'put': 'update', 'delete': 'destroy'}), name='notification-detail'),
    path('announcements/', AnnouncementViewSet.as_view({'get': 'list', 'post': 'create'}), name='announcements-list'),
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
]
