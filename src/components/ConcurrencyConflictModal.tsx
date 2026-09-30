import React from 'react';
import { AlertTriangle, X, RefreshCw, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ConcurrencyConflict } from '../types/clinic';
import { formatDateTime } from '../utils/formatters';

interface ConcurrencyConflictModalProps {
  conflict: ConcurrencyConflict | null;
  onClose: () => void;
  onReloadLatest: () => void;
  onForceOverwrite?: () => void;
}

export const ConcurrencyConflictModal: React.FC<ConcurrencyConflictModalProps> = ({
  conflict,
  onClose,
  onReloadLatest,
  onForceOverwrite,
}) => {
  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl max-w-xl w-full text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-950/40 border-b border-amber-600/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-300 flex items-center gap-2">
                <span>Optimistic Concurrency Conflict (409)</span>
              </h3>
              <p className="text-xs text-amber-200/80">
                Simultaneous modification detected on {conflict.recordIdentifier || conflict.entityId}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
            <p className="text-slate-300 leading-relaxed">
              Another workstation on the clinic LAN modified this record while you were editing. To prevent data corruption or duplicate financial charging, your change was paused.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block">Your Workstation Draft:</span>
                <span className="font-bold text-slate-300">Version {conflict.clientVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Remote Database Version:</span>
                <span className="font-bold text-amber-400">
                  Version {conflict.serverVersion} (by {conflict.serverUpdatedBy || 'Staff'} at {conflict.serverStationId || 'Another PC'})
                </span>
              </div>
            </div>
            {conflict.serverUpdatedAt && (
              <div className="text-[10px] text-slate-500">
                Last modified at: {formatDateTime(conflict.serverUpdatedAt)}
              </div>
            )}
          </div>

          {/* Diffs Preview */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-300">Payload Comparison:</div>
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-36 overflow-y-auto">
                <div className="text-slate-400 font-bold mb-1 uppercase text-[10px]">Your Proposed Draft</div>
                <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(conflict.clientPayload, null, 2)}</pre>
              </div>
              <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-800/40 max-h-36 overflow-y-auto">
                <div className="text-amber-400 font-bold mb-1 uppercase text-[10px]">Current Server State</div>
                <pre className="text-amber-200/90 whitespace-pre-wrap">{JSON.stringify(conflict.serverPayload, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Guarantees financial ledger integrity</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReloadLatest();
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Latest State (Recommended)</span>
            </button>

            {onForceOverwrite && (
              <button
                onClick={() => {
                  onForceOverwrite();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition border border-slate-700"
              >
                <span>Force Overwrite</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
