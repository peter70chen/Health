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
} as const;

// For backwards compatibility
export const API_KEYS_STORAGE = STORAGE_KEYS.API_KEYS;
