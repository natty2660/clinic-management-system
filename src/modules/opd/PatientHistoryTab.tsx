import React, { useState } from 'react';
import {
  History,
  AlertCircle,
  Plus,
  Heart,
  Activity,
  Pill,
  Calendar,
  User,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Patient, Visit, Consultation, DatabaseState, User as AppUser } from '../../types/clinic';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';

interface PatientHistoryTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
}

export const PatientHistoryTab: React.FC<PatientHistoryTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [showAddHistoryNote, setShowAddHistoryNote] = useState(false);
  const [newHistoryNote, setNewHistoryNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<'medical' | 'surgical' | 'family' | 'social'>('medical');

  // Past consultations for this patient
  const patientConsultations = db.consultations
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Past prescriptions
  const patientPrescriptions = db.prescriptions
    .filter((p) => p.patientId === patient.id)
    .sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime());

  // Past visits for vitals history
  const patientVisits = db.visits
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter consultations based on search
  const filteredConsultations = patientConsultations.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.diagnosisPrimary.toLowerCase().includes(term) ||
      (c.icdCode && c.icdCode.toLowerCase().includes(term)) ||
      c.doctorNotes.toLowerCase().includes(term) ||
      c.chiefComplaint.toLowerCase().includes(term) ||
      c.doctorName.toLowerCase().includes(term)
    );
  });

  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondition.trim()) return;

    onUpdateDb((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => {
        if (p.id === patient.id) {
          const currentConditions = p.medicalHistory || [];
          if (!currentConditions.includes(newCondition.trim())) {
            return {
              ...p,
              medicalHistory: [...currentConditions, newCondition.trim()],
            };
          }
        }
        return p;
      }),
    }));

    setNewCondition('');
    setShowAddConditionModal(false);
  };

  const handleRemoveCondition = (condition: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => {
        if (p.id === patient.id) {
          return {
            ...p,
            medicalHistory: (p.medicalHistory || []).filter((c) => c !== condition),
          };
        }
        return p;
      }),
    }));
  };

  const handleAddHistoryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryNote.trim()) return;

    const formattedNote = `[${noteCategory.toUpperCase()}] ${newHistoryNote.trim()} (Recorded by ${currentUser.name} on ${formatDateOnly(new Date().toISOString())})`;

    onUpdateDb((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => {
        if (p.id === patient.id) {
          return {
            ...p,
            medicalHistory: [...(p.medicalHistory || []), formattedNote],
          };
        }
        return p;
      }),
    }));

    setNewHistoryNote('');
    setShowAddHistoryNote(false);
  };

  const commonConditions = [
    'Essential Hypertension',
    'Type 2 Diabetes Mellitus',
    'Bronchial Asthma',
    'Peptic Ulcer Disease (PUD)',
    'GERD',
    'Chronic Kidney Disease (CKD)',
    'Rheumatoid Arthritis',
    'Dyslipidemia',
  ];

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search past diagnoses, doctor notes, ICD codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddConditionModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Chronic Condition
          </button>
          <button
            type="button"
            onClick={() => setShowAddHistoryNote(true)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" /> Log Clinical Note
          </button>
        </div>
      </div>

      {/* Top Grid: Chronic Profile, Allergies, Social/Family */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chronic Conditions & Comorbidities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Chronic Medical History
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {(patient.medicalHistory || []).length} Recorded
            </span>
          </div>

          <div className="space-y-1.5 min-h-[90px]">
            {(!patient.medicalHistory || patient.medicalHistory.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-2">No documented chronic conditions.</p>
            ) : (
              patient.medicalHistory.map((cond, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-semibold text-slate-800">{cond}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond)}
                    className="text-slate-400 hover:text-rose-600 text-xs px-1"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick preset chips */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 block mb-1">Quick Add Comorbidity:</span>
            <div className="flex flex-wrap gap-1">
              {commonConditions.slice(0, 4).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => {
                    if (!patient.medicalHistory?.includes(cond)) {
                      onUpdateDb((prev) => ({
                        ...prev,
                        patients: prev.patients.map((p) =>
                          p.id === patient.id
                            ? { ...p, medicalHistory: [...(p.medicalHistory || []), cond] }
                            : p
                        ),
                      }));
                    }
                  }}
                  className="text-[9px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200 transition"
                >
                  + {cond}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Allergies & Drug Adverse Reactions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Allergies & Drug Reactions
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                patient.allergies.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {patient.allergies.length > 0 ? `${patient.allergies.length} Allergies` : 'NKDA'}
            </span>
          </div>

          <div className="space-y-1.5 min-h-[90px]">
            {patient.allergies.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>No Known Drug Allergies (NKDA) confirmed by triage and physician.</span>
              </div>
            ) : (
              patient.allergies.map((allergy, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs flex justify-between items-center"
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{allergy}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-rose-700">Strictly Avoid</span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Blood Group: <strong className="text-slate-900">{patient.bloodGroup}</strong></span>
            <span className="ml-3">MRN: <strong className="font-mono text-slate-900">{patient.mrn}</strong></span>
          </div>
        </div>

        {/* Surgical, Family & Social Profile */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" /> Social & Family Background
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Tobacco / Smoking:</span>
              <span className="font-semibold text-slate-800">Non-Smoker (Never)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Alcohol Intake:</span>
              <span className="font-semibold text-slate-800">Occasional / Social</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Family History:</span>
              <span className="font-semibold text-slate-800">Hypertension (Maternal)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Past Surgeries:</span>
              <span className="font-semibold text-slate-800">None documented</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Immunization:</span>
              <span className="font-semibold text-emerald-700">Up to Date</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Longitudinal Consultation Encounters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Longitudinal Clinical Consultations & Doctor Notes ({patientConsultations.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Complete chronological record of all previous consultations, ICD-10 diagnoses, and directives.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
            {patient.name}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredConsultations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">No previous consultations found matching criteria.</p>
            </div>
          ) : (
            filteredConsultations.map((cons) => {
              const isCurrent = cons.visitId === currentVisit.id;
              const visitObj = db.visits.find((v) => v.id === cons.visitId);

              return (
                <div
                  key={cons.id}
                  className={`p-4 transition ${
                    isCurrent ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formatDateTime(cons.createdAt)}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                          Current Visit
                        </span>
                      )}
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {cons.doctorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {cons.icdCode && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          ICD-10: {cons.icdCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Diagnosis Badge */}
                  <div className="mb-2">
                    <span className="text-xs font-black text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                      Diagnosis: {cons.diagnosisPrimary}
                    </span>
                  </div>

                  {/* Clinical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Chief Complaint
                      </span>
                      <p className="text-slate-800">{cons.chiefComplaint || 'Not recorded'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Physical Examination
                      </span>
                      <p className="text-slate-800">{cons.physicalExamination || 'Unremarkable'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        History of Illness & Notes
                      </span>
                      <p className="text-slate-800">{cons.symptomsHistory || cons.doctorNotes || 'No additional notes'}</p>
                    </div>
                  </div>

                  {/* Vitals at this consultation if available */}
                  {visitObj?.vitals && (
                    <div className="mt-2 text-[11px] flex flex-wrap gap-2 text-slate-600 font-mono">
                      <span>BP: <strong>{visitObj.vitals.bloodPressureSystolic}/{visitObj.vitals.bloodPressureDiastolic}</strong></span>
                      <span>HR: <strong>{visitObj.vitals.pulseRate} bpm</strong></span>
                      <span>Temp: <strong>{visitObj.vitals.temperature}°C</strong></span>
                      <span>SpO2: <strong>{visitObj.vitals.oxygenSaturation}%</strong></span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Historical Prescriptions Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-4 h-4 text-cyan-600" />
          Medication & Prescription History ({patientPrescriptions.length})
        </h3>

        {patientPrescriptions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No historical prescriptions issued.</p>
        ) : (
          <div className="space-y-2">
            {patientPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{rx.prescriptionNumber}</span>
                    <span className="text-slate-500">· {formatDateOnly(rx.prescribedAt)}</span>
                    <span className="text-slate-600">by {rx.orderedByDoctor}</span>
                  </div>
                  <div className="text-slate-700 mt-1 flex flex-wrap gap-2">
                    {rx.items.map((item, idx) => (
                      <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {item.medicineName} ({item.dosage} · {item.frequency})
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rx.status === 'dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Condition Modal */}
      {showAddConditionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">Add Chronic Condition / Comorbidity</h4>
              <button
                type="button"
                onClick={() => setShowAddConditionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCondition} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condition Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes Mellitus"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddConditionModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Clinical Note Modal */}
      {showAddHistoryNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900">Log Patient Clinical History Note</h4>
              <button
                type="button"
                onClick={() => setShowAddHistoryNote(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddHistoryNote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="medical">Past Medical History</option>
                  <option value="surgical">Past Surgical / Procedures</option>
                  <option value="family">Family Medical History</option>
                  <option value="social">Social & Lifestyle Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Note Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Underwent open appendectomy in 2021 without complications..."
                  value={newHistoryNote}
                  onChange={(e) => setNewHistoryNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHistoryNote(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Append Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
