import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routes.auth_routes import router as auth_router
from app.routes.patient_routes import router as patient_router
from app.routes.case_routes import router as case_router
from app.routes.appointment_routes import router as appointment_router
from app.routes.prescription_routes import router as prescription_router
from app.routes.doctor_routes import router as doctor_router
from app.routes.department_routes import router as department_router
from app.routes.ai_routes import router as ai_router
from app.routes.admin_routes import router as admin_router
from app.routes.patient_portal_routes import router as patient_portal_router
from app.utils.seed_data import seed_database

# Initialize database tables and bootstrap admin/departments if new database
try:
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:////", "/").replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        print("[Sanaka EMR] Running with local SQLite database")
    else:
        # PostgreSQL / Supabase
        masked_url = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "PostgreSQL"
        print(f"[Sanaka EMR] Connected to PostgreSQL host: {masked_url}")

    Base.metadata.create_all(bind=engine)
    seed_database()
except Exception as e:
    print(f"[Sanaka EMR] Database initialization notice: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Sanaka Hospital Patient Case-Taking & Medical Record System (SIH26047)"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(patient_router, prefix=settings.API_V1_STR)
app.include_router(case_router, prefix=settings.API_V1_STR)
app.include_router(appointment_router, prefix=settings.API_V1_STR)
app.include_router(prescription_router, prefix=settings.API_V1_STR)
app.include_router(doctor_router, prefix=settings.API_V1_STR)
app.include_router(department_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(patient_portal_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "hospital": settings.HOSPITAL_NAME,
        "unit": settings.HOSPITAL_UNIT,
        "trust": settings.HOSPITAL_TRUST,
        "location": settings.HOSPITAL_LOCATION,
        "status": "Operational",
        "version": settings.PROJECT_VERSION,
        "api_docs": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Sanaka Hospital EMR API"}
