import React, { useState } from 'react';
import {
  FileHeart,
  History,
  Activity,
  FlaskConical,
  Radio,
  Calendar,
  Search,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Shield,
  Stethoscope,
} from 'lucide-react';
import {
  DatabaseState,
  Patient,
  Visit,
  User as ClinicUser,
} from '../../types/clinic';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';
import { ClinicalReviewSubTab } from './types';
import { PatientHistoryTab } from '../opd/PatientHistoryTab';
import { LaboratoryResultTab } from '../opd/LaboratoryResultTab';
import { InvestigationNursingTab } from '../opd/InvestigationNursingTab';
import { UltrasoundResultTab } from '../opd/UltrasoundResultTab';
import { XRayResultTab } from '../opd/XRayResultTab';
import { EndoscopyResultTab } from '../opd/EndoscopyResultTab';
import { PathologyResultTab } from '../opd/PathologyResultTab';
import { ViewAppointmentTab } from '../opd/ViewAppointmentTab';

interface ClinicalReviewTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  selectedPatientId?: string;
  selectedVisitId?: string;
  onSelectPatient?: (patientId: string) => void;
}

export const ClinicalReviewTab: React.FC<ClinicalReviewTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  selectedPatientId,
  selectedVisitId,
  onSelectPatient,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ClinicalReviewSubTab>('patient_history');
  const [imagingTab, setImagingTab] = useState<'ultrasound' | 'xray' | 'endoscopy' | 'pathology'>('xray');
  const [patientSearch, setPatientSearch] = useState('');

  // Target patient
  const targetPatient =
    db.patients.find((p) => p.id === selectedPatientId) ||
    db.patients[0];

  // Target visit
  const targetVisit =
    (selectedVisitId ? db.visits.find((v) => v.id === selectedVisitId) : null) ||
    db.visits.find((v) => v.patientId === targetPatient?.id) ||
    db.visits[0];

  // Search filtered patients
  const filteredPatients = db.patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const term = patientSearch.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.mrn.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Patient Picker Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                {targetPatient ? targetPatient.name : 'Select Patient'}
              </span>
              <span className="font-mono text-xs text-slate-400">
                • {targetPatient?.mrn}
              </span>
              {targetPatient && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  {targetPatient.gender}, {targetPatient.age} yrs
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Current Visit: <strong className="text-slate-800">{targetVisit?.visitNumber || 'N/A'}</strong> · Dept: {targetVisit?.department || 'Outpatient'}
            </div>
          </div>
        </div>

        {/* Quick Patient Switch Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Switch patient (MRN / name)..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <select
            value={targetPatient?.id || ''}
            onChange={(e) => onSelectPatient && onSelectPatient(e.target.value)}
            className="p-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
          >
            {filteredPatients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.mrn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clinical Review Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto bg-white rounded-t-2xl px-4 pt-2">
        <button
          onClick={() => setActiveSubTab('patient_history')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'patient_history'
              ? 'border-purple-600 text-purple-800 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-purple-600" />
          <span>Patient Medical History & Diagnoses</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vitals_chart')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'vitals_chart'
              ? 'border-purple-600 text-purple-800 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-teal-600" />
          <span>Vitals, Nursing & Orders</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lab_results')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'lab_results'
              ? 'border-purple-600 text-purple-800 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-cyan-600" />
          <span>Diagnostic Lab Results</span>
        </button>

        <button
          onClick={() => setActiveSubTab('imaging_reports')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'imaging_reports'
              ? 'border-purple-600 text-purple-800 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Radio className="w-4 h-4 text-indigo-600" />
          <span>Imaging & Diagnostic Reports</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'appointments'
              ? 'border-purple-600 text-purple-800 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Scheduled Appointments</span>
        </button>
      </div>

      {/* Sub-Tab Content Rendering */}
      {targetPatient && targetVisit ? (
        <div>
          {activeSubTab === 'patient_history' && (
            <PatientHistoryTab
              patient={targetPatient}
              currentVisit={targetVisit}
              db={db}
              currentUser={currentUser}
              onUpdateDb={onUpdateDb}
            />
          )}

          {activeSubTab === 'vitals_chart' && (
            <InvestigationNursingTab
              patient={targetPatient}
              currentVisit={targetVisit}
              db={db}
              currentUser={currentUser}
              onUpdateDb={onUpdateDb}
              broadcast={broadcast}
            />
          )}

          {activeSubTab === 'lab_results' && (
            <LaboratoryResultTab
              patient={targetPatient}
              currentVisit={targetVisit}
              db={db}
              currentUser={currentUser}
              onUpdateDb={onUpdateDb}
              onPrint={onPrint}
              broadcast={broadcast}
            />
          )}

          {activeSubTab === 'imaging_reports' && (
            <div className="space-y-4">
              <div className="flex border-b border-slate-200 bg-white p-2 rounded-xl gap-2 text-xs">
                <button
                  onClick={() => setImagingTab('xray')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    imagingTab === 'xray'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  X-Ray Radiology ({(db.xrayOrders || []).filter((x) => x.patientId === targetPatient.id).length})
                </button>
                <button
                  onClick={() => setImagingTab('ultrasound')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    imagingTab === 'ultrasound'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ultrasound Sonography ({(db.ultrasoundOrders || []).filter((u) => u.patientId === targetPatient.id).length})
                </button>
                <button
                  onClick={() => setImagingTab('endoscopy')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    imagingTab === 'endoscopy'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Endoscopy ({(db.endoscopyOrders || []).filter((e) => e.patientId === targetPatient.id).length})
                </button>
                <button
                  onClick={() => setImagingTab('pathology')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    imagingTab === 'pathology'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pathology ({(db.pathologyOrders || []).filter((p) => p.patientId === targetPatient.id).length})
                </button>
              </div>

              {imagingTab === 'xray' && (
                <XRayResultTab
                  patient={targetPatient}
                  currentVisit={targetVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {imagingTab === 'ultrasound' && (
                <UltrasoundResultTab
                  patient={targetPatient}
                  currentVisit={targetVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {imagingTab === 'endoscopy' && (
                <EndoscopyResultTab
                  patient={targetPatient}
                  currentVisit={targetVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}

              {imagingTab === 'pathology' && (
                <PathologyResultTab
                  patient={targetPatient}
                  currentVisit={targetVisit}
                  db={db}
                  currentUser={currentUser}
                  onUpdateDb={onUpdateDb}
                  onPrint={onPrint}
                  broadcast={broadcast}
                />
              )}
            </div>
          )}

          {activeSubTab === 'appointments' && (
            <ViewAppointmentTab
              patient={targetPatient}
              currentVisit={targetVisit}
              db={db}
              currentUser={currentUser}
              onUpdateDb={onUpdateDb}
              onPrint={onPrint}
              broadcast={broadcast}
            />
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          No patient data available. Select a patient to view chart.
        </div>
      )}
    </div>
  );
};
