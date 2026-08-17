import { useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/config';
import {
  sanitizeActivityLogs,
  sanitizeFavoriteFoods,
  sanitizeFavoriteWaterContainers,
  sanitizeFoodLogs,
  sanitizeWaterLogs,
  sanitizeWeightLogs
} from '../lib/dataSanitizers';
import { COACH_ADVICE_VERSION } from '../lib/prompts';
import { safeLoadFromStorage, sortByDateAndIdDesc } from '../lib/utils';
import type {
  ApiKeys,
  WeightLog,
  FoodLog,
  ActivityLog,
  WaterLog,
  FavoriteFood,
  FavoriteWaterContainer,
  ResistanceDef,
  ResistanceLog
} from '../types';

type LoadArgs = {
  setWeightLogs: (value: WeightLog[]) => void;
  setFoodLogs: (value: FoodLog[]) => void;
  setActivityLogs: (value: ActivityLog[]) => void;
  setFavoriteFoods: (value: FavoriteFood[]) => void;
  setWaterLogs: (value: WaterLog[]) => void;
  setFavoriteWaterContainers: (value: FavoriteWaterContainer[]) => void;
  setResistanceDefs: (value: ResistanceDef[]) => void;
  setResistanceLogs: (value: ResistanceLog[]) => void;
  setCoachAdvice: (value: string) => void;
  setDailyTarget: (value: number) => void;
  setActivityTarget: (value: number) => void;
  setWaterTarget: (value: number) => void;
  setApiKeys: (value: ApiKeys) => void;
  setLoading: (value: boolean) => void;
};

type PersistArgs = {
  loading: boolean;
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
};

export const useHydrateFromStorage = ({
  setWeightLogs,
  setFoodLogs,
  setActivityLogs,
  setFavoriteFoods,
  setWaterLogs,
  setFavoriteWaterContainers,
  setResistanceDefs,
  setResistanceLogs,
  setCoachAdvice,
  setDailyTarget,
  setActivityTarget,
  setWaterTarget,
  setApiKeys,
  setLoading
}: LoadArgs) => {
  useEffect(() => {
    setWeightLogs(sortByDateAndIdDesc(sanitizeWeightLogs(safeLoadFromStorage(STORAGE_KEYS.WEIGHT_LOGS, []))));
    setFoodLogs(sortByDateAndIdDesc(sanitizeFoodLogs(safeLoadFromStorage(STORAGE_KEYS.FOOD_LOGS, []))));
    setActivityLogs(sortByDateAndIdDesc(sanitizeActivityLogs(safeLoadFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, []))));
    setFavoriteFoods(sanitizeFavoriteFoods(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_FOODS, [])));
    setWaterLogs(sortByDateAndIdDesc(sanitizeWaterLogs(safeLoadFromStorage(STORAGE_KEYS.WATER_LOGS, []))));
    setFavoriteWaterContainers(sanitizeFavoriteWaterContainers(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_WATER_CONTAINERS, [])));
    setResistanceDefs(safeLoadFromStorage(STORAGE_KEYS.RESISTANCE_DEFS, []));
    setResistanceLogs(sortByDateAndIdDesc(safeLoadFromStorage(STORAGE_KEYS.RESISTANCE_LOGS, [])));

    const ca = localStorage.getItem(STORAGE_KEYS.COACH_ADVICE);
    const coachAdviceVersion = localStorage.getItem(STORAGE_KEYS.COACH_ADVICE_VERSION);
    const dt = localStorage.getItem(STORAGE_KEYS.DAILY_TARGET);
    const at = localStorage.getItem(STORAGE_KEYS.ACTIVITY_TARGET);
    const wt = localStorage.getItem(STORAGE_KEYS.WATER_TARGET);
    const k = localStorage.getItem(STORAGE_KEYS.API_KEYS);

    if (coachAdviceVersion === COACH_ADVICE_VERSION && ca) {
      setCoachAdvice(ca);
    } else {
      // 舊版建議可能含已移除的產品假設，載入時直接失效，不依賴關鍵字搜尋。
      localStorage.removeItem(STORAGE_KEYS.COACH_ADVICE);
      localStorage.setItem(STORAGE_KEYS.COACH_ADVICE_VERSION, COACH_ADVICE_VERSION);
    }
    if (dt) setDailyTarget(Number(dt));
    if (at) setActivityTarget(Number(at));
    if (wt) setWaterTarget(Number(wt));
    if (k) {
      try {
        setApiKeys(JSON.parse(k));
      } catch {
        // ignore invalid stored keys
      }
    }
    setLoading(false);
  }, [
    setWeightLogs,
    setFoodLogs,
    setActivityLogs,
    setFavoriteFoods,
    setWaterLogs,
    setFavoriteWaterContainers,
    setResistanceDefs,
    setResistanceLogs,
    setCoachAdvice,
    setDailyTarget,
    setActivityTarget,
    setWaterTarget,
    setApiKeys,
    setLoading
  ]);
};

export const usePersistToStorage = ({
  loading,
  weightLogs,
  foodLogs,
  activityLogs,
  favoriteFoods,
  waterLogs,
  favoriteWaterContainers,
  coachAdvice,
  dailyTarget,
  activityTarget,
  waterTarget,
  resistanceDefs,
  resistanceLogs
}: PersistArgs) => {
  useEffect(() => {
    if (loading) return;
    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(sanitizeWeightLogs(weightLogs)));
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(sanitizeFoodLogs(foodLogs)));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(sanitizeActivityLogs(activityLogs)));
    localStorage.setItem(STORAGE_KEYS.FAVORITE_FOODS, JSON.stringify(sanitizeFavoriteFoods(favoriteFoods)));
    localStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(sanitizeWaterLogs(waterLogs)));
    localStorage.setItem(STORAGE_KEYS.FAVORITE_WATER_CONTAINERS, JSON.stringify(sanitizeFavoriteWaterContainers(favoriteWaterContainers)));
    localStorage.setItem(STORAGE_KEYS.COACH_ADVICE, coachAdvice);
    localStorage.setItem(STORAGE_KEYS.COACH_ADVICE_VERSION, COACH_ADVICE_VERSION);
    localStorage.setItem(STORAGE_KEYS.DAILY_TARGET, dailyTarget.toString());
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_TARGET, activityTarget.toString());
    localStorage.setItem(STORAGE_KEYS.WATER_TARGET, waterTarget.toString());
    localStorage.setItem(STORAGE_KEYS.RESISTANCE_DEFS, JSON.stringify(resistanceDefs));
    localStorage.setItem(STORAGE_KEYS.RESISTANCE_LOGS, JSON.stringify(resistanceLogs));
  }, [
    loading,
    weightLogs,
    foodLogs,
    activityLogs,
    favoriteFoods,
    waterLogs,
    favoriteWaterContainers,
    coachAdvice,
    dailyTarget,
    activityTarget,
    waterTarget,
    resistanceDefs,
    resistanceLogs
  ]);
};
