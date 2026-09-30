import React, { useState } from 'react';
import {
  Users,
  Search,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Filter,
  Eye,
  FileText,
  Activity,
} from 'lucide-react';
import { DatabaseState, Visit, EntryCard, User as ClinicUser } from '../../types/clinic';
import { formatDateTime, formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface OpdLiveRosterTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
}

export const OpdLiveRosterTab: React.FC<OpdLiveRosterTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const visits = db.visits.filter((v) => {
    const matchesSearch =
      v.patientName.toLowerCase().includes(search.toLowerCase()) ||
      v.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      v.visitNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.queueNumber.toString().includes(search);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'waiting' && (v.status === 'waiting_doctor' || v.status === 'registered')) ||
      (statusFilter === 'consulting' && v.status === 'in_consultation') ||
      (statusFilter === 'completed' && (v.status === 'completed' || v.status === 'discharged'));

    return matchesSearch && matchesStatus;
  });

  const handlePrintSlip = (v: Visit) => {
    let card = db.entryCards.find((c) => c.visitId === v.id);
    if (!card) {
      card = {
        id: `card_${Date.now()}`,
        visitId: v.id,
        patientMrn: v.patientMrn,
        patientName: v.patientName,
        queueNumber: v.queueNumber,
        issuedAt: new Date().toISOString(),
        issuedBy: currentUser.name,
        paymentStatus: v.consultationPaid ? 'paid' : 'pending',
        qrCodeData: `SPEED:${v.visitNumber}|MRN:${v.patientMrn}|Q:${v.queueNumber}`,
        barcode: v.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
      };
    }
    onPrint({
      type: 'entry_card',
      data: card,
      settings: db.settings,
    });
  };

  const getStatusBadge = (status: Visit['status']) => {
    switch (status) {
      case 'registered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-800">1. Registered</span>;
      case 'waiting_doctor':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 animate-pulse">2. Waiting Doctor</span>;
      case 'in_consultation':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900">3. In Consultation</span>;
      case 'waiting_lab':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900">4. Lab Testing</span>;
      case 'waiting_pharmacy':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-900">5. At Pharmacy</span>;
      case 'completed':
      case 'discharged':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">✓ Completed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>Live OPD Patient Journey Board</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient clinical progress tracker from arrival to doctor exam and discharge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search MRN, Name, Visit#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Statuses ({db.visits.length})</option>
            <option value="waiting">Waiting Doctor</option>
            <option value="consulting">In Consultation</option>
            <option value="completed">Completed / Discharged</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Queue #</th>
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Department & Doctor</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4">Clinical Flow Stage</th>
                <th className="py-3 px-4">Fee Paid</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => {
                const triageAlert = v.vitals?.triageCategory === 'Emergency' || v.vitals?.triageCategory === 'Urgent';

                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-bold text-xs">
                        Q-{v.queueNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{v.patientName}</span>
                        {triageAlert && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">{v.patientMrn}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {v.patientAge}y • {v.patientGender.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{v.department}</div>
                      <div className="text-[11px] text-teal-700 flex items-center gap-1 font-medium">
                        <Stethoscope className="w-3 h-3" />
                        <span>{v.doctorAssignedName || 'Room 101'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatTimeOnly(v.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(v.status)}
                    </td>
                    <td className="py-3 px-4">
                      {v.consultationPaid ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedVisit(v)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintSlip(v)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title="Print Entry Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {selectedVisit.visitNumber} • {selectedVisit.patientMrn}
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedVisit.patientName}</h3>
              </div>
              <span className="text-sm font-mono font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                Queue #{selectedVisit.queueNumber}
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age & Gender</span>
                  <span className="font-bold text-slate-800">
                    {selectedVisit.patientAge} years • {selectedVisit.patientGender.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Attending Doctor</span>
                  <span className="font-bold text-slate-800">{selectedVisit.doctorAssignedName || 'OPD Physician'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-bold text-slate-800">{selectedVisit.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Flow Status</span>
                  <span className="font-bold text-teal-800 capitalize">{selectedVisit.status.replace('_', ' ')}</span>
                </div>
              </div>

              {selectedVisit.vitals && (
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200/60">
                  <span className="text-[10px] uppercase font-bold text-teal-800 block mb-1">Triage Observation</span>
                  <div className="text-xs text-slate-700">
                    Priority: <strong>{selectedVisit.vitals.triageCategory || 'Standard'}</strong> • Pain Score:{' '}
                    <strong>{selectedVisit.vitals.painScore || 0}/10</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintSlip(selectedVisit);
                  setSelectedVisit(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Entry Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
