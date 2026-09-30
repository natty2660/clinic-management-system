import React, { useState } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { Visit, DatabaseState, User } from '../../types/clinic';
import { formatTimeOnly } from '../../utils/formatters';

interface WaitingListTabProps {
  visits: Visit[];
  selectedVisitId: string;
  onSelectVisit: (visitId: string) => void;
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const WaitingListTab: React.FC<WaitingListTabProps> = ({
  visits,
  selectedVisitId,
  onSelectVisit,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const now = Date.now();

  const filteredVisits = visits.filter((v) => {
    const matchesSearch =
      v.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.patientMrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(v.queueNumber).includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterStatus === 'needs_triage') return !v.vitals;
    if (filterStatus === 'triaged') return !!v.vitals;
    if (filterStatus === 'waiting_doctor') return v.status === 'waiting_doctor';
    if (filterStatus === 'in_consultation') return v.status === 'in_consultation';

    return true;
  });

  const getWaitMinutes = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    return Math.max(0, Math.floor((now - created) / 60000));
  };

  const handleCallPatient = (v: Visit) => {
    broadcast(
      'DOCTOR_QUEUE_UPDATED',
      'Nurse Station',
      `Triage Call: Q #${v.queueNumber} ${v.patientName}`,
      `Nurse ${currentUser.name} called Q #${v.queueNumber} ${v.patientName} to the Triage & Observation Room.`
    );
  };

  const handleFlagEmergency = (v: Visit) => {
    onUpdateDb((prev) => ({
      ...prev,
      visits: prev.visits.map((vis) =>
        vis.id === v.id
          ? {
              ...vis,
              emergencyOverridden: true,
              vitals: vis.vitals
                ? {
                    ...vis.vitals,
                    triageLevel: 1,
                    triageCategory: 'Immediate (Red)',
                    triageColor: '#ef4444',
                  }
                : {
                    triageLevel: 1,
                    triageCategory: 'Immediate (Red)',
                    triageColor: '#ef4444',
                    recordedAt: new Date().toISOString(),
                    recordedBy: currentUser.name,
                  },
              version: (vis.version || 1) + 1,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : vis
      ),
    }));

    broadcast(
      'EMERGENCY_OVERRIDE',
      'Nurse Station',
      `EMERGENCY TRIAGE ALERT: ${v.patientName}`,
      `Nurse ${currentUser.name} marked ${v.patientName} (Q #${v.queueNumber}) as High Priority Resuscitation (Red). Doctor notification dispatched.`
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Live Clinic Waiting List & Queue Status
          </h3>
          <p className="text-xs text-slate-500">
            Real-time multi-workstation patient progression, elapsed wait times, and rapid triage dispatch.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, queue #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-full sm:w-64 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            filterStatus === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Patients ({visits.length})
        </button>
        <button
          onClick={() => setFilterStatus('needs_triage')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            filterStatus === 'needs_triage'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Needs Triage ({visits.filter((v) => !v.vitals).length})
        </button>
        <button
          onClick={() => setFilterStatus('triaged')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            filterStatus === 'triaged'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Triage Done ({visits.filter((v) => !!v.vitals).length})
        </button>
        <button
          onClick={() => setFilterStatus('waiting_doctor')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            filterStatus === 'waiting_doctor'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Waiting Doctor ({visits.filter((v) => v.status === 'waiting_doctor').length})
        </button>
      </div>

      {/* Waiting List Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Queue #</th>
              <th className="py-2.5 px-3">Patient</th>
              <th className="py-2.5 px-3">Age / Gender</th>
              <th className="py-2.5 px-3">Wait Time</th>
              <th className="py-2.5 px-3">Triage Status</th>
              <th className="py-2.5 px-3">Assigned Doctor</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No patients matching this queue filter.
                </td>
              </tr>
            ) : (
              filteredVisits.map((v) => {
                const isSelected = v.id === selectedVisitId;
                const waitMins = getWaitMinutes(v.createdAt);
                const hasVitals = !!v.vitals;

                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-purple-50/50 transition cursor-pointer ${
                      isSelected ? 'bg-purple-50 font-medium' : ''
                    }`}
                    onClick={() => onSelectVisit(v.id)}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded text-[11px]">
                        #{v.queueNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block">{v.patientName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">{v.patientMrn}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {v.patientAge}y · {v.patientGender}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          waitMins > 30
                            ? 'bg-red-100 text-red-800'
                            : waitMins > 15
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {waitMins} min
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          v.vitals?.triageCategory?.includes('Red') || v.vitals?.triageCategory?.includes('Orange')
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : hasVitals
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.vitals?.triageCategory || (hasVitals ? 'Vitals Logged' : 'Needs Triage')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {v.doctorAssignedName || 'General OPD'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleCallPatient(v)}
                          title="Call Patient to Triage Room"
                          className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFlagEmergency(v)}
                          title="Mark Emergency High Priority (Red)"
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectVisit(v.id)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
