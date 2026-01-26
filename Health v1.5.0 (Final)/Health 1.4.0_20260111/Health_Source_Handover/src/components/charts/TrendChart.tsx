import React from 'react';
import type { ChartData } from '../../types';

interface TrendChartProps {
    data: ChartData[];
    budget: number;
    activityTarget: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, budget, activityTarget }) => {
    if (!data || data.length === 0) {
        return <div className="text-center text-sm text-neutral-500 py-10">資料不足</div>;
    }

    const isSingle = data.length === 1;
    const maxVal = Math.max(budget, activityTarget, ...data.map(d => Math.max(d.in || 0, d.out || 0))) * 1.1;

    const getX = (i: number) => isSingle ? 50 : (i / (data.length - 1)) * 100;
    const getY = (val: number) => 100 - ((val / maxVal) * 100);

    let linePath = "";
    let areaPath = `M 0 100 `;

    if (isSingle) {
        const x = 50;
        const y = getY(data[0].in || 0);
        linePath = `M ${x - 10} ${y} L ${x + 10} ${y}`;
        areaPath = `M ${x - 10} 100 L ${x - 10} ${y} L ${x + 10} ${y} L ${x + 10} 100 Z`;
    } else {
        data.forEach((d, i) => {
            const x = getX(i);
            const y = getY(d.in || 0);
            linePath += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
            areaPath += `L ${x} ${y} `;
        });
        areaPath += `L 100 100 Z`;
    }

    const isLongRange = data.length > 30;
    const barWidth = isSingle ? 20 : (100 / data.length / 1.5);
    const labelStep = Math.ceil(data.length / 6);

    const chartLabels = data.map((d, i) => {
        const isLabelStep = i % labelStep === 0;
        const isLastItem = i === data.length - 1;
        if (!isLabelStep && !isLastItem) return null;

        let anchor = "middle";
        if (i === 0 && !isSingle) anchor = "start";
        if (isLastItem && !isSingle) anchor = "end";

        return (
            <text
                key={i}
                x={getX(i)}
                y="112"
                fontSize="4"
                fontWeight="500"
                textAnchor={anchor as "start" | "middle" | "end"}
                fill="#737373"
                style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
            >
                {d.disp}
            </text>
        );
    });

    return (
        <div className="w-full h-64 relative border-l border-neutral-700 mt-4">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 115" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#262626" strokeWidth="0.5" />
                ))}
                <line x1="0" y1={100} x2="100" y2={100} stroke="#404040" strokeWidth="0.5" />

                {/* Target lines */}
                <line x1="0" y1={getY(budget)} x2="100" y2={getY(budget)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3" opacity="0.6" />
                <line x1="0" y1={getY(activityTarget)} x2="100" y2={getY(activityTarget)} stroke="#14b8a6" strokeWidth="0.8" strokeDasharray="4 2" opacity="0.8" />

                {/* Activity bars */}
                {data.map((d, i) => (
                    (d.out || 0) > 0 && (
                        <rect
                            key={i}
                            x={getX(i) - barWidth / 2}
                            y={getY(d.out || 0)}
                            width={barWidth}
                            height={100 - getY(d.out || 0)}
                            fill="#14b8a6"
                            opacity="0.5"
                        />
                    )
                ))}

                {/* Area and line */}
                <path d={areaPath} fill="url(#orangeGradient)" stroke="none" />
                <path d={linePath} fill="none" stroke="#f97316" strokeWidth={isLongRange ? 1 : 1.5} strokeLinecap="round" strokeLinejoin="round" />

                {/* Labels */}
                {chartLabels}
            </svg>

            {/* Data points */}
            {!isLongRange && data.map((d, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 bg-white border-2 border-orange-500 rounded-full"
                    style={{
                        left: `${getX(i)}%`,
                        top: `${getY(d.in || 0) * 0.87}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* Legend */}
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 absolute -bottom-10 w-full text-xs text-neutral-400 font-medium">
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>攝取
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded bg-teal-500 opacity-60"></div>消耗
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-red-500 opacity-60"></div>攝取目標
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-teal-500 opacity-80 border-t border-dashed border-teal-300"></div>運動目標: {activityTarget}
                </div>
            </div>
        </div>
    );
};

export default TrendChart;
