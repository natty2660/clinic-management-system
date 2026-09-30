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
  Search,
  Lock,
  User,
  Stethoscope,
  Filter,
} from 'lucide-react';
import {
  DatabaseState,
  PathologyOrder,
  User as ClinicUser,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintContentType } from '../components/PrintModal';

interface PathologyModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const PathologyModule: React.FC<PathologyModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    db.pathologyOrders?.[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'received' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Diagnostic form state
  const [grossText, setGrossText] = useState('');
  const [microText, setMicroText] = useState('');
  const [diagnosisText, setDiagnosisText] = useState('');
  const [stainsUsed, setStainsUsed] = useState('Hematoxylin & Eosin (H&E)');
  const [snodentCode, setSnodentCode] = useState('M-00100');

  const selectedOrder = (db.pathologyOrders || []).find((p) => p.id === selectedOrderId) || db.pathologyOrders?.[0];

  React.useEffect(() => {
    if (selectedOrder) {
      setGrossText(selectedOrder.grossDescription || '');
      setMicroText(selectedOrder.microscopicDescription || '');
      setDiagnosisText(selectedOrder.definitiveDiagnosis || '');
      setStainsUsed(selectedOrder.specialStainsOrIHC || 'Hematoxylin & Eosin (H&E)');
      setSnodentCode(selectedOrder.snodentOrIcdCode || 'M-00100');
    }
  }, [selectedOrder?.id]);

  const filteredOrders = (db.pathologyOrders || []).filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        o.patientName.toLowerCase().includes(term) ||
        o.orderNumber.toLowerCase().includes(term) ||
        o.specimenType.toLowerCase().includes(term) ||
        o.specimenSite.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleCompletePathology = (order: PathologyOrder) => {
    if (order.paymentStatus !== 'paid') {
      alert('Diagnostic Gate Block: Pathology biopsy reports cannot be authorized or released without invoice payment at Cashier.');
      return;
    }
    if (!grossText.trim() || !microText.trim() || !diagnosisText.trim()) {
      alert('Please complete Gross description, Microscopic description, and Definitive Diagnosis.');
      return;
    }

    const timestamp = new Date().toISOString();

    onUpdateDb((prev) => {
      const updatedOrders = (prev.pathologyOrders || []).map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: 'completed' as const,
              grossDescription: grossText.trim(),
              microscopicDescription: microText.trim(),
              definitiveDiagnosis: diagnosisText.trim(),
              specialStainsOrIHC: stainsUsed,
              snodentOrIcdCode: snodentCode,
              reportedAt: timestamp,
              pathologistName: currentUser.name,
              version: (o.version || 1) + 1,
            }
          : o
      );

      return {
        ...prev,
        pathologyOrders: updatedOrders,
      };
    });

    broadcast(
      'PATHOLOGY_COMPLETED',
      'Histopathology PC',
      'Pathology Report Signed & Released',
      `Pathology ${order.orderNumber} (${order.specimenType}) for ${order.patientName} signed off by ${currentUser.name}.`
    );

    // Prompt print
    onPrint({
      type: 'pathology_report',
      data: {
        ...order,
        status: 'completed',
        grossDescription: grossText.trim(),
        microscopicDescription: microText.trim(),
        definitiveDiagnosis: diagnosisText.trim(),
        specialStainsOrIHC: stainsUsed,
        snodentOrIcdCode: snodentCode,
        reportedAt: timestamp,
        pathologistName: currentUser.name,
      },
      settings: db.settings,
    });
  };

  const isPaid = selectedOrder?.paymentStatus === 'paid';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-5 border border-rose-900/50 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/30">
            <Microscope className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-300 border border-rose-400/30">
                Workstation PC · PATH-01
              </span>
              <span className="text-xs text-rose-300 font-semibold">
                Histopathology & Cytology Suite (Pathology Lab B)
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              SPEED Histopathology & Cytology Workstation
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-rose-900/60 border border-rose-700/60 text-rose-200 text-xs font-mono">
            Accessioned: <strong className="text-white">{(db.pathologyOrders || []).filter((o) => o.status !== 'completed').length}</strong> specimens
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-mono">
            Signed Today: <strong className="text-white">{(db.pathologyOrders || []).filter((o) => o.status === 'completed').length}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Worklist Column (4 Cols) - Independent Sticky Queue */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Microscope className="w-4 h-4 text-rose-600" />
                <span>Specimen Queue ({filteredOrders.length})</span>
              </span>
            </div>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 font-bold rounded-lg transition text-center ${
                  statusFilter === 'all' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                Reported
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, order, specimen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="space-y-2.5 h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                No pathology specimens in queue.
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
                        ? 'border-rose-500 ring-2 ring-rose-200 shadow-sm'
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

                      <div className="text-xs text-rose-700 font-bold mt-2">
                        {o.specimenType} · {o.specimenSite}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{o.clinicalHistory}</p>
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

        {/* Diagnosis Column (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Histopathological & Cytological Diagnostic Bench
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                      {selectedOrder.orderNumber}
                    </span>
                    <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {selectedOrder.specimenType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Patient: <strong className="text-slate-900">{selectedOrder.patientName}</strong> · Site: {selectedOrder.specimenSite}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onPrint({
                        type: 'pathology_report',
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
                    <span>Pathology processing fee of {formatCurrency(selectedOrder.price, db.settings.currency)} is currently pending at Cashier.</span>
                  </div>
                </div>
              )}

              {/* Clinical Indication Strip */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Clinical History & Pre-Op Diagnosis: </span>
                <span className="text-slate-600">{selectedOrder.clinicalHistory}</span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Gross Examination Description: *
                  </label>
                  <textarea
                    rows={2}
                    value={grossText}
                    onChange={(e) => setGrossText(e.target.value)}
                    placeholder="Received in formalin labeled with patient credentials. Consists of 3 fragments of brownish-pink soft tissue measuring 0.8 x 0.5 x 0.3 cm..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Staining Method / Special Stains:
                    </label>
                    <input
                      type="text"
                      value={stainsUsed}
                      onChange={(e) => setStainsUsed(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      SNOMED / ICD-O Morphology Code:
                    </label>
                    <input
                      type="text"
                      value={snodentCode}
                      onChange={(e) => setSnodentCode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Microscopic Evaluation: *
                  </label>
                  <textarea
                    rows={3}
                    value={microText}
                    onChange={(e) => setMicroText(e.target.value)}
                    placeholder="Sections reveal stratified squamous epithelium with baseline maturation. No nuclear pleomorphism, hyperchromasia or atypical mitotic figures identified..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1.5">
                    Definitive Pathological Diagnosis: *
                  </label>
                  <textarea
                    rows={2}
                    value={diagnosisText}
                    onChange={(e) => setDiagnosisText(e.target.value)}
                    placeholder="e.g., GASTRIC BIOPSY: Chronic active gastritis with moderate lymphoplasmacytic infiltration. Negative for intestinal metaplasia or dysplasia..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-500">
                    Signing Pathologist: <strong className="text-slate-800">{currentUser.name}</strong>
                  </div>

                  <button
                    onClick={() => handleCompletePathology(selectedOrder)}
                    className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Release Pathology Report</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a pathology specimen from the worklist to start diagnostic examination.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
