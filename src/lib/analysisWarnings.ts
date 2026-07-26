import type { AnalyzedActivity, AnalyzedFood, AnalyzedWater } from '../types';
import { calculateFoodTotals } from './foodAnalysis';

/**
 * 正規化 AI 回傳的 confidence。
 *
 * Gemini 不保證遵守大小寫，可能回 "High" / "HIGH" / "high confidence" / 亂填。
 * 若直接用 `!== 'high'` 判斷，一個高把握的結果會被誤標成「把握度中等，建議微調」——
 * 對醫療使用者是誤導資訊。無法辨識的值一律回 undefined（徽章隱藏），
 * 寧可不顯示，也不要顯示錯的把握度。
 */
export const normalizeConfidence = (value: unknown): AnalyzedFood['confidence'] => {
  const text = String(value ?? '').trim().toLowerCase();
  // 用詞界比對而非 startsWith：startsWith('high') 會把 "highly uncertain"
  // 判成高把握（徽章直接不顯示），剛好把最需要提醒的情況吃掉。
  // `\b` 讓 "high" / "high confidence" 命中，"highly" 不命中。
  if (/^high\b/.test(text)) return 'high';
  if (/^(medium|mid|moderate)\b/.test(text)) return 'medium';
  if (/^low\b/.test(text)) return 'low';
  return undefined;
};

const macroCalories = (protein = 0, carbs = 0, fat = 0): number =>
  protein * 4 + carbs * 4 + fat * 9;

export const getFoodWarnings = (food: AnalyzedFood): string[] => {
  const warnings: string[] = [];
  const calories = food.calories || 0;
  const protein = food.protein || 0;
  const carbs = food.carbs || 0;
  const fat = food.fat || 0;
  const fiber = food.fiber || 0;
  const estimatedMacroCalories = macroCalories(protein, carbs, fat);

  if (!food.foodName?.trim()) warnings.push('食物名稱缺漏：AI 沒有明確辨識出食物名稱。');
  if (calories <= 0) warnings.push('熱量可疑：熱量是 0 或缺漏，儲存前請確認。');
  if (calories > 1500) warnings.push('熱量偏高：單筆食物超過 1500 kcal，可能是份量被高估。');
  if (protein + carbs + fat <= 0) warnings.push('營養素缺漏：蛋白質、碳水、脂肪都沒有有效數字。');
  if (protein > 120) warnings.push('蛋白質偏高：單筆蛋白質超過 120g，可能被 AI 高估。');
  if (carbs > 250) warnings.push('碳水偏高：單筆碳水超過 250g，請確認份量。');
  if (fat > 120) warnings.push('脂肪偏高：單筆脂肪超過 120g，請確認是否合理。');
  if (fiber > 40) warnings.push('纖維偏高：單筆膳食纖維超過 40g，AI 容易高估纖維，請確認。');
  if (fiber > 0 && fiber > carbs) warnings.push('纖維大於碳水：膳食纖維本身計入碳水，數值不合理，建議調低纖維。');
  if (food.confidence === 'low') warnings.push('辨識把握度低：建議回答補充問題、調整分項重量，或使用 Pro 精準模式重看。');
  if (food.calorieRange && calories > 0) {
    const rangeWidth = food.calorieRange.high.calories - food.calorieRange.low.calories;
    if (rangeWidth / calories > 0.5) {
      warnings.push('熱量範圍較寬：照片中的份量或油脂不明，請優先確認分項重量。');
    }
  }
  if (food.items?.length) {
    for (const item of food.items) {
      if (item.nutritionPer100g.calories > 900) {
        warnings.push(`${item.name} 每 100g 熱量超過 900 kcal，數值不可能，請重新確認。`);
      }
      if (item.nutritionPer100g.fiber > item.nutritionPer100g.carbs) {
        warnings.push(`${item.name} 的纖維高於總碳水，分項營養值不合理。`);
      }
    }
    const itemTotals = calculateFoodTotals(food.items).mid;
    if (calories > 0 && Math.abs(itemTotals.calories - calories) / calories > 0.05) {
      warnings.push('分項加總和整餐熱量不一致，請重新確認分項重量。');
    }
  }
  if (calories > 0 && estimatedMacroCalories > 0) {
    const diffRatio = Math.abs(estimatedMacroCalories - calories) / calories;
    if (diffRatio > 0.45) {
      warnings.push(`營養素換算不一致：蛋白/碳水/脂肪約 ${Math.round(estimatedMacroCalories)} kcal，和總熱量差距偏大。`);
    }
  }

  return warnings;
};

export const getActivityWarnings = (activity: AnalyzedActivity): string[] => {
  const warnings: string[] = [];
  const calories = activity.activeCalories || 0;
  const minutes = activity.exerciseMinutes || 0;
  const caloriesPerMinute = minutes > 0 ? calories / minutes : 0;

  if (calories <= 0) warnings.push('消耗熱量可疑：運動消耗是 0 或缺漏。');
  if (calories > 1500) warnings.push('消耗熱量偏高：單筆運動超過 1500 kcal，請確認時間與強度。');
  if (minutes > 300) warnings.push('運動時間偏長：超過 5 小時，可能被 AI 高估。');
  if (minutes > 0 && caloriesPerMinute > 20) warnings.push('每分鐘消耗偏高：可能是熱量或時間其中一個欄位不準。');
  if ((activity.steps || 0) > 50000) warnings.push('步數偏高：單筆超過 50,000 步，請確認。');

  return warnings;
};

export const getWaterWarnings = (water: AnalyzedWater): string[] => {
  const warnings: string[] = [];
  const amount = water.amount || 0;
  const calories = water.calories || 0;
  const carbs = water.carbs || 0;
  const estimatedSugarCalories = carbs * 4;

  if (!water.beverageName?.trim()) warnings.push('飲品名稱缺漏：AI 沒有明確辨識出飲品名稱。');
  if (amount <= 0) warnings.push('容量可疑：飲水量是 0 或缺漏。');
  if (amount > 2000) warnings.push('容量偏高：單次超過 2000ml，可能是容器或份量被高估。');
  if (calories > 800) warnings.push('飲品熱量偏高：若不是奶昔或含糖飲料，建議確認。');
  if (calories > 0 && estimatedSugarCalories > calories * 1.4) {
    warnings.push('飲品碳水與熱量不一致：碳水換算熱量高於總熱量太多。');
  }

  return warnings;
};
