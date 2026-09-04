from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import PatientCase, Patient, Doctor, Department, MedicalHistory, VitalSigns, Prescription, PrescriptionItem, User, Appointment
from app.schemas import PatientCaseCreate, PatientCaseUpdate, PatientCaseOut, VitalSignsCreate, MedicalHistoryCreate, PrescriptionCreate
from app.auth.security import get_current_user
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/cases", tags=["Patient Cases"])

def generate_next_case_number(db: Session) -> str:
    current_year = datetime.datetime.now().year
    prefix = f"CAS-{current_year}-"
    last_case = db.query(PatientCase).filter(PatientCase.case_number.like(f"{prefix}%")).order_by(desc(PatientCase.id)).first()
    if last_case:
        try:
            seq_str = last_case.case_number.replace(prefix, "")
            seq = int(seq_str) + 1
        except Exception:
            seq = db.query(PatientCase).count() + 1
    else:
        seq = 1
    return f"{prefix}{seq:05d}"

def calculate_bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    if weight_kg and height_cm and height_cm > 0:
        h_m = height_cm / 100.0
        return round(weight_kg / (h_m * h_m), 1)
    return None

@router.get("", response_model=List[PatientCaseOut])
def get_cases(
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PatientCase)
    if patient_id:
        query = query.filter(PatientCase.patient_id == patient_id)
    if doctor_id:
        query = query.filter(PatientCase.doctor_id == doctor_id)
    if department_id:
        query = query.filter(PatientCase.department_id == department_id)
    if status and status != "All":
        query = query.filter(PatientCase.status == status)
        
    cases = query.order_by(desc(PatientCase.created_at)).offset(offset).limit(limit).all()
    return cases

@router.get("/{case_id}", response_model=PatientCaseOut)
def get_case(case_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
    return case

@router.post("", response_model=PatientCaseOut)
def create_case(
    case_in: PatientCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == case_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    doc_id = case_in.doctor_id
    if not doc_id and current_user.role == "doctor":
        doc_profile = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doc_profile:
            doc_id = doc_profile.id
            
    if not doc_id:
        first_doc = db.query(Doctor).first()
        doc_id = first_doc.id if first_doc else 1
        
    doc = db.query(Doctor).filter(Doctor.id == doc_id).first()
    dept_id = case_in.department_id or (doc.department_id if doc else 1)
    
    case_num = generate_next_case_number(db)
    
    new_case = PatientCase(
        case_number=case_num,
        patient_id=patient.id,
        doctor_id=doc_id,
        department_id=dept_id,
        visit_date=datetime.datetime.utcnow(),
        status=case_in.status or "draft",
        chief_complaint=case_in.chief_complaint,
        chief_complaint_duration=case_in.chief_complaint_duration,
        chief_complaint_severity=case_in.chief_complaint_severity,
        chief_complaint_onset=case_in.chief_complaint_onset,
        additional_complaints=case_in.additional_complaints,
        present_illness_history=case_in.present_illness_history,
        general_examination=case_in.general_examination,
        systemic_examination=case_in.systemic_examination,
        examination_notes=case_in.examination_notes,
        provisional_diagnosis=case_in.provisional_diagnosis,
        final_diagnosis=case_in.final_diagnosis,
        differential_diagnosis=case_in.differential_diagnosis,
        assessment_notes=case_in.assessment_notes,
        treatment_plan=case_in.treatment_plan,
        dietary_advice=case_in.dietary_advice,
        lifestyle_advice=case_in.lifestyle_advice,
        follow_up_date=case_in.follow_up_date,
        follow_up_instructions=case_in.follow_up_instructions,
        raw_notes=case_in.raw_notes
    )
    db.add(new_case)
    db.flush()
    
    if case_in.vitals:
        v_data = case_in.vitals.dict()
        bmi = calculate_bmi(v_data.get("weight_kg"), v_data.get("height_cm"))
        vitals = VitalSigns(
            case_id=new_case.id,
            temperature=v_data.get("temperature"),
            temperature_unit=v_data.get("temperature_unit", "F"),
            blood_pressure_systolic=v_data.get("blood_pressure_systolic"),
            blood_pressure_diastolic=v_data.get("blood_pressure_diastolic"),
            heart_rate=v_data.get("heart_rate"),
            respiratory_rate=v_data.get("respiratory_rate"),
            spo2=v_data.get("spo2"),
            weight_kg=v_data.get("weight_kg"),
            height_cm=v_data.get("height_cm"),
            bmi=bmi or v_data.get("bmi"),
            pain_score=v_data.get("pain_score")
        )
        db.add(vitals)
        
    if case_in.medical_history:
        m_data = case_in.medical_history.dict()
        med_hist = MedicalHistory(
            case_id=new_case.id,
            past_diseases=m_data.get("past_diseases"),
            past_surgeries=m_data.get("past_surgeries"),
            current_medications=m_data.get("current_medications"),
            drug_allergies=m_data.get("drug_allergies"),
            food_environmental_allergies=m_data.get("food_environmental_allergies"),
            family_history=m_data.get("family_history"),
            smoking_history=m_data.get("smoking_history"),
            alcohol_history=m_data.get("alcohol_history"),
            other_lifestyle=m_data.get("other_lifestyle")
        )
        db.add(med_hist)
        
    if case_in.prescription and case_in.prescription.items:
        p_data = case_in.prescription
        rx = Prescription(
            case_id=new_case.id,
            patient_id=patient.id,
            doctor_id=doc_id,
            general_instructions=p_data.general_instructions,
            status="active"
        )
        db.add(rx)
        db.flush()
        
        for itm in p_data.items:
            rx_item = PrescriptionItem(
                prescription_id=rx.id,
                medicine_name=itm.medicine_name,
                dosage=itm.dosage,
                route=itm.route,
                frequency=itm.frequency,
                duration=itm.duration,
                instructions=itm.instructions
            )
            db.add(rx_item)
            
    db.commit()
    db.refresh(new_case)
    
    log_audit_event(
        db=db,
        action="CREATE_PATIENT_CASE",
        entity_type="PatientCase",
        entity_id=str(new_case.id),
        details=f"Created case {new_case.case_number} for patient {patient.patient_id}",
        user=current_user
    )
    return new_case

@router.put("/{case_id}", response_model=PatientCaseOut)
def update_case(
    case_id: int,
    case_in: PatientCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(PatientCase).filter(PatientCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Patient case not found")
        
    update_dict = case_in.dict(exclude_unset=True)
    vitals_data = update_dict.pop("vitals", None)
    history_data = update_dict.pop("medical_history", None)
    rx_data = update_dict.pop("prescription", None)
    
    for key, val in update_dict.items():
        setattr(case, key, val)
        
    if vitals_data:
        vitals = db.query(VitalSigns).filter(VitalSigns.case_id == case.id).first()
        if not vitals:
            vitals = VitalSigns(case_id=case.id)
            db.add(vitals)
        for vk, vv in vitals_data.items():
            if vv is not None:
                setattr(vitals, vk, vv)
        if vitals.weight_kg and vitals.height_cm:
            vitals.bmi = calculate_bmi(vitals.weight_kg, vitals.height_cm)
            
    if history_data:
        m_hist = db.query(MedicalHistory).filter(MedicalHistory.case_id == case.id).first()
        if not m_hist:
            m_hist = MedicalHistory(case_id=case.id)
            db.add(m_hist)
        for hk, hv in history_data.items():
            if hv is not None:
                setattr(m_hist, hk, hv)
                
    if rx_data and "items" in rx_data:
        rx = db.query(Prescription).filter(Prescription.case_id == case.id).first()
        if not rx:
            rx = Prescription(
                case_id=case.id,
                patient_id=case.patient_id,
                doctor_id=case.doctor_id,
                general_instructions=rx_data.get("general_instructions")
            )
            db.add(rx)
            db.flush()
        else:
            if "general_instructions" in rx_data:
                rx.general_instructions = rx_data["general_instructions"]
            db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id == rx.id).delete()
            
        for itm in rx_data.get("items", []):
            rx_item = PrescriptionItem(
                prescription_id=rx.id,
                medicine_name=itm["medicine_name"],
                dosage=itm.get("dosage", "1 tablet"),
                route=itm.get("route", "Oral"),
                frequency=itm.get("frequency", "1-0-1 (BID)"),
                duration=itm.get("duration", "5 days"),
                instructions=itm.get("instructions", "After food")
            )
            db.add(rx_item)
            
    case.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(case)
    
    log_audit_event(
        db=db,
        action="UPDATE_PATIENT_CASE",
        entity_type="PatientCase",
        entity_id=str(case.id),
        details=f"Updated case {case.case_number} (status: {case.status})",
        user=current_user
    )
    return case
