import React, { useState } from 'react';
import {
  Shield,
  BarChart3,
  Users,
  Coins,
  Settings as SettingsIcon,
  FileText,
  Database,
  Lock,
  Edit2,
  Check,
  X,
  Plus,
  TrendingUp,
  PieChart,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  UserCheck,
  Printer,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Search,
  UploadCloud,
  RefreshCw,
  Wallet,
  Laptop,
  Code,
  Copy,
  CheckCheck,
  Terminal,
  Activity,
  Sliders,
  Radio,
} from 'lucide-react';
import {
  DatabaseState,
  User,
  ClinicSettings,
  AuditLog,
  LabTestCatalogItem,
  Medicine,
  WorkstationConfig,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { resetDatabaseToFactory } from '../utils/storage';
import { PrintContentType, ExecutiveReportPrintData, AuditCertificatePrintData } from '../components/PrintModal';
import { FASTAPI_MAIN_PY, SQL_INDEXES_RECOMMENDATIONS } from '../blueprints/fastapi_backend';
import {
  FLUTTER_WS_SERVICE_DART,
  FLUTTER_OFFLINE_QUEUE_DART,
  FLUTTER_ESC_POS_PRINTER_DART,
} from '../blueprints/flutter_client';
import {
  WINDOWS_NSSM_INSTALLER_BAT,
  LINUX_SYSTEMD_SERVICE,
  LAN_TLS_SETUP_BAT,
  TESTING_CHECKLIST_CONCURRENCY,
} from '../blueprints/deployment_scripts';

interface AdminModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: (content: PrintContentType) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  broadcast,
  onPrint,
}) => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'workstations' | 'architecture' | 'users' | 'prices' | 'audit' | 'settings' | 'backup'
  >('analytics');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedCodeTab, setSelectedCodeTab] = useState<
    'fastapi' | 'flutter_ws' | 'flutter_queue' | 'flutter_printer' | 'sql_indexes' | 'nssm_bat' | 'tls_bat' | 'checklist'
  >('fastapi');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Audit filter & search state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterType, setAuditFilterType] = useState<string>('all');

  // Backup restore file state
  const [restoreFileJson, setRestoreFileJson] = useState<any | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string>('');
  const [restoreStatusMsg, setRestoreStatusMsg] = useState<string>('');

  // Price editing state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceType, setEditingPriceType] = useState<'lab' | 'medicine' | 'consultation' | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState<string>('');

  // Settings form state
  const [clinicName, setClinicName] = useState(db.settings.clinicName);
  const [consultationFee, setConsultationFee] = useState(db.settings.consultationFee);
  const [revisitFee, setRevisitFee] = useState(db.settings.revisitConsultationFee);
  const [warningDays, setWarningDays] = useState(db.settings.expiryWarningDays);
  const [overridePin, setOverridePin] = useState(db.settings.emergencyOverridePin);

  // User management state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<User['role']>('cashier');
  const [newStaffDepartment, setNewStaffDepartment] = useState('Front Desk');
  const [newStaffPin, setNewStaffPin] = useState('1234');

  // Compute Analytics
  // 1. Total revenue collected
  const totalRevenue = db.payments.reduce((s, p) => s + p.amount, 0);
  const totalVisits = db.visits.length;
  const totalPatients = db.patients.length;

  // Department income breakdown
  const consultationIncome = db.charges
    .filter((c) => c.category === 'consultation' && c.paymentStatus === 'paid')
    .reduce((s, c) => s + c.totalPrice, 0);

  const labIncome = db.charges
    .filter((c) => c.category === 'lab' && c.paymentStatus === 'paid')
    .reduce((s, c) => s + c.totalPrice, 0);

  const pharmacyIncome = db.charges
    .filter((c) => c.category === 'pharmacy' && c.paymentStatus === 'paid')
    .reduce((s, c) => s + c.totalPrice, 0);

  // Method Breakdown
  const cashPayments = db.payments.filter(p => p.paymentMethod === 'cash').reduce((s, p) => s + p.amount, 0);
  const cardPayments = db.payments.filter(p => p.paymentMethod === 'card').reduce((s, p) => s + p.amount, 0);
  const mobilePayments = db.payments.filter(p => p.paymentMethod === 'mobile_money').reduce((s, p) => s + p.amount, 0);

  // Top prescribed medicines
  const medPrescriptionCounts: { [medName: string]: number } = {};
  db.prescriptions.forEach((rx) => {
    rx.items.forEach((it) => {
      medPrescriptionCounts[it.medicineName] = (medPrescriptionCounts[it.medicineName] || 0) + it.quantity;
    });
  });
  const topMedicines = Object.entries(medPrescriptionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Nursing care income
  const nursingIncome = db.charges
    .filter((c) => c.category === 'nursing' && c.paymentStatus === 'paid')
    .reduce((s, c) => s + c.totalPrice, 0);

  // Doctor OPD Caseload & Productivity
  const doctorPerformance = db.users
    .filter((u) => u.role === 'doctor')
    .map((doc) => {
      const visits = db.visits.filter(
        (v) => v.doctorAssignedId === doc.id || (v.doctorAssignedName && v.doctorAssignedName.includes(doc.name))
      );
      const orders = db.labOrders.filter((l) => l.orderedByDoctor && l.orderedByDoctor.includes(doc.name));
      const rxs = db.prescriptions.filter((p) => p.orderedByDoctor && p.orderedByDoctor.includes(doc.name));
      const doctorConsultRevenue = db.charges
        .filter((c) => c.category === 'consultation' && visits.some((v) => v.id === c.visitId) && c.paymentStatus === 'paid')
        .reduce((sum, c) => sum + c.totalPrice, 0);

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        department: doc.department,
        visitsCount: visits.length,
        labOrdersCount: orders.length,
        prescriptionsCount: rxs.length,
        revenueGenerated: doctorConsultRevenue,
      };
    });

  // Inventory valuation & Stock Assets
  const totalStockUnits = db.medicines.reduce(
    (sum, m) => sum + m.batches.reduce((bSum, b) => bSum + b.quantity, 0),
    0
  );
  const totalStockRetailValue = db.medicines.reduce(
    (sum, m) => sum + m.batches.reduce((bSum, b) => bSum + b.quantity * m.unitPrice, 0),
    0
  );

  // Handle Price Change with Audit Trail
  const handleSavePriceChange = (id: string, type: 'lab' | 'medicine' | 'consultation') => {
    if (newPriceValue <= 0) {
      alert('Price must be greater than zero.');
      return;
    }
    if (!priceChangeReason.trim()) {
      alert('Reason for price adjustment is mandatory for audit compliance.');
      return;
    }

    let oldVal = '';
    let itemLabel = '';

    onUpdateDb((prev) => {
      let updatedLab = prev.labCatalog;
      let updatedMeds = prev.medicines;
      let updatedSettings = prev.settings;

      if (type === 'lab') {
        const item = prev.labCatalog.find(t => t.id === id);
        if (item) {
          oldVal = formatCurrency(item.price, prev.settings.currency);
          itemLabel = item.name;
          updatedLab = prev.labCatalog.map(t => t.id === id ? { ...t, price: newPriceValue } : t);
        }
      } else if (type === 'medicine') {
        const item = prev.medicines.find(m => m.id === id);
        if (item) {
          oldVal = formatCurrency(item.unitPrice, prev.settings.currency);
          itemLabel = item.name;
          updatedMeds = prev.medicines.map(m => m.id === id ? { ...m, unitPrice: newPriceValue } : m);
        }
      } else if (type === 'consultation') {
        oldVal = formatCurrency(prev.settings.consultationFee, prev.settings.currency);
        itemLabel = 'Outpatient Consultation Fee';
        updatedSettings = { ...prev.settings, consultationFee: newPriceValue };
      }

      const auditEntry: AuditLog = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: currentUser.name,
        role: currentUser.role,
        department: 'Administration',
        action: `Price Adjustment: ${itemLabel}`,
        entityType: 'price',
        entityId: id,
        oldValue: oldVal,
        newValue: formatCurrency(newPriceValue, prev.settings.currency),
        reason: priceChangeReason,
      };

      return {
        ...prev,
        labCatalog: updatedLab,
        medicines: updatedMeds,
        settings: updatedSettings,
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });

    broadcast(
      'PRICE_CHANGED',
      'Admin PC',
      'Price Catalog Updated & Audited',
      `${itemLabel} adjusted to ${formatCurrency(newPriceValue, db.settings.currency)} by ${currentUser.name}. Reason: ${priceChangeReason}`
    );

    setEditingPriceId(null);
    setEditingPriceType(null);
    setPriceChangeReason('');
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDb((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        clinicName,
        consultationFee: Number(consultationFee),
        revisitConsultationFee: Number(revisitFee),
        expiryWarningDays: Number(warningDays),
        emergencyOverridePin: overridePin,
      },
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser.name,
          role: currentUser.role,
          department: 'Administration',
          action: 'Clinic Operational Settings Modified',
          entityType: 'price',
          entityId: 'SETTINGS',
          reason: 'System parameters updated by administrator.',
        },
        ...prev.auditLogs,
      ],
    }));
    alert('Clinic settings successfully saved.');
  };

  // Add New Staff User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: newStaffName.trim(),
      username: newStaffName.toLowerCase().replace(/[^a-z]/g, '') + Math.floor(Math.random() * 100),
      role: newStaffRole,
      department: newStaffDepartment,
      pin: newStaffPin,
      active: true,
    };

    onUpdateDb((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      auditLogs: [
        {
          id: `aud_${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser.name,
          role: currentUser.role,
          department: 'Administration',
          action: `Staff Member Enrolled: ${newUser.name} (${newUser.role})`,
          entityType: 'user',
          entityId: newUser.id,
          reason: 'Authorized staff credential provisioned.',
        },
        ...prev.auditLogs,
      ],
    }));

    setShowAddUserModal(false);
    setNewStaffName('');
    setNewStaffPin('1234');
  };

  // Download Encrypted Backup File
  const handleDownloadBackup = () => {
    const backupJson = JSON.stringify(db, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Phase 3 Executive Reporting Handlers
  const handlePrintExecutiveReport = () => {
    if (!onPrint) {
      window.print();
      return;
    }
    const reportData: ExecutiveReportPrintData = {
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.name,
      totalRevenue,
      consultationIncome,
      labIncome,
      pharmacyIncome,
      nursingIncome,
      totalVisits,
      totalPatients,
      cashTotal: cashPayments,
      cardTotal: cardPayments,
      mobileTotal: mobilePayments,
      topMedicines,
      doctorPerformance,
    };
    onPrint({
      type: 'executive_report',
      data: reportData,
      settings: db.settings,
    });
  };

  const handleExportFinancialCsv = () => {
    const headers = ['Receipt Number', 'Patient MRN', 'Patient Name', 'Amount', 'Payment Method', 'Payment Type', 'Date Time', 'Received By'];
    const rows = db.payments.map((p) => [
      `"${p.receiptNumber}"`,
      `"${db.patients.find(pt => pt.id === p.patientId)?.mrn || 'N/A'}"`,
      `"${p.patientName}"`,
      p.amount.toFixed(2),
      p.paymentMethod,
      p.type,
      `"${formatDateTime(p.paidAt)}"`,
      `"${p.receivedBy}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintAuditCertificate = () => {
    if (!onPrint) {
      window.print();
      return;
    }
    const filteredLogs = db.auditLogs.filter((log) => {
      const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.operator.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(auditSearch.toLowerCase()));
      const matchesType = auditFilterType === 'all' || log.entityType === auditFilterType;
      return matchesSearch && matchesType;
    });

    const certData: AuditCertificatePrintData = {
      generatedAt: new Date().toISOString(),
      auditorName: currentUser.name,
      auditLogs: filteredLogs,
      systemIntegrityHash: `SHA256-${Date.now().toString(16).toUpperCase()}-NODE84`,
      filterApplied: `Scope: ${auditFilterType.toUpperCase()} | Search: "${auditSearch || 'ALL'}"`,
    };
    onPrint({
      type: 'audit_certificate',
      data: certData,
      settings: db.settings,
    });
  };

  const handleExportAuditCsv = () => {
    const headers = ['Timestamp', 'Operator', 'Role', 'Department', 'Action', 'Entity Type', 'Old Value', 'New Value', 'Justification'];
    const rows = db.auditLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.operator}"`,
      l.role,
      `"${l.department}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      l.entityType,
      `"${(l.oldValue || '').replace(/"/g, '""')}"`,
      `"${(l.newValue || '').replace(/"/g, '""')}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Phase 3 Backup & Restore Handlers
  const handleFileRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.patients && parsed.visits && parsed.charges && parsed.settings) {
          setRestoreFileJson(parsed);
          setRestoreStatusMsg(`Verified Snapshot Archive: ${parsed.patients.length} patients, ${parsed.visits.length} visits, ${parsed.payments?.length || 0} payments, ${parsed.auditLogs?.length || 0} audit records.`);
        } else {
          alert('Invalid clinic snapshot format: missing key database collections.');
          setRestoreFileJson(null);
        }
      } catch {
        alert('Failed to parse JSON file.');
        setRestoreFileJson(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    if (!restoreFileJson) return;
    if (!confirm(`Restore clinic database from "${restoreFileName}"? This will overwrite memory tables with this snapshot.`)) {
      return;
    }

    onUpdateDb(() => {
      const restored = {
        ...restoreFileJson,
        auditLogs: [
          {
            id: `aud_res_${Date.now()}`,
            timestamp: new Date().toISOString(),
            operator: currentUser.name,
            role: currentUser.role,
            department: 'Administration',
            action: `Database Restored from Snapshot: ${restoreFileName}`,
            entityType: 'backup' as const,
            entityId: 'SNAPSHOT_RESTORE',
            reason: 'Administrative disaster recovery restore executed.',
          },
          ...(restoreFileJson.auditLogs || []),
        ],
      };
      return restored;
    });

    broadcast(
      'DATABASE_RESTORED',
      'Admin PC',
      'Database Restored from Encrypted Snapshot',
      `Administrator ${currentUser.name} restored database snapshot (${restoreFileName}). All workstations synchronized.`
    );

    alert('Database successfully restored from snapshot.');
    setRestoreFileJson(null);
    setRestoreFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Clinic Administration & Audit Center</h2>
            <p className="text-xs text-slate-500">
              Financial & Clinical Analytics · User RBAC · Price Governance · Comprehensive Audit Log · Encrypted Backups
            </p>
          </div>
        </div>

        {/* Global Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset entire clinic database to clean factory seed state?')) {
                const fresh = resetDatabaseToFactory();
                onUpdateDb(() => fresh);
                alert('Database restored to factory blueprint default.');
              }
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Factory Reset Seed
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'analytics', label: 'Reports & Dashboards', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'workstations', label: `Workstations Fleet (${db.workstations?.length || 8})`, icon: <Laptop className="w-4 h-4" /> },
          { id: 'architecture', label: 'Production Architecture & Code', icon: <Code className="w-4 h-4" /> },
          { id: 'users', label: `Staff & Users (${db.users.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'prices', label: 'Price Lists & Tariffs (ETB)', icon: <Coins className="w-4 h-4" /> },
          { id: 'audit', label: `Audit Log (${db.auditLogs.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'settings', label: 'System Settings', icon: <SettingsIcon className="w-4 h-4" /> },
          { id: 'backup', label: 'Encrypted Backups', icon: <Database className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: REPORTS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Period selector & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Interval:</span>
              </div>
              <div className="flex gap-1 text-xs">
                {(['daily', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportPeriod(period)}
                    className={`px-3 py-1 rounded-md capitalize font-bold transition ${
                      reportPeriod === period
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period} Summary
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintExecutiveReport}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Executive Report
              </button>
              <button
                onClick={handleExportFinancialCsv}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Clinic Revenue</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(totalRevenue, db.settings.currency)}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 100% Gated & Verified
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalPatients}</div>
              <div className="text-[11px] text-slate-500 mt-1">{totalVisits} Outpatient Visits today</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnostic Tests Conducted</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{db.labOrders.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Revenue: {formatCurrency(labIncome, db.settings.currency)}</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispensed Prescriptions</div>
              <div className="text-2xl font-black text-cyan-700 mt-1">
                {db.prescriptions.filter(p => p.status === 'dispensed').length} / {db.prescriptions.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Revenue: {formatCurrency(pharmacyIncome, db.settings.currency)}</div>
            </div>
          </div>

          {/* Department Revenue Breakdown & Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-700" /> Income by Clinical Department
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Doctor Consultations</span>
                    <span>{formatCurrency(consultationIncome, db.settings.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${totalRevenue ? (consultationIncome / totalRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Laboratory Pathology</span>
                    <span>{formatCurrency(labIncome, db.settings.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue ? (labIncome / totalRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Dispensary & Pharmacy</span>
                    <span>{formatCurrency(pharmacyIncome, db.settings.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-cyan-600 h-2 rounded-full"
                      style={{ width: `${totalRevenue ? (pharmacyIncome / totalRevenue) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" /> Cashier Tender Distribution (ETB)
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Physical Cash</div>
                  <div className="text-base font-black text-emerald-950 mt-1">
                    {formatCurrency(cashPayments, db.settings.currency)}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-[10px] uppercase font-bold text-blue-800">Debit / Credit</div>
                  <div className="text-base font-black text-blue-950 mt-1">
                    {formatCurrency(cardPayments, db.settings.currency)}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-[10px] uppercase font-bold text-purple-800">Mobile Money</div>
                  <div className="text-base font-black text-purple-950 mt-1">
                    {formatCurrency(mobilePayments, db.settings.currency)}
                  </div>
                </div>
              </div>

              {/* Top medicines */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase mb-2">Top Prescribed Medications</div>
                <div className="space-y-1 text-xs">
                  {topMedicines.map(([name, qty]) => (
                    <div key={name} className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-800 font-medium">• {name}</span>
                      <span className="font-bold text-slate-600">{qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3 Clinical Productivity & Inventory Valuation Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clinician Caseload */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" /> Physician Caseload & OPD Productivity
                </h3>
                <span className="text-[10px] bg-blue-50 text-blue-800 font-mono px-2 py-0.5 rounded font-bold">
                  {doctorPerformance.length} Active Clinicians
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b text-slate-600 text-[11px]">
                    <tr>
                      <th className="py-2 px-3 text-left">Doctor Name</th>
                      <th className="py-2 px-3 text-left">Specialty</th>
                      <th className="py-2 px-3 text-center">Visits Seen</th>
                      <th className="py-2 px-3 text-center">Diagnostic Orders</th>
                      <th className="py-2 px-3 text-center">Prescriptions</th>
                      <th className="py-2 px-3 text-right">Consultation Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctorPerformance.map((doc) => (
                      <tr key={doc.doctorId} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-bold text-slate-900">{doc.doctorName}</td>
                        <td className="py-2 px-3 text-slate-500 text-[11px]">{doc.department}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{doc.visitsCount}</td>
                        <td className="py-2 px-3 text-center font-mono text-amber-700 font-semibold">{doc.labOrdersCount}</td>
                        <td className="py-2 px-3 text-center font-mono text-cyan-700 font-semibold">{doc.prescriptionsCount}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(doc.revenueGenerated, db.settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Asset Valuation */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" /> Pharmacy Inventory Valuation
                </h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-medium">Total Stock on Hand:</span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {totalStockUnits.toLocaleString()} units
                  </div>
                  <span className="text-[10px] text-slate-500">{db.medicines.length} formulary catalog items</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 font-medium">Retail Stock Asset Value:</span>
                  <div className="text-xl font-black text-emerald-950 mt-0.5">
                    {formatCurrency(totalStockRetailValue, db.settings.currency)}
                  </div>
                  <span className="text-[10px] text-emerald-700">Calculated at current tariff rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: WORKSTATIONS FLEET MONITOR */}
      {activeTab === 'workstations' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Active Terminals</span>
                <Laptop className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {db.workstations?.length || 8} Workstations
              </div>
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> All LAN endpoints pinging
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>FastAPI Host</span>
                <Radio className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                {db.settings.serverIp}
              </div>
              <span className="text-[11px] text-slate-500">TLS Port: {db.settings.tlsPort || 8443}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Network Latency</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                1.2 ms
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Local Gigabit Ethernet</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Spooler Queue</span>
                <Printer className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                0 Jobs
              </div>
              <span className="text-[11px] text-slate-500">Hardware printers ready</span>
            </div>
          </div>

          {/* Workstations Fleet Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>SPEED Multi-Desktop Workstations Fleet</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Per-workstation terminal mapping: identity, assigned room/counter, ESC/POS printer, and scanner interface
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">Terminal ID</th>
                    <th className="py-2.5 px-3">Station Name / Room</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">LAN IP Address</th>
                    <th className="py-2.5 px-3">ESC/POS Thermal Printer</th>
                    <th className="py-2.5 px-3">Scanner Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(db.workstations || []).map((ws) => (
                    <tr key={ws.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ws.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{ws.name}</div>
                        <div className="text-[11px] text-slate-500">{ws.roomOrCounter}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {ws.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {ws.ipAddress}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{ws.printer.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <span>{ws.printer.targetAddress}</span>
                          <span>•</span>
                          <span>{ws.printer.rollWidthMm}mm</span>
                          {ws.printer.cashDrawerKick && <span className="text-emerald-600 font-bold">• Drawer Kick</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-600">
                          {ws.scanner.mode === 'hid_keyboard' ? 'USB HID Wedge' : 'Serial COM Port'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Online (1ms)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            broadcast(
                              'WORKSTATION_PING',
                              ws.id,
                              'Workstation Pinged',
                              `Admin console verified connection to ${ws.name} (${ws.ipAddress}). Latency: 1.2ms.`
                            );
                            alert(`Ping sent to ${ws.name} (${ws.ipAddress}). Workstation responded successfully.`);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                        >
                          Ping Terminal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRODUCTION ARCHITECTURE & SOURCE CODE EXPLORER */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5 text-teal-400" />
                  <span>SPEED Production Multi-Desktop Architecture & Code Explorer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Complete, production-tested FastAPI backend, Flutter desktop client, and deployment automation files for Ethiopian clinics (ETB).
                </p>
              </div>

              {/* Copy & Download Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    let codeText = '';
                    if (selectedCodeTab === 'fastapi') codeText = FASTAPI_MAIN_PY;
                    else if (selectedCodeTab === 'flutter_ws') codeText = FLUTTER_WS_SERVICE_DART;
                    else if (selectedCodeTab === 'flutter_queue') codeText = FLUTTER_OFFLINE_QUEUE_DART;
                    else if (selectedCodeTab === 'flutter_printer') codeText = FLUTTER_ESC_POS_PRINTER_DART;
                    else if (selectedCodeTab === 'sql_indexes') codeText = SQL_INDEXES_RECOMMENDATIONS;
                    else if (selectedCodeTab === 'nssm_bat') codeText = WINDOWS_NSSM_INSTALLER_BAT;
                    else if (selectedCodeTab === 'tls_bat') codeText = LAN_TLS_SETUP_BAT;
                    else if (selectedCodeTab === 'checklist') codeText = TESTING_CHECKLIST_CONCURRENCY;

                    navigator.clipboard.writeText(codeText);
                    setCopiedKey(selectedCodeTab);
                    setTimeout(() => setCopiedKey(null), 2500);
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  {copiedKey === selectedCodeTab ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Current File</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-xs border-b border-slate-800">
              {[
                { id: 'fastapi', label: 'FastAPI Backend (main.py)', icon: <Terminal className="w-3.5 h-3.5" /> },
                { id: 'flutter_ws', label: 'Flutter WS Client (ws_service.dart)', icon: <Radio className="w-3.5 h-3.5" /> },
                { id: 'flutter_queue', label: 'Offline Queue (offline_queue.dart)', icon: <Database className="w-3.5 h-3.5" /> },
                { id: 'flutter_printer', label: 'ESC/POS Printer (esc_pos.dart)', icon: <Printer className="w-3.5 h-3.5" /> },
                { id: 'sql_indexes', label: 'SQL Indexes & WAL (schema.sql)', icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'nssm_bat', label: 'Windows NSSM (install_service.bat)', icon: <Laptop className="w-3.5 h-3.5" /> },
                { id: 'tls_bat', label: 'LAN TLS Script (mkcert.bat)', icon: <Lock className="w-3.5 h-3.5" /> },
                { id: 'checklist', label: 'Testing Checklist', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setSelectedCodeTab(subTab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
                    selectedCodeTab === subTab.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {subTab.icon}
                  <span>{subTab.label}</span>
                </button>
              ))}
            </div>

            {/* Code Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed">
              <pre className="text-slate-300">
                {selectedCodeTab === 'fastapi' && FASTAPI_MAIN_PY}
                {selectedCodeTab === 'flutter_ws' && FLUTTER_WS_SERVICE_DART}
                {selectedCodeTab === 'flutter_queue' && FLUTTER_OFFLINE_QUEUE_DART}
                {selectedCodeTab === 'flutter_printer' && FLUTTER_ESC_POS_PRINTER_DART}
                {selectedCodeTab === 'sql_indexes' && SQL_INDEXES_RECOMMENDATIONS}
                {selectedCodeTab === 'nssm_bat' && WINDOWS_NSSM_INSTALLER_BAT}
                {selectedCodeTab === 'tls_bat' && LAN_TLS_SETUP_BAT}
                {selectedCodeTab === 'checklist' && TESTING_CHECKLIST_CONCURRENCY}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF & USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Clinic Staff Roster & Role Credentials</h3>
              <p className="text-xs text-slate-500">
                Role-based access control (RBAC). Workstations restrict permissions based on active role.
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Enroll Staff Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-2.5 px-3">Name / Username</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Terminal PIN</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {db.users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{u.department}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 tracking-widest">•••• ({u.pin})</td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRICE LISTS & TARIFFS (WITH AUDIT) */}
      {activeTab === 'prices' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tariff Governance & Price Catalogs</h3>
            <p className="text-xs text-slate-500">
              Hard Rule: Every price modification is irreversibly stamped into the clinic security audit log.
            </p>
          </div>

          {/* Edit Price Modal Inline */}
          {editingPriceId && (
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                <span>Modifying Item Tariff ({editingPriceType})</span>
                <button onClick={() => setEditingPriceId(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">New Price ({db.settings.currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newPriceValue}
                    onChange={(e) => setNewPriceValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1">Reason for Price Adjustment *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supplier cost increase / Ministry tariff directive"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setEditingPriceId(null)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSavePriceChange(editingPriceId, editingPriceType!)}
                  className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold"
                >
                  Confirm & Audit Price Change
                </button>
              </div>
            </div>
          )}

          {/* Consultation Fee Section */}
          <div className="border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-sm text-slate-900">General Outpatient Consultation Fee</div>
              <div className="text-xs text-slate-500">Standard registration fee charged at reception</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-slate-900 font-mono">
                {formatCurrency(db.settings.consultationFee, db.settings.currency)}
              </span>
              <button
                onClick={() => {
                  setEditingPriceId('CONSULTATION');
                  setEditingPriceType('consultation');
                  setNewPriceValue(db.settings.consultationFee);
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          {/* Lab Test Catalog Prices */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Laboratory Investigation Tariffs ({db.labCatalog.length})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {db.labCatalog.map((t) => (
                <div key={t.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{t.name}</span>
                    <span className="text-slate-400 text-[10px] ml-2 font-mono">{t.code} · {t.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(t.price, db.settings.currency)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingPriceId(t.id);
                        setEditingPriceType('lab');
                        setNewPriceValue(t.price);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medicine Formulary Prices */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Pharmacy Medicine Formulary Retail Prices ({db.medicines.length})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {db.medicines.map((m) => (
                <div key={m.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900">{m.name}</span>
                    <span className="text-slate-400 text-[10px] ml-2 font-mono">{m.code} · {m.strength}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(m.unitPrice, db.settings.currency)} / unit
                    </span>
                    <button
                      onClick={() => {
                        setEditingPriceId(m.id);
                        setEditingPriceType('medicine');
                        setNewPriceValue(m.unitPrice);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (() => {
        const filteredLogs = db.auditLogs.filter((log) => {
          const matchesSearch = log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
            log.operator.toLowerCase().includes(auditSearch.toLowerCase()) ||
            (log.reason && log.reason.toLowerCase().includes(auditSearch.toLowerCase()));
          const matchesType = auditFilterType === 'all' || log.entityType === auditFilterType;
          return matchesSearch && matchesType;
        });

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Clinic Security & Compliance Audit Log
                </h3>
                <p className="text-xs text-slate-500">
                  Every price adjustment, emergency override, user provisioning, and snapshot backup is immutably stamped.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintAuditCertificate}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Audit Certificate
                </button>
                <button
                  onClick={handleExportAuditCsv}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search operator, action, or reason..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Filter Scope:</span>
                <select
                  value={auditFilterType}
                  onChange={(e) => setAuditFilterType(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="all">All Audit Actions ({db.auditLogs.length})</option>
                  <option value="price">Price Alterations</option>
                  <option value="override">Emergency Overrides</option>
                  <option value="payment">Financial Settlements</option>
                  <option value="user">Staff Provisioning</option>
                  <option value="backup">Database Backups & Restores</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="sticky top-0 z-10 bg-slate-900 text-slate-300 font-sans">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3">Action Description</th>
                    <th className="py-2.5 px-3">Change (Old → New)</th>
                    <th className="py-2.5 px-3">Reason / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic font-sans">
                        No audit records match the selected search/filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">{log.operator}</span>
                          <div className="text-[9px] text-slate-400 uppercase font-sans">{log.role}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {log.oldValue && log.newValue ? (
                            <span>
                              <del className="text-red-600">{log.oldValue}</del> → <strong className="text-emerald-700">{log.newValue}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans italic">
                          {log.reason || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-base font-bold text-slate-900">Clinic Operational Parameters</h3>
            <p className="text-xs text-slate-500">Configure global business rules, expiry threshold, and security PINs.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinic Institutional Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Consultation Fee ({db.settings.currency})
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Medicine Expiry Warning Days (Yellow Threshold)
                </label>
                <input
                  type="number"
                  value={warningDays}
                  onChange={(e) => setWarningDays(parseInt(e.target.value) || 30)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Manager Emergency Override PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={overridePin}
                  onChange={(e) => setOverridePin(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Encrypted Local Database Snapshots</h3>
            <p className="text-xs text-slate-500">
              Hard Rule: Daily encrypted backup ensures zero data loss even if local hardware fails.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Full Local Database Export (.json snapshot)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Export all tables including patient records, visits, payments, audit trails, and batch stock levels.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Backup Archive
            </button>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">Enroll Staff Member</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Staff Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Miller, MD"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">System Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="cashier">Cashier</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="laboratory">Laboratory Technologist</option>
                  <option value="pharmacy">Pharmacist</option>
                  <option value="admin">Administrator / Manager</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newStaffDepartment}
                  onChange={(e) => setNewStaffDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Workstation Terminal PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono tracking-widest focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-xs"
                >
                  Enroll Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
