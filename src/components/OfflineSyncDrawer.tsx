import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Database,
  Lock,
  Layers,
} from 'lucide-react';
import { OfflineTransaction } from '../types/clinic';
import { formatDateTime } from '../utils/formatters';

interface OfflineSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  networkMode: 'online' | 'intermittent' | 'offline';
  onSetNetworkMode: (mode: 'online' | 'intermittent' | 'offline') => void;
  offlineQueue: OfflineTransaction[];
  onForceSync: () => void;
  onClearQueue: () => void;
}

export const OfflineSyncDrawer: React.FC<OfflineSyncDrawerProps> = ({
  isOpen,
  onClose,
  isOnline,
  networkMode,
  onSetNetworkMode,
  offlineQueue,
  onForceSync,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                networkMode === 'online'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : networkMode === 'intermittent'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {networkMode === 'online' ? (
                <Wifi className="w-5 h-5" />
              ) : networkMode === 'intermittent' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Network & Offline Buffer Engine</h3>
              <p className="text-[11px] text-slate-400">
                Encrypted client transaction buffering & conflict-aware sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Simulation Modes */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300">Simulate Network Condition:</div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSetNetworkMode('online')}
              className={`p-2 rounded-xl text-center border text-xs font-semibold transition ${
                networkMode === 'online'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Wifi className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <div>LAN Online</div>
              <div className="text-[9px] opacity-80">1ms TLS/WSS</div>
            </button>

            <button
              onClick={() => onSetNetworkMode('intermittent')}
              className={`p-2 rounded-xl text-center border text-xs font-semibold transition ${
                networkMode === 'intermittent'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <div>Intermittent</div>
              <div className="text-[9px] opacity-80">Jitter & Drops</div>
            </button>

            <button
              onClick={() => onSetNetworkMode('offline')}
              className={`p-2 rounded-xl text-center border text-xs font-semibold transition ${
                networkMode === 'offline'
                  ? 'bg-red-600 text-white border-red-400 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <WifiOff className="w-4 h-4 mx-auto mb-1 text-red-400" />
              <div>LAN Severed</div>
              <div className="text-[9px] opacity-80">Local Buffer</div>
            </button>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Buffered Transactions: </span>
            <span className="font-bold text-amber-400 font-mono">{offlineQueue.length}</span>
          </div>

          <div className="flex items-center gap-2">
            {offlineQueue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-[11px] text-slate-400 hover:text-red-400 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={onForceSync}
              disabled={offlineQueue.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Re-sync</span>
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {offlineQueue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShieldCheck className="w-12 h-12 text-emerald-500/40 mb-3" />
              <div className="text-sm font-semibold text-slate-300">Local Buffer Clean</div>
              <p className="text-xs max-w-xs mt-1">
                All cashier payments, vitals, lab orders, and prescriptions are synchronized with the central SPEED database.
              </p>
            </div>
          ) : (
            offlineQueue.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    {item.actionType}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-600 block">Entity:</span>
                    <span className="text-slate-300 font-mono capitalize">{item.entityType} ({item.entityId})</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Operator:</span>
                    <span className="text-slate-300">{item.operatorName}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-slate-400 break-all border border-slate-800/80">
                  <div className="text-slate-500 font-semibold mb-0.5">SHA-256 HMAC Checksum:</div>
                  <span className="text-teal-400">{item.checksum}</span>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>Buffered at {formatDateTime(item.timestamp)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-teal-400" />
            <span>AES-256 Local Enclave</span>
          </div>
          <span>Automatic FIFO Replay</span>
        </div>
      </div>
    </div>
  );
};
