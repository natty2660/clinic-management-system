import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Lock,
  Printer,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  User,
  Stethoscope,
  Pill,
  Sparkles,
  FileHeart,
  Tag,
  AlertOctagon,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  DatabaseState,
  Prescription,
  User as ClinicUser,
  Medicine,
  StockMovement,
  Patient,
  Visit,
} from '../../types/clinic';
import { formatCurrency, formatDateTime, getBatchExpiryStatus } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface OpdDispensingTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  selectedRxId: string;
  onSelectRxId: (id: string) => void;
  onJumpToClinicalReview?: (patientId: string, visitId?: string) => void;
}

export const OpdDispensingTab: React.FC<OpdDispensingTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
  selectedRxId,
  onSelectRxId,
  onJumpToClinicalReview,
}) => {
  const [rxFilter, setRxFilter] = useState<'all' | 'ready' | 'unpaid' | 'dispensed'>('ready');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<{ [itemId: string]: string }>({});

  const selectedRx = db.prescriptions.find((p) => p.id === selectedRxId) || db.prescriptions[0];
  const selectedPatient = selectedRx ? db.patients.find((p) => p.id === selectedRx.patientId) : null;
  const selectedVisit = selectedRx ? db.visits.find((v) => v.id === selectedRx.visitId) : null;

  // Auto-select first safe FEFO (First-Expired, First-Out) batch for each item
  useEffect(() => {
    if (selectedRx) {
      const initialBatchMap: { [itemId: string]: string } = {};
      selectedRx.items.forEach((item) => {
        const med = db.medicines.find((m) => m.id === item.medicineId);
        if (med && med.batches.length > 0) {
          // Sort batches by earliest expiry date (FEFO) that is NOT expired
          const sortedBatches = [...med.batches].sort(
            (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );

          const nonExpired = sortedBatches.find((b) => {
            const exp = getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays);
            return exp.status !== 'expired' && b.quantity >= item.quantity;
          });

          if (nonExpired) {
            initialBatchMap[item.id] = nonExpired.id;
          } else {
            // Default to first batch if none fully meet criteria
            initialBatchMap[item.id] = sortedBatches[0].id;
          }
        }
      });
      setSelectedBatches(initialBatchMap);
    }
  }, [selectedRx?.id]);

  // Filter queue
  const filteredPrescriptions = db.prescriptions.filter((rx) => {
    const isPaid = rx.paymentStatus === 'paid' || rx.paymentStatus === 'overridden';
    const isDispensed = rx.status === 'dispensed';

    if (rxFilter === 'ready' && (!isPaid || isDispensed)) return false;
    if (rxFilter === 'unpaid' && (isPaid || isDispensed)) return false;
    if (rxFilter === 'dispensed' && !isDispensed) return false;

    if (localSearch.trim()) {
      const term = localSearch.toLowerCase();
      const matchRx = rx.prescriptionNumber.toLowerCase().includes(term);
      const matchPt = rx.patientName.toLowerCase().includes(term);
      const matchMrn = rx.patientMrn.toLowerCase().includes(term);
      return matchRx || matchPt || matchMrn;
    }

    return true;
  });

  // Handle Dispense
  const handleDispensePrescription = (rx: Prescription) => {
    // 1. Strict Payment Check
    if (rx.paymentStatus !== 'paid' && rx.paymentStatus !== 'overridden') {
      alert('Dispensing is blocked: Prescription has not been paid at Cashier.');
      return;
    }

    // 2. Strict Expiry & Stock Check
    for (const item of rx.items) {
      const med = db.medicines.find((m) => m.id === item.medicineId);
      const chosenBatchId = selectedBatches[item.id];
      const batch = med?.batches.find((b) => b.id === chosenBatchId);

      if (!batch) {
        alert(`Please select an inventory batch for ${item.medicineName}.`);
        return;
      }

      const expiry = getBatchExpiryStatus(batch.expiryDate, db.settings.expiryWarningDays);
      if (expiry.status === 'expired') {
        alert(
          `DISPENSING BLOCKED BY SAFETY GATE:\nBatch ${batch.batchNumber} for ${item.medicineName} is EXPIRED (${batch.expiryDate}). Expired medicines cannot be sold or dispensed under clinic regulations.`
        );
        return;
      }

      if (batch.quantity < item.quantity) {
        alert(
          `Insufficient stock in batch ${batch.batchNumber}. Needed: ${item.quantity}, Available: ${batch.quantity}.`
        );
        return;
      }
    }

    // 3. Process Dispensing & Decrement Stock
    const movements: StockMovement[] = [];

    onUpdateDb((prev) => {
      const updatedMedicines = prev.medicines.map((med) => {
        let medModified = false;
        const newBatches = med.batches.map((batch) => {
          const matchingItem = rx.items.find(
            (it) => it.medicineId === med.id && selectedBatches[it.id] === batch.id
          );
          if (matchingItem) {
            medModified = true;
            const newQty = batch.quantity - matchingItem.quantity;

            movements.push({
              id: `sm_${Date.now()}_${batch.id}`,
              timestamp: new Date().toISOString(),
              medicineId: med.id,
              medicineName: med.name,
              batchNumber: batch.batchNumber,
              changeType: 'dispensed',
              quantityDelta: -matchingItem.quantity,
              remainingQuantity: newQty,
              referenceNumber: rx.prescriptionNumber,
              operator: currentUser.name,
              notes: `OPD Dispensed to ${rx.patientName} (${rx.patientMrn})`,
            });

            return { ...batch, quantity: newQty, version: (batch.version || 1) + 1 };
          }
          return batch;
        });

        return medModified ? { ...med, batches: newBatches } : med;
      });

      const updatedPrescriptions = prev.prescriptions.map((p) =>
        p.id === rx.id
          ? {
              ...p,
              status: 'dispensed' as const,
              dispensedAt: new Date().toISOString(),
              dispensedBy: currentUser.name,
              items: p.items.map((it) => ({
                ...it,
                dispensedBatchId: selectedBatches[it.id],
                dispensedQuantity: it.quantity,
              })),
            }
          : p
      );

      return {
        ...prev,
        medicines: updatedMedicines,
        prescriptions: updatedPrescriptions,
        stockMovements: [...movements, ...prev.stockMovements],
      };
    });

    broadcast(
      'MEDICINE_DISPENSED',
      'Pharmacy PC',
      'Prescription Dispensed & Stock Reduced',
      `Rx ${rx.prescriptionNumber} for ${rx.patientName} dispensed by Pharmacist ${currentUser.name}. Stock decremented in real-time.`
    );

    // Auto-prompt print of prescription label
    onPrint({
      type: 'prescription',
      data: {
        ...rx,
        status: 'dispensed',
        dispensedBy: currentUser.name,
        dispensedAt: new Date().toISOString(),
      },
      settings: db.settings,
    });
  };

  // Manager Override
  const triggerPharmacyEmergencyOverride = (rx: Prescription) => {
    onOpenOverride(
      `Emergency Dispensing without payment for Rx ${rx.prescriptionNumber} (${rx.patientName})`,
      (reason, authorizedBy) => {
        onUpdateDb((prev) => ({
          ...prev,
          prescriptions: prev.prescriptions.map((p) =>
            p.id === rx.id
              ? {
                  ...p,
                  paymentStatus: 'overridden' as const,
                  overridden: true,
                  overrideReason: reason,
                }
              : p
          ),
          auditLogs: [
            {
              id: `aud_${Date.now()}`,
              timestamp: new Date().toISOString(),
              operator: authorizedBy,
              role: currentUser.role,
              department: 'Pharmacy',
              action: `Emergency Pharmacy Override: Rx ${rx.prescriptionNumber} (${rx.patientName})`,
              entityType: 'override',
              entityId: rx.id,
              reason,
            },
            ...prev.auditLogs,
          ],
        }));

        broadcast(
          'EMERGENCY_OVERRIDE',
          'Pharmacy PC',
          'Emergency Medication Dispense Approved',
          `Rx ${rx.prescriptionNumber} for ${rx.patientName} unlocked via emergency override by ${authorizedBy}.`
        );
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Worklist Queue (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        {/* Queue Filter Tabs & Search */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3">
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setRxFilter('ready')}
              className={`flex-1 py-1.5 font-bold rounded-md transition text-center ${
                rxFilter === 'ready'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ready ({db.prescriptions.filter((p) => (p.paymentStatus === 'paid' || p.paymentStatus === 'overridden') && p.status !== 'dispensed').length})
            </button>
            <button
              onClick={() => setRxFilter('unpaid')}
              className={`flex-1 py-1.5 font-bold rounded-md transition text-center ${
                rxFilter === 'unpaid'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unpaid ({db.prescriptions.filter((p) => p.paymentStatus !== 'paid' && p.paymentStatus !== 'overridden' && p.status !== 'dispensed').length})
            </button>
            <button
              onClick={() => setRxFilter('dispensed')}
              className={`flex-1 py-1.5 font-bold rounded-md transition text-center ${
                rxFilter === 'dispensed'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Filled ({db.prescriptions.filter((p) => p.status === 'dispensed').length})
            </button>
            <button
              onClick={() => setRxFilter('all')}
              className={`flex-1 py-1.5 font-bold rounded-md transition text-center ${
                rxFilter === 'all'
                  ? 'bg-white text-cyan-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({db.prescriptions.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter queue by Rx #, name, MRN..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Prescription List */}
        <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {filteredPrescriptions.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No prescriptions found matching filter.
            </div>
          ) : (
            filteredPrescriptions.map((rx) => {
              const isSelected = rx.id === selectedRx?.id;
              const isPaid = rx.paymentStatus === 'paid' || rx.paymentStatus === 'overridden';
              const isDispensed = rx.status === 'dispensed';

              return (
                <div
                  key={rx.id}
                  onClick={() => onSelectRxId(rx.id)}
                  className={`bg-white rounded-xl p-3.5 border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-200 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {rx.prescriptionNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">• {rx.patientMrn}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{rx.patientName}</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isPaid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> GATED
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isDispensed ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-2 flex justify-between items-center">
                    <span>{rx.items.length} prescribed drug{rx.items.length > 1 ? 's' : ''}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(rx.totalPrice, db.settings.currency)}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-cyan-600" /> {rx.orderedByDoctor}
                    </span>
                    <span>{formatDateTime(rx.prescribedAt).split(',')[1]}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Dispensing Station (7 Cols) */}
      <div className="lg:col-span-7">
        {selectedRx ? (
          (() => {
            const isPaid = selectedRx.paymentStatus === 'paid' || selectedRx.paymentStatus === 'overridden';
            const isDispensed = selectedRx.status === 'dispensed';

            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        OPD Dispense Station
                      </h3>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        {selectedRx.prescriptionNumber}
                      </span>
                      {selectedRx.overridden && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800">
                          Emergency Override
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>
                        Patient: <strong className="text-slate-900">{selectedRx.patientName}</strong> ({selectedRx.patientMrn})
                      </span>
                      {selectedPatient && (
                        <span>• {selectedPatient.gender}, {selectedPatient.age} yrs</span>
                      )}
                      <span>• Prescribed by {selectedRx.orderedByDoctor}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onJumpToClinicalReview && selectedRx.patientId && (
                      <button
                        onClick={() => onJumpToClinicalReview(selectedRx.patientId, selectedRx.visitId)}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-200 transition"
                        title="Review patient clinical history, vitals, and lab test results"
                      >
                        <FileHeart className="w-3.5 h-3.5" />
                        <span>Clinical Chart</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        onPrint({
                          type: 'prescription',
                          data: selectedRx,
                          settings: db.settings,
                        })
                      }
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                  </div>
                </div>

                {/* Patient Safety & Allergy Banner */}
                {selectedPatient?.allergies && selectedPatient.allergies.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold">Patient Allergies Recorded: </span>
                      {selectedPatient.allergies.join(', ')}
                    </div>
                  </div>
                )}

                {/* Strict Payment Gate */}
                {!isPaid ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-amber-900">
                      Dispensary Gated: Unpaid Prescription
                    </h4>
                    <p className="text-xs text-amber-700 max-w-md mx-auto">
                      Dispensing is locked until patient completes payment of{' '}
                      <strong>{formatCurrency(selectedRx.totalPrice, db.settings.currency)}</strong> at the Reception / Cashier station.
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => triggerPharmacyEmergencyOverride(selectedRx)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" /> Manager Emergency Dispense Override
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-cyan-600" />
                        <span>Prescribed Items & FEFO Batch Allocation</span>
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Payment Cleared
                      </span>
                    </div>

                    {/* Prescribed Drug Items */}
                    <div className="space-y-3">
                      {selectedRx.items.map((item, idx) => {
                        const med = db.medicines.find((m) => m.id === item.medicineId);
                        const selectedBatchId = selectedBatches[item.id];
                        const currentBatch = med?.batches.find((b) => b.id === selectedBatchId);
                        const expiryInfo = currentBatch
                          ? getBatchExpiryStatus(currentBatch.expiryDate, db.settings.expiryWarningDays)
                          : null;

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border text-xs space-y-3 transition ${
                              expiryInfo?.status === 'expired'
                                ? 'bg-red-50/80 border-red-300'
                                : expiryInfo?.status === 'expiring_soon'
                                ? 'bg-amber-50/60 border-amber-300'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm">
                                  {idx + 1}. {item.medicineName}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Instructions: <strong>{item.dosage}</strong> · {item.frequency} · {item.duration}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-slate-900 font-mono">
                                  Qty: {item.quantity}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {formatCurrency(item.totalPrice, db.settings.currency)}
                                </div>
                              </div>
                            </div>

                            {/* Batch Selector & Safety Status */}
                            <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="w-full sm:w-auto flex-1">
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                  Dispense from Batch (FEFO Ranked):
                                </label>
                                <select
                                  disabled={isDispensed}
                                  value={selectedBatchId || ''}
                                  onChange={(e) =>
                                    setSelectedBatches({
                                      ...selectedBatches,
                                      [item.id]: e.target.value,
                                    })
                                  }
                                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-mono font-semibold focus:ring-1 focus:ring-cyan-500"
                                >
                                  {med?.batches.map((b) => {
                                    const bExp = getBatchExpiryStatus(
                                      b.expiryDate,
                                      db.settings.expiryWarningDays
                                    );
                                    return (
                                      <option key={b.id} value={b.id}>
                                        Batch {b.batchNumber} (Stock: {b.quantity}) · Exp: {b.expiryDate} [{bExp.label}]
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {/* Expiry Badge */}
                              {expiryInfo && (
                                <div className="mt-1 sm:mt-4">
                                  {expiryInfo.status === 'expired' && (
                                    <div className="px-2.5 py-1 bg-red-600 text-white font-bold rounded flex items-center gap-1 text-[11px]">
                                      <XCircle className="w-3.5 h-3.5" /> BLOCKED: EXPIRED DRUG
                                    </div>
                                  )}
                                  {expiryInfo.status === 'expiring_soon' && (
                                    <div className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded flex items-center gap-1 text-[11px]">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Warning: {expiryInfo.label}
                                    </div>
                                  )}
                                  {expiryInfo.status === 'safe' && (
                                    <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded flex items-center gap-1 text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> {expiryInfo.label}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dispense Action Box */}
                    <div className="pt-4 border-t border-slate-200">
                      {isDispensed ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                          <div>
                            <span className="font-bold">Prescription already filled & dispensed!</span>
                            <div className="text-[11px] text-emerald-700 mt-0.5">
                              Dispensed by {selectedRx.dispensedBy} ({selectedRx.dispensedAt ? formatDateTime(selectedRx.dispensedAt) : ''})
                            </div>
                          </div>
                          <span className="font-bold text-emerald-800 bg-white px-3 py-1 rounded border border-emerald-200">
                            Inventory Decremented
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div className="text-xs text-slate-500">
                            Total Rx Cost:{' '}
                            <strong className="text-slate-900 font-mono text-sm">
                              {formatCurrency(selectedRx.totalPrice, db.settings.currency)}
                            </strong>
                          </div>

                          <button
                            onClick={() => handleDispensePrescription(selectedRx)}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-2"
                          >
                            <PackageCheck className="w-4 h-4" />
                            <span>Dispense & Decrement Inventory</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Select a prescription from the worklist to view and dispense.
          </div>
        )}
      </div>
    </div>
  );
};
