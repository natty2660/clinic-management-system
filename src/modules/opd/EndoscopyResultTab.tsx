import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Eye,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, EndoscopyOrder, ChargeItem, User as AppUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface EndoscopyResultTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const EndoscopyResultTab: React.FC<EndoscopyResultTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [procedureType, setProcedureType] = useState<EndoscopyOrder['procedureType']>('Upper GI Endoscopy (EGD)');
  const [clinicalIndication, setClinicalIndication] = useState('');

  // Endoscopy orders for this patient
  const patientEndoscopies = (db.endoscopyOrders || [])
    .filter((e) => e.patientId === patient.id || e.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  const quickPresets = [
    { type: 'Upper GI Endoscopy (EGD)' as const, indication: 'Chronic epigastric burning refractory to PPIs, postprandial nausea, evaluate for peptic ulcer or H. pylori.' },
    { type: 'Colonoscopy' as const, indication: 'Altered bowel habits, lower GI bleeding, family history of colorectal neoplasm.' },
    { type: 'Sigmoidoscopy' as const, indication: 'Fresh hematochezia, tenesmus, evaluate for distal proctitis or internal hemorrhoids.' },
    { type: 'Bronchoscopy' as const, indication: 'Unresolved pulmonary infiltrate, subacute hemoptysis, obtain bronchoalveolar lavage.' },
  ];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalIndication.trim()) return;

    const orderNumber = `ENDO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const price = procedureType === 'Colonoscopy' ? 1800 : 1200;

    const newOrder: EndoscopyOrder = {
      id: `endo_${Date.now()}`,
      orderNumber,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      procedureType,
      clinicalIndication: clinicalIndication.trim(),
      orderedByDoctor: currentUser.name,
      orderedAt: new Date().toISOString(),
      status: 'ordered',
      mucosalFindings: 'Awaiting endoscopic examination by attending gastroenterologist.',
      biopsyTaken: false,
      impression: 'Pending endoscopic inspection.',
      recommendations: 'Awaiting procedure completion.',
      paymentStatus: 'pending',
      price,
    };

    const newCharge: ChargeItem = {
      id: `chg_endo_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      category: 'procedure',
      orderReferenceId: newOrder.id,
      name: `Endoscopy Procedure: ${procedureType}`,
      unitPrice: price,
      quantity: 1,
      totalPrice: price,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      endoscopyOrders: [newOrder, ...(prev.endoscopyOrders || [])],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      'Endoscopy Procedure Ordered',
      `Dr. ${currentUser.name} ordered ${procedureType} for ${patient.name} (${orderNumber}). Sent to billing.`,
      newOrder
    );

    setClinicalIndication('');
    setShowOrderModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Requisition Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-purple-600" />
              Endoscopy & Gastroenterological Diagnostic Suite
            </h3>
            <p className="text-[11px] text-slate-500">
              High-definition video endoscopy with Forrest ulcer grading, mucosal biopsy mapping, and post-procedure recovery records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Order Endoscopy Procedure
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Common Endoscopic Protocols (1-Click Fill):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setProcedureType(preset.type);
                  setClinicalIndication(preset.indication);
                  setShowOrderModal(true);
                }}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition group shadow-2xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
                    {preset.type.split(' ')[0]} {preset.type.includes('EGD') ? 'EGD' : ''}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{preset.indication}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Endoscopy Reports List */}
      <div className="space-y-4">
        {patientEndoscopies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <FileSearch className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No endoscopy procedures on record for this patient.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Order Endoscopy Procedure" above to request an endoscopy.</p>
          </div>
        ) : (
          patientEndoscopies.map((endo) => {
            const isCompleted = endo.status === 'completed';
            const isPaid = endo.paymentStatus === 'paid';

            return (
              <div
                key={endo.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition ${
                  isCompleted ? 'border-purple-300 ring-1 ring-purple-100' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{endo.procedureType}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {endo.orderNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>Ordered {formatDateTime(endo.orderedAt)}</span>
                      <span>By {endo.orderedByDoctor}</span>
                      <span>Fee: <strong>{formatCurrency(endo.price, db.settings.currency)}</strong></span>
                      {endo.endoscopistName && (
                        <span>Endoscopist: <strong className="text-slate-800">{endo.endoscopistName}</strong></span>
                      )}
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
                        isCompleted ? 'bg-purple-800 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {endo.status.replace('_', ' ')}
                    </span>

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrint({
                            type: 'endoscopy_report',
                            data: endo,
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Endoscopy Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Procedural Scope & Sedation pill bar */}
                {isCompleted && (
                  <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 text-xs flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span>Sedation: <strong className="text-purple-950">{endo.sedationUsed || 'Topical anesthetic'}</strong></span>
                      <span>Extent: <strong className="text-purple-950">{endo.extentOfExam || 'Complete'}</strong></span>
                    </div>

                    {endo.biopsyTaken && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                        Biopsy Taken (Sent to Pathology)
                      </span>
                    )}
                  </div>
                )}

                {/* Clinical Indication */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-3">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    Clinical Indication
                  </span>
                  <p className="text-slate-800">{endo.clinicalIndication}</p>
                </div>

                {/* Completed Findings Report */}
                {isCompleted ? (
                  <div className="space-y-3">
                    {/* Mucosal Findings */}
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                        Mucosal & Luminal Inspection Findings
                      </span>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">{endo.mucosalFindings}</p>
                    </div>

                    {/* Biopsy Details if taken */}
                    {endo.biopsyTaken && endo.biopsySites && (
                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 block mb-1">
                          Biopsy Sites & Tissue Sampling:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-950">
                          {endo.biopsySites.map((site, i) => (
                            <li key={i}>{site}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Endoscopist Impression */}
                    <div className="bg-purple-50/80 border border-purple-200 rounded-lg p-3 text-xs">
                      <span className="font-bold text-purple-950 uppercase tracking-wider text-[10px] block">
                        Endoscopic Impression
                      </span>
                      <p className="text-slate-900 font-extrabold text-sm mt-1">{endo.impression}</p>
                      {endo.recommendations && (
                        <p className="text-slate-600 mt-1">
                          <strong>Clinical Recommendations:</strong> {endo.recommendations}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {isPaid
                        ? 'Payment verified. Patient is in endoscopy preparation bay.'
                        : 'Awaiting cashier settlement before endoscopy procedure is initiated.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Requisition Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-purple-600" />
                Requisition Endoscopic Procedure
              </h4>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Procedure Type</label>
                <select
                  value={procedureType}
                  onChange={(e) => setProcedureType(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="Upper GI Endoscopy (EGD)">Upper GI Endoscopy / Esophagogastroduodenoscopy (EGD)</option>
                  <option value="Colonoscopy">Full Colonoscopy (Cecum & Terminal Ileum inspection)</option>
                  <option value="Sigmoidoscopy">Flexible Sigmoidoscopy</option>
                  <option value="Bronchoscopy">Diagnostic Fiberoptic Bronchoscopy</option>
                  <option value="Cystoscopy">Diagnostic Rigid/Flexible Cystoscopy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication & Specific Goals</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Persistent dyspepsia refractory to antacids, epigastric pain, evaluate for ulcer or H. pylori..."
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Est. Charge: <strong>{formatCurrency(procedureType === 'Colonoscopy' ? 1800 : 1200, db.settings.currency)}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Transmit Requisition
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
