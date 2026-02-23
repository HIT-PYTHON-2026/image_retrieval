from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.core.database.postgres_client import PostgreSQL

router = APIRouter()
db = PostgreSQL()

class CartActionRequest(BaseModel):
    user_id: str
    product_id: int

class CheckoutRequest(BaseModel):
    user_id: str

@router.post("/v1/cart", tags=["Cart"])
async def add_to_cart(request: CartActionRequest):
    """Thêm sản phẩm vào giỏ hàng"""
    try:
        if db.add_to_cart(request.user_id, request.product_id):
            return {"message": "Thêm vào giỏ hàng thành công"}
        
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi thêm sản phẩm")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/v1/cart/{user_id}", tags=["Cart"])
async def get_active_cart(user_id: str):
    """Xem giỏ hàng hiện tại"""
    try:
        result = db.get_active_cart(user_id)
        return {"message": "Thành công", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/v1/cart/{user_id}/{product_id}", tags=["Cart"])
async def remove_from_cart(user_id: str, product_id: int):
    """ Xóa một món hàng khỏi giỏ"""
    try:
        if db.remove_from_cart(user_id, product_id):
            return {"message": "Đã xóa sản phẩm khỏi giỏ"}
        
        raise HTTPException(status_code=400, detail="Không thể xóa sản phẩm")
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/cart/checkout", tags=["Cart"])
async def checkout_cart(request: CheckoutRequest):
    """Thanh toán giỏ hàng"""
    try:
        result = db.checkout_cart(request.user_id)
        
        if result.get("success"):
            return result
        
        raise HTTPException(status_code=400, detail=result)
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))