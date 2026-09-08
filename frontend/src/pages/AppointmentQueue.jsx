import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { getTodayLocalDate } from '../utils/date';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  UserCheck,
  ClipboardPenLine,
  X,
  Building2,
  Stethoscope,
  UserPlus,
  RotateCw
} from 'lucide-react';

export const AppointmentQueue = () => {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patient_id');

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const [selectedDoctor, setSelectedDoctor] = useState(user?.role === 'doctor' ? (user.doctor_id || '') : '');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(!!patientIdParam);
  const [isQuickRegister, setIsQuickRegister] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    patient_id: patientIdParam ? parseInt(patientIdParam) : '',
    doctor_id: '',
    department_id: '',
    appointment_date: getTodayLocalDate(),
    time_slot: '10:00 AM - 10:30 AM',
    reason_for_visit: '',
  });

  // Quick Register inline fields
  const [quickPatient, setQuickPatient] = useState({
    full_name: '',
    dob: '1990-01-01',
    gender: 'Male',
    phone: '',
    address: 'Durgapur, West Bengal',
    blood_group: 'B+',
    known_allergies: 'None',
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, selectedDoctor, selectedStatus]);

  const loadMetadata = async () => {
    try {
      const [docs, depts, pts] = await Promise.all([
        api.getDoctors(),
        api.getDepartments(),
        api.getPatients({ limit: 200 })
      ]);
      setDoctors(docs || []);
      setDepartments(depts || []);
      setPatients(pts || []);

      if (docs && docs.length > 0 && !bookingData.doctor_id) {
        setBookingData((prev) => ({
          ...prev,
          doctor_id: docs[0].id,
          department_id: docs[0].department_id,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments({
        date: selectedDate === 'All' ? undefined : selectedDate,
        doctor_id: selectedDoctor ? parseInt(selectedDoctor) : undefined,
        status: selectedStatus,
      });
      setAppointments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      showSuccess(`Status updated to ${newStatus}`);
      loadAppointments();
    } catch (e) {
      showError('Failed to update status');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    let targetPatientId = bookingData.patient_id;

    // If staff is registering a new patient inline
    if (isQuickRegister) {
      if (!quickPatient.full_name || !quickPatient.phone) {
        showError('Please enter full name and phone for new patient');
        return;
      }
      try {
        const created = await api.createPatient(quickPatient);
        targetPatientId = created.id;
        showSuccess(`Patient ${created.full_name} registered (${created.patient_id})!`);
        // Refresh patients list
        const updatedPts = await api.getPatients({ limit: 200 });
        setPatients(updatedPts || []);
      } catch (err) {
        showError('Failed to quick-register patient: ' + err.message);
        return;
      }
    }

    if (!targetPatientId) {
      showError('Please select or register a patient');
      return;
    }

    const docId = bookingData.doctor_id || (doctors[0] ? doctors[0].id : null);
    if (!docId) {
      showError('Please select an attending Doctor');
      return;
    }

    try {
      const payload = {
        ...bookingData,
        patient_id: parseInt(targetPatientId),
        doctor_id: parseInt(docId),
        department_id: bookingData.department_id || (doctors.find(d => d.id === parseInt(docId))?.department_id || 1),
      };

      await api.createAppointment(payload);
      showSuccess('Consultation token scheduled successfully!');
      setShowModal(false);
      setIsQuickRegister(false);
      // Ensure the view date matches the booked appointment date so user immediately sees it
      if (selectedDate !== 'All' && selectedDate !== payload.appointment_date) {
        setSelectedDate(payload.appointment_date);
      } else {
        loadAppointments();
      }
    } catch (e) {
      showError(e.message || 'Failed to book appointment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">OPD Appointments & Token Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time outpatient consultation schedule and token management
          </p>
        </div>

        <button
          onClick={() => {
            setShowModal(true);
            if (doctors.length > 0 && !bookingData.doctor_id) {
              setBookingData(prev => ({ ...prev, doctor_id: doctors[0].id, department_id: doctors[0].department_id }));
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Outpatient Consultation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={selectedDate === 'All' ? '' : selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || 'All')}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayLocalDate())}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedDate === getTodayLocalDate()
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate('All')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedDate === 'All'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Dates
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.full_name} ({d.specialization})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <span className="text-slate-500 font-mono">
          Showing <strong>{appointments.length}</strong> tokens
        </span>
      </div>

      {/* Appointment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Token</th>
                <th className="py-3 px-4">Patient Information</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Slot Time</th>
                <th className="py-3 px-4">Reason for Visit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No appointments found for the selected criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                      #{a.token_number}
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/patients/${a.patient_id}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {a.patient_name}
                      </Link>
                      <div className="text-[11px] font-mono text-slate-500">{a.patient_custom_id} · {a.patient_gender}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">Dr. {a.doctor_name}</div>
                      <div className="text-[11px] text-slate-500">{a.department_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">{a.time_slot}</td>
                    <td className="py-3 px-4 text-slate-600">{a.reason_for_visit || 'General Consultation'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {a.status === 'scheduled' && (
                        <button
                          onClick={() => handleStatusChange(a.id, 'checked_in')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition"
                        >
                          Check In
                        </button>
                      )}

                      {user?.role === 'doctor' && (
                        <Link
                          to={`/cases/new?patient_id=${a.patient_id}&appt_id=${a.id}`}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <ClipboardPenLine className="w-3 h-3" />
                          <span>Case Sheet</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">Book Outpatient Consultation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              {/* Patient Selection or Quick Register Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">Patient *</label>
                  <button
                    type="button"
                    onClick={() => setIsQuickRegister(!isQuickRegister)}
                    className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isQuickRegister ? 'Choose Existing Patient' : '+ Register New Patient'}</span>
                  </button>
                </div>

                {!isQuickRegister ? (
                  <select
                    required
                    value={bookingData.patient_id}
                    onChange={(e) => setBookingData({ ...bookingData, patient_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  >
                    <option value="">-- Choose Patient from Registry --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id}) - {p.phone}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                    <span className="text-[11px] font-bold text-blue-900 block">Quick Patient Registration</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={quickPatient.full_name}
                        onChange={(e) => setQuickPatient({ ...quickPatient, full_name: e.target.value })}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number *"
                        value={quickPatient.phone}
                        onChange={(e) => setQuickPatient({ ...quickPatient, phone: e.target.value })}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={quickPatient.gender}
                        onChange={(e) => setQuickPatient({ ...quickPatient, gender: e.target.value })}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="date"
                        value={quickPatient.dob}
                        onChange={(e) => setQuickPatient({ ...quickPatient, dob: e.target.value })}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={bookingData.doctor_id}
                  onChange={(e) => {
                    const docId = parseInt(e.target.value);
                    const doc = doctors.find((d) => d.id === docId);
                    setBookingData({
                      ...bookingData,
                      doctor_id: docId,
                      department_id: doc ? doc.department_id : bookingData.department_id,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>Dr. {d.full_name} — {d.department_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingData.appointment_date}
                    onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={bookingData.time_slot}
                    onChange={(e) => setBookingData({ ...bookingData, time_slot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Consultation</label>
                <input
                  type="text"
                  value={bookingData.reason_for_visit}
                  onChange={(e) => setBookingData({ ...bookingData, reason_for_visit: e.target.value })}
                  placeholder="e.g. Fever, Hypertension review, Joint pain..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 shadow-xs cursor-pointer"
                >
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
