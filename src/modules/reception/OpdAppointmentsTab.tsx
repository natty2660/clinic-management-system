import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  CheckCircle2,
  Printer,
  PlusCircle,
  Ticket,
  ChevronRight,
  Phone,
  Filter,
} from 'lucide-react';
import { DatabaseState, AppointmentItem, Visit, EntryCard, ChargeItem, User as ClinicUser } from '../../types/clinic';
import { formatDateOnly, formatDateTime } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface OpdAppointmentsTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const OpdAppointmentsTab: React.FC<OpdAppointmentsTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-30');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // New booking form
  const [bookPatientName, setBookPatientName] = useState('');
  const [bookPatientMrn, setBookPatientMrn] = useState('');
  const [bookPhone, setBookPhone] = useState('+254 7');
  const [bookDoctorId, setBookDoctorId] = useState(db.users.find((u) => u.role === 'doctor')?.id || '');
  const [bookDate, setBookDate] = useState('2026-10-02');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookReason, setBookReason] = useState('Routine Outpatient Consultation');
  const [bookType, setBookType] = useState<AppointmentItem['type']>('Follow-up');

  const appointments = (db.appointments || []).filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientMrn.toLowerCase().includes(search.toLowerCase()) ||
      apt.appointmentNumber.toLowerCase().includes(search.toLowerCase());

    const matchesDoc = filterDoctor === 'all' || apt.doctorId === filterDoctor;
    return matchesSearch && matchesDoc;
  });

  const doctors = db.users.filter((u) => u.role === 'doctor' && u.active);

  // 1-Click Check-in Appointment into Live OPD Queue
  const handleCheckInAppointment = (apt: AppointmentItem) => {
    // Check if visit already created for this appointment today
    const existing = db.visits.find((v) => v.patientMrn === apt.patientMrn && v.status !== 'completed');
    if (existing) {
      alert(`Patient ${apt.patientName} is already checked in today as Queue #${existing.queueNumber}!`);
      return;
    }

    const currentYear = new Date().getFullYear();
    const newQueueNum = db.visits.length + 101;
    const newVisitNum = `VST-${currentYear}-${(db.visits.length + 1).toString().padStart(4, '0')}`;

    const newVisit: Visit = {
      id: `vst_${Date.now()}`,
      visitNumber: newVisitNum,
      patientId: apt.patientId,
      patientName: apt.patientName,
      patientMrn: apt.patientMrn,
      patientAge: 35,
      patientGender: 'other',
      queueNumber: newQueueNum,
      department: apt.department,
      doctorAssignedId: apt.doctorId,
      doctorAssignedName: apt.doctorName,
      status: 'waiting_doctor',
      entryCardIssued: true,
      consultationPaid: true,
      emergencyOverridden: false,
      vitals: {
        recordedAt: new Date().toISOString(),
        triageCategory: 'Standard',
      },
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const card: EntryCard = {
      id: `card_${Date.now()}`,
      visitId: newVisit.id,
      patientMrn: apt.patientMrn,
      patientName: apt.patientName,
      queueNumber: newVisit.queueNumber,
      issuedAt: new Date().toISOString(),
      issuedBy: currentUser.name,
      paymentStatus: 'paid',
      qrCodeData: `SPEED:${newVisit.visitNumber}|MRN:${apt.patientMrn}|Q:${newVisit.queueNumber}|APPT`,
      barcode: newVisit.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
    };

    onUpdateDb((prev) => ({
      ...prev,
      visits: [newVisit, ...prev.visits],
      entryCards: [card, ...prev.entryCards],
      appointments: (prev.appointments || []).map((a) =>
        a.id === apt.id ? { ...a, status: 'arrived' as const } : a
      ),
    }));

    broadcast(
      'ENTRY_CARD_ISSUED',
      'Reception PC',
      'Appointment Patient Arrived',
      `${apt.patientName} arrived for appointment with ${apt.doctorName}. Enqueued as Queue #${newVisit.queueNumber}.`
    );

    onPrint({
      type: 'entry_card',
      data: card,
      settings: db.settings,
    });
  };

  // Create new appointment booking
  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPatientName.trim()) return;

    const doc = doctors.find((d) => d.id === bookDoctorId) || doctors[0];
    const newAptNum = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApt: AppointmentItem = {
      id: `apt_${Date.now()}`,
      appointmentNumber: newAptNum,
      patientId: `pat_${Date.now()}`,
      patientName: bookPatientName.trim(),
      patientMrn: bookPatientMrn.trim() || `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientPhone: bookPhone.trim() || '+254 700 000 000',
      doctorId: doc?.id || 'usr_doc_1',
      doctorName: doc?.name || 'Dr. Sarah Chen, MD',
      department: doc?.department?.replace('SPEED ', '') || 'General OPD',
      appointmentDate: bookDate,
      appointmentTime: bookTime,
      durationMinutes: 15,
      type: bookType,
      status: 'confirmed',
      reason: bookReason.trim(),
      priority: 'routine',
      reminderSent: true,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    onUpdateDb((prev) => ({
      ...prev,
      appointments: [newApt, ...(prev.appointments || [])],
    }));

    broadcast(
      'WORKSTATION_PING',
      'Reception PC',
      'Appointment Scheduled',
      `Appointment booked for ${newApt.patientName} with ${newApt.doctorName} on ${newApt.appointmentDate} at ${newApt.appointmentTime}.`
    );

    setIsNewBookingModalOpen(false);
    setBookPatientName('');
    setBookPatientMrn('');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>OPD Appointment Desk & Arrival Check-in</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            View pre-scheduled specialist consults and convert arriving patients directly into the live doctor queue with 1 click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, MRN, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
            />
          </div>

          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-black text-slate-800 text-sm">No Appointments Found</h4>
          <p className="text-xs text-slate-500 mt-1">Book an appointment or clear search filters to view bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((apt) => {
            const isArrived = apt.status === 'arrived';
            return (
              <div
                key={apt.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition hover:shadow-md ${
                  isArrived ? 'border-emerald-300 bg-emerald-50/15' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {apt.appointmentNumber} • {apt.patientMrn}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">{apt.patientName}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isArrived
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Date & Slot:</span>
                      <span className="font-bold text-teal-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-600" />
                        <span>
                          {formatDateOnly(apt.appointmentDate)} at {apt.appointmentTime}
                        </span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Doctor:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-teal-600" />
                        <span>{apt.doctorName}</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-700">{apt.department}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-700">{apt.patientPhone}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400 block mb-0.5">Clinical Reason:</span>
                      <span className="text-slate-700 font-medium italic">"{apt.reason}"</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onPrint({
                        type: 'appointment_slip',
                        data: apt,
                        settings: db.settings,
                      })
                    }
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title="Print Appointment Card"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {!isArrived ? (
                    <button
                      type="button"
                      onClick={() => handleCheckInAppointment(apt)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs transition"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Check-in to Live Queue</span>
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Patient Checked In</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>Book OPD Specialist Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule future outpatient consultation slot with attending doctor.
            </p>

            <form onSubmit={handleSaveAppointment} className="my-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Patient legal name"
                  value={bookPatientName}
                  onChange={(e) => setBookPatientName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MRN (if existing)</label>
                  <input
                    type="text"
                    placeholder="PAT-2026-..."
                    value={bookPatientMrn}
                    onChange={(e) => setBookPatientMrn(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 7..."
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Doctor</label>
                <select
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension review, Lab result follow-up"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
