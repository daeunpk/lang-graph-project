from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexus Protocol API"
    API_V1_STR: str = "/api"
    # 다음 단계에서 LangGraph 연동 시 사용
    OPENAI_API_KEY: str = "your-key-here"
    
    class Config:
        env_file = ".env"

settings = Settings()