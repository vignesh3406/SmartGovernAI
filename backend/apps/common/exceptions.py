from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, APIException
from rest_framework import status
from django.http import Http404
from django.core.exceptions import PermissionDenied
from .responses import APIResponse

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize validation error message
        errors = response.data
        message = "Validation failed"
        
        # If it's a validation error, extract message or format properly
        if isinstance(exc, ValidationError):
            message = "Input validation failed. Please check the fields."
        elif hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                message = exc.detail.get('detail', str(exc.detail))
            elif isinstance(exc.detail, list) and len(exc.detail) > 0:
                message = str(exc.detail[0])
            else:
                message = str(exc.detail)

        # Standardize response structure
        return APIResponse(
            data=None,
            message=message,
            success=False,
            errors=errors,
            status_code=response.status_code
        )

    # For unhandled server exceptions (500)
    # Log the exception (in production you would log to a service)
    import logging
    logger = logging.getLogger(__name__)
    logger.exception(exc)

    return APIResponse(
        data=None,
        message="An unexpected error occurred on the server.",
        success=False,
        errors={"server_error": str(exc)},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
