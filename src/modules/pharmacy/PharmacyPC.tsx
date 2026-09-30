import React, { useState, useMemo, useEffect } from 'react';
import {
  DatabaseState,
  User as ClinicUser,
  Prescription,
  Medicine,
} from '../../types/clinic';
import { PrintContentType } from '../../components/PrintModal';
import { getBatchExpiryStatus } from '../../utils/formatters';
import { PharmacyMainTab, PharmacyStats } from './types';
import { PharmacyHeader } from './PharmacyHeader';
import { OpdDispensingTab } from './OpdDispensingTab';
import { InpatientDispensingTab } from './InpatientDispensingTab';
import { FormularyInventoryTab } from './FormularyInventoryTab';
import { StockInGrnTab } from './StockInGrnTab';
import { StockMovementsTab } from './StockMovementsTab';
import { ControlledDrugsTab } from './ControlledDrugsTab';
import { ClinicalReviewTab } from './ClinicalReviewTab';
import { RegisterMedicineModal } from './RegisterMedicineModal';

interface PharmacyPCProps {
  db: DatabaseState;
  onUpdateDb: (updater: (prev: DatabaseState) => DatabaseState) => void;
  currentUser: ClinicUser;
  onPrint: (content: PrintContentType) => void;
  onOpenOverride: (desc: string, onConfirm: (reason: string, authorizedBy: string) => void) => void;
  broadcast: (type: any, station: string, title: string, detail: string, payload?: any) => void;
}

export const PharmacyPC: React.FC<PharmacyPCProps> = ({
  db,
  onUpdateDb,
  currentUser,
  onPrint,
  onOpenOverride,
  broadcast,
}) => {
  const [activeTab, setActiveTab] = useState<PharmacyMainTab>('opd_dispensing');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRxId, setSelectedRxId] = useState<string>(
    db.prescriptions[0]?.id || ''
  );
  const [preselectedMedId, setPreselectedMedId] = useState<string | undefined>(undefined);
  const [reviewPatientId, setReviewPatientId] = useState<string | undefined>(undefined);
  const [reviewVisitId, setReviewVisitId] = useState<string | undefined>(undefined);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Compute live Pharmacy stats
  const stats: PharmacyStats = useMemo(() => {
    const totalPrescriptions = db.prescriptions.length;
    const pendingDispense = db.prescriptions.filter((p) => p.status !== 'dispensed').length;
    const paidReady = db.prescriptions.filter(
      (p) => (p.paymentStatus === 'paid' || p.paymentStatus === 'overridden') && p.status !== 'dispensed'
    ).length;
    const unpaidBlocked = db.prescriptions.filter(
      (p) => p.paymentStatus !== 'paid' && p.paymentStatus !== 'overridden' && p.status !== 'dispensed'
    ).length;
    const dispensedToday = db.prescriptions.filter((p) => p.status === 'dispensed').length;

    const totalMedicines = db.medicines.length;

    let lowStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;

    db.medicines.forEach((med) => {
      const totalUnits = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalUnits <= med.reorderLevel) {
        lowStockCount++;
      }

      med.batches.forEach((b) => {
        const exp = getBatchExpiryStatus(b.expiryDate, db.settings.expiryWarningDays);
        if (exp.status === 'expiring_soon') expiringSoonCount++;
        if (exp.status === 'expired') expiredCount++;
      });
    });

    const inpatientOrdersCount = (db.admissions || []).filter((a) => a.status === 'admitted').length;

    const controlledDrugsCount = db.medicines.filter((m) => {
      const n = m.name.toLowerCase();
      const c = m.category.toLowerCase();
      return (
        n.includes('morphine') ||
        n.includes('tramadol') ||
        n.includes('pethidine') ||
        n.includes('diazepam') ||
        n.includes('ketamine') ||
        c.includes('narcotic') ||
        c.includes('controlled')
      );
    }).length;

    return {
      totalPrescriptions,
      pendingDispense,
      paidReady,
      unpaidBlocked,
      dispensedToday,
      totalMedicines,
      lowStockCount,
      expiringSoonCount,
      expiredCount,
      inpatientOrdersCount,
      controlledDrugsCount,
    };
  }, [db.prescriptions, db.medicines, db.admissions, db.settings.expiryWarningDays]);

  // Jump from OPD/Inpatient to Patient Clinical Chart
  const handleJumpToClinicalReview = (patientId: string, visitId?: string) => {
    setReviewPatientId(patientId);
    setReviewVisitId(visitId);
    setActiveTab('clinical_review');
  };

  // Jump from Formulary to Stock In (GRN)
  const handleSelectMedForStockIn = (medId: string) => {
    setPreselectedMedId(medId);
    setActiveTab('stock_in_grn');
  };

  return (
    <div className="space-y-6">
      {/* Workstation Header */}
      <PharmacyHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        stats={stats}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenRegisterMedicine={() => setShowRegisterModal(true)}
        onOpenQuickStockIn={() => {
          setPreselectedMedId(undefined);
          setActiveTab('stock_in_grn');
        }}
      />

      {/* Main Tab Rendering */}
      <div>
        {activeTab === 'opd_dispensing' && (
          <OpdDispensingTab
            db={db}
            onUpdateDb={onUpdateDb}
            currentUser={currentUser}
            onPrint={onPrint}
            onOpenOverride={onOpenOverride}
            broadcast={broadcast}
            selectedRxId={selectedRxId}
            onSelectRxId={setSelectedRxId}
            onJumpToClinicalReview={handleJumpToClinicalReview}
          />
        )}

        {activeTab === 'inpatient_dispensing' && (
          <InpatientDispensingTab
            db={db}
            onUpdateDb={onUpdateDb}
            currentUser={currentUser}
            onPrint={onPrint}
            broadcast={broadcast}
            onJumpToClinicalReview={handleJumpToClinicalReview}
          />
        )}

        {activeTab === 'inventory_formulary' && (
          <FormularyInventoryTab
            db={db}
            onUpdateDb={onUpdateDb}
            currentUser={currentUser}
            broadcast={broadcast}
            onSelectMedForStockIn={handleSelectMedForStockIn}
          />
        )}

        {activeTab === 'stock_in_grn' && (
          <StockInGrnTab
            db={db}
            onUpdateDb={onUpdateDb}
            currentUser={currentUser}
            broadcast={broadcast}
            preselectedMedId={preselectedMedId}
          />
        )}

        {activeTab === 'stock_movements' && (
          <StockMovementsTab db={db} />
        )}

        {activeTab === 'controlled_drugs' && (
          <ControlledDrugsTab
            db={db}
            currentUser={currentUser}
            onUpdateDb={onUpdateDb}
            broadcast={broadcast}
          />
        )}

        {activeTab === 'clinical_review' && (
          <ClinicalReviewTab
            db={db}
            onUpdateDb={onUpdateDb}
            currentUser={currentUser}
            onPrint={onPrint}
            broadcast={broadcast}
            selectedPatientId={reviewPatientId || (db.patients[0]?.id || '')}
            selectedVisitId={reviewVisitId}
            onSelectPatient={setReviewPatientId}
          />
        )}
      </div>

      {/* Global Register Medicine Modal from Header */}
      <RegisterMedicineModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        db={db}
        onUpdateDb={onUpdateDb}
        currentUser={currentUser}
        broadcast={broadcast}
        onSuccess={() => {
          setActiveTab('inventory_formulary');
        }}
      />
    </div>
  );
};
