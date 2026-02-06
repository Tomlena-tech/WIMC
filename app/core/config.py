from pydantic_settings import BaseSettings


# This part of th ecode connect API and DB (line 1&2)
class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://wimc:wimc2026@localhost:5432/wimc_db"
    SECRET_KEY: str = "lena0301"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    SECRET_KEY = "ton_secret_key_super_long_et_securise_ici_minimum_32_caracteres"

    class Config:
        env_file = ".env"


settings = Settings()
