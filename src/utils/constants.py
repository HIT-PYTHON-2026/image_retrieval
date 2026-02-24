from pathlib import Path

#đường dẫn của dữ liệu
CURRENT_DIR = Path(__file__).resolve().parent # nằm trên ổ cứng nào nó sẽ trả về utils
SRC_DIR = CURRENT_DIR.parent # chạy ngược về file core
DATA_PATH = SRC_DIR/"core"/"storage"/"data" # rồi mình ghi đường dẫn vào data

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
QUERY_BUCKET = "user-queries"
# 3 setup cấu hình cho postgreSQL

PG_DB = "image_retrieval"
PG_USER = "user"
PG_PASSWORD = "password"
PG_HOST = "localhost"
PG_PORT = "5433"

# 4 setup cấu hình ngưỡng tìm kiếm
SIMILARITY_THRESHOLD = 0.90 # score tối thiểu để được coi là kết quả hợp lệ
