import React, { useState, useEffect, useRef } from 'react';
import {
  DatabaseState,
  Role,
  User,
  WebSocketEvent,
  WorkstationConfig,
  ConcurrencyConflict,
} from './types/clinic';
import {
  loadDatabase,
  saveDatabase,
  clinicSocket,
  INITIAL_USERS,
  INITIAL_WORKSTATIONS,
  flushOfflineQueue,
} from './utils/storage';
import { Header } from './components/Header';
import { PrintModal, PrintContentType } from './components/PrintModal';
import { EmergencyOverrideModal } from './components/EmergencyOverrideModal';
import { WebSocketActivityDrawer } from './components/WebSocketActivityDrawer';
import { StatusExchangeBar } from './components/StatusExchangeBar';
import { PhaseRoadmapModal } from './components/PhaseRoadmapModal';
import { Phase1GuidedRunner } from './components/Phase1GuidedRunner';
import { Phase2GuidedRunner } from './components/Phase2GuidedRunner';
import { Phase3GuidedRunner } from './components/Phase3GuidedRunner';
import { ConcurrencyConflictModal } from './components/ConcurrencyConflictModal';
import { WorkstationSettingsModal } from './components/WorkstationSettingsModal';
import { EscPosThermalPreviewModal } from './components/EscPosThermalPreviewModal';
import { IdleLockModal } from './components/IdleLockModal';
import { OfflineSyncDrawer } from './components/OfflineSyncDrawer';
import { ConcurrencyChaosLabModal } from './components/ConcurrencyChaosLabModal';
import { generateEscPosReceiptJob, EscPosJob } from './utils/formatters';

import { CashierModule } from './modules/CashierModule';
import { DoctorModule } from './modules/DoctorModule';
import { NurseModule } from './modules/NurseModule';
import { LaboratoryModule } from './modules/LaboratoryModule';
import { PharmacyModule } from './modules/PharmacyModule';
import { UltrasoundModule } from './modules/UltrasoundModule';
import { XRayModule } from './modules/XRayModule';
import { PathologyModule } from './modules/PathologyModule';
import { AdminModule } from './modules/AdminModule';
import { WorkstationMeshModal } from './components/WorkstationMeshModal';
import { Radio, X, CheckCircle, AlertTriangle, Info, Barcode, ShieldAlert } from 'lucide-react';

interface ToastNotification {
  id: string;
  station: string;
  title: string;
  detail: string;
  type: 'success' | 'alert' | 'info';
}

export function App() {
  const [db, setDb] = useState<DatabaseState>(() => loadDatabase());
  const [currentRole, setCurrentRole] = useState<Role>('cashier');
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const defaultUser = INITIAL_USERS.find((u) => u.role === 'cashier') || INITIAL_USERS[0];
    return defaultUser;
  });

  // Multi-desktop workstation configuration
  const [currentWorkstation, setCurrentWorkstation] = useState<WorkstationConfig>(() => {
    return (
      (db.workstations && db.workstations[0]) ||
      INITIAL_WORKSTATIONS[0]
    );
  });

  // Network condition & offline buffering
  const [networkMode, setNetworkMode] = useState<'online' | 'intermittent' | 'offline'>('online');
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState<boolean>(false);
  const [isWsDrawerOpen, setIsWsDrawerOpen] = useState<boolean>(false);
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState<boolean>(false);
  const [isMeshModalOpen, setIsMeshModalOpen] = useState<boolean>(false);
  const [isChaosLabOpen, setIsChaosLabOpen] = useState<boolean>(false);

  // Security & Screen Lock state
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Optimistic locking conflict modal state
  const [concurrencyConflict, setConcurrencyConflict] = useState<ConcurrencyConflict | null>(null);

  // Thermal hardware preview modal state
  const [escPosJob, setEscPosJob] = useState<EscPosJob | null>(null);

  // Guided workflows & roadmap
  const [isRoadmapOpen, setIsRoadmapOpen] = useState<boolean>(false);
  const [isPhase1Active, setIsPhase1Active] = useState<boolean>(false);
  const [isPhase2Active, setIsPhase2Active] = useState<boolean>(false);
  const [isPhase3Active, setIsPhase3Active] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Print modal state
  const [printContent, setPrintContent] = useState<PrintContentType | null>(null);

  // Emergency override modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTargetDesc, setOverrideTargetDesc] = useState('');
  const [overrideConfirmCallback, setOverrideConfirmCallback] = useState<
    ((reason: string, authorizedBy: string) => void) | null
  >(null);

  // Scanner buffer for global HID wedge keystrokes
  const scanBufferRef = useRef<string>('');

  // Sync state to storage
  const handleUpdateDb = (updater: (prev: DatabaseState) => DatabaseState) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDatabase(next);
      return next;
    });
  };

  // Activity tracker for auto-idle screen lock (e.g. 5 minutes)
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    const idleInterval = setInterval(() => {
      const timeoutMs = (db.settings.sessionIdleTimeoutMinutes || 5) * 60 * 1000;
      if (Date.now() - lastActivityRef.current > timeoutMs && !isScreenLocked) {
        setIsScreenLocked(true);
      }
    }, 15000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(idleInterval);
    };
  }, [db.settings.sessionIdleTimeoutMinutes, isScreenLocked]);

  // Global Barcode & QR Scanner listener (detects quick keyboard wedge entry ending with Enter)
  useEffect(() => {
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (e.key === 'Enter') {
        const scanned = scanBufferRef.current.trim();
        scanBufferRef.current = '';
        if (scanned.length >= 6) {
          // Identify barcode type
          let detail = `Hardware Scanner captured: ${scanned}`;
          if (scanned.startsWith('PAT-')) detail = `Patient MRN [${scanned}] identified.`;
          else if (scanned.startsWith('VST-')) detail = `Visit Token [${scanned}] scanned at terminal.`;
          else if (scanned.startsWith('REC-')) detail = `Receipt [${scanned}] scanned for verification.`;

          const newToast: ToastNotification = {
            id: `scan_${Date.now()}`,
            station: currentWorkstation.name,
            title: 'Barcode / QR Scanned',
            detail,
            type: 'info',
          };
          setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
          clinicSocket.broadcast('WORKSTATION_PING', currentWorkstation.id, 'Barcode Scanned', detail);
        }
        return;
      }

      // If characters arrive rapidly (wedge scanner typical speed < 40ms)
      if (e.key.length === 1) {
        if (now - lastKeyTime > 250) {
          scanBufferRef.current = '';
        }
        scanBufferRef.current += e.key;
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWorkstation]);

  // Subscribe to central WebSocket events & multi-tab mesh
  useEffect(() => {
    const unsubscribe = clinicSocket.subscribe((event, updatedDb) => {
      setDb(updatedDb);

      // Add a floating toast notification for active station
      const newToast: ToastNotification = {
        id: event.id,
        station: event.station,
        title: event.title,
        detail: event.detail,
        type:
          event.eventType.includes('ALERT') || event.eventType.includes('OVERRIDE') || event.eventType.includes('CONFLICT')
            ? 'alert'
            : event.eventType.includes('PAID') || event.eventType.includes('DISPENSED') || event.eventType.includes('ISSUED')
            ? 'success'
            : 'info',
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  const openEmergencyOverride = (
    desc: string,
    onConfirm: (reason: string, authorizedBy: string) => void
  ) => {
    setOverrideTargetDesc(desc);
    setOverrideConfirmCallback(() => onConfirm);
    setOverrideModalOpen(true);
  };

  const handleBroadcast = (
    type: any,
    station: string,
    title: string,
    detail: string,
    payload?: any
  ) => {
    clinicSocket.broadcast(type, station, title, detail, payload);
  };

  // Re-synchronize offline buffer
  const handleForceSync = () => {
    const { updatedDb, syncedCount } = flushOfflineQueue(db, (evt) => {
      clinicSocket.broadcast(evt.eventType, evt.station, evt.title, evt.detail, evt.payload);
    });
    setDb(updatedDb);
    const toast: ToastNotification = {
      id: `sync_${Date.now()}`,
      station: 'Sync Engine',
      title: 'LAN Re-synchronization Complete',
      detail: `Replayed ${syncedCount} offline transaction(s) into SPEED central database.`,
      type: 'success',
    };
    setToasts((prev) => [toast, ...prev.slice(0, 4)]);
  };

  // Handler for thermal print preview
  const handleThermalPrintRequest = (content: PrintContentType) => {
    setPrintContent(content);

    // Also prepare ESC/POS thermal command job for inspection
    if (content.type === 'receipt') {
      const payment = content.data;
      const job = generateEscPosReceiptJob(
        db.settings.clinicName,
        payment.receiptNumber,
        payment.patientName,
        content.items || [{ name: `${payment.type.replace('_', ' ')} Settlement`, amount: payment.amount }],
        payment.amount,
        db.settings.currency || 'ETB',
        payment.receivedBy,
        currentWorkstation.printer.rollWidthMm || 80
      );
      setEscPosJob(job);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Clinic Header & Workstation Switcher */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        allUsers={db.users}
        settings={db.settings}
        isOnline={networkMode === 'online'}
        networkMode={networkMode}
        onOpenSyncDrawer={() => setIsSyncDrawerOpen(true)}
        onOpenWsDrawer={() => setIsWsDrawerOpen(true)}
        wsEventCount={db.webSocketEvents.length}
        offlineQueueDepth={db.offlineQueue?.length || 0}
        currentWorkstation={currentWorkstation}
        onOpenWorkstationSettings={() => setIsWorkstationModalOpen(true)}
        onLockScreen={() => setIsScreenLocked(true)}
        onOpenMeshDiagnostics={() => setIsMeshModalOpen(true)}
      />

      {/* Real-time Cross-Station Status Exchange HUD */}
      <StatusExchangeBar
        db={db}
        currentRole={currentRole}
        onSwitchWorkstation={(newRole) => {
          setCurrentRole(newRole);
          const u = db.users.find((user) => user.role === newRole);
          if (u) setCurrentUser(u);
        }}
        onOpenRoadmap={() => setIsRoadmapOpen(true)}
        onOpenChaosLab={() => setIsChaosLabOpen(true)}
        isPhase1Active={isPhase1Active}
        onTogglePhase1Guide={() => {
          setIsPhase1Active(!isPhase1Active);
          if (!isPhase1Active) {
            setIsPhase2Active(false);
            setIsPhase3Active(false);
          }
        }}
        isPhase2Active={isPhase2Active}
        onTogglePhase2Guide={() => {
          setIsPhase2Active(!isPhase2Active);
          if (!isPhase2Active) {
            setIsPhase1Active(false);
            setIsPhase3Active(false);
          }
        }}
        isPhase3Active={isPhase3Active}
        onTogglePhase3Guide={() => {
          setIsPhase3Active(!isPhase3Active);
          if (!isPhase3Active) {
            setIsPhase1Active(false);
            setIsPhase2Active(false);
          }
        }}
      />

      {/* Network Alert Banner if Intermittent or Severed */}
      {networkMode !== 'online' && (
        <div
          className={`${
            networkMode === 'intermittent' ? 'bg-amber-600' : 'bg-red-700'
          } text-white text-xs px-4 py-2 font-bold flex justify-between items-center animate-pulse shadow-md`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>
              {networkMode === 'intermittent'
                ? 'INTERMITTENT LAN CONNECTION: Packet loss detected on local switch. Operations safely buffering.'
                : 'LAN SEVERED: Offline transaction buffer active. Actions recorded in local encrypted storage.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSyncDrawerOpen(true)}
              className="px-2 py-0.5 bg-black/30 hover:bg-black/40 text-white rounded text-[11px] underline"
            >
              Inspect Buffer ({db.offlineQueue?.length || 0})
            </button>
            <button
              onClick={() => {
                setNetworkMode('online');
                handleForceSync();
              }}
              className="px-2.5 py-0.5 bg-white text-slate-900 font-bold rounded text-[11px] hover:bg-slate-100"
            >
              Restore & Sync
            </button>
          </div>
        </div>
      )}

      {/* Phase 1 Live Interactive Guided Workflow Runner */}
      {isPhase1Active && (
        <Phase1GuidedRunner
          db={db}
          onUpdateDb={handleUpdateDb}
          currentRole={currentRole}
          onSwitchWorkstation={(newRole) => {
            setCurrentRole(newRole);
            const u = db.users.find((user) => user.role === newRole);
            if (u) setCurrentUser(u);
          }}
          onPrint={(content) => handleThermalPrintRequest(content)}
          broadcast={handleBroadcast}
          onClose={() => setIsPhase1Active(false)}
        />
      )}

      {/* Phase 2 Clinical Depth, Diagnostic Panels & MAR Runner */}
      {isPhase2Active && (
        <Phase2GuidedRunner
          db={db}
          onUpdateDb={handleUpdateDb}
          currentRole={currentRole}
          onSwitchWorkstation={(newRole) => {
            setCurrentRole(newRole);
            const u = db.users.find((user) => user.role === newRole);
            if (u) setCurrentUser(u);
          }}
          onPrint={(content) => handleThermalPrintRequest(content)}
          broadcast={handleBroadcast}
          onClose={() => setIsPhase2Active(false)}
        />
      )}

      {/* Phase 3 Executive Financial Audit, Reconciliation & LAN Resilience Runner */}
      {isPhase3Active && (
        <Phase3GuidedRunner
          db={db}
          onUpdateDb={handleUpdateDb}
          currentRole={currentRole}
          onSwitchWorkstation={(newRole) => {
            setCurrentRole(newRole);
            const u = db.users.find((user) => user.role === newRole);
            if (u) setCurrentUser(u);
          }}
          onPrint={(content) => handleThermalPrintRequest(content)}
          broadcast={handleBroadcast}
          isOnline={networkMode === 'online'}
          onToggleOnline={() => setNetworkMode(networkMode === 'online' ? 'offline' : 'online')}
          onClose={() => setIsPhase3Active(false)}
        />
      )}

      {/* Main Workstation Screen View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentRole === 'cashier' && (
          <CashierModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            onOpenOverride={openEmergencyOverride}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'doctor' && (
          <DoctorModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'nurse' && (
          <NurseModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'laboratory' && (
          <LaboratoryModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            onOpenOverride={openEmergencyOverride}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'pharmacy' && (
          <PharmacyModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            onOpenOverride={openEmergencyOverride}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'ultrasound' && (
          <UltrasoundModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            onOpenOverride={openEmergencyOverride}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'xray' && (
          <XRayModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'pathology' && (
          <PathologyModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            onPrint={(content) => handleThermalPrintRequest(content)}
            broadcast={handleBroadcast}
          />
        )}

        {currentRole === 'admin' && (
          <AdminModule
            db={db}
            onUpdateDb={handleUpdateDb}
            currentUser={currentUser}
            broadcast={handleBroadcast}
            onPrint={(content) => handleThermalPrintRequest(content)}
          />
        )}
      </main>

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed bottom-4 left-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl shadow-xl border text-xs flex items-start gap-2.5 animate-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'alert'
                ? 'bg-red-950/95 text-red-100 border-red-800'
                : toast.type === 'success'
                ? 'bg-slate-900/95 text-white border-emerald-500/40'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400" />}
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'info' && <Radio className="w-4 h-4 text-teal-400 animate-pulse" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-teal-300 text-[11px] uppercase tracking-wider">
                  [{toast.station}] {toast.title}
                </span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Printable Thermal Slip Modal */}
      <PrintModal
        content={printContent}
        onClose={() => setPrintContent(null)}
      />

      {/* Raw ESC/POS Thermal Command Preview Modal */}
      <EscPosThermalPreviewModal
        job={escPosJob}
        onClose={() => setEscPosJob(null)}
        onSendToHardware={() => {
          clinicSocket.broadcast(
            'PRINTER_SPOOL_UPDATE',
            currentWorkstation.id,
            'Job Sent to ESC/POS Printer',
            `Raw ESC/POS slip dispatched to ${currentWorkstation.printer.name} (${currentWorkstation.printer.targetAddress}).`
          );
        }}
      />

      {/* Concurrency Conflict (409) Resolution Dialog */}
      <ConcurrencyConflictModal
        conflict={concurrencyConflict}
        onClose={() => setConcurrencyConflict(null)}
        onReloadLatest={() => {
          setDb(loadDatabase());
          setConcurrencyConflict(null);
        }}
      />

      {/* Workstation Hardware Mapping & Identity Modal */}
      <WorkstationSettingsModal
        isOpen={isWorkstationModalOpen}
        onClose={() => setIsWorkstationModalOpen(false)}
        currentWorkstation={currentWorkstation}
        allWorkstations={db.workstations || INITIAL_WORKSTATIONS}
        onSaveWorkstation={(updated) => {
          setCurrentWorkstation(updated);
          handleUpdateDb((prev) => ({
            ...prev,
            workstations: (prev.workstations || []).map((w) =>
              w.id === updated.id ? updated : w
            ),
          }));
        }}
        onSwitchWorkstation={(stationId) => {
          const matching = (db.workstations || INITIAL_WORKSTATIONS).find((w) => w.id === stationId);
          if (matching) {
            setCurrentWorkstation(matching);
            setCurrentRole(matching.role);
            const user = db.users.find((u) => u.id === matching.assignedOperatorId) || db.users.find((u) => u.role === matching.role);
            if (user) setCurrentUser(user);
          }
        }}
        onTestPrint={(printerName) => {
          const testJob = generateEscPosReceiptJob(
            db.settings.clinicName,
            'TEST-ALIGN-001',
            'Hardware Self-Test',
            [
              { name: 'Self-Test Print Line', amount: 0 },
              { name: 'LAN Socket 9100 Verified', amount: 0 },
            ],
            0,
            db.settings.currency,
            currentUser.name,
            currentWorkstation.printer.rollWidthMm || 80
          );
          setEscPosJob(testJob);
        }}
        onTestDrawerKick={() => {
          clinicSocket.broadcast(
            'PRINTER_SPOOL_UPDATE',
            currentWorkstation.id,
            'Cash Drawer Pulse Dispatched',
            'ESC p 0 25 250 command pulsed to cash drawer.'
          );
          alert('Cash drawer solenoid pulse sent (ESC p 0 25 250).');
        }}
      />

      {/* Offline Sync & Network Simulation Drawer */}
      <OfflineSyncDrawer
        isOpen={isSyncDrawerOpen}
        onClose={() => setIsSyncDrawerOpen(false)}
        isOnline={networkMode === 'online'}
        networkMode={networkMode}
        onSetNetworkMode={setNetworkMode}
        offlineQueue={db.offlineQueue || []}
        onForceSync={handleForceSync}
        onClearQueue={() => {
          handleUpdateDb((prev) => ({ ...prev, offlineQueue: [] }));
        }}
      />

      {/* Screen Idle Lock Screen */}
      <IdleLockModal
        isLocked={isScreenLocked}
        currentUser={currentUser}
        onUnlock={() => {
          setIsScreenLocked(false);
          lastActivityRef.current = Date.now();
        }}
      />

      {/* Manager Emergency Override PIN Modal */}
      <EmergencyOverrideModal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        targetDescription={overrideTargetDesc}
        settings={db.settings}
        currentUser={currentUser}
        onConfirmOverride={(reason, authorizedBy) => {
          if (overrideConfirmCallback) {
            overrideConfirmCallback(reason, authorizedBy);
          }
        }}
      />

      {/* WebSocket Real-time Activity Drawer */}
      <WebSocketActivityDrawer
        isOpen={isWsDrawerOpen}
        onClose={() => setIsWsDrawerOpen(false)}
        events={db.webSocketEvents}
        onClearEvents={() => {
          handleUpdateDb((prev) => ({ ...prev, webSocketEvents: [] }));
        }}
        serverIp={db.settings.serverIp}
      />

      {/* Phased Architecture & Guided Roadmap Modal */}
      <PhaseRoadmapModal
        isOpen={isRoadmapOpen}
        onClose={() => setIsRoadmapOpen(false)}
        onSwitchWorkstation={(newRole) => {
          setCurrentRole(newRole);
          const u = db.users.find((user) => user.role === newRole);
          if (u) setCurrentUser(u);
        }}
        onStartPhase1Workflow={() => {
          setIsPhase1Active(true);
          setIsPhase2Active(false);
          setIsPhase3Active(false);
          setCurrentRole('cashier');
          const u = db.users.find((user) => user.role === 'cashier');
          if (u) setCurrentUser(u);
        }}
        onStartPhase2Workflow={() => {
          setIsPhase2Active(true);
          setIsPhase1Active(false);
          setIsPhase3Active(false);
          setCurrentRole('nurse');
          const u = db.users.find((user) => user.role === 'nurse');
          if (u) setCurrentUser(u);
        }}
        onStartPhase3Workflow={() => {
          setIsPhase3Active(true);
          setIsPhase1Active(false);
          setIsPhase2Active(false);
          setCurrentRole('admin');
          const u = db.users.find((user) => user.role === 'admin');
          if (u) setCurrentUser(u);
        }}
      />

      {/* Interactive Concurrency Chaos & Diagnostics Lab Modal */}
      <ConcurrencyChaosLabModal
        isOpen={isChaosLabOpen}
        onClose={() => setIsChaosLabOpen(false)}
        db={db}
        onUpdateDb={handleUpdateDb}
        onTriggerConflict={(conflict) => setConcurrencyConflict(conflict)}
        broadcast={handleBroadcast}
        onSetNetworkMode={setNetworkMode}
      />

      {/* Multi-PC Connection & LAN Mesh Diagnostic Modal */}
      <WorkstationMeshModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        db={db}
        onUpdateDb={handleUpdateDb}
        currentWorkstation={currentWorkstation}
        onSwitchWorkstation={(wsId) => {
          const targetWs = db.workstations.find((w) => w.id === wsId);
          if (targetWs) {
            setCurrentWorkstation(targetWs);
            setCurrentRole(targetWs.role);
            const userForWs = db.users.find((u) => u.id === targetWs.assignedOperatorId) ||
              db.users.find((u) => u.role === targetWs.role);
            if (userForWs) setCurrentUser(userForWs);
          }
        }}
      />
    </div>
  );
}

export default App;
