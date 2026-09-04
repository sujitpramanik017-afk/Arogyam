import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  ArrowRight
} from 'lucide-react';

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('All');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Directory & Master Index</h1>
          <p className="text-xs text-slate-500 mt-1">
            Search and manage all hospital patient electronic medical records
          </p>
        </div>

        {(user?.role === 'receptionist' || user?.role === 'admin') && (
          <Link
            to="/patients/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
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
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition flex flex-col justify-between"
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
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Visits: <strong className="text-slate-800">{p.total_visits}</strong>
                </span>

                <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
