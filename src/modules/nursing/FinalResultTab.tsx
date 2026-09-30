import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  FileCheck,
} from 'lucide-react';
import { Visit, Patient, LabOrder, User, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface FinalResultTabProps {
  visit: Visit;
  patient: Patient | null;
  labOrders: LabOrder[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: (labOrder: LabOrder) => void;
}

export const FinalResultTab: React.FC<FinalResultTabProps> = ({
  visit,
  patient,
  labOrders,
  currentUser,
  onUpdateDb,
  broadcast,
  onPrint,
}) => {
  const patientLabOrders = labOrders.filter((l) => l.visitId === visit.id);
  const [acknowledgedOrders, setAcknowledgedOrders] = useState<string[]>([]);

  const handleAcknowledge = (orderId: string) => {
    setAcknowledgedOrders((prev) => [...prev, orderId]);
    broadcast(
      'LAB_RESULT_READY',
      'Nurse Station',
      `Lab Acknowledged: ${visit.patientName}`,
      `Nurse ${currentUser.name} reviewed and verified lab findings for ${visit.patientName}.`
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Laboratory Diagnostics & Final Test Results
            </h3>
            <p className="text-xs text-slate-500">
              Investigation parameters, observed values, reference ranges, critical alerts, and nurse verification.
            </p>
          </div>
        </div>
      </div>

      {patientLabOrders.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No laboratory investigations requested for this visit.</p>
          <p className="text-xs text-slate-400 mt-1">
            Tests ordered by Doctor OPD and completed by the Laboratory will be presented here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patientLabOrders.map((lab) => {
            const hasResults = lab.results && lab.results.length > 0;
            const hasCritical = lab.results?.some((r) => r.isCritical || r.flag?.includes('CRITICAL'));
            const isAck = acknowledgedOrders.includes(lab.id);

            return (
              <div
                key={lab.id}
                className={`border rounded-xl overflow-hidden shadow-2xs ${
                  hasCritical ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                {/* Lab Header */}
                <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{lab.orderNumber}</span>
                      <strong className="text-sm text-slate-900">{lab.testName}</strong>
                      {hasCritical && (
                        <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-[10px] uppercase animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Critical Value Alert
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ordered by {lab.orderedByDoctor} · {formatDateTime(lab.orderedAt)}
                      {lab.completedBy && ` · Verified by ${lab.completedBy}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lab.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lab.status === 'sample_taken'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lab.status.replace('_', ' ')}
                    </span>

                    {onPrint && (
                      <button
                        onClick={() => onPrint(lab)}
                        className="p-1 text-slate-600 hover:text-purple-600 hover:bg-white rounded transition"
                        title="Print Lab Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Parameters Table */}
                {hasResults ? (
                  <div className="p-3">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200 pb-1">
                        <tr>
                          <th className="py-1 px-2">Investigation Parameter</th>
                          <th className="py-1 px-2">Observed Value</th>
                          <th className="py-1 px-2">Unit</th>
                          <th className="py-1 px-2">Reference Range</th>
                          <th className="py-1 px-2 text-right">Clinical Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lab.results!.map((param, idx) => (
                          <tr key={idx} className={param.isAbnormal ? 'bg-amber-50/60 font-semibold' : ''}>
                            <td className="py-1.5 px-2 text-slate-800">{param.parameterName}</td>
                            <td className="py-1.5 px-2 font-mono font-bold text-slate-900">{param.value}</td>
                            <td className="py-1.5 px-2 text-slate-500">{param.unit}</td>
                            <td className="py-1.5 px-2 text-slate-600 font-mono text-[11px]">{param.referenceRange}</td>
                            <td className="py-1.5 px-2 text-right">
                              {param.isCritical ? (
                                <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px]">
                                  CRITICAL
                                </span>
                              ) : param.isAbnormal ? (
                                <span className="bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  ABNORMAL
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Lab Technician Remarks */}
                    {lab.technicianNotes && (
                      <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <strong>Technician Observations: </strong> {lab.technicianNotes}
                      </div>
                    )}

                    {/* Nurse Acknowledgment Bar */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        {isAck ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed & Signed by Nurse {currentUser.name}
                          </span>
                        ) : (
                          'Awaiting nurse verification sign-off'
                        )}
                      </span>

                      {!isAck && (
                        <button
                          onClick={() => handleAcknowledge(lab.id)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Mark Reviewed by Nurse</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    Sample collected and in laboratory processing pipeline. Results will populate upon analyzer completion.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
