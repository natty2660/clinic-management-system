import React from 'react';
import {
  HeartPulse,
  Syringe,
  Clock,
  Pill,
  FlaskConical,
  ClipboardList,
  Utensils,
  Droplet,
  ShoppingCart,
  Baby,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Printer,
  Bell,
  Search,
  User,
} from 'lucide-react';
import { Visit, Patient } from '../../types/clinic';
import { NursingTabId } from './nursingTypes';

interface NursingHeaderProps {
  activeTab: NursingTabId;
  onSelectTab: (tab: NursingTabId) => void;
  selectedVisit?: Visit;
  selectedPatient?: Patient | null;
  allVisits: Visit[];
  onSelectVisitId: (visitId: string) => void;
  onPrintCurrentTab?: () => void;
  onTriggerEmergencyCall?: () => void;
  tabBadges: Record<NursingTabId, string | number | undefined>;
}

export const NursingHeader: React.FC<NursingHeaderProps> = ({
  activeTab,
  onSelectTab,
  selectedVisit,
  selectedPatient,
  allVisits,
  onSelectVisitId,
  onPrintCurrentTab,
  onTriggerEmergencyCall,
  tabBadges,
}) => {
  const currentIndex = allVisits.findIndex((v) => v.id === selectedVisit?.id);

  const handlePrevPatient = () => {
    if (currentIndex > 0) {
      onSelectVisitId(allVisits[currentIndex - 1].id);
    }
  };

  const handleNextPatient = () => {
    if (currentIndex < allVisits.length - 1) {
      onSelectVisitId(allVisits[currentIndex + 1].id);
    }
  };

  const tabs: { id: NursingTabId; label: string; icon: React.ReactNode }[] = [
    { id: 'opd_vitals', label: 'OPD Vital sign', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'nursing_treatment', label: 'Nursing treatment', icon: <Syringe className="w-4 h-4" /> },
    { id: 'waiting_list', label: 'Waiting List', icon: <Clock className="w-4 h-4" /> },
    { id: 'prescription', label: 'Prescription', icon: <Pill className="w-4 h-4" /> },
    { id: 'final_result', label: 'Final Result', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'order_sheet', label: 'Order Sheet', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'feeding_sheet', label: 'Feeding Sheet', icon: <Utensils className="w-4 h-4" /> },
    { id: 'diabetic_sheet', label: 'Diabetic Mellitus Sheet', icon: <Droplet className="w-4 h-4" /> },
    { id: 'inpatient_consumption', label: 'In Patient Consumption', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'labour_summary', label: 'Labour Summary', icon: <Baby className="w-4 h-4" /> },
    { id: 'labour_examination', label: 'Examination during Labour', icon: <Activity className="w-4 h-4" /> },
    { id: 'discharge_summary', label: 'Discharge Summary', icon: <LogOut className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Top Patient Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Active Patient Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
            {selectedPatient?.name ? selectedPatient.name.charAt(0) : <User className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                Q #{selectedVisit?.queueNumber || '—'}
              </span>
              <span className="font-bold text-slate-900 text-base">
                {selectedVisit?.patientName || 'No Patient Selected'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {selectedVisit?.patientMrn}
              </span>
              {selectedVisit?.vitals?.triageCategory && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedVisit.vitals.triageCategory.includes('Red') || selectedVisit.vitals.triageCategory.includes('Orange')
                    ? 'bg-red-100 text-red-800 animate-pulse'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedVisit.vitals.triageCategory}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
              <span>{selectedVisit?.patientGender || '—'} · {selectedVisit?.patientAge || '—'}y</span>
              <span>Doctor: <strong className="text-slate-700">{selectedVisit?.doctorAssignedName || 'General OPD'}</strong></span>
              {selectedVisit?.vitals && (
                <span className="text-purple-700 font-medium">
                  Vitals: BP {selectedVisit.vitals.bloodPressureSystolic || '—'}/{selectedVisit.vitals.bloodPressureDiastolic || '—'} · HR {selectedVisit.vitals.pulseRate || '—'} · Temp {selectedVisit.vitals.temperature || '—'}°C
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Patient Navigation & Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Quick patient switcher dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={handlePrevPatient}
              disabled={currentIndex <= 0}
              title="Previous Patient"
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedVisit?.id || ''}
              onChange={(e) => onSelectVisitId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 py-1 px-2 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate"
            >
              {allVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  Q#{v.queueNumber} - {v.patientName}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextPatient}
              disabled={currentIndex >= allVisits.length - 1}
              title="Next Patient"
              className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onPrintCurrentTab && (
            <button
              onClick={onPrintCurrentTab}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print Active Sheet / Record"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          {onTriggerEmergencyCall && (
            <button
              onClick={onTriggerEmergencyCall}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Trigger Emergency Station Broadcast"
            >
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency Call</span>
            </button>
          )}
        </div>
      </div>

      {/* 12 Modern Tabs Flow Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const badge = tabBadges[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className="opacity-90">{tab.icon}</span>
                <span>{tab.label}</span>
                {badge !== undefined && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-purple-800 text-purple-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
