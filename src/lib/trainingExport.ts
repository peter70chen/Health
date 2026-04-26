import type { ActivityLog, ResistanceLog, WeightLog } from '../types';

type TrainingExportInput = {
  startDate: string;
  endDate: string;
  weightLogs: WeightLog[];
  activityLogs: ActivityLog[];
  resistanceLogs: ResistanceLog[];
};

const inRange = (date: string, startDate: string, endDate: string): boolean =>
  date >= startDate && date <= endDate;

export const buildTrainingExport = ({
  startDate,
  endDate,
  weightLogs,
  activityLogs,
  resistanceLogs
}: TrainingExportInput) => {
  const selectedWeights = weightLogs
    .filter(log => inRange(log.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date));
  const selectedActivities = activityLogs
    .filter(log => inRange(log.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date));
  const selectedResistance = resistanceLogs
    .filter(log => inRange(log.date, startDate, endDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  const allDates = Array.from(new Set([
    ...selectedWeights.map(log => log.date),
    ...selectedActivities.map(log => log.date),
    ...selectedResistance.map(log => log.date)
  ])).sort();

  const dailySummary = allDates.map(date => {
    const activities = selectedActivities.filter(log => log.date === date);
    const resistance = selectedResistance.filter(log => log.date === date);
    const weightsOnDate = selectedWeights.filter(log => log.date === date);
    const weight = weightsOnDate[weightsOnDate.length - 1];

    return {
      date,
      bodyComposition: weight ? {
        weight: weight.weight,
        bodyFat: weight.bodyFat,
        muscle: weight.muscle,
        visceral: weight.visceral,
        dose: weight.dose,
        notes: weight.notes
      } : null,
      cardioOrActivity: activities.map(log => ({
        name: log.activityName || '未命名運動',
        activeCalories: log.activeCalories,
        exerciseMinutes: log.exerciseMinutes,
        steps: log.steps,
        notes: log.notes
      })),
      resistanceTraining: resistance.map(log => ({
        totalCalories: log.totalCalories,
        notes: log.notes,
        items: log.items
      })),
      totals: {
        activeCalories: activities.reduce((sum, log) => sum + (log.activeCalories || 0), 0),
        resistanceCalories: resistance.reduce((sum, log) => sum + (log.totalCalories || 0), 0),
        exerciseMinutes: activities.reduce((sum, log) => sum + (log.exerciseMinutes || 0), 0)
      }
    };
  });

  const firstWeight = selectedWeights[0];
  const lastWeight = selectedWeights[selectedWeights.length - 1];

  return {
    exportType: 'training-and-body-composition',
    purpose: '提供給 AI 分析訓練紀錄與身體組成變化的關聯，請勿包含 API Key。',
    period: { startDate, endDate },
    summary: {
      daysWithData: allDates.length,
      activityLogCount: selectedActivities.length,
      resistanceLogCount: selectedResistance.length,
      weightLogCount: selectedWeights.length,
      totalActiveCalories: selectedActivities.reduce((sum, log) => sum + (log.activeCalories || 0), 0),
      totalResistanceCalories: selectedResistance.reduce((sum, log) => sum + (log.totalCalories || 0), 0),
      totalExerciseMinutes: selectedActivities.reduce((sum, log) => sum + (log.exerciseMinutes || 0), 0),
      weightChange: firstWeight && lastWeight ? Number((lastWeight.weight - firstWeight.weight).toFixed(1)) : null,
      bodyFatChange: firstWeight?.bodyFat !== undefined && lastWeight?.bodyFat !== undefined
        ? Number((lastWeight.bodyFat - firstWeight.bodyFat).toFixed(1))
        : null,
      muscleChange: firstWeight?.muscle !== undefined && lastWeight?.muscle !== undefined
        ? Number((lastWeight.muscle - firstWeight.muscle).toFixed(1))
        : null
    },
    dailySummary,
    rawData: {
      weightLogs: selectedWeights,
      activityLogs: selectedActivities,
      resistanceLogs: selectedResistance
    }
  };
};
