import React from 'react';
import {
  History,
  Activity,
  FlaskConical,
  Radio,
  FileSearch,
  ScanLine,
  Microscope,
  CalendarDays,
  FileText,
  Pill,
  HeartPulse,
  Printer,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Patient, Visit, Consultation, DatabaseState } from '../../types/clinic';
import { OpdTabId } from './opdTypes';

interface OpdHeaderProps {
  selectedPatient: Patient | null;
  selectedVisit: Visit | null;
  existingConsultation?: Consultation;
  activeTab: OpdTabId;
  onSelectTab: (tab: OpdTabId) => void;
  onPrintDossier: () => void;
  onPrintRx: () => void;
  hasRx: boolean;
  onToggleClinicalDrawer: () => void;
  isClinicalDrawerOpen: boolean;
  db: DatabaseState;
}

export const OpdHeader: React.FC<OpdHeaderProps> = ({
  selectedPatient,
  selectedVisit,
  activeTab,
  onSelectTab,
  onPrintDossier,
  onPrintRx,
  hasRx,
  onToggleClinicalDrawer,
  isClinicalDrawerOpen,
  db,
}) => {
  if (!selectedPatient || !selectedVisit) {
    return null;
  }

  // Calculate live badge counts
  const visitLabOrders = db.labOrders.filter((l) => l.visitId === selectedVisit.id);
  const completedLabs = visitLabOrders.filter((l) => l.status === 'completed').length;
  
  const nursingTreatmentsCount = db.nursingRecords.filter((n) => n.visitId === selectedVisit.id).length;
  const doctorOrdersCount = (db.doctorOrders || []).filter((o) => o.visitId === selectedVisit.id).length;

  const ultrasoundCount = (db.ultrasoundOrders || []).filter(
    (u) => u.patientId === selectedPatient.id || u.visitId === selectedVisit.id
  ).length;

  const xrayCount = (db.xrayOrders || []).filter(
    (x) => x.patientId === selectedPatient.id || x.visitId === selectedVisit.id
  ).length;

  const endoscopyCount = (db.endoscopyOrders || []).filter(
    (e) => e.patientId === selectedPatient.id || e.visitId === selectedVisit.id
  ).length;

  const pathologyCount = (db.pathologyOrders || []).filter(
    (p) => p.patientId === selectedPatient.id || p.visitId === selectedVisit.id
  ).length;

  const appointmentsCount = (db.appointments || []).filter(
    (a) => a.patientId === selectedPatient.id && a.status === 'confirmed'
  ).length;

  const tabs: {
    id: OpdTabId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'patient_history',
      label: 'PATIENT HISTORY',
      icon: <History className="w-3.5 h-3.5" />,
    },
    {
      id: 'investigation_nursing',
      label: 'INVESTIGATION & NURSING TREATMENT',
      icon: <Activity className="w-3.5 h-3.5" />,
      badge: nursingTreatmentsCount + doctorOrdersCount,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'laboratory_result',
      label: 'LABORATORY RESULT',
      icon: <FlaskConical className="w-3.5 h-3.5" />,
      badge: visitLabOrders.length,
      badgeColor: completedLabs > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'ultrasound_result',
      label: 'ULTRASOUND RESULT',
      icon: <Radio className="w-3.5 h-3.5" />,
      badge: ultrasoundCount,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'xray_result',
      label: 'X RAY RESULT',
      icon: <ScanLine className="w-3.5 h-3.5" />,
      badge: xrayCount,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'endoscopy_result',
      label: 'ENDOSCOPY RESULT',
      icon: <FileSearch className="w-3.5 h-3.5" />,
      badge: endoscopyCount,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'pathology_result',
      label: 'PATHOLOGY RESULT',
      icon: <Microscope className="w-3.5 h-3.5" />,
      badge: pathologyCount,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'view_appointment',
      label: 'VIEW APPOINTMENT',
      icon: <CalendarDays className="w-3.5 h-3.5" />,
      badge: appointmentsCount,
      badgeColor: 'bg-cyan-100 text-cyan-800',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Patient Summary Banner */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedPatient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {selectedPatient.name}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                  {selectedPatient.mrn}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {selectedPatient.gender}, {selectedPatient.age} yrs
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Queue #{selectedVisit.queueNumber}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Tel: <strong>{selectedPatient.phone}</strong></span>
                <span>Blood: <strong>{selectedPatient.bloodGroup}</strong></span>
                {selectedPatient.allergies.length > 0 ? (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Allergies: {selectedPatient.allergies.join(', ')}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    No Known Drug Allergies (NKDA)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Doctor Workstation Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onToggleClinicalDrawer}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                isClinicalDrawerOpen
                  ? 'bg-blue-600 text-white shadow-blue-200'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-300'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              {isClinicalDrawerOpen ? 'Hide Notes & e-Rx' : 'Clinical Notes & e-Rx'}
            </button>

            <button
              type="button"
              onClick={onPrintDossier}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              Clinical Dossier
            </button>

            {hasRx && (
              <button
                type="button"
                onClick={onPrintRx}
                className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Rx
              </button>
            )}
          </div>
        </div>

        {/* Vital Signs Quick Status Bar */}
        {selectedVisit.vitals && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Vitals:
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                BP {selectedVisit.vitals.bloodPressureSystolic}/{selectedVisit.vitals.bloodPressureDiastolic} mmHg
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                HR {selectedVisit.vitals.pulseRate} bpm
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                Temp {selectedVisit.vitals.temperature}°C
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                SpO2 {selectedVisit.vitals.oxygenSaturation}%
              </span>
              {selectedVisit.vitals.bmi && (
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">
                  BMI {selectedVisit.vitals.bmi} ({selectedVisit.vitals.bmiCategory})
                </span>
              )}
              {selectedVisit.vitals.bloodGlucose && (
                <span className="bg-amber-100 px-2 py-0.5 rounded font-mono font-bold text-amber-900">
                  RBS {selectedVisit.vitals.bloodGlucose} mg/dL
                </span>
              )}
            </div>

            {selectedVisit.vitals.triageCategory && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                ESI Acuity: {selectedVisit.vitals.triageCategory}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Modern High-Efficiency 8-Tab Navigation Bar */}
      <div className="bg-slate-900 px-2 flex overflow-x-auto scrollbar-none items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3.5 py-3 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border-b-2 relative ${
                isActive
                  ? 'border-blue-400 text-white bg-slate-800/80 shadow-inner'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span className={isActive ? 'text-blue-400' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    tab.badgeColor || 'bg-slate-700 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
