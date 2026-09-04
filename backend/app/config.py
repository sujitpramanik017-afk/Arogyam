import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "Sanaka Hospital Patient Case-Taking System"
    PROJECT_VERSION = "1.0.0"
    API_V1_STR = "/api"
    
    HOSPITAL_NAME = "Sanaka Hospital"
    HOSPITAL_UNIT = "Shri Ramkrishna Institute of Medical Sciences"
    HOSPITAL_TRUST = "A Unit of Sanaka Educational Trust"
    HOSPITAL_LOCATION = "Malandighi, Durgapur, West Bengal - 713212"
    HOSPITAL_PHONE = "+91 343 252 2222 / 252 2223"
    HOSPITAL_EMAIL = "info@sanakahospital.com"
    
    SECRET_KEY = os.getenv("SECRET_KEY", "sanaka_medical_jwt_secret_key_sih2026_case_taking_secure_98374921")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
    
    is_vercel = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    default_db = "sqlite:////tmp/sanaka_hospital.db" if is_vercel else "sqlite:///./sanaka_hospital.db"
    DATABASE_URL = os.getenv("DATABASE_URL", default_db)
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
