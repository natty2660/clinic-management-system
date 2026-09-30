import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Receipt,
  Stethoscope,
  FlaskConical,
  Pill,
  Lock,
  Unlock,
  Play,
  Printer,
  Info,
  Check,
} from 'lucide-react';
import {
  DatabaseState,
  Role,
  Patient,
  Visit,
  ChargeItem,
  LabOrder,
  Prescription,
  PrescriptionItem,
  EntryCard,
  Payment,
  LabResultItem,
} from '../types/clinic';
import { PrintContentType } from './PrintModal';
import { formatCurrency } from '../utils/formatters';
import { clinicAudio } from '../utils/audio';

interface Phase1GuidedRunnerProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentRole: Role;
  onSwitchWorkstation: (role: Role) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onClose: () => void;
}

export const Phase1GuidedRunner: React.FC<Phase1GuidedRunnerProps> = ({
  db,
  onUpdateDb,
  currentRole,
  onSwitchWorkstation,
  onPrint,
  broadcast,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);

  // Track Phase 1 entity IDs in state or identify from database
  const [phase1PatientId, setPhase1PatientId] = useState<string>('');
  const [phase1VisitId, setPhase1VisitId] = useState<string>('');

  // Find demo or active Phase 1 patient
  const targetPatient = db.patients.find((p) => p.id === phase1PatientId) || db.patients[0];
  const targetVisit = db.visits.find((v) => v.id === phase1VisitId) || db.visits[0];

  // Dynamic step completion evaluation
  const isStep1Done = Boolean(
    targetVisit &&
    (targetVisit.consultationPaid || targetVisit.emergencyOverridden) &&
    targetVisit.entryCardIssued
  );

  const targetConsultation = targetVisit
    ? db.consultations.find((c) => c.visitId === targetVisit.id)
    : null;
  const targetLabOrders = targetVisit
    ? db.labOrders.filter((l) => l.visitId === targetVisit.id)
    : [];
  const targetRx = targetVisit
    ? db.prescriptions.filter((p) => p.visitId === targetVisit.id)
    : [];

  const isStep2Done = Boolean(
    targetConsultation && (targetLabOrders.length > 0 || targetRx.length > 0)
  );

  // Step 3 is verification of lock: tests & Rx are pending payment
  const hasPendingCharges = targetLabOrders.some((l) => l.paymentStatus === 'pending') ||
    targetRx.some((p) => p.paymentStatus === 'pending');

  const isStep4Done = Boolean(
    isStep2Done &&
    targetLabOrders.every((l) => l.paymentStatus === 'paid' || l.overridden) &&
    targetRx.every((p) => p.paymentStatus === 'paid' || p.overridden)
  );

  const isStep5Done = Boolean(
    isStep4Done &&
    targetLabOrders.some((l) => l.status === 'completed')
  );

  const isStep6Done = Boolean(
    isStep4Done &&
    targetRx.some((p) => p.status === 'dispensed')
  );

  // Auto-advance step if not manually changed
  React.useEffect(() => {
    if (isStep6Done) {
      setActiveStep(6);
    } else if (isStep5Done) {
      setActiveStep(6);
    } else if (isStep4Done) {
      setActiveStep(5);
    } else if (isStep2Done && !isStep4Done) {
      setActiveStep(4);
    } else if (isStep1Done && !isStep2Done) {
      setActiveStep(2);
    } else {
      setActiveStep(1);
    }
  }, [isStep1Done, isStep2Done, isStep4Done, isStep5Done, isStep6Done]);

  // Automated Quick Execution for Step 1: Cashier Register & Pay Consultation
  const handleExecuteStep1 = () => {
    setAutoRunning(true);
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextQueue = Math.max(100, ...db.visits.map((v) => v.queueNumber)) + 1;
    const nextPatientNum = (db.patients.length + 1).toString().padStart(4, '0');

    const newPatient: Patient = {
      id: `pat_p1_${Date.now()}`,
      mrn: `PAT-${currentYear}-${nextPatientNum}`,
      name: 'Martha Kebede (Phase 1 Patient)',
      gender: 'female',
      dob: '1992-04-14',
      age: 34,
      phone: '+251 91 123 4567',
      nationalId: 'ID-ET-98214',
      emergencyContact: 'Tadesse K. (+251 92 888 1122)',
      allergies: ['Penicillin (mild rash)'],
      bloodGroup: 'B+',
      registeredAt: now.toISOString(),
    };

    const newVisit: Visit = {
      id: `vst_p1_${Date.now()}`,
      visitNumber: `VST-${currentYear}-${nextQueue.toString().padStart(4, '0')}`,
      patientId: newPatient.id,
      patientName: newPatient.name,
      patientMrn: newPatient.mrn,
      patientAge: newPatient.age,
      patientGender: newPatient.gender,
      queueNumber: nextQueue,
      department: 'General Outpatient Clinic',
      status: 'waiting_doctor',
      entryCardIssued: true,
      consultationPaid: true,
      emergencyOverridden: false,
      createdAt: now.toISOString(),
      vitals: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        pulseRate: 74,
        temperature: 38.2,
        respiratoryRate: 18,
        oxygenSaturation: 98,
        weight: 65,
        height: 168,
        recordedAt: now.toISOString(),
        recordedBy: 'Amina Yusuf, RN',
      },
    };

    const consCharge: ChargeItem = {
      id: `chg_cons_${Date.now()}`,
      visitId: newVisit.id,
      patientId: newPatient.id,
      category: 'consultation',
      name: 'General Medical Consultation Fee',
      unitPrice: db.settings.consultationFee,
      quantity: 1,
      totalPrice: db.settings.consultationFee,
      paymentStatus: 'paid',
      addedAt: now.toISOString(),
      addedBy: 'Elena Rostova (Cashier)',
    };

    const newPayment: Payment = {
      id: `pay_p1_${Date.now()}`,
      receiptNumber: `REC-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`,
      visitId: newVisit.id,
      patientId: newPatient.id,
      patientName: newPatient.name,
      amount: db.settings.consultationFee,
      paymentMethod: 'cash',
      type: 'consultation',
      chargeItemIds: [consCharge.id],
      paidAt: now.toISOString(),
      receivedBy: 'Elena Rostova (Cashier)',
      notes: 'Initial OPD Consultation Ticket',
    };

    const newEntryCard: EntryCard = {
      id: `ec_${Date.now()}`,
      visitId: newVisit.id,
      patientMrn: newPatient.mrn,
      patientName: newPatient.name,
      queueNumber: newVisit.queueNumber,
      issuedAt: now.toISOString(),
      issuedBy: 'Elena Rostova (Cashier)',
      paymentStatus: 'paid',
      qrCodeData: `CLINIC-TOKEN:${newVisit.visitNumber}:${newPatient.mrn}:Q${newVisit.queueNumber}`,
      barcode: newVisit.visitNumber.replace(/-/g, ''),
    };

    onUpdateDb((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      visits: [newVisit, ...prev.visits],
      charges: [consCharge, ...prev.charges],
      payments: [newPayment, ...prev.payments],
      entryCards: [newEntryCard, ...prev.entryCards],
    }));

    setPhase1PatientId(newPatient.id);
    setPhase1VisitId(newVisit.id);

    // Audio chime & Broadcast to live network bus
    clinicAudio.playQueueDing();
    broadcast(
      'PATIENT_REGISTERED',
      'Cashier PC',
      'Phase 1 Patient Registered & Consultation Paid',
      `${newPatient.name} (MRN: ${newPatient.mrn}) cleared for Doctor OPD. Token #${newVisit.queueNumber}.`
    );

    // Open print preview for entry card
    onPrint({
      type: 'entry_card',
      data: newEntryCard,
      settings: db.settings,
    });

    setAutoRunning(false);
    setActiveStep(2);
  };

  // Automated Quick Execution for Step 2: Doctor OPD Consultation & Orders
  const handleExecuteStep2 = () => {
    setAutoRunning(true);
    const visit = targetVisit;
    const patient = targetPatient;
    if (!visit || !patient) {
      handleExecuteStep1();
      return;
    }

    const now = new Date();
    const cbcTest = db.labCatalog.find((t) => t.id === 'lab_cbc') || db.labCatalog[0];
    const amoxMed = db.medicines.find((m) => m.id === 'med_amox_500') || db.medicines[0];

    const newConsultation = {
      id: `cons_p1_${Date.now()}`,
      visitId: visit.id,
      patientId: patient.id,
      doctorName: 'Dr. Tariq Al-Mansoor, MD',
      doctorId: 'usr_doc_1',
      chiefComplaint: 'Fever for 3 days, acute sore throat and fatigue.',
      symptomsHistory: 'Onset 72h ago with high fever and chills. No cough or shortness of breath.',
      physicalExamination: 'Pharynx erythematous with tonsillar exudates. Cervical lymph nodes tender. Chest clear.',
      diagnosisPrimary: 'Acute Tonsillopharyngitis (Bacterial)',
      icdCode: 'J03.90',
      doctorNotes: 'Ordered Complete Blood Count (CBC) to rule out leukocytosis. Prescribed oral antibiotic course.',
      createdAt: now.toISOString(),
    };

    const newLabOrder: LabOrder = {
      id: `lab_ord_p1_${Date.now()}`,
      orderNumber: `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      visitId: visit.id,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      testCatalogId: cbcTest.id,
      testName: cbcTest.name,
      price: cbcTest.price,
      status: 'pending_payment',
      paymentStatus: 'pending', // STRICT LOCK!
      orderedByDoctor: 'Dr. Tariq Al-Mansoor, MD',
      orderedAt: now.toISOString(),
      overridden: false,
    };

    const labCharge: ChargeItem = {
      id: `chg_lab_p1_${Date.now()}`,
      visitId: visit.id,
      patientId: patient.id,
      category: 'lab',
      name: `Lab: ${cbcTest.name}`,
      unitPrice: cbcTest.price,
      quantity: 1,
      totalPrice: cbcTest.price,
      paymentStatus: 'pending',
      orderReferenceId: newLabOrder.id,
      addedAt: now.toISOString(),
      addedBy: 'Dr. Tariq Al-Mansoor, MD',
    };

    const rxItem: PrescriptionItem = {
      id: `rxi_p1_${Date.now()}`,
      medicineId: amoxMed.id,
      medicineName: amoxMed.name,
      dosage: '500mg',
      frequency: 'TDS (3 times daily)',
      duration: '7 days',
      quantity: 21,
      unitPrice: amoxMed.unitPrice,
      totalPrice: Number((amoxMed.unitPrice * 21).toFixed(2)),
    };

    const newRx: Prescription = {
      id: `rx_p1_${Date.now()}`,
      prescriptionNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      visitId: visit.id,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      orderedByDoctor: 'Dr. Tariq Al-Mansoor, MD',
      status: 'pending_payment',
      paymentStatus: 'pending', // STRICT LOCK!
      items: [rxItem],
      totalPrice: rxItem.totalPrice,
      prescribedAt: now.toISOString(),
      overridden: false,
    };

    const rxCharge: ChargeItem = {
      id: `chg_rx_p1_${Date.now()}`,
      visitId: visit.id,
      patientId: patient.id,
      category: 'pharmacy',
      name: `Rx: ${amoxMed.name} x21`,
      unitPrice: amoxMed.unitPrice,
      quantity: 21,
      totalPrice: rxItem.totalPrice,
      paymentStatus: 'pending',
      orderReferenceId: newRx.id,
      addedAt: now.toISOString(),
      addedBy: 'Dr. Tariq Al-Mansoor, MD',
    };

    onUpdateDb((prev) => ({
      ...prev,
      consultations: [newConsultation, ...prev.consultations],
      labOrders: [newLabOrder, ...prev.labOrders],
      prescriptions: [newRx, ...prev.prescriptions],
      charges: [labCharge, rxCharge, ...prev.charges],
      visits: prev.visits.map((v) =>
        v.id === visit.id
          ? { ...v, status: 'in_consultation' as const, doctorAssignedName: 'Dr. Tariq Al-Mansoor, MD' }
          : v
      ),
    }));

    clinicAudio.playSuccessChime();
    broadcast(
      'LAB_ORDERED',
      'SPEED OPD Doctor Station',
      'Orders Pushed to Cashier Bill',
      `Dr. Tariq ordered CBC (${formatCurrency(cbcTest.price, db.settings.currency)}) & Amoxicillin (${formatCurrency(rxItem.totalPrice, db.settings.currency)}) for ${patient.name}. Payment pending at Cashier desk.`
    );

    setAutoRunning(false);
    setActiveStep(3);
  };

  // Automated Quick Execution for Step 4: Cashier Settle Bill
  const handleExecuteStep4 = () => {
    setAutoRunning(true);
    const visit = targetVisit;
    const patient = targetPatient;
    if (!visit || !patient) return;

    const pendingCharges = db.charges.filter(
      (c) => c.visitId === visit.id && c.paymentStatus === 'pending'
    );
    const totalAmount = pendingCharges.reduce((sum, c) => sum + c.totalPrice, 0);

    const now = new Date();
    const newPayment: Payment = {
      id: `pay_p1_bill_${Date.now()}`,
      receiptNumber: `REC-ETB-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      visitId: visit.id,
      patientId: patient.id,
      patientName: patient.name,
      amount: totalAmount,
      paymentMethod: 'cash',
      type: 'final_settlement',
      chargeItemIds: pendingCharges.map((c) => c.id),
      paidAt: now.toISOString(),
      receivedBy: 'Elena Rostova (Cashier)',
      notes: 'Cleared diagnostic & pharmacy bill (ETB)',
      version: 1,
      stationId: 'SPEED-WS-CASH-01',
    };

    onUpdateDb((prev) => ({
      ...prev,
      charges: prev.charges.map((c) =>
        c.visitId === visit.id ? { ...c, paymentStatus: 'paid' as const } : c
      ),
      labOrders: prev.labOrders.map((l) =>
        l.visitId === visit.id
          ? { ...l, paymentStatus: 'paid' as const, status: 'paid' as const }
          : l
      ),
      prescriptions: prev.prescriptions.map((p) =>
        p.visitId === visit.id
          ? { ...p, paymentStatus: 'paid' as const, status: 'paid' as const }
          : p
      ),
      payments: [newPayment, ...prev.payments],
    }));

    clinicAudio.playSuccessChime();
    broadcast(
      'PAYMENT_RECEIVED',
      'SPEED Reception & Cashier',
      'Payment Cleared – Lab & Rx Unlocked',
      `Payment of ${formatCurrency(totalAmount, db.settings.currency)} received for ${patient.name}. Lab and Pharmacy are now unlocked.`
    );

    onPrint({
      type: 'receipt',
      data: newPayment,
      items: pendingCharges.map((c) => ({ name: c.name, amount: c.totalPrice })),
      settings: db.settings,
    });

    setAutoRunning(false);
    setActiveStep(5);
  };

  // Automated Quick Execution for Step 5: Lab Take Sample & Result
  const handleExecuteStep5 = () => {
    setAutoRunning(true);
    const visit = targetVisit;
    const patient = targetPatient;
    if (!visit || !patient) return;

    const labOrder = db.labOrders.find((l) => l.visitId === visit.id);
    if (!labOrder) return;

    const now = new Date();

    const sampleResults: LabResultItem[] = [
      { parameterName: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', referenceRange: '12.0 - 16.5', isAbnormal: false },
      { parameterName: 'White Blood Cells (WBC)', value: '12.4', unit: 'x10^9/L', referenceRange: '4.0 - 11.0', isAbnormal: true },
      { parameterName: 'Platelets', value: '280', unit: 'x10^9/L', referenceRange: '150 - 450', isAbnormal: false },
      { parameterName: 'Hematocrit (Hct)', value: '41.5', unit: '%', referenceRange: '36.0 - 50.0', isAbnormal: false },
    ];

    const completedLabOrder: LabOrder = {
      ...labOrder,
      status: 'completed',
      sampleTakenAt: now.toISOString(),
      sampleTakenBy: 'Dawit Solomon (Lab Technologist)',
      completedAt: now.toISOString(),
      completedBy: 'Dawit Solomon (Lab Technologist)',
      technicianNotes: 'Leukocytosis consistent with acute infection. Platelets and hemoglobin within normal limits.',
      results: sampleResults,
    };

    onUpdateDb((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((l) =>
        l.id === labOrder.id ? completedLabOrder : l
      ),
    }));

    clinicAudio.playSuccessChime();
    broadcast(
      'LAB_RESULT_READY',
      'Lab PC',
      'Certified Lab Results Verified & Released',
      `Complete Blood Count results verified for ${patient.name}. WBC: 12.4 x10^9/L [H]. Report ready.`
    );

    onPrint({
      type: 'lab_report',
      data: completedLabOrder,
      settings: db.settings,
    });

    setAutoRunning(false);
    setActiveStep(6);
  };

  // Automated Quick Execution for Step 6: Pharmacy Dispense
  const handleExecuteStep6 = () => {
    setAutoRunning(true);
    const visit = targetVisit;
    const patient = targetPatient;
    if (!visit || !patient) return;

    const rx = db.prescriptions.find((p) => p.visitId === visit.id);
    if (!rx) return;

    const now = new Date();

    // Deduct stock from earliest safe batch
    const amoxItem = rx.items[0];
    const medId = amoxItem.medicineId;
    const qtyToDeduct = amoxItem.quantity;

    let updatedRx: Prescription = {
      ...rx,
      status: 'dispensed',
      dispensedAt: now.toISOString(),
      dispensedBy: 'Tariq Al-Mansoor (Pharmacist)',
    };

    onUpdateDb((prev) => {
      const updatedMedicines = prev.medicines.map((med) => {
        if (med.id !== medId) return med;
        let remainingToDeduct = qtyToDeduct;
        const newBatches = med.batches.map((batch) => {
          if (remainingToDeduct <= 0) return batch;
          const deducted = Math.min(batch.quantity, remainingToDeduct);
          remainingToDeduct -= deducted;
          return { ...batch, quantity: batch.quantity - deducted };
        });
        return { ...med, batches: newBatches };
      });

      return {
        ...prev,
        medicines: updatedMedicines,
        prescriptions: prev.prescriptions.map((p) =>
          p.id === rx.id ? updatedRx : p
        ),
        visits: prev.visits.map((v) =>
          v.id === visit.id ? { ...v, status: 'completed' as const } : v
        ),
      };
    });

    clinicAudio.playSuccessChime();
    broadcast(
      'MEDICINE_DISPENSED',
      'Pharmacy PC',
      'Phase 1 Operational Cycle Completed',
      `${amoxItem.medicineName} dispensed to ${patient.name}. Inventory decremented. Visit completed with zero revenue leak.`
    );

    onPrint({
      type: 'prescription',
      data: updatedRx,
      settings: db.settings,
    });

    setAutoRunning(false);
  };

  const steps = [
    {
      step: 1,
      title: 'Patient Intake & Consultation Ticket',
      station: 'Cashier PC',
      role: 'cashier' as Role,
      icon: <Receipt className="w-4 h-4 text-emerald-400" />,
      done: isStep1Done,
      summary: 'Register patient, charge consultation fee, print 80mm Entry Card with Barcode & Token.',
      actionLabel: '1-Click Register & Pay Consultation',
      actionFn: handleExecuteStep1,
    },
    {
      step: 2,
      title: 'Doctor OPD Consultation & Diagnostic Orders',
      station: 'Doctor PC',
      role: 'doctor' as Role,
      icon: <Stethoscope className="w-4 h-4 text-blue-400" />,
      done: isStep2Done,
      summary: 'Doctor reviews paid patient, enters clinical diagnosis, orders CBC Lab & Amoxicillin Rx.',
      actionLabel: '1-Click Conduct Consult & Order Tests',
      actionFn: handleExecuteStep2,
    },
    {
      step: 3,
      title: 'Verification of Strict Payment Gate',
      station: 'Lab & Pharmacy PC',
      role: 'laboratory' as Role,
      icon: <Lock className="w-4 h-4 text-amber-400" />,
      done: !hasPendingCharges && isStep4Done,
      summary: 'Strict anti-leakage lock: Lab tests and Prescriptions remain blocked until cashier clearance.',
      actionLabel: 'Verify Strict Payment Lock',
      actionFn: () => onSwitchWorkstation('laboratory'),
    },
    {
      step: 4,
      title: 'Cashier Settle Diagnostic & Rx Charges',
      station: 'Cashier PC',
      role: 'cashier' as Role,
      icon: <Unlock className="w-4 h-4 text-teal-400" />,
      done: isStep4Done,
      summary: 'Cashier collects payment for Lab and Rx, prints itemized receipt, broadcasts live unlock.',
      actionLabel: '1-Click Collect Payment & Print Receipt',
      actionFn: handleExecuteStep4,
    },
    {
      step: 5,
      title: 'Laboratory Sample Draw & Certified Results',
      station: 'Lab PC',
      role: 'laboratory' as Role,
      icon: <FlaskConical className="w-4 h-4 text-amber-400" />,
      done: isStep5Done,
      summary: 'Test is unlocked: Draw EDTA sample, record Hemogram parameters, verify and print report.',
      actionLabel: '1-Click Sample & Verify Lab Results',
      actionFn: handleExecuteStep5,
    },
    {
      step: 6,
      title: 'Pharmacy Safe FIFO Batch & Dispense',
      station: 'Pharmacy PC',
      role: 'pharmacy' as Role,
      icon: <Pill className="w-4 h-4 text-cyan-400" />,
      done: isStep6Done,
      summary: 'Verify expiry date, dispense from earliest valid batch, auto-decrement stock ledger.',
      actionLabel: '1-Click Dispense Medication & Finish',
      actionFn: handleExecuteStep6,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/70 border-b border-teal-500/40 shadow-xl text-white">
      {/* Header bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
              Phase 1 Live Interactive Flow
            </span>
            <span className="text-xs font-bold text-white hidden sm:inline">
              Zero Unpaid Services & Connected Workstations
            </span>
          </div>
        </div>

        {/* Stepper HUD Pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setActiveStep(s.step);
                onSwitchWorkstation(s.role);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeStep === s.step
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : s.done
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.done ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-slate-950/30 flex items-center justify-center text-[10px]">
                  {s.step}
                </span>
              )}
              <span className="text-[11px]">{s.station.replace(' PC', '')}</span>
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-800/60 hover:bg-slate-800 rounded-lg flex items-center gap-1"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMinimized ? 'Expand Guide' : 'Collapse'}</span>
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 hover:bg-slate-800 rounded-lg transition"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Expanded Walkthrough Body */}
      {!isMinimized && (
        <div className="max-w-7xl mx-auto px-4 pb-3.5 pt-1 text-xs">
          <div className="bg-slate-950/70 border border-teal-900/50 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Active Step Details */}
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                  Step {activeStep} of 6
                </span>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  {steps[activeStep - 1].icon}
                  {steps[activeStep - 1].title}
                </h4>
                {steps[activeStep - 1].done && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    ✓ Completed
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {steps[activeStep - 1].summary}
              </p>
            </div>

            {/* Quick Automation and Switch Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                onClick={() => onSwitchWorkstation(steps[activeStep - 1].role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  currentRole === steps[activeStep - 1].role
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <span>Switch to {steps[activeStep - 1].station}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={steps[activeStep - 1].actionFn}
                disabled={autoRunning}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{steps[activeStep - 1].actionLabel}</span>
              </button>

              {activeStep < 6 && (
                <button
                  onClick={() => {
                    const next = activeStep + 1;
                    setActiveStep(next);
                    onSwitchWorkstation(steps[next - 1].role);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                  title="Next Step"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
