import { STORAGE_KEYS } from './config';
import { updateFoodItemGrams } from './foodAnalysis';
import type { AnalyzedFood } from '../types';

type RememberedItem = {
  grams: number;
  confirmations: number;
};

type FoodCorrectionMemory = Record<string, Record<string, RememberedItem>>;

const normalizeName = (value: string): string =>
  value.toLowerCase().replace(/[（(].*?[）)]/g, '').replace(/[\s、，,./_-]/g, '').trim();

const loadMemory = (): FoodCorrectionMemory => {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_CORRECTION_MEMORY) || '{}') as FoodCorrectionMemory;
  } catch {
    return {};
  }
};

export const applyFoodCorrectionMemory = (food: AnalyzedFood): AnalyzedFood => {
  if (!food.items?.length) return food;
  const mealMemory = loadMemory()[normalizeName(food.foodName)];
  if (!mealMemory) return food;

  return food.items.reduce((result, item) => {
    const remembered = mealMemory[normalizeName(item.name)];
    if (!remembered || remembered.confirmations < 1) return result;
    return updateFoodItemGrams(result, item.id, remembered.grams, 'memory');
  }, food);
};

export const rememberFoodCorrections = (food: AnalyzedFood): void => {
  if (typeof localStorage === 'undefined' || !food.items?.length) return;
  const confirmedItems = food.items.filter(item => item.gramsSource === 'user');
  if (confirmedItems.length === 0) return;

  const memory = loadMemory();
  const mealKey = normalizeName(food.foodName);
  const mealMemory = memory[mealKey] ?? {};
  for (const item of confirmedItems) {
    const itemKey = normalizeName(item.name);
    const previous = mealMemory[itemKey];
    const confirmations = (previous?.confirmations ?? 0) + 1;
    const grams = previous
      ? Math.round((previous.grams * previous.confirmations + item.grams.mid) / confirmations)
      : item.grams.mid;
    mealMemory[itemKey] = { grams, confirmations };
  }
  memory[mealKey] = mealMemory;
  localStorage.setItem(STORAGE_KEYS.FOOD_CORRECTION_MEMORY, JSON.stringify(memory));
};
