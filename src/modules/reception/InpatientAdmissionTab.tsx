import React, { useState } from 'react';
import {
  BedDouble,
  UserPlus,
  Sparkles,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
  ShieldCheck,
  Zap,
  Phone,
  Clock,
  User,
  DollarSign,
  HeartPulse,
} from 'lucide-react';
import { DatabaseState, InpatientAdmission, Bed, Ward, User as ClinicUser, Payment } from '../../types/clinic';
import { formatCurrency } from '../../utils/formatters';
import { PrintContentType } from '../../components/PrintModal';

interface InpatientAdmissionTabProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
  onNavigateToBedMatrix: () => void;
}

export const InpatientAdmissionTab: React.FC<InpatientAdmissionTabProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  broadcast,
  onNavigateToBedMatrix,
}) => {
  const wards = db.wards || [];
  const beds = db.beds || [];
  const doctors = db.users.filter((u) => u.role === 'doctor' && u.active);

  // Form states
  const [patientSource, setPatientSource] = useState<'existing_opd' | 'new_patient'>('existing_opd');
  const [selectedVisitId, setSelectedVisitId] = useState<string>('');
  
  // Patient fields
  const [name, setName] = useState('');
  const [mrn, setMrn] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [age, setAge] = useState<number>(30);
  const [phone, setPhone] = useState('+254 7');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  
  // Admission fields
  const [admissionDate, setAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [admissionTime, setAdmissionTime] = useState<string>('09:00');
  const [admissionType, setAdmissionType] = useState<InpatientAdmission['admissionType']>('Emergency');
  const [selectedWardId, setSelectedWardId] = useState<string>(wards[0]?.id || '');
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [admittingDoctorId, setAdmittingDoctorId] = useState<string>(doctors[0]?.id || '');
  const [department, setDepartment] = useState('Internal Medicine');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [initialDeposit, setInitialDeposit] = useState<number>(3000);
  const [depositPaid, setDepositPaid] = useState<boolean>(true);
  
  // Emergency contact
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('+254 7');
  const [contactRelation, setContactRelation] = useState('Spouse');
  const [admissionNotes, setAdmissionNotes] = useState('');

  const [justAdmitted, setJustAdmitted] = useState<InpatientAdmission | null>(null);

  // Available beds for selected ward
  const availableBedsInWard = beds.filter(
    (b) => b.wardId === selectedWardId && (b.status === 'available' || b.status === 'cleaning')
  );

  // Handle select from existing OPD patient
  const handleSelectOpdPatient = (visitId: string) => {
    setSelectedVisitId(visitId);
    const visit = db.visits.find((v) => v.id === visitId);
    if (!visit) return;

    setName(visit.patientName);
    setMrn(visit.patientMrn);
    setAge(visit.patientAge);
    setGender(visit.patientGender as any);
    setDepartment(visit.department);
    if (visit.doctorAssignedId) {
      setAdmittingDoctorId(visit.doctorAssignedId);
    }

    const patient = db.patients.find((p) => p.id === visit.patientId);
    if (patient) {
      setPhone(patient.phone);
      setBloodGroup(patient.bloodGroup);
      setAllergies(patient.allergies.join(', '));
      if (patient.emergencyContact) {
        setContactName(patient.emergencyContact);
      }
    }
  };

  // Clinical Diagnosis Presets
  const applyDiagnosisPreset = (diag: string, code: string, dept: string, wardCode: string, deposit: number) => {
    setProvisionalDiagnosis(diag);
    setIcdCode(code);
    setDepartment(dept);
    setInitialDeposit(deposit);

    const matchWard = wards.find((w) => w.code === wardCode);
    if (matchWard) {
      setSelectedWardId(matchWard.id);
      const freeBed = beds.find((b) => b.wardId === matchWard.id && b.status === 'available');
      if (freeBed) setSelectedBedId(freeBed.id);
    }
  };

  // Submit Admission
  const handleSubmitAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currentYear = new Date().getFullYear();
    const admCount = (db.admissions?.length || 0) + 1;
    const admissionNum = `IPD-${currentYear}-${admCount.toString().padStart(4, '0')}`;
    const depositReceiptNum = depositPaid ? `REC-ETB-2026-${Math.floor(2000 + Math.random() * 7000)}` : undefined;

    const chosenWard = wards.find((w) => w.id === selectedWardId) || wards[0];
    const chosenBed = beds.find((b) => b.id === selectedBedId) || availableBedsInWard[0] || beds[0];
    const chosenDoc = doctors.find((d) => d.id === admittingDoctorId) || doctors[0];

    const newAdmission: InpatientAdmission = {
      id: `adm_${Date.now()}`,
      admissionNumber: admissionNum,
      visitId: selectedVisitId || undefined,
      patientId: `pat_${Date.now()}`,
      patientMrn: mrn || `PAT-${currentYear}-${admCount.toString().padStart(4, '0')}`,
      patientName: name.trim(),
      patientAge: age || 30,
      patientGender: gender,
      phone: phone.trim(),
      bloodGroup,
      allergies: allergies.trim() ? allergies.split(',').map((a) => a.trim()) : [],
      admissionDate,
      admissionTime,
      admissionType,
      wardId: chosenWard.id,
      wardName: chosenWard.name,
      bedId: chosenBed.id,
      bedNumber: chosenBed.bedNumber,
      admittingDoctorId: chosenDoc.id,
      admittingDoctorName: chosenDoc.name,
      department,
      provisionalDiagnosis: provisionalDiagnosis.trim() || 'Acute Medical Admission',
      icdCode: icdCode.trim() || undefined,
      initialDeposit,
      depositPaid,
      depositReceiptNumber: depositReceiptNum,
      status: 'admitted',
      lengthOfStayDays: 0,
      emergencyContactName: contactName.trim() || 'Next of kin',
      emergencyContactPhone: contactPhone.trim(),
      emergencyContactRelation: contactRelation,
      notes: admissionNotes.trim(),
      admittedBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // If deposit was paid, also create a Payment record
    let newDepositPayment: Payment | undefined = undefined;
    if (depositPaid && initialDeposit > 0) {
      newDepositPayment = {
        id: `pay_${Date.now()}`,
        receiptNumber: depositReceiptNum!,
        visitId: selectedVisitId || `vst_${Date.now()}`,
        patientId: newAdmission.patientId,
        patientName: newAdmission.patientName,
        amount: initialDeposit,
        paymentMethod: 'cash',
        type: 'advance',
        chargeItemIds: [],
        paidAt: new Date().toISOString(),
        receivedBy: currentUser.name,
        notes: `IPD Admission Deposit for ${newAdmission.admissionNumber} (${newAdmission.wardName} - ${newAdmission.bedNumber}).`,
      };
    }

    onUpdateDb((prev) => {
      // Mark chosen bed as occupied
      const updatedBeds = (prev.beds || []).map((b) =>
        b.id === chosenBed.id
          ? {
              ...b,
              status: 'occupied' as const,
              currentAdmissionId: newAdmission.id,
              currentPatientName: newAdmission.patientName,
              currentPatientMrn: newAdmission.patientMrn,
            }
          : b
      );

      return {
        ...prev,
        admissions: [newAdmission, ...(prev.admissions || [])],
        beds: updatedBeds,
        payments: newDepositPayment ? [newDepositPayment, ...prev.payments] : prev.payments,
      };
    });

    broadcast(
      'PATIENT_ADMITTED',
      'Reception PC',
      'Inpatient Admitted to Ward',
      `${newAdmission.patientName} admitted to ${newAdmission.wardName} (${newAdmission.bedNumber}) under ${newAdmission.admittingDoctorName}.`
    );

    setJustAdmitted(newAdmission);

    // Reset form
    setName('');
    setMrn('');
    setProvisionalDiagnosis('');
  };

  return (
    <div className="space-y-6">
      {/* Success banner if just admitted */}
      {justAdmitted && (
        <div className="bg-indigo-50 border-2 border-indigo-400 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">
                  {justAdmitted.admissionNumber}
                </span>
                <h4 className="font-black text-slate-900 text-sm">
                  {justAdmitted.patientName} Admitted to {justAdmitted.wardName}!
                </h4>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Bed: <strong className="font-mono text-indigo-900">{justAdmitted.bedNumber}</strong> • Doctor:{' '}
                <strong>{justAdmitted.admittingDoctorName}</strong> • Deposit:{' '}
                <strong className="text-emerald-700">
                  {formatCurrency(justAdmitted.initialDeposit, db.settings.currency)} (
                  {justAdmitted.depositPaid ? 'PAID' : 'PENDING'})
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onPrint({
                  type: 'inpatient_admission_card',
                  data: justAdmitted,
                  settings: db.settings,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Admission Slip</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToBedMatrix}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
            >
              <Building2 className="w-4 h-4" />
              <span>View Ward Board</span>
            </button>
            <button
              type="button"
              onClick={() => setJustAdmitted(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 font-bold"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Clinical Admission Presets Strip */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Quick Clinical Admission Presets:</span>
          <span className="text-[11px] text-slate-500">1-click provisional diagnosis, ward routing & deposit config</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              applyDiagnosisPreset(
                'Severe Peptic Ulcer Disease with Hematemesis & Dehydration',
                'K25.0',
                'Internal Medicine',
                'MMW',
                2500
              )
            }
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            🩺 Severe PUD / GI Bleed
          </button>
          <button
            type="button"
            onClick={() =>
              applyDiagnosisPreset(
                'Severe Falciparum Malaria with Thrombocytopenia',
                'B50.8',
                'Infectious Disease',
                'FMW',
                3000
              )
            }
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            🦟 Severe Malaria (IV Artesunate)
          </button>
          <button
            type="button"
            onClick={() =>
              applyDiagnosisPreset(
                'Acute Appendicitis / Acute Abdomen - Pre-op Preparation',
                'K35.8',
                'General Surgery',
                'GSW',
                4000
              )
            }
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            🔪 Surgical / Appendectomy
          </button>
          <button
            type="button"
            onClick={() =>
              applyDiagnosisPreset(
                'Active Labor at Term (Cephalic Presentation)',
                'O60.1',
                'Obstetrics & Gynecology',
                'MAT',
                2500
              )
            }
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 transition"
          >
            🤰 Maternity / Active Labor
          </button>
        </div>
      </div>

      {/* Main Admission Intake Form */}
      <form onSubmit={handleSubmitAdmission} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-indigo-600" />
            <span>Inpatient (IPD) Admission Desk & Bed Requisition</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Register hospital inpatient stays, allocate dedicated ward beds, record mandatory advance deposits, and generate bedside cards.
          </p>
        </div>

        {/* Source Switcher: Transfer from OPD or Direct Admission */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-700">Patient Intake Source:</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="patientSource"
                checked={patientSource === 'existing_opd'}
                onChange={() => setPatientSource('existing_opd')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Transfer Existing OPD Patient</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                name="patientSource"
                checked={patientSource === 'new_patient'}
                onChange={() => setPatientSource('new_patient')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Direct Inpatient Admission (Emergency / Transfer)</span>
            </label>
          </div>
        </div>

        {patientSource === 'existing_opd' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Patient from Today's OPD Visits
            </label>
            <select
              value={selectedVisitId}
              onChange={(e) => handleSelectOpdPatient(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
            >
              <option value="">-- Choose Patient Currently in Clinic --</option>
              {db.visits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.patientName} ({v.patientMrn}) • Queue #{v.queueNumber} - {v.department} ({v.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Patient Demographics */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            1. Patient Demographics & Record
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient MRN</label>
              <input
                type="text"
                placeholder="PAT-2026-..."
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+254 7..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-red-700"
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
        </div>

        {/* Section 2: Ward & Bed Allocation */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            2. Ward Placement & Bed Allocation
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admitting Ward *</label>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setSelectedWardId(e.target.value);
                  const firstFree = beds.find((b) => b.wardId === e.target.value && b.status === 'available');
                  if (firstFree) setSelectedBedId(firstFree.id);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) • {formatCurrency(w.ratePerDay, db.settings.currency)}/day
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bed Number *</label>
              <select
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-900"
              >
                <option value="">-- Choose Available Bed --</option>
                {availableBedsInWard.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bedNumber} ({b.type.toUpperCase()}) - {b.status.toUpperCase()} ({formatCurrency(b.dailyRate, db.settings.currency)}/night)
                  </option>
                ))}
              </select>
              {availableBedsInWard.length === 0 && (
                <span className="text-[11px] text-red-600 font-bold block mt-1">
                  ⚠️ No available beds in this ward! Please choose another ward or discharge a patient.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admission Type</label>
              <select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
              >
                <option value="Emergency">Emergency STAT Admission</option>
                <option value="Elective">Elective Planned Admission</option>
                <option value="Transfer">Inter-Hospital Transfer</option>
                <option value="Day Surgery">Day Surgery Observation</option>
                <option value="Maternity / Delivery">Maternity / Active Labor</option>
                <option value="ICU Critical">ICU Critical Care</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attending Consultant Doctor *</label>
              <select
                value={admittingDoctorId}
                onChange={(e) => setAdmittingDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} • {d.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Provisional Diagnosis & ICD-10 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Primary admitting diagnosis"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <input
                  type="text"
                  placeholder="ICU/ICD Code"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  className="w-28 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Advance Admission Deposit */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            3. IPD Advance Deposit & Financial Gate
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-indigo-900">Mandatory Initial Inpatient Deposit</div>
              <div className="flex flex-wrap gap-2">
                {[2000, 2500, 3000, 4000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialDeposit(amt)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                      initialDeposit === amt
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {formatCurrency(amt, db.settings.currency)}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={depositPaid}
                  onChange={(e) => setDepositPaid(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-800">
                  Admission deposit collected and verified at reception desk (Issues official IPD receipt)
                </span>
              </label>
            </div>

            <div className="text-right border-l md:border-l border-indigo-200 md:pl-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Deposit Amount</span>
              <span className="text-2xl font-black text-indigo-900">
                {formatCurrency(initialDeposit, db.settings.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Emergency Contact */}
        <div className="space-y-4 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
            4. Emergency Contact & Ward Admission Notes
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Full Name *</label>
              <input
                type="text"
                placeholder="Relative / Guardian"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="text"
                placeholder="+254 7..."
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
              <select
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent / Guardian</option>
                <option value="Child">Son / Daughter</option>
                <option value="Sibling">Brother / Sister</option>
                <option value="Other">Other Relative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions Submit */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Bed is automatically locked and marked OCCUPIED on all hospital nurse stations upon admission.</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-md hover:shadow-lg"
          >
            <BedDouble className="w-4 h-4" />
            <span>Admit Patient & Generate Inpatient Card</span>
          </button>
        </div>
      </form>
    </div>
  );
};
