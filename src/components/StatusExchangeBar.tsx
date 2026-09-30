import React from 'react';
import {
  Receipt,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  Pill,
  Shield,
  Activity,
  ArrowRight,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  ScanLine,
  Microscope,
} from 'lucide-react';
import { DatabaseState, Role } from '../types/clinic';
import { formatCurrency, getBatchExpiryStatus } from '../utils/formatters';

interface StatusExchangeBarProps {
  db: DatabaseState;
  currentRole: Role;
  onSwitchWorkstation: (role: Role) => void;
  onOpenRoadmap: () => void;
  onOpenChaosLab?: () => void;
  isPhase1Active?: boolean;
  onTogglePhase1Guide?: () => void;
  isPhase2Active?: boolean;
  onTogglePhase2Guide?: () => void;
  isPhase3Active?: boolean;
  onTogglePhase3Guide?: () => void;
}

export const StatusExchangeBar: React.FC<StatusExchangeBarProps> = ({
  db,
  currentRole,
  onSwitchWorkstation,
  onOpenRoadmap,
  onOpenChaosLab,
  isPhase1Active,
  onTogglePhase1Guide,
  isPhase2Active,
  onTogglePhase2Guide,
  isPhase3Active,
  onTogglePhase3Guide,
}) => {
  // Cashier metrics
  const unpaidChargesCount = db.charges.filter((c) => c.paymentStatus === 'pending').length;
  const todayTotalCollected = db.payments.reduce((acc, p) => acc + p.amount, 0);

  // Doctor metrics
  const waitingDoctorCount = db.visits.filter(
    (v) => (v.consultationPaid || v.emergencyOverridden) && v.status === 'waiting_doctor'
  ).length;
  const inConsultCount = db.visits.filter((v) => v.status === 'in_consultation').length;

  // Nurse metrics
  const waitingNurseCount = db.visits.filter(
    (v) => !v.vitals || Object.keys(v.vitals).length <= 2
  ).length;

  // Lab metrics
  const labBlockedUnpaid = db.labOrders.filter(
    (o) => o.paymentStatus === 'pending' && !o.overridden
  ).length;
  const labReadyForSample = db.labOrders.filter(
    (o) => (o.paymentStatus === 'paid' || o.overridden) && (o.status === 'paid' || o.status === 'ordered')
  ).length;
  const labInProgress = db.labOrders.filter(
    (o) => o.status === 'sample_taken' || o.status === 'in_progress'
  ).length;

  // Pharmacy metrics
  const rxBlockedUnpaid = db.prescriptions.filter(
    (p) => p.paymentStatus === 'pending' && !p.overridden
  ).length;
  const rxReadyToDispense = db.prescriptions.filter(
    (p) => (p.paymentStatus === 'paid' || p.overridden) && p.status !== 'dispensed' && p.status !== 'cancelled'
  ).length;
  
  // Stock alert count
  let expiringOrLowStockCount = 0;
  db.medicines.forEach((med) => {
    const totalQty = med.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalQty <= med.reorderLevel) expiringOrLowStockCount++;
    med.batches.forEach((b) => {
      const exp = getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays);
      if (exp.status === 'expired' || exp.status === 'expiring_soon') {
        expiringOrLowStockCount++;
      }
    });
  });

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-slate-300 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Status Exchange HUD Cards */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto py-0.5 scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-400 uppercase tracking-wider shrink-0 pr-1">
            <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="hidden sm:inline">LAN Status Exchange:</span>
          </div>

          {/* Cashier pill */}
          <button
            onClick={() => onSwitchWorkstation('cashier')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'cashier'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Receipt className="w-3 h-3 text-emerald-400" />
            <span>Cashier:</span>
            <span className="font-bold text-white">{formatCurrency(todayTotalCollected, db.settings.currency)}</span>
            {unpaidChargesCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 px-1 rounded text-[10px]">
                {unpaidChargesCount} pending
              </span>
            )}
          </button>

          {/* Doctor pill */}
          <button
            onClick={() => onSwitchWorkstation('doctor')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'doctor'
                ? 'bg-blue-950/70 border-blue-500/60 text-blue-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Stethoscope className="w-3 h-3 text-blue-400" />
            <span>Doctor OPD:</span>
            <span className="font-bold text-white">{waitingDoctorCount} in queue</span>
            {inConsultCount > 0 && (
              <span className="bg-blue-500/20 text-blue-300 px-1 rounded text-[10px]">
                {inConsultCount} in consult
              </span>
            )}
          </button>

          {/* Nurse pill */}
          <button
            onClick={() => onSwitchWorkstation('nurse')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'nurse'
                ? 'bg-purple-950/70 border-purple-500/60 text-purple-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <HeartPulse className="w-3 h-3 text-purple-400" />
            <span>Nurse:</span>
            <span className="font-bold text-white">{waitingNurseCount} triage</span>
          </button>

          {/* Lab pill */}
          <button
            onClick={() => onSwitchWorkstation('laboratory')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'laboratory'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <FlaskConical className="w-3 h-3 text-amber-400" />
            <span>Lab:</span>
            <span className="font-bold text-white">{labReadyForSample + labInProgress} active</span>
            {labBlockedUnpaid > 0 && (
              <span className="bg-red-500/20 text-red-300 px-1 rounded text-[10px] flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5 inline" /> {labBlockedUnpaid} unpaid
              </span>
            )}
          </button>

          {/* Pharmacy pill */}
          <button
            onClick={() => onSwitchWorkstation('pharmacy')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'pharmacy'
                ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Pill className="w-3 h-3 text-cyan-400" />
            <span>Pharmacy:</span>
            <span className="font-bold text-white">{rxReadyToDispense} ready</span>
            {rxBlockedUnpaid > 0 && (
              <span className="bg-red-500/20 text-red-300 px-1 rounded text-[10px] flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5 inline" /> {rxBlockedUnpaid} unpaid
              </span>
            )}
          </button>

          {/* Ultrasound pill */}
          <button
            onClick={() => onSwitchWorkstation('ultrasound')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'ultrasound'
                ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Radio className="w-3 h-3 text-indigo-400" />
            <span>Ultrasound:</span>
            <span className="font-bold text-white">
              {(db.ultrasoundOrders || []).filter((o) => o.status !== 'completed').length} active
            </span>
          </button>

          {/* X-Ray pill */}
          <button
            onClick={() => onSwitchWorkstation('xray')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'xray'
                ? 'bg-sky-950/70 border-sky-500/60 text-sky-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <ScanLine className="w-3 h-3 text-sky-400" />
            <span>X-Ray:</span>
            <span className="font-bold text-white">
              {(db.xrayOrders || []).filter((o) => o.status !== 'completed').length} pending
            </span>
          </button>

          {/* Pathology pill */}
          <button
            onClick={() => onSwitchWorkstation('pathology')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition shrink-0 ${
              currentRole === 'pathology'
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            <Microscope className="w-3 h-3 text-pink-400" />
            <span>Pathology:</span>
            <span className="font-bold text-white">
              {(db.pathologyOrders || []).filter((o) => o.status !== 'completed').length} queue
            </span>
          </button>
        </div>

        {/* Blueprint & Architecture Modal Launcher */}
        <div className="shrink-0 flex items-center gap-2">
          {onTogglePhase1Guide && (
            <button
              onClick={onTogglePhase1Guide}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm ${
                isPhase1Active
                  ? 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                  : 'bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isPhase1Active ? 'Phase 1 Active' : 'Start Phase 1'}</span>
            </button>
          )}

          {onTogglePhase2Guide && (
            <button
              onClick={onTogglePhase2Guide}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm ${
                isPhase2Active
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>{isPhase2Active ? 'Phase 2 Active' : 'Start Phase 2'}</span>
            </button>
          )}

          {onTogglePhase3Guide && (
            <button
              onClick={onTogglePhase3Guide}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm ${
                isPhase3Active
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>{isPhase3Active ? 'Phase 3 Active' : 'Start Phase 3'}</span>
            </button>
          )}

          {onOpenChaosLab && (
            <button
              onClick={onOpenChaosLab}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-lg text-[11px] font-bold transition shadow-sm animate-pulse"
              title="Interactive Multi-Desktop Concurrency & 409 Conflict Test Lab"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Concurrency Chaos Lab</span>
            </button>
          )}

          <button
            onClick={onOpenRoadmap}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-lg text-[11px] font-bold transition shadow-sm"
          >
            <span>SPEED System Blueprint</span>
            <ArrowRight className="w-3 h-3 text-teal-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
