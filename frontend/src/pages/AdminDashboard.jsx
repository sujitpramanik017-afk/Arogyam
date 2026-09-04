import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  Building2,
  Stethoscope,
  Users,
  Activity,
  ScrollText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        api.getDashboardStats(),
        api.getAuditLogs(10)
      ]);
      setStats(statsData);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900">Hospital Administration & Governance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sanaka Hospital / Shri Ramkrishna Institute of Medical Sciences · Malandighi, Durgapur
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/departments"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            Manage Departments
          </Link>
          <Link
            to="/audit-logs"
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-xs transition"
          >
            System Audit Trail
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Registered Patients</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {stats?.total_patients ?? '--'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Today's OPD Appointments</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">
            {stats?.today_appointments ?? '--'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Active Clinical Cases</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">
            {stats?.active_cases ?? '--'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Medical Departments</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
            {stats?.total_departments ?? '--'}
          </div>
        </div>
      </div>

      {/* Audit Logs Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-slate-600" />
              <span>Real-Time Clinical & System Audit Logs</span>
            </h2>
            <p className="text-xs text-slate-500">HIPAA / NABH compliance and staff access logging</p>
          </div>
          <Link to="/audit-logs" className="text-xs text-blue-600 font-semibold hover:underline">
            View Complete Logs
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 font-sans">
                  <td className="py-2.5 px-4 text-slate-500 text-[11px] font-mono">
                    {new Date(log.timestamp).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{log.user_name}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {log.user_role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-blue-700">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-600">{log.entity_type} #{log.entity_id}</td>
                  <td className="py-2.5 px-4 text-slate-600 text-xs truncate max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
