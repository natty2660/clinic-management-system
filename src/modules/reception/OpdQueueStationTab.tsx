import React, { useState } from 'react';
import {
  Ticket,
  Printer,
  Clock,
  User,
  Stethoscope,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Volume2,
  RefreshCw,
  Eye,
  Filter,
} from 'lucide-react';
import { DatabaseState, Visit, EntryCard, User as ClinicUser } from '../../types/clinic';
import { PrintContentType } from '../../components/PrintModal';

interface OpdQueueStationTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const OpdQueueStationTab: React.FC<OpdQueueStationTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [search, setSearch] = useState('');
  const [transferringVisit, setTransferringVisit] = useState<Visit | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState<string>('');

  const doctors = db.users.filter((u) => u.role === 'doctor' && u.active);

  // Filter visits
  const filteredVisits = db.visits.filter((v) => {
    // Search
    const matchesSearch =
      v.patientName.toLowerCase().includes(search.toLowerCase()) ||
      v.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      v.queueNumber.toString().includes(search);

    // Doctor filter
    const matchesDoctor = filterDoctor === 'all' || v.doctorAssignedId === filterDoctor;

    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'waiting') matchesStatus = v.status === 'waiting_doctor';
    else if (filterStatus === 'in_consultation') matchesStatus = v.status === 'in_consultation';
    else if (filterStatus === 'active') matchesStatus = v.status !== 'completed' && v.status !== 'discharged';
    else if (filterStatus === 'completed') matchesStatus = v.status === 'completed' || v.status === 'discharged';

    return matchesSearch && matchesDoctor && matchesStatus;
  });

  // Print entry card for visit
  const handlePrintEntrySlip = (visit: Visit) => {
    let card = db.entryCards.find((c) => c.visitId === visit.id);
    if (!card) {
      card = {
        id: `card_${Date.now()}`,
        visitId: visit.id,
        patientMrn: visit.patientMrn,
        patientName: visit.patientName,
        queueNumber: visit.queueNumber,
        issuedAt: new Date().toISOString(),
        issuedBy: currentUser.name,
        paymentStatus: visit.consultationPaid ? 'paid' : 'pending',
        qrCodeData: `SPEED:${visit.visitNumber}|MRN:${visit.patientMrn}|Q:${visit.queueNumber}`,
        barcode: visit.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
      };
      onUpdateDb((prev) => ({
        ...prev,
        entryCards: [card!, ...prev.entryCards],
      }));
    }

    onPrint({
      type: 'entry_card',
      data: card,
      settings: db.settings,
    });
  };

  // Re-call patient over public address
  const handleCallPatient = (visit: Visit) => {
    broadcast(
      'DOCTOR_QUEUE_UPDATED',
      'Reception PC',
      `Calling Queue #${visit.queueNumber}`,
      `Patient ${visit.patientName} please report to ${visit.doctorAssignedName || 'OPD Room'}`
    );
  };

  // Transfer visit to another doctor
  const handleConfirmTransfer = () => {
    if (!transferringVisit || !targetDoctorId) return;
    const targetDoc = doctors.find((d) => d.id === targetDoctorId);
    if (!targetDoc) return;

    onUpdateDb((prev) => ({
      ...prev,
      visits: prev.visits.map((v) =>
        v.id === transferringVisit.id
          ? {
              ...v,
              doctorAssignedId: targetDoc.id,
              doctorAssignedName: targetDoc.name,
              department: targetDoc.department.replace('SPEED ', ''),
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : v
      ),
    }));

    broadcast(
      'DOCTOR_QUEUE_UPDATED',
      'Reception PC',
      'Queue Transferred',
      `Queue #${transferringVisit.queueNumber} (${transferringVisit.patientName}) redirected to ${targetDoc.name}.`
    );

    setTransferringVisit(null);
    setTargetDoctorId('');
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-teal-600" />
            <span>OPD Queue Dispatch & Entry Card Desk</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time patient queue tickets, reprint thermal passes, and balance doctor room loads.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Queue # or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Doctor Filter */}
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Attending Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="active">Active Queue (Waiting & With Doctor)</option>
            <option value="waiting">Waiting in Waiting Area</option>
            <option value="in_consultation">Currently In Consultation</option>
            <option value="completed">Finished & Completed</option>
          </select>
        </div>
      </div>

      {/* Queue Tickets List */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-black text-slate-800 text-sm">No Patients in Selected Queue</h4>
          <p className="text-xs text-slate-500 mt-1">Register a new patient or adjust filters to view tickets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredVisits.map((visit) => {
            const isEmergency = visit.vitals?.triageCategory === 'Emergency';
            const isUrgent = visit.vitals?.triageCategory === 'Urgent';
            const isWaiting = visit.status === 'waiting_doctor' || visit.status === 'registered';
            const isInExam = visit.status === 'in_consultation';

            return (
              <div
                key={visit.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition hover:shadow-md ${
                  isEmergency
                    ? 'border-red-400 bg-red-50/20 ring-1 ring-red-300'
                    : isUrgent
                    ? 'border-amber-300 bg-amber-50/20'
                    : isInExam
                    ? 'border-blue-300 bg-blue-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Ticket Header */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                        Q-{visit.queueNumber}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 block">
                          {visit.patientMrn}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm leading-tight mt-0.5">
                          {visit.patientName}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      {isEmergency ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                          STAT RED
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                          URGENT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          ROUTINE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visit Clinical Details */}
                  <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Demographics:</span>
                      <span className="font-medium text-slate-700">
                        {visit.patientAge}y • {visit.patientGender.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Doctor Room:</span>
                      <span className="font-bold text-teal-800 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-teal-600" />
                        <span>{visit.doctorAssignedName || 'Unassigned'}</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-700">{visit.department}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Queue State:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isInExam
                          ? 'bg-blue-100 text-blue-800'
                          : isWaiting
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {visit.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Fee Status:</span>
                      <span className={visit.consultationPaid ? "font-bold text-emerald-700" : "font-bold text-red-600"}>
                        {visit.consultationPaid ? "✓ Consultation Paid" : "⏳ Pending Payment"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCallPatient(visit)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-teal-700 rounded-lg transition"
                      title="Audio Call Patient to Room"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferringVisit(visit);
                        setTargetDoctorId(doctors.find((d) => d.id !== visit.doctorAssignedId)?.id || '');
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-indigo-700 rounded-lg transition"
                      title="Transfer to Another Doctor"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePrintEntrySlip(visit)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-400" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Doctor Transfer Modal */}
      {transferringVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              <span>Transfer Queue #{transferringVisit.queueNumber}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Reassign patient <strong>{transferringVisit.patientName}</strong> to another available doctor room.
            </p>

            <div className="my-4 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Target Attending Doctor</label>
              <select
                value={targetDoctorId}
                onChange={(e) => setTargetDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold bg-white"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} • {d.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferringVisit(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
