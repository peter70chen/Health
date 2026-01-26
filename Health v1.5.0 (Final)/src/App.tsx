import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './components/Icons';
import { TrendChart } from './components/charts/TrendChart';
import { WeightChart } from './components/charts/WeightChart';
import { InputModal, SettingsPanel, ConfirmModal, TargetModal, AnalysisResult } from './components/modals';
import { DashboardCard, ActionButtons, DailyList, CoachSection, WeightStats, WeightForm, WeightList, WeightHistory } from './components/tabs';
import { callGeminiWithFallback } from './services/gemini';
import { PROMPTS } from './lib/prompts';
import { CONFIG, STORAGE_KEYS } from './lib/config';
import { getLocalISOString, safeLoadFromStorage } from './lib/utils';
import type {
  ApiKeys, WeightLog, FoodLog, ActivityLog, WaterLog, ChartData,
  AnalyzedFood, AnalyzedActivity, AnalyzedWater,
  FavoriteFood, FavoriteWaterContainer, ManualFormState,
  ConfirmModalState, TargetModalState, RangeQueryResults,
  ResistanceDef, ResistanceLog, ResistanceItem
} from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weight'>('daily');
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ free1: '', free2: '', free3: '', free4: '', free5: '', paid: '' });
  const [showSettings, setShowSettings] = useState(false);
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

  const [analysisStatus, setAnalysisStatus] = useState("");
  const [coachStatus, setCoachStatus] = useState("");

  const [currentViewDate, setCurrentViewDate] = useState(getLocalISOString());
  const [weightHistoryDate, setWeightHistoryDate] = useState(getLocalISOString());
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  const [historyStartDate, setHistoryStartDate] = useState(getLocalISOString());
  const [historyEndDate, setHistoryEndDate] = useState(getLocalISOString());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Clear status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);
  // Helper to sort by ID descending (newest first)
  const sortByIdDesc = <T extends { id: number }>(arr: T[]): T[] =>
    [...arr].sort((a, b) => (b.id || 0) - (a.id || 0));

  // Load data from localStorage
  useEffect(() => {
    setWeightLogs(sortByIdDesc(safeLoadFromStorage(STORAGE_KEYS.WEIGHT_LOGS, [])));
    setFoodLogs(sortByIdDesc(safeLoadFromStorage(STORAGE_KEYS.FOOD_LOGS, [])));
    setActivityLogs(sortByIdDesc(safeLoadFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, [])));
    setFavoriteFoods(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_FOODS, []));
    setWaterLogs(sortByIdDesc(safeLoadFromStorage(STORAGE_KEYS.WATER_LOGS, [])));
    setFavoriteWaterContainers(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_WATER_CONTAINERS, []));
    setResistanceDefs(safeLoadFromStorage(STORAGE_KEYS.RESISTANCE_DEFS, []));
    setResistanceLogs(sortByIdDesc(safeLoadFromStorage(STORAGE_KEYS.RESISTANCE_LOGS, [])));

    const ca = localStorage.getItem(STORAGE_KEYS.COACH_ADVICE);
    const dt = localStorage.getItem(STORAGE_KEYS.DAILY_TARGET);
    const at = localStorage.getItem(STORAGE_KEYS.ACTIVITY_TARGET);
    const wt = localStorage.getItem(STORAGE_KEYS.WATER_TARGET);
    const k = localStorage.getItem(STORAGE_KEYS.API_KEYS);

    if (ca) setCoachAdvice(ca);
    if (dt) setDailyTarget(Number(dt));
    if (at) setActivityTarget(Number(at));
    if (wt) setWaterTarget(Number(wt));
    if (k) { try { setApiKeys(JSON.parse(k)); } catch { } }
    setLoading(false);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(weightLogs));
      localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(foodLogs));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
      localStorage.setItem(STORAGE_KEYS.FAVORITE_FOODS, JSON.stringify(favoriteFoods));
      localStorage.setItem(STORAGE_KEYS.WATER_LOGS, JSON.stringify(waterLogs));
      localStorage.setItem(STORAGE_KEYS.FAVORITE_WATER_CONTAINERS, JSON.stringify(favoriteWaterContainers));
      localStorage.setItem(STORAGE_KEYS.COACH_ADVICE, coachAdvice);
      localStorage.setItem(STORAGE_KEYS.DAILY_TARGET, dailyTarget.toString());
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_TARGET, activityTarget.toString());
      localStorage.setItem(STORAGE_KEYS.WATER_TARGET, waterTarget.toString());
      localStorage.setItem(STORAGE_KEYS.RESISTANCE_DEFS, JSON.stringify(resistanceDefs));
      localStorage.setItem(STORAGE_KEYS.RESISTANCE_LOGS, JSON.stringify(resistanceLogs));
    }
  }, [weightLogs, foodLogs, activityLogs, favoriteFoods, waterLogs, favoriteWaterContainers, coachAdvice, dailyTarget, activityTarget, waterTarget, resistanceDefs, resistanceLogs, loading]);

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

  const handleExport = async () => {
    const data = JSON.stringify({ weightLogs, foodLogs, activityLogs, favoriteFoods, waterLogs, favoriteWaterContainers, coachAdvice, dailyTarget, activityTarget, waterTarget, resistanceDefs, resistanceLogs }, null, 2);
    const filename = `PeterPlan_Backup_${getLocalISOString()}.json`;

    // Try File System Access API first (Desktop Chrome/Edge/Opera)
    try {
      if ('showSaveFilePicker' in window) {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'JSON Backup File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        // @ts-ignore
        const writable = await handle.createWritable();
        // @ts-ignore
        await writable.write(data);
        // @ts-ignore
        await writable.close();
        setStatusMessage({ type: 'success', text: "備份成功！" });
        return;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User cancelled
      console.error('File Picker failed, falling back:', err);
    }

    const file = new File([data], filename, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Peter健康計劃備份' }); return; } catch { }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: "備份已下載" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) {

      return;
    }



    const r = new FileReader();
    r.onload = (ev) => {

      try {
        const rawData = ev.target?.result as string;
        const d = JSON.parse(rawData);


        // Use helper to support both new keys and legacy mj_ keys
        // If d has 'mj_weightLogs' but not 'weightLogs', this helper finds it.
        const get = (key: string) => d[key] !== undefined ? d[key] : d[`mj_${key}`];

        let importCount = 0;

        const w = get('weightLogs'); if (w) { setWeightLogs(w); importCount++; }
        const f = get('foodLogs'); if (f) { setFoodLogs(f); importCount++; }
        const a = get('activityLogs'); if (a) { setActivityLogs(a); importCount++; }
        const ff = get('favoriteFoods'); if (ff) { setFavoriteFoods(ff); importCount++; }
        const wl = get('waterLogs'); if (wl) { setWaterLogs(wl); importCount++; }
        const fwc = get('favoriteWaterContainers'); if (fwc) { setFavoriteWaterContainers(fwc); importCount++; }
        const ca = get('coachAdvice'); if (ca) { setCoachAdvice(ca); importCount++; }

        const rd = get('resistanceDefs'); if (rd) { setResistanceDefs(rd); importCount++; }
        const rl = get('resistanceLogs'); if (rl) { setResistanceLogs(rl); importCount++; }

        // Handle targets which might be numbers (0 is falsy, check undefined)
        const dt = get('dailyTarget'); if (dt !== undefined) { setDailyTarget(dt); importCount++; }
        const at = get('activityTarget'); if (at !== undefined) { setActivityTarget(at); importCount++; }
        const wt = get('waterTarget'); if (wt !== undefined) { setWaterTarget(wt); importCount++; }



        if (importCount > 0) {
          setStatusMessage({ type: 'success', text: `還原成功！已匯入 ${importCount} 類資料` });
        } else {
          setStatusMessage({ type: 'error', text: "還原失敗：未能在檔案中找到有效的資料" });
        }
      } catch (err) {
        console.error('Import parse error:', err);
        setStatusMessage({ type: 'error', text: "格式錯誤: " + (err instanceof Error ? err.message : String(err)) });
      }

      // Reset input via ref to allow re-selecting same file
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    };
    r.onerror = (err) => {
      console.error('FileReader error:', err);
      setStatusMessage({ type: 'error', text: "讀取檔案失敗" });
      if (importInputRef.current) importInputRef.current.value = '';
    };
    r.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          prompt = PROMPTS.foodText.replace('{{TEXT}}', manualText);
        } else {
          prompt = (currentType === 'food' ? PROMPTS.foodText : PROMPTS.activityText).replace('{{TEXT}}', manualText);
        }
      }
      const res = await callGeminiWithFallback(prompt, img, setAnalysisStatus, apiKeys);
      if (!res.notes) res.notes = "本次分析未產生額外建議。";
      const obj = { ...res, imagePreview: imagePreview || undefined, isText: !img };
      setPortion(1.0);
      setAnalyzedFood(null); setAnalyzedActivity(null); setAnalyzedWater(null);
      if (currentType === 'food') setAnalyzedFood(obj);
      else if (currentType === 'activity') setAnalyzedActivity(obj);
      else setAnalyzedWater(obj);
      setManualText(''); setImageNotes('');
      setInputModalType(null);
    } catch (e: any) { alert("分析失敗：\n" + (e.message || "未知錯誤")); }
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
      const startW = recentWeights.length > 0 ? recentWeights[0].weight : (weightLogs[0]?.weight || CONFIG.START_W);
      const endW = recentWeights.length > 0 ? recentWeights[recentWeights.length - 1].weight : startW;
      const currentDose = (() => {
        const hasDose = (d: string | undefined) => d !== undefined && d !== null && String(d).trim() !== '';
        const doseInRange = recentWeights.slice().reverse().find(l => hasDose(l.dose));
        if (doseInRange) return doseInRange.dose;
        const anyDose = weightLogs.find(l => hasDose(l.dose));
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
      const res = await callGeminiWithFallback(prompt, null, setCoachStatus, apiKeys);
      setCoachAdvice(res.advice || res.reply);
    } catch (e: any) { alert("發生錯誤：" + e.message); }
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
      setResistanceSession(prev => [...prev, { defId: def.id, name: def.name, weight: 0, sets: 0, reps: 0 }]);
    }
  };

  const updateResistanceItem = (defId: number, field: 'weight' | 'sets' | 'reps' | 'time', value: string) => {
    const val = parseFloat(value) || 0;
    setResistanceSession(prev => prev.map(item => item.defId === defId ? { ...item, [field]: val } : item));
  };

  const calculateAndSaveResistance = async () => {
    if (resistanceSession.length === 0) { alert("請至少勾選一個項目"); return; }
    setIsAnalyzing(true);
    setAnalysisStatus("AI 計算消耗中...");

    try {
      const currentWeight = weightLogs[0]?.weight || CONFIG.START_W;
      const itemsList = resistanceSession.map(i => {
        let s = `- ${i.name}: ${i.weight}kg, ${i.sets}組, ${i.reps}次`;
        if (i.time && i.time > 0) s += `, 每組${i.time}秒`;
        return s;
      }).join('\n');

      let prompt = PROMPTS.resistanceCalc.replace('{{weight}}', String(currentWeight)).replace('{{items}}', itemsList);

      const res = await callGeminiWithFallback(prompt, null, setAnalysisStatus, apiKeys);

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

    } catch (e: any) {
      alert("AI 計算發生錯誤: " + e.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus("");
    }
  };

  const saveLog = (type: string) => {
    const now = Date.now();
    const logDate = currentViewDate || getLocalISOString();

    if (type === 'manual') {
      if (!manualForm.name || !manualForm.val1) { alert("請填寫完整資訊"); return; }

      if (inputModalType === 'food') {
        const foodItem = { foodName: manualForm.name, calories: parseInt(manualForm.val1), protein: parseInt(manualForm.val2 || '0'), carbs: parseInt(manualForm.val3 || '0'), fat: parseInt(manualForm.val4 || '0') };
        if (addToFavorites) {
          setFavoriteFoods(prev => [{ id: now + 1, ...foodItem }, ...prev]);
        }
        setFoodLogs(p => [{ id: now, date: logDate, type: 'food', ...foodItem, isManual: true }, ...p]);
      } else if (inputModalType === 'water') {
        const linkId = now;
        const wCals = parseInt(manualForm.val2 || '0') || 0;
        const wPro = parseInt(manualForm.val3 || '0') || 0;
        const wCarbs = parseInt(manualForm.val4 || '0') || 0;
        const isCaloric = wCals > 0;

        setWaterLogs(p => [{ id: now, linkId: isCaloric ? linkId : undefined, date: logDate, type: 'water', beverageName: manualForm.name, amount: parseInt(manualForm.val1), isManual: true, isHidden: isCaloric }, ...p]);

        if (addToFavorites) {
          setFavoriteWaterContainers(prev => [{
            id: now + 1, beverageName: manualForm.name, amount: parseInt(manualForm.val1),
            calories: wCals, protein: wPro, carbs: wCarbs, fat: 0
          }, ...prev]);
        }

        if (isCaloric) {
          setFoodLogs(p => [{ id: now + 2, linkId: linkId, date: logDate, type: 'food', foodName: manualForm.name, calories: wCals, protein: wPro, carbs: wCarbs, fat: 0, amount: parseInt(manualForm.val1), portion: 1, isManual: true }, ...p]);
        }
      } else {
        setActivityLogs(p => [{ id: now, date: logDate, type: 'activity', activityName: manualForm.name, activeCalories: parseInt(manualForm.val1), exerciseMinutes: parseInt(manualForm.val2 || '0'), isManual: true }, ...p]);
      }
      setInputModalType(null);
    }
    else if (type === 'food' && analyzedFood) {
      if (addToFavorites) {
        setFavoriteFoods(prev => [{ id: now + 1, ...analyzedFood }, ...prev]);
      }
      const finalCal = Math.round(analyzedFood.calories * portion);
      const finalPro = Math.round((analyzedFood.protein || 0) * portion);
      const finalCarbs = analyzedFood.carbs ? Math.round(analyzedFood.carbs * portion) : 0;
      const finalFat = analyzedFood.fat ? Math.round(analyzedFood.fat * portion) : 0;

      setFoodLogs(p => [{ ...analyzedFood, id: now, date: logDate, type: 'food', calories: finalCal, protein: finalPro, carbs: finalCarbs, fat: finalFat, portion: portion }, ...p]);

      // Original: if (analyzedFood.amount > 0) - TypeScript requires null check
      if ((analyzedFood.amount ?? 0) > 0) {
        const waterAmt = Math.round((analyzedFood.amount ?? 0) * portion);
        setWaterLogs(p => [{ id: now + 2, date: logDate, type: 'food_water', beverageName: analyzedFood.foodName, amount: waterAmt, calories: 0, isManual: false }, ...p]);
      }
      setAnalyzedFood(null);
    }
    else if (type === 'activity' && analyzedActivity) {
      setActivityLogs(p => [{ ...analyzedActivity, id: now, date: logDate, type: 'activity' }, ...p]);
      setAnalyzedActivity(null);
    }
    else if (type === 'water' && analyzedWater) {
      if (addToFavorites) {
        // Cast to FavoriteWaterContainer to match original behavior (original had no type checking)
        setFavoriteWaterContainers(prev => [{ id: now + 1, beverageName: analyzedWater.beverageName || '', amount: analyzedWater.amount, calories: analyzedWater.calories, protein: analyzedWater.protein, carbs: analyzedWater.carbs, fat: analyzedWater.fat }, ...prev]);
      }
      const finalAmount = Math.round((analyzedWater.amount || 0) * portion);
      // Original: const isCaloric = analyzedWater.calories > 0 (without null check, would error if undefined)
      // Using same logic but with fallback to maintain equivalent behavior
      const isCaloric = (analyzedWater.calories ?? 0) > 0;
      const linkId = isCaloric ? now : undefined;

      setWaterLogs(p => [{ ...analyzedWater, id: now, linkId: linkId, date: logDate, type: 'water', amount: finalAmount, isHidden: isCaloric }, ...p]);

      if (isCaloric) {
        const finalCal = Math.round((analyzedWater.calories || 0) * portion);
        const finalPro = Math.round((analyzedWater.protein || 0) * portion);
        const finalCarbs = Math.round((analyzedWater.carbs || 0) * portion);
        const finalFat = Math.round((analyzedWater.fat || 0) * portion);
        setFoodLogs(p => [{ id: now + 2, linkId: linkId, date: logDate, type: 'food', foodName: analyzedWater.beverageName || '', calories: finalCal, protein: finalPro, carbs: finalCarbs, fat: finalFat, portion: portion, isManual: true, amount: finalAmount }, ...p]);
      }
      setAnalyzedWater(null);
    }
    setAddToFavorites(false);
  };

  const deleteFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputModalType === 'water') {
      if (confirm("確定刪除此常用容器？")) {
        setFavoriteWaterContainers(prev => prev.filter(f => f.id !== id));
      }
    } else {
      if (confirm("確定刪除此常用食物？")) {
        setFavoriteFoods(prev => prev.filter(f => f.id !== id));
      }
    }
  };

  const selectFavorite = (item: any) => {
    if (inputModalType === 'water') setAnalyzedWater({ ...item, imagePreview: undefined });
    else setAnalyzedFood({ ...item, imagePreview: undefined });
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
    if (!inputWeight) return;
    const newLog: WeightLog = {
      id: Date.now(), date: inputDate, weight: parseFloat(inputWeight),
      bodyFat: inputBodyFat ? parseFloat(inputBodyFat) : undefined,
      muscle: inputMuscle ? parseFloat(inputMuscle) : undefined,
      visceral: inputVisceral ? parseFloat(inputVisceral) : undefined,
      dose: inputDose, notes: inputNotes
    };
    setWeightLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setInputWeight(''); setInputBodyFat(''); setInputMuscle(''); setInputVisceral(''); setInputNotes('');
    alert("已儲存");
  };

  const executeDelete = () => {
    if (!confirmModal) return;
    const { id, type } = confirmModal;
    let linkId: number | undefined = undefined;
    if (type === 'food') { const item = foodLogs.find(i => i.id === id); if (item) linkId = item.linkId; }
    else if (type === 'water') { const item = waterLogs.find(i => i.id === id); if (item) linkId = item.linkId; }

    const shouldDelete = (item: any) => item.id === id || (linkId && item.linkId === linkId);

    if (type === 'weight') setWeightLogs(prev => prev.filter(item => item.id !== id));
    else if (type === 'resistanceDef') {
      setResistanceDefs(prev => prev.filter(d => d.id !== id));
      setResistanceSession(prev => prev.filter(i => i.defId !== id));
    }
    else if (type === 'resistanceLog') {
      setResistanceLogs(prev => prev.filter(l => l.id !== id));
    }
    else {
      setWaterLogs(prev => prev.filter(item => !shouldDelete(item)));
      setFoodLogs(prev => prev.filter(item => !shouldDelete(item)));
      setActivityLogs(prev => prev.filter(item => !shouldDelete(item)));
    }
    setConfirmModal(null);
  };

  const today = getLocalISOString();
  const dailyFood = foodLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.calories || 0), pro: acc.pro + (c.protein || 0), carbs: acc.carbs + (c.carbs || 0), fat: acc.fat + (c.fat || 0) }), { cal: 0, pro: 0, carbs: 0, fat: 0 });
  const dailyAct = activityLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.activeCalories || 0) }), { cal: 0 });
  const dailyRes = resistanceLogs.filter(l => l.date === currentViewDate).reduce((acc, c) => ({ cal: acc.cal + (c.totalCalories || 0) }), { cal: 0 });
  const dailyWater = waterLogs.filter(l => l.date === currentViewDate).reduce((s, i) => s + (i.amount || 0), 0);
  const remaining = dailyTarget - dailyFood.cal + dailyAct.cal + dailyRes.cal;
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : CONFIG.START_W;
  const bmi = (currentWeight / ((CONFIG.HEIGHT / 100) ** 2)).toFixed(1);

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
    // Include both regular water logs AND food_water logs (water from food items)
    // Don't filter by isHidden for water display - we want to show all water intake
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
      _source: 'activity' as const
    }] : [];

    return [...activities, ...resItem].sort((a, b) => b.id - a.id);
  }, [activityLogs, resistanceLogs, currentViewDate]);

  const pastDates = useMemo(() => {
    const allDates = new Set([...(foodLogs || []).map(l => l.date), ...(activityLogs || []).map(l => l.date)]);
    const sorted = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return sorted.filter(d => d !== today).slice(0, 7);
  }, [foodLogs, activityLogs, today]);

  const thirtyDayBalance = useMemo(() => {
    let totalBalance = 0;
    pastDates.forEach(date => {
      const a = activityLogs.filter(l => l.date === date).reduce((s, x) => s + (x.activeCalories || 0), 0);
      if (a > 0) {
        const f = foodLogs.filter(l => l.date === date).reduce((s, x) => s + (x.calories || 0), 0);
        totalBalance += ((a + dailyTarget) - f);
      }
    });
    return totalBalance;
  }, [foodLogs, activityLogs, dailyTarget, pastDates]);

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
      const dailyBurn = (activityLogs || []).filter(l => l.date === dateStr).reduce((s, x) => s + (x.activeCalories || 0), 0);
      if (dailyBurn > 0) {
        validDays++;
        const dailyIntake = (foodLogs || []).filter(l => l.date === dateStr).reduce((s, x) => s + (x.calories || 0), 0);
        totalIn += dailyIntake; totalOut += dailyBurn;
      }
    }
    const totalBase = dailyTarget * validDays;
    const netBalance = (totalOut + totalBase) - totalIn;
    return { totalIn, totalOut, netBalance, validDays, totalDaysInRange };
  }, [historyStartDate, historyEndDate, foodLogs, activityLogs, dailyTarget]);

  const currentWeightRecord = weightLogs.find(l => l.date === weightHistoryDate);

  if (loading) return <div className="flex h-screen items-center justify-center text-neutral-400 bg-black">Loading...</div>;
  const hasAnyKey = apiKeys.free1 || apiKeys.free2 || apiKeys.free3 || apiKeys.free4 || apiKeys.free5 || apiKeys.paid;
  const isViewingHistory = currentViewDate !== today;

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
        <h1 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Icons.Activity /> Health Plan <span className="text-xs text-neutral-500 font-normal mt-1">v1.5.0</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(!showSettings)} className={`flex flex-col items-center hover:text-teal-400 ${hasAnyKey ? 'text-teal-400' : 'text-neutral-500'}`}><Icons.Settings /><span className="text-[10px] font-bold">SETTING</span></button>
          <button onClick={handleExport} className="flex flex-col items-center text-neutral-500 hover:text-teal-400"><Icons.Download /><span className="text-[10px] font-bold">BACKUP</span></button>
          <div className="relative flex flex-col items-center text-neutral-500 hover:text-teal-400 cursor-pointer"><Icons.Upload /><span className="text-[10px] font-bold">RESTORE</span><input type="file" ref={importInputRef} onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" /></div>
        </div>
      </div>

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

      {/* Tab Navigation */}
      <div className="flex bg-neutral-900 border-b border-neutral-800 sticky top-[calc(55px+env(safe-area-inset-top))] z-40 shadow-sm">
        <button onClick={() => setActiveTab('daily')} className={`flex-1 py-4 text-base font-medium flex justify-center gap-2 ${activeTab === 'daily' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-neutral-500'}`}><Icons.Zap /> 今日儀表板</button>
        <button onClick={() => setActiveTab('weight')} className={`flex-1 py-4 text-base font-medium flex justify-center gap-2 ${activeTab === 'weight' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-neutral-500'}`}><Icons.TrendingDown /> 體重與劑量</button>
      </div>

      <div className="p-4 space-y-6">
        {activeTab === 'daily' && (
          <>
            {isViewingHistory && (
              <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded-xl flex justify-between items-center animate-pulse relative mb-6">
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
            {/* Daily List */}
            <DailyList foodList={dailyFoodList} waterList={dailyWaterList} activityList={dailyActivityList} setConfirmModal={setConfirmModal} />

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
                    const net = (a + dailyTarget) - f;
                    return (
                      <button key={date} onClick={() => setCurrentViewDate(date)} className="w-full bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center hover:bg-neutral-800 transition-colors">
                        <div className="font-bold text-neutral-300 w-24 text-left whitespace-nowrap">{date}</div>
                        <div className="flex gap-2 text-xs font-bold flex-1 justify-end items-center"><span className="text-orange-500 whitespace-nowrap">攝 {f}</span><span className="text-teal-500 whitespace-nowrap">消 {a} <span className="text-[10px] opacity-80">({a + dailyTarget})</span></span><span className={`${net >= 0 ? 'text-green-500' : 'text-red-500'} ml-1 whitespace-nowrap`}>{net > 0 ? '+' : ''}{net}</span></div>
                        <Icons.ArrowLeft className="w-4 h-4 text-neutral-600 rotate-180 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* History Query */}
            <div className="mt-8 pb-8">
              <h3 className="font-bold text-neutral-400 text-sm mb-3 pl-1 flex items-center gap-2"><Icons.Calendar className="w-4 h-4" /> 歷史查詢</h3>
              <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 overflow-hidden w-full box-border">
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
