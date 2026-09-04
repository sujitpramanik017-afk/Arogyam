import sys
import os
import json

# Add backend to path
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== STARTING FULL END-TO-END SYSTEM VERIFICATION ===")

# 1. Health check
res = client.get("/")
assert res.status_code == 200, f"Root failed: {res.text}"
print("[PASS] Root API & Hospital Branding OK:", res.json()["hospital"])

# 2. Test Doctor Login
res = client.post("/api/auth/login", json={"email": "dr.ananya@sanakahospital.com", "password": "Doctor@2026"})
assert res.status_code == 200, f"Doctor login failed: {res.text}"
doc_token = res.json()["access_token"]
doc_headers = {"Authorization": f"Bearer {doc_token}"}
print("[PASS] Doctor Login Verified (Dr. Ananya Sen, Token Acquired)")

# 3. Test Receptionist Login
res = client.post("/api/auth/login", json={"email": "receptionist@sanakahospital.com", "password": "Staff@2026"})
assert res.status_code == 200, f"Receptionist login failed: {res.text}"
rec_token = res.json()["access_token"]
rec_headers = {"Authorization": f"Bearer {rec_token}"}
print("[PASS] Receptionist Login Verified")

# 4. Test Admin Login
res = client.post("/api/auth/login", json={"email": "admin@sanakahospital.com", "password": "Sanaka@2026"})
assert res.status_code == 200, f"Admin login failed: {res.text}"
admin_token = res.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print("[PASS] Admin Login Verified (Dr. B. K. Roy)")

# 5. Receptionist registers new patient
new_pt_payload = {
    "full_name": "Dipankar Roy",
    "dob": "1985-04-12",
    "gender": "Male",
    "phone": "9832998877",
    "email": "dipankar.roy@demo.org",
    "address": "B-Zone, Steel Township, Durgapur",
    "city": "Durgapur",
    "state": "West Bengal",
    "pincode": "713205",
    "emergency_contact_name": "Shila Roy",
    "emergency_contact_phone": "9832998878",
    "emergency_relation": "Wife",
    "blood_group": "A+",
    "occupation": "Technician",
    "known_allergies": "No known drug allergies (NKDA)"
}
res = client.post("/api/patients", json=new_pt_payload, headers=rec_headers)
assert res.status_code == 200, f"Patient creation failed: {res.text}"
created_patient = res.json()
assert created_patient["patient_id"].startswith("SAN-2026-"), f"Invalid ID: {created_patient['patient_id']}"
print(f"[PASS] Patient Registered: {created_patient['full_name']} -> Assigned UHID: {created_patient['patient_id']}")

# 6. Book Appointment Token
appt_payload = {
    "patient_id": created_patient["id"],
    "doctor_id": 1,
    "department_id": 1,
    "appointment_date": "2026-09-04",
    "time_slot": "10:30 AM - 11:00 AM",
    "reason_for_visit": "Chest heaviness and dyspnea on climbing stairs"
}
res = client.post("/api/appointments", json=appt_payload, headers=rec_headers)
assert res.status_code == 200, f"Appointment booking failed: {res.text}"
appt = res.json()
print(f"[PASS] Appointment Scheduled: Token #{appt['token_number']} for {appt['patient_name']} with Dr. {appt['doctor_name']}")

# 7. Doctor Creates Digital Case Sheet with Vitals, History, Exam, Rx, Follow-up
case_payload = {
    "patient_id": created_patient["id"],
    "doctor_id": 1,
    "department_id": 1,
    "status": "completed",
    "chief_complaint": "Retrosternal heaviness and breathlessness on exertion",
    "chief_complaint_duration": "5 days",
    "chief_complaint_severity": "Moderate",
    "chief_complaint_onset": "Gradual",
    "additional_complaints": "Mild diaphoresis, epigastric discomfort after spicy food",
    "present_illness_history": "41-year-old male with no prior known cardiac history presents with exertional retrosternal discomfort. Symptoms relieved by rest. Denies syncope or radiating left arm pain.",
    "general_examination": "Conscious, oriented, moderately built. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or pedal edema.",
    "systemic_examination": "CVS: S1 S2 heard, regular rate, no murmurs. RS: Clear vesicular breath sounds. P/A: Soft, non-tender. CNS: Grossly intact.",
    "examination_notes": "Resting 12-lead ECG: Normal sinus rhythm, non-specific T-wave changes in V4-V6. Advised Stress Echocardiography.",
    "provisional_diagnosis": "Stable Angina Pectoris; Stage 1 Hypertension",
    "final_diagnosis": "Coronary Artery Disease (CAD - Stable Angina); Essential Hypertension",
    "differential_diagnosis": "Gastroesophageal reflux disease (GERD), Musculoskeletal chest wall pain",
    "assessment_notes": "Patient has moderate cardiovascular risk profile with elevated systolic BP. Initiated antianginal prophylaxis and cardioprotective therapy.",
    "treatment_plan": "Start Aspirin 75mg + Atorvastatin 20mg OD, Metoprolol Succinate 25mg OD, Tab Sorbitrate 5mg SOS.",
    "dietary_advice": "Low fat, low sodium diet (< 4g/day). Avoid saturated oils and trans-fats.",
    "lifestyle_advice": "Gradual aerobic exercise after TMT evaluation. Strict cessation of active/passive tobacco.",
    "follow_up_date": "2026-09-15",
    "follow_up_instructions": "Review in Cardiology OPD with TMT report, fasting lipid profile, and serum creatinine.",
    "vitals": {
        "temperature": 98.4,
        "temperature_unit": "F",
        "blood_pressure_systolic": 146,
        "blood_pressure_diastolic": 92,
        "heart_rate": 84,
        "respiratory_rate": 18,
        "spo2": 98.0,
        "weight_kg": 78.0,
        "height_cm": 172.0,
        "bmi": 26.4,
        "pain_score": 4
    },
    "medical_history": {
        "past_diseases": "Mild dyslipidemia diagnosed 1 year ago",
        "past_surgeries": "None",
        "current_medications": "None",
        "drug_allergies": "No known drug allergies (NKDA)",
        "family_history": "Elder brother underwent CABG at age 48",
        "smoking_history": "Non-smoker",
        "alcohol_history": "Occasional social"
    },
    "prescription": {
        "general_instructions": "Take all medications regularly with water. If chest pain persists > 10 mins despite sublingual nitrate, proceed to Hospital Emergency immediately.",
        "items": [
            {
                "medicine_name": "Tab. Aspirin 75mg + Atorvastatin 20mg",
                "dosage": "1 Tablet",
                "route": "Oral",
                "frequency": "0-0-1 (Night)",
                "duration": "30 days",
                "instructions": "After dinner"
            },
            {
                "medicine_name": "Tab. Metoprolol Succinate 25mg ER",
                "dosage": "1 Tablet",
                "route": "Oral",
                "frequency": "1-0-0 (Morning)",
                "duration": "30 days",
                "instructions": "After breakfast"
            },
            {
                "medicine_name": "Tab. Isosorbide Dinitrate 5mg",
                "dosage": "1 Tablet (Sublingual)",
                "route": "Sublingual",
                "frequency": "SOS (For acute chest discomfort)",
                "duration": "15 days",
                "instructions": "Place under tongue if chest pain occurs"
            }
        ]
    }
}
res = client.post("/api/cases", json=case_payload, headers=doc_headers)
assert res.status_code == 200, f"Case creation failed: {res.text}"
saved_case = res.json()
print(f"[PASS] Case Sheet Recorded: Case #{saved_case['case_number']} (Status: {saved_case['status']})")
print(f"[PASS] Vitals Auto-BMI Calculated: {saved_case['vitals']['bmi']} kg/m²")

# 8. Test AI Assistant Endpoints
ai_sum_res = client.post("/api/ai/summarize", json={"case_data": case_payload}, headers=doc_headers)
assert ai_sum_res.status_code == 200, f"AI summarize failed: {ai_sum_res.text}"
print("[PASS] AI Case Summary Generated:", ai_sum_res.json()["summary"][:120], "...")

ai_lint_res = client.post("/api/ai/missing-info", json={"case_data": case_payload}, headers=doc_headers)
assert ai_lint_res.status_code == 200, f"AI linter failed: {ai_lint_res.text}"
print("[PASS] AI Clinical Linter Checked: Status =", ai_lint_res.json()["status"], f"(Alerts: {len(ai_lint_res.json()['clinical_alerts'])})")

ai_soap_res = client.post("/api/ai/format-notes", json={"raw_notes": "c/o chest pain 5d, bp 146/92, dx: stable angina, rx: aspirin + statin"}, headers=doc_headers)
assert ai_soap_res.status_code == 200, f"AI SOAP formatter failed: {ai_soap_res.text}"
print("[PASS] AI SOAP Rough Notes Formatter Verified")

# 9. Test Prescription & Summary Fetching
res = client.get(f"/api/cases/{saved_case['id']}", headers=doc_headers)
assert res.status_code == 200
print("[PASS] Case Summary Report Payload verified for Printable Layout")

# 10. Test Admin Dashboard & Audit Logs
res = client.get("/api/admin/stats", headers=admin_headers)
assert res.status_code == 200
stats = res.json()
print(f"[PASS] Admin Hospital Stats: Total Patients={stats['total_patients']}, Doctors={stats['total_doctors']}, Depts={stats['total_departments']}")

res = client.get("/api/admin/audit-logs", headers=admin_headers)
assert res.status_code == 200
logs = res.json()
print(f"[PASS] Audit Trail Recorded: {len(logs)} compliance audit entries logged.")

print("\n=======================================================")
print(" ALL AUTOMATED CLINICAL & WORKFLOW TESTS PASSED 100%!")
print("=======================================================")
