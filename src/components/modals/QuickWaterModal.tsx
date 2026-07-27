import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { DialogShell } from '../ui/DialogShell';

interface QuickWaterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export const QuickWaterModal: React.FC<QuickWaterModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('300');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setAmount('300');
            // 自動聚焦並選取文字
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        const value = parseInt(amount);
        if (!isNaN(value) && value > 0) {
            onConfirm(value);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // 快捷按鈕選項
    const quickOptions = [100, 200, 300, 500];

    if (!isOpen) return null;

    return (
        <DialogShell
            labelledBy="quick-water-dialog-title"
            onClose={onClose}
            initialFocusRef={inputRef}
            overlayClassName="z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            panelClassName="relative bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-sm overflow-hidden"
        >
                {/* 標題列 */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-900/30 text-blue-400">
                            <Icons.Water className="w-5 h-5" />
                        </div>
                        <h3 id="quick-water-dialog-title" className="text-lg font-bold text-white">快速加水</h3>
                    </div>
                    <button
                        aria-label="關閉快速加水"
                        onClick={onClose}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* 輸入區域 */}
                <div className="p-4 space-y-4">
                    {/* 數字輸入 */}
                    <div>
                        <label htmlFor="quick-water-amount" className="text-sm font-bold text-neutral-300 block mb-2">輸入飲水量</label>
                        <div className="relative">
                            <input
                                id="quick-water-amount"
                                ref={inputRef}
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-4 pr-16 bg-neutral-800 border border-neutral-700 rounded-xl text-2xl font-bold text-white text-center outline-none focus:border-blue-500 transition-colors"
                                placeholder="300"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-neutral-500">ml</span>
                        </div>
                    </div>

                    {/* 快捷選項 */}
                    <div>
                        <div className="text-sm font-bold text-neutral-300 block mb-2">常用容量</div>
                        <div className="grid grid-cols-4 gap-2">
                            {quickOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setAmount(String(opt))}
                                    aria-pressed={amount === String(opt)}
                                    className={`min-h-[44px] py-2 rounded-lg font-bold text-sm transition-colors ${amount === String(opt)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                        }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 按鈕列 */}
                <div className="flex gap-3 p-4 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-neutral-800 text-neutral-300 rounded-xl font-bold hover:bg-neutral-700 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        加入記錄
                    </button>
                </div>
        </DialogShell>
    );
};

export default QuickWaterModal;
