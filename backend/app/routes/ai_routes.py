from fastapi import APIRouter, Depends
from app.schemas import AISummaryRequest, AISummaryResponse, AIMissingInfoResponse, AINoteFormatRequest, AINoteFormatResponse
from app.services.ai_service import AIClinicalService
from app.auth.security import get_current_user
from app.models import User

router = APIRouter(prefix="/ai", tags=["AI Clinical Assistant"])

@router.post("/summarize", response_model=AISummaryResponse)
def summarize_case(payload: AISummaryRequest, current_user: User = Depends(get_current_user)):
    result = AIClinicalService.generate_case_summary(payload.case_data)
    return result

@router.post("/missing-info", response_model=AIMissingInfoResponse)
def check_missing_info(payload: AISummaryRequest, current_user: User = Depends(get_current_user)):
    result = AIClinicalService.detect_missing_information(payload.case_data)
    return result

@router.post("/format-notes", response_model=AINoteFormatResponse)
def format_raw_notes(payload: AINoteFormatRequest, current_user: User = Depends(get_current_user)):
    result = AIClinicalService.format_raw_notes(payload.raw_notes)
    return result
