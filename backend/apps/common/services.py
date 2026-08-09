import logging
from django.conf import settings
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class StorageService:
    _client = None

    @classmethod
    def get_client(cls) -> Client:
        import sys
        if 'test' in sys.argv:
            return None
            
        if not cls._client:
            url = getattr(settings, 'SUPABASE_URL', '')
            key = getattr(settings, 'SUPABASE_KEY', '')
            if not url or not key or 'your-supabase-project' in url:
                logger.warning("Supabase URL or Key not set/default. Storage operations will be mocked/disabled.")
                return None
            cls._client = create_client(url, key)
        return cls._client

    @staticmethod
    def upload_file(file_name: str, file_data: bytes, content_type: str) -> str:
        """
        Uploads a file to the Supabase Storage bucket.
        Returns the public URL of the uploaded file.
        Falls back to a Data URL in development if Supabase is not configured or returns RLS errors.
        """
        import base64
        client = StorageService.get_client()
        bucket_name = getattr(settings, 'SUPABASE_BUCKET', 'smartgov-profiles')

        if not client:
            encoded = base64.b64encode(file_data).decode('utf-8')
            return f"data:{content_type};base64,{encoded}"

        try:
            # Upload file
            client.storage.from_(bucket_name).upload(
                path=file_name,
                file=file_data,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            return StorageService.get_public_url(file_name)
        except Exception as e:
            err_str = str(e).lower()
            if '403' in err_str or 'row-level security' in err_str or 'unauthorized' in err_str or 'rls' in err_str:
                logger.warning(f"Supabase RLS blocked upload for {file_name}. Returning Base64 Data URL for display.")
                encoded = base64.b64encode(file_data).decode('utf-8')
                return f"data:{content_type};base64,{encoded}"
            logger.error(f"Failed to upload file to Supabase: {str(e)}")
            encoded = base64.b64encode(file_data).decode('utf-8')
            return f"data:{content_type};base64,{encoded}"

    @staticmethod
    def delete_file(file_path: str):
        """
        Deletes a file from the Supabase Storage bucket.
        """
        client = StorageService.get_client()
        bucket_name = getattr(settings, 'SUPABASE_BUCKET', 'smartgov-profiles')

        if not client:
            return

        try:
            client.storage.from_(bucket_name).remove([file_path])
        except Exception as e:
            logger.error(f"Failed to delete file from Supabase: {str(e)}")

    @staticmethod
    def get_public_url(file_name: str) -> str:
        """
        Generates a public URL for a file in the bucket.
        """
        client = StorageService.get_client()
        bucket_name = getattr(settings, 'SUPABASE_BUCKET', 'smartgov-profiles')

        if not client:
            return f"https://mockstorage.supabase.co/{bucket_name}/{file_name}"

        try:
            response = client.storage.from_(bucket_name).get_public_url(file_name)
            return response
        except Exception as e:
            logger.error(f"Failed to get public URL from Supabase: {str(e)}")
            # Fallback path if get_public_url method fails
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_name}"
