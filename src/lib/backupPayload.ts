import {
  sanitizeActivityLogs,
  sanitizeFavoriteFoods,
  sanitizeFavoriteWaterContainers,
  sanitizeFoodLogs,
  sanitizeWaterLogs
} from './dataSanitizers';
import type {
  WeightLog,
  FoodLog,
  ActivityLog,
  WaterLog,
  FavoriteFood,
  FavoriteWaterContainer,
  ResistanceDef,
  ResistanceLog
} from '../types';

/** 備份檔內容（與手動匯出 JSON 相同格式；不含 API keys） */
export type ExportData = {
  weightLogs: WeightLog[];
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  favoriteFoods: FavoriteFood[];
  waterLogs: WaterLog[];
  favoriteWaterContainers: FavoriteWaterContainer[];
  coachAdvice: string;
  dailyTarget: number;
  activityTarget: number;
  waterTarget: number;
  resistanceDefs: ResistanceDef[];
  resistanceLogs: ResistanceLog[];
  foodCorrectionMemory?: string;
};

/** 手動匯出與雲端備份共用的資料淨化 */
export const sanitizeExportData = (exportData: ExportData): ExportData => ({
  ...exportData,
  foodLogs: sanitizeFoodLogs(exportData.foodLogs),
  activityLogs: sanitizeActivityLogs(exportData.activityLogs),
  favoriteFoods: sanitizeFavoriteFoods(exportData.favoriteFoods),
  waterLogs: sanitizeWaterLogs(exportData.waterLogs),
  favoriteWaterContainers: sanitizeFavoriteWaterContainers(exportData.favoriteWaterContainers)
});
