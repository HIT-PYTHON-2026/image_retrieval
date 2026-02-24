from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from src.core.database.postgres_client import PostgreSQL

router = APIRouter()
db = PostgreSQL()

class RatingRequest(BaseModel):
    user_id: str
    product_id: int
    rating: int

@router.get("/v1/history/search/{user_id}", tags=["User Activity"])
async def get_search_history(user_id: str):
    """
    Lấy lịch sử tìm kiếm ảnh AI của người dùng.trả về danh sách các lần tìm kiếm (ảnh query, kết quả, thời gian).
    """
    try:
        results = db.get_search_history(user_id)
        return {"message": "Lấy lịch sử thành công", "data": results}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lấy lịch sử tìm kiếm")



@router.get("/v1/history/orders/{user_id}", tags=["User Activity"])
async def get_order_history(user_id: str):
    """
    Lấy lịch sử mua hàng (các đơn đã thanh toán) của người dùng.
    - Kết quả được gom nhóm theo mã đơn hàng (order_batch_id).

    """
    try:
        results = db.get_paid_history(user_id)
        return {"message": "Lấy lịch sử đơn hàng thành công", "data": results}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lấy lịch sử đơn hàng")



@router.post("/v1/rating", tags=["User Activity"])
async def rate_product(request: RatingRequest):
    """
    Đánh giá sản phẩm (1-5 sao): nếu user chưa đánh giá sản phẩm này: thêm mới. nếu user đã đánh giá rồi: cập nhật và tính lại điểm trung bình.
    """
    if request.rating < 1 or request.rating > 5:
        raise HTTPException(status_code=400, detail="Điểm đánh giá phải nằm trong khoảng từ 1 đến 5")

    try:
        success = db.update_rating(request.user_id, request.product_id, request.rating)

        if success:
            return {"message": "Đánh giá sản phẩm thành công!"}
        else:
            raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lưu đánh giá")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lưu đánh giá")

