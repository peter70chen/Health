import dataset from '../data/taiwanNutrition.json';
import type { NutritionValues } from '../types';

export interface TaiwanNutritionItem {
  id: number;
  code: string;
  name: string;
  aliases: string[];
  description: string;
  nutritionPer100g: NutritionValues;
  sourceUrl: string;
}

const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\d+(?:\.\d+)?\s*(?:g|克|公克|份|顆|片|碗|杯)/gi, '')
    .replace(/去皮|去骨|切片|切塊|熟|生/g, '')
    .replace(/[\s、，,./_-]/g, '')
    .trim();

const items = dataset.items as TaiwanNutritionItem[];
const officialNames = new Set(items.map(item => normalizeName(item.name)));
const aliasCounts = items.reduce((counts, item) => {
  for (const alias of item.aliases.map(normalizeName).filter(name => name.length >= 2)) {
    counts.set(alias, (counts.get(alias) ?? 0) + 1);
  }
  return counts;
}, new Map<string, number>());

const indexedItems = items.map(item => ({
  item,
  officialName: normalizeName(item.name),
  uniqueAliases: item.aliases
    .map(normalizeName)
    .filter(alias => (
      alias.length >= 2
      && aliasCounts.get(alias) === 1
      && !officialNames.has(alias)
    ))
}));

export const TAIWAN_NUTRITION_SOURCE = {
  name: dataset.source,
  home: dataset.sourceHome,
  generatedAt: dataset.generatedAt,
  itemCount: dataset.itemCount
} as const;

export const findTaiwanNutrition = (foodName: string): TaiwanNutritionItem | null => {
  const target = normalizeName(foodName);
  if (target.length < 2) return null;

  const officialMatch = indexedItems.find(entry => entry.officialName === target);
  if (officialMatch) return officialMatch.item;

  const aliasMatch = indexedItems.find(entry => entry.uniqueAliases.includes(target));
  return aliasMatch?.item ?? null;
};
