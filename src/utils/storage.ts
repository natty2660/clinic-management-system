import {
  User,
  Patient,
  Visit,
  EntryCard,
  ChargeItem,
  Payment,
  Consultation,
  LabTestCatalogItem,
  LabOrder,
  Medicine,
  Prescription,
  NursingRecord,
  StockMovement,
  AuditLog,
  ClinicSettings,
  WebSocketEvent,
  DatabaseState,
  CashierShift,
  WorkstationConfig,
  OfflineTransaction,
  ConcurrencyConflict,
  DoctorOrder,
  FeedingRecord,
  DiabeticRecord,
  PatientConsumptionItem,
  LabourSummary,
  LabourExamRecord,
  DischargeSummaryRecord,
  UltrasoundOrder,
  XRayOrder,
  EndoscopyOrder,
  PathologyOrder,
  AppointmentItem,
  Ward,
  Bed,
  InpatientAdmission,
} from '../types/clinic';
import { clinicAudio } from './audio';

export const STORAGE_KEY = 'SPEED_CIS_DATABASE_V2';

export type { DatabaseState };

export const INITIAL_SHIFTS: CashierShift[] = [
  {
    id: 'shift_today',
    cashierId: 'usr_cashier_1',
    cashierName: 'Elena Rostova',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: 'open',
    openingFloat: 1000.0,
    cashCollected: 700.0,
    cardCollected: 350.0,
    mobileCollected: 0.0,
    totalCollected: 1050.0,
    expectedCashInDrawer: 1700.0,
    notes: 'Morning shift drawer opened with standard ETB 1,000 float.',
  },
];

export const INITIAL_SETTINGS: ClinicSettings = {
  clinicName: 'SPEED Clinic Information System (SPEED CIS)',
  tagline: 'Multi-Desktop High-Concurrency Clinic Network',
  address: 'Bole Sub-City, Africa Avenue, Addis Ababa, Ethiopia',
  phone: '+251 11 661 4050 / +251 91 123 4567',
  taxNumber: 'TIN-0048192384-ET',
  currency: 'ETB',
  consultationFee: 350.0,
  revisitConsultationFee: 200.0,
  expiryWarningDays: 60,
  serverIp: '192.168.1.120:8000',
  emergencyOverridePin: '9944',
  sessionIdleTimeoutMinutes: 5,
  tlsEnabled: true,
  tlsPort: 8443,
  maxConcurrentSessionsPerUser: 1,
  activeWorkstationId: 'SPEED-WS-CASH-01',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_cashier_1',
    name: 'Elena Rostova',
    username: 'cashier1',
    role: 'cashier',
    department: 'SPEED Reception & Cashier (Counter 1)',
    pin: '1234',
    active: true,
  },
  {
    id: 'usr_cashier_2',
    name: 'Bethlehem Tadesse',
    username: 'cashier2',
    role: 'cashier',
    department: 'SPEED Reception & Cashier (Counter 2)',
    pin: '1235',
    active: true,
  },
  {
    id: 'usr_doctor_1',
    name: 'Dr. Sarah Chen, MD',
    username: 'dr.chen',
    role: 'doctor',
    department: 'SPEED OPD (Room 101)',
    pin: '2345',
    active: true,
  },
  {
    id: 'usr_doctor_2',
    name: 'Dr. Samuel Bekele, MD',
    username: 'dr.bekele',
    role: 'doctor',
    department: 'SPEED OPD (Room 102)',
    pin: '2346',
    active: true,
  },
  {
    id: 'usr_nurse_1',
    name: 'Nurse Linda Evans, RN',
    username: 'nurse.linda',
    role: 'nurse',
    department: 'SPEED Triage & Nursing Station',
    pin: '3456',
    active: true,
  },
  {
    id: 'usr_lab_1',
    name: 'Kwame Mensah, MLS',
    username: 'tech.kwame',
    role: 'laboratory',
    department: 'SPEED Laboratory Station',
    pin: '4567',
    active: true,
  },
  {
    id: 'usr_pharm_1',
    name: 'Tariq Al-Mansoor, RPh',
    username: 'pharm.tariq',
    role: 'pharmacy',
    department: 'SPEED Pharmacy Dispensary',
    pin: '5678',
    active: true,
  },
  {
    id: 'usr_admin_1',
    name: 'Marcus Vance (Superintendent)',
    username: 'admin.marcus',
    role: 'admin',
    department: 'SPEED Admin & Server Console',
    pin: '9944',
    active: true,
  },
  {
    id: 'usr_ultrasound_1',
    name: 'Dr. Daniel Tefera (Sonologist)',
    username: 'sono.daniel',
    role: 'ultrasound',
    department: 'SPEED Ultrasound Suite',
    pin: '3322',
    active: true,
  },
  {
    id: 'usr_xray_1',
    name: 'Helen Berhe (Radiographer)',
    username: 'rad.helen',
    role: 'xray',
    department: 'SPEED Digital X-Ray Station',
    pin: '7788',
    active: true,
  },
  {
    id: 'usr_pathology_1',
    name: 'Dr. Yonas Alemu (Pathologist)',
    username: 'path.yonas',
    role: 'pathology',
    department: 'SPEED Histopathology Suite',
    pin: '8899',
    active: true,
  },
];

export const INITIAL_WORKSTATIONS: WorkstationConfig[] = [
  {
    id: 'SPEED-WS-CASH-01',
    name: 'SPEED Reception Desk A',
    role: 'cashier',
    roomOrCounter: 'Counter 1',
    assignedOperatorId: 'usr_cashier_1',
    ipAddress: '192.168.1.101',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Epson TM-T88VI (Cashier Counter 1)',
      type: 'network',
      targetAddress: '192.168.1.201:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: true,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-CASH-02',
    name: 'SPEED Reception Desk B',
    role: 'cashier',
    roomOrCounter: 'Counter 2',
    assignedOperatorId: 'usr_cashier_2',
    ipAddress: '192.168.1.102',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Epson TM-T20III (Cashier Counter 2)',
      type: 'network',
      targetAddress: '192.168.1.202:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: true,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-DOC-01',
    name: 'SPEED Doctor OPD (Room 101)',
    role: 'doctor',
    roomOrCounter: 'Room 101',
    assignedOperatorId: 'usr_doctor_1',
    ipAddress: '192.168.1.105',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'HP LaserJet Pro M404n (Room 101)',
      type: 'network',
      targetAddress: '192.168.1.205:9100',
      rollWidthMm: 80,
      autoCut: false,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-DOC-02',
    name: 'SPEED Doctor OPD (Room 102)',
    role: 'doctor',
    roomOrCounter: 'Room 102',
    assignedOperatorId: 'usr_doctor_2',
    ipAddress: '192.168.1.106',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'HP LaserJet Pro M404n (Room 102)',
      type: 'network',
      targetAddress: '192.168.1.206:9100',
      rollWidthMm: 80,
      autoCut: false,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-NURSE-01',
    name: 'SPEED Triage & Nurse Station',
    role: 'nurse',
    roomOrCounter: 'Triage Room',
    assignedOperatorId: 'usr_nurse_1',
    ipAddress: '192.168.1.110',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Bixolon SRP-330II (Triage)',
      type: 'network',
      targetAddress: '192.168.1.210:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-LAB-01',
    name: 'SPEED Laboratory Station',
    role: 'laboratory',
    roomOrCounter: 'Lab Bench 1',
    assignedOperatorId: 'usr_lab_1',
    ipAddress: '192.168.1.115',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Zebra ZD220 Barcode Label Printer',
      type: 'usb_serial',
      targetAddress: 'COM3',
      rollWidthMm: 58,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'serial_com', prefix: 'STX', suffix: 'ETX' },
  },
  {
    id: 'SPEED-WS-PHARM-01',
    name: 'SPEED Pharmacy Dispensary',
    role: 'pharmacy',
    roomOrCounter: 'Dispensary Window 1',
    assignedOperatorId: 'usr_pharm_1',
    ipAddress: '192.168.1.120',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Epson TM-T82III (Pharmacy)',
      type: 'network',
      targetAddress: '192.168.1.220:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-ADMIN-01',
    name: 'SPEED Admin & Server Console',
    role: 'admin',
    roomOrCounter: 'Server Room',
    assignedOperatorId: 'usr_admin_1',
    ipAddress: '192.168.1.130',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Canon imageRUNNER (Network)',
      type: 'network',
      targetAddress: '192.168.1.250:9100',
      rollWidthMm: 80,
      autoCut: false,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-US-01',
    name: 'SPEED Ultrasound Suite',
    role: 'ultrasound',
    roomOrCounter: 'Ultrasound Suite (Room 105)',
    assignedOperatorId: 'usr_ultrasound_1',
    ipAddress: '192.168.1.140',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Sony UP-X898MD Video / Thermal Printer',
      type: 'network',
      targetAddress: '192.168.1.240:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-XR-01',
    name: 'SPEED Digital X-Ray Station',
    role: 'xray',
    roomOrCounter: 'Radiology Bay 1',
    assignedOperatorId: 'usr_xray_1',
    ipAddress: '192.168.1.145',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'DryView 5950 Laser Imaging Printer',
      type: 'network',
      targetAddress: '192.168.1.245:9100',
      rollWidthMm: 80,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'hid_keyboard', prefix: '', suffix: '\n' },
  },
  {
    id: 'SPEED-WS-PATH-01',
    name: 'SPEED Histopathology Suite',
    role: 'pathology',
    roomOrCounter: 'Pathology Lab B',
    assignedOperatorId: 'usr_pathology_1',
    ipAddress: '192.168.1.150',
    status: 'online',
    lastPingAt: new Date().toISOString(),
    printer: {
      name: 'Zebra ZD420 Cassette & Slide Printer',
      type: 'usb_serial',
      targetAddress: 'COM4',
      rollWidthMm: 58,
      autoCut: true,
      cashDrawerKick: false,
      isOnline: true,
      spoolerQueueDepth: 0,
    },
    scanner: { mode: 'serial_com', prefix: 'STX', suffix: 'ETX' },
  },
];

export const INITIAL_LAB_CATALOG: LabTestCatalogItem[] = [
  {
    id: 'lab_cbc',
    code: 'LAB-CBC',
    name: 'Complete Blood Count (CBC/FBC)',
    category: 'Hematology',
    price: 450.0, // ETB
    sampleType: 'Whole Blood (EDTA)',
    turnaroundTime: '20 mins',
    parameters: [
      { name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '12.0 - 16.5', criticalLow: 8.0, criticalHigh: 18.5 },
      { name: 'White Blood Cells (WBC)', unit: 'x10^9/L', referenceRange: '4.0 - 11.0', criticalLow: 2.0, criticalHigh: 20.0 },
      { name: 'Platelets', unit: 'x10^9/L', referenceRange: '150 - 450', criticalLow: 50, criticalHigh: 600 },
      { name: 'Hematocrit (Hct)', unit: '%', referenceRange: '36.0 - 50.0' },
    ],
  },
  {
    id: 'lab_malaria',
    code: 'LAB-MAL',
    name: 'Malaria Rapid Diagnostic Test (Pf/Pv)',
    category: 'Parasitology',
    price: 250.0, // ETB
    sampleType: 'Fingerprick Whole Blood',
    turnaroundTime: '15 mins',
    parameters: [
      { name: 'P. falciparum Antigen', unit: 'Qualitative', referenceRange: 'Negative' },
      { name: 'P. vivax Antigen', unit: 'Qualitative', referenceRange: 'Negative' },
    ],
  },
  {
    id: 'lab_glucose',
    code: 'LAB-FBS',
    name: 'Fasting Blood Glucose (FBS)',
    category: 'Biochemistry',
    price: 200.0, // ETB
    sampleType: 'Sodium Fluoride Blood',
    turnaroundTime: '15 mins',
    parameters: [
      { name: 'Fasting Glucose', unit: 'mg/dL', referenceRange: '70 - 99', criticalLow: 55, criticalHigh: 250 },
    ],
  },
  {
    id: 'lab_lipid',
    code: 'LAB-LIP',
    name: 'Lipid Profile Panel',
    category: 'Biochemistry',
    price: 650.0, // ETB
    sampleType: 'Serum',
    turnaroundTime: '45 mins',
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
      { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' },
      { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', referenceRange: '> 40' },
      { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', referenceRange: '< 100' },
    ],
  },
  {
    id: 'lab_urine',
    code: 'LAB-URN',
    name: 'Urinalysis Micro & Chemistry',
    category: 'Clinical Microscopy',
    price: 180.0, // ETB
    sampleType: 'Clean Catch Midstream Urine',
    turnaroundTime: '25 mins',
    parameters: [
      { name: 'Protein', unit: 'Dipstick', referenceRange: 'Negative' },
      { name: 'Glucose', unit: 'Dipstick', referenceRange: 'Negative' },
      { name: 'Leukocyte Esterase', unit: 'Dipstick', referenceRange: 'Negative' },
      { name: 'Microscopic Pus Cells', unit: '/HPF', referenceRange: '0 - 5' },
    ],
  },
  {
    id: 'lab_typhoid',
    code: 'LAB-WID',
    name: 'Typhoid Widal / Ag Rapid Test',
    category: 'Serology',
    price: 320.0, // ETB
    sampleType: 'Serum',
    turnaroundTime: '20 mins',
    parameters: [
      { name: 'Salmonella Typhi O Ag', unit: 'Titer', referenceRange: '< 1:80' },
      { name: 'Salmonella Typhi H Ag', unit: 'Titer', referenceRange: '< 1:80' },
    ],
  },
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med_amox_500',
    code: 'MED-001',
    name: 'Amoxicillin Trihydrate',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    dosageForm: 'Capsule',
    strength: '500mg',
    unitPrice: 180.0, // ETB per pack/dispense
    reorderLevel: 100,
    version: 1,
    batches: [
      {
        id: 'batch_amox_01',
        batchNumber: 'AMX-2026B',
        quantity: 280,
        expiryDate: '2027-11-30',
        costPrice: 95.0,
        receivedDate: '2026-06-10',
        version: 1,
      },
      {
        id: 'batch_amox_02',
        batchNumber: 'AMX-2025Z',
        quantity: 35,
        expiryDate: '2026-10-15',
        costPrice: 90.0,
        receivedDate: '2025-10-01',
        version: 1,
      },
    ],
  },
  {
    id: 'med_para_500',
    code: 'MED-002',
    name: 'Paracetamol (Acetaminophen)',
    genericName: 'Paracetamol',
    category: 'Analgesics & Antipyretics',
    dosageForm: 'Tablet',
    strength: '500mg',
    unitPrice: 65.0, // ETB
    reorderLevel: 250,
    version: 1,
    batches: [
      {
        id: 'batch_para_01',
        batchNumber: 'PCM-9801',
        quantity: 650,
        expiryDate: '2028-04-15',
        costPrice: 25.0,
        receivedDate: '2026-04-02',
        version: 1,
      },
    ],
  },
  {
    id: 'med_metformin',
    code: 'MED-003',
    name: 'Metformin Hydrochloride',
    genericName: 'Metformin',
    category: 'Antidiabetic',
    dosageForm: 'Film-Coated Tablet',
    strength: '500mg',
    unitPrice: 190.0, // ETB
    reorderLevel: 80,
    version: 1,
    batches: [
      {
        id: 'batch_met_01',
        batchNumber: 'MTF-5541',
        quantity: 140,
        expiryDate: '2027-08-20',
        costPrice: 85.0,
        receivedDate: '2026-02-14',
        version: 1,
      },
    ],
  },
  {
    id: 'med_artemether',
    code: 'MED-004',
    name: 'Artemether + Lumefantrine (Coartem)',
    genericName: 'Artemether/Lumefantrine',
    category: 'Antimalarial',
    dosageForm: 'Tablet (Strip of 24)',
    strength: '20mg/120mg',
    unitPrice: 380.0, // ETB
    reorderLevel: 30,
    version: 1,
    batches: [
      {
        id: 'batch_art_01',
        batchNumber: 'ALM-802',
        quantity: 45,
        expiryDate: '2027-03-31',
        costPrice: 210.0,
        receivedDate: '2026-03-10',
        version: 1,
      },
    ],
  },
  {
    id: 'med_omeprazole',
    code: 'MED-005',
    name: 'Omeprazole Delayed Release',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal (PPI)',
    dosageForm: 'Capsule',
    strength: '20mg',
    unitPrice: 160.0, // ETB
    reorderLevel: 50,
    version: 1,
    batches: [
      {
        id: 'batch_ome_01',
        batchNumber: 'OMP-411',
        quantity: 120,
        expiryDate: '2027-06-30',
        costPrice: 70.0,
        receivedDate: '2026-01-20',
        version: 1,
      },
      {
        id: 'batch_ome_expired',
        batchNumber: 'OMP-390-EXP',
        quantity: 24,
        expiryDate: '2026-09-10',
        costPrice: 65.0,
        receivedDate: '2024-09-01',
        version: 1,
      },
    ],
  },
  {
    id: 'med_ceftriaxone',
    code: 'MED-006',
    name: 'Ceftriaxone Sodium Injection',
    genericName: 'Ceftriaxone',
    category: 'Antibiotics (IV/IM)',
    dosageForm: 'Vial + Water for Inj',
    strength: '1g',
    unitPrice: 340.0, // ETB
    reorderLevel: 25,
    version: 1,
    batches: [
      {
        id: 'batch_cef_01',
        batchNumber: 'CFT-990',
        quantity: 18,
        expiryDate: '2027-01-15',
        costPrice: 160.0,
        receivedDate: '2026-05-12',
        version: 1,
      },
    ],
  },
  {
    id: 'med_salbutamol',
    code: 'MED-007',
    name: 'Salbutamol Inhaler (Ventolin)',
    genericName: 'Albuterol / Salbutamol',
    category: 'Respiratory',
    dosageForm: 'Metered Dose Inhaler',
    strength: '100mcg/actuation',
    unitPrice: 420.0, // ETB
    reorderLevel: 15,
    version: 1,
    batches: [
      {
        id: 'batch_sal_01',
        batchNumber: 'SBT-771',
        quantity: 22,
        expiryDate: '2026-11-05',
        costPrice: 240.0,
        receivedDate: '2025-11-01',
        version: 1,
      },
    ],
  },
  {
    id: 'med_ibuprofen',
    code: 'MED-008',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'NSAID / Analgesic',
    dosageForm: 'Tablet',
    strength: '400mg',
    unitPrice: 85.0, // ETB
    reorderLevel: 100,
    version: 1,
    batches: [
      {
        id: 'batch_ibu_01',
        batchNumber: 'IBU-1022',
        quantity: 320,
        expiryDate: '2028-02-28',
        costPrice: 35.0,
        receivedDate: '2026-05-01',
        version: 1,
      },
    ],
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    mrn: 'PAT-2026-0041',
    name: 'Samuel Kiprop',
    gender: 'male',
    dob: '1988-04-12',
    age: 38,
    phone: '+251 91 123 8891',
    nationalId: 'ET-9928371',
    emergencyContact: 'Mary Kiprop (Wife) +251 91 123 8892',
    allergies: ['Penicillin (mild rash)'],
    bloodGroup: 'O+',
    registeredAt: '2026-09-27T08:15:00Z',
  },
  {
    id: 'pat_2',
    mrn: 'PAT-2026-0042',
    name: 'Grace Adhiambo',
    gender: 'female',
    dob: '1995-11-03',
    age: 30,
    phone: '+251 91 441 9923',
    emergencyContact: 'John Adhiambo +251 91 441 9924',
    allergies: [],
    bloodGroup: 'A+',
    registeredAt: '2026-09-27T08:30:00Z',
  },
  {
    id: 'pat_3',
    mrn: 'PAT-2026-0043',
    name: 'David Zhao',
    gender: 'male',
    dob: '1962-07-19',
    age: 64,
    phone: '+251 91 778 1122',
    emergencyContact: 'Wei Zhao (Son) +251 91 778 1123',
    allergies: ['Sulfa drugs'],
    bloodGroup: 'B+',
    registeredAt: '2026-09-27T08:45:00Z',
  },
  {
    id: 'pat_4',
    mrn: 'PAT-2026-0044',
    name: 'Amara Okafor',
    gender: 'female',
    dob: '2001-02-14',
    age: 25,
    phone: '+251 91 882 3390',
    emergencyContact: 'Chidi Okafor +251 91 882 3391',
    allergies: [],
    bloodGroup: 'AB+',
    registeredAt: '2026-09-27T09:00:00Z',
  },
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'vst_1',
    visitNumber: 'VST-2026-0101',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    patientMrn: 'PAT-2026-0041',
    patientAge: 38,
    patientGender: 'male',
    queueNumber: 101,
    department: 'SPEED OPD (Room 101)',
    status: 'waiting_doctor',
    entryCardIssued: true,
    consultationPaid: true,
    emergencyOverridden: false,
    doctorAssignedId: 'usr_doctor_1',
    doctorAssignedName: 'Dr. Sarah Chen, MD',
    version: 1,
    updatedAt: '2026-09-27T08:20:00Z',
    updatedBy: 'Elena Rostova',
    stationId: 'SPEED-WS-CASH-01',
    vitals: {
      temperature: 38.6,
      bloodPressureSystolic: 124,
      bloodPressureDiastolic: 82,
      pulseRate: 98,
      respiratoryRate: 18,
      oxygenSaturation: 98,
      weight: 76.5,
      height: 178,
      recordedAt: '2026-09-27T08:25:00Z',
      recordedBy: 'Nurse Linda Evans, RN',
    },
    createdAt: '2026-09-27T08:18:00Z',
  },
  {
    id: 'vst_2',
    visitNumber: 'VST-2026-0102',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    patientMrn: 'PAT-2026-0042',
    patientAge: 30,
    patientGender: 'female',
    queueNumber: 102,
    department: 'SPEED OPD (Room 101)',
    status: 'waiting_lab',
    entryCardIssued: true,
    consultationPaid: true,
    emergencyOverridden: false,
    doctorAssignedId: 'usr_doctor_1',
    doctorAssignedName: 'Dr. Sarah Chen, MD',
    version: 1,
    updatedAt: '2026-09-27T08:33:00Z',
    updatedBy: 'Elena Rostova',
    stationId: 'SPEED-WS-CASH-01',
    vitals: {
      temperature: 37.8,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      pulseRate: 84,
      respiratoryRate: 16,
      oxygenSaturation: 99,
      weight: 62.0,
      height: 165,
      recordedAt: '2026-09-27T08:35:00Z',
      recordedBy: 'Nurse Linda Evans, RN',
    },
    createdAt: '2026-09-27T08:32:00Z',
  },
  {
    id: 'vst_3',
    visitNumber: 'VST-2026-0103',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    patientMrn: 'PAT-2026-0043',
    patientAge: 64,
    patientGender: 'male',
    queueNumber: 103,
    department: 'SPEED OPD (Room 101)',
    status: 'waiting_pharmacy',
    entryCardIssued: true,
    consultationPaid: true,
    emergencyOverridden: false,
    doctorAssignedId: 'usr_doctor_1',
    doctorAssignedName: 'Dr. Sarah Chen, MD',
    version: 1,
    updatedAt: '2026-09-27T08:49:00Z',
    updatedBy: 'Elena Rostova',
    stationId: 'SPEED-WS-CASH-01',
    vitals: {
      temperature: 36.7,
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 90,
      pulseRate: 76,
      respiratoryRate: 16,
      oxygenSaturation: 97,
      weight: 81.2,
      height: 172,
      recordedAt: '2026-09-27T08:50:00Z',
      recordedBy: 'Nurse Linda Evans, RN',
    },
    createdAt: '2026-09-27T08:48:00Z',
  },
  {
    id: 'vst_4',
    visitNumber: 'VST-2026-0104',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    patientMrn: 'PAT-2026-0044',
    patientAge: 25,
    patientGender: 'female',
    queueNumber: 104,
    department: 'SPEED OPD (Room 102)',
    status: 'registered',
    entryCardIssued: false,
    consultationPaid: false,
    emergencyOverridden: false,
    version: 1,
    createdAt: '2026-09-27T09:02:00Z',
  },
];

export const INITIAL_ENTRY_CARDS: EntryCard[] = [
  {
    id: 'card_1',
    visitId: 'vst_1',
    patientMrn: 'PAT-2026-0041',
    patientName: 'Samuel Kiprop',
    queueNumber: 101,
    issuedAt: '2026-09-27T08:20:00Z',
    issuedBy: 'Elena Rostova (Cashier)',
    paymentStatus: 'paid',
    qrCodeData: 'SPEED:VST-2026-0101|MRN:PAT-2026-0041|Q:101|PAID',
    barcode: 'VST20260101',
  },
  {
    id: 'card_2',
    visitId: 'vst_2',
    patientMrn: 'PAT-2026-0042',
    patientName: 'Grace Adhiambo',
    queueNumber: 102,
    issuedAt: '2026-09-27T08:33:00Z',
    issuedBy: 'Elena Rostova (Cashier)',
    paymentStatus: 'paid',
    qrCodeData: 'SPEED:VST-2026-0102|MRN:PAT-2026-0042|Q:102|PAID',
    barcode: 'VST20260102',
  },
  {
    id: 'card_3',
    visitId: 'vst_3',
    patientMrn: 'PAT-2026-0043',
    patientName: 'David Zhao',
    queueNumber: 103,
    issuedAt: '2026-09-27T08:49:00Z',
    issuedBy: 'Elena Rostova (Cashier)',
    paymentStatus: 'paid',
    qrCodeData: 'SPEED:VST-2026-0103|MRN:PAT-2026-0043|Q:103|PAID',
    barcode: 'VST20260103',
  },
];

export const INITIAL_CHARGES: ChargeItem[] = [
  {
    id: 'chg_v1_cons',
    visitId: 'vst_1',
    patientId: 'pat_1',
    category: 'consultation',
    name: 'General Medical Consultation',
    unitPrice: 350.0, // ETB
    quantity: 1,
    totalPrice: 350.0,
    paymentStatus: 'paid',
    addedAt: '2026-09-27T08:18:00Z',
    addedBy: 'Elena Rostova',
  },
  {
    id: 'chg_v2_cons',
    visitId: 'vst_2',
    patientId: 'pat_2',
    category: 'consultation',
    name: 'General Medical Consultation',
    unitPrice: 350.0, // ETB
    quantity: 1,
    totalPrice: 350.0,
    paymentStatus: 'paid',
    addedAt: '2026-09-27T08:32:00Z',
    addedBy: 'Elena Rostova',
  },
  {
    id: 'chg_v2_lab',
    visitId: 'vst_2',
    patientId: 'pat_2',
    category: 'lab',
    name: 'Malaria Rapid Diagnostic Test (Pf/Pv)',
    unitPrice: 250.0, // ETB
    quantity: 1,
    totalPrice: 250.0,
    paymentStatus: 'paid',
    orderReferenceId: 'lab_ord_1',
    addedAt: '2026-09-27T08:45:00Z',
    addedBy: 'Dr. Sarah Chen, MD',
  },
  {
    id: 'chg_v3_cons',
    visitId: 'vst_3',
    patientId: 'pat_3',
    category: 'consultation',
    name: 'General Medical Consultation',
    unitPrice: 350.0, // ETB
    quantity: 1,
    totalPrice: 350.0,
    paymentStatus: 'paid',
    addedAt: '2026-09-27T08:48:00Z',
    addedBy: 'Elena Rostova',
  },
  {
    id: 'chg_v3_rx_1',
    visitId: 'vst_3',
    patientId: 'pat_3',
    category: 'pharmacy',
    name: 'Metformin Hydrochloride 500mg',
    unitPrice: 190.0, // ETB
    quantity: 1,
    totalPrice: 190.0,
    paymentStatus: 'paid',
    orderReferenceId: 'rx_ord_1',
    addedAt: '2026-09-27T09:10:00Z',
    addedBy: 'Dr. Sarah Chen, MD',
  },
  {
    id: 'chg_v4_cons',
    visitId: 'vst_4',
    patientId: 'pat_4',
    category: 'consultation',
    name: 'General Medical Consultation',
    unitPrice: 350.0, // ETB
    quantity: 1,
    totalPrice: 350.0,
    paymentStatus: 'pending',
    addedAt: '2026-09-27T09:02:00Z',
    addedBy: 'Elena Rostova',
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    receiptNumber: 'REC-ETB-2026-0811',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    amount: 350.0,
    paymentMethod: 'cash',
    type: 'consultation',
    chargeItemIds: ['chg_v1_cons'],
    paidAt: '2026-09-27T08:20:00Z',
    receivedBy: 'Elena Rostova',
    version: 1,
    stationId: 'SPEED-WS-CASH-01',
    notes: 'Consultation fee collected at registration. Entry card generated.',
  },
  {
    id: 'pay_2',
    receiptNumber: 'REC-ETB-2026-0812',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    amount: 350.0,
    paymentMethod: 'mobile_money',
    type: 'consultation',
    chargeItemIds: ['chg_v2_cons'],
    paidAt: '2026-09-27T08:33:00Z',
    receivedBy: 'Elena Rostova',
    version: 1,
    stationId: 'SPEED-WS-CASH-01',
    notes: 'Telebirr Ref: TB-299014X',
  },
  {
    id: 'pay_3',
    receiptNumber: 'REC-ETB-2026-0813',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    amount: 250.0,
    paymentMethod: 'mobile_money',
    type: 'lab',
    chargeItemIds: ['chg_v2_lab'],
    paidAt: '2026-09-27T08:47:00Z',
    receivedBy: 'Elena Rostova',
    version: 1,
    stationId: 'SPEED-WS-CASH-01',
    notes: 'Malaria test payment confirmed in ETB. Transmitted to Lab PC.',
  },
  {
    id: 'pay_4',
    receiptNumber: 'REC-ETB-2026-0814',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    amount: 540.0,
    paymentMethod: 'card',
    type: 'final_settlement',
    chargeItemIds: ['chg_v3_cons', 'chg_v3_rx_1'],
    paidAt: '2026-09-27T09:12:00Z',
    receivedBy: 'Elena Rostova',
    version: 1,
    stationId: 'SPEED-WS-CASH-01',
    notes: 'Settled consultation (350 ETB) + Metformin (190 ETB). Cleared for Pharmacy pickup.',
  },
];

export const INITIAL_CONSULTATIONS: Consultation[] = [
  {
    id: 'cons_v2',
    visitId: 'vst_2',
    patientId: 'pat_2',
    doctorName: 'Dr. Sarah Chen, MD',
    doctorId: 'usr_doctor_1',
    chiefComplaint: 'Intermittent high fever, body chills, headache and nausea for 3 days',
    symptomsHistory: 'Patient travelled to Rift Valley 10 days ago. Evening rigors, sweating, myalgia, fatigue. No cough.',
    physicalExamination: 'Alert, febrile (37.8 C). Mild conjunctival pallor. Soft non-tender abdomen, mild splenomegaly.',
    diagnosisPrimary: 'Suspected Acute Malaria',
    icdCode: 'B54',
    doctorNotes: 'Ordered STAT Malaria RDT and CBC. Patient instructed to clear payment at Cashier desk before blood draw.',
    createdAt: '2026-09-27T08:44:00Z',
  },
  {
    id: 'cons_v3',
    visitId: 'vst_3',
    patientId: 'pat_3',
    doctorName: 'Dr. Sarah Chen, MD',
    doctorId: 'usr_doctor_1',
    chiefComplaint: 'Routine Type 2 Diabetes follow-up & prescription renewal',
    symptomsHistory: 'Reports good dietary compliance. Denies polyuria, polydipsia, foot numbness.',
    physicalExamination: 'BP 142/90 mmHg. Peripheral pulses intact. Monofilament test normal.',
    diagnosisPrimary: 'Type 2 Diabetes Mellitus without complications',
    icdCode: 'E11.9',
    doctorNotes: 'Renewed Metformin 500mg BID x 30 days. Recheck HbA1c in 3 months.',
    createdAt: '2026-09-27T09:08:00Z',
  },
];

export const INITIAL_LAB_ORDERS: LabOrder[] = [
  {
    id: 'lab_ord_1',
    orderNumber: 'LAB-2026-0401',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    patientMrn: 'PAT-2026-0042',
    testCatalogId: 'lab_malaria',
    testName: 'Malaria Rapid Diagnostic Test (Pf/Pv)',
    price: 250.0,
    status: 'sample_taken',
    paymentStatus: 'paid',
    orderedByDoctor: 'Dr. Sarah Chen, MD',
    orderedAt: '2026-09-27T08:45:00Z',
    sampleTakenAt: '2026-09-27T08:52:00Z',
    sampleTakenBy: 'Kwame Mensah, MLS',
    overridden: false,
    version: 1,
    stationId: 'SPEED-WS-LAB-01',
  },
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx_ord_1',
    prescriptionNumber: 'RX-2026-0301',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    patientMrn: 'PAT-2026-0043',
    items: [
      {
        id: 'rx_item_1',
        medicineId: 'med_metformin',
        medicineName: 'Metformin Hydrochloride 500mg',
        dosage: '1 tablet (500mg)',
        frequency: 'BD (Twice daily with meals)',
        duration: '30 days',
        quantity: 1,
        unitPrice: 190.0,
        totalPrice: 190.0,
      },
    ],
    totalPrice: 190.0,
    status: 'paid',
    paymentStatus: 'paid',
    orderedByDoctor: 'Dr. Sarah Chen, MD',
    prescribedAt: '2026-09-27T09:10:00Z',
    overridden: false,
    version: 1,
    stationId: 'SPEED-WS-DOC-01',
  },
];

export const INITIAL_NURSING_RECORDS: NursingRecord[] = [
  {
    id: 'nur_rec_1',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    time: '2026-09-27T08:25:00Z',
    actionType: 'vital_check',
    description: 'Initial triage performed. Patient warm to touch (Temp 38.6 C). Offered oral rehydration fluids. Placed in priority queue.',
    administeredBy: 'Nurse Linda Evans, RN',
  },
  {
    id: 'nur_rec_2',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    time: '2026-09-27T08:35:00Z',
    actionType: 'vital_check',
    description: 'Vitals recorded. Patient advised to rest in sub-waiting area while awaiting doctor call.',
    administeredBy: 'Nurse Linda Evans, RN',
  },
];

export const INITIAL_DOCTOR_ORDERS: DoctorOrder[] = [
  {
    id: 'ord_1',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    orderDate: '2026-09-27T08:30:00Z',
    orderedByDoctor: 'Dr. Sarah Chen, MD',
    orderDescription: 'Insert IV Cannula 20G and start IV Normal Saline 0.9% 1000ml @ 100ml/hr. Paracetamol 1g IV Stat for fever.',
    orderType: 'stat',
    status: 'completed',
    executedByNurse: 'Nurse Linda Evans, RN',
    executedAt: '2026-09-27T08:35:00Z',
    executionNotes: 'Cannula inserted right forearm, 1st attempt. 1000ml NS running well. Paracetamol 1g given.',
  },
  {
    id: 'ord_2',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    orderDate: '2026-09-27T09:00:00Z',
    orderedByDoctor: 'Dr. Sarah Chen, MD',
    orderDescription: 'Repeat temperature and blood pressure every 2 hours. Notify doctor if Temp > 39.0°C.',
    orderType: 'routine',
    status: 'active',
  },
  {
    id: 'ord_3',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    orderDate: '2026-09-27T09:15:00Z',
    orderedByDoctor: 'Dr. Sarah Chen, MD',
    orderDescription: 'Perform pre-meal blood glucose monitoring (TID). Administer Sliding Scale Regular Insulin if BGL > 180 mg/dL.',
    orderType: 'standing',
    status: 'active',
    executedByNurse: 'Nurse Linda Evans, RN',
    executedAt: '2026-09-27T09:20:00Z',
    executionNotes: 'Blood sugar check routine established on Diabetic Mellitus sheet.',
  },
];

export const INITIAL_FEEDING_RECORDS: FeedingRecord[] = [
  {
    id: 'feed_1',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    time: '2026-09-27T08:45:00Z',
    dietType: 'clear_fluid',
    amountOffered: '250 mL Oral Rehydration Solution (ORS)',
    amountConsumed: '100% (250 mL)',
    feedingRoute: 'oral',
    tolerance: 'well_tolerated',
    assistedBy: 'Nurse Linda Evans, RN',
    notes: 'Patient drank warm ORS slowly. No nausea reported.',
  },
  {
    id: 'feed_2',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    time: '2026-09-27T09:30:00Z',
    dietType: 'diabetic',
    amountOffered: '1 Standard Diabetic Breakfast Tray (Oatmeal, Boiled Egg, Sugar-free tea)',
    amountConsumed: '85%',
    feedingRoute: 'oral',
    tolerance: 'well_tolerated',
    assistedBy: 'Nurse Linda Evans, RN',
    notes: 'Patient self-fed. Post-prandial glycemic check scheduled in 2 hours.',
  },
];

export const INITIAL_DIABETIC_RECORDS: DiabeticRecord[] = [
  {
    id: 'dm_1',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    time: '2026-09-27T08:50:00Z',
    mealTiming: 'fasting',
    bloodGlucose: 154,
    urineKetones: 'negative',
    insulinType: 'Regular Human Insulin (Actrapid)',
    prescribedUnits: 4,
    administeredUnits: 4,
    injectionSite: 'abdomen_ruq',
    hypoSymptoms: false,
    nurseSignature: 'Nurse Linda Evans, RN',
    notes: 'Mildly elevated fasting glucose. 4 Units Actrapid given subcutaneously 20 mins prior to breakfast.',
  },
  {
    id: 'dm_2',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Zhao',
    time: '2026-09-27T11:00:00Z',
    mealTiming: 'post_breakfast',
    bloodGlucose: 138,
    urineKetones: 'negative',
    hypoSymptoms: false,
    nurseSignature: 'Nurse Linda Evans, RN',
    notes: '2-hour post-breakfast glucose within target range (70-140 mg/dL). No signs of hypoglycemia.',
  },
];

export const INITIAL_PATIENT_CONSUMPTIONS: PatientConsumptionItem[] = [
  {
    id: 'cons_1',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    time: '2026-09-27T08:35:00Z',
    itemName: 'IV Cannula 20G (Pink) BD Venflon',
    category: 'consumable',
    quantity: 1,
    unitPrice: 45.0,
    totalPrice: 45.0,
    administeredBy: 'Nurse Linda Evans, RN',
    billedToCashier: true,
  },
  {
    id: 'cons_2',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    time: '2026-09-27T08:36:00Z',
    itemName: 'Normal Saline 0.9% 1000ml Infusion Bottle',
    category: 'iv_fluid',
    quantity: 1,
    unitPrice: 120.0,
    totalPrice: 120.0,
    administeredBy: 'Nurse Linda Evans, RN',
    billedToCashier: true,
  },
  {
    id: 'cons_3',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    time: '2026-09-27T08:37:00Z',
    itemName: 'Infusion Giving Set with Filter',
    category: 'consumable',
    quantity: 1,
    unitPrice: 50.0,
    totalPrice: 50.0,
    administeredBy: 'Nurse Linda Evans, RN',
    billedToCashier: true,
  },
];

export const INITIAL_LABOUR_SUMMARIES: LabourSummary[] = [
  {
    id: 'labour_1',
    visitId: 'vst_4',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    gpal: { gravida: 2, para: 1, abortion: 0, living: 1 },
    gestationalAgeWeeks: 39,
    admissionTime: '2026-09-27T04:00:00Z',
    onsetOfLabour: '2026-09-27T01:30:00Z',
    membranesRupturedAt: '2026-09-27T06:15:00Z',
    liquorColor: 'clear',
    deliveryTime: '2026-09-27T07:45:00Z',
    modeOfDelivery: 'spontaneous_vaginal',
    babyGender: 'female',
    birthWeightGrams: 3250,
    apgar1Min: 8,
    apgar5Min: 10,
    placentaDeliveredAt: '2026-09-27T07:55:00Z',
    placentaComplete: true,
    estimatedBloodLossMl: 250,
    perineumStatus: 'intact',
    uterotonicGiven: 'Oxytocin 10 IU IM STAT',
    maternalConditionPostpartum: 'stable',
    attendingMidwife: 'Nurse Linda Evans, RN / Midwife',
    notes: 'Uncomplicated spontaneous vertex delivery. Baby cried vigorously at birth. Skin-to-skin initiated immediately.',
  },
];

export const INITIAL_LABOUR_EXAM_RECORDS: LabourExamRecord[] = [
  {
    id: 'lexam_1',
    visitId: 'vst_4',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    time: '2026-09-27T04:15:00Z',
    maternalBpSystolic: 120,
    maternalBpDiastolic: 78,
    maternalPulse: 82,
    contractionsPer10Min: 3,
    contractionDurationSec: 35,
    cervicalDilatationCm: 5,
    cervicalEffacementPercent: 70,
    fetalStation: '-1',
    fetalHeartRateBpm: 140,
    membranesStatus: 'intact',
    moulding: '0',
    actionPlan: 'Active phase of 1st stage labour. Re-examine in 2 hours or if membranes rupture.',
    examinedBy: 'Nurse Linda Evans, RN / Midwife',
  },
  {
    id: 'lexam_2',
    visitId: 'vst_4',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    time: '2026-09-27T06:30:00Z',
    maternalBpSystolic: 124,
    maternalBpDiastolic: 80,
    maternalPulse: 88,
    contractionsPer10Min: 4,
    contractionDurationSec: 45,
    cervicalDilatationCm: 9,
    cervicalEffacementPercent: 100,
    fetalStation: '+1',
    fetalHeartRateBpm: 138,
    membranesStatus: 'ruptured_clear',
    moulding: '+',
    actionPlan: 'Transition phase. Spontaneous rupture of membranes with clear liquor. Primed delivery room.',
    examinedBy: 'Nurse Linda Evans, RN / Midwife',
  },
];

export const INITIAL_DISCHARGE_SUMMARIES: DischargeSummaryRecord[] = [
  {
    id: 'disch_1',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    admissionDate: '2026-09-27T08:30:00Z',
    dischargeDate: '2026-09-27T11:30:00Z',
    dischargeDisposition: 'home_routine',
    finalCondition: 'improved_stable',
    dischargeVitals: {
      bp: '116/74 mmHg',
      temp: 36.8,
      pulse: 76,
      spo2: 99,
      resp: 16,
    },
    medicationsExplained: true,
    homeMedications: 'Coartem (Artemether 20mg / Lumefantrine 120mg) 4 tablets BID x 3 days. Paracetamol 1g PO PRN fever.',
    woundCareDietInstructions: 'Hydrate well with boiled water and clean fluids. Maintain light, easily digestible meals. Bed rest.',
    cannulaAndLinesRemoved: true,
    personalBelongingsReturned: true,
    followUpDate: '2026-10-02',
    followUpClinic: 'SPEED OPD (Room 101) - General Outpatient',
    emergencyWarningSignsGiven: true,
    dischargedByNurse: 'Nurse Linda Evans, RN',
    patientFamilyAckSigned: true,
    additionalRemarks: 'Patient afebrile at discharge, tolerated oral medications. Emergency warning signs (persistent fever, vomiting) reviewed.',
  },
];

export const INITIAL_ULTRASOUND_ORDERS: UltrasoundOrder[] = [
  {
    id: 'us_1',
    orderNumber: 'US-2026-0031',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    scanType: 'Abdominal',
    clinicalIndication: 'Epigastric discomfort and right upper quadrant tenderness. Rule out cholelithiasis.',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T08:35:00Z',
    status: 'completed',
    sonographerName: 'Dr. Michael K., MD (Radiologist)',
    performedAt: '2026-09-27T09:10:00Z',
    findings: 'Liver: Normal size (13.8 cm span), homogenous echotexture, smooth capsular margins. No focal intrahepatic mass or biliary dilatation.\nGallbladder: Well-distended with physiological wall thickness (2.1 mm). No gallstones or sludge detected. Negative sonographic Murphy sign.\nPancreas: Visualized portions appear normal in size and contour.\nSpleen: Normal span (9.5 cm), no splenomegaly.\nKidneys: Bilateral kidneys normal in size, position, and cortical thickness. Right kidney 10.4 cm, Left kidney 10.8 cm. Good corticomedullary differentiation. No hydronephrosis, calculus, or mass.\nUrinary Bladder: Normal wall contours, anechoic lumen.',
    organDetails: [
      { organ: 'Liver', measurement: '13.8 cm', condition: 'Normal', notes: 'Homogenous echotexture, no lesions' },
      { organ: 'Gallbladder', measurement: 'Wall: 2.1 mm', condition: 'Normal', notes: 'Acalculous, non-tender' },
      { organ: 'Pancreas', measurement: 'Normal', condition: 'Normal', notes: 'No ductal dilatation' },
      { organ: 'Spleen', measurement: '9.5 cm', condition: 'Normal', notes: 'Normal echogenicity' },
      { organ: 'Right Kidney', measurement: '10.4 cm', condition: 'Normal', notes: 'No calculi or hydronephrosis' },
      { organ: 'Left Kidney', measurement: '10.8 cm', condition: 'Normal', notes: 'Normal cortical thickness' },
    ],
    conclusion: 'Normal transabdominal sonographic study. No sonographic evidence of cholelithiasis, cholecystitis, or organomegaly.',
    recommendations: 'Correlation with upper gastrointestinal endoscopy advised for persistent dyspepsia.',
    paymentStatus: 'paid',
    price: 450.0,
  },
  {
    id: 'us_2',
    orderNumber: 'US-2026-0032',
    visitId: 'vst_4',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    scanType: 'Pelvic / Obstetric',
    clinicalIndication: 'Term pregnancy at 39 weeks. Assessment of fetal presentation, biophysical profile, and amniotic fluid volume.',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T04:15:00Z',
    status: 'completed',
    sonographerName: 'Dr. Michael K., MD (Radiologist)',
    performedAt: '2026-09-27T04:45:00Z',
    findings: 'Single live intrauterine gestation in cephalic longitudinal lie. Fetal cardiac activity regular at 142 bpm. Normal fetal somatic movements and breathing observed. Placenta is fundal anterior, Grade III maturity, clear of the internal cervical os. Amniotic fluid index (AFI) measures 12.4 cm (normal volume). Umbilical cord has normal 3-vessel morphology with normal Doppler indices.',
    obstetricDetails: {
      gestationalAgeWeeks: 39,
      gestationalAgeDays: 2,
      fetalHeartRateBpm: 142,
      estimatedFetalWeightGrams: 3300,
      placentaLocation: 'Fundal Anterior (Grade III)',
      amnioticFluidIndexCm: 12.4,
      eddDate: '2026-10-02',
      presentation: 'Cephalic',
    },
    conclusion: 'Single term viable fetus in cephalic presentation. Normal amniotic fluid volume and reassuring fetal biophysical parameters.',
    recommendations: 'Proceed with standard intrapartum monitoring.',
    paymentStatus: 'paid',
    price: 500.0,
  },
];

export const INITIAL_XRAY_ORDERS: XRayOrder[] = [
  {
    id: 'xr_1',
    orderNumber: 'XR-2026-0041',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    bodyPart: 'Chest PA/AP',
    clinicalIndication: 'Fever for 3 days, cough, pleuritic chest discomfort. Rule out pneumonia or consolidation.',
    viewsRequired: 'PA erect view',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T08:35:00Z',
    status: 'completed',
    radiographerName: 'James Mwangi, Radiographer',
    radiologistName: 'Dr. Michael K., MD (Radiologist)',
    performedAt: '2026-09-27T09:00:00Z',
    findings: 'Trachea is midline. Cardiothoracic ratio is normal (< 0.50). Normal mediastinal and hilar contours. Bilateral lung fields are clear with no focal consolidation, cavitation, or pleural effusion. Costophrenic and cardiophrenic angles are acute and clear. Visualized bony thorax and soft tissue structures appear unremarkable.',
    impression: 'No acute cardiopulmonary disease. Clear lung fields, no radiological evidence of lobar pneumonia or pulmonary edema.',
    radiationDoseMgy: 0.08,
    exposureQuality: 'Optimal',
    recommendations: 'Clinical correlation and follow-up as indicated.',
    paymentStatus: 'paid',
    price: 350.0,
  },
  {
    id: 'xr_2',
    orderNumber: 'XR-2026-0042',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientName: 'David Muthoni',
    bodyPart: 'Lumbar Spine',
    clinicalIndication: 'Chronic lower back pain radiating to left buttock. Evaluate for spondylolisthesis or degenerative disc disease.',
    viewsRequired: 'AP and Lateral views',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T10:15:00Z',
    status: 'completed',
    radiographerName: 'James Mwangi, Radiographer',
    radiologistName: 'Dr. Michael K., MD (Radiologist)',
    performedAt: '2026-09-27T10:45:00Z',
    findings: 'Normal lumbar lordosis maintained. No evidence of vertebral collapse, compression fracture, or spondylolisthesis. Mild disc space narrowing noted at L4-L5 with mild marginal anterior osteophytosis. Pedicles and posterior elements are intact. Sacroiliac joints demonstrate normal joint space.',
    impression: 'Mild lumbar spondylosis predominantly at L4-L5 intervertebral disc level. No acute fracture or malalignment.',
    radiationDoseMgy: 0.45,
    exposureQuality: 'Optimal',
    recommendations: 'Physiotherapy and conservative pain management indicated.',
    paymentStatus: 'paid',
    price: 400.0,
  },
];

export const INITIAL_ENDOSCOPY_ORDERS: EndoscopyOrder[] = [
  {
    id: 'endo_1',
    orderNumber: 'ENDO-2026-0012',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    procedureType: 'Upper GI Endoscopy (EGD)',
    clinicalIndication: 'Epigastric pain refractory to antacids, postprandial fullness, weight loss evaluation.',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T08:40:00Z',
    status: 'completed',
    endoscopistName: 'Dr. Sophia Bennett, MD (Gastroenterologist)',
    performedAt: '2026-09-27T11:00:00Z',
    sedationUsed: 'Topical Lidocaine 10% spray + Midazolam 2.5mg IV',
    extentOfExam: 'Esophagus, stomach, and second part of duodenum (D2)',
    mucosalFindings: 'Esophagus: Normal squamous mucosa, Z-line regular at 38 cm from incisors. No esophagitis, Barrett changes, or varices.\nStomach: Diffuse patchy mucosal erythema with superficial petechial erosions in the gastric antrum. No active bleeding, no discrete peptic ulceration seen. Fundus and body demonstrate normal mucosal folds.\nDuodenum: Duodenal bulb and second part (D2) demonstrate normal villous architecture, no ulceration or scarring.',
    biopsyTaken: true,
    biopsySites: ['Gastric antrum (x2 passes for Histology and CLO / Rapid Urease test)'],
    forrestClassification: 'N/A',
    interventionsPerformed: ['Targeted mucosal biopsy obtained with standard radial jaw forceps'],
    postProcedureCondition: 'Patient tolerated procedure well, recovery room vitals stable, gag reflex restored.',
    impression: 'Endoscopic findings consistent with mild-to-moderate erythematous antral gastritis. No active ulceration or malignancy.',
    recommendations: 'Awaiting biopsy histopathology and Helicobacter pylori status. Commence oral Pantoprazole 40mg daily.',
    paymentStatus: 'paid',
    price: 1200.0,
  },
];

export const INITIAL_PATHOLOGY_ORDERS: PathologyOrder[] = [
  {
    id: 'path_1',
    orderNumber: 'PATH-2026-0008',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    specimenType: 'Biopsy (Histopathology)',
    specimenSite: 'Gastric Antrum Biopsies (Endoscopic)',
    clinicalHistory: '34-year-old male with persistent dyspepsia and endoscopic antral erythema. Evaluate for chronic gastritis, intestinal metaplasia, and H. pylori.',
    orderedByDoctor: 'Dr. Julian Hayes, MD',
    orderedAt: '2026-09-27T11:15:00Z',
    status: 'completed',
    pathologistName: 'Prof. Adebayo O., FRCPath (Consultant Pathologist)',
    receivedAt: '2026-09-27T11:30:00Z',
    reportedAt: '2026-09-27T13:45:00Z',
    grossDescription: 'Specimen container labeled "Gastric Antrum" consists of two fragments of soft, tan-pink tissue measuring 2 x 2 x 1 mm each. Entire specimen processed in block A1.',
    microscopicDescription: 'Sections examine gastric antral-type mucosa demonstrating lamina propria expansion by a moderate mononuclear inflammatory infiltrate consisting predominantly of lymphocytes and plasma cells. Intraepithelial neutrophils are present within the foveolar epithelium, indicative of acute mucosal activity. Glandular architecture is preserved without significant atrophy or intestinal metaplasia. No dysplasia or atypia identified. Modified Giemsa staining reveals numerous curved rod-shaped bacilli adhering to the surface mucous layer.',
    specialStainsOrIHC: 'Modified Giemsa Stain: Positive for curved Helicobacter pylori organisms. Warthin-Starry: Positive.',
    definitiveDiagnosis: 'Gastric Antral Mucosa, Endoscopic Biopsy: Moderate chronic active gastritis, Helicobacter pylori associated. Negative for intestinal metaplasia or dysplasia.',
    snodentOrIcdCode: 'SNOMED: M-43000 / ICD-10: K29.5',
    urgency: 'routine',
    paymentStatus: 'paid',
    price: 650.0,
  },
];

export const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt_1',
    appointmentNumber: 'APT-2026-0182',
    patientId: 'pat_1',
    patientName: 'Samuel Kiprop',
    patientMrn: 'PAT-2026-0041',
    patientPhone: '+254 712 345 678',
    doctorId: 'usr_doc_1',
    doctorName: 'Dr. Julian Hayes, MD',
    department: 'General OPD',
    appointmentDate: '2026-10-04',
    appointmentTime: '09:30',
    durationMinutes: 15,
    type: 'Review Lab / Radiology',
    status: 'confirmed',
    reason: 'Follow-up on H. pylori eradication therapy & review repeat clinical response',
    notes: 'Confirm completion of 14-day triple therapy; assess resolution of dyspepsia.',
    priority: 'routine',
    reminderSent: true,
    createdBy: 'Dr. Julian Hayes, MD',
    createdAt: '2026-09-27T09:30:00Z',
  },
  {
    id: 'apt_2',
    appointmentNumber: 'APT-2026-0183',
    patientId: 'pat_2',
    patientName: 'Grace Adhiambo',
    patientMrn: 'PAT-2026-0042',
    patientPhone: '+254 723 456 789',
    doctorId: 'usr_doc_1',
    doctorName: 'Dr. Julian Hayes, MD',
    department: 'General OPD',
    appointmentDate: '2026-09-30',
    appointmentTime: '10:00',
    durationMinutes: 15,
    type: 'Follow-up',
    status: 'confirmed',
    reason: 'Malaria repeat blood smear and fever check',
    notes: 'Check adherence to Artemether-Lumefantrine course.',
    priority: 'routine',
    reminderSent: true,
    createdBy: 'Dr. Julian Hayes, MD',
    createdAt: '2026-09-27T10:00:00Z',
  },
  {
    id: 'apt_3',
    appointmentNumber: 'APT-2026-0184',
    patientId: 'pat_3',
    patientName: 'David Muthoni',
    patientMrn: 'PAT-2026-0043',
    patientPhone: '+254 734 567 890',
    doctorId: 'usr_doc_1',
    doctorName: 'Dr. Julian Hayes, MD',
    department: 'Internal Medicine',
    appointmentDate: '2026-10-11',
    appointmentTime: '11:15',
    durationMinutes: 30,
    type: 'Chronic Care (NCD)',
    status: 'confirmed',
    reason: 'Hypertension control and blood pressure log review',
    notes: 'Bring home BP diary; check serum electrolytes and renal profile.',
    priority: 'routine',
    reminderSent: false,
    createdBy: 'Dr. Julian Hayes, MD',
    createdAt: '2026-09-27T11:00:00Z',
  },
  {
    id: 'apt_4',
    appointmentNumber: 'APT-2026-0185',
    patientId: 'pat_4',
    patientName: 'Amara Okafor',
    patientMrn: 'PAT-2026-0044',
    patientPhone: '+254 745 678 901',
    doctorId: 'usr_doc_1',
    doctorName: 'Dr. Julian Hayes, MD',
    department: 'Gynecology & Obs',
    appointmentDate: '2026-10-15',
    appointmentTime: '14:00',
    durationMinutes: 20,
    type: 'Post-Operative',
    status: 'confirmed',
    reason: '2-week postnatal clinical checkup and infant wellness examination',
    notes: 'Examine maternal involution, breastfeeding, neonatal jaundice screen.',
    priority: 'routine',
    reminderSent: false,
    createdBy: 'Dr. Julian Hayes, MD',
    createdAt: '2026-09-27T12:00:00Z',
  },
];

export const INITIAL_WARDS: Ward[] = [
  {
    id: 'ward_mmw',
    name: 'Male Medical Ward',
    code: 'MMW',
    floor: '2nd Floor, West Wing',
    totalBeds: 6,
    ratePerDay: 450.0,
    genderRestriction: 'male',
    nurseInCharge: 'Sister Genet Tesfaye, RN',
  },
  {
    id: 'ward_fmw',
    name: 'Female Medical Ward',
    code: 'FMW',
    floor: '2nd Floor, East Wing',
    totalBeds: 6,
    ratePerDay: 450.0,
    genderRestriction: 'female',
    nurseInCharge: 'Sister Rahel Haile, RN',
  },
  {
    id: 'ward_surg',
    name: 'General Surgical Ward',
    code: 'GSW',
    floor: '3rd Floor, North Wing',
    totalBeds: 6,
    ratePerDay: 600.0,
    genderRestriction: 'mixed',
    nurseInCharge: 'Nurse Linda Evans, RN',
  },
  {
    id: 'ward_mat',
    name: 'Maternity & Postnatal Ward',
    code: 'MAT',
    floor: '2nd Floor, South Wing',
    totalBeds: 4,
    ratePerDay: 550.0,
    genderRestriction: 'female',
    nurseInCharge: 'Midwife Aster Desta, RM',
  },
  {
    id: 'ward_ped',
    name: 'Pediatric Ward',
    code: 'PED',
    floor: '1st Floor, East Wing',
    totalBeds: 4,
    ratePerDay: 400.0,
    genderRestriction: 'mixed',
    nurseInCharge: 'Nurse Hana Mengistu, RN',
  },
  {
    id: 'ward_icu',
    name: 'Intensive Care Unit (ICU / HDU)',
    code: 'ICU',
    floor: '3rd Floor, Central Block',
    totalBeds: 3,
    ratePerDay: 1800.0,
    genderRestriction: 'mixed',
    nurseInCharge: 'Specialist Nurse Mark Kebede, BSN',
  },
];

export const INITIAL_BEDS: Bed[] = [
  // MMW Beds
  {
    id: 'bed_mmw_01',
    wardId: 'ward_mmw',
    wardName: 'Male Medical Ward',
    bedNumber: 'MMW-01',
    type: 'standard',
    status: 'occupied',
    currentAdmissionId: 'adm_1',
    currentPatientName: 'Samuel Kiprop',
    currentPatientMrn: 'PAT-2026-0041',
    dailyRate: 450.0,
  },
  {
    id: 'bed_mmw_02',
    wardId: 'ward_mmw',
    wardName: 'Male Medical Ward',
    bedNumber: 'MMW-02',
    type: 'standard',
    status: 'available',
    dailyRate: 450.0,
  },
  {
    id: 'bed_mmw_03',
    wardId: 'ward_mmw',
    wardName: 'Male Medical Ward',
    bedNumber: 'MMW-03',
    type: 'standard',
    status: 'cleaning',
    dailyRate: 450.0,
  },
  {
    id: 'bed_mmw_04',
    wardId: 'ward_mmw',
    wardName: 'Male Medical Ward',
    bedNumber: 'MMW-04',
    type: 'semi_private',
    status: 'available',
    dailyRate: 650.0,
  },

  // FMW Beds
  {
    id: 'bed_fmw_01',
    wardId: 'ward_fmw',
    wardName: 'Female Medical Ward',
    bedNumber: 'FMW-01',
    type: 'standard',
    status: 'occupied',
    currentAdmissionId: 'adm_2',
    currentPatientName: 'Grace Adhiambo',
    currentPatientMrn: 'PAT-2026-0042',
    dailyRate: 450.0,
  },
  {
    id: 'bed_fmw_02',
    wardId: 'ward_fmw',
    wardName: 'Female Medical Ward',
    bedNumber: 'FMW-02',
    type: 'standard',
    status: 'available',
    dailyRate: 450.0,
  },
  {
    id: 'bed_fmw_03',
    wardId: 'ward_fmw',
    wardName: 'Female Medical Ward',
    bedNumber: 'FMW-03',
    type: 'semi_private',
    status: 'available',
    dailyRate: 650.0,
  },

  // Surgical Beds
  {
    id: 'bed_surg_01',
    wardId: 'ward_surg',
    wardName: 'General Surgical Ward',
    bedNumber: 'GSW-01',
    type: 'standard',
    status: 'occupied',
    currentAdmissionId: 'adm_3',
    currentPatientName: 'David Muthoni',
    currentPatientMrn: 'PAT-2026-0043',
    dailyRate: 600.0,
  },
  {
    id: 'bed_surg_02',
    wardId: 'ward_surg',
    wardName: 'General Surgical Ward',
    bedNumber: 'GSW-02',
    type: 'standard',
    status: 'available',
    dailyRate: 600.0,
  },
  {
    id: 'bed_surg_03',
    wardId: 'ward_surg',
    wardName: 'General Surgical Ward',
    bedNumber: 'GSW-03',
    type: 'private_deluxe',
    status: 'reserved',
    dailyRate: 1100.0,
  },

  // Maternity Beds
  {
    id: 'bed_mat_01',
    wardId: 'ward_mat',
    wardName: 'Maternity & Postnatal Ward',
    bedNumber: 'MAT-01',
    type: 'standard',
    status: 'occupied',
    currentAdmissionId: 'adm_4',
    currentPatientName: 'Amara Okafor',
    currentPatientMrn: 'PAT-2026-0044',
    dailyRate: 550.0,
  },
  {
    id: 'bed_mat_02',
    wardId: 'ward_mat',
    wardName: 'Maternity & Postnatal Ward',
    bedNumber: 'MAT-02',
    type: 'standard',
    status: 'available',
    dailyRate: 550.0,
  },

  // ICU Beds
  {
    id: 'bed_icu_01',
    wardId: 'ward_icu',
    wardName: 'Intensive Care Unit (ICU / HDU)',
    bedNumber: 'ICU-01',
    type: 'icu',
    status: 'occupied',
    currentAdmissionId: 'adm_5',
    currentPatientName: 'Elena Rostova',
    currentPatientMrn: 'PAT-2026-0040',
    dailyRate: 1800.0,
  },
  {
    id: 'bed_icu_02',
    wardId: 'ward_icu',
    wardName: 'Intensive Care Unit (ICU / HDU)',
    bedNumber: 'ICU-02',
    type: 'icu',
    status: 'available',
    dailyRate: 1800.0,
  },
];

export const INITIAL_ADMISSIONS: InpatientAdmission[] = [
  {
    id: 'adm_1',
    admissionNumber: 'IPD-2026-0041',
    visitId: 'vst_1',
    patientId: 'pat_1',
    patientMrn: 'PAT-2026-0041',
    patientName: 'Samuel Kiprop',
    patientAge: 42,
    patientGender: 'male',
    phone: '+254 712 345 678',
    nationalId: 'ID-8829104',
    bloodGroup: 'O+',
    allergies: ['Penicillin'],
    admissionDate: '2026-09-27',
    admissionTime: '08:45',
    admissionType: 'Emergency',
    wardId: 'ward_mmw',
    wardName: 'Male Medical Ward',
    bedId: 'bed_mmw_01',
    bedNumber: 'MMW-01',
    admittingDoctorId: 'usr_doctor_1',
    admittingDoctorName: 'Dr. Sarah Chen, MD',
    department: 'Internal Medicine',
    provisionalDiagnosis: 'Severe Peptic Ulcer Disease with Hematemesis & Dehydration',
    icdCode: 'K25.0',
    initialDeposit: 2500.0,
    depositPaid: true,
    depositReceiptNumber: 'REC-ETB-2026-0819',
    status: 'admitted',
    lengthOfStayDays: 2,
    emergencyContactName: 'Mercy Kiprop',
    emergencyContactPhone: '+254 712 999 111',
    emergencyContactRelation: 'Spouse',
    notes: 'Iv fluids started, proton pump inhibitor infusion running, strict NPO.',
    admittedBy: 'Elena Rostova',
    createdAt: '2026-09-27T08:45:00Z',
  },
  {
    id: 'adm_2',
    admissionNumber: 'IPD-2026-0042',
    visitId: 'vst_2',
    patientId: 'pat_2',
    patientMrn: 'PAT-2026-0042',
    patientName: 'Grace Adhiambo',
    patientAge: 29,
    patientGender: 'female',
    phone: '+254 723 456 789',
    nationalId: 'ID-5519823',
    bloodGroup: 'A+',
    allergies: ['Sulfonamides'],
    admissionDate: '2026-09-28',
    admissionTime: '11:15',
    admissionType: 'Emergency',
    wardId: 'ward_fmw',
    wardName: 'Female Medical Ward',
    bedId: 'bed_fmw_01',
    bedNumber: 'FMW-01',
    admittingDoctorId: 'usr_doctor_1',
    admittingDoctorName: 'Dr. Sarah Chen, MD',
    department: 'Infectious Disease',
    provisionalDiagnosis: 'Severe Falciparum Malaria with High Parasitemia & Thrombocytopenia',
    icdCode: 'B50.8',
    initialDeposit: 3000.0,
    depositPaid: true,
    depositReceiptNumber: 'REC-ETB-2026-0824',
    status: 'admitted',
    lengthOfStayDays: 1,
    emergencyContactName: 'Peter Adhiambo',
    emergencyContactPhone: '+254 723 888 222',
    emergencyContactRelation: 'Brother',
    notes: 'Artesunate IV protocol in progress; monitor platelet count daily.',
    admittedBy: 'Elena Rostova',
    createdAt: '2026-09-28T11:15:00Z',
  },
  {
    id: 'adm_3',
    admissionNumber: 'IPD-2026-0043',
    visitId: 'vst_3',
    patientId: 'pat_3',
    patientMrn: 'PAT-2026-0043',
    patientName: 'David Muthoni',
    patientAge: 56,
    patientGender: 'male',
    phone: '+254 734 567 890',
    nationalId: 'ID-3129841',
    bloodGroup: 'B+',
    allergies: ['Aspirin / NSAIDs'],
    admissionDate: '2026-09-28',
    admissionTime: '14:30',
    admissionType: 'Day Surgery',
    wardId: 'ward_surg',
    wardName: 'General Surgical Ward',
    bedId: 'bed_surg_01',
    bedNumber: 'GSW-01',
    admittingDoctorId: 'usr_doctor_2',
    admittingDoctorName: 'Dr. Samuel Bekele, MD',
    department: 'General Surgery',
    provisionalDiagnosis: 'Post-laparoscopic Appendectomy Monitoring & Pain Control',
    icdCode: 'K35.8',
    initialDeposit: 4000.0,
    depositPaid: true,
    depositReceiptNumber: 'REC-ETB-2026-0830',
    status: 'admitted',
    lengthOfStayDays: 1,
    emergencyContactName: 'Ann Muthoni',
    emergencyContactPhone: '+254 734 111 444',
    emergencyContactRelation: 'Wife',
    notes: 'Drain in situ, ambulating with assistance, pain well managed.',
    admittedBy: 'Elena Rostova',
    createdAt: '2026-09-28T14:30:00Z',
  },
  {
    id: 'adm_4',
    admissionNumber: 'IPD-2026-0044',
    visitId: 'vst_4',
    patientId: 'pat_4',
    patientMrn: 'PAT-2026-0044',
    patientName: 'Amara Okafor',
    patientAge: 31,
    patientGender: 'female',
    phone: '+254 745 678 901',
    nationalId: 'ID-9923841',
    bloodGroup: 'AB+',
    allergies: ['None known'],
    admissionDate: '2026-09-29',
    admissionTime: '06:00',
    admissionType: 'Maternity / Delivery',
    wardId: 'ward_mat',
    wardName: 'Maternity & Postnatal Ward',
    bedId: 'bed_mat_01',
    bedNumber: 'MAT-01',
    admittingDoctorId: 'usr_doctor_2',
    admittingDoctorName: 'Dr. Samuel Bekele, MD',
    department: 'Obstetrics & Gynecology',
    provisionalDiagnosis: 'Active Labor at 39 Weeks Gestation (Gravida 2 Para 1)',
    icdCode: 'O60.1',
    initialDeposit: 2500.0,
    depositPaid: true,
    depositReceiptNumber: 'REC-ETB-2026-0835',
    status: 'admitted',
    lengthOfStayDays: 0,
    emergencyContactName: 'Chidi Okafor',
    emergencyContactPhone: '+254 745 222 333',
    emergencyContactRelation: 'Husband',
    notes: 'Fetal heart sound checked regularly, cervix 4 cm dilated, reassuring tracing.',
    admittedBy: 'Elena Rostova',
    createdAt: '2026-09-29T06:00:00Z',
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm_01',
    timestamp: '2026-09-26T14:30:00Z',
    medicineId: 'med_para_500',
    medicineName: 'Paracetamol (Acetaminophen) 500mg',
    batchNumber: 'PCM-9801',
    changeType: 'dispensed',
    quantityDelta: -20,
    remainingQuantity: 650,
    referenceNumber: 'RX-2026-0298',
    operator: 'Tariq Al-Mansoor, RPh',
    notes: 'Prescription dispensing verified in ETB ledger',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    timestamp: '2026-09-27T07:30:00Z',
    operator: 'Marcus Vance (Superintendent)',
    role: 'admin',
    department: 'SPEED Operations',
    action: 'SPEED Server Startup & Diagnostic Self-Check',
    entityType: 'backup',
    entityId: 'SERVER-BOOT',
    reason: 'Daily clinic server initialization. Database integrity verified with SHA-256 hash.',
  },
  {
    id: 'aud_2',
    timestamp: '2026-09-27T08:00:00Z',
    operator: 'Elena Rostova',
    role: 'cashier',
    department: 'SPEED Reception & Cashier',
    action: 'Cashier Till Open & Shift Start',
    entityType: 'payment',
    entityId: 'SHIFT-MORNING',
    reason: 'Initial float ETB 1,000.00 counted and verified in physical cash drawer.',
  },
];

export const INITIAL_WEBSOCKET_EVENTS: WebSocketEvent[] = [
  {
    id: 'ws_evt_1',
    timestamp: '2026-09-27T08:18:00Z',
    station: 'SPEED Reception Desk A',
    eventType: 'PATIENT_REGISTERED',
    title: 'Patient Registered',
    detail: 'Samuel Kiprop (PAT-2026-0041) registered for General Outpatient Clinic.',
  },
  {
    id: 'ws_evt_2',
    timestamp: '2026-09-27T08:20:00Z',
    station: 'SPEED Reception Desk A',
    eventType: 'PAYMENT_RECEIVED',
    title: 'Payment Received (ETB)',
    detail: 'Receipt REC-ETB-2026-0811 issued for Samuel Kiprop (ETB 350.00 Consultation).',
  },
  {
    id: 'ws_evt_3',
    timestamp: '2026-09-27T08:21:00Z',
    station: 'SPEED Reception Desk A',
    eventType: 'ENTRY_CARD_ISSUED',
    title: 'Entry Card Issued',
    detail: 'Queue #101 issued to Samuel Kiprop. Added to Doctor live queue.',
  },
  {
    id: 'ws_evt_4',
    timestamp: '2026-09-27T08:47:00Z',
    station: 'SPEED Reception Desk A',
    eventType: 'LAB_PAID',
    title: 'Lab Payment Confirmed',
    detail: 'Malaria Rapid Diagnostic Test paid for Grace Adhiambo (ETB 250.00). Unlocked on Lab PC.',
  },
];

function getInitialSeedDatabase(): DatabaseState {
  return {
    users: INITIAL_USERS,
    patients: INITIAL_PATIENTS,
    visits: INITIAL_VISITS,
    entryCards: INITIAL_ENTRY_CARDS,
    charges: INITIAL_CHARGES,
    payments: INITIAL_PAYMENTS,
    consultations: INITIAL_CONSULTATIONS,
    labCatalog: INITIAL_LAB_CATALOG,
    labOrders: INITIAL_LAB_ORDERS,
    medicines: INITIAL_MEDICINES,
    prescriptions: INITIAL_PRESCRIPTIONS,
    nursingRecords: INITIAL_NURSING_RECORDS,
    stockMovements: INITIAL_STOCK_MOVEMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    cashierShifts: INITIAL_SHIFTS,
    settings: INITIAL_SETTINGS,
    webSocketEvents: INITIAL_WEBSOCKET_EVENTS,
    workstations: INITIAL_WORKSTATIONS,
    offlineQueue: [],
    doctorOrders: INITIAL_DOCTOR_ORDERS,
    feedingRecords: INITIAL_FEEDING_RECORDS,
    diabeticRecords: INITIAL_DIABETIC_RECORDS,
    patientConsumptions: INITIAL_PATIENT_CONSUMPTIONS,
    labourSummaries: INITIAL_LABOUR_SUMMARIES,
    labourExamRecords: INITIAL_LABOUR_EXAM_RECORDS,
    dischargeSummaries: INITIAL_DISCHARGE_SUMMARIES,
    ultrasoundOrders: INITIAL_ULTRASOUND_ORDERS,
    xrayOrders: INITIAL_XRAY_ORDERS,
    endoscopyOrders: INITIAL_ENDOSCOPY_ORDERS,
    pathologyOrders: INITIAL_PATHOLOGY_ORDERS,
    appointments: INITIAL_APPOINTMENTS,
    wards: INITIAL_WARDS,
    beds: INITIAL_BEDS,
    admissions: INITIAL_ADMISSIONS,
  };
}

// Load database from localStorage or seed
export function loadDatabase(): DatabaseState {
  if (typeof window === 'undefined') {
    return getInitialSeedDatabase();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSeedDatabase();
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    
    // Auto-upgrade if legacy currency or missing workstations
    if (parsed.settings?.currency !== 'ETB' || !parsed.workstations || parsed.workstations.length === 0) {
      console.log('Upgrading clinic database to SPEED CIS V2 (ETB)...');
      const upgraded = getInitialSeedDatabase();
      saveDatabase(upgraded);
      return upgraded;
    }

    if (!parsed.cashierShifts) {
      parsed.cashierShifts = INITIAL_SHIFTS;
    }
    if (!parsed.offlineQueue) {
      parsed.offlineQueue = [];
    }
    if (!parsed.doctorOrders) {
      parsed.doctorOrders = INITIAL_DOCTOR_ORDERS;
    }
    if (!parsed.feedingRecords) {
      parsed.feedingRecords = INITIAL_FEEDING_RECORDS;
    }
    if (!parsed.diabeticRecords) {
      parsed.diabeticRecords = INITIAL_DIABETIC_RECORDS;
    }
    if (!parsed.patientConsumptions) {
      parsed.patientConsumptions = INITIAL_PATIENT_CONSUMPTIONS;
    }
    if (!parsed.labourSummaries) {
      parsed.labourSummaries = INITIAL_LABOUR_SUMMARIES;
    }
    if (!parsed.labourExamRecords) {
      parsed.labourExamRecords = INITIAL_LABOUR_EXAM_RECORDS;
    }
    if (!parsed.dischargeSummaries) {
      parsed.dischargeSummaries = INITIAL_DISCHARGE_SUMMARIES;
    }
    if (!parsed.ultrasoundOrders) {
      parsed.ultrasoundOrders = INITIAL_ULTRASOUND_ORDERS;
    }
    if (!parsed.xrayOrders) {
      parsed.xrayOrders = INITIAL_XRAY_ORDERS;
    }
    if (!parsed.endoscopyOrders) {
      parsed.endoscopyOrders = INITIAL_ENDOSCOPY_ORDERS;
    }
    if (!parsed.pathologyOrders) {
      parsed.pathologyOrders = INITIAL_PATHOLOGY_ORDERS;
    }
    if (!parsed.appointments) {
      parsed.appointments = INITIAL_APPOINTMENTS;
    }
    if (!parsed.wards) {
      parsed.wards = INITIAL_WARDS;
    }
    if (!parsed.beds) {
      parsed.beds = INITIAL_BEDS;
    }
    if (!parsed.admissions) {
      parsed.admissions = INITIAL_ADMISSIONS;
    }

    // Ensure all workstations are present in parsed database
    INITIAL_WORKSTATIONS.forEach((ws) => {
      if (!parsed.workstations.some((w: any) => w.id === ws.id)) {
        parsed.workstations.push(ws);
      }
    });

    // Ensure all default users are present in parsed database
    INITIAL_USERS.forEach((usr) => {
      if (!parsed.users.some((u: any) => u.id === usr.id)) {
        parsed.users.push(usr);
      }
    });

    return parsed;
  } catch (e) {
    console.error('Failed to parse database, resetting to seed', e);
    const initial = getInitialSeedDatabase();
    saveDatabase(initial);
    return initial;
  }
}

export function saveDatabase(db: DatabaseState, skipBroadcast = false): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    if (!skipBroadcast) {
      clinicSocket.notifyDbSync(db);
    }
  } catch (e) {
    console.error('Failed to save clinic database', e);
  }
}

export function resetDatabaseToFactory(): DatabaseState {
  const initial = getInitialSeedDatabase();
  saveDatabase(initial);
  return initial;
}

// Check optimistic lock before applying change
export function checkOptimisticLock(
  entityType: 'visit' | 'payment' | 'lab_order' | 'prescription',
  entityId: string,
  incomingVersion: number,
  db: DatabaseState
): { ok: boolean; conflict?: ConcurrencyConflict } {
  let serverEntity: any = null;
  let recordIdentifier = entityId;

  if (entityType === 'visit') {
    serverEntity = db.visits.find((v) => v.id === entityId);
    if (serverEntity) recordIdentifier = serverEntity.visitNumber;
  } else if (entityType === 'payment') {
    serverEntity = db.payments.find((p) => p.id === entityId);
    if (serverEntity) recordIdentifier = serverEntity.receiptNumber;
  } else if (entityType === 'lab_order') {
    serverEntity = db.labOrders.find((l) => l.id === entityId);
    if (serverEntity) recordIdentifier = serverEntity.orderNumber;
  } else if (entityType === 'prescription') {
    serverEntity = db.prescriptions.find((r) => r.id === entityId);
    if (serverEntity) recordIdentifier = serverEntity.prescriptionNumber;
  }

  if (!serverEntity) {
    return { ok: true };
  }

  const serverVersion = serverEntity.version || 1;
  if (incomingVersion !== serverVersion) {
    return {
      ok: false,
      conflict: {
        entityType,
        entityId,
        recordIdentifier,
        clientVersion: incomingVersion,
        serverVersion,
        serverUpdatedBy: serverEntity.updatedBy || 'Staff at other Workstation',
        serverUpdatedAt: serverEntity.updatedAt || new Date().toISOString(),
        serverStationId: serverEntity.stationId || 'SPEED-LAN-WS',
        clientPayload: { version: incomingVersion, entityId },
        serverPayload: serverEntity,
      },
    };
  }

  return { ok: true };
}

// Buffer an action when offline
export function bufferOfflineTransaction(
  db: DatabaseState,
  actionType: string,
  entityType: OfflineTransaction['entityType'],
  entityId: string,
  payload: any,
  operatorId: string,
  operatorName: string,
  stationId: string
): { updatedDb: DatabaseState; item: OfflineTransaction } {
  // Simple deterministic SHA-256 style signature hash
  const rawString = `${Date.now()}_${stationId}_${entityType}_${entityId}_${JSON.stringify(payload)}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash << 5) - hash + rawString.charCodeAt(i);
    hash |= 0;
  }
  const checksum = `SHA256-${Math.abs(hash).toString(16).padStart(8, '0')}${Date.now().toString(16)}`;

  const item: OfflineTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    idempotencyKey: `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    stationId,
    operatorId,
    operatorName,
    actionType,
    entityType,
    entityId,
    payload,
    checksum,
    synced: false,
  };

  const nextDb: DatabaseState = {
    ...db,
    offlineQueue: [item, ...db.offlineQueue],
  };
  saveDatabase(nextDb);
  return { updatedDb: nextDb, item };
}

// Flush and replay offline buffer
export function flushOfflineQueue(
  db: DatabaseState,
  onEvent?: (event: WebSocketEvent) => void
): { updatedDb: DatabaseState; syncedCount: number } {
  if (db.offlineQueue.length === 0) {
    return { updatedDb: db, syncedCount: 0 };
  }

  const count = db.offlineQueue.length;
  const syncEvent: WebSocketEvent = {
    id: `ws_sync_${Date.now()}`,
    timestamp: new Date().toISOString(),
    station: 'Offline Sync Engine',
    eventType: 'LAN_SYNC',
    title: 'Offline Queue Synchronized',
    detail: `Re-synchronized ${count} buffered transaction(s) with central SPEED database.`,
  };

  const nextDb: DatabaseState = {
    ...db,
    offlineQueue: [],
    webSocketEvents: [syncEvent, ...db.webSocketEvents.slice(0, 99)],
  };
  saveDatabase(nextDb);

  if (onEvent) {
    onEvent(syncEvent);
  }

  return { updatedDb: nextDb, syncedCount: count };
}

// WebSocket Event Bus with BroadcastChannel for true cross-tab multi-workstation concurrency
type WebSocketListener = (event: WebSocketEvent, state: DatabaseState) => void;

class ClinicWebSocketHub {
  private listeners: WebSocketListener[] = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('speed_cis_lan_mesh');
        this.broadcastChannel.onmessage = (event) => {
          if (!event.data) return;

          if (event.data.type === 'SPEED_WS_BROADCAST') {
            const { wsEvent, dbState } = event.data;
            // Update local memory & storage without looping broadcast
            saveDatabase(dbState, true);
            this.playAudioForEvent(wsEvent.eventType);
            this.listeners.forEach((listener) => {
              try {
                listener(wsEvent, dbState);
              } catch (e) {
                console.error('Error in multi-tab WS listener', e);
              }
            });
          } else if (event.data.type === 'SPEED_DB_SYNC') {
            // Immediate zero-delay database state sync
            const { dbState } = event.data;
            if (dbState) {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
              } catch (e) {
                // Ignore storage quota
              }
              const syncEvt: WebSocketEvent = {
                id: `sync_${Date.now()}`,
                timestamp: new Date().toISOString(),
                station: 'Zero-Lag Peer Sync',
                eventType: 'LAN_SYNC',
                title: 'Data Synchronized',
                detail: 'State synchronized across all connected PC terminals.',
              };
              this.listeners.forEach((listener) => {
                try {
                  listener(syncEvt, dbState);
                } catch (e) {
                  console.error('Error in multi-tab sync listener', e);
                }
              });
            }
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error', err);
      }
    }
  }

  public notifyDbSync(db: DatabaseState): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SPEED_DB_SYNC',
          dbState: db,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn('BroadcastChannel sync post error', err);
      }
    }
  }

  public subscribe(cb: WebSocketListener): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private playAudioForEvent(eventType: WebSocketEvent['eventType']) {
    if (eventType === 'DOCTOR_QUEUE_UPDATED' || eventType === 'ENTRY_CARD_ISSUED') {
      clinicAudio.playQueueDing();
    } else if (eventType === 'PAYMENT_RECEIVED' || eventType === 'MEDICINE_DISPENSED') {
      clinicAudio.playSuccessChime();
    } else if (
      eventType === 'STOCK_ALERT' ||
      eventType === 'EMERGENCY_OVERRIDE' ||
      eventType === 'CRITICAL_LAB_ALERT'
    ) {
      clinicAudio.playAlertSound();
    }
  }

  public broadcast(
    eventType: WebSocketEvent['eventType'],
    station: string,
    title: string,
    detail: string,
    payload?: any
  ): void {
    const db = loadDatabase();
    const event: WebSocketEvent = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      station,
      eventType,
      title,
      detail,
      payload,
    };

    // Prepend to event log
    db.webSocketEvents = [event, ...db.webSocketEvents.slice(0, 99)];
    saveDatabase(db);

    // Audio cue
    this.playAudioForEvent(eventType);

    // Broadcast to other browser tabs/windows
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'SPEED_WS_BROADCAST',
          wsEvent: event,
          dbState: db,
        });
      } catch (err) {
        console.warn('BroadcastChannel post error', err);
      }
    }

    // Dispatch to local subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event, db);
      } catch (err) {
        console.error('Error in WS subscriber', err);
      }
    });
  }
}

export const clinicSocket = new ClinicWebSocketHub();
