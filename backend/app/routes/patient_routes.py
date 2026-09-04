from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import Patient, PatientCase, User
from app.schemas import PatientOut, PatientCreate
from app.auth.security import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/patients", tags=["Patients"])

def generate_next_patient_id(db: Session) -> str:
    current_year = datetime.datetime.now().year
    prefix = f"SAN-{current_year}-"
    # Find highest sequence
    last_patient = db.query(Patient).filter(Patient.patient_id.like(f"{prefix}%")).order_by(desc(Patient.id)).first()
    if last_patient:
        try:
            seq_str = last_patient.patient_id.replace(prefix, "")
            seq = int(seq_str) + 1
        except Exception:
            seq = db.query(Patient).count() + 1
    else:
        seq = 1
    return f"{prefix}{seq:05d}"

@router.get("/next-id")
def get_next_patient_id_preview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"next_patient_id": generate_next_patient_id(db)}

@router.get("", response_model=List[PatientOut])
def get_patients(
    search: Optional[str] = None,
    gender: Optional[str] = None,
    blood_group: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Patient)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search_pattern),
                Patient.patient_id.ilike(search_pattern),
                Patient.phone.ilike(search_pattern),
                Patient.city.ilike(search_pattern)
            )
        )
    if gender and gender != "All":
        query = query.filter(Patient.gender == gender)
    if blood_group and blood_group != "All":
        query = query.filter(Patient.blood_group == blood_group)
        
    patients = query.order_by(desc(Patient.created_at)).offset(offset).limit(limit).all()
    
    results = []
    for p in patients:
        cases_count = len(p.cases)
        latest_case = p.cases[0] if p.cases else None
        p_out = PatientOut.from_orm(p)
        p_out.total_visits = cases_count
        if latest_case:
            p_out.latest_case_date = latest_case.visit_date.strftime("%Y-%m-%d")
            p_out.latest_doctor_name = latest_case.doctor.user.full_name if latest_case.doctor else None
        results.append(p_out)
    return results

@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    
    p_out = PatientOut.from_orm(patient)
    p_out.total_visits = len(patient.cases)
    if patient.cases:
        p_out.latest_case_date = patient.cases[0].visit_date.strftime("%Y-%m-%d")
        p_out.latest_doctor_name = patient.cases[0].doctor.user.full_name if patient.cases[0].doctor else None
    return p_out

@router.post("", response_model=PatientOut)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check phone duplicate if required
    patient_custom_id = generate_next_patient_id(db)
    
    patient = Patient(
        patient_id=patient_custom_id,
        full_name=patient_in.full_name.strip(),
        dob=patient_in.dob,
        gender=patient_in.gender,
        phone=patient_in.phone.strip(),
        email=patient_in.email.strip() if patient_in.email else None,
        address=patient_in.address.strip(),
        city=patient_in.city or "Durgapur",
        state=patient_in.state or "West Bengal",
        pincode=patient_in.pincode or "713212",
        emergency_contact_name=patient_in.emergency_contact_name,
        emergency_contact_phone=patient_in.emergency_contact_phone,
        emergency_relation=patient_in.emergency_relation,
        blood_group=patient_in.blood_group,
        occupation=patient_in.occupation,
        known_allergies=patient_in.known_allergies
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    log_audit_event(
        db=db,
        action="REGISTER_PATIENT",
        entity_type="Patient",
        entity_id=str(patient.id),
        details=f"Registered patient {patient.full_name} with ID {patient.patient_id}",
        user=current_user
    )
    
    p_out = PatientOut.from_orm(patient)
    p_out.total_visits = 0
    return p_out

@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    for field, val in patient_in.dict().items():
        if val is not None:
            setattr(patient, field, val)
            
    db.commit()
    db.refresh(patient)
    
    log_audit_event(
        db=db,
        action="UPDATE_PATIENT",
        entity_type="Patient",
        entity_id=str(patient.id),
        details=f"Updated demographics for patient {patient.patient_id}",
        user=current_user
    )
    return PatientOut.from_orm(patient)
