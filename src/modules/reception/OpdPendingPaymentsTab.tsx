import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle,
  AlertCircle,
  Printer,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Wallet,
  Coins,
  Receipt,
  User,
  Clock,
} from 'lucide-react';
import {
  DatabaseState,
  Visit,
  ChargeItem,
  Payment,
  EntryCard,
  User as ClinicUser,
} from '../../types/clinic';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface OpdPendingPaymentsTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const OpdPendingPaymentsTab: React.FC<OpdPendingPaymentsTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedVisitForPayment, setSelectedVisitForPayment] = useState<Visit | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'bank_transfer'>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);

  // Group visits with pending charges
  const visitsWithPending = db.visits
    .map((visit) => {
      const pendingCharges = db.charges.filter(
        (c) => c.visitId === visit.id && c.paymentStatus === 'pending'
      );
      const paidCharges = db.charges.filter(
        (c) => c.visitId === visit.id && c.paymentStatus === 'paid'
      );
      const totalPending = pendingCharges.reduce((acc, c) => acc + c.totalPrice, 0);
      const totalPaid = paidCharges.reduce((acc, c) => acc + c.totalPrice, 0);
      return {
        visit,
        pendingCharges,
        paidCharges,
        totalPending,
        totalPaid,
      };
    })
    .filter(
      (v) =>
        (v.totalPending > 0 || !v.visit.entryCardIssued) &&
        (v.visit.patientName.toLowerCase().includes(search.toLowerCase()) ||
          v.visit.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
          v.visit.queueNumber.toString().includes(search))
    );

  // Process payment
  const handleConfirmPayment = (visit: Visit, chargesToPay: ChargeItem[]) => {
    const totalAmount = chargesToPay.reduce((sum, c) => sum + c.totalPrice, 0);
    const receiptNum = `REC-ETB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      receiptNumber: receiptNum,
      visitId: visit.id,
      patientId: visit.patientId,
      patientName: visit.patientName,
      amount: totalAmount,
      paymentMethod,
      type: chargesToPay.some((c) => c.category === 'consultation') ? 'consultation' : 'lab',
      chargeItemIds: chargesToPay.map((c) => c.id),
      paidAt: new Date().toISOString(),
      receivedBy: currentUser.name,
      notes: `Settled at Reception Desk by ${currentUser.name}.`,
    };

    let issuedCard: EntryCard | null = null;
    let willIssueCard = false;

    const includesConsultation = chargesToPay.some((c) => c.category === 'consultation');
    if (includesConsultation && !visit.entryCardIssued) {
      willIssueCard = true;
      issuedCard = {
        id: `card_${Date.now()}`,
        visitId: visit.id,
        patientMrn: visit.patientMrn,
        patientName: visit.patientName,
        queueNumber: visit.queueNumber,
        issuedAt: new Date().toISOString(),
        issuedBy: currentUser.name,
        paymentStatus: 'paid',
        qrCodeData: `SPEED:${visit.visitNumber}|MRN:${visit.patientMrn}|Q:${visit.queueNumber}|PAID`,
        barcode: visit.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
      };
    }

    onUpdateDb((prev) => {
      const updatedCharges = prev.charges.map((c) =>
        chargesToPay.some((payC) => payC.id === c.id) ? { ...c, paymentStatus: 'paid' as const } : c
      );

      const updatedVisits = prev.visits.map((v) => {
        if (v.id === visit.id) {
          return {
            ...v,
            consultationPaid: includesConsultation ? true : v.consultationPaid,
            entryCardIssued: willIssueCard ? true : v.entryCardIssued,
            status:
              v.status === 'registered' && (includesConsultation || willIssueCard)
                ? ('waiting_doctor' as const)
                : v.status,
            version: (v.version || 1) + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.name,
          };
        }
        return v;
      });

      return {
        ...prev,
        payments: [newPayment, ...prev.payments],
        charges: updatedCharges,
        visits: updatedVisits,
        entryCards: issuedCard ? [issuedCard, ...prev.entryCards] : prev.entryCards,
      };
    });

    broadcast(
      'PAYMENT_RECEIVED',
      'Reception PC',
      'Fee Settled & Confirmed',
      `${visit.patientName} settled ${formatCurrency(totalAmount, db.settings.currency)} (${newPayment.receiptNumber}).`
    );

    if (willIssueCard && issuedCard) {
      broadcast(
        'ENTRY_CARD_ISSUED',
        'Reception PC',
        'Entry Card & Doctor Queue Enqueued',
        `Queue #${visit.queueNumber} issued for ${visit.patientName}. Patient now visible in Doctor's Live Queue.`
      );
      onPrint({
        type: 'entry_card',
        data: issuedCard,
        settings: db.settings,
      });
    }

    onPrint({
      type: 'receipt',
      data: newPayment,
      items: chargesToPay.map((c) => ({ name: c.name, amount: c.totalPrice })),
      settings: db.settings,
    });

    setSelectedVisitForPayment(null);
  };

  const handleOpenOverrideFlow = (visit: Visit) => {
    onOpenOverride(
      `Consultation payment requirement override for patient ${visit.patientName} (${visit.patientMrn}).`,
      (reason, authorizedBy) => {
        const issuedCard: EntryCard = {
          id: `card_${Date.now()}`,
          visitId: visit.id,
          patientMrn: visit.patientMrn,
          patientName: visit.patientName,
          queueNumber: visit.queueNumber,
          issuedAt: new Date().toISOString(),
          issuedBy: currentUser.name,
          paymentStatus: 'overridden',
          qrCodeData: `SPEED:${visit.visitNumber}|MRN:${visit.patientMrn}|Q:${visit.queueNumber}|OVERRIDE`,
          barcode: visit.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
        };

        onUpdateDb((prev) => ({
          ...prev,
          visits: prev.visits.map((v) =>
            v.id === visit.id
              ? {
                  ...v,
                  consultationPaid: true,
                  entryCardIssued: true,
                  emergencyOverridden: true,
                  overrideReason: reason,
                  overrideBy: authorizedBy,
                  status: 'waiting_doctor' as const,
                  version: (v.version || 1) + 1,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUser.name,
                }
              : v
          ),
          entryCards: [issuedCard, ...prev.entryCards],
        }));

        broadcast(
          'EMERGENCY_OVERRIDE',
          'Reception PC',
          'Fee Overridden (STAT)',
          `Queue #${visit.queueNumber} (${visit.patientName}) unblocked by ${authorizedBy}: "${reason}". Enqueued to Doctor.`
        );

        onPrint({
          type: 'entry_card',
          data: issuedCard,
          settings: db.settings,
        });
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal-600" />
            <span>OPD Fee Collection & Cashiering Desk</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect consultation and walk-in clinic charges. Automatically issues Entry Slip upon fee clearance.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, queue #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-60"
          />
        </div>
      </div>

      {/* Grid of Pending Charges */}
      {visitsWithPending.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h4 className="font-black text-slate-800 text-sm">All OPD Charges Cleared!</h4>
          <p className="text-xs text-slate-500 mt-1">
            No pending fees or unissued entry cards waiting at reception.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitsWithPending.map(({ visit, pendingCharges, totalPending }) => {
            const isConsultationPending = pendingCharges.some((c) => c.category === 'consultation');
            return (
              <div
                key={visit.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                        {visit.patientMrn}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm mt-1">{visit.patientName}</h4>
                    </div>
                    <span className="text-xs font-mono font-black px-2 py-0.5 bg-slate-900 text-white rounded">
                      Q-{visit.queueNumber}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Charges to Settle:
                    </div>
                    {pendingCharges.map((chg) => (
                      <div key={chg.id} className="flex justify-between items-center text-slate-700">
                        <span className="truncate max-w-[180px]">{chg.name}</span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(chg.totalPrice, db.settings.currency)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-black">
                      <span className="text-slate-600">Total Due:</span>
                      <span className="text-lg text-emerald-700">
                        {formatCurrency(totalPending, db.settings.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isConsultationPending && (
                    <button
                      type="button"
                      onClick={() => handleOpenOverrideFlow(visit)}
                      className="px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded border border-red-200 transition"
                      title="Emergency fee waiver / STAT override"
                    >
                      Override
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVisitForPayment(visit);
                      setTenderedAmount(totalPending);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition shadow-2xs"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Collect {formatCurrency(totalPending, db.settings.currency)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Processing Modal */}
      {selectedVisitForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <span>Collect Payment & Issue Slip</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Receiving payment for <strong>{selectedVisitForPayment.patientName}</strong> (Queue #{selectedVisitForPayment.queueNumber})
            </p>

            {/* Amount Summary */}
            {(() => {
              const pending = db.charges.filter(
                (c) => c.visitId === selectedVisitForPayment.id && c.paymentStatus === 'pending'
              );
              const totalAmount = pending.reduce((sum, c) => sum + c.totalPrice, 0);
              const changeDue = Math.max(0, (tenderedAmount || 0) - totalAmount);

              return (
                <div className="my-4 space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Receivable</div>
                    <div className="text-2xl font-black text-emerald-700">
                      {formatCurrency(totalAmount, db.settings.currency)}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                          paymentMethod === 'cash'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile_money')}
                        className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                          paymentMethod === 'mobile_money'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        📱 Telebirr / Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                          paymentMethod === 'card'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        💳 Debit / POS Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-2 text-xs font-bold rounded-lg border text-center transition ${
                          paymentMethod === 'bank_transfer'
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        🏦 Bank Transfer
                      </button>
                    </div>
                  </div>

                  {/* Cash Tendered Calculator */}
                  {paymentMethod === 'cash' && (
                    <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-teal-900">Cash Tendered by Patient</label>
                        <span className="text-xs font-mono font-bold text-teal-800">
                          Change: {formatCurrency(changeDue, db.settings.currency)}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={totalAmount}
                        value={tenderedAmount}
                        onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <div className="flex gap-1.5">
                        {[totalAmount, totalAmount + 50, totalAmount + 100, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTenderedAmount(amt)}
                            className="px-2 py-0.5 bg-white hover:bg-teal-100 border border-teal-300 rounded text-[11px] font-mono font-semibold text-teal-900"
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitForPayment(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment(selectedVisitForPayment, pending)}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black shadow-md hover:shadow-lg transition"
                    >
                      Confirm & Print Receipt
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
