import React from 'react';
import { Icons } from '../Icons';
import type { WeightLog, ConfirmModalState } from '../../types';

interface WeightListProps {
  weightLogs: WeightLog[];
  setConfirmModal: (modal: ConfirmModalState | null) => void;
}

export const WeightList: React.FC<WeightListProps> = ({ weightLogs, setConfirmModal }) => {
  return (
    <div className="space-y-3">
      {weightLogs.slice(0, 7).map(l => (
        <div key={l.id} className="bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-800 flex flex-col hover:bg-neutral-800 transition-colors">
          <div className="flex justify-between items-center w-full h-10">
            <div className="flex items-center gap-4">
              <span className="text-neutral-500 font-bold text-xs w-auto min-w-[5rem] whitespace-nowrap">{l.date}</span>
              <span className="font-extrabold text-white text-lg">{l.weight} kg</span>
            </div>
            <div className="flex items-center gap-3">
              {l.dose && l.dose !== '0' && (
                <span className="bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>{l.dose} mg
                </span>
              )}
              <button onClick={() => setConfirmModal({ id: l.id, type: 'weight' })} className="text-neutral-600 p-1 hover:text-red-500 active:scale-90 transition-transform">
                <Icons.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 -mt-2 mb-1 pl-24">
            {l.bodyFat && <span className="text-[10px] font-bold text-rose-300 bg-rose-900/40 px-1.5 py-0.5 rounded-md">脂 {l.bodyFat}%</span>}
            {l.muscle && <span className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded-md">肌 {l.muscle}kg</span>}
            {l.visceral && <span className="text-[10px] font-bold text-zinc-300 bg-zinc-700/40 px-1.5 py-0.5 rounded-md">內 {l.visceral}</span>}
          </div>
          {l.notes && <div className="text-[10px] text-neutral-500 pl-24 truncate pb-1">{l.notes}</div>}
        </div>
      ))}
    </div>
  );
};
