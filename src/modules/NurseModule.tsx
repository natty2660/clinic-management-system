import React, { useState, useMemo } from 'react';
import { DatabaseState, User, Visit, Patient, NursingRecord } from '../types/clinic';
import { PrintContentType } from '../components/PrintModal';
import { NursingTabId } from './nursing/nursingTypes';
import { NursingHeader } from './nursing/NursingHeader';
import { OpdVitalsTab } from './nursing/OpdVitalsTab';
import { NursingTreatmentTab } from './nursing/NursingTreatmentTab';
import { WaitingListTab } from './nursing/WaitingListTab';
import { PrescriptionTab } from './nursing/PrescriptionTab';
import { FinalResultTab } from './nursing/FinalResultTab';
import { OrderSheetTab } from './nursing/OrderSheetTab';
import { FeedingSheetTab } from './nursing/FeedingSheetTab';
import { DiabeticSheetTab } from './nursing/DiabeticSheetTab';
import { InpatientConsumptionTab } from './nursing/InpatientConsumptionTab';
import { LabourSummaryTab } from './nursing/LabourSummaryTab';
import { LabourExamTab } from './nursing/LabourExamTab';
import { DischargeSummaryTab } from './nursing/DischargeSummaryTab';
import {
  HeartPulse,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Bed,
  Filter,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

interface NurseModuleProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: User;
  onPrint?: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const NurseModule: React.FC<NurseModuleProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [selectedVisitId, setSelectedVisitId] = useState<string>(db.visits[0]?.id || '');
  const [activeTab, setActiveTab] = useState<NursingTabId>('opd_vitals');
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queueFilter, setQueueFilter] = useState<'all' | 'triage_needed' | 'triaged' | 'ward'>('all');

  const selectedVisit = useMemo(
    () => db.visits.find((v) => v.id === selectedVisitId) || db.visits[0],
    [db.visits, selectedVisitId]
  );

  const selectedPatient = useMemo(
    () => (selectedVisit ? db.patients.find((p) => p.id === selectedVisit.patientId) || null : null),
    [db.patients, selectedVisit]
  );

  const visitNursingNotes = useMemo(
    () => (selectedVisit ? db.nursingRecords.filter((n) => n.visitId === selectedVisit.id) : []),
    [db.nursingRecords, selectedVisit]
  );

  // Filtered Nursing Patient Queue (Like OPD structure)
  const filteredQueue = useMemo(() => {
    return (db.visits || []).filter((v) => {
      // Text search
      const q = queueSearch.toLowerCase().trim();
      if (q) {
        const matchName = (v.patientName || '').toLowerCase().includes(q);
        const matchMrn = (v.patientMrn || '').toLowerCase().includes(q);
        const matchNum = v.queueNumber.toString().includes(q);
        if (!matchName && !matchMrn && !matchNum) return false;
      }

      // Filter status
      const isAdmitted = (db.admissions || []).some(
        (a) => a.patientId === v.patientId && a.status === 'admitted'
      );
      const hasVitals = !!v.vitals;

      if (queueFilter === 'triage_needed') {
        return !hasVitals && v.status !== 'completed' && v.status !== 'discharged';
      }
      if (queueFilter === 'triaged') {
        return hasVitals;
      }
      if (queueFilter === 'ward') {
        return isAdmitted;
      }

      return true;
    });
  }, [db.visits, db.admissions, queueSearch, queueFilter]);

  // Dynamic Badges for all 12 tabs
  const tabBadges = useMemo(() => {
    const vid = selectedVisit?.id;
    const waitingCount = db.visits.filter((v) => v.status !== 'completed' && v.status !== 'discharged').length;
    const rxCount = vid ? db.prescriptions.filter((p) => p.visitId === vid).length : 0;
    const labCount = vid ? db.labOrders.filter((l) => l.visitId === vid).length : 0;
    const orderCount = vid ? (db.doctorOrders || []).filter((o) => o.visitId === vid && o.status === 'active').length : 0;
    const feedCount = vid ? (db.feedingRecords || []).filter((f) => f.visitId === vid).length : 0;
    const dmRecord = vid ? (db.diabeticRecords || []).find((d) => d.visitId === vid) : undefined;
    const consumptionCount = vid ? (db.patientConsumptions || []).filter((c) => c.visitId === vid).length : 0;
    const hasLabourSummary = vid ? (db.labourSummaries || []).some((l) => l.visitId === vid) : false;
    const examCount = vid ? (db.labourExamRecords || []).filter((e) => e.visitId === vid).length : 0;
    const isDischarged = selectedVisit?.status === 'discharged';

    return {
      opd_vitals: selectedVisit?.vitals ? 'Logged' : 'Needs Triage',
      nursing_treatment: visitNursingNotes.length || undefined,
      waiting_list: waitingCount || undefined,
      prescription: rxCount || undefined,
      final_result: labCount || undefined,
      order_sheet: orderCount ? `${orderCount} Active` : undefined,
      feeding_sheet: feedCount || undefined,
      diabetic_sheet: dmRecord ? `${dmRecord.bloodGlucose} mg/dL` : undefined,
      inpatient_consumption: consumptionCount || undefined,
      labour_summary: hasLabourSummary ? 'Summary' : undefined,
      labour_examination: examCount || undefined,
      discharge_summary: isDischarged ? 'Discharged' : undefined,
    };
  }, [db, selectedVisit, visitNursingNotes]);

  // Unified Print Handler
  const handlePrintCurrentTab = () => {
    if (!onPrint || !selectedVisit || !selectedPatient) return;

    if (activeTab === 'opd_vitals' || activeTab === 'nursing_treatment') {
      onPrint({
        type: 'nursing_mar_slip',
        data: {
          visit: selectedVisit,
          patient: selectedPatient,
          vitals: selectedVisit.vitals,
          nursingRecords: visitNursingNotes,
          nurseName: currentUser.name,
        },
        settings: db.settings,
      });
    } else if (activeTab === 'discharge_summary') {
      onPrint({
        type: 'clinical_summary',
        data: {
          visit: selectedVisit,
          patient: selectedPatient,
          consultation: db.consultations.find((c) => c.visitId === selectedVisit.id),
          vitals: selectedVisit.vitals,
          labOrders: db.labOrders.filter((l) => l.visitId === selectedVisit.id),
          prescriptions: db.prescriptions.filter((p) => p.visitId === selectedVisit.id),
          nursingRecords: visitNursingNotes,
          dischargedAt: new Date().toISOString(),
          attendingDoctor: selectedVisit.doctorAssignedName,
        },
        settings: db.settings,
      });
    } else {
      window.print();
    }
  };

  const handleTriggerEmergencyCall = () => {
    if (!selectedVisit) return;
    broadcast(
      'EMERGENCY_OVERRIDE',
      'Nursing Station',
      `EMERGENCY CALL: Triage & Observation`,
      `Urgent medical response requested by Nurse ${currentUser.name} for ${selectedVisit.patientName} (Q #${selectedVisit.queueNumber}).`
    );
  };

  if (!selectedVisit) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        No patient records available in the clinic queue.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT COLUMN: LIVE NURSING PATIENT QUEUE (4 Cols) - Independent Sticky Queue like OPD */}
      <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-purple-600" />
              Triage & Ward Queue ({filteredQueue.length})
            </h3>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-2 py-0.5 rounded-full">
              NURSE LIVE
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search queue name, # or MRN..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-semibold">
            <button
              onClick={() => setQueueFilter('all')}
              className={`px-2 py-0.5 rounded-md transition ${
                queueFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({db.visits.length})
            </button>
            <button
              onClick={() => setQueueFilter('triage_needed')}
              className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                queueFilter === 'triage_needed'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Needs Vitals
            </button>
            <button
              onClick={() => setQueueFilter('triaged')}
              className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                queueFilter === 'triaged'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Triaged
            </button>
            <button
              onClick={() => setQueueFilter('ward')}
              className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 ${
                queueFilter === 'ward'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              Ward
            </button>
          </div>
        </div>

        {/* Queue List - Fixed independent height scroll container */}
        <div className="space-y-2 h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {filteredQueue.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No patients found matching filter.</p>
            </div>
          ) : (
            filteredQueue.map((v) => {
              const isSelected = v.id === selectedVisitId;
              const hasVitals = !!v.vitals;
              const activeAdmission = (db.admissions || []).find(
                (a) => a.patientId === v.patientId && a.status === 'admitted'
              );

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVisitId(v.id)}
                  className={`bg-white rounded-xl p-3 border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-200 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-900 text-white rounded">
                        #{v.queueNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{v.patientName}</h4>
                        <div className="text-[10px] text-slate-500">
                          {v.patientGender} · {v.patientAge} yrs · {v.patientMrn}
                        </div>
                      </div>
                    </div>

                    {activeAdmission ? (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Bed {activeAdmission.bedNumber}
                      </span>
                    ) : hasVitals ? (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> TRIAGED
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 animate-pulse">
                        NEEDS BP
                      </span>
                    )}
                  </div>

                  {/* Vitals Summary Pill */}
                  {hasVitals && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] flex flex-wrap gap-2 text-slate-600 font-mono">
                      <span>BP: <strong>{v.vitals?.bloodPressureSystolic}/{v.vitals?.bloodPressureDiastolic}</strong></span>
                      <span>HR: <strong>{v.vitals?.pulseRate} bpm</strong></span>
                      <span>SpO2: <strong>{v.vitals?.oxygenSaturation}%</strong></span>
                    </div>
                  )}

                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">
                      Arrived {v.createdAt ? formatDateTime(v.createdAt).split(',')[1] : ''}
                    </span>
                    <span className="text-purple-600 font-semibold capitalize">
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: NURSING DOSSIER & 12 WORKBENCH TABS (8 Cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Rapid Patient Bar & 12 Tabs Switcher */}
        <NursingHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          selectedVisit={selectedVisit}
          selectedPatient={selectedPatient}
          allVisits={db.visits}
          onSelectVisitId={setSelectedVisitId}
          onPrintCurrentTab={handlePrintCurrentTab}
          onTriggerEmergencyCall={handleTriggerEmergencyCall}
          tabBadges={tabBadges}
        />

        {/* Tab 1: OPD Vital sign */}
        {activeTab === 'opd_vitals' && (
          <OpdVitalsTab
            visit={selectedVisit}
            patient={selectedPatient}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={handlePrintCurrentTab}
          />
        )}

        {/* Tab 2: Nursing treatment */}
        {activeTab === 'nursing_treatment' && (
          <NursingTreatmentTab
            visit={selectedVisit}
            patient={selectedPatient}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={handlePrintCurrentTab}
            nursingRecords={visitNursingNotes}
          />
        )}

        {/* Tab 3: Waiting List */}
        {activeTab === 'waiting_list' && (
          <WaitingListTab
            visits={db.visits}
            selectedVisitId={selectedVisit.id}
            onSelectVisit={(id) => {
              setSelectedVisitId(id);
              setActiveTab('opd_vitals');
            }}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 4: Prescription */}
        {activeTab === 'prescription' && (
          <PrescriptionTab
            visit={selectedVisit}
            patient={selectedPatient}
            prescriptions={db.prescriptions}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={
              onPrint
                ? (prescription) =>
                    onPrint({
                      type: 'prescription',
                      data: prescription,
                      settings: db.settings,
                    })
                : undefined
            }
            onSwitchToTreatment={() => setActiveTab('nursing_treatment')}
          />
        )}

        {/* Tab 5: Final Result */}
        {activeTab === 'final_result' && (
          <FinalResultTab
            visit={selectedVisit}
            patient={selectedPatient}
            labOrders={db.labOrders}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={
              onPrint
                ? (labOrder) =>
                    onPrint({
                      type: 'lab_report',
                      data: labOrder,
                      settings: db.settings,
                    })
                : undefined
            }
          />
        )}

        {/* Tab 6: Order Sheet */}
        {activeTab === 'order_sheet' && (
          <OrderSheetTab
            visit={selectedVisit}
            patient={selectedPatient}
            orders={db.doctorOrders || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 7: Feeding Sheet */}
        {activeTab === 'feeding_sheet' && (
          <FeedingSheetTab
            visit={selectedVisit}
            patient={selectedPatient}
            feedingRecords={db.feedingRecords || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 8: Diabetic Mellitus Sheet */}
        {activeTab === 'diabetic_sheet' && (
          <DiabeticSheetTab
            visit={selectedVisit}
            patient={selectedPatient}
            records={db.diabeticRecords || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 9: In Patient Consumption */}
        {activeTab === 'inpatient_consumption' && (
          <InpatientConsumptionTab
            visit={selectedVisit}
            patient={selectedPatient}
            consumptions={db.patientConsumptions || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 10: Labour Summary */}
        {activeTab === 'labour_summary' && (
          <LabourSummaryTab
            visit={selectedVisit}
            patient={selectedPatient}
            summaries={db.labourSummaries || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={handlePrintCurrentTab}
          />
        )}

        {/* Tab 11: Examination during Labour */}
        {activeTab === 'labour_examination' && (
          <LabourExamTab
            visit={selectedVisit}
            patient={selectedPatient}
            examRecords={db.labourExamRecords || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {/* Tab 12: Discharge Summary */}
        {activeTab === 'discharge_summary' && (
          <DischargeSummaryTab
            visit={selectedVisit}
            patient={selectedPatient}
            summaries={db.dischargeSummaries || []}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
            onPrint={handlePrintCurrentTab}
          />
        )}
      </div>
    </div>
  );
};

