import os

#đường dẫn của dữ liệu
DATA_PATH = "./data"

# ở đây các máy đều chạy trên mạng nội bộ nên nó đều có máy chủ là localhost nhé
# 1 setup cấu hình cho Milvus
MILVUS_HOST = "localhost"
MILVUS_PORT = "19530"
VECTOR_DIM = "2048" 
COLLECTION_NAME = "image_retrieval"

# 2 setup cấu hình cho MinIO

MINIO_ENDPOINT = "localhost:9000"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
BUCKET_NAME = "image"

# 3 setup cấu hình cho postgreSQL

PG_DB = "image_retrieval"
PG_USER = "user"
PG_PASSWORD = "password"
PG_HOST = "localhost"
PG_PORT = "5432"
