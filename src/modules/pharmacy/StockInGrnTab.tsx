import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Boxes,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Building2,
  DollarSign,
  FileText,
  Printer,
  Sparkles,
  AlertCircle,
  Truck,
  Hash,
} from 'lucide-react';
import { DatabaseState, Medicine, MedicineBatch, StockMovement, User as ClinicUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { RegisterMedicineModal } from './RegisterMedicineModal';

interface StockInGrnTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  preselectedMedId?: string;
}

export const StockInGrnTab: React.FC<StockInGrnTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  broadcast,
  preselectedMedId,
}) => {
  const [selectedMedId, setSelectedMedId] = useState<string>(
    preselectedMedId || db.medicines[0]?.id || ''
  );
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (preselectedMedId) {
      setSelectedMedId(preselectedMedId);
    }
  }, [preselectedMedId]);

  const selectedMed = db.medicines.find((m) => m.id === selectedMedId);

  // Form State
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(25.0);
  const [sellingPrice, setSellingPrice] = useState<number>(selectedMed?.unitPrice || 45.0);
  const [supplierName, setSupplierName] = useState('Ethiopian Pharmaceuticals Supply Agency (EPSA)');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState<any | null>(null);

  // Auto-generate sensible defaults when medicine changes
  useEffect(() => {
    if (selectedMed) {
      setSellingPrice(selectedMed.unitPrice);
      setCostPrice(Math.round(selectedMed.unitPrice * 0.6 * 10) / 10);
      setBatchNumber(`B-${selectedMed.code}-${Math.floor(100 + Math.random() * 900)}`);

      // Set expiry 2 years in future by default
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      setExpiryDate(futureDate.toISOString().split('T')[0]);
    }
  }, [selectedMedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMed) {
      alert('Please select a medicine.');
      return;
    }

    if (!batchNumber.trim()) {
      alert('Please enter a valid batch/lot number.');
      return;
    }

    if (!expiryDate) {
      alert('Please enter a valid expiry date.');
      return;
    }

    if (quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    const newBatchId = `batch_${Date.now()}`;
    const newBatch: MedicineBatch = {
      id: newBatchId,
      batchNumber: batchNumber.trim().toUpperCase(),
      quantity: quantity,
      expiryDate: expiryDate,
      costPrice: costPrice,
      receivedDate: new Date().toISOString().split('T')[0],
      version: 1,
    };

    const newMovement: StockMovement = {
      id: `sm_${Date.now()}_recv`,
      timestamp: new Date().toISOString(),
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      batchNumber: newBatch.batchNumber,
      changeType: 'received',
      quantityDelta: quantity,
      remainingQuantity: selectedMed.batches.reduce((sum, b) => sum + b.quantity, 0) + quantity,
      referenceNumber: invoiceNumber,
      operator: currentUser.name,
      notes: `GRN Intake from ${supplierName} (Cost: ETB ${costPrice}, Sell: ETB ${sellingPrice})`,
    };

    onUpdateDb((prev) => {
      const updatedMedicines = prev.medicines.map((m) => {
        if (m.id === selectedMed.id) {
          // Check if batch number already exists; if so, add quantity, else push new batch
          const existingBatchIdx = m.batches.findIndex(
            (b) => b.batchNumber.toLowerCase() === newBatch.batchNumber.toLowerCase()
          );

          let updatedBatches: MedicineBatch[];
          if (existingBatchIdx >= 0) {
            updatedBatches = [...m.batches];
            updatedBatches[existingBatchIdx] = {
              ...updatedBatches[existingBatchIdx],
              quantity: updatedBatches[existingBatchIdx].quantity + quantity,
              expiryDate: expiryDate,
              costPrice: costPrice,
            };
          } else {
            updatedBatches = [...m.batches, newBatch];
          }

          return {
            ...m,
            unitPrice: sellingPrice,
            batches: updatedBatches,
          };
        }
        return m;
      });

      return {
        ...prev,
        medicines: updatedMedicines,
        stockMovements: [newMovement, ...prev.stockMovements],
      };
    });

    broadcast(
      'DATABASE_RESTORED',
      'Pharmacy PC',
      'New Medicine Stock Batch Received',
      `Received ${quantity} units of ${selectedMed.name} (Batch ${newBatch.batchNumber}) from ${supplierName}.`
    );

    setSubmittedReceipt({
      medicineName: selectedMed.name,
      batchNumber: newBatch.batchNumber,
      quantity,
      costPrice,
      sellingPrice,
      supplierName,
      invoiceNumber,
      timestamp: new Date().toISOString(),
    });
  };

  const handleResetForNext = () => {
    setSubmittedReceipt(null);
    setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
    setQuantity(100);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Form (8 Cols) */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-teal-600" />
                <span>Goods Received Note (GRN) & Stock Intake</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Register supplier deliveries, create new batch numbers, and increment stock levels.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
              Verified Intake
            </span>
          </div>

          {submittedReceipt ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-emerald-900">
                Stock Intake Confirmed & Logged!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                <strong>{submittedReceipt.quantity} units</strong> of{' '}
                <strong>{submittedReceipt.medicineName}</strong> (Batch #{submittedReceipt.batchNumber})
                have been added to active inventory from {submittedReceipt.supplierName}.
              </p>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleResetForNext}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Receive Another Batch</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Medicine Selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Target Medicine from Formulary:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Register New Medicine</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  >
                    {db.medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName}) · {m.dosageForm} ({m.strength}) · Code: {m.code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
                    title="Register a brand new drug in formulary"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>New Drug</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Batch Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span>Manufacturer Batch / Lot Number:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. B-AMOX-2026-08"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Expiry Date (YYYY-MM-DD):</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Quantity Received (Units):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Purchase Cost Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span>Unit Cost (ETB):</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Retail Unit Selling Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span>Selling Price (ETB):</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <span>Distributor / Supplier Name:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. EPSA, Cadila Healthcare"
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Invoice / PO # */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Supplier Delivery Note / Invoice #:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Intake Inspection Notes:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Seals intact, cold-chain verified, visual inspection passed"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Confirm Intake & Add to Inventory</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Recent Received Batches & Info (4 Cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Boxes className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-extrabold text-slate-900">Recently Received Batches</h4>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {db.stockMovements
              .filter((m) => m.changeType === 'received')
              .slice(0, 5)
              .map((sm) => (
                <div
                  key={sm.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{sm.medicineName}</span>
                    <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.2 rounded border border-teal-200">
                      +{sm.quantityDelta} units
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Batch: {sm.batchNumber} · Ref: {sm.referenceNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Operator: {sm.operator} · {formatDateTime(sm.timestamp)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Cold-chain & Inspection Guidelines */}
        <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 text-xs space-y-2 text-teal-900">
          <div className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Intake Compliance Standard:</span>
          </div>
          <ul className="text-[11px] text-teal-800 space-y-1 list-disc pl-4 leading-relaxed">
            <li>Verify manufacturer batch number against carton label and invoice.</li>
            <li>Reject any pharmaceuticals with &lt;6 months remaining shelf-life.</li>
            <li>Ensure thermolabile drugs (insulins, vaccines) maintained 2°C - 8°C.</li>
          </ul>
        </div>
      </div>

      {/* Register New Medicine Modal */}
      <RegisterMedicineModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        db={db}
        onUpdateDb={onUpdateDb}
        currentUser={currentUser}
        broadcast={broadcast}
        onSuccess={(newMedId) => {
          setSelectedMedId(newMedId);
        }}
      />
    </div>
  );
};
