import React from 'react';
import { Icons } from '../Icons';

interface CoachSectionProps {
  coachAdvice: string;
  setCoachAdvice: (advice: string) => void;
  isCoachThinking: boolean;
  coachStatus: string;
  handleAskCoach: () => void;
}

export const CoachSection: React.FC<CoachSectionProps> = ({
  coachAdvice,
  setCoachAdvice,
  isCoachThinking,
  coachStatus,
  handleAskCoach
}) => {
  return (
    <div className="bg-teal-900/20 rounded-2xl border border-teal-900/50 p-6 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-teal-400 text-lg flex items-center gap-2">
          <Icons.Doctor className="w-6 h-6" /> AI 智能教練
        </h2>
        <div className="flex gap-2 items-center">
          {coachAdvice && (
            <button onClick={() => setCoachAdvice('')} className="text-teal-600 hover:text-red-500 p-2 rounded transition-colors" title="清除建議">
              <Icons.Trash className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleAskCoach} disabled={isCoachThinking} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 hover:bg-teal-500">
            {isCoachThinking ? (
              <span className="flex items-center gap-2"><Icons.Loader2 className="animate-spin w-4 h-4" />{coachStatus || "思考中..."}</span>
            ) : '諮詢意見'}
          </button>
        </div>
      </div>
      {isCoachThinking ? (
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center gap-3 text-teal-400 text-base font-medium">
          {coachStatus || "正在分析您的數據中..."}
        </div>
      ) : coachAdvice ? (
        <div className="text-base text-teal-200 leading-relaxed whitespace-pre-wrap animate-fadeIn bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-sm relative group">
          {coachAdvice}
        </div>
      ) : (
        <p className="text-sm text-teal-600 text-center py-6">點擊諮詢按鈕，讓 AI 分析您的近期數據並提供專業建議。</p>
      )}
    </div>
  );
};
