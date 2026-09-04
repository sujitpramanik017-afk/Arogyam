from sqlalchemy.orm import Session
from app.models import AuditLog, User
from typing import Optional

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[str] = None,
    user: Optional[User] = None,
    ip_address: str = "127.0.0.1"
):
    try:
        log_entry = AuditLog(
            user_id=user.id if user else None,
            user_name=user.full_name if user else "System",
            user_role=user.role if user else "SYSTEM",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error writing audit log: {e}")
