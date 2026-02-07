from config import (MILVUS_HOST, MILVUS_PORT, VECTOR_DIM, COLLECTION_NAME,
                    MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, BUCKET_NAME,
                    PG_DB, PG_USER, PG_PASSWORD, PG_HOST, PG_PORT)

from minio import Minio
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility
import psycopg2
import os

class MinioClient:

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
        
    
class MilvusClient:
    def __init__(self):
        try:
            # cái milvus này nó chỉ cần bật một lần là tự kết nối trực tiếp với database luôn
            # các lệnh sau nó tự biết sẽ lưu hay xử lý ở đây
            connections.connect(alias= "default",
                                port= MILVUS_PORT,
                                host = MILVUS_HOST)
            print("connect to milvus successfully")
        except Exception as e:
            print(f"error: {e}")
            return
        
    def create_collection(self):
        try:
            # kiểm tra xem có kết nối ko
            if(utility.has_collection(collection_name= COLLECTION_NAME)):
                utility.drop_collection(collection_name=COLLECTION_NAME)
                print("deleted old collection")
            
            # milvus thì ta chỉ lưu id và các vector đặc trưng thôi nên sẽ có 2 cột là id và vector (hay là embedding)
            # cột id
            id = FieldSchema(name = "id", dtype = DataType.INT64, is_primary = True)
            # cột embedding cột này là kiểu vector có độ sâu là dim
            vector_feature = FieldSchema(name = "embedding", dtype=DataType.FLOAT_VECTOR, dim= VECTOR_DIM)

            # giờ ta tạo bảng cho nó 
            schema = CollectionSchema(fields = [id, vector_feature], description = "store of vector feature about image")

            # kết nối cái bảng đấy với milvus
            collection = Collection(name = COLLECTION_NAME, schema= schema)

            index_param = {
                "metric_type" : "L2", # cách tính toán khoảng cách dùng eculid
                "index_type": "IVF_FLAT", # loại thuật toán tìm kiếm
                "params": {"nlist": 128} # chia nhỏ ra bao nhiêu cụm
            }

            collection.create_index(field_name="embedding", index_params=index_param)
            # milvus làm việc ở trên ram nên cần có lệnh load lên ram
            collection.load()

            print(f"created collection {COLLECTION_NAME} successfully")
        except Exception as e:
            print(f"Error: {e}")
            return
        
        # hàm chèn các vector vào
        def insert(self, item_id, vector):
            try:

                # gọi lại milvus
                collection = Collection(COLLECTION_NAME)
                # chèn vào nhưng cái này mới trên ram
                collection.insert([[item_id], [vector]])
                # đưa vô ổ cứng
                collection.flush()
                print(f"Inserted ID: {item_id}")
                return True
            except Exception as e:
                print(f"Error: {e}")
                return False

        def search(self, vector_query, top_k):
            try:
                # kết nối lại với milvus
                collection = Collection(COLLECTION_NAME)

                # params cho tìm kiếm
                search_params = {
                    "metric_type": "L2",
                    "params" : {"nprobe" : 10}
                }

                # kết quả đưa ra mảng to thì cái chỉ số 0 là đáp án đúng
                # chứa id và khoảng cách vector_query với vector trong kho
                SearchResult = collection.search([vector_query], param= search_params,
                                   anns_field= "embedding", limit= top_k)
                
                results = []

                for item in SearchResult[0]:
                    
                    score = 100/(1 + item.distance)

                    results.append({
                        "id": item.id,
                        "score": score,
                        "distance": item.disance
                    })
                
                print(f"Found {len(results)} results ")
                return results
                
            except Exception as e:
                print(f"Error: {e}")
                return []
            
    class PostgreSQL:
        def __init__(self):
            try: 
                self.db = psycopg2.connect(database = PG_DB, user = PG_USER, password = PG_PASSWORD,
                                       host=PG_HOST, port=PG_PORT)


                # muốn làm việc với postgreSQL thì làm việc trung gian qua con trỏ cursor
                self.cur = self.db.cursor()
                self.create_table()
                print("Connected to postgreSQL successfully")
            except Exception as e:
                print(f"Error: {e}")
                return
        
        def create_table(self):
            try:
                query  = """ 
                CREATE TABLE IF NOT EXISTS product_metadata(
                ID INTEGER PRIMARY KEY,
                Gender VARCHAR(6),
                MasterCategory VARCHAR(50),
                SubCategory VARCHAR(50),
                ArticleType VARCHAR(50),
                BaseColour VARCHAR(50),
                Season VARCHAR(50),
                Year INTEGER,
                Usage VARCHAR(50),
                ProductDisplayName TEXT,
                ImagePath text,
                -- ĐỂ CHO CHỨC NĂNG TÍNH ĐIỂM SẢN PHẨM
                Total_Rating_Score INTEGER DEFAULT 0
                Count_Rating INTEGER DEFAULT 0
                ) """
                self.cur.execute(query=query)
                self.db.commit()
                print("create table production metadata successfully")
            except Exception as e:
                print("Error: {e}")
                return
        
        def insert_data(self, csv_data, image_path):
            try:
                # để %s này tí truyền cho dễ 
                query = """ INSERT INTO product_metadata 
                            (ID, Gender, MasterCategory, SubCategory, ArticleType, BaseColour, Season, Year, Usage, ProductDisplayName, ImagePath)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """

                values = (csv_data.get("id"),
                          csv_data.get("gender"),
                          csv_data.get("masterCategory"),
                          csv_data.get("subCategory"),
                          csv_data.get("articleType"),
                          csv_data.get("baseColour"),
                          csv_data.get("season"),
                          csv_data.get("year"),
                          csv_data.get("usage"),
                          csv_data.get("productDisplayName"),
                          image_path)
                
                self.cur.execute(query, values)
                self.db.commit()
                print(f"Add product {csv_data.get('id')} successfully")
                return
            except Exception as e:
                print("Error: {e}")
                return
            
        def search_data(self, product_ids):
            try:
                # kiểm tra xem nó rỗng không
                if(not product_ids):
                    return []
                
                query = """SELECT * FROM product_metadata
                            WHERE ID = ANY(%s) """
                
                # ép cho nó truyền một tuple 1 phần tử
                self.cur.execute(query, (list(product_ids), ))

                rows = self.cur.fetchall()
                
                results = []

                for item in rows:
                    avr_point = 0 
                    if(item[12] != 0): avr_point = item[11]/item[12]

                    results.append({
                        "Id": item[0],
                        "Gender": item[1],
                        "Master Category": item[2],
                        "Sub Category": item[3],
                        "Article Type": item[4],
                        "Base Colour": item[5],
                        "Season": item[6],
                        "Year": item[7],
                        "Usage":item[8],
                        "Product Display Name":item[9],
                        "imagepath":item[10],
                        "averange point":avr_point
                    })
                
                print("finished collecting information about results")
                return results
            except Exception as e:
                print("Error: {e}")
                return []