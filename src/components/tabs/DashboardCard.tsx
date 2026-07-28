import React from 'react';
import { Icons } from '../Icons';
import { WaterCup } from '../ui/WaterCup';
import { CONFIG } from '../../lib/config';
import { NUTRIENTS, type NutrientStyle } from '../../lib/nutrientTheme';

interface DashboardCardProps {
  remaining: number;
  dailyTarget: number;
  dailyFood: { cal: number; pro: number; carbs: number; fat: number; fib: number };
  dailyAct: { cal: number };
  dailyRes: { cal: number };
  dailyWater: number;
  waterTarget: number;
  openTargetModal: (type: 'daily' | 'activity') => void;
  setInputModalType: (type: 'food' | 'activity' | 'water' | null) => void;
  onQuickAddWater?: () => void;
}

// 環形進度圖元件
const CircularProgress: React.FC<{ remaining: number; total: number }> = ({ remaining, total }) => {
  const size = 108;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 計算剩餘比例 (0-1)，處理負數和超出情況
  const clampedRemaining = Math.max(0, Math.min(remaining, total));
  const progress = clampedRemaining / total;
  const strokeDashoffset = circumference * (1 - progress);

  // 根據剩餘量決定顏色
  const getColor = () => {
    if (remaining < 0) return '#ef4444'; // 紅色 - 超標
    if (progress < 0.2) return '#f97316'; // 橙色 - 快用完
    if (progress < 0.5) return '#eab308'; // 黃色 - 一半以下
    return '#14b8a6'; // 青色 - 正常
  };

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
        />
        {/* 進度圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/*
       * 中間文字：全頁視覺主角，但字級不能再往上加。
       * 環外徑 120 - strokeWidth 10 × 2 = 內徑 100px，text-3xl(30px) + font-black 時
       * 「-1100」這種負四位數會撐出環外壓到筆畫上（2026-07-25 實測截圖確認）。
       * 超標是這個 app 的常態情境，所以維持 text-2xl / font-extrabold。
       */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-2xl font-extrabold tabular-nums ${remaining < 0 ? 'text-red-400' : 'text-white'}`}>
          {remaining}
        </div>
        <div className="text-[10px] text-neutral-400 font-bold">KCAL</div>
      </div>
    </div>
  );
};

// 營養素進度條。四個營養素共用同一個元件，避免各自複製貼上後樣式走鐘。
const MacroBar: React.FC<{
  nutrient: NutrientStyle;
  current: number;
  target: number;
}> = ({ nutrient, current, target }) => {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-neutral-400 font-medium">{nutrient.label}</span>
        <span className={`${nutrient.barText} font-bold`}>{current} / {target}g</span>
      </div>
      <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full ${nutrient.bar} transition-all duration-500 ease-out`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
  remaining,
  dailyTarget,
  dailyFood,
  dailyAct,
  dailyRes,
  dailyWater,
  waterTarget,
  openTargetModal,
  setInputModalType,
  onQuickAddWater
}) => {
  return (
    <section aria-labelledby="daily-summary-title" className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold text-teal-400 mb-0.5">今日摘要</p>
          <h2 id="daily-summary-title" className="text-base font-bold text-white">剩餘熱量</h2>
        </div>
        <button aria-label={`調整每日可消耗目標，目前 ${dailyTarget} 大卡`} onClick={() => openTargetModal('daily')} className="min-h-[44px] text-sm font-bold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-neutral-700">
            目標 {dailyTarget} <Icons.Edit className="w-3.5 h-3.5 text-teal-300" />
          </button>
      </div>
      <div className="flex items-center gap-4 pb-4 border-b border-neutral-800">
        <CircularProgress remaining={remaining} total={dailyTarget} />
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs text-neutral-400 font-medium">攝取 IN</div>
              <div className="flex items-baseline gap-1"><div className="text-xl font-bold text-orange-400 tabular-nums">+{dailyFood.cal}</div><span className="text-xs text-neutral-500">kcal</span></div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 font-medium">消耗 OUT</div>
              <div className="flex items-baseline gap-1"><div className="text-xl font-bold text-teal-300 tabular-nums">-{dailyAct.cal + dailyRes.cal}</div><span className="text-xs text-neutral-500">kcal</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <WaterCup
          current={dailyWater}
          target={waterTarget}
          onClick={() => setInputModalType('water')}
          onLongPress={onQuickAddWater}
        />
      </div>
      <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3">
        <MacroBar nutrient={NUTRIENTS.protein} current={dailyFood.pro} target={CONFIG.PRO_TARGET} />
        <MacroBar nutrient={NUTRIENTS.carbs} current={dailyFood.carbs} target={CONFIG.CARB_TARGET} />
        <MacroBar nutrient={NUTRIENTS.fat} current={dailyFood.fat} target={CONFIG.FAT_TARGET} />
        <MacroBar nutrient={NUTRIENTS.fiber} current={dailyFood.fib} target={CONFIG.FIBER_TARGET} />
      </div>
    </section>
  );
};
