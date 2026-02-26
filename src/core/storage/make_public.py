import json
import sys
import os
from minio import Minio

# Thêm đường dẫn gốc dự án vào sys.path để có thể import từ src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from src.utils.constants import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKET_NAME, QUERY_BUCKET

def make_bucket_public(client, bucket_name):
    # Cấu hình policy cho phép truy cập public (đọc)
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": "*"},
                "Action": ["s3:GetObject"],
                "Resource": f"arn:aws:s3:::{bucket_name}/*"
            }
        ]
    }
    
    try:
        # Kiểm tra xem bucket có tồn tại chưa
        if not client.bucket_exists(bucket_name):
            print(f"Bucket '{bucket_name}' không tồn tại. Vui lòng tạo trước.")
            return

        # Đặt policy public
        client.set_bucket_policy(bucket_name, json.dumps(policy))
        print(f"Thành công: Đã chuyển quyền bucket '{bucket_name}' thành Public.")
    except Exception as e:
        print(f"Lỗi khi thay đổi quyền cho bucket '{bucket_name}': {e}")

if __name__ == "__main__":
    # Khởi tạo Minio client
    client = Minio(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    
    print("Đang tiến hành thay đổi quyền truy cập cho các bucket ảnh...")
    make_bucket_public(client, BUCKET_NAME)
    make_bucket_public(client, QUERY_BUCKET)
    print("Hoàn tất!")
