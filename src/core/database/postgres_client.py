from src.utils.constants import ( PG_DB, PG_USER, PG_PASSWORD, PG_HOST, PG_PORT)

import psycopg2
           
class PostgreSQL:
    """
    Handles interactions with the PostgreSQL database for the Fashion Search project.

    This class manages:
    1. Connection to the PostgreSQL server.
    2. Initialization of database schemas (Products, Users, Ratings).
    3. CRUD operations for product metadata and user ratings.
    4. Complex logic for handling user rating updates (insert vs update).

    Attributes:
        db (psycopg2.extensions.connection): The active database connection.
        cur (psycopg2.extensions.cursor): The cursor for executing SQL queries.
    """
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
                                created_at TIMESTAMP CURRENT_TIMESTAP

                                CONSTRAINT fk_user_history
                                    FOREIGN KEY(userID)
                                    REFERENCES users(users_id)
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
    
    def update_rating(self, user_id, product_id, new_rating):
        try:
            check_query = """ SELECT rating FROM user_rating
                                WHERE userID = %s AND productID = %s
                        """
            self.cur.execute(check_query, (user_id, product_id))
            result = self.cur.fetchone()

            if result is None:
                print(f"User {user_id} rating new product {product_id}")

                insert_history = """INSERT INTO user_rating (userID, productID, rating) 
                                    VALUES (%s, %s, %s)"""
                self.cur.execute(insert_history, (user_id, product_id, new_rating))

                update_product = """ UPDATE product_metadata
                                SET Total_Rating_Score = Total_Rating_Score + %s,
                                    Rating_Count = Rating_Count + 1
                                WHERE ID = %s
                """
                self.cur.execute(update_product, (new_rating, product_id))
            else:
                old_rating = result[0]

                if(old_rating == new_rating):
                    print("Rating unchanged.")
                    return True
                
                print(f"User {user_id} updating rating from {old_rating} to {new_rating}")

                
                update_history = "UPDATE user_ratings SET rating = %s WHERE user_id = %s AND product_id = %s"
                self.cur.execute(update_history, (new_rating, user_id, product_id))
                
                delta = new_rating - old_rating
                
                update_product = """
                    UPDATE product_metadata 
                    SET total_rating_score = total_rating_score + %s
                    WHERE id = %s
                """
                self.cur.execute(update_product, (delta, product_id))
                      
            self.db.commit()
            print("Rating updated successfully")     
        except Exception as e:
            self.db.rollback()
            print(f"Error: {e}")
            return False
    
    def search_history(self, user_id, query_image_path, results_id ):
        try:
            import json
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
            print(f"Error : {e}")
            return False