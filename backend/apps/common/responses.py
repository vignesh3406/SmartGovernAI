from rest_framework.response import Response
from rest_framework import status

class APIResponse(Response):
    """
    Standardized API Response.
    Always returns: success, message, data, errors.
    """
    def __init__(self, data=None, message="Success", success=True, errors=None, status_code=status.HTTP_200_OK, **kwargs):
        formatted_data = {
            "success": success,
            "message": message,
            "data": data,
            "errors": errors
        }
        super().__init__(data=formatted_data, status=status_code, **kwargs)
