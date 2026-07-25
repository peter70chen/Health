/**
 * Application Configuration Constants
 */
export const CONFIG = {
    // User physical data
    HEIGHT: 173,          // cm
    START_W: 86,          // Starting weight in kg
    TARGET_W: 73,         // Target weight in kg

    // Daily targets
    CAL_BUDGET: 1700,     // Base calorie budget
    DEFAULT_TARGET: 1700, // Default daily calorie target
    DEFAULT_ACTIVITY_TARGET: 400, // Default daily activity calorie target
    DEFAULT_WATER_TARGET: 2000,   // Default daily water target in ml

    // Macro targets
    PRO_TARGET: 90,       // Protein target in grams
    CARB_TARGET: 150,     // Carbs target in grams
    FAT_TARGET: 60,       // Fat target in grams

    // 膳食纖維目標 25g/day。
    // 依據 IOM/DGA 的「每 1000 kcal 攝取 14g 纖維」：1700 kcal × 14 ≈ 24g。
    // 男性一般建議的 30-38g 是以 2000-2500 kcal 計算，在熱量赤字下不適用。
    // 且 GLP-1 (猛健樂) 使用者常有噁心、脹氣、便秘等腸胃副作用，
    // 纖維過量會加重不適，25g 是飽足感與腸胃耐受度的平衡點。
    FIBER_TARGET: 25,     // Dietary fiber target in grams
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
    API_KEYS: 'mj_api_keys_v4',
    WEIGHT_LOGS: 'mj_weightLogs',
    FOOD_LOGS: 'mj_foodLogs',
    ACTIVITY_LOGS: 'mj_activityLogs',
    FAVORITE_FOODS: 'mj_favoriteFoods',
    WATER_LOGS: 'mj_waterLogs',
    FAVORITE_WATER_CONTAINERS: 'mj_favoriteWaterContainers',
    COACH_ADVICE: 'mj_coachAdvice',
    DAILY_TARGET: 'mj_dailyTarget',
    ACTIVITY_TARGET: 'mj_activityTarget',
    WATER_TARGET: 'mj_waterTarget',
    RESISTANCE_DEFS: 'mj_resistanceDefs',
    RESISTANCE_LOGS: 'mj_resistanceLogs',
    BACKUP_TOKEN: 'mj_backup_token',
    LAST_CLOUD_BACKUP: 'mj_last_cloud_backup',
} as const;

// For backwards compatibility
export const API_KEYS_STORAGE = STORAGE_KEYS.API_KEYS;
