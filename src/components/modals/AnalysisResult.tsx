import React from 'react';
import { Icons } from '../Icons';
import type { AnalyzedFood, AnalyzedActivity, AnalyzedWater } from '../../types';

interface AnalysisResultProps {
  analyzedFood: AnalyzedFood | null;
  analyzedActivity: AnalyzedActivity | null;
  analyzedWater: AnalyzedWater | null;
  setAnalyzedFood: (food: AnalyzedFood | null) => void;
  setAnalyzedActivity: (activity: AnalyzedActivity | null) => void;
  setAnalyzedWater: (water: AnalyzedWater | null) => void;
  portion: number;
  setPortion: (portion: number) => void;
  addToFavorites: boolean;
  setAddToFavorites: (add: boolean) => void;
  saveLog: (type: string) => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analyzedFood,
  analyzedActivity,
  analyzedWater,
  setAnalyzedFood,
  setAnalyzedActivity,
  setAnalyzedWater,
  portion,
  setPortion,
  addToFavorites,
  setAddToFavorites,
  saveLog
}) => {
  if (!analyzedFood && !analyzedActivity && !analyzedWater) return null;

  const warnings = analyzedFood?.warnings || analyzedActivity?.warnings || analyzedWater?.warnings || [];

  return (
    <div className="bg-neutral-900 border-2 border-teal-500 p-5 rounded-2xl shadow-xl animate-fadeIn relative">
      <div className="absolute -top-3 left-4 bg-teal-500 text-white text-xs px-3 py-1 rounded-full font-bold">AI 分析結果</div>
      <div className="flex gap-4 mb-5 mt-2 items-start">
        <div className="flex-shrink-0">
          {analyzedFood?.imagePreview || analyzedActivity?.imagePreview || analyzedWater?.imagePreview ? (
            <img src={analyzedFood ? analyzedFood.imagePreview : (analyzedWater ? analyzedWater.imagePreview : analyzedActivity?.imagePreview)} className="w-24 h-24 object-cover rounded-xl bg-neutral-800 shadow-sm" alt="Result" />
          ) : (
            <div className="w-24 h-24 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400"><Icons.Type className="w-10 h-10" /></div>
          )}
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-xl text-white mb-2">{analyzedFood ? analyzedFood.foodName : (analyzedWater ? analyzedWater.beverageName : "運動記錄")}</h4>
          {analyzedFood?.confidence && analyzedFood.confidence !== 'high' && (
            <div className={`inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${analyzedFood.confidence === 'low' ? 'bg-red-900/40 text-red-300 border border-red-500/40' : 'bg-amber-900/40 text-amber-300 border border-amber-500/40'}`}>
              <Icons.AlertCircle className="w-3 h-3" />
              {analyzedFood.confidence === 'low' ? 'AI 把握度低，請人工確認' : 'AI 把握度中等，建議微調'}
            </div>
          )}
          {analyzedFood ? (
            <div className="flex flex-col gap-1">
              <span className="text-orange-400 text-sm font-bold">原始熱量: {analyzedFood.calories} kcal</span>
              <span className="text-blue-400 text-sm font-bold">原始蛋白: {analyzedFood.protein || 0}g</span>
              <span className="text-amber-400 text-sm font-bold">原始碳水: {analyzedFood.carbs || 0}g</span>
              <span className="text-green-400 text-sm font-bold">原始脂肪: {analyzedFood.fat || 0}g</span>
              <span className="text-lime-400 text-sm font-bold">原始纖維: {analyzedFood.fiber || 0}g</span>
            </div>
          ) : (
            analyzedWater ? (
              <div className="flex flex-col gap-1"><span className="text-blue-400 text-sm font-bold">容量: {analyzedWater.amount} ml</span></div>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-teal-400 text-sm font-bold">消耗: {analyzedActivity?.activeCalories} kcal</span>
                <span className="text-neutral-400 text-sm font-bold">時間: {analyzedActivity?.exerciseMinutes} 分</span>
              </div>
            )
          )}
        </div>
      </div>

      {analyzedFood && (
        <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="col-span-2 text-xs font-bold text-neutral-400">
              食物名稱
              <input value={analyzedFood.foodName} onChange={e => setAnalyzedFood({ ...analyzedFood, foodName: e.target.value })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              熱量 kcal
              <input type="number" value={analyzedFood.calories || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, calories: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              蛋白 g
              <input type="number" value={analyzedFood.protein || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, protein: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              碳水 g
              <input type="number" value={analyzedFood.carbs || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, carbs: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              脂肪 g
              <input type="number" value={analyzedFood.fat || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, fat: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="col-span-2 text-xs font-bold text-neutral-400">
              膳食纖維 g
              <input type="number" value={analyzedFood.fiber || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, fiber: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-lime-500" />
            </label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-neutral-300 text-sm">食用份量/比例</label>
            <span className="font-bold text-teal-400 text-lg">{portion} 份</span>
          </div>
          <input type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
          <div className="grid grid-cols-5 mt-3 pt-3 border-t border-neutral-700 text-center divide-x divide-neutral-700">
            <div><div className="text-[11px] text-neutral-400">熱量</div><div className="text-base font-bold text-orange-500">{Math.round(analyzedFood.calories * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">蛋白</div><div className="text-base font-bold text-blue-400">{Math.round((analyzedFood.protein || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">碳水</div><div className="text-base font-bold text-amber-400">{Math.round((analyzedFood.carbs || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">脂肪</div><div className="text-base font-bold text-green-400">{Math.round((analyzedFood.fat || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">纖維</div><div className="text-base font-bold text-lime-400">{Math.round((analyzedFood.fiber || 0) * portion)}</div></div>
          </div>
        </div>
      )}

      {analyzedWater && (
        <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="text-xs font-bold text-neutral-400">
              飲品名稱
              <input value={analyzedWater.beverageName || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, beverageName: e.target.value })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              容量 ml
              <input type="number" value={analyzedWater.amount || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, amount: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              熱量 kcal
              <input type="number" value={analyzedWater.calories || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, calories: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="text-xs font-bold text-neutral-400">
              碳水 g
              <input type="number" value={analyzedWater.carbs || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, carbs: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
            </label>
            <label className="col-span-2 text-xs font-bold text-neutral-400">
              膳食纖維 g
              <input type="number" value={analyzedWater.fiber || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, fiber: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-lime-500" />
            </label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-neutral-300 text-sm">飲用份量/比例</label>
            <span className="font-bold text-teal-400 text-lg">{portion} 份</span>
          </div>
          <input type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
          <div className="flex justify-between mt-3 pt-3 border-t border-neutral-700 text-center">
            <div className="w-full"><div className="text-xs text-neutral-400">總容量</div><div className="text-base font-bold text-blue-400">{Math.round(analyzedWater.amount * portion)} ml</div></div>
          </div>
          {((analyzedWater.calories || 0) > 0) && (
            <div className="grid grid-cols-5 mt-3 pt-3 border-t border-neutral-700 text-center divide-x divide-neutral-700">
              <div><div className="text-[11px] text-neutral-400">熱量</div><div className="text-base font-bold text-orange-500">{Math.round((analyzedWater.calories || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">蛋白</div><div className="text-base font-bold text-blue-400">{Math.round((analyzedWater.protein || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">碳水</div><div className="text-base font-bold text-amber-400">{Math.round((analyzedWater.carbs || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">脂肪</div><div className="text-base font-bold text-green-400">{Math.round((analyzedWater.fat || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">纖維</div><div className="text-base font-bold text-lime-400">{Math.round((analyzedWater.fiber || 0) * portion)}</div></div>
            </div>
          )}
        </div>
      )}

      {analyzedActivity && (
        <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-bold text-neutral-400">
            運動名稱
            <input value={analyzedActivity.activityName || ''} onChange={e => setAnalyzedActivity({ ...analyzedActivity, activityName: e.target.value })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
          </label>
          <label className="text-xs font-bold text-neutral-400">
            消耗 kcal
            <input type="number" value={analyzedActivity.activeCalories || ''} onChange={e => setAnalyzedActivity({ ...analyzedActivity, activeCalories: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
          </label>
          <label className="text-xs font-bold text-neutral-400">
            時間 分鐘
            <input type="number" value={analyzedActivity.exerciseMinutes || ''} onChange={e => setAnalyzedActivity({ ...analyzedActivity, exerciseMinutes: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-teal-500" />
          </label>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-sm text-amber-100 leading-relaxed">
          <div className="font-bold text-amber-300 mb-2">儲存前請確認</div>
          {warnings.map(warning => (
            <div key={warning}>・{warning}</div>
          ))}
        </div>
      )}

      {(analyzedFood?.notes || analyzedActivity?.notes || analyzedWater?.notes) && (
        <div className="mb-4 p-4 bg-teal-900/20 border border-teal-500/30 rounded-xl text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap shadow-inner">
          <div className="flex items-center gap-2 text-teal-400 font-bold mb-2 text-xs uppercase tracking-wider">
            <Icons.ScanEye className="w-4 h-4" /> AI 建議與點評
          </div>
          {analyzedFood ? analyzedFood.notes : (analyzedWater ? analyzedWater.notes : analyzedActivity?.notes)}
        </div>
      )}

      {(analyzedFood || analyzedWater) && (
        <div className="mb-4 flex items-center gap-2 cursor-pointer" onClick={() => setAddToFavorites(!addToFavorites)}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center ${addToFavorites ? 'bg-rose-500 border-rose-500' : 'border-neutral-500'}`}>
            {addToFavorites && <Icons.Check className="w-3.5 h-3.5 text-white" />}
          </div>
          <label className="text-sm text-neutral-300 font-bold cursor-pointer select-none">加入常用{analyzedWater ? '容器' : '食物'}</label>
        </div>
      )}

      {/*
        Sticky footer：這是「不用自己滑去找按鈕」的核心。
        position:sticky + bottom:0 會在卡片仍在畫面內時，把按鈕列往上拉到視窗底部，
        因此不論卡片多長（warnings / notes 長度不定）、也不論捲到哪裡，
        「取消 / 確認加入」永遠可見可點。-mx-5/-mb-5 抵銷卡片的 p-5 讓它貼齊卡片邊緣。
      */}
      <div className="sticky bottom-0 -mx-5 -mb-5 px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 rounded-b-2xl flex gap-3">
        <button onClick={() => { setAnalyzedFood(null); setAnalyzedActivity(null); setAnalyzedWater(null) }} className="flex-1 py-4 text-base border border-neutral-700 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800 active:scale-95 transition-all">取消</button>
        <button onClick={() => saveLog(analyzedFood ? 'food' : (analyzedWater ? 'water' : 'activity'))} className="flex-[2] py-4 text-base bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-500 shadow-md active:scale-95 transition-all">
          <Icons.Save className="w-5 h-5" /> 確認加入
        </button>
      </div>
    </div>
  );
};
