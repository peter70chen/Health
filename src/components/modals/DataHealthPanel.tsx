import React from 'react';
import { Icons } from '../Icons';
import type { DataHealthIssue } from '../../lib/dataHealth';

interface DataHealthPanelProps {
  showDataHealth: boolean;
  setShowDataHealth: (show: boolean) => void;
  issues: DataHealthIssue[];
}

export const DataHealthPanel: React.FC<DataHealthPanelProps> = ({
  showDataHealth,
  setShowDataHealth,
  issues
}) => {
  if (!showDataHealth) return null;

  const errorCount = issues.filter(issue => issue.level === 'error').length;
  const warningCount = issues.filter(issue => issue.level === 'warning').length;

  return (
    <div className="fixed inset-0 bg-black/80 z-[999] flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={e => { if (e.target === e.currentTarget) setShowDataHealth(false); }}>
      <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-neutral-800 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Icons.ScanEye className="w-5 h-5 text-teal-400" /> 資料健康檢查
            </h3>
            <p className="text-xs text-neutral-500 mt-1">檢查異常日期、極端數字、舊資料與失效圖片。</p>
          </div>
          <button onClick={() => setShowDataHealth(false)} className="text-neutral-400 p-2 hover:text-white"><Icons.X /></button>
        </div>

        {issues.length === 0 ? (
          <div className="bg-teal-950/40 border border-teal-600/40 rounded-xl p-5 text-center">
            <Icons.Check className="w-8 h-8 text-teal-400 mx-auto mb-3" />
            <div className="text-white font-bold">目前沒有發現明顯資料異常</div>
            <div className="text-sm text-neutral-400 mt-2">資料狀態看起來很乾淨，可以安心繼續記錄。</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-950/30 border border-red-800 rounded-xl p-3">
                <div className="text-xs text-red-300 font-bold">需要處理</div>
                <div className="text-2xl font-black text-red-400">{errorCount}</div>
              </div>
              <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-3">
                <div className="text-xs text-amber-300 font-bold">建議確認</div>
                <div className="text-2xl font-black text-amber-400">{warningCount}</div>
              </div>
            </div>
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className={`rounded-xl p-4 border ${issue.level === 'error' ? 'bg-red-950/30 border-red-800' : 'bg-amber-950/30 border-amber-800'}`}>
                  <div className={`font-bold text-sm flex items-center gap-2 ${issue.level === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                    <Icons.AlertCircle className="w-4 h-4" /> {issue.title}
                  </div>
                  <div className="text-sm text-neutral-300 mt-2 leading-relaxed">{issue.detail}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <button onClick={() => setShowDataHealth(false)} className="mt-5 w-full py-3 rounded-xl bg-neutral-800 text-neutral-200 font-bold hover:bg-neutral-700">
          關閉
        </button>
      </div>
    </div>
  );
};
