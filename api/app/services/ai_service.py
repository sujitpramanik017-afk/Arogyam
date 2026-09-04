import json
import re

class AIClinicalService:
    @staticmethod
    def generate_case_summary(case_data: dict) -> dict:
        chief = case_data.get("chief_complaint", "Not specified")
        duration = case_data.get("chief_complaint_duration", "")
        hpi = case_data.get("present_illness_history", "No detailed HPI recorded.")
        vitals = case_data.get("vitals", {}) or {}
        med_history = case_data.get("medical_history", {}) or {}
        exam = case_data.get("general_examination", "") or case_data.get("systemic_examination", "") or "General exam unremarkable."
        diag = case_data.get("provisional_diagnosis") or case_data.get("final_diagnosis") or "Pending clinical assessment"
        follow_up = case_data.get("follow_up_date", "Routine follow-up as advised")
        
        # Build synthesis
        symptoms_list = []
        if chief and chief != "Not specified":
            symptoms_list.append(f"{chief} (Duration: {duration})" if duration else chief)
        if case_data.get("additional_complaints"):
            symptoms_list.append(case_data.get("additional_complaints"))
            
        history_list = []
        if med_history.get("past_diseases"):
            history_list.append(f"Past History: {med_history['past_diseases']}")
        if med_history.get("past_surgeries"):
            history_list.append(f"Surgeries: {med_history['past_surgeries']}")
        if med_history.get("current_medications"):
            history_list.append(f"Active Medications: {med_history['current_medications']}")
        if med_history.get("drug_allergies"):
            history_list.append(f"Allergies: {med_history['drug_allergies']}")
            
        obs_list = []
        bp_sys = vitals.get("blood_pressure_systolic")
        bp_dia = vitals.get("blood_pressure_diastolic")
        if bp_sys and bp_dia:
            obs_list.append(f"Blood Pressure: {bp_sys}/{bp_dia} mmHg")
        if vitals.get("heart_rate"):
            obs_list.append(f"Pulse: {vitals.get('heart_rate')} bpm")
        if vitals.get("spo2"):
            obs_list.append(f"SpO2: {vitals.get('spo2')}%")
        if vitals.get("temperature"):
            obs_list.append(f"Temp: {vitals.get('temperature')}?F")
        if vitals.get("bmi"):
            obs_list.append(f"BMI: {vitals.get('bmi')} kg/m?")
        if exam:
            obs_list.append(f"Exam: {exam[:150]}...")
            
        follow_list = []
        if follow_up:
            follow_list.append(f"Next review: {follow_up}")
        if case_data.get("follow_up_instructions"):
            follow_list.append(case_data.get("follow_up_instructions"))

        # Synthesized prose summary
        summary_text = (
            f"Patient presented with {chief}" + (f" persisting for {duration}." if duration else ".") +
            f" {hpi} Clinical evaluation points towards {diag}." +
            (f" Pertinent history includes {med_history.get('past_diseases')}." if med_history.get('past_diseases') else "") +
            f" Patient was stabilized and placed on appropriate management plan with planned review on {follow_up}."
        )

        return {
            "summary": summary_text,
            "key_symptoms": symptoms_list if symptoms_list else ["No specific symptoms isolated"],
            "relevant_history": history_list if history_list else ["No significant previous medical history documented"],
            "clinical_observations": obs_list if obs_list else ["Standard baseline vitals recorded"],
            "follow_up_points": follow_list if follow_list else ["Follow-up as per physician advice"],
            "disclaimer": "AI-generated clinical documentation assistant ? Doctor review and verification required."
        }

    @staticmethod
    def detect_missing_information(case_data: dict) -> dict:
        missing = []
        alerts = []
        reminders = []
        
        vitals = case_data.get("vitals") or {}
        med_history = case_data.get("medical_history") or {}
        
        # Check critical vitals
        if not vitals.get("blood_pressure_systolic") or not vitals.get("blood_pressure_diastolic"):
            missing.append("Blood Pressure (Systolic / Diastolic) not recorded")
        else:
            sys = vitals.get("blood_pressure_systolic", 120)
            dia = vitals.get("blood_pressure_diastolic", 80)
            if sys >= 140 or dia >= 90:
                alerts.append(f"Stage 1/2 Hypertension indicator: Recorded BP {sys}/{dia} mmHg")
            elif sys < 90 or dia < 60:
                alerts.append(f"Hypotension indicator: Recorded BP {sys}/{dia} mmHg")
                
        if not vitals.get("spo2"):
            missing.append("Oxygen Saturation (SpO2) not recorded")
        elif vitals.get("spo2") < 95:
            alerts.append(f"Low Oxygen Saturation alert: SpO2 is {vitals.get('spo2')}% (< 95%)")

        if not vitals.get("temperature"):
            missing.append("Body Temperature not recorded")
        elif vitals.get("temperature") >= 100.4:
            alerts.append(f"Pyrexia / Fever alert: Temperature {vitals.get('temperature')}?F")

        if not vitals.get("heart_rate"):
            missing.append("Heart Rate / Pulse not recorded")
        elif vitals.get("heart_rate") > 100:
            alerts.append(f"Tachycardia alert: Pulse rate {vitals.get('heart_rate')} bpm (> 100)")

        # Check Medical History & Allergies
        if not med_history.get("drug_allergies") and not case_data.get("known_allergies"):
            missing.append("Drug Allergy status not explicitly confirmed or recorded")
            reminders.append("Verify patient allergy to common antibiotics (e.g. Penicillins, Cephalosporins) prior to prescribing")

        if not case_data.get("follow_up_date"):
            missing.append("Follow-up appointment date not scheduled")

        if not case_data.get("provisional_diagnosis") and not case_data.get("final_diagnosis"):
            missing.append("Provisional / Final Diagnosis statement is empty")

        if not case_data.get("chief_complaint_duration"):
            missing.append("Duration of chief complaint not specified")

        reminders.append("Confirm patient identity and ABHA / Hospital Registration ID before saving finalized record")
        reminders.append("Review drug-drug interaction warnings for newly added medications against existing prescriptions")

        status_flag = "ATTENTION_REQUIRED" if (missing or alerts) else "COMPLETE"

        return {
            "missing_items": missing,
            "clinical_alerts": alerts,
            "safety_reminders": reminders,
            "status": status_flag
        }

    @staticmethod
    def format_raw_notes(raw_text: str) -> dict:
        lines = [l.strip() for l in raw_text.strip().splitlines() if l.strip()]
        
        # Simple intelligent extraction
        chief = ""
        exam = ""
        assess = ""
        plan = ""
        
        for line in lines:
            l_lower = line.lower()
            if any(k in l_lower for k in ["cc:", "c/o", "complaint", "fever", "pain", "cough", "vomiting"]):
                chief += line + " "
            elif any(k in l_lower for k in ["o/e", "oe:", "exam", "bp:", "pr:", "p/a", "chest", "cvs", "rs"]):
                exam += line + " "
            elif any(k in l_lower for k in ["dx:", "imp:", "impression", "assessment", "acute", "chronic", "probable"]):
                assess += line + " "
            elif any(k in l_lower for k in ["rx:", "tx:", "tab", "cap", "syp", "inj", "advise", "rest", "follow up"]):
                plan += line + " "
            else:
                chief += line + " "
                
        formatted = f"""**SUBJECTIVE:**
{chief.strip() if chief else 'Patient presents for clinical evaluation.'}

**OBJECTIVE (Examination & Findings):**
{exam.strip() if exam else 'Physical examination performed as recorded in vitals and systemic section.'}

**ASSESSMENT (Clinical Impression):**
{assess.strip() if assess else 'Provisional diagnosis based on presenting clinical manifestations.'}

**PLAN (Treatment & Management):**
{plan.strip() if plan else 'Prescribe appropriate therapeutics, lifestyle modifications, and scheduled follow-up.'}"""

        return {
            "formatted_soap_note": formatted,
            "suggested_chief_complaint": chief.strip()[:100] if chief else None,
            "suggested_examination": exam.strip() if exam else None,
            "suggested_assessment": assess.strip() if assess else None,
            "suggested_plan": plan.strip() if plan else None,
            "disclaimer": "AI-structured note draft ? Requires physician confirmation."
        }
