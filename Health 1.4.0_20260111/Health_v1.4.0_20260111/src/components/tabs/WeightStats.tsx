import React from 'react';
import { Icons } from '../Icons';

interface WeightStatsProps {
  currentWeight: number;
  bmi: string;
}

export const WeightStats: React.FC<WeightStatsProps> = ({ currentWeight, bmi }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 relative overflow-hidden">
        <div className="text-sm text-neutral-400 mb-2 font-bold">目前體重</div>
        <div className="text-3xl font-extrabold text-blue-400 tracking-tight">
          {currentWeight} <span className="text-base text-neutral-500 font-medium">kg</span>
        </div>
        <div className="absolute top-3 right-3 opacity-10 text-white"><Icons.Scale /></div>
      </div>
      <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 relative overflow-hidden">
        <div className="text-sm text-neutral-400 mb-2 font-bold">BMI 指數</div>
        <div className="text-3xl font-extrabold text-yellow-400 tracking-tight">{bmi}</div>
        <div className="absolute top-3 right-3 opacity-10 text-white"><Icons.Activity /></div>
      </div>
    </div>
  );
};
