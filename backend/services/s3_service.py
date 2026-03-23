import os
import uuid
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, BinaryIO
from PIL import Image
import io
from config import settings


class S3StorageService:
    """S3-compatible storage service for file uploads and retrieval."""
    
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET
        self.region = settings.S3_REGION
        
        # Initialize S3 client
        try:
            if settings.S3_ENDPOINT:
                # For non-AWS S3 (like DigitalOcean Spaces, MinIO)
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=settings.S3_ENDPOINT,
                    aws_access_key_id=settings.S3_ACCESS_KEY,
                    aws_secret_access_key=settings.S3_SECRET_KEY,
                    region_name=settings.S3_REGION
                )
            else:
                # For AWS S3
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.S3_ACCESS_KEY,
                    aws_secret_access_key=settings.S3_SECRET_KEY,
                    region_name=settings.S3_REGION
                )
            print(f"✅ S3 client initialized for bucket: {self.bucket_name}")
        except Exception as e:
            print(f"❌ Failed to initialize S3 client: {e}")
            raise
    
    def test_connection(self) -> bool:
        """Test S3 connection and bucket access."""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ S3 connection successful for bucket: {self.bucket_name}")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            print(f"❌ S3 bucket access failed:")
            print(f"   Bucket: {self.bucket_name}")
            print(f"   Region: {self.region}")
            print(f"   Error Code: {error_code}")
            print(f"   Error: {error_msg}")
            print(f"   Please check:")
            print(f"   • Bucket name matches your existing bucket")
            print(f"   • Credentials have proper permissions")
            print(f"   • Region is correct for your bucket")
            return False
        except NoCredentialsError:
            print("❌ S3 credentials not found - check S3_ACCESS_KEY and S3_SECRET_KEY")
            return False
    
    def upload_file(self, file_data: BinaryIO, filename: str, folder: str = "") -> str:
        """Upload file to S3 and return public URL."""
        try:
            # Generate unique filename
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Define S3 key
            if folder:
                s3_key = f"{folder}/{unique_filename}"
            else:
                s3_key = unique_filename
            
            # Upload file
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': self._get_content_type(file_extension)
                    # Removed ACL - some S3 providers don't support ACLs
                }
            )
            
            # Generate public URL
            if settings.S3_ENDPOINT:
                # For non-AWS S3
                public_url = f"{settings.S3_ENDPOINT}/{self.bucket_name}/{s3_key}"
            else:
                # For AWS S3
                public_url = f"https://{self.bucket_name}.s3.{settings.S3_REGION}.amazonaws.com/{s3_key}"
            
            print(f"✅ File uploaded: {s3_key}")
            return public_url
            
        except Exception as e:
            print(f"❌ Failed to upload file: {e}")
            raise
    
    def upload_image(self, image_path: str, folder: str = "") -> str:
        """Upload image file to S3 with optimization."""
        try:
            # Open and optimize image
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Compress image (reduce quality to 85%)
                img_buffer = io.BytesIO()
                img.save(img_buffer, format='JPEG', quality=85, optimize=True)
                img_buffer.seek(0)
                
                # Get original filename
                filename = os.path.basename(image_path)
                
                # Upload to S3
                return self.upload_file(img_buffer, filename, folder)
                
        except Exception as e:
            print(f"❌ Failed to upload image: {e}")
            raise
    
    def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3."""
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            print(f"✅ File deleted: {s3_key}")
            return True
        except Exception as e:
            print(f"❌ Failed to delete file: {e}")
            return False
    
    def get_file_url(self, s3_key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for file access."""
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
        except Exception as e:
            print(f"❌ Failed to generate presigned URL: {e}")
            return ""
    
    def list_files(self, folder: str = "") -> list:
        """List files in S3 bucket/folder."""
        try:
            prefix = f"{folder}/" if folder else ""
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            for obj in response.get('Contents', []):
                files.append(obj['Key'])
            
            return files
        except Exception as e:
            print(f"❌ Failed to list files: {e}")
            return []
    
    def _get_content_type(self, file_extension: str) -> str:
        """Get MIME type based on file extension."""
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.json': 'application/json'
        }
        return content_types.get(file_extension.lower(), 'application/octet-stream')


# Global S3 service instance
s3_service = S3StorageService()
