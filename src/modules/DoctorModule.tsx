import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Clock,
  FlaskConical,
  Pill,
  FileText,
  UserCheck,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  History,
  Activity,
  Send,
  Eye,
  FileCheck,
  HeartPulse,
  Search,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';
import {
  DatabaseState,
  Visit,
  User,
  Consultation,
  Prescription,
  PrescriptionItem,
  ChargeItem,
} from '../types/clinic';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { PrintContentType } from '../components/PrintModal';
import { ICD10_CATALOG } from '../utils/clinical';
import { OpdTabId } from './opd/opdTypes';
import { OpdHeader } from './opd/OpdHeader';
import { PatientHistoryTab } from './opd/PatientHistoryTab';
import { InvestigationNursingTab } from './opd/InvestigationNursingTab';
import { LaboratoryResultTab } from './opd/LaboratoryResultTab';
import { UltrasoundResultTab } from './opd/UltrasoundResultTab';
import { XRayResultTab } from './opd/XRayResultTab';
import { EndoscopyResultTab } from './opd/EndoscopyResultTab';
import { PathologyResultTab } from './opd/PathologyResultTab';
import { ViewAppointmentTab } from './opd/ViewAppointmentTab';

interface DoctorModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const DoctorModule: React.FC<DoctorModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  // Doctor Queue shows ONLY paid (or emergency overridden) patients!
  const paidDoctorQueue = db.visits.filter(
    (v) => (v.consultationPaid || v.emergencyOverridden) && v.entryCardIssued
  );

  const [queueSearch, setQueueSearch] = useState('');
  const [selectedVisitId, setSelectedVisitId] = useState<string>(
    paidDoctorQueue[0]?.id || ''
  );

  // Active OPD Tab: flow starts with PATIENT HISTORY
  const [activeTab, setActiveTab] = useState<OpdTabId>('patient_history');

  // Slide-over Clinical Notes & e-Rx Drawer toggle
  const [isClinicalDrawerOpen, setIsClinicalDrawerOpen] = useState(false);
  const [drawerSubTab, setDrawerSubTab] = useState<'notes' | 'erx'>('notes');

  const selectedVisit = db.visits.find((v) => v.id === selectedVisitId);
  const selectedPatient = selectedVisit
    ? db.patients.find((p) => p.id === selectedVisit.patientId)
    : null;

  // Filter queue by search
  const filteredQueue = paidDoctorQueue.filter((v) => {
    if (!queueSearch) return true;
    const term = queueSearch.toLowerCase();
    return (
      v.patientName.toLowerCase().includes(term) ||
      v.patientMrn.toLowerCase().includes(term) ||
      v.queueNumber.toString().includes(term)
    );
  });

  // Consultation form state
  const existingConsultation = db.consultations.find(
    (c) => c.visitId === selectedVisitId
  );

  const [chiefComplaint, setChiefComplaint] = useState(
    existingConsultation?.chiefComplaint || ''
  );
  const [symptomsHistory, setSymptomsHistory] = useState(
    existingConsultation?.symptomsHistory || ''
  );
  const [physicalExam, setPhysicalExam] = useState(
    existingConsultation?.physicalExamination || ''
  );
  const [diagnosisPrimary, setDiagnosisPrimary] = useState(
    existingConsultation?.diagnosisPrimary || ''
  );
  const [icdCode, setIcdCode] = useState(existingConsultation?.icdCode || '');
  const [doctorNotes, setDoctorNotes] = useState(
    existingConsultation?.doctorNotes || ''
  );

  // Prescription builder state
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [rxDosage, setRxDosage] = useState('1 tablet');
  const [rxFrequency, setRxFrequency] = useState('BD (Twice daily)');
  const [rxDuration, setRxDuration] = useState('5 days');
  const [rxQuantity, setRxQuantity] = useState<number>(10);

  // Sync form when selected visit changes
  useEffect(() => {
    if (selectedVisitId) {
      const existing = db.consultations.find((c) => c.visitId === selectedVisitId);
      if (existing) {
        setChiefComplaint(existing.chiefComplaint);
        setSymptomsHistory(existing.symptomsHistory);
        setPhysicalExam(existing.physicalExamination);
        setDiagnosisPrimary(existing.diagnosisPrimary);
        setIcdCode(existing.icdCode || '');
        setDoctorNotes(existing.doctorNotes);
      } else {
        setChiefComplaint('');
        setSymptomsHistory('');
        setPhysicalExam('');
        setDiagnosisPrimary('');
        setIcdCode('');
        setDoctorNotes('');
      }
    }
  }, [selectedVisitId, db.consultations]);

  // Existing prescriptions and labs for this visit
  const visitPrescriptions = db.prescriptions.filter((p) => p.visitId === selectedVisitId);
  const visitLabOrders = db.labOrders.filter((l) => l.visitId === selectedVisitId);

  // Save Consultation
  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !selectedPatient) return;
    if (!diagnosisPrimary.trim()) {
      alert('Please enter a primary clinical diagnosis.');
      return;
    }

    const consultationRecord: Consultation = {
      id: existingConsultation?.id || `cons_${Date.now()}`,
      visitId: selectedVisit.id,
      patientId: selectedPatient.id,
      doctorName: currentUser.name,
      doctorId: currentUser.id,
      chiefComplaint,
      symptomsHistory,
      physicalExamination: physicalExam,
      diagnosisPrimary,
      icdCode,
      doctorNotes,
      createdAt: existingConsultation?.createdAt || new Date().toISOString(),
    };

    onUpdateDb((prev) => {
      const otherConsultations = prev.consultations.filter(
        (c) => c.visitId !== selectedVisit.id
      );

      // Advance visit status if currently waiting_doctor
      const updatedVisits = prev.visits.map((v) => {
        if (v.id === selectedVisit.id && v.status === 'waiting_doctor') {
          return { ...v, status: 'in_consultation' as const };
        }
        return v;
      });

      return {
        ...prev,
        consultations: [...otherConsultations, consultationRecord],
        visits: updatedVisits,
      };
    });

    broadcast(
      'CONSULTATION_SAVED',
      'SPEED OPD & Doctor',
      'Clinical Notes Saved',
      `Dr. ${currentUser.name} updated consultation for ${selectedPatient.name} (#${selectedVisit.queueNumber}) - ${diagnosisPrimary}`,
      consultationRecord
    );

    alert('Clinical Consultation Record saved successfully.');
  };

  // Add Item to Prescription Draft
  const handleAddPrescriptionItem = () => {
    if (!selectedMedicineId) return;
    const med = db.medicines.find((m) => m.id === selectedMedicineId);
    if (!med) return;

    const newItem: PrescriptionItem = {
      id: `rx_item_${Date.now()}_${Math.random()}`,
      medicineId: med.id,
      medicineName: `${med.name} (${med.strength})`,
      dosage: rxDosage,
      frequency: rxFrequency,
      duration: rxDuration,
      quantity: rxQuantity,
      unitPrice: med.unitPrice,
      totalPrice: med.unitPrice * rxQuantity,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
    setSelectedMedicineId('');
  };

  // Submit and Dispatch Prescription
  const handleSubmitPrescription = () => {
    if (!selectedVisit || !selectedPatient || prescriptionItems.length === 0) return;

    const totalPrice = prescriptionItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const rxNumber = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPrescription: Prescription = {
      id: `rx_${Date.now()}`,
      prescriptionNumber: rxNumber,
      visitId: selectedVisit.id,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientMrn: selectedPatient.mrn,
      orderedByDoctor: currentUser.name,
      prescribedAt: new Date().toISOString(),
      items: prescriptionItems,
      totalPrice,
      status: 'pending_payment',
      paymentStatus: 'pending',
      overridden: false,
    };

    const newCharge: ChargeItem = {
      id: `chg_rx_${Date.now()}`,
      visitId: selectedVisit.id,
      patientId: selectedPatient.id,
      category: 'pharmacy',
      orderReferenceId: newPrescription.id,
      name: `Prescription (${prescriptionItems.length} items): ${rxNumber}`,
      unitPrice: totalPrice,
      quantity: 1,
      totalPrice,
      paymentStatus: 'pending',
      addedBy: currentUser.name,
      addedAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      prescriptions: [newPrescription, ...prev.prescriptions],
      charges: [...prev.charges, newCharge],
    }));

    broadcast(
      'PRESCRIPTION_ORDERED',
      'SPEED OPD & Doctor',
      'New Prescription Generated',
      `Dr. ${currentUser.name} issued prescription ${rxNumber} (${formatCurrency(totalPrice, db.settings.currency)}) for ${selectedPatient.name}. Sent to Cashier.`,
      newPrescription
    );

    setPrescriptionItems([]);
    alert(`Prescription ${rxNumber} generated and sent to billing & pharmacy!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: LIVE OPD PATIENT QUEUE (4 Cols) - Independent Sticky Queue */}
      <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              OPD Consultation Queue ({paidDoctorQueue.length})
            </h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search queue name, # or MRN..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Admitted patients with verified payment or emergency triage override.
          </p>
        </div>

        {/* Queue List - Fixed independent height scroll container */}
        <div className="space-y-2 h-[calc(100vh-210px)] overflow-y-auto pr-1">
          {filteredQueue.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No patients waiting in queue.</p>
            </div>
          ) : (
            filteredQueue.map((v) => {
              const isSelected = v.id === selectedVisitId;
              const hasVitals = !!v.vitals;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVisitId(v.id)}
                  className={`bg-white rounded-xl p-3 border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-900 text-white rounded">
                        #{v.queueNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{v.patientName}</h4>
                        <div className="text-[10px] text-slate-500">
                          {v.patientGender} · {v.patientAge} yrs · {v.patientMrn}
                        </div>
                      </div>
                    </div>

                    {v.emergencyOverridden ? (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        OVERRIDE
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> PAID
                      </span>
                    )}
                  </div>

                  {/* Vitals Summary Pill */}
                  {hasVitals && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] flex flex-wrap gap-2 text-slate-600 font-mono">
                      <span>BP: <strong>{v.vitals?.bloodPressureSystolic}/{v.vitals?.bloodPressureDiastolic}</strong></span>
                      <span>HR: <strong>{v.vitals?.pulseRate} bpm</strong></span>
                      <span>SpO2: <strong>{v.vitals?.oxygenSaturation}%</strong></span>
                    </div>
                  )}

                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">
                      Arrived {v.createdAt ? formatDateTime(v.createdAt).split(',')[1] : ''}
                    </span>
                    <span className="text-blue-600 font-semibold capitalize">
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: OPD CLINICAL WORKSTATION SUITE (8 Cols) */}
      <div className="lg:col-span-8 space-y-4">
        {selectedVisit && selectedPatient ? (
          <>
            {/* Header & 8-Tab Navigation Bar */}
            <OpdHeader
              selectedPatient={selectedPatient}
              selectedVisit={selectedVisit}
              existingConsultation={existingConsultation}
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
              onPrintDossier={() =>
                onPrint({
                  type: 'clinical_summary',
                  data: {
                    visit: selectedVisit,
                    patient: selectedPatient,
                    consultation: existingConsultation,
                    vitals: selectedVisit.vitals,
                    labOrders: visitLabOrders,
                    prescriptions: visitPrescriptions,
                    nursingRecords: db.nursingRecords.filter((n) => n.visitId === selectedVisit.id),
                    attendingDoctor: currentUser.name,
                  },
                  settings: db.settings,
                })
              }
              onPrintRx={() => {
                if (visitPrescriptions.length > 0) {
                  onPrint({
                    type: 'prescription',
                    data: visitPrescriptions[0],
                    settings: db.settings,
                  });
                }
              }}
              hasRx={visitPrescriptions.length > 0}
              onToggleClinicalDrawer={() => setIsClinicalDrawerOpen(!isClinicalDrawerOpen)}
              isClinicalDrawerOpen={isClinicalDrawerOpen}
              db={db}
            />

            {/* SLIDE-OVER CLINICAL NOTES & E-RX DRAWER (Accessible from any tab!) */}
            {isClinicalDrawerOpen && (
              <div className="bg-white rounded-xl border border-blue-300 shadow-md p-5 space-y-4 transition-all duration-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDrawerSubTab('notes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        drawerSubTab === 'notes'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Clinical Notes & ICD-10
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerSubTab('erx')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        drawerSubTab === 'erx'
                          ? 'bg-cyan-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Pill className="w-3.5 h-3.5" /> Electronic Prescription (e-Rx)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsClinicalDrawerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Close Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* SubTab: Clinical Notes */}
                {drawerSubTab === 'notes' && (
                  <form onSubmit={handleSaveConsultation} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Chief Complaint *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acute fever, productive cough, pleuritic chest discomfort..."
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            Primary Clinical Diagnosis *
                          </label>
                          <span className="text-[9px] text-blue-600 font-semibold">ICD-10 Indexed</span>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Essential (primary) hypertension"
                          value={diagnosisPrimary}
                          onChange={(e) => setDiagnosisPrimary(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-900"
                        />
                        {/* Quick ICD-10 Chips */}
                        <div className="flex gap-1 overflow-x-auto pt-1.5 scrollbar-none">
                          {ICD10_CATALOG.slice(0, 5).map((icd) => (
                            <button
                              key={icd.code}
                              type="button"
                              onClick={() => {
                                setDiagnosisPrimary(icd.description);
                                setIcdCode(icd.code);
                              }}
                              className="text-[9px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap"
                            >
                              [{icd.code}] {icd.description.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          ICD-10 Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. I10, B54, E11.9, K29.5"
                          value={icdCode}
                          onChange={(e) => setIcdCode(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Physical Examination Findings
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Febrile, clear chest on auscultation, soft abdomen, no organomegaly"
                          value={physicalExam}
                          onChange={(e) => setPhysicalExam(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          History of Present Illness (HPI) & Doctor Directives
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Detailed clinical history, duration, progression, patient responses..."
                          value={symptomsHistory}
                          onChange={(e) => setSymptomsHistory(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Save Consultation Notes
                      </button>
                    </div>
                  </form>
                )}

                {/* SubTab: e-Rx Prescriptions */}
                {drawerSubTab === 'erx' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Select Drug / Strength
                          </label>
                          <select
                            value={selectedMedicineId}
                            onChange={(e) => setSelectedMedicineId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
                          >
                            <option value="">-- Choose Medicine --</option>
                            {db.medicines.map((m) => {
                              const totalStock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
                              return (
                                <option key={m.id} value={m.id} disabled={totalStock === 0}>
                                  {m.name} ({m.strength}) - Stock: {totalStock} [{formatCurrency(m.unitPrice, db.settings.currency)}/ea]
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Dosage</label>
                          <input
                            type="text"
                            value={rxDosage}
                            onChange={(e) => setRxDosage(e.target.value)}
                            placeholder="e.g. 1 tab"
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Frequency</label>
                          <select
                            value={rxFrequency}
                            onChange={(e) => setRxFrequency(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
                          >
                            <option value="OD (Once daily)">OD (Once daily)</option>
                            <option value="BD (Twice daily)">BD (Twice daily)</option>
                            <option value="TDS (3 times daily)">TDS (3 times daily)</option>
                            <option value="QDS (4 times daily)">QDS (4 times daily)</option>
                            <option value="PRN (As needed)">PRN (As needed)</option>
                            <option value="STAT (Immediately)">STAT (Immediately)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={rxQuantity}
                            onChange={(e) => setRxQuantity(parseInt(e.target.value) || 1)}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddPrescriptionItem}
                          disabled={!selectedMedicineId}
                          className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Drug to Basket
                        </button>
                      </div>
                    </div>

                    {/* Prescription Draft Items Basket */}
                    {prescriptionItems.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-cyan-300 space-y-2 text-xs">
                        <div className="font-bold text-slate-800">
                          Prescription Draft Items ({prescriptionItems.length}):
                        </div>
                        <div className="divide-y divide-slate-100">
                          {prescriptionItems.map((item, idx) => (
                            <div key={item.id} className="py-1.5 flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-900">{idx + 1}. {item.medicineName}</span>
                                <span className="text-slate-500 ml-2">
                                  ({item.dosage} · {item.frequency} · Qty: {item.quantity})
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-slate-900">
                                  {formatCurrency(item.totalPrice, db.settings.currency)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrescriptionItems(prescriptionItems.filter((it) => it.id !== item.id))
                                  }
                                  className="text-rose-500 hover:text-rose-700 p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <div className="text-xs">
                            Total Rx Cost:{' '}
                            <strong className="text-sm font-black text-cyan-800">
                              {formatCurrency(
                                prescriptionItems.reduce((s, it) => s + it.totalPrice, 0),
                                db.settings.currency
                              )}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={handleSubmitPrescription}
                            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Transmit to Billing & Pharmacy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT VIEWER: All 8 Requested Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              {activeTab === 'patient_history' && (
                <PatientHistoryTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                />
              )}

              {activeTab === 'investigation_nursing' && (
                <InvestigationNursingTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'laboratory_result' && (
                <LaboratoryResultTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'ultrasound_result' && (
                <UltrasoundResultTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'xray_result' && (
                <XRayResultTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'endoscopy_result' && (
                <EndoscopyResultTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'pathology_result' && (
                <PathologyResultTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {activeTab === 'view_appointment' && (
                <ViewAppointmentTab
                  patient={selectedPatient}
                  currentVisit={selectedVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
            <h4 className="text-sm font-bold text-slate-700">No Patient Selected</h4>
            <p className="text-xs text-slate-500 mt-1">
              Select an admitted patient from the consultation queue on the left to begin examination.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
