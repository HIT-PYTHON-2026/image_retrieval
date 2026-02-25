from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.database.postgres_client import PostgreSQL
from src.core.services.auth_service import AuthService

import uuid
router = APIRouter()
db = PostgreSQL()
auth_service = AuthService()


"""
    API cho việc đăng kí và đăng nhập của người dùng
"""
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    gender: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/api/v1/register", tags=["Authentication"])
async def register(request: RegisterRequest):
    """
        hàm đăng kí cho người dùng
        tính năng:
        - có check xem Email tồn tại hay chưa
        - trả về thông báo đăng kí thành công nếu đăng kí được
        - trả về lỗi nếu có lỗi hệ thống
    """
    try:
        results = db.get_user_by_email(request.email)
        if results is not None:
            raise HTTPException(status_code= 400, detail= "Email already exists")
        
        hashed_pw = auth_service.get_password_hash(request.password)

        user_id = str(uuid.uuid4())

        check = db.create_user(
            user_id= user_id,
            email= request.email,
            password_hash= hashed_pw,
            full_name= request.full_name,
            role= request.role,
            gender= request.gender
        )

        if check:
            return {"message": "Register successfully"}
        else:
            raise HTTPException(status_code= 500, detail=  "System error when save user information")
        
    except HTTPException:
        raise # Bắt lại lỗi HTTP để ném cho Frontend
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/api/v1/login", tags=["Authentication"])
async def login(request: LoginRequest):
    """
        API cho việc đăng nhập
        các tính năng

        - kiểm tra xem email có tồn tại hay ko
        - nếu đăng nhập thành công sẽ trả ra danh sách thông tin người dùng (phục vụ cho các mục đích sau này)
    """
    try:
        results = db.get_user_by_email(request.email)

        if results is None:
            raise HTTPException(status_code= 404, detail="Email does not exist")
        
        if auth_service.verify_password(request.password, results['password_hash']):
            return {"message": "Login successfully", 
                    "user_infor": {
                            "user_id": results['userID'],
                            "full_name": results['full_name'],
                            "role": results['role'],
                            "gender": results['gender']
                        }
                    }

        raise HTTPException(status_code= 400, detail= "Wrong password")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail= "Internal Sever Error")