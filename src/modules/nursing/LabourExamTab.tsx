import React, { useState } from 'react';
import {
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  Gauge,
  AlertTriangle,
} from 'lucide-react';
import { Visit, Patient, LabourExamRecord, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface LabourExamTabProps {
  visit: Visit;
  patient: Patient | null;
  examRecords: LabourExamRecord[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const LabourExamTab: React.FC<LabourExamTabProps> = ({
  visit,
  patient,
  examRecords,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const patientExams = examRecords.filter((e) => e.visitId === visit.id);
  const latestExam = patientExams[0];

  const [showAddForm, setShowAddForm] = useState(false);
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(82);
  const [contractions, setContractions] = useState<number>(3);
  const [duration, setDuration] = useState<number>(35);
  const [dilation, setDilation] = useState<number>(5);
  const [effacement, setEffacement] = useState<number>(70);
  const [station, setStation] = useState<string>('0');
  const [fhr, setFhr] = useState<number>(140);
  const [membranes, setMembranes] = useState<LabourExamRecord['membranesStatus']>('intact');
  const [moulding, setMoulding] = useState<LabourExamRecord['moulding']>('0');
  const [actionPlan, setActionPlan] = useState('');

  const handleApplyPhasePreset = (phase: 'latent' | 'active' | 'transition') => {
    if (phase === 'latent') {
      setDilation(3);
      setEffacement(40);
      setContractions(2);
      setDuration(25);
      setStation('-2');
      setActionPlan('Latent phase of 1st stage. Continue maternal hydration and ambulation.');
    } else if (phase === 'active') {
      setDilation(6);
      setEffacement(80);
      setContractions(3);
      setDuration(40);
      setStation('0');
      setActionPlan('Active 1st stage labour progressing along partograph alert line.');
    } else {
      setDilation(9);
      setEffacement(100);
      setContractions(4);
      setDuration(50);
      setStation('+1');
      setActionPlan('Transition phase. Prepare delivery room and neonatal resuscitation station.');
    }
    setShowAddForm(true);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: LabourExamRecord = {
      id: `lexam_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      maternalBpSystolic: Number(bpSys),
      maternalBpDiastolic: Number(bpDia),
      maternalPulse: Number(pulse),
      contractionsPer10Min: Number(contractions),
      contractionDurationSec: Number(duration),
      cervicalDilatationCm: Number(dilation),
      cervicalEffacementPercent: Number(effacement),
      fetalStation: station,
      fetalHeartRateBpm: Number(fhr),
      membranesStatus: membranes,
      moulding,
      actionPlan: actionPlan.trim() || 'Labour progressing per protocol.',
      examinedBy: currentUser.name,
    };

    onUpdateDb((prev) => ({
      ...prev,
      labourExamRecords: [newRecord, ...(prev.labourExamRecords || [])],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Labour Exam: ${dilation}cm Dilated (${visit.patientName})`,
      `Nurse/Midwife ${currentUser.name} recorded cervical dilatation ${dilation}cm, FHR ${fhr}bpm for ${visit.patientName}.`
    );

    setActionPlan('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Examination during Labour & Serial Partograph Monitoring
            </h3>
            <p className="text-xs text-slate-500">
              Cervical dilatation gauge (0-10cm), uterine contractions, fetal heart rate (FHR), and active labour management.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Record Labour Examination</span>
        </button>
      </div>

      {/* Visual Dilatation Gauge & Status Card */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular 0-10cm Gauge Visual */}
          <div className="w-20 h-20 rounded-full bg-white border-4 border-purple-600 flex flex-col items-center justify-center shadow-xs shrink-0">
            <span className="text-2xl font-black text-purple-950 font-mono">
              {latestExam ? latestExam.cervicalDilatationCm : '—'}
            </span>
            <span className="text-[9px] uppercase font-bold text-purple-700">cm dilated</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Partograph Dilatation Progress (0 to 10 cm Full Dilation)
              </span>
              {latestExam && (
                <span className="text-xs font-bold text-purple-800">
                  {latestExam.cervicalDilatationCm >= 10 ? 'Fully Dilated (2nd Stage)' : `${latestExam.cervicalDilatationCm * 10}% Complete`}
                </span>
              )}
            </div>

            {/* Dilation Progress Bar */}
            <div className="w-full sm:w-80 h-3 bg-purple-200 rounded-full overflow-hidden mt-1.5 border border-purple-300">
              <div
                className="h-full bg-purple-600 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, ((latestExam?.cervicalDilatationCm || 0) / 10) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 mt-1 w-full sm:w-80">
              <span>0 cm (Closed)</span>
              <span>4 cm (Active Phase)</span>
              <span>10 cm (Full)</span>
            </div>
          </div>
        </div>

        {/* Fetal Heart Rate Snapshot */}
        <div className="text-right sm:border-l sm:border-purple-200 sm:pl-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Fetal Heart Rate (FHR)</span>
          <div className="text-xl font-black text-purple-950 font-mono">
            {latestExam ? `${latestExam.fetalHeartRateBpm} bpm` : '—'}
          </div>
          <span className="text-[11px] font-medium text-emerald-700">
            {latestExam && latestExam.fetalHeartRateBpm >= 120 && latestExam.fetalHeartRateBpm <= 160
              ? 'Normal FHR Range (120-160)'
              : latestExam ? 'Review Fetal Trace' : 'Awaiting check'}
          </span>
        </div>
      </div>

      {/* Phase Presets */}
      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
          1-Click Progression Phase Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPhasePreset('latent')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Latent Phase (3cm, 40%, 2/10min)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPhasePreset('active')}
            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            + Active Phase (6cm, 80%, 3/10min)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPhasePreset('transition')}
            className="text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-200 transition font-semibold"
          >
            + Transition Phase (9cm, 100%, 4/10min)
          </button>
        </div>
      </div>

      {/* Add Examination Form */}
      {showAddForm && (
        <form onSubmit={handleAddExam} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Record Serial Vaginal & Obstetric Examination
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Cervical Dilatation (0-10 cm) *
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                required
                value={dilation}
                onChange={(e) => setDilation(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-purple-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Effacement (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={effacement}
                onChange={(e) => setEffacement(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Station (-3 to +3)
              </label>
              <select
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              >
                <option value="-3">-3 (Floating)</option>
                <option value="-2">-2</option>
                <option value="-1">-1</option>
                <option value="0">0 (Ischial Spines / Engaged)</option>
                <option value="+1">+1</option>
                <option value="+2">+2 (Pelvic Floor)</option>
                <option value="+3">+3 (Crowning)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Fetal Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={fhr}
                onChange={(e) => setFhr(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold text-emerald-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Contractions (/10 min)
              </label>
              <input
                type="number"
                min="0"
                max="6"
                value={contractions}
                onChange={(e) => setContractions(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Contraction Duration (sec)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Maternal BP (Systolic/Diastolic)
              </label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={bpSys}
                  onChange={(e) => setBpSys(parseInt(e.target.value) || 0)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white"
                />
                <span>/</span>
                <input
                  type="number"
                  value={bpDia}
                  onChange={(e) => setBpDia(parseInt(e.target.value) || 0)}
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Membranes
              </label>
              <select
                value={membranes}
                onChange={(e) => setMembranes(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="intact">Intact</option>
                <option value="ruptured_clear">Ruptured Clear</option>
                <option value="ruptured_meconium">Ruptured Meconium</option>
                <option value="ruptured_bloody">Ruptured Bloody</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Partograph Action Plan & Examiner Notes *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Progressing along partograph alert line, supportive care, next check in 2 hours..."
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
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
              Save Labour Exam
            </button>
          </div>
        </form>
      )}

      {/* Examinations Table */}
      {patientExams.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No vaginal or labour progression examinations recorded yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ Record Labour Examination" or use the progression presets to document partograph findings.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Dilatation</th>
                <th className="py-2.5 px-3">Effacement / Station</th>
                <th className="py-2.5 px-3">Contractions</th>
                <th className="py-2.5 px-3">FHR (bpm)</th>
                <th className="py-2.5 px-3">Membranes</th>
                <th className="py-2.5 px-3">Action Plan</th>
                <th className="py-2.5 px-3">Examiner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(exam.time)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-mono font-black text-purple-950 bg-purple-100 px-2 py-0.5 rounded text-xs">
                      {exam.cervicalDilatationCm} cm
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    {exam.cervicalEffacementPercent}% · Station {exam.fetalStation}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    {exam.contractionsPer10Min}/10 min ({exam.contractionDurationSec}s)
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-emerald-800">
                    {exam.fetalHeartRateBpm} bpm
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap capitalize text-[10px] text-slate-600">
                    {exam.membranesStatus.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-900 font-medium">
                    {exam.actionPlan}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                    {exam.examinedBy}
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
