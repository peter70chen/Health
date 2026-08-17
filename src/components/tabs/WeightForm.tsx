import React from 'react';
import { Icons } from '../Icons';

interface WeightFormProps {
  inputDate: string;
  setInputDate: (date: string) => void;
  inputWeight: string;
  setInputWeight: (weight: string) => void;
  inputBodyFat: string;
  setInputBodyFat: (bodyFat: string) => void;
  inputMuscle: string;
  setInputMuscle: (muscle: string) => void;
  inputVisceral: string;
  setInputVisceral: (visceral: string) => void;
  handleWeightSubmit: (e: React.FormEvent) => void;
}

export const WeightForm: React.FC<WeightFormProps> = ({
  inputDate,
  setInputDate,
  inputWeight,
  setInputWeight,
  inputBodyFat,
  setInputBodyFat,
  inputMuscle,
  setInputMuscle,
  inputVisceral,
  setInputVisceral,
  handleWeightSubmit
}) => {
  return (
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
      <h2 className="font-bold text-neutral-300 mb-4 text-lg flex items-center gap-2 border-b border-neutral-800 pb-3">
        <Icons.Plus /> 新增體重與身體組成
      </h2>
      <form onSubmit={handleWeightSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 min-w-0">
            <label htmlFor="weight-date" className="text-xs font-bold text-neutral-400 block mb-1">日期</label>
            <input id="weight-date" type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0 appearance-none" />
          </div>
          <div className="sm:col-span-5 min-w-0">
            <label htmlFor="weight-value" className="text-xs font-bold text-neutral-400 block mb-1">體重 (kg)</label>
            <input id="weight-value" type="number" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0" placeholder="0.0" />
          </div>
        </div>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3">
          <div>
            <label htmlFor="body-fat-value" className="text-xs font-bold text-rose-400 block mb-1">體脂率 %</label>
            <input id="body-fat-value" type="number" step="0.1" value={inputBodyFat} onChange={e => setInputBodyFat(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-bold outline-none focus:border-rose-500 text-white" placeholder="0.0" />
          </div>
          <div>
            <label htmlFor="muscle-value" className="text-xs font-bold text-blue-400 block mb-1">骨骼肌 kg</label>
            <input id="muscle-value" type="number" step="0.1" value={inputMuscle} onChange={e => setInputMuscle(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 text-white" placeholder="0.0" />
          </div>
          <div>
            <label htmlFor="visceral-fat-value" className="text-xs font-bold text-zinc-400 block mb-1">內臟脂肪</label>
            <input id="visceral-fat-value" type="number" step="0.5" value={inputVisceral} onChange={e => setInputVisceral(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-bold outline-none focus:border-zinc-500 text-white" placeholder="0" />
          </div>
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white p-4 rounded-lg text-base font-bold mt-2 active:scale-[0.98] transition-all hover:bg-teal-500">儲存記錄</button>
      </form>
    </div>
  );
};
