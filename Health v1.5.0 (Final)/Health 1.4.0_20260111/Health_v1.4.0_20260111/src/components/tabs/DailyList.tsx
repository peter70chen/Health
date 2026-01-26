import React from 'react';
import { Icons } from '../Icons';
import type { FoodLog, ActivityLog, WaterLog, ConfirmModalState } from '../../types';

interface DailyListProps {
  foodList: FoodLog[];
  waterList: WaterLog[];
  activityList: (ActivityLog & { _source?: 'activity' })[];
  setConfirmModal: (modal: ConfirmModalState | null) => void;
}

export const DailyList: React.FC<DailyListProps> = ({ foodList, waterList, activityList, setConfirmModal }) => {
  const hasAnyRecords = foodList.length > 0 || waterList.length > 0 || activityList.length > 0;

  return (
    <div className="space-y-6">
      {/* Food Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-neutral-300 text-base ml-1 border-l-4 border-orange-500 pl-3 flex items-center gap-2">
          <Icons.Utensils className="w-4 h-4 text-orange-500" /> 食物記錄
        </h3>
        {foodList.length > 0 ? foodList.map(l => (
          <div key={l.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-900/30 text-orange-500">
                <Icons.Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-neutral-200 text-base">
                  {l.foodName}
                  {l.portion && l.portion !== 1 && <span className="ml-2 text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">x{l.portion}</span>}
                </div>
                <div className="text-sm text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-3">
                  {(l.amount ?? 0) > 0 && (
                    <span className="text-blue-400 flex items-center gap-1"><Icons.Water className="w-3 h-3" /> {l.amount} ml</span>
                  )}
                  <span>+{l.calories} kcal</span>
                  <span className="text-blue-400">P:{l.protein || 0}g</span>
                  <span className="text-yellow-500">C:{l.carbs || 0}g</span>
                  <span className="text-green-500">F:{l.fat || 0}g</span>
                </div>
              </div>
            </div>
            <button onClick={() => setConfirmModal({ id: l.id, type: 'food' })} className="text-neutral-600 p-3 hover:text-red-500 active:scale-90 transition-transform">
              <Icons.Trash className="w-5 h-5" />
            </button>
          </div>
        )) : <div className="text-center py-6 text-neutral-600 text-sm bg-neutral-900/50 rounded-xl border border-neutral-800/50">今天還沒有食物記錄</div>}
      </div>

      {/* Water Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-neutral-300 text-base ml-1 border-l-4 border-blue-500 pl-3 flex items-center gap-2">
          <Icons.Water className="w-4 h-4 text-blue-500" /> 飲水記錄
        </h3>
        {waterList.length > 0 ? waterList.map(l => (
          <div key={l.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-900/30 text-blue-500">
                <Icons.Water className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-neutral-200 text-base">
                  {l.beverageName || '飲水'}
                </div>
                <div className="text-sm text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-3">
                  <span className="text-blue-400 flex items-center gap-1"><Icons.Water className="w-3 h-3" /> {l.amount} ml</span>
                  {(l.calories ?? 0) > 0 && <span>+{l.calories} kcal</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setConfirmModal({ id: l.id, type: 'water' })} className="text-neutral-600 p-3 hover:text-red-500 active:scale-90 transition-transform">
              <Icons.Trash className="w-5 h-5" />
            </button>
          </div>
        )) : <div className="text-center py-6 text-neutral-600 text-sm bg-neutral-900/50 rounded-xl border border-neutral-800/50">今天還沒有飲水記錄</div>}
      </div>

      {/* Activity Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-neutral-300 text-base ml-1 border-l-4 border-teal-500 pl-3 flex items-center gap-2">
          <Icons.Zap className="w-4 h-4 text-teal-500" /> 運動記錄
        </h3>
        {activityList.length > 0 ? activityList.map(l => (
          <div key={l.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-teal-900/30 text-teal-500">
                <Icons.Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-neutral-200 text-base">
                  {l.activityName ? `運動 (${l.activityName})` : '運動'}
                </div>
                <div className="text-sm text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-3">
                  <span>-{l.activeCalories} kcal</span>
                  {(l.exerciseMinutes ?? 0) > 0 && <span>{l.exerciseMinutes} 分鐘</span>}
                  {(l.steps ?? 0) > 0 && <span>{l.steps} 步</span>}
                </div>
              </div>
            </div>
            <button onClick={() => setConfirmModal({ id: l.id, type: 'activity' })} className="text-neutral-600 p-3 hover:text-red-500 active:scale-90 transition-transform">
              <Icons.Trash className="w-5 h-5" />
            </button>
          </div>
        )) : <div className="text-center py-6 text-neutral-600 text-sm bg-neutral-900/50 rounded-xl border border-neutral-800/50">今天還沒有運動記錄</div>}
      </div>

      {/* Empty state for all */}
      {!hasAnyRecords && (
        <div className="text-center py-10 text-neutral-500 text-sm">
          今天還沒有任何記錄喔！<br/>點擊上方按鈕開始記錄吧 ✨
        </div>
      )}
    </div>
  );
};
