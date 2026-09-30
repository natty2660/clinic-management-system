import { Visit, Patient, InpatientAdmission, Ward, Bed, AppointmentItem, Payment, ChargeItem } from '../../types/clinic';

export type ReceptionMainTab = 'opd' | 'inpatient';

export type OpdSubTab = 
  | 'registration_checkin'
  | 'queue_station'
  | 'pending_payments'
  | 'live_roster'
  | 'appointments';

export type InpatientSubTab = 
  | 'new_admission'
  | 'ward_bed_matrix'
  | 'active_inpatients'
  | 'deposits_billing'
  | 'discharge_clearance';

export interface ReceptionStats {
  opdTotalToday: number;
  opdWaitingDoctor: number;
  opdInConsultation: number;
  opdCompleted: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  admittedInpatientsCount: number;
  todayCollectionsEtb: number;
}
