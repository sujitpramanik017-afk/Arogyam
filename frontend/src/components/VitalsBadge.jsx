import React from 'react';
import { Activity, Heart, Thermometer, Wind, Weight, Ruler } from 'lucide-react';

export const VitalsBadge = ({ vitals }) => {
  if (!vitals) return <span className="text-xs text-slate-400">No vitals recorded</span>;

  const isBpHigh = vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90;
  const isSpo2Low = vitals.spo2 && vitals.spo2 < 95;
  const isFever = vitals.temperature && vitals.temperature >= 100.4;
  const isTachy = vitals.heart_rate && vitals.heart_rate > 100;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {/* BP */}
      {(vitals.blood_pressure_systolic || vitals.blood_pressure_diastolic) && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            isBpHigh ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>
            BP: {vitals.blood_pressure_systolic || '--'}/{vitals.blood_pressure_diastolic || '--'}
          </span>
          <span className="text-[10px] text-slate-500">mmHg</span>
        </div>
      )}

      {/* Pulse */}
      {vitals.heart_rate && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            isTachy ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-slate-500" />
          <span>Pulse: {vitals.heart_rate}</span>
          <span className="text-[10px] text-slate-500">bpm</span>
        </div>
      )}

      {/* SpO2 */}
      {vitals.spo2 && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            isSpo2Low ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-slate-500" />
          <span>SpO2: {vitals.spo2}%</span>
        </div>
      )}

      {/* Temp */}
      {vitals.temperature && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            isFever ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5 text-slate-500" />
          <span>Temp: {vitals.temperature}°F</span>
        </div>
      )}

      {/* BMI */}
      {vitals.bmi && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 font-mono">
          <Weight className="w-3.5 h-3.5 text-slate-500" />
          <span>BMI: {vitals.bmi}</span>
        </div>
      )}
    </div>
  );
};
