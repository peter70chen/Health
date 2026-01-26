import React from 'react';
import { Icons } from '../Icons';
import type { WeightLog } from '../../types';

interface WeightHistoryProps {
  weightHistoryDate: string;
  setWeightHistoryDate: (date: string) => void;
  currentWeightRecord: WeightLog | undefined;
  showWeightHistory: boolean;
  setShowWeightHistory: (show: boolean) => void;
}

export const WeightHistory: React.FC<WeightHistoryProps> = ({
  weightHistoryDate,
  setWeightHistoryDate,
  currentWeightRecord,
  showWeightHistory,
  setShowWeightHistory
}) => {
  return (
    <div className="mt-8 pb-8">
      <h3 className="font-bold text-neutral-400 text-sm mb-3 pl-1 flex items-center gap-2">
        <Icons.Calendar className="w-4 h-4" /> 歷史查詢
      </h3>
      <div className="relative bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
        <div className="flex-1 text-sm font-bold text-white pl-2">{weightHistoryDate ? weightHistoryDate : "選擇日期"}</div>
        <div className="relative w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
          <Icons.Calendar className="w-5 h-5 text-white" />
          <input type="date" value={weightHistoryDate} onChange={(e) => setWeightHistoryDate(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
        </div>
      </div>
      {currentWeightRecord && showWeightHistory && (
        <div className="pt-2 mt-2 border-t border-neutral-800 animate-fadeIn relative">
          <button onClick={() => setShowWeightHistory(false)} className="absolute top-4 right-2 text-neutral-500 hover:text-white p-2 z-20">
            <Icons.X className="w-5 h-5" />
          </button>
          <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-teal-400 font-bold text-lg">{currentWeightRecord.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-neutral-500 mb-1">體重</div>
                <div className="text-xl font-extrabold text-white">{currentWeightRecord.weight} kg</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">劑量</div>
                <div className="text-xl font-extrabold text-purple-400">{currentWeightRecord.dose || 0} mg</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {currentWeightRecord.bodyFat && (
                <div>
                  <div className="text-xs text-neutral-500 mb-1">體脂率</div>
                  <div className="text-lg font-bold text-rose-400">{currentWeightRecord.bodyFat}%</div>
                </div>
              )}
              {currentWeightRecord.muscle && (
                <div>
                  <div className="text-xs text-neutral-500 mb-1">骨骼肌</div>
                  <div className="text-lg font-bold text-blue-400">{currentWeightRecord.muscle} kg</div>
                </div>
              )}
              {currentWeightRecord.visceral && (
                <div>
                  <div className="text-xs text-neutral-500 mb-1">內臟脂肪</div>
                  <div className="text-lg font-bold text-zinc-400">{currentWeightRecord.visceral}</div>
                </div>
              )}
            </div>

            {currentWeightRecord.notes ? (
              <div className="text-sm text-neutral-300 bg-black/20 p-3 rounded border border-neutral-700/50">
                <span className="text-neutral-500 text-xs block mb-1">備註</span>{currentWeightRecord.notes}
              </div>
            ) : (
              <div className="text-xs text-neutral-600 italic">無備註</div>
            )}
          </div>
        </div>
      )}
      {(!currentWeightRecord && weightHistoryDate && showWeightHistory) && (
        <div className="text-center py-6 text-neutral-600 text-sm pt-2 mt-2 border-t border-neutral-800 border-dashed rounded-xl relative">
          <button onClick={() => setShowWeightHistory(false)} className="absolute top-2 right-2 text-neutral-500 hover:text-white p-2">
            <Icons.X className="w-5 h-5" />
          </button>
          該日期沒有紀錄
        </div>
      )}
    </div>
  );
};
