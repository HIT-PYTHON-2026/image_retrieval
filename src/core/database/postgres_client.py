from src.utils.constants import ( PG_DB, PG_USER, PG_PASSWORD, PG_HOST, PG_PORT)

import psycopg2
import json
import uuid

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
            5. cart_items : bảng lưu giỏ hàng
            """
            try:
                # tạo bảng sản phẩm
                query1 = """
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
                    ImagePath TEXT,
                    Total_Rating_Score INTEGER DEFAULT 0,
                    Count_Rating INTEGER DEFAULT 0,
                    -- THÊM 2 CỘT MỚI Ở ĐÂY:
                    is_active BOOLEAN DEFAULT TRUE,
                    brand_id VARCHAR(50) 
                )
                """
                # tạo bảng user
                query2 = """
                CREATE TABLE IF NOT EXISTS users (
                    userID VARCHAR(50) PRIMARY KEY,
                    full_name TEXT,
                    password_hash VARCHAR(255) NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role VARCHAR(20) DEFAULT 'customer', -- 'brand' or 'customer'
                    gender VARCHAR(10),
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
                    UNIQUE(userID, product_ID),
                    CONSTRAINT fk_user
                        FOREIGN KEY(userID)
                        REFERENCES users(userID) ON DELETE CASCADE,

                    CONSTRAINT fk_product
                        FOREIGN KEY(product_ID)
                        REFERENCES product_metadata(ID) ON DELETE CASCADE
                )
                """

                # lịch sử tra cứu
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
                # bảng giỏ hàng
                query5 = """
                CREATE TABLE IF NOT EXISTS cart_items(
                    record_id SERIAL PRIMARY KEY,
                    user_id VARCHAR(50) REFERENCES users(userID) ON DELETE CASCADE,
                    product_id INTEGER REFERENCES product_metadata(ID) ON DELETE CASCADE,
                    status VARCHAR(50) DEFAULT 'Unpaid',
                    order_batch_id VARCHAR(100),
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
                self.cur.execute(query1)
                self.cur.execute(query2)
                self.cur.execute(query3)
                self.cur.execute(query4)
                self.cur.execute(query5)
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
                            WHERE ID = ANY(%s) AND is_active = TRUE"""
                
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
                 product_ids = row[1] if row[1] else []
                 # Lấy chi tiết các sản phẩm từ danh sách ID
                 detailed_results = self.search_data(product_ids)
                 
                 # Format lại ảnh tải lên theo chuẩn URL của MinIO
                 query_img = row[0]
                 from src.utils.constants import MINIO_ENDPOINT, QUERY_BUCKET
                 if query_img and not query_img.startswith("http"):
                     query_img = f"http://{MINIO_ENDPOINT}/{QUERY_BUCKET}/{query_img}"
                 
                 history.append({
                      "image_path": query_img,
                      "results": detailed_results,
                      "timestamp": row[2]
                 })

            return history
        except Exception as e:
            print(f"Error: {e}")
    
    def create_user(self, user_id, email, password_hash, full_name, role, gender):
        """lưu lại thông tin khách hàng"""
        try:
              query = """INSERT INTO users (userID, full_name, password_hash, email, role, gender)
              VALUES (%s, %s, %s, %s, %s, %s)"""

              self.cur.execute(query, (user_id, full_name, password_hash, email, role, gender))
              self.db.commit()
              print(f"Created user: {email}")
              return True
        except Exception as e:
             self.db.rollback()
             print(f"Error: {e}")
             return False
        
    def get_user_by_email(self, email):
        """
            lấy thông tin khách hàng qua email sau này phục vụ việc hiển thị thông tin + check mật khẩu

        """
        try:
             query = """
                SELECT userID, email , full_name, password_hash, role, gender
                FROM users
                WHERE email = %s
            """
             
             self.cur.execute(query, (email, ))
             row = self.cur.fetchone()
             if row:
                  return{
                       "userID" : row[0],
                       "email"  : row[1],
                       "full_name" : row[2],
                       "password_hash" : row[3],
                       "role" : row[4],
                       "gender" : row[5]
                  }
             return None
        except Exception as e:
             print(f"Error: {e}")
             return None
    
    def add_to_cart(self, userID, productID):
        """
            thêm sản phẩm vào giỏ hàng 
            cần productID và userID 
            khi này sẽ để sẵn trạng thái là Unpaid sang này thanh toán sẽ gói tất cả thành một giỏ hàng sau
            nó sẽ trả về đúng khi (sản phẩm đã có trong giỏ hàng hoặc mới được thêm vào)
            trả về sai khi có lỗi
        """
        try:
             check_cart = """ SELECT record_id FROM cart_items 
                            WHERE status = 'Unpaid' AND user_id = %s AND product_id = %s 
                """
             self.cur.execute(check_cart, (userID, productID))
             if self.cur.fetchone():
                  return True
             query = """ INSERT INTO cart_items (user_id, product_id) VALUES (%s, %s)
                """
             self.cur.execute(query, (userID, productID))
             self.db.commit()
             return True
        except Exception as e:
             self.db.rollback()
             print(f"Error: {e}")
             return False
        
    def get_active_cart(self, user_id):
         """
            lấy giỏ hàng hiện tại (chính là gom tất cả những thằng Unpaid lại với nhau)
            trong này sẽ trả về tất cả mặt hàng đã đặt mà chưa thanh toán, điểm đặc biệt là có cá những cái is_active = false
            nếu người dùng thanh toán sau này sẽ thông báo những cái ko thanh toán được sau

            return ra dictionary chứa thông tin của mỗi sản phẩm sau bấm vào xem chi tiết thì gọi hàm search data
         """
         try:
            query = """
                    SELECT p.ID, p.ProductDisplayName, p.ImagePath, c.added_at, p.is_active
                    FROM cart_items c
                    JOIN product_metadata p ON c.product_id = p.ID
                    WHERE c.user_id = %s AND c.status = 'Unpaid' 
                    ORDER BY c.added_at DESC
                """
            self.cur.execute(query, (user_id, ))
            rows = self.cur.fetchall()
            return [{"product_id": r[0], 
                     "name": r[1], 
                     "image": r[2], 
                     "added_at" : r[3],  
                     "is_active": r[4]} 
                     for r in rows]

         except Exception as e:
              print(f"Error: {e}")
              return []
    
    def checkout_cart(self, user_id):
         """
         Nút THANH TOÁN: Quét kiểm tra Ghost Product trước.
        - Nếu có sản phẩm is_active = False -> Chặn lại và báo tên sản phẩm lỗi.
        - Nếu ổn hết -> Mới cấp Batch ID và thanh toán.


        return {
            tin nhắn chứa trạng thái thành công hay không?
            thông báo lỗi hoặc danh sách các sản phẩm không thanh toán được

        }
         """

         try:
              check_query = """
                SELECT p.ProductDisplayName
                FROM cart_items c
                JOIN product_metadata p ON c.product_id = p.ID
                WHERE c.user_id = %s AND c.status = 'Unpaid' AND p.is_active  = FALSE
                """
              self.cur.execute(check_query, (user_id, ))
              invalid_items = self.cur.fetchall()

              if invalid_items:
                   invalid_names = [item[0] for item in invalid_items]
                   error_msg = f"These products have been discontinued {', '.join(invalid_names)}"
                   print(f"Blocked checkout: {error_msg}")

                   return{
                        "success": False,
                        "message": error_msg,
                        "invalid_items": invalid_names
                   }
              
              new_batch_id = str(uuid.uuid4())[:8]

              update_query = """
                    UPDATE cart_items
                    SET status = 'Paid',  order_batch_id =  %s
                    WHERE user_id = %s AND status = 'Unpaid'
                """
              self.cur.execute(update_query, (new_batch_id, user_id))

              if self.cur.rowcount == 0:
                   return{
                        "success": False,
                        "message": "Your cart is empty"
                   }
              self.db.commit()
              print(f"Purchased successfully with cart's code: {new_batch_id} ")
              return{
                   "success": True,
                   "message" : "Purchased successfully"
              }
         except Exception as e:
              self.db.rollback()
              print(f"Error: {e}")
              return {"success" : False,
                      "message": "Have some system errors"}

    def get_paid_history(self, user_id):
         """
            lấy lịch sử của tất cả các giỏ hàng đã thanh toán

            đầu vào là mã người dùng

            đầu ra là một dictionary chứa trong đó là mã giỏ hàng mỗi giỏ hàng lại chứa danh sách (tên + mã + đường dẫn ảnh) của riêng mỗi sản phẩm
         """
         try:
              query = """
                    SELECT c.order_batch_id, p.ID, p.ProductDisplayName, p.ImagePath
                    FROM cart_items c
                    JOIN product_metadata p ON c.product_id = p.ID
                    WHERE c.user_id = %s AND c.status = 'Paid'
                    ORDER BY c.added_at DESC
                    """
              self.cur.execute(query, (user_id, ))
              rows = self.cur.fetchall()

              history = {}
              for row in rows:
                batch_id = row[0]
                item = {"product_id": row[1],
                           "name" : row[2],
                           "image": row[3]}
                   
                if batch_id not in history:
                        history[batch_id] = []
                history[batch_id].append(item)

              return history
         except Exception as e:
              print(f"Error: {e}")
              return {}
         
    def remove_from_cart(self, user_id, product_id):
         """
            Xóa một sản phẩm ở giỏ hàng chưa thanh toán 

            đầu vào là user_id, product_id

            return True hoặc False
         """
         try:
             query = """ DELETE FROM cart_items WHERE user_id = %s AND product_id = %s AND status =  'Unpaid'
                """
             self.cur.execute(query, (user_id, product_id))
             self.db.commit()
             return True
         except Exception as e:
              self.db.rollback()
              print(f"Error: {e}")
              return False 
         
    def toggle_product_status(self, product_id, is_active):
         """
         hàm cập nhật trạng thái cho sản phẩm để xem nó có thể bán được hay không
         
         :param product_id: mã sản phẩm
         :param is_active: trạng thái sẽ bán hay ko (TRUE, FALSE)

         return True hoặc False
         """
         try:
              query = """ UPDATE product_metadata SET is_active = %s
                            WHERE ID = %s
                """
              self.cur.execute(query, (is_active, product_id))
              self.db.commit()
              return True
         except Exception as e:
              self.db.rollback()
              print(f"Error: {e}")
              return False
         
    def get_products_by_brand_id(self, brand_id: str):
        """
        Lấy toàn bộ danh sách sản phẩm của một chủ shop (brand_id).
        """
        try:
            query = """
                SELECT * FROM product_metadata
                WHERE brand_id = %s 
                ORDER BY id DESC;
            """
            self.cur.execute(query, (brand_id,))
            rows = self.cur.fetchall()
            return rows
        except Exception as e:
            print(f"Lỗi khi lấy danh sách sản phẩm theo brand_id: {e}")
            return []
    
    def insert_brand_product(self, product_data: dict, image_path: str, brand_id: str):
        """
        Thêm mới sản phẩm do Brand đăng tải. Tách biệt với ETL Pipeline.
        """
        try:
            query = """
                INSERT INTO product_metadata 
                        (ID, Gender, MasterCategory, SubCategory, ArticleType, BaseColour, Season, Year, Usage, ProductDisplayName, ImagePath, brand_id)
                        VALUES (%(ID)s, %(Gender)s, %(MasterCategory)s, %(SubCategory)s, %(ArticleType)s, %(BaseColour)s, %(Season)s, %(Year)s, %(Usage)s, %(ProductDisplayName)s, %(ImagePath)s, %(brand_id)s)
            """
            data_to_insert = product_data.copy()
            data_to_insert['ImagePath'] = image_path
            data_to_insert['brand_id'] = brand_id
            
            self.cur.execute(query, data_to_insert)
            self.db.commit()
            return True
                
        except Exception as e:
            print(f"Lỗi khi Brand thêm sản phẩm mới: {e}")
            self.db.rollback()
            return False