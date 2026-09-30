import React, { useState } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Eye,
  FileText,
  Activity,
  Heart,
  Baby,
  Search,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, UltrasoundOrder, ChargeItem, User as AppUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface UltrasoundResultTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const UltrasoundResultTab: React.FC<UltrasoundResultTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [scanType, setScanType] = useState<UltrasoundOrder['scanType']>('Abdominal');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [selectedScanDetail, setSelectedScanDetail] = useState<UltrasoundOrder | null>(null);

  // Ultrasound orders for this patient
  const patientUltrasounds = (db.ultrasoundOrders || [])
    .filter((u) => u.patientId === patient.id || u.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  const quickPresets = [
    { type: 'Abdominal' as const, indication: 'Abdominal pain, dyspepsia. Rule out cholelithiasis and liver parenchymal disease.' },
    { type: 'Pelvic / Obstetric' as const, indication: 'Routine fetal biometric assessment, viability, amniotic fluid volume and placental location.' },
    { type: 'Transvaginal' as const, indication: 'Abnormal uterine bleeding, pelvic pain. Evaluate endometrial thickness and adnexa.' },
    { type: 'Thyroid' as const, indication: 'Anterior neck swelling, evaluation of nodule size, margin, and vascularity.' },
  ];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalIndication.trim()) return;

    const orderNumber = `US-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const price = scanType === 'Pelvic / Obstetric' ? 500 : scanType === 'Transvaginal' ? 600 : 450;

    const newOrder: UltrasoundOrder = {
      id: `us_${Date.now()}`,
      orderNumber,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      scanType,
      clinicalIndication: clinicalIndication.trim(),
      orderedByDoctor: currentUser.name,
      orderedAt: new Date().toISOString(),
      status: 'ordered',
      findings: 'Awaiting sonography examination by attending radiologist / sonographer.',
      conclusion: 'Requisition pending execution.',
      paymentStatus: 'pending',
      price,
    };

    const newCharge: ChargeItem = {
      id: `chg_us_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      category: 'procedure',
      orderReferenceId: newOrder.id,
      name: `Ultrasound Scan: ${scanType}`,
      unitPrice: price,
      quantity: 1,
      totalPrice: price,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      ultrasoundOrders: [newOrder, ...(prev.ultrasoundOrders || [])],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      'Ultrasound Scan Ordered',
      `Dr. ${currentUser.name} ordered ${scanType} ultrasound for ${patient.name} (${orderNumber}). Sent to billing.`,
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
              <Radio className="w-4 h-4 text-teal-600" />
              Diagnostic Ultrasound & Sonography Suite
            </h3>
            <p className="text-[11px] text-slate-500">
              High-resolution ultrasound imaging with organ-specific biometric tracking, obstetric Doppler parameters, and formal reporting.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Order Ultrasound Scan
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Common Sonographic Requisitions (1-Click Fill):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setScanType(preset.type);
                  setClinicalIndication(preset.indication);
                  setShowOrderModal(true);
                }}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition group shadow-2xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition">
                    {preset.type} US
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{preset.indication}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ultrasound Scans List */}
      <div className="space-y-4">
        {patientUltrasounds.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Radio className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No ultrasound scans found for this patient.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Order Ultrasound Scan" above to initiate a requisition.</p>
          </div>
        ) : (
          patientUltrasounds.map((us) => {
            const isCompleted = us.status === 'completed';
            const isPaid = us.paymentStatus === 'paid';

            return (
              <div
                key={us.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition ${
                  isCompleted ? 'border-teal-300 ring-1 ring-teal-100' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{us.scanType} Ultrasound</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {us.orderNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>Ordered {formatDateTime(us.orderedAt)}</span>
                      <span>By {us.orderedByDoctor}</span>
                      <span>Fee: <strong>{formatCurrency(us.price, db.settings.currency)}</strong></span>
                      {us.sonographerName && (
                        <span>Sonographer: <strong className="text-slate-800">{us.sonographerName}</strong></span>
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
                        isCompleted ? 'bg-teal-800 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {us.status.replace('_', ' ')}
                    </span>

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrint({
                            type: 'ultrasound_report',
                            data: us,
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Ultrasound Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Clinical Indication */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-3">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    Clinical Indication
                  </span>
                  <p className="text-slate-800">{us.clinicalIndication}</p>
                </div>

                {/* Completed Findings Report */}
                {isCompleted ? (
                  <div className="space-y-3">
                    {/* Organ-specific parameters table */}
                    {us.organDetails && us.organDetails.length > 0 && (
                      <div>
                        <span className="font-bold text-slate-800 text-xs block mb-1.5">
                          Organ Measurements & Anatomical Findings:
                        </span>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 font-bold text-slate-700">
                              <tr>
                                <th className="p-2 border-b">Organ / Region</th>
                                <th className="p-2 border-b">Dimensions</th>
                                <th className="p-2 border-b">Status</th>
                                <th className="p-2 border-b">Specific Observation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {us.organDetails.map((org, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="p-2 font-bold text-slate-900">{org.organ}</td>
                                  <td className="p-2 font-mono text-slate-600">{org.measurement || '-'}</td>
                                  <td className="p-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        org.condition === 'Normal'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {org.condition}
                                    </span>
                                  </td>
                                  <td className="p-2 text-slate-700">{org.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Obstetric biometric values if applicable */}
                    {us.obstetricDetails && (
                      <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 text-xs space-y-1">
                        <span className="font-bold text-purple-900 flex items-center gap-1 text-xs">
                          <Baby className="w-3.5 h-3.5 text-purple-600" />
                          Obstetric Sonography & Fetal Biometrics:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium text-slate-800">
                          <div>Gestational Age: <strong>{us.obstetricDetails.gestationalAgeWeeks}w {us.obstetricDetails.gestationalAgeDays || 0}d</strong></div>
                          <div>Fetal Heart Rate: <strong>{us.obstetricDetails.fetalHeartRateBpm} bpm</strong></div>
                          <div>Estimated Weight: <strong>{us.obstetricDetails.estimatedFetalWeightGrams} g</strong></div>
                          <div>Placenta: <strong>{us.obstetricDetails.placentaLocation || 'Fundal Anterior'}</strong></div>
                          <div>AFI (Fluid): <strong>{us.obstetricDetails.amnioticFluidIndexCm} cm</strong></div>
                          <div>EDD: <strong>{us.obstetricDetails.eddDate || '2026-10-02'}</strong></div>
                          <div>Presentation: <strong>{us.obstetricDetails.presentation || 'Cephalic'}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Diagnostic Narrative Findings */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                        Sonographer Detailed Findings
                      </span>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">{us.findings}</p>
                    </div>

                    {/* Diagnostic Conclusion / Impression */}
                    <div className="bg-teal-50/80 border border-teal-200 rounded-lg p-3 text-xs">
                      <span className="font-bold text-teal-950 uppercase tracking-wider text-[10px] block">
                        Impression / Conclusion
                      </span>
                      <p className="text-slate-900 font-extrabold text-sm mt-1">{us.conclusion}</p>
                      {us.recommendations && (
                        <p className="text-slate-600 mt-1">
                          <strong>Clinical Recommendation:</strong> {us.recommendations}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {isPaid
                        ? 'Payment verified. Patient is in ultrasound queue for sonographic acquisition.'
                        : 'Awaiting cashier settlement before sonographer performs examination.'}
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
                <Radio className="w-4 h-4 text-teal-600" />
                Requisition Diagnostic Ultrasound Scan
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Scan Modality / Anatomical Region</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Abdominal">Abdominal Ultrasound (Liver, GB, Pancreas, Spleen, Kidneys)</option>
                  <option value="Pelvic / Obstetric">Pelvic / Obstetric Ultrasound (Fetal biometry, AFI, placenta)</option>
                  <option value="Transvaginal">Transvaginal Ultrasound (Endometrium, ovaries, adnexa)</option>
                  <option value="Thyroid">Thyroid & Soft Tissues of the Neck</option>
                  <option value="Echocardiogram">Transthoracic Echocardiogram (Echo)</option>
                  <option value="Vascular / Doppler">Vascular / Doppler (Lower extremity arterial/venous)</option>
                  <option value="Musculoskeletal">Musculoskeletal (Joint / tendon effusion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication & Specific Question</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. RUQ pain, fever, suspected cholelithiasis; evaluate biliary tree..."
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Est. Charge: <strong>{formatCurrency(scanType === 'Pelvic / Obstetric' ? 500 : 450, db.settings.currency)}</strong>
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
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
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
