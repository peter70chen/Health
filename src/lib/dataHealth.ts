import type { ActivityLog, FoodLog, ResistanceLog, WaterLog, WeightLog } from '../types';

export type DataHealthIssue = {
  id: string;
  level: 'warning' | 'error';
  title: string;
  detail: string;
};

type DataHealthInput = {
  weightLogs: WeightLog[];
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  waterLogs: WaterLog[];
  resistanceLogs: ResistanceLog[];
};

const isInvalidDate = (date: string): boolean =>
  !date || Number.isNaN(new Date(date).getTime());

const hasBlobPreview = (imagePreview?: string): boolean =>
  typeof imagePreview === 'string' && imagePreview.startsWith('blob:');

const duplicateKeyCount = <T>(items: T[], getKey: (item: T) => string): number => {
  const seen = new Set<string>();
  let duplicates = 0;
  items.forEach(item => {
    const key = getKey(item);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  });
  return duplicates;
};

export const getDataHealthIssues = ({
  weightLogs,
  foodLogs,
  activityLogs,
  waterLogs,
  resistanceLogs
}: DataHealthInput): DataHealthIssue[] => {
  const issues: DataHealthIssue[] = [];
  const invalidWeightDates = weightLogs.filter(log => isInvalidDate(log.date)).length;
  const invalidFoodDates = foodLogs.filter(log => isInvalidDate(log.date)).length;
  const invalidActivityDates = activityLogs.filter(log => isInvalidDate(log.date)).length;
  const invalidWaterDates = waterLogs.filter(log => isInvalidDate(log.date)).length;
  const invalidResistanceDates = resistanceLogs.filter(log => isInvalidDate(log.date)).length;
  const invalidDateCount = invalidWeightDates + invalidFoodDates + invalidActivityDates + invalidWaterDates + invalidResistanceDates;

  if (invalidDateCount > 0) {
    issues.push({
      id: 'invalid-dates',
      level: 'error',
      title: '有資料缺少有效日期',
      detail: `共 ${invalidDateCount} 筆日期無法判讀，可能會影響圖表與歷史查詢。`
    });
  }

  const legacyFoodWaterCount = waterLogs.filter(log => log.type === 'food_water').length;
  if (legacyFoodWaterCount > 0) {
    issues.push({
      id: 'legacy-food-water',
      level: 'warning',
      title: '仍有舊版食物水分紀錄',
      detail: `共 ${legacyFoodWaterCount} 筆舊 food_water 紀錄，建議重新整理或匯出備份後再清理。`
    });
  }

  const blobPreviewCount = [
    ...foodLogs.map(log => log.imagePreview),
    ...activityLogs.map(log => log.imagePreview),
    ...waterLogs.map(log => log.imagePreview)
  ].filter(hasBlobPreview).length;
  if (blobPreviewCount > 0) {
    issues.push({
      id: 'blob-previews',
      level: 'warning',
      title: '有失效風險的暫時圖片',
      detail: `共 ${blobPreviewCount} 筆 blob 圖片預覽，重新開啟 App 後可能看不到圖片。`
    });
  }

  const suspiciousFood = foodLogs.filter(log =>
    (log.calories || 0) < 0 ||
    (log.calories || 0) > 3000 ||
    (log.protein || 0) > 200 ||
    (log.carbs || 0) > 400 ||
    (log.fat || 0) > 200
  ).length;
  if (suspiciousFood > 0) {
    issues.push({
      id: 'suspicious-food',
      level: 'warning',
      title: '飲食資料有極端數字',
      detail: `共 ${suspiciousFood} 筆飲食紀錄的熱量或營養素看起來偏離常見範圍。`
    });
  }

  const suspiciousTraining = [
    ...activityLogs.filter(log => (log.activeCalories || 0) < 0 || (log.activeCalories || 0) > 2500 || (log.exerciseMinutes || 0) > 600),
    ...resistanceLogs.filter(log => (log.totalCalories || 0) < 0 || (log.totalCalories || 0) > 2500)
  ].length;
  if (suspiciousTraining > 0) {
    issues.push({
      id: 'suspicious-training',
      level: 'warning',
      title: '訓練資料有極端數字',
      detail: `共 ${suspiciousTraining} 筆運動或阻力訓練紀錄需要確認。`
    });
  }

  const suspiciousWater = waterLogs.filter(log => (log.amount || 0) <= 0 || (log.amount || 0) > 5000).length;
  if (suspiciousWater > 0) {
    issues.push({
      id: 'suspicious-water',
      level: 'warning',
      title: '飲水資料有極端數字',
      detail: `共 ${suspiciousWater} 筆飲水紀錄容量小於等於 0 或超過 5000ml。`
    });
  }

  const duplicateWeightCount = duplicateKeyCount(weightLogs, log => `${log.date}-${log.id}`);
  const duplicateFoodCount = duplicateKeyCount(foodLogs, log => `${log.date}-${log.id}`);
  const duplicateActivityCount = duplicateKeyCount(activityLogs, log => `${log.date}-${log.id}`);
  const duplicateWaterCount = duplicateKeyCount(waterLogs, log => `${log.date}-${log.id}`);
  const duplicateResistanceCount = duplicateKeyCount(resistanceLogs, log => `${log.date}-${log.id}`);
  const duplicates = duplicateWeightCount + duplicateFoodCount + duplicateActivityCount + duplicateWaterCount + duplicateResistanceCount;

  if (duplicates > 0) {
    issues.push({
      id: 'duplicate-records',
      level: 'warning',
      title: '可能有重複紀錄',
      detail: `共 ${duplicates} 筆資料的日期與 ID 重複，可能是匯入或同步造成。`
    });
  }

  return issues;
};
