import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Stethoscope,
  FlaskConical,
  Pill,
  Lock,
  Unlock,
  Play,
  Printer,
  Info,
  Check,
  Search,
  FileCheck,
  Thermometer,
  ShieldAlert,
  Zap,
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
  VitalSigns,
  NursingRecord,
  Consultation,
} from '../types/clinic';
import { PrintContentType } from './PrintModal';
import { clinicAudio } from '../utils/audio';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  calculateBMI,
  evaluateTriageLevel,
  ICD10_CATALOG,
  ICD10Item,
  evaluateLabValue,
  NURSING_CARE_PROCEDURES,
  MAR_ROUTES,
} from '../utils/clinical';

interface Phase2GuidedRunnerProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentRole: Role;
  onSwitchWorkstation: (role: Role) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onClose: () => void;
}

export const Phase2GuidedRunner: React.FC<Phase2GuidedRunnerProps> = ({
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

  // Target Phase 2 Patient & Visit
  const [phase2PatientId, setPhase2PatientId] = useState<string>('');
  const [phase2VisitId, setPhase2VisitId] = useState<string>('');

  const targetPatient = db.patients.find((p) => p.id === phase2PatientId) || db.patients[0];
  const targetVisit = db.visits.find((v) => v.id === phase2VisitId) || db.visits[0];

  // Step 1: Vitals Form State
  const [temp, setTemp] = useState<number>(38.8);
  const [bpSys, setBpSys] = useState<number>(172);
  const [bpDia, setBpDia] = useState<number>(104);
  const [pulse, setPulse] = useState<number>(118);
  const [spo2, setSpo2] = useState<number>(93);
  const [respRate, setRespRate] = useState<number>(24);
  const [weightKg, setWeightKg] = useState<number>(86);
  const [heightCm, setHeightCm] = useState<number>(172);
  const [bloodSugar, setBloodSugar] = useState<number>(248);
  const [painScore, setPainScore] = useState<number>(6);

  // Step 2: Doctor Clinical Form State
  const [icdSearch, setIcdSearch] = useState<string>('');
  const [selectedIcd, setSelectedIcd] = useState<ICD10Item>(ICD10_CATALOG[0]);
  const [chiefComplaint, setChiefComplaint] = useState<string>(
    'Severe throbbing occipital headache, blurred vision, marked lethargy, and shortness of breath on mild exertion.'
  );
  const [symptomsHistory, setSymptomsHistory] = useState<string>(
    'Patient has 5-year history of poorly controlled hypertension and type 2 diabetes. Reports missed oral medication doses over past week. No prior stroke or seizure.'
  );
  const [generalExam, setGeneralExam] = useState<string>('Middle-aged adult in moderate respiratory distress, tachypneic, diaphoretic, no pedal edema.');
  const [cvExam, setCvExam] = useState<string>('S1, S2 audible, no murmurs. Prominent peripheral pulses, tachycardia without gallop.');
  const [respExam, setRespExam] = useState<string>('Bilateral vesicular breath sounds, bibasilar fine end-inspiratory crackles, SpO2 93% on room air.');
  const [abdomExam, setAbdomExam] = useState<string>('Soft, non-tender, no hepatosplenomegaly, normal bowel sounds.');
  const [doctorPlan, setDoctorPlan] = useState<string>(
    '1. Immediate IV access and start IV infusion.\n2. Urgent Complete Blood Count & Fasting Glucose panel.\n3. Administer stat antihypertensive and nebulizer if bronchospasm.\n4. Close monitoring of vital signs and glucose sliding scale.'
  );

  // Step 3 & 4: Lab Panel Selection & Results
  const [selectedLabTestId, setSelectedLabTestId] = useState<string>('lab_cbc');
  const [enteredLabValues, setEnteredLabValues] = useState<{ [key: string]: string }>({
    'Hemoglobin (Hb)': '8.4',
    'White Blood Cells (WBC)': '14.8',
    'Platelets': '190',
    'Hematocrit (Hct)': '27.5',
  });
  const [techNotes, setTechNotes] = useState<string>(
    'Specimen drawn atraumatically. Moderate microcytic hypochromic anemia and significant leukocytosis noted. Doctor notified of critical alerts.'
  );

  // Step 5: MAR State
  const [marMedName, setMarMedName] = useState<string>('Amlodipine Besylate 10mg + IV Normal Saline 500ml');
  const [marDose, setMarDose] = useState<string>('10mg Oral Stat + 500ml IV drip over 2 hours');
  const [marRoute, setMarRoute] = useState<string>('Oral (PO)');
  const [marProcedure, setMarProcedure] = useState<string>('Peripheral IV Cannulation (20G) & Patency Flush');
  const [fiveRightsChecked, setFiveRightsChecked] = useState<boolean>(true);
  const [nurseChartNotes, setNurseChartNotes] = useState<string>(
    '20G IV cannula sited in left antecubital fossa. Normal saline running at 40 drops/min. Oral Amlodipine administered with patient head elevated. Tolerated well without immediate adverse reaction.'
  );

  // Dynamic Step Completion Status
  const isStep1Done = Boolean(
    targetVisit?.vitals &&
    targetVisit.vitals.bmi !== undefined &&
    targetVisit.vitals.bloodGlucose !== undefined
  );

  const targetConsultation = targetVisit
    ? db.consultations.find((c) => c.visitId === targetVisit.id)
    : null;
  const isStep2Done = Boolean(
    targetConsultation &&
    targetConsultation.icdCode &&
    targetConsultation.diagnosisPrimary
  );

  const targetLabOrders = targetVisit
    ? db.labOrders.filter((l) => l.visitId === targetVisit.id)
    : [];
  const isStep3Done = targetLabOrders.length > 0;

  const completedLabOrders = targetLabOrders.filter((l) => l.status === 'completed');
  const isStep4Done = completedLabOrders.length > 0;

  const targetNursingRecords = targetVisit
    ? db.nursingRecords.filter((n) => n.visitId === targetVisit.id)
    : [];
  const isStep5Done = targetNursingRecords.some((n) => n.actionType === 'medication_administered' || n.actionType === 'iv_fluid');

  const isStep6Done = isStep1Done && isStep2Done && isStep4Done && isStep5Done;

  // Real-time calculations
  const bmiCalc = calculateBMI(weightKg, heightCm);
  const triageCalc = evaluateTriageLevel({
    temperature: temp,
    bloodPressureSystolic: bpSys,
    bloodPressureDiastolic: bpDia,
    pulseRate: pulse,
    oxygenSaturation: spo2,
    respiratoryRate: respRate,
    bloodGlucose: bloodSugar,
    painScore,
  });

  // Filter ICD-10 list
  const filteredIcd = ICD10_CATALOG.filter(
    (item) =>
      item.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(icdSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(icdSearch.toLowerCase())
  );

  // Quick Action: Spawn High-Acuity Phase 2 Patient
  const handleSpawnPhase2Patient = () => {
    setAutoRunning(true);
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextQueue = Math.max(100, ...db.visits.map((v) => v.queueNumber)) + 1;
    const nextPatientNum = (db.patients.length + 1).toString().padStart(4, '0');

    const newPatient: Patient = {
      id: `pat_p2_${Date.now()}`,
      mrn: `PAT-${currentYear}-${nextPatientNum}`,
      name: 'Samuel Ayele (Phase 2 Clinical Case)',
      gender: 'male',
      dob: '1968-08-12',
      age: 58,
      phone: '+251 92 345 6789',
      nationalId: 'ID-ET-58493',
      emergencyContact: 'Rahel Ayele (Wife) +251 91 999 8811',
      allergies: ['Sulfonamides (Severe Urticaria)'],
      bloodGroup: 'O+',
      registeredAt: now.toISOString(),
    };

    const newVisit: Visit = {
      id: `vst_p2_${Date.now()}`,
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
    };

    const initialCharge: ChargeItem = {
      id: `chg_cons_${Date.now()}`,
      visitId: newVisit.id,
      patientId: newPatient.id,
      category: 'consultation',
      name: 'Consultation Fee - General OPD',
      unitPrice: db.settings.consultationFee,
      quantity: 1,
      totalPrice: db.settings.consultationFee,
      paymentStatus: 'paid',
      addedAt: now.toISOString(),
      addedBy: 'Elena Rostova (Cashier)',
    };

    onUpdateDb((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      visits: [newVisit, ...prev.visits],
      charges: [initialCharge, ...prev.charges],
    }));

    setPhase2PatientId(newPatient.id);
    setPhase2VisitId(newVisit.id);
    setActiveStep(1);
    setAutoRunning(false);
    clinicAudio.playBeep();

    broadcast(
      'PATIENT_REGISTERED',
      'Phase 2 Hub',
      'Phase 2 Clinical Patient Admitted',
      `Patient ${newPatient.name} (${newPatient.mrn}) admitted for high-acuity Phase 2 clinical diagnostic workflow.`
    );
  };

  // Step 1: Save Nurse Triage & Advanced Vitals
  const handleSaveStep1Triage = () => {
    if (!targetVisit) return;
    setAutoRunning(true);

    const vitalsData: VitalSigns = {
      temperature: temp,
      bloodPressureSystolic: bpSys,
      bloodPressureDiastolic: bpDia,
      pulseRate: pulse,
      respiratoryRate: respRate,
      oxygenSaturation: spo2,
      weight: weightKg,
      height: heightCm,
      bmi: bmiCalc?.bmi,
      bmiCategory: bmiCalc?.category,
      bloodGlucose: bloodSugar,
      painScore,
      triageLevel: triageCalc.level,
      triageCategory: triageCalc.category,
      triageColor: triageCalc.dotColor,
      recordedAt: new Date().toISOString(),
      recordedBy: 'Nurse Linda Evans, RN',
    };

    const triageRecord: NursingRecord = {
      id: `nur_trg_${Date.now()}`,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      patientName: targetVisit.patientName,
      time: new Date().toISOString(),
      actionType: 'vital_check',
      description: `Nurse Triage Complete: Priority ${triageCalc.category}. BP ${bpSys}/${bpDia} mmHg, HR ${pulse} bpm, SpO2 ${spo2}%, Temp ${temp}°C, Glucose ${bloodSugar} mg/dL, BMI ${bmiCalc?.bmi} (${bmiCalc?.category}). Alert reasons: ${triageCalc.reasons.join(', ')}.`,
      administeredBy: 'Nurse Linda Evans, RN',
    };

    onUpdateDb((prev) => ({
      ...prev,
      visits: prev.visits.map((v) =>
        v.id === targetVisit.id ? { ...v, vitals: vitalsData, status: 'waiting_doctor' as const } : v
      ),
      nursingRecords: [triageRecord, ...prev.nursingRecords],
    }));

    clinicAudio.playAlert();
    broadcast(
      'NURSE_TRIAGE_ALERT',
      'Nurse Station',
      `Triage Alert: ${triageCalc.category} for ${targetVisit.patientName}`,
      `Nurse recorded high-acuity vitals (BP: ${bpSys}/${bpDia}, Glucose: ${bloodSugar} mg/dL, BMI: ${bmiCalc?.bmi}). Transmitted to Doctor OPD.`,
      { vitals: vitalsData }
    );

    setAutoRunning(false);
    setActiveStep(2);
  };

  // Step 2: Save Doctor Consultation with ICD-10 & SOAP
  const handleSaveStep2Consultation = () => {
    if (!targetVisit || !targetPatient) return;
    setAutoRunning(true);

    const physicalExamCompiled = `General: ${generalExam}\nCardiovascular: ${cvExam}\nRespiratory: ${respExam}\nAbdominal: ${abdomExam}`;

    const consultationData: Consultation = {
      id: `cons_p2_${Date.now()}`,
      visitId: targetVisit.id,
      patientId: targetPatient.id,
      doctorName: 'Dr. Sarah Chen, MD',
      doctorId: 'usr_doctor_1',
      chiefComplaint,
      symptomsHistory,
      physicalExamination: physicalExamCompiled,
      systemExam: {
        general: generalExam,
        cardiovascular: cvExam,
        respiratory: respExam,
        abdominal: abdomExam,
      },
      soapNotes: {
        subjective: `${chiefComplaint} ${symptomsHistory}`,
        objective: `Vitals: BP ${targetVisit.vitals?.bloodPressureSystolic || bpSys}/${targetVisit.vitals?.bloodPressureDiastolic || bpDia}, Pulse ${targetVisit.vitals?.pulseRate || pulse}, SpO2 ${targetVisit.vitals?.oxygenSaturation || spo2}%. ${physicalExamCompiled}`,
        assessment: `Primary: [${selectedIcd.code}] ${selectedIcd.description}. High comorbidity cardiovascular profile.`,
        plan: doctorPlan,
      },
      diagnosisPrimary: selectedIcd.description,
      icdCode: selectedIcd.code,
      icdDescription: selectedIcd.description,
      doctorNotes: doctorPlan,
      createdAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => {
      const filtered = prev.consultations.filter((c) => c.visitId !== targetVisit.id);
      return {
        ...prev,
        consultations: [consultationData, ...filtered],
        visits: prev.visits.map((v) =>
          v.id === targetVisit.id
            ? { ...v, status: 'in_consultation' as const, doctorAssignedName: 'Dr. Sarah Chen, MD' }
            : v
        ),
      };
    });

    clinicAudio.playBeep();
    broadcast(
      'CONSULTATION_SAVED',
      'Doctor OPD',
      `ICD-10 [${selectedIcd.code}] Coded for ${targetVisit.patientName}`,
      `Dr. Sarah Chen recorded diagnostic SOAP and indexed ICD-10: ${selectedIcd.description}.`
    );

    setAutoRunning(false);
    setActiveStep(3);
  };

  // Step 3: Order Diagnostic Lab Panel
  const handleOrderLabPanel = () => {
    if (!targetVisit) return;
    setAutoRunning(true);

    const testItem = db.labCatalog.find((t) => t.id === selectedLabTestId) || db.labCatalog[0];
    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLabOrder: LabOrder = {
      id: `lab_ord_${Date.now()}`,
      orderNumber,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      patientName: targetVisit.patientName,
      patientMrn: targetVisit.patientMrn,
      testCatalogId: testItem.id,
      testName: testItem.name,
      price: testItem.price,
      status: 'pending_payment',
      paymentStatus: 'pending',
      orderedByDoctor: 'Dr. Sarah Chen, MD',
      orderedAt: new Date().toISOString(),
      overridden: false,
    };

    const newCharge: ChargeItem = {
      id: `chg_lab_${Date.now()}`,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      category: 'lab',
      name: `Diagnostic Panel: ${testItem.name}`,
      unitPrice: testItem.price,
      quantity: 1,
      totalPrice: testItem.price,
      paymentStatus: 'pending',
      orderReferenceId: newLabOrder.id,
      addedAt: new Date().toISOString(),
      addedBy: 'Dr. Sarah Chen, MD',
    };

    onUpdateDb((prev) => ({
      ...prev,
      labOrders: [newLabOrder, ...prev.labOrders],
      charges: [newCharge, ...prev.charges],
      visits: prev.visits.map((v) =>
        v.id === targetVisit.id ? { ...v, status: 'waiting_lab' as const } : v
      ),
    }));

    clinicAudio.playBeep();
    broadcast(
      'LAB_ORDERED',
      'Doctor OPD',
      `Diagnostic Order: ${testItem.name}`,
      `Dr. Chen ordered ${testItem.name} for ${targetVisit.patientName}. Charge pushed to Cashier.`
    );

    setAutoRunning(false);
  };

  // Settle Lab Fee at Cashier (Payment Gate clearance)
  const handleSettleLabPayment = () => {
    if (!targetVisit) return;
    setAutoRunning(true);

    const unpaidLabOrders = db.labOrders.filter(
      (l) => l.visitId === targetVisit.id && l.paymentStatus === 'pending'
    );
    const unpaidCharges = db.charges.filter(
      (c) => c.visitId === targetVisit.id && c.category === 'lab' && c.paymentStatus === 'pending'
    );
    const totalAmount = unpaidCharges.reduce((acc, c) => acc + c.totalPrice, 0);

    const newPayment = {
      id: `pay_lab_${Date.now()}`,
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      patientName: targetVisit.patientName,
      amount: totalAmount,
      paymentMethod: 'cash' as const,
      type: 'lab' as const,
      chargeItemIds: unpaidCharges.map((c) => c.id),
      paidAt: new Date().toISOString(),
      receivedBy: 'Elena Rostova (Cashier)',
      notes: 'Diagnostic Lab Panel Settlement',
    };

    onUpdateDb((prev) => ({
      ...prev,
      payments: [newPayment, ...prev.payments],
      charges: prev.charges.map((c) =>
        c.visitId === targetVisit.id && c.category === 'lab'
          ? { ...c, paymentStatus: 'paid' as const }
          : c
      ),
      labOrders: prev.labOrders.map((l) =>
        l.visitId === targetVisit.id
          ? { ...l, paymentStatus: 'paid' as const, status: 'paid' as const }
          : l
      ),
    }));

    clinicAudio.playCash();
    broadcast(
      'LAB_PAID',
      'Cashier Station',
      `Diagnostic Fee Paid: ${formatCurrency(totalAmount, db.settings.currency)}`,
      `Cashier cleared diagnostic panel fee for ${targetVisit.patientName}. Lab testing unlocked.`
    );

    setAutoRunning(false);
    setActiveStep(4);
  };

  // Step 4: Perform Phlebotomy & Complete Lab Test with Auto-Alerts
  const handlePerformLabTest = () => {
    const activeOrder = db.labOrders.find(
      (l) => l.visitId === targetVisit?.id && (l.paymentStatus === 'paid' || l.overridden)
    );
    if (!activeOrder || !targetVisit) return;
    setAutoRunning(true);

    const catalogItem = db.labCatalog.find((t) => t.id === activeOrder.testCatalogId);
    let hasPanicAlert = false;
    const panicDetails: string[] = [];

    const compiledResults = (catalogItem?.parameters || []).map((param) => {
      const val = enteredLabValues[param.name] || '12.0';
      const evalResult = evaluateLabValue(val, param.referenceRange, param.criticalLow, param.criticalHigh);

      if (evalResult.isCritical) {
        hasPanicAlert = true;
        panicDetails.push(`${param.name}: ${val} ${param.unit} (${evalResult.flagLabel})`);
      }

      return {
        parameterName: param.name,
        value: val,
        unit: param.unit,
        referenceRange: param.referenceRange,
        isAbnormal: evalResult.isAbnormal,
        isCritical: evalResult.isCritical,
        flag: evalResult.flag,
      };
    });

    onUpdateDb((prev) => ({
      ...prev,
      labOrders: prev.labOrders.map((o) =>
        o.id === activeOrder.id
          ? {
              ...o,
              status: 'completed' as const,
              sampleTakenAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              sampleTakenBy: 'Kwame Mensah, MLS',
              results: compiledResults,
              technicianNotes: techNotes,
              completedAt: new Date().toISOString(),
              completedBy: 'Kwame Mensah, MLS',
            }
          : o
      ),
    }));

    if (hasPanicAlert) {
      clinicAudio.playAlert();
      broadcast(
        'CRITICAL_LAB_ALERT',
        'Laboratory',
        `CRITICAL LAB PANIC ALERT: ${activeOrder.patientName}`,
        `URGENT NOTIFICATION TO DOCTOR: ${panicDetails.join(' | ')}. Immediate physician review mandatory!`,
        { orderId: activeOrder.id, panicDetails }
      );
    } else {
      clinicAudio.playBeep();
      broadcast(
        'LAB_RESULT_READY',
        'Laboratory',
        `Lab Results Certified: ${activeOrder.testName}`,
        `Results verified by Kwame Mensah, MLS for ${activeOrder.patientName}. Transmitted to Doctor.`
      );
    }

    setAutoRunning(false);
    setActiveStep(5);
  };

  // Step 5: Administer MAR & Record Nursing Care
  const handleAdministerMar = () => {
    if (!targetVisit) return;
    setAutoRunning(true);

    const marRecord: NursingRecord = {
      id: `nur_mar_${Date.now()}`,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      patientName: targetVisit.patientName,
      time: new Date().toISOString(),
      actionType: 'medication_administered',
      description: `MAR Administration: ${marMedName} (${marDose}) via ${marRoute}. 5-Rights Verified. Nurse Notes: ${nurseChartNotes}`,
      medicationName: marMedName,
      dosage: marDose,
      route: marRoute,
      scheduledTime: new Date().toISOString(),
      administeredBy: 'Nurse Linda Evans, RN',
      patientResponse: 'Tolerated without acute distress',
      fiveRightsVerified: fiveRightsChecked,
      status: 'administered',
    };

    const procedureRecord: NursingRecord = {
      id: `nur_proc_${Date.now()}`,
      visitId: targetVisit.id,
      patientId: targetVisit.patientId,
      patientName: targetVisit.patientName,
      time: new Date(Date.now() + 5000).toISOString(),
      actionType: 'iv_fluid',
      description: `Clinical Care Procedure: ${marProcedure}. Performed by Nurse Linda Evans, RN under physician protocol.`,
      administeredBy: 'Nurse Linda Evans, RN',
    };

    onUpdateDb((prev) => ({
      ...prev,
      nursingRecords: [marRecord, procedureRecord, ...prev.nursingRecords],
    }));

    clinicAudio.playBeep();
    broadcast(
      'MAR_MEDICATION_GIVEN',
      'Nurse Station',
      `MAR Administered: ${marMedName}`,
      `Nurse Linda Evans verified 5-rights and administered ${marMedName} (${marRoute}) for ${targetVisit.patientName}.`
    );

    setAutoRunning(false);
    setActiveStep(6);
  };

  return (
    <div className="bg-slate-900 border-b-2 border-purple-500 shadow-xl text-white">
      {/* Top Banner / Runner Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300">
            <HeartPulse className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded tracking-wider uppercase">
                Phase 2 Blueprint Suite
              </span>
              <span className="font-bold text-sm text-purple-200">
                Clinical Depth, Diagnostic Panels & Medication Administration (MAR)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Command 2 & 3: Triage BMI & ESI evaluation, ICD-10 diagnostic indexing, parameter-level auto-alerts & certified MAR.
            </p>
          </div>
        </div>

        {/* Action Buttons & Minimizer */}
        <div className="flex items-center gap-2">
          {!phase2PatientId && (
            <button
              onClick={handleSpawnPhase2Patient}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-lg text-xs shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Load Phase 2 High-Acuity Case</span>
            </button>
          )}

          {targetPatient && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Active Patient:</span>
              <strong className="text-white">{targetPatient.name}</strong>
              <span className="text-purple-300 font-mono text-[10px]">({targetPatient.mrn})</span>
            </div>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            title={isMinimized ? 'Expand Guide' : 'Collapse Guide'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 rounded-lg transition text-xs font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Step Progress Tracker HUD */}
      {!isMinimized && (
        <div className="bg-slate-950/70 border-t border-slate-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto scrollbar-none py-1">
            {[
              { num: 1, title: 'Nurse Triage & BMI', role: 'nurse' as Role, done: isStep1Done },
              { num: 2, title: 'Doctor SOAP & ICD-10', role: 'doctor' as Role, done: isStep2Done },
              { num: 3, title: 'Lab Panel & Payment Gate', role: 'cashier' as Role, done: isStep3Done },
              { num: 4, title: 'Laboratory Panic Alerts', role: 'laboratory' as Role, done: isStep4Done },
              { num: 5, title: 'Medication Admin (MAR)', role: 'nurse' as Role, done: isStep5Done },
              { num: 6, title: 'Certified Clinical Dossier', role: 'doctor' as Role, done: isStep6Done },
            ].map((step) => {
              const isActive = activeStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => {
                    setActiveStep(step.num);
                    onSwitchWorkstation(step.role);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                    isActive
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200 ring-1 ring-purple-400/50'
                      : step.done
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.done
                        ? 'bg-emerald-500 text-slate-950'
                        : isActive
                        ? 'bg-purple-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {step.done ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                  </span>
                  <span>{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Interactive Step Workstation */}
      {!isMinimized && (
        <div className="bg-slate-900/90 border-t border-slate-800 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* STEP 1: NURSE TRIAGE, AUTOMATIC BMI & ESI SCORE */}
            {activeStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <Thermometer className="w-4 h-4 text-purple-400" />
                    <span>Step 1: Clinical Biometrics & ESI Triage</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nurse records comprehensive physiological metrics. The system dynamically computes exact <strong>Body Mass Index (BMI)</strong> and classifies the <strong>Emergency Severity Index (ESI)</strong> triage acuity.
                  </p>

                  {/* Real-time Triage Badge */}
                  <div className="p-3 rounded-lg border bg-slate-900/90 border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Calculated Acuity</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${triageCalc.badgeClass}`}>
                        {triageCalc.category}
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1">
                      {triageCalc.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Real-time BMI Badge */}
                  {bmiCalc && (
                    <div className="p-3 rounded-lg border bg-slate-900/90 border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">BMI Metric:</span>
                        <strong className="text-white font-mono">{bmiCalc.bmi} kg/m²</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Classification:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${bmiCalc.badgeClass}`}>
                          {bmiCalc.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 pt-1">{bmiCalc.description}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleSaveStep1Triage}
                      disabled={autoRunning || !targetVisit}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Triage Vitals & Transmit to Doctor</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Vitals Input Grid */}
                <div className="lg:col-span-8 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Nurse Observation & Physiological Intake Form</span>
                      {targetVisit && (
                        <span className="text-xs text-purple-400 font-mono">[{targetVisit.patientName}]</span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-400">Nurse Linda Evans, RN</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Systolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={bpSys}
                        onChange={(e) => setBpSys(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg bg-slate-900 border text-white font-mono font-bold ${
                          bpSys >= 160 ? 'border-red-500 text-red-300' : 'border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Diastolic BP (mmHg)
                      </label>
                      <input
                        type="number"
                        value={bpDia}
                        onChange={(e) => setBpDia(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg bg-slate-900 border text-white font-mono font-bold ${
                          bpDia >= 100 ? 'border-red-500 text-red-300' : 'border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Temperature (°C)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={temp}
                        onChange={(e) => setTemp(parseFloat(e.target.value))}
                        className={`w-full p-2 rounded-lg bg-slate-900 border text-white font-mono font-bold ${
                          temp >= 38.5 ? 'border-amber-500 text-amber-300' : 'border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Pulse Rate (bpm)
                      </label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        SpO2 Saturation (%)
                      </label>
                      <input
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg bg-slate-900 border text-white font-mono font-bold ${
                          spo2 < 95 ? 'border-amber-500 text-amber-300' : 'border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Resp Rate (/min)
                      </label>
                      <input
                        type="number"
                        value={respRate}
                        onChange={(e) => setRespRate(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Random Glucose (mg/dL)
                      </label>
                      <input
                        type="number"
                        value={bloodSugar}
                        onChange={(e) => setBloodSugar(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg bg-slate-900 border text-white font-mono font-bold ${
                          bloodSugar >= 200 ? 'border-red-500 text-red-300' : 'border-slate-700'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Pain Score (0 - 10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={painScore}
                        onChange={(e) => setPainScore(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                  </div>

                  {targetVisit?.vitals && (
                    <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-purple-200">
                          Vitals successfully linked to Medical Record! Transmitted live to Doctor OPD Queue.
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onPrint({
                            type: 'nursing_mar_slip',
                            data: {
                              visit: targetVisit,
                              patient: targetPatient,
                              vitals: targetVisit.vitals,
                              nursingRecords: db.nursingRecords.filter((n) => n.visitId === targetVisit.id),
                              nurseName: 'Nurse Linda Evans, RN',
                            },
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Triage Slip</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: DOCTOR OPD SOAP & ICD-10 DIAGNOSTIC CATALOG */}
            {activeStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                    <Stethoscope className="w-4 h-4 text-blue-400" />
                    <span>Step 2: ICD-10 Clinical Indexing & Coding</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Search and select from the international ICD-10 diagnostic nomenclature. Attaches diagnostic codes directly to the visit record.
                  </p>

                  {/* ICD-10 Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ICD-10 code or condition (e.g. I10, Diabetes, Asthma)..."
                      value={icdSearch}
                      onChange={(e) => setIcdSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* Filtered ICD-10 List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                    {filteredIcd.map((item) => {
                      const isSelected = selectedIcd.code === item.code;
                      return (
                        <div
                          key={item.code}
                          onClick={() => setSelectedIcd(item)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-400 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-mono font-bold text-blue-300 bg-blue-950 px-1.5 py-0.5 rounded text-[11px]">
                              {item.code}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.category}</span>
                          </div>
                          <div className="font-semibold">{item.description}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Diagnosis Details */}
                  <div className="p-3 bg-blue-950/50 border border-blue-800/80 rounded-lg text-xs space-y-1.5">
                    <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                      Selected Primary Diagnosis:
                    </div>
                    <div className="text-white font-bold">
                      [{selectedIcd.code}] {selectedIcd.description}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <strong>Recommended Guideline:</strong> {selectedIcd.suggestedPlan}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveStep2Consultation}
                    disabled={autoRunning || !targetVisit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Clinical Diagnosis & Proceed to Lab Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* SOAP Examination Form */}
                <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-white">
                      Physician SOAP Clinical Examination & Plan
                    </h4>
                    <span className="text-xs text-blue-300">Dr. Sarah Chen, MD</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-300 mb-1">
                        [S] Subjective: Chief Complaint & Symptoms History
                      </label>
                      <textarea
                        rows={2}
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          General Appearance
                        </label>
                        <input
                          type="text"
                          value={generalExam}
                          onChange={(e) => setGeneralExam(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Cardiovascular Exam
                        </label>
                        <input
                          type="text"
                          value={cvExam}
                          onChange={(e) => setCvExam(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Respiratory Exam
                        </label>
                        <input
                          type="text"
                          value={respExam}
                          onChange={(e) => setRespExam(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Abdominal Exam
                        </label>
                        <input
                          type="text"
                          value={abdomExam}
                          onChange={(e) => setAbdomExam(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-blue-300 mb-1">
                        [P] Assessment & Clinical Management Plan
                      </label>
                      <textarea
                        rows={3}
                        value={doctorPlan}
                        onChange={(e) => setDoctorPlan(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: MULTI-PARAMETER LAB DIAGNOSTIC ORDER & PAYMENT GATE */}
            {activeStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    <span>Step 3: Multi-Parameter Lab Diagnostic Panel Order</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Doctor orders multi-parameter laboratory profiles. Because Command 1 mandates <strong>zero unpaid services</strong>, orders remain strictly locked at the lab until the cashier bill is cleared.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">
                      Select Diagnostic Panel from Master Catalog:
                    </label>
                    <div className="space-y-2">
                      {db.labCatalog.map((test) => {
                        const isSelected = selectedLabTestId === test.id;
                        return (
                          <div
                            key={test.id}
                            onClick={() => setSelectedLabTestId(test.id)}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-amber-950/80 border-amber-400 text-white'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{test.name}</span>
                              <span className="font-mono text-emerald-400 font-bold">
                                {formatCurrency(test.price, db.settings.currency)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Parameters: {test.parameters.map((p) => p.name).join(', ')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleOrderLabPanel}
                    disabled={autoRunning || !targetVisit}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Issue Doctor Order & Send Bill to Cashier</span>
                  </button>
                </div>

                {/* Lab Orders & Payment Gate Verification */}
                <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-white">
                      Diagnostic Worklist & Payment Clearance Gate
                    </h4>
                    <span className="text-xs text-amber-300 font-mono">Patient: {targetVisit?.patientName}</span>
                  </div>

                  {targetLabOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs italic bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                      No lab panel ordered yet. Select a panel on the left and click "Issue Doctor Order".
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {targetLabOrders.map((order) => {
                        const isPaid = order.paymentStatus === 'paid' || order.overridden;
                        return (
                          <div
                            key={order.id}
                            className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isPaid
                                ? 'bg-emerald-950/30 border-emerald-600/50'
                                : 'bg-red-950/30 border-red-700/60'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-white text-sm">{order.testName}</strong>
                                <span className="text-[10px] font-mono text-slate-400">{order.orderNumber}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 mt-1">
                                Ordered by {order.orderedByDoctor} · Fee: {formatCurrency(order.price, db.settings.currency)}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                {isPaid ? (
                                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Payment Cleared & Phlebotomy Unlocked
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Blocked Pending Cashier Settlement
                                  </span>
                                )}
                              </div>
                            </div>

                            {!isPaid && (
                              <button
                                onClick={handleSettleLabPayment}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-auto"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Simulate Cashier Payment Clearance</span>
                              </button>
                            )}

                            {isPaid && (
                              <button
                                onClick={() => setActiveStep(4)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap self-start sm:self-auto"
                              >
                                <span>Proceed to Phlebotomy & Results</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: LABORATORY SAMPLE DRAW & CRITICAL PANIC ALERTS */}
            {activeStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
                    <FlaskConical className="w-4 h-4 text-teal-400" />
                    <span>Step 4: Phlebotomy & Parameter Testing with Auto-Alerts</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Laboratory technician analyzes individual diagnostic parameters. The system automatically benchmarks against clinical reference intervals, generating immediate <strong>[L] Low</strong>, <strong>[H] High</strong>, and flashing <strong>Critical Panic Value</strong> alerts.
                  </p>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-300">Enter Parameter Test Values:</div>
                    <div className="space-y-2 text-xs">
                      {Object.keys(enteredLabValues).map((paramName) => (
                        <div key={paramName} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">
                            {paramName}
                          </label>
                          <input
                            type="text"
                            value={enteredLabValues[paramName]}
                            onChange={(e) =>
                              setEnteredLabValues({
                                ...enteredLabValues,
                                [paramName]: e.target.value,
                              })
                            }
                            className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded text-white font-mono font-bold"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Technician Clinical Notes & Observations:
                      </label>
                      <textarea
                        rows={2}
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handlePerformLabTest}
                    disabled={autoRunning || !targetVisit}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Certify Results & Broadcast Critical Panic Alert</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Diagnostic Results Grid */}
                <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-white">
                      Diagnostic Laboratory Panel Analysis Preview
                    </h4>
                    <span className="text-xs text-teal-300 font-mono">Kwame Mensah, MLS</span>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                          <th className="p-2">Parameter</th>
                          <th className="p-2">Value</th>
                          <th className="p-2">Ref Range</th>
                          <th className="p-2">Acuity Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {Object.keys(enteredLabValues).map((paramName) => {
                          const val = enteredLabValues[paramName];
                          const catalogParam = db.labCatalog
                            .flatMap((c) => c.parameters)
                            .find((p) => p.name === paramName);
                          const evalRes = evaluateLabValue(
                            val,
                            catalogParam?.referenceRange || '12.0 - 16.5',
                            catalogParam?.criticalLow,
                            catalogParam?.criticalHigh
                          );

                          return (
                            <tr
                              key={paramName}
                              className={evalRes.isCritical ? 'bg-red-950/40' : evalRes.isAbnormal ? 'bg-amber-950/20' : ''}
                            >
                              <td className="p-2 text-white font-semibold">{paramName}</td>
                              <td className="p-2 font-mono font-bold text-white">{val}</td>
                              <td className="p-2 text-slate-400 font-mono text-[11px]">
                                {catalogParam?.referenceRange || '—'}
                              </td>
                              <td className="p-2">
                                <span className={evalRes.flagClass}>{evalRes.flagLabel}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {completedLabOrders.length > 0 && (
                    <div className="p-3 bg-teal-950/40 border border-teal-800/60 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-teal-200">
                          Diagnostic Panel verified and transmitted to Doctor Consultation workstation!
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          onPrint({
                            type: 'lab_report',
                            data: completedLabOrders[0],
                            settings: db.settings,
                          })
                        }
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-slate-950 rounded text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Lab Report</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: MEDICATION ADMINISTRATION RECORD (MAR) */}
            {activeStep === 5 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <Pill className="w-4 h-4 text-purple-400" />
                    <span>Step 5: Medication Administration Record (MAR)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nurse implements physician-prescribed stat drugs and clinical procedures. The MAR enforces the <strong>5-Rights of Medication Administration</strong>: Right Patient, Right Drug, Right Dose, Right Route, Right Time.
                  </p>

                  {/* 5-Rights Checklist */}
                  <div className="p-3 bg-purple-950/50 border border-purple-800/80 rounded-lg text-xs space-y-2">
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                      5-Rights Patient Safety Verification Protocol:
                    </div>
                    <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fiveRightsChecked}
                        onChange={(e) => setFiveRightsChecked(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded bg-slate-900 border-slate-700"
                      />
                      <span>Right Patient, Right Drug, Right Dose, Right Route, Right Time</span>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Prescription / Drug Regimen:
                      </label>
                      <input
                        type="text"
                        value={marMedName}
                        onChange={(e) => setMarMedName(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Dosage:
                        </label>
                        <input
                          type="text"
                          value={marDose}
                          onChange={(e) => setMarDose(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Route:
                        </label>
                        <select
                          value={marRoute}
                          onChange={(e) => setMarRoute(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          {MAR_ROUTES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        In-Clinic Care Procedure:
                      </label>
                      <select
                        value={marProcedure}
                        onChange={(e) => setMarProcedure(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        {NURSING_CARE_PROCEDURES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nurse Clinical Response & Chart Notes:
                      </label>
                      <textarea
                        rows={2}
                        value={nurseChartNotes}
                        onChange={(e) => setNurseChartNotes(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAdministerMar}
                    disabled={autoRunning || !targetVisit || !fiveRightsChecked}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Digitally Sign & Append to Patient MAR Record</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* MAR History View */}
                <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-sm text-white">
                      Medication Administration Record (MAR) & Care Log
                    </h4>
                    <span className="text-xs text-purple-300 font-mono">Patient: {targetVisit?.patientName}</span>
                  </div>

                  <div className="space-y-2">
                    {targetNursingRecords.length === 0 ? (
                      <p className="text-slate-500 text-xs italic p-4 text-center">
                        No nursing entries recorded yet. Click "Digitally Sign & Append to Patient MAR Record".
                      </p>
                    ) : (
                      targetNursingRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs flex justify-between items-start"
                        >
                          <div>
                            <div className="font-bold text-white">{rec.description}</div>
                            {rec.medicationName && (
                              <div className="text-purple-300 text-[11px] font-mono mt-0.5">
                                Route: {rec.route} · Dose: {rec.dosage}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1">
                              Signed by {rec.administeredBy} · {formatDateTime(rec.time)}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-800 text-purple-300 rounded border border-slate-700">
                            {rec.actionType.replace('_', ' ')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {targetNursingRecords.length > 0 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() =>
                          onPrint({
                            type: 'nursing_mar_slip',
                            data: {
                              visit: targetVisit,
                              patient: targetPatient,
                              vitals: targetVisit.vitals,
                              nursingRecords: targetNursingRecords,
                              nurseName: 'Nurse Linda Evans, RN',
                            },
                            settings: db.settings,
                          })
                        }
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official MAR Chart Slip</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: CERTIFIED CLINICAL DOSSIER & DISCHARGE SUMMARY */}
            {activeStep === 6 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h3 className="font-black text-base text-white">
                        Phase 2 Clinical Cycle Completed: Comprehensive Medical Encounter Dossier
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All clinical departments have collaborated across the single local server: Triage → OPD SOAP → ICD-10 → Critical Lab → MAR Administration.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onPrint({
                        type: 'clinical_summary',
                        data: {
                          visit: targetVisit,
                          patient: targetPatient,
                          consultation: targetConsultation || undefined,
                          vitals: targetVisit?.vitals,
                          labOrders: targetLabOrders,
                          prescriptions: db.prescriptions.filter((p) => p.visitId === targetVisit?.id),
                          nursingRecords: targetNursingRecords,
                          attendingDoctor: 'Dr. Sarah Chen, MD',
                        },
                        settings: db.settings,
                      })
                    }
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Official Clinical Encounter & Discharge Dossier</span>
                  </button>
                </div>

                {/* Milestone Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                      1. Nurse Triage
                    </span>
                    <div className="font-bold text-white">
                      {targetVisit?.vitals?.triageCategory || 'Immediate (Red)'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      BP: {targetVisit?.vitals?.bloodPressureSystolic}/{targetVisit?.vitals?.bloodPressureDiastolic} · BMI: {targetVisit?.vitals?.bmi}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                      2. ICD-10 Diagnosis
                    </span>
                    <div className="font-bold text-white truncate">
                      [{targetConsultation?.icdCode || 'I10'}] {targetConsultation?.diagnosisPrimary || 'Essential Hypertension'}
                    </div>
                    <div className="text-[11px] text-slate-400">SOAP notes documented</div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                      3. Laboratory Auto-Alerts
                    </span>
                    <div className="font-bold text-white">
                      {completedLabOrders.length > 0 ? 'Panic Values Flagged' : 'Pending'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Zero unpaid lab release enforced
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      4. Nursing MAR
                    </span>
                    <div className="font-bold text-white">5-Rights Verified</div>
                    <div className="text-[11px] text-slate-400">
                      {targetNursingRecords.length} care records signed
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
