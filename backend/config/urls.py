from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from django.http import JsonResponse

def root_api_health(request):
    return JsonResponse({
        "status": "online",
        "service": "SmartGov AI Backend API",
        "version": "1.0.0",
        "documentation": "/api/docs/swagger/",
        "endpoints": {
            "auth": "/api/auth/login/",
            "register": "/api/auth/register/",
            "complaints": "/api/complaints/",
            "categories": "/api/categories/"
        }
    })

urlpatterns = [
    path('', root_api_health, name='api-root'),
    path('admin/', admin.site.urls),
    
    # Auth & Accounts endpoints
    path('api/', include('apps.accounts.urls')),
    
    # JWT Token Refresh
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Complaints & Master Data endpoints
    path('api/', include('apps.complaints.urls')),
    
    # OpenAPI Schema and Swagger/Redoc UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
