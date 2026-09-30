import React, { useState } from 'react';
import {
  UserPlus,
  Sparkles,
  Printer,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ShieldCheck,
  Zap,
  Phone,
  Clock,
  User,
  HeartPulse,
  Tag,
  DollarSign,
} from 'lucide-react';
import { DatabaseState, Patient, Visit, EntryCard, ChargeItem, User as ClinicUser } from '../../types/clinic';
import { formatCurrency } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface OpdRegistrationTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onNavigateToQueue: () => void;
}

export const OpdRegistrationTab: React.FC<OpdRegistrationTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  onNavigateToQueue,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [dob, setDob] = useState('1998-05-20');
  const [age, setAge] = useState<number>(28);
  const [phone, setPhone] = useState('+254 7');
  const [nationalId, setNationalId] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [department, setDepartment] = useState('General OPD');
  const [assignedDoctorId, setAssignedDoctorId] = useState<string>('usr_doctor_1');
  const [triageCategory, setTriageCategory] = useState<'Standard' | 'Urgent' | 'Emergency' | 'Elderly / Pediatric'>('Standard');
  const [feeOption, setFeeOption] = useState<'standard' | 'revisit' | 'emergency' | 'waived'>('standard');
  const [autoPayConsultation, setAutoPayConsultation] = useState(true);
  const [justEnqueuedVisit, setJustEnqueuedVisit] = useState<{ visit: Visit; card?: EntryCard } | null>(null);

  // Doctors list with waiting queues
  const doctors = db.users.filter((u) => u.role === 'doctor' && u.active);

  const getDoctorWaitingCount = (docId: string) => {
    return db.visits.filter(
      (v) => (v.status === 'waiting_doctor' || v.status === 'registered') && v.doctorAssignedId === docId
    ).length;
  };

  // Auto-calculate age from DOB
  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    const bYear = new Date(newDob).getFullYear();
    const cYear = new Date().getFullYear();
    if (!isNaN(bYear) && bYear > 1900 && bYear <= cYear) {
      setAge(Math.max(1, cYear - bYear));
    }
  };

  // Quick Presets
  const applyPreset = (type: 'walk_in' | 'female_adult' | 'male_adult' | 'child_fever') => {
    const r = Math.floor(100 + Math.random() * 900);
    if (type === 'walk_in') {
      setName(`Walk-in Patient #${r}`);
      setGender('male');
      setAge(32);
      setDob('1994-03-12');
      setPhone(`+254 700 ${r} 22`);
      setDepartment('General OPD');
      setAllergies('NKDA');
    } else if (type === 'female_adult') {
      setName(`Hellen Wambui ${r}`);
      setGender('female');
      setAge(27);
      setDob('1999-08-14');
      setPhone(`+254 722 ${r} 41`);
      setDepartment('Gynecology & Obs');
      setAllergies('Penicillin (mild rash)');
      setAssignedDoctorId(doctors[1]?.id || doctors[0]?.id);
    } else if (type === 'male_adult') {
      setName(`Kassaye Zewdu ${r}`);
      setGender('male');
      setAge(45);
      setDob('1981-11-04');
      setPhone(`+254 733 ${r} 99`);
      setDepartment('Internal Medicine');
      setAllergies('None known');
    } else if (type === 'child_fever') {
      setName(`Baby Liam Otieno ${r}`);
      setGender('male');
      setAge(4);
      setDob('2022-06-18');
      setPhone(`+254 711 ${r} 10`);
      setDepartment('Pediatrics');
      setTriageCategory('Urgent');
      setAllergies('None known');
    }
  };

  const calculateFeeAmount = () => {
    if (feeOption === 'waived') return 0;
    if (feeOption === 'revisit') return db.settings.revisitConsultationFee || 200;
    if (feeOption === 'emergency') return (db.settings.consultationFee || 350) + 150;
    return db.settings.consultationFee || 350;
  };

  const handleRegisterAndEnqueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currentYear = new Date().getFullYear();
    const nextPatientNum = (db.patients.length + 1).toString().padStart(4, '0');
    const newMrn = `PAT-${currentYear}-${nextPatientNum}`;

    const newPatient: Patient = {
      id: `pat_${Date.now()}`,
      mrn: newMrn,
      name: name.trim(),
      gender,
      dob,
      age: age || 25,
      phone: phone.trim() || '+254 700 000 000',
      nationalId: nationalId.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      bloodGroup,
      allergies: allergies.trim() ? allergies.split(',').map((a) => a.trim()) : [],
      registeredAt: new Date().toISOString(),
    };

    // Calculate queue number
    const todayQueueNum = db.visits.length + 101;
    const newVisitNum = `VST-${currentYear}-${(db.visits.length + 1).toString().padStart(4, '0')}`;
    const selectedDoc = doctors.find((d) => d.id === assignedDoctorId) || doctors[0];
    const feeAmount = calculateFeeAmount();

    const isPaid = autoPayConsultation || feeAmount === 0;

    const newVisit: Visit = {
      id: `vst_${Date.now()}`,
      visitNumber: newVisitNum,
      patientId: newPatient.id,
      patientName: newPatient.name,
      patientMrn: newPatient.mrn,
      patientAge: newPatient.age,
      patientGender: newPatient.gender,
      queueNumber: todayQueueNum,
      department,
      doctorAssignedId: selectedDoc?.id,
      doctorAssignedName: selectedDoc?.name,
      status: isPaid ? 'waiting_doctor' : 'registered',
      entryCardIssued: isPaid,
      consultationPaid: isPaid,
      emergencyOverridden: feeOption === 'waived',
      overrideReason: feeOption === 'waived' ? 'Consultation fee waived by front desk supervisor' : undefined,
      vitals: {
        recordedAt: new Date().toISOString(),
        triageCategory,
        painScore: 0,
      },
      createdAt: new Date().toISOString(),
      version: 1,
    };

    const newCharge: ChargeItem = {
      id: `chg_${Date.now()}`,
      visitId: newVisit.id,
      patientId: newPatient.id,
      category: 'consultation',
      name: `Doctor Consultation (${department}) - ${feeOption.toUpperCase()}`,
      unitPrice: feeAmount,
      quantity: 1,
      totalPrice: feeAmount,
      paymentStatus: isPaid ? 'paid' : 'pending',
      addedAt: new Date().toISOString(),
      addedBy: currentUser.name,
    };

    let issuedCard: EntryCard | undefined = undefined;
    if (isPaid) {
      issuedCard = {
        id: `card_${Date.now()}`,
        visitId: newVisit.id,
        patientMrn: newPatient.mrn,
        patientName: newPatient.name,
        queueNumber: newVisit.queueNumber,
        issuedAt: new Date().toISOString(),
        issuedBy: currentUser.name,
        paymentStatus: 'paid',
        qrCodeData: `SPEED:${newVisit.visitNumber}|MRN:${newPatient.mrn}|Q:${newVisit.queueNumber}|PAID`,
        barcode: newVisit.visitNumber.replace(/[^A-Za-z0-9]/g, ''),
      };
    }

    onUpdateDb((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
      visits: [newVisit, ...prev.visits],
      charges: [newCharge, ...prev.charges],
      entryCards: issuedCard ? [issuedCard, ...prev.entryCards] : prev.entryCards,
    }));

    broadcast(
      'PATIENT_REGISTERED',
      'Reception PC',
      'New OPD Registration',
      `${newPatient.name} [${newPatient.mrn}] registered for ${department} -> Queue #${newVisit.queueNumber}`
    );

    if (issuedCard) {
      broadcast(
        'ENTRY_CARD_ISSUED',
        'Reception PC',
        'Entry Slip Issued',
        `Queue #${newVisit.queueNumber} enqueued for ${selectedDoc?.name || 'OPD'}. Visible on Doctor PC.`
      );
    }

    setJustEnqueuedVisit({ visit: newVisit, card: issuedCard });

    // Reset fields for next patient
    setName('');
    setPhone('+254 7');
    setNationalId('');
    setEmergencyContact('');
    setAllergies('');
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner if just enqueued */}
      {justEnqueuedVisit && (
        <div className="bg-emerald-50 border-2 border-emerald-500/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  QUEUE #{justEnqueuedVisit.visit.queueNumber}
                </span>
                <h4 className="font-black text-slate-900 text-sm">
                  {justEnqueuedVisit.visit.patientName} Successfully Enqueued!
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                MRN: <strong className="font-mono">{justEnqueuedVisit.visit.patientMrn}</strong> • Assigned to:{' '}
                <strong>{justEnqueuedVisit.visit.doctorAssignedName || 'OPD Doctor'}</strong> ({justEnqueuedVisit.visit.department})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {justEnqueuedVisit.card && (
              <button
                type="button"
                onClick={() =>
                  onPrint({
                    type: 'entry_card',
                    data: justEnqueuedVisit.card!,
                    settings: db.settings,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Entry Slip</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToQueue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
            >
              <Ticket className="w-4 h-4" />
              <span>View in Queue</span>
            </button>
            <button
              type="button"
              onClick={() => setJustEnqueuedVisit(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Preset Autofill Row */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-slate-700">Rapid Demographic Presets:</span>
          <span className="text-[11px] text-slate-500">1-click test fill for front-desk speed testing</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('walk_in')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            ⚡ Walk-In Express
          </button>
          <button
            type="button"
            onClick={() => applyPreset('female_adult')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            👩 Adult Female (OB/GYN)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('male_adult')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            👨 Adult Male (Internal Med)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('child_fever')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            👶 Pediatric Infant
          </button>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleRegisterAndEnqueue} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <span>OPD Intake & Patient Details</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect vital demographics, select attending physician, and generate thermal entry pass in a single rapid keystroke flow.
          </p>
        </div>

        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            1. Patient Demographics & Identification
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel Kiprop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-medium"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+254 7..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-bold text-red-700"
              >
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">National ID / Passport #</label>
              <input
                type="text"
                placeholder="ID-9923841"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact & Phone</label>
              <input
                type="text"
                placeholder="Next of kin name & contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Known Drug Allergies</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa, NSAIDs (or NKDA)"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-red-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Department & Doctor Routing */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            2. Department Routing & Attending Doctor Assignment
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-semibold"
              >
                <option value="General OPD">General OPD (Outpatient)</option>
                <option value="Internal Medicine">Internal Medicine Specialist</option>
                <option value="Pediatrics">Pediatrics & Child Health</option>
                <option value="Gynecology & Obs">Gynecology & Obstetrics</option>
                <option value="General Surgery">General Surgery Clinic</option>
                <option value="Orthopedics">Orthopedics & Trauma</option>
                <option value="Dental Clinic">Dental Surgery & Care</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attending Physician (Room)</label>
              <select
                value={assignedDoctorId}
                onChange={(e) => setAssignedDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white font-semibold"
              >
                {doctors.map((doc) => {
                  const waiting = getDoctorWaitingCount(doc.id);
                  return (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} • {doc.department} ({waiting} waiting)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Triage Priority Level</label>
              <select
                value={triageCategory}
                onChange={(e) => setTriageCategory(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none font-bold ${
                  triageCategory === 'Emergency'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-400'
                    : triageCategory === 'Urgent'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-300 bg-white text-slate-800'
                }`}
              >
                <option value="Standard">Level 4: Standard / Non-Urgent</option>
                <option value="Urgent">Level 2: Urgent / High Priority</option>
                <option value="Emergency">Level 1: STAT Resuscitation / Immediate</option>
                <option value="Elderly / Pediatric">Priority: Elderly (&gt;65) or Infant (&lt;5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Consultation Fee & Auto-Issuance */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            3. Consultation Fee & Entry Card Gate
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Consultation Fee Billing Option</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFeeOption('standard')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    feeOption === 'standard'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Standard ({formatCurrency(db.settings.consultationFee || 350, db.settings.currency)})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeOption('revisit')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    feeOption === 'revisit'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Revisit Follow-up ({formatCurrency(db.settings.revisitConsultationFee || 200, db.settings.currency)})
                </button>
                <button
                  type="button"
                  onClick={() => setFeeOption('emergency')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    feeOption === 'emergency'
                      ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Emergency Fast-track (+150 ETB)
                </button>
                <button
                  type="button"
                  onClick={() => setFeeOption('waived')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                    feeOption === 'waived'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Free / Waived (0 ETB)
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoPayConsultation}
                  onChange={(e) => setAutoPayConsultation(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Patient tendered cash immediately at reception (Mark Consultation Fee as PAID & Issue Queue Entry Card)
                </span>
              </label>
            </div>

            <div className="text-right border-l md:border-l border-slate-200 md:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Fee Due at Desk</span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(calculateFeeAmount(), db.settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Strict Clinic Rule: Patient is automatically routed to Doctor PC queue once consultation is cleared.</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md hover:shadow-lg"
          >
            <Ticket className="w-4 h-4" />
            <span>Register Patient & Issue Queue Ticket</span>
          </button>
        </div>
      </form>
    </div>
  );
};
