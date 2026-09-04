import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScrollText, Search, ShieldCheck } from 'lucide-react';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAuditLogs(200).then((data) => {
      setLogs(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) =>
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Compliance & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable user action trail, clinical record modifications, and patient data access logs
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit actions, users, or patient details..."
            className="w-full sm:w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">Timestamp</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No logs matching query.</td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{log.user_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                        {log.user_role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-blue-700 font-mono text-[11px]">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</td>
                    <td className="py-2.5 px-4 text-slate-600 truncate max-w-sm">{log.details}</td>
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
