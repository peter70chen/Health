import { z } from 'zod';
import type {
  AnalyzedFood,
  AnalyzedFoodItem,
  FoodAnalysisMetadata,
  NutritionRange,
  NutritionValues
} from '../types';
import { findTaiwanNutrition } from './taiwanNutrition';

const nonNegativeNumber = z.number().finite().nonnegative();
const confidenceSchema = z.enum(['high', 'medium', 'low']);

const nutritionSchema = z.object({
  calories: nonNegativeNumber,
  protein: nonNegativeNumber,
  carbs: nonNegativeNumber,
  fat: nonNegativeNumber,
  fiber: nonNegativeNumber
});

const rawFoodItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  cookingMethod: z.string().optional().default(''),
  grams: z.object({
    low: nonNegativeNumber,
    mid: nonNegativeNumber,
    high: nonNegativeNumber
  }),
  nutritionPer100g: nutritionSchema,
  nutritionSource: z.enum([
    'nutrition_label',
    'taiwan_database',
    'user_confirmed',
    'model_estimate'
  ]),
  confidence: confidenceSchema,
  evidence: z.string().optional().default('')
});

const rawFoodAnalysisSchema = z.object({
  mealName: z.string().min(1),
  confidence: confidenceSchema,
  nutritionLabelDetected: z.boolean(),
  suggestedConsumedFraction: z.number().finite().catch(1)
    .transform(value => Math.min(1, Math.max(0.1, value))),
  observations: z.array(z.string()).catch([]).transform(values => values.slice(0, 8)),
  assumptions: z.array(z.string()).catch([]).transform(values => values.slice(0, 8)),
  clarificationQuestions: z.array(z.string()).catch([]).transform(values => values.slice(0, 2)),
  notes: z.string().catch('').transform(value => value.slice(0, 500)),
  items: z.array(rawFoodItemSchema).min(1).transform(values => values.slice(0, 20))
});

export type RawFoodAnalysis = z.infer<typeof rawFoodAnalysisSchema>;

export const FOOD_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mealName',
    'confidence',
    'nutritionLabelDetected',
    'suggestedConsumedFraction',
    'observations',
    'assumptions',
    'clarificationQuestions',
    'notes',
    'items'
  ],
  properties: {
    mealName: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    nutritionLabelDetected: { type: 'boolean' },
    suggestedConsumedFraction: { type: 'number', minimum: 0.1, maximum: 1 },
    observations: { type: 'array', maxItems: 8, items: { type: 'string' } },
    assumptions: { type: 'array', maxItems: 8, items: { type: 'string' } },
    clarificationQuestions: { type: 'array', maxItems: 2, items: { type: 'string' } },
    notes: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'name',
          'category',
          'cookingMethod',
          'grams',
          'nutritionPer100g',
          'nutritionSource',
          'confidence',
          'evidence'
        ],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          cookingMethod: { type: 'string' },
          grams: {
            type: 'object',
            additionalProperties: false,
            required: ['low', 'mid', 'high'],
            properties: {
              low: { type: 'number', minimum: 0 },
              mid: { type: 'number', minimum: 0 },
              high: { type: 'number', minimum: 0 }
            }
          },
          nutritionPer100g: {
            type: 'object',
            additionalProperties: false,
            required: ['calories', 'protein', 'carbs', 'fat', 'fiber'],
            properties: {
              calories: { type: 'number', minimum: 0 },
              protein: { type: 'number', minimum: 0 },
              carbs: { type: 'number', minimum: 0 },
              fat: { type: 'number', minimum: 0 },
              fiber: { type: 'number', minimum: 0 }
            }
          },
          nutritionSource: {
            type: 'string',
            enum: ['nutrition_label', 'taiwan_database', 'user_confirmed', 'model_estimate']
          },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          evidence: { type: 'string' }
        }
      }
    }
  }
} as const;

const zeroNutrition = (): NutritionValues => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
});

const roundNutrition = (nutrition: NutritionValues): NutritionValues => ({
  calories: Math.round(nutrition.calories),
  protein: Math.round(nutrition.protein * 10) / 10,
  carbs: Math.round(nutrition.carbs * 10) / 10,
  fat: Math.round(nutrition.fat * 10) / 10,
  fiber: Math.round(nutrition.fiber * 10) / 10
});

const addNutrition = (total: NutritionValues, value: NutritionValues): NutritionValues => ({
  calories: total.calories + value.calories,
  protein: total.protein + value.protein,
  carbs: total.carbs + value.carbs,
  fat: total.fat + value.fat,
  fiber: total.fiber + value.fiber
});

export const nutritionForGrams = (
  nutritionPer100g: NutritionValues,
  grams: number
): NutritionValues => {
  const multiplier = Math.max(0, grams) / 100;
  return roundNutrition({
    calories: nutritionPer100g.calories * multiplier,
    protein: nutritionPer100g.protein * multiplier,
    carbs: nutritionPer100g.carbs * multiplier,
    fat: nutritionPer100g.fat * multiplier,
    fiber: nutritionPer100g.fiber * multiplier
  });
};

export const calculateFoodTotals = (
  items: AnalyzedFoodItem[]
): { mid: NutritionValues; range: NutritionRange; amount: number } => {
  const totals = items.reduce(
    (result, item) => ({
      low: addNutrition(result.low, nutritionForGrams(item.nutritionPer100g, item.grams.low)),
      mid: addNutrition(result.mid, nutritionForGrams(item.nutritionPer100g, item.grams.mid)),
      high: addNutrition(result.high, nutritionForGrams(item.nutritionPer100g, item.grams.high)),
      amount: result.amount + item.grams.mid
    }),
    { low: zeroNutrition(), mid: zeroNutrition(), high: zeroNutrition(), amount: 0 }
  );

  return {
    mid: roundNutrition(totals.mid),
    range: {
      low: roundNutrition(totals.low),
      high: roundNutrition(totals.high)
    },
    amount: Math.round(totals.amount)
  };
};

const normalizeWeightRange = (
  grams: RawFoodAnalysis['items'][number]['grams']
): RawFoodAnalysis['items'][number]['grams'] => {
  const ordered = [grams.low, grams.mid, grams.high].sort((a, b) => a - b);
  return { low: ordered[0], mid: ordered[1], high: ordered[2] };
};

export const parseFoodAnalysis = (
  value: unknown,
  metadata: FoodAnalysisMetadata
): AnalyzedFood => {
  const parsed = rawFoodAnalysisSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || '未知欄位';
    throw new Error(`AI 食物分析格式不完整（${field}），請再試一次`);
  }

  const modelItems: AnalyzedFoodItem[] = parsed.data.items.map(item => ({
    ...item,
    grams: normalizeWeightRange(item.grams),
    originalGrams: normalizeWeightRange(item.grams),
    gramsSource: 'model'
  }));
  const rawModelTotals = calculateFoodTotals(modelItems);

  const items: AnalyzedFoodItem[] = modelItems.map(item => {
    const databaseMatch = item.nutritionSource === 'nutrition_label'
      ? null
      : findTaiwanNutrition(item.name);
    const calorieDifference = databaseMatch
      ? Math.abs(
        databaseMatch.nutritionPer100g.calories - item.nutritionPer100g.calories
      ) / Math.max(
        1,
        databaseMatch.nutritionPer100g.calories,
        item.nutritionPer100g.calories
      )
      : 0;
    const databaseLooksLikeDryStaple = databaseMatch
      ? databaseMatch.nutritionPer100g.carbs > 55
        && databaseMatch.nutritionPer100g.calories > 250
        && !/樣品狀態:熟|烹煮|即食/.test(databaseMatch.description)
      : false;
    const shouldUseDatabase = Boolean(
      databaseMatch
      && item.nutritionSource !== 'user_confirmed'
      && calorieDifference <= 0.4
      && !databaseLooksLikeDryStaple
    );
    return {
      ...item,
      nutritionPer100g: shouldUseDatabase
        ? databaseMatch!.nutritionPer100g
        : item.nutritionPer100g,
      nutritionSource: shouldUseDatabase ? 'taiwan_database' : item.nutritionSource,
      evidence: shouldUseDatabase
        ? `${item.evidence ? `${item.evidence}；` : ''}營養值採 TFDA「${databaseMatch!.name}」`
        : databaseMatch && calorieDifference > 0.4
          ? `${item.evidence ? `${item.evidence}；` : ''}TFDA 數值差異過大，保留本次估算`
          : item.evidence
    };
  });
  const totals = calculateFoodTotals(items);

  return {
    foodName: parsed.data.mealName,
    calories: totals.mid.calories,
    protein: totals.mid.protein,
    carbs: totals.mid.carbs,
    fat: totals.mid.fat,
    fiber: totals.mid.fiber,
    amount: totals.amount,
    confidence: parsed.data.confidence,
    notes: parsed.data.notes,
    items,
    calorieRange: totals.range,
    observations: parsed.data.observations,
    assumptions: parsed.data.assumptions,
    clarificationQuestions: parsed.data.clarificationQuestions,
    suggestedConsumedFraction: parsed.data.suggestedConsumedFraction,
    nutritionLabelDetected: parsed.data.nutritionLabelDetected,
    analysis: metadata,
    modelNutrition: rawModelTotals.mid
  };
};

export const updateFoodItemGrams = (
  food: AnalyzedFood,
  itemId: string,
  grams: number,
  gramsSource: 'user' | 'memory' = 'user'
): AnalyzedFood => {
  if (!food.items) return food;
  const safeGrams = Math.max(0, Math.round(grams));
  const items = food.items.map(item => {
    if (item.id !== itemId) return item;
    const reference = item.originalGrams ?? item.grams;
    const lowRatio = reference.mid > 0 ? reference.low / reference.mid : 0.8;
    const highRatio = reference.mid > 0 ? reference.high / reference.mid : 1.2;
    return {
      ...item,
      grams: {
        low: Math.round(safeGrams * lowRatio),
        mid: safeGrams,
        high: Math.round(safeGrams * highRatio)
      },
      gramsSource,
      evidence: gramsSource === 'memory'
        ? `${item.evidence ? `${item.evidence}；` : ''}已套用你過去確認的重量`
        : item.evidence
    };
  });
  const totals = calculateFoodTotals(items);
  return {
    ...food,
    items,
    amount: totals.amount,
    calories: totals.mid.calories,
    protein: totals.mid.protein,
    carbs: totals.mid.carbs,
    fat: totals.mid.fat,
    fiber: totals.mid.fiber,
    calorieRange: totals.range
  };
};
