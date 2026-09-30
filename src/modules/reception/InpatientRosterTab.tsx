import React, { useState } from 'react';
import {
  BedDouble,
  Search,
  Printer,
  Clock,
  User,
  Stethoscope,
  Filter,
  CheckCircle2,
  DollarSign,
  ArrowRightLeft,
  DoorOpen,
  Eye,
  FileText,
} from 'lucide-react';
import { DatabaseState, InpatientAdmission, Bed, User as ClinicUser } from '../../types/clinic';
import { formatDateOnly, formatCurrency } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientRosterTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onNavigateToDischarge: (admission: InpatientAdmission) => void;
}

export const InpatientRosterTab: React.FC<InpatientRosterTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onNavigateToDischarge,
}) => {
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);

  const admissions = (db.admissions || []).filter((adm) => {
    const matchesSearch =
      adm.patientName.toLowerCase().includes(search.toLowerCase()) ||
      adm.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      adm.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      adm.bedNumber.toLowerCase().includes(search.toLowerCase());

    const matchesWard = wardFilter === 'all' || adm.wardId === wardFilter;
    return matchesSearch && matchesWard;
  });

  const wards = db.wards || [];

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-indigo-600" />
            <span>Active Hospital Inpatients Census Roster</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Full administrative record of currently admitted ward patients, bed allocations, and admission deposits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search IPD#, MRN, Name, Bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-56"
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Wards ({wards.length})</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inpatients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">IPD Number</th>
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4">Ward & Bed</th>
                <th className="py-3 px-4">Admit Date & LOS</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Provisional Diagnosis</th>
                <th className="py-3 px-4">Deposit Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admissions.map((adm) => {
                const isDischarged = adm.status === 'discharged';
                return (
                  <tr key={adm.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {adm.admissionNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{adm.patientName}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {adm.patientMrn} • {adm.patientAge}y/{adm.patientGender.toUpperCase()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{adm.wardName}</div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-900 text-white rounded">
                        {adm.bedNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{formatDateOnly(adm.admissionDate)}</div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        LOS: {adm.lengthOfStayDays || 1} day(s)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-indigo-600" />
                        <span>{adm.admittingDoctorName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{adm.department}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="truncate text-slate-700 font-medium" title={adm.provisionalDiagnosis}>
                        {adm.provisionalDiagnosis}
                      </div>
                      {adm.icdCode && (
                        <span className="text-[10px] font-mono text-slate-400">ICD: {adm.icdCode}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {adm.depositPaid ? (
                        <div className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{formatCurrency(adm.initialDeposit, db.settings.currency)}</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 font-bold flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAdmission(adm)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title="View Case Sheet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onPrint({
                              type: 'inpatient_admission_card',
                              data: adm,
                              settings: db.settings,
                            })
                          }
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title="Print Admission Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToDischarge(adm)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-bold transition flex items-center gap-1"
                          title="Discharge Clearance Desk"
                        >
                          <DoorOpen className="w-3 h-3" />
                          <span>Clearance</span>
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

      {/* Admission Quick Inspect Modal */}
      {selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-700">
                  {selectedAdmission.admissionNumber} • MRN: {selectedAdmission.patientMrn}
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedAdmission.patientName}</h3>
              </div>
              <span className="text-xs font-mono font-black px-2 py-1 bg-indigo-900 text-white rounded">
                {selectedAdmission.wardName} ({selectedAdmission.bedNumber})
              </span>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Date</span>
                  <span className="font-bold text-slate-800">
                    {formatDateOnly(selectedAdmission.admissionDate)} at {selectedAdmission.admissionTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Attending Consultant</span>
                  <span className="font-bold text-slate-800">{selectedAdmission.admittingDoctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Admission Type</span>
                  <span className="font-bold text-slate-800">{selectedAdmission.admissionType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Deposit</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(selectedAdmission.initialDeposit, db.settings.currency)} (
                    {selectedAdmission.depositPaid ? 'PAID' : 'PENDING'})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Provisional Diagnosis
                </span>
                <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 font-medium text-slate-800">
                  {selectedAdmission.provisionalDiagnosis}
                  {selectedAdmission.icdCode && (
                    <span className="block font-mono text-[10px] text-slate-500 mt-1">
                      ICD-10: {selectedAdmission.icdCode}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Emergency Contact
                </span>
                <div className="text-slate-700 font-medium">
                  {selectedAdmission.emergencyContactName} ({selectedAdmission.emergencyContactRelation}) •{' '}
                  <span className="font-mono">{selectedAdmission.emergencyContactPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                className="px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onPrint({
                    type: 'inpatient_admission_card',
                    data: selectedAdmission,
                    settings: db.settings,
                  })
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
