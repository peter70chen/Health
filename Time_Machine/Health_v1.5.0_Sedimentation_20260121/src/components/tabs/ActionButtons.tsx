import React from 'react';
import { Icons } from '../Icons';

interface ActionButtonsProps {
  setInputModalType: (type: 'food' | 'activity' | 'water' | null) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ setInputModalType }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button onClick={() => setInputModalType('food')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800">
        <div className="bg-orange-900/30 p-3 rounded-full text-orange-500"><Icons.Utensils /></div>
        <span className="text-sm font-bold text-neutral-300">記錄飲食</span>
      </button>
      <button onClick={() => setInputModalType('water')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800">
        <div className="bg-blue-900/30 p-3 rounded-full text-blue-500"><Icons.Water /></div>
        <span className="text-sm font-bold text-neutral-300">記錄飲水</span>
      </button>
      <button onClick={() => setInputModalType('activity')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800">
        <div className="bg-teal-900/30 p-3 rounded-full text-teal-500"><Icons.Zap /></div>
        <span className="text-sm font-bold text-neutral-300">記錄運動</span>
      </button>
    </div>
  );
};
