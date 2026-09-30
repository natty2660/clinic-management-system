import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  HeartPulse,
  Activity,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Clock,
  Printer,
} from 'lucide-react';
import { Visit, Patient, User, VitalSigns, NursingRecord, DatabaseState } from '../../types/clinic';
import { calculateBMI, evaluateTriageLevel } from '../../utils/clinical';
import { formatDateTime } from '../../utils/formatters';

interface OpdVitalsTabProps {
  visit: Visit;
  patient: Patient | null;
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: () => void;
}

export const OpdVitalsTab: React.FC<OpdVitalsTabProps> = ({
  visit,
  patient,
  currentUser,
  onUpdateDb,
  broadcast,
  onPrint,
}) => {
  const [temp, setTemp] = useState<number>(visit.vitals?.temperature || 37.0);
  const [bpSystolic, setBpSystolic] = useState<number>(visit.vitals?.bloodPressureSystolic || 120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(visit.vitals?.bloodPressureDiastolic || 80);
  const [pulse, setPulse] = useState<number>(visit.vitals?.pulseRate || 75);
  const [spo2, setSpo2] = useState<number>(visit.vitals?.oxygenSaturation || 98);
  const [respRate, setRespRate] = useState<number>(visit.vitals?.respiratoryRate || 16);
  const [weight, setWeight] = useState<number>(visit.vitals?.weight || 70);
  const [height, setHeight] = useState<number>(visit.vitals?.height || 170);
  const [bloodSugar, setBloodSugar] = useState<number>(visit.vitals?.bloodGlucose || 110);
  const [painScore, setPainScore] = useState<number>(visit.vitals?.painScore || 0);

  useEffect(() => {
    if (visit.vitals) {
      setTemp(visit.vitals.temperature || 37.0);
      setBpSystolic(visit.vitals.bloodPressureSystolic || 120);
      setBpDiastolic(visit.vitals.bloodPressureDiastolic || 80);
      setPulse(visit.vitals.pulseRate || 75);
      setSpo2(visit.vitals.oxygenSaturation || 98);
      setRespRate(visit.vitals.respiratoryRate || 16);
      setWeight(visit.vitals.weight || 70);
      setHeight(visit.vitals.height || 170);
      setBloodSugar(visit.vitals.bloodGlucose || 110);
      setPainScore(visit.vitals.painScore || 0);
    }
  }, [visit.id]);

  const bmiCalc = calculateBMI(weight, height);
  const triageCalc = evaluateTriageLevel({
    temperature: temp,
    bloodPressureSystolic: bpSystolic,
    bloodPressureDiastolic: bpDiastolic,
    pulseRate: pulse,
    oxygenSaturation: spo2,
    respiratoryRate: respRate,
    bloodGlucose: bloodSugar,
    painScore,
  });

  const handleApplyNormalAdult = () => {
    setTemp(36.8);
    setBpSystolic(120);
    setBpDiastolic(80);
    setPulse(72);
    setSpo2(98);
    setRespRate(16);
    setPainScore(0);
  };

  const handleApplyPediatricNormal = () => {
    setTemp(37.0);
    setBpSystolic(100);
    setBpDiastolic(65);
    setPulse(96);
    setSpo2(99);
    setRespRate(22);
    setPainScore(0);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();

    const newVitals: VitalSigns = {
      temperature: Number(temp),
      bloodPressureSystolic: Number(bpSystolic),
      bloodPressureDiastolic: Number(bpDiastolic),
      pulseRate: Number(pulse),
      respiratoryRate: Number(respRate),
      oxygenSaturation: Number(spo2),
      weight: Number(weight),
      height: Number(height),
      bmi: bmiCalc?.bmi,
      bmiCategory: bmiCalc?.category,
      bloodGlucose: Number(bloodSugar),
      painScore: Number(painScore),
      triageLevel: triageCalc.level,
      triageCategory: triageCalc.category,
      triageColor: triageCalc.dotColor,
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser.name,
    };

    const triageRecord: NursingRecord = {
      id: `nur_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      actionType: 'vital_check',
      description: `Triage Completed [${triageCalc.category}]: BP ${bpSystolic}/${bpDiastolic} mmHg, Temp ${temp}°C, HR ${pulse} bpm, SpO2 ${spo2}%, Glucose ${bloodSugar} mg/dL, BMI ${bmiCalc?.bmi} (${bmiCalc?.category}). Reasons: ${triageCalc.reasons.join(', ')}.`,
      administeredBy: currentUser.name,
    };

    onUpdateDb((prev) => ({
      ...prev,
      visits: prev.visits.map((v) =>
        v.id === visit.id
          ? {
              ...v,
              vitals: newVitals,
              status: v.status === 'registered' ? 'waiting_doctor' : v.status,
              version: (v.version || 1) + 1,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : v
      ),
      nursingRecords: [triageRecord, ...prev.nursingRecords],
    }));

    broadcast(
      'NURSE_TRIAGE_ALERT',
      'Nurse Station',
      `Triage ${triageCalc.category}: ${visit.patientName}`,
      `Nurse ${currentUser.name} recorded vitals for ${visit.patientName} (BP: ${bpSystolic}/${bpDiastolic}, Glucose: ${bloodSugar} mg/dL, BMI: ${bmiCalc?.bmi}). Transmitted to Doctor.`
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Tab Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              OPD Vital Signs & Biometric Intake
            </h3>
            <p className="text-xs text-slate-500">
              Emergency Severity Index (ESI) automated score, BMI calculator, and physiological metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleApplyNormalAdult}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Adult Normal Preset</span>
          </button>
          <button
            type="button"
            onClick={handleApplyPediatricNormal}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Pediatric Preset</span>
          </button>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Calculation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Real-time BMI */}
        <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-purple-900">Real-Time BMI Calculator:</span>
            {bmiCalc && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bmiCalc.badgeClass}`}>
                {bmiCalc.category}
              </span>
            )}
          </div>
          <div className="text-lg font-black text-purple-950 font-mono">
            {bmiCalc ? `${bmiCalc.bmi} kg/m²` : '—'}
          </div>
          <p className="text-[11px] text-slate-600">
            {bmiCalc ? bmiCalc.description : 'Enter height and weight to calculate BMI.'}
          </p>
        </div>

        {/* ESI Triage */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-900">Emergency Severity Index (ESI):</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${triageCalc.badgeClass}`}>
              {triageCalc.category}
            </span>
          </div>
          <div className="text-[11px] text-slate-700">
            <strong>Triage Rationale: </strong>
            {triageCalc.reasons.length > 0 ? triageCalc.reasons.join(', ') : 'All parameters within normal clinical ranges.'}
          </div>
        </div>
      </div>

      {/* Vitals Form */}
      <form onSubmit={handleSaveVitals} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Temp (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Systolic BP (mmHg)
            </label>
            <input
              type="number"
              value={bpSystolic}
              onChange={(e) => setBpSystolic(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Diastolic BP (mmHg)
            </label>
            <input
              type="number"
              value={bpDiastolic}
              onChange={(e) => setBpDiastolic(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Pulse Rate (bpm)
            </label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              SpO2 Oxygen (%)
            </label>
            <input
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Resp Rate (/min)
            </label>
            <input
              type="number"
              value={respRate}
              onChange={(e) => setRespRate(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Blood Sugar (mg/dL)
            </label>
            <input
              type="number"
              value={bloodSugar}
              onChange={(e) => setBloodSugar(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Pain Score (0 - 10)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="10"
                value={painScore}
                onChange={(e) => setPainScore(parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
              <span className="font-bold text-slate-800 w-5">{painScore}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {visit.vitals?.recordedAt && (
              <span>Last recorded: {formatDateTime(visit.vitals.recordedAt)} by {visit.vitals.recordedBy}</span>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Vitals & Transmit to Doctor OPD
          </button>
        </div>
      </form>
    </div>
  );
};
