import React from 'react';
import { Icons } from '../Icons';
import type { TargetModalState } from '../../types';

interface TargetModalProps {
  targetModal: TargetModalState | null;
  setTargetModal: (modal: TargetModalState | null) => void;
  tempTargetValue: string;
  setTempTargetValue: (value: string) => void;
  saveTargetModal: () => void;
}

export const TargetModal: React.FC<TargetModalProps> = ({
  targetModal,
  setTargetModal,
  tempTargetValue,
  setTempTargetValue,
  saveTargetModal
}) => {
  if (!targetModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setTargetModal(null) }}>
      <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 w-full max-w-xs shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          {targetModal.type === 'daily' ? <Icons.Zap className="text-teal-400" /> : <Icons.Activity className="text-teal-400" />}
          設定{targetModal.type === 'daily' ? '每日攝取' : '每日運動'}目標
        </h3>
        <div className="relative">
          <input type="number" autoFocus className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-2xl font-bold text-center text-white outline-none focus:border-teal-500 transition-colors" value={tempTargetValue} onChange={e => setTempTargetValue(e.target.value)} />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">KCAL</span>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setTargetModal(null)} className="flex-1 py-3 bg-neutral-800 text-neutral-400 font-bold rounded-xl hover:bg-neutral-700">取消</button>
          <button onClick={saveTargetModal} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 shadow-lg">儲存</button>
        </div>
      </div>
    </div>
  );
};
