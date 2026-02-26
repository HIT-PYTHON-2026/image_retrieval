from passlib.context import CryptContext

class AuthService:
    def __init__(self):
        """
        khởi tạo công cụ băm và xác thực mật khẩu
        sử dụng thuật toán 'bcrypt' 
        """
        try:
            self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")
        except Exception as e:
            print(f"Error: {e}")
    
    def get_password_hash(self, password):
        """
        hàm này lấy một mật khẩu rồi trả về một mật khẩu đã băm (để sau lưu vô database)
        """
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password, hashed_password):
        """
        hàm này trả về đúng sai
        kiểm tra mật khẩu vừa nhập so với mật khẩu mà đã băm ra lưu trong database
        """
        return self.pwd_context.verify(plain_password, hashed_password)
           
        