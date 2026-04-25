import { useCallback, type RefObject, type ChangeEvent } from 'react';
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
    const data = JSON.stringify(exportData, null, 2);
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
    } catch (err: any) {
      if (err.name === 'AbortError') return;
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
          const d = JSON.parse(rawData);

          // Support both new keys and legacy mj_ keys
          const get = (key: string) => (d[key] !== undefined ? d[key] : d[`mj_${key}`]);

          let importCount = 0;

          const w = get('weightLogs'); if (w) { setWeightLogs(sortByDateAndIdDesc(w)); importCount++; }
          const f = get('foodLogs'); if (f) { setFoodLogs(sortByDateAndIdDesc(f)); importCount++; }
          const a = get('activityLogs'); if (a) { setActivityLogs(sortByDateAndIdDesc(a)); importCount++; }
          const ff = get('favoriteFoods'); if (ff) { setFavoriteFoods(ff); importCount++; }
          const wl = get('waterLogs'); if (wl) { setWaterLogs(sortByDateAndIdDesc(wl)); importCount++; }
          const fwc = get('favoriteWaterContainers'); if (fwc) { setFavoriteWaterContainers(fwc); importCount++; }
          const ca = get('coachAdvice'); if (ca) { setCoachAdvice(ca); importCount++; }

          const rd = get('resistanceDefs'); if (rd) { setResistanceDefs(rd); importCount++; }
          const rl = get('resistanceLogs'); if (rl) { setResistanceLogs(sortByDateAndIdDesc(rl)); importCount++; }

          const dt = get('dailyTarget'); if (dt !== undefined) { setDailyTarget(dt); importCount++; }
          const at = get('activityTarget'); if (at !== undefined) { setActivityTarget(at); importCount++; }
          const wt = get('waterTarget'); if (wt !== undefined) { setWaterTarget(wt); importCount++; }

          if (importCount > 0) {
            setStatusMessage({ type: 'success', text: `還原成功！已匯入 ${importCount} 類資料` });
          } else {
            setStatusMessage({ type: 'error', text: '還原失敗：未能在檔案中找到有效的資料' });
          }
        } catch (err) {
          console.error('Import parse error:', err);
          setStatusMessage({ type: 'error', text: '格式錯誤: ' + (err instanceof Error ? err.message : String(err)) });
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
