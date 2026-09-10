import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { VitalsBadge } from '../components/VitalsBadge';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  ClipboardPenLine,
  Pill,
  Clock,
  FileText,
  AlertTriangle,
  ChevronRight,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

export const PatientProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [cases, setCases] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_relation: 'Family',
    blood_group: 'B+',
    occupation: '',
    known_allergies: '',
  });

  useEffect(() => {
    loadPatientHistory();
  }, [id]);

  const loadPatientHistory = async () => {
    setLoading(true);
    try {
      const [ptData, casesData, rxData] = await Promise.all([
        api.getPatient(id),
        api.getCases({ patient_id: id }),
        api.getPrescriptions({ patient_id: id })
      ]);
      setPatient(ptData);
      setCases(casesData || []);
      setPrescriptions(rxData || []);
      if (ptData) {
        setEditForm({
          full_name: ptData.full_name || '',
          dob: ptData.dob || '',
          gender: ptData.gender || 'Male',
          phone: ptData.phone || '',
          email: ptData.email || '',
          address: ptData.address || '',
          city: ptData.city || 'Kolkata',
          state: ptData.state || 'West Bengal',
          pincode: ptData.pincode || '700091',
          emergency_contact_name: ptData.emergency_contact_name || '',
          emergency_contact_phone: ptData.emergency_contact_phone || '',
          emergency_relation: ptData.emergency_relation || 'Family',
          blood_group: ptData.blood_group || 'B+',
          occupation: ptData.occupation || '',
          known_allergies: ptData.known_allergies || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name || !editForm.phone || !editForm.dob || !editForm.address) {
      showError('Please complete required fields (Name, Phone, DOB, Address)');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.updatePatient(patient.id, editForm);
      setPatient(updated);
      showSuccess(`Patient record for ${updated.full_name} updated successfully.`);
      setShowEditModal(false);
    } catch (err) {
      showError(err.message || 'Failed to update patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.deletePatient(patient.id);
      showSuccess(res.message || `Patient ${patient.full_name} deleted.`);
      setShowDeleteModal(false);
      navigate('/patients');
    } catch (err) {
      showError(err.message || 'Failed to delete patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        Loading patient medical record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        Patient record not found.
      </div>
    );
  }

  const canManage = user?.role === 'admin' || user?.role === 'receptionist';

  return (
    <div className="space-y-6">
      {/* Top Patient Master Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/patients')}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Patient Directory</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              {patient.patient_id}
            </span>
            {patient.blood_group && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                {patient.blood_group}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
            <span>{patient.gender} · DOB: {patient.dob}</span>
            <span>· Phone: {patient.phone}</span>
            <span>· Address: {patient.address}, {patient.city}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit / Change Name</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            </>
          )}

          {user?.role === 'doctor' && (
            <Link
              to={`/cases/new?patient_id=${patient.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
            >
              <ClipboardPenLine className="w-4 h-4" />
              <span>Take New Case</span>
            </Link>
          )}

          <Link
            to={`/appointments?patient_id=${patient.id}`}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            Book OPD Visit
          </Link>
        </div>
      </div>

      {/* Allergies & Emergency Alerts Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Recorded Drug Allergies & Warnings
            </div>
            <div className="text-xs font-medium text-amber-800 mt-0.5">
              {patient.known_allergies || 'No known drug allergies (NKDA) recorded'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
          <Phone className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Emergency Contact Information
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              {patient.emergency_contact_name
                ? `${patient.emergency_contact_name} (${patient.emergency_relation}) — ${patient.emergency_contact_phone}`
                : 'No emergency contact on file'}
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Case Records & Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardPenLine className="w-4 h-4 text-blue-600" />
              <span>Consultation History & Case Sheets</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                {cases.length} Total Visits
              </span>
            </h2>
            <p className="text-xs text-slate-500">Chronological history of patient OPD consultations</p>
          </div>
        </div>

        <div className="p-5">
          {cases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No previous case sheets recorded for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                        {c.case_number}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        Date: {new Date(c.visit_date).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-500">
                        · Doctor: Dr. {c.doctor?.full_name || 'Attending Physician'} ({c.department?.name || 'General'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      <Link
                        to={`/cases/report/${c.id}`}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Case Summary Report</span>
                      </Link>
                    </div>
                  </div>

                  {/* Vitals Bar */}
                  {c.vitals && (
                    <div className="pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Recorded Vital Signs:
                      </div>
                      <VitalsBadge vitals={c.vitals} />
                    </div>
                  )}

                  {/* Chief Complaint & Assessment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">Chief Complaint:</span>
                      <p className="text-slate-600">
                        {c.chief_complaint || 'General medical follow-up'}
                        {c.chief_complaint_duration && ` (${c.chief_complaint_duration})`}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">Clinical Assessment / Diagnosis:</span>
                      <p className="text-slate-800 font-medium">
                        {c.final_diagnosis || c.provisional_diagnosis || 'Under evaluation'}
                      </p>
                    </div>
                  </div>

                  {/* AI Summary note if present */}
                  {c.ai_generated_summary && (
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-blue-800 block mb-0.5">
                        Clinical Case Synopsis:
                      </span>
                      {c.ai_generated_summary}
                    </div>
                  )}

                  {/* Prescription shortcut */}
                  {c.prescription && c.prescription.items && c.prescription.items.length > 0 && (
                    <div className="pt-1 flex items-center justify-between">
                      <div className="text-xs text-slate-600">
                        Prescribed: <strong>{c.prescription.items.length} Medicines</strong>
                      </div>
                      <Link
                        to={`/prescriptions/${c.prescription.id}`}
                        className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>View / Print Prescription</span>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 1. EDIT PATIENT MODAL */}
      {showEditModal && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Patient & Change Name</span>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {patient.patient_id}
                </span>
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Patient Full Name (Change Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender *</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Blood Group</label>
                  <select
                    value={editForm.blood_group}
                    onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
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

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Emergency Contact Person</label>
                  <input
                    type="text"
                    value={editForm.emergency_contact_name}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                    placeholder="Contact person name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editForm.emergency_contact_phone}
                    onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Known Drug Allergies</label>
                  <input
                    type="text"
                    value={editForm.known_allergies}
                    onChange={(e) => setEditForm({ ...editForm, known_allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Paracetamol, Sulfa drugs (or None)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save Updated Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DELETE PATIENT CONFIRMATION MODAL */}
      {showDeleteModal && patient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Patient Record</h3>
                <p className="text-xs text-rose-600 font-medium">Permanent Record Deletion</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div>Patient: <strong className="text-slate-900">{patient.full_name}</strong></div>
              <div>UHID: <strong className="font-mono text-blue-700">{patient.patient_id}</strong></div>
              <div>Phone: <strong className="font-mono">{patient.phone}</strong></div>
              <p className="text-rose-600 font-medium pt-1 text-[11px]">
                ⚠️ Warning: Deleting this patient will permanently purge all their consultation history, prescriptions, and scheduled appointments.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Confirm Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
