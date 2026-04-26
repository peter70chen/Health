import type {
  ActivityLog,
  FavoriteFood,
  FavoriteWaterContainer,
  FoodLog,
  WaterLog
} from '../types';

type ImagePreviewItem = {
  imagePreview?: string;
};

const hasTransientImagePreview = (value?: string): boolean =>
  typeof value === 'string' && value.startsWith('blob:');

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

export const sanitizeFavoriteFoods = (foods: FavoriteFood[]): FavoriteFood[] =>
  foods.map(food => removeTransientImagePreview(food as FavoriteFood & ImagePreviewItem));

export const sanitizeFavoriteWaterContainers = (
  containers: FavoriteWaterContainer[]
): FavoriteWaterContainer[] =>
  containers.map(container => removeTransientImagePreview(container as FavoriteWaterContainer & ImagePreviewItem));
