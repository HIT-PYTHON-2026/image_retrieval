from src.core.database.postgres_client import PostgreSQL
from src.core.database.milvus_client import MilvusClient
from src.core.storage.MinIO_client import MinioClient
from src.core.models.feature_extractor import FeatureExtractor
from src.utils.constants import BUCKET_NAME
import os

class BrandService:
    def __init__(self):
        try:
            self.db = PostgreSQL()
            self.milvus = MilvusClient()
            self.minio = MinioClient()
            self.model = FeatureExtractor()
        except Exception as e:
            print(f"Error Initialize BrandService: {e}")

    # Đã sửa brand__id thành brand_id
    def process_new_product(self, image_query, image_infor, brand_id):

        product_id = image_infor.get('ID') 
        
        temp_dir = "temp"

        temp_path = os.path.join(temp_dir, f"{product_id}.jpg") 

        try:
            os.makedirs(temp_dir, exist_ok=True)
            with open(temp_path, 'wb') as f:
                f.write(image_query)
            
        
            minio_path = self.minio.upload_file(temp_path, str(product_id), BUCKET_NAME)

            if not minio_path:
                print("Fail to upload new image brand to MinIO")
                return False

            vector_query = self.model.extract_features(temp_path)

            
            if not self.milvus.insert(product_id, vector_query):
                print("Fail to save vector feature on Milvus")
                return False

            if not self.db.insert_brand_product(image_infor, minio_path, brand_id):
                print("Fail to save metadata on Postgres")
                return False
            
            return True
        except Exception as e:
            print(f"Error in process_new_product: {e}")
            return False
        
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    def toggle_status(self, product_id: int, is_active: bool):
        """
        Bật/tắt trạng thái bán của sản phẩm.
        Chỉ cần gọi thẳng xuống Database là xong.
        """
        return self.db.toggle_product_status(product_id, is_active)