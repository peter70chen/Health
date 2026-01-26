/**
 * Get local date as ISO string (YYYY-MM-DD)
 * Accounts for timezone offset
 */
export const getLocalISOString = (date = new Date()): string => {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 10);
    return localISOTime;
};

/**
 * Safe JSON parse from localStorage
 */
export const safeLoadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

/**
 * Format date for display (M/D)
 */
export const formatDateDisplay = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
};
