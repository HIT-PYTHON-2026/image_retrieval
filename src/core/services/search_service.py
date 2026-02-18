from src.core.database.milvus_client import MilvusClient, Collection
from src.core.database.postgres_client import PostgreSQL
from src.core.storage.MinIO_client import MinioClient
from src.core.models.feature_extractor import FeatureExtractor
from src.utils.constants import QUERY_BUCKET

import os
import uuid

class SearchService:
    def __init__(self):
        """
        khởi tạo kết nối với database và model
        """
        try:
            self.ps = PostgreSQL()
            self.milvus = MilvusClient()
            self.minio = MinioClient()
            self.model = FeatureExtractor()
        except Exception as e:
            print(f"Error: {e}")

    def search_image(self, userID, image_query, top_k = 5):
        """
        lấy danh sách top k sản phẩm giống nhất
        
        - lưu ảnh vào folder temp để lấy đường dẫn tạm thời rồi lưu lên MinIO
        - trích xuất đặc trưng ảnh yêu cầu rồi lấy 5 sản phẩm giống nhất
        - lưu lại lịch sử tìm kiế
        - xóa đi folder temp

        đầu ra là một dictionary chứa thông tin của top k sản phẩm giống nhất
        """
        query_id = str(uuid.uuid4()) # sinh ra id ngẫu nhiên cho ảnh yêu cầu
        temp_dir = "temp"
        temp_path = os.path.join(temp_dir, f"{query_id}.jpg") 

        try:
            # tạo ra folder tạm để lưu ảnh đã
            os.makedirs(temp_dir, exist_ok= True)
            with open(temp_path, 'wb') as f:
                f.write(image_query)
            
            # gửi lên MinIO

            minio_path = self.minio.upload_file(temp_path, query_id, QUERY_BUCKET)

            if not minio_path:
                print("Faild to upload image to MinIO")
                return []
            
            # láy đặc trưng
            vector_query = self.model.extract_features(temp_path)
            
            # tìm trên milvus
            milvus_results = self.milvus.search(vector_query, top_k)

            if not milvus_results:
                return []
            
            results_id = [item['id'] for item in milvus_results]

            self.ps.log_search_history(userID, minio_path, results_id)
            final_results = self.ps.search_data(results_id)
            
            return final_results
        except Exception as e:
            print(f"Error : {e}")
            return []
        
        finally:
            # xóa chỗ lưu tạm đi
            if os.path.exists(temp_path):
                os.remove(temp_path)