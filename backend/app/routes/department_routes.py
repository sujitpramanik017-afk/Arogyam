from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Department, Doctor, User
from app.schemas import DepartmentOut, DepartmentCreate
from app.auth.security import get_current_user, require_role
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    results = []
    for dept in departments:
        doc_count = db.query(Doctor).filter(Doctor.department_id == dept.id, Doctor.is_available == True).count()
        d_out = DepartmentOut.from_orm(dept)
        d_out.doctor_count = doc_count
        results.append(d_out)
    return results

@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    doc_count = db.query(Doctor).filter(Doctor.department_id == dept.id).count()
    d_out = DepartmentOut.from_orm(dept)
    d_out.doctor_count = doc_count
    return d_out

@router.post("", response_model=DepartmentOut)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    existing = db.query(Department).filter(Department.code == dept_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Department code '{dept_in.code}' already exists")
    
    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        head_doctor_name=dept_in.head_doctor_name,
        location=dept_in.location,
        is_active=dept_in.is_active
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    log_audit_event(
        db=db,
        action="CREATE_DEPARTMENT",
        entity_type="Department",
        entity_id=str(dept.id),
        details=f"Created department {dept.name} ({dept.code})",
        user=current_user
    )
    return DepartmentOut.from_orm(dept)
