from src.utils.constants import (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKET_NAME)

from minio import Minio
import os

class MinioClient:
    """
    Handles file storage operations using MinIO (S3 compatible object storage).

    This class manages bucket creation, setting public access policies, and 
    uploading local image files to the cloud storage.

    Attributes:
        client (Minio): The MinIO client instance.
        bucket_name (str): The name of the bucket used for storage.
    """
    def __init__(self):
        # để tham số secure = false vì ta chạy trong local
        self.minio = Minio(endpoint= MINIO_ENDPOINT,
              access_key= MINIO_ACCESS_KEY,
              secret_key= MINIO_SECRET_KEY, secure= False)
        
    # tạo bucket cho ảnh trong minio
    def create_bucket(self):
        if(self.minio.bucket_exists(BUCKET_NAME) == False):
            self.minio.make_bucket(BUCKET_NAME)
            print("make bucket successfully")
        else:
            print(f"bucket {BUCKET_NAME} is available")
    
    def upload_file(self, image_path, object_id):
        try:
            # cắt ra lấy cái đuôi jpg
            a, ext = os.path.split(image_path)

            final_object = f"{object_id}.{ext}"
            # đẩy ảnh lên minio
            self.minio.fput_object(bucket_name= BUCKET_NAME,
                                   object_name= final_object,
                                   file_path= image_path)
            # chúng ta cần trả ra đg dẫn sau này lưu vào postgreSQL

            filepath = f"http://{MINIO_ENDPOINT}/{BUCKET_NAME}/{final_object}"

            print(f"upload image {final_object} successfully")
            return filepath
        except Exception as e:
            print(f"error upload: {e}")
            return 
        