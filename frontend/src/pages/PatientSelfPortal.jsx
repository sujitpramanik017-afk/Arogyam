import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { getTodayLocalDate } from '../utils/date';
import { ArogyaChatbot } from '../components/ArogyaChatbot';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Stethoscope,
  Building2,
  AlertCircle,
  FileText,
  Pill,
  Printer,
  ArrowRight,
  Activity,
  ChevronRight,
  Search,
  Sparkles,
  Bot,
  HelpCircle
} from 'lucide-react';

export const PatientSelfPortal = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activeMode, setActiveMode] = useState('book'); // 'book', 'records', or 'arogya'
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Form State for Self Booking
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    city: 'Kolkata',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: 'B+',
    known_allergies: 'None',
    chief_complaint: '',
    chief_complaint_duration: '2 days',
    present_illness_history: '',
    past_diseases: '',
    current_medications: '',
    doctor_id: '',
    department_id: '',
    appointment_date: getTodayLocalDate(),
    time_slot: '10:00 AM - 10:30 AM',
  });

  // Records Lookup State
  const [lookupPhone, setLookupPhone] = useState('');
  const [patientRecords, setPatientRecords] = useState(null);
  const [searchingRecords, setSearchingRecords] = useState(false);

  useEffect(() => {
    loadSpecialists();
  }, []);

  const loadSpecialists = async () => {
    try {
      const [docs, depts] = await Promise.all([
        api.getDoctors({ available_only: true }),
        api.getDepartments()
      ]);
      setDoctors(docs || []);
      setDepartments(depts || []);
      if (docs && docs.length > 0) {
        setFormData((prev) => ({
          ...prev,
          doctor_id: docs[0].id,
          department_id: docs[0].department_id,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'doctor_id') {
      const docId = parseInt(value);
      const doc = doctors.find((d) => d.id === docId);
      setFormData((prev) => ({
        ...prev,
        doctor_id: docId,
        department_id: doc ? doc.department_id : prev.department_id,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    const docId = parseInt(formData.doctor_id);
    if (!formData.full_name || !formData.phone || !formData.dob || !formData.chief_complaint || !docId) {
      showError('Please complete all required fields (Name, Phone, DOB, Symptoms, Doctor)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        doctor_id: docId,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
      };
      const res = await api.patientSelfBook(payload);
      setConfirmedBooking(res);
      showSuccess('OPD Appointment Confirmed! Your intake data is submitted to the Doctor.');
    } catch (err) {
      console.error('Booking submission error:', err);
      showError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupPhone.trim()) {
      showError('Please enter your mobile number or Patient ID');
      return;
    }

    setSearchingRecords(true);
    try {
      const res = await api.patientLookupRecords(lookupPhone);
      setPatientRecords(res);
      showSuccess(`Records found for ${res.patient.full_name}`);
    } catch (err) {
      showError(err.message || 'No records found matching this number or ID');
      setPatientRecords(null);
    } finally {
      setSearchingRecords(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/arogyam_logo.png"
            alt="Arogyam Hospital"
            className="h-12 w-auto rounded-md"
          />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">AROGYAM HOSPITALS</h1>
            <p className="text-[11px] text-blue-400 font-medium">
              Patient Self-Service Portal · Online OPD Intake & Token Booking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveMode('arogya')}
            className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/40 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🌿 Ask Arogya FAQ</span>
          </button>
          <Link
            to="/login"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
          >
            <span>Staff Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1">
        {/* Hospital Hero Highlights Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">24x7 Emergency</div>
              <div className="text-[10px] text-slate-400">Casualty & Trauma Care</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Online OPD Tokens</div>
              <div className="text-[10px] text-slate-400">Self-Booking Portal</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Specialist Doctors</div>
              <div className="text-[10px] text-slate-400">8+ Medical Departments</div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Arogya AI Assistant</div>
              <div className="text-[10px] text-slate-400">Bilingual Hospital FAQ</div>
            </div>
          </div>
        </div>

        {/* 2-Column Homepage Grid: Left Services + Right Arogya Chatbot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7/12): Patient Portal Services & Booking */}
          <div className="lg:col-span-7 space-y-4">
            {/* Mode Selector Tabs */}
            <div className="flex border-b border-slate-800 gap-2">
              <button
                onClick={() => { setActiveMode('book'); setConfirmedBooking(null); }}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer ${
                  activeMode === 'book'
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>1. Book OPD Token</span>
              </button>

              <button
                onClick={() => setActiveMode('records')}
                className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition flex items-center gap-2 cursor-pointer ${
                  activeMode === 'records'
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>2. My Prescriptions & Records</span>
              </button>
            </div>

        {/* MODE 1: BOOKING FORM */}
        {activeMode === 'book' && !confirmedBooking && (
          <form onSubmit={handleSubmitBooking} className="space-y-6 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <span>Patient Pre-Consultation & Online OPD Appointment</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your details and health complaints below. Your preliminary medical data will be pre-loaded into the Doctor's consultation console.
              </p>
            </div>

            {/* Section 1: Demographics */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                1. Patient Identity & Contact
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Chandra Ghosh"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Blood Group</label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Residential address / locality, Salt Lake City, Kolkata"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Symptoms */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                2. Reason for Visit & Health Information (Direct to Doctor)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Main Symptoms / Chief Complaint *
                  </label>
                  <input
                    type="text"
                    required
                    name="chief_complaint"
                    value={formData.chief_complaint}
                    onChange={handleChange}
                    placeholder="e.g. High fever with body ache and cough"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration of Problem</label>
                  <input
                    type="text"
                    name="chief_complaint_duration"
                    value={formData.chief_complaint_duration}
                    onChange={handleChange}
                    placeholder="e.g. 2 days / 1 week"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Past Diseases / Ongoing Medications / Known Drug Allergies
                  </label>
                  <input
                    type="text"
                    name="past_diseases"
                    value={formData.past_diseases}
                    onChange={handleChange}
                    placeholder="e.g. Diabetic for 5 years on Metformin, Allergy to Penicillin (if any)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Select Doctor & Timing */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                3. Choose Doctor & OPD Consultation Slot
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Specialist Doctor *</label>
                  <select
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name} — {d.department_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Time Slot *</label>
                  <select
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                    <option value="04:30 PM - 05:00 PM">04:30 PM - 05:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Booking Consultation...' : 'Confirm Appointment & Generate Token'}</span>
              </button>
            </div>
          </form>
        )}

        {/* BOOKING CONFIRMATION SLIP */}
        {confirmedBooking && (
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-2xl space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">OPD Consultation Confirmed!</h2>
                <p className="text-xs text-emerald-400">
                  Your appointment and medical intake details are active in the doctor's queue.
                </p>
              </div>
            </div>

            {/* Token Badge */}
            <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your OPD Consultation Token
                </span>
                <div className="text-3xl font-black text-blue-400 font-mono mt-1">
                  TOKEN #{confirmedBooking.token_number}
                </div>
                <div className="text-xs text-slate-300 mt-1 font-mono">
                  Patient UHID: <strong>{confirmedBooking.patient_id}</strong>
                </div>
              </div>

              <div className="text-right text-xs text-slate-300 space-y-1">
                <div>Doctor: <strong className="text-white">Dr. {confirmedBooking.doctor_name}</strong></div>
                <div>Department: <strong className="text-blue-300">{confirmedBooking.department_name}</strong></div>
                <div>Date & Time: <strong className="text-amber-300">{confirmedBooking.appointment_date} · {confirmedBooking.time_slot}</strong></div>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-800/60 p-4 rounded-lg border border-slate-700 leading-relaxed">
              <strong>Instructions:</strong> Please present this token number or your registered mobile number at the OPD reception on arrival. Your symptom information has already been dispatched to Dr. {confirmedBooking.doctor_name}.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmedBooking(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: PATIENT RECORDS LOOKUP */}
        {activeMode === 'records' && (
          <div className="space-y-6 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <span>Find Your Medical Appointments & Prescriptions</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered mobile number or Patient ID (e.g. SAN-2026-00001) to view past visit records.
              </p>
            </div>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                required
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number or SAN-2026-XXXXX"
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={searchingRecords}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                {searchingRecords ? 'Searching...' : 'Search Records'}
              </button>
            </form>

            {patientRecords && (
              <div className="space-y-6 pt-4 border-t border-slate-800 text-xs">
                {/* Patient summary */}
                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">{patientRecords.patient.full_name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      UHID: {patientRecords.patient.patient_id} · Phone: {patientRecords.patient.phone}
                    </div>
                  </div>
                  <span className="bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded border border-rose-500/30">
                    Blood: {patientRecords.patient.blood_group || 'N/A'}
                  </span>
                </div>

                {/* Appointments list */}
                <div className="space-y-2">
                  <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Your OPD Appointments</h3>
                  <div className="space-y-2">
                    {patientRecords.appointments.map((a) => (
                      <div key={a.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">Token #{a.token_number} — Dr. {a.doctor_name} ({a.department})</div>
                          <div className="text-slate-400 text-[11px]">Date: {a.date} · Slot: {a.time_slot}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescriptions list */}
                {patientRecords.prescriptions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Your Prescriptions</h3>
                    <div className="space-y-2">
                      {patientRecords.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">Dr. {rx.doctor_name} ({rx.department})</div>
                            <div className="text-slate-400 text-[11px]">Date: {rx.date} · {rx.items_count} Medicines Prescribed</div>
                          </div>
                          <Link
                            to={`/prescriptions/${rx.id}`}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Pill className="w-3 h-3" />
                            <span>View Rx Pad</span>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column (5/12): Live Embedded Arogya AI Assistant Panel */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Ask Arogya</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    LIVE AI FAQ
                  </span>
                </h2>
                <p className="text-[11px] text-emerald-400">Hospital FAQ, OPD timings, doctors & facilities</p>
              </div>
            </div>
            <a
              href="tel:+919083284529"
              className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Phone className="w-3 h-3" />
              <span>Call Helpline</span>
            </a>
          </div>

          {/* Embedded Chatbot Component */}
          <ArogyaChatbot isFloating={false} />
        </div>
      </div>
    </div>
  </div>

  {/* Footer */}
  <div className="max-w-7xl mx-auto w-full text-center text-[11px] text-slate-500 pt-6 border-t border-slate-800 mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
    <span>Arogyam Hospital · Salt Lake City, Kolkata, West Bengal, India</span>
    <span>Helpline: <strong className="text-slate-300">+91-9083284529</strong> · 24x7 Emergency Services</span>
  </div>

  {/* Floating Ask Arogya Chatbot */}
  <ArogyaChatbot isFloating={true} initialOpen={false} />
</div>
  );
};
