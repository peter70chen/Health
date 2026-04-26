import { useCallback, type RefObject, type ChangeEvent } from 'react';
import {
  sanitizeActivityLogs,
  sanitizeFavoriteFoods,
  sanitizeFavoriteWaterContainers,
  sanitizeFoodLogs,
  sanitizeWaterLogs
} from '../lib/dataSanitizers';
import { sortByDateAndIdDesc } from '../lib/utils';
import type {
  WeightLog,
  FoodLog,
  ActivityLog,
  WaterLog,
  FavoriteFood,
  FavoriteWaterContainer,
  ResistanceDef,
  ResistanceLog
} from '../types';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

type ExportData = {
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

type ImportSetters = {
  setWeightLogs: (value: WeightLog[]) => void;
  setFoodLogs: (value: FoodLog[]) => void;
  setActivityLogs: (value: ActivityLog[]) => void;
  setFavoriteFoods: (value: FavoriteFood[]) => void;
  setWaterLogs: (value: WaterLog[]) => void;
  setFavoriteWaterContainers: (value: FavoriteWaterContainer[]) => void;
  setCoachAdvice: (value: string) => void;
  setDailyTarget: (value: number) => void;
  setActivityTarget: (value: number) => void;
  setWaterTarget: (value: number) => void;
  setResistanceDefs: (value: ResistanceDef[]) => void;
  setResistanceLogs: (value: ResistanceLog[]) => void;
};

type HookArgs = {
  exportData: ExportData;
  importInputRef: RefObject<HTMLInputElement>;
  setStatusMessage: (value: StatusMessage) => void;
  getLocalISOString: () => string;
} & ImportSetters;

type FilePickerOptions = {
  suggestedName: string;
  types: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
};

type FileSystemWritableFileStreamLike = {
  write: (data: Blob | string) => Promise<void>;
  close: () => Promise<void>;
};

type FileSystemFileHandleLike = {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getImportCount = (value: unknown): number =>
  Array.isArray(value) ? value.length : 1;

const getAbortName = (error: unknown): string | undefined =>
  error instanceof DOMException ? error.name : undefined;

export const useImportExport = ({
  exportData,
  importInputRef,
  setStatusMessage,
  getLocalISOString,
  setWeightLogs,
  setFoodLogs,
  setActivityLogs,
  setFavoriteFoods,
  setWaterLogs,
  setFavoriteWaterContainers,
  setCoachAdvice,
  setDailyTarget,
  setActivityTarget,
  setWaterTarget,
  setResistanceDefs,
  setResistanceLogs
}: HookArgs) => {
  const handleExport = useCallback(async () => {
    const sanitizedExportData: ExportData = {
      ...exportData,
      foodLogs: sanitizeFoodLogs(exportData.foodLogs),
      activityLogs: sanitizeActivityLogs(exportData.activityLogs),
      favoriteFoods: sanitizeFavoriteFoods(exportData.favoriteFoods),
      waterLogs: sanitizeWaterLogs(exportData.waterLogs),
      favoriteWaterContainers: sanitizeFavoriteWaterContainers(exportData.favoriteWaterContainers)
    };
    const data = JSON.stringify(sanitizedExportData, null, 2);
    const filename = `PeterPlan_Backup_${getLocalISOString()}.json`;

    // Try File System Access API first (Desktop Chrome/Edge/Opera)
    try {
      const showSaveFilePicker =
        (window as Window & { showSaveFilePicker?: (options: FilePickerOptions) => Promise<FileSystemFileHandleLike> })
          .showSaveFilePicker;
      if (showSaveFilePicker) {
        const handle = await showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(data);
        await writable.close();
        setStatusMessage({ type: 'success', text: '備份成功！' });
        return;
      }
    } catch (err: unknown) {
      if (getAbortName(err) === 'AbortError') return;
      console.error('File Picker failed, falling back:', err);
    }

    const file = new File([data], filename, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Peter健康計劃備份' });
        return;
      } catch {
        // fallback to download
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: '備份已下載' });
  }, [exportData, getLocalISOString, setStatusMessage]);

  const handleImport = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const rawData = ev.target?.result as string;
          const d = JSON.parse(rawData) as Record<string, unknown>;

          // Support both new keys and legacy mj_ keys
          const get = (key: string) => (d[key] !== undefined ? d[key] : d[`mj_${key}`]);

          const summaryItems = [
            ['體重', get('weightLogs')],
            ['飲食', get('foodLogs')],
            ['運動', get('activityLogs')],
            ['常用食物', get('favoriteFoods')],
            ['飲水', get('waterLogs')],
            ['常用容器', get('favoriteWaterContainers')],
            ['教練建議', get('coachAdvice')],
            ['阻力項目', get('resistanceDefs')],
            ['阻力紀錄', get('resistanceLogs')],
            ['每日熱量目標', get('dailyTarget')],
            ['每日運動目標', get('activityTarget')],
            ['每日飲水目標', get('waterTarget')]
          ].filter(([, value]) => value !== undefined);

          if (summaryItems.length === 0) {
            setStatusMessage({ type: 'error', text: '還原失敗：未能在檔案中找到有效的資料' });
            return;
          }

          const summaryText = summaryItems
            .map(([label, value]) => `${label}：${getImportCount(value)} 筆`)
            .join('\n');
          const confirmed = window.confirm(
            `準備還原以下資料，這會取代 App 目前同類資料：\n\n${summaryText}\n\n確定要繼續嗎？`
          );
          if (!confirmed) {
            setStatusMessage({ type: 'error', text: '已取消還原，現有資料沒有變動' });
            return;
          }

          let importCount = 0;

          const w = get('weightLogs') as WeightLog[] | undefined; if (w) { setWeightLogs(sortByDateAndIdDesc(w)); importCount++; }
          const f = get('foodLogs') as FoodLog[] | undefined; if (f) { setFoodLogs(sortByDateAndIdDesc(sanitizeFoodLogs(f))); importCount++; }
          const a = get('activityLogs') as ActivityLog[] | undefined; if (a) { setActivityLogs(sortByDateAndIdDesc(sanitizeActivityLogs(a))); importCount++; }
          const ff = get('favoriteFoods') as FavoriteFood[] | undefined; if (ff) { setFavoriteFoods(sanitizeFavoriteFoods(ff)); importCount++; }
          const wl = get('waterLogs') as WaterLog[] | undefined; if (wl) { setWaterLogs(sortByDateAndIdDesc(sanitizeWaterLogs(wl))); importCount++; }
          const fwc = get('favoriteWaterContainers') as FavoriteWaterContainer[] | undefined; if (fwc) { setFavoriteWaterContainers(sanitizeFavoriteWaterContainers(fwc)); importCount++; }
          const ca = get('coachAdvice'); if (typeof ca === 'string') { setCoachAdvice(ca); importCount++; }

          const rd = get('resistanceDefs') as ResistanceDef[] | undefined; if (rd) { setResistanceDefs(rd); importCount++; }
          const rl = get('resistanceLogs') as ResistanceLog[] | undefined; if (rl) { setResistanceLogs(sortByDateAndIdDesc(rl)); importCount++; }

          const dt = get('dailyTarget') as number | undefined; if (dt !== undefined) { setDailyTarget(dt); importCount++; }
          const at = get('activityTarget') as number | undefined; if (at !== undefined) { setActivityTarget(at); importCount++; }
          const wt = get('waterTarget') as number | undefined; if (wt !== undefined) { setWaterTarget(wt); importCount++; }

          if (importCount > 0) {
            setStatusMessage({ type: 'success', text: `還原成功！已匯入 ${importCount} 類資料` });
          } else {
            setStatusMessage({ type: 'error', text: '還原失敗：未能在檔案中找到有效的資料' });
          }
        } catch (err) {
          console.error('Import parse error:', err);
          setStatusMessage({ type: 'error', text: '格式錯誤: ' + getErrorMessage(err) });
        }

        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      };
      r.onerror = (err) => {
        console.error('FileReader error:', err);
        setStatusMessage({ type: 'error', text: '讀取檔案失敗' });
        if (importInputRef.current) importInputRef.current.value = '';
      };
      r.readAsText(file);
    },
    [
      importInputRef,
      setStatusMessage,
      setWeightLogs,
      setFoodLogs,
      setActivityLogs,
      setFavoriteFoods,
      setWaterLogs,
      setFavoriteWaterContainers,
      setCoachAdvice,
      setDailyTarget,
      setActivityTarget,
      setWaterTarget,
      setResistanceDefs,
      setResistanceLogs
    ]
  );

  return { handleExport, handleImport };
};
