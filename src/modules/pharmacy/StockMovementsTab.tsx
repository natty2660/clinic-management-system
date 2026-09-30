import React, { useState } from 'react';
import {
  TrendingDown,
  ArrowDownToLine,
  Search,
  Filter,
  PackageCheck,
  RotateCcw,
  Trash2,
  Calendar,
  User,
  Hash,
  Clock,
  Printer,
} from 'lucide-react';
import { DatabaseState, StockMovement } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface StockMovementsTabProps {
  db: DatabaseState;
}

export const StockMovementsTab: React.FC<StockMovementsTabProps> = ({ db }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dispensed' | 'received' | 'adjusted' | 'expired_discard'>('all');

  const filteredMovements = db.stockMovements.filter((sm) => {
    if (typeFilter !== 'all' && sm.changeType !== typeFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDrug = sm.medicineName.toLowerCase().includes(term);
      const matchBatch = sm.batchNumber.toLowerCase().includes(term);
      const matchRef = sm.referenceNumber.toLowerCase().includes(term);
      const matchOp = sm.operator.toLowerCase().includes(term);
      return matchDrug || matchBatch || matchRef || matchOp;
    }

    return true;
  });

  const totalDispensedUnits = db.stockMovements
    .filter((m) => m.changeType === 'dispensed')
    .reduce((sum, m) => sum + Math.abs(m.quantityDelta), 0);

  const totalReceivedUnits = db.stockMovements
    .filter((m) => m.changeType === 'received')
    .reduce((sum, m) => sum + m.quantityDelta, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <span>Stock Movements & Dispensing Audit Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, audit-ready chronological record of every drug unit issued, received, or adjusted.
          </p>
        </div>

        {/* KPI Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold">
            Dispensed: <span className="font-mono">{totalDispensedUnits} units</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-bold">
            Received: <span className="font-mono">+{totalReceivedUnits} units</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine, batch, Rx #, or operator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Movements ({db.stockMovements.length})
          </button>
          <button
            onClick={() => setTypeFilter('dispensed')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              typeFilter === 'dispensed'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Dispensed
          </button>
          <button
            onClick={() => setTypeFilter('received')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              typeFilter === 'received'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setTypeFilter('adjusted')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              typeFilter === 'adjusted'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Adjusted
          </button>
          <button
            onClick={() => setTypeFilter('expired_discard')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              typeFilter === 'expired_discard'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Expired Discard
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-3">Medicine Name</th>
              <th className="py-3 px-3">Batch Number</th>
              <th className="py-3 px-3 text-center">Type</th>
              <th className="py-3 px-3 text-right">Delta</th>
              <th className="py-3 px-3 text-right">Remaining Stock</th>
              <th className="py-3 px-4">Reference & Operator Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No stock movements found matching current search.
                </td>
              </tr>
            ) : (
              filteredMovements.map((sm) => {
                const isPositive = sm.quantityDelta > 0;
                return (
                  <tr key={sm.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDateTime(sm.timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{sm.medicineName}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {sm.batchNumber}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sm.changeType === 'received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sm.changeType === 'dispensed'
                            ? 'bg-cyan-100 text-cyan-800'
                            : sm.changeType === 'adjusted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sm.changeType}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-extrabold text-sm ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? `+${sm.quantityDelta}` : sm.quantityDelta}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {sm.remainingQuantity}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div className="font-mono font-semibold text-slate-800">{sm.referenceNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        By: {sm.operator} {sm.notes ? `• ${sm.notes}` : ''}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
