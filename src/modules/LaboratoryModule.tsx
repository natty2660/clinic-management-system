import React, { useState } from 'react';
import {
  FlaskConical,
  Lock,
  CheckCircle2,
  Clock,
  Printer,
  AlertTriangle,
  Play,
  Send,
  Eye,
  ShieldAlert,
  TestTube,
} from 'lucide-react';
import {
  DatabaseState,
  LabOrder,
  User,
  LabResultItem,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintContentType } from '../components/PrintModal';
import { evaluateLabValue } from '../utils/clinical';
import { clinicAudio } from '../utils/audio';

interface LaboratoryModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const LaboratoryModule: React.FC<LaboratoryModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    db.labOrders[0]?.id || ''
  );

  // Result entry form state for the selected order
  const selectedOrder = db.labOrders.find((o) => o.id === selectedOrderId);
  const catalogTest = selectedOrder
    ? db.labCatalog.find((t) => t.id === selectedOrder.testCatalogId)
    : null;

  const [paramValues, setParamValues] = useState<{ [paramName: string]: string }>({});
  const [techNotes, setTechNotes] = useState('');

  // Sync parameter values when order changes
  React.useEffect(() => {
    if (selectedOrder) {
      if (selectedOrder.results && selectedOrder.results.length > 0) {
        const valMap: { [name: string]: string } = {};
        selectedOrder.results.forEach((r) => {
          valMap[r.parameterName] = r.value;
        });
        setParamValues(valMap);
      } else if (catalogTest) {
        // Initialize blank or default parameter values
        const defaults: { [name: string]: string } = {};
        catalogTest.parameters.forEach((p) => {
          defaults[p.name] = '';
        });
        setParamValues(defaults);
      }
      setTechNotes(selectedOrder.technicianNotes || '');
    }
  }, [selectedOrderId]);

  // Workflow Action 1: Sample Taken
  const handleTakeSample = (order: LabOrder) => {
    onUpdateDb((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'sample_taken' as const,
              sampleTakenAt: new Date().toISOString(),
              sampleTakenBy: currentUser.name,
            }
          : o
      ),
    }));

    broadcast(
      'SAMPLE_TAKEN',
      'Laboratory PC',
      'Diagnostic Sample Collected',
      `Phlebotomist ${currentUser.name} collected sample for ${order.testName} (${order.patientName}).`
    );
  };

  // Workflow Action 2: Start Testing
  const handleStartAnalysis = (order: LabOrder) => {
    onUpdateDb((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((o) =>
        o.id === order.id ? { ...o, status: 'in_progress' as const } : o
      ),
    }));
  };

  // Workflow Action 3: Complete & Transmit to Doctor
  const handleCompleteLabTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !catalogTest) return;

    let hasPanicAlert = false;
    const panicAlerts: string[] = [];

    // Build results array with clinical evaluation
    const compiledResults: LabResultItem[] = catalogTest.parameters.map((param) => {
      const enteredValue = paramValues[param.name] || 'Not tested';
      const evalRes = evaluateLabValue(enteredValue, param.referenceRange, param.criticalLow, param.criticalHigh);

      if (evalRes.isCritical) {
        hasPanicAlert = true;
        panicAlerts.push(`${param.name}: ${enteredValue} ${param.unit} (${evalRes.flagLabel})`);
      }

      return {
        parameterName: param.name,
        value: enteredValue,
        unit: param.unit,
        referenceRange: param.referenceRange,
        isAbnormal: evalRes.isAbnormal,
        isCritical: evalRes.isCritical,
        flag: evalRes.flag,
      };
    });

    onUpdateDb((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: 'completed' as const,
              results: compiledResults,
              technicianNotes: techNotes,
              completedAt: new Date().toISOString(),
              completedBy: currentUser.name,
            }
          : o
      ),
    }));

    if (hasPanicAlert) {
      clinicAudio.playAlert();
      broadcast(
        'CRITICAL_LAB_ALERT',
        'Laboratory',
        `CRITICAL LAB PANIC ALERT: ${selectedOrder.patientName}`,
        `URGENT NOTIFICATION: ${selectedOrder.testName} triggered panic thresholds: ${panicAlerts.join(' | ')}. Immediate physician review mandatory!`,
        { orderId: selectedOrder.id, panicAlerts }
      );
    } else {
      clinicAudio.playBeep();
      broadcast(
        'LAB_RESULT_READY',
        'Laboratory PC',
        'Lab Results Certified & Transmitted to Doctor',
        `${selectedOrder.testName} completed for ${selectedOrder.patientName} (${selectedOrder.orderNumber}). Immediate view enabled on Doctor PC.`
      );
    }
  };

  // Manager Override for emergency sampling without payment
  const triggerLabEmergencyOverride = (order: LabOrder) => {
    onOpenOverride(
      `Emergency Lab Processing without payment for ${order.testName} (${order.patientName})`,
      (reason, authorizedBy) => {
        onUpdateDb((prev) => ({
          ...prev,
          labOrders: prev.labOrders.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  paymentStatus: 'overridden' as const,
                  status: 'paid' as const,
                  overridden: true,
                  overrideReason: reason,
                }
              : o
          ),
          auditLogs: [
            {
              id: `aud_${Date.now()}`,
              timestamp: new Date().toISOString(),
              operator: authorizedBy,
              role: currentUser.role,
              department: 'Laboratory',
              action: `Emergency Lab Bypass: ${order.testName} (${order.patientName})`,
              entityType: 'override',
              entityId: order.id,
              reason,
            },
            ...prev.auditLogs,
          ],
        }));

        broadcast(
          'EMERGENCY_OVERRIDE',
          'Laboratory PC',
          'Emergency Lab Processing Authorized',
          `${order.testName} for ${order.patientName} bypassed payment gate via emergency authorization by ${authorizedBy}.`
        );
      }
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: REQUEST QUEUE (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900">Laboratory Worklist</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              {db.labOrders.length} Orders
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Hard Rule: Laboratory strictly processes ONLY paid requests (or manager-approved emergency overrides).
          </p>
        </div>

        {/* Orders list */}
        <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto">
          {db.labOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-400">
              No lab test requests in the system.
            </div>
          ) : (
            db.labOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              const isPaidOrOverridden =
                order.paymentStatus === 'paid' ||
                order.paymentStatus === 'overridden';

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`bg-white rounded-xl p-3.5 border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-200 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">• {order.patientMrn}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{order.patientName}</h4>
                      <div className="text-xs text-amber-900 font-semibold mt-1">
                        Test: {order.testName}
                      </div>
                    </div>

                    <div className="text-right">
                      {isPaidOrOverridden ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> UNPAID
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flow Status Tag */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">
                      Ordered by: <strong>{order.orderedByDoctor}</strong>
                    </span>
                    <span className="uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: WORKFLOW STATION & RESULT ENTRY (7 Cols) */}
      <div className="lg:col-span-7 space-y-5">
        {selectedOrder ? (
          (() => {
            const isPaidOrOverridden =
              selectedOrder.paymentStatus === 'paid' ||
              selectedOrder.paymentStatus === 'overridden';

            return (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedOrder.testName}</h2>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {selectedOrder.orderNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Patient: <strong className="text-slate-800">{selectedOrder.patientName}</strong> ({selectedOrder.patientMrn})
                    </div>
                  </div>

                  {/* Action Print */}
                  {selectedOrder.status === 'completed' && (
                    <button
                      onClick={() =>
                        onPrint({
                          type: 'lab_report',
                          data: selectedOrder,
                          settings: db.settings,
                        })
                      }
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Certified Lab Report
                    </button>
                  )}
                </div>

                {/* STRICT PAYMENT GATE ENFORCEMENT */}
                {!isPaidOrOverridden ? (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-red-900">
                        Payment Gate Locked: Unpaid Lab Request
                      </h4>
                      <p className="text-xs text-red-700 mt-1 max-w-md mx-auto">
                        In accordance with clinic protocol, this diagnostic request cannot be sampled or processed until fee of{' '}
                        <strong>{formatCurrency(selectedOrder.price, db.settings.currency)}</strong> is paid at the Cashier workstation.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => triggerLabEmergencyOverride(selectedOrder)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition inline-flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" /> Manager Emergency Override
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* WORKFLOW PIPELINE PROGRESS */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Sample & Processing Workflow
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Fee Paid
                        </span>

                        <span className="text-slate-400">→</span>

                        {selectedOrder.status === 'paid' && (
                          <button
                            onClick={() => handleTakeSample(selectedOrder)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 shadow-xs transition"
                          >
                            <TestTube className="w-3 h-3" /> Draw / Receive Sample
                          </button>
                        )}

                        {selectedOrder.status !== 'paid' && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sample Taken
                          </span>
                        )}

                        <span className="text-slate-400">→</span>

                        {selectedOrder.status === 'sample_taken' && (
                          <button
                            onClick={() => handleStartAnalysis(selectedOrder)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1 shadow-xs transition"
                          >
                            <Play className="w-3 h-3" /> Start Analysis
                          </button>
                        )}

                        {(selectedOrder.status === 'in_progress' || selectedOrder.status === 'completed') && (
                          <span className="font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Analysis In Progress
                          </span>
                        )}

                        <span className="text-slate-400">→</span>

                        {selectedOrder.status === 'completed' ? (
                          <span className="font-bold text-emerald-800 bg-emerald-200 px-2 py-1 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed & Sent
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Pending Results</span>
                        )}
                      </div>
                    </div>

                    {/* RESULTS FORM */}
                    <form onSubmit={handleCompleteLabTest} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                          Test Parameters & Reference Range Evaluation
                        </h4>
                        {catalogTest?.sampleType && (
                          <span className="text-[11px] text-slate-500">
                            Required Specimen: <strong>{catalogTest.sampleType}</strong>
                          </span>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {catalogTest?.parameters.map((param) => (
                          <div key={param.name} className="p-3 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                            <div className="sm:col-span-4">
                              <div className="font-bold text-slate-900">{param.name}</div>
                              <div className="text-[10px] text-slate-400">Ref: {param.referenceRange} {param.unit}</div>
                            </div>

                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                required
                                placeholder={`Enter value in ${param.unit}`}
                                value={paramValues[param.name] || ''}
                                onChange={(e) =>
                                  setParamValues({
                                    ...paramValues,
                                    [param.name]: e.target.value,
                                  })
                                }
                                disabled={selectedOrder.status === 'completed'}
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3 text-slate-500 text-[11px] font-mono">
                              Unit: {param.unit}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Technologist Clinical Remarks / Quality Check
                        </label>
                        <textarea
                          rows={2}
                          value={techNotes}
                          onChange={(e) => setTechNotes(e.target.value)}
                          disabled={selectedOrder.status === 'completed'}
                          placeholder="e.g. Specimen non-hemolyzed. Control values within 2SD. Microscopic smear verified."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {selectedOrder.status !== 'completed' && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" /> Certify Results & Transmit to Doctor
                          </button>
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Select a lab request from the left worklist to process.
          </div>
        )}
      </div>
    </div>
  );
};
