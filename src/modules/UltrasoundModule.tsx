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
  Lock,
  ShieldCheck,
  User,
  Stethoscope,
  ChevronRight,
  Filter,
  Sliders,
  Send,
  Camera,
} from 'lucide-react';
import {
  DatabaseState,
  UltrasoundOrder,
  User as ClinicUser,
  ChargeItem,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintContentType } from '../components/PrintModal';

interface UltrasoundModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride?: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const UltrasoundModule: React.FC<UltrasoundModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    db.ultrasoundOrders?.[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'in_progress' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Reporting Form State for active selected scan
  const [findingsText, setFindingsText] = useState('');
  const [impressionText, setImpressionText] = useState('');
  const [selectedProbe, setSelectedProbe] = useState('Curvilinear 3.5MHz (Abdominal / OB)');
  const [imageGain, setImageGain] = useState(65);
  const [zoomLevel, setZoomLevel] = useState(1);

  const selectedOrder = (db.ultrasoundOrders || []).find((o) => o.id === selectedOrderId) || db.ultrasoundOrders?.[0];

  // Auto-sync form when selected order changes
  React.useEffect(() => {
    if (selectedOrder) {
      setFindingsText(selectedOrder.findings || '');
      setImpressionText(selectedOrder.impression || '');
    }
  }, [selectedOrder?.id]);

  const filteredOrders = (db.ultrasoundOrders || []).filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (typeFilter !== 'all' && o.scanType !== typeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        o.patientName.toLowerCase().includes(term) ||
        o.orderNumber.toLowerCase().includes(term) ||
        o.clinicalIndication.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Complete and sign ultrasound scan report
  const handleCompleteScan = (order: UltrasoundOrder) => {
    if (!findingsText.trim() || !impressionText.trim()) {
      alert('Please fill out findings and clinical impression before authorizing the sonogram.');
      return;
    }

    const timestamp = new Date().toISOString();

    onUpdateDb((prev) => {
      const updatedOrders = (prev.ultrasoundOrders || []).map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'completed' as const,
              findings: findingsText.trim(),
              conclusion: impressionText.trim(),
              impression: impressionText.trim(),
              performedAt: timestamp,
              sonographerName: currentUser.name,
              version: (o.version || 1) + 1,
            }
          : o
      );

      return {
        ...prev,
        ultrasoundOrders: updatedOrders,
      };
    });

    broadcast(
      'ULTRASOUND_COMPLETED',
      'Ultrasound PC',
      'Ultrasound Report Authorized & Completed',
      `Sonogram ${order.orderNumber} for ${order.patientName} (${order.scanType}) signed off by ${currentUser.name}.`
    );

    // Prompt print
    onPrint({
      type: 'ultrasound_report',
      data: {
        ...order,
        status: 'completed',
        findings: findingsText.trim(),
        conclusion: impressionText.trim(),
        impression: impressionText.trim(),
        performedAt: timestamp,
        sonographerName: currentUser.name,
      },
      settings: db.settings,
    });
  };

  const handleStartExam = (order: UltrasoundOrder) => {
    onUpdateDb((prev) => ({
      ...prev,
      ultrasoundOrders: (prev.ultrasoundOrders || []).map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'in_progress' as const,
              sonographerName: currentUser.name,
            }
          : o
      ),
    }));

    broadcast(
      'WORKSTATION_PING',
      'Ultrasound PC',
      'Patient Sonogram Commenced',
      `Sonographer ${currentUser.name} initiated ${order.scanType} scan for ${order.patientName}.`
    );
  };

  const isPaid = selectedOrder?.paymentStatus === 'paid';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                Workstation PC · ULTRASOUND-01
              </span>
              <span className="text-xs text-indigo-300 font-semibold">
                Ultrasound & Sonography Suite (Room 105)
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              SPEED Diagnostic Ultrasound & Sonography Workstation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 text-xs font-mono">
            Waiting: <strong className="text-white">{(db.ultrasoundOrders || []).filter((o) => o.status !== 'completed').length}</strong> scans
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-mono">
            Completed Today: <strong className="text-white">{(db.ultrasoundOrders || []).filter((o) => o.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worklist Queue (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-indigo-600" />
                <span>Ultrasound Worklist ({filteredOrders.length})</span>
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition text-center ${
                  statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                Waiting
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
                placeholder="Search patient or order #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* List of Orders */}
          <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No ultrasound orders matching criteria.
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
                        ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">{o.orderNumber}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5">{o.patientName}</h4>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                              o.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
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

                      <div className="text-xs text-indigo-700 font-bold mt-2 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{o.scanType}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{o.clinicalIndication}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Dr: {o.orderedByDoctor}</span>
                      <span>{formatDateTime(o.orderedAt).split(',')[1]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Sonography Workstation (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Sonography Examination Bench
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                      {selectedOrder.orderNumber}
                    </span>
                    <span className="font-bold text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      {selectedOrder.scanType}
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
                        type: 'ultrasound_report',
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

              {/* Strict Cashier Payment Warning */}
              {!isPaid && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold">Payment Gated at Cashier: </span>
                      <span>Order price of {formatCurrency(selectedOrder.price, db.settings.currency)} is currently pending at reception.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sonogram Hardware / Probe Settings Strip */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Selected Probe:</label>
                    <select
                      value={selectedProbe}
                      onChange={(e) => setSelectedProbe(e.target.value)}
                      className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option>Curvilinear 3.5MHz (Abdominal / OB)</option>
                      <option>Linear 7.5-10MHz (Vascular / Thyroid / Small Parts)</option>
                      <option>Endocavitary 6.5MHz (Transvaginal / Pelvic)</option>
                      <option>Phased Array 2.5MHz (Cardiac Echo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Gain: {imageGain}%</label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={imageGain}
                      onChange={(e) => setImageGain(parseInt(e.target.value))}
                      className="w-24 accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">DICOM Cine: Ready</span>
                  {selectedOrder.status === 'ordered' && (
                    <button
                      onClick={() => handleStartExam(selectedOrder)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition"
                    >
                      Start Examination
                    </button>
                  )}
                </div>
              </div>

              {/* Sonogram Findings & Clinical Reporting */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Sonographic Findings & Organ Evaluation: *
                  </label>
                  <textarea
                    rows={4}
                    value={findingsText}
                    onChange={(e) => setFindingsText(e.target.value)}
                    placeholder="Describe organ echogenicity, margins, dimensions, free fluid in pouch of Douglas / Morrison's pouch, gallbladder wall thickness..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Diagnostic Impression & Recommendation: *
                  </label>
                  <textarea
                    rows={2}
                    value={impressionText}
                    onChange={(e) => setImpressionText(e.target.value)}
                    placeholder="Definitive diagnostic conclusion (e.g., Normal study, Cholelithiasis with acoustic shadow, Viable intrauterine gestation ~18wks)..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-500">
                    Signing Sonographer: <strong className="text-slate-800">{currentUser.name}</strong>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCompleteScan(selectedOrder)}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize & Publish Sonogram Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an ultrasound scan order from the worklist to start diagnosis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
