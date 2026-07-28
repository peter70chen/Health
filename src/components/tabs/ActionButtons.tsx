import React from 'react';
import { Icons } from '../Icons';

interface ActionButtonsProps {
  setInputModalType: (type: 'food' | 'activity' | 'water' | null) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ setInputModalType }) => {
  return (
    <div role="group" aria-label="快速記錄" className="grid grid-cols-3 gap-2">
      <button onClick={() => setInputModalType('food')} className="min-h-[72px] bg-neutral-900 px-2 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform border border-neutral-800 hover:border-orange-800">
        <Icons.Utensils className="w-5 h-5 text-orange-400" />
        <span className="text-sm leading-tight text-center font-bold text-neutral-200">記錄飲食</span>
      </button>
      <button onClick={() => setInputModalType('water')} className="min-h-[72px] bg-neutral-900 px-2 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform border border-neutral-800 hover:border-blue-800">
        <Icons.Water className="w-5 h-5 text-blue-400" />
        <span className="text-sm leading-tight text-center font-bold text-neutral-200">記錄飲水</span>
      </button>
      <button onClick={() => setInputModalType('activity')} className="min-h-[72px] bg-neutral-900 px-2 py-3 rounded-lg flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] transition-transform border border-neutral-800 hover:border-teal-800">
        <Icons.Zap className="w-5 h-5 text-teal-400" />
        <span className="text-sm leading-tight text-center font-bold text-neutral-200">記錄運動</span>
      </button>
    </div>
  );
};
