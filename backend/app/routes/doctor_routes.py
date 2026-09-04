from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Doctor, Department, User
from app.schemas import DoctorOut
from app.auth.security import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("", response_model=List[DoctorOut])
def get_doctors(
    department_id: Optional[int] = None,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor).join(User).filter(User.is_active == True)
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if available_only:
        query = query.filter(Doctor.is_available == True)
        
    doctors = query.all()
    results = []
    for doc in doctors:
        results.append(DoctorOut(
            id=doc.id,
            user_id=doc.user_id,
            full_name=doc.user.full_name,
            email=doc.user.email,
            department_id=doc.department_id,
            department_name=doc.department.name if doc.department else "General",
            specialization=doc.specialization,
            qualification=doc.qualification,
            room_number=doc.room_number,
            contact_number=doc.contact_number,
            reg_number=doc.reg_number,
            is_available=doc.is_available
        ))
    return results

@router.get("/{doc_id}", response_model=DoctorOut)
def get_doctor(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return DoctorOut(
        id=doc.id,
        user_id=doc.user_id,
        full_name=doc.user.full_name,
        email=doc.user.email,
        department_id=doc.department_id,
        department_name=doc.department.name if doc.department else "General",
        specialization=doc.specialization,
        qualification=doc.qualification,
        room_number=doc.room_number,
        contact_number=doc.contact_number,
        reg_number=doc.reg_number,
        is_available=doc.is_available
    )
