from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import datetime
from app.database import get_db
from app.models import User, Doctor, Department, Patient, PatientCase, Appointment, AuditLog
from app.schemas import DashboardStats, AuditLogOut
from app.auth.security import require_role

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
