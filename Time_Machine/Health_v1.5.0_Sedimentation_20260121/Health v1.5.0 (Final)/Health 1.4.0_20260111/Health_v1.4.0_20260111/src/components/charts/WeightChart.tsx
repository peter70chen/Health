import React, { useState } from 'react';
import type { ChartData } from '../../types';

interface WeightChartProps {
    data: ChartData[];
    targetWeight: number;
}

export const WeightChart: React.FC<WeightChartProps> = ({ data, targetWeight }) => {
    const [showWeight, setShowWeight] = useState(true);
    const [showBodyFat, setShowBodyFat] = useState(true);

    if (!data || !data.length) {
        return <div className="text-center text-sm text-neutral-500 py-10">資料不足</div>;
    }

    const weights = data.map(d => d.weight).filter((w): w is number => w !== undefined);
    const maxW = Math.max(...weights) + 1;
    const minW = Math.min(...weights) - 1;
    const rangeW = maxW - minW;

    const bodyFats = data.map(d => d.bodyFat).filter((f): f is number => f !== undefined);
    const hasBodyFat = bodyFats.length > 0;
    const maxF = hasBodyFat ? Math.max(...bodyFats) + 2 : 30;
    const minF = hasBodyFat ? Math.min(...bodyFats) - 2 : 10;
    const rangeF = maxF - minF;

    const isSingle = data.length <= 1;
    const getX = (i: number) => isSingle ? 50 : (i / (data.length - 1)) * 100;
    const getY_W = (v: number) => 100 - ((v - minW) / rangeW) * 100;
    const getY_F = (v: number) => 100 - ((v - minF) / rangeF) * 100;

    let actP = "";
    let fatP = "";

    data.forEach((d, i) => {
        const x = getX(i);
        if (d.weight) {
            actP += `${actP === "" ? 'M' : 'L'} ${x} ${getY_W(d.weight)} `;
        }
        if (d.bodyFat) {
            fatP += `${fatP === "" ? 'M' : 'L'} ${x} ${getY_F(d.bodyFat)} `;
        }
    });

    const isLong = data.length > 30;
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
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#262626" strokeWidth="0.5" />
                ))}
                <line x1="0" y1={100} x2="100" y2={100} stroke="#404040" strokeWidth="0.5" />

                {/* Weight line */}
                {showWeight && <path d={actP} fill="none" stroke="#2dd4bf" strokeWidth={isLong ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" />}

                {/* Body fat line */}
                {hasBodyFat && showBodyFat && <path d={fatP} fill="none" stroke="#fb7185" strokeWidth={isLong ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" />}

                {/* Labels */}
                {chartLabels}

                {/* Value labels */}
                {!isLong && data.map((d, i) => (
                    <React.Fragment key={`lbl-${i}`}>
                        {showWeight && d.weight && (
                            <text
                                x={getX(i)}
                                y={getY_W(d.weight) - 6}
                                fontSize="3"
                                fontWeight="bold"
                                textAnchor="middle"
                                fill="#2dd4bf"
                                style={{ textShadow: "0px 1px 2px #000" }}
                            >
                                {d.weight}
                            </text>
                        )}
                        {showBodyFat && d.bodyFat && (
                            <text
                                x={getX(i)}
                                y={getY_F(d.bodyFat) + 8}
                                fontSize="3"
                                fontWeight="bold"
                                textAnchor="middle"
                                fill="#fb7185"
                                style={{ textShadow: "0px 1px 2px #000" }}
                            >
                                {d.bodyFat}%
                            </text>
                        )}
                    </React.Fragment>
                ))}
            </svg>

            {/* Data points */}
            {!isLong && data.map((d, i) => (
                <React.Fragment key={i}>
                    {showWeight && d.weight && (
                        <div
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `${getX(i)}%`,
                                top: `${getY_W(d.weight) * 0.87}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10
                            }}
                        >
                            <div className="w-2.5 h-2.5 bg-teal-200 border-2 border-teal-500 rounded-full shadow-sm"></div>
                        </div>
                    )}
                    {showBodyFat && d.bodyFat && (
                        <div
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `${getX(i)}%`,
                                top: `${getY_F(d.bodyFat) * 0.87}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 10
                            }}
                        >
                            <div className="w-2.5 h-2.5 bg-rose-200 border-2 border-rose-500 rounded-full shadow-sm"></div>
                        </div>
                    )}
                </React.Fragment>
            ))}

            {/* Target badge */}
            <div className="absolute -top-3 right-0 text-xs bg-teal-900/30 text-teal-400 px-3 py-1 rounded-full font-bold border border-teal-800">
                目標: {targetWeight} kg
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 absolute -bottom-8 w-full text-xs text-neutral-400 font-medium">
                <div
                    onClick={() => setShowWeight(!showWeight)}
                    className={`flex items-center gap-1 cursor-pointer select-none transition-opacity ${showWeight ? 'opacity-100' : 'opacity-40'}`}
                >
                    <div className="w-2.5 h-2.5 rounded-full border border-teal-500 bg-teal-900"></div>體重
                </div>
                {hasBodyFat && (
                    <div
                        onClick={() => setShowBodyFat(!showBodyFat)}
                        className={`flex items-center gap-1 cursor-pointer select-none transition-opacity ${showBodyFat ? 'opacity-100' : 'opacity-40'}`}
                    >
                        <div className="w-2.5 h-2.5 rounded-full border border-rose-500 bg-rose-900"></div>體脂 %
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeightChart;
