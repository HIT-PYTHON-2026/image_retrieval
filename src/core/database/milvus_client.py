from src.utils.constants import (MILVUS_HOST, MILVUS_PORT, VECTOR_DIM, COLLECTION_NAME)

from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility


class MilvusClient:
    
    """
    Manages vector storage and similarity search operations using Milvus.

    This class is responsible for creating a collection for fashion items and 
    performing Approximate Nearest Neighbor (ANN) search using image embeddings.

    Attributes:
        collection_name (str): Name of the collection in Milvus (e.g., 'fashion_items').
        dim (int): Dimension of the feature vector (Default: 2048 for ResNet50).
    """

    def __init__(self):
        try:
            # cái milvus này nó chỉ cần bật một lần là tự kết nối trực tiếp với database luôn
            # các lệnh sau nó tự biết sẽ lưu hay xử lý ở đây
            connections.connect(alias= "default",
                                port= MILVUS_PORT,
                                
                                host = MILVUS_HOST)
            if utility.has_collection(collection_name= COLLECTION_NAME):
                self.collection = Collection(COLLECTION_NAME)
                self.collection.load()
                print(f"Loaded existing collection {COLLECTION_NAME}")
            else:
                self.create_collection()
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
                                   anns_field= "embedding", limit = top_k)
                
                results = []

                for item in SearchResult[0]:
                    
                    score = 100/(1 + item.distance)

                    results.append({
                        "id": item.id,
                        "score": round(score, 2),
                        "distance": item.distance
                    })
                
                print(f"Found {len(results)} results ")
                return results
                
            except Exception as e:
                print(f"Error: {e}")
                return []