from minio import Minio
from src.utils.constants import MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY


def clean_bucket():
    print("🔌 Đang kết nối tới MinIO...")
    # Khởi tạo kết nối giống hệt trong MinioClient của bạn
    client = Minio(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False 
    )

    bucket_name = "image" 
    
    # Kiểm tra xem bucket có tồn tại không
    if not client.bucket_exists(bucket_name):
        print(f"❌ Bucket '{bucket_name}' không tồn tại!")
        return

    print(f"🗑️ Đang quét toàn bộ file trong bucket '{bucket_name}'...")
    
    # Lấy danh sách toàn bộ objects (ảnh) trong bucket
    objects = client.list_objects(bucket_name, recursive=True)
    
    count = 0
    # Lặp qua từng file và bóp cò tiêu diệt
    for obj in objects:
        client.remove_object(bucket_name, obj.object_name)
        count += 1
        
        # Báo cáo tiến độ cho mỗi 1000 ảnh để bạn không bị sốt ruột
        if count % 1000 == 0:
            print(f"⏳ Đã xóa {count} ảnh...")

    print(f"✅ HOÀN TẤT! Đã dọn sạch sẽ {count} ảnh khỏi bucket '{bucket_name}'.")

if __name__ == "__main__":
    clean_bucket()