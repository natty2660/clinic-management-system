import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Search,
  PlusCircle,
  Hash,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { DatabaseState, User as ClinicUser, Prescription } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface ControlledDrugsTabProps {
  db: DatabaseState;
  currentUser: ClinicUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const ControlledDrugsTab: React.FC<ControlledDrugsTabProps> = ({
  db,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Controlled drug log form
  const [drugName, setDrugName] = useState('Morphine Sulphate 10mg/ml Injection');
  const [batchNo, setBatchNo] = useState('NAR-2026-004');
  const [qty, setQty] = useState<number>(2);
  const [ptName, setPtName] = useState('Abebe Bikila');
  const [ptMrn, setPtMrn] = useState('MRN-2026-0042');
  const [drName, setDrName] = useState('Dr. Julian Hayes, MD');
  const [witnessName, setWitnessName] = useState('Pharm. Tigist Mengistu');
  const [rxNumber, setRxNumber] = useState('RX-2026-0012');
  const [indication, setIndication] = useState('Severe acute post-operative pain management');

  // Filter audit logs for emergency overrides and pharmacy events
  const overrideAuditLogs = (db.auditLogs || []).filter(
    (log) => log.department === 'Pharmacy' || log.entityType === 'override'
  );

  // Controlled drugs formulary items
  const controlledMedicines = db.medicines.filter((m) => {
    const name = m.name.toLowerCase();
    const cat = m.category.toLowerCase();
    return (
      name.includes('morphine') ||
      name.includes('tramadol') ||
      name.includes('diazepam') ||
      name.includes('pethidine') ||
      name.includes('ketamine') ||
      cat.includes('narcotic') ||
      cat.includes('controlled') ||
      cat.includes('analgesic')
    );
  });

  const handleLogControlledDispense = (e: React.FormEvent) => {
    e.preventDefault();

    const auditEntry = {
      id: `aud_ctrl_${Date.now()}`,
      timestamp: new Date().toISOString(),
      operator: currentUser.name,
      role: currentUser.role,
      department: 'Pharmacy',
      action: `CONTROLLED DRUG DISPENSE: ${qty}x ${drugName} (Batch ${batchNo}) for ${ptName} (${ptMrn}). Verified by Witness: ${witnessName}. Indication: ${indication}`,
      entityType: 'dispense' as const,
      entityId: rxNumber,
      reason: indication,
    };

    onUpdateDb((prev) => ({
      ...prev,
      auditLogs: [auditEntry, ...prev.auditLogs],
    }));

    broadcast(
      'EMERGENCY_OVERRIDE',
      'Pharmacy PC',
      'Controlled Narcotic Drug Dispensed',
      `${qty}x ${drugName} dispensed for ${ptName}. Dual verified by ${currentUser.name} and ${witnessName}.`
    );

    alert(`Controlled Substance Register entry recorded successfully with dual witness verification!`);
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white rounded-2xl p-6 border border-rose-900/50 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Schedule II / III Controlled Drugs
              </span>
              <span className="text-xs text-rose-300 font-semibold">
                Mandatory Dual Witness Signoff
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Narcotics & Dangerous Drugs Dangerous Substances Register
            </h2>
          </div>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Controlled Drug Dispense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controlled Formulary Stock (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Pill className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Controlled Stock in Safe Vault
              </h3>
            </div>

            <div className="space-y-2.5">
              {controlledMedicines.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No designated narcotics in current formulary.
                </div>
              ) : (
                controlledMedicines.map((m) => {
                  const total = m.batches.reduce((sum, b) => sum + b.quantity, 0);
                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-slate-900">{m.name}</span>
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.2 rounded border border-rose-200">
                          {total} units
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.dosageForm} ({m.strength}) · Code: {m.code}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Active Batches: {m.batches.map((b) => b.batchNumber).join(', ')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Audit Log & Overrides History (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Dual-Witness Narcotics & Emergency Override Register
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {overrideAuditLogs.length} events logged
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {overrideAuditLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  No emergency overrides or controlled events logged yet today.
                </div>
              ) : (
                overrideAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2 hover:bg-slate-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                          {log.entityType}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">{log.entityId}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium leading-relaxed">{log.action}</p>

                    {log.reason && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80 text-[11px] text-slate-600">
                        <strong>Clinical Justification / Reason: </strong>
                        {log.reason}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Authorized Operator: <strong>{log.operator}</strong> ({log.role})</span>
                      <span>Department: {log.department}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Record Controlled Dispense Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Controlled Substance Dispensation Entry
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogControlledDispense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Controlled Medicine:
                  </label>
                  <input
                    type="text"
                    required
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Batch / Lot Number:
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Prescription #:
                  </label>
                  <input
                    type="text"
                    required
                    value={rxNumber}
                    onChange={(e) => setRxNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Patient Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Patient MRN:
                  </label>
                  <input
                    type="text"
                    required
                    value={ptMrn}
                    onChange={(e) => setPtMrn(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Prescribing Doctor:
                  </label>
                  <input
                    type="text"
                    required
                    value={drName}
                    onChange={(e) => setDrName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Co-Signing Witness:
                  </label>
                  <input
                    type="text"
                    required
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Clinical Indication:
                </label>
                <input
                  type="text"
                  required
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Confirm & Sign Dual Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
