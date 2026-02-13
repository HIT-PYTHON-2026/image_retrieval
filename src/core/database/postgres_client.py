from src.utils.constants import ( PG_DB, PG_USER, PG_PASSWORD, PG_HOST, PG_PORT)

import psycopg2
import json

class PostgreSQL:
    """
    Class quản lý tương tác với PostgreSQL Database cho dự án Fashion Search.
    
    Chức năng chính:
    1. Quản lý kết nối (Connection) và con trỏ (Cursor).
    2. Khởi tạo cấu trúc bảng (Schema).
    3. Các thao tác CRUD (Thêm, Sửa, Lấy dữ liệu) cho sản phẩm và người dùng.
    4. Xử lý logic tính điểm đánh giá (Rating) phức tạp.
    """
    def __init__(self):
            """
            Khởi tạo kết nối đến database và tự động tạo bảng nếu chưa có.
            """
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
            """
            Tạo 4 bảng chính:
            1. product_metadata: Thông tin sản phẩm.
            2. users: Thông tin người dùng.
            3. user_rating: Lưu điểm đánh giá của user cho sản phẩm.
            4. search_history: Lưu lịch sử tìm kiếm bằng hình ảnh.
            """
            try:
                # tạo bảng sản phẩm
                query1  = """ 
                CREATE TABLE IF NOT EXISTS product_metadata (
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
                Total_Rating_Score INTEGER DEFAULT 0,
                Count_Rating INTEGER DEFAULT 0
                ) 
                """
                # tạo bảng user
                query2 = """
                CREATE TABLE IF NOT EXISTS users (
                    userID VARCHAR(50) PRIMARY KEY,
                    full_name TEXT,
                    email TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
                # tạo bảng lưu lịch sử user

                query3 = """ 
                CREATE TABLE IF NOT EXISTS user_rating (
                    userID VARCHAR(50),
                    product_ID INTEGER,
                    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    PRIMARY KEY(userID, product_ID),

                    CONSTRAINT fk_user
                        FOREIGN KEY(userID)
                        REFERENCES users(userID) ON DELETE CASCADE,

                    CONSTRAINT fk_product
                        FOREIGN KEY(product_ID)
                        REFERENCES product_metadata(ID) ON DELETE CASCADE
                )
                """

                query4 = """ CREATE TABLE IF NOT EXISTS search_history(
                                search_id SERIAL PRIMARY KEY,
                                userID VARCHAR(50),
                                query_image_path TEXT,
                                search_results JSONB,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_user_history
                                    FOREIGN KEY(userID)
                                    REFERENCES users(userID)
                                    ON DELETE CASCADE
                );
                """
                self.cur.execute(query1)
                self.cur.execute(query2)
                self.cur.execute(query3)
                self.cur.execute(query4)
                self.db.commit()
                print("create table production metadata successfully")
            except Exception as e:
                print(f"Error: {e}")
                return
        
    def insert_data(self, csv_data, image_path):
            """
            Thêm thông tin một sản phẩm mới vào bảng product_metadata.
            Được sử dụng trong quá trình ETL Pipeline.
            """
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
                self.db.rollback()
                print(f"Error: {e}")
                return
            
    def search_data(self, product_ids):
            """
            Lấy thông tin chi tiết của một danh sách các sản phẩm theo ID.
            Thường được gọi sau khi Milvus trả về danh sách ID tương đồng.
            
            Args:
                product_ids (list): Danh sách ID sản phẩm (VD: [1163, 2245]).
                
            Returns:
                list[dict]: Danh sách các dictionary chứa thông tin chi tiết và điểm đánh giá trung bình.
            """
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
    
    def update_rating(self, user_id, product_id, new_rating):
        """
        Xử lý logic đánh giá sản phẩm:
        - Nếu user chưa đánh giá: Thêm dòng mới vào user_rating, cộng điểm vào bảng sản phẩm.
        - Nếu user đã đánh giá: Cập nhật dòng cũ, tính toán lại điểm chênh lệch (delta) và cập nhật bảng sản phẩm.
        """
        try:
            check_query = """ SELECT rating FROM user_rating
                                WHERE userID = %s AND product_ID = %s
                        """
            self.cur.execute(check_query, (user_id, product_id))
            result = self.cur.fetchone()

            if result is None:
                print(f"User {user_id} rating new product {product_id}")

                insert_history = """INSERT INTO user_rating (userID, product_ID, rating) 
                                    VALUES (%s, %s, %s)"""
                self.cur.execute(insert_history, (user_id, product_id, new_rating))

                update_product = """ UPDATE product_metadata
                                SET Total_Rating_Score = Total_Rating_Score + %s,
                                    Count_Rating = Count_Rating + 1
                                WHERE ID = %s
                """
                self.cur.execute(update_product, (new_rating, product_id))
            else:
                old_rating = result[0]

                if(old_rating == new_rating):
                    print("Rating unchanged.")
                    return True
                
                print(f"User {user_id} updating rating from {old_rating} to {new_rating}")

                
                update_history = "UPDATE user_rating SET rating = %s WHERE userID = %s AND product_ID = %s"
                self.cur.execute(update_history, (new_rating, user_id, product_id))
                
                delta = new_rating - old_rating
                
                update_product = """
                    UPDATE product_metadata 
                    SET Total_Rating_Score = Total_Rating_Score + %s
                    WHERE ID = %s
                """
                self.cur.execute(update_product, (delta, product_id))
                      
            self.db.commit()
            print("Rating updated successfully")     
        except Exception as e:
            self.db.rollback()
            print(f"Error: {e}")
            return False
    
    def log_search_history(self, user_id, query_image_path, results_id ):
        """
        Ghi lại lịch sử tìm kiếm của người dùng.
        
        Args:
            user_id (str): ID người dùng.
            query_image_path (str): URL ảnh trên MinIO mà người dùng đã upload để tìm kiếm.
            results_id (list): Danh sách ID các sản phẩm kết quả.
        """
        try:
            
            query = """
                    INSERT INTO search_history (userID, query_image_path, search_results)
                    VALUES (%s, %s, %s)
            """
            results_json = json.dumps(results_id)
            self.cur.execute(query, (user_id, query_image_path, results_json))
            self.db.commit()
            print(f"logged search history for user : {user_id}")
            return True
        except Exception as e:
            self.db.rollback()
            print(f"Error : {e}")
            return False
        
    def get_search_history(self, user_id):
        """
        Lấy danh sách lịch sử tìm kiếm của một User.
        Kết quả được sắp xếp theo thời gian mới nhất lên đầu.
        
        Returns:
            list[dict]: Gồm đường dẫn ảnh, kết quả tìm kiếm và thời gian.
        """
        try:
            query = """
                    SELECT query_image_path, search_results, created_at 
                    FROM search_history 
                    WHERE userID = %s 
                    ORDER BY created_at DESC
            """

            self.cur.execute(query, (user_id, ))
            rows = self.cur.fetchall()

            history = []
            for row in rows:
                 history.append({
                      "image_path": row[0],
                      "results": row[1],
                      "timestamp": row[2]
                 })

            return history
        except Exception as e:
            print(f"Error: {e}")
    