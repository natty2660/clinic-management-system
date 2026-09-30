import React, { useState } from 'react';
import {
  Pill,
  PlusCircle,
  X,
  CheckCircle2,
  DollarSign,
  Boxes,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  Hash,
  Truck,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { DatabaseState, Medicine, MedicineBatch, StockMovement, User as ClinicUser } from '../../types/clinic';

interface RegisterMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onSuccess?: (newMedicineId: string) => void;
}

const PRESET_CATEGORIES = [
  'Antibiotics & Antimicrobials',
  'Analgesics, Antipyretics & NSAIDs',
  'Cardiovascular & Antihypertensives',
  'Antidiabetic & Endocrine',
  'Gastrointestinal (PPI, Antacids, Antiemetics)',
  'Respiratory, Antihistamines & Cough',
  'IV Infusions, Fluids & Electrolytes',
  'Dermatological & Topical Preparations',
  'Ophthalmology & ENT',
  'Vitamins, Minerals & Nutritional',
  'Anthelmintics & Antiparasitics',
  'Controlled Substances & Narcotics (Sched II/III)',
  'Anesthetics & Critical Care',
  'General Medical / Other',
];

const PRESET_DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup / Suspension',
  'Injection / Ampoule / Vial',
  'IV Infusion Bottle',
  'Topical Cream / Ointment',
  'Eye / Ear Drops',
  'Inhaler / Respules',
  'Suppository / Pessary',
  'Powder for Oral Solution',
];

export const RegisterMedicineModal: React.FC<RegisterMedicineModalProps> = ({
  isOpen,
  onClose,
  db,
  onUpdateDb,
  currentUser,
  broadcast,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // Basic Information
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [dosageForm, setDosageForm] = useState(PRESET_DOSAGE_FORMS[0]);
  const [strength, setStrength] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(45.0);
  const [reorderLevel, setReorderLevel] = useState<number>(30);

  // Initial Batch Intake Option
  const [includeInitialBatch, setIncludeInitialBatch] = useState(true);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 2);
    return future.toISOString().split('T')[0];
  });
  const [initialQuantity, setInitialQuantity] = useState<number>(100);
  const [costPrice, setCostPrice] = useState<number>(25.0);
  const [supplierName, setSupplierName] = useState('Ethiopian Pharmaceuticals Supply Agency (EPSA)');

  // Auto-generate code when name changes if user hasn't typed a custom code
  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code.startsWith('MED-')) {
      const clean = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      setCode(`MED-${clean || 'NEW'}-${Math.floor(100 + Math.random() * 900)}`);
    }
    if (!batchNumber || batchNumber.startsWith('B-')) {
      const clean = val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
      setBatchNumber(`B-${clean || 'DRUG'}-2026`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter the medicine brand or trade name.');
      return;
    }

    if (!genericName.trim()) {
      alert('Please enter the generic name (INN).');
      return;
    }

    if (!strength.trim()) {
      alert('Please specify the strength (e.g. 500mg, 10mg/ml).');
      return;
    }

    const finalCode = (code.trim() || `MED-${Date.now().toString().slice(-6)}`).toUpperCase();

    // Check duplicate code
    const existing = db.medicines.find((m) => m.code.toUpperCase() === finalCode);
    if (existing) {
      alert(`A medicine with code "${finalCode}" already exists (${existing.name}). Please use a unique code.`);
      return;
    }

    const newMedId = `med_${Date.now()}`;
    const newBatches: MedicineBatch[] = [];
    const newMovements: StockMovement[] = [];

    if (includeInitialBatch && initialQuantity > 0) {
      const bNum = (batchNumber.trim() || `B-${Date.now().toString().slice(-4)}`).toUpperCase();
      const newBatch: MedicineBatch = {
        id: `batch_${Date.now()}`,
        batchNumber: bNum,
        quantity: initialQuantity,
        expiryDate: expiryDate,
        costPrice: costPrice,
        receivedDate: new Date().toISOString().split('T')[0],
        version: 1,
      };
      newBatches.push(newBatch);

      newMovements.push({
        id: `sm_${Date.now()}_initial`,
        timestamp: new Date().toISOString(),
        medicineId: newMedId,
        medicineName: name.trim(),
        batchNumber: bNum,
        changeType: 'received',
        quantityDelta: initialQuantity,
        remainingQuantity: initialQuantity,
        referenceNumber: 'INITIAL_REGISTRATION',
        operator: currentUser.name,
        notes: `Initial stock intake upon formulary registration (${supplierName})`,
      });
    }

    const newMedicine: Medicine = {
      id: newMedId,
      code: finalCode,
      name: name.trim(),
      genericName: genericName.trim(),
      category: category,
      dosageForm: dosageForm,
      strength: strength.trim(),
      unitPrice: Number(unitPrice) || 0,
      reorderLevel: Number(reorderLevel) || 10,
      batches: newBatches,
      version: 1,
    };

    onUpdateDb((prev) => ({
      ...prev,
      medicines: [newMedicine, ...prev.medicines],
      stockMovements: [...newMovements, ...prev.stockMovements],
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser.name,
          role: currentUser.role,
          department: 'Pharmacy',
          action: `REGISTERED NEW MEDICINE: ${newMedicine.name} (${newMedicine.genericName} ${newMedicine.strength}) · Code: ${newMedicine.code} · Retail: ETB ${newMedicine.unitPrice}`,
          entityType: 'price',
          entityId: newMedicine.id,
          newValue: JSON.stringify({ name: newMedicine.name, price: newMedicine.unitPrice }),
        },
        ...prev.auditLogs,
      ],
    }));

    broadcast(
      'DATABASE_RESTORED',
      'Pharmacy PC',
      'New Medicine Registered in Formulary',
      `${newMedicine.name} (${newMedicine.strength}) added to pharmacy formulary by Pharmacist ${currentUser.name}.`
    );

    if (onSuccess) {
      onSuccess(newMedId);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/20">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Formulary Master
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Pharmacy Dispensary
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Register New Medicine in Central Formulary
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Identification */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Medicine Identification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Brand / Trade Name: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Augmentin, Cataflam, Paracetamol"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Generic Name (INN / Active Molecule): *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin + Clavulanate, Diclofenac"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>Unique Drug Code: *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MED-AUGM-625"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Therapeutic Category: *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Formulation & Presentation */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Formulation, Strength & Pricing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Dosage Form: *
                </label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {PRESET_DOSAGE_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Strength / Concentration: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500mg, 625mg, 250mg/5ml, 10mg/ml"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  <span>Retail Unit Selling Price (ETB): *</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Min Reorder Threshold (Safety Stock): *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 10)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Initial Stock Batch */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeInitialBatch}
                  onChange={(e) => setIncludeInitialBatch(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-extrabold text-emerald-950 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. Receive Initial Stock Batch Now</span>
                </span>
              </label>

              <span className="text-[10px] text-emerald-700 font-semibold">
                {includeInitialBatch ? 'Immediate Inventory Increment' : 'Create in Formulary Only'}
              </span>
            </div>

            {includeInitialBatch && (
              <div className="pt-2 border-t border-emerald-200/60 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span>Batch / Lot Number: *</span>
                    </label>
                    <input
                      type="text"
                      required={includeInitialBatch}
                      placeholder="e.g. B-2026-01"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Expiry Date (YYYY-MM-DD): *</span>
                    </label>
                    <input
                      type="date"
                      required={includeInitialBatch}
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Initial Quantity (Units): *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required={includeInitialBatch}
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-400" />
                      <span>Unit Cost Price (ETB): *</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required={includeInitialBatch}
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" />
                      <span>Supplier:</span>
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Register & Save Medicine</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
