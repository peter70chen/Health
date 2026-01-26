import React, { useState } from 'react';
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

  // 收合狀態管理 - 預設收合
  const [isFoodExpanded, setIsFoodExpanded] = useState(false);
  const [isWaterExpanded, setIsWaterExpanded] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);

  // 計算各項總計，顯示於標題
  const totalFoodCalories = foodList.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalWaterAmount = waterList.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalActivityCalories = activityList.reduce((sum, l) => sum + (l.activeCalories || 0), 0);

  return (
    <div className="space-y-4">
      {/* Food Section */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <button
          onClick={() => setIsFoodExpanded(!isFoodExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-900/30 text-orange-500">
              <Icons.Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-200 text-base">食物記錄</span>
              <span className="ml-2 text-sm text-neutral-500">
                ({foodList.length} 筆{totalFoodCalories > 0 && `, +${totalFoodCalories} kcal`})
              </span>
            </div>
          </div>
          <Icons.ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${isFoodExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isFoodExpanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-neutral-800">
            {foodList.length > 0 ? foodList.map(l => (
              <div key={l.id} className="bg-neutral-800/50 p-3 rounded-lg flex justify-between items-center mt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-900/20 text-orange-500">
                    <Icons.Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 text-sm">
                      {l.foodName}
                      {l.portion && l.portion !== 1 && <span className="ml-2 text-xs bg-neutral-700 text-neutral-400 px-2 py-0.5 rounded-full">x{l.portion}</span>}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-2">
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
                <button onClick={() => setConfirmModal({ id: l.id, type: 'food' })} className="text-neutral-600 p-2 hover:text-red-500 active:scale-90 transition-transform">
                  <Icons.Trash className="w-4 h-4" />
                </button>
              </div>
            )) : <div className="text-center py-4 text-neutral-600 text-sm mt-2">今天還沒有食物記錄</div>}
          </div>
        )}
      </div>

      {/* Water Section */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <button
          onClick={() => setIsWaterExpanded(!isWaterExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-900/30 text-blue-500">
              <Icons.Water className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-200 text-base">飲水記錄</span>
              <span className="ml-2 text-sm text-neutral-500">
                ({waterList.length} 筆{totalWaterAmount > 0 && `, ${totalWaterAmount} ml`})
              </span>
            </div>
          </div>
          <Icons.ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${isWaterExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isWaterExpanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-neutral-800">
            {waterList.length > 0 ? waterList.map(l => (
              <div key={l.id} className="bg-neutral-800/50 p-3 rounded-lg flex justify-between items-center mt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-900/20 text-blue-500">
                    <Icons.Water className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 text-sm">
                      {l.beverageName || '飲水'}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-2">
                      <span className="text-blue-400 flex items-center gap-1"><Icons.Water className="w-3 h-3" /> {l.amount} ml</span>
                      {(l.calories ?? 0) > 0 && <span>+{l.calories} kcal</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setConfirmModal({ id: l.id, type: 'water' })} className="text-neutral-600 p-2 hover:text-red-500 active:scale-90 transition-transform">
                  <Icons.Trash className="w-4 h-4" />
                </button>
              </div>
            )) : <div className="text-center py-4 text-neutral-600 text-sm mt-2">今天還沒有飲水記錄</div>}
          </div>
        )}
      </div>

      {/* Activity Section */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <button
          onClick={() => setIsActivityExpanded(!isActivityExpanded)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-900/30 text-teal-500">
              <Icons.Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-200 text-base">運動記錄</span>
              <span className="ml-2 text-sm text-neutral-500">
                ({activityList.length} 筆{totalActivityCalories > 0 && `, -${totalActivityCalories} kcal`})
              </span>
            </div>
          </div>
          <Icons.ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${isActivityExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isActivityExpanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-neutral-800">
            {activityList.length > 0 ? activityList.map(l => (
              <div key={l.id} className="bg-neutral-800/50 p-3 rounded-lg flex justify-between items-center mt-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-900/20 text-teal-500">
                    <Icons.Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-200 text-sm">
                      {l.activityName ? `運動 (${l.activityName})` : '運動'}
                    </div>
                    <div className="text-xs text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-2">
                      <span>-{l.activeCalories} kcal</span>
                      {(l.exerciseMinutes ?? 0) > 0 && <span>{l.exerciseMinutes} 分鐘</span>}
                      {(l.steps ?? 0) > 0 && <span>{l.steps} 步</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setConfirmModal({ id: l.id, type: 'activity' })} className="text-neutral-600 p-2 hover:text-red-500 active:scale-90 transition-transform">
                  <Icons.Trash className="w-4 h-4" />
                </button>
              </div>
            )) : <div className="text-center py-4 text-neutral-600 text-sm mt-2">今天還沒有運動記錄</div>}
          </div>
        )}
      </div>

      {/* Empty state for all */}
      {!hasAnyRecords && (
        <div className="text-center py-10 text-neutral-500 text-sm">
          今天還沒有任何記錄喔！<br />點擊上方按鈕開始記錄吧 ✨
        </div>
      )}
    </div>
  );
};
