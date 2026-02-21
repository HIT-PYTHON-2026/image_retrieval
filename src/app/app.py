from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.app.routers.auth import router as auth_router
from src.app.routers.search import router as search_router

app = FastAPI(title= "Fashion image retrieval",
              description= "Backend system for fashion image retrieval by AI ",
              version= "1.0.0")

"""
    đây là file FastAPI sẽ kết nối tất cả các router còn lại
    chính là các tính năng sau này ta sẽ chạy ở file local
    nó sẽ trả về cái link thì thêm đôi /docs vào là test đc
"""


"""
    CORS Middleware 
    lớp bảo mật cho API (cho phép bên FE nào được truy cập, và đc truy cập những cái gì)
    mà đâu là dự án local nên để thoải mái
"""

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(auth_router, tags=["Authentication"])
app.include_router(search_router, tags=["AI Search"])

