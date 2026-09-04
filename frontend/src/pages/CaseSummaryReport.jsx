import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { PrintHeader } from '../components/PrintHeader';
import { Printer, ArrowLeft, Pill, FileText, Activity } from 'lucide-react';

export const CaseSummaryReport = () => {
  const { id } = useParams();
  const [caseRecord, setCaseRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCase();
  }, [id]);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await api.getCase(id);
      setCaseRecord(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading case report...</div>;
  }

  if (!caseRecord) {
    return <div className="p-12 text-center text-xs text-slate-500">Case record not found.</div>;
  }

  const p = caseRecord.patient;
  const v = caseRecord.vitals;
  const m = caseRecord.medical_history;
  const rx = caseRecord.prescription;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <Link
          to={`/patients/${caseRecord.patient_id}`}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Record</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Medical Case Summary</span>
          </button>
        </div>
      </div>

      {/* Official A4 Clinical Document */}
      <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0 space-y-4">
        <PrintHeader title="OUTPATIENT CLINICAL CASE SUMMARY" />

        {/* Case & Patient Meta */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Identification</div>
            <div className="font-bold text-sm text-slate-900">{p?.full_name}</div>
            <div className="text-slate-600 text-[11px] font-mono">
              UHID: <strong>{p?.patient_id}</strong> · Gender: {p?.gender} · DOB: {p?.dob}
            </div>
            <div className="text-slate-500 text-[11px]">Phone: {p?.phone} · Address: {p?.address}, {p?.city}</div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Case Reference</div>
            <div className="font-mono text-xs text-slate-900">
              Case No: <strong>{caseRecord.case_number}</strong>
            </div>
            <div className="text-slate-600 text-[11px]">
              Visit Date: <strong>{new Date(caseRecord.visit_date).toLocaleDateString('en-IN')}</strong>
            </div>
            <div className="text-slate-700 text-[11px]">
              Attending: <strong>Dr. {caseRecord.doctor?.full_name || 'Physician'}</strong> ({caseRecord.department?.name})
            </div>
          </div>
        </div>

        {/* Section 1: Chief Complaints & HPI */}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
            1. Chief Complaints & Present Illness
          </div>
          <div className="p-2 border border-slate-200 rounded bg-white space-y-1">
            <div className="font-semibold text-slate-900">
              Complaint: {caseRecord.chief_complaint || 'Routine consultation'}{' '}
              {caseRecord.chief_complaint_duration && `(Duration: ${caseRecord.chief_complaint_duration})`}
            </div>
            {caseRecord.present_illness_history && (
              <p className="text-slate-700 leading-relaxed font-mono text-[11px] whitespace-pre-line">
                {caseRecord.present_illness_history}
              </p>
            )}
          </div>
        </div>

        {/* Section 2: Vitals & Medical History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
              2. Recorded Vital Signs
            </div>
            <div className="p-2 border border-slate-200 rounded bg-white font-mono text-[11px] space-y-0.5">
              <div>BP: <strong>{v?.blood_pressure_systolic || '--'}/{v?.blood_pressure_diastolic || '--'} mmHg</strong> · Pulse: <strong>{v?.heart_rate || '--'} bpm</strong></div>
              <div>Temp: <strong>{v?.temperature || '--'}°F</strong> · SpO2: <strong>{v?.spo2 || '--'}%</strong></div>
              <div>Weight: <strong>{v?.weight_kg || '--'} kg</strong> · Height: <strong>{v?.height_cm || '--'} cm</strong> · BMI: <strong>{v?.bmi || '--'}</strong></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
              3. Relevant Medical & Allergy History
            </div>
            <div className="p-2 border border-slate-200 rounded bg-white text-[11px] space-y-0.5">
              <div>Past History: <strong>{m?.past_diseases || 'None reported'}</strong></div>
              <div>Allergies: <strong className="text-rose-700">{m?.drug_allergies || p?.known_allergies || 'NKDA'}</strong></div>
              <div>Current Rx: <strong>{m?.current_medications || 'None'}</strong></div>
            </div>
          </div>
        </div>

        {/* Section 3: Examination & Findings */}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
            4. Clinical Examination & Systemic Review
          </div>
          <div className="p-2 border border-slate-200 rounded bg-white text-[11px] space-y-1">
            {caseRecord.general_examination && (
              <div>General: {caseRecord.general_examination}</div>
            )}
            {caseRecord.systemic_examination && (
              <div>Systemic: {caseRecord.systemic_examination}</div>
            )}
          </div>
        </div>

        {/* Section 4: Clinical Diagnosis */}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
            5. Assessment & Clinical Diagnosis
          </div>
          <div className="p-2 border border-slate-200 rounded bg-white text-xs font-bold text-slate-900">
            {caseRecord.final_diagnosis || caseRecord.provisional_diagnosis || 'Pending full clinical investigation'}
          </div>
        </div>

        {/* Section 5: Prescribed Medications */}
        {rx && rx.items && rx.items.length > 0 && (
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
              6. Prescription & Medical Orders (Rx)
            </div>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-50 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-1.5 border-r border-slate-300 w-8 text-center">#</th>
                  <th className="p-1.5 border-r border-slate-300">Medicine</th>
                  <th className="p-1.5 border-r border-slate-300 w-20">Dosage</th>
                  <th className="p-1.5 border-r border-slate-300 w-28">Frequency</th>
                  <th className="p-1.5 border-r border-slate-300 w-20">Duration</th>
                  <th className="p-1.5">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rx.items.map((item, i) => (
                  <tr key={item.id || i}>
                    <td className="p-1.5 border-r border-slate-200 text-center font-mono">{i + 1}</td>
                    <td className="p-1.5 border-r border-slate-200 font-bold">{item.medicine_name}</td>
                    <td className="p-1.5 border-r border-slate-200">{item.dosage}</td>
                    <td className="p-1.5 border-r border-slate-200 text-blue-900 font-semibold">{item.frequency}</td>
                    <td className="p-1.5 border-r border-slate-200">{item.duration}</td>
                    <td className="p-1.5 italic text-slate-700">{item.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 6: Follow-up and Advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-2 border border-slate-200 rounded bg-white">
            <span className="font-bold text-slate-800 block">Dietary & Lifestyle Advice:</span>
            <p className="text-slate-700 text-[11px]">
              {caseRecord.dietary_advice || caseRecord.lifestyle_advice || 'Maintain standard healthy diet, hydration and rest.'}
            </p>
          </div>

          <div className="p-2 border border-slate-200 rounded bg-white">
            <span className="font-bold text-slate-800 block">Scheduled OPD Review:</span>
            <p className="text-slate-900 font-semibold text-[11px]">
              Date: {caseRecord.follow_up_date || 'As and when needed / SOS'}
            </p>
            <p className="text-slate-600 text-[10px] mt-0.5">{caseRecord.follow_up_instructions}</p>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="mt-8 pt-6 border-t border-slate-300 flex items-end justify-between text-xs">
          <div className="text-[10px] text-slate-500 font-mono">
            Document generated electronically by Sanaka Hospital EMR System (SIH26047)
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
              Dr. {caseRecord.doctor?.full_name || 'Attending Physician'}
            </div>
            <div className="text-[10px] font-bold text-slate-900">Attending Doctor Sign-off</div>
          </div>
        </div>
      </div>
    </div>
  );
};
