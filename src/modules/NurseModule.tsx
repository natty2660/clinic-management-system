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
    <div className="space-y-4">
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
  );
};
