import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons';
import { NUTRIENTS } from '../../lib/nutrientTheme';
import { getActivityWarnings, getFoodWarnings, getWaterWarnings } from '../../lib/analysisWarnings';
import { updateFoodItemGrams } from '../../lib/foodAnalysis';
import { CONFIG } from '../../lib/config';
import type { AnalyzedFood, AnalyzedActivity, AnalyzedWater, SaveLogType } from '../../types';

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
  saveLog: (type: SaveLogType) => void;
  isAnalyzing: boolean;
  onRefineFood: (answers: string, usePro: boolean) => void;
  onCancel: () => void;
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
  saveLog,
  isAnalyzing,
  onRefineFood,
  onCancel
}) => {
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  useEffect(() => {
    setClarificationAnswer('');
  }, [analyzedFood?.analysis?.analyzedAt]);
  if (!analyzedFood && !analyzedActivity && !analyzedWater) return null;

  const warnings = analyzedFood
    ? getFoodWarnings(analyzedFood)
    : analyzedActivity
      ? getActivityWarnings(analyzedActivity)
      : analyzedWater
        ? getWaterWarnings(analyzedWater)
        : [];

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
              <span className={`${NUTRIENTS.calories.text} text-sm font-bold`}>
                估計整份: {analyzedFood.calories} kcal
                {analyzedFood.calorieRange && (
                  <span className="ml-1 text-xs font-medium text-neutral-400">
                    ({analyzedFood.calorieRange.low.calories}-{analyzedFood.calorieRange.high.calories})
                  </span>
                )}
              </span>
              <span className="text-xs text-neutral-400">
                約 {analyzedFood.amount || 0}g
                {analyzedFood.analysis?.model && ` · ${analyzedFood.analysis.model}`}
              </span>
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
          {analyzedFood.clarificationQuestions && analyzedFood.clarificationQuestions.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-950/30 p-3">
              <div className="text-xs font-bold text-amber-300 mb-1">這些資訊可讓估算更準</div>
              {analyzedFood.clarificationQuestions.map(question => (
                <div key={question} className="text-xs text-amber-100">・{question}</div>
              ))}
              <textarea
                aria-label="補充食物分析資訊"
                value={clarificationAnswer}
                onChange={event => setClarificationAnswer(event.target.value)}
                rows={2}
                placeholder="直接回答上面的問題"
                className="mt-3 w-full resize-none rounded-lg border border-amber-500/30 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-amber-400"
              />
              <button
                onClick={() => onRefineFood(clarificationAnswer, false)}
                disabled={isAnalyzing || !clarificationAnswer.trim()}
                className="mt-2 min-h-[44px] w-full rounded-lg bg-amber-600 text-sm font-bold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                依補充內容重新分析
              </button>
            </div>
          )}

          {analyzedFood.items && analyzedFood.items.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-neutral-300 mb-2">照片中的食物項目</div>
              <div className="space-y-2">
                {analyzedFood.items.map(item => (
                  <div key={item.id} className="grid grid-cols-[1fr_92px] gap-3 items-center rounded-lg bg-neutral-900/70 border border-neutral-700 p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white break-words">{item.name}</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        範圍 {item.grams.low}-{item.grams.high}g · {item.confidence === 'high' ? '高把握' : item.confidence === 'medium' ? '中等把握' : '低把握'}
                      </div>
                      {item.evidence && <div className="text-[11px] text-neutral-400 mt-1">{item.evidence}</div>}
                    </div>
                    <label className="text-[11px] font-bold text-neutral-400">
                      重量 g
                      <input
                        type="number"
                        min="0"
                        value={item.grams.mid}
                        onChange={event => setAnalyzedFood(updateFoodItemGrams(analyzedFood, item.id, Number(event.target.value) || 0))}
                        className="mt-1 w-full bg-neutral-950 border border-neutral-600 rounded-lg px-2 py-2 text-sm text-white outline-none focus:border-teal-500"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <input type="number" value={analyzedFood.fiber || ''} onChange={e => setAnalyzedFood({ ...analyzedFood, fiber: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-neutral-300 text-sm">我實際吃了多少</label>
            <span className="font-bold text-teal-400 text-lg">{Math.round(portion * 100)}%</span>
          </div>
          <input aria-label="實際食用份量" type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
          <div className="grid grid-cols-5 mt-3 pt-3 border-t border-neutral-700 text-center divide-x divide-neutral-700">
            <div><div className="text-[11px] text-neutral-400">熱量</div><div className={`text-base font-bold ${NUTRIENTS.calories.text}`}>{Math.round(analyzedFood.calories * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">蛋白</div><div className={`text-base font-bold ${NUTRIENTS.protein.text}`}>{Math.round((analyzedFood.protein || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">碳水</div><div className={`text-base font-bold ${NUTRIENTS.carbs.text}`}>{Math.round((analyzedFood.carbs || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">脂肪</div><div className={`text-base font-bold ${NUTRIENTS.fat.text}`}>{Math.round((analyzedFood.fat || 0) * portion)}</div></div>
            <div><div className="text-[11px] text-neutral-400">纖維</div><div className={`text-base font-bold ${NUTRIENTS.fiber.text}`}>{Math.round((analyzedFood.fiber || 0) * portion)}</div></div>
          </div>
          {CONFIG.ENABLE_PRO_REVIEW && analyzedFood.analysis && analyzedFood.confidence !== 'high' && (
            <button
              onClick={() => onRefineFood('', true)}
              disabled={isAnalyzing}
              className="mt-4 min-h-[44px] w-full rounded-lg border border-teal-500/50 bg-teal-950/30 text-sm font-bold text-teal-300 hover:bg-teal-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              用 Pro 精準模式重看
            </button>
          )}
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
              <input type="number" value={analyzedWater.fiber || ''} onChange={e => setAnalyzedWater({ ...analyzedWater, fiber: Number(e.target.value) || 0 })} className="mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500" />
            </label>
          </div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-neutral-300 text-sm">飲用份量/比例</label>
            <span className="font-bold text-teal-400 text-lg">{portion} 份</span>
          </div>
          <input aria-label="實際飲用份量" type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
          <div className="flex justify-between mt-3 pt-3 border-t border-neutral-700 text-center">
            <div className="w-full"><div className="text-xs text-neutral-400">總容量</div><div className="text-base font-bold text-blue-400">{Math.round(analyzedWater.amount * portion)} ml</div></div>
          </div>
          {((analyzedWater.calories || 0) > 0) && (
            <div className="grid grid-cols-5 mt-3 pt-3 border-t border-neutral-700 text-center divide-x divide-neutral-700">
              <div><div className="text-[11px] text-neutral-400">熱量</div><div className={`text-base font-bold ${NUTRIENTS.calories.text}`}>{Math.round((analyzedWater.calories || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">蛋白</div><div className={`text-base font-bold ${NUTRIENTS.protein.text}`}>{Math.round((analyzedWater.protein || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">碳水</div><div className={`text-base font-bold ${NUTRIENTS.carbs.text}`}>{Math.round((analyzedWater.carbs || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">脂肪</div><div className={`text-base font-bold ${NUTRIENTS.fat.text}`}>{Math.round((analyzedWater.fat || 0) * portion)}</div></div>
              <div><div className="text-[11px] text-neutral-400">纖維</div><div className={`text-base font-bold ${NUTRIENTS.fiber.text}`}>{Math.round((analyzedWater.fiber || 0) * portion)}</div></div>
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

      {analyzedFood && ((analyzedFood.observations?.length || 0) > 0 || (analyzedFood.assumptions?.length || 0) > 0) && (
        <details className="mb-4 rounded-xl border border-neutral-700 bg-neutral-800/40 p-4 text-xs text-neutral-300">
          <summary className="cursor-pointer font-bold text-neutral-300">判斷依據與不確定處</summary>
          {(analyzedFood.observations?.length || 0) > 0 && (
            <div className="mt-3">
              <div className="font-bold text-teal-400 mb-1">照片看得到</div>
              {analyzedFood.observations?.map(item => <div key={item}>・{item}</div>)}
            </div>
          )}
          {(analyzedFood.assumptions?.length || 0) > 0 && (
            <div className="mt-3">
              <div className="font-bold text-amber-400 mb-1">仍需推測</div>
              {analyzedFood.assumptions?.map(item => <div key={item}>・{item}</div>)}
            </div>
          )}
        </details>
      )}

      {(analyzedFood || analyzedWater) && (
        <label className="relative mb-4 flex min-h-[44px] items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={addToFavorites}
            onChange={event => setAddToFavorites(event.target.checked)}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 peer"
          />
          <span aria-hidden="true" className={`pointer-events-none w-5 h-5 rounded border flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-rose-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-900 ${addToFavorites ? 'bg-rose-500 border-rose-500' : 'border-neutral-500'}`}>
            {addToFavorites && <Icons.Check className="w-3.5 h-3.5 text-white" />}
          </span>
          <span className="text-sm text-neutral-300 font-bold select-none">加入常用{analyzedWater ? '容器' : '食物'}</span>
        </label>
      )}

      {/*
        Sticky footer：這是「不用自己滑去找按鈕」的核心。
        position:sticky + bottom:0 會在卡片仍在畫面內時，把按鈕列往上拉到視窗底部，
        因此不論卡片多長（warnings / notes 長度不定）、也不論捲到哪裡，
        「取消 / 確認加入」永遠可見可點。-mx-5/-mb-5 抵銷卡片的 p-5 讓它貼齊卡片邊緣。
      */}
      <div className="sticky bottom-0 -mx-5 -mb-5 px-5 pt-3 pb-[var(--action-bar-pad)] bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 rounded-b-2xl flex gap-3">
        <button onClick={onCancel} className="flex-1 py-4 text-base border border-neutral-700 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800 active:scale-95 transition-all">取消</button>
        <button onClick={() => saveLog(analyzedFood ? 'food' : (analyzedWater ? 'water' : 'activity'))} className="flex-[2] py-4 text-base bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-500 shadow-md active:scale-95 transition-all">
          <Icons.Save className="w-5 h-5" /> 確認加入
        </button>
      </div>
    </div>
  );
};
