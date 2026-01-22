from pydantic_settings import BaseSettings


# This part of th ecode connect API and DB
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://wimc:wimc2026@localhost:5432/wimc_db"

    class Config:
        env_file = ".env"


settings = Settings()
