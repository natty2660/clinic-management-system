import React, { useState } from 'react';
import {
  Laptop,
  Printer,
  Barcode,
  CheckCircle2,
  X,
  Save,
  Wifi,
  Radio,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { WorkstationConfig, ClinicSettings } from '../types/clinic';

interface WorkstationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkstation: WorkstationConfig;
  allWorkstations: WorkstationConfig[];
  onSaveWorkstation: (updated: WorkstationConfig) => void;
  onSwitchWorkstation: (stationId: string) => void;
  onTestPrint: (printerName: string) => void;
  onTestDrawerKick: () => void;
}

export const WorkstationSettingsModal: React.FC<WorkstationSettingsModalProps> = ({
  isOpen,
  onClose,
  currentWorkstation,
  allWorkstations,
  onSaveWorkstation,
  onSwitchWorkstation,
  onTestPrint,
  onTestDrawerKick,
}) => {
  const [config, setConfig] = useState<WorkstationConfig>(currentWorkstation);
  const [testScanInput, setTestScanInput] = useState('');
  const [scannerResult, setScannerResult] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  React.useEffect(() => {
    setConfig(currentWorkstation);
  }, [currentWorkstation]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveWorkstation(config);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const handleSimulateScan = (code: string) => {
    setScannerResult(`Scanned Code: ${code} (Type: ${code.substring(0, 3)})`);
    setTestScanInput(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>SPEED Workstation & Hardware Mapping</span>
                <span className="text-[10px] bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded-full border border-teal-700/50 font-mono">
                  {config.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure terminal identity, ESC/POS thermal printer, cash drawer, and barcode scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Quick Switch Workstation */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
            <label className="text-slate-300 font-bold block">
              Active Terminal Switcher (Multi-Desktop Fleet):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {allWorkstations.map((st) => (
                <button
                  key={st.id}
                  onClick={() => onSwitchWorkstation(st.id)}
                  className={`p-2 rounded-lg text-left border transition ${
                    st.id === config.id
                      ? 'bg-teal-500/20 border-teal-500 text-teal-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-mono text-[10px] text-slate-400 truncate">{st.id}</div>
                  <div className="text-xs truncate">{st.name}</div>
                  <div className="text-[10px] text-teal-400 capitalize">{st.role} • {st.roomOrCounter}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Workstation Identity */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Sliders className="w-4 h-4 text-teal-400" />
              <span>Terminal Identification</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Workstation ID</label>
                <input
                  type="text"
                  value={config.id}
                  onChange={(e) => setConfig({ ...config, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Friendly Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Room / Counter</label>
                <input
                  type="text"
                  value={config.roomOrCounter}
                  onChange={(e) => setConfig({ ...config, roomOrCounter: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* ESC/POS Thermal Printer Mapping */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>ESC/POS Thermal Receipt & Slip Printer</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Printer Model Name</label>
                <input
                  type="text"
                  value={config.printer.name}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      printer: { ...config.printer, name: e.target.value },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Address (IP:Port or COM)</label>
                <input
                  type="text"
                  value={config.printer.targetAddress}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      printer: { ...config.printer, targetAddress: e.target.value },
                    })
                  }
                  placeholder="192.168.1.201:9100 or COM3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Roll Width</label>
                <select
                  value={config.printer.rollWidthMm}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      printer: {
                        ...config.printer,
                        rollWidthMm: Number(e.target.value) as 80 | 58,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                >
                  <option value="80">80mm (Standard 48 cols)</option>
                  <option value="58">58mm (Compact 32 cols)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Auto-Cut Paper</label>
                <select
                  value={config.printer.autoCut ? 'true' : 'false'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      printer: { ...config.printer, autoCut: e.target.value === 'true' },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                >
                  <option value="true">Enabled (GS V)</option>
                  <option value="false">Disabled (Manual Tear)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cash Drawer Pulse</label>
                <select
                  value={config.printer.cashDrawerKick ? 'true' : 'false'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      printer: {
                        ...config.printer,
                        cashDrawerKick: e.target.value === 'true',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                >
                  <option value="true">Kick on Payment (ESC p)</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="flex flex-col justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onTestPrint(config.printer.name)}
                  className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" /> Test Print Slip
                </button>
                {config.printer.cashDrawerKick && (
                  <button
                    type="button"
                    onClick={onTestDrawerKick}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold transition"
                  >
                    Kick Drawer Test
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Barcode & QR Scanner Integration */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-1">
              <Barcode className="w-4 h-4 text-purple-400" />
              <span>Barcode / QR Scanner Integration</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Scanner Connection Mode</label>
                <select
                  value={config.scanner.mode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      scanner: {
                        ...config.scanner,
                        mode: e.target.value as 'hid_keyboard' | 'serial_com',
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                >
                  <option value="hid_keyboard">USB HID Keyboard Wedge (Prefix/Suffix)</option>
                  <option value="serial_com">Virtual Serial COM Port (STX/ETX)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Test Scanner Wedge Input</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testScanInput}
                    onChange={(e) => setTestScanInput(e.target.value)}
                    placeholder="Scan PAT-..., VST-..., LAB-..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateScan('PAT-2026-0042')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold"
                  >
                    Simulate
                  </button>
                </div>
                {scannerResult && (
                  <div className="text-[11px] text-teal-400 font-mono mt-1">{scannerResult}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isSavedNotice && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Workstation settings saved to local hardware profile
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Apply & Save Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
