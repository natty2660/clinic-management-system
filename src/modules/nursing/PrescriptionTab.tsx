import React from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  Printer,
  Syringe,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { Visit, Patient, Prescription, User, NursingRecord, DatabaseState } from '../../types/clinic';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface PrescriptionTabProps {
  visit: Visit;
  patient: Patient | null;
  prescriptions: Prescription[];
  currentUser: User;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onPrint?: (prescription: Prescription) => void;
  onSwitchToTreatment?: () => void;
}

export const PrescriptionTab: React.FC<PrescriptionTabProps> = ({
  visit,
  patient,
  prescriptions,
  currentUser,
  onUpdateDb,
  broadcast,
  onPrint,
  onSwitchToTreatment,
}) => {
  const patientPrescriptions = prescriptions.filter((p) => p.visitId === visit.id);

  const handleAdministerMedication = (rx: Prescription, item: any) => {
    const newRecord: NursingRecord = {
      id: `nur_${Date.now()}`,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      time: new Date().toISOString(),
      actionType: 'medication_administered',
      description: `Administered doctor prescription: ${item.medicineName} (${item.dosage}, ${item.frequency}). Prescribed by ${rx.orderedByDoctor}.`,
      medicationName: item.medicineName,
      dosage: item.dosage,
      route: 'Oral / Per Protocol',
      administeredBy: currentUser.name,
      fiveRightsVerified: true,
      status: 'administered',
    };

    onUpdateDb((prev) => ({
      ...prev,
      nursingRecords: [newRecord, ...prev.nursingRecords],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `Rx Administered: ${item.medicineName}`,
      `Nurse ${currentUser.name} administered prescribed ${item.medicineName} (${item.dosage}) to ${visit.patientName}.`
    );

    if (onSwitchToTreatment) {
      onSwitchToTreatment();
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Physician Prescriptions & Nurse MAR Administration
            </h3>
            <p className="text-xs text-slate-500">
              Direct access to medications ordered by the attending doctor with 1-click MAR logging.
            </p>
          </div>
        </div>
      </div>

      {patientPrescriptions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-sm">No prescriptions logged for this visit yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Prescriptions ordered by Doctor OPD will automatically appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {patientPrescriptions.map((rx) => (
            <div key={rx.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              {/* Prescription Header */}
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900 mr-2">{rx.prescriptionNumber}</span>
                  <span className="text-slate-500">
                    Ordered by <strong>{rx.orderedByDoctor}</strong> · {formatDateTime(rx.prescribedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rx.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Payment: {rx.paymentStatus}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rx.status === 'dispensed'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Pharmacy: {rx.status}
                  </span>
                  {onPrint && (
                    <button
                      onClick={() => onPrint(rx)}
                      className="p-1 text-slate-600 hover:text-purple-600 hover:bg-white rounded transition"
                      title="Print Prescription Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="p-3 divide-y divide-slate-100">
                {rx.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="text-slate-900 text-sm">{item.medicineName}</strong>
                      <div className="text-slate-600 mt-0.5">
                        Dose: <span className="font-semibold text-purple-700">{item.dosage}</span> · Frequency: <strong>{item.frequency}</strong> · Duration: {item.duration} · Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-700 font-mono font-bold">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <button
                        onClick={() => handleAdministerMedication(rx, item)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Syringe className="w-3.5 h-3.5" />
                        <span>Administer Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
