import React from 'react';
import { Icons } from '../Icons';
import type {
  FavoriteFood, FavoriteWaterContainer, ManualFormState,
  ResistanceDef, ResistanceItem, ResistanceLog
} from '../../types';

interface InputModalProps {
  inputModalType: 'food' | 'activity' | 'water' | null;
  setInputModalType: (type: 'food' | 'activity' | 'water' | null) => void;
  inputMethod: 'ai' | 'manual' | 'favorites' | 'resistance';
  setInputMethod: (method: 'ai' | 'manual' | 'favorites' | 'resistance') => void;

  // AI Analysis
  selectedImage: File | null;
  imagePreview: string | null;
  imageNotes: string;
  setImageNotes: (notes: string) => void;
  manualText: string;
  setManualText: (text: string) => void;
  isAnalyzing: boolean;
  analysisStatus: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedImage: (file: File | null) => void;
  setImagePreview: (preview: string | null) => void;
  executeAnalysis: () => void;

  // Manual Input
  manualForm: ManualFormState;
  setManualForm: React.Dispatch<React.SetStateAction<ManualFormState>>;
  addToFavorites: boolean;
  setAddToFavorites: (add: boolean) => void;
  saveLog: (type: string) => void;

  // Favorites
  favoriteFoods: FavoriteFood[];
  favoriteWaterContainers: FavoriteWaterContainer[];
  selectFavorite: (item: any) => void;
  deleteFavorite: (id: number, e: React.MouseEvent) => void;
  reorderFavoriteFoods: (fromIndex: number, toIndex: number) => void;
  reorderFavoriteWaterContainers: (fromIndex: number, toIndex: number) => void;

  // Resistance
  resistanceDefs: ResistanceDef[];
  resistanceSession: ResistanceItem[];
  resistanceLogs: ResistanceLog[];
  newDefName: string;
  setNewDefName: (name: string) => void;
  handleAddResistanceDef: () => void;
  handleDeleteResistanceDef: (id: number, e: React.MouseEvent) => void;
  reorderResistanceDefs: (fromIndex: number, toIndex: number) => void;
  toggleResistanceItem: (def: ResistanceDef) => void;
  updateResistanceItem: (defId: number, field: 'weight' | 'sets' | 'reps' | 'time', value: string) => void;
  calculateAndSaveResistance: () => void;
  setConfirmModal: (modal: { id: number; type: 'food' | 'activity' | 'water' | 'weight' | 'resistanceDef' | 'resistanceLog' } | null) => void;
  currentViewDate: string;
  getLocalISOString: (date?: Date) => string;
}

export const InputModal: React.FC<InputModalProps> = ({
  inputModalType,
  setInputModalType,
  inputMethod,
  setInputMethod,
  selectedImage,
  imagePreview,
  imageNotes,
  setImageNotes,
  manualText,
  setManualText,
  isAnalyzing,
  analysisStatus,
  fileInputRef,
  handleFileSelect,
  setSelectedImage,
  setImagePreview,
  executeAnalysis,
  manualForm,
  setManualForm,
  addToFavorites,
  setAddToFavorites,
  saveLog,
  favoriteFoods,
  favoriteWaterContainers,
  selectFavorite,
  deleteFavorite,
  reorderFavoriteFoods,
  reorderFavoriteWaterContainers,
  resistanceDefs,
  resistanceSession,
  resistanceLogs,
  newDefName,
  setNewDefName,
  handleAddResistanceDef,
  handleDeleteResistanceDef,
  reorderResistanceDefs,
  toggleResistanceItem,
  updateResistanceItem,
  calculateAndSaveResistance,
  setConfirmModal,
  currentViewDate,
  getLocalISOString
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [dragListType, setDragListType] = React.useState<'resistance' | 'favFood' | 'favWater' | null>(null);
  const [isTouchDragging, setIsTouchDragging] = React.useState(false);
  const itemRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Prevent page scroll when touch dragging
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, [isTouchDragging]);

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent, index: number, listType: 'resistance' | 'favFood' | 'favWater') => {
    setDraggedIndex(index);
    setDragListType(listType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number, listType: 'resistance' | 'favFood' | 'favWater') => {
    e.preventDefault();
    if (dragListType !== listType) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    finishDrag();
    // Reset all drag state
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragListType(null);
  };

  // Touch handlers for mobile - using long press
  const handleTouchStart = (e: React.TouchEvent, index: number, listType: 'resistance' | 'favFood' | 'favWater') => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    // Start long press timer (200ms) - faster activation
    longPressTimer.current = setTimeout(() => {
      setDraggedIndex(index);
      setDragListType(listType);
      setIsTouchDragging(true);
      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 200);
  };

  const handleGripTouchStart = (e: React.TouchEvent, index: number, listType: 'resistance' | 'favFood' | 'favWater') => {
    e.stopPropagation(); // Prevent parent long-press handler
    // Instant start
    setDraggedIndex(index);
    setDragListType(listType);
    setIsTouchDragging(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleTouchMove = (e: React.TouchEvent, listType: 'resistance' | 'favFood' | 'favWater') => {
    const touch = e.touches[0];

    // Cancel long press if moved too much before activation
    if (!isTouchDragging && touchStartPos.current) {
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 20 || dy > 20) { // Increased tolerance to 20px
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        return;
      }
    }

    if (!isTouchDragging || draggedIndex === null || dragListType !== listType) return;

    // Note: preventDefault is handled by the container's passive:false listener

    const touchY = touch.clientY;
    const items = Array.from(itemRefs.current.entries())
      .filter(([key]) => key.startsWith(listType))
      .sort((a, b) => {
        const indexA = parseInt(a[0].split('-')[1]);
        const indexB = parseInt(b[0].split('-')[1]);
        return indexA - indexB;
      });

    for (let i = 0; i < items.length; i++) {
      const el = items[i][1];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
          if (i !== dragOverIndex) {
            setDragOverIndex(i);
          }
          break;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isTouchDragging && draggedIndex !== null) {
      finishDrag();
    }

    // Always reset all touch-related state
    setIsTouchDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragListType(null);
    touchStartPos.current = null;
  };

  // Handle touch cancel (e.g., incoming call, gesture interruption)
  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsTouchDragging(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDragListType(null);
    touchStartPos.current = null;
  };

  const finishDrag = () => {
    // Only perform the reorder operation, state cleanup is handled by handleTouchEnd/handleDragEnd
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && dragListType) {
      if (dragListType === 'resistance') {
        reorderResistanceDefs(draggedIndex, dragOverIndex);
      } else if (dragListType === 'favFood') {
        reorderFavoriteFoods(draggedIndex, dragOverIndex);
      } else if (dragListType === 'favWater') {
        reorderFavoriteWaterContainers(draggedIndex, dragOverIndex);
      }
    }
  };

  const setItemRef = (key: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(key, el);
    } else {
      itemRefs.current.delete(key);
    }
  };

  if (!inputModalType) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={e => { if (e.target === e.currentTarget) setInputModalType(null) }}>
      <div
        ref={containerRef}
        className="bg-neutral-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-5 mb-6 sm:mb-0 border border-neutral-800 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between border-b border-neutral-800 pb-3 items-center">
          <h3 className="font-bold text-xl text-white">
            {inputModalType === 'food' ? '記錄飲食' : (inputModalType === 'water' ? '記錄飲水' : '記錄運動')}
          </h3>
          <button onClick={() => setInputModalType(null)} className="text-neutral-400 p-2"><Icons.X /></button>
        </div>

        <div className="flex bg-neutral-800 p-1 rounded-xl">
          <button onClick={() => setInputMethod('ai')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'ai' ? 'bg-neutral-700 text-teal-400 shadow-sm' : 'text-neutral-400'}`}>AI 分析</button>
          <button onClick={() => setInputMethod('manual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'manual' ? 'bg-neutral-700 text-teal-400 shadow-sm' : 'text-neutral-400'}`}>手動</button>
          {inputModalType === 'activity' && (
            <button onClick={() => setInputMethod('resistance')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'resistance' ? 'bg-neutral-700 text-teal-400 shadow-sm' : 'text-neutral-400'}`}>阻力</button>
          )}
          {(inputModalType === 'food' || inputModalType === 'water') && (
            <button onClick={() => setInputMethod('favorites')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'favorites' ? 'bg-rose-900/50 text-rose-400 shadow-sm' : 'text-neutral-400'}`}>常用</button>
          )}
        </div>

        {/* Favorites - Food */}
        {inputMethod === 'favorites' && inputModalType === 'food' && (
          <div className="space-y-3 min-h-[200px]">
            {favoriteFoods.length > 0 ? favoriteFoods.map((fav, index) => {
              const isDragging = draggedIndex === index && dragListType === 'favFood';
              const isDragOver = dragOverIndex === index && draggedIndex !== index && dragListType === 'favFood';
              return (
                <div
                  key={fav.id}
                  ref={(el) => setItemRef(`favFood-${index}`, el)}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, index, 'favFood'); }}
                  onDragOver={(e) => handleDragOver(e, index, 'favFood')}
                  onDragEnd={handleDragEnd}
                  onDragLeave={() => setDragOverIndex(null)}
                  onTouchStart={(e) => handleTouchStart(e, index, 'favFood')}
                  onTouchMove={(e) => handleTouchMove(e, 'favFood')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchCancel}
                  onClick={() => !draggedIndex && selectFavorite(fav)}
                  className={`bg-neutral-800 p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all group select-none ${isDragging ? 'opacity-60 scale-95 shadow-lg ring-2 ring-rose-400' : 'border-neutral-700 hover:bg-neutral-700'} ${isDragOver ? 'border-rose-400 border-2 bg-rose-900/20' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 -ml-2 text-neutral-600 touch-none" onTouchStart={(e) => handleGripTouchStart(e, index, 'favFood')}>
                      <Icons.GripVertical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-200">{fav.foodName}</div>
                      <div className="text-xs text-neutral-400 mt-1 flex gap-2">
                        <span className="text-orange-400">{fav.calories} kcal</span>
                        <span className="text-blue-400">P:{fav.protein}</span>
                        <span className="text-yellow-400">C:{fav.carbs}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => deleteFavorite(fav.id, e)} className="p-2 text-neutral-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-neutral-500 text-sm">還沒有常用食物，<br />在新增記錄時勾選「加入常用」即可！</div>
            )}
          </div>
        )}

        {/* Favorites - Water */}
        {inputMethod === 'favorites' && inputModalType === 'water' && (
          <div className="space-y-3 min-h-[200px]">
            {favoriteWaterContainers.length > 0 ? favoriteWaterContainers.map((fav, index) => {
              const isDragging = draggedIndex === index && dragListType === 'favWater';
              const isDragOver = dragOverIndex === index && draggedIndex !== index && dragListType === 'favWater';
              return (
                <div
                  key={fav.id}
                  ref={(el) => setItemRef(`favWater-${index}`, el)}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, index, 'favWater'); }}
                  onDragOver={(e) => handleDragOver(e, index, 'favWater')}
                  onDragEnd={handleDragEnd}
                  onDragLeave={() => setDragOverIndex(null)}
                  onTouchStart={(e) => handleTouchStart(e, index, 'favWater')}
                  onTouchMove={(e) => handleTouchMove(e, 'favWater')}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchCancel}
                  onClick={() => !draggedIndex && selectFavorite(fav)}
                  className={`bg-neutral-800 p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all group select-none ${isDragging ? 'opacity-60 scale-95 shadow-lg ring-2 ring-blue-400' : 'border-neutral-700 hover:bg-neutral-700'} ${isDragOver ? 'border-blue-400 border-2 bg-blue-900/20' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 -ml-2 text-neutral-600 touch-none" onTouchStart={(e) => handleGripTouchStart(e, index, 'favWater')}>
                      <Icons.GripVertical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-200">{fav.beverageName}</div>
                      <div className="text-xs text-neutral-400 mt-1 flex gap-2">
                        <span className="text-blue-400">{fav.amount} ml</span>
                        {(fav.calories || 0) > 0 && <span className="text-orange-400">{fav.calories} kcal</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => deleteFavorite(fav.id, e)} className="p-2 text-neutral-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-neutral-500 text-sm">還沒有常用容器，<br />在新增記錄時勾選「加入常用」即可！</div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {inputMethod === 'ai' && (
          <div className="space-y-4">
            {!selectedImage ? (
              <>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-5 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-dashed border-neutral-600 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-900/30 text-blue-400 p-2.5 rounded-lg"><Icons.Camera /></div>
                    <span className="font-bold text-neutral-300 text-base">拍照 / 上傳圖片</span>
                  </div>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-neutral-800"></div>
                  <span className="mx-4 text-xs text-neutral-500">或輸入文字</span>
                  <div className="flex-grow border-t border-neutral-800"></div>
                </div>
                <div className="space-y-3">
                  <textarea value={manualText} onChange={e => setManualText(e.target.value)} className="w-full p-4 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none resize-none focus:border-teal-500 transition-colors text-white placeholder-neutral-500" placeholder={inputModalType === 'food' ? "例如：吃了一個雞腿便當..." : "例如：慢跑30分鐘..."} rows={3} />
                  <button onClick={executeAnalysis} disabled={isAnalyzing} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-base hover:bg-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAnalyzing ? (<><Icons.Loader2 className="animate-spin w-5 h-5" /> {analysisStatus || "辨識中..."}</>) : (<><Icons.ScanEye /> 開始 AI 分析</>)}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="relative">
                  {imagePreview && <img src={imagePreview} className="w-full h-48 object-cover rounded-xl border border-neutral-700" alt="Preview" />}
                  <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"><Icons.X /></button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-400 mb-1">補充說明 (選填)</label>
                  <textarea value={imageNotes} onChange={e => setImageNotes(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base text-white placeholder-neutral-500 focus:border-teal-500 outline-none resize-none" placeholder="例如：飯只吃了一半、去皮..." rows={2} />
                </div>
                <button onClick={executeAnalysis} disabled={isAnalyzing} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg hover:bg-teal-500 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {isAnalyzing ? (<><Icons.Loader2 className="animate-spin w-5 h-5" /> {analysisStatus || "辨識中..."}</>) : (<><Icons.Rocket /> 開始分析</>)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Input */}
        {inputMethod === 'manual' && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-neutral-400">名稱</label>
                {inputModalType === 'activity' && (
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-[10px] text-neutral-400 cursor-pointer hover:text-teal-400 transition-colors">
                      <input type="checkbox" checked={manualForm.name === '每日消耗'} onChange={() => setManualForm(p => ({ ...p, name: '每日消耗' }))} className="accent-teal-500" /> 每日消耗
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-neutral-400 cursor-pointer hover:text-teal-400 transition-colors">
                      <input type="checkbox" checked={manualForm.name === '每日消耗（含運動）'} onChange={() => setManualForm(p => ({ ...p, name: '每日消耗（含運動）' }))} className="accent-teal-500" /> 每日消耗(含運動)
                    </label>
                  </div>
                )}
              </div>
              <input type="text" value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder={inputModalType === 'food' ? "例如：牛肉麵" : (inputModalType === 'water' ? "例如：保溫瓶" : "例如：游泳")} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-neutral-400 mb-1">{inputModalType === 'food' ? '熱量 (kcal)' : (inputModalType === 'water' ? '容量 (ml)' : '消耗 (kcal)')}</label>
                <input type="number" value={manualForm.val1} onChange={e => setManualForm(p => ({ ...p, val1: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-neutral-400 mb-1">{inputModalType === 'food' ? '蛋白質 (g)' : (inputModalType === 'water' ? '熱量 (kcal)' : '時間 (分)')}</label>
                <input type="number" value={manualForm.val2} onChange={e => setManualForm(p => ({ ...p, val2: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" />
              </div>
            </div>
            {(inputModalType === 'food') && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-neutral-400 mb-1">碳水 (g)</label>
                  <input type="number" value={manualForm.val3} onChange={e => setManualForm(p => ({ ...p, val3: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-neutral-400 mb-1">脂肪 (g)</label>
                  <input type="number" value={manualForm.val4} onChange={e => setManualForm(p => ({ ...p, val4: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" />
                </div>
              </div>
            )}
            {(inputModalType === 'food' || inputModalType === 'water') && (
              <div className="flex items-center gap-2 pt-2 cursor-pointer" onClick={() => setAddToFavorites(!addToFavorites)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center ${addToFavorites ? 'bg-rose-500 border-rose-500' : 'border-neutral-500'}`}>
                  {addToFavorites && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <label className="text-sm text-neutral-300 font-bold cursor-pointer select-none">加入常用{inputModalType === 'water' ? '容器' : '食物'}</label>
              </div>
            )}
            <button onClick={() => saveLog('manual')} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-base mt-2 hover:bg-teal-500 active:scale-[0.98] transition-all"><Icons.Check /> 加入紀錄</button>
          </div>
        )}

        {/* Resistance Input */}
        {inputMethod === 'resistance' && (
          <div className="space-y-4 animate-fadeIn">
            {/* My List Header */}
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-neutral-400">我的運動清單</label>
              <div className="flex gap-2">
                <input type="text" value={newDefName} onChange={e => setNewDefName(e.target.value)} placeholder="新增項目..." className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500 w-24" />
                <button onClick={handleAddResistanceDef} className="bg-teal-600 text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-teal-500"><Icons.Plus className="w-3 h-3" /></button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {resistanceDefs.length === 0 ? (
                <div className="text-center text-neutral-600 text-xs py-4">暫無項目，請由上方新增</div>
              ) : (
                resistanceDefs.map((def, index) => {
                  const activeItem = resistanceSession.find(i => i.defId === def.id);
                  const isChecked = !!activeItem;
                  const isDragging = draggedIndex === index && dragListType === 'resistance';
                  const isDragOver = dragOverIndex === index && draggedIndex !== index && dragListType === 'resistance';
                  return (
                    <div
                      key={def.id}
                      ref={(el) => setItemRef(`resistance-${index}`, el)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, 'resistance')}
                      onDragOver={(e) => handleDragOver(e, index, 'resistance')}
                      onDragEnd={handleDragEnd}
                      onDragLeave={() => setDragOverIndex(null)}
                      onTouchStart={(e) => handleTouchStart(e, index, 'resistance')}
                      onTouchMove={(e) => handleTouchMove(e, 'resistance')}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchCancel}
                      className={`bg-neutral-800 border ${isChecked ? 'border-teal-500/50' : 'border-neutral-700'} rounded-xl p-3 transition-all cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-50 scale-95 ring-2 ring-teal-400 shadow-lg' : ''} ${isDragOver ? 'border-teal-400 border-2 bg-teal-900/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <div className="p-2 -ml-2 text-neutral-600 touch-none" onTouchStart={(e) => handleGripTouchStart(e, index, 'resistance')}>
                            <Icons.GripVertical className="w-5 h-5" />
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-teal-500 border-teal-500' : 'border-neutral-500'}`} onClick={() => toggleResistanceItem(def)}>
                            {isChecked && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-neutral-400'}`}>{def.name}</span>
                        </label>
                        <button onClick={(e) => handleDeleteResistanceDef(def.id, e)} className="text-neutral-600 hover:text-red-500"><Icons.Trash className="w-3.5 h-3.5" /></button>
                      </div>

                      {isChecked && (
                        <div className="grid grid-cols-4 gap-2 pl-11 animate-fadeIn">
                          <div><label className="text-[10px] text-neutral-500 block mb-0.5">重量(kg)</label><input type="number" value={activeItem?.weight || ''} onChange={e => updateResistanceItem(def.id, 'weight', e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500" placeholder="0" /></div>
                          <div><label className="text-[10px] text-neutral-500 block mb-0.5">每組次數</label><input type="number" value={activeItem?.reps || ''} onChange={e => updateResistanceItem(def.id, 'reps', e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500" placeholder="0" /></div>
                          <div><label className="text-[10px] text-neutral-500 block mb-0.5">組數</label><input type="number" value={activeItem?.sets || ''} onChange={e => updateResistanceItem(def.id, 'sets', e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500" placeholder="0" /></div>
                          <div><label className="text-[10px] text-neutral-500 block mb-0.5">每組時間(秒)</label><input type="number" value={activeItem?.time || ''} onChange={e => updateResistanceItem(def.id, 'time', e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-teal-500" placeholder="選填" /></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button onClick={calculateAndSaveResistance} disabled={isAnalyzing} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-base hover:bg-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 mt-4">
              {isAnalyzing ? <><Icons.Loader2 className="animate-spin w-4 h-4" /> 計算中...</> : <><Icons.Activity /> 開始計算並儲存</>}
            </button>

            {/* Today's Resistance Logs */}
            {resistanceLogs.filter(l => l.date === (currentViewDate || getLocalISOString())).length > 0 && (
              <div className="mt-8 border-t border-neutral-800 pt-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2"><Icons.History className="w-4 h-4" /> 今日已完成訓練</h4>
                <div className="space-y-3">
                  {resistanceLogs.filter(l => l.date === (currentViewDate || getLocalISOString())).map(log => (
                    <div key={log.id} className="bg-neutral-800/50 rounded-xl p-3 border border-neutral-700 relative group">
                      <button onClick={() => setConfirmModal({ id: log.id, type: 'resistanceLog' })} className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Icons.Trash className="w-3.5 h-3.5" /></button>
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-neutral-500">{new Date(log.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-teal-400 font-bold text-sm">+{log.totalCalories} kcal</div>
                      </div>
                      <div className="space-y-1">
                        {log.items.map((item, idx) => (
                          <div key={idx} className="text-xs text-neutral-300 flex justify-between">
                            <span>{item.name}</span>
                            <span className="text-neutral-500">{item.weight}kg × {item.sets}組 × {item.reps}次{(item.time && item.time > 0) ? ` (${item.time}s)` : ''}</span>
                          </div>
                        ))}
                      </div>
                      {log.notes && <div className="mt-2 pt-2 border-t border-neutral-700/50 text-[10px] text-neutral-400 italic">{log.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
