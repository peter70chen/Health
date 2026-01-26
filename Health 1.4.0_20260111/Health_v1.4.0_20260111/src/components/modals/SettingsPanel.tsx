import React from 'react';
import { Icons } from '../Icons';
import type { ApiKeys } from '../../types';

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
  saveSettings
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
          <label className="block text-sm font-bold text-neutral-400 mb-2">Google Gemini API Keys</label>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="mb-2">
              <input type="password" value={apiKeys[`free${i}`]} onChange={e => setApiKeys(p => ({ ...p, [`free${i}`]: e.target.value }))} placeholder={`Free Key ${i}`} className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-neutral-700 focus:border-neutral-500 outline-none text-neutral-300" />
            </div>
          ))}
          <div className="mt-2">
            <input type="password" value={apiKeys.paid} onChange={e => setApiKeys(p => ({ ...p, paid: e.target.value }))} placeholder="Paid Key (Backup)" className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-orange-900/50 focus:border-orange-500 outline-none text-orange-200" />
          </div>
        </div>
      </div>
      <button onClick={saveSettings} className="bg-teal-600 text-white px-4 py-4 rounded-xl text-sm w-full font-bold flex justify-center items-center gap-2 mt-6 hover:bg-teal-500 transition-colors">
        <Icons.Save /> 儲存設定
      </button>
    </div>
  );
};
