// API Keys Structure
export interface ApiKeys {
    free1: string;
    free2: string;
    free3: string;
    free4: string;
    free5: string;
    paid: string;
    [key: string]: string;
}

// Weight Log Entry
export interface WeightLog {
    id: number;
    date: string;
    weight: number;
    bodyFat?: number;
    muscle?: number;
    visceral?: number;
}

// Food Log Entry
export interface FoodLog {
    id: number;
    date: string;
    type: 'food';
    foodName: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFat?: number;
    baseFiber?: number;
    baseAmount?: number;
    amountUnit?: 'g' | 'ml';
    portion?: number;
    amount?: number;
    isManual?: boolean;
    isHidden?: boolean;
    notes?: string;
    imagePreview?: string;
    isText?: boolean;
    linkId?: number;
    _source?: string;
    analysis?: FoodAnalysisMetadata;
    analyzedItems?: AnalyzedFoodItem[];
    calorieRange?: NutritionRange;
    originalAnalysis?: NutritionValues;
}

// Activity Log Entry
export interface ActivityLog {
    id: number;
    date: string;
    type: 'activity';
    activityName?: string;
    activeCalories: number;
    exerciseMinutes?: number;
    steps?: number;
    isManual?: boolean;
    isHidden?: boolean;
    notes?: string;
    imagePreview?: string;
    _source?: string;
}

// Water Log Entry
export interface WaterLog {
    id: number;
    date: string;
    type: 'water' | 'food_water';
    beverageName?: string;
    amount: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    isManual?: boolean;
    isHidden?: boolean;
    notes?: string;
    imagePreview?: string;
    linkId?: number;
    _source?: string;
}

// Chart Data Point
export interface ChartData {
    date: string;
    disp: string;
    in?: number;
    out?: number;
    weight?: number;
    bodyFat?: number;
    ideal?: number;
}

export type FoodConfidence = 'high' | 'medium' | 'low';

export type NutritionSource =
    | 'nutrition_label'
    | 'taiwan_database'
    | 'user_confirmed'
    | 'model_estimate';

export interface NutritionValues {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export interface NutritionRange {
    low: NutritionValues;
    high: NutritionValues;
}

export interface WeightEstimate {
    low: number;
    mid: number;
    high: number;
}

export interface AnalyzedFoodItem {
    id: string;
    name: string;
    category: string;
    cookingMethod?: string;
    grams: WeightEstimate;
    originalGrams?: WeightEstimate;
    gramsSource?: 'model' | 'user' | 'memory';
    nutritionPer100g: NutritionValues;
    nutritionSource: NutritionSource;
    confidence: FoodConfidence;
    evidence?: string;
}

export interface FoodAnalysisMetadata {
    model: string;
    promptVersion: string;
    schemaVersion: string;
    analyzedAt: string;
    imageCount: number;
}

// Analyzed Food Result
export interface AnalyzedFood {
    foodName: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    amount?: number;
    notes?: string;
    /** AI 對這次辨識的把握程度，用來提醒使用者是否需人工微調 */
    confidence?: FoodConfidence;
    imagePreview?: string;
    isText?: boolean;
    warnings?: string[];
    items?: AnalyzedFoodItem[];
    calorieRange?: NutritionRange;
    observations?: string[];
    assumptions?: string[];
    clarificationQuestions?: string[];
    suggestedConsumedFraction?: number;
    nutritionLabelDetected?: boolean;
    analysis?: FoodAnalysisMetadata;
    modelNutrition?: NutritionValues;
}

// Analyzed Activity Result
export interface AnalyzedActivity {
    activityName?: string;
    activeCalories: number;
    steps?: number;
    exerciseMinutes?: number;
    notes?: string;
    imagePreview?: string;
    isText?: boolean;
    warnings?: string[];
}

// Analyzed Water Result
export interface AnalyzedWater {
    beverageName?: string;
    amount: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    notes?: string;
    imagePreview?: string;
    isText?: boolean;
    warnings?: string[];
}

// Favorite Food Item
export interface FavoriteFood {
    id: number;
    foodName: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    baseAmount?: number;
    amountUnit?: 'g';
}

// Favorite Water Container
export interface FavoriteWaterContainer {
    id: number;
    beverageName: string;
    amount: number;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
}

// Manual Form State
export interface ManualFormState {
    name: string;
    val1: string;
    val2: string;
    val3: string;
    val4: string;
    /** 食物：膳食纖維 (g)。其他類型未使用。 */
    val5: string;
}

// Confirm Modal State
export interface ConfirmModalState {
    id: number;
    type: 'food' | 'activity' | 'water' | 'weight' | 'resistanceDef' | 'resistanceLog' | 'favoriteFood' | 'favoriteWaterContainer';
}


// Target Modal State
export interface TargetModalState {
    type: 'daily' | 'activity';
    value: number;
}

// Range Query Results
export interface RangeQueryResults {
    totalIn: number;
    totalOut: number;
    netBalance: number;
    validDays: number;
    totalDaysInRange: number;
}

// Combined Daily List Item
export type DailyListItem = (FoodLog | ActivityLog | WaterLog) & {
    _source: 'food' | 'activity' | 'water';
};

// saveLog 的合法入口：'manual' 走手動表單，其餘走 AI 分析結果
export type SaveLogType = 'manual' | 'food' | 'activity' | 'water';

// Resistance Definition
export interface ResistanceDef {
    id: number;
    name: string;
}

// Resistance Item (in Log)
export interface ResistanceItem {
    defId: number;
    name: string;
    weight: number;
    sets: number;
    reps: number;
    time?: number; // seconds
}

// Resistance Log
export interface ResistanceLog {
    id: number;
    date: string;
    items: ResistanceItem[];
    totalCalories: number;
    notes?: string;
}
