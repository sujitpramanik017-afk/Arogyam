import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { getTodayLocalDate } from '../utils/date';
import {
  UserPlus,
  Calendar,
  Users,
  Search,
  Clock,
  CheckCircle2,
  Stethoscope,
  PlusCircle,
  ArrowRight,
  RotateCw
} from 'lucide-react';

export const ReceptionDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, pts, docs] = await Promise.all([
        api.getAppointments({ date: selectedDate === 'All' ? undefined : selectedDate }),
        api.getPatients({ limit: 10 }),
        api.getDoctors({ available_only: true })
      ]);
      setAppointments(appts || []);
      setRecentPatients(pts || []);
      setDoctors(docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      await api.updateAppointmentStatus(apptId, 'checked_in');
      showSuccess('Patient checked-in successfully! Added to Doctor OPD queue.');
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to check in');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Reception & OPD Front Desk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Patient registration, appointment scheduling, and OPD token management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/patients/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
          <Link
            to="/appointments"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{recentPatients.length}</div>
            <div className="text-xs text-slate-500 font-medium">Recent Registrations</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{appointments.length}</div>
            <div className="text-xs text-slate-500 font-medium">Today's Total Appointments</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{doctors.length}</div>
            <div className="text-xs text-slate-500 font-medium">Available Doctors On Duty</div>
          </div>
        </div>
      </div>

      {/* Main Content: OPD Appointments & Recent Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Appointments with Check-in action */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">OPD Queue & Check-In Tokens</h2>
              <p className="text-xs text-slate-500">Check-in arriving patients for doctor consult</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                title="Refresh Queue"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayLocalDate())}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
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
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  selectedDate === 'All'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Dates
              </button>
              <Link to="/appointments" className="text-xs text-blue-600 font-semibold hover:underline ml-1">
                Full Queue →
              </Link>
            </div>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No appointments scheduled for today.
              </div>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{a.token_number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{a.patient_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {a.patient_custom_id} · Dr. {a.doctor_name} ({a.department_name})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {a.status === 'scheduled' && (
                      <button
                        onClick={() => handleCheckIn(a.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-2xs transition"
                      >
                        Check-in
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Recently Registered Patients */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Patients</h2>
              <p className="text-xs text-slate-500">Master patient records</p>
            </div>
            <Link to="/patients" className="text-xs text-blue-600 font-semibold hover:underline">
              Directory
            </Link>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100">
            {recentPatients.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <Link
                    to={`/patients/${p.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-blue-600"
                  >
                    {p.full_name}
                  </Link>
                  <div className="text-[10px] font-mono text-slate-500">
                    {p.patient_id} · {p.gender} · {p.phone}
                  </div>
                </div>
                <Link
                  to={`/patients/${p.id}`}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
