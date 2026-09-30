export type OpdTabId =
  | 'patient_history'
  | 'investigation_nursing'
  | 'laboratory_result'
  | 'ultrasound_result'
  | 'xray_result'
  | 'endoscopy_result'
  | 'pathology_result'
  | 'view_appointment';

export interface OpdTabMetadata {
  id: OpdTabId;
  label: string;
  shortLabel: string;
  description: string;
  badgeCount?: number;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose';
}
