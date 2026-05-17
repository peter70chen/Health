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
    dose?: string;
    notes?: string;
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
    baseCalories?: number;
    baseProtein?: number;
    baseCarbs?: number;
    baseFat?: number;
    baseAmount?: number;
    portion?: number;
    amount?: number;
    isManual?: boolean;
    isHidden?: boolean;
    notes?: string;
    imagePreview?: string;
    linkId?: number;
    _source?: string;
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

// Analyzed Food Result
export interface AnalyzedFood {
    foodName: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    amount?: number;
    notes?: string;
    imagePreview?: string;
    isText?: boolean;
    warnings?: string[];
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
}

// Manual Form State
export interface ManualFormState {
    name: string;
    val1: string;
    val2: string;
    val3: string;
    val4: string;
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
