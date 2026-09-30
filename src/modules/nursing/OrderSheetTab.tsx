import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  FileCheck,
  User,
} from 'lucide-react';
import { Visit, Patient, DoctorOrder, User as AppUser, DatabaseState } from '../../types/clinic';
import { formatDateTime } from '../../utils/formatters';

interface OrderSheetTabProps {
  visit: Visit;
  patient: Patient | null;
  orders: DoctorOrder[];
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const OrderSheetTab: React.FC<OrderSheetTabProps> = ({
  visit,
  patient,
  orders,
  currentUser,
  onUpdateDb,
  broadcast,
}) => {
  const patientOrders = orders.filter((o) => o.visitId === visit.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctorName, setDoctorName] = useState(visit.doctorAssignedName || 'Dr. Sarah Chen, MD');
  const [orderDesc, setOrderDesc] = useState('');
  const [orderType, setOrderType] = useState<DoctorOrder['orderType']>('stat');

  const handleMarkCarriedOut = (orderId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      doctorOrders: (prev.doctorOrders || []).map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'completed',
              executedByNurse: currentUser.name,
              executedAt: new Date().toISOString(),
              executionNotes: 'Order executed as directed by attending physician.',
            }
          : o
      ),
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Order Executed: ${visit.patientName}`,
      `Nurse ${currentUser.name} carried out physician order for ${visit.patientName}.`
    );
  };

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDesc.trim()) return;

    const newOrder: DoctorOrder = {
      id: `ord_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      orderDate: new Date().toISOString(),
      orderedByDoctor: doctorName,
      orderDescription: orderDesc.trim(),
      orderType,
      status: 'active',
    };

    onUpdateDb((prev) => ({
      ...prev,
      doctorOrders: [newOrder, ...(prev.doctorOrders || [])],
    }));

    broadcast(
      'CONSULTATION_SAVED',
      'Nurse Station',
      `Physician Order Added: ${visit.patientName}`,
      `Verbal/Stat Order logged for ${visit.patientName}: "${orderDesc.trim()}".`
    );

    setOrderDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Physician Clinical Order Sheet & Nurse Execution Log
            </h3>
            <p className="text-xs text-slate-500">
              Transcription and execution of medical orders (Stat, Routine, Standing, PRN) with nurse verification sign-off.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Verbal / Stat Doctor Order</span>
        </button>
      </div>

      {/* Add Order Form / Drawer */}
      {showAddModal && (
        <form onSubmit={handleAddOrder} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-purple-600" /> Log Emergency Verbal or Rounding Doctor Order
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Ordering Doctor
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Order Type / Urgency
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="stat">STAT (Immediate Execution)</option>
                <option value="routine">Routine Care</option>
                <option value="standing">Standing Inpatient Order</option>
                <option value="prn">PRN (As Needed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Physician Order Description *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Infuse 500ml Ringer's Lactate over 4 hours. Keep NPO after midnight for endoscopy..."
              value={orderDesc}
              onChange={(e) => setOrderDesc(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
            >
              Append Order to Chart
            </button>
          </div>
        </form>
      )}

      {/* Orders Table */}
      {patientOrders.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No doctor clinical orders logged for this patient yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ Add Verbal / Stat Doctor Order" to record instructions from rounds or telephone triage.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Doctor</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Clinical Order</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Nurse Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientOrders.map((ord) => {
                const isCompleted = ord.status === 'completed';

                return (
                  <tr key={ord.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDateTime(ord.orderDate)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                      {ord.orderedByDoctor}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          ord.orderType === 'stat'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : ord.orderType === 'standing'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 font-medium">
                      {ord.orderDescription}
                      {ord.executionNotes && (
                        <div className="text-[10px] text-slate-500 mt-0.5 italic">
                          Notes: {ord.executionNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {isCompleted ? (
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done by {ord.executedByNurse}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkCarriedOut(ord.id)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition shadow-2xs"
                        >
                          Mark Carried Out
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
