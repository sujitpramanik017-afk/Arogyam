from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str # admin, doctor, receptionist
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    doctor_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Department Schemas ---
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    head_doctor_name: Optional[str] = None
    location: Optional[str] = None
    is_active: bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    doctor_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DoctorCreate(BaseModel):
    full_name: str
    email: str
    password: Optional[str] = "Doctor@2026"
    department_id: int
    specialization: str
    qualification: str
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None
    is_available: bool = True

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None
    is_available: Optional[bool] = None

class StaffOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None
    is_available: Optional[bool] = None

    class Config:
        from_attributes = True

class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None
    is_available: Optional[bool] = None

# --- Doctor Schemas ---
class DoctorOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    email: str
    department_id: int
    department_name: Optional[str] = None
    specialization: str
    qualification: str
    room_number: Optional[str] = None
    contact_number: Optional[str] = None
    reg_number: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True

# --- Patient Schemas ---
class PatientBase(BaseModel):
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
    emergency_relation: Optional[str] = None
    blood_group: Optional[str] = None
    occupation: Optional[str] = None
    known_allergies: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int
    patient_id: str
    registration_date: datetime.datetime
    created_at: datetime.datetime
    total_visits: Optional[int] = 0
    latest_case_date: Optional[str] = None
    latest_doctor_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Vitals Schemas ---
class VitalSignsBase(BaseModel):
    temperature: Optional[float] = None
    temperature_unit: Optional[str] = "?F"
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    spo2: Optional[float] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    bmi: Optional[float] = None
    pain_score: Optional[int] = None

class VitalSignsCreate(VitalSignsBase):
    pass

class VitalSignsOut(VitalSignsBase):
    id: int
    case_id: int
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Medical History Schemas ---
class MedicalHistoryBase(BaseModel):
    past_diseases: Optional[str] = None
    past_surgeries: Optional[str] = None
    current_medications: Optional[str] = None
    drug_allergies: Optional[str] = None
    food_environmental_allergies: Optional[str] = None
    family_history: Optional[str] = None
    smoking_history: Optional[str] = None
    alcohol_history: Optional[str] = None
    other_lifestyle: Optional[str] = None

class MedicalHistoryCreate(MedicalHistoryBase):
    pass

class MedicalHistoryOut(MedicalHistoryBase):
    id: int
    case_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Prescription Schemas ---
class PrescriptionItemBase(BaseModel):
    medicine_name: str
    dosage: Optional[str] = "1 tablet"
    route: Optional[str] = "Oral"
    frequency: str = "1-0-1 (BID)"
    duration: str = "5 days"
    instructions: Optional[str] = "After food"

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemOut(PrescriptionItemBase):
    id: int
    prescription_id: int

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    general_instructions: Optional[str] = None
    items: List[PrescriptionItemCreate] = []

class PrescriptionOut(BaseModel):
    id: int
    case_id: int
    patient_id: int
    doctor_id: int
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None
    date: datetime.datetime
    general_instructions: Optional[str] = None
    status: str
    items: List[PrescriptionItemOut] = []

    class Config:
        from_attributes = True

# --- Patient Case Schemas ---
class PatientCaseCreate(BaseModel):
    patient_id: int
    department_id: Optional[int] = None
    doctor_id: Optional[int] = None
    status: Optional[str] = "draft"
    
    chief_complaint: Optional[str] = None
    chief_complaint_duration: Optional[str] = None
    chief_complaint_severity: Optional[str] = None
    chief_complaint_onset: Optional[str] = None
    additional_complaints: Optional[str] = None
    present_illness_history: Optional[str] = None
    
    general_examination: Optional[str] = None
    systemic_examination: Optional[str] = None
    examination_notes: Optional[str] = None
    
    provisional_diagnosis: Optional[str] = None
    final_diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    assessment_notes: Optional[str] = None
    
    treatment_plan: Optional[str] = None
    dietary_advice: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    
    follow_up_date: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    raw_notes: Optional[str] = None
    
    vitals: Optional[VitalSignsCreate] = None
    medical_history: Optional[MedicalHistoryCreate] = None
    prescription: Optional[PrescriptionCreate] = None

class PatientCaseUpdate(BaseModel):
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    chief_complaint_duration: Optional[str] = None
    chief_complaint_severity: Optional[str] = None
    chief_complaint_onset: Optional[str] = None
    additional_complaints: Optional[str] = None
    present_illness_history: Optional[str] = None
    
    general_examination: Optional[str] = None
    systemic_examination: Optional[str] = None
    examination_notes: Optional[str] = None
    
    provisional_diagnosis: Optional[str] = None
    final_diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    assessment_notes: Optional[str] = None
    
    treatment_plan: Optional[str] = None
    dietary_advice: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    
    follow_up_date: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    raw_notes: Optional[str] = None
    ai_generated_summary: Optional[str] = None
    ai_missing_info_alerts: Optional[str] = None
    ai_reviewed_by_doctor: Optional[bool] = None
    
    vitals: Optional[VitalSignsCreate] = None
    medical_history: Optional[MedicalHistoryCreate] = None
    prescription: Optional[PrescriptionCreate] = None

class PatientCaseOut(BaseModel):
    id: int
    case_number: str
    patient_id: int
    doctor_id: int
    department_id: int
    visit_date: datetime.datetime
    status: str
    
    chief_complaint: Optional[str] = None
    chief_complaint_duration: Optional[str] = None
    chief_complaint_severity: Optional[str] = None
    chief_complaint_onset: Optional[str] = None
    additional_complaints: Optional[str] = None
    present_illness_history: Optional[str] = None
    
    general_examination: Optional[str] = None
    systemic_examination: Optional[str] = None
    examination_notes: Optional[str] = None
    
    provisional_diagnosis: Optional[str] = None
    final_diagnosis: Optional[str] = None
    differential_diagnosis: Optional[str] = None
    assessment_notes: Optional[str] = None
    
    treatment_plan: Optional[str] = None
    dietary_advice: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    
    follow_up_date: Optional[str] = None
    follow_up_instructions: Optional[str] = None
    
    raw_notes: Optional[str] = None
    ai_generated_summary: Optional[str] = None
    ai_missing_info_alerts: Optional[str] = None
    ai_reviewed_by_doctor: bool
    
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None
    department: Optional[DepartmentOut] = None
    vitals: Optional[VitalSignsOut] = None
    medical_history: Optional[MedicalHistoryOut] = None
    prescription: Optional[PrescriptionOut] = None

    class Config:
        from_attributes = True

# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: str # YYYY-MM-DD
    time_slot: str
    reason_for_visit: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: str
    time_slot: str
    token_number: int
    reason_for_visit: Optional[str] = None
    status: str
    created_at: datetime.datetime
    
    patient_name: Optional[str] = None
    patient_custom_id: Optional[str] = None
    patient_gender: Optional[str] = None
    patient_dob: Optional[str] = None
    patient_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- AI Assistant Schemas ---
class AISummaryRequest(BaseModel):
    case_data: dict

class AISummaryResponse(BaseModel):
    summary: str
    key_symptoms: List[str]
    relevant_history: List[str]
    clinical_observations: List[str]
    follow_up_points: List[str]
    disclaimer: str = "AI-generated clinical documentation assistant ? Doctor review and verification required."

class AIMissingInfoResponse(BaseModel):
    missing_items: List[str]
    clinical_alerts: List[str]
    safety_reminders: List[str]
    status: str

class AINoteFormatRequest(BaseModel):
    raw_notes: str

class AINoteFormatResponse(BaseModel):
    formatted_soap_note: str
    suggested_chief_complaint: Optional[str] = None
    suggested_examination: Optional[str] = None
    suggested_assessment: Optional[str] = None
    suggested_plan: Optional[str] = None
    disclaimer: str = "AI-structured note draft ? Requires physician confirmation."

class ArogyaChatRequest(BaseModel):
    message: str
    language: Optional[str] = "auto" # "auto", "en", "bn"

class ArogyaChatResponse(BaseModel):
    reply: str
    language: str
    is_medical_warning: bool = False
    suggested_actions: Optional[List[str]] = None
    hospital_phone: str = "+91-9083284529"

# --- Audit & Analytics Schemas ---
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime.datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_patients: int
    today_patients: int
    today_appointments: int
    active_cases: int
    completed_cases_today: int
    total_doctors: int
    total_departments: int
    pending_followups: int
