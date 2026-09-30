import React from 'react';
import {
  Users,
  BedDouble,
  Search,
  Sparkles,
  PlusCircle,
  Clock,
  CheckCircle2,
  DollarSign,
  Building2,
  Ticket,
  CreditCard,
  Calendar,
  Grid,
  FileText,
  ShieldCheck,
  DoorOpen,
  ArrowRightLeft,
  Coins,
} from 'lucide-react';
import { ReceptionMainTab, OpdSubTab, InpatientSubTab, ReceptionStats } from './types';
import { formatCurrency } from '../../utils/formatters';

interface ReceptionHeaderProps {
  mainTab: ReceptionMainTab;
  onMainTabChange: (tab: ReceptionMainTab) => void;
  opdSubTab: OpdSubTab;
  onOpdSubTabChange: (sub: OpdSubTab) => void;
  ipdSubTab: InpatientSubTab;
  onIpdSubTabChange: (sub: InpatientSubTab) => void;
  stats: ReceptionStats;
  currency: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onQuickWalkIn: () => void;
  onQuickAdmission: () => void;
  onOpenShiftTill: () => void;
  pendingChargesCount: number;
  todayAppointmentsCount: number;
}

export const ReceptionHeader: React.FC<ReceptionHeaderProps> = ({
  mainTab,
  onMainTabChange,
  opdSubTab,
  onOpdSubTabChange,
  ipdSubTab,
  onIpdSubTabChange,
  stats,
  currency,
  searchQuery,
  onSearchChange,
  onQuickWalkIn,
  onQuickAdmission,
  onOpenShiftTill,
  pendingChargesCount,
  todayAppointmentsCount,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 -mx-4 -mt-4 md:-mx-6 md:-mt-6 p-4 md:p-6 mb-6 shadow-xs">
      {/* Top Bar: Title & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase bg-teal-600 text-white">
              RECEPTION PC
            </div>
            <span className="text-xs font-semibold text-slate-500">Patient Intake, Triage Routing & Inpatient Bed Desk</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Front Desk & Central Registration</span>
          </h1>
        </div>

        {/* Global Live Indicators & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, MRN, phone, IPD#..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Shift Financial Badge */}
          <button
            onClick={onOpenShiftTill}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg transition text-xs font-bold shadow-2xs"
            title="Inspect Shift Drawer & Collections"
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-emerald-600">Shift Collections</div>
              <div className="font-black text-emerald-900 leading-tight">
                {formatCurrency(stats.todayCollectionsEtb, currency)}
              </div>
            </div>
          </button>

          {/* Quick Action Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onQuickWalkIn}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Quick Walk-In</span>
            </button>

            <button
              onClick={onQuickAdmission}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>+ Admit Inpatient</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-slate-100">
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>OPD Visits Today</span>
            <Users className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-slate-800">{stats.opdTotalToday}</span>
            <span className="text-[11px] font-semibold text-amber-600">
              {stats.opdWaitingDoctor} in queue
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Consultations Active</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-slate-800">{stats.opdInConsultation}</span>
            <span className="text-[11px] text-slate-500">Doctors examining</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Inpatient Census</span>
            <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-indigo-900">{stats.admittedInpatientsCount}</span>
            <span className="text-[11px] text-slate-500">admitted beds</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
            <span>Bed Occupancy</span>
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-black text-slate-800">
              {stats.availableBeds} / {stats.totalBeds}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">Available</span>
          </div>
        </div>
      </div>

      {/* Primary Workflow Tabs: FIRST OPD THEN INPATIENT */}
      <div className="pt-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100/90 rounded-xl w-fit border border-slate-200">
          {/* TAB 1: OPD */}
          <button
            onClick={() => onMainTabChange('opd')}
            className={`px-5 py-2 rounded-lg font-black text-xs sm:text-sm tracking-wide transition flex items-center gap-2.5 ${
              mainTab === 'opd'
                ? 'bg-white text-teal-900 shadow-sm ring-1 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className={`p-1 rounded-md ${mainTab === 'opd' ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight font-black">1. OPD</div>
              <div className="text-[10px] font-medium opacity-80">Outpatient Clinic & Triage</div>
            </div>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
              mainTab === 'opd' ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {stats.opdTotalToday} Visits
            </span>
          </button>

          {/* TAB 2: INPATIENT */}
          <button
            onClick={() => onMainTabChange('inpatient')}
            className={`px-5 py-2 rounded-lg font-black text-xs sm:text-sm tracking-wide transition flex items-center gap-2.5 ${
              mainTab === 'inpatient'
                ? 'bg-white text-indigo-900 shadow-sm ring-1 ring-indigo-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className={`p-1 rounded-md ${mainTab === 'inpatient' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
              <BedDouble className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight font-black">2. INPATIENT</div>
              <div className="text-[10px] font-medium opacity-80">Wards, Bed Allocation & IPD</div>
            </div>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
              mainTab === 'inpatient' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {stats.admittedInpatientsCount} Admitted
            </span>
          </button>
        </div>

        {/* Secondary Sub-Tabs Strip */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {mainTab === 'opd' ? (
            <>
              <button
                onClick={() => onOpdSubTabChange('registration_checkin')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  opdSubTab === 'registration_checkin'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Patient Registration & Check-in</span>
              </button>

              <button
                onClick={() => onOpdSubTabChange('queue_station')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  opdSubTab === 'queue_station'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Queue & Entry Card Station</span>
                {stats.opdWaitingDoctor > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    opdSubTab === 'queue_station' ? 'bg-teal-700 text-white' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {stats.opdWaitingDoctor}
                  </span>
                )}
              </button>

              <button
                onClick={() => onOpdSubTabChange('pending_payments')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  opdSubTab === 'pending_payments'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Fee Collection & Cashiering</span>
                {pendingChargesCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    opdSubTab === 'pending_payments' ? 'bg-teal-700 text-white' : 'bg-red-200 text-red-900'
                  }`}>
                    {pendingChargesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onOpdSubTabChange('live_roster')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  opdSubTab === 'live_roster'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Live OPD Flow & Status Board</span>
              </button>

              <button
                onClick={() => onOpdSubTabChange('appointments')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  opdSubTab === 'appointments'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Scheduled Appointments</span>
                {todayAppointmentsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    opdSubTab === 'appointments' ? 'bg-teal-700 text-white' : 'bg-blue-200 text-blue-900'
                  }`}>
                    {todayAppointmentsCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onIpdSubTabChange('new_admission')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  ipdSubTab === 'new_admission'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Inpatient Admission</span>
              </button>

              <button
                onClick={() => onIpdSubTabChange('ward_bed_matrix')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  ipdSubTab === 'ward_bed_matrix'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Ward & Bed Allocation Matrix</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  ipdSubTab === 'ward_bed_matrix' ? 'bg-indigo-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {stats.availableBeds} free
                </span>
              </button>

              <button
                onClick={() => onIpdSubTabChange('active_inpatients')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  ipdSubTab === 'active_inpatients'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Active Inpatients Roster</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  ipdSubTab === 'active_inpatients' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-900'
                }`}>
                  {stats.admittedInpatientsCount}
                </span>
              </button>

              <button
                onClick={() => onIpdSubTabChange('deposits_billing')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  ipdSubTab === 'deposits_billing'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>IPD Deposits & Bed Charges</span>
              </button>

              <button
                onClick={() => onIpdSubTabChange('discharge_clearance')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  ipdSubTab === 'discharge_clearance'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Discharge Clearance & Gate Pass</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
