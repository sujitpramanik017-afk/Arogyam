import os
from urllib.parse import quote_plus
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
default_db_file = (BASE_DIR / "sanaka_hospital.db").as_posix()

def resolve_database_url() -> str:
    # 1. Direct DATABASE_URL or POSTGRES_URL / SUPABASE_DB_URL
    raw_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("SUPABASE_DB_URL")
    is_vercel = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("LAMBDA_TASK_ROOT"))
    if raw_url and raw_url.strip():
        url = raw_url.strip()
        # Detect unreplaced password placeholder from Supabase UI template
        if "[YOUR-PASSWORD]" in url or "<password>" in url.lower():
            print("[NOTICE] Supabase DATABASE_URL contains placeholder password [YOUR-PASSWORD]. Please replace with your actual Supabase database password.")
            if not is_vercel:
                return f"sqlite:///{default_db_file}"
        else:
            # SQLAlchemy 2.0+ requires postgresql:// instead of postgres://
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url

    # 2. Separate credentials (DB_* or DATABASE_*)
    db_name = os.getenv("DB_NAME") or os.getenv("DATABASE_NAME")
    db_user = os.getenv("DB_USER") or os.getenv("DATABASE_USER")
    db_password = os.getenv("DB_PASSWORD") or os.getenv("DATABASE_PASSWORD")
    db_host = os.getenv("DB_HOST") or os.getenv("DATABASE_HOST")
    db_port = os.getenv("DB_PORT") or os.getenv("DATABASE_PORT") or "5432"

    if db_name and db_user and db_password and db_host:
        encoded_user = quote_plus(db_user)
        encoded_password = quote_plus(db_password)
        return f"postgresql://{encoded_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"

    # 3. Serverless / Vercel fallback: copy SQLite to writable /tmp
    if is_vercel:
        import shutil
        tmp_db = "/tmp/sanaka_hospital.db"
        if not os.path.exists(tmp_db) and os.path.exists(default_db_file):
            try:
                shutil.copyfile(default_db_file, tmp_db)
            except Exception as copy_err:
                print(f"[Vercel] Notice copying SQLite to /tmp: {copy_err}")
        print("[WARNING] DATABASE_URL is not configured in Vercel environment variables! Using writable /tmp/sanaka_hospital.db. Connect Supabase PostgreSQL in Vercel settings to permanently persist data.")
        return f"sqlite:///{tmp_db}"

    # 4. Local fallback to SQLite database file
    return f"sqlite:///{default_db_file}"


class Settings:
    PROJECT_NAME = "Arogyam Hospital Patient Case-Taking System"
    PROJECT_VERSION = "1.0.0"
    API_V1_STR = "/api"
    
    HOSPITAL_NAME = "Arogyam Hospital"
    HOSPITAL_UNIT = "Arogyam Institute of Medical Sciences"
    HOSPITAL_TRUST = "Arogyam Healthcare Trust"
    HOSPITAL_LOCATION = "Salt Lake City, Kolkata, West Bengal, India"
    HOSPITAL_PHONE = "+91 33 2321 0000 / 0001"
    HOSPITAL_EMAIL = "info@arogyamhospital.com"
    
    SECRET_KEY = os.getenv("SECRET_KEY", "sanaka_medical_jwt_secret_key_sih2026_case_taking_secure_98374921")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
    
    DATABASE_URL = resolve_database_url()
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

settings = Settings()

