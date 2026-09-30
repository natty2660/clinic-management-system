import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Printer,
  Search,
  User,
  AlertCircle,
  Phone,
  Sparkles,
  MapPin,
  ArrowRight,
  Send,
} from 'lucide-react';
import { Patient, Visit, DatabaseState, AppointmentItem, User as AppUser } from '../../types/clinic';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface ViewAppointmentTabProps {
  patient: Patient;
  currentVisit: Visit;
  db: DatabaseState;
  currentUser: AppUser;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const ViewAppointmentTab: React.FC<ViewAppointmentTabProps> = ({
  patient,
  currentVisit,
  db,
  currentUser,
  onUpdateDb,
  onPrint,
  broadcast,
}) => {
  const [viewScope, setViewScope] = useState<'patient' | 'clinic_today' | 'clinic_all'>('patient');
  const [showBookModal, setShowBookModal] = useState(false);

  // Booking Form State
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7); // Default 1 week from now
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [appointmentDate, setAppointmentDate] = useState(defaultDateStr);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [department, setDepartment] = useState('General OPD');
  const [doctorName, setDoctorName] = useState(currentUser.name);
  const [appointmentType, setAppointmentType] = useState<AppointmentItem['type']>('Follow-up');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent'>('routine');

  // Appointments
  const allAppointments = (db.appointments || []).sort(
    (a, b) => new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime() - new Date(`${b.appointmentDate}T${b.appointmentTime}`).getTime()
  );

  const patientAppointments = allAppointments.filter((a) => a.patientId === patient.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = allAppointments.filter((a) => a.appointmentDate === todayStr);

  const displayedAppointments =
    viewScope === 'patient'
      ? patientAppointments
      : viewScope === 'clinic_today'
      ? todayAppointments
      : allAppointments;

  // Quick Preset Offsets
  const handleSetQuickDate = (daysAhead: number, reasonPreset: string, typePreset: AppointmentItem['type'] = 'Follow-up') => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    setAppointmentDate(target.toISOString().split('T')[0]);
    setReason(reasonPreset);
    setAppointmentType(typePreset);
    setShowBookModal(true);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const aptNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppointment: AppointmentItem = {
      id: `apt_${Date.now()}`,
      appointmentNumber: aptNumber,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      patientPhone: patient.phone,
      doctorId: currentUser.id,
      doctorName,
      department,
      appointmentDate,
      appointmentTime,
      durationMinutes: 15,
      type: appointmentType,
      status: 'confirmed',
      reason: reason.trim(),
      priority,
      reminderSent: true,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      appointments: [newAppointment, ...(prev.appointments || [])],
    }));

    broadcast(
      'MAR_MEDICATION_GIVEN',
      'SPEED OPD & Doctor',
      'Appointment Booked',
      `Follow-up booked for ${patient.name} on ${appointmentDate} at ${appointmentTime} with ${doctorName}.`,
      newAppointment
    );

    setReason('');
    setShowBookModal(false);
  };

  const handleUpdateStatus = (id: string, newStatus: AppointmentItem['status']) => {
    onUpdateDb((prev) => ({
      ...prev,
      appointments: (prev.appointments || []).map((a) =>
        a.id === id ? { ...a, status: newStatus } : a
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Scheduler Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-600" />
              OPD Clinical Appointments & Follow-up Scheduling
            </h3>
            <p className="text-[11px] text-slate-500">
              Schedule patient review dates, generate official appointment cards with barcode/QR, and manage OPD clinic capacity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Book Follow-up Slot
          </button>
        </div>

        {/* 1-Click Fast Follow-up Presets */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">
            1-Click Follow-Up Presets for {patient.name}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSetQuickDate(3, 'Review acute symptoms and response to prescribed medications', 'Follow-up')}
              className="p-3 text-left rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 transition group shadow-2xs"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  +3 Days Review
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600" />
              </div>
              <p className="text-[11px] text-slate-500">Early clinical response check</p>
            </button>

            <button
              type="button"
              onClick={() => handleSetQuickDate(7, 'Review Lab & Diagnostic investigations and therapeutic progress', 'Review Lab / Radiology')}
              className="p-3 text-left rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 transition group shadow-2xs"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  +1 Week Follow-Up
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600" />
              </div>
              <p className="text-[11px] text-slate-500">Check lab & radiology results</p>
            </button>

            <button
              type="button"
              onClick={() => handleSetQuickDate(14, 'Routine 2-week post-treatment evaluation or post-op wound check', 'Routine Checkup')}
              className="p-3 text-left rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 transition group shadow-2xs"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  +2 Weeks Review
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600" />
              </div>
              <p className="text-[11px] text-slate-500">Wound check / Suture removal</p>
            </button>

            <button
              type="button"
              onClick={() => handleSetQuickDate(30, 'Chronic care monthly check: Hypertension / Diabetes medication titration', 'Chronic Care (NCD)')}
              className="p-3 text-left rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/40 transition group shadow-2xs"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 transition">
                  +1 Month NCD Review
                </span>
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600" />
              </div>
              <p className="text-[11px] text-slate-500">Chronic NCD maintenance check</p>
            </button>
          </div>
        </div>
      </div>

      {/* Scope Filter Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">View Roster:</span>
          <button
            type="button"
            onClick={() => setViewScope('patient')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              viewScope === 'patient'
                ? 'bg-cyan-700 text-white'
                : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            {patient.name}'s Appointments ({patientAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('clinic_today')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              viewScope === 'clinic_today'
                ? 'bg-cyan-700 text-white'
                : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            Today's OPD Schedule ({todayAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('clinic_all')}
            className={`px-3 py-1 rounded-md font-bold transition ${
              viewScope === 'clinic_all'
                ? 'bg-cyan-700 text-white'
                : 'bg-white border text-slate-700 hover:bg-slate-100'
            }`}
          >
            All Scheduled ({allAppointments.length})
          </button>
        </div>

        <div className="text-slate-500 text-[11px]">
          Today: <strong>{formatDateOnly(new Date().toISOString())}</strong>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {displayedAppointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No appointments found for the selected view.</p>
            <p className="text-[11px] text-slate-400 mt-1">Click "Book Follow-up Slot" above to schedule an appointment.</p>
          </div>
        ) : (
          displayedAppointments.map((apt) => {
            const isForCurrentPatient = apt.patientId === patient.id;
            const isPast = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`).getTime() < Date.now();

            return (
              <div
                key={apt.id}
                className={`bg-white rounded-xl border p-4.5 shadow-xs transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isForCurrentPatient ? 'border-cyan-300 ring-1 ring-cyan-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                      {apt.appointmentNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                    <span className="text-xs text-slate-500 font-mono">({apt.patientMrn})</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                      {apt.type}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      {formatDateOnly(apt.appointmentDate)} at {apt.appointmentTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {apt.doctorName} ({apt.department})
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {apt.patientPhone}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                    <strong>Reason:</strong> {apt.reason}
                    {apt.notes && <span className="text-slate-500 ml-2">({apt.notes})</span>}
                  </p>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <select
                      value={apt.status}
                      onChange={(e) => handleUpdateStatus(apt.id, e.target.value as any)}
                      className={`text-xs font-bold px-2 py-1 rounded-md border focus:outline-none uppercase ${
                        apt.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : apt.status === 'arrived'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : apt.status === 'completed'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="arrived">Arrived</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        onPrint({
                          type: 'appointment_slip',
                          data: apt,
                          settings: db.settings,
                        })
                      }
                      className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Card
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Booked by {apt.createdBy} on {formatDateOnly(apt.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-600" />
                Schedule Patient Follow-up Appointment
              </h4>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span>Patient: <strong className="text-slate-900">{patient.name}</strong></span>
                <span className="ml-3">MRN: <strong className="font-mono text-slate-900">{patient.mrn}</strong></span>
                <span className="ml-3">Phone: <strong>{patient.phone}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="08:30">08:30 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="General OPD">General OPD</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology & Obs">Gynecology & Obs</option>
                    <option value="General Surgery">General Surgery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Type</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Follow-up">Follow-up</option>
                    <option value="Review Lab / Radiology">Review Lab / Radiology</option>
                    <option value="Routine Checkup">Routine Checkup</option>
                    <option value="Chronic Care (NCD)">Chronic Care (NCD)</option>
                    <option value="Post-Operative">Post-Operative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attending Physician</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Reason / Follow-up Goal</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Follow-up on H. pylori eradication therapy and verify symptom resolution..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Confirm & Generate Appointment Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
