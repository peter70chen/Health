import {
  sanitizeActivityLogs,
  sanitizeFavoriteFoods,
  sanitizeFavoriteWaterContainers,
  sanitizeFoodLogs,
  sanitizeWaterLogs,
  sanitizeWeightLogs
} from './dataSanitizers';
import { COACH_ADVICE_VERSION } from './prompts';
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
  coachAdviceVersion?: string;
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
  weightLogs: sanitizeWeightLogs(exportData.weightLogs),
  foodLogs: sanitizeFoodLogs(exportData.foodLogs),
  activityLogs: sanitizeActivityLogs(exportData.activityLogs),
  favoriteFoods: sanitizeFavoriteFoods(exportData.favoriteFoods),
  waterLogs: sanitizeWaterLogs(exportData.waterLogs),
  favoriteWaterContainers: sanitizeFavoriteWaterContainers(exportData.favoriteWaterContainers),
  coachAdvice: exportData.coachAdviceVersion === COACH_ADVICE_VERSION ? exportData.coachAdvice : '',
  coachAdviceVersion: COACH_ADVICE_VERSION
});
