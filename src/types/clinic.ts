export type Role =
  | 'cashier'
  | 'doctor'
  | 'nurse'
  | 'laboratory'
  | 'pharmacy'
  | 'admin'
  | 'ultrasound'
  | 'xray'
  | 'pathology';

export type PaymentStatus = 'pending' | 'paid' | 'overridden' | 'refunded';

export type VisitStatus = 'registered' | 'waiting_doctor' | 'in_consultation' | 'waiting_nurse' | 'waiting_lab' | 'waiting_pharmacy' | 'completed' | 'discharged';

export type LabOrderStatus = 'ordered' | 'pending_payment' | 'paid' | 'sample_taken' | 'in_progress' | 'completed' | 'cancelled';

export type PrescriptionStatus = 'prescribed' | 'pending_payment' | 'paid' | 'dispensed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  department: string;
  pin: string;
  avatar?: string;
  active: boolean;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number: e.g. PAT-2026-0042
  name: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  age: number;
  phone: string;
  nationalId?: string;
  emergencyContact?: string;
  allergies: string[];
  bloodGroup: string;
  medicalHistory?: string[];
  registeredAt: string;
}

export interface VitalSigns {
  temperature?: number; // Celsius
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseRate?: number; // bpm
  respiratoryRate?: number;
  oxygenSaturation?: number; // %
  weight?: number; // kg
  height?: number; // cm
  bmi?: number;
  bmiCategory?: string;
  bloodGlucose?: number; // mg/dL
  painScore?: number; // 0-10
  triageLevel?: number; // 1 to 4
  triageCategory?: string;
  triageColor?: string;
  recordedAt?: string;
  recordedBy?: string;
}

export interface Visit {
  id: string;
  visitNumber: string; // e.g. VST-2026-0189
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientAge: number;
  patientGender: string;
  queueNumber: number; // e.g. 101, 102
  department: string;
  status: VisitStatus;
  entryCardIssued: boolean;
  consultationPaid: boolean;
  emergencyOverridden: boolean;
  overrideReason?: string;
  overrideBy?: string;
  doctorAssignedId?: string;
  doctorAssignedName?: string;
  vitals?: VitalSigns;
  createdAt: string;
  completedAt?: string;
  // Concurrency & Multi-user optimistic locking
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  stationId?: string;
  activeConsultationLockedBy?: {
    doctorId: string;
    doctorName: string;
    stationName: string;
    lockedAt: string;
  };
}

export interface EntryCard {
  id: string;
  visitId: string;
  patientMrn: string;
  patientName: string;
  queueNumber: number;
  issuedAt: string;
  issuedBy: string;
  paymentStatus: PaymentStatus;
  qrCodeData: string;
  barcode: string;
}

export interface ChargeItem {
  id: string;
  visitId: string;
  patientId: string;
  category: 'consultation' | 'lab' | 'pharmacy' | 'procedure' | 'nursing';
  name: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  orderReferenceId?: string; // lab order id or prescription id
  addedAt: string;
  addedBy: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // REC-ETB-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'mobile_money' | 'bank_transfer';
  type: 'consultation' | 'advance' | 'lab' | 'pharmacy' | 'final_settlement';
  chargeItemIds: string[];
  paidAt: string;
  receivedBy: string;
  notes?: string;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  stationId?: string;
}

export interface Consultation {
  id: string;
  visitId: string;
  patientId: string;
  doctorName: string;
  doctorId: string;
  chiefComplaint: string;
  symptomsHistory: string;
  physicalExamination: string;
  systemExam?: {
    general?: string;
    cardiovascular?: string;
    respiratory?: string;
    abdominal?: string;
    neurological?: string;
    entEye?: string;
  };
  soapNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  diagnosisPrimary: string;
  diagnosisSecondary?: string;
  icdCode?: string;
  icdDescription?: string;
  doctorNotes: string;
  createdAt: string;
}

export interface LabTestCatalogItem {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  sampleType: string; // Blood, Urine, Stool, Swab
  turnaroundTime: string; // e.g. 30 mins
  parameters: {
    name: string;
    unit: string;
    referenceRange: string;
    criticalLow?: number;
    criticalHigh?: number;
  }[];
}

export interface LabResultItem {
  parameterName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  isCritical?: boolean;
  flag?: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH';
}

export interface LabOrder {
  id: string;
  orderNumber: string; // LAB-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  testCatalogId: string;
  testName: string;
  price: number;
  status: LabOrderStatus;
  paymentStatus: PaymentStatus;
  orderedByDoctor: string;
  orderedAt: string;
  sampleTakenAt?: string;
  sampleTakenBy?: string;
  results?: LabResultItem[];
  technicianNotes?: string;
  completedAt?: string;
  completedBy?: string;
  overridden: boolean;
  overrideReason?: string;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  stationId?: string;
}

export interface MedicineBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  costPrice: number;
  receivedDate: string;
  version?: number;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string; // Tablet, Syrup, Injection, Cream, Capsule
  strength: string; // 500mg, 10mg/ml, etc.
  unitPrice: number;
  reorderLevel: number;
  batches: MedicineBatch[];
  version?: number;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string; // e.g. 1 tablet
  frequency: string; // e.g. TDS (3 times daily)
  duration: string; // e.g. 5 days
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dispensedBatchId?: string;
  dispensedQuantity?: number;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // RX-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  items: PrescriptionItem[];
  totalPrice: number;
  status: PrescriptionStatus;
  paymentStatus: PaymentStatus;
  orderedByDoctor: string;
  prescribedAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
  overridden: boolean;
  overrideReason?: string;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  stationId?: string;
}

export interface NursingRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  time: string;
  actionType: 'vital_check' | 'medication_administered' | 'wound_dressing' | 'iv_fluid' | 'general_care';
  description: string;
  medicationName?: string;
  dosage?: string;
  route?: string;
  scheduledTime?: string;
  administeredBy: string;
  patientResponse?: string;
  fiveRightsVerified?: boolean;
  status?: 'administered' | 'scheduled' | 'refused' | 'held';
}

export interface DoctorOrder {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  orderDate: string;
  orderedByDoctor: string;
  orderDescription: string;
  orderType: 'stat' | 'routine' | 'standing' | 'prn';
  status: 'active' | 'completed' | 'discontinued';
  executedByNurse?: string;
  executedAt?: string;
  executionNotes?: string;
}

export interface FeedingRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  time: string;
  dietType: 'regular' | 'soft' | 'clear_fluid' | 'npo' | 'diabetic' | 'low_sodium' | 'ng_tube' | 'tpn';
  amountOffered: string;
  amountConsumed: string;
  feedingRoute: 'oral' | 'ng_tube' | 'peg' | 'iv';
  tolerance: 'well_tolerated' | 'mild_nausea' | 'vomited' | 'refused';
  assistedBy: string;
  notes?: string;
}

export interface DiabeticRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  time: string;
  mealTiming: 'fasting' | 'pre_breakfast' | 'post_breakfast' | 'pre_lunch' | 'post_lunch' | 'pre_dinner' | 'post_dinner' | 'bedtime' | '3_am';
  bloodGlucose: number; // mg/dL
  urineKetones?: 'negative' | 'trace' | '1+' | '2+' | '3+';
  insulinType?: string;
  prescribedUnits?: number;
  administeredUnits?: number;
  injectionSite?: 'abdomen_ruq' | 'abdomen_luq' | 'abdomen_rlq' | 'abdomen_llq' | 'right_arm' | 'left_arm' | 'right_thigh' | 'left_thigh';
  hypoSymptoms: boolean;
  correctiveAction?: string;
  nurseSignature: string;
  notes?: string;
}

export interface PatientConsumptionItem {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  time: string;
  itemName: string;
  category: 'consumable' | 'iv_fluid' | 'medication' | 'equipment' | 'ppe';
  quantity: number;
  unitPrice: number; // in ETB
  totalPrice: number; // in ETB
  administeredBy: string;
  billedToCashier: boolean;
  chargeItemId?: string;
}

export interface LabourSummary {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  gpal: { gravida: number; para: number; abortion: number; living: number };
  gestationalAgeWeeks: number;
  admissionTime: string;
  onsetOfLabour: string;
  membranesRupturedAt?: string;
  liquorColor: 'intact' | 'clear' | 'meconium_grade_1' | 'meconium_grade_2' | 'meconium_grade_3' | 'blood_stained';
  deliveryTime: string;
  modeOfDelivery: 'spontaneous_vaginal' | 'vacuum_assisted' | 'forceps' | 'emergency_c_section' | 'elective_c_section' | 'breech_delivery';
  babyGender: 'male' | 'female';
  birthWeightGrams: number;
  apgar1Min: number;
  apgar5Min: number;
  placentaDeliveredAt: string;
  placentaComplete: boolean;
  estimatedBloodLossMl: number;
  perineumStatus: 'intact' | 'episiotomy' | 'first_degree_tear' | 'second_degree_tear' | 'third_degree_tear' | 'fourth_degree_tear';
  uterotonicGiven: string;
  maternalConditionPostpartum: 'stable' | 'requires_monitoring' | 'critical';
  attendingMidwife: string;
  notes?: string;
}

export interface LabourExamRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  time: string;
  maternalBpSystolic: number;
  maternalBpDiastolic: number;
  maternalPulse: number;
  contractionsPer10Min: number;
  contractionDurationSec: number;
  cervicalDilatationCm: number; // 0 to 10 cm
  cervicalEffacementPercent: number; // 0 to 100%
  fetalStation: string; // -3 to +3
  fetalHeartRateBpm: number;
  membranesStatus: 'intact' | 'ruptured_clear' | 'ruptured_meconium' | 'ruptured_bloody';
  moulding: '0' | '+' | '++' | '+++';
  actionPlan: string;
  examinedBy: string;
}

export interface DischargeSummaryRecord {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  admissionDate: string;
  dischargeDate: string;
  dischargeDisposition: 'home_routine' | 'referred_hospital' | 'against_medical_advice' | 'transferred_ward' | 'expired';
  finalCondition: 'improved_stable' | 'cured' | 'stable_wheelchair' | 'stretcher_critical';
  dischargeVitals: { bp: string; temp: number; pulse: number; spo2: number; resp: number };
  medicationsExplained: boolean;
  homeMedications: string;
  woundCareDietInstructions: string;
  cannulaAndLinesRemoved: boolean;
  personalBelongingsReturned: boolean;
  followUpDate?: string;
  followUpClinic?: string;
  emergencyWarningSignsGiven: boolean;
  dischargedByNurse: string;
  patientFamilyAckSigned: boolean;
  additionalRemarks?: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  changeType: 'dispensed' | 'received' | 'adjusted' | 'expired_discard';
  quantityDelta: number;
  remainingQuantity: number;
  referenceNumber: string; // RX number or GRN number
  operator: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  role: Role;
  department: string;
  action: string;
  entityType: 'price' | 'override' | 'payment' | 'user' | 'dispense' | 'lab_result' | 'backup';
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
}

export interface WorkstationPrinterConfig {
  name: string;
  type: 'network' | 'usb_serial' | 'system_default';
  targetAddress: string; // e.g. '192.168.1.201:9100' or 'COM3'
  rollWidthMm: 80 | 58;
  autoCut: boolean;
  cashDrawerKick: boolean;
  isOnline: boolean;
  spoolerQueueDepth: number;
}

export interface WorkstationConfig {
  id: string; // e.g. 'SPEED-WS-CASHIER-01'
  name: string; // e.g. 'Reception Desk A'
  role: Role;
  roomOrCounter: string; // e.g. 'Counter 1'
  assignedOperatorId?: string;
  ipAddress: string; // e.g. '192.168.1.101'
  status: 'online' | 'intermittent' | 'offline';
  lastPingAt: string;
  printer: WorkstationPrinterConfig;
  scanner: {
    mode: 'hid_keyboard' | 'serial_com';
    prefix?: string;
    suffix?: string;
  };
}

export interface OfflineTransaction {
  id: string; // UUID
  idempotencyKey: string;
  timestamp: string;
  stationId: string;
  operatorId: string;
  operatorName: string;
  actionType: string;
  entityType: 'visit' | 'payment' | 'vitals' | 'consultation' | 'lab_order' | 'prescription' | 'dispense';
  entityId: string;
  payload: any;
  checksum: string; // SHA-256 or mock encrypted hash
  synced: boolean;
  syncError?: string;
}

export interface ConcurrencyConflict {
  entityType: 'visit' | 'payment' | 'lab_order' | 'prescription' | 'stock';
  entityId: string;
  recordIdentifier: string; // e.g. VST-2026-0189 or LAB-2026-0042
  clientVersion: number;
  serverVersion: number;
  serverUpdatedBy: string;
  serverUpdatedAt: string;
  serverStationId: string;
  clientPayload: any;
  serverPayload: any;
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  taxNumber: string;
  currency: string; // Exclusively 'ETB'
  consultationFee: number;
  revisitConsultationFee: number;
  expiryWarningDays: number; // default 60 days for yellow warning
  serverIp: string;
  emergencyOverridePin: string;
  // Security & Multi-desktop settings
  sessionIdleTimeoutMinutes: number; // default 5 or 10 min
  tlsEnabled: boolean;
  tlsPort: number;
  maxConcurrentSessionsPerUser: number;
  activeWorkstationId: string; // Current workstation running this client
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  shiftDate: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed';
  openingFloat: number;
  cashCollected: number;
  cardCollected: number;
  mobileCollected: number;
  totalCollected: number;
  expectedCashInDrawer: number;
  actualCashCounted?: number;
  discrepancy?: number;
  closedBy?: string;
  supervisorSignedBy?: string;
  notes?: string;
}

export interface WebSocketEvent {
  id: string;
  timestamp: string;
  station: string;
  eventType: 
    | 'PATIENT_REGISTERED'
    | 'PAYMENT_RECEIVED'
    | 'ENTRY_CARD_ISSUED'
    | 'DOCTOR_QUEUE_UPDATED'
    | 'CONSULTATION_SAVED'
    | 'LAB_ORDERED'
    | 'LAB_PAID'
    | 'SAMPLE_TAKEN'
    | 'LAB_RESULT_READY'
    | 'CRITICAL_LAB_ALERT'
    | 'NURSE_TRIAGE_ALERT'
    | 'MAR_MEDICATION_GIVEN'
    | 'PRESCRIPTION_ORDERED'
    | 'PRESCRIPTION_PAID'
    | 'MEDICINE_DISPENSED'
    | 'STOCK_ALERT'
    | 'EMERGENCY_OVERRIDE'
    | 'PRICE_CHANGED'
    | 'SHIFT_CLOSED'
    | 'LAN_SYNC'
    | 'CONCURRENCY_CONFLICT'
    | 'PRINTER_SPOOL_UPDATE'
    | 'WORKSTATION_PING'
    | 'DATABASE_RESTORED'
    | 'PATIENT_ADMITTED'
    | 'BED_TRANSFERRED'
    | 'INPATIENT_DEPOSIT_PAID'
    | 'PATIENT_DISCHARGED'
    | 'GATE_PASS_ISSUED'
    | 'ULTRASOUND_ORDERED'
    | 'ULTRASOUND_COMPLETED'
    | 'XRAY_ORDERED'
    | 'XRAY_COMPLETED'
    | 'PATHOLOGY_ORDERED'
    | 'PATHOLOGY_COMPLETED';
  title: string;
  detail: string;
  payload?: any;
}

export interface UltrasoundOrder {
  id: string;
  orderNumber: string; // US-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  scanType: 'Abdominal' | 'Pelvic / Obstetric' | 'Transvaginal' | 'Thyroid' | 'Echocardiogram' | 'Vascular / Doppler' | 'Musculoskeletal';
  clinicalIndication: string;
  orderedByDoctor: string;
  orderedAt: string;
  status: 'ordered' | 'in_progress' | 'completed';
  sonographerName?: string;
  performedAt?: string;
  findings: string;
  organDetails?: {
    organ: string;
    measurement?: string;
    condition: 'Normal' | 'Mild Changes' | 'Abnormal' | 'Critical';
    notes: string;
  }[];
  obstetricDetails?: {
    gestationalAgeWeeks?: number;
    gestationalAgeDays?: number;
    fetalHeartRateBpm?: number;
    estimatedFetalWeightGrams?: number;
    placentaLocation?: string;
    amnioticFluidIndexCm?: number;
    eddDate?: string;
    presentation?: string;
  };
  conclusion: string;
  impression?: string;
  recommendations?: string;
  imageThumbnail?: string;
  paymentStatus: PaymentStatus;
  price: number;
  version?: number;
}

export interface XRayOrder {
  id: string;
  orderNumber: string; // XR-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  bodyPart: 'Chest PA/AP' | 'Lumbar Spine' | 'Cervical Spine' | 'Pelvis & Hip' | 'Extremity / Limb' | 'Skull / Sinuses' | 'Abdomen Supine/Erect';
  clinicalIndication: string;
  viewsRequired: string;
  orderedByDoctor: string;
  orderedAt: string;
  status: 'ordered' | 'in_progress' | 'completed';
  radiographerName?: string;
  radiologistName?: string;
  performedAt?: string;
  findings: string;
  impression: string;
  radiationDoseMgy?: number;
  exposureQuality: 'Optimal' | 'Sub-optimal' | 'Repeat Needed';
  recommendations?: string;
  imageUrl?: string;
  paymentStatus: PaymentStatus;
  price: number;
  version?: number;
}

export interface EndoscopyOrder {
  id: string;
  orderNumber: string; // ENDO-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  procedureType: 'Upper GI Endoscopy (EGD)' | 'Colonoscopy' | 'Sigmoidoscopy' | 'Bronchoscopy' | 'Cystoscopy';
  clinicalIndication: string;
  orderedByDoctor: string;
  orderedAt: string;
  status: 'ordered' | 'in_progress' | 'completed';
  endoscopistName?: string;
  performedAt?: string;
  sedationUsed?: string;
  extentOfExam?: string;
  mucosalFindings: string;
  biopsyTaken: boolean;
  biopsySites?: string[];
  forrestClassification?: 'Ia (Spurting)' | 'Ib (Oozing)' | 'IIa (Non-bleeding visible vessel)' | 'IIb (Adherent clot)' | 'IIc (Pigmented spot)' | 'III (Clean base ulcer)' | 'N/A';
  interventionsPerformed?: string[];
  postProcedureCondition?: string;
  impression: string;
  recommendations: string;
  imageThumbnail?: string;
  paymentStatus: PaymentStatus;
  price: number;
}

export interface PathologyOrder {
  id: string;
  orderNumber: string; // PATH-2026-XXXX
  visitId: string;
  patientId: string;
  patientName: string;
  specimenType: 'Biopsy (Histopathology)' | 'Excision Specimen' | 'Fine Needle Aspiration (FNAC)' | 'Pap Smear / Liquid Cytology' | 'Fluid Cytology';
  specimenSite: string;
  clinicalHistory: string;
  orderedByDoctor: string;
  orderedAt: string;
  status: 'ordered' | 'received' | 'processing' | 'completed';
  pathologistName?: string;
  receivedAt?: string;
  reportedAt?: string;
  grossDescription: string;
  microscopicDescription: string;
  specialStainsOrIHC?: string;
  definitiveDiagnosis: string;
  snodentOrIcdCode?: string;
  urgency: 'routine' | 'stat' | 'urgent';
  paymentStatus: PaymentStatus;
  price: number;
  version?: number;
}

export interface AppointmentItem {
  id: string;
  appointmentNumber: string; // APT-2026-XXXX
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  durationMinutes: number;
  type: 'Follow-up' | 'Routine Checkup' | 'Review Lab / Radiology' | 'Post-Operative' | 'Chronic Care (NCD)' | 'New Consultation';
  status: 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  reason: string;
  notes?: string;
  priority: 'routine' | 'urgent';
  reminderSent: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  floor: string;
  totalBeds: number;
  ratePerDay: number;
  genderRestriction: 'male' | 'female' | 'mixed';
  nurseInCharge: string;
}

export interface Bed {
  id: string;
  wardId: string;
  wardName: string;
  bedNumber: string;
  type: 'standard' | 'semi_private' | 'private_deluxe' | 'icu' | 'isolation' | 'crib';
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  currentAdmissionId?: string;
  currentPatientName?: string;
  currentPatientMrn?: string;
  dailyRate: number;
}

export interface InpatientAdmission {
  id: string;
  admissionNumber: string; // e.g. IPD-2026-0042
  visitId?: string;
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female' | 'other';
  phone: string;
  nationalId?: string;
  bloodGroup: string;
  allergies: string[];
  admissionDate: string; // YYYY-MM-DD
  admissionTime: string; // HH:MM
  admissionType: 'Emergency' | 'Elective' | 'Transfer' | 'Day Surgery' | 'Maternity / Delivery' | 'ICU Critical';
  wardId: string;
  wardName: string;
  bedId: string;
  bedNumber: string;
  admittingDoctorId: string;
  admittingDoctorName: string;
  department: string;
  provisionalDiagnosis: string;
  icdCode?: string;
  initialDeposit: number;
  depositPaid: boolean;
  depositReceiptNumber?: string;
  status: 'admitted' | 'transferred' | 'pending_discharge' | 'discharged';
  lengthOfStayDays?: number;
  dischargeDate?: string;
  dischargeTime?: string;
  dischargeSummaryNotes?: string;
  dischargeCondition?: 'improved_stable' | 'cured' | 'referred' | 'against_medical_advice';
  gatePassIssued?: boolean;
  gatePassNumber?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes?: string;
  admittedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DatabaseState {
  users: User[];
  patients: Patient[];
  visits: Visit[];
  entryCards: EntryCard[];
  charges: ChargeItem[];
  payments: Payment[];
  consultations: Consultation[];
  labCatalog: LabTestCatalogItem[];
  labOrders: LabOrder[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  nursingRecords: NursingRecord[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  cashierShifts?: CashierShift[];
  settings: ClinicSettings;
  webSocketEvents: WebSocketEvent[];
  workstations: WorkstationConfig[];
  offlineQueue: OfflineTransaction[];
  doctorOrders?: DoctorOrder[];
  feedingRecords?: FeedingRecord[];
  diabeticRecords?: DiabeticRecord[];
  patientConsumptions?: PatientConsumptionItem[];
  labourSummaries?: LabourSummary[];
  labourExamRecords?: LabourExamRecord[];
  dischargeSummaries?: DischargeSummaryRecord[];
  ultrasoundOrders?: UltrasoundOrder[];
  xrayOrders?: XRayOrder[];
  endoscopyOrders?: EndoscopyOrder[];
  pathologyOrders?: PathologyOrder[];
  appointments?: AppointmentItem[];
  wards?: Ward[];
  beds?: Bed[];
  admissions?: InpatientAdmission[];
}
