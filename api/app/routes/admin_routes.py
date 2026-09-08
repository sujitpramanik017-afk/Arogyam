from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import User, Doctor, Department, Patient, PatientCase, Appointment, AuditLog, Prescription
from app.schemas import DashboardStats, AuditLogOut, StaffOut, UserCreate, StaffUpdate
from app.auth.security import require_role, get_password_hash
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    
    total_pts = db.query(Patient).count()
    today_pts = db.query(Patient).filter(Patient.created_at >= today_start).count()
    today_appts = db.query(Appointment).filter(Appointment.appointment_date == today_str).count()
    active_cases = db.query(PatientCase).filter(PatientCase.status.in_(["draft", "in_progress"])).count()
    completed_today = db.query(PatientCase).filter(PatientCase.status == "completed", PatientCase.updated_at >= today_start).count()
    total_docs = db.query(Doctor).count()
    total_depts = db.query(Department).count()
    pending_followups = db.query(PatientCase).filter(PatientCase.follow_up_date.isnot(None), PatientCase.follow_up_date != "").count()
    
    return DashboardStats(
        total_patients=total_pts,
        today_patients=today_pts,
        today_appointments=today_appts,
        active_cases=active_cases,
        completed_cases_today=completed_today,
        total_doctors=total_docs,
        total_departments=total_depts,
        pending_followups=pending_followups
    )

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "doctor"]))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs

@router.get("/staff", response_model=List[StaffOut])
def get_staff_members(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    query = db.query(User)
    if role and role != "All":
        query = query.filter(User.role == role)
    users = query.order_by(User.id.asc()).all()
    
    results = []
    for u in users:
        doc = u.doctor_profile
        results.append(StaffOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            doctor_id=doc.id if doc else None,
            department_id=doc.department_id if doc else None,
            department_name=doc.department.name if (doc and doc.department) else None,
            specialization=doc.specialization if doc else None,
            qualification=doc.qualification if doc else None,
            room_number=doc.room_number if doc else None,
            contact_number=doc.contact_number if doc else None,
            reg_number=doc.reg_number if doc else None,
            is_available=doc.is_available if doc else None
        ))
    return results

@router.post("/staff", response_model=StaffOut)
def create_staff_member(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(User).filter(User.email == user_in.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists")

    user = User(
        email=user_in.email.strip().lower(),
        full_name=user_in.full_name.strip(),
        role=user_in.role.strip().lower(),
        hashed_password=get_password_hash(user_in.password),
        is_active=True
    )
    db.add(user)
    db.flush()

    doctor = None
    if user.role == "doctor":
        dept_id = user_in.department_id or 1
        doctor = Doctor(
            user_id=user.id,
            department_id=dept_id,
            specialization=user_in.specialization or "General Medicine",
            qualification=user_in.qualification or "MBBS",
            room_number=user_in.room_number or "OPD Wing",
            contact_number=user_in.contact_number,
            reg_number=user_in.reg_number,
            is_available=True
        )
        db.add(doctor)

    db.commit()
    db.refresh(user)
    if doctor:
        db.refresh(doctor)

    log_audit_event(
        db=db,
        action="CREATE_STAFF",
        entity_type="User",
        entity_id=str(user.id),
        details=f"Created staff account {user.full_name} ({user.role})",
        user=current_user
    )

    return StaffOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        doctor_id=doctor.id if doctor else None,
        department_id=doctor.department_id if doctor else None,
        department_name=doctor.department.name if (doctor and doctor.department) else None,
        specialization=doctor.specialization if doctor else None,
        qualification=doctor.qualification if doctor else None,
        room_number=doctor.room_number if doctor else None,
        contact_number=doctor.contact_number if doctor else None,
        reg_number=doctor.reg_number if doctor else None,
        is_available=doctor.is_available if doctor else None
    )

@router.put("/staff/{user_id}", response_model=StaffOut)
def update_staff_member(
    user_id: int,
    staff_in: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    if staff_in.full_name is not None:
        user.full_name = staff_in.full_name.strip()
    if staff_in.email is not None:
        new_email = staff_in.email.strip().lower()
        if new_email != user.email:
            existing = db.query(User).filter(User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already used by another account")
            user.email = new_email
    if staff_in.role is not None:
        user.role = staff_in.role.strip().lower()
    if staff_in.is_active is not None:
        user.is_active = staff_in.is_active
    if staff_in.password:
        user.hashed_password = get_password_hash(staff_in.password)

    # Doctor profile updates if doctor
    doc = user.doctor_profile
    if user.role == "doctor":
        if not doc:
            doc = Doctor(
                user_id=user.id,
                department_id=staff_in.department_id or 1,
                specialization=staff_in.specialization or "General Medicine",
                qualification=staff_in.qualification or "MBBS",
                room_number=staff_in.room_number or "OPD Wing",
                contact_number=staff_in.contact_number,
                reg_number=staff_in.reg_number,
                is_available=staff_in.is_available if staff_in.is_available is not None else True
            )
            db.add(doc)
        else:
            if staff_in.department_id is not None:
                doc.department_id = staff_in.department_id
            if staff_in.specialization is not None:
                doc.specialization = staff_in.specialization.strip()
            if staff_in.qualification is not None:
                doc.qualification = staff_in.qualification.strip()
            if staff_in.room_number is not None:
                doc.room_number = staff_in.room_number.strip()
            if staff_in.contact_number is not None:
                doc.contact_number = staff_in.contact_number.strip()
            if staff_in.reg_number is not None:
                doc.reg_number = staff_in.reg_number.strip()
            if staff_in.is_available is not None:
                doc.is_available = staff_in.is_available

    db.commit()
    db.refresh(user)
    if doc:
        db.refresh(doc)

    log_audit_event(
        db=db,
        action="UPDATE_STAFF",
        entity_type="User",
        entity_id=str(user.id),
        details=f"Updated details for staff member {user.full_name} ({user.role})",
        user=current_user
    )

    return StaffOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        doctor_id=doc.id if doc else None,
        department_id=doc.department_id if doc else None,
        department_name=doc.department.name if (doc and doc.department) else None,
        specialization=doc.specialization if doc else None,
        qualification=doc.qualification if doc else None,
        room_number=doc.room_number if doc else None,
        contact_number=doc.contact_number if doc else None,
        reg_number=doc.reg_number if doc else None,
        is_available=doc.is_available if doc else None
    )

@router.delete("/staff/{user_id}")
def delete_staff_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found")

    staff_name = user.full_name
    doc = user.doctor_profile

    if doc:
        has_cases = db.query(PatientCase).filter(PatientCase.doctor_id == doc.id).first()
        has_appts = db.query(Appointment).filter(Appointment.doctor_id == doc.id).first()
        if has_cases or has_appts:
            user.is_active = False
            doc.is_available = False
            db.commit()
            action_detail = f"Deactivated {staff_name} (Preserved medical history)"
        else:
            db.delete(doc)
            db.delete(user)
            db.commit()
            action_detail = f"Permanently deleted {staff_name}"
    else:
        db.delete(user)
        db.commit()
        action_detail = f"Permanently deleted staff {staff_name}"

    log_audit_event(
        db=db,
        action="DELETE_STAFF",
        entity_type="User",
        entity_id=str(user_id),
        details=action_detail,
        user=current_user
    )

    return {"message": action_detail, "user_id": user_id}

