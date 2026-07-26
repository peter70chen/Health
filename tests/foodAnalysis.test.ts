import { describe, expect, it } from 'vitest';
import {
  calculateFoodTotals,
  nutritionForGrams,
  parseFoodAnalysis,
  updateFoodItemGrams
} from '../src/lib/foodAnalysis';
import { findTaiwanNutrition, TAIWAN_NUTRITION_SOURCE } from '../src/lib/taiwanNutrition';
import { applyFoodCorrectionMemory, rememberFoodCorrections } from '../src/lib/foodCorrectionMemory';
import { STORAGE_KEYS } from '../src/lib/config';

const metadata = {
  model: 'gemini-test',
  promptVersion: 'food-v2.0',
  schemaVersion: 'food-analysis-v2',
  analyzedAt: '2026-07-26T00:00:00.000Z',
  imageCount: 1
};

const validAnalysis = {
  mealName: '雞腿便當',
  confidence: 'medium',
  nutritionLabelDetected: false,
  suggestedConsumedFraction: 0.5,
  observations: ['白飯、雞腿與青菜清楚可見'],
  assumptions: ['雞腿醬汁含少量糖'],
  clarificationQuestions: ['白飯是否有剩下？'],
  notes: '白飯與醬汁用量最需要確認。',
  items: [
    {
      id: 'rice',
      name: '白飯',
      category: '主食',
      cookingMethod: '蒸',
      grams: { low: 180, mid: 200, high: 230 },
      nutritionPer100g: { calories: 130, protein: 2.4, carbs: 28, fat: 0.3, fiber: 0.4 },
      nutritionSource: 'nutrition_label',
      confidence: 'medium',
      evidence: '便當盒約四成'
    },
    {
      id: 'chicken',
      name: '滷雞腿',
      category: '蛋白質',
      cookingMethod: '滷',
      grams: { low: 100, mid: 120, high: 140 },
      nutritionPer100g: { calories: 215, protein: 24, carbs: 3, fat: 12, fiber: 0 },
      nutritionSource: 'model_estimate',
      confidence: 'medium',
      evidence: '一支帶骨雞腿'
    }
  ]
};

describe('food analysis calculations', () => {
  it('calculates nutrition deterministically from grams', () => {
    expect(nutritionForGrams(
      { calories: 200, protein: 10, carbs: 20, fat: 8, fiber: 4 },
      50
    )).toEqual({ calories: 100, protein: 5, carbs: 10, fat: 4, fiber: 2 });
  });

  it('uses item totals and does not apply consumed fraction twice', () => {
    const result = parseFoodAnalysis(validAnalysis, metadata);
    expect(result.calories).toBe(518);
    expect(result.amount).toBe(320);
    expect(result.suggestedConsumedFraction).toBe(0.5);
  });

  it('normalizes an out-of-order weight range', () => {
    const raw = structuredClone(validAnalysis);
    raw.items[0].grams = { low: 230, mid: 180, high: 200 };
    const result = parseFoodAnalysis(raw, metadata);
    expect(result.items?.[0].grams).toEqual({ low: 180, mid: 200, high: 230 });
  });

  it('rejects incomplete model output', () => {
    expect(() => parseFoodAnalysis({ mealName: '缺資料' }, metadata))
      .toThrow('AI 食物分析格式不完整');
  });

  it('recalculates totals after a user changes one item weight', () => {
    const original = parseFoodAnalysis(validAnalysis, metadata);
    const changed = updateFoodItemGrams(original, 'rice', 100);
    expect(changed.amount).toBe(220);
    expect(changed.calories).toBe(388);
    expect(changed.items?.[0].nutritionSource).toBe('nutrition_label');
    expect(changed.items?.[0].gramsSource).toBe('user');
  });

  it('sums low, middle and high estimates independently', () => {
    const result = parseFoodAnalysis(validAnalysis, metadata);
    const totals = calculateFoodTotals(result.items ?? []);
    expect(totals.range.low.calories).toBeLessThan(totals.mid.calories);
    expect(totals.range.high.calories).toBeGreaterThan(totals.mid.calories);
  });

  it('loads the curated Taiwan nutrition dataset and matches a common food', () => {
    expect(TAIWAN_NUTRITION_SOURCE.itemCount).toBeGreaterThanOrEqual(200);
    expect(TAIWAN_NUTRITION_SOURCE.itemCount).toBeLessThanOrEqual(500);
    expect(findTaiwanNutrition('白飯 200g')?.name).toBe('白飯');
  });

  it('does not fuzzy-match cooked dishes or ambiguous aliases', () => {
    expect(findTaiwanNutrition('大腸麵線')).toBeNull();
    expect(findTaiwanNutrition('蛤蜊冬粉')).toBeNull();
    expect(findTaiwanNutrition('豚骨拉麵')).toBeNull();
    expect(findTaiwanNutrition('楊桃')).toBeNull();
    expect(findTaiwanNutrition('土豆')).toBeNull();
  });

  it('does not replace a cooked staple estimate with a dry TFDA value', () => {
    const raw = structuredClone(validAnalysis);
    raw.mealName = '海鮮冬粉';
    raw.items = [{
      ...raw.items[0],
      id: 'noodles',
      name: '冬粉',
      grams: { low: 250, mid: 300, high: 350 },
      nutritionPer100g: { calories: 90, protein: 1, carbs: 22, fat: 0, fiber: 0 },
      nutritionSource: 'model_estimate'
    }];
    const result = parseFoodAnalysis(raw, metadata);
    expect(result.items?.[0].nutritionPer100g.calories).toBe(90);
    expect(result.items?.[0].nutritionSource).toBe('model_estimate');
  });

  it('does not count an automatically applied memory as a new confirmation', () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value)
      }
    });

    const original = parseFoodAnalysis(validAnalysis, metadata);
    const edited = updateFoodItemGrams(original, 'rice', 150);
    rememberFoodCorrections(edited);
    const remembered = applyFoodCorrectionMemory(parseFoodAnalysis(validAnalysis, metadata));
    rememberFoodCorrections(remembered);

    const memory = JSON.parse(storage.get(STORAGE_KEYS.FOOD_CORRECTION_MEMORY) || '{}');
    expect(remembered.items?.[0].gramsSource).toBe('memory');
    expect(memory['雞腿便當']['白飯'].confirmations).toBe(1);
  });
});
