from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Appointment, Patient, Doctor, Department, User
from app.schemas import AppointmentOut, AppointmentCreate, AppointmentStatusUpdate
from app.auth.security import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("", response_model=List[AppointmentOut])
def get_appointments(
    date: Optional[str] = None,
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment)
    if date:
        query = query.filter(Appointment.appointment_date == date)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if department_id:
        query = query.filter(Appointment.department_id == department_id)
    if status and status != "All":
        query = query.filter(Appointment.status == status)
        
    appts = query.order_by(Appointment.appointment_date.desc(), Appointment.token_number.asc()).limit(limit).all()
    
    results = []
    for a in appts:
        results.append(AppointmentOut(
            id=a.id,
            patient_id=a.patient_id,
            doctor_id=a.doctor_id,
            department_id=a.department_id,
            appointment_date=a.appointment_date,
            time_slot=a.time_slot,
            token_number=a.token_number,
            reason_for_visit=a.reason_for_visit,
            status=a.status,
            created_at=a.created_at,
            patient_name=a.patient.full_name if a.patient else "Unknown",
            patient_custom_id=a.patient.patient_id if a.patient else "SAN-00000",
            patient_gender=a.patient.gender if a.patient else "",
            patient_dob=a.patient.dob if a.patient else "",
            patient_phone=a.patient.phone if a.patient else "",
            doctor_name=a.doctor.full_name if a.doctor else "Doctor",
            department_name=a.department.name if a.department else "General"
        ))
    return results

@router.post("", response_model=AppointmentOut)
def create_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == appt_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    doctor = db.query(Doctor).filter(Doctor.id == appt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    existing_tokens = db.query(Appointment).filter(
        Appointment.doctor_id == appt_in.doctor_id,
        Appointment.appointment_date == appt_in.appointment_date
    ).count()
    token_num = existing_tokens + 1
    
    dept_id = appt_in.department_id or (doctor.department_id if doctor else 1) or 1
    
    appt = Appointment(
        patient_id=appt_in.patient_id,
        doctor_id=appt_in.doctor_id,
        department_id=dept_id,
        appointment_date=appt_in.appointment_date,
        time_slot=appt_in.time_slot,
        token_number=token_num,
        reason_for_visit=appt_in.reason_for_visit,
        status="scheduled"
    )
    try:
        db.add(appt)
        db.commit()
        db.refresh(appt)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error creating appointment: {str(e)}")
    
    log_audit_event(
        db=db,
        action="BOOK_APPOINTMENT",
        entity_type="Appointment",
        entity_id=str(appt.id),
        details=f"Booked token #{token_num} for {patient.full_name} with Dr. {doctor.full_name}",
        user=current_user
    )
    
    return AppointmentOut(
        id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        department_id=appt.department_id,
        appointment_date=appt.appointment_date,
        time_slot=appt.time_slot,
        token_number=appt.token_number,
        reason_for_visit=appt.reason_for_visit,
        status=appt.status,
        created_at=appt.created_at,
        patient_name=patient.full_name,
        patient_custom_id=patient.patient_id,
        patient_gender=patient.gender,
        patient_dob=patient.dob,
        patient_phone=patient.phone,
        doctor_name=doctor.full_name,
        department_name=doctor.department.name if doctor.department else "General"
    )

@router.patch("/{appt_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appt_id: int,
    status_update: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt = db.query(Appointment).filter(Appointment.id == appt_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appt.status = status_update.status
    db.commit()
    db.refresh(appt)
    
    log_audit_event(
        db=db,
        action="UPDATE_APPOINTMENT_STATUS",
        entity_type="Appointment",
        entity_id=str(appt.id),
        details=f"Appointment #{appt.id} changed to {appt.status}",
        user=current_user
    )
    
    return AppointmentOut(
        id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        department_id=appt.department_id,
        appointment_date=appt.appointment_date,
        time_slot=appt.time_slot,
        token_number=appt.token_number,
        reason_for_visit=appt.reason_for_visit,
        status=appt.status,
        created_at=appt.created_at,
        patient_name=appt.patient.full_name if appt.patient else "Patient",
        patient_custom_id=appt.patient.patient_id if appt.patient else "",
        patient_gender=appt.patient.gender if appt.patient else "",
        patient_dob=appt.patient.dob if appt.patient else "",
        patient_phone=appt.patient.phone if appt.patient else "",
        doctor_name=appt.doctor.full_name if appt.doctor else "Doctor",
        department_name=appt.department.name if appt.department else "General"
    )
