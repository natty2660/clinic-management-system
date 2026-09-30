import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Receipt,
  Stethoscope,
  FlaskConical,
  Pill,
  HeartPulse,
  Database,
  Wifi,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Role } from '../types/clinic';

interface PhaseRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchWorkstation: (role: Role) => void;
  onStartPhase1Workflow?: () => void;
  onStartPhase2Workflow?: () => void;
  onStartPhase3Workflow?: () => void;
}

export const PhaseRoadmapModal: React.FC<PhaseRoadmapModalProps> = ({
  isOpen,
  onClose,
  onSwitchWorkstation,
  onStartPhase1Workflow,
  onStartPhase2Workflow,
  onStartPhase3Workflow,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3>(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Clinic Connection System – Phased Implementation Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Independent yet linked workstations exchanging real-time status across Cashier, Doctor, Nurse, Lab, Pharmacy & Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Selector Tabs */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedPhase(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPhase === 1
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center text-[10px]">1</span>
            <span>Phase 1: Operational Core & Strict Gates</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
              Live & Verified
            </span>
          </button>

          <button
            onClick={() => setSelectedPhase(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPhase === 2
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center text-[10px]">2</span>
            <span>Phase 2: Clinical Depth & Diagnostic Panels</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
              Live & Verified
            </span>
          </button>

          <button
            onClick={() => setSelectedPhase(3)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedPhase === 3
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center text-[10px]">3</span>
            <span>Phase 3: Financial Audit, Reports & LAN Edge</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
              Live & Verified
            </span>
          </button>
        </div>

        {/* Phase Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs">
          {selectedPhase === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-400" />
                    Phase 1 Goal: Zero Unpaid Services, Real-Time Connectivity & Ticket Generation
                  </h3>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded">
                    Command 1 & Command 3 Compliant
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs mb-3">
                  Establishes a single local clinic server where every department is independent yet continuously connected.
                  No lab test or prescription can ever be processed without cashier payment clearance or manager emergency override.
                </p>
                {onStartPhase1Workflow && (
                  <button
                    onClick={() => {
                      onStartPhase1Workflow();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Phase 1 Guided Workflow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature 1 */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      1. Cashier & Front Desk
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('cashier'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Instant MRN patient registration & returning patient phone/name search</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Tendered vs Change calculator & itemized receipt printing (ESC/POS 80mm)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Patient Entry Card with barcode & QR token for doctor consultation queue</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-400" />
                      2. Doctor OPD Consultation
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('doctor'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Live paid queue showing only patients with cleared consultation fee</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Live vitals badge updated in real-time from nurse station</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Single-click Lab and E-Prescription ordering that pushes immediately to Cashier bill</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-amber-400" />
                      3. Laboratory Gating
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('laboratory'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Strict payment lock: Test cannot be sampled or resulted until Cashier marks paid</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Manager emergency override with authorized PIN and reason logging</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Official certified lab report with reference ranges & abnormal flags</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 4 */}
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Pill className="w-4 h-4 text-cyan-400" />
                      4. Pharmacy FIFO & Expiry
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('pharmacy'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Strict payment lock: Prescriptions blocked until bill is settled</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>3-Tier batch expiry guard: 🟢 Safe, 🟡 Expiring soon, 🔴 Expired (hard blocked)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Real-time inventory deduction & stock ledger movement records</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {selectedPhase === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Phase 2 Goal: Clinical Depth, Diagnostic Panels & Nursing Care
                  </h3>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded">
                    Command 2 & Command 3 Compliant
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs mb-3">
                  Transforms basic inputs into deep clinical diagnostic structures: ICD-10 indexing, multi-system examinations,
                  parameter-level laboratory values with automatic critical alerts, and Medication Administration Records (MAR).
                </p>
                {onStartPhase2Workflow && (
                  <button
                    onClick={() => {
                      onStartPhase2Workflow();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition shadow-md"
                  >
                    <HeartPulse className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Phase 2 Guided Clinical Workflow</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-purple-400" />
                      Nurse Triage & MAR
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('nurse'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Automatic BMI calculator with status tags (Normal, Overweight, etc.)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Medication Administration Record: dose, route (IV, IM, Oral), timestamp & nurse sign</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Observation chart & care procedures (wound dressing, nebulization)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-amber-400" />
                      Diagnostic Profiles & Auto-Alerts
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('laboratory'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Multi-parameter panels (CBC/Hemogram, Fasting Glucose, Lipid profile, Widal, Urinalysis)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Automatic out-of-range flagging: [L] Low, [H] High, and Critical Abnormal alerts</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sample status tracking: Ordered → Paid → Sample Drawn → In Progress → Result Verified</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {selectedPhase === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    Phase 3 Goal: Executive Audit, Shift Close, Reports & LAN Edge
                  </h3>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded">
                    Command 1, 2 & 3 Compliant
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed text-xs mb-3">
                  Enterprise-grade clinic governance: Till balancing reports, daily/monthly/yearly revenue dashboards,
                  immutable audit logging of all sensitive pricing/override actions, and offline buffering with encrypted JSON backup.
                </p>
                {onStartPhase3Workflow && (
                  <button
                    onClick={() => {
                      onStartPhase3Workflow();
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-xs transition shadow-md"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Phase 3 Interactive Workflow</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-300" />
                      Admin Control & Immutable Audit
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('admin'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Tamper-evident Audit Trail: logs operator, timestamp, old value vs new value for price updates & overrides</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Executive financial reports: Daily, Monthly, Yearly revenue split by department</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Staff credentials & role-based access control (RBAC) management</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-teal-400" />
                      Backup & Offline LAN Edge
                    </span>
                    <button
                      onClick={() => { onSwitchWorkstation('admin'); onClose(); }}
                      className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
                    >
                      Open Station <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-slate-300 text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>One-click encrypted JSON database snapshot download for offsite backup</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Simulated LAN disconnect & offline local buffer switch with zero data conflict</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Factory reset sandbox to test new deployment cycles</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>All phases active in current clinic server</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition text-xs"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
