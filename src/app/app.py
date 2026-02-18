from fastapi import FastAPI, File, UploadFile
import uvicorn

from src.core.services.search_service import SearchService

app = FastAPI(title= "Fashion Image Retrival API")

service = SearchService()

# http://127.0.0.1:8000/docs#/default/search_images_api_v1_search_post

@app.post("/api/v1/search")
async def search_images(image_upload: UploadFile = File(...)):
    try:
        image_bytes = await image_upload.read()

        results = service.search_image(userID = "user_test_01", image_query= image_bytes)

        return results 
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    
    uvicorn.run("src.app.app:app", host= "0.0.0.0",  port= 8000, reload= True)




