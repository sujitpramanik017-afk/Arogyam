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
            "disclaimer": "AI-structured note draft • Requires physician confirmation."
        }

    @staticmethod
    def arogya_chat(message: str, lang_pref: str = "auto") -> dict:
        text = message.strip()
        text_lower = text.lower()
        
        # Language detection
        is_bengali = bool(re.search(r'[\u0980-\u09FF]', text)) or lang_pref == "bn"
        lang = "bn" if is_bengali else "en"

        # 1. STRICT MEDICAL SAFETY CHECK
        # Symptoms, diagnosis, medication recommendations, dosages
        medical_keywords_en = [
            "medicine", "tablet", "capsule", "syrup", "dosage", "dose", "antibiotic",
            "take medicine", "which medicine", "what medicine", "cure", "treatment for",
            "fever", "headache", "chest pain", "stomach pain", "vomiting", "diarrhea",
            "cough", "throat pain", "cold", "flu", "dizziness", "rash", "allergy medicine",
            "bp high", "blood pressure high", "sugar high", "diabetes medicine", "diagnose",
            "disease", "infection", "pain in", "symptom"
        ]
        medical_keywords_bn = [
            "ওষুধ", "ঔষধ", "ট্যাবলেট", "ডোজ", "কী ওষুধ", "কোন ওষুধ", "খাব", "খাওয়া উচিত",
            "জ্বর", "মাথাব্যথা", "বুকে ব্যথা", "পেটে ব্যথা", "বমি", "কাশি", "সর্দি", "ডায়রিয়া",
            "প্রেসার বেশি", "সুগার বেশি", "চিকিৎসা কী", "কী করব", "উপশম", "অ্যালার্জি", "রোগ"
        ]

        is_asking_medical = any(k in text_lower for k in medical_keywords_en) or any(k in text for k in medical_keywords_bn)
        is_emergency = any(k in text_lower for k in ["heart attack", "unconscious", "heavy bleeding", "accident", "emergency", "stroke", "cannot breathe", "breathless"]) or any(k in text for k in ["অচেতন", "রক্তপাত", "হার্ট অ্যাটাক", "অ্যাক্সিডেন্ট", "জরুরি", "শ্বাসকষ্ট"])

        if is_emergency:
            if is_bengali:
                reply = "🚨 এটি একটি জরুরি পরিস্থিতি হতে পারে! অনুগ্রহ করে অবিলম্বে আরোগ্যম হাসপাতালের ২৪x৭ এমার্জেন্সি ও ট্রমা বিভাগে (+91-9083284529) যোগাযোগ করুন বা নিকটস্থ জরুরি চিকিৎসা কেন্দ্রে যান।"
            else:
                reply = "🚨 If you believe this is a medical emergency, please seek immediate medical attention or contact the Arogyam Hospital 24x7 Emergency Department directly at +91-9083284529."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": True,
                "suggested_actions": ["Emergency Services", "Contact Hospital"],
                "hospital_phone": "+91-9083284529"
            }

        if is_asking_medical:
            if is_bengali:
                reply = "আমি আরোগ্য, আরোগ্যম হাসপাতালের তথ্য সহকারী। আমি হাসপাতাল ও ওপিডি সম্পর্কিত তথ্য দিয়ে সাহায্য করতে পারি, কিন্তু কোনো রোগ নির্ণয় বা ওষুধের পরামর্শ দিতে পারি না। অনুগ্রহ করে সঠিক চিকিৎসা ও পরামর্শের জন্য আমাদের হাসপাতালে একজন যোগ্য ডাক্তারের সাথে পরামর্শ করুন। জরুরি প্রয়োজনে কল করুন: +91-9083284529।"
            else:
                reply = "I’m Arogya, the hospital information assistant. I can help with hospital-related information, but I cannot diagnose conditions or recommend medicines. Please consult a qualified doctor. If you believe this is a medical emergency, please seek immediate medical attention or contact the hospital emergency department."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": True,
                "suggested_actions": ["How to Book an Appointment?", "Doctors & Departments", "Emergency Services"],
                "hospital_phone": "+91-9083284529"
            }

        # 2. VERIFIED HOSPITAL KNOWLEDGE ROUTING
        # Contact / Phone
        if any(k in text_lower for k in ["contact", "phone", "number", "call", "helpline", "mobile", "address", "location", "where", "reach", "email"]) or any(k in text for k in ["ফোন", "নম্বর", "যোগাযোগ", "কল", "হেল্পলাইন", "ঠিকানা", "কোথায়"]):
            if is_bengali:
                reply = "📞 আপনি আরোগ্যম হাসপাতালে যোগাযোগ করতে পারেন:\n• হেল্পলাইন নম্বর: +91-9083284529\n• ঠিকানা: সল্টলেক সিটি, কলকাতা, পশ্চিমবঙ্গ, ভারত\n• জরুরি পরিষেবা: ২৪ ঘণ্টা খোলা।"
            else:
                reply = "📞 You can contact Arogyam Hospital at +91-9083284529.\n• Location: Salt Lake City, Kolkata, West Bengal, India.\n• Emergency Helpline: Open 24x7."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Hospital Timings", "How to Book an Appointment?"],
                "hospital_phone": "+91-9083284529"
            }

        # Timings / Hours
        if any(k in text_lower for k in ["time", "timing", "hours", "open", "close", "schedule", "sunday", "opd time"]) or any(k in text for k in ["সময়", "সময়সূচী", "কখন", "খোলা", "বন্ধ", "রবিবার", "ওপিডি"]):
            if is_bengali:
                reply = "🏥 আরোগ্যম হাসপাতালের ওপিডি (OPD) সময়সূচী:\n• বহির্বিভাগ (OPD): সোমবার থেকে শনিবার সকাল ৮:০০ টা থেকে বিকেল ৫:০০ টা (সকালের স্লট: ৮:০০ - ১:০০, দুপুরের স্লট: ২:০০ - ৫:০০)।\n• জরুরি ও ট্রমা বিভাগ (Casualty): ২৪ ঘণ্টা, সপ্তাহের ৭ দিনই (২৪x৭) নিরবচ্ছিন্নভাবে খোলা থাকে।"
            else:
                reply = "🏥 Arogyam Hospital Outpatient Department (OPD) Timings:\n• OPD Hours: Monday to Saturday, 8:00 AM to 5:00 PM (Morning Slot: 8:00 AM - 1:00 PM, Afternoon Slot: 2:00 PM - 5:00 PM).\n• Emergency & Trauma Care Department: Open 24 hours a day, 7 days a week (24x7)."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["How to Book an Appointment?", "Doctors & Departments"],
                "hospital_phone": "+91-9083284529"
            }

        # Doctors & Departments
        if any(k in text_lower for k in ["doctor", "department", "specialist", "physician", "ortho", "cardio", "pediatric", "surgery", "gynec", "ent", "dermat"]) or any(k in text for k in ["ডাক্তার", "ডাক্তারবাবু", "বিভাগ", "স্পেশালিস্ট", "মেডিসিন", "অর্থোপেডিক", "শিশু", "সার্জারি", "কার্ডিওলজি"]):
            if is_bengali:
                reply = "👨‍⚕️ আরোগ্যম হাসপাতালের বিশেষজ্ঞ বিভাগ ও প্রধান চিকিৎসকগণ:\n• মেডিসিন বিভাগ: ডাঃ অনন্যা সেন\n• অর্থোপেডিকস ও ট্রমাটোলজি: ডাঃ শুভাশীষ চ্যাটার্জী\n• পেডিয়াট্রিকস ও শিশু স্বাস্থ্য: ডাঃ প্রিয়া ব্যানার্জী\n• জেনারেল ও ল্যাপারোস্কোপিক সার্জারি: ডাঃ কে. এন. মুখার্জী\n• স্ত্রীরোগ ও প্রসূতি (OBGYN): ডাঃ এস. মুখার্জী\n• কার্ডিওলজি (হৃদরোগ): ডাঃ এ. কে. দত্ত\n• চর্মরোগ (Dermatology): ডাঃ আর. সেনগুপ্ত\n• ইএনটি (ENT / নাক-কান-গলা): ডাঃ এম. রায়।"
            else:
                reply = "👨‍⚕️ Arogyam Hospital Specialized Clinical Departments & Doctors:\n• General Medicine: Dr. Ananya Sen\n• Orthopedics & Traumatology: Dr. Subhashish Chatterjee\n• Pediatrics & Child Health: Dr. Priya Banerjee\n• General & Laparoscopic Surgery: Dr. K. N. Mukherjee\n• Obstetrics & Gynecology: Dr. S. Mukherjee\n• Cardiology: Dr. A. K. Dutta\n• Dermatology & Venereology: Dr. R. Sengupta\n• ENT & Head-Neck Surgery: Dr. M. Roy."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["How to Book an Appointment?", "Hospital Timings"],
                "hospital_phone": "+91-9083284529"
            }

        # How to Book Appointment
        if any(k in text_lower for k in ["book", "appointment", "token", "slot", "schedule visit", "see doctor", "meet doctor"]) or any(k in text for k in ["বুকিং", "অ্যাপয়েন্টমেন্ট", "টোকেন", "বুক", "ডাক্তার দেখাব", "স্লট"]):
            if is_bengali:
                reply = "📅 ওপিডি অ্যাপয়েন্টমেন্ট বুকিং করার উপায়:\n১. অনলাইন সেলফ-পোর্টাল: আমাদের হোমপেজের 'Patient Self-Booking' অংশে আপনার নাম, মোবাইল নম্বর এবং কাঙ্ক্ষিত বিভাগ/ডাক্তার নির্বাচন করে তৎক্ষণাৎ টোকেন সংগ্রহ করুন।\n২. সরাসরি হাসপাতালে: গ্রাউন্ড ফ্লোরে ওপিডি রেজিস্ট্রেশন কাউন্টারে এসে সরাসরি টোকেন নিতে পারেন।\nসাহায্যের জন্য কল করুন: +91-9083284529।"
            else:
                reply = "📅 How to Book an OPD Appointment at Arogyam Hospital:\n1. Online Self-Booking Portal: You can book an OPD appointment directly on our homepage. Select your department/doctor, enter your details, and receive an instant consultation token.\n2. In-Person at Hospital: Visit the OPD Reception Counter on the Ground Floor.\nFor booking assistance, call +91-9083284529."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Registration Process", "Doctors & Departments"],
                "hospital_phone": "+91-9083284529"
            }

        # Registration Process / UHID
        if any(k in text_lower for k in ["register", "registration", "uhid", "patient id", "new patient", "first time", "card"]) or any(k in text for k in ["রেজিস্ট্রেশন", "রেজিস্টার", "আইডি", "নতুন রোগী", "কার্ড"]):
            if is_bengali:
                reply = "🧾 রোগী রেজিস্ট্রেশন প্রক্রিয়া:\n• আরোগ্যম হাসপাতালে প্রত্যেক রোগীকে একটি স্থায়ী ইউনিক পেশেন্ট আইডি (UHID - যেমন SAN-2026-XXXXX) দেওয়া হয়।\n• অনলাইন সেলফ-বুকিং পোর্টালে ফর্ম জমা দিলে আপনার আইডি স্বয়ংক্রিয়ভাবে তৈরি হয়।\n• হাসপাতালে আসার সময় অনুগ্রহ করে একটি বৈধ সরকারি পরিচয়পত্র (আধার/ভোটার কার্ড) ও ফোন নম্বর সঙ্গে রাখুন।"
            else:
                reply = "🧾 Patient Registration Process:\n• Every patient is issued a permanent Unique Hospital ID (UHID, e.g., SAN-2026-XXXXX) in the Master Patient Index.\n• You can register online instantly when booking an appointment on this portal, or at the Hospital Reception Desk.\n• Please bring a valid Government Photo ID (Aadhaar/Voter ID) and active phone number."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["How to Book an Appointment?", "Hospital Facilities"],
                "hospital_phone": "+91-9083284529"
            }

        # Emergency Services
        if any(k in text_lower for k in ["emergency", "casualty", "ambulance", "trauma", "urgent", "critical care", "icu", "nicu", "picu"]) or any(k in text for k in ["জরুরি", "এমার্জেন্সি", "অ্যাম্বুলেন্স", "ট্রমা", "আইসিইউ"]):
            if is_bengali:
                reply = "🚑 জরুরি ও ট্রমা পরিষেবা (২৪x৭):\n• আরোগ্যম হাসপাতালে ২৪ ঘণ্টা জরুরি বিভাগ, ট্রমা সেন্টার ও ক্রিটিক্যাল কেয়ার ইউনিট (ICU, ICCU, NICU, PICU) চালু রয়েছে।\n• ২৪ ঘণ্টার ডায়াগনস্টিক ল্যাব, ব্লাড ব্যাঙ্ক এবং অ্যাম্বুলেন্স পরিষেবা উপলব্ধ।\n• জরুরি হেল্পলাইন: +91-9083284529।"
            else:
                reply = "🚑 Emergency & Trauma Services (24x7):\n• Dedicated 24x7 Emergency Resuscitation & Trauma Wing with advanced ICU, ICCU, NICU, and PICU.\n• Round-the-clock Pathology, CT Scan, X-Ray, Blood Storage, and Ambulance dispatch.\n• 24x7 Emergency Contact: +91-9083284529."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Contact Hospital", "Hospital Facilities"],
                "hospital_phone": "+91-9083284529"
            }

        # Laboratory & Tests
        if any(k in text_lower for k in ["lab", "test", "blood test", "x-ray", "xray", "ct scan", "usg", "ultrasound", "ecg", "echo", "pathology", "diagnost"]) or any(k in text for k in ["ল্যাব", "টেস্ট", "রক্ত পরীক্ষা", "এক্স-রে", "সিটি স্ক্যান", "ইউএসজি", "প্যাথলজি"]):
            if is_bengali:
                reply = "🧪 ল্যাবরেটরি ও ডায়াগনস্টিক টেস্ট পরিষেবা:\n• ২৪x৭ কেন্দ্রীয় ল্যাব: বায়োকেমিস্ট্রি, হেমাটোলজি, মাইক্রোবায়োলজি ও প্যাথলজি রক্ত পরীক্ষা।\n• রেডিওলজি: ডিজিটাল এক্স-রে, ইউএসজি (USG), আধুনিক সিটি স্ক্যান (CT Scan)।\n• কার্ডিয়াক ডায়াগনস্টিক: ডিজিটাল ইসিজি (ECG) ও ইকোকার্ডিওগ্রাফি (ECHO)।\n• সমস্ত রিপোর্ট কম্পিউটারের মাধ্যমে দ্রুত সরবরাহ করা হয়।"
            else:
                reply = "🧪 Laboratory & Diagnostic Services:\n• 24x7 Central Pathology Lab: Complete Blood Count, Biochemistry, Microbiology, and Serology.\n• Radiology: Digital X-Ray, Ultrasonography (USG), and Multi-slice CT Scan.\n• Cardiac Diagnostics: 12-Lead ECG, 2D Echocardiography & Color Doppler.\n• Computerized fast digital report delivery."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Hospital Timings", "Contact Hospital"],
                "hospital_phone": "+91-9083284529"
            }

        # Prescription Information & Pharmacy
        if any(k in text_lower for k in ["prescription", "rx", "medicine store", "pharmacy", "medicines", "view prescription", "online report"]) or any(k in text for k in ["প্রেসক্রিপশন", "ফার্মেসি", "ওষুধের দোকান", "রিপোর্ট"]):
            if is_bengali:
                reply = "💊 প্রেসক্রিপশন ও ফার্মেসি সংক্রান্ত তথ্য:\n• ওপিডি পরামর্শের পর ডাক্তারবাবু ডিজিটাল প্রেসক্রিপশন প্রদান করেন।\n• আপনি এই পোর্টালে 'Lookup Records' অপশনে আপনার ফোন নম্বর দিয়ে প্রেসক্রিপশন দেখতে ও ডাউনলোড করতে পারেন।\n• হাসপাতালের নিজস্ব ২৪ ঘণ্টা ফার্মেসি থেকে সমস্ত প্রেসক্রাইবড ওষুধ পাওয়া যায়।"
            else:
                reply = "💊 Prescription & Pharmacy Information:\n• Electronic digital prescriptions are issued by the doctor following consultation.\n• You can view and download past prescriptions on this portal under 'My Records' using your registered mobile number.\n• Genuine prescribed medicines are available 24x7 at the Arogyam Hospital In-House Pharmacy."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["How to Book an Appointment?", "Hospital Facilities"],
                "hospital_phone": "+91-9083284529"
            }

        # Hospital Facilities
        if any(k in text_lower for k in ["facility", "facilities", "beds", "ot", "operation", "canteen", "wheelchair", "parking", "ward", "dialysis"]) or any(k in text for k in ["সুবিধা", "সুবিধাসমূহ", "বেড", "অপারেশন", "ক্যান্টিন", "হুইলচেয়ার", "ডায়ালাইসিস"]):
            if is_bengali:
                reply = "🏨 আরোগ্যম হাসপাতালের প্রধান সুবিধাসমূহ:\n• ৫০০+ শয্যাবিশিষ্ট জেনারেল ও প্রাইভেট কেবিন ওয়ার্ড।\n• অত্যাধুনিক মডুলার অপারেশন থিয়েটার (OT) ও ডায়ালাইসিস ইউনিট।\n• ২৪ ঘণ্টা ফার্মেসি, ব্লাড ব্যাঙ্ক ও ক্যাফেটেরিয়া।\n• রোগী ও বয়স্কদের জন্য বিনামূল্যে হুইলচেয়ার ও স্ট্রেচার সহায়তা এবং পর্যাপ্ত পার্কিং ব্যবস্থা।"
            else:
                reply = "🏨 Arogyam Hospital Facilities:\n• 500+ In-patient beds with General, Semi-private & Deluxe Cabins.\n• Modern Modular Operation Theatres & Dedicated Dialysis Unit.\n• 24x7 Pharmacy, Blood Storage Unit, and Hygenic Food Court/Canteen.\n• Free Wheelchair, Stretcher assistance, and spacious on-campus parking."
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Doctors & Departments", "Hospital Timings"],
                "hospital_phone": "+91-9083284529"
            }

        # General Greetings
        if any(k in text_lower for k in ["hello", "hi", "hey", "namaste", "good morning", "good evening", "shubho", "arogya", "help", "who are you"]) or any(k in text for k in ["নমস্কার", "হ্যালো", "হাই", "কেমন আছেন", "সাহায্য"]):
            if is_bengali:
                reply = "নমস্কার! আমি আরোগ্য, আরোগ্যম হাসপাতালের তথ্য সহকারী। আরোগ্যম হাসপাতালের ওপিডি সময়সূচী, ডাক্তারদের তালিকা, অ্যাপয়েন্টমেন্ট বুকিং বা হাসপাতালের সুবিধা সংক্রান্ত যেকোনো তথ্যের জন্য আমাকে জিজ্ঞাসা করতে পারেন।"
            else:
                reply = "Hello! I’m Arogya, the Arogyam Hospital Information Assistant. How can I help you with our OPD schedule, doctors, appointment booking, or hospital facilities today?"
            return {
                "reply": reply,
                "language": lang,
                "is_medical_warning": False,
                "suggested_actions": ["Hospital Timings", "Doctors & Departments", "How to Book an Appointment?", "Contact Hospital"],
                "hospital_phone": "+91-9083284529"
            }

        # 3. Fallback for unverified / unknown questions
        if is_bengali:
            reply = "দুঃখিত, এই বিষয়ে আমার কাছে যাচাইকৃত তথ্য নেই। অনুগ্রহ করে বিস্তারিত জানতে আরোগ্যম হাসপাতালের হেল্পলাইনে যোগাযোগ করুন: +91-9083284529।"
        else:
            reply = "Sorry, I don't have verified information about that. Please contact Arogyam Hospital at +91-9083284529."

        return {
            "reply": reply,
            "language": lang,
            "is_medical_warning": False,
            "suggested_actions": ["Contact Hospital", "How to Book an Appointment?", "Hospital Timings"],
            "hospital_phone": "+91-9083284529"
        }

