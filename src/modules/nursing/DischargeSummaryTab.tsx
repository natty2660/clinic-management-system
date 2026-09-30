import React, { useState } from 'react';
import {
  LogOut,
  CheckCircle2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Visit, Patient, DischargeSummaryRecord, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface DischargeSummaryTabProps {
  visit: Visit;
  patient: Patient | null;
  summaries: DischargeSummaryRecord[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: () => void;
}

export const DischargeSummaryTab: React.FC<DischargeSummaryTabProps> = ({
  visit,
  patient,
  summaries,
  currentUser,
  onUpdateDb,
  broadcast,
  onPrint,
}) => {
  const currentSummary = summaries.find((s) => s.visitId === visit.id);
  const [isEditing, setIsEditing] = useState(!currentSummary);

  const [disposition, setDisposition] = useState<DischargeSummaryRecord['dischargeDisposition']>(
    currentSummary?.dischargeDisposition || 'home_routine'
  );
  const [condition, setCondition] = useState<DischargeSummaryRecord['finalCondition']>(
    currentSummary?.finalCondition || 'improved_stable'
  );

  const [bp, setBp] = useState(currentSummary?.dischargeVitals.bp || '120/80 mmHg');
  const [temp, setTemp] = useState(currentSummary?.dischargeVitals.temp || 36.8);
  const [pulse, setPulse] = useState(currentSummary?.dischargeVitals.pulse || 72);
  const [spo2, setSpo2] = useState(currentSummary?.dischargeVitals.spo2 || 98);
  const [resp, setResp] = useState(currentSummary?.dischargeVitals.resp || 16);

  const [homeMeds, setHomeMeds] = useState(
    currentSummary?.homeMedications || 'Oral medications dispensed per physician discharge prescription.'
  );
  const [careInstructions, setCareInstructions] = useState(
    currentSummary?.woundCareDietInstructions || 'Maintain adequate oral fluid intake, bed rest for 48 hours, follow balanced diet.'
  );
  const [followUpDate, setFollowUpDate] = useState(
    currentSummary?.followUpDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [followUpClinic, setFollowUpClinic] = useState(
    currentSummary?.followUpClinic || 'SPEED General OPD (Room 101)'
  );

  const [cannulaRemoved, setCannulaRemoved] = useState(currentSummary ? currentSummary.cannulaAndLinesRemoved : true);
  const [belongingsReturned, setBelongingsReturned] = useState(currentSummary ? currentSummary.personalBelongingsReturned : true);
  const [medsExplained, setMedsExplained] = useState(currentSummary ? currentSummary.medicationsExplained : true);
  const [warningSignsGiven, setWarningSignsGiven] = useState(currentSummary ? currentSummary.emergencyWarningSignsGiven : true);
  const [patientAck, setPatientAck] = useState(currentSummary ? currentSummary.patientFamilyAckSigned : true);
  const [remarks, setRemarks] = useState(currentSummary?.additionalRemarks || '');

  const handleSaveDischarge = (e: React.FormEvent) => {
    e.preventDefault();

    const dischargeRecord: DischargeSummaryRecord = {
      id: currentSummary?.id || `disch_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      admissionDate: visit.createdAt,
      dischargeDate: new Date().toISOString(),
      dischargeDisposition: disposition,
      finalCondition: condition,
      dischargeVitals: {
        bp,
        temp: Number(temp),
        pulse: Number(pulse),
        spo2: Number(spo2),
        resp: Number(resp),
      },
      medicationsExplained: medsExplained,
      homeMedications: homeMeds.trim(),
      woundCareDietInstructions: careInstructions.trim(),
      cannulaAndLinesRemoved: cannulaRemoved,
      personalBelongingsReturned: belongingsReturned,
      followUpDate,
      followUpClinic,
      emergencyWarningSignsGiven: warningSignsGiven,
      dischargedByNurse: currentUser.name,
      patientFamilyAckSigned: patientAck,
      additionalRemarks: remarks.trim() || undefined,
    };

    onUpdateDb((prev) => {
      const existing = prev.dischargeSummaries || [];
      const updated = existing.some((s) => s.visitId === visit.id)
        ? existing.map((s) => (s.visitId === visit.id ? dischargeRecord : s))
        : [dischargeRecord, ...existing];

      return {
        ...prev,
        dischargeSummaries: updated,
        visits: prev.visits.map((v) =>
          v.id === visit.id
            ? {
                ...v,
                status: 'discharged',
                completedAt: new Date().toISOString(),
                version: (v.version || 1) + 1,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.name,
              }
            : v
        ),
      };
    });

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Patient Discharged: ${visit.patientName}`,
      `Nurse ${currentUser.name} completed nursing discharge and safety checklist for ${visit.patientName}. Status updated to Discharged.`
    );

    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <LogOut className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Nursing Discharge Summary & Patient Home Transition
            </h3>
            <p className="text-xs text-slate-500">
              Discharge vital verification, medication reconciliation, red flag warnings, cannula removal, and follow-up plan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentSummary && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Update Discharge Record
            </button>
          )}

          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Discharge Dossier</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveDischarge} className="space-y-4 text-xs">
          {/* Discharge Vitals Verification */}
          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
            <span className="font-bold text-purple-900 text-xs uppercase tracking-wide block">
              Pre-Discharge Physiological Verification Vitals:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={resp}
                  onChange={(e) => setResp(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Disposition & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Discharge Disposition
              </label>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="home_routine">Routine Discharge to Home</option>
                <option value="referred_hospital">Transferred to Tertiary / Specialized Hospital</option>
                <option value="against_medical_advice">Discharged Against Medical Advice (DAMA)</option>
                <option value="transferred_ward">Transferred to Step-Down Ward</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Clinical Condition at Discharge
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="improved_stable">Improved & Clinically Stable (Ambulatory)</option>
                <option value="cured">Complete Resolution / Cured</option>
                <option value="stable_wheelchair">Stable, Requires Wheelchair Assistance</option>
                <option value="stretcher_critical">Stretcher Transfer</option>
              </select>
            </div>
          </div>

          {/* Home Care & Instructions */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Home Medications & Administration Directions *
              </label>
              <textarea
                required
                rows={2}
                value={homeMeds}
                onChange={(e) => setHomeMeds(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Dietary, Wound Care & Activity Guidelines *
              </label>
              <textarea
                required
                rows={2}
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Follow-up Appointment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Follow-up Appointment Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Follow-up Clinic / Consultant
              </label>
              <input
                type="text"
                value={followUpClinic}
                onChange={(e) => setFollowUpClinic(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Nursing Safety Checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-900 text-xs block uppercase">
              Bedside Discharge Safety Checklist:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cannulaRemoved}
                  onChange={(e) => setCannulaRemoved(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>IV Cannula, Drips & Catheter lines removed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={belongingsReturned}
                  onChange={(e) => setBelongingsReturned(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Personal belongings & valuables handed over</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medsExplained}
                  onChange={(e) => setMedsExplained(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Medication dosage & schedule explained clearly</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={warningSignsGiven}
                  onChange={(e) => setWarningSignsGiven(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span>Emergency red flags & when to return reviewed</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {currentSummary && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Finalize Discharge & Release Patient
            </button>
          </div>
        </form>
      ) : (
        /* Summary View */
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-sm">Discharge Complete & Verified</span>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {currentSummary!.dischargeDisposition.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-1">
                Discharged by Nurse <strong>{currentSummary!.dischargedByNurse}</strong> · {formatDateTime(currentSummary!.dischargeDate)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Discharge Vitals</span>
              <span className="font-mono font-bold text-slate-900">
                {currentSummary!.dischargeVitals.bp} · {currentSummary!.dischargeVitals.temp}°C
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Home Medications</span>
              <p className="text-slate-800 font-medium">{currentSummary!.homeMedications}</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Care Instructions</span>
              <p className="text-slate-800">{currentSummary!.woundCareDietInstructions}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Follow-Up Appointment</span>
              <strong className="text-slate-900">{currentSummary!.followUpDate} at {currentSummary!.followUpClinic}</strong>
            </div>
            <div className="text-right text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bedside Safety Checklist Confirmed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
