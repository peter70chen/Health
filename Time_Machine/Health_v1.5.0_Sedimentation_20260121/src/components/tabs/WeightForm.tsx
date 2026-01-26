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
  inputDose: string;
  setInputDose: (dose: string) => void;
  inputNotes: string;
  setInputNotes: (notes: string) => void;
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
  inputDose,
  setInputDose,
  inputNotes,
  setInputNotes,
  handleWeightSubmit
}) => {
  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <h2 className="font-bold text-neutral-300 mb-4 text-lg flex items-center gap-2 border-b border-neutral-800 pb-3">
        <Icons.Plus /> 新增體重與身體組成
      </h2>
      <form onSubmit={handleWeightSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 min-w-0">
            <label className="text-xs font-bold text-neutral-400 block mb-1">日期</label>
            <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0 appearance-none" />
          </div>
          <div className="sm:col-span-5 min-w-0">
            <label className="text-xs font-bold text-neutral-400 block mb-1">體重 (kg)</label>
            <input type="number" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0" placeholder="0.0" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-rose-400 block mb-1 truncate">體脂率 %</label>
            <input type="number" step="0.1" value={inputBodyFat} onChange={e => setInputBodyFat(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-rose-500 text-white" placeholder="0.0" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-blue-400 block mb-1 truncate">骨骼肌 kg</label>
            <input type="number" step="0.1" value={inputMuscle} onChange={e => setInputMuscle(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 text-white" placeholder="0.0" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 block mb-1 truncate">內臟脂肪</label>
            <input type="number" step="0.5" value={inputVisceral} onChange={e => setInputVisceral(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-zinc-500 text-white" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-400 block mb-1">本週施打劑量 (mg)</label>
          <select value={inputDose} onChange={e => setInputDose(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold text-neutral-300 outline-none focus:border-teal-500">
            <option value="2.5">2.5 mg (起始)</option>
            <option value="5.0">5.0 mg (標準)</option>
            <option value="7.5">7.5 mg</option>
            <option value="10.0">10.0 mg</option>
            <option value="12.5">12.5 mg</option>
            <option value="15.0">15.0 mg</option>
            <option value="0">0 mg (本週未施打)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-400 block mb-1">副作用/不適感 (選填)</label>
          <textarea value={inputNotes} onChange={e => setInputNotes(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-300 font-medium resize-none focus:outline-none focus:border-teal-500" placeholder="例如：輕微噁心、頭暈..." rows={2} />
        </div>
        <button type="submit" className="w-full bg-teal-600 text-white p-4 rounded-xl text-base font-bold mt-2 shadow-md active:scale-95 transition-all hover:bg-teal-500">儲存記錄</button>
      </form>
    </div>
  );
};
