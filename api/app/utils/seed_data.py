from app.database import SessionLocal
from app.models import User, Department, Doctor, Patient, PatientCase, MedicalHistory, VitalSigns, Prescription, PrescriptionItem, Appointment, AuditLog
from app.auth.security import get_password_hash
import datetime

def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).first():
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Sanaka Hospital initial database...")

        # 1. Departments
        depts = [
            Department(name="General Medicine", code="MED", description="Internal medicine, lifestyle diseases, fever, diabetes & chronic care", head_doctor_name="Dr. Ananya Sen", location="Block A, Ground Floor, OPD-1"),
            Department(name="Orthopedics & Traumatology", code="ORTHO", description="Bone fractures, joint replacement, arthritis, spine care", head_doctor_name="Dr. Subhashish Chatterjee", location="Block B, 1st Floor, OPD-12"),
            Department(name="Pediatrics & Child Health", code="PED", description="Newborn, infant, immunization and child development clinic", head_doctor_name="Dr. Priya Banerjee", location="Block A, 1st Floor, OPD-6"),
            Department(name="General & Laparoscopic Surgery", code="SURG", description="Elective and emergency gastrointestinal, hernia, laparoscopic procedures", head_doctor_name="Dr. K. N. Mukherjee", location="Block C, 2nd Floor, OPD-18"),
            Department(name="Obstetrics & Gynecology", code="OBGYN", description="Comprehensive women health, antenatal care, high-risk pregnancy", head_doctor_name="Dr. S. Mukherjee", location="Block A, 2nd Floor, OPD-8"),
            Department(name="Cardiology", code="CARD", description="Echocardiography, ECG, cardiac risk assessment and post-MI management", head_doctor_name="Dr. A. K. Dutta", location="Block B, Ground Floor, Heart Care Wing"),
            Department(name="Dermatology & Venereology", code="DERM", description="Skin, hair, nails, allergies and cosmetic dermatology", head_doctor_name="Dr. R. Sengupta", location="Block A, Ground Floor, OPD-4"),
            Department(name="ENT & Head-Neck Surgery", code="ENT", description="Ear, nose, throat diagnostics and microsurgery", head_doctor_name="Dr. M. Roy", location="Block C, 1st Floor, OPD-10"),
        ]
        db.add_all(depts)
        db.flush()

        # 2. Users
        users = [
            User(email="admin@sanakahospital.com", full_name="Dr. B. K. Roy (Admin)", role="admin", hashed_password=get_password_hash("Sanaka@2026"), is_active=True),
            User(email="dr.ananya@sanakahospital.com", full_name="Dr. Ananya Sen", role="doctor", hashed_password=get_password_hash("Doctor@2026"), is_active=True),
            User(email="dr.subhash@sanakahospital.com", full_name="Dr. Subhashish Chatterjee", role="doctor", hashed_password=get_password_hash("Doctor@2026"), is_active=True),
            User(email="dr.priya@sanakahospital.com", full_name="Dr. Priya Banerjee", role="doctor", hashed_password=get_password_hash("Doctor@2026"), is_active=True),
            User(email="receptionist@sanakahospital.com", full_name="Rajesh Mukherjee (Front Desk)", role="receptionist", hashed_password=get_password_hash("Staff@2026"), is_active=True)
        ]
        db.add_all(users)
        db.flush()

        # 3. Doctor Profiles
        doctors = [
            Doctor(user_id=users[1].id, department_id=depts[0].id, specialization="Internal Medicine", qualification="MBBS, MD (Medicine)", room_number="OPD-102", contact_number="+91 98321 44551", reg_number="WBMC/68421", is_available=True),
            Doctor(user_id=users[2].id, department_id=depts[1].id, specialization="Orthopedic Surgery", qualification="MBBS, MS (Ortho), DNB", room_number="OPD-204", contact_number="+91 98321 44552", reg_number="WBMC/54129", is_available=True),
            Doctor(user_id=users[3].id, department_id=depts[2].id, specialization="Pediatrics", qualification="MBBS, MD (Pediatrics)", room_number="OPD-108", contact_number="+91 98321 44553", reg_number="WBMC/72910", is_available=True),
        ]
        db.add_all(doctors)
        db.flush()

        # 4. Patients (Fictional)
        patients = [
            Patient(
                patient_id="SAN-2026-00001",
                full_name="Rahul Das",
                dob="1981-06-14",
                gender="Male",
                phone="9832101122",
                email="rahul.das@demo-sanaka.org",
                address="Near City Centre, B-Zone, Durgapur",
                city="Durgapur",
                state="West Bengal",
                pincode="713205",
                emergency_contact_name="Sunita Das",
                emergency_contact_phone="9832101123",
                emergency_relation="Spouse",
                blood_group="B+",
                occupation="Steel Plant Executive",
                known_allergies="No known drug allergies (NKDA)"
            ),
            Patient(
                patient_id="SAN-2026-00002",
                full_name="Sunita Ghosh",
                dob="1988-11-03",
                gender="Female",
                phone="9434123890",
                email="sunita.ghosh@demo-sanaka.org",
                address="Malandighi Village Road, Durgapur",
                city="Durgapur",
                state="West Bengal",
                pincode="713212",
                emergency_contact_name="Prabir Ghosh",
                emergency_contact_phone="9434123891",
                emergency_relation="Husband",
                blood_group="O+",
                occupation="Primary School Teacher",
                known_allergies="Ciprofloxacin allergy (Skin rash)"
            ),
            Patient(
                patient_id="SAN-2026-00003",
                full_name="Amitava Sen",
                dob="1974-03-22",
                gender="Male",
                phone="9876543210",
                email="amitava.sen@demo-sanaka.org",
                address="Fuljhore Township, Durgapur",
                city="Durgapur",
                state="West Bengal",
                pincode="713206",
                emergency_contact_name="Madhumita Sen",
                emergency_contact_phone="9876543211",
                emergency_relation="Wife",
                blood_group="A+",
                occupation="Bank Officer",
                known_allergies="None"
            ),
            Patient(
                patient_id="SAN-2026-00004",
                full_name="Aarav Mondal",
                dob="2019-08-15",
                gender="Male",
                phone="9123456780",
                email="mondal.family@demo-sanaka.org",
                address="Muchipara, Durgapur",
                city="Durgapur",
                state="West Bengal",
                pincode="713210",
                emergency_contact_name="Debabrata Mondal",
                emergency_contact_phone="9123456780",
                emergency_relation="Father",
                blood_group="AB+",
                occupation="Student",
                known_allergies="Egg albumin mild allergy"
            ),
            Patient(
                patient_id="SAN-2026-00005",
                full_name="Meera Chatterjee",
                dob="1997-01-19",
                gender="Female",
                phone="9933011445",
                email="meera.c@demo-sanaka.org",
                address="Bidhan Nagar, Durgapur",
                city="Durgapur",
                state="West Bengal",
                pincode="713212",
                emergency_contact_name="Ronojoy Chatterjee",
                emergency_contact_phone="9933011446",
                emergency_relation="Husband",
                blood_group="O-",
                occupation="Software Engineer",
                known_allergies="None"
            )
        ]
        db.add_all(patients)
        db.flush()

        # 5. Patient Cases (Realistic Medical Records)
        # Case 1 for Rahul Das (General Medicine)
        case1 = PatientCase(
            case_number="CAS-2026-00001",
            patient_id=patients[0].id,
            doctor_id=doctors[0].id,
            department_id=depts[0].id,
            visit_date=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            status="completed",
            chief_complaint="Throbbing headache and epigastric burning discomfort",
            chief_complaint_duration="4 days",
            chief_complaint_severity="Moderate",
            chief_complaint_onset="Gradual",
            additional_complaints="Occasional post-prandial nausea, mild sleep disturbance due to work stress",
            present_illness_history="A 45-year-old male with history of untreated borderline hypertension presents with persistent occipital morning headache and acid regurgitation for 4 days. Denies blurred vision, chest pain, shortness of breath, or vomiting.",
            general_examination="Conscious, oriented, moderately built. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or pedal edema.",
            systemic_examination="CVS: S1 S2 heard, regular rate, no murmurs. RS: Bilateral vesicular breath sounds, no added sounds. P/A: Soft, mild epigastric tenderness, no organomegaly. CNS: Grossly intact, no focal deficits.",
            examination_notes="Fundoscopy: Normal disc margins, no signs of hypertensive retinopathy.",
            provisional_diagnosis="Essential Hypertension Stage-1; Gastroesophageal Reflux Disease (GERD)",
            final_diagnosis="Primary Essential Hypertension; Acid Peptic Disease",
            differential_diagnosis="Tension headache, Secondary hypertension (Renal)",
            assessment_notes="Patient requires baseline antihypertensive therapy alongside lifestyle modifications (low salt, stress management). Antacid support for acute GERD relief.",
            treatment_plan="Initiate Tab. Telmisartan 40mg once daily in morning. Cap. Pantoprazole 40mg + Domperidone 30mg before breakfast. Dietary sodium restriction (< 5g/day).",
            dietary_advice="Low sodium diet, avoid oily and deep fried foods, late night heavy meals, maintain 2 hour gap between dinner and sleep.",
            lifestyle_advice="Brisk walking for 30 minutes 5 days a week. Maintain a home BP monitoring log.",
            follow_up_date=(datetime.date.today() + datetime.timedelta(days=12)).strftime("%Y-%m-%d"),
            follow_up_instructions="Review in OPD with daily blood pressure chart and fasting lipid profile.",
            ai_generated_summary="45-year-old male evaluated for occipital headaches and acid regurgitation. Diagnosed with Stage-1 Primary Hypertension and GERD. BP stabilized on Tab. Telmisartan 40mg OD and Cap. Pan-D. Recommended low-salt diet and aerobic exercise. Scheduled OPD review with BP log.",
            ai_reviewed_by_doctor=True
        )
        db.add(case1)
        db.flush()

        vitals1 = VitalSigns(
            case_id=case1.id,
            temperature=98.4,
            temperature_unit="F",
            blood_pressure_systolic=148,
            blood_pressure_diastolic=94,
            heart_rate=78,
            respiratory_rate=16,
            spo2=99.0,
            weight_kg=76.0,
            height_cm=174.0,
            bmi=25.1,
            pain_score=3
        )
        med_hist1 = MedicalHistory(
            case_id=case1.id,
            past_diseases="Occasional acidity, Borderline elevated blood pressure noticed 6 months ago",
            past_surgeries="None",
            current_medications="Over-the-counter Antacid gels occasionally",
            drug_allergies="None known",
            family_history="Father has hypertension and coronary artery disease",
            smoking_history="Non-smoker",
            alcohol_history="Social (occasional)",
            other_lifestyle="Sedentary desk job, 6 hours average sleep"
        )
        rx1 = Prescription(
            case_id=case1.id,
            patient_id=patients[0].id,
            doctor_id=doctors[0].id,
            date=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            general_instructions="Take all medicines with water as prescribed. Report immediately if experiencing severe dizziness or chest tightness.",
            status="active"
        )
        db.add_all([vitals1, med_hist1, rx1])
        db.flush()

        rx1_items = [
            PrescriptionItem(prescription_id=rx1.id, medicine_name="Tab. Telmisartan 40 mg", dosage="1 Tablet", route="Oral", frequency="1-0-0 (Morning)", duration="30 days", instructions="After breakfast"),
            PrescriptionItem(prescription_id=rx1.id, medicine_name="Cap. Pantoprazole 40mg + Domperidone 30mg SR", dosage="1 Capsule", route="Oral", frequency="1-0-0 (Morning)", duration="14 days", instructions="30 mins before breakfast"),
            PrescriptionItem(prescription_id=rx1.id, medicine_name="Tab. Paracetamol 650 mg", dosage="1 Tablet", route="Oral", frequency="SOS (If severe headache)", duration="3 days", instructions="After meals, max 3 times daily")
        ]
        db.add_all(rx1_items)

        # 6. Appointments for Today and upcoming
        today_str = datetime.date.today().strftime("%Y-%m-%d")
        appts = [
            Appointment(
                patient_id=patients[0].id,
                doctor_id=doctors[0].id,
                department_id=depts[0].id,
                appointment_date=today_str,
                time_slot="09:30 AM - 10:00 AM",
                token_number=1,
                reason_for_visit="Hypertension review & blood pressure checkup",
                status="checked_in"
            ),
            Appointment(
                patient_id=patients[1].id,
                doctor_id=doctors[0].id,
                department_id=depts[0].id,
                appointment_date=today_str,
                time_slot="10:00 AM - 10:30 AM",
                token_number=2,
                reason_for_visit="Fasting blood sugar follow-up & generalized weakness",
                status="scheduled"
            ),
            Appointment(
                patient_id=patients[2].id,
                doctor_id=doctors[1].id,
                department_id=depts[1].id,
                appointment_date=today_str,
                time_slot="10:30 AM - 11:00 AM",
                token_number=1,
                reason_for_visit="Bilateral knee joint pain on climbing stairs",
                status="checked_in"
            ),
            Appointment(
                patient_id=patients[3].id,
                doctor_id=doctors[2].id,
                department_id=depts[2].id,
                appointment_date=today_str,
                time_slot="11:00 AM - 11:30 AM",
                token_number=1,
                reason_for_visit="Fever with cold and sore throat for 2 days",
                status="scheduled"
            )
        ]
        db.add_all(appts)

        # 7. Initial Audit Log
        db.add(AuditLog(
            user_id=users[0].id,
            user_name="Dr. B. K. Roy (Admin)",
            user_role="admin",
            action="SYSTEM_INITIALIZED",
            entity_type="System",
            entity_id="1",
            details="Sanaka Hospital EMR & Case-Taking system initialized with demo clinical departments and master rosters."
        ))

        db.commit()
        print("Sanaka Hospital demo data successfully seeded!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

