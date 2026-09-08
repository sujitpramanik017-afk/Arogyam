import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ClipboardPenLine, Activity, Heart, Pill, Sparkles, AlertCircle,
  CheckCircle2, Save, Plus, Trash2, User, Clock, Printer, ChevronRight,
  FileText, HelpCircle, BrainCircuit, Wand2
} from 'lucide-react';

export const CaseTaker = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const patientIdParam = searchParams.get('patient_id');
  const apptIdParam = searchParams.get('appt_id');

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdParam || '');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('complaints');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [caseData, setCaseData] = useState({
    patient_id: patientIdParam ? parseInt(patientIdParam) : null,
    doctor_id: user?.doctor_id || 1,
    department_id: user?.department_id || 1,
    status: 'draft',
    chief_complaint: '',
    chief_complaint_duration: '',
    chief_complaint_severity: 'Moderate',
    chief_complaint_onset: 'Acute',
    additional_complaints: '',
    present_illness_history: '',
    general_examination: '',
    systemic_examination: '',
    examination_notes: '',
    provisional_diagnosis: '',
    final_diagnosis: '',
    differential_diagnosis: '',
    assessment_notes: '',
    treatment_plan: '',
    dietary_advice: '',
    lifestyle_advice: '',
    follow_up_date: '',
    follow_up_instructions: '',
    raw_notes: '',
    vitals: {
      temperature: '',
      temperature_unit: '°F',
      blood_pressure_systolic: '',
      blood_pressure_diastolic: '',
      heart_rate: '',
      respiratory_rate: '',
      spo2: '',
      weight_kg: '',
      height_cm: '',
      bmi: '',
      pain_score: '',
    },
    medical_history: {
      past_diseases: '',
      past_surgeries: '',
      current_medications: '',
      drug_allergies: '',
      food_environmental_allergies: '',
      family_history: '',
      smoking_history: '',
      alcohol_history: '',
      other_lifestyle: '',
    },
    prescription: {
      general_instructions: 'Take prescribed medicines with water after meals.',
      items: [
        {
          medicine_name: '',
          dosage: '1 tablet',
          route: 'Oral',
          frequency: '1-0-1 (BID)',
          duration: '5 days',
          instructions: 'After food',
        },
      ],
    },
    ai_generated_summary: '',
    ai_missing_info_alerts: '',
    ai_reviewed_by_doctor: false,
  });

  const [aiMissingResult, setAiMissingResult] = useState(null);

  useEffect(() => {
    api.getPatients({ limit: 100 }).then((pts) => setPatients(pts || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      api.getPatient(selectedPatientId).then((pt) => {
        setSelectedPatient(pt);
        setCaseData((prev) => ({
          ...prev,
          patient_id: pt.id,
          medical_history: {
            ...prev.medical_history,
            drug_allergies: pt.known_allergies || '',
          }
        }));
      });
    }
  }, [selectedPatientId]);

  useEffect(() => {
    const w = parseFloat(caseData.vitals.weight_kg);
    const h = parseFloat(caseData.vitals.height_cm);
    if (w && h && h > 0) {
      const hm = h / 100;
      const calculatedBmi = parseFloat((w / (hm * hm)).toFixed(1));
      setCaseData((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, bmi: calculatedBmi },
      }));
    } else {
      setCaseData((prev) => {
        if (prev.vitals.bmi) {
          return { ...prev, vitals: { ...prev.vitals, bmi: '' } };
        }
        return prev;
      });
    }
  }, [caseData.vitals.weight_kg, caseData.vitals.height_cm]);

  const handleCaseChange = (field, value) => setCaseData((prev) => ({ ...prev, [field]: value }));
  const handleVitalsChange = (field, value) => setCaseData((prev) => ({ ...prev, vitals: { ...prev.vitals, [field]: value } }));
  const handleHistoryChange = (field, value) => setCaseData((prev) => ({ ...prev, medical_history: { ...prev.medical_history, [field]: value } }));

  const handleAddMedicine = () => {
    setCaseData((prev) => ({
      ...prev,
      prescription: {
        ...prev.prescription,
        items: [...prev.prescription.items, { medicine_name: '', dosage: '1 tablet', route: 'Oral', frequency: '1-0-1 (BID)', duration: '5 days', instructions: 'After food' }],
      },
    }));
  };

  const handleRemoveMedicine = (index) => {
    setCaseData((prev) => ({
      ...prev,
      prescription: { ...prev.prescription, items: prev.prescription.items.filter((_, i) => i !== index) },
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setCaseData((prev) => {
      const items = [...prev.prescription.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, prescription: { ...prev.prescription, items } };
    });
  };

  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await api.aiSummarize(caseData);
      setCaseData((prev) => ({ ...prev, ai_generated_summary: res.summary }));
      showSuccess('AI Clinical Summary generated. Please review and verify.');
    } catch {
      showError('Failed to generate AI summary');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCheckMissingInfo = async () => {
    setAiLoading(true);
    try {
      const res = await api.aiMissingInfo(caseData);
      setAiMissingResult(res);
      if (res.missing_items.length === 0 && res.clinical_alerts.length === 0) {
        showSuccess('All critical medical parameters are recorded and within range!');
      } else {
        showInfo(`${res.missing_items.length} items may require clinical attention.`);
      }
    } catch {
      showError('Failed to run clinical linter');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormatRoughNotes = async () => {
    if (!caseData.raw_notes) {
      showError('Please enter doctor rough notes first.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.aiFormatNotes(caseData.raw_notes);
      if (res.suggested_chief_complaint && !caseData.chief_complaint) {
        setCaseData((prev) => ({ ...prev, chief_complaint: res.suggested_chief_complaint }));
      }
      if (res.suggested_assessment && !caseData.provisional_diagnosis) {
        setCaseData((prev) => ({ ...prev, provisional_diagnosis: res.suggested_assessment }));
      }
      setCaseData((prev) => ({
        ...prev,
        present_illness_history: (prev.present_illness_history ? prev.present_illness_history + '\n\n' : '') + res.formatted_soap_note,
      }));
      showSuccess('Rough notes structured into SOAP format.');
    } catch {
      showError('Failed to structure rough notes');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveCase = async (finalStatus = 'completed') => {
    if (!caseData.patient_id) {
      showError('Please select a patient before saving case sheet.');
      return;
    }

    setSaving(true);
    try {
      const rawV = caseData.vitals;
      const hasAnyVital = Boolean(
        rawV.temperature ||
        rawV.blood_pressure_systolic ||
        rawV.blood_pressure_diastolic ||
        rawV.heart_rate ||
        rawV.respiratory_rate ||
        rawV.spo2 ||
        rawV.weight_kg ||
        rawV.height_cm ||
        (rawV.pain_score !== '' && rawV.pain_score !== null && rawV.pain_score !== undefined && rawV.pain_score !== 0)
      );

      const cleanVitals = hasAnyVital
        ? {
            temperature: rawV.temperature ? parseFloat(rawV.temperature) : null,
            temperature_unit: rawV.temperature_unit || '°F',
            blood_pressure_systolic: rawV.blood_pressure_systolic ? parseInt(rawV.blood_pressure_systolic) : null,
            blood_pressure_diastolic: rawV.blood_pressure_diastolic ? parseInt(rawV.blood_pressure_diastolic) : null,
            heart_rate: rawV.heart_rate ? parseInt(rawV.heart_rate) : null,
            respiratory_rate: rawV.respiratory_rate ? parseInt(rawV.respiratory_rate) : null,
            spo2: rawV.spo2 ? parseFloat(rawV.spo2) : null,
            weight_kg: rawV.weight_kg ? parseFloat(rawV.weight_kg) : null,
            height_cm: rawV.height_cm ? parseFloat(rawV.height_cm) : null,
            bmi: rawV.bmi ? parseFloat(rawV.bmi) : null,
            pain_score: (rawV.pain_score !== '' && rawV.pain_score !== null) ? parseInt(rawV.pain_score) : null,
          }
        : null;

      const payload = {
        ...caseData,
        status: finalStatus,
        vitals: cleanVitals,
        prescription: {
          ...caseData.prescription,
          items: caseData.prescription.items.filter((m) => m.medicine_name && m.medicine_name.trim() !== ''),
        },
      };

      const savedCase = await api.createCase(payload);

      if (apptIdParam) {
        await api.updateAppointmentStatus(apptIdParam, 'completed').catch(() => {});
      }

      showSuccess(`Patient case ${savedCase.case_number} recorded successfully!`);
      navigate(`/cases/report/${savedCase.id}`);
    } catch (err) {
      showError(err.message || 'Failed to save patient case');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'complaints', label: '1. Complaints & HPI' },
    { id: 'history', label: '2. History' },
    { id: 'vitals', label: '3. Vital Signs' },
    { id: 'examination', label: '4. Examination' },
    { id: 'assessment', label: '5. Diagnosis' },
    { id: 'treatment', label: '6. Prescription' },
    { id: 'followup', label: '7. Follow-Up' },
    { id: 'ai', label: 'AI Assistant', isAi: true },
  ];
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardPenLine className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Digital Patient Case-Taking Studio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sanaka Hospital Electronic Health Record · Structured Clinical Documentation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Patient from Registry --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleSaveCase('draft')}
            disabled={saving || !selectedPatientId}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveCase('completed')}
            disabled={saving || !selectedPatientId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Finalizing...' : 'Finalize & Issue Rx'}</span>
          </button>
        </div>
      </div>

      {/* Patient Demographics Banner */}
      {selectedPatient && (
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs text-blue-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {selectedPatient.full_name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">{selectedPatient.full_name}</div>
              <div className="text-[11px] font-mono text-blue-700">
                ID: {selectedPatient.patient_id} · {selectedPatient.gender} · DOB: {selectedPatient.dob}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">Blood Group:</span>{' '}
              <strong className="text-rose-700 font-mono">{selectedPatient.blood_group || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Phone:</span>{' '}
              <strong>{selectedPatient.phone}</strong>
            </div>
            <div>
              <span className="text-slate-500">Known Allergies:</span>{' '}
              <strong className="text-amber-800">{selectedPatient.known_allergies || 'NKDA'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Header */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? tab.isAi
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50 font-bold'
                  : 'border-blue-600 text-blue-700 bg-blue-50/50 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.isAi && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      {/* Tab Panels */}
      <div className="bg-white p-6 rounded-b-xl border border-t-0 border-slate-200 shadow-xs">
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">
              Section A & B: Chief Complaints & History of Present Illness (HPI)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Main Complaint *</label>
                <input
                  type="text"
                  value={caseData.chief_complaint}
                  onChange={(e) => handleCaseChange('chief_complaint', e.target.value)}
                  placeholder="e.g. Throbbing headache and epigastric burning discomfort"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration *</label>
                <input
                  type="text"
                  value={caseData.chief_complaint_duration}
                  onChange={(e) => handleCaseChange('chief_complaint_duration', e.target.value)}
                  placeholder="e.g. 4 days / 2 weeks"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={caseData.chief_complaint_severity}
                  onChange={(e) => handleCaseChange('chief_complaint_severity', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Onset</label>
                <select
                  value={caseData.chief_complaint_onset}
                  onChange={(e) => handleCaseChange('chief_complaint_onset', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                >
                  <option value="Acute">Acute</option>
                  <option value="Subacute">Subacute</option>
                  <option value="Gradual">Gradual</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Complaints</label>
                <input
                  type="text"
                  value={caseData.additional_complaints}
                  onChange={(e) => handleCaseChange('additional_complaints', e.target.value)}
                  placeholder="e.g. Nausea, dizziness, sleep disturbance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed History of Present Illness (HPI)</label>
              <textarea
                rows={4}
                value={caseData.present_illness_history}
                onChange={(e) => handleCaseChange('present_illness_history', e.target.value)}
                placeholder="Narrative summary of disease progression, timeline, relieving factors..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section C: Medical, Surgical & Family History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Previous Diseases / Chronic Conditions</label>
                <textarea
                  rows={2}
                  value={caseData.medical_history.past_diseases}
                  onChange={(e) => handleHistoryChange('past_diseases', e.target.value)}
                  placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma, TB..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Past Surgical Interventions</label>
                <textarea
                  rows={2}
                  value={caseData.medical_history.past_surgeries}
                  onChange={(e) => handleHistoryChange('past_surgeries', e.target.value)}
                  placeholder="e.g. Appendectomy in 2021..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Ongoing Medications</label>
                <textarea
                  rows={2}
                  value={caseData.medical_history.current_medications}
                  onChange={(e) => handleHistoryChange('current_medications', e.target.value)}
                  placeholder="e.g. Tab Metformin 500mg BD..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Drug Allergies</label>
                <textarea
                  rows={2}
                  value={caseData.medical_history.drug_allergies}
                  onChange={(e) => handleHistoryChange('drug_allergies', e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa, Dust..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section D: Vital Signs & Measurements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={caseData.vitals.blood_pressure_systolic || ''}
                  onChange={(e) => handleVitalsChange('blood_pressure_systolic', parseInt(e.target.value) || null)}
                  placeholder="120"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={caseData.vitals.blood_pressure_diastolic || ''}
                  onChange={(e) => handleVitalsChange('blood_pressure_diastolic', parseInt(e.target.value) || null)}
                  placeholder="80"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={caseData.vitals.heart_rate || ''}
                  onChange={(e) => handleVitalsChange('heart_rate', parseInt(e.target.value) || null)}
                  placeholder="72"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={caseData.vitals.temperature || ''}
                  onChange={(e) => handleVitalsChange('temperature', parseFloat(e.target.value) || null)}
                  placeholder="98.6"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={caseData.vitals.spo2 || ''}
                  onChange={(e) => handleVitalsChange('spo2', parseFloat(e.target.value) || null)}
                  placeholder="98"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={caseData.vitals.weight_kg || ''}
                  onChange={(e) => handleVitalsChange('weight_kg', parseFloat(e.target.value) || null)}
                  placeholder="70"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={caseData.vitals.height_cm || ''}
                  onChange={(e) => handleVitalsChange('height_cm', parseFloat(e.target.value) || null)}
                  placeholder="172"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Calculated BMI</label>
                <input
                  type="text"
                  readOnly
                  value={caseData.vitals.bmi ? `${caseData.vitals.bmi} kg/m²` : '--'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800 font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'examination' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section E: Physical & Systemic Examination</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">General Physical Examination (PICCLED)</label>
                <textarea
                  rows={2}
                  value={caseData.general_examination}
                  onChange={(e) => handleCaseChange('general_examination', e.target.value)}
                  placeholder="Conscious, oriented. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, edema."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Systemic Examination (CVS, RS, P/A, CNS)</label>
                <textarea
                  rows={3}
                  value={caseData.systemic_examination}
                  onChange={(e) => handleCaseChange('systemic_examination', e.target.value)}
                  placeholder="CVS: S1 S2 heard. RS: Bilateral vesicular breath sounds. P/A: Soft, non-tender. CNS: Intact."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section F: Clinical Assessment & Diagnosis</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provisional Diagnosis *</label>
                <input
                  type="text"
                  value={caseData.provisional_diagnosis}
                  onChange={(e) => handleCaseChange('provisional_diagnosis', e.target.value)}
                  placeholder="e.g. Essential Hypertension Stage-1; Acid Peptic Disease"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Final Confirmed Diagnosis</label>
                <input
                  type="text"
                  value={caseData.final_diagnosis}
                  onChange={(e) => handleCaseChange('final_diagnosis', e.target.value)}
                  placeholder="e.g. Primary Essential Hypertension"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Differential Diagnosis</label>
                <input
                  type="text"
                  value={caseData.differential_diagnosis}
                  onChange={(e) => handleCaseChange('differential_diagnosis', e.target.value)}
                  placeholder="e.g. Tension headache, Secondary hypertension"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'treatment' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section G: Prescription & Medical Management</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Prescribed Medications (Rx)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Medicine Name</th>
                      <th className="p-2.5 w-24">Dosage</th>
                      <th className="p-2.5 w-24">Route</th>
                      <th className="p-2.5 w-32">Frequency</th>
                      <th className="p-2.5 w-28">Duration</th>
                      <th className="p-2.5">Instructions</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {caseData.prescription.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.medicine_name}
                            onChange={(e) => handleMedicineChange(idx, 'medicine_name', e.target.value)}
                            placeholder="e.g. Tab. Telmisartan 40mg"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                            placeholder="1 tab"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.route}
                            onChange={(e) => handleMedicineChange(idx, 'route', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            <option value="Oral">Oral</option>
                            <option value="IV">IV</option>
                            <option value="IM">IM</option>
                            <option value="Topical">Topical</option>
                            <option value="Inhalation">Inhalation</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.frequency}
                            onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          >
                            <option value="1-0-1 (BID)">1-0-1 (BID)</option>
                            <option value="1-1-1 (TID)">1-1-1 (TID)</option>
                            <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                            <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                            <option value="SOS (As needed)">SOS (As needed)</option>
                            <option value="Once Weekly">Once Weekly</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                            placeholder="5 days"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                            placeholder="After food"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {caseData.prescription.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Advice</label>
                <textarea
                  rows={2}
                  value={caseData.dietary_advice}
                  onChange={(e) => handleCaseChange('dietary_advice', e.target.value)}
                  placeholder="Low sodium diet, restrict oily foods..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lifestyle Advice</label>
                <textarea
                  rows={2}
                  value={caseData.lifestyle_advice}
                  onChange={(e) => handleCaseChange('lifestyle_advice', e.target.value)}
                  placeholder="Regular brisk walking, adequate hydration..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'followup' && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 border-b pb-2">Section H: Follow-Up & Discharge Directions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Follow-up Date</label>
                <input
                  type="date"
                  value={caseData.follow_up_date}
                  onChange={(e) => handleCaseChange('follow_up_date', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Instructions</label>
                <textarea
                  rows={3}
                  value={caseData.follow_up_instructions}
                  onChange={(e) => handleCaseChange('follow_up_instructions', e.target.value)}
                  placeholder="Review in OPD with blood pressure chart..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-xl flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-sm font-bold text-purple-950">AI Clinical Documentation & Decision Support</h2>
                </div>
                <p className="text-xs text-purple-800 mt-1">
                  Works strictly as a documentation helper and clinical reminder under physician supervision.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                Physician Supervised
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Structured Summary</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Generate comprehensive case brief from entered details.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAISummary}
                  disabled={aiLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 inline mr-1" />
                  <span>Generate Summary</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Safety Linter</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Verify missing vitals, allergy checks & abnormal values.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckMissingInfo}
                  disabled={aiLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1" />
                  <span>Check Missing Info</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Notes to SOAP</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Format raw doctor notes into structured SOAP medical notes.</p>
                </div>
                <button
                  type="button"
                  onClick={handleFormatRoughNotes}
                  disabled={aiLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  <span>Format Notes</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Rough Notes:</label>
              <textarea
                rows={3}
                value={caseData.raw_notes}
                onChange={(e) => handleCaseChange('raw_notes', e.target.value)}
                placeholder="e.g. c/o headache 4d, bp 148/94, dx: HTN, rx: telmi 40mg OD..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
              ></textarea>
            </div>

            {caseData.ai_generated_summary && (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    AI-Generated Case Summary (Doctor Review Required)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCaseData((prev) => ({ ...prev, ai_reviewed_by_doctor: true }));
                      showSuccess('Summary verified and accepted.');
                    }}
                    className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-semibold rounded hover:bg-purple-500"
                  >
                    ✓ Verify Summary
                  </button>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-mono">{caseData.ai_generated_summary}</p>
              </div>
            )}

            {aiMissingResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Safety & Linter Alerts</div>
                {aiMissingResult.missing_items.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-rose-700">Missing Information:</span>
                    <ul className="list-disc list-inside text-xs text-rose-900">
                      {aiMissingResult.missing_items.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}
                {aiMissingResult.clinical_alerts.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-amber-700">Abnormal Indicators:</span>
                    <ul className="list-disc list-inside text-xs text-amber-900">
                      {aiMissingResult.clinical_alerts.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="text-xs text-slate-500">
          Status: <strong className="uppercase text-slate-800">{caseData.status}</strong>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveCase('draft')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveCase('completed')}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete & Issue Prescription</span>
          </button>
        </div>
      </div>
    </div>
  );
};
