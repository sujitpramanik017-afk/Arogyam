import React from 'react';

export const PrintHeader = ({ title = "MEDICAL RECORD / CASE SUMMARY" }) => {
  return (
    <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="/assets/arogyam_logo_transparent.png"
          alt="Arogyam Hospital"
          className="h-16 w-auto object-contain"
        />
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            AROGYAM HOSPITALS
          </h1>
          <p className="text-xs font-semibold text-slate-700">
            ADVANCED HEALTHCARE & MULTISPECIALITY HOSPITAL
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Salt Lake City, Kolkata, West Bengal, India
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Phone: +91 33 2321 0000 / 0001 · Email: info@arogyamhospital.com
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1 border border-slate-300 rounded">
          {title}
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-mono">
          Govt. Reg / EMR System: SIH26047
        </div>
      </div>
    </div>
  );
};
