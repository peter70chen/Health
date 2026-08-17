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
        <label htmlFor="weight-history-date" className="relative min-w-[44px] min-h-[44px] flex items-center justify-center bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
          <Icons.Calendar className="w-5 h-5 text-white" />
          <span className="sr-only">選擇歷史查詢日期</span>
          <input id="weight-history-date" aria-label="選擇歷史查詢日期" type="date" value={weightHistoryDate} onChange={(e) => setWeightHistoryDate(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
        </label>
      </div>
      {currentWeightRecord && showWeightHistory && (
        <div className="pt-2 mt-2 border-t border-neutral-800 animate-fadeIn relative">
          <button aria-label="關閉歷史紀錄" onClick={() => setShowWeightHistory(false)} className="absolute top-3 right-1 text-neutral-300 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center z-20">
            <Icons.X className="w-5 h-5" />
          </button>
          <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-teal-400 font-bold text-lg">{currentWeightRecord.date}</span>
            </div>
            <div className="mb-3">
              <div className="text-xs text-neutral-400 mb-1">體重</div>
              <div className="text-xl font-extrabold text-white">{currentWeightRecord.weight} kg</div>
            </div>

            <div className="grid grid-cols-2 min-[360px]:grid-cols-4 gap-3 mb-3">
              {currentWeightRecord.bodyFat !== undefined && (
                <div>
                  <div className="text-xs text-neutral-400 mb-1">體脂率</div>
                  <div className="text-lg font-bold text-rose-400">{currentWeightRecord.bodyFat}%</div>
                </div>
              )}
              {currentWeightRecord.muscle !== undefined && (
                <div>
                  <div className="text-xs text-neutral-400 mb-1">骨骼肌</div>
                  <div className="text-lg font-bold text-blue-400">{currentWeightRecord.muscle} kg</div>
                </div>
              )}
              {currentWeightRecord.visceral !== undefined && (
                <div>
                  <div className="text-xs text-neutral-400 mb-1">內臟脂肪</div>
                  <div className="text-lg font-bold text-zinc-400">{currentWeightRecord.visceral}</div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      {(!currentWeightRecord && weightHistoryDate && showWeightHistory) && (
        <div className="text-center py-6 text-neutral-600 text-sm pt-2 mt-2 border-t border-neutral-800 border-dashed rounded-xl relative">
          <button aria-label="關閉歷史查詢結果" onClick={() => setShowWeightHistory(false)} className="absolute top-1 right-1 text-neutral-300 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Icons.X className="w-5 h-5" />
          </button>
          該日期沒有紀錄
        </div>
      )}
    </div>
  );
};
