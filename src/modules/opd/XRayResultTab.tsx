import React, { useState } from 'react';
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Plus,
  Eye,
  FileText,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  SunMedium,
  Shield,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, XRayOrder, ChargeItem, User as AppUser } from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface XRayResultTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const XRayResultTab: React.FC<XRayResultTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [bodyPart, setBodyPart] = useState<XRayOrder['bodyPart']>('Chest PA/AP');
  const [viewsRequired, setViewsRequired] = useState('PA erect view');
  const [clinicalIndication, setClinicalIndication] = useState('');
  
  // Interactive Radiograph Film viewer controls
  const [invertedMode, setInvertedMode] = useState(false);
  const [contrastHigh, setContrastHigh] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // X-Ray orders for this patient
  const patientXRays = (db.xrayOrders || [])
    .filter((x) => x.patientId === patient.id || x.visitId === currentVisit.id)
    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());

  const quickPresets = [
    { part: 'Chest PA/AP' as const, views: 'PA erect view', indication: 'Fever for 3 days, cough, pleuritic chest pain. Rule out pneumonia or consolidation.' },
    { part: 'Lumbar Spine' as const, views: 'AP & Lateral views', indication: 'Chronic lower back pain radiating to left leg. Evaluate for degenerative disc disease.' },
    { part: 'Extremity / Limb' as const, views: 'AP & Oblique views', indication: 'Twisting trauma, acute swelling, focal tenderness. Rule out fracture.' },
    { part: 'Cervical Spine' as const, views: 'AP, Lateral & Odontoid', indication: 'Neck stiffness following motor vehicle collision, no neurological deficit.' },
  ];

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalIndication.trim()) return;

    const orderNumber = `XR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const price = bodyPart === 'Lumbar Spine' ? 400 : 350;

    const newOrder: XRayOrder = {
      id: `xr_${Date.now()}`,
      orderNumber,
      visitId: currentVisit.id,
      patientId: patient.id,
      patientName: patient.name,
      bodyPart,
      viewsRequired: viewsRequired.trim() || 'Standard views',
      clinicalIndication: clinicalIndication.trim(),
      orderedByDoctor: currentUser.name,
      orderedAt: new Date().toISOString(),
      status: 'ordered',
      findings: 'Awaiting image acquisition in radiology department.',
      impression: 'Pending radiologist interpretation.',
      exposureQuality: 'Optimal',
      paymentStatus: 'pending',
      price,
    };

    const newCharge: ChargeItem = {
      id: `chg_xr_${Date.now()}`,
      visitId: currentVisit.id,
      patientId: patient.id,
      category: 'procedure',
      orderReferenceId: newOrder.id,
      name: `Digital Radiography (X-Ray): ${bodyPart}`,
      unitPrice: price,
      quantity: 1,
      totalPrice: price,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      xrayOrders: [newOrder, ...(prev.xrayOrders || [])],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      'Digital X-Ray Ordered',
      `Dr. ${currentUser.name} ordered ${bodyPart} X-Ray for ${patient.name} (${orderNumber}). Sent to billing.`,
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
              <ScanLine className="w-4 h-4 text-blue-600" />
              Digital Radiography (X-Ray) Diagnostics & Viewer
            </h3>
            <p className="text-[11px] text-slate-500">
              Low-dose digital radiography with interactive PACS-style inspection, radiologist structured impressions, and dose logging.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Order Digital X-Ray
          </button>
        </div>

        {/* 1-Click Fast Presets */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Common Radiography Protocols (1-Click Fill):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setBodyPart(preset.part);
                  setViewsRequired(preset.views);
                  setClinicalIndication(preset.indication);
                  setShowOrderModal(true);
                }}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group shadow-2xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {preset.part}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">{preset.indication}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List & Radiography Inspections */}
      <div className="space-y-4">
        {patientXRays.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <ScanLine className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No X-Ray examinations ordered for this patient.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Order Digital X-Ray" above to request imaging.</p>
          </div>
        ) : (
          patientXRays.map((xr) => {
            const isCompleted = xr.status === 'completed';
            const isPaid = xr.paymentStatus === 'paid';

            return (
              <div
                key={xr.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition ${
                  isCompleted ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{xr.bodyPart}</h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {xr.orderNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">({xr.viewsRequired})</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>Ordered {formatDateTime(xr.orderedAt)}</span>
                      <span>By {xr.orderedByDoctor}</span>
                      <span>Fee: <strong>{formatCurrency(xr.price, db.settings.currency)}</strong></span>
                      {xr.radiationDoseMgy && (
                        <span>Dose: <strong className="font-mono text-slate-800">{xr.radiationDoseMgy} mGy</strong></span>
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
                        isCompleted ? 'bg-blue-800 text-white' : 'bg-slate-800 text-white'
                      }`}
                    >
                      {xr.status.replace('_', ' ')}
                    </span>

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() =>
                          onPrint({
                            type: 'radiology_report',
                            data: xr,
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print X-Ray Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Clinical Indication */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs mb-3">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-0.5">
                    Clinical Indication & Technique
                  </span>
                  <p className="text-slate-800">{xr.clinicalIndication}</p>
                </div>

                {/* Interactive Film Simulator & Radiologist Interpretation */}
                {isCompleted ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Simulated Digital X-Ray Film Viewer (5 cols) */}
                    <div className="lg:col-span-5 bg-slate-950 rounded-xl p-3 border border-slate-800 text-white flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                        <span className="font-mono">DIGITAL FILM #{xr.orderNumber}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setInvertedMode(!invertedMode)}
                            className={`p-1 rounded text-[10px] font-bold transition ${
                              invertedMode ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                            }`}
                            title="Invert Black/White mode"
                          >
                            INV
                          </button>
                          <button
                            type="button"
                            onClick={() => setContrastHigh(!contrastHigh)}
                            className={`p-1 rounded text-[10px] font-bold transition ${
                              contrastHigh ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                            }`}
                            title="Boost Contrast"
                          >
                            CONT
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomLevel(zoomLevel === 1 ? 1.3 : 1)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            title="Toggle Zoom"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Film Canvas Representation */}
                      <div
                        className={`h-48 rounded-lg flex flex-col items-center justify-center p-4 transition-all duration-200 overflow-hidden relative ${
                          invertedMode ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-100'
                        } ${contrastHigh ? 'contrast-150' : 'contrast-100'}`}
                        style={{ transform: `scale(${zoomLevel})` }}
                      >
                        <div className="opacity-70 text-center space-y-1">
                          <ScanLine className="w-12 h-12 mx-auto opacity-60 text-blue-400" />
                          <div className="font-mono font-bold text-xs uppercase tracking-wider">
                            {xr.bodyPart} ({xr.viewsRequired})
                          </div>
                          <div className="text-[10px] opacity-75 font-mono">
                            Dose: {xr.radiationDoseMgy || 0.08} mGy · Matrix 2048x2048
                          </div>
                        </div>

                        {/* Orientation Markers */}
                        <span className="absolute top-2 left-2 font-mono font-bold text-xs opacity-75">R</span>
                        <span className="absolute top-2 right-2 font-mono font-bold text-xs opacity-75">UPRIGHT</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] flex justify-between text-slate-400">
                        <span>Quality: <strong className="text-emerald-400">{xr.exposureQuality}</strong></span>
                        <span>Radiographer: {xr.radiographerName || 'Staff Radiographer'}</span>
                      </div>
                    </div>

                    {/* Radiologist Formal Impression (7 cols) */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Radiological Findings
                        </span>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed">{xr.findings}</p>
                      </div>

                      <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 text-xs">
                        <span className="font-bold text-blue-950 uppercase tracking-wider text-[10px] block">
                          Radiologist Impression
                        </span>
                        <p className="text-slate-900 font-extrabold text-sm mt-1">{xr.impression}</p>
                        {xr.recommendations && (
                          <p className="text-slate-600 mt-1">
                            <strong>Recommendation:</strong> {xr.recommendations}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                        <span>Reported by: <strong className="text-slate-800">{xr.radiologistName || 'Dr. Michael K., MD'}</strong></span>
                        <span className="font-mono text-slate-400">{formatDateTime(xr.performedAt || xr.orderedAt)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {isPaid
                        ? 'Payment verified. Patient is called into X-Ray imaging suite.'
                        : 'Awaiting cashier settlement before radiography exposure is taken.'}
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
                <ScanLine className="w-4 h-4 text-blue-600" />
                Requisition Digital Radiography (X-Ray)
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Anatomical Body Region</label>
                <select
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Chest PA/AP">Chest PA / AP (Lungs, heart, mediastinum)</option>
                  <option value="Lumbar Spine">Lumbar Spine (L1-S1, disc space, spondylosis)</option>
                  <option value="Cervical Spine">Cervical Spine (C1-C7, alignment)</option>
                  <option value="Pelvis & Hip">Pelvis & Hip (Symphysis, acetabulum, femur)</option>
                  <option value="Extremity / Limb">Extremity / Limb (Knee, Ankle, Wrist, Foot, Hand)</option>
                  <option value="Skull / Sinuses">Skull & Paranasal Sinuses</option>
                  <option value="Abdomen Supine/Erect">Abdomen Supine & Erect (Air-fluid levels, bowel gas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specific Radiographic Views</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PA erect view or AP & Lateral views"
                  value={viewsRequired}
                  onChange={(e) => setViewsRequired(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication & Suspected Pathology</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Persistent fever, cough for 4 days, coarse crackles right base..."
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Est. Charge: <strong>{formatCurrency(bodyPart === 'Lumbar Spine' ? 400 : 350, db.settings.currency)}</strong>
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
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
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
