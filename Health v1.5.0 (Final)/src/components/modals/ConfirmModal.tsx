import React from 'react';
import { Icons } from '../Icons';
import type { ConfirmModalState } from '../../types';

interface ConfirmModalProps {
  confirmModal: ConfirmModalState | null;
  setConfirmModal: (modal: ConfirmModalState | null) => void;
  executeDelete: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  confirmModal,
  setConfirmModal,
  executeDelete
}) => {
  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-neutral-900 rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center border border-neutral-800">
        <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <Icons.Trash className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">確定要刪除嗎？</h3>
        <p className="text-base text-neutral-400 mb-6">這筆記錄將會永久移除，無法復原。</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-base font-bold text-neutral-300 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">取消</button>
          <button onClick={executeDelete} className="flex-1 py-3 text-base font-bold text-white bg-red-600 rounded-xl hover:bg-red-500 shadow-md transition-colors">確認刪除</button>
        </div>
      </div>
    </div>
  );
};
