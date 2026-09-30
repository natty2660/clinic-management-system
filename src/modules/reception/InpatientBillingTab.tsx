import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Wallet,
  AlertTriangle,
  Receipt,
  FileText,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { DatabaseState, InpatientAdmission, Payment, User as ClinicUser } from '../../types/clinic';
import { formatCurrency, formatDateOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientBillingTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const InpatientBillingTab: React.FC<InpatientBillingTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedAdmissionForDeposit, setSelectedAdmissionForDeposit] = useState<InpatientAdmission | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(2000);
  const [depositMethod, setDepositMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [depositNotes, setDepositNotes] = useState('');

  const admissions = (db.admissions || []).filter(
    (adm) =>
      adm.patientName.toLowerCase().includes(search.toLowerCase()) ||
      adm.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      adm.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate Running Bill for an Inpatient
  const calculateInpatientLedger = (adm: InpatientAdmission) => {
    const ward = db.wards?.find((w) => w.id === adm.wardId);
    const bed = db.beds?.find((b) => b.id === adm.bedId);
    const dailyRate = bed?.dailyRate || ward?.ratePerDay || 450;
    const daysStay = Math.max(1, (adm.lengthOfStayDays || 0) + 1);

    const totalBedCharges = daysStay * dailyRate;

    // Associated lab charges and prescriptions
    const patientCharges = db.charges.filter(
      (c) => c.patientId === adm.patientId || (adm.visitId && c.visitId === adm.visitId)
    );
    const ancillaryCharges = patientCharges.reduce((sum, c) => sum + c.totalPrice, 0);

    const totalIncurred = totalBedCharges + ancillaryCharges;

    // Payments received for this patient
    const patientPayments = db.payments.filter(
      (p) => p.patientId === adm.patientId || (adm.visitId && p.visitId === adm.visitId)
    );
    const totalDeposited = patientPayments.reduce((sum, p) => sum + p.amount, 0) + (adm.depositPaid ? adm.initialDeposit : 0);

    const netBalance = totalIncurred - totalDeposited;

    return {
      dailyRate,
      daysStay,
      totalBedCharges,
      ancillaryCharges,
      totalIncurred,
      totalDeposited,
      netBalance,
    };
  };

  // Collect Additional Deposit Top-up
  const handleCollectDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmissionForDeposit || depositAmount <= 0) return;

    const receiptNum = `REC-ETB-2026-${Math.floor(3000 + Math.random() * 6000)}`;
    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      receiptNumber: receiptNum,
      visitId: selectedAdmissionForDeposit.visitId || `vst_${Date.now()}`,
      patientId: selectedAdmissionForDeposit.patientId,
      patientName: selectedAdmissionForDeposit.patientName,
      amount: depositAmount,
      paymentMethod: depositMethod,
      type: 'advance',
      chargeItemIds: [],
      paidAt: new Date().toISOString(),
      receivedBy: currentUser.name,
      notes: `Inpatient Top-up Deposit: ${depositNotes || 'Interim running balance clearance'}. Received by ${currentUser.name}.`,
    };

    onUpdateDb((prev) => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
      admissions: (prev.admissions || []).map((a) =>
        a.id === selectedAdmissionForDeposit.id
          ? {
              ...a,
              initialDeposit: a.initialDeposit + depositAmount,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));

    broadcast(
      'INPATIENT_DEPOSIT_PAID',
      'Reception PC',
      'IPD Deposit Added',
      `${selectedAdmissionForDeposit.patientName} credited with ${formatCurrency(depositAmount, db.settings.currency)} (${newPayment.receiptNumber}).`
    );

    onPrint({
      type: 'receipt',
      data: newPayment,
      items: [{ name: `Inpatient Account Top-Up (${selectedAdmissionForDeposit.admissionNumber})`, amount: depositAmount }],
      settings: db.settings,
    });

    setSelectedAdmissionForDeposit(null);
    setDepositAmount(2000);
    setDepositNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>Inpatient (IPD) Billing & Advance Deposits Desk</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor running ward charges, patient account ledgers, and collect top-up deposits to prevent discharge delays.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search IPD#, patient name, MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-60"
          />
        </div>
      </div>

      {/* Inpatient Billing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admissions.map((adm) => {
          const ledger = calculateInpatientLedger(adm);
          const hasOverdueBalance = ledger.netBalance > 0;

          return (
            <div
              key={adm.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition hover:shadow-md ${
                hasOverdueBalance ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {adm.admissionNumber}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm mt-0.5">{adm.patientName}</h4>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-900 text-white rounded">
                    {adm.bedNumber}
                  </span>
                </div>

                {/* Ledger Breakdown */}
                <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ward & Daily Rate:</span>
                    <span className="font-medium text-slate-800">
                      {adm.wardName} ({formatCurrency(ledger.dailyRate, db.settings.currency)}/d)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Length of Stay:</span>
                    <span className="font-bold text-slate-800">{ledger.daysStay} day(s) accrued</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bed Stay Charges:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(ledger.totalBedCharges, db.settings.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lab & Pharmacy Accrued:</span>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(ledger.ancillaryCharges, db.settings.currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold">
                    <span className="text-slate-600">Total Billed:</span>
                    <span className="text-slate-900">{formatCurrency(ledger.totalIncurred, db.settings.currency)}</span>
                  </div>

                  <div className="flex justify-between items-center font-bold text-emerald-700">
                    <span>Deposits Credited:</span>
                    <span>{formatCurrency(ledger.totalDeposited, db.settings.currency)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black">
                    <span className="text-slate-700">Account Position:</span>
                    {ledger.netBalance > 0 ? (
                      <span className="text-base text-amber-700">
                        {formatCurrency(ledger.netBalance, db.settings.currency)} Due
                      </span>
                    ) : (
                      <span className="text-base text-emerald-700">
                        {formatCurrency(Math.abs(ledger.netBalance), db.settings.currency)} Credit Surplus
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onPrint({
                      type: 'inpatient_admission_card',
                      data: adm,
                      settings: db.settings,
                    })
                  }
                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"
                  title="Print Account Summary"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdmissionForDeposit(adm);
                    setDepositAmount(Math.max(1000, ledger.netBalance > 0 ? ledger.netBalance : 2000));
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Collect Top-Up Deposit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top-Up Deposit Modal */}
      {selectedAdmissionForDeposit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <span>Collect Inpatient Account Deposit</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Top-up deposit credit for <strong>{selectedAdmissionForDeposit.patientName}</strong> (
              {selectedAdmissionForDeposit.admissionNumber} • Bed {selectedAdmissionForDeposit.bedNumber})
            </p>

            <form onSubmit={handleCollectDeposit} className="my-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Top-Up Amount (ETB) *</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-mono font-black border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-1.5 mt-2">
                  {[1000, 2000, 3000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('cash')}
                    className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                      depositMethod === 'cash'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('mobile_money')}
                    className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                      depositMethod === 'mobile_money'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    📱 Telebirr
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMethod('card')}
                    className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                      depositMethod === 'card'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    💳 POS Card
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Interim deposit for upcoming procedure / ward stay"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAdmissionForDeposit(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-md transition"
                >
                  Confirm & Print IPD Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
