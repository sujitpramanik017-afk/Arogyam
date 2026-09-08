import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { getTodayLocalDate } from '../utils/date';
import {
  Users,
  Calendar,
  ClipboardPenLine,
  Pill,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileText,
  RotateCw,
  Filter
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const [selectedDoctorId, setSelectedDoctorId] = useState(user?.doctor_id || '');

  useEffect(() => {
    if (user?.doctor_id && !selectedDoctorId) {
      setSelectedDoctorId(user.doctor_id);
    }
  }, [user]);

  useEffect(() => {
    api.getDoctors().then((docs) => setDoctors(docs || [])).catch(console.error);
  }, []);

  useEffect(() => {
    loadDoctorData();
  }, [user, selectedDate, selectedDoctorId]);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const activeDocId = selectedDoctorId || user?.doctor_id || undefined;
      const [apptsData, casesData] = await Promise.all([
        api.getAppointments({
          doctor_id: activeDocId,
          date: selectedDate === 'All' ? undefined : selectedDate
        }),
        api.getCases({
          doctor_id: activeDocId,
          limit: 10
        })
      ]);
      setAppointments(apptsData || []);
      setRecentCases(casesData || []);
    } catch (err) {
      console.error('Error loading doctor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (appt) => {
    try {
      if (appt.status === 'scheduled') {
        await api.updateAppointmentStatus(appt.id, 'checked_in');
      }
      navigate(`/cases/new?patient_id=${appt.patient_id}&appt_id=${appt.id}`);
    } catch (e) {
      navigate(`/cases/new?patient_id=${appt.patient_id}&appt_id=${appt.id}`);
    }
  };

  const filteredAppts = appointments.filter((a) =>
    a.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.patient_custom_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkedInCount = appointments.filter((a) => a.status === 'checked_in').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const totalToday = appointments.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome, {user?.full_name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of {user?.department_name || 'General Medicine'} · OPD Consultation Console
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/cases/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
          >
            <ClipboardPenLine className="w-4 h-4" />
            <span>Open Case-Taking Form</span>
          </Link>
          <Link
            to="/patients"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            Search Patient Records
          </Link>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalToday}</div>
            <div className="text-xs text-slate-500 font-medium">Today's Total Patients</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{checkedInCount}</div>
            <div className="text-xs text-slate-500 font-medium">Waiting / In Queue</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono">{completedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Consultations Completed</div>
          </div>
        </div>
      </div>

      {/* Main Grid: OPD Patient Queue & Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's OPD Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>OPD Consultation Queue</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {appointments.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Live consultation token list</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadDoctorData}
                  disabled={loading}
                  title="Refresh Consultation Queue"
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient or ID..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sub Filter Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={selectedDate === 'All' ? '' : selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value || 'All')}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayLocalDate())}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
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
                  className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                    selectedDate === 'All'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Dates
                </button>
              </div>

              {user?.role === 'admin' && doctors.length > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] font-semibold text-slate-500">Doctor:</span>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value ? parseInt(e.target.value) : '')}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="">All Doctors</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.full_name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading today's OPD queue...
              </div>
            ) : filteredAppts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No appointments scheduled in queue for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                        #{appt.token_number}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/patients/${appt.patient_id}`}
                            className="text-xs font-bold text-slate-900 hover:text-blue-600 transition"
                          >
                            {appt.patient_name}
                          </Link>
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {appt.patient_custom_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{appt.patient_gender} · {appt.patient_dob}</span>
                          <span>· Slot: {appt.time_slot}</span>
                        </div>
                        {appt.reason_for_visit && (
                          <div className="text-[11px] text-slate-600 italic mt-0.5">
                            Reason: {appt.reason_for_visit}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <StatusBadge status={appt.status} />
                      <button
                        onClick={() => handleStartConsultation(appt)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <ClipboardPenLine className="w-3.5 h-3.5" />
                        <span>Case Taking</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Clinical Cases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Cases</h2>
              <p className="text-xs text-slate-500">Your recent patient records</p>
            </div>
            <Link
              to="/prescriptions"
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              View Rx
            </Link>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100">
            {recentCases.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent cases recorded yet.
              </div>
            ) : (
              recentCases.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {c.patient?.full_name || 'Patient'}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {c.case_number} · {c.visit_date?.split('T')[0]}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                      {c.provisional_diagnosis || c.chief_complaint || 'Case in progress'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={c.status} />
                    <Link
                      to={`/cases/report/${c.id}`}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 mt-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Summary</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
