import React, { useState } from 'react';
import {
  BedDouble,
  Building2,
  PackageCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  PlusCircle,
  AlertTriangle,
  User,
  Activity,
  Droplets,
  Syringe,
  Boxes,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  DatabaseState,
  User as ClinicUser,
  InpatientAdmission,
  Medicine,
  StockMovement,
  Ward,
  Bed,
} from '../../types/clinic';
import { formatCurrency, formatDateTime, getBatchExpiryStatus } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientDispensingTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onJumpToClinicalReview?: (patientId: string, visitId?: string) => void;
}

export const InpatientDispensingTab: React.FC<InpatientDispensingTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  onJumpToClinicalReview,
}) => {
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>(
    db.admissions?.[0]?.id || ''
  );

  // Ward requisition dispensing state
  const [selectedMedId, setSelectedMedId] = useState<string>(db.medicines[0]?.id || '');
  const [reqQuantity, setReqQuantity] = useState<number>(5);
  const [targetWard, setTargetWard] = useState<string>(db.wards?.[0]?.name || 'Male Medical Ward');
  const [nurseReceiver, setNurseReceiver] = useState<string>('Nurse Bethlehem K.');

  const activeAdmissions = (db.admissions || []).filter((adm) => adm.status === 'admitted');

  const filteredAdmissions = activeAdmissions.filter((adm) => {
    if (selectedWardId !== 'all' && adm.wardId !== selectedWardId) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        adm.patientName.toLowerCase().includes(term) ||
        adm.patientMrn.toLowerCase().includes(term) ||
        adm.admissionNumber.toLowerCase().includes(term) ||
        adm.bedNumber.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const selectedAdmission = (db.admissions || []).find((a) => a.id === selectedAdmissionId) || filteredAdmissions[0];

  // Prescriptions associated with this inpatient visit
  const inpatientPrescriptions = selectedAdmission
    ? db.prescriptions.filter((p) => p.visitId === selectedAdmission.visitId || p.patientId === selectedAdmission.patientId)
    : [];

  // Consumables and nursing orders
  const inpatientConsumptions = selectedAdmission
    ? (db.patientConsumptions || []).filter((c) => c.visitId === selectedAdmission.visitId)
    : [];

  // Handle Ward Requisition Dispense
  const handleDispenseWardRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const med = db.medicines.find((m) => m.id === selectedMedId);
    if (!med) return;

    if (reqQuantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    // Find available batch
    let remainingToDeduct = reqQuantity;
    const batchUpdates: { batchId: string; delta: number; newQty: number }[] = [];

    for (const batch of med.batches) {
      if (batch.quantity > 0) {
        const deduct = Math.min(batch.quantity, remainingToDeduct);
        batchUpdates.push({
          batchId: batch.id,
          delta: deduct,
          newQty: batch.quantity - deduct,
        });
        remainingToDeduct -= deduct;
        if (remainingToDeduct <= 0) break;
      }
    }

    if (remainingToDeduct > 0) {
      alert(`Insufficient stock. Only ${reqQuantity - remainingToDeduct} units available.`);
      return;
    }

    const movements: StockMovement[] = [];
    const grnRef = `WARD-REQ-${Date.now().toString().slice(-4)}`;

    onUpdateDb((prev) => {
      const updatedMedicines = prev.medicines.map((m) => {
        if (m.id !== med.id) return m;

        const updatedBatches = m.batches.map((b) => {
          const update = batchUpdates.find((u) => u.batchId === b.id);
          if (update) {
            movements.push({
              id: `sm_${Date.now()}_${b.id}`,
              timestamp: new Date().toISOString(),
              medicineId: m.id,
              medicineName: m.name,
              batchNumber: b.batchNumber,
              changeType: 'dispensed',
              quantityDelta: -update.delta,
              remainingQuantity: update.newQty,
              referenceNumber: grnRef,
              operator: currentUser.name,
              notes: `Ward Stock Issue to ${targetWard} (Received by ${nurseReceiver})`,
            });
            return { ...b, quantity: update.newQty };
          }
          return b;
        });

        return { ...m, batches: updatedBatches };
      });

      return {
        ...prev,
        medicines: updatedMedicines,
        stockMovements: [...movements, ...prev.stockMovements],
      };
    });

    broadcast(
      'MEDICINE_DISPENSED',
      'Pharmacy PC',
      'Ward Floor Stock Replenished',
      `${reqQuantity}x ${med.name} issued to ${targetWard} by Pharmacist ${currentUser.name}.`
    );

    alert(`Ward Requisition ${grnRef} fulfilled successfully!\n${reqQuantity} units of ${med.name} issued to ${targetWard}.`);
    setReqQuantity(5);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Ward Filter:
          </span>
          <button
            onClick={() => setSelectedWardId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedWardId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Wards ({activeAdmissions.length})
          </button>
          {(db.wards || []).map((w) => {
            const count = activeAdmissions.filter((a) => a.wardId === w.id).length;
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWardId(w.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedWardId === w.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{w.name}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admitted patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Admitted Patients Worklist (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-indigo-600" />
            <span>Active Inpatients Roster</span>
          </div>

          <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredAdmissions.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                No active admitted inpatients in selected ward.
              </div>
            ) : (
              filteredAdmissions.map((adm) => {
                const isSelected = adm.id === selectedAdmission?.id;
                return (
                  <div
                    key={adm.id}
                    onClick={() => setSelectedAdmissionId(adm.id)}
                    className={`bg-white rounded-xl p-3.5 border cursor-pointer transition ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {adm.admissionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">• {adm.patientMrn}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{adm.patientName}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {adm.bedNumber}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-2 flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">{adm.wardName}</span>
                      <span className="text-[10px] font-semibold text-slate-600">
                        Dr: {adm.admittingDoctorName}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Admitted: {adm.admissionDate}</span>
                      <span className="capitalize font-bold text-indigo-700">{adm.admissionType}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Inpatient Patient Details & Rx Fulfillment (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAdmission ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedAdmission.patientName}
                    </h3>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono text-xs font-bold">
                      {selectedAdmission.bedNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedAdmission.wardName} · MRN: {selectedAdmission.patientMrn} · Dx: {selectedAdmission.provisionalDiagnosis}
                  </div>
                </div>

                {onJumpToClinicalReview && selectedAdmission.patientId && (
                  <button
                    onClick={() => onJumpToClinicalReview(selectedAdmission.patientId, selectedAdmission.visitId)}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-purple-200 transition"
                  >
                    <span>View Chart</span>
                  </button>
                )}
              </div>

              {/* Inpatient Prescriptions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-cyan-600" />
                  <span>Inpatient Medication Orders ({inpatientPrescriptions.length})</span>
                </h4>

                {inpatientPrescriptions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No active drug orders linked to this admission.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {inpatientPrescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-slate-800">{rx.prescriptionNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rx.status === 'dispensed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rx.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {rx.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-[11px]">
                              <span>• {it.medicineName} ({it.dosage} - {it.frequency})</span>
                              <span className="font-mono font-semibold">Qty: {it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inpatient Consumed Supplies */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-teal-600" />
                  <span>Ward Consumables & IV Fluids Log ({inpatientConsumptions.length})</span>
                </h4>

                {inpatientConsumptions.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No consumables billed yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {inpatientConsumptions.map((con) => (
                      <div
                        key={con.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{con.itemName}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{con.category}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-slate-900">x{con.quantity}</div>
                          <div className="text-[10px] text-slate-500">
                            {formatCurrency(con.totalPrice, db.settings.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an admitted inpatient to inspect medication orders.
            </div>
          )}
        </div>

        {/* Ward Floor Stock Requisition Dispatch (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Boxes className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Ward Stock Issue</h3>
                <p className="text-[11px] text-slate-500">Replenish ward floor emergency tray</p>
              </div>
            </div>

            <form onSubmit={handleDispenseWardRequisition} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Destination Ward:
                </label>
                <select
                  value={targetWard}
                  onChange={(e) => setTargetWard(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {(db.wards || []).map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.floor})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Medicine / Fluid:
                </label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {db.medicines.map((m) => {
                    const totalQty = m.batches.reduce((sum, b) => sum + b.quantity, 0);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.dosageForm}) - Stock: {totalQty}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Quantity Units:
                </label>
                <input
                  type="number"
                  min="1"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Receiving Ward Nurse:
                </label>
                <input
                  type="text"
                  value={nurseReceiver}
                  onChange={(e) => setNurseReceiver(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  placeholder="Nurse Name"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Issue Stock to Ward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
