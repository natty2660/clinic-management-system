import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Clock,
  Shield,
  Stethoscope,
  Receipt,
  FlaskConical,
  Pill,
  HeartPulse,
  Settings,
  ChevronDown,
  UserCheck,
  Lock,
  Printer,
  Coins,
  Sliders,
  ScanLine,
  Microscope,
  Zap,
} from 'lucide-react';
import { Role, User, ClinicSettings, WorkstationConfig } from '../types/clinic';
import { clinicAudio } from '../utils/audio';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (newRole: Role) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  allUsers: User[];
  settings: ClinicSettings;
  isOnline: boolean;
  networkMode: 'online' | 'intermittent' | 'offline';
  onOpenSyncDrawer: () => void;
  onOpenWsDrawer: () => void;
  wsEventCount: number;
  offlineQueueDepth: number;
  currentWorkstation?: WorkstationConfig;
  onOpenWorkstationSettings: () => void;
  onLockScreen: () => void;
  onOpenMeshDiagnostics?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onUserChange,
  allUsers,
  settings,
  isOnline,
  networkMode,
  onOpenSyncDrawer,
  onOpenWsDrawer,
  wsEventCount,
  offlineQueueDepth,
  currentWorkstation,
  onOpenWorkstationSettings,
  onLockScreen,
  onOpenMeshDiagnostics,
}) => {
  const [time, setTime] = useState<string>('');
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    clinicAudio.setSoundEnabled(next);
  };

  const workstations: {
    role: Role;
    label: string;
    stationName: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: 'cashier',
      label: 'Reception',
      stationName: 'SPEED Reception Desk',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      role: 'doctor',
      label: 'Doctor',
      stationName: 'SPEED OPD & Doctor',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      role: 'nurse',
      label: 'Nurse',
      stationName: 'SPEED Triage & Nurse',
      icon: <HeartPulse className="w-4 h-4" />,
    },
    {
      role: 'laboratory',
      label: 'Laboratory',
      stationName: 'SPEED Laboratory',
      icon: <FlaskConical className="w-4 h-4" />,
    },
    {
      role: 'pharmacy',
      label: 'Pharmacy',
      stationName: 'SPEED Pharmacy',
      icon: <Pill className="w-4 h-4" />,
    },
    {
      role: 'ultrasound',
      label: 'Ultrasound',
      stationName: 'SPEED Ultrasound Suite',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      role: 'xray',
      label: 'X-Ray',
      stationName: 'SPEED Digital X-Ray',
      icon: <ScanLine className="w-4 h-4" />,
    },
    {
      role: 'pathology',
      label: 'Pathology',
      stationName: 'SPEED Histopathology',
      icon: <Microscope className="w-4 h-4" />,
    },
    {
      role: 'admin',
      label: 'Admin',
      stationName: 'SPEED Admin',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Top Meta Bar */}
      <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap justify-between items-center text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Clinic Brand */}
          <div className="flex items-center gap-1.5 text-teal-400 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            <span>{settings.clinicName}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Currency Badge - Exclusively Ethiopian Birr (ETB) */}
          <div className="flex items-center gap-1 font-mono text-[11px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/70 font-bold">
            <Coins className="w-3 h-3 text-emerald-400" />
            <span>ETB (Ethiopian Birr / Br)</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Active Terminal ID & Hardware Mapping */}
          <button
            onClick={onOpenWorkstationSettings}
            className="flex items-center gap-1 font-mono text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition"
            title="Configure Active Desktop Workstation ID & Printer Mapping"
          >
            <Laptop className="w-3 h-3 text-teal-400" />
            <span className="font-bold">{currentWorkstation?.id || settings.activeWorkstationId || 'SPEED-WS-01'}</span>
            <span className="text-slate-500 hidden md:inline">({currentWorkstation?.roomOrCounter || 'Counter 1'})</span>
            <Sliders className="w-3 h-3 ml-0.5 text-slate-400" />
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* LAN Mesh Zero-Lag Status Indicator & Connection Diagnostics */}
          <button
            onClick={onOpenMeshDiagnostics}
            className="flex items-center gap-1.5 font-mono text-[11px] bg-teal-950/80 hover:bg-teal-900 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-700/60 font-bold transition shadow-xs"
            title="Check Connection Between All PCs & Latency Diagnostics"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
            <Zap className="w-3 h-3 text-teal-400" />
            <span>LAN Mesh: 0ms (9 PCs Connected)</span>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Network online/offline status & buffer indicator */}
          <button
            onClick={onOpenSyncDrawer}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium text-[11px] transition cursor-pointer ${
              networkMode === 'online'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : networkMode === 'intermittent'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse'
                : 'bg-red-950/80 text-red-300 border border-red-800 animate-pulse'
            }`}
            title="Click to view offline transaction buffer and simulate network conditions"
          >
            {networkMode === 'online' ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-400" />
            )}
            <span>
              {networkMode === 'online'
                ? 'LAN Online (TLS 1ms)'
                : networkMode === 'intermittent'
                ? 'Intermittent LAN'
                : 'LAN Severed'}
            </span>
            {offlineQueueDepth > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 rounded-full">
                {offlineQueueDepth}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="text-slate-400 hover:text-white transition p-1"
            title={isSoundOn ? 'Audio chime enabled' : 'Muted'}
          >
            {isSoundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Live WS Drawer button */}
          <button
            onClick={onOpenWsDrawer}
            className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition text-[11px]"
            title="View Real-Time Multi-User LAN Event Stream"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">LAN Bus</span>
            <span className="bg-teal-600 text-white font-mono text-[10px] px-1.5 rounded-full">
              {wsEventCount}
            </span>
          </button>

          {/* Station Screen Lock */}
          <button
            onClick={onLockScreen}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] transition"
            title="Lock terminal screen immediately (PIN required to unlock)"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          {/* Clock */}
          <div className="flex items-center gap-1 font-mono text-slate-300 hidden md:flex">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Main Workstation Navigation Bar */}
      <div className="px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Workstation Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:inline mr-1">
            SPEED Modules:
          </span>
          {workstations.map((st) => {
            const isActive = currentRole === st.role;
            return (
              <button
                key={st.role}
                onClick={() => {
                  onRoleChange(st.role);
                  const matchingUser = allUsers.find((u) => u.role === st.role);
                  if (matchingUser) {
                    onUserChange(matchingUser);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-bold scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{st.icon}</span>
                <span>{st.stationName}</span>
              </button>
            );
          })}
        </div>

        {/* Current Operator Profile */}
        <div className="relative flex items-center gap-2">
          <div
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition border border-slate-700"
          >
            <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-teal-400 capitalize">
                {currentUser.role} • {currentUser.department}
              </div>
            </div>
          </div>

          {/* User selector dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 top-12 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Switch Staff Operator
              </div>
              <div className="space-y-1 mt-1 max-h-72 overflow-y-auto">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onUserChange(u);
                      onRoleChange(u.role);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                      currentUser.id === u.id
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {u.role} ({u.department})
                      </div>
                    </div>
                    {currentUser.id === u.id && (
                      <UserCheck className="w-4 h-4 text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
