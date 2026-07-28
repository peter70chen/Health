import React from 'react';
import { Icons } from '../Icons';

interface WeightStatsProps {
  currentWeight: number;
  bmi: string;
}

export const WeightStats: React.FC<WeightStatsProps> = ({ currentWeight, bmi }) => {
  return (
    <section aria-label="目前身體摘要" className="grid grid-cols-2 rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="p-4 border-r border-neutral-800">
        <div className="text-xs text-neutral-400 mb-1 font-bold flex items-center gap-1.5"><Icons.Scale className="w-4 h-4" /> 目前體重</div>
        <div className="text-2xl font-extrabold text-teal-300 tabular-nums">
          {currentWeight} <span className="text-base text-neutral-500 font-medium">kg</span>
        </div>
      </div>
      <div className="p-4">
        <div className="text-xs text-neutral-400 mb-1 font-bold flex items-center gap-1.5"><Icons.Activity className="w-4 h-4" /> BMI 指數</div>
        <div className="text-2xl font-extrabold text-amber-300 tabular-nums">{bmi}</div>
      </div>
    </section>
  );
};
