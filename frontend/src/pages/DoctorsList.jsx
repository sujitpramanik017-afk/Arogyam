import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Stethoscope,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  X,
  Search,
  Filter,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const DoctorsList = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state for Add
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: 'Doctor@2026',
    department_id: '',
    specialization: '',
    qualification: 'MBBS, MD',
    room_number: 'OPD-101',
    contact_number: '+91 90832 84529',
    reg_number: 'WBMC-2026-',
    is_available: true,
  });

  // Form state for Edit
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    specialization: '',
    qualification: '',
    room_number: '',
    contact_number: '',
    reg_number: '',
    is_available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, deptsData] = await Promise.all([
        api.getDoctors(),
        api.getDepartments()
      ]);
      setDoctors(docsData || []);
      setDepartments(deptsData || []);
      if (deptsData && deptsData.length > 0 && !addForm.department_id) {
        setAddForm((prev) => ({ ...prev, department_id: deptsData[0].id }));
      }
    } catch (err) {
      showError(err.message || 'Failed to load doctors roster');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setAddForm({
      full_name: '',
      email: '',
      password: 'Doctor@2026',
      department_id: departments[0]?.id || 1,
      specialization: '',
      qualification: 'MBBS, MD',
      room_number: 'OPD Wing',
      contact_number: '',
      reg_number: 'WBMC-',
      is_available: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (doc) => {
    setSelectedDoc(doc);
    setEditForm({
      full_name: doc.full_name,
      email: doc.email,
      password: '',
      department_id: doc.department_id,
      specialization: doc.specialization,
      qualification: doc.qualification,
      room_number: doc.room_number || '',
      contact_number: doc.contact_number || '',
      reg_number: doc.reg_number || '',
      is_available: doc.is_available,
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (doc) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.full_name || !addForm.email || !addForm.specialization || !addForm.qualification) {
      showError('Please fill in doctor name, email, specialization, and qualification.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createDoctor({
        ...addForm,
        department_id: parseInt(addForm.department_id),
      });
      showSuccess(`Dr. ${addForm.full_name} added to medical roster successfully.`);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to create doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc || !editForm.full_name) {
      showError('Doctor full name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...editForm,
        department_id: parseInt(editForm.department_id),
      };
      if (!payload.password) delete payload.password; // Do not overwrite if empty

      await api.updateDoctor(selectedDoc.id, payload);
      showSuccess(`Dr. ${editForm.full_name}'s profile updated successfully.`);
      setShowEditModal(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to update doctor details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      const res = await api.deleteDoctor(selectedDoc.id);
      showSuccess(res.message || `Dr. ${selectedDoc.full_name} removed from roster.`);
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to delete doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.full_name.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
      doc.department_name?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || doc.department_id === parseInt(deptFilter);
    return matchesSearch && matchesDept;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <span>Medical Specialists & Doctors Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hospital medical staff, departments, room allocations and consultation availability
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Medical Specialist</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors by name, specialization, or department..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full md:w-auto"
          >
            <option value="All">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          Loading doctors roster...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
          <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="font-semibold text-slate-700">No medical specialists found</div>
          <p className="text-slate-400">Try adjusting your search criteria or add a new doctor above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200">
                      Dr
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Dr. {doc.full_name}</h3>
                      <div className="text-xs text-blue-700 font-semibold">{doc.specialization}</div>
                      <div className="text-[11px] text-slate-500">{doc.qualification}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      doc.is_available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {doc.is_available ? 'Available' : 'On Leave'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Department:
                    </span>
                    <span className="font-semibold text-slate-800">{doc.department_name}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">OPD Room:</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700">
                      {doc.room_number || 'OPD Wing'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="font-mono text-slate-600 text-[11px] truncate max-w-[180px]">{doc.email}</span>
                  </div>

                  {doc.contact_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <span className="font-mono text-slate-700">{doc.contact_number}</span>
                    </div>
                  )}

                  {doc.reg_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Medical Reg No:</span>
                      <span className="font-mono text-slate-700 font-semibold">{doc.reg_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(doc)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Edit / Change Name</span>
                  </button>

                  <button
                    onClick={() => handleOpenDelete(doc)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 1. ADD DOCTOR MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Add New Medical Specialist</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    placeholder="e.g. Suman Sengupta"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email / Staff ID *</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="dr.suman@arogyamhospital.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Doctor@2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department *</label>
                  <select
                    value={addForm.department_id}
                    onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={addForm.specialization}
                    onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                    placeholder="e.g. Cardiologist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qualification *</label>
                  <input
                    type="text"
                    required
                    value={addForm.qualification}
                    onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                    placeholder="MBBS, MD (Cardiology)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">OPD Room Number</label>
                  <input
                    type="text"
                    value={addForm.room_number}
                    onChange={(e) => setAddForm({ ...addForm, room_number: e.target.value })}
                    placeholder="OPD Room 204"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={addForm.contact_number}
                    onChange={(e) => setAddForm({ ...addForm, contact_number: e.target.value })}
                    placeholder="+91 90832 84529"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Medical Reg Number</label>
                  <input
                    type="text"
                    value={addForm.reg_number}
                    onChange={(e) => setAddForm({ ...addForm, reg_number: e.target.value })}
                    placeholder="WBMC-78901"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Doctor to Roster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT DOCTOR MODAL (CHANGE NAME & DETAILS) */}
      {showEditModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Doctor Details & Change Name</span>
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
                    Doctor Full Name (Change Name) *
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
                  <label className="block text-slate-700 font-semibold mb-1">Email / Username</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Reset Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={editForm.department_id}
                    onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={editForm.specialization}
                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Qualification</label>
                  <input
                    type="text"
                    required
                    value={editForm.qualification}
                    onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">OPD Room Number</label>
                  <input
                    type="text"
                    value={editForm.room_number}
                    onChange={(e) => setEditForm({ ...editForm, room_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.contact_number}
                    onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Medical Reg Number</label>
                  <input
                    type="text"
                    value={editForm.reg_number}
                    onChange={(e) => setEditForm({ ...editForm, reg_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={editForm.is_available}
                    onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_available" className="text-slate-800 font-semibold cursor-pointer">
                    Doctor is Currently Available for OPD Consultations & Online Bookings
                  </label>
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
                  {submitting ? 'Saving Changes...' : 'Save Updated Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE DOCTOR CONFIRMATION MODAL */}
      {showDeleteModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Doctor Removal</h3>
                <p className="text-xs text-rose-600 font-medium">This action requires Administrator privileges</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div>Doctor: <strong className="text-slate-900">Dr. {selectedDoc.full_name}</strong></div>
              <div>Department: <strong>{selectedDoc.department_name}</strong></div>
              <div>Specialization: <strong>{selectedDoc.specialization}</strong></div>
              <p className="text-slate-500 pt-1 text-[11px]">
                Note: If this doctor has historical clinical cases or prescriptions, their profile will be safely deactivated to preserve clinical history integrity.
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
                {submitting ? 'Removing...' : 'Confirm Delete Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

