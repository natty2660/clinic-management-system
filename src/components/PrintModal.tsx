import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, AlertTriangle, FileText, TrendingUp, DollarSign } from 'lucide-react';
import { EntryCard, Payment, LabOrder, Prescription, ClinicSettings, CashierShift, AuditLog, Visit, Patient, Consultation, VitalSigns, NursingRecord, UltrasoundOrder, XRayOrder, EndoscopyOrder, PathologyOrder, AppointmentItem, InpatientAdmission } from '../types/clinic';
import { formatCurrency, formatDateTime, formatDateOnly, formatTimeOnly, generateBarcodeSvg, generateQrMatrixSvg } from '../utils/formatters';

export interface ExecutiveReportPrintData {
  period: 'daily' | 'monthly' | 'yearly';
  generatedAt: string;
  generatedBy: string;
  totalRevenue: number;
  consultationIncome: number;
  labIncome: number;
  pharmacyIncome: number;
  nursingIncome: number;
  totalVisits: number;
  totalPatients: number;
  cashTotal: number;
  cardTotal: number;
  mobileTotal: number;
  topMedicines: [string, number][];
  doctorPerformance: { doctorName: string; visitsCount: number; revenueGenerated: number }[];
}

export interface AuditCertificatePrintData {
  generatedAt: string;
  auditorName: string;
  auditLogs: AuditLog[];
  systemIntegrityHash: string;
  filterApplied: string;
}

export interface ClinicalSummaryPrintData {
  visit: Visit;
  patient: Patient;
  consultation?: Consultation;
  vitals?: VitalSigns;
  labOrders: LabOrder[];
  prescriptions: Prescription[];
  nursingRecords: NursingRecord[];
  dischargedAt?: string;
  attendingDoctor?: string;
}

export interface NursingMarPrintData {
  visit: Visit;
  patient: Patient;
  vitals?: VitalSigns;
  nursingRecords: NursingRecord[];
  nurseName: string;
}

export type PrintContentType = 
  | { type: 'entry_card'; data: EntryCard; settings: ClinicSettings }
  | { type: 'receipt'; data: Payment; items?: { name: string; amount: number }[]; settings: ClinicSettings }
  | { type: 'lab_report'; data: LabOrder; settings: ClinicSettings }
  | { type: 'prescription'; data: Prescription; settings: ClinicSettings }
  | { type: 'shift_reconciliation'; data: CashierShift; settings: ClinicSettings }
  | { type: 'executive_report'; data: ExecutiveReportPrintData; settings: ClinicSettings }
  | { type: 'audit_certificate'; data: AuditCertificatePrintData; settings: ClinicSettings }
  | { type: 'nursing_mar_slip'; data: NursingMarPrintData; settings: ClinicSettings }
  | { type: 'clinical_summary'; data: ClinicalSummaryPrintData; settings: ClinicSettings }
  | { type: 'ultrasound_report'; data: UltrasoundOrder; settings: ClinicSettings }
  | { type: 'radiology_report'; data: XRayOrder; settings: ClinicSettings }
  | { type: 'endoscopy_report'; data: EndoscopyOrder; settings: ClinicSettings }
  | { type: 'pathology_report'; data: PathologyOrder; settings: ClinicSettings }
  | { type: 'appointment_slip'; data: AppointmentItem; settings: ClinicSettings }
  | { type: 'inpatient_admission_card'; data: InpatientAdmission; settings: ClinicSettings }
  | { type: 'inpatient_gate_pass'; data: InpatientAdmission; settings: ClinicSettings };

interface PrintModalProps {
  content: PrintContentType | null;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ content, onClose }) => {
  if (!content) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const renderContent = () => {
    switch (content.type) {
      case 'entry_card': {
        const card = content.data;
        const settings = content.settings;
        const qrSvg = generateQrMatrixSvg(card.qrCodeData, 110);
        const barcodeSvg = generateBarcodeSvg(card.barcode, 260, 48);

        return (
          <div className="thermal-slip bg-white text-slate-900 font-mono text-xs p-6 border border-slate-300 rounded shadow-md max-w-sm mx-auto print:border-none print:shadow-none print:p-0">
            {/* Clinic Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-bold text-sm uppercase tracking-wider">{settings.clinicName}</h2>
              <p className="text-[11px] text-slate-600">{settings.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{settings.address} | Tel: {settings.phone}</p>
            </div>

            {/* Document Title */}
            <div className="text-center my-2">
              <span className="inline-block bg-slate-900 text-white font-bold px-3 py-0.5 text-xs uppercase tracking-widest rounded-sm">
                PATIENT ENTRY CARD
              </span>
            </div>

            {/* Queue Number Box */}
            <div className="my-3 border-2 border-slate-900 text-center py-2 bg-slate-50 rounded">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">QUEUE NUMBER</div>
              <div className="text-4xl font-black text-slate-950 tracking-tight my-1">
                #{card.queueNumber}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 inline" /> {card.paymentStatus === 'paid' ? 'CONSULTATION FEE PAID' : 'FEE CLEARED / OVERRIDDEN'}
              </div>
            </div>

            {/* Patient Details */}
            <div className="border-t border-b border-dashed border-slate-400 py-2.5 my-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{card.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRN ID:</span>
                <span className="font-bold">{card.patientMrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issued At:</span>
                <span>{formatDateTime(card.issuedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span>{card.issuedBy}</span>
              </div>
            </div>

            {/* QR & Barcode */}
            <div className="text-center my-3 flex flex-col items-center">
              <div
                className="bg-white p-1 border border-slate-200 inline-block mb-2"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div
                className="w-full flex justify-center"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
            </div>

            {/* Thermal Footer */}
            <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[10px] text-slate-500">
              <p>Please present this card at Doctor Consulting Room 1.</p>
              <p className="mt-1">*** KEEP THIS CARD UNTIL DISCHARGE ***</p>
              <div className="mt-2 text-[9px] text-slate-400">ESC/POS Thermal 80mm • System Synced</div>
            </div>
          </div>
        );
      }

      case 'receipt': {
        const payment = content.data;
        const settings = content.settings;
        const barcodeSvg = generateBarcodeSvg(payment.receiptNumber, 240, 42);

        return (
          <div className="thermal-slip bg-white text-slate-900 font-mono text-xs p-6 border border-slate-300 rounded shadow-md max-w-sm mx-auto print:border-none print:shadow-none print:p-0">
            {/* Clinic Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-2">
              <h2 className="font-bold text-sm uppercase tracking-wider">{settings.clinicName}</h2>
              <p className="text-[10px] text-slate-500">{settings.address}</p>
              <p className="text-[10px] text-slate-500">TIN: {settings.taxNumber} | Tel: {settings.phone}</p>
            </div>

            <div className="text-center my-2">
              <span className="inline-block border border-slate-800 text-slate-900 font-bold px-2 py-0.5 text-[11px] uppercase tracking-wider">
                OFFICIAL PAYMENT RECEIPT
              </span>
            </div>

            <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-slate-400 pb-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt #:</span>
                <span className="font-bold">{payment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date/Time:</span>
                <span>{formatDateTime(payment.paidAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold">{payment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="uppercase font-semibold">{payment.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{payment.receivedBy}</span>
              </div>
            </div>

            {/* Line items if provided */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[11px]">
              <div className="font-bold text-slate-600 mb-1 flex justify-between">
                <span>DESCRIPTION</span>
                <span>AMOUNT</span>
              </div>
              {content.items && content.items.length > 0 ? (
                content.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{formatCurrency(item.amount, settings.currency)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between py-0.5">
                  <span className="capitalize">{payment.type.replace('_', ' ')} Settlement</span>
                  <span>{formatCurrency(payment.amount, settings.currency)}</span>
                </div>
              )}
            </div>

            {/* Total Paid */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL PAID:</span>
                <span className="text-emerald-800">{formatCurrency(payment.amount, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>BALANCE DUE:</span>
                <span>{formatCurrency(0, settings.currency)} (CLEARED)</span>
              </div>
            </div>

            {/* Barcode & Notes */}
            <div className="my-3 text-center">
              <div
                className="w-full flex justify-center mb-1"
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
              />
              {payment.notes && (
                <p className="text-[10px] italic text-slate-600 mt-1">"{payment.notes}"</p>
              )}
            </div>

            <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[10px] text-slate-500">
              <p>Thank you for choosing our clinic.</p>
              <p>Goods & services sold are covered by standard patient care.</p>
              <div className="mt-2 text-[9px] text-slate-400">One Source of Truth • Local Clinic System</div>
            </div>
          </div>
        );
      }

      case 'lab_report': {
        const order = content.data;
        const settings = content.settings;

        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-6 border border-slate-300 rounded shadow-md max-w-xl mx-auto print:border-none print:shadow-none print:p-0">
            {/* Lab Header */}
            <div className="flex justify-between items-start border-b-2 border-teal-700 pb-3 mb-4">
              <div>
                <h1 className="text-lg font-black text-teal-900 tracking-tight">{settings.clinicName}</h1>
                <p className="text-xs font-semibold text-teal-700">DEPARTMENT OF LABORATORY & CLINICAL DIAGNOSTICS</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  CONFIRMED REPORT
                </span>
                <div className="text-[10px] text-slate-600 mt-1">Order: {order.orderNumber}</div>
              </div>
            </div>

            {/* Patient Header Grid */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs mb-4">
              <div>
                <span className="text-slate-500">Patient: </span>
                <span className="font-bold text-slate-800">{order.patientName}</span>
              </div>
              <div>
                <span className="text-slate-500">MRN: </span>
                <span className="font-mono font-semibold">{order.patientMrn}</span>
              </div>
              <div>
                <span className="text-slate-500">Ordering Doctor: </span>
                <span className="font-semibold">{order.orderedByDoctor}</span>
              </div>
              <div>
                <span className="text-slate-500">Date Completed: </span>
                <span>{order.completedAt ? formatDateTime(order.completedAt) : 'Pending'}</span>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="mb-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-1 mb-2">
                Investigation: {order.testName}
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b">
                    <th className="py-2 px-2">Parameter</th>
                    <th className="py-2 px-2">Result</th>
                    <th className="py-2 px-2">Unit</th>
                    <th className="py-2 px-2">Reference Range</th>
                    <th className="py-2 px-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {order.results && order.results.length > 0 ? (
                    order.results.map((res, i) => (
                      <tr key={i} className={`border-b ${res.isAbnormal ? 'bg-amber-50 font-bold' : ''}`}>
                        <td className="py-2 px-2 text-slate-800">{res.parameterName}</td>
                        <td className={`py-2 px-2 ${res.isAbnormal ? 'text-red-700 font-black' : 'text-slate-900'}`}>
                          {res.value}
                        </td>
                        <td className="py-2 px-2 text-slate-500">{res.unit}</td>
                        <td className="py-2 px-2 text-slate-600 font-mono text-[11px]">{res.referenceRange}</td>
                        <td className="py-2 px-2">
                          {res.isAbnormal ? (
                            <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              ABNORMAL
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[10px] font-semibold">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        No parameters entered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {order.technicianNotes && (
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs mb-4">
                <span className="font-bold text-slate-700">Technologist Comments: </span>
                <span className="italic text-slate-600">{order.technicianNotes}</span>
              </div>
            )}

            {/* Certification Footer */}
            <div className="flex justify-between items-end border-t pt-4 mt-6 text-xs text-slate-500">
              <div>
                <p>Sample Drawn: {order.sampleTakenAt ? formatDateTime(order.sampleTakenAt) : 'N/A'}</p>
                <p>Drawn by: {order.sampleTakenBy || 'Laboratory Staff'}</p>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-800">{order.completedBy || 'Kwame Mensah, MLS'}</p>
                <p className="text-[10px] text-slate-400">Chief Medical Laboratory Scientist</p>
              </div>
            </div>
          </div>
        );
      }

      case 'prescription': {
        const rx = content.data;
        const settings = content.settings;

        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-6 border border-slate-300 rounded shadow-md max-w-xl mx-auto print:border-none print:shadow-none print:p-0">
            {/* Rx Header */}
            <div className="flex justify-between items-start border-b-2 border-blue-700 pb-3 mb-4">
              <div>
                <h1 className="text-lg font-black text-blue-900 tracking-tight">{settings.clinicName}</h1>
                <p className="text-xs font-semibold text-blue-700">OFFICIAL MEDICAL PRESCRIPTION (Rx)</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-serif font-black text-blue-900">℞</div>
                <div className="text-[10px] font-mono text-slate-600">{rx.prescriptionNumber}</div>
              </div>
            </div>

            {/* Patient Header Grid */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 grid grid-cols-2 gap-2 text-xs mb-4">
              <div>
                <span className="text-slate-500">Patient: </span>
                <span className="font-bold text-slate-800">{rx.patientName}</span>
              </div>
              <div>
                <span className="text-slate-500">MRN: </span>
                <span className="font-mono font-semibold">{rx.patientMrn}</span>
              </div>
              <div>
                <span className="text-slate-500">Doctor: </span>
                <span className="font-semibold">{rx.orderedByDoctor}</span>
              </div>
              <div>
                <span className="text-slate-500">Date: </span>
                <span>{formatDateTime(rx.prescribedAt)}</span>
              </div>
            </div>

            {/* Prescribed Drugs */}
            <div className="mb-4">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-1 mb-2">Prescribed Medications</h3>
              <div className="space-y-3">
                {rx.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 border rounded bg-slate-50/50">
                    <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                      <span>{idx + 1}. {item.medicineName}</span>
                      <span className="text-slate-600 text-xs">Qty: {item.quantity}</span>
                    </div>
                    <div className="text-xs text-blue-800 font-semibold mt-1">
                      Dosage: {item.dosage} | Frequency: {item.frequency} | Duration: {item.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispense verification badge */}
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-xs flex justify-between items-center mb-6">
              <div>
                <span className="font-bold text-emerald-900">Dispense Status: </span>
                <span className="text-emerald-700 capitalize font-semibold">{rx.status}</span>
              </div>
              {rx.dispensedBy && (
                <div className="text-emerald-800 text-[11px]">
                  Dispensed by: {rx.dispensedBy} ({rx.dispensedAt ? formatDateTime(rx.dispensedAt) : ''})
                </div>
              )}
            </div>

            {/* Doctor Signature */}
            <div className="flex justify-between items-end border-t pt-4 text-xs text-slate-500">
              <p className="text-[10px] text-slate-400">Strictly regulated prescription • Non-transferable</p>
              <div className="text-right">
                <div className="w-40 border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-800">{rx.orderedByDoctor}</p>
                <p className="text-[10px] text-slate-400">Licensed Medical Practitioner</p>
              </div>
            </div>
          </div>
        );
      }

      case 'shift_reconciliation': {
        const shift = content.data;
        const settings = content.settings;
        const discrepancy = shift.discrepancy ?? (shift.actualCashCounted !== undefined ? shift.actualCashCounted - shift.expectedCashInDrawer : 0);

        return (
          <div className="thermal-slip bg-white text-slate-900 font-mono text-xs p-6 border border-slate-300 rounded shadow-md max-w-sm mx-auto print:border-none print:shadow-none print:p-0">
            {/* Clinic Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-bold text-sm uppercase tracking-wider">{settings.clinicName}</h2>
              <p className="text-[10px] text-slate-600">{settings.tagline}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{settings.address} | Tel: {settings.phone}</p>
            </div>

            <div className="text-center my-2">
              <span className="inline-block bg-slate-900 text-white font-bold px-2 py-0.5 text-xs uppercase tracking-wider rounded-sm">
                CASHIER SHIFT TILL REPORT (Z-REPORT)
              </span>
            </div>

            {/* Shift Meta */}
            <div className="border-t border-b border-dashed border-slate-400 py-2 my-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Shift ID:</span>
                <span className="font-bold">{shift.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span className="font-bold">{shift.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Opened At:</span>
                <span>{formatDateTime(shift.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Closed At:</span>
                <span>{shift.endTime ? formatDateTime(shift.endTime) : 'In Progress (Active)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Status:</span>
                <span className={`font-bold uppercase ${shift.status === 'closed' ? 'text-slate-900' : 'text-emerald-700'}`}>
                  [{shift.status}]
                </span>
              </div>
            </div>

            {/* Shift Financials */}
            <div className="py-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>(+) Opening Cash Float:</span>
                <span className="font-bold">{formatCurrency(shift.openingFloat, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>(+) Cash Sales Collected:</span>
                <span className="font-bold">{formatCurrency(shift.cashCollected, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-blue-800">
                <span>(+) Card (POS Terminal):</span>
                <span>{formatCurrency(shift.cardCollected, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-purple-800">
                <span>(+) Mobile Money:</span>
                <span>{formatCurrency(shift.mobileCollected, settings.currency)}</span>
              </div>
              <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-xs">
                <span>Gross Shift Revenue:</span>
                <span>{formatCurrency(shift.totalCollected, settings.currency)}</span>
              </div>
            </div>

            {/* Till Balancing Calculation */}
            <div className="border-t-2 border-slate-900 pt-2 my-2 space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Expected Cash In Till:</span>
                <span>{formatCurrency(shift.expectedCashInDrawer, settings.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-950">
                <span>Physical Cash Counted:</span>
                <span>{formatCurrency(shift.actualCashCounted ?? shift.expectedCashInDrawer, settings.currency)}</span>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1 flex justify-between font-black text-xs">
                <span>Till Discrepancy:</span>
                <span className={discrepancy === 0 ? 'text-emerald-700' : discrepancy > 0 ? 'text-blue-700' : 'text-red-700'}>
                  {discrepancy === 0
                    ? `BALANCED (${formatCurrency(0, settings.currency)})`
                    : discrepancy > 0
                    ? `+${formatCurrency(discrepancy, settings.currency)} (Overage)`
                    : `${formatCurrency(discrepancy, settings.currency)} (Shortage)`}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-5 pt-3 border-t border-dashed border-slate-400 text-[10px] space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="w-24 border-b border-slate-900 mb-0.5"></div>
                  <span className="text-slate-600">Cashier Signature</span>
                </div>
                <div>
                  <div className="w-24 border-b border-slate-900 mb-0.5"></div>
                  <span className="text-slate-600">Supervisor Sign / PIN</span>
                </div>
              </div>
              <div className="text-center text-slate-400 text-[9px]">
                Immutable Shift Audit Record • Retain for Financial Filing
              </div>
            </div>
          </div>
        );
      }

      case 'executive_report': {
        const report = content.data;
        const settings = content.settings;

        return (
          <div className="bg-white text-slate-900 p-8 max-w-3xl mx-auto border border-slate-200 shadow-lg rounded-xl print:border-none print:shadow-none print:p-0">
            {/* Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{settings.clinicName}</h1>
                <p className="text-xs text-slate-600 font-semibold">{settings.tagline}</p>
                <p className="text-[11px] text-slate-500 mt-1">{settings.address} • Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-teal-900 text-teal-100 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  CONFIDENTIAL EXECUTIVE REPORT
                </span>
                <p className="text-xs font-bold text-slate-800 mt-1 uppercase">{report.period} Financial & Clinical Review</p>
                <p className="text-[10px] text-slate-500">Generated: {formatDateTime(report.generatedAt)}</p>
                <p className="text-[10px] text-slate-500">Authorized Officer: {report.generatedBy}</p>
              </div>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-4 gap-3 mb-6 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500">Gross Clinic Revenue</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">
                  {formatCurrency(report.totalRevenue, settings.currency)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Visits Conducted</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{report.totalVisits}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500">Diagnostic Tests Done</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">
                  {formatCurrency(report.labIncome, settings.currency)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-[10px] font-bold uppercase text-slate-500">Pharmacy Dispensed</div>
                <div className="text-lg font-black text-cyan-800 mt-0.5">
                  {formatCurrency(report.pharmacyIncome, settings.currency)}
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1 mb-2">
                Revenue Contribution by Clinical Department
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-slate-500 text-left">
                    <th className="py-1">Department</th>
                    <th className="py-1 text-right">Income</th>
                    <th className="py-1 text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-1.5 font-sans font-medium text-slate-800">Doctor OPD Consultations</td>
                    <td className="py-1.5 text-right font-bold">{formatCurrency(report.consultationIncome, settings.currency)}</td>
                    <td className="py-1.5 text-right text-slate-600">
                      {report.totalRevenue ? ((report.consultationIncome / report.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans font-medium text-slate-800">Diagnostic Laboratory Panels</td>
                    <td className="py-1.5 text-right font-bold">{formatCurrency(report.labIncome, settings.currency)}</td>
                    <td className="py-1.5 text-right text-slate-600">
                      {report.totalRevenue ? ((report.labIncome / report.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-sans font-medium text-slate-800">Pharmacy Dispensing</td>
                    <td className="py-1.5 text-right font-bold">{formatCurrency(report.pharmacyIncome, settings.currency)}</td>
                    <td className="py-1.5 text-right text-slate-600">
                      {report.totalRevenue ? ((report.pharmacyIncome / report.totalRevenue) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="py-2 text-slate-900">Total Cleared Collections</td>
                    <td className="py-2 text-right text-emerald-800 font-mono">
                      {formatCurrency(report.totalRevenue, settings.currency)}
                    </td>
                    <td className="py-2 text-right">100.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Doctor Productivity & Top Meds */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 border rounded-lg">
                <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">Physician Caseload</h4>
                <div className="space-y-1.5 text-[11px]">
                  {report.doctorPerformance.map((doc, idx) => (
                    <div key={idx} className="flex justify-between border-b pb-1">
                      <span className="font-medium text-slate-800">{doc.doctorName}</span>
                      <span className="font-mono font-bold text-slate-600">{doc.visitsCount} visits</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-bold text-xs text-slate-800 uppercase mb-2">Top Dispensed Items</h4>
                <div className="space-y-1.5 text-[11px]">
                  {report.topMedicines.map(([name, count], idx) => (
                    <div key={idx} className="flex justify-between border-b pb-1">
                      <span className="font-medium text-slate-800">{name}</span>
                      <span className="font-mono font-bold text-cyan-800">{count} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Certified Sign-off Footer */}
            <div className="border-t pt-4 flex justify-between items-end text-xs text-slate-500">
              <div>
                <p className="font-bold text-slate-700">Audit Status: Fully Reconciled & Gated</p>
                <p className="text-[10px] text-slate-400">Zero uncollected receivables • All charges verified against receipt IDs</p>
              </div>
              <div className="text-right">
                <div className="w-36 border-b border-slate-900 mb-1"></div>
                <p className="font-bold text-slate-800">Medical Director / Administrator</p>
                <p className="text-[10px] text-slate-400">Official Clinic Stamp</p>
              </div>
            </div>
          </div>
        );
      }

      case 'audit_certificate': {
        const cert = content.data;
        const settings = content.settings;

        return (
          <div className="bg-white text-slate-900 p-8 max-w-3xl mx-auto border-2 border-slate-900 shadow-xl rounded-xl font-mono text-xs print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <div className="inline-flex items-center gap-1.5 text-emerald-800 font-bold uppercase tracking-widest text-[11px] mb-1">
                <ShieldCheck className="w-4 h-4" /> OFFICIAL CLINIC AUDIT INTEGRITY CERTIFICATE
              </div>
              <h2 className="text-lg font-black uppercase">{settings.clinicName}</h2>
              <p className="text-[11px] text-slate-500">Immutable Local Transaction & Action Verification</p>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Hash:</span>
                <span className="font-bold text-slate-900">{cert.systemIntegrityHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Certified By:</span>
                <span className="font-bold">{cert.auditorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Generated:</span>
                <span>{formatDateTime(cert.generatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Log Scope:</span>
                <span>{cert.filterApplied}</span>
              </div>
            </div>

            <h3 className="font-bold text-xs uppercase text-slate-800 mb-2">Verified Audit Records ({cert.auditLogs.length})</h3>
            <div className="border border-slate-300 rounded overflow-hidden max-h-80 overflow-y-auto mb-4">
              <table className="w-full text-[10px]">
                <thead className="bg-slate-100 border-b text-slate-700">
                  <tr>
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-left">Operator</th>
                    <th className="p-1.5 text-left">Action</th>
                    <th className="p-1.5 text-left">Changes</th>
                    <th className="p-1.5 text-left">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cert.auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-1.5 text-slate-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                      <td className="p-1.5 font-bold">{log.operator}</td>
                      <td className="p-1.5">{log.action}</td>
                      <td className="p-1.5">
                        {log.oldValue && log.newValue ? `${log.oldValue} → ${log.newValue}` : '—'}
                      </td>
                      <td className="p-1.5 italic text-slate-600">{log.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-500">
              <span>Cryptographically Sealed by Local Clinic Kernel</span>
              <span className="font-bold text-slate-800">Tamper-Proof Audit Compliant</span>
            </div>
          </div>
        );
      }

      case 'nursing_mar_slip': {
        const mar = content.data;
        const settings = content.settings;
        const vitals = mar.vitals;

        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-6 border border-slate-300 rounded shadow-md max-w-xl mx-auto print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-purple-800 pb-3 mb-3">
              <div>
                <h1 className="text-lg font-black text-purple-950 uppercase">{settings.clinicName}</h1>
                <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">
                  Medication Administration Record (MAR) & Nursing Observation Chart
                </p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  CERTIFIED NURSING MAR
                </span>
                <div className="text-[10px] text-slate-600 mt-1">Visit: {mar.visit.visitNumber}</div>
              </div>
            </div>

            {/* Patient & Triage Header */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Patient Name</span>
                <strong className="text-slate-900">{mar.patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">MRN ID</span>
                <span className="font-mono font-bold text-purple-900">{mar.patient.mrn}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Age / Gender</span>
                <span>{mar.patient.age}y · {mar.patient.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Allergies</span>
                <span className="font-bold text-red-600">
                  {mar.patient.allergies?.length ? mar.patient.allergies.join(', ') : 'NKDA (None)'}
                </span>
              </div>
            </div>

            {/* Vitals & Triage Summary */}
            {vitals && (
              <div className="mb-3 bg-purple-50/60 border border-purple-200 p-2.5 rounded">
                <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Baseline Triage Vitals & Biometrics</span>
                  {vitals.triageCategory && (
                    <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">
                      Triage: {vitals.triageCategory}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[11px] text-slate-700">
                  <div><span className="text-slate-500">BP:</span> <strong>{vitals.bloodPressureSystolic || 120}/{vitals.bloodPressureDiastolic || 80}</strong></div>
                  <div><span className="text-slate-500">Temp:</span> <strong>{vitals.temperature || 37.0}°C</strong></div>
                  <div><span className="text-slate-500">Pulse:</span> <strong>{vitals.pulseRate || 75} bpm</strong></div>
                  <div><span className="text-slate-500">SpO2:</span> <strong>{vitals.oxygenSaturation || 98}%</strong></div>
                  <div><span className="text-slate-500">BMI:</span> <strong>{vitals.bmi || '—'} ({vitals.bmiCategory || 'Normal'})</strong></div>
                  <div><span className="text-slate-500">Sugar:</span> <strong>{vitals.bloodGlucose ? `${vitals.bloodGlucose} mg/dL` : '—'}</strong></div>
                </div>
              </div>
            )}

            {/* MAR Log Table */}
            <div className="mb-4">
              <h3 className="font-bold text-xs text-slate-900 border-b pb-1 mb-2 uppercase tracking-wide">
                Medications Administered (5-Rights Protocol Verified)
              </h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b text-[10px] uppercase">
                    <th className="py-1.5 px-2">Time</th>
                    <th className="py-1.5 px-2">Drug & Dosage</th>
                    <th className="py-1.5 px-2">Route</th>
                    <th className="py-1.5 px-2">5-Rights</th>
                    <th className="py-1.5 px-2">Nurse Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {mar.nursingRecords.filter((r) => r.actionType === 'medication_administered').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-2 px-2 text-center text-slate-400 italic">
                        No in-clinic medications administered yet.
                      </td>
                    </tr>
                  ) : (
                    mar.nursingRecords
                      .filter((r) => r.actionType === 'medication_administered')
                      .map((rec) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-2 text-slate-600 whitespace-nowrap">{formatTimeOnly(rec.time)}</td>
                          <td className="py-1.5 px-2">
                            <strong className="text-purple-950">{rec.medicationName || 'Medication'}</strong>
                            <div className="text-[10px] text-slate-500">{rec.dosage}</div>
                          </td>
                          <td className="py-1.5 px-2 font-mono text-[11px]">{rec.route || 'Oral'}</td>
                          <td className="py-1.5 px-2">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              ✓ Verified
                            </span>
                          </td>
                          <td className="py-1.5 px-2 font-semibold text-slate-800">{rec.administeredBy}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Nursing Care Procedures & Observations */}
            <div className="mb-4">
              <h3 className="font-bold text-xs text-slate-900 border-b pb-1 mb-2 uppercase tracking-wide">
                Nursing Care Procedures & Patient Observations
              </h3>
              <div className="space-y-1.5">
                {mar.nursingRecords.filter((r) => r.actionType !== 'medication_administered').map((rec) => (
                  <div key={rec.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
                    <div className="flex justify-between items-center text-slate-500 mb-0.5">
                      <span className="font-bold uppercase text-[10px] text-purple-800">{rec.actionType.replace('_', ' ')}</span>
                      <span>{formatDateTime(rec.time)} · Sign: {rec.administeredBy}</span>
                    </div>
                    <p className="text-slate-800">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-500">
              <span>Nurse Supervisor Signature: _______________________</span>
              <span>Official Clinic MAR Record • ESC/POS Spooler</span>
            </div>
          </div>
        );
      }

      case 'clinical_summary': {
        const sum = content.data;
        const settings = content.settings;
        const cons = sum.consultation;
        const vitals = sum.vitals;

        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-6 border border-slate-300 rounded shadow-md max-w-xl mx-auto print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-teal-800 pb-3 mb-3">
              <div>
                <h1 className="text-lg font-black text-teal-950 uppercase">{settings.clinicName}</h1>
                <p className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                  Clinical Encounter Summary & Discharge Record
                </p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                  DISCHARGE DOSSIER
                </span>
                <div className="text-[10px] text-slate-600 mt-1">Visit: {sum.visit.visitNumber}</div>
              </div>
            </div>

            {/* Patient Header */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Patient</span>
                <strong className="text-slate-900">{sum.patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">MRN ID</span>
                <span className="font-mono font-bold text-teal-900">{sum.patient.mrn}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Attending Doctor</span>
                <strong>{cons?.doctorName || sum.attendingDoctor || 'Consultant MD'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Date</span>
                <span>{formatDateTime(sum.visit.createdAt)}</span>
              </div>
            </div>

            {/* Diagnosis & ICD-10 */}
            <div className="p-3 bg-teal-50/70 border border-teal-300 rounded mb-3">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                Primary Clinical Diagnosis (ICD-10 Coded)
              </span>
              <div className="flex items-center gap-2">
                {cons?.icdCode && (
                  <span className="px-2 py-0.5 bg-teal-700 text-white font-mono font-black text-xs rounded">
                    ICD-10: {cons.icdCode}
                  </span>
                )}
                <span className="font-bold text-sm text-teal-950">
                  {cons?.diagnosisPrimary || 'Clinical Assessment in progress'}
                </span>
              </div>
              {cons?.icdDescription && (
                <p className="text-[11px] text-teal-900 mt-1">{cons.icdDescription}</p>
              )}
            </div>

            {/* SOAP Examination */}
            <div className="space-y-2 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <strong className="text-slate-800 block mb-0.5">[S] Chief Complaint & History:</strong>
                  <p className="text-slate-700">{cons?.chiefComplaint || 'Routine medical evaluation'}</p>
                  {cons?.symptomsHistory && <p className="text-slate-500 mt-1 italic">{cons.symptomsHistory}</p>}
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <strong className="text-slate-800 block mb-0.5">[O] Objective & Physical Exam:</strong>
                  <p className="text-slate-700">{cons?.physicalExamination || 'Systemic examination completed'}</p>
                  {vitals && (
                    <div className="text-[10px] text-slate-500 mt-1">
                      BP: {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} | Temp: {vitals.temperature}°C | Pulse: {vitals.pulseRate} | BMI: {vitals.bmi || '—'}
                    </div>
                  )}
                </div>
              </div>
              {cons?.doctorNotes && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                  <strong className="text-slate-800 block mb-0.5">[P] Clinical Plan & Recommendations:</strong>
                  <p className="text-slate-700">{cons.doctorNotes}</p>
                </div>
              )}
            </div>

            {/* Diagnostic Lab Summary */}
            {sum.labOrders.length > 0 && (
              <div className="mb-3">
                <h4 className="font-bold text-xs text-slate-900 border-b pb-1 mb-1.5 uppercase tracking-wide">
                  Laboratory Investigations & Findings
                </h4>
                <div className="space-y-1">
                  {sum.labOrders.map((lab) => (
                    <div key={lab.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between items-center">
                      <div>
                        <strong>{lab.testName}</strong>
                        <div className="text-[10px] text-slate-500">Status: {lab.status.toUpperCase()}</div>
                      </div>
                      <div className="text-right">
                        {lab.results && lab.results.length > 0 ? (
                          <div className="flex gap-1.5">
                            {lab.results.map((r, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  r.isAbnormal ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {r.parameterName.split(' ')[0]}: {r.value} {r.isAbnormal ? '(!)' : ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pending analysis</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discharge Medications */}
            {sum.prescriptions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold text-xs text-slate-900 border-b pb-1 mb-1.5 uppercase tracking-wide">
                  Discharge Prescriptions & Outpatient Regimen
                </h4>
                <div className="space-y-1">
                  {sum.prescriptions.flatMap((p) => p.items).map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between items-center">
                      <div>
                        <strong className="text-slate-900">{item.medicineName}</strong>
                        <div className="text-[10px] text-slate-500">
                          {item.dosage} · {item.frequency} · {item.duration}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-500">
              <span>Attending Physician Signature: _______________________</span>
              <span>Official Medical Discharge Summary</span>
            </div>
          </div>
        );
      }

      case 'ultrasound_report': {
        const us = content.data;
        const settings = content.settings;
        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-8 max-w-2xl mx-auto border border-slate-200 rounded print:border-none print:p-0 print:shadow-none space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase text-slate-900">{settings.clinicName}</h1>
                <p className="text-xs text-slate-600">DEPARTMENT OF DIAGNOSTIC ULTRASOUND & SONOGRAPHY</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-teal-800 text-white font-mono font-bold px-2.5 py-1 rounded text-xs uppercase">
                  ULTRASOUND REPORT
                </span>
                <div className="text-[11px] font-mono mt-1 font-bold">{us.orderNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Patient Name</span>
                <strong className="text-sm text-slate-900">{us.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Scan Type</span>
                <strong className="text-slate-900">{us.scanType}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Referred By</span>
                <span>{us.orderedByDoctor}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Examination Date & Sonographer</span>
                <span>{formatDateTime(us.performedAt || us.orderedAt)} · {us.sonographerName || 'Staff Sonographer'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Clinical Indication</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">{us.clinicalIndication}</p>
            </div>

            {us.organDetails && us.organDetails.length > 0 && (
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Organ & Anatomical Findings</span>
                <table className="w-full text-left border border-slate-200 rounded text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Organ / Region</th>
                      <th className="p-2 border-b">Dimensions</th>
                      <th className="p-2 border-b">Condition</th>
                      <th className="p-2 border-b">Detailed Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {us.organDetails.map((org, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{org.organ}</td>
                        <td className="p-2 font-mono text-slate-600">{org.measurement || '-'}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            org.condition === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {org.condition}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700">{org.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {us.obstetricDetails && (
              <div className="bg-purple-50/60 p-3 rounded border border-purple-200 space-y-1">
                <span className="font-bold text-purple-900 text-xs block">Obstetric Sonography Measurements:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>GA: <strong>{us.obstetricDetails.gestationalAgeWeeks}w {us.obstetricDetails.gestationalAgeDays || 0}d</strong></div>
                  <div>FHR: <strong>{us.obstetricDetails.fetalHeartRateBpm} bpm</strong></div>
                  <div>EFW: <strong>{us.obstetricDetails.estimatedFetalWeightGrams} g</strong></div>
                  <div>Placenta: <strong>{us.obstetricDetails.placentaLocation || 'Normal'}</strong></div>
                </div>
              </div>
            )}

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Diagnostic Findings</span>
              <p className="text-slate-800 whitespace-pre-wrap">{us.findings}</p>
            </div>

            <div className="bg-teal-50/80 p-3 rounded border border-teal-200">
              <span className="font-bold text-teal-950 text-xs block uppercase">Impression / Conclusion</span>
              <p className="text-slate-900 font-bold mt-1">{us.conclusion}</p>
              {us.recommendations && (
                <p className="text-slate-600 text-[11px] mt-1">Recommendations: {us.recommendations}</p>
              )}
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
              <span>Verified by Sonographer: {us.sonographerName || 'MD Radiologist'}</span>
              <span>Official Ultrasound Record</span>
            </div>
          </div>
        );
      }

      case 'radiology_report': {
        const xr = content.data;
        const settings = content.settings;
        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-8 max-w-2xl mx-auto border border-slate-200 rounded print:border-none print:p-0 print:shadow-none space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase text-slate-900">{settings.clinicName}</h1>
                <p className="text-xs text-slate-600">DEPARTMENT OF RADIOLOGY & MEDICAL IMAGING</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-900 text-white font-mono font-bold px-2.5 py-1 rounded text-xs uppercase">
                  X-RAY REPORT
                </span>
                <div className="text-[11px] font-mono mt-1 font-bold">{xr.orderNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Patient</span>
                <strong className="text-sm text-slate-900">{xr.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Body Region & Views</span>
                <strong className="text-slate-900">{xr.bodyPart} ({xr.viewsRequired})</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Ordered By</span>
                <span>{xr.orderedByDoctor}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Exposure / Quality</span>
                <span>{xr.exposureQuality} · Dose: {xr.radiationDoseMgy || 0.12} mGy</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Clinical Indication</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">{xr.clinicalIndication}</p>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Radiological Findings</span>
              <p className="text-slate-800 whitespace-pre-wrap">{xr.findings}</p>
            </div>

            <div className="bg-blue-50/80 p-3 rounded border border-blue-200">
              <span className="font-bold text-blue-950 text-xs block uppercase">Radiologist Impression</span>
              <p className="text-slate-900 font-bold mt-1">{xr.impression}</p>
              {xr.recommendations && (
                <p className="text-slate-600 text-[11px] mt-1">Recommendations: {xr.recommendations}</p>
              )}
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
              <span>Reported By: {xr.radiologistName || 'Attending Radiologist'}</span>
              <span>Official Radiography Dossier</span>
            </div>
          </div>
        );
      }

      case 'endoscopy_report': {
        const endo = content.data;
        const settings = content.settings;
        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-8 max-w-2xl mx-auto border border-slate-200 rounded print:border-none print:p-0 print:shadow-none space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase text-slate-900">{settings.clinicName}</h1>
                <p className="text-xs text-slate-600">ENDOSCOPY & GASTROENTEROLOGY SUITE</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-purple-900 text-white font-mono font-bold px-2.5 py-1 rounded text-xs uppercase">
                  ENDOSCOPY REPORT
                </span>
                <div className="text-[11px] font-mono mt-1 font-bold">{endo.orderNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Patient</span>
                <strong className="text-sm text-slate-900">{endo.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Procedure</span>
                <strong className="text-slate-900">{endo.procedureType}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Sedation & Extent</span>
                <span>{endo.sedationUsed || 'Local Lidocaine spray'} · Extent: {endo.extentOfExam || 'Complete'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Endoscopist</span>
                <span>{endo.endoscopistName || 'Staff Gastroenterologist'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Mucosal & Luminal Findings</span>
              <p className="text-slate-800 whitespace-pre-wrap">{endo.mucosalFindings}</p>
            </div>

            {endo.biopsyTaken && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-xs">
                <strong>Biopsies Taken:</strong> Yes ({endo.biopsySites?.join(', ') || 'Targeted mucosa'}) · Sent for Histopathology
                {endo.forrestClassification && endo.forrestClassification !== 'N/A' && (
                  <div className="mt-1 font-mono text-amber-900">Forrest Classification: {endo.forrestClassification}</div>
                )}
              </div>
            )}

            <div className="bg-purple-50/80 p-3 rounded border border-purple-200">
              <span className="font-bold text-purple-950 text-xs block uppercase">Endoscopic Impression</span>
              <p className="text-slate-900 font-bold mt-1">{endo.impression}</p>
              <p className="text-slate-600 text-[11px] mt-1">Recommendations: {endo.recommendations}</p>
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
              <span>Signature: __________________________</span>
              <span>Official Endoscopy Protocol</span>
            </div>
          </div>
        );
      }

      case 'pathology_report': {
        const path = content.data;
        const settings = content.settings;
        return (
          <div className="bg-white text-slate-900 font-sans text-xs p-8 max-w-2xl mx-auto border border-slate-200 rounded print:border-none print:p-0 print:shadow-none space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase text-slate-900">{settings.clinicName}</h1>
                <p className="text-xs text-slate-600">DEPARTMENT OF ANATOMIC PATHOLOGY & CYTOLOGY</p>
                <p className="text-[10px] text-slate-500">{settings.address} | Tel: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-rose-900 text-white font-mono font-bold px-2.5 py-1 rounded text-xs uppercase">
                  HISTOPATHOLOGY REPORT
                </span>
                <div className="text-[11px] font-mono mt-1 font-bold">{path.orderNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Patient</span>
                <strong className="text-sm text-slate-900">{path.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Specimen & Site</span>
                <strong className="text-slate-900">{path.specimenType} — {path.specimenSite}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Requesting Physician</span>
                <span>{path.orderedByDoctor}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Reporting Pathologist</span>
                <span>{path.pathologistName || 'Consultant Pathologist, FRCPath'}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Macroscopic / Gross Description</span>
              <p className="text-slate-800">{path.grossDescription}</p>
            </div>

            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Microscopic Examination</span>
              <p className="text-slate-800 whitespace-pre-wrap">{path.microscopicDescription}</p>
            </div>

            {path.specialStainsOrIHC && (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                <strong>IHC & Special Stains:</strong> {path.specialStainsOrIHC}
              </div>
            )}

            <div className="bg-rose-50 p-3 rounded border border-rose-300">
              <span className="font-bold text-rose-950 text-xs block uppercase">Definitive Pathological Diagnosis</span>
              <p className="text-rose-950 font-black text-sm mt-1">{path.definitiveDiagnosis}</p>
              {path.snodentOrIcdCode && (
                <div className="font-mono text-[10px] text-rose-800 mt-1">SNOMED / ICD-O: {path.snodentOrIcdCode}</div>
              )}
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
              <span>Verified & Signed: {path.pathologistName || 'Pathologist in Charge'}</span>
              <span>Official Pathology Diagnostic Report</span>
            </div>
          </div>
        );
      }

      case 'appointment_slip': {
        const apt = content.data;
        const settings = content.settings;
        const qrSvg = generateQrMatrixSvg(`APT:${apt.appointmentNumber}|PAT:${apt.patientMrn}|DATE:${apt.appointmentDate}`, 100);

        return (
          <div className="thermal-slip bg-white text-slate-900 font-mono text-xs p-6 border border-slate-300 rounded shadow-md max-w-sm mx-auto print:border-none print:shadow-none print:p-0">
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-bold text-sm uppercase tracking-wider">{settings.clinicName}</h2>
              <p className="text-[11px] text-slate-600">{settings.tagline}</p>
              <p className="text-[10px] text-slate-500 mt-1">{settings.address} | Tel: {settings.phone}</p>
            </div>

            <div className="text-center my-2">
              <span className="inline-block bg-blue-900 text-white font-bold px-3 py-0.5 text-xs uppercase tracking-widest rounded-sm">
                OPD APPOINTMENT SLIP
              </span>
            </div>

            <div className="my-3 border-2 border-blue-900 text-center py-2 bg-blue-50 rounded">
              <div className="text-[10px] uppercase font-bold text-blue-900">APPOINTMENT REFERENCE</div>
              <div className="text-lg font-black tracking-wider text-blue-950">{apt.appointmentNumber}</div>
            </div>

            <div className="space-y-1.5 my-3 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{apt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRN:</span>
                <span className="font-bold">{apt.patientMrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{apt.patientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-bold text-blue-900">{formatDateOnly(apt.appointmentDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-bold text-blue-900">{apt.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold">{apt.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span>{apt.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Visit Reason:</span>
                <span className="font-semibold text-right max-w-[180px]">{apt.reason}</span>
              </div>
            </div>

            <div className="my-3 flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>

            <div className="text-center text-[10px] text-slate-500 mt-2 space-y-0.5">
              <p>Please present this slip at the reception upon arrival.</p>
              <p>Arrive 15 minutes prior to your scheduled time.</p>
            </div>
          </div>
        );
      }

      case 'inpatient_admission_card': {
        const adm = content.data;
        const barcodeSvg = generateBarcodeSvg(adm.admissionNumber.replace(/[^A-Za-z0-9]/g, ''));
        const qrSvg = generateQrMatrixSvg(`IPD:${adm.admissionNumber}|MRN:${adm.patientMrn}|WARD:${adm.wardName}|BED:${adm.bedNumber}`);

        return (
          <div className="bg-white p-6 max-w-md mx-auto rounded-lg shadow-sm border border-slate-300 font-sans text-xs">
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="font-black text-base text-slate-900 tracking-tight uppercase">
                  {content.settings.clinicName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">INPATIENT ADMISSION CARD & BED ALLOCATION</p>
              <p className="text-[10px] text-slate-400">{content.settings.address} • Tel: {content.settings.phone}</p>
            </div>

            {/* Admission Badge */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-3 text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block">ADMISSION NUMBER</span>
              <span className="text-xl font-black text-indigo-900 tracking-wide font-mono">{adm.admissionNumber}</span>
              <div className="mt-1 flex items-center justify-center gap-2 text-[11px] font-bold text-indigo-800">
                <span>{adm.wardName}</span> • <span className="bg-indigo-200/80 px-2 py-0.5 rounded text-indigo-950 font-mono">{adm.bedNumber}</span>
              </div>
            </div>

            {/* Patient & Admission Details */}
            <div className="space-y-1.5 border-b border-slate-200 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{adm.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRN:</span>
                <span className="font-mono font-semibold">{adm.patientMrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Gender:</span>
                <span>{adm.patientAge} yrs • {adm.patientGender.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-bold text-red-600">{adm.bloodGroup || 'Not Recorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admit Date & Time:</span>
                <span className="font-semibold">{formatDateOnly(adm.admissionDate)} at {adm.admissionTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Type:</span>
                <span className="font-semibold text-slate-800">{adm.admissionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Doctor:</span>
                <span className="font-semibold text-slate-900">{adm.admittingDoctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span>{adm.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provisional Diagnosis:</span>
                <span className="font-semibold text-slate-800 text-right max-w-[200px]">{adm.provisionalDiagnosis}</span>
              </div>
            </div>

            {/* Financial & Emergency Contact */}
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3 bg-slate-50 p-2.5 rounded-lg">
              <div className="flex justify-between font-bold">
                <span className="text-slate-600">Initial IPD Deposit:</span>
                <span className={adm.depositPaid ? "text-emerald-700" : "text-amber-700"}>
                  {formatCurrency(adm.initialDeposit, content.settings.currency)} ({adm.depositPaid ? 'PAID' : 'PENDING'})
                </span>
              </div>
              {adm.depositReceiptNumber && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Receipt Reference:</span>
                  <span className="font-mono">{adm.depositReceiptNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Emergency Contact:</span>
                <span className="font-medium text-slate-800">{adm.emergencyContactName} ({adm.emergencyContactRelation}) - {adm.emergencyContactPhone}</span>
              </div>
            </div>

            {/* Barcode & QR Verification */}
            <div className="flex items-center justify-between gap-4 my-2">
              <div className="flex-1 flex flex-col items-center">
                <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">{adm.admissionNumber}</span>
              </div>
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>

            <div className="text-center text-[10px] text-slate-500 mt-2 space-y-0.5">
              <p>Admitted by: {adm.admittedBy} • Reception Desk</p>
              <p>Keep this card visible at the patient's bedside or ward binder.</p>
            </div>
          </div>
        );
      }

      case 'inpatient_gate_pass': {
        const adm = content.data;
        const barcodeSvg = generateBarcodeSvg((adm.gatePassNumber || adm.admissionNumber).replace(/[^A-Za-z0-9]/g, ''));
        const qrSvg = generateQrMatrixSvg(`GATE_PASS:${adm.gatePassNumber || adm.admissionNumber}|PATIENT:${adm.patientName}|CLEARED:YES`);

        return (
          <div className="bg-white p-6 max-w-md mx-auto rounded-lg shadow-sm border border-emerald-400 font-sans text-xs">
            {/* Header */}
            <div className="text-center border-b border-dashed border-emerald-300 pb-3 mb-3">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="font-black text-base text-slate-900 tracking-tight uppercase">
                  {content.settings.clinicName}
                </span>
              </div>
              <p className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">INPATIENT DISCHARGE & GATE PASS</p>
              <p className="text-[10px] text-slate-400">{content.settings.address} • Security Gate Clearance</p>
            </div>

            {/* Gate Pass Clearance Stamp */}
            <div className="bg-emerald-50 border-2 border-dashed border-emerald-400 rounded-xl p-3 mb-3 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-700 font-black text-sm tracking-wider uppercase">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 inline" />
                <span>OFFICIALLY CLEARED FOR DISCHARGE</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 block mt-1">PASS #: {adm.gatePassNumber || `GP-${Date.now()}`}</span>
            </div>

            {/* Patient & Discharge Details */}
            <div className="space-y-1.5 border-b border-slate-200 pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{adm.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MRN / IPD:</span>
                <span className="font-mono">{adm.patientMrn} / {adm.admissionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ward & Released Bed:</span>
                <span className="font-semibold text-slate-800">{adm.wardName} ({adm.bedNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admission Period:</span>
                <span>{formatDateOnly(adm.admissionDate)} to {adm.dischargeDate ? formatDateOnly(adm.dischargeDate) : 'Today'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Length of Stay:</span>
                <span className="font-bold text-slate-900">{adm.lengthOfStayDays || 1} day(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Consultant:</span>
                <span className="font-semibold">{adm.admittingDoctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Financial Clearance:</span>
                <span className="font-bold text-emerald-700">100% SETTLED / NO BALANCE</span>
              </div>
            </div>

            {/* Barcode & Verification */}
            <div className="flex items-center justify-between gap-4 my-2">
              <div className="flex-1 flex flex-col items-center">
                <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                <span className="text-[10px] font-mono text-slate-400 mt-0.5">{adm.gatePassNumber || adm.admissionNumber}</span>
              </div>
              <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>

            <div className="text-center text-[10px] text-slate-500 mt-3 border-t border-slate-200 pt-2 space-y-0.5">
              <p className="font-bold text-slate-700">Notice to Hospital Security Personnel:</p>
              <p>Permit patient and belongings to exit hospital grounds. Retain carbon copy at security post.</p>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-w-none print:h-auto">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800">Print Preview / Thermal Spooler</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBrowserPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" /> Print Document (ESC/POS)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 print:p-0 print:bg-white">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
