from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Doctor, Department
from app.schemas import Token, LoginRequest, UserCreate, UserOut
from app.auth.security import verify_password, create_access_token, get_current_user, get_password_hash
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    if clean_email == "dr.subhash@sanakahospital.com":
        clean_email = "dr.subhashish@sanakahospital.com"

    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated. Please contact Sanaka Hospital Administration."
        )
        
    doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
    doctor_id = doctor.id if doctor else None
    dept_id = doctor.department_id if doctor else None
    dept_name = doctor.department.name if doctor and doctor.department else None

    token_data = {
        "sub": user.email,
        "user_id": user.id,
        "role": user.role,
        "full_name": user.full_name
    }
    access_token = create_access_token(token_data)
    
    log_audit_event(
        db=db,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details=f"User {user.email} logged in with role {user.role}",
        user=user
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "doctor_id": doctor_id,
        "department_id": dept_id,
        "department_name": dept_name
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    user_out = UserOut.from_orm(current_user)
    user_out.doctor_id = doctor.id if doctor else None
    return user_out
