from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from pydantic import BaseModel
import datetime
from app.database import get_db
from app.models import Patient, Doctor, Department, Appointment, PatientCase, MedicalHistory, Prescription, PrescriptionItem, AuditLog
from app.routes.patient_routes import generate_next_patient_id
from app.routes.case_routes import generate_next_case_number
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/patient-portal", tags=["Patient Portal (Public)"])

class PatientSelfBookingRequest(BaseModel):
    # Demographics
    full_name: str
    dob: str
    gender: str
    phone: str
    email: Optional[str] = None
    address: str
    city: Optional[str] = "Durgapur"
    state: Optional[str] = "West Bengal"
    pincode: Optional[str] = "713212"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    known_allergies: Optional[str] = None
    
    # Pre-consultation / Intake Data for Doctor
    chief_complaint: str
    chief_complaint_duration: Optional[str] = None
    present_illness_history: Optional[str] = None
    past_diseases: Optional[str] = None
    current_medications: Optional[str] = None
    
    # Booking Details
    doctor_id: int
    department_id: Optional[int] = None
    appointment_date: str # YYYY-MM-DD
    time_slot: str

class PatientLookupRequest(BaseModel):
    identifier: str # Phone number or SAN-2026-XXXXX

@router.post("/book-appointment")
def book_appointment_self(payload: PatientSelfBookingRequest, db: Session = Depends(get_db)):
    # 1. Check if patient already exists by phone
    patient = db.query(Patient).filter(Patient.phone == payload.phone.strip()).first()
    
    if not patient:
        patient_id_custom = generate_next_patient_id(db)
        patient = Patient(
            patient_id=patient_id_custom,
            full_name=payload.full_name.strip(),
            dob=payload.dob,
            gender=payload.gender,
            phone=payload.phone.strip(),
            email=payload.email.strip() if payload.email else None,
            address=payload.address.strip(),
            city=payload.city or "Durgapur",
            state=payload.state or "West Bengal",
            pincode=payload.pincode or "713212",
            emergency_contact_name=payload.emergency_contact_name,
            emergency_contact_phone=payload.emergency_contact_phone,
            emergency_relation="Family",
            blood_group=payload.blood_group,
            known_allergies=payload.known_allergies or "None reported",
        )
        db.add(patient)
        db.flush()
    else:
        # Update allergies or details if supplied
        if payload.known_allergies:
            patient.known_allergies = payload.known_allergies
            
    # 2. Verify Doctor
    doctor = db.query(Doctor).filter(Doctor.id == payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Selected doctor not found")
        
    dept_id = payload.department_id or doctor.department_id
    
    # 3. Compute token number
    existing_tokens = db.query(Appointment).filter(
        Appointment.doctor_id == payload.doctor_id,
        Appointment.appointment_date == payload.appointment_date
    ).count()
    token_num = existing_tokens + 1
    
    # 4. Create appointment
    appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=dept_id,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        token_number=token_num,
        reason_for_visit=f"Online Self-Booking: {payload.chief_complaint}",
        status="checked_in" # Instantly checked-in so it appears in Doctor's live active queue
    )
    db.add(appt)
    db.flush()
    
    # 5. Pre-create a draft clinical case sheet with the patient's submitted data
    case_num = generate_next_case_number(db)
    new_case = PatientCase(
        case_number=case_num,
        patient_id=patient.id,
        doctor_id=doctor.id,
        department_id=dept_id,
        visit_date=datetime.datetime.utcnow(),
        status="draft",
        chief_complaint=payload.chief_complaint,
        chief_complaint_duration=payload.chief_complaint_duration,
        present_illness_history=payload.present_illness_history or f"Patient self-reported complaint online: {payload.chief_complaint}",
        raw_notes=f"Online Patient Intake Data: Past Diseases: {payload.past_diseases or 'None'}; Current Meds: {payload.current_medications or 'None'}"
    )
    db.add(new_case)
    db.flush()
    
    # Add medical history if supplied
    if payload.past_diseases or payload.current_medications or payload.known_allergies:
        med_hist = MedicalHistory(
            case_id=new_case.id,
            past_diseases=payload.past_diseases,
            current_medications=payload.current_medications,
            drug_allergies=payload.known_allergies
        )
        db.add(med_hist)
        
    db.commit()
    db.refresh(patient)
    db.refresh(appt)
    db.refresh(new_case)
    
    # Log Audit
    log_audit_event(
        db=db,
        action="ONLINE_PATIENT_BOOKING",
        entity_type="Appointment",
        entity_id=str(appt.id),
        details=f"Patient {patient.full_name} ({patient.patient_id}) self-booked Token #{token_num} with Dr. {doctor.user.full_name}"
    )
    
    return {
        "success": True,
        "message": "Appointment scheduled successfully! Your medical intake data has been sent to the doctor.",
        "patient_id": patient.patient_id,
        "patient_name": patient.full_name,
        "token_number": token_num,
        "doctor_name": doctor.user.full_name,
        "department_name": doctor.department.name if doctor.department else "General",
        "appointment_date": appt.appointment_date,
        "time_slot": appt.time_slot,
        "case_id": new_case.id
    }

@router.post("/my-records")
def get_patient_records_self(payload: PatientLookupRequest, db: Session = Depends(get_db)):
    term = payload.identifier.strip()
    patient = db.query(Patient).filter(
        (Patient.phone == term) | (Patient.patient_id == term)
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="No patient record found matching phone number or Patient ID")
        
    appts = db.query(Appointment).filter(Appointment.patient_id == patient.id).order_by(desc(Appointment.appointment_date)).all()
    cases = db.query(PatientCase).filter(PatientCase.patient_id == patient.id).order_by(desc(PatientCase.visit_date)).all()
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient.id).order_by(desc(Prescription.created_at)).all()
    
    return {
        "patient": {
            "id": patient.id,
            "patient_id": patient.patient_id,
            "full_name": patient.full_name,
            "dob": patient.dob,
            "gender": patient.gender,
            "phone": patient.phone,
            "blood_group": patient.blood_group,
            "address": patient.address,
            "city": patient.city,
            "known_allergies": patient.known_allergies
        },
        "appointments": [
            {
                "id": a.id,
                "token_number": a.token_number,
                "date": a.appointment_date,
                "time_slot": a.time_slot,
                "doctor_name": a.doctor.user.full_name if a.doctor else "Doctor",
                "department": a.department.name if a.department else "General",
                "status": a.status,
                "reason": a.reason_for_visit
            }
            for a in appts
        ],
        "cases": [
            {
                "id": c.id,
                "case_number": c.case_number,
                "date": c.visit_date.strftime("%Y-%m-%d"),
                "doctor_name": c.doctor.user.full_name if c.doctor else "Doctor",
                "diagnosis": c.final_diagnosis or c.provisional_diagnosis or c.chief_complaint,
                "status": c.status
            }
            for c in cases
        ],
        "prescriptions": [
            {
                "id": r.id,
                "date": r.date.strftime("%Y-%m-%d"),
                "doctor_name": r.doctor.user.full_name if r.doctor else "Doctor",
                "department": r.doctor.department.name if r.doctor and r.doctor.department else "General",
                "items_count": len(r.items)
            }
            for r in prescriptions
        ]
    }
