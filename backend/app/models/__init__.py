from app.database import Base
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False, default="receptionist") # admin, doctor, receptionist
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    head_doctor_name = Column(String(120), nullable=True)
    location = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    
    doctors = relationship("Doctor", back_populates="department")
    cases = relationship("PatientCase", back_populates="department")
    appointments = relationship("Appointment", back_populates="department")

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(100), nullable=False)
    room_number = Column(String(20), nullable=True)
    contact_number = Column(String(20), nullable=True)
    reg_number = Column(String(50), nullable=True)
    is_available = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    cases = relationship("PatientCase", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")

    @property
    def full_name(self):
        if self.user and self.user.full_name:
            name = self.user.full_name.strip()
            if name.startswith("Dr. "):
                return name[4:].strip()
            return name
        return "Doctor"

    @property
    def email(self):
        return self.user.email if self.user else ""

    @property
    def department_name(self):
        return self.department.name if self.department else "General"

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False) # SAN-2026-00001
    full_name = Column(String(120), nullable=False)
    dob = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(20), index=True, nullable=False)
    email = Column(String(120), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(80), default="Durgapur")
    state = Column(String(80), default="West Bengal")
    pincode = Column(String(20), default="713212")
    emergency_contact_name = Column(String(120), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_relation = Column(String(50), nullable=True)
    blood_group = Column(String(10), nullable=True)
    occupation = Column(String(100), nullable=True)
    known_allergies = Column(Text, nullable=True)
    registration_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    cases = relationship("PatientCase", back_populates="patient", order_by="desc(PatientCase.created_at)")
    appointments = relationship("Appointment", back_populates="patient", order_by="desc(Appointment.appointment_date)")
    prescriptions = relationship("Prescription", back_populates="patient", order_by="desc(Prescription.created_at)")

class PatientCase(Base):
    __tablename__ = "patient_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False) # CAS-2026-00001
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    visit_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="draft") # draft, in_progress, completed
    
    # Section A & B: Chief Complaints & Present Illness
    chief_complaint = Column(Text, nullable=True)
    chief_complaint_duration = Column(String(100), nullable=True)
    chief_complaint_severity = Column(String(50), nullable=True) # Mild, Moderate, Severe
    chief_complaint_onset = Column(String(50), nullable=True) # Acute, Subacute, Gradual
    additional_complaints = Column(Text, nullable=True)
    present_illness_history = Column(Text, nullable=True)
    
    # Section E: Examination
    general_examination = Column(Text, nullable=True)
    systemic_examination = Column(Text, nullable=True)
    examination_notes = Column(Text, nullable=True)
    
    # Section F: Assessment
    provisional_diagnosis = Column(Text, nullable=True)
    final_diagnosis = Column(Text, nullable=True)
    differential_diagnosis = Column(Text, nullable=True)
    assessment_notes = Column(Text, nullable=True)
    
    # Section G: Treatment
    treatment_plan = Column(Text, nullable=True)
    dietary_advice = Column(Text, nullable=True)
    lifestyle_advice = Column(Text, nullable=True)
    
    # Section H: Follow-up
    follow_up_date = Column(String(30), nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    
    # Section I: AI Doctor Assistant Support
    raw_notes = Column(Text, nullable=True)
    ai_generated_summary = Column(Text, nullable=True)
    ai_missing_info_alerts = Column(Text, nullable=True)
    ai_reviewed_by_doctor = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="cases")
    doctor = relationship("Doctor", back_populates="cases")
    department = relationship("Department", back_populates="cases")
    
    medical_history = relationship("MedicalHistory", back_populates="case", uselist=False, cascade="all, delete-orphan")
    vitals = relationship("VitalSigns", back_populates="case", uselist=False, cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="case", uselist=False, cascade="all, delete-orphan")

class MedicalHistory(Base):
    __tablename__ = "medical_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), unique=True, nullable=False)
    
    past_diseases = Column(Text, nullable=True)
    past_surgeries = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    drug_allergies = Column(Text, nullable=True)
    food_environmental_allergies = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    smoking_history = Column(String(50), nullable=True)
    alcohol_history = Column(String(50), nullable=True)
    other_lifestyle = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    case = relationship("PatientCase", back_populates="medical_history")

class VitalSigns(Base):
    __tablename__ = "vital_signs"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), unique=True, nullable=False)
    
    temperature = Column(Float, nullable=True)
    temperature_unit = Column(String(5), default="?F")
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    spo2 = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    pain_score = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    case = relationship("PatientCase", back_populates="vitals")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("patient_cases.id"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    
    date = Column(DateTime, default=datetime.datetime.utcnow)
    general_instructions = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    case = relationship("PatientCase", back_populates="prescription")
    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    
    medicine_name = Column(String(150), nullable=False)
    dosage = Column(String(50), nullable=True)
    route = Column(String(50), default="Oral")
    frequency = Column(String(50), nullable=False)
    duration = Column(String(50), nullable=False)
    instructions = Column(String(150), nullable=True)
    
    prescription = relationship("Prescription", back_populates="items")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    
    appointment_date = Column(String(20), nullable=False)
    time_slot = Column(String(30), nullable=False)
    token_number = Column(Integer, nullable=False, default=1)
    reason_for_visit = Column(Text, nullable=True)
    status = Column(String(20), default="scheduled")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    department = relationship("Department", back_populates="appointments")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(120), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String(50), default="127.0.0.1")
    
    user = relationship("User", back_populates="audit_logs")
