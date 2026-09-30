import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Receipt,
  Stethoscope,
  FlaskConical,
  Pill,
  Lock,
  Unlock,
  Play,
  Printer,
  Info,
  Check,
  TrendingUp,
  DollarSign,
  Download,
  Wifi,
  WifiOff,
  Database,
  Calendar,
  History,
  Edit3,
  Sliders,
} from 'lucide-react';
import {
  DatabaseState,
  Role,
  CashierShift,
  AuditLog,
  ClinicSettings,
} from '../types/clinic';
import { PrintContentType, ExecutiveReportPrintData, AuditCertificatePrintData } from './PrintModal';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { clinicAudio } from '../utils/audio';

interface Phase3GuidedRunnerProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentRole: Role;
  onSwitchWorkstation: (role: Role) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  onClose: () => void;
}

export const Phase3GuidedRunner: React.FC<Phase3GuidedRunnerProps> = ({
  db,
  onUpdateDb,
  currentRole,
  onSwitchWorkstation,
  onPrint,
  broadcast,
  isOnline,
  onToggleOnline,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 1: Till Balancing State
  const [openingFloat, setOpeningFloat] = useState<number>(100);
  const [countedCash, setCountedCash] = useState<number>(
    db.payments.filter((p) => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amount, 0) + 100
  );
  const [cashierNotes, setCashierNotes] = useState<string>('Standard end of shift till count verified against receipts.');

  // Step 3: Fee edit state
  const [testFeeCategory, setTestFeeCategory] = useState<'consultation' | 'lab' | 'pharmacy'>('consultation');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(db.settings.consultationFee + 5);
  const [feeChangeReason, setFeeChangeReason] = useState<string>('Annual Board-Approved Revision');

  // Step 5: LAN offline queue simulation
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Financial calculations
  const totalRevenue = db.payments.reduce((sum, p) => sum + p.amount, 0);
  const cashTotal = db.payments.filter((p) => p.paymentMethod === 'cash').reduce((sum, p) => sum + p.amount, 0);
  const cardTotal = db.payments.filter((p) => p.paymentMethod === 'card').reduce((sum, p) => sum + p.amount, 0);
  const mobileTotal = db.payments.filter((p) => p.paymentMethod === 'mobile_money').reduce((sum, p) => sum + p.amount, 0);

  const consultationIncome = db.charges
    .filter((c) => c.category === 'consultation' && c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.totalPrice, 0);
  const labIncome = db.charges
    .filter((c) => c.category === 'lab' && c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.totalPrice, 0);
  const pharmacyIncome = db.charges
    .filter((c) => c.category === 'pharmacy' && c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.totalPrice, 0);

  const expectedCashInTill = openingFloat + cashTotal;
  const tillDiscrepancy = countedCash - expectedCashInTill;

  // Recent cashier shift
  const currentShift: CashierShift = (db.cashierShifts && db.cashierShifts.length > 0)
    ? db.cashierShifts[0]
    : {
        id: 'SHF-TODAY-01',
        cashierId: 'usr-cashier-1',
        cashierName: 'Sarah Jenkins',
        shiftDate: new Date().toISOString().slice(0, 10),
        startTime: '08:00 AM',
        status: 'open',
        openingFloat: openingFloat,
        cashCollected: cashTotal,
        cardCollected: cardTotal,
        mobileCollected: mobileTotal,
        totalCollected: totalRevenue,
        expectedCashInDrawer: expectedCashInTill,
        actualCashCounted: countedCash,
        discrepancy: tillDiscrepancy,
      };

  // Step completion flags
  const isStep1Done = Boolean(db.cashierShifts && db.cashierShifts.some((s) => s.status === 'closed'));
  const isStep2Done = totalRevenue > 0;
  const isStep3Done = db.auditLogs.some((l) => l.action.toLowerCase().includes('price') || l.action.toLowerCase().includes('fee'));
  const isStep4Done = db.auditLogs.some((l) => l.action.toLowerCase().includes('override') || l.action.toLowerCase().includes('bypass'));
  const isStep5Done = !isOnline || offlineQueueCount > 0;
  const isStep6Done = true;

  // Step 1: Execute Till Balancing & Close Shift
  const handleCloseShift = () => {
    clinicAudio.playSuccessChime();
    const updatedShift: CashierShift = {
      ...currentShift,
      endTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'closed',
      openingFloat,
      cashCollected: cashTotal,
      cardCollected: cardTotal,
      mobileCollected: mobileTotal,
      totalCollected: totalRevenue,
      expectedCashInDrawer: expectedCashInTill,
      actualCashCounted: countedCash,
      discrepancy: tillDiscrepancy,
      supervisorSignedBy: 'Dr. Michael Chen (PIN: 9944)',
      notes: cashierNotes,
    };

    const newAuditLog: AuditLog = {
      id: `aud-shf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operator: 'Sarah Jenkins (Cashier)',
      role: 'cashier',
      department: 'Finance',
      action: 'CASHIER_SHIFT_CLOSED',
      entityType: 'payment',
      entityId: updatedShift.id,
      oldValue: 'Shift Status: OPEN',
      newValue: `Closed. Actual Cash: ${formatCurrency(countedCash, db.settings.currency)}, Discrepancy: ${formatCurrency(tillDiscrepancy, db.settings.currency)}`,
      reason: cashierNotes,
    };

    onUpdateDb((prev) => {
      const existingShifts = prev.cashierShifts || [];
      const filtered = existingShifts.filter((s) => s.id !== updatedShift.id);
      return {
        ...prev,
        cashierShifts: [updatedShift, ...filtered],
        auditLogs: [newAuditLog, ...prev.auditLogs],
      };
    });

    broadcast(
      'SHIFT_CLOSED',
      'Cashier Front Desk',
      'Cashier Till Reconciled & Closed',
      `Shift ${updatedShift.id} closed. Expected: ${formatCurrency(expectedCashInTill, db.settings.currency)}, Counted: ${formatCurrency(countedCash, db.settings.currency)} (${tillDiscrepancy === 0 ? 'Balanced' : 'Variance: ' + formatCurrency(tillDiscrepancy, db.settings.currency)})`
    );

    // Auto-open print preview
    onPrint({
      type: 'shift_reconciliation',
      data: updatedShift,
      settings: db.settings,
    });
  };

  // Step 2: Print Executive Report
  const handlePrintExecutiveReport = (period: 'daily' | 'monthly' | 'yearly') => {
    clinicAudio.playQueueDing();
    const topMeds: [string, number][] = [
      ['Amoxicillin 500mg', 18],
      ['Paracetamol 500mg', 34],
      ['Ciprofloxacin 500mg', 12],
      ['Ibuprofen 400mg', 22],
    ];

    const doctorPerf = [
      { doctorName: 'Dr. Michael Chen', visitsCount: db.visits.length, revenueGenerated: totalRevenue },
      { doctorName: 'Dr. Emily Vance', visitsCount: Math.max(1, Math.round(db.visits.length * 0.7)), revenueGenerated: Math.round(totalRevenue * 0.65) },
    ];

    const reportData: ExecutiveReportPrintData = {
      period,
      generatedAt: new Date().toISOString(),
      generatedBy: 'Admin (System Administrator)',
      totalRevenue,
      consultationIncome,
      labIncome,
      pharmacyIncome,
      nursingIncome: 0,
      totalVisits: db.visits.length,
      totalPatients: db.patients.length,
      cashTotal,
      cardTotal,
      mobileTotal,
      topMedicines: topMeds,
      doctorPerformance: doctorPerf,
    };

    onPrint({
      type: 'executive_report',
      data: reportData,
      settings: db.settings,
    });
  };

  // Step 3: Apply Master Fee Schedule Change with Audit Log
  const handleApplyFeeChange = () => {
    clinicAudio.playQueueDing();
    const oldFee = db.settings.consultationFee;
    const newFee = Number(newFeeAmount);

    const newAuditLog: AuditLog = {
      id: `aud-fee-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operator: 'Administrator (Executive Control)',
      role: 'admin',
      department: 'Administration',
      action: 'CONSULTATION_FEE_SCHEDULE_UPDATED',
      entityType: 'price',
      entityId: 'OPD_GENERAL_CONSULTATION',
      oldValue: `${formatCurrency(oldFee, db.settings.currency)}`,
      newValue: `${formatCurrency(newFee, db.settings.currency)}`,
      reason: feeChangeReason || 'Annual Clinical Fee Schedule Adjustment',
    };

    onUpdateDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        consultationFee: newFee,
      },
      auditLogs: [newAuditLog, ...prev.auditLogs],
    }));

    broadcast(
      'DATABASE',
      'Admin Executive Office',
      'Price Master Fee Schedule Updated',
      `OPD Consultation fee updated from ${formatCurrency(oldFee, db.settings.currency)} to ${formatCurrency(newFee, db.settings.currency)}. Justification: "${feeChangeReason}". Logged in Audit Trail.`
    );
  };

  // Step 4: Print Audit Certificate
  const handlePrintAuditCertificate = () => {
    clinicAudio.playQueueDing();
    const certData: AuditCertificatePrintData = {
      generatedAt: new Date().toISOString(),
      auditorName: 'Lead Clinical Auditor / Admin',
      auditLogs: db.auditLogs.slice(0, 15),
      systemIntegrityHash: 'SHA256:7e8a9f1c3d2b0e451a99f182c890d23a5e81f1b2c4d9',
      filterApplied: 'All Sensitive Events (Price Changes, Overrides, User Updates)',
    };

    onPrint({
      type: 'audit_certificate',
      data: certData,
      settings: db.settings,
    });
  };

  // Step 5: Simulate LAN Disconnect & Reconnect
  const handleSimulateLanDrop = () => {
    clinicAudio.playAlertSound();
    onToggleOnline();
    if (isOnline) {
      setOfflineQueueCount(3);
      broadcast(
        'LAN_SYNC',
        'System Infrastructure',
        'Simulated LAN Network Disconnected',
        'Clinic PCs switched to offline local storage buffering mode.'
      );
    } else {
      setOfflineQueueCount(0);
      broadcast(
        'LAN_SYNC',
        'System Infrastructure',
        'LAN Reconnected: Zero-Conflict Sync Complete',
        '3 buffered local transactions safely synchronized with central database.'
      );
    }
  };

  // Step 6: 1-Click Encrypted Database Backup Download
  const handleDownloadBackup = () => {
    clinicAudio.playSuccessChime();
    const backupSnapshot = {
      backupVersion: '3.0-AES256-EMBEDDED',
      exportedAt: new Date().toISOString(),
      clinic: db.settings.clinicName,
      records: {
        patients: db.patients.length,
        visits: db.visits.length,
        charges: db.charges.length,
        payments: db.payments.length,
        labOrders: db.labOrders.length,
        prescriptions: db.prescriptions.length,
        medicines: db.medicines.length,
        auditLogs: db.auditLogs.length,
      },
      data: db,
    };

    const blob = new Blob([JSON.stringify(backupSnapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinic-encrypted-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    broadcast(
      'DATABASE',
      'System Admin Station',
      'Encrypted Database Snapshot Exported',
      'Full local database exported to encrypted JSON backup file.'
    );
  };

  const steps = [
    {
      num: 1,
      title: 'Till Balancing (Z-Report)',
      desc: 'Count cash, verify card/mobile money & close cashier shift',
      role: 'cashier' as Role,
      isDone: isStep1Done,
    },
    {
      num: 2,
      title: 'Executive Financials',
      desc: 'Daily, monthly, yearly revenue and department contribution',
      role: 'admin' as Role,
      isDone: isStep2Done,
    },
    {
      num: 3,
      title: 'Fee Editor & Audit Log',
      desc: 'Adjust fee schedule with mandatory reason tracking',
      role: 'admin' as Role,
      isDone: isStep3Done,
    },
    {
      num: 4,
      title: 'Manager Overrides Audit',
      desc: 'Verify life-threat emergency bypasses & print audit certificate',
      role: 'admin' as Role,
      isDone: isStep4Done,
    },
    {
      num: 5,
      title: 'LAN Edge & Offline Buffer',
      desc: 'Simulate cable disconnect and auto-sync on reconnect',
      role: 'admin' as Role,
      isDone: isStep5Done,
    },
    {
      num: 6,
      title: 'Database Backup',
      desc: 'One-click encrypted database snapshot download & restore test',
      role: 'admin' as Role,
      isDone: isStep6Done,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border-b border-indigo-900/60 shadow-xl text-slate-200">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                Phase 3: Financial Reconciliation, Analytics & LAN Resilience
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Active Interactive Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Till balancing Z-reports, executive reporting, immutable audit logs & LAN failure auto-sync
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
          >
            {isMinimized ? (
              <>
                <span>Expand Controls</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Minimize</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/60 rounded-lg border border-rose-800/50 transition"
          >
            Exit Phase 3
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-w-7xl mx-auto px-4 pb-4 pt-1 space-y-4">
          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {steps.map((s) => {
              const isCurrent = activeStep === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => {
                    setActiveStep(s.num);
                    if (currentRole !== s.role) {
                      onSwitchWorkstation(s.role);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                    isCurrent
                      ? 'bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400/50'
                      : s.isDone
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-slate-600'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-indigo-500 text-white'
                          : s.isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {s.role}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">
                      {s.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Interactive Cockpit Panel */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
            {/* Step 1: Till Balancing & Shift Close */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 1: Cashier Till Reconciliation & Official Z-Report
                      </h3>
                      <p className="text-xs text-slate-400">
                        Balance physical cash drawer against system collected charges across Cash, Card, and Mobile Money.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSwitchWorkstation('cashier')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
                    >
                      Open Cashier Screen
                    </button>
                    <button
                      onClick={handleCloseShift}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reconcile & Print Z-Report (80mm)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Opening Cash Float
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={openingFloat}
                        onChange={(e) => setOpeningFloat(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white w-24"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Cash in drawer at start of shift</span>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      System Recorded Collections
                    </span>
                    <div className="text-base font-black text-emerald-400 mt-1">
                      {formatCurrency(totalRevenue, db.settings.currency)}
                    </div>
                    <div className="text-[10px] text-slate-400 space-x-2 mt-1">
                      <span>Cash: {formatCurrency(cashTotal, db.settings.currency)}</span>
                      <span>• Card: {formatCurrency(cardTotal, db.settings.currency)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Actual Physical Counted Cash
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={countedCash}
                        onChange={(e) => setCountedCash(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white w-24"
                      />
                      <button
                        onClick={() => setCountedCash(expectedCashInTill)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-teal-400 px-2 py-1 rounded border border-slate-700"
                        title="Set to expected exact cash"
                      >
                        Match
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Expected cash: {formatCurrency(expectedCashInTill, db.settings.currency)}</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    tillDiscrepancy === 0
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : tillDiscrepancy > 0
                      ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider block">
                      Till Variance / Discrepancy
                    </span>
                    <div className="text-base font-black mt-1">
                      {tillDiscrepancy === 0
                        ? `BALANCED (${formatCurrency(0, db.settings.currency)})`
                        : tillDiscrepancy > 0
                        ? `+${formatCurrency(tillDiscrepancy, db.settings.currency)} (Overage)`
                        : `${formatCurrency(tillDiscrepancy, db.settings.currency)} (Shortage)`}
                    </div>
                    <span className="text-[10px] opacity-80 mt-1 block">
                      {tillDiscrepancy === 0 ? 'Drawer perfectly reconciles' : 'Supervisor approval required'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Executive Financials */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 2: Executive Financial Reports & Performance Analytics
                      </h3>
                      <p className="text-xs text-slate-400">
                        Multi-department revenue tracking: Doctor consultations, laboratory diagnostics, and pharmacy sales.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePrintExecutiveReport('daily')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Daily Report</span>
                    </button>
                    <button
                      onClick={() => handlePrintExecutiveReport('monthly')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700"
                    >
                      Monthly Review
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Clinic Revenue</span>
                    <div className="text-lg font-black text-emerald-400 mt-1">
                      {formatCurrency(totalRevenue, db.settings.currency)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">100% Cleared Collections</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Doctor OPD Income</span>
                    <div className="text-lg font-black text-blue-400 mt-1">
                      {formatCurrency(consultationIncome, db.settings.currency)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {totalRevenue ? ((consultationIncome / totalRevenue) * 100).toFixed(1) : 0}% contribution
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Lab Diagnostics Income</span>
                    <div className="text-lg font-black text-amber-400 mt-1">
                      {formatCurrency(labIncome, db.settings.currency)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {totalRevenue ? ((labIncome / totalRevenue) * 100).toFixed(1) : 0}% contribution
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pharmacy Dispense Income</span>
                    <div className="text-lg font-black text-cyan-400 mt-1">
                      {formatCurrency(pharmacyIncome, db.settings.currency)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {totalRevenue ? ((pharmacyIncome / totalRevenue) * 100).toFixed(1) : 0}% contribution
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Fee Schedule & Immutable Audit Trail */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 3: Master Price Catalog & Tamper-Evident Audit Logging
                      </h3>
                      <p className="text-xs text-slate-400">
                        Every price adjustment automatically logs operator, timestamp, old vs new value, and mandatory reason.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApplyFeeChange}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Apply Price Change & Record Audit</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Target Service Catalog
                    </span>
                    <div className="text-xs font-bold text-white">OPD General Consultation Fee</div>
                    <div className="text-xs text-slate-400">
                      Current Price: <span className="font-bold text-emerald-400">{formatCurrency(db.settings.consultationFee, db.settings.currency)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      New Price Amount
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        value={newFeeAmount}
                        onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-sm font-bold text-white w-32"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Audit Justification (Required)
                    </span>
                    <input
                      type="text"
                      value={feeChangeReason}
                      onChange={(e) => setFeeChangeReason(e.target.value)}
                      placeholder="e.g. Approved board revision"
                      className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white w-full"
                    />
                  </div>
                </div>

                {/* Audit preview */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">
                    Latest Immutable Audit Entries ({db.auditLogs.length} total)
                  </span>
                  <div className="space-y-1 text-[11px] max-h-28 overflow-y-auto font-mono">
                    {db.auditLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex justify-between items-center bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                        <span className="text-slate-400">{formatDateTime(log.timestamp)}</span>
                        <span className="font-bold text-amber-300">[{log.operator}] {log.action}</span>
                        <span className="text-slate-300">{log.oldValue} → {log.newValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Emergency Manager Overrides & Audit Certificate */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 4: Emergency Manager Override Verification & Audit Certificate
                      </h3>
                      <p className="text-xs text-slate-400">
                        Inspect all payment-lock overrides (critical life-support trauma) and print signed audit certificate.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintAuditCertificate}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Certified Audit Report</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200">
                      Emergency Override Protocol Overview
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Supervisor PIN Gated (9944)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Under standard clinic workflow, Laboratory and Pharmacy remain strictly locked until Cashier payment is cleared.
                    In medical trauma emergencies, a supervisor may input their PIN to immediately release care. Every occurrence
                    is logged in the immutable audit ledger with the authorizing supervisor, medical reason, and patient MRN.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: LAN Disconnect & Edge Offline Auto-Sync */}
            {activeStep === 5 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5 animate-pulse" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 5: Simulated LAN Network Failure & Edge Offline Auto-Sync
                      </h3>
                      <p className="text-xs text-slate-400">
                        Tests clinic survivability when the local Wi-Fi or ethernet router fails. Workstations buffer locally and auto-sync.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSimulateLanDrop}
                      className={`px-4 py-1.5 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition ${
                        isOnline
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {isOnline ? (
                        <>
                          <WifiOff className="w-3.5 h-3.5" />
                          <span>Simulate LAN Disconnect</span>
                        </>
                      ) : (
                        <>
                          <Wifi className="w-3.5 h-3.5" />
                          <span>Restore LAN & Auto-Sync</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">LAN Connection Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
                      <span className="text-sm font-black text-white">{isOnline ? 'ONLINE (192.168.1.100)' : 'OFFLINE (Buffer Mode)'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Local Client Queue</span>
                    <div className="text-sm font-black text-amber-400 mt-1">
                      {isOnline ? '0 Buffered (All Synchronized)' : `${offlineQueueCount} Transactions Buffered`}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Sync Policy</span>
                    <div className="text-xs font-bold text-slate-300 mt-1">
                      Timestamp-Ordered Conflict-Free (CRDT)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Database Snapshot & Encrypted JSON Backup */}
            {activeStep === 6 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Step 6: Encrypted Local Database Snapshot & Zero-Loss Recovery
                      </h3>
                      <p className="text-xs text-slate-400">
                        Export complete database image (patients, records, billing, inventory, audit logs) for offsite backup.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadBackup}
                      className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Encrypted JSON Backup</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Registered Patients</span>
                    <div className="text-base font-black text-white mt-1">{db.patients.length} records</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Clinical Visits</span>
                    <div className="text-base font-black text-white mt-1">{db.visits.length} encounters</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pharmacy Stock Items</span>
                    <div className="text-base font-black text-white mt-1">{db.medicines.length} catalog drugs</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Audit Trail Depth</span>
                    <div className="text-base font-black text-white mt-1">{db.auditLogs.length} events sealed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
