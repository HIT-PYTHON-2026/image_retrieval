import sys
import os
import pandas as pd
from tqdm import tqdm

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from src.core.database.milvus_client import MilvusClient, Collection
from src.core.database.postgres_client import PostgreSQL
from src.core.storage.MinIO_client import MinioClient
from src.core.models.feature_extractor import FeatureExtractor
from src.utils.constants import DATA_PATH, COLLECTION_NAME, BUCKET_NAME

"""
etl pipeline cho dự án

dùng để upload dữ liệu lên cho dự án
dùng postgreSQL lưu thông tin ở csv
dùng MinIO để lưu ảnh
dùng Milvus lưu vector_feature

workflow:
    - khởi tạo 3 database và model
    - đọc thông tin từ csv
    - lưu ảnh vào minio
    - lưu vector đặc trưng vào milvus
    - lưu thông tin và đường dẫn vào postgreSQL

Prerequisites:
    - chạy docker-compose up -d 
    - có file trong storage/data/images và styles.csv

bấm run python file hoặc dùng terminal: $ python -m scripts.etl_pipeline
là nó sẽ tự up data lên hết 
(thử để df = df.head(10) ở dòng 57 để chạy thử xem có báo lỗi ko (chạy 10 thằng đầu trc để xem có lỗi ko nhé))
"""

def main():
    print("Starting etl pipeline")

    # gọi ra model, database và tạo bảng cho nó (ở các database )
    try:
        pg = PostgreSQL()
        milvus = MilvusClient()
        minio = MinioClient()
        models = FeatureExtractor()
        print("Connect to database and model successfully")
    except Exception as e:
        print(f"Error: {e}")

    # đọc file csv
    try:
        csv_path = os.path.join(DATA_PATH, "styles.csv")
        df = pd.read_csv(csv_path, on_bad_lines= 'skip')
        df = df.head(20)
        print("read csv successfully")
    except Exception as e:
        print(f"Error : {e}")

    print(f"Found {len(df)} items to process")

    sucess_count = 0
    image_store_path = os.path.join(DATA_PATH, "images")

    try:
        print("Starting save image and information for database")

        for index, row in tqdm(df.iterrows(), total= df.shape[0], desc="processing"):
            try:
                item_id = row['id']
                item_name = str(item_id) + ".jpg"
                image_path = os.path.join(image_store_path, item_name)

                if not image_path:
                     continue
                
                minio_path = minio.upload_file(image_path, item_name, BUCKET_NAME)

                if minio_path is None:
                     continue
                vectore_feature = models.extract_features(image_path)
                milvus.insert(int(item_id), vectore_feature)

                data = row.to_dict()

                pg.insert_data(data, minio_path)
                sucess_count += 1
            except Exception as e:
                print(f"Error : {e}")
        
        Collection(COLLECTION_NAME).flush()

        print(f"Saved {sucess_count} items successfully !")
    except Exception as e:
                print(f"Error : {e}")
    
if __name__ == "__main__":
    main()