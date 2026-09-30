import React, { useState } from 'react';
import { Radio, X, RefreshCw, Trash2, CheckCircle, Activity, Laptop } from 'lucide-react';
import { WebSocketEvent } from '../types/clinic';
import { formatTimeOnly } from '../utils/formatters';

interface WebSocketActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: WebSocketEvent[];
  onClearEvents: () => void;
  serverIp: string;
}

export const WebSocketActivityDrawer: React.FC<WebSocketActivityDrawerProps> = ({
  isOpen,
  onClose,
  events,
  onClearEvents,
  serverIp,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredEvents = stationFilter === 'all'
    ? events
    : events.filter(e => e.station.toLowerCase().includes(stationFilter.toLowerCase()));

  const getStationBadge = (station: string) => {
    if (station.includes('Cashier')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (station.includes('Doctor')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (station.includes('Nurse')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (station.includes('Lab')) return 'bg-amber-100 text-amber-800 border-amber-300';
    if (station.includes('Pharmacy')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 text-slate-100 shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">Local WebSocket Bus</h3>
            <p className="text-[11px] text-slate-400 font-mono">ws://{serverIp}/ws/clinic</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearEvents}
            title="Clear Stream"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Network Health bar */}
      <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700/80 text-xs flex justify-between items-center text-slate-300">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Broadcast Channel: <strong className="text-white">Active</strong></span>
        </div>
        <div className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-slate-700">
          Latency: 1ms • 0 dropped
        </div>
      </div>

      {/* Station Filters */}
      <div className="p-3 border-b border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
        {['all', 'cashier', 'doctor', 'nurse', 'lab', 'pharmacy', 'admin'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStationFilter(filter)}
            className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
              stationFilter === filter
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Stream List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
            <Activity className="w-8 h-8 mb-2 opacity-40 animate-spin" />
            <p>Listening for real-time LAN socket packets...</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-800/90 border border-slate-700/90 rounded-lg p-2.5 hover:border-slate-600 transition"
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getStationBadge(evt.station)}`}>
                  <Laptop className="w-3 h-3 inline mr-1" />
                  {evt.station}
                </span>
                <span className="text-[10px] text-slate-400">{formatTimeOnly(evt.timestamp)}</span>
              </div>
              <div className="text-xs font-bold text-teal-300 mt-1">{evt.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5 font-sans leading-relaxed">{evt.detail}</div>
              <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider font-mono">
                PACKET: {evt.eventType}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 text-center">
        Real-time clinic bus connects all workstations via centralized state.
      </div>
    </div>
  );
};
