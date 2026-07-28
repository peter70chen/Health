import React, { useRef, useCallback } from 'react';
import { Icons } from '../Icons';

interface WaterCupProps {
    current: number;
    target: number;
    onClick: () => void;
    onLongPress?: () => void;
}

export const WaterCup: React.FC<WaterCupProps> = ({ current, target, onClick, onLongPress }) => {
    const percentage = Math.min(Math.max((current / target) * 100, 0), 100);
    const isReached = current >= target;

    // 長按計時器
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const handleTouchStart = useCallback(() => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (onLongPress) {
                // 震動回饋 (如果支援)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                onLongPress();
            }
        }, 500); // 500ms 觸發長按
    }, [onLongPress]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // 如果不是長按，才觸發 onClick
        if (!isLongPress.current) {
            onClick();
        }
    }, [onClick]);

    const handleTouchMove = useCallback(() => {
        // 手指移動時取消長按
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchMove}
            onKeyDown={(e) => {
                // 鍵盤使用者：Enter/Space 等同點擊（長按快速加水無鍵盤等價操作，屬已知取捨）。
                // e.repeat 擋掉「按住不放」的自動重複——否則壓著 Enter 會連續記錄好幾杯水。
                if (e.repeat) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            // role="button" 會讓 aria-label 蓋掉內部所有文字，「✨ 目標達成」徽章
            // 螢幕閱讀器聽不到，所以把達標狀態併進 label 裡。
            aria-label={`飲水追蹤，目前 ${current} ml，目標 ${target} ml${isReached ? '，已達成目標' : ''}，點擊記錄飲水`}
            // focus-visible 樣式是必要的：本專案是深色底，瀏覽器預設 focus ring 對比不足，
            // 鍵盤使用者會不知道焦點在哪。用 ring-offset-black 讓 ring 與卡片邊界分離。
            className="relative w-full h-20 bg-neutral-900 rounded-xl border border-neutral-800 px-4 py-3 flex items-center justify-between cursor-pointer overflow-hidden group hover:border-neutral-700 transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
            <div className="z-10 min-w-0 flex flex-col gap-1">
                <div className="text-neutral-300 text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                    <Icons.Water className="w-3.5 h-3.5 text-blue-400" /> 飲水追蹤
                    {onLongPress && (
                        <span className="hidden min-[380px]:inline text-xs text-neutral-400 ml-1">(長按快速加水)</span>
                    )}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">{current}</span>
                    <span className="text-xs font-medium text-neutral-400">/ {target} ml</span>
                </div>
                {isReached && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-900/40 px-2 py-0.5 rounded w-fit">
                        <Icons.Check className="w-3 h-3" /> 目標達成
                    </div>
                )}
            </div>

            <div className="relative w-12 h-16 mr-2 shrink-0">
                {/* Cup Body - using mask/clip-path for shape */}
                <div
                    className="absolute inset-0 border-2 border-neutral-600 rounded-b-lg opacity-30"
                    style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
                ></div>

                {/* Liquid Container */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 15% 100%)" }}
                >
                    {/* Inner Container for Level Transition */}
                    <div
                        className="absolute bottom-0 left-0 w-full h-full transition-all duration-700 ease-out"
                        style={{ clipPath: `inset(${100 - percentage}% 0 0 0)` }}
                    >
                        {/* Base Blue Fill (slightly more opaque as requested) */}
                        <div className="absolute w-full h-full bg-blue-500/60 top-0"></div>
                        {/* Wave Element: Rotating rounded square */}
                        <div
                            className="wave-bg"
                            style={{
                                bottom: `${percentage - 110}%`,
                                width: '300%',
                                height: '300%',
                                left: '-100%',
                                borderRadius: '35%'
                            }}
                        ></div>
                    </div>
                </div>

                {/* Highlights */}
                <div className="absolute top-2 left-2 w-0.5 h-8 bg-white/10 rounded-full blur-[1px]"></div>
            </div>
        </div>
    );
};

export default WaterCup;
