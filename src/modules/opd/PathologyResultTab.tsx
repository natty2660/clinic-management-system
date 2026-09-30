import React, { useState } from 'react';
import {
  Microscope,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Eye,
  FileText,
  ShieldCheck,
  Tag,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, PathologyOrder, ChargeItem, User as AppUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface PathologyResultTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const PathologyResultTab: React.FC<PathologyResultTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [specimenType, setSpecimenType] = useState<PathologyOrder['specimenType']>('Biopsy (Histopathology)');
  const [specimenSite, setSpecimenSite] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('');

  // Pathology orders for this patient
  const patientPathologies = (db.pathologyOrders || [])
    .filter((p) => p.patientId === patient.id || p.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  const quickPresets = [
    { type: 'Biopsy (Histopathology)' as const, site: 'Gastric Antrum Biopsies (Endoscopic)', history: 'Chronic dyspepsia with antral erythema. Evaluate for chronic active gastritis and H. pylori.' },
    { type: 'Fine Needle Aspiration (FNAC)' as const, site: 'Thyroid Right Lobe Nodule (2cm)', history: 'Solitary non-toxic thyroid nodule; evaluate Bethesda classification.' },
    { type: 'Pap Smear / Liquid Cytology' as const, site: 'Endocervical and Ectocervical Swab', history: 'Routine cervical cancer screening; evaluate for dysplastic changes or intraepithelial lesions.' },
    { type: 'Excision Specimen' as const, site: 'Dorsal Forearm Subcutaneous Nodule (1.5cm)', history: 'Painless mobile subcutaneous nodule; evaluate for lipoma or epidermal cyst.' },
  ];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specimenSite.trim() || !clinicalHistory.trim()) return;

    const orderNumber = `PATH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const price = specimenType === 'Excision Specimen' ? 850 : 650;

    const newOrder: PathologyOrder = {
      id: `path_${Date.now()}`,
      orderNumber,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      specimenType,
      specimenSite: specimenSite.trim(),
      clinicalHistory: clinicalHistory.trim(),
      orderedByDoctor: currentUser.name,
      orderedAt: new Date().toISOString(),
      status: 'ordered',
      grossDescription: 'Awaiting gross pathology dissection and tissue embedding.',
      microscopicDescription: 'Awaiting histological microtomy and microscopic evaluation.',
      definitiveDiagnosis: 'Pending pathologist examination.',
      urgency: 'routine',
      paymentStatus: 'pending',
      price,
    };

    const newCharge: ChargeItem = {
      id: `chg_path_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      category: 'lab',
      orderReferenceId: newOrder.id,
      name: `Pathology / Histology: ${specimenType}`,
      unitPrice: price,
      quantity: 1,
      totalPrice: price,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      pathologyOrders: [newOrder, ...(prev.pathologyOrders || [])],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      'Pathology Specimen Sent',
      `Dr. ${currentUser.name} ordered ${specimenType} for ${patient.name} (${orderNumber}). Sent to billing.`,
      newOrder
    );

    setSpecimenSite('');
    setClinicalHistory('');
    setShowOrderModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Requisition Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-rose-600" />
              Anatomic Pathology, Histopathology & Cytology Suite
            </h3>
            <p className="text-[11px] text-slate-500">
              Macroscopic tissue grossing, cellular cytology, immunohistochemistry (IHC) profiling, and definitive pathologist diagnosis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Order Pathology / Biopsy
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Common Histopathology Protocols (1-Click Fill):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSpecimenType(preset.type);
                  setSpecimenSite(preset.site);
                  setClinicalHistory(preset.history);
                  setShowOrderModal(true);
                }}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/40 transition group shadow-2xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition">
                    {preset.type.split(' ')[0]}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{preset.site}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pathology Orders List */}
      <div className="space-y-4">
        {patientPathologies.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <Microscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No pathology or biopsy reports on file for this patient.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Order Pathology / Biopsy" above to send a specimen.</p>
          </div>
        ) : (
          patientPathologies.map((path) => {
            const isCompleted = path.status === 'completed';
            const isPaid = path.paymentStatus === 'paid';

            return (
              <div
                key={path.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition ${
                  isCompleted ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{path.specimenType}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {path.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {path.specimenSite}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>Ordered {formatDateTime(path.orderedAt)}</span>
                      <span>By {path.orderedByDoctor}</span>
                      <span>Fee: <strong>{formatCurrency(path.price, db.settings.currency)}</strong></span>
                      {path.pathologistName && (
                        <span>Pathologist: <strong className="text-slate-800">{path.pathologistName}</strong></span>
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
                        isCompleted ? 'bg-rose-800 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {path.status.replace('_', ' ')}
                    </span>

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrint({
                            type: 'pathology_report',
                            data: path,
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Pathology Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Clinical History */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-3">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    Clinical History & Pre-Op Indication
                  </span>
                  <p className="text-slate-800">{path.clinicalHistory}</p>
                </div>

                {/* Completed Findings Report */}
                {isCompleted ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Macroscopic / Gross */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Macroscopic / Gross Description
                        </span>
                        <p className="text-slate-800 leading-relaxed">{path.grossDescription}</p>
                      </div>

                      {/* Microscopic Description */}
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Microscopic Examination
                        </span>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-line">{path.microscopicDescription}</p>
                      </div>
                    </div>

                    {/* Special stains / IHC */}
                    {path.specialStainsOrIHC && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                        <div>
                          <strong>Special Stains & IHC:</strong> {path.specialStainsOrIHC}
                        </div>
                      </div>
                    )}

                    {/* Definitive Pathological Diagnosis Banner */}
                    <div className="bg-rose-50 border border-rose-300 rounded-lg p-3.5 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-rose-950 uppercase tracking-wider text-[10px]">
                          Definitive Pathological Diagnosis
                        </span>
                        {path.snodentOrIcdCode && (
                          <span className="font-mono text-[10px] text-rose-800 font-bold bg-white px-2 py-0.5 rounded border border-rose-200">
                            {path.snodentOrIcdCode}
                          </span>
                        )}
                      </div>
                      <p className="text-rose-950 font-black text-sm mt-1 leading-snug">
                        {path.definitiveDiagnosis}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>Electronic Verification: <strong className="text-slate-800">{path.pathologistName}</strong></span>
                      <span className="font-mono text-slate-400">Reported {formatDateTime(path.reportedAt || path.orderedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {isPaid
                        ? 'Payment verified. Specimen is undergoing histology processing in the laboratory.'
                        : 'Awaiting cashier settlement before histopathology preparation begins.'}
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
                <Microscope className="w-4 h-4 text-rose-600" />
                Requisition Histopathology / Biopsy Specimen
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Specimen Examination Type</label>
                <select
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Biopsy (Histopathology)">Biopsy (Endoscopic, Punch, Core Needle)</option>
                  <option value="Excision Specimen">Excision / Resection Specimen</option>
                  <option value="Fine Needle Aspiration (FNAC)">Fine Needle Aspiration Cytology (FNAC)</option>
                  <option value="Pap Smear / Liquid Cytology">Pap Smear / Liquid-based Cervical Cytology</option>
                  <option value="Fluid Cytology">Body Fluid Cytology (Ascitic, Pleural, CSF)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specimen Anatomical Source & Site</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gastric Antrum Biopsies or Thyroid Right Lobe Nodule"
                  value={specimenSite}
                  onChange={(e) => setSpecimenSite(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical History & Pre-test Differential</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. 34yo male with persistent dyspepsia, antral erythema on EGD. Rule out H. pylori and intestinal metaplasia..."
                  value={clinicalHistory}
                  onChange={(e) => setClinicalHistory(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Est. Charge: <strong>{formatCurrency(specimenType === 'Excision Specimen' ? 850 : 650, db.settings.currency)}</strong>
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
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Dispatch Specimen
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
