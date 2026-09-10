import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { PrintHeader } from '../components/PrintHeader';
import { Printer, ArrowLeft, Pill, User, Calendar, Shield } from 'lucide-react';

export const PrescriptionView = () => {
  const { id } = useParams();
  const [rx, setRx] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    setLoading(true);
    try {
      const rxData = await api.getPrescription(id);
      setRx(rxData);
      if (rxData.patient_id) {
        const ptData = await api.getPatient(rxData.patient_id);
        setPatient(ptData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading prescription pad...</div>;
  }

  if (!rx) {
    return <div className="p-12 text-center text-xs text-slate-500">Prescription not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Action Bar (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <Link
          to={`/patients/${rx.patient_id}`}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Profile</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Prescription (Rx)</span>
          </button>
        </div>
      </div>

      {/* Official Prescription Pad Document */}
      <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-sm text-slate-900 print:border-none print:shadow-none print:p-0">
        <PrintHeader title="OUTPATIENT PRESCRIPTION (Rx)" />

        {/* Doctor & Patient Metadata Strip */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3 mb-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Consulting Physician
            </span>
            <div className="font-bold text-sm text-slate-900">Dr. {rx.doctor_name}</div>
            <div className="text-slate-600 text-[11px]">Department of {rx.department_name}</div>
            <div className="text-slate-500 text-[10px] mt-0.5">Arogyam Hospital OPD Consultation</div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Prescription Details
            </span>
            <div className="font-mono text-xs text-slate-800">
              Rx Ref: <strong>RX-{rx.id.toString().padStart(5, '0')}</strong>
            </div>
            <div className="text-slate-600 text-[11px]">
              Date: <strong>{new Date(rx.date).toLocaleDateString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Patient Demographic Banner */}
        {patient && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mb-6 flex flex-wrap items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Patient Name:</span>{' '}
              <strong className="text-slate-900 font-bold">{patient.full_name}</strong>
            </div>
            <div>
              <span className="text-slate-500">UHID:</span>{' '}
              <strong className="text-blue-800 font-mono">{patient.patient_id}</strong>
            </div>
            <div>
              <span className="text-slate-500">Age/Gender:</span>{' '}
              <strong>{patient.dob} ({patient.gender})</strong>
            </div>
            <div>
              <span className="text-slate-500">Blood:</span>{' '}
              <strong className="text-rose-700">{patient.blood_group || 'N/A'}</strong>
            </div>
          </div>
        )}

        {/* Rx Symbol and Medications Table */}
        <div className="space-y-4 min-h-[300px]">
          <div className="text-2xl font-black text-slate-900 italic font-serif">
            ℞
          </div>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2.5 border-r border-slate-300 w-10 text-center">#</th>
                <th className="p-2.5 border-r border-slate-300">Medicine Name & Formulation</th>
                <th className="p-2.5 border-r border-slate-300 w-24">Dosage</th>
                <th className="p-2.5 border-r border-slate-300 w-24">Route</th>
                <th className="p-2.5 border-r border-slate-300 w-32">Frequency</th>
                <th className="p-2.5 border-r border-slate-300 w-28">Duration</th>
                <th className="p-2.5">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rx.items?.map((itm, i) => (
                <tr key={itm.id || i} className="even:bg-slate-50/50">
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-500">
                    {i + 1}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">
                    {itm.medicine_name}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-medium text-slate-700">
                    {itm.dosage}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-slate-600">
                    {itm.route}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-semibold text-blue-900">
                    {itm.frequency}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-medium text-slate-800">
                    {itm.duration}
                  </td>
                  <td className="p-2.5 text-slate-700 italic">
                    {itm.instructions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rx.general_instructions && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="font-bold text-slate-800 block mb-0.5">Special Directions / Advice:</span>
              <p className="text-slate-700">{rx.general_instructions}</p>
            </div>
          )}
        </div>

        {/* Doctor Signature Block & Footer */}
        <div className="mt-12 pt-6 border-t border-slate-300 flex items-end justify-between text-xs">
          <div className="text-[11px] text-slate-500 max-w-sm">
            <p className="font-semibold text-slate-700">Notice to Patient:</p>
            <p>Please bring this prescription during your follow-up visit. In case of acute drug reactions or emergency, report to Arogyam Hospital 24x7 Casualty immediately.</p>
          </div>

          <div className="text-center">
            <div className="w-48 border-b border-slate-400 pb-1 mb-1 font-signature text-sm font-semibold text-slate-700">
              Dr. {rx.doctor_name}
            </div>
            <div className="text-[11px] font-bold text-slate-900">Doctor's Signature & Stamp</div>
            <div className="text-[10px] text-slate-500 font-mono">Reg. Medical Practitioner</div>
          </div>
        </div>
      </div>
    </div>
  );
};
