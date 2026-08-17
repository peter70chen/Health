import type {
  ActivityLog,
  FavoriteFood,
  FavoriteWaterContainer,
  FoodLog,
  WaterLog,
  WeightLog
} from '../types';

type ImagePreviewItem = {
  imagePreview?: string;
};

const hasTransientImagePreview = (value?: string): boolean =>
  typeof value === 'string' && value.startsWith('blob:');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const removeTransientImagePreview = <T extends ImagePreviewItem>(item: T): T => {
  if (!hasTransientImagePreview(item.imagePreview)) return item;
  const { imagePreview, ...rest } = item;
  void imagePreview;
  return rest as T;
};

export const sanitizeFoodLogs = (logs: FoodLog[]): FoodLog[] =>
  logs.map(removeTransientImagePreview);

export const sanitizeActivityLogs = (logs: ActivityLog[]): ActivityLog[] =>
  logs.map(removeTransientImagePreview);

export const sanitizeWaterLogs = (logs: WaterLog[]): WaterLog[] =>
  logs
    .filter(log => log.type !== 'food_water')
    .map(removeTransientImagePreview);

/**
 * 體重資料的公開格式只有身體組成欄位。
 * 採 allowlist，不把未知欄位 spread 回去，讓 legacy dose、體重 notes
 * 與日後意外混入的本機欄位在所有資料邊界都被移除。
 */
export const sanitizeWeightLogs = (value: unknown): WeightLog[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry): WeightLog[] => {
    if (!isRecord(entry)) return [];

    const id = finiteNumber(entry.id);
    const weight = finiteNumber(entry.weight);
    const date = typeof entry.date === 'string' ? entry.date.trim() : '';
    if (id === undefined || weight === undefined || date === '') return [];

    const log: WeightLog = { id, date, weight };
    const optionalFields: Array<keyof Pick<WeightLog, 'bodyFat' | 'muscle' | 'visceral'>> = [
      'bodyFat',
      'muscle',
      'visceral'
    ];
    optionalFields.forEach(field => {
      const parsed = finiteNumber(entry[field]);
      if (parsed !== undefined) log[field] = parsed;
    });

    return [log];
  });
};

export const sanitizeFavoriteFoods = (foods: FavoriteFood[]): FavoriteFood[] =>
  foods.map(food => removeTransientImagePreview(food as FavoriteFood & ImagePreviewItem));

export const sanitizeFavoriteWaterContainers = (
  containers: FavoriteWaterContainer[]
): FavoriteWaterContainer[] =>
  containers.map(container => removeTransientImagePreview(container as FavoriteWaterContainer & ImagePreviewItem));
