import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Search,
  Eye,
  FileCheck,
  Send,
  Zap,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, LabOrder, ChargeItem, User as AppUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface LaboratoryResultTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const LaboratoryResultTab: React.FC<LaboratoryResultTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Lab orders for this patient
  const patientLabOrders = db.labOrders
    .filter((l) => l.patientId === patient.id || l.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  const filteredOrders = patientLabOrders.filter((l) => {
    if (statusFilter === 'completed' && l.status !== 'completed') return false;
    if (statusFilter === 'pending' && l.status === 'completed') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.testName.toLowerCase().includes(term) ||
        l.orderNumber.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Diagnostic Test Bundles / Packages
  const diagnosticBundles = [
    {
      name: 'Fever Panel',
      description: 'CBC + Malaria RDT + Typhoid Widal',
      codes: ['CBC', 'MAL_RDT', 'WIDAL'],
    },
    {
      name: 'Diabetic Screen',
      description: 'Fasting Blood Glucose + HbA1c + Lipid Panel',
      codes: ['FBS', 'HBA1C', 'LIPID'],
    },
    {
      name: 'Renal Workup',
      description: 'Creatinine + BUN + Complete Urinalysis',
      codes: ['CREAT', 'BUN', 'URINE'],
    },
    {
      name: 'Liver Function',
      description: 'ALT (SGPT) + AST + Total Bilirubin',
      codes: ['LFT', 'ALT', 'BIL_TOT'],
    },
  ];

  const handleOrderSingleTest = (testId: string) => {
    const catalogItem = db.labCatalog.find((c) => c.id === testId);
    if (!catalogItem) return;

    const orderNumber = `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLabOrder: LabOrder = {
      id: `lab_${Date.now()}`,
      orderNumber,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      testCatalogId: catalogItem.id,
      testName: catalogItem.name,
      price: catalogItem.price,
      status: 'pending_payment',
      paymentStatus: 'pending',
      orderedByDoctor: currentUser.name,
      orderedAt: new Date().toISOString(),
      overridden: false,
    };

    const newCharge: ChargeItem = {
      id: `chg_lab_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      category: 'lab',
      orderReferenceId: newLabOrder.id,
      name: `Lab Test: ${catalogItem.name}`,
      unitPrice: catalogItem.price,
      quantity: 1,
      totalPrice: catalogItem.price,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      labOrders: [newLabOrder, ...prev.labOrders],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'LAB_ORDERED',
      'SPEED OPD & Doctor',
      'Lab Investigation Ordered',
      `Dr. ${currentUser.name} ordered ${catalogItem.name} for ${patient.name} (${orderNumber}). Sent to Cashier.`,
      newLabOrder
    );

    setSelectedCatalogId('');
  };

  const handleOrderBundle = (bundle: typeof diagnosticBundles[0]) => {
    // Find tests matching the catalog codes or keywords
    const matchingTests = db.labCatalog.filter((item) =>
      bundle.codes.some((code) => item.code.toUpperCase().includes(code)) ||
      item.name.toLowerCase().includes(bundle.name.toLowerCase().split(' ')[0])
    );

    if (matchingTests.length === 0) {
      // Fallback to first available catalog item
      if (db.labCatalog[0]) handleOrderSingleTest(db.labCatalog[0].id);
      return;
    }

    matchingTests.slice(0, 3).forEach((item, idx) => {
      setTimeout(() => {
        handleOrderSingleTest(item.id);
      }, idx * 50);
    });
  };

  return (
    <div className="space-y-6">
      {/* Test Requisition Header & Fast Ordering Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              Laboratory Requisition & Live Diagnostic Results
            </h3>
            <p className="text-[11px] text-slate-500">
              Orders automatically generate cashier charges in ETB. Technicians process once paid and post parameters in real time.
            </p>
          </div>

          {/* Catalog test picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none flex-1 sm:w-64"
            >
              <option value="">-- Select Test from Catalog --</option>
              {db.labCatalog.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.name} ({formatCurrency(test.price, db.settings.currency)})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleOrderSingleTest(selectedCatalogId)}
              disabled={!selectedCatalogId}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Order Lab Test
            </button>
          </div>
        </div>

        {/* 1-Click Fast Diagnostic Packages */}
        <div>
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Diagnostic Requisition Bundles (1-Click):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {diagnosticBundles.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleOrderBundle(b)}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition group shadow-2xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                    {b.name}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{b.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Filter Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({patientLabOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            Completed ({patientLabOrders.filter((l) => l.status === 'completed').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              statusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            In-Progress / Unpaid ({patientLabOrders.filter((l) => l.status !== 'completed').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search test name, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders List and Interactive Parameter Viewer */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No laboratory tests found for this patient.</p>
            <p className="text-[11px] text-slate-400 mt-1">Select a test from the catalog above to order.</p>
          </div>
        ) : (
          filteredOrders.map((lo) => {
            const isCompleted = lo.status === 'completed';
            const isPaid = lo.paymentStatus === 'paid';
            const hasAbnormal = lo.results?.some((r) => r.isAbnormal);

            return (
              <div
                key={lo.id}
                className={`bg-white rounded-xl border p-4.5 shadow-xs transition ${
                  isCompleted
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : isPaid
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Order Header Bar */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{lo.testName}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {lo.orderNumber}
                      </span>
                      {hasAbnormal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Out of Range Alert
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>Ordered {formatDateTime(lo.orderedAt)}</span>
                      <span>By {lo.orderedByDoctor}</span>
                      <span>Fee: <strong>{formatCurrency(lo.price, db.settings.currency)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? 'PAID AT CASHIER' : 'PENDING CASHIER'}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                        isCompleted
                          ? 'bg-emerald-800 text-white'
                          : lo.status === 'in_progress'
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {lo.status.replace('_', ' ')}
                    </span>

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrint({
                            type: 'lab_report',
                            data: lo,
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Completed Results Parameters Table */}
                {isCompleted && lo.results && lo.results.length > 0 ? (
                  <div className="mt-3 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Parameter Results ({lo.results.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Completed by: <strong className="text-slate-800">{lo.completedBy || 'Lab Technologist'}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {lo.results.map((res, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-lg border transition ${
                            res.isAbnormal
                              ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>{res.parameterName}</span>
                            {res.isAbnormal && (
                              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                ABNORMAL
                              </span>
                            )}
                          </div>
                          <div className="text-base font-black my-0.5">
                            {res.value}{' '}
                            <span className="text-xs font-normal text-slate-500">{res.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Normal Reference: {res.referenceRange}
                          </div>
                        </div>
                      ))}
                    </div>

                    {lo.technicianNotes && (
                      <div className="mt-2 text-xs italic text-slate-600 bg-white p-2 rounded border border-slate-200">
                        Technician Remarks: "{lo.technicianNotes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-dashed border-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {isPaid
                        ? 'Payment verified. Laboratory is analyzing biological specimen...'
                        : 'Awaiting cashier payment settlement before laboratory processing begins.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
