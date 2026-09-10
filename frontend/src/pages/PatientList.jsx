import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ClipboardPenLine,
  Calendar,
  Phone,
  MapPin,
  HeartPulse,
  Eye,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react';

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('All');
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Patient Form State
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
    loadPatients();
  }, [search, genderFilter, bloodGroupFilter]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients({
        search,
        gender: genderFilter,
        blood_group: bloodGroupFilter,
      });
      setPatients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedPatient(p);
    setEditForm({
      full_name: p.full_name || '',
      dob: p.dob || '',
      gender: p.gender || 'Male',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      city: p.city || 'Kolkata',
      state: p.state || 'West Bengal',
      pincode: p.pincode || '700091',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || '',
      emergency_relation: p.emergency_relation || 'Family',
      blood_group: p.blood_group || 'B+',
      occupation: p.occupation || '',
      known_allergies: p.known_allergies || '',
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (p) => {
    setSelectedPatient(p);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !editForm.full_name || !editForm.phone || !editForm.dob || !editForm.address) {
      showError('Please complete required fields (Name, Phone, DOB, Address)');
      return;
    }

    setSubmitting(true);
    try {
      await api.updatePatient(selectedPatient.id, editForm);
      showSuccess(`Patient record for ${editForm.full_name} updated successfully.`);
      setShowEditModal(false);
      loadPatients();
    } catch (err) {
      showError(err.message || 'Failed to update patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const res = await api.deletePatient(selectedPatient.id);
      showSuccess(res.message || `Patient ${selectedPatient.full_name} deleted.`);
      setShowDeleteModal(false);
      loadPatients();
    } catch (err) {
      showError(err.message || 'Failed to delete patient');
    } finally {
      setSubmitting(false);
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'receptionist';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Patient Directory & Master Index</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, register, update demographics, change name and manage electronic health records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPatients}
            disabled={loading}
            title="Refresh Directory"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold"
          >
            <span>Refresh</span>
          </button>
          {canManage && (
            <Link
              to="/patients/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient ID (SAN-2026-...), Name, Phone number, City..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Gender Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Gender:</span>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Blood:</span>
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All</option>
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
        </div>
      </div>

      {/* Patient List Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          Loading patient directory...
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-3">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-semibold text-slate-700">No patients found</div>
          <p className="text-slate-400">
            No matching patient records were found for the search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition">
                      <Link to={`/patients/${p.id}`}>{p.full_name}</Link>
                    </h3>
                    <div className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">
                      {p.patient_id}
                    </div>
                  </div>
                  {p.blood_group && (
                    <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded">
                      {p.blood_group}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Demographics:</span>
                    <span>{p.gender} · DOB: {p.dob}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{p.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.city}, {p.state}</span>
                  </div>

                  {p.known_allergies && p.known_allergies !== 'None' && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      Allergy: {p.known_allergies}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Visits: <strong className="text-slate-800">{p.total_visits}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {user?.role === 'doctor' && (
                      <Link
                        to={`/cases/new?patient_id=${p.id}`}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition"
                      >
                        New Case
                      </Link>
                    )}
                    <Link
                      to={`/patients/${p.id}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Admin & Reception Management Bar */}
                {canManage && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5 text-xs">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit / Change Name</span>
                    </button>

                    <button
                      onClick={() => handleOpenDelete(p)}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded text-[11px] flex items-center gap-1 transition cursor-pointer border border-rose-200"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. EDIT PATIENT MODAL (CHANGE NAME & DETAILS) */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Patient & Change Name</span>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  {selectedPatient.patient_id}
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
      {showDeleteModal && selectedPatient && (
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
              <div>Patient: <strong className="text-slate-900">{selectedPatient.full_name}</strong></div>
              <div>UHID: <strong className="font-mono text-blue-700">{selectedPatient.patient_id}</strong></div>
              <div>Phone: <strong className="font-mono">{selectedPatient.phone}</strong></div>
              <p className="text-rose-600 font-medium pt-1 text-[11px]">
                ⚠️ Warning: Deleting this patient will also permanently purge their appointments, historical clinical cases, vitals, and prescriptions.
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

