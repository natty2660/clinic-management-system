import React, { useState } from 'react';
import {
  Grid,
  BedDouble,
  Building2,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
  Printer,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  User,
  Clock,
} from 'lucide-react';
import { DatabaseState, Ward, Bed, InpatientAdmission, User as ClinicUser } from '../../types/clinic';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientWardBedMatrixTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onAdmitToBed: (bed: Bed) => void;
}

export const InpatientWardBedMatrixTab: React.FC<InpatientWardBedMatrixTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  onAdmitToBed,
}) => {
  const wards = db.wards || [];
  const beds = db.beds || [];
  const admissions = db.admissions || [];

  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [transferModalBed, setTransferModalBed] = useState<Bed | null>(null);
  const [targetBedId, setTargetBedId] = useState<string>('');

  // Filtered wards
  const displayWards = wards.filter(
    (w) => selectedWardFilter === 'all' || w.id === selectedWardFilter
  );

  // Mark cleaning bed as ready
  const handleMarkBedReady = (bedId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      beds: (prev.beds || []).map((b) =>
        b.id === bedId ? { ...b, status: 'available' as const } : b
      ),
    }));

    broadcast(
      'WORKSTATION_PING',
      'Reception PC',
      'Bed Cleaned & Ready',
      `Bed ${beds.find((b) => b.id === bedId)?.bedNumber} sanitized and available for patient intake.`
    );
  };

  // Perform Bed Transfer
  const handleConfirmTransfer = () => {
    if (!transferModalBed || !targetBedId) return;

    const sourceBed = transferModalBed;
    const destBed = beds.find((b) => b.id === targetBedId);
    if (!destBed) return;

    const currentAdm = admissions.find((a) => a.id === sourceBed.currentAdmissionId);

    onUpdateDb((prev) => {
      // Free source bed (mark cleaning)
      const updatedBeds = (prev.beds || []).map((b) => {
        if (b.id === sourceBed.id) {
          return {
            ...b,
            status: 'cleaning' as const,
            currentAdmissionId: undefined,
            currentPatientName: undefined,
            currentPatientMrn: undefined,
          };
        }
        if (b.id === destBed.id) {
          return {
            ...b,
            status: 'occupied' as const,
            currentAdmissionId: sourceBed.currentAdmissionId,
            currentPatientName: sourceBed.currentPatientName,
            currentPatientMrn: sourceBed.currentPatientMrn,
          };
        }
        return b;
      });

      // Update admission record
      const updatedAdmissions = (prev.admissions || []).map((a) =>
        a.id === sourceBed.currentAdmissionId
          ? {
              ...a,
              wardId: destBed.wardId,
              wardName: destBed.wardName,
              bedId: destBed.id,
              bedNumber: destBed.bedNumber,
              updatedAt: new Date().toISOString(),
            }
          : a
      );

      return {
        ...prev,
        beds: updatedBeds,
        admissions: updatedAdmissions,
      };
    });

    broadcast(
      'BED_TRANSFERRED',
      'Reception PC',
      'Patient Bed Transferred',
      `${sourceBed.currentPatientName} transferred from ${sourceBed.wardName} (${sourceBed.bedNumber}) to ${destBed.wardName} (${destBed.bedNumber}).`
    );

    setTransferModalBed(null);
    setTargetBedId('');
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-600" />
            <span>Interactive Ward & Bed Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visual map of all hospital beds across inpatient wards. Click any bed to assign, transfer, or sanitize.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Hospital Wards ({wards.length})</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Bed Statuses</option>
            <option value="available">🟢 Available Beds Only</option>
            <option value="occupied">🔴 Occupied Beds</option>
            <option value="cleaning">🟡 Cleaning / Sanitizing</option>
            <option value="reserved">🟣 Reserved</option>
          </select>
        </div>
      </div>

      {/* Ward Cards & Bed Grids */}
      <div className="space-y-6">
        {displayWards.map((ward) => {
          const wardBeds = beds.filter((b) => {
            const matchesWard = b.wardId === ward.id;
            const matchesStatus =
              selectedStatusFilter === 'all' || b.status === selectedStatusFilter;
            return matchesWard && matchesStatus;
          });

          const totalInWard = beds.filter((b) => b.wardId === ward.id).length;
          const freeInWard = beds.filter((b) => b.wardId === ward.id && b.status === 'available').length;
          const occupiedInWard = beds.filter((b) => b.wardId === ward.id && b.status === 'occupied').length;

          return (
            <div key={ward.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              {/* Ward Header */}
              <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-sm">{ward.name}</h4>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                        {ward.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {ward.floor} • In charge: <strong>{ward.nurseInCharge}</strong> •{' '}
                      {formatCurrency(ward.ratePerDay, db.settings.currency)}/night
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {freeInWard} Available
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800">
                    {occupiedInWard} Occupied
                  </span>
                </div>
              </div>

              {/* Beds Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {wardBeds.map((bed) => {
                  const isAvailable = bed.status === 'available';
                  const isOccupied = bed.status === 'occupied';
                  const isCleaning = bed.status === 'cleaning';
                  const isReserved = bed.status === 'reserved';

                  const adm = admissions.find((a) => a.id === bed.currentAdmissionId);

                  return (
                    <div
                      key={bed.id}
                      className={`rounded-xl border p-3.5 shadow-2xs flex flex-col justify-between transition ${
                        isAvailable
                          ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 hover:shadow-xs'
                          : isOccupied
                          ? 'border-red-300 bg-red-50/15'
                          : isCleaning
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-purple-300 bg-purple-50/20'
                      }`}
                    >
                      <div>
                        {/* Bed Header */}
                        <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <BedDouble
                              className={`w-4 h-4 ${
                                isAvailable
                                  ? 'text-emerald-600'
                                  : isOccupied
                                  ? 'text-red-600'
                                  : isCleaning
                                  ? 'text-amber-600'
                                  : 'text-purple-600'
                              }`}
                            />
                            <span className="font-mono font-black text-sm text-slate-900">
                              {bed.bedNumber}
                            </span>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOccupied
                                ? 'bg-red-100 text-red-800'
                                : isCleaning
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {bed.status}
                          </span>
                        </div>

                        {/* Bed Content */}
                        <div className="py-2 space-y-1 text-xs">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Type: <strong className="text-slate-600 capitalize">{bed.type.replace('_', ' ')}</strong>
                          </div>

                          {isOccupied && (
                            <div className="bg-white p-2 rounded-lg border border-red-200/60 mt-1 space-y-0.5">
                              <span className="font-mono text-[10px] font-bold text-red-700 block">
                                {bed.currentPatientMrn || 'PATIENT'}
                              </span>
                              <div className="font-black text-slate-900 text-xs truncate">
                                {bed.currentPatientName}
                              </div>
                              {adm && (
                                <div className="text-[10px] text-slate-500 pt-0.5">
                                  Admitted: {formatDateOnly(adm.admissionDate)} ({adm.lengthOfStayDays || 0}d)
                                </div>
                              )}
                            </div>
                          )}

                          {isAvailable && (
                            <div className="text-emerald-700 text-xs font-semibold py-1">
                              ✓ Sanitized & Ready for new patient
                            </div>
                          )}

                          {isCleaning && (
                            <div className="text-amber-800 text-xs font-medium py-1">
                              ⏳ Bed linen changing & terminal cleaning
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bed Action Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {formatCurrency(bed.dailyRate, db.settings.currency)}/d
                        </span>

                        {isAvailable && (
                          <button
                            type="button"
                            onClick={() => onAdmitToBed(bed)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            + Admit Here
                          </button>
                        )}

                        {isOccupied && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setTransferModalBed(bed);
                                const otherFree = beds.find((b) => b.id !== bed.id && b.status === 'available');
                                if (otherFree) setTargetBedId(otherFree.id);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition flex items-center gap-1"
                              title="Transfer Bed"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
                              <span>Transfer</span>
                            </button>
                            {adm && (
                              <button
                                type="button"
                                onClick={() =>
                                  onPrint({
                                    type: 'inpatient_admission_card',
                                    data: adm,
                                    settings: db.settings,
                                  })
                                }
                                className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                                title="Print Card"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {isCleaning && (
                          <button
                            type="button"
                            onClick={() => handleMarkBedReady(bed.id)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            ✓ Mark Ready
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Transfer Modal */}
      {transferModalBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              <span>Transfer Inpatient Bed</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Move patient <strong>{transferModalBed.currentPatientName}</strong> from{' '}
              <strong>
                {transferModalBed.wardName} ({transferModalBed.bedNumber})
              </strong>{' '}
              to another vacant hospital bed.
            </p>

            <div className="my-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Target Vacant Bed</label>
              <select
                value={targetBedId}
                onChange={(e) => setTargetBedId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white"
              >
                <option value="">-- Choose Target Bed --</option>
                {beds
                  .filter((b) => b.id !== transferModalBed.id && b.status === 'available')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.wardName} • {b.bedNumber} ({b.type.toUpperCase()}) -{' '}
                      {formatCurrency(b.dailyRate, db.settings.currency)}/night
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModalBed(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={!targetBedId}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Bed Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
