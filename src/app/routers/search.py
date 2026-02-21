from fastapi import APIRouter, File, UploadFile, Form, HTTPException

from src.core.services.search_service import SearchService
from src.core.services.validate_image_service import Validate_Image_Service

import numpy as np

router = APIRouter()

service_search = SearchService()
val = Validate_Image_Service()


@router.post("/api/v1/search", tags=["AI Search"])
async def search_product_by_image(
        user_id: str = Form(...), # id gửi đi kèm 
        file: UploadFile = File(...) # ảnh yêu cầu
    ):
    try:
        image_bytes = await file.read()

        is_valid, message, img_np = val.validate(image_bytes, file.filename)

        if not is_valid:
            raise HTTPException(status_code=400, detail= message)
        
        results = service_search.search_image(user_id, image_bytes)

        return {
            "message" : "Found successfully",
            "data": results
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code= 500, detail= "System error when process image")








