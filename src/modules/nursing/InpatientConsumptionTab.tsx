import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Send,
} from 'lucide-react';
import { Visit, Patient, PatientConsumptionItem, User, DatabaseState, ChargeItem } from '../../types/clinic';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface InpatientConsumptionTabProps {
  visit: Visit;
  patient: Patient | null;
  consumptions: PatientConsumptionItem[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

const COMMON_WARD_CONSUMABLES = [
  { name: 'IV Cannula 20G (Pink) BD Venflon', category: 'consumable' as const, price: 45.0 },
  { name: 'Normal Saline 0.9% 1000ml Infusion Bottle', category: 'iv_fluid' as const, price: 120.0 },
  { name: 'Ringer Lactate Solution 500ml Infusion', category: 'iv_fluid' as const, price: 130.0 },
  { name: 'Infusion Giving Set with Filter', category: 'consumable' as const, price: 50.0 },
  { name: 'Sterile Disposable Syringe 10ml with Needle', category: 'consumable' as const, price: 15.0 },
  { name: 'Sterile Gauze Swab Pack (5 pcs)', category: 'consumable' as const, price: 25.0 },
  { name: 'Foley Catheter 16Fr + Urine Drainage Bag', category: 'equipment' as const, price: 180.0 },
  { name: 'Nitrile Examination Gloves (Pair)', category: 'ppe' as const, price: 10.0 },
];

export const InpatientConsumptionTab: React.FC<InpatientConsumptionTabProps> = ({
  visit,
  patient,
  consumptions,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const patientConsumptions = consumptions.filter((c) => c.visitId === visit.id);
  const totalCost = patientConsumptions.reduce((sum, item) => sum + item.totalPrice, 0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<PatientConsumptionItem['category']>('consumable');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(50.0);

  const handleQuickAdd = (item: typeof COMMON_WARD_CONSUMABLES[0]) => {
    const newConsumption: PatientConsumptionItem = {
      id: `con_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      itemName: item.name,
      category: item.category,
      quantity: 1,
      unitPrice: item.price,
      totalPrice: item.price,
      administeredBy: currentUser.name,
      billedToCashier: false,
    };

    onUpdateDb((prev) => ({
      ...prev,
      patientConsumptions: [newConsumption, ...(prev.patientConsumptions || [])],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Supply Consumed: ${item.name}`,
      `Nurse ${currentUser.name} logged 1x ${item.name} for ${visit.patientName}.`
    );
  };

  const handleCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const total = customQty * customPrice;
    const newConsumption: PatientConsumptionItem = {
      id: `con_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      itemName: customName.trim(),
      category: customCategory,
      quantity: Number(customQty),
      unitPrice: Number(customPrice),
      totalPrice: total,
      administeredBy: currentUser.name,
      billedToCashier: false,
    };

    onUpdateDb((prev) => ({
      ...prev,
      patientConsumptions: [newConsumption, ...(prev.patientConsumptions || [])],
    }));

    setCustomName('');
    setShowAddForm(false);
  };

  const handleSyncToCashier = () => {
    const unbilledItems = patientConsumptions.filter((c) => !c.billedToCashier);
    if (unbilledItems.length === 0) return;

    onUpdateDb((prev) => {
      const newCharges: ChargeItem[] = unbilledItems.map((item) => ({
        id: `chg_con_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        visitId: visit.id,
        patientId: visit.patientId,
        category: 'procedure',
        name: `Ward Supply: ${item.itemName} (x${item.quantity})`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        paymentStatus: 'pending',
        addedAt: new Date().toISOString(),
        addedBy: currentUser.name,
      }));

      const updatedConsumptions = (prev.patientConsumptions || []).map((c) =>
        c.visitId === visit.id ? { ...c, billedToCashier: true } : c
      );

      return {
        ...prev,
        charges: [...prev.charges, ...newCharges],
        patientConsumptions: updatedConsumptions,
      };
    });

    broadcast(
      'PAYMENT_RECEIVED',
      'Nurse Station',
      `Ward Supplies Billed to Cashier: ${visit.patientName}`,
      `Nurse ${currentUser.name} transmitted ${unbilledItems.length} consumables (${formatCurrency(unbilledItems.reduce((s, i) => s + i.totalPrice, 0))}) to Cashier Billing Desk.`
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Inpatient Ward Supplies, Consumables & Medication Consumption
            </h3>
            <p className="text-xs text-slate-500">
              Track bedside consumable usage, IV fluids, and nursing procedure kits with real-time cashier billing synchronization.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Custom Item</span>
          </button>

          <button
            onClick={handleSyncToCashier}
            disabled={patientConsumptions.every((c) => c.billedToCashier)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sync Charges to Cashier Desk</span>
          </button>
        </div>
      </div>

      {/* Summary Cost Card */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-purple-800 uppercase block">Total Ward Consumption</span>
          <div className="text-2xl font-black text-purple-950 font-mono">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-[11px] text-purple-900">
            {patientConsumptions.length} total items consumed · {patientConsumptions.filter((c) => c.billedToCashier).length} billed to cashier invoice
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 block uppercase">Unbilled Balance</span>
          <span className="text-base font-bold text-slate-900 font-mono">
            {formatCurrency(
              patientConsumptions
                .filter((c) => !c.billedToCashier)
                .reduce((s, i) => s + i.totalPrice, 0)
            )}
          </span>
        </div>
      </div>

      {/* 1-Click Ward Consumables Catalog */}
      <div>
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
          1-Click Ward Inventory Dispense:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COMMON_WARD_CONSUMABLES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAdd(item)}
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition group"
            >
              <div className="font-semibold text-slate-800 group-hover:text-purple-900 text-xs truncate">
                + {item.name.split(' ')[0]} {item.name.split(' ')[1]}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                <span className="uppercase">{item.category}</span>
                <span className="font-mono font-bold text-purple-700">{formatCurrency(item.price)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Add Form */}
      {showAddForm && (
        <form onSubmit={handleCustomAdd} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Log Custom Ward Consumable / Medical Supply
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Item Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Crepe Bandage 10cm x 4.5m"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={customQty}
                onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Unit Price (ETB)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={customPrice}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
            >
              Append Supply to Patient
            </button>
          </div>
        </form>
      )}

      {/* Consumption Table */}
      {patientConsumptions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No medical supplies or consumables logged for this encounter yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click any 1-click inventory item above to instantly log bedside consumption.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3">Total (ETB)</th>
                <th className="py-2.5 px-3 text-right">Billing Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientConsumptions.map((con) => (
                <tr key={con.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    {formatDateTime(con.time)}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {con.itemName}
                  </td>
                  <td className="py-2.5 px-3 uppercase text-[10px] text-slate-500">
                    {con.category.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    {con.quantity}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {formatCurrency(con.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-900">
                    {formatCurrency(con.totalPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        con.billedToCashier
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {con.billedToCashier ? 'Billed to Cashier' : 'Pending Sync'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
