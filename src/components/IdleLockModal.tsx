import React, { useState } from 'react';
import { Lock, Unlock, Shield, AlertCircle, KeyRound } from 'lucide-react';
import { User } from '../types/clinic';

interface IdleLockModalProps {
  isLocked: boolean;
  currentUser: User;
  onUnlock: () => void;
}

export const IdleLockModal: React.FC<IdleLockModalProps> = ({
  isLocked,
  currentUser,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMsg('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (candidate: string) => {
    if (candidate === currentUser.pin || candidate === '9944') {
      setPinInput('');
      setErrorMsg('');
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN code. Please try again.');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center text-slate-100 flex flex-col items-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="font-bold text-lg text-white">SPEED Terminal Locked</h3>
        <p className="text-xs text-slate-400 mt-1">
          Station secured due to session inactivity or manual lock
        </p>

        {/* Current Operator Profile */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center font-bold text-sm text-white">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-teal-400 capitalize">
              {currentUser.role} • {currentUser.department}
            </div>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="my-5 flex gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                idx < pinInput.length
                  ? 'bg-teal-400 border-teal-400 scale-110 shadow-sm'
                  : 'border-slate-600 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-xs text-red-400 font-semibold mb-3 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-base font-bold text-white border border-slate-700/60 transition"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-xs font-semibold text-slate-400 border border-slate-800 transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-base font-bold text-white border border-slate-700/60 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => verifyPin(pinInput)}
            className="h-12 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-xs font-bold text-white transition flex items-center justify-center"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Helper */}
        <div className="mt-5 text-[10px] text-slate-500">
          Demo PIN for {currentUser.name}: <span className="font-mono text-teal-400 font-bold">{currentUser.pin}</span> (or Admin: 9944)
        </div>
      </div>
    </div>
  );
};
