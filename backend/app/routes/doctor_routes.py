from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Doctor, Department, User, Appointment, PatientCase, Prescription
from app.schemas import DoctorOut, DoctorCreate, DoctorUpdate
from app.auth.security import get_current_user, require_role, get_password_hash
from app.services.audit_service import log_audit_event

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

@router.post("", response_model=DoctorOut)
def create_doctor(
    doc_in: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    # Check if email is already taken
    existing_user = db.query(User).filter(User.email == doc_in.email.strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User email already exists in system")

    # Verify department exists
    dept = db.query(Department).filter(Department.id == doc_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Specified department does not exist")

    # Create user
    pwd = doc_in.password if doc_in.password else "Doctor@2026"
    user = User(
        email=doc_in.email.strip().lower(),
        full_name=doc_in.full_name.strip(),
        role="doctor",
        hashed_password=get_password_hash(pwd),
        is_active=True
    )
    db.add(user)
    db.flush()

    # Create doctor profile
    doctor = Doctor(
        user_id=user.id,
        department_id=dept.id,
        specialization=doc_in.specialization.strip(),
        qualification=doc_in.qualification.strip(),
        room_number=doc_in.room_number.strip() if doc_in.room_number else "OPD Wing",
        contact_number=doc_in.contact_number.strip() if doc_in.contact_number else None,
        reg_number=doc_in.reg_number.strip() if doc_in.reg_number else None,
        is_available=doc_in.is_available
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    log_audit_event(
        db=db,
        action="CREATE_DOCTOR",
        entity_type="Doctor",
        entity_id=str(doctor.id),
        details=f"Added doctor Dr. {doctor.user.full_name} ({doctor.specialization}) in {dept.name}",
        user=current_user
    )

    return DoctorOut(
        id=doctor.id,
        user_id=doctor.user_id,
        full_name=doctor.user.full_name,
        email=doctor.user.email,
        department_id=doctor.department_id,
        department_name=dept.name,
        specialization=doctor.specialization,
        qualification=doctor.qualification,
        room_number=doctor.room_number,
        contact_number=doctor.contact_number,
        reg_number=doctor.reg_number,
        is_available=doctor.is_available
    )

@router.put("/{doc_id}", response_model=DoctorOut)
def update_doctor(
    doc_id: int,
    doc_in: DoctorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "doctor"]))
):
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # If doctor is updating, ensure they only update their own profile unless admin
    if current_user.role == "doctor" and doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit other doctors")

    # Update User fields (Name, Email, Password)
    if doc_in.full_name is not None and doc.user:
        doc.user.full_name = doc_in.full_name.strip()
    if doc_in.email is not None and doc.user:
        # Check uniqueness if changed
        new_email = doc_in.email.strip().lower()
        if new_email != doc.user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already used by another account")
            doc.user.email = new_email
    if doc_in.password and doc.user:
        doc.user.hashed_password = get_password_hash(doc_in.password)

    # Update Doctor fields
    if doc_in.department_id is not None:
        dept = db.query(Department).filter(Department.id == doc_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid department ID")
        doc.department_id = doc_in.department_id
    if doc_in.specialization is not None:
        doc.specialization = doc_in.specialization.strip()
    if doc_in.qualification is not None:
        doc.qualification = doc_in.qualification.strip()
    if doc_in.room_number is not None:
        doc.room_number = doc_in.room_number.strip()
    if doc_in.contact_number is not None:
        doc.contact_number = doc_in.contact_number.strip()
    if doc_in.reg_number is not None:
        doc.reg_number = doc_in.reg_number.strip()
    if doc_in.is_available is not None:
        doc.is_available = doc_in.is_available

    db.commit()
    db.refresh(doc)

    log_audit_event(
        db=db,
        action="UPDATE_DOCTOR",
        entity_type="Doctor",
        entity_id=str(doc.id),
        details=f"Updated details for Dr. {doc.user.full_name}",
        user=current_user
    )

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

@router.delete("/{doc_id}")
def delete_doctor(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doc_name = doc.user.full_name if doc.user else f"Doctor ID {doc_id}"
    user_id = doc.user_id

    # Check if doctor has cases or appointments
    has_cases = db.query(PatientCase).filter(PatientCase.doctor_id == doc_id).first()
    has_appts = db.query(Appointment).filter(Appointment.doctor_id == doc_id).first()
    has_rx = db.query(Prescription).filter(Prescription.doctor_id == doc_id).first()

    if has_cases or has_appts or has_rx:
        # If doctor has historical medical cases, deactivate user and doctor to protect clinical data integrity
        doc.is_available = False
        if doc.user:
            doc.user.is_active = False
        db.commit()
        clean_name = doc_name if doc_name.startswith("Dr.") else f"Dr. {doc_name}"
        action_detail = f"Deactivated {clean_name} (Preserved clinical records)"
    else:
        # Safe to delete completely
        db.delete(doc)
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                db.delete(user)
        db.commit()
        clean_name = doc_name if doc_name.startswith("Dr.") else f"Dr. {doc_name}"
        action_detail = f"Permanently deleted doctor {clean_name}"

    log_audit_event(
        db=db,
        action="DELETE_DOCTOR",
        entity_type="Doctor",
        entity_id=str(doc_id),
        details=action_detail,
        user=current_user
    )

    return {"message": action_detail, "doctor_id": doc_id}

