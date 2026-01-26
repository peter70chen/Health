import React from 'react';
import { Icons } from '../Icons';

interface WaterCupProps {
    current: number;
    target: number;
    onClick: () => void;
}

export const WaterCup: React.FC<WaterCupProps> = ({ current, target, onClick }) => {
    const percentage = Math.min(Math.max((current / target) * 100, 0), 100);
    const isReached = current >= target;

    return (
        <div
            onClick={onClick}
            className="relative w-full h-20 bg-neutral-900 rounded-xl border border-neutral-800 px-4 py-3 flex items-center justify-between cursor-pointer overflow-hidden group hover:border-neutral-700 transition-colors"
        >
            <div className="z-10 flex flex-col gap-1">
                <div className="text-neutral-400 text-xs font-bold flex items-center gap-1">
                    <Icons.Water className="w-3.5 h-3.5 text-blue-400" /> 飲水追蹤
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">{current}</span>
                    <span className="text-[10px] font-medium text-neutral-500">/ {target} ml</span>
                </div>
                {isReached && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-900/40 px-2 py-0.5 rounded-full w-fit">
                        ✨ 目標達成
                    </div>
                )}
            </div>

            <div className="relative w-12 h-16 mr-2">
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
