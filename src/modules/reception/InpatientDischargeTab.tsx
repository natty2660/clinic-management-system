import React, { useState } from 'react';
import {
  DoorOpen,
  Search,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  ShieldCheck,
  BedDouble,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DatabaseState, InpatientAdmission, Bed, User as ClinicUser } from '../../types/clinic';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientDischargeTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  preselectedAdmissionId?: string;
}

export const InpatientDischargeTab: React.FC<InpatientDischargeTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  preselectedAdmissionId,
}) => {
  const admissions = db.admissions || [];
  const beds = db.beds || [];

  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>(
    preselectedAdmissionId || (admissions.find((a) => a.status === 'admitted')?.id || '')
  );

  // Clearance checklist
  const [chkDoctorOrder, setChkDoctorOrder] = useState(true);
  const [chkNursingCare, setChkNursingCare] = useState(true);
  const [chkFinancialClear, setChkFinancialClear] = useState(true);
  const [chkCannulaRemoved, setChkCannulaRemoved] = useState(true);
  const [dischargeCondition, setDischargeCondition] = useState<InpatientAdmission['dischargeCondition']>('improved_stable');
  const [dischargeNotes, setDischargeNotes] = useState('Patient recovered satisfactorily. Home oral medications explained.');
  const [justClearedAdmission, setJustClearedAdmission] = useState<InpatientAdmission | null>(null);

  const selectedAdm = admissions.find((a) => a.id === selectedAdmissionId);

  // Issue Gate Pass & Release Bed
  const handleIssueGatePassAndReleaseBed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdm) return;

    const gatePassNum = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dischargeDate = now.toISOString().split('T')[0];
    const dischargeTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const updatedAdmission: InpatientAdmission = {
      ...selectedAdm,
      status: 'discharged',
      dischargeDate,
      dischargeTime,
      dischargeSummaryNotes: dischargeNotes,
      dischargeCondition,
      gatePassIssued: true,
      gatePassNumber: gatePassNum,
      updatedAt: now.toISOString(),
    };

    onUpdateDb((prev) => {
      // Release bed back to cleaning status
      const updatedBeds = (prev.beds || []).map((b) =>
        b.id === selectedAdm.bedId
          ? {
              ...b,
              status: 'cleaning' as const,
              currentAdmissionId: undefined,
              currentPatientName: undefined,
              currentPatientMrn: undefined,
            }
          : b
      );

      const updatedAdmissions = (prev.admissions || []).map((a) =>
        a.id === selectedAdm.id ? updatedAdmission : a
      );

      return {
        ...prev,
        admissions: updatedAdmissions,
        beds: updatedBeds,
      };
    });

    broadcast(
      'GATE_PASS_ISSUED',
      'Reception PC',
      'Discharge Clearance & Gate Pass Issued',
      `${selectedAdm.patientName} officially cleared for discharge (${gatePassNum}). Bed ${selectedAdm.bedNumber} marked for terminal cleaning.`
    );

    setJustClearedAdmission(updatedAdmission);

    // Auto-prompt gate pass print
    onPrint({
      type: 'inpatient_gate_pass',
      data: updatedAdmission,
      settings: db.settings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Success Banner if just issued */}
      {justClearedAdmission && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded">
                  PASS #{justClearedAdmission.gatePassNumber}
                </span>
                <h4 className="font-black text-slate-900 text-sm">
                  {justClearedAdmission.patientName} Officially Cleared!
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Bed <strong className="font-mono text-slate-900">{justClearedAdmission.bedNumber}</strong> has been released
                and flagged for terminal sanitization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onPrint({
                  type: 'inpatient_gate_pass',
                  data: justClearedAdmission,
                  settings: db.settings,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Re-print Gate Pass</span>
            </button>
            <button
              type="button"
              onClick={() => setJustClearedAdmission(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Discharge Clearance Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-indigo-600" />
            <span>Inpatient Discharge Clearance & Security Gate Pass Desk</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perform clinical and financial clearance verification before patient exits hospital premises. Automatically frees bed for housekeeping.
          </p>
        </div>

        {/* Patient Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Select Admitted Patient Ready for Discharge Clearance *
          </label>
          <select
            value={selectedAdmissionId}
            onChange={(e) => setSelectedAdmissionId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-slate-900"
          >
            <option value="">-- Choose Admitted Patient --</option>
            {admissions.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.patientName} ({adm.admissionNumber}) • {adm.wardName} ({adm.bedNumber}) • Admitted{' '}
                {formatDateOnly(adm.admissionDate)} - {adm.status.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {selectedAdm && (
          <form onSubmit={handleIssueGatePassAndReleaseBed} className="space-y-5 pt-2">
            {/* Patient Summary Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient MRN</span>
                <span className="font-mono font-bold text-slate-800">{selectedAdm.patientMrn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ward & Bed</span>
                <span className="font-bold text-indigo-900">
                  {selectedAdm.wardName} ({selectedAdm.bedNumber})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Length of Stay</span>
                <span className="font-bold text-slate-800">{selectedAdm.lengthOfStayDays || 1} day(s)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Attending Consultant</span>
                <span className="font-semibold text-slate-800">{selectedAdm.admittingDoctorName}</span>
              </div>
            </div>

            {/* Clearance Checklist */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                Mandatory Clearance Checklist & Gate Requirements
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={chkDoctorOrder}
                    onChange={(e) => setChkDoctorOrder(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">1. Doctor Discharge Order Signed</span>
                    <span className="text-[11px] text-slate-500">
                      Attending physician documented formal discharge summary and home care plan.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={chkNursingCare}
                    onChange={(e) => setChkNursingCare(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">2. Ward Nurse Clearance Complete</span>
                    <span className="text-[11px] text-slate-500">
                      Home medications dispensed, wound dressings updated, and warning signs explained.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={chkFinancialClear}
                    onChange={(e) => setChkFinancialClear(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">3. 100% Financial Settlement Verified</span>
                    <span className="text-[11px] text-slate-500">
                      Zero outstanding balance due. Deposits reconciled with pharmacy and ward fees.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={chkCannulaRemoved}
                    onChange={(e) => setChkCannulaRemoved(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">4. Invasive Lines & Cannulas Removed</span>
                    <span className="text-[11px] text-slate-500">
                      IV cannula and catheter safely removed and site inspected prior to exit.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Disposition & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discharge Condition</label>
                <select
                  value={dischargeCondition}
                  onChange={(e) => setDischargeCondition(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-emerald-800"
                >
                  <option value="improved_stable">Improved & Stable (Routine Home)</option>
                  <option value="cured">Complete Clinical Cure</option>
                  <option value="referred">Referred to Tertiary Hospital</option>
                  <option value="against_medical_advice">Left Against Medical Advice (LAMA)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Gate Clearance Remarks</label>
                <input
                  type="text"
                  value={dischargeNotes}
                  onChange={(e) => setDischargeNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Actions Submit */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Issuing Gate Pass releases Bed {selectedAdm.bedNumber} and prints verified exit certificate.</span>
              </div>

              <button
                type="submit"
                disabled={!chkDoctorOrder || !chkNursingCare || !chkFinancialClear || !chkCannulaRemoved}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md hover:shadow-lg"
              >
                <FileCheck className="w-4 h-4" />
                <span>Issue Gate Pass & Release Bed</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
