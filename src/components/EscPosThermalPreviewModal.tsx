import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Binary,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Scissors,
  DollarSign,
  Download,
} from 'lucide-react';
import { EscPosJob } from '../utils/formatters';

interface EscPosThermalPreviewModalProps {
  job: EscPosJob | null;
  onClose: () => void;
  onSendToHardware: () => void;
}

export const EscPosThermalPreviewModal: React.FC<EscPosThermalPreviewModalProps> = ({
  job,
  onClose,
  onSendToHardware,
}) => {
  const [viewMode, setViewMode] = useState<'paper' | 'commands' | 'hex'>('paper');
  const [isSent, setIsSent] = useState(false);

  if (!job) return null;

  const handlePrint = () => {
    setIsSent(true);
    onSendToHardware();
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>ESC/POS Thermal Hardware Output</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {job.widthMm}mm ({job.widthMm === 80 ? '48 cols' : '32 cols'})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct raw socket dispatch to thermal receipt printer (Port 9100)
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

        {/* View Mode Tabs */}
        <div className="bg-slate-950/60 px-6 pt-2 border-b border-slate-800 flex gap-2 text-xs">
          <button
            onClick={() => setViewMode('paper')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              viewMode === 'paper'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Thermal Paper Slip</span>
          </button>
          <button
            onClick={() => setViewMode('commands')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              viewMode === 'commands'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ESC/POS Commands</span>
          </button>
          <button
            onClick={() => setViewMode('hex')}
            className={`px-3 py-1.5 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              viewMode === 'hex'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Raw Hex Byte Dump</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
          {viewMode === 'paper' && (
            <div className="flex justify-center">
              {/* Thermal paper presentation */}
              <div
                className={`bg-white text-slate-950 font-mono text-xs p-6 shadow-2xl rounded-sm border-t-8 border-slate-300 relative ${
                  job.widthMm === 80 ? 'max-w-[340px] w-full' : 'max-w-[260px] w-full'
                }`}
              >
                {/* Paper tear visual */}
                <div className="absolute -top-3 left-0 right-0 h-3 flex justify-between overflow-hidden opacity-60">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white"
                    />
                  ))}
                </div>

                <pre className="whitespace-pre font-mono text-[11px] leading-tight select-text text-slate-900">
                  {job.rawText}
                </pre>

                {/* Bottom tear */}
                <div className="mt-4 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>[PAPER CUT: GS V 66 0]</span>
                  <span>[DRAWER KICK: ESC p]</span>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'commands' && (
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 text-[11px]">
                Sequential binary control sequence executed on thermal controller:
              </div>
              <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
                {job.commandBreakdown.map((cmd, idx) => (
                  <div key={idx} className="flex items-start gap-2 py-0.5 border-b border-slate-900 last:border-none">
                    <span className="text-slate-600 w-6 text-right">#{idx + 1}</span>
                    <span className="text-emerald-400">{cmd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'hex' && (
            <div className="space-y-2 text-xs">
              <div className="text-slate-400 text-[11px]">
                Direct byte payload stream (CP437 / UTF-8):
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto leading-relaxed max-h-80">
                <pre>{job.hexDump}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span>Automatic paper cutter enabled • Fallback spooler active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={isSent}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{isSent ? 'Dispatched to Hardware...' : 'Send to ESC/POS Printer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
