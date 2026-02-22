from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from pydantic import BaseModel
from src.core.services.validate_image_service import Validate_Image_Service
from src.core.services.brand_services import BrandService
from src.core.database.postgres_client import PostgreSQL

router = APIRouter()
brand_services = BrandService()
db = PostgreSQL()
validate = Validate_Image_Service()


class StatusUpdateRequest(BaseModel):
    is_active : bool
@router.get("/api/v1/brand/products", tags= ["Brand Management"])
async def get_history_brand(brand_id: str):
    try:
        results = db.get_products_by_brand_id(brand_id= brand_id) 

        if not results:
            return {"message": "Brand này chưa có sản phẩm nào", 
                    "data": []
                    }
        
        return {
            "message" : "Found list product successfully",
            "data": results
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code= 500, detail= "System error")


@router.put("/api/v1/brand/products/{product_id}/status", tags = ["Brand Management"])
async def update_product_status(product_id: int, request: StatusUpdateRequest):
    try:
        if db.toggle_product_status(product_id, request.is_active):
            return True, { 
                "message" : "Update status successfully"
            }
        raise HTTPException(status_code=400, detail="Không thể cập nhật trạng thái (Sản phẩm không tồn tại)")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code= 500, detail= "System error")


@router.post("/api/v1/brand/products/add_product", tags= ["Brand Management"])
async def add_new_product(
    product_id: int = Form(...),
    gender: str = Form(...),
    masterCategory: str = Form(...),
    subCategory: str = Form(...),
    articleType: str = Form(...),
    baseColour: str = Form(...),
    season: str = Form(...),
    year: int = Form(...),
    usage: str = Form(...),
    productDisplayName: str = Form(...),
    file: UploadFile = File(...),
    brand_id: str = Form(...)
):
    try:
        image_bytes = await file.read()

        is_valid, message, img_np = validate.validate(image_bytes, file.filename)

        if not is_valid:
            raise HTTPException(status_code=400, detail= message)

        image_infor = {
            "ID": product_id,
            "Gender": gender,
            "MasterCategory": masterCategory,
            "SubCategory": subCategory,
            "BaseColour": baseColour,
            "ArticleType":articleType,
            "Season": season,
            "Year": year,
            "Usage": usage,
            "ProductDisplayName": productDisplayName
        }

        if brand_services.process_new_product(image_bytes, image_infor, brand_id):
            return True, {
                "message": "add merchandise successfully"
            }
        return False
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code= 500, detail = "System error")
