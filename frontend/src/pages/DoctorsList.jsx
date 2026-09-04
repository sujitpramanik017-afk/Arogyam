import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Stethoscope, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';

export const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDoctors().then((data) => {
      setDoctors(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Medical Specialists & Doctors Roster</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active faculty and physicians at Shri Ramkrishna Institute of Medical Sciences / Sanaka Hospitals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                Dr
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dr. {doc.full_name}</h3>
                <div className="text-xs text-blue-700 font-semibold">{doc.specialization}</div>
                <div className="text-[11px] text-slate-500">{doc.qualification}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Department:</span>
                <span className="font-semibold text-slate-800">{doc.department_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">OPD Room:</span>
                <span className="font-mono">{doc.room_number || 'OPD Wing'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Medical Reg:</span>
                <span className="font-mono text-slate-700">{doc.reg_number || 'WBMC'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
