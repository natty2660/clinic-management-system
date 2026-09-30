import React, { useState } from 'react';
import {
  Activity,
  Syringe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  HeartPulse,
  Send,
  UserCheck,
  Shield,
  FileCheck,
  Zap,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, DoctorOrder, User as AppUser, NursingRecord } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface InvestigationNursingTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const InvestigationNursingTab: React.FC<InvestigationNursingTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const [customOrderText, setCustomOrderText] = useState('');
  const [orderType, setOrderType] = useState<'stat' | 'routine' | 'standing' | 'prn'>('stat');
  const [targetCategory, setTargetCategory] = useState<'injection' | 'iv_fluid' | 'vital_check' | 'wound_care' | 'procedure'>('injection');

  // Existing nursing records for this visit
  const visitNursingRecords = db.nursingRecords
    .filter((n) => n.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Doctor orders for this visit
  const visitDoctorOrders = (db.doctorOrders || [])
    .filter((o) => o.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  // 1-Click Fast Presets for Doctor Orders to Nurse Station
  const statPresets = [
    { text: 'Normal Saline 0.9% 500ml IV Infusion STAT over 1 hour', type: 'stat' as const },
    { text: 'Paracetamol (Acetaminophen) 1g IV Infusion STAT', type: 'stat' as const },
    { text: 'Salbutamol 2.5mg + Ipratropium 500mcg Nebulization STAT', type: 'stat' as const },
    { text: 'Check Random Blood Glucose (RBS) STAT & record on chart', type: 'stat' as const },
    { text: 'Wound Dressing: Clean with Saline, Betadine antiseptic & apply sterile gauze', type: 'routine' as const },
    { text: 'Administer Tetanus Toxoid 0.5ml IM STAT into deltoid', type: 'stat' as const },
    { text: 'Start Oxygen 4 L/min via nasal prongs; monitor SpO2 q15m', type: 'stat' as const },
    { text: 'Insert 16 Fr Foley catheter to gravity drainage, measure initial output', type: 'stat' as const },
  ];

  const handleIssueOrder = (description: string, priority: 'stat' | 'routine' | 'standing' | 'prn') => {
    if (!description.trim()) return;

    const newOrder: DoctorOrder = {
      id: `ord_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      orderDate: new Date().toISOString(),
      orderedByDoctor: currentUser.name,
      orderDescription: description.trim(),
      orderType: priority,
      status: 'active',
    };

    onUpdateDb((prev) => ({
      ...prev,
      doctorOrders: [newOrder, ...(prev.doctorOrders || [])],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      `New Doctor Order [${priority.toUpperCase()}]`,
      `Order issued for ${patient.name} (#${currentVisit.queueNumber}): "${description.slice(0, 45)}..."`,
      newOrder
    );

    setCustomOrderText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Acuity & Triage Intake Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Nurse Station Triage & Bedside Intake
              </h3>
              <p className="text-[11px] text-slate-600">
                Direct clinical handshake between Attending Physician and Inpatient / OPD Nursing desk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-white border border-purple-200 px-3 py-1 rounded-lg font-bold text-purple-900 shadow-xs">
              Nurse Treatments: {visitNursingRecords.length} Given
            </span>
            <span className="bg-white border border-blue-200 px-3 py-1 rounded-lg font-bold text-blue-900 shadow-xs">
              Doctor Orders: {visitDoctorOrders.length} Issued
            </span>
          </div>
        </div>

        {/* Detailed vitals if available */}
        {currentVisit.vitals && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-purple-200/70 text-xs">
            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">Blood Pressure</span>
              <strong className="text-slate-900 font-mono text-sm">
                {currentVisit.vitals.bloodPressureSystolic}/{currentVisit.vitals.bloodPressureDiastolic}
              </strong>
              <span className="text-[10px] text-slate-400 block">mmHg</span>
            </div>

            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">Heart / Pulse Rate</span>
              <strong className="text-slate-900 font-mono text-sm">{currentVisit.vitals.pulseRate}</strong>
              <span className="text-[10px] text-slate-400 block">bpm</span>
            </div>

            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">Temperature</span>
              <strong className={`font-mono text-sm ${currentVisit.vitals.temperature && currentVisit.vitals.temperature > 37.5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {currentVisit.vitals.temperature || '--'}°C
              </strong>
              <span className="text-[10px] text-slate-400 block">{currentVisit.vitals.temperature && currentVisit.vitals.temperature > 37.5 ? 'Febrile' : 'Normothermic'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">SpO2 (Oxygen)</span>
              <strong className="text-slate-900 font-mono text-sm">{currentVisit.vitals.oxygenSaturation}%</strong>
              <span className="text-[10px] text-slate-400 block">Room air</span>
            </div>

            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">Body Mass Index</span>
              <strong className="text-slate-900 font-mono text-sm">{currentVisit.vitals.bmi || '23.4'}</strong>
              <span className="text-[10px] text-slate-400 block">{currentVisit.vitals.bmiCategory || 'Normal'}</span>
            </div>

            <div className="bg-white/80 p-2 rounded border border-purple-100">
              <span className="text-[10px] text-slate-500 uppercase block">Blood Glucose</span>
              <strong className="text-slate-900 font-mono text-sm">{currentVisit.vitals.bloodGlucose || '96'}</strong>
              <span className="text-[10px] text-slate-400 block">mg/dL</span>
            </div>
          </div>
        )}
      </div>

      {/* DOCTOR QUICK STAT ORDER ISSUING SUITE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              1-Click STAT / Bedside Nursing Orders Requisition
            </h3>
            <p className="text-[11px] text-slate-500">
              Orders transmitted instantly to Nursing PC. Nurses execute, verify 5-rights, and chart timestamp.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Real-time Sync Active
          </span>
        </div>

        {/* 1-Click Fast Preset Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Common Bedside Interventions (1-Click Issue):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {statPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleIssueOrder(preset.text, preset.type)}
                className="p-2.5 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                    preset.type === 'stat' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {preset.type}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition" />
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-2">{preset.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Order Creator */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold uppercase text-slate-700 sm:w-32"
            >
              <option value="stat">STAT (Immediate)</option>
              <option value="routine">Routine</option>
              <option value="standing">Standing</option>
              <option value="prn">PRN (As Needed)</option>
            </select>

            <input
              type="text"
              placeholder="Type custom doctor order (e.g. Administer Ondansetron 4mg IV STAT, monitor nausea)..."
              value={customOrderText}
              onChange={(e) => setCustomOrderText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleIssueOrder(customOrderText, orderType);
                }
              }}
              className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleIssueOrder(customOrderText, orderType)}
              disabled={!customOrderText.trim()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" /> Dispatch Order
            </button>
          </div>
        </div>
      </div>

      {/* DOCTOR ORDERS TIMELINE & NURSING EXECUTION LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Issued Doctor Orders for this Visit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Doctor Directives & Order Sheet ({visitDoctorOrders.length})
            </h4>
            <span className="text-[10px] text-slate-500">Chronological</span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {visitDoctorOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No physician orders issued for this encounter yet. Use the quick presets above to order.
              </div>
            ) : (
              visitDoctorOrders.map((ord) => {
                const isExecuted = ord.status === 'completed';
                return (
                  <div
                    key={ord.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isExecuted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            ord.orderType === 'stat'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ord.orderType}
                        </span>
                        <span className="font-bold text-slate-900">{ord.orderedByDoctor}</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                          isExecuted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isExecuted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                          </>
                        ) : (
                          'Active / In Progress'
                        )}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium my-1">{ord.orderDescription}</p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-200/50">
                      <span>Ordered {formatDateTime(ord.orderDate)}</span>
                      {isExecuted && ord.executedAt && (
                        <span className="text-emerald-700 font-semibold">
                          Executed by {ord.executedByNurse || 'RN'} at {formatDateTime(ord.executedAt).split(',')[1]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Nursing Treatment MAR Records */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Syringe className="w-3.5 h-3.5 text-teal-600" />
              Nurse Treatments Administered ({visitNursingRecords.length})
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Signed by RN
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {visitNursingRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No nursing treatment administrations charted for this visit yet.
              </div>
            ) : (
              visitNursingRecords.map((nr) => (
                <div
                  key={nr.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-lg border border-slate-200 text-xs transition"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="capitalize text-teal-700">{nr.actionType.replace('_', ' ')}</span>
                      {nr.medicationName && <span>— {nr.medicationName}</span>}
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      {formatDateTime(nr.time)}
                    </span>
                  </div>

                  <p className="text-slate-700">{nr.description}</p>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-200/50">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <UserCheck className="w-3 h-3 text-teal-600" />
                      {nr.administeredBy}
                    </span>
                    {nr.route && (
                      <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200 font-mono font-bold">
                        Route: {nr.route.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
