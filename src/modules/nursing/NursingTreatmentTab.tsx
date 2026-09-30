import React, { useState } from 'react';
import {
  Syringe,
  Activity,
  Plus,
  Shield,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { Visit, Patient, User, NursingRecord, DatabaseState } from '../../types/clinic';
import { MAR_ROUTES, NURSING_CARE_PROCEDURES } from '../../utils/clinical';
import { formatDateTime } from '../../utils/formatters';

interface NursingTreatmentTabProps {
  visit: Visit;
  patient: Patient | null;
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: () => void;
  nursingRecords: NursingRecord[];
}

export const NursingTreatmentTab: React.FC<NursingTreatmentTabProps> = ({
  visit,
  patient,
  currentUser,
  onUpdateDb,
  broadcast,
  onPrint,
  nursingRecords,
}) => {
  const [actionType, setActionType] = useState<NursingRecord['actionType']>('medication_administered');
  const [actionDesc, setActionDesc] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medRoute, setMedRoute] = useState(MAR_ROUTES[0]);
  const [fiveRightsChecked, setFiveRightsChecked] = useState(true);

  const handleRecordAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim()) return;

    const newRecord: NursingRecord = {
      id: `nur_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      actionType,
      description: actionDesc.trim(),
      medicationName: medName || undefined,
      dosage: medDose || undefined,
      route: actionType === 'medication_administered' ? medRoute : undefined,
      administeredBy: currentUser.name,
      fiveRightsVerified: fiveRightsChecked,
      status: 'administered',
    };

    onUpdateDb((prev) => ({
      ...prev,
      nursingRecords: [newRecord, ...prev.nursingRecords],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `MAR Administered: ${medName || actionType}`,
      `Nurse ${currentUser.name} verified 5-rights and logged ${medName || actionType} for ${visit.patientName}.`
    );

    setActionDesc('');
    setMedName('');
    setMedDose('');
  };

  const handleQuickProcedure = (procName: string, category: NursingRecord['actionType'] = 'wound_dressing') => {
    setActionType(category);
    setActionDesc(procName);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Syringe className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Medication Administration Record (MAR) & Nursing Treatment
            </h3>
            <p className="text-xs text-slate-500">
              5-Rights verification, drug routes (Oral, IV, IM, SC, Nebulizer), and procedural nursing interventions.
            </p>
          </div>
        </div>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official MAR Chart</span>
          </button>
        )}
      </div>

      {/* 5-Rights Safety Confirmation */}
      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2.5">
        <input
          type="checkbox"
          id="fiveRightsVerified"
          checked={fiveRightsChecked}
          onChange={(e) => setFiveRightsChecked(e.target.checked)}
          className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600"
        />
        <label htmlFor="fiveRightsVerified" className="text-xs font-bold text-purple-900 cursor-pointer">
          5-Rights Clinically Verified: Right Patient, Right Drug, Right Dose, Right Route, Right Time
        </label>
      </div>

      {/* Fast Procedure Presets */}
      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
          1-Click Common Nursing Interventions:
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickProcedure('IV Cannula 20G inserted right forearm under aseptic technique.', 'iv_fluid')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + IV Cannula 20G
          </button>
          <button
            type="button"
            onClick={() => handleQuickProcedure('Normal Saline 0.9% 1000ml infusion primed and started @ 100ml/hr.', 'iv_fluid')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + IV Normal Saline 1000ml
          </button>
          <button
            type="button"
            onClick={() => handleQuickProcedure('Wound cleaned with sterile saline, povidone-iodine applied, sterile gauze dressing secured.', 'wound_dressing')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Sterile Wound Dressing
          </button>
          <button
            type="button"
            onClick={() => handleQuickProcedure('Nebulization with Salbutamol 2.5mg in 2ml normal saline administered via face mask.', 'medication_administered')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Salbutamol Nebulization
          </button>
          <button
            type="button"
            onClick={() => handleQuickProcedure('Foley Catheter 16Fr inserted under sterile technique, 300ml clear amber urine drained.', 'general_care')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Foley Catheterization
          </button>
        </div>
      </div>

      {/* Treatment Form */}
      <form onSubmit={handleRecordAction} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Action Category
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="medication_administered">Medication Administered</option>
              <option value="iv_fluid">IV Fluid / Cannulation</option>
              <option value="wound_dressing">Wound Dressing / Procedure</option>
              <option value="vital_check">Routine Observation</option>
              <option value="general_care">General Nursing Care</option>
            </select>
          </div>

          {actionType === 'medication_administered' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ceftriaxone 1g IV"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Dose
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1g Stat"
                  value={medDose}
                  onChange={(e) => setMedDose(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Route
                </label>
                <select
                  value={medRoute}
                  onChange={(e) => setMedRoute(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {MAR_ROUTES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
            Procedure Description & Patient Tolerability Notes *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Reconstituted per hospital protocol. Patient tolerated well without acute adverse reaction."
            value={actionDesc}
            onChange={(e) => setActionDesc(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!fiveRightsChecked}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Sign & Append to Chart
          </button>
        </div>
      </form>

      {/* Chart History */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          Nursing Care & Medication Log History ({nursingRecords.length})
        </h4>

        {nursingRecords.length === 0 ? (
          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
            No nursing treatments logged for this encounter yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {nursingRecords.map((nr) => (
              <div
                key={nr.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-start gap-3"
              >
                <div>
                  <div className="font-semibold text-slate-900">{nr.description}</div>
                  {nr.medicationName && (
                    <div className="text-[11px] text-purple-700 font-bold mt-0.5">
                      Medication: {nr.medicationName} {nr.dosage && `(${nr.dosage})`} via {nr.route || 'Oral'}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 mt-1">
                    Signed by {nr.administeredBy} · {formatDateTime(nr.time)}
                    {nr.fiveRightsVerified && ' · 5-Rights Verified'}
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shrink-0">
                  {nr.actionType.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
