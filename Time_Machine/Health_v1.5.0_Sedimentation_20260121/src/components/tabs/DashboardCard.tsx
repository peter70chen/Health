import React from 'react';
import { Icons } from '../Icons';
import { WaterCup } from '../ui/WaterCup';
import { CONFIG } from '../../lib/config';

interface DashboardCardProps {
  remaining: number;
  dailyTarget: number;
  dailyFood: { cal: number; pro: number; carbs: number; fat: number };
  dailyAct: { cal: number };
  dailyRes: { cal: number };
  dailyWater: number;
  waterTarget: number;
  openTargetModal: (type: 'daily' | 'activity') => void;
  setInputModalType: (type: 'food' | 'activity' | 'water' | null) => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  remaining,
  dailyTarget,
  dailyFood,
  dailyAct,
  dailyRes,
  dailyWater,
  waterTarget,
  openTargetModal,
  setInputModalType
}) => {
  return (
    <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6">
      <div className="flex justify-between items-end mb-4 border-b border-neutral-800 pb-4">
        <div>
          <div className={`text-5xl font-extrabold tracking-tight ${remaining < 0 ? 'text-red-500' : 'text-white'}`}>
            {remaining} <span className="text-2xl font-bold text-neutral-400">KCAL</span>
          </div>
          <div className="text-sm text-neutral-400 font-bold mt-1">今日剩餘額度</div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="text-sm text-neutral-500 flex items-center gap-2">每日可消耗熱量</div>
          <button onClick={() => openTargetModal('daily')} className="text-base font-bold text-teal-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 mt-1 border border-neutral-700">
            {dailyTarget} KCAL <Icons.Edit className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-orange-900/20 rounded-xl p-3 border border-orange-900/30">
          <div className="text-sm text-orange-400 mb-1 font-bold">攝取 IN</div>
          <div className="text-2xl font-bold text-orange-500">{dailyFood.cal}</div>
        </div>
        <div className="bg-teal-900/20 rounded-xl p-3 border border-teal-900/30 relative group">
          <div className="text-sm text-teal-400 mb-1 font-bold">消耗 OUT</div>
          <div className="text-2xl font-bold text-teal-500">-{dailyAct.cal + dailyRes.cal}</div>
        </div>
      </div>
      <div className="mt-4 mb-4">
        <WaterCup current={dailyWater} target={waterTarget} onClick={() => setInputModalType('water')} />
      </div>
      <div className="mt-5 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-400 font-medium">蛋白質攝取</span>
            <span className="text-blue-300 font-bold">{dailyFood.pro} / {CONFIG.PRO_TARGET}g</span>
          </div>
          <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${Math.min((dailyFood.pro / CONFIG.PRO_TARGET) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-400 font-medium">碳水化合物攝取</span>
            <span className="text-yellow-300 font-bold">{dailyFood.carbs} / {CONFIG.CARB_TARGET}g</span>
          </div>
          <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500" style={{ width: `${Math.min((dailyFood.carbs / CONFIG.CARB_TARGET) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-400 font-medium">脂肪攝取</span>
            <span className="text-green-300 font-bold">{dailyFood.fat} / {CONFIG.FAT_TARGET}g</span>
          </div>
          <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${Math.min((dailyFood.fat / CONFIG.FAT_TARGET) * 100, 100)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
