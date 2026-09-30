import React, { useState } from 'react';
import {
  Droplet,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { Visit, Patient, DiabeticRecord, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface DiabeticSheetTabProps {
  visit: Visit;
  patient: Patient | null;
  records: DiabeticRecord[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const DiabeticSheetTab: React.FC<DiabeticSheetTabProps> = ({
  visit,
  patient,
  records,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const patientRecords = records.filter((r) => r.visitId === visit.id);
  const latestRecord = patientRecords[0];

  const [showAddForm, setShowAddForm] = useState(false);
  const [mealTiming, setMealTiming] = useState<DiabeticRecord['mealTiming']>('fasting');
  const [glucose, setGlucose] = useState<number>(120);
  const [urineKetones, setUrineKetones] = useState<DiabeticRecord['urineKetones']>('negative');
  const [insulinType, setInsulinType] = useState('Regular Insulin (Actrapid)');
  const [units, setUnits] = useState<number>(0);
  const [site, setSite] = useState<DiabeticRecord['injectionSite']>('abdomen_ruq');
  const [hypo, setHypo] = useState<boolean>(false);
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [notes, setNotes] = useState('');

  // Suggested sliding scale units based on blood sugar
  const getSuggestedSlidingScale = (bgl: number) => {
    if (bgl < 70) return 0;
    if (bgl <= 150) return 0;
    if (bgl <= 200) return 2;
    if (bgl <= 250) return 4;
    if (bgl <= 300) return 6;
    return 8;
  };

  const handleGlucoseChange = (val: number) => {
    setGlucose(val);
    setHypo(val < 70);
    const suggested = getSuggestedSlidingScale(val);
    setUnits(suggested);
  };

  const handleApplyHypoCorrection = (actionText: string) => {
    setGlucose(55);
    setHypo(true);
    setUnits(0);
    setCorrectiveAction(actionText);
    setShowAddForm(true);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: DiabeticRecord = {
      id: `dm_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      mealTiming,
      bloodGlucose: Number(glucose),
      urineKetones,
      insulinType: units > 0 ? insulinType : undefined,
      prescribedUnits: units > 0 ? units : undefined,
      administeredUnits: units > 0 ? units : undefined,
      injectionSite: units > 0 ? site : undefined,
      hypoSymptoms: hypo,
      correctiveAction: correctiveAction.trim() || undefined,
      nurseSignature: currentUser.name,
      notes: notes.trim() || undefined,
    };

    onUpdateDb((prev) => ({
      ...prev,
      diabeticRecords: [newRecord, ...(prev.diabeticRecords || [])],
    }));

    if (glucose < 70 || glucose > 300) {
      broadcast(
        'CRITICAL_LAB_ALERT',
        'Nurse Station',
        `GLYCEMIC ALERT: ${glucose} mg/dL (${visit.patientName})`,
        `Nurse ${currentUser.name} reported ${glucose < 70 ? 'Hypoglycemia' : 'Severe Hyperglycemia'} (${glucose} mg/dL) for ${visit.patientName}.`
      );
    } else {
      broadcast(
        'MAR_MEDICATION_GIVEN',
        'Nurse Station',
        `Blood Sugar Logged: ${glucose} mg/dL`,
        `Nurse ${currentUser.name} logged BGL ${glucose} mg/dL for ${visit.patientName}.`
      );
    }

    setNotes('');
    setCorrectiveAction('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Diabetic Mellitus & Sliding Scale Glycemic Monitoring Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Serial capillary blood glucose (CBG), sliding scale insulin titration, and hypoglycemia safety protocols.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Log Blood Glucose & Insulin</span>
        </button>
      </div>

      {/* Glycemic Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Latest Reading Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Latest Blood Glucose</span>
          <div className="text-2xl font-black text-slate-900 font-mono flex items-baseline gap-1">
            <span>{latestRecord ? latestRecord.bloodGlucose : '—'}</span>
            <span className="text-xs text-slate-500 font-sans font-normal">mg/dL</span>
          </div>
          <div className="text-[11px] text-slate-600">
            {latestRecord ? (
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  latestRecord.bloodGlucose < 70
                    ? 'bg-red-600 text-white animate-pulse'
                    : latestRecord.bloodGlucose <= 140
                    ? 'bg-emerald-100 text-emerald-800'
                    : latestRecord.bloodGlucose <= 200
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-orange-500 text-white font-bold'
                }`}
              >
                {latestRecord.bloodGlucose < 70
                  ? 'Hypoglycemia Alert'
                  : latestRecord.bloodGlucose <= 140
                  ? 'Target Range (70-140)'
                  : latestRecord.bloodGlucose <= 200
                  ? 'Mild Elevation'
                  : 'Hyperglycemia (>200)'}
              </span>
            ) : (
              'No readings recorded yet'
            )}
          </div>
        </div>

        {/* Sliding Scale Guide */}
        <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-purple-900 uppercase block">Standard Sliding Scale Target</span>
          <div className="text-xs text-purple-950 space-y-0.5 font-medium">
            <div>• &lt; 150 mg/dL: 0 Units Regular Insulin</div>
            <div>• 151 - 200 mg/dL: 2 Units SubQ</div>
            <div>• 201 - 250 mg/dL: 4 Units SubQ</div>
            <div>• 251 - 300 mg/dL: 6 Units SubQ | &gt; 300: 8U + Call MD</div>
          </div>
        </div>

        {/* Hypo Protocol Quick Action */}
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
          <span className="text-[10px] font-bold text-red-900 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Hypoglycemia Protocol (&lt;70 mg/dL)
          </span>
          <p className="text-[11px] text-red-800 leading-tight">
            Administer 15-20g fast-acting carbs (oral glucose / sweet tea) or IV 50ml 40% Dextrose immediately.
          </p>
          <button
            type="button"
            onClick={() => handleApplyHypoCorrection('Given 200ml sweet orange juice + 20g glucose powder orally. Recheck BGL in 15 min.')}
            className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition"
          >
            Log Stat Hypo Protocol
          </button>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <form onSubmit={handleAddRecord} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Log Glycemic Assessment & Insulin Dose
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Meal Relation
              </label>
              <select
                value={mealTiming}
                onChange={(e) => setMealTiming(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="fasting">Fasting Morning</option>
                <option value="pre_breakfast">Pre-Breakfast</option>
                <option value="post_breakfast">2h Post-Breakfast</option>
                <option value="pre_lunch">Pre-Lunch</option>
                <option value="post_lunch">2h Post-Lunch</option>
                <option value="pre_dinner">Pre-Dinner</option>
                <option value="post_dinner">2h Post-Dinner</option>
                <option value="bedtime">Bedtime (22:00)</option>
                <option value="3_am">3:00 AM Check</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Blood Glucose (mg/dL) *
              </label>
              <input
                type="number"
                required
                value={glucose}
                onChange={(e) => handleGlucoseChange(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Urine Ketones
              </label>
              <select
                value={urineKetones}
                onChange={(e) => setUrineKetones(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="negative">Negative</option>
                <option value="trace">Trace</option>
                <option value="1+">1+ (Small)</option>
                <option value="2+">2+ (Moderate)</option>
                <option value="3+">3+ (Large)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Insulin Dose (Units)
              </label>
              <input
                type="number"
                min="0"
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-purple-700"
              />
            </div>
          </div>

          {units > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Insulin Preparation
                </label>
                <select
                  value={insulinType}
                  onChange={(e) => setInsulinType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Regular Insulin (Actrapid)">Regular Human Insulin (Actrapid)</option>
                  <option value="NPH Insulin (Insulatard)">NPH Intermediate (Insulatard)</option>
                  <option value="Glargine (Lantus)">Insulin Glargine (Lantus)</option>
                  <option value="Mixtard 30/70">Biphasic Isophane (Mixtard 30/70)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Subcutaneous Injection Site
                </label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="abdomen_ruq">Abdomen RUQ</option>
                  <option value="abdomen_luq">Abdomen LUQ</option>
                  <option value="abdomen_rlq">Abdomen RLQ</option>
                  <option value="abdomen_llq">Abdomen LLQ</option>
                  <option value="right_arm">Right Upper Arm</option>
                  <option value="left_arm">Left Upper Arm</option>
                  <option value="right_thigh">Right Anterior Thigh</option>
                  <option value="left_thigh">Left Anterior Thigh</option>
                </select>
              </div>
            </div>
          )}

          {hypo && (
            <div>
              <label className="block text-[10px] font-bold text-red-600 uppercase mb-1">
                Hypoglycemia Corrective Action Taken *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 200ml orange juice administered orally, re-checked CBG..."
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="w-full p-2 border border-red-300 rounded-lg bg-white text-red-900"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Nurse Clinical Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Patient asymptomatic, meal served 20 mins post-dose..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
            >
              Save Glycemic Entry
            </button>
          </div>
        </form>
      )}

      {/* Glycemic History Table */}
      {patientRecords.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Droplet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No blood glucose entries logged for this encounter yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ Log Blood Glucose & Insulin" to begin diabetic sliding scale monitoring.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Timing</th>
                <th className="py-2.5 px-3">Glucose (mg/dL)</th>
                <th className="py-2.5 px-3">Ketones</th>
                <th className="py-2.5 px-3">Insulin Given</th>
                <th className="py-2.5 px-3">Site</th>
                <th className="py-2.5 px-3">Signed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientRecords.map((r) => (
                <tr key={r.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(r.time)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap uppercase font-bold text-[10px] text-slate-700">
                    {r.mealTiming.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        r.bloodGlucose < 70
                          ? 'bg-red-600 text-white animate-pulse'
                          : r.bloodGlucose <= 140
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.bloodGlucose <= 200
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {r.bloodGlucose} mg/dL
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                    {r.urineKetones || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                    {r.administeredUnits ? (
                      <span className="text-purple-700 font-bold">
                        {r.administeredUnits}U ({r.insulinType?.split(' ')[0]})
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 uppercase text-[10px]">
                    {r.injectionSite?.replace('_', ' ') || '—'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    {r.nurseSignature}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
