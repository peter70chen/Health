
import React, { useState } from 'react';
import { Icons } from '../Icons';
import { SortableItem } from '../ui/SortableItem';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  // Mobile.md #1: Sensors Customization - Removed delay/tolerance since we now use handlers
  const sensors = useSensors(
    useSensor(TouchSensor), // Default constraints are fine for explicit handle drag
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    // Mobile.md #1: Haptic Feedback
    if (navigator.vibrate) navigator.vibrate(10);

    // Find the active item for Overlay display
    const { id } = event.active;
    if (String(id).startsWith('favFood-')) {
      const idx = parseInt(String(id).split('-')[1]);
      setActiveItem(favoriteFoods[idx]);
    } else if (String(id).startsWith('favWater-')) {
      const idx = parseInt(String(id).split('-')[1]);
      setActiveItem(favoriteWaterContainers[idx]);
    } else if (String(id).startsWith('resistance-')) {
      const idx = parseInt(String(id).split('-')[1]);
      setActiveItem(resistanceDefs[idx]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (inputMethod === 'favorites' && inputModalType === 'food') {
        const oldIndex = favoriteFoods.findIndex((_, idx) => `favFood-${idx}` === active.id);
        const newIndex = favoriteFoods.findIndex((_, idx) => `favFood-${idx}` === over.id);
        if (oldIndex !== -1 && newIndex !== -1) reorderFavoriteFoods(oldIndex, newIndex);
      } else if (inputMethod === 'favorites' && inputModalType === 'water') {
        const oldIndex = favoriteWaterContainers.findIndex((_, idx) => `favWater-${idx}` === active.id);
        const newIndex = favoriteWaterContainers.findIndex((_, idx) => `favWater-${idx}` === over.id);
        if (oldIndex !== -1 && newIndex !== -1) reorderFavoriteWaterContainers(oldIndex, newIndex);
      } else if (inputMethod === 'resistance') {
        const oldIndex = resistanceDefs.findIndex((_, idx) => `resistance-${idx}` === active.id);
        const newIndex = resistanceDefs.findIndex((_, idx) => `resistance-${idx}` === over.id);
        if (oldIndex !== -1 && newIndex !== -1) reorderResistanceDefs(oldIndex, newIndex);
      }
    }

    setActiveId(null);
    setActiveItem(null);
  };

  const renderFoodItem = (fav: FavoriteFood, listeners?: any) => (
    <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex justify-between items-center transition-all hover:bg-neutral-700 select-none">
      <div className="flex items-center gap-2">
        <div className="p-2 -ml-2 text-neutral-600 cursor-grab active:cursor-grabbing touch-none" {...listeners}>
          <Icons.GripVertical className="w-5 h-5" />
        </div>
        <div onClick={() => selectFavorite(fav)} className="flex-1 cursor-pointer">
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

  const renderWaterItem = (fav: FavoriteWaterContainer, listeners?: any) => (
    <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex justify-between items-center transition-all hover:bg-neutral-700 select-none">
      <div className="flex items-center gap-2">
        <div className="p-2 -ml-2 text-neutral-600 cursor-grab active:cursor-grabbing touch-none" {...listeners}>
          <Icons.GripVertical className="w-5 h-5" />
        </div>
        <div onClick={() => selectFavorite(fav)} className="flex-1 cursor-pointer">
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

  const renderResistanceItem = (def: ResistanceDef, listeners?: any) => {
    const activeItem = resistanceSession.find(i => i.defId === def.id);
    const isChecked = !!activeItem;
    return (
      <div className={`bg-neutral-800 border ${isChecked ? 'border-teal-500/50' : 'border-neutral-700'} rounded-xl p-3 transition-all select-none`}>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 select-none">
            <div className="p-2 -ml-2 text-neutral-600 cursor-grab active:cursor-grabbing touch-none" {...listeners}>
              <Icons.GripVertical className="w-5 h-5" />
            </div>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${isChecked ? 'bg-teal-500 border-teal-500' : 'border-neutral-500'}`} onClick={() => toggleResistanceItem(def)}>
              {isChecked && <Icons.Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={`text-sm font-bold cursor-pointer ${isChecked ? 'text-white' : 'text-neutral-400'}`} onClick={() => toggleResistanceItem(def)}>{def.name}</span>
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
  };

  if (!inputModalType) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={e => { if (e.target === e.currentTarget) setInputModalType(null) }}>
        <div
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
              {favoriteFoods.length > 0 ? (
                <SortableContext items={favoriteFoods.map((_, i) => `favFood-${i}`)} strategy={verticalListSortingStrategy}>
                  {favoriteFoods.map((fav, index) => (
                    <SortableItem key={fav.id} id={`favFood-${index}`}>
                      {({ listeners }) => renderFoodItem(fav, listeners)}
                    </SortableItem>
                  ))}
                </SortableContext>
              ) : (
                <div className="text-center py-10 text-neutral-500 text-sm">還沒有常用食物，<br />在新增記錄時勾選「加入常用」即可！</div>
              )}
            </div>
          )}

          {/* Favorites - Water */}
          {inputMethod === 'favorites' && inputModalType === 'water' && (
            <div className="space-y-3 min-h-[200px]">
              {favoriteWaterContainers.length > 0 ? (
                <SortableContext items={favoriteWaterContainers.map((_, i) => `favWater-${i}`)} strategy={verticalListSortingStrategy}>
                  {favoriteWaterContainers.map((fav, index) => (
                    <SortableItem key={fav.id} id={`favWater-${index}`}>
                      {({ listeners }) => renderWaterItem(fav, listeners)}
                    </SortableItem>
                  ))}
                </SortableContext>
              ) : (
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
                  <SortableContext items={resistanceDefs.map((_, i) => `resistance-${i}`)} strategy={verticalListSortingStrategy}>
                    {resistanceDefs.map((def, index) => (
                      <SortableItem key={def.id} id={`resistance-${index}`}>
                        {({ listeners }) => renderResistanceItem(def, listeners)}
                      </SortableItem>
                    ))}
                  </SortableContext>
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

        {/* Drag Overlay for Visual Feedback */}
        <DragOverlay>
          {activeId && activeItem ? (
            activeId.startsWith('favFood') ? renderFoodItem(activeItem as FavoriteFood) :
              activeId.startsWith('favWater') ? renderWaterItem(activeItem as FavoriteWaterContainer) :
                activeId.startsWith('resistance') ? renderResistanceItem(activeItem as ResistanceDef) : null
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
