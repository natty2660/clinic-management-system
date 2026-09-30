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
  Search,
  Lock,
  User,
  Stethoscope,
  Filter,
  Check,
} from 'lucide-react';
import {
  DatabaseState,
  XRayOrder,
  User as ClinicUser,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintContentType } from '../components/PrintModal';

interface XRayModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const XRayModule: React.FC<XRayModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    db.xrayOrders?.[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive Film Viewer Controls
  const [invertedMode, setInvertedMode] = useState(false);
  const [contrastHigh, setContrastHigh] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [kVp, setKVp] = useState(70);
  const [mAs, setMAs] = useState(16);

  // Findings & Impression form state
  const [findingsText, setFindingsText] = useState('');
  const [impressionText, setImpressionText] = useState('');

  const selectedOrder = (db.xrayOrders || []).find((o) => o.id === selectedOrderId) || db.xrayOrders?.[0];

  React.useEffect(() => {
    if (selectedOrder) {
      setFindingsText(selectedOrder.findings || '');
      setImpressionText(selectedOrder.impression || '');
    }
  }, [selectedOrder?.id]);

  const filteredOrders = (db.xrayOrders || []).filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        o.patientName.toLowerCase().includes(term) ||
        o.orderNumber.toLowerCase().includes(term) ||
        o.bodyPart.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleCompleteXRay = (order: XRayOrder) => {
    if (order.paymentStatus !== 'paid') {
      alert('Diagnostic Gate Block: X-Ray imaging cannot be authorized or released without invoice payment at Cashier.');
      return;
    }
    if (!findingsText.trim() || !impressionText.trim()) {
      alert('Please fill out findings and clinical impression before authorizing the radiograph.');
      return;
    }

    const timestamp = new Date().toISOString();

    onUpdateDb((prev) => {
      const updatedOrders = (prev.xrayOrders || []).map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'completed' as const,
              findings: findingsText.trim(),
              impression: impressionText.trim(),
              performedAt: timestamp,
              radiographerName: currentUser.name,
              radiologistName: currentUser.name,
              radiationDoseMgy: 0.12,
              exposureQuality: 'Optimal' as const,
              version: (o.version || 1) + 1,
            }
          : o
      );

      return {
        ...prev,
        xrayOrders: updatedOrders,
      };
    });

    broadcast(
      'XRAY_COMPLETED',
      'Digital X-Ray PC',
      'X-Ray Radiograph Completed & Signed',
      `X-Ray ${order.orderNumber} (${order.bodyPart}) for ${order.patientName} signed off by ${currentUser.name}.`
    );

    // Prompt print
    onPrint({
      type: 'radiology_report',
      data: {
        ...order,
        status: 'completed',
        findings: findingsText.trim(),
        impression: impressionText.trim(),
        performedAt: timestamp,
        radiologistName: currentUser.name,
        radiographerName: currentUser.name,
      },
      settings: db.settings,
    });
  };

  const isPaid = selectedOrder?.paymentStatus === 'paid';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 border border-sky-900/50 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-900/30">
            <ScanLine className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/30">
                Workstation PC · XRAY-01
              </span>
              <span className="text-xs text-sky-300 font-semibold">
                Digital Radiography & PACS Console
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              SPEED Digital X-Ray & Imaging Workstation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-sky-900/60 border border-sky-700/60 text-sky-200 text-xs font-mono">
            Pending Exposure: <strong className="text-white">{(db.xrayOrders || []).filter((o) => o.status !== 'completed').length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-mono">
            Reported Today: <strong className="text-white">{(db.xrayOrders || []).filter((o) => o.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Worklist Column (4 Cols) - Independent Sticky Queue */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-sky-600" />
                <span>X-Ray Worklist ({filteredOrders.length})</span>
              </span>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition text-center ${
                  statusFilter === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ordered')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition text-center ${
                  statusFilter === 'ordered' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition text-center ${
                  statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, order, body part..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="space-y-2.5 h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No X-Ray orders matching filter.
              </div>
            ) : (
              filteredOrders.map((o) => {
                const isSelected = o.id === selectedOrder?.id;
                const paid = o.paymentStatus === 'paid';
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`bg-white rounded-2xl p-4 border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-200 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900">{o.orderNumber}</span>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5">{o.patientName}</h4>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                              o.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.status}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              paid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {paid ? 'PAID' : 'UNPAID'}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-sky-700 font-bold mt-2">
                        {o.bodyPart} · {o.viewsRequired}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{o.clinicalIndication}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Doctor: {o.orderedByDoctor}</span>
                      <span>{formatDateTime(o.orderedAt).split(',')[1]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Diagnostic Bench Column (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Digital Radiograph Inspection & Reporting
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                      {selectedOrder.orderNumber}
                    </span>
                    <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {selectedOrder.bodyPart}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Patient: <strong className="text-slate-900">{selectedOrder.patientName}</strong> · Indication: {selectedOrder.clinicalIndication}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onPrint({
                        type: 'radiology_report',
                        data: selectedOrder,
                        settings: db.settings,
                      })
                    }
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {!isPaid && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold">Payment Unsettled: </span>
                    <span>X-Ray examination fee of {formatCurrency(selectedOrder.price, db.settings.currency)} is currently pending at Cashier.</span>
                  </div>
                </div>
              )}

              {/* High-Resolution Interactive Film Viewer */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-teal-400 font-bold">DR FILM VIEWER</span>
                    <span className="text-slate-500">•</span>
                    <span>{selectedOrder.bodyPart} ({selectedOrder.viewsRequired})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInvertedMode(!invertedMode)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                        invertedMode ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Invert
                    </button>
                    <button
                      onClick={() => setContrastHigh(!contrastHigh)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                        contrastHigh ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Bone Filter
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => (z >= 1.5 ? 1 : z + 0.25))}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-slate-300"
                    >
                      Zoom {zoomLevel}x
                    </button>
                  </div>
                </div>

                {/* Simulated Film Display */}
                <div
                  className={`h-64 rounded-xl flex items-center justify-center p-6 text-center transition-all overflow-hidden relative ${
                    invertedMode
                      ? 'bg-slate-100 text-slate-950 border border-slate-300'
                      : 'bg-black text-slate-200 border border-slate-800'
                  }`}
                  style={{
                    filter: contrastHigh ? 'contrast(160%) brightness(90%)' : 'none',
                    transform: `scale(${zoomLevel})`,
                  }}
                >
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-current mx-auto flex items-center justify-center opacity-60 animate-pulse">
                      <ScanLine className="w-8 h-8" />
                    </div>
                    <div className="font-mono text-xs uppercase tracking-widest font-extrabold">
                      {selectedOrder.bodyPart} Radiograph [ACQUIRED]
                    </div>
                    <div className="text-[10px] font-mono opacity-60">
                      kVp: {kVp} | mAs: {mAs} | SID: 180cm | Dose: 0.12 mGy
                    </div>
                  </div>

                  <div className="absolute top-3 left-3 text-[10px] font-mono opacity-50">
                    Patient: {selectedOrder.patientName} ({selectedOrder.orderNumber})
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono opacity-50">
                    LATENCY: 0ms • SPEED PACS
                  </div>
                </div>
              </div>

              {/* Findings & Reporting */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Radiological Findings: *
                  </label>
                  <textarea
                    rows={3}
                    value={findingsText}
                    onChange={(e) => setFindingsText(e.target.value)}
                    placeholder="Lung fields clear, cardiothoracic ratio normal, costophrenic angles sharp, osseous structures intact..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Impression & Radiological Conclusion: *
                  </label>
                  <textarea
                    rows={2}
                    value={impressionText}
                    onChange={(e) => setImpressionText(e.target.value)}
                    placeholder="No active cardiopulmonary disease / No acute fracture or dislocation identified..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-500">
                    Reporting Radiologist: <strong className="text-slate-800">{currentUser.name}</strong>
                  </div>

                  <button
                    onClick={() => handleCompleteXRay(selectedOrder)}
                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Publish Radiograph</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an X-Ray examination from the worklist to start diagnostic viewing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
