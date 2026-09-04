import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Pill, Printer, ArrowRight, Search, Calendar, User } from 'lucide-react';

export const PrescriptionsList = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getPrescriptions().then((data) => {
      setPrescriptions(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter((rx) =>
    rx.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.department_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Prescriptions Index</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived medical prescriptions and pharmacist order sheets
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor or department..."
            className="w-full sm:w-72 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-28">Rx ID</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Prescribing Doctor</th>
                <th className="p-3">Department</th>
                <th className="p-3">Medicines Count</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading prescriptions...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No prescriptions found.</td>
                </tr>
              ) : (
                filtered.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-blue-700">RX-{rx.id.toString().padStart(5, '0')}</td>
                    <td className="p-3 text-slate-600">{new Date(rx.date).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-semibold text-slate-900">Dr. {rx.doctor_name}</td>
                    <td className="p-3 text-slate-600">{rx.department_name}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                        {rx.items?.length || 0} drugs
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/prescriptions/${rx.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Pad</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
