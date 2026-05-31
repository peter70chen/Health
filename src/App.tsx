import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './components/Icons';
import { TrendChart } from './components/charts/TrendChart';
import { WeightChart } from './components/charts/WeightChart';
import { InputModal, SettingsPanel, ConfirmModal, TargetModal, AnalysisResult, DataHealthPanel } from './components/modals';
import { QuickWaterModal } from './components/modals/QuickWaterModal';
import { DashboardCard, ActionButtons, DailyList, CoachSection, WeightStats, WeightForm, WeightList, WeightHistory } from './components/tabs';
import { callGeminiWithFallback } from './services/gemini';
import { getActivityWarnings, getFoodWarnings, getWaterWarnings } from './lib/analysisWarnings';
import { getDataHealthIssues } from './lib/dataHealth';
import { PROMPTS } from './lib/prompts';
import { CONFIG, STORAGE_KEYS } from './lib/config';
import { removeTransientImagePreview } from './lib/dataSanitizers';
import { downloadJsonFile } from './lib/download';
import { buildTrainingExport } from './lib/trainingExport';
import { getLocalISOString, sortByDateAndIdDesc } from './lib/utils';
import { APP_DISPLAY_VERSION } from './lib/version';
import { useAutoClearStatus } from './hooks/useStatusMessage';
import { useImportExport } from './hooks/useImportExport';
import { useHydrateFromStorage, usePersistToStorage } from './hooks/useStorageSync';
import type {
  ApiKeys, WeightLog, FoodLog, ActivityLog, WaterLog, ChartData,
  AnalyzedFood, AnalyzedActivity, AnalyzedWater,
  FavoriteFood, FavoriteWaterContainer, ManualFormState,
  ConfirmModalState, TargetModalState, RangeQueryResults,
  ResistanceDef, ResistanceLog, ResistanceItem
} from './types';

type FavoriteSelectable = FavoriteFood | FavoriteWaterContainer;

type LinkedLogItem = {
  id: number;
  linkId?: number;
};

type EditingFoodPortionState = {
  id: number;
  portion: number;
} | null;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '未知錯誤';

const getFoodBaseValues = (food: FoodLog) => {
  const currentPortion = food.portion && food.portion > 0 ? food.portion : 1;
  return {
    calories: food.baseCalories ?? Math.round((food.calories || 0) / currentPortion),
    protein: food.baseProtein ?? Math.round((food.protein || 0) / currentPortion),
    carbs: food.baseCarbs ?? Math.round((food.carbs || 0) / currentPortion),
    fat: food.baseFat ?? Math.round((food.fat || 0) / currentPortion),
    amount: food.baseAmount ?? ((food.amount ?? 0) > 0 ? Math.round((food.amount || 0) / currentPortion) : undefined)
  };
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weight'>('daily');
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ free1: '', free2: '', free3: '', free4: '', free5: '', paid: '' });
  const [showSettings, setShowSettings] = useState(false);
  const [showDataHealth, setShowDataHealth] = useState(false);
  const [trendRange, setTrendRange] = useState(7);
  const [weightRange, setWeightRange] = useState(7);

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [favoriteWaterContainers, setFavoriteWaterContainers] = useState<FavoriteWaterContainer[]>([]);
  const [resistanceDefs, setResistanceDefs] = useState<ResistanceDef[]>([]);
  const [resistanceLogs, setResistanceLogs] = useState<ResistanceLog[]>([]);

  const [dailyTarget, setDailyTarget] = useState<number>(CONFIG.DEFAULT_TARGET);
  const [activityTarget, setActivityTarget] = useState<number>(CONFIG.DEFAULT_ACTIVITY_TARGET);
  const [waterTarget, setWaterTarget] = useState<number>(CONFIG.DEFAULT_WATER_TARGET);

  const [targetModal, setTargetModal] = useState<TargetModalState | null>(null);
  const [tempTargetValue, setTempTargetValue] = useState("");

  const [inputDate, setInputDate] = useState(getLocalISOString());
  const [inputWeight, setInputWeight] = useState('');
  const [inputBodyFat, setInputBodyFat] = useState('');
  const [inputMuscle, setInputMuscle] = useState('');
  const [inputVisceral, setInputVisceral] = useState('');
  const [inputDose, setInputDose] = useState('2.5');
  const [inputNotes, setInputNotes] = useState('');

  const [inputModalType, setInputModalType] = useState<'food' | 'activity' | 'water' | null>(null);
  const [inputMethod, setInputMethod] = useState<'ai' | 'manual' | 'favorites' | 'resistance'>('ai');
  const [resistanceSession, setResistanceSession] = useState<ResistanceItem[]>([]);
  const [newDefName, setNewDefName] = useState('');
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [addToFavorites, setAddToFavorites] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageNotes, setImageNotes] = useState("");

  const [analyzedFood, setAnalyzedFood] = useState<AnalyzedFood | null>(null);
  const [analyzedActivity, setAnalyzedActivity] = useState<AnalyzedActivity | null>(null);
  const [analyzedWater, setAnalyzedWater] = useState<AnalyzedWater | null>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>({ name: '', val1: '', val2: '', val3: '', val4: '' });
  const [portion, setPortion] = useState(1.0);

  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [coachAdvice, setCoachAdvice] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [editingFoodPortion, setEditingFoodPortion] = useState<EditingFoodPortionState>(null);

  const [analysisStatus, setAnalysisStatus] = useState("");
  const [coachStatus, setCoachStatus] = useState("");

  const [currentViewDate, setCurrentViewDate] = useState(getLocalISOString());
  const [weightHistoryDate, setWeightHistoryDate] = useState(getLocalISOString());
  const [showWeightHistory, setShowWeightHistory] = useState(false);
  const [showQuickWaterModal, setShowQuickWaterModal] = useState(false);

  const [historyStartDate, setHistoryStartDate] = useState(getLocalISOString());
  const [historyEndDate, setHistoryEndDate] = useState(getLocalISOString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const analysisResultRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useAutoClearStatus(statusMessage, setStatusMessage, 3000);

  useHydrateFromStorage({
    setWeightLogs,
    setFoodLogs,
    setActivityLogs,
    setFavoriteFoods,
    setWaterLogs,
    setFavoriteWaterContainers,
    setResistanceDefs,
    setResistanceLogs,
    setCoachAdvice,
    setDailyTarget,
    setActivityTarget,
    setWaterTarget,
    setApiKeys,
    setLoading
  });

  usePersistToStorage({
    loading,
    weightLogs,
    foodLogs,
    activityLogs,
    favoriteFoods,
    waterLogs,
    favoriteWaterContainers,
    coachAdvice,
    dailyTarget,
    activityTarget,
    waterTarget,
    resistanceDefs,
    resistanceLogs
  });

  useEffect(() => {
    if (inputModalType) {
      setInputMethod('ai');
      setManualForm({ name: '', val1: '', val2: '', val3: '', val4: '' });
      setPortion(1.0);
      setSelectedImage(null);
      setImagePreview(null);
      setImageNotes("");
      setAddToFavorites(false);
      // Reset resistance session mostly, but if we have existing log for today, load it?
      // For now, start fresh or load if viewing history.
      // Let's check if there is a log for today already to pre-fill?
      const logDate = currentViewDate || getLocalISOString();
      const existingLog = resistanceLogs.find(l => l.date === logDate);
      if (existingLog) {
        setResistanceSession(existingLog.items);
      } else {
        setResistanceSession([]);
      }
    }
  }, [inputModalType, currentViewDate, resistanceLogs]);

  useEffect(() => { if (weightHistoryDate) setShowWeightHistory(true); }, [weightHistoryDate]);

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys));
    // setShowSettings(false); // Keep settings open
    setStatusMessage({ type: 'success', text: "設定已儲存！" });
  };

  useEffect(() => {
    if ((analyzedFood || analyzedActivity || analyzedWater) && analysisResultRef.current) {
      setTimeout(() => {
        analysisResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [analyzedFood, analyzedActivity, analyzedWater]);

  const openTargetModal = (type: 'daily' | 'activity') => {
    setTargetModal({ type, value: type === 'daily' ? dailyTarget : activityTarget });
    setTempTargetValue(String(type === 'daily' ? dailyTarget : activityTarget));
  };

  const saveTargetModal = () => {
    if (!targetModal) return;
    const val = parseFloat(tempTargetValue);
    if (!isNaN(val) && val > 0) {
      if (targetModal.type === 'daily') setDailyTarget(val);
      else setActivityTarget(val);
    }
    setTargetModal(null);
  };

  const { handleExport, handleImport } = useImportExport({
    exportData: {
      weightLogs,
      foodLogs,
      activityLogs,
      favoriteFoods,
      waterLogs,
      favoriteWaterContainers,
      coachAdvice,
      dailyTarget,
      activityTarget,
      waterTarget,
      resistanceDefs,
      resistanceLogs
    },
    importInputRef,
    setStatusMessage,
    getLocalISOString,
    setWeightLogs,
    setFoodLogs,
    setActivityLogs,
    setFavoriteFoods,
    setWaterLogs,
    setFavoriteWaterContainers,
    setCoachAdvice,
    setDailyTarget,
    setActivityTarget,
    setWaterTarget,
    setResistanceDefs,
    setResistanceLogs
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const executeAnalysis = async () => {
    const currentType = inputModalType;
    setIsAnalyzing(true);
    setAnalysisStatus("準備中...");
    try {
      let prompt = '', img: string | null = null;
      if (selectedImage) {
        img = await new Promise<string>(r => {
          const rd = new FileReader();
          rd.onload = () => r((rd.result as string).split(',')[1]);
          rd.readAsDataURL(selectedImage);
        });
        if (currentType === 'food') prompt = PROMPTS.foodImage;
        else if (currentType === 'activity') prompt = PROMPTS.activityImage;
        else prompt = PROMPTS.waterImage;
        prompt = prompt.replace('{{NOTES}}', imageNotes);
      } else {
        if (!manualText.trim()) { alert("請輸入描述"); setIsAnalyzing(false); return; }
        if (currentType === 'water') {
          prompt = PROMPTS.waterText.replace('{{TEXT}}', manualText);
        } else {
          prompt = (currentType === 'food' ? PROMPTS.foodText : PROMPTS.activityText).replace('{{TEXT}}', manualText);
        }
      }
      const res = await callGeminiWithFallback<AnalyzedFood | AnalyzedActivity | AnalyzedWater>(prompt, img, setAnalysisStatus, apiKeys);
      if (!res.notes) res.notes = "本次分析未產生額外建議。";
      const obj = { ...res, imagePreview: imagePreview || undefined, isText: !img };
      setPortion(1.0);
      setAnalyzedFood(null); setAnalyzedActivity(null); setAnalyzedWater(null);
      if (currentType === 'food') {
        const food = obj as AnalyzedFood;
        setAnalyzedFood({ ...food, warnings: getFoodWarnings(food) });
      }
      else if (currentType === 'activity') {
        const activity = obj as AnalyzedActivity;
        setAnalyzedActivity({ ...activity, warnings: getActivityWarnings(activity) });
      }
      else {
        const water = obj as AnalyzedWater;
        setAnalyzedWater({ ...water, warnings: getWaterWarnings(water) });
      }
      setManualText(''); setImageNotes('');
      setInputModalType(null);
    } catch (e: unknown) { alert("分析失敗：\n" + getErrorMessage(e)); }
    finally { setIsAnalyzing(false); setAnalysisStatus(""); }
  };

  const handleAskCoach = async () => {
    setIsCoachThinking(true);
    setCoachStatus("準備中...");
    try {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const recentWeights = weightLogs.filter(l => new Date(l.date) >= sevenDaysAgo).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const recentFood = foodLogs.filter(l => new Date(l.date) >= sevenDaysAgo);
      const recentActivity = activityLogs.filter(l => new Date(l.date) >= sevenDaysAgo);
      const totalIn = recentFood.reduce((s, i) => s + (i.calories || 0), 0);
      const totalOut = recentActivity.reduce((s, i) => s + (i.activeCalories || 0), 0);
      const latestWeightLog = sortByDateAndIdDesc(weightLogs)[0];
      const startW = recentWeights.length > 0 ? recentWeights[0].weight : (latestWeightLog?.weight || CONFIG.START_W);
      const endW = recentWeights.length > 0 ? recentWeights[recentWeights.length - 1].weight : startW;
      const currentDose = (() => {
        const hasDose = (d: string | undefined) => d !== undefined && d !== null && String(d).trim() !== '';
        const doseInRange = recentWeights.slice().reverse().find(l => hasDose(l.dose));
        if (doseInRange) return doseInRange.dose;
        const anyDose = sortByDateAndIdDesc(weightLogs).find(l => hasDose(l.dose));
        return anyDose ? anyDose.dose : '未知';
      })();
      const prompt = PROMPTS.coachReview
        .replace('{{startW}}', String(startW))
        .replace('{{endW}}', String(endW))
        .replace('{{totalIn}}', String(totalIn))
        .replace('{{avgIn}}', String(Math.round(totalIn / 7)))
        .replace('{{totalOut}}', String(totalOut))
        .replace('{{avgOut}}', String(Math.round(totalOut / 7)))
        .replace('{{dose}}', String(currentDose));
      const res = await callGeminiWithFallback<{ advice?: string; reply?: string }>(prompt, null, setCoachStatus, apiKeys);
      setCoachAdvice(res.advice || res.reply || '');
    } catch (e: unknown) { alert("發生錯誤：" + getErrorMessage(e)); }
    finally { setIsCoachThinking(false); setCoachStatus(""); }
  };

  const handleAddResistanceDef = () => {
    if (!newDefName.trim()) return;
    const newDef: ResistanceDef = { id: Date.now(), name: newDefName.trim() };
    setResistanceDefs(prev => [...prev, newDef]);
    setNewDefName('');
  };

  const handleDeleteResistanceDef = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ id, type: 'resistanceDef' });
  };

  const reorderResistanceDefs = (fromIndex: number, toIndex: number) => {
    setResistanceDefs(prev => {
      const newDefs = [...prev];
      const [removed] = newDefs.splice(fromIndex, 1);
      newDefs.splice(toIndex, 0, removed);
      return newDefs;
    });
  };

  const toggleResistanceItem = (def: ResistanceDef) => {
    const exists = resistanceSession.some(item => item.defId === def.id);
    if (exists) {
      setResistanceSession(prev => prev.filter(item => item.defId !== def.id));
    } else {
      setResistanceSession(prev => [...prev, { defId: def.id, name: def.name, weight: 12, sets: 3, reps: 12 }]);
    }
  };

  const updateResistanceItem = (defId: number, field: 'weight' | 'sets' | 'reps' | 'time', value: string) => {
    const val = parseFloat(value) || 0;
    setResistanceSession(prev => prev.map(item => item.defId === defId ? { ...item, [field]: val } : item));
  };

  const estimateResistanceItemSeconds = (item: ResistanceItem): number => {
    const sets = Math.max(Math.round(item.sets || 0), 0);
    const reps = Math.max(Math.round(item.reps || 0), 0);
    if (sets <= 0) return 0;
    const secondsPerSet = item.time && item.time > 0 ? item.time : reps * 3;
    const restSeconds = Math.max(sets - 1, 0) * 60;
    return Math.round((secondsPerSet * sets) + restSeconds);
  };

  const calculateAndSaveResistance = async () => {
    if (resistanceSession.length === 0) { alert("請至少勾選一個項目"); return; }
    setIsAnalyzing(true);
    setAnalysisStatus("AI 計算消耗中...");

    try {
      const currentWeight = sortByDateAndIdDesc(weightLogs)[0]?.weight || CONFIG.START_W;
      const itemsList = resistanceSession.map(i => {
        const estimatedSeconds = estimateResistanceItemSeconds(i);
        const estimatedMinutes = Math.round(estimatedSeconds / 60 * 10) / 10;
        const secondsPerSet = i.time && i.time > 0 ? `${i.time}秒` : `${i.reps * 3}秒（以每次3秒估算）`;
        let s = `- ${i.name}: ${i.weight}kg, ${i.sets}組, 每組${i.reps}次, 每組動作時間${secondsPerSet}, 組間休息固定60秒`;
        if (estimatedSeconds > 0) s += `, 估算總時間${estimatedSeconds}秒（約${estimatedMinutes}分鐘）`;
        return s;
      }).join('\n');

      const prompt = PROMPTS.resistanceCalc.replace('{{weight}}', String(currentWeight)).replace('{{items}}', itemsList);

      const res = await callGeminiWithFallback<{ totalCalories?: number; notes?: string }>(prompt, null, setAnalysisStatus, apiKeys);

      const totalCalories = res.totalCalories || 0;
      const notes = res.notes || "";

      // Save Log
      const now = Date.now();
      const logDate = currentViewDate || getLocalISOString();

      // Remove old log for this date if exists (overwrite logic for simplicity per day)
      setResistanceLogs(prev => prev.filter(l => l.date !== logDate));

      const newLog: ResistanceLog = {
        id: now,
        date: logDate,
        items: resistanceSession,
        totalCalories,
        notes
      };

      setResistanceLogs(prev => [newLog, ...prev]);
      setStatusMessage({ type: 'success', text: `已儲存！預估消耗 ${totalCalories} kcal` });
      setInputModalType(null);

    } catch (e: unknown) {
      alert("AI 計算發生錯誤: " + getErrorMessage(e));
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const parseNumber = (
    value: string,
    label: string,
    opts?: { min?: number; max?: number; required?: boolean }
  ): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      if (opts?.required) alert(`${label}為必填`);
      return opts?.required ? null : null;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      alert(`${label}格式不正確`);
      return null;
    }
    if (opts?.min !== undefined && num < opts.min) {
      alert(`${label}不可小於 ${opts.min}`);
      return null;
    }
    if (opts?.max !== undefined && num > opts.max) {
      alert(`${label}不可大於 ${opts.max}`);
      return null;
    }
    return num;
  };

  const saveLog = (type: string) => {
    const now = Date.now();
    const logDate = currentViewDate || getLocalISOString();

    if (type === 'manual') {
      if (!manualForm.name.trim()) { alert("請填寫名稱"); return; }
      if (!manualForm.val1.trim()) { alert("請填寫完整資訊"); return; }

      if (inputModalType === 'food') {
        const calories = parseNumber(manualForm.val1, '熱量', { min: 0, required: true });
        const protein = parseNumber(manualForm.val2 || '0', '蛋白質', { min: 0 }) ?? 0;
        const carbs = parseNumber(manualForm.val3 || '0', '碳水', { min: 0 }) ?? 0;
        const fat = parseNumber(manualForm.val4 || '0', '脂肪', { min: 0 }) ?? 0;
        if (calories === null) return;
        const foodItem = {
          foodName: manualForm.name.trim(),
          calories: Math.round(calories),
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fat: Math.round(fat),
          baseCalories: Math.round(calories),
          baseProtein: Math.round(protein),
          baseCarbs: Math.round(carbs),
          baseFat: Math.round(fat),
          portion: 1
        };
        if (addToFavorites) {
          setFavoriteFoods(prev => [{ id: now + 1, ...foodItem }, ...prev]);
        }
        setFoodLogs(p => [{ id: now, date: logDate, type: 'food', ...foodItem, isManual: true }, ...p]);
      } else if (inputModalType === 'water') {
        const linkId = now;
        const amount = parseNumber(manualForm.val1, '水量', { min: 1, required: true });
        const wCals = parseNumber(manualForm.val2 || '0', '熱量', { min: 0 }) ?? 0;
        const wPro = parseNumber(manualForm.val3 || '0', '蛋白質', { min: 0 }) ?? 0;
        const wCarbs = parseNumber(manualForm.val4 || '0', '碳水', { min: 0 }) ?? 0;
        if (amount === null) return;
        const isCaloric = wCals > 0;

        setWaterLogs(p => [{ id: now, linkId: isCaloric ? linkId : undefined, date: logDate, type: 'water', beverageName: manualForm.name.trim(), amount: Math.round(amount), isManual: true, isHidden: isCaloric }, ...p]);

        if (addToFavorites) {
          setFavoriteWaterContainers(prev => [{
            id: now + 1, beverageName: manualForm.name.trim(), amount: Math.round(amount),
            calories: Math.round(wCals), protein: Math.round(wPro), carbs: Math.round(wCarbs), fat: 0
          }, ...prev]);
        }

        if (isCaloric) {
          setFoodLogs(p => [{
            id: now + 2,
            linkId: linkId,
            date: logDate,
            type: 'food',
            foodName: manualForm.name.trim(),
            calories: Math.round(wCals),
            protein: Math.round(wPro),
            carbs: Math.round(wCarbs),
            fat: 0,
            baseCalories: Math.round(wCals),
            baseProtein: Math.round(wPro),
            baseCarbs: Math.round(wCarbs),
            baseFat: 0,
            baseAmount: Math.round(amount),
            amount: Math.round(amount),
            portion: 1,
            isManual: true
          }, ...p]);
        }
      } else {
        const activeCalories = parseNumber(manualForm.val1, '消耗熱量', { min: 0, required: true });
        const minutes = parseNumber(manualForm.val2 || '0', '運動分鐘數', { min: 0 }) ?? 0;
        if (activeCalories === null) return;
        setActivityLogs(p => [{ id: now, date: logDate, type: 'activity', activityName: manualForm.name.trim(), activeCalories: Math.round(activeCalories), exerciseMinutes: Math.round(minutes), isManual: true }, ...p]);
      }
      setInputModalType(null);
    }
    else if (type === 'food' && analyzedFood) {
      if (addToFavorites) {
        setFavoriteFoods(prev => [{
          id: now + 1,
          foodName: analyzedFood.foodName,
          calories: analyzedFood.calories,
          protein: analyzedFood.protein,
          carbs: analyzedFood.carbs,
          fat: analyzedFood.fat
        }, ...prev]);
      }
      const finalCal = Math.round(analyzedFood.calories * portion);
      const finalPro = Math.round((analyzedFood.protein || 0) * portion);
      const finalCarbs = analyzedFood.carbs ? Math.round(analyzedFood.carbs * portion) : 0;
      const finalFat = analyzedFood.fat ? Math.round(analyzedFood.fat * portion) : 0;
      const baseAmount = analyzedFood.amount && analyzedFood.amount > 0 ? Math.round(analyzedFood.amount) : undefined;

      setFoodLogs(p => [removeTransientImagePreview({
        id: now,
        date: logDate,
        type: 'food',
        foodName: analyzedFood.foodName,
        calories: finalCal,
        protein: finalPro,
        carbs: finalCarbs,
        fat: finalFat,
        baseCalories: Math.round(analyzedFood.calories || 0),
        baseProtein: Math.round(analyzedFood.protein || 0),
        baseCarbs: Math.round(analyzedFood.carbs || 0),
        baseFat: Math.round(analyzedFood.fat || 0),
        baseAmount,
        amount: baseAmount ? Math.round(baseAmount * portion) : undefined,
        notes: analyzedFood.notes,
        imagePreview: analyzedFood.imagePreview,
        isText: analyzedFood.isText,
        portion: portion
      }), ...p]);

      setAnalyzedFood(null);
    }
    else if (type === 'activity' && analyzedActivity) {
      setActivityLogs(p => [removeTransientImagePreview({
        id: now,
        date: logDate,
        type: 'activity',
        activityName: analyzedActivity.activityName,
        activeCalories: analyzedActivity.activeCalories,
        exerciseMinutes: analyzedActivity.exerciseMinutes,
        steps: analyzedActivity.steps,
        notes: analyzedActivity.notes,
        imagePreview: analyzedActivity.imagePreview,
        isText: analyzedActivity.isText
      }), ...p]);
      setAnalyzedActivity(null);
    }
    else if (type === 'water' && analyzedWater) {
      if (addToFavorites) {
        setFavoriteWaterContainers(prev => [{ id: now + 1, beverageName: analyzedWater.beverageName || '', amount: analyzedWater.amount, calories: analyzedWater.calories, protein: analyzedWater.protein, carbs: analyzedWater.carbs, fat: analyzedWater.fat }, ...prev]);
      }
      const finalAmount = Math.round((analyzedWater.amount || 0) * portion);
      const isCaloric = (analyzedWater.calories ?? 0) > 0;
      const linkId = isCaloric ? now : undefined;

      setWaterLogs(p => [removeTransientImagePreview({
        id: now,
        linkId: linkId,
        date: logDate,
        type: 'water',
        beverageName: analyzedWater.beverageName,
        amount: finalAmount,
        calories: analyzedWater.calories,
        protein: analyzedWater.protein,
        carbs: analyzedWater.carbs,
        fat: analyzedWater.fat,
        notes: analyzedWater.notes,
        imagePreview: analyzedWater.imagePreview,
        isText: analyzedWater.isText,
        isHidden: isCaloric
      }), ...p]);

      if (isCaloric) {
        const finalCal = Math.round((analyzedWater.calories || 0) * portion);
        const finalPro = Math.round((analyzedWater.protein || 0) * portion);
        const finalCarbs = Math.round((analyzedWater.carbs || 0) * portion);
        const finalFat = Math.round((analyzedWater.fat || 0) * portion);
        setFoodLogs(p => [{ id: now + 2, linkId: linkId, date: logDate, type: 'food', foodName: analyzedWater.beverageName || '', calories: finalCal, protein: finalPro, carbs: finalCarbs, fat: finalFat, baseCalories: Math.round(analyzedWater.calories || 0), baseProtein: Math.round(analyzedWater.protein || 0), baseCarbs: Math.round(analyzedWater.carbs || 0), baseFat: Math.round(analyzedWater.fat || 0), baseAmount: Math.round(analyzedWater.amount || 0), portion: portion, isManual: true, amount: finalAmount }, ...p]);
      }
      setAnalyzedWater(null);
    }
    setAddToFavorites(false);
  };

  const deleteFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputModalType === 'water') {
      setConfirmModal({ id, type: 'favoriteWaterContainer' });
    } else {
      setConfirmModal({ id, type: 'favoriteFood' });
    }
  };

  const selectFavorite = (item: FavoriteSelectable) => {
    if (inputModalType === 'water' && 'amount' in item) setAnalyzedWater({ ...item, imagePreview: undefined });
    else if ('foodName' in item) setAnalyzedFood({ ...item, imagePreview: undefined });
    setPortion(1.0);
    setInputModalType(null);
  };

  const reorderFavoriteFoods = (fromIndex: number, toIndex: number) => {
    setFavoriteFoods(prev => {
      const newList = [...prev];
      const [removed] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, removed);
      return newList;
    });
  };

  const reorderFavoriteWaterContainers = (fromIndex: number, toIndex: number) => {
    setFavoriteWaterContainers(prev => {
      const newList = [...prev];
      const [removed] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, removed);
      return newList;
    });
  };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWeight.trim()) { alert("請輸入體重"); return; }
    const weight = parseNumber(inputWeight, '體重', { min: 1, required: true });
    if (weight === null) return;
    const bodyFat = inputBodyFat.trim() ? parseNumber(inputBodyFat, '體脂', { min: 0, max: 100 }) : null;
    if (bodyFat === null && inputBodyFat.trim()) return;
    const muscle = inputMuscle.trim() ? parseNumber(inputMuscle, '肌肉率', { min: 0, max: 100 }) : null;
    if (muscle === null && inputMuscle.trim()) return;
    const visceral = inputVisceral.trim() ? parseNumber(inputVisceral, '內臟脂肪', { min: 0 }) : null;
    if (visceral === null && inputVisceral.trim()) return;
    const dose = inputDose.trim() ? parseNumber(inputDose, '劑量', { min: 0.01 }) : null;
    if (dose === null && inputDose.trim()) return;
    const newLog: WeightLog = {
      id: Date.now(),
      date: inputDate,
      weight: parseFloat(weight.toFixed(1)),
      bodyFat: bodyFat !== null ? parseFloat(bodyFat.toFixed(1)) : undefined,
      muscle: muscle !== null ? parseFloat(muscle.toFixed(1)) : undefined,
      visceral: visceral !== null ? parseFloat(visceral.toFixed(1)) : undefined,
      dose: dose !== null ? String(dose) : inputDose,
      notes: inputNotes
    };
    setWeightLogs(prev => sortByDateAndIdDesc([newLog, ...prev]));
    setInputWeight(''); setInputBodyFat(''); setInputMuscle(''); setInputVisceral(''); setInputNotes('');
    setStatusMessage({ type: 'success', text: '體重資料已儲存！' });
  };

  const executeDelete = () => {
    if (!confirmModal) return;
    const { id, type } = confirmModal;
    let linkId: number | undefined = undefined;
    if (type === 'food') { const item = foodLogs.find(i => i.id === id); if (item) linkId = item.linkId; }
    else if (type === 'water') { const item = waterLogs.find(i => i.id === id); if (item) linkId = item.linkId; }

    const shouldDelete = (item: LinkedLogItem) => item.id === id || (linkId !== undefined && item.linkId === linkId);

    if (type === 'weight') setWeightLogs(prev => prev.filter(item => item.id !== id));
    else if (type === 'resistanceDef') {
      setResistanceDefs(prev => prev.filter(d => d.id !== id));
      setResistanceSession(prev => prev.filter(i => i.defId !== id));
    }
    else if (type === 'resistanceLog') {
      setResistanceLogs(prev => prev.filter(l => l.id !== id));
    }
    else if (type === 'favoriteFood') {
      setFavoriteFoods(prev => prev.filter(f => f.id !== id));
    }
    else if (type === 'favoriteWaterContainer') {
      setFavoriteWaterContainers(prev => prev.filter(f => f.id !== id));
    }
    else {
      setWaterLogs(prev => prev.filter(item => !shouldDelete(item)));
      setFoodLogs(prev => prev.filter(item => !shouldDelete(item)));
      setActivityLogs(prev => prev.filter(item => !shouldDelete(item)));
    }
    setConfirmModal(null);
  };

  const openFoodPortionEditor = (food: FoodLog) => {
    setEditingFoodPortion({
      id: food.id,
      portion: food.portion && food.portion > 0 ? food.portion : 1
    });
  };

  const updateEditingFoodPortion = (portionValue: number) => {
    setEditingFoodPortion(prev => prev ? { ...prev, portion: portionValue } : prev);
  };

  const saveEditingFoodPortion = () => {
    if (!editingFoodPortion) return;
    setFoodLogs(prev => prev.map(food => {
      if (food.id !== editingFoodPortion.id) return food;
      const base = getFoodBaseValues(food);
      const nextAmount = base.amount !== undefined ? Math.round(base.amount * editingFoodPortion.portion) : food.amount;
      return {
        ...food,
        portion: editingFoodPortion.portion,
        calories: Math.round(base.calories * editingFoodPortion.portion),
        protein: Math.round(base.protein * editingFoodPortion.portion),
        carbs: Math.round(base.carbs * editingFoodPortion.portion),
        fat: Math.round(base.fat * editingFoodPortion.portion),
        amount: nextAmount,
        baseCalories: base.calories,
        baseProtein: base.protein,
        baseCarbs: base.carbs,
        baseFat: base.fat,
        baseAmount: base.amount
      };
    }));
    setEditingFoodPortion(null);
    setStatusMessage({ type: 'success', text: '食物份量已更新' });
  };

  // 長按水杯開啟快速加水模態框
  const handleQuickAddWater = () => {
    setShowQuickWaterModal(true);
  };

  // 確認快速加水
  const confirmQuickWater = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("飲水量需大於 0");
      return;
    }
    const logDate = currentViewDate || getLocalISOString();
    const now = Date.now();
    setWaterLogs(prev => [{
      id: now,
      date: logDate,
      type: 'water',
      beverageName: '飲水',
      amount: amount,
      isManual: true
    }, ...prev]);
    setStatusMessage({ type: 'success', text: `已新增 ${amount}ml 飲水！` });
  };

  const today = getLocalISOString();
  const latestWeightLog = useMemo(() => sortByDateAndIdDesc(weightLogs)[0], [weightLogs]);
  const dailyFood = useMemo(() => foodLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.calories || 0), pro: acc.pro + (c.protein || 0), carbs: acc.carbs + (c.carbs || 0), fat: acc.fat + (c.fat || 0) }), { cal: 0, pro: 0, carbs: 0, fat: 0 }), [foodLogs, currentViewDate]);
  const dailyAct = useMemo(() => activityLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.activeCalories || 0) }), { cal: 0 }), [activityLogs, currentViewDate]);
  const dailyRes = useMemo(() => resistanceLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.totalCalories || 0) }), { cal: 0 }), [resistanceLogs, currentViewDate]);
  const dailyWater = useMemo(() => waterLogs.filter(l => l.date === currentViewDate).reduce((s, i) => s + (i.amount || 0), 0), [waterLogs, currentViewDate]);
  const remaining = useMemo(() => dailyTarget - dailyFood.cal + dailyAct.cal + dailyRes.cal, [dailyTarget, dailyFood.cal, dailyAct.cal, dailyRes.cal]);
  const currentWeight = latestWeightLog?.weight || CONFIG.START_W;
  const bmi = (currentWeight / ((CONFIG.HEIGHT / 100) ** 2)).toFixed(1);
  const dataHealthIssues = useMemo(() => getDataHealthIssues({
    weightLogs,
    foodLogs,
    activityLogs,
    waterLogs,
    resistanceLogs
  }), [weightLogs, foodLogs, activityLogs, waterLogs, resistanceLogs]);

  // Separate lists for each category, sorted by ID descending (newest first)
  const dailyFoodList = useMemo(() => {
    return foodLogs
      .filter(l => l.date === currentViewDate && !l.isHidden)
      .sort((a, b) => {
        // Ensure proper numeric comparison for IDs (handle legacy string IDs)
        const idA = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
        const idB = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
        return idB - idA;
      });
  }, [foodLogs, currentViewDate]);

  const dailyWaterList = useMemo(() => {
    return waterLogs
      .filter(l => l.date === currentViewDate)
      .sort((a, b) => {
        const idA = typeof a.id === 'number' ? a.id : Number(a.id) || 0;
        const idB = typeof b.id === 'number' ? b.id : Number(b.id) || 0;
        return idB - idA;
      });
  }, [waterLogs, currentViewDate]);

  const dailyActivityList = useMemo(() => {
    const activities = activityLogs
      .filter(l => l.date === currentViewDate && !l.isHidden)
      .map(l => ({ ...l, _source: 'activity' as const }));

    // Add consolidated resistance log if exists
    const todayResLogs = resistanceLogs.filter(l => l.date === currentViewDate);
    const resTotal = todayResLogs.reduce((acc, l) => acc + l.totalCalories, 0);
    const latestResId = todayResLogs.length > 0 ? Math.max(...todayResLogs.map(l => l.id)) : 0;
    const resItem = resTotal > 0 ? [{
      id: latestResId,
      date: currentViewDate,
      type: 'activity' as const,
      activityName: '阻力運動 (總計)',
      activeCalories: resTotal,
      isManual: false,
      _source: 'resistance' as const
    }] : [];

    return [...activities, ...resItem].sort((a, b) => b.id - a.id);
  }, [activityLogs, resistanceLogs, currentViewDate]);

  const pastDates = useMemo(() => {
    const allDates = new Set([
      ...(foodLogs || []).map(l => l.date),
      ...(activityLogs || []).map(l => l.date),
      ...(resistanceLogs || []).map(l => l.date)
    ]);
    const sorted = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sorted.filter(d => d !== today).slice(0, 7);
  }, [foodLogs, activityLogs, resistanceLogs, today]);

  const thirtyDayBalance = useMemo(() => {
    let totalBalance = 0;
    pastDates.forEach(date => {
      const a = activityLogs.filter(l => l.date === date).reduce((s, x) => s + (x.activeCalories || 0), 0);
      const r = resistanceLogs.filter(l => l.date === date).reduce((s, x) => s + (x.totalCalories || 0), 0);
      if (a > 0 || r > 0) {
        const f = foodLogs.filter(l => l.date === date).reduce((s, x) => s + (x.calories || 0), 0);
        totalBalance += ((a + r + dailyTarget) - f);
      }
    });
    return totalBalance;
  }, [foodLogs, activityLogs, resistanceLogs, dailyTarget, pastDates]);

  const trendData = useMemo((): ChartData[] => {
    const arr: ChartData[] = [];
    for (let i = trendRange - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = getLocalISOString(d);
      const disp = `${d.getMonth() + 1}/${d.getDate()}`;
      const f = foodLogs.filter(l => l.date === ds).reduce((s, item) => s + (item.calories || 0), 0);
      const a = activityLogs.filter(l => l.date === ds).reduce((s, item) => s + (item.activeCalories || 0), 0);
      arr.push({ date: ds, disp: disp, in: f, out: a });
    }
    return arr;
  }, [foodLogs, activityLogs, trendRange]);

  const weightData = useMemo((): ChartData[] => {
    const points: ChartData[] = [];
    const daysToShow = weightRange;
    const startD = new Date(); startD.setDate(startD.getDate() - daysToShow + 1);
    const map: Record<string, number> = {};
    const fatMap: Record<string, number> = {};
    weightLogs.forEach(l => { map[l.date] = l.weight; if (l.bodyFat) fatMap[l.date] = l.bodyFat; });
    const pStart = weightLogs.length ? new Date(Math.min(...weightLogs.map(l => new Date(l.date).getTime()))) : new Date();
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startD); d.setDate(d.getDate() + i);
      const ds = getLocalISOString(d);
      const disp = `${d.getMonth() + 1}/${d.getDate()}`;
      const diff = Math.round((d.getTime() - pStart.getTime()) / (86400000));
      let ideal = CONFIG.START_W - ((CONFIG.START_W - CONFIG.TARGET_W) / 365 * diff);
      if (ideal < CONFIG.TARGET_W) ideal = CONFIG.TARGET_W;
      points.push({ date: ds, disp: disp, ideal: parseFloat(ideal.toFixed(1)), weight: map[ds], bodyFat: fatMap[ds] });
    }
    return points;
  }, [weightLogs, weightRange]);

  const rangeQueryResults = useMemo((): RangeQueryResults | null => {
    if (!historyStartDate || !historyEndDate) return null;
    const start = new Date(historyStartDate);
    const end = new Date(historyEndDate);
    let totalIn = 0, totalOut = 0, validDays = 0, totalDaysInRange = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      totalDaysInRange++;
      const dateStr = getLocalISOString(d);
      const dailyActivityBurn = (activityLogs || []).filter(l => l.date === dateStr).reduce((s, x) => s + (x.activeCalories || 0), 0);
      const dailyResistanceBurn = (resistanceLogs || []).filter(l => l.date === dateStr).reduce((s, x) => s + (x.totalCalories || 0), 0);
      const dailyBurn = dailyActivityBurn + dailyResistanceBurn;
      if (dailyBurn > 0) {
        validDays++;
        const dailyIntake = (foodLogs || []).filter(l => l.date === dateStr).reduce((s, x) => s + (x.calories || 0), 0);
        totalIn += dailyIntake; totalOut += dailyBurn;
      }
    }
    const totalBase = dailyTarget * validDays;
    const netBalance = (totalOut + totalBase) - totalIn;
    return { totalIn, totalOut, netBalance, validDays, totalDaysInRange };
  }, [historyStartDate, historyEndDate, foodLogs, activityLogs, resistanceLogs, dailyTarget]);

  const currentWeightRecord = weightLogs.find(l => l.date === weightHistoryDate);

  const handleTrainingExport = () => {
    if (!historyStartDate || !historyEndDate) {
      setStatusMessage({ type: 'error', text: '請先選擇訓練資料的起訖日期' });
      return;
    }
    if (historyStartDate > historyEndDate) {
      setStatusMessage({ type: 'error', text: '開始日期不可晚於結束日期' });
      return;
    }

    const trainingExport = buildTrainingExport({
      startDate: historyStartDate,
      endDate: historyEndDate,
      weightLogs,
      activityLogs,
      resistanceLogs
    });

    const filename = `PeterPlan_Training_${historyStartDate}_to_${historyEndDate}.json`;
    downloadJsonFile(filename, trainingExport);
    setStatusMessage({ type: 'success', text: '訓練分析資料已匯出' });
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-neutral-400 bg-black">Loading...</div>;
  const hasAnyKey = apiKeys.free1 || apiKeys.free2 || apiKeys.free3 || apiKeys.free4 || apiKeys.free5 || apiKeys.paid;
  const isViewingHistory = currentViewDate !== today;
  const editingFood = editingFoodPortion ? foodLogs.find(food => food.id === editingFoodPortion.id) : undefined;
  const editingFoodBase = editingFood ? getFoodBaseValues(editingFood) : null;

  return (
    <div className="pb-32 max-w-md mx-auto min-h-screen relative bg-black">
      {/* Status Message Overlay */}
      {statusMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg text-white text-sm font-bold flex items-center gap-2 animate-fadeIn ${statusMessage.type === 'success' ? 'bg-teal-600' : 'bg-red-600'}`}>
          {statusMessage.type === 'success' ? <Icons.Check className="w-4 h-4" /> : <Icons.AlertCircle className="w-4 h-4" />}
          {statusMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-neutral-900 z-50 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex justify-between items-center shadow-md border-b border-neutral-800">
        <h1 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Icons.Activity /> Health Plan <span className="text-xs text-neutral-500 font-normal mt-1">{APP_DISPLAY_VERSION}</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className={`flex flex-col items-center hover:text-teal-400 ${hasAnyKey ? 'text-teal-400' : 'text-neutral-500'}`}><Icons.Settings /><span className="text-[10px] font-bold">SETTING</span></button>
          <button onClick={() => setShowDataHealth(true)} className={`flex flex-col items-center hover:text-teal-400 ${dataHealthIssues.length > 0 ? 'text-amber-400' : 'text-neutral-500'}`}><Icons.ScanEye /><span className="text-[10px] font-bold">CHECK</span></button>
          <button onClick={handleTrainingExport} className="flex flex-col items-center text-teal-400 hover:text-teal-300"><Icons.Dumbbell className="w-5 h-5" /><span className="text-[10px] font-bold">TRAIN</span></button>
          <button onClick={handleExport} className="flex flex-col items-center text-neutral-500 hover:text-teal-400"><Icons.Download /><span className="text-[10px] font-bold">BACKUP</span></button>
          <div className="relative flex flex-col items-center text-neutral-500 hover:text-teal-400 cursor-pointer"><Icons.Upload /><span className="text-[10px] font-bold">RESTORE</span><input type="file" ref={importInputRef} onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" /></div>
        </div>
      </div>

      <DataHealthPanel
        showDataHealth={showDataHealth}
        setShowDataHealth={setShowDataHealth}
        issues={dataHealthIssues}
      />

      {/* Settings Panel */}
      <SettingsPanel
        showSettings={showSettings}
        hasAnyKey={hasAnyKey}
        dailyTarget={dailyTarget}
        setDailyTarget={setDailyTarget}
        activityTarget={activityTarget}
        setActivityTarget={setActivityTarget}
        waterTarget={waterTarget}
        setWaterTarget={setWaterTarget}
        apiKeys={apiKeys}
        setApiKeys={setApiKeys}
        saveSettings={saveSettings}
      />

      {/* Target Modal */}
      <TargetModal
        targetModal={targetModal}
        setTargetModal={setTargetModal}
        tempTargetValue={tempTargetValue}
        setTempTargetValue={setTempTargetValue}
        saveTargetModal={saveTargetModal}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        executeDelete={executeDelete}
      />

      {editingFood && editingFoodPortion && editingFoodBase && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-bold text-teal-400 mb-1">調整食用份量</div>
                <h3 className="text-lg font-bold text-white leading-snug">{editingFood.foodName}</h3>
              </div>
              <button onClick={() => setEditingFoodPortion(null)} className="text-neutral-500 hover:text-white p-2">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-neutral-300">份量</span>
                <span className="text-2xl font-black text-teal-400">{editingFoodPortion.portion.toFixed(1)} 份</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={editingFoodPortion.portion}
                onChange={e => updateEditingFoodPortion(parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>0.1</span>
                <span>1.0</span>
                <span>3.0</span>
              </div>
            </div>
            <div className="grid grid-cols-4 text-center bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden mb-4">
              <div className="p-3 border-r border-neutral-800"><div className="text-xs text-neutral-500">熱量</div><div className="font-bold text-orange-400">{Math.round(editingFoodBase.calories * editingFoodPortion.portion)}</div></div>
              <div className="p-3 border-r border-neutral-800"><div className="text-xs text-neutral-500">蛋白</div><div className="font-bold text-blue-400">{Math.round(editingFoodBase.protein * editingFoodPortion.portion)}g</div></div>
              <div className="p-3 border-r border-neutral-800"><div className="text-xs text-neutral-500">碳水</div><div className="font-bold text-yellow-400">{Math.round(editingFoodBase.carbs * editingFoodPortion.portion)}g</div></div>
              <div className="p-3"><div className="text-xs text-neutral-500">脂肪</div><div className="font-bold text-green-400">{Math.round(editingFoodBase.fat * editingFoodPortion.portion)}g</div></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingFoodPortion(null)} className="flex-1 py-4 border border-neutral-700 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800">取消</button>
              <button onClick={saveEditingFoodPortion} className="flex-1 py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 flex items-center justify-center gap-2">
                <Icons.Save className="w-5 h-5" /> 儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Water Modal */}
      <QuickWaterModal
        isOpen={showQuickWaterModal}
        onClose={() => setShowQuickWaterModal(false)}
        onConfirm={confirmQuickWater}
      />

      {/* Tab Navigation */}
      <div className="flex bg-neutral-900 border-b border-neutral-800 sticky top-[calc(55px+env(safe-area-inset-top))] z-40 shadow-sm">
        <button onClick={() => setActiveTab('daily')} className={`flex-1 py-4 text-base font-medium flex justify-center gap-2 ${activeTab === 'daily' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-neutral-500'}`}><Icons.Zap /> 今日儀表板</button>
        <button onClick={() => setActiveTab('weight')} className={`flex-1 py-4 text-base font-medium flex justify-center gap-2 ${activeTab === 'weight' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-neutral-500'}`}><Icons.TrendingDown /> 體重與劑量</button>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'daily' && (
          <>
            {isViewingHistory && (
              <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded-xl flex justify-between items-center relative mb-6">
                <span className="text-yellow-400 text-sm font-bold flex items-center gap-2"><Icons.History className="w-4 h-4" /> 正在檢視歷史紀錄：{currentViewDate}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentViewDate(today)} className="bg-neutral-800 text-neutral-400 hover:text-white p-1.5 rounded-lg"><Icons.X className="w-4 h-4" /></button>
                  <button onClick={() => setCurrentViewDate(today)} className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold">回到今日</button>
                </div>
              </div>
            )}

            {/* Dashboard Card */}
            <DashboardCard
              remaining={remaining}
              dailyTarget={dailyTarget}
              dailyFood={dailyFood}
              dailyAct={dailyAct}
              dailyRes={dailyRes}
              dailyWater={dailyWater}
              waterTarget={waterTarget}
              openTargetModal={openTargetModal}
              setInputModalType={setInputModalType}
              onQuickAddWater={handleQuickAddWater}
            />

            {/* Action Buttons */}
            <ActionButtons setInputModalType={setInputModalType} />

            {/* Input Modal */}
            <InputModal
              inputModalType={inputModalType}
              setInputModalType={setInputModalType}
              inputMethod={inputMethod}
              setInputMethod={setInputMethod}
              selectedImage={selectedImage}
              imagePreview={imagePreview}
              imageNotes={imageNotes}
              setImageNotes={setImageNotes}
              manualText={manualText}
              setManualText={setManualText}
              isAnalyzing={isAnalyzing}
              analysisStatus={analysisStatus}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              setSelectedImage={setSelectedImage}
              setImagePreview={setImagePreview}
              executeAnalysis={executeAnalysis}
              manualForm={manualForm}
              setManualForm={setManualForm}
              addToFavorites={addToFavorites}
              setAddToFavorites={setAddToFavorites}
              saveLog={saveLog}
              favoriteFoods={favoriteFoods}
              favoriteWaterContainers={favoriteWaterContainers}
              selectFavorite={selectFavorite}
              deleteFavorite={deleteFavorite}
              reorderFavoriteFoods={reorderFavoriteFoods}
              reorderFavoriteWaterContainers={reorderFavoriteWaterContainers}
              resistanceDefs={resistanceDefs}
              resistanceSession={resistanceSession}
              resistanceLogs={resistanceLogs}
              newDefName={newDefName}
              setNewDefName={setNewDefName}
              handleAddResistanceDef={handleAddResistanceDef}
              handleDeleteResistanceDef={handleDeleteResistanceDef}
              reorderResistanceDefs={reorderResistanceDefs}
              toggleResistanceItem={toggleResistanceItem}
              updateResistanceItem={updateResistanceItem}
              calculateAndSaveResistance={calculateAndSaveResistance}
              setConfirmModal={setConfirmModal}
              currentViewDate={currentViewDate}
              getLocalISOString={getLocalISOString}
            />
            {/* Analyzing Indicator */}
            {isAnalyzing && (
              <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-center text-teal-400 text-base font-bold animate-pulse flex flex-col items-center justify-center gap-3 shadow-md">
                <Icons.Loader2 className="animate-spin w-8 h-8" /> <span>{analysisStatus || "AI 正在分析中..."}</span>
              </div>
            )}

            {/* Analysis Result Modal */}
            {/* Analysis Result */}
            <div ref={analysisResultRef}>
              <AnalysisResult
                analyzedFood={analyzedFood}
                analyzedActivity={analyzedActivity}
                analyzedWater={analyzedWater}
                setAnalyzedFood={setAnalyzedFood}
                setAnalyzedActivity={setAnalyzedActivity}
                setAnalyzedWater={setAnalyzedWater}
                portion={portion}
                setPortion={setPortion}
                addToFavorites={addToFavorites}
                setAddToFavorites={setAddToFavorites}
                saveLog={saveLog}
              />
            </div>
            {/* Daily List */}
            <DailyList foodList={dailyFoodList} waterList={dailyWaterList} activityList={dailyActivityList} setConfirmModal={setConfirmModal} onEditFoodPortion={openFoodPortionEditor} />

            {/* Trend Chart */}
            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-5 mt-8">
              <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                <h2 className="font-bold text-neutral-300 text-base flex items-center gap-2"><Icons.TrendingUp /> 熱量趨勢</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTargetModal('activity')} className="text-xs font-bold text-teal-400 bg-teal-900/30 px-2 py-1.5 rounded-lg border border-teal-800 flex items-center gap-1 hover:bg-teal-900/50 transition-colors">
                    運動目標: {activityTarget} <Icons.Edit className="w-3 h-3" />
                  </button>
                  <select value={trendRange} onChange={(e) => setTrendRange(Number(e.target.value))} className="text-sm bg-neutral-800 border-none rounded-lg pl-3 pr-8 py-1.5 text-neutral-300 font-bold outline-none cursor-pointer"><option value={7}>7天</option><option value={14}>14天</option><option value={30}>30天</option><option value={90}>3個月</option><option value={180}>半年</option><option value={365}>一年</option></select>
                </div>
              </div>
              <TrendChart data={trendData} budget={dailyTarget} activityTarget={activityTarget} />
            </div>

            {/* Past Dates */}
            {pastDates.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3 px-1"><h3 className="font-bold text-neutral-400 text-sm flex items-center gap-2"><Icons.History className="w-4 h-4" /> 過去的記錄 (最近7天)</h3><div className={`text-xs font-bold px-2 py-1 rounded ${thirtyDayBalance >= 0 ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}>總累積: {thirtyDayBalance > 0 ? '+' : ''}{thirtyDayBalance} KCAL</div></div>
                <div className="space-y-2">
                  {pastDates.map(date => {
                    const f = foodLogs.filter(l => l.date === date).reduce((s, i) => s + (i.calories || 0), 0);
                    const a = activityLogs.filter(l => l.date === date).reduce((s, i) => s + (i.activeCalories || 0), 0);
                    const r = resistanceLogs.filter(l => l.date === date).reduce((s, i) => s + (i.totalCalories || 0), 0);
                    const totalBurn = a + r;
                    const net = (totalBurn + dailyTarget) - f;
                    const hasResistance = r > 0 || resistanceLogs.some(l => l.date === date);
                    const hasRunning = activityLogs.some(l => l.date === date && ['每日消耗（含運動）', '跑步機額外'].includes(l.activityName || ''));
                    return (
                      <button key={date} onClick={() => setCurrentViewDate(date)} className="w-full bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center hover:bg-neutral-800 transition-colors">
                        <div className="flex items-center gap-2 w-28">
                          <div className="font-bold text-neutral-300 text-left whitespace-nowrap">{date}</div>
                          {hasResistance && <div className="text-teal-400 bg-teal-900/30 p-1 rounded-md" title="已完成阻力運動"><Icons.Dumbbell className="w-3.5 h-3.5" /></div>}
                          {hasRunning && <div className="text-blue-400 bg-blue-900/30 p-1 rounded-md" title="已完成跑步"><Icons.Running className="w-3.5 h-3.5" /></div>}
                        </div>
                        <div className="flex gap-2 text-xs font-bold flex-1 justify-end items-center"><span className="text-orange-500 whitespace-nowrap">攝 {f}</span><span className="text-teal-500 whitespace-nowrap">消 {totalBurn} <span className="text-[10px] opacity-80">({totalBurn + dailyTarget})</span></span><span className={`${net >= 0 ? 'text-green-500' : 'text-red-500'} ml-1 whitespace-nowrap`}>{net > 0 ? '+' : ''}{net}</span></div>
                        <Icons.ArrowLeft className="w-4 h-4 text-neutral-600 rotate-180 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History Query */}
            <div className="mt-8 pb-8">
              <div className="flex items-center justify-between mb-3 pl-1 gap-3">
                <h3 className="font-bold text-neutral-400 text-sm flex items-center gap-2"><Icons.Calendar className="w-4 h-4" /> 歷史查詢</h3>
                <button onClick={handleTrainingExport} className="text-xs font-bold text-teal-300 bg-teal-900/30 px-3 py-2 rounded-lg border border-teal-800 flex items-center gap-1 hover:bg-teal-900/50 transition-colors">
                  <Icons.Download className="w-3.5 h-3.5" /> 匯出訓練資料
                </button>
              </div>
              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 overflow-hidden w-full box-border">
                <button onClick={handleTrainingExport} className="w-full mb-4 bg-teal-600 text-white rounded-xl py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all hover:bg-teal-500">
                  <Icons.Dumbbell className="w-4 h-4" /> 匯出這段期間的訓練與身體資料
                </button>
                <p className="text-[11px] text-neutral-500 mb-4 leading-relaxed">
                  會依下方日期範圍匯出體重、體脂、肌肉、內臟脂肪、一般運動、阻力訓練與每日摘要，方便交給 AI 分析。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 w-full">
                  <div className="w-full relative"><span className="absolute top-[-8px] left-2 text-[10px] text-neutral-500 bg-neutral-900 px-1 z-20">開始日期</span><div className="relative w-full"><input type="date" value={historyStartDate} onChange={(e) => setHistoryStartDate(e.target.value)} className="w-full min-w-0 bg-transparent text-white border border-neutral-700 rounded-lg p-3 text-sm font-bold outline-none focus:border-teal-500 pr-10 box-border" /><Icons.Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-white w-4 h-4 pointer-events-none" /></div></div>
                  <div className="w-full relative"><span className="absolute top-[-8px] left-2 text-[10px] text-neutral-500 bg-neutral-900 px-1 z-20">結束日期</span><div className="relative w-full"><input type="date" value={historyEndDate} onChange={(e) => setHistoryEndDate(e.target.value)} className="w-full min-w-0 bg-transparent text-white border border-neutral-700 rounded-lg p-3 text-sm font-bold outline-none focus:border-teal-500 pr-10 box-border" /><Icons.Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-white w-4 h-4 pointer-events-none" /></div></div>
                </div>
                {rangeQueryResults && (
                  <div className="pt-2 border-t border-neutral-800 animate-fadeIn">
                    <div className="flex justify-between items-end mb-2"><span className="text-xs text-neutral-500 font-bold">區間總結餘 ({rangeQueryResults.validDays}/{rangeQueryResults.totalDaysInRange}天)</span><span className={`text-xl font-extrabold ${rangeQueryResults.netBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{rangeQueryResults.netBalance > 0 ? '+' : ''}{rangeQueryResults.netBalance} KCAL</span></div>
                    <div className="flex gap-4 text-xs font-bold bg-neutral-800/50 p-2 rounded-lg"><span className="text-orange-500">總攝取: {rangeQueryResults.totalIn}</span><span className="text-teal-500">總消耗: {rangeQueryResults.totalOut}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Coach */}
            <CoachSection
              coachAdvice={coachAdvice}
              setCoachAdvice={setCoachAdvice}
              isCoachThinking={isCoachThinking}
              coachStatus={coachStatus}
              handleAskCoach={handleAskCoach}
            />
          </>
        )}

        {activeTab === 'weight' && (
          <>
            <WeightStats currentWeight={currentWeight} bmi={bmi} />
            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-neutral-300 text-base">體重與體脂追蹤</h2>
                <select value={weightRange} onChange={(e) => setWeightRange(Number(e.target.value))} className="text-sm bg-neutral-800 border-none rounded-lg pl-3 pr-10 py-2 text-neutral-300 font-bold outline-none cursor-pointer">
                  <option value={7}>7天</option>
                  <option value={14}>14天</option>
                  <option value={30}>30天</option>
                  <option value={90}>3個月</option>
                  <option value={180}>半年</option>
                  <option value={365}>一年</option>
                </select>
              </div>
              <WeightChart data={weightData} targetWeight={CONFIG.TARGET_W} />
            </div>
            <WeightForm
              inputDate={inputDate}
              setInputDate={setInputDate}
              inputWeight={inputWeight}
              setInputWeight={setInputWeight}
              inputBodyFat={inputBodyFat}
              setInputBodyFat={setInputBodyFat}
              inputMuscle={inputMuscle}
              setInputMuscle={setInputMuscle}
              inputVisceral={inputVisceral}
              setInputVisceral={setInputVisceral}
              inputDose={inputDose}
              setInputDose={setInputDose}
              inputNotes={inputNotes}
              setInputNotes={setInputNotes}
              handleWeightSubmit={handleWeightSubmit}
            />
            <WeightList weightLogs={weightLogs} setConfirmModal={setConfirmModal} />
            <WeightHistory
              weightHistoryDate={weightHistoryDate}
              setWeightHistoryDate={setWeightHistoryDate}
              currentWeightRecord={currentWeightRecord}
              showWeightHistory={showWeightHistory}
              setShowWeightHistory={setShowWeightHistory}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
