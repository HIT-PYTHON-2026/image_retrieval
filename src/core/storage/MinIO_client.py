from src.utils.constants import (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKET_NAME, QUERY_BUCKET)

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
        
        self.create_bucket(BUCKET_NAME)
        self.create_bucket(QUERY_BUCKET)
        
    # tạo bucket cho ảnh trong minio
    def create_bucket(self, bucket_name):
        if(self.minio.bucket_exists(bucket_name) == False):
            self.minio.make_bucket(bucket_name)
            print("make bucket successfully")
        else:
            print(f"bucket {bucket_name} is available")
    
    def upload_file(self, image_path, object_id, bucket_name):
        try:
            # cắt ra lấy cái đuôi jpg
            if(bucket_name == BUCKET_NAME):
                a, ext = os.path.split(image_path)

                final_object = f"{object_id}.{ext}"
            else:
                _, ext = os.path.splitext(image_path)
                if not ext: ext = ".jpg" # Phòng hờ không có đuôi
                final_object = f"{object_id}{ext}"
                
            # đẩy ảnh lên minio
            self.minio.fput_object(bucket_name= bucket_name,
                                   object_name= final_object,
                                   file_path= image_path)
            # chúng ta cần trả ra đg dẫn sau này lưu vào postgreSQL

            filepath = f"http://{MINIO_ENDPOINT}/{bucket_name}/{final_object}"

            print(f"upload image {final_object} successfully")
            return filepath
        except Exception as e:
            print(f"error upload: {e}")
            return 
        