import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { ClinicSettings, User } from '../types/clinic';

interface EmergencyOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDescription: string;
  settings: ClinicSettings;
  currentUser: User;
  onConfirmOverride: (reason: string, authorizedBy: string) => void;
}

export const EmergencyOverrideModal: React.FC<EmergencyOverrideModalProps> = ({
  isOpen,
  onClose,
  targetDescription,
  settings,
  currentUser,
  onConfirmOverride,
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Clinical justification / reason is mandatory for legal compliance.');
      return;
    }

    // Check PIN against settings emergencyOverridePin or user pin if admin
    const isValidPin =
      pin === settings.emergencyOverridePin ||
      (currentUser.role === 'admin' && pin === currentUser.pin);

    if (!isValidPin) {
      setError('Invalid Manager/Admin Override PIN. Action denied.');
      return;
    }

    setError('');
    onConfirmOverride(reason, currentUser.name);
    setPin('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-red-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">Manager Emergency Override</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-100 hover:text-white hover:bg-red-600 p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">CRITICAL AUDIT NOTICE: </span>
            You are bypassing the clinic payment gate for:
            <div className="font-semibold text-slate-900 mt-1 p-1 bg-white/70 rounded border border-amber-200">
              {targetDescription}
            </div>
            This event will be permanently stamped in the clinic security audit log with your credential and timestamp.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical Justification / Authorizer Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="e.g. Critical trauma patient, unconscious, immediate blood draw and IV access authorized by Medical Director..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Manager / Admin Override PIN *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter 4-digit PIN (Default: 9944)"
                className="w-full text-sm font-mono tracking-widest p-2.5 pl-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Authorized supervisor PIN (Demo default: <span className="font-mono font-bold text-slate-700">9944</span>)
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" /> Authorize Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
