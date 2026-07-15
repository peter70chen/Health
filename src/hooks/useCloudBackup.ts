import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../lib/config';
import { sanitizeExportData, type ExportData } from '../lib/backupPayload';
import { getLocalISOString } from '../lib/utils';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

export type CloudSnapshot = { key: string; date: string };

type HookArgs = {
  loading: boolean;
  exportData: ExportData;
  setStatusMessage: (value: StatusMessage) => void;
};

const API_PATH = '/api/backup';

const authHeaders = (token: string): HeadersInit => ({ 'x-backup-token': token });

// 自動備份的 sanity guard：空資料不上傳，避免新裝置/清空後的 localStorage
// 靜默覆蓋掉當天雲端既有的完整備份（手動備份不受此限）
const hasMeaningfulData = (data: ExportData): boolean =>
  data.weightLogs.length > 0 ||
  data.foodLogs.length > 0 ||
  data.activityLogs.length > 0 ||
  data.waterLogs.length > 0 ||
  data.resistanceLogs.length > 0;

export const useCloudBackup = ({ loading, exportData, setStatusMessage }: HookArgs) => {
  const [backupToken, setBackupToken] = useState(
    () => localStorage.getItem(STORAGE_KEYS.BACKUP_TOKEN) ?? ''
  );
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [snapshots, setSnapshots] = useState<CloudSnapshot[] | null>(null);

  // 最新資料放 ref，讓「App 開啟自動備份」effect 不必把整包資料列為依賴
  const exportDataRef = useRef(exportData);
  exportDataRef.current = exportData;

  const saveBackupToken = useCallback((token: string) => {
    setBackupToken(token);
    localStorage.setItem(STORAGE_KEYS.BACKUP_TOKEN, token);
  }, []);

  // 上傳一律排進同一條 promise queue，避免自動備份與手動備份並發時
  // 較舊的 payload 後到而覆蓋較新的備份；payload 在輪到執行時才擷取最新資料
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const uploadBackup = useCallback((token: string): Promise<void> => {
    const run = async (): Promise<void> => {
      const payload = sanitizeExportData(exportDataRef.current);
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { ...authHeaders(token), 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      localStorage.setItem(STORAGE_KEYS.LAST_CLOUD_BACKUP, getLocalISOString());
    };
    const task = uploadQueueRef.current.then(run, run);
    uploadQueueRef.current = task.catch(() => {});
    return task;
  }, []);

  // App 每日首次開啟自動備份
  const autoTriedRef = useRef(false);
  useEffect(() => {
    if (loading || autoTriedRef.current) return;
    autoTriedRef.current = true;

    const today = getLocalISOString();
    const last = localStorage.getItem(STORAGE_KEYS.LAST_CLOUD_BACKUP);
    if (!backupToken || !navigator.onLine || last === today) return;
    if (!hasMeaningfulData(exportDataRef.current)) return;

    uploadBackup(backupToken)
      .then(() => setStatusMessage({ type: 'success', text: '已自動備份到雲端 ✓' }))
      .catch((err) => console.warn('Auto cloud backup failed (will retry next launch):', err));
  }, [loading, backupToken, uploadBackup, setStatusMessage]);

  const backupNow = useCallback(async () => {
    if (!backupToken) {
      setStatusMessage({ type: 'error', text: '請先設定備份 Token' });
      return;
    }
    setIsBackingUp(true);
    try {
      await uploadBackup(backupToken);
      setStatusMessage({ type: 'success', text: '雲端備份成功！' });
    } catch (err) {
      console.error('Manual cloud backup failed:', err);
      setStatusMessage({ type: 'error', text: '雲端備份失敗，請檢查網路與 Token' });
    } finally {
      setIsBackingUp(false);
    }
  }, [backupToken, uploadBackup, setStatusMessage]);

  const refreshSnapshots = useCallback(async () => {
    if (!backupToken) {
      setStatusMessage({ type: 'error', text: '請先設定備份 Token' });
      return;
    }
    try {
      const res = await fetch(`${API_PATH}?list`, { headers: authHeaders(backupToken) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnapshots((await res.json()) as CloudSnapshot[]);
    } catch (err) {
      console.error('List cloud snapshots failed:', err);
      setStatusMessage({ type: 'error', text: '讀取雲端快照清單失敗' });
    }
  }, [backupToken, setStatusMessage]);

  const fetchSnapshot = useCallback(
    async (date: string): Promise<string | null> => {
      if (!backupToken) {
        setStatusMessage({ type: 'error', text: '請先設定備份 Token' });
        return null;
      }
      try {
        const res = await fetch(`${API_PATH}?date=${encodeURIComponent(date)}`, {
          headers: authHeaders(backupToken)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (err) {
        console.error('Fetch cloud snapshot failed:', err);
        setStatusMessage({ type: 'error', text: '下載雲端快照失敗' });
        return null;
      }
    },
    [backupToken, setStatusMessage]
  );

  return {
    backupToken,
    saveBackupToken,
    isBackingUp,
    snapshots,
    backupNow,
    refreshSnapshots,
    fetchSnapshot
  };
};
