import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  CheckCircle2,
  AlertCircle,
  Apple,
} from 'lucide-react';
import { Visit, Patient, FeedingRecord, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface FeedingSheetTabProps {
  visit: Visit;
  patient: Patient | null;
  feedingRecords: FeedingRecord[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const FeedingSheetTab: React.FC<FeedingSheetTabProps> = ({
  visit,
  patient,
  feedingRecords,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const patientFeedings = feedingRecords.filter((f) => f.visitId === visit.id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dietType, setDietType] = useState<FeedingRecord['dietType']>('regular');
  const [amountOffered, setAmountOffered] = useState('');
  const [amountConsumed, setAmountConsumed] = useState('100%');
  const [feedingRoute, setFeedingRoute] = useState<FeedingRecord['feedingRoute']>('oral');
  const [tolerance, setTolerance] = useState<FeedingRecord['tolerance']>('well_tolerated');
  const [notes, setNotes] = useState('');

  const handleApplyPreset = (diet: FeedingRecord['dietType'], offered: string, route: FeedingRecord['feedingRoute'] = 'oral') => {
    setDietType(diet);
    setAmountOffered(offered);
    setFeedingRoute(route);
    setShowAddForm(true);
  };

  const handleAddFeeding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountOffered.trim()) return;

    const newRecord: FeedingRecord = {
      id: `feed_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      dietType,
      amountOffered: amountOffered.trim(),
      amountConsumed: amountConsumed.trim(),
      feedingRoute,
      tolerance,
      assistedBy: currentUser.name,
      notes: notes.trim() || undefined,
    };

    onUpdateDb((prev) => ({
      ...prev,
      feedingRecords: [newRecord, ...(prev.feedingRecords || [])],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Feeding Logged: ${visit.patientName}`,
      `Nurse ${currentUser.name} logged nutrition intake for ${visit.patientName}: ${dietType.replace('_', ' ')} (${amountConsumed}).`
    );

    setAmountOffered('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Patient Dietary & Enteral/Oral Feeding Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Inpatient nutritional monitoring, meal tolerances, enteral tube feedings, and fluid balances.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Log Meal / Nutrition Intake</span>
        </button>
      </div>

      {/* Quick Feeding Presets */}
      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
          1-Click Dietary Regimen Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('diabetic', '1 Standard Diabetic Breakfast (Oatmeal, Boiled Egg, Sugar-free tea)')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Diabetic Breakfast
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('regular', '1 Standard Balanced Hospital Lunch Tray (Rice, Vegetables, Lean Protein)')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Regular Lunch
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('clear_fluid', '250 mL Oral Rehydration Solution (ORS)')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + ORS 250ml
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('ng_tube', '200 mL Enteral Formula Feed followed by 30ml water flush', 'ng_tube')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + NG Tube Feed 200ml
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('npo', 'Nil Per Os (NPO) - Strict Fasting per physician order')}
            className="text-[11px] bg-red-50 hover:bg-red-100 text-red-800 px-2.5 py-1 rounded-lg border border-red-200 transition"
          >
            + Strict NPO Fasting
          </button>
        </div>
      </div>

      {/* Add Feeding Form */}
      {showAddForm && (
        <form onSubmit={handleAddFeeding} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Record Nutritional Intake & Tolerance
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Diet Type
              </label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="regular">Regular Inpatient Diet</option>
                <option value="soft">Soft / Pureed Diet</option>
                <option value="clear_fluid">Clear Fluids / ORS</option>
                <option value="diabetic">Diabetic Meal (Low GI)</option>
                <option value="low_sodium">Low Sodium / Cardiac</option>
                <option value="ng_tube">NG Tube Formula</option>
                <option value="tpn">TPN Parenteral Nutrition</option>
                <option value="npo">Nil By Mouth (NPO)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Feeding Route
              </label>
              <select
                value={feedingRoute}
                onChange={(e) => setFeedingRoute(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="oral">Oral (Self-fed / Assisted)</option>
                <option value="ng_tube">Nasogastric (NG) Tube</option>
                <option value="peg">PEG / G-Tube</option>
                <option value="iv">IV Infusion / TPN</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Amount Offered
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1 Tray or 250 mL"
                value={amountOffered}
                onChange={(e) => setAmountOffered(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Amount Consumed
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 100%, 75%, 150 mL"
                value={amountConsumed}
                onChange={(e) => setAmountConsumed(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Patient Tolerance
              </label>
              <select
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="well_tolerated">Well Tolerated (No nausea/distress)</option>
                <option value="mild_nausea">Mild Nausea</option>
                <option value="vomited">Emesis / Vomiting</option>
                <option value="refused">Patient Refused Meal</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Clinical Remarks / Symptoms
              </label>
              <input
                type="text"
                placeholder="e.g. Tolerated without reflux, took prescribed oral fluids..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
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
              Save Feeding Record
            </button>
          </div>
        </form>
      )}

      {/* Feedings Table */}
      {patientFeedings.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No dietary intake entries logged for this encounter yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Log meals, oral hydration, or enteral feeds using the button or quick presets above.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Diet Type</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3">Amount Offered & Consumed</th>
                <th className="py-2.5 px-3">Tolerance</th>
                <th className="py-2.5 px-3">Assisted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientFeedings.map((feed) => (
                <tr key={feed.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(feed.time)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-800 uppercase text-[10px] px-2 py-0.5 bg-slate-100 rounded">
                      {feed.dietType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 uppercase text-[10px]">
                    {feed.feedingRoute.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-900">
                    <div>{feed.amountOffered}</div>
                    <div className="text-[11px] font-bold text-purple-700">Consumed: {feed.amountConsumed}</div>
                    {feed.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{feed.notes}</div>}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        feed.tolerance === 'well_tolerated'
                          ? 'bg-emerald-100 text-emerald-800'
                          : feed.tolerance === 'vomited'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {feed.tolerance.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    {feed.assistedBy}
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
