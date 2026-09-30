import React, { useState } from 'react';
import {
  Baby,
  Plus,
  CheckCircle2,
  Printer,
  Heart,
  Calendar,
} from 'lucide-react';
import { Visit, Patient, LabourSummary, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface LabourSummaryTabProps {
  visit: Visit;
  patient: Patient | null;
  summaries: LabourSummary[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: () => void;
}

export const LabourSummaryTab: React.FC<LabourSummaryTabProps> = ({
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

  const [gravida, setGravida] = useState(currentSummary?.gpal.gravida || 1);
  const [para, setPara] = useState(currentSummary?.gpal.para || 0);
  const [abortion, setAbortion] = useState(currentSummary?.gpal.abortion || 0);
  const [living, setLiving] = useState(currentSummary?.gpal.living || 0);
  const [ga, setGa] = useState(currentSummary?.gestationalAgeWeeks || 39);

  const [onset, setOnset] = useState(currentSummary?.onsetOfLabour || new Date().toISOString().slice(0, 16));
  const [liquor, setLiquor] = useState<LabourSummary['liquorColor']>(currentSummary?.liquorColor || 'clear');
  const [deliveryMode, setDeliveryMode] = useState<LabourSummary['modeOfDelivery']>(currentSummary?.modeOfDelivery || 'spontaneous_vaginal');
  const [gender, setGender] = useState<LabourSummary['babyGender']>(currentSummary?.babyGender || 'female');
  const [weight, setWeight] = useState(currentSummary?.birthWeightGrams || 3200);
  const [apgar1, setApgar1] = useState(currentSummary?.apgar1Min || 8);
  const [apgar5, setApgar5] = useState(currentSummary?.apgar5Min || 10);
  const [ebl, setEbl] = useState(currentSummary?.estimatedBloodLossMl || 250);
  const [perineum, setPerineum] = useState<LabourSummary['perineumStatus']>(currentSummary?.perineumStatus || 'intact');
  const [uterotonic, setUterotonic] = useState(currentSummary?.uterotonicGiven || 'Oxytocin 10 IU IM STAT');
  const [notes, setNotes] = useState(currentSummary?.notes || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const summaryData: LabourSummary = {
      id: currentSummary?.id || `lab_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      gpal: { gravida, para, abortion, living },
      gestationalAgeWeeks: Number(ga),
      admissionTime: visit.createdAt,
      onsetOfLabour: onset,
      liquorColor: liquor,
      deliveryTime: new Date().toISOString(),
      modeOfDelivery: deliveryMode,
      babyGender: gender,
      birthWeightGrams: Number(weight),
      apgar1Min: Number(apgar1),
      apgar5Min: Number(apgar5),
      placentaDeliveredAt: new Date().toISOString(),
      placentaComplete: true,
      estimatedBloodLossMl: Number(ebl),
      perineumStatus: perineum,
      uterotonicGiven: uterotonic,
      maternalConditionPostpartum: 'stable',
      attendingMidwife: currentUser.name,
      notes: notes.trim() || undefined,
    };

    onUpdateDb((prev) => {
      const existing = prev.labourSummaries || [];
      const updated = existing.some((s) => s.visitId === visit.id)
        ? existing.map((s) => (s.visitId === visit.id ? summaryData : s))
        : [summaryData, ...existing];
      return { ...prev, labourSummaries: updated };
    });

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse & Maternity Station',
      `Delivery Summary Recorded: ${visit.patientName}`,
      `Nurse/Midwife ${currentUser.name} logged delivery of ${gender === 'male' ? 'Baby Boy' : 'Baby Girl'} (${weight}g, Apgar ${apgar1}/${apgar5}) for ${visit.patientName}.`
    );

    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Maternal Delivery & Obstetric Labour Summary Sheet
            </h3>
            <p className="text-xs text-slate-500">
              Obstetric history (GPAL), delivery mode, neonatal birth metrics, Apgar scores, and third-stage management.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentSummary && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Edit Delivery Record
            </button>
          )}
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Delivery Summary</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* GPAL and Gestational Age */}
          <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
            <span className="font-bold text-purple-900 text-xs uppercase tracking-wide block">
              Maternal Obstetric Profile:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Gravida</label>
                <input
                  type="number"
                  min="1"
                  value={gravida}
                  onChange={(e) => setGravida(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Para</label>
                <input
                  type="number"
                  min="0"
                  value={para}
                  onChange={(e) => setPara(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Abortion</label>
                <input
                  type="number"
                  min="0"
                  value={abortion}
                  onChange={(e) => setAbortion(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Living Children</label>
                <input
                  type="number"
                  min="0"
                  value={living}
                  onChange={(e) => setLiving(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Gestational Age (wks)</label>
                <input
                  type="number"
                  min="20"
                  max="44"
                  value={ga}
                  onChange={(e) => setGa(parseInt(e.target.value) || 39)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-purple-900"
                />
              </div>
            </div>
          </div>

          {/* Delivery & Neonatal Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Delivery Mode
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="spontaneous_vaginal">Spontaneous Vaginal Delivery (SVD)</option>
                <option value="vacuum_assisted">Vacuum Assisted Extraction</option>
                <option value="forceps">Forceps Delivery</option>
                <option value="emergency_c_section">Emergency Cesarean Section</option>
                <option value="elective_c_section">Elective Cesarean Section</option>
                <option value="breech_delivery">Assisted Breech Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Baby Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Birth Weight (grams)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Apgar Score (1m / 5m)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={apgar1}
                  onChange={(e) => setApgar1(parseInt(e.target.value) || 0)}
                  placeholder="1m"
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white text-center font-bold"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={apgar5}
                  onChange={(e) => setApgar5(parseInt(e.target.value) || 0)}
                  placeholder="5m"
                  className="w-1/2 p-2 border border-slate-300 rounded-lg bg-white text-center font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Third Stage & Perineum */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Estimated Blood Loss (mL)
              </label>
              <input
                type="number"
                value={ebl}
                onChange={(e) => setEbl(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Perineum Status
              </label>
              <select
                value={perineum}
                onChange={(e) => setPerineum(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="intact">Intact Perineum</option>
                <option value="episiotomy">Mediolateral Episiotomy Repaired</option>
                <option value="first_degree_tear">1st Degree Perineal Tear Repaired</option>
                <option value="second_degree_tear">2nd Degree Perineal Tear Repaired</option>
                <option value="third_degree_tear">3rd Degree Tear (Specialist Repair)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Amniotic Liquor Color
              </label>
              <select
                value={liquor}
                onChange={(e) => setLiquor(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="clear">Clear Amniotic Fluid</option>
                <option value="meconium_grade_1">Meconium Grade 1 (Thin)</option>
                <option value="meconium_grade_2">Meconium Grade 2 (Moderate)</option>
                <option value="meconium_grade_3">Meconium Grade 3 (Thick Pea Soup)</option>
                <option value="blood_stained">Blood Stained</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Active Uterotonic Given
              </label>
              <input
                type="text"
                value={uterotonic}
                onChange={(e) => setUterotonic(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Midwife Delivery Notes & Newborn Response
            </label>
            <input
              type="text"
              placeholder="e.g. Vigorous cry at birth, skin-to-skin initiated, placenta delivered completely with 3 vessels..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            />
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
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Maternal Delivery Summary
            </button>
          </div>
        </form>
      ) : (
        /* Summary View */
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Obstetric Parity</span>
              <strong className="text-sm text-purple-950">
                G{currentSummary!.gpal.gravida} P{currentSummary!.gpal.para} A{currentSummary!.gpal.abortion} L{currentSummary!.gpal.living}
              </strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Gestational Age</span>
              <strong className="text-sm text-purple-950">{currentSummary!.gestationalAgeWeeks} Weeks</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Delivery Mode</span>
              <strong className="text-sm text-purple-950 capitalize">{currentSummary!.modeOfDelivery.replace('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Delivery Time</span>
              <strong className="text-sm text-purple-950">{formatDateTime(currentSummary!.deliveryTime)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Neonatal Outcome</span>
              <div className="text-sm font-bold text-slate-900">
                Baby {currentSummary!.babyGender === 'female' ? 'Girl' : 'Boy'} ({currentSummary!.birthWeightGrams} g)
              </div>
              <div className="text-xs text-emerald-700 font-bold">
                Apgar Score: {currentSummary!.apgar1Min} (1 min) · {currentSummary!.apgar5Min} (5 min)
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Third Stage & Blood Loss</span>
              <div className="text-sm font-bold text-slate-900">
                EBL: {currentSummary!.estimatedBloodLossMl} mL
              </div>
              <div className="text-xs text-slate-600">
                Placenta: Complete · {currentSummary!.uterotonicGiven}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Perineum & Maternal State</span>
              <div className="text-sm font-bold text-slate-900 capitalize">
                {currentSummary!.perineumStatus.replace('_', ' ')}
              </div>
              <div className="text-xs text-slate-600">
                Attending Midwife: <strong>{currentSummary!.attendingMidwife}</strong>
              </div>
            </div>
          </div>

          {currentSummary!.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
              <strong>Clinical Remarks: </strong> {currentSummary!.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
