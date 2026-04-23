from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import game_router, websocket_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game_router.router, prefix=settings.API_V1_STR)
app.include_router(websocket_router.router)

@app.get("/")
async def root():
    return {"message": "Nexus Protocol Backend Running"}