import { describe, expect, it } from 'vitest';
import { sanitizeExportData } from '../src/lib/backupPayload';
import { sanitizeWeightLogs } from '../src/lib/dataSanitizers';
import { buildCoachPrompt, COACH_ADVICE_VERSION, PROMPTS } from '../src/lib/prompts';
import { buildTrainingExport } from '../src/lib/trainingExport';

const legacyWeightLogs = [
  {
    id: '101',
    date: '2026-08-17',
    weight: '75.5',
    bodyFat: '22.1',
    muscle: 31.2,
    visceral: 8,
    dose: '5.0',
    notes: 'legacy body note'
  }
];

describe('weight data removal boundary', () => {
  it('keeps body composition values but drops legacy dose, notes, and unknown fields', () => {
    const [log] = sanitizeWeightLogs(legacyWeightLogs);

    expect(log).toEqual({
      id: 101,
      date: '2026-08-17',
      weight: 75.5,
      bodyFat: 22.1,
      muscle: 31.2,
      visceral: 8
    });
    expect(log).not.toHaveProperty('dose');
    expect(log).not.toHaveProperty('notes');
  });

  it('drops malformed records without throwing', () => {
    expect(sanitizeWeightLogs([
      ...legacyWeightLogs,
      null,
      { id: 102, date: '', weight: 70 },
      { id: 103, date: '2026-08-16', weight: 'not-a-number' }
    ])).toHaveLength(1);
  });

  it('sanitizes export data and invalidates legacy coach advice', () => {
    const exportData = sanitizeExportData({
      weightLogs: legacyWeightLogs,
      foodLogs: [],
      activityLogs: [],
      favoriteFoods: [],
      waterLogs: [],
      favoriteWaterContainers: [],
      coachAdvice: 'legacy advice',
      dailyTarget: 1700,
      activityTarget: 400,
      waterTarget: 2000,
      resistanceDefs: [],
      resistanceLogs: []
    });

    expect(exportData.weightLogs[0]).not.toHaveProperty('dose');
    expect(exportData.weightLogs[0]).not.toHaveProperty('notes');
    expect(exportData.coachAdvice).toBe('');
    expect(exportData.coachAdviceVersion).toBe(COACH_ADVICE_VERSION);
  });

  it('keeps the training export body composition allowlist at both summary and raw data', () => {
    const result = buildTrainingExport({
      startDate: '2026-08-17',
      endDate: '2026-08-17',
      weightLogs: legacyWeightLogs,
      activityLogs: [],
      resistanceLogs: []
    });

    expect(result.dailySummary[0].bodyComposition).toEqual({
      weight: 75.5,
      bodyFat: 22.1,
      muscle: 31.2,
      visceral: 8
    });
    expect(result.rawData.weightLogs[0]).not.toHaveProperty('dose');
    expect(result.rawData.weightLogs[0]).not.toHaveProperty('notes');
  });
});

describe('general health coach prompt', () => {
  it('contains no medication or body-note dependency', () => {
    const prompt = buildCoachPrompt({
      startW: 76,
      endW: 75.5,
      totalIn: 8500,
      avgIn: 1214,
      totalOut: 1200,
      avgOut: 171,
      avgPro: 90,
      avgCarbs: 150,
      avgFat: 60,
      avgFiber: 25,
      proTarget: 90,
      fiberTarget: 25
    });

    expect(prompt).not.toMatch(/mounjaro|GLP-1|GIP|劑量|副作用|不適感/i);
    expect(prompt).not.toContain('{{');
    expect(PROMPTS.coachReview).not.toContain('{{dose}}');
  });
});
