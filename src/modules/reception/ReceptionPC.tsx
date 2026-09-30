import React, { useState } from 'react';
import {
  DatabaseState,
  User as ClinicUser,
  Visit,
  InpatientAdmission,
  Bed,
  CashierShift,
} from '../../types/clinic';
import { PrintContentType } from '../../components/PrintModal';
import { ReceptionMainTab, OpdSubTab, InpatientSubTab, ReceptionStats } from './types';
import { ReceptionHeader } from './ReceptionHeader';
import { OpdRegistrationTab } from './OpdRegistrationTab';
import { OpdQueueStationTab } from './OpdQueueStationTab';
import { OpdPendingPaymentsTab } from './OpdPendingPaymentsTab';
import { OpdLiveRosterTab } from './OpdLiveRosterTab';
import { OpdAppointmentsTab } from './OpdAppointmentsTab';
import { InpatientAdmissionTab } from './InpatientAdmissionTab';
import { InpatientWardBedMatrixTab } from './InpatientWardBedMatrixTab';
import { InpatientRosterTab } from './InpatientRosterTab';
import { InpatientBillingTab } from './InpatientBillingTab';
import { InpatientDischargeTab } from './InpatientDischargeTab';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Coins, Lock, CheckCircle2, ShieldAlert, Sparkles, X, RotateCcw } from 'lucide-react';

interface ReceptionPCProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const ReceptionPC: React.FC<ReceptionPCProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
}) => {
  // Top Tab Flow: First OPD, Then INPATIENT
  const [mainTab, setMainTab] = useState<ReceptionMainTab>('opd');
  const [opdSubTab, setOpdSubTab] = useState<OpdSubTab>('registration_checkin');
  const [ipdSubTab, setIpdSubTab] = useState<InpatientSubTab>('new_admission');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Till & Shift balancing modal state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(1000.0);
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [isCashCountedInitialized, setIsCashCountedInitialized] = useState<boolean>(false);
  const [supervisorPin, setSupervisorPin] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [isShiftClosing, setIsShiftClosing] = useState<boolean>(false);

  // Preselected patient for discharge
  const [targetDischargeAdmissionId, setTargetDischargeAdmissionId] = useState<string | undefined>();

  // Calculate live stats
  const opdTotalToday = db.visits.length;
  const opdWaitingDoctor = db.visits.filter(
    (v) => v.status === 'waiting_doctor' || v.status === 'registered'
  ).length;
  const opdInConsultation = db.visits.filter((v) => v.status === 'in_consultation').length;
  const opdCompleted = db.visits.filter(
    (v) => v.status === 'completed' || v.status === 'discharged'
  ).length;

  const totalBeds = db.beds?.length || 18;
  const occupiedBeds = (db.beds || []).filter((b) => b.status === 'occupied').length;
  const availableBeds = (db.beds || []).filter((b) => b.status === 'available').length;
  const admittedInpatientsCount = (db.admissions || []).filter(
    (a) => a.status === 'admitted' || a.status === 'transferred'
  ).length;

  // Payments collected today
  const todayCollectionsEtb = db.payments.reduce((sum, p) => sum + p.amount, 0);

  const stats: ReceptionStats = {
    opdTotalToday,
    opdWaitingDoctor,
    opdInConsultation,
    opdCompleted,
    totalBeds,
    occupiedBeds,
    availableBeds,
    admittedInpatientsCount,
    todayCollectionsEtb,
  };

  const pendingChargesCount = db.charges.filter((c) => c.paymentStatus === 'pending').length;
  const todayAppointmentsCount = (db.appointments || []).filter((a) => a.status === 'confirmed').length;

  // Cashier Shift calculations
  const cashierPaymentsToday = db.payments.filter(
    (p) =>
      p.receivedBy.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      p.receivedBy.toLowerCase().includes('elena')
  );
  const cashTotal = cashierPaymentsToday
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((s, p) => s + p.amount, 0);
  const cardTotal = cashierPaymentsToday
    .filter((p) => p.paymentMethod === 'card')
    .reduce((s, p) => s + p.amount, 0);
  const mobileTotal = cashierPaymentsToday
    .filter((p) => p.paymentMethod === 'mobile_money')
    .reduce((s, p) => s + p.amount, 0);

  const expectedCashInDrawer = openingFloat + cashTotal;
  const discrepancy = actualCashCounted - expectedCashInDrawer;

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorPin !== db.settings.emergencyOverridePin && supervisorPin !== '9944') {
      alert('Invalid supervisor PIN! Verification requires supervisor authority (Default PIN: 9944).');
      return;
    }

    const newShift: CashierShift = {
      id: `shift_${Date.now()}`,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      shiftDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'closed',
      openingFloat,
      cashCollected: cashTotal,
      cardCollected: cardTotal,
      mobileCollected: mobileTotal,
      totalCollected: cashTotal + cardTotal + mobileTotal,
      expectedCashInDrawer,
      actualCashCounted,
      discrepancy,
      closedBy: currentUser.name,
      supervisorSignedBy: 'Marcus Vance (Superintendent)',
      notes: shiftNotes || 'Reception front-desk shift balancing verified without incident.',
    };

    onUpdateDb((prev) => ({
      ...prev,
      cashierShifts: [newShift, ...(prev.cashierShifts || [])],
    }));

    broadcast(
      'SHIFT_CLOSED',
      'Reception PC',
      'Shift Balancing Signed Off',
      `Shift closed by ${currentUser.name}. Total: ${formatCurrency(newShift.totalCollected, db.settings.currency)}. Variance: ${formatCurrency(discrepancy, db.settings.currency)}.`
    );

    onPrint({
      type: 'shift_reconciliation',
      data: newShift,
      settings: db.settings,
    });

    setIsShiftClosing(false);
    setIsShiftModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Reception Header & Primary Tabs (first OPD then INPATIENT) */}
      <ReceptionHeader
        mainTab={mainTab}
        onMainTabChange={(tab) => setMainTab(tab)}
        opdSubTab={opdSubTab}
        onOpdSubTabChange={(sub) => setOpdSubTab(sub)}
        ipdSubTab={ipdSubTab}
        onIpdSubTabChange={(sub) => setIpdSubTab(sub)}
        stats={stats}
        currency={db.settings.currency}
        searchQuery={globalSearch}
        onSearchChange={(q) => setGlobalSearch(q)}
        onQuickWalkIn={() => {
          setMainTab('opd');
          setOpdSubTab('registration_checkin');
        }}
        onQuickAdmission={() => {
          setMainTab('inpatient');
          setIpdSubTab('new_admission');
        }}
        onOpenShiftTill={() => {
          if (!isCashCountedInitialized) {
            setActualCashCounted(expectedCashInDrawer);
            setIsCashCountedInitialized(true);
          }
          setIsShiftModalOpen(true);
        }}
        pendingChargesCount={pendingChargesCount}
        todayAppointmentsCount={todayAppointmentsCount}
      />

      {/* WORKFLOW VIEW 1: OPD (OUTPATIENT DEPARTMENT) */}
      {mainTab === 'opd' && (
        <div className="space-y-6">
          {opdSubTab === 'registration_checkin' && (
            <OpdRegistrationTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
              onNavigateToQueue={() => setOpdSubTab('queue_station')}
            />
          )}

          {opdSubTab === 'queue_station' && (
            <OpdQueueStationTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
            />
          )}

          {opdSubTab === 'pending_payments' && (
            <OpdPendingPaymentsTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              onOpenOverride={onOpenOverride}
              broadcast={broadcast}
            />
          )}

          {opdSubTab === 'live_roster' && (
            <OpdLiveRosterTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
            />
          )}

          {opdSubTab === 'appointments' && (
            <OpdAppointmentsTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
            />
          )}
        </div>
      )}

      {/* WORKFLOW VIEW 2: INPATIENT (WARDS, ADMISSIONS & BED BOARD) */}
      {mainTab === 'inpatient' && (
        <div className="space-y-6">
          {ipdSubTab === 'new_admission' && (
            <InpatientAdmissionTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
              onNavigateToBedMatrix={() => setIpdSubTab('ward_bed_matrix')}
            />
          )}

          {ipdSubTab === 'ward_bed_matrix' && (
            <InpatientWardBedMatrixTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
              onAdmitToBed={(bed) => {
                setIpdSubTab('new_admission');
              }}
            />
          )}

          {ipdSubTab === 'active_inpatients' && (
            <InpatientRosterTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              onNavigateToDischarge={(admission) => {
                setTargetDischargeAdmissionId(admission.id);
                setIpdSubTab('discharge_clearance');
              }}
            />
          )}

          {ipdSubTab === 'deposits_billing' && (
            <InpatientBillingTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
            />
          )}

          {ipdSubTab === 'discharge_clearance' && (
            <InpatientDischargeTab
              db={db}
              onUpdateDb={onUpdateDb}
              currentUser={currentUser}
              onPrint={onPrint}
              broadcast={broadcast}
              preselectedAdmissionId={targetDischargeAdmissionId}
            />
          )}
        </div>
      )}

      {/* Shift Till Balancing & Audit Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Shift Till Summary & Cash Drawer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Opening Float</span>
                  <div className="font-mono font-bold text-slate-800">
                    {formatCurrency(openingFloat, db.settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Cash Collected</span>
                  <div className="font-mono font-bold text-emerald-700">
                    {formatCurrency(cashTotal, db.settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mobile / Telebirr</span>
                  <div className="font-mono font-bold text-slate-800">
                    {formatCurrency(mobileTotal, db.settings.currency)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">POS / Card</span>
                  <div className="font-mono font-bold text-slate-800">
                    {formatCurrency(cardTotal, db.settings.currency)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Expected Physical Cash in Till
                  </span>
                  <div className="text-xl font-black text-emerald-950 font-mono">
                    {formatCurrency(expectedCashInDrawer, db.settings.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Active Operator</span>
                  <div className="font-bold text-slate-800">{currentUser.name}</div>
                </div>
              </div>

              {isShiftClosing ? (
                <form onSubmit={handleCloseShift} className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Physical Cash Counted *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={actualCashCounted}
                        onChange={(e) => setActualCashCounted(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 font-mono font-bold text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Supervisor PIN *</label>
                      <input
                        type="password"
                        required
                        placeholder="PIN (9944)"
                        value={supervisorPin}
                        onChange={(e) => setSupervisorPin(e.target.value)}
                        className="w-full px-3 py-1.5 font-mono text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="text-xs flex justify-between items-center font-bold px-1">
                    <span className="text-slate-600">Calculated Variance:</span>
                    <span className={discrepancy === 0 ? 'text-emerald-700' : 'text-red-600 font-mono'}>
                      {formatCurrency(discrepancy, db.settings.currency)}{' '}
                      {discrepancy === 0 ? '(Balanced)' : discrepancy > 0 ? '(Over)' : '(Short)'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shift Close Notes</label>
                    <input
                      type="text"
                      placeholder="Remarks on discrepancy, handover details..."
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsShiftClosing(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-md transition"
                    >
                      Sign-Off & Close Shift
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Till open and actively recording front desk transactions.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActualCashCounted(expectedCashInDrawer);
                      setIsShiftClosing(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Balance Till & Close Shift</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
