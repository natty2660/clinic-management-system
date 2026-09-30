export type NursingTabId =
  | 'opd_vitals'
  | 'nursing_treatment'
  | 'waiting_list'
  | 'prescription'
  | 'final_result'
  | 'order_sheet'
  | 'feeding_sheet'
  | 'diabetic_sheet'
  | 'inpatient_consumption'
  | 'labour_summary'
  | 'labour_examination'
  | 'discharge_summary';

export interface TabConfig {
  id: NursingTabId;
  label: string;
  shortLabel: string;
  iconName: string;
  badge?: string | number;
  badgeColor?: string;
}
