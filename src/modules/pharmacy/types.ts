import {
  Visit,
  Patient,
  InpatientAdmission,
  Ward,
  Bed,
  Prescription,
  PrescriptionItem,
  Medicine,
  MedicineBatch,
  StockMovement,
  LabOrder,
  Consultation,
  VitalSigns,
  NursingRecord,
  UltrasoundOrder,
  XRayOrder,
  EndoscopyOrder,
  PathologyOrder,
  AppointmentItem,
  User as ClinicUser,
  DatabaseState,
} from '../../types/clinic';

export type PharmacyMainTab =
  | 'opd_dispensing'
  | 'inpatient_dispensing'
  | 'inventory_formulary'
  | 'stock_in_grn'
  | 'stock_movements'
  | 'controlled_drugs'
  | 'clinical_review';

export type ClinicalReviewSubTab =
  | 'patient_history'
  | 'vitals_chart'
  | 'lab_results'
  | 'imaging_reports'
  | 'appointments';

export interface PharmacyStats {
  totalPrescriptions: number;
  pendingDispense: number;
  paidReady: number;
  unpaidBlocked: number;
  dispensedToday: number;
  totalMedicines: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  inpatientOrdersCount: number;
  controlledDrugsCount: number;
}

export interface GoodsReceivedForm {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplierName: string;
  invoiceNumber: string;
  receivedNotes?: string;
}

export interface ControlledDrugEntry {
  id: string;
  timestamp: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  balanceAfter: number;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  dispensedByPharmacist: string;
  witnessPharmacist: string;
  prescriptionNumber: string;
  notes?: string;
}
