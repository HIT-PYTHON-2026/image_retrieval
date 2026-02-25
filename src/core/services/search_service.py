from src.core.database.milvus_client import MilvusClient, Collection
from src.core.database.postgres_client import PostgreSQL
from src.core.storage.MinIO_client import MinioClient
from src.core.models.feature_extractor import FeatureExtractor
from src.utils.constants import QUERY_BUCKET, SIMILARITY_THRESHOLD

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
            
            # Lọc bằng ngưỡng SIMILARITY_THRESHOLD
            milvus_results = [item for item in milvus_results if item.get('score', 0) >= SIMILARITY_THRESHOLD]
            
            if not milvus_results:
                return []
            
            milvus_results.sort(key=lambda x: x['distance'])    # sắp xếp theo khoảng cách (L2: nhỏ = giống hơn)
            results_id = [item['id'] for item in milvus_results]

            # Lưu map id→distance và vị trí để sort lại sau
            distance_map = {item['id']: item['distance'] for item in milvus_results}
            score_map    = {item['id']: item['score']    for item in milvus_results}
            order_map    = {item['id']: idx for idx, item in enumerate(milvus_results)}

            self.ps.log_search_history(userID, minio_path, results_id)
            raw_results = self.ps.search_data(results_id)

            # PostgreSQL ANY(...) không giữ thứ tự → sort lại theo thứ tự Milvus
            for r in raw_results:
                pid = r.get('Id') or r.get('id') or r.get('ID')
                r['distance'] = distance_map.get(pid, 9999)
                r['score']    = score_map.get(pid, 0)

            final_results = sorted(raw_results, key=lambda r: order_map.get(
                r.get('Id') or r.get('id') or r.get('ID'), 9999
            ))

            return final_results
        except Exception as e:
            print(f"Error : {e}")
            return []
        
        finally:
            # xóa chỗ lưu tạm đi
            if os.path.exists(temp_path):
                os.remove(temp_path)