import React from 'react';
import { Icons } from '../Icons';
import type { ApiKeys } from '../../types';
import type { CloudSnapshot } from '../../hooks/useCloudBackup';

interface SettingsPanelProps {
  showSettings: boolean;
  hasAnyKey: string;
  dailyTarget: number;
  setDailyTarget: (target: number) => void;
  activityTarget: number;
  setActivityTarget: (target: number) => void;
  waterTarget: number;
  setWaterTarget: (target: number) => void;
  apiKeys: ApiKeys;
  setApiKeys: React.Dispatch<React.SetStateAction<ApiKeys>>;
  saveSettings: () => void;
  backupToken: string;
  saveBackupToken: (token: string) => void;
  isBackingUp: boolean;
  backupNow: () => void;
  snapshots: CloudSnapshot[] | null;
  refreshSnapshots: () => void;
  restoreSnapshot: (date: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  showSettings,
  hasAnyKey,
  dailyTarget,
  setDailyTarget,
  activityTarget,
  setActivityTarget,
  waterTarget,
  setWaterTarget,
  apiKeys,
  setApiKeys,
  saveSettings,
  backupToken,
  saveBackupToken,
  isBackingUp,
  backupNow,
  snapshots,
  refreshSnapshots,
  restoreSnapshot
}) => {
  if (!showSettings) return null;

  return (
    <div className="bg-neutral-900 p-5 border-b border-neutral-800 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-white">設定</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${hasAnyKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {hasAnyKey ? 'Key 已設定' : 'Key 未設定'}
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-teal-400 mb-1 flex items-center gap-1">
            <Icons.Zap className="w-4 h-4" /> 每日熱量目標 (KCAL)
          </label>
          <input type="number" value={dailyTarget} onChange={e => setDailyTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-teal-500 outline-none text-white" />
        </div>
        <div>
          <label className="block text-sm font-bold text-teal-400 mb-1 flex items-center gap-1">
            <Icons.Activity className="w-4 h-4" /> 每日運動目標 (KCAL)
          </label>
          <input type="number" value={activityTarget} onChange={e => setActivityTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-teal-500 outline-none text-white" />
        </div>
        <div>
          <label className="block text-sm font-bold text-blue-400 mb-1 flex items-center gap-1">
            <Icons.Water className="w-4 h-4" /> 每日飲水目標 (ml)
          </label>
          <input type="number" value={waterTarget} onChange={e => setWaterTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-blue-500 outline-none text-white" />
        </div>
        <div className="border-t border-neutral-700 pt-4">
          <label className="block text-sm font-bold text-neutral-400 mb-2">
            Google Gemini API Keys
            <span className="block text-[10px] font-normal text-neutral-500 mt-1">
              目前照片辨識模型：Gemini 3.5 Flash（自動備援 Flash-Lite / Pro）
            </span>
          </label>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="mb-2">
              <input type="password" value={apiKeys[`free${i}`]} onChange={e => setApiKeys(p => ({ ...p, [`free${i}`]: e.target.value }))} placeholder={`Free Key ${i}`} className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-neutral-700 focus:border-neutral-500 outline-none text-neutral-300" />
            </div>
          ))}
          <div className="mt-2">
            <input type="password" value={apiKeys.paid} onChange={e => setApiKeys(p => ({ ...p, paid: e.target.value }))} placeholder="Paid Key (Backup)" className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-orange-900/50 focus:border-orange-500 outline-none text-orange-200" />
          </div>
        </div>
        <div className="border-t border-neutral-700 pt-4">
          <label className="block text-sm font-bold text-purple-400 mb-1 flex items-center gap-1">
            <Icons.Save className="w-4 h-4" /> 雲端備份
            <span className="block text-[10px] font-normal text-neutral-500 ml-1">
              每天第一次開啟 App 自動備份
            </span>
          </label>
          <input
            type="password"
            value={backupToken}
            onChange={e => saveBackupToken(e.target.value)}
            placeholder="備份 Token（與 Netlify BACKUP_TOKEN 相同）"
            className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-neutral-700 focus:border-purple-500 outline-none text-neutral-300"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={backupNow}
              disabled={isBackingUp}
              className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              {isBackingUp ? '備份中...' : '立即備份'}
            </button>
            <button
              onClick={refreshSnapshots}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
            >
              雲端還原
            </button>
          </div>
          {snapshots !== null && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-neutral-700 divide-y divide-neutral-800">
              {snapshots.length === 0 && (
                <div className="p-2 text-xs text-neutral-500">雲端尚無備份</div>
              )}
              {snapshots.map(s => (
                <button
                  key={s.key}
                  onClick={() => restoreSnapshot(s.date)}
                  className="w-full text-left p-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
                >
                  {s.date} 的備份 — 點此還原
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button onClick={saveSettings} className="bg-teal-600 text-white px-4 py-4 rounded-xl text-sm w-full font-bold flex justify-center items-center gap-2 mt-6 hover:bg-teal-500 transition-colors">
        <Icons.Save /> 儲存設定
      </button>
    </div>
  );
};
