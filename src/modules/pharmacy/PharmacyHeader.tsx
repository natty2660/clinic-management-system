import React from 'react';
import {
  Pill,
  PackageCheck,
  BedDouble,
  Boxes,
  ArrowDownToLine,
  TrendingDown,
  ShieldAlert,
  FileHeart,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { PharmacyMainTab, PharmacyStats } from './types';

interface PharmacyHeaderProps {
  activeTab: PharmacyMainTab;
  onSelectTab: (tab: PharmacyMainTab) => void;
  stats: PharmacyStats;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenQuickStockIn?: () => void;
  onOpenRegisterMedicine?: () => void;
}

export const PharmacyHeader: React.FC<PharmacyHeaderProps> = ({
  activeTab,
  onSelectTab,
  stats,
  searchTerm,
  onSearchChange,
  onOpenQuickStockIn,
  onOpenRegisterMedicine,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
            <Pill className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                Workstation PC · PHARM-01
              </span>
              <span className="text-[11px] font-semibold text-slate-300">
                Real-time FEFO & Expiry Shield
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
              SPEED Central Dispensary & Pharmaceutical Stores
            </h1>
          </div>
        </div>

        {/* Global Fast Search & Quick Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Rx #, Patient MRN, Drug name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {onOpenRegisterMedicine && (
            <button
              onClick={onOpenRegisterMedicine}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition"
              title="Register a new medicine brand and formulation in formulary"
            >
              <Pill className="w-4 h-4" />
              <span>+ Register Drug</span>
            </button>
          )}

          {onOpenQuickStockIn && (
            <button
              onClick={onOpenQuickStockIn}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0 transition"
              title="Quickly receive a new medicine delivery batch"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Stock In (GRN)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-slate-100 bg-slate-50/80 border-b border-slate-200 text-xs">
        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Paid & Ready
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {stats.paidReady}
            </div>
          </div>
        </div>

        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Cashier Gated
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {stats.unpaidBlocked}
            </div>
          </div>
        </div>

        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Dispensed Today
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {stats.dispensedToday}
            </div>
          </div>
        </div>

        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <BedDouble className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Inpatient Wards
            </div>
            <div className="text-base font-extrabold text-slate-900 font-mono">
              {stats.inpatientOrdersCount}
            </div>
          </div>
        </div>

        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Low Stock Alert
            </div>
            <div className="text-base font-extrabold text-rose-700 font-mono">
              {stats.lowStockCount}
            </div>
          </div>
        </div>

        <div className="p-3 px-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Expiring &lt;60d
            </div>
            <div className="text-base font-extrabold text-amber-800 font-mono">
              {stats.expiringSoonCount}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="px-4 bg-white border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onSelectTab('opd_dispensing')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'opd_dispensing'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-cyan-600" />
          <span>OPD Dispensing</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800">
            {stats.paidReady + stats.unpaidBlocked}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('inpatient_dispensing')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inpatient_dispensing'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BedDouble className="w-4 h-4 text-indigo-600" />
          <span>Inpatient IPD</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
            {stats.inpatientOrdersCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('inventory_formulary')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'inventory_formulary'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-600" />
          <span>Formulary & Stock</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
            {stats.totalMedicines}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('stock_in_grn')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stock_in_grn'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4 text-teal-600" />
          <span>Stock In (GRN)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
            Intake
          </span>
        </button>

        <button
          onClick={() => onSelectTab('stock_movements')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stock_movements'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-amber-600" />
          <span>Stock Movements</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
            Audit
          </span>
        </button>

        <button
          onClick={() => onSelectTab('controlled_drugs')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'controlled_drugs'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>Controlled Drugs</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
            Schedule II/III
          </span>
        </button>

        <button
          onClick={() => onSelectTab('clinical_review')}
          className={`py-3.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clinical_review'
              ? 'border-cyan-600 text-cyan-800 bg-cyan-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileHeart className="w-4 h-4 text-purple-600" />
          <span>Patient Clinical Chart</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
            History / Labs / Vitals
          </span>
        </button>
      </div>
    </div>
  );
};
