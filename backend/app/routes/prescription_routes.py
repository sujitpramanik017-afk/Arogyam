from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Prescription, PrescriptionItem, Patient, Doctor, User
from app.schemas import PrescriptionOut, PrescriptionCreate
from app.auth.security import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("", response_model=List[PrescriptionOut])
def get_prescriptions(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Prescription)
    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
        
    rx_list = query.order_by(Prescription.created_at.desc()).all()
    results = []
    for r in rx_list:
        doc_name = r.doctor.user.full_name if r.doctor and r.doctor.user else "Doctor"
        dept_name = r.doctor.department.name if r.doctor and r.doctor.department else "General"
        r_out = PrescriptionOut.from_orm(r)
        r_out.doctor_name = doc_name
        r_out.department_name = dept_name
        results.append(r_out)
    return results

@router.get("/{rx_id}", response_model=PrescriptionOut)
def get_prescription(rx_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rx = db.query(Prescription).filter(Prescription.id == rx_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    r_out = PrescriptionOut.from_orm(rx)
    r_out.doctor_name = rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Doctor"
    r_out.department_name = rx.doctor.department.name if rx.doctor and rx.doctor.department else "General"
    return r_out
