import React from 'react';

export const PrintHeader = ({ title = "MEDICAL RECORD / CASE SUMMARY" }) => {
  return (
    <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="/assets/sanaka_logo.png"
          alt="Sanaka Hospital"
          className="h-16 w-auto object-contain"
        />
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            SANAKA HOSPITALS
          </h1>
          <p className="text-xs font-semibold text-slate-700">
            SHRI RAMKRISHNA INSTITUTE OF MEDICAL SCIENCES
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            A Unit of Sanaka Educational Trust · Malandighi, Durgapur, West Bengal - 713212
          </p>
          <p className="text-[10px] text-slate-500 font-medium">
            Phone: +91 343 252 2222 / 2223 · Email: info@sanakahospital.com
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
