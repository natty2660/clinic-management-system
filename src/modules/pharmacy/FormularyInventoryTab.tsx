import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  Printer,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Sparkles,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { DatabaseState, Medicine, MedicineBatch, User as ClinicUser } from '../../types/clinic';
import { formatCurrency, formatDateTime, getBatchExpiryStatus } from '../../utils/formatters';
import { RegisterMedicineModal } from './RegisterMedicineModal';

interface FormularyInventoryTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onSelectMedForStockIn?: (medId: string) => void;
}

export const FormularyInventoryTab: React.FC<FormularyInventoryTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  broadcast,
  onSelectMedForStockIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expiring' | 'expired'>('all');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Compute filtered medicines
  const filteredMedicines = db.medicines.filter((med) => {
    const totalUnits = med.batches.reduce((sum, b) => sum + b.quantity, 0);
    const hasExpiring = med.batches.some(
      (b) => getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays).status === 'expiring_soon'
    );
    const hasExpired = med.batches.some(
      (b) => getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays).status === 'expired'
    );

    if (filterType === 'low_stock' && totalUnits > med.reorderLevel) return false;
    if (filterType === 'out_of_stock' && totalUnits > 0) return false;
    if (filterType === 'expiring' && !hasExpiring) return false;
    if (filterType === 'expired' && !hasExpired) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = med.name.toLowerCase().includes(term);
      const matchGeneric = med.genericName.toLowerCase().includes(term);
      const matchCode = med.code.toLowerCase().includes(term);
      const matchCat = med.category.toLowerCase().includes(term);
      return matchName || matchGeneric || matchCode || matchCat;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-600" />
            <span>Formulary Catalog & Multi-Batch Inventory</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Unit stock, FEFO ranked batches, reorder thresholds, and safety shields.
          </p>
        </div>

        {/* Filter Buttons & Action */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({db.medicines.length})
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'low_stock'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterType('expiring')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'expiring'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Expiring Soon (&lt;{db.settings.expiryWarningDays}d)
          </button>
          <button
            onClick={() => setFilterType('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === 'expired'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Expired (Blocked)
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 transition ml-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Medicine</span>
          </button>
        </div>
      </div>

      {/* Search Input & Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search drug name, generic, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px]">
          <span className="font-bold text-slate-600 mr-1">Safety Code:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
            Green: Safe
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
            Yellow: &lt;{db.settings.expiryWarningDays}d
          </span>
          <span className="px-2 py-0.5 rounded bg-red-100 text-red-900 font-bold">
            Red: Expired (Blocked)
          </span>
        </div>
      </div>

      {/* Formulary Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-3 px-4">Code / Drug Name</th>
              <th className="py-3 px-3">Generic & Category</th>
              <th className="py-3 px-3">Form & Strength</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-right">Available Stock</th>
              <th className="py-3 px-4">Active Batches & Expiry</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMedicines.map((med) => {
              const totalUnits = med.batches.reduce((sum, b) => sum + b.quantity, 0);
              const isLow = totalUnits <= med.reorderLevel && totalUnits > 0;
              const isOutOfStock = totalUnits === 0;
              const isExpanded = expandedMedId === med.id;

              return (
                <React.Fragment key={med.id}>
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{med.code}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{med.genericName}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{med.category}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {med.dosageForm} ({med.strength})
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(med.unitPrice, db.settings.currency)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          isOutOfStock
                            ? 'text-red-600'
                            : isLow
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {totalUnits}
                      </span>
                      {isLow && (
                        <div className="text-[9px] text-amber-600 font-bold uppercase">
                          Low (Min: {med.reorderLevel})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {med.batches.slice(0, 2).map((b) => {
                          const exp = getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays);
                          return (
                            <div key={b.id} className="flex items-center gap-2 text-[11px]">
                              <span className="font-mono font-semibold text-slate-700">
                                {b.batchNumber}
                              </span>
                              <span className="text-slate-400">({b.quantity}u)</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                  exp.status === 'expired'
                                    ? 'bg-red-100 text-red-800'
                                    : exp.status === 'expiring_soon'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {exp.label}
                              </span>
                            </div>
                          );
                        })}
                        {med.batches.length > 2 && (
                          <button
                            onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                            className="text-[10px] text-cyan-700 font-bold hover:underline"
                          >
                            {isExpanded ? 'Hide' : `+${med.batches.length - 2} more batches...`}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">
                          OUT OF STOCK
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                          REORDER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {onSelectMedForStockIn && (
                        <button
                          onClick={() => onSelectMedForStockIn(med.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 mx-auto border border-teal-200"
                          title="Receive new batch for this drug"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          <span>Receive</span>
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Batch Details */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90">
                      <td colSpan={8} className="p-4 pl-12 space-y-2 border-b border-slate-200">
                        <div className="font-bold text-xs text-slate-700">
                          All Batches for {med.name}:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {med.batches.map((b) => {
                            const exp = getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays);
                            return (
                              <div
                                key={b.id}
                                className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-mono font-bold text-slate-800">
                                    Batch #{b.batchNumber}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      exp.status === 'expired'
                                        ? 'bg-red-100 text-red-800'
                                        : exp.status === 'expiring_soon'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {exp.label}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                  Units in Stock: <strong className="text-slate-800">{b.quantity}</strong>
                                </div>
                                <div className="text-slate-400 text-[10px]">
                                  Cost: {formatCurrency(b.costPrice, db.settings.currency)} · Rec: {b.receivedDate}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
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
          setExpandedMedId(newMedId);
          setFilterType('all');
        }}
      />
    </div>
  );
};
