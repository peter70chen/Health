import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './components/Icons';
import { TrendChart } from './components/charts/TrendChart';
import { WeightChart } from './components/charts/WeightChart';
import { WaterCup } from './components/ui/WaterCup';
import { callGeminiWithFallback } from './services/gemini';
import { PROMPTS } from './lib/prompts';
import { CONFIG, STORAGE_KEYS } from './lib/config';
import { getLocalISOString, safeLoadFromStorage } from './lib/utils';
import type {
  ApiKeys, WeightLog, FoodLog, ActivityLog, WaterLog, ChartData,
  AnalyzedFood, AnalyzedActivity, AnalyzedWater,
  FavoriteFood, FavoriteWaterContainer, ManualFormState,
  ConfirmModalState, TargetModalState, RangeQueryResults, DailyListItem
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
  const [inputMethod, setInputMethod] = useState<'ai' | 'manual' | 'favorites'>('ai');
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
  // Load data from localStorage
  useEffect(() => {
    setWeightLogs(safeLoadFromStorage(STORAGE_KEYS.WEIGHT_LOGS, []));
    setFoodLogs(safeLoadFromStorage(STORAGE_KEYS.FOOD_LOGS, []));
    setActivityLogs(safeLoadFromStorage(STORAGE_KEYS.ACTIVITY_LOGS, []));
    setFavoriteFoods(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_FOODS, []));
    setWaterLogs(safeLoadFromStorage(STORAGE_KEYS.WATER_LOGS, []));
    setFavoriteWaterContainers(safeLoadFromStorage(STORAGE_KEYS.FAVORITE_WATER_CONTAINERS, []));

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
    }
  }, [weightLogs, foodLogs, activityLogs, favoriteFoods, waterLogs, favoriteWaterContainers, coachAdvice, dailyTarget, activityTarget, waterTarget, loading]);

  useEffect(() => {
    if (inputModalType) {
      setInputMethod('ai');
      setManualForm({ name: '', val1: '', val2: '', val3: '', val4: '' });
      setPortion(1.0);
      setSelectedImage(null);
      setImagePreview(null);
      setImageNotes("");
      setAddToFavorites(false);
    }
  }, [inputModalType]);

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
    const data = JSON.stringify({ weightLogs, foodLogs, activityLogs, favoriteFoods, waterLogs, favoriteWaterContainers, coachAdvice, dailyTarget, activityTarget, waterTarget }, null, 2);
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
    console.log('=== handleImport called ===');
    const file = e.target.files?.[0];

    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size);
    console.log('Starting FileReader...');

    const r = new FileReader();
    r.onload = (ev) => {
      console.log('FileReader onload triggered');
      try {
        const rawData = ev.target?.result as string;
        const d = JSON.parse(rawData);
        console.log('Parsed data keys:', Object.keys(d));

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

        // Handle targets which might be numbers (0 is falsy, check undefined)
        const dt = get('dailyTarget'); if (dt !== undefined) { setDailyTarget(dt); importCount++; }
        const at = get('activityTarget'); if (at !== undefined) { setActivityTarget(at); importCount++; }
        const wt = get('waterTarget'); if (wt !== undefined) { setWaterTarget(wt); importCount++; }

        console.log(`=== Import completed. Updated ${importCount} categories ===`);

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
        const wCals = parseInt(manualForm.val2 || '0');
        const wPro = parseInt(manualForm.val3 || '0');
        const wCarbs = parseInt(manualForm.val4 || '0');
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

      setFoodLogs(p => [{ id: now, date: logDate, type: 'food', ...analyzedFood, calories: finalCal, protein: finalPro, carbs: finalCarbs, fat: finalFat, portion: portion }, ...p]);

      // Original: if (analyzedFood.amount > 0) - TypeScript requires null check
      if ((analyzedFood.amount ?? 0) > 0) {
        const waterAmt = Math.round((analyzedFood.amount ?? 0) * portion);
        setWaterLogs(p => [{ id: now + 2, date: logDate, type: 'food_water', beverageName: analyzedFood.foodName, amount: waterAmt, calories: 0, isManual: false }, ...p]);
      }
      setAnalyzedFood(null);
    }
    else if (type === 'activity' && analyzedActivity) {
      setActivityLogs(p => [{ id: now, date: logDate, type: 'activity', ...analyzedActivity }, ...p]);
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

      setWaterLogs(p => [{ id: now, linkId: linkId, date: logDate, type: 'water', ...analyzedWater, amount: finalAmount, isHidden: isCaloric }, ...p]);

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
  const dailyWater = waterLogs.filter(l => l.date === currentViewDate).reduce((s, i) => s + (i.amount || 0), 0);
  const remaining = dailyTarget - dailyFood.cal + dailyAct.cal;
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : CONFIG.START_W;
  const bmi = (currentWeight / ((CONFIG.HEIGHT / 100) ** 2)).toFixed(1);

  const dailyList = useMemo((): DailyListItem[] => {
    const foods = foodLogs.filter(l => l.date === currentViewDate && !l.isHidden).map(l => ({ ...l, _source: 'food' as const }));
    const activities = activityLogs.filter(l => l.date === currentViewDate && !l.isHidden).map(l => ({ ...l, _source: 'activity' as const }));
    const waters = waterLogs.filter(l => l.date === currentViewDate && !l.isHidden).map(l => ({ ...l, _source: 'water' as const, type: 'water' as const }));
    return [...foods, ...activities, ...waters].sort((a, b) => b.id - a.id);
  }, [foodLogs, activityLogs, waterLogs, currentViewDate]);

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
        <h1 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Icons.Activity /> Health Plan <span className="text-xs text-neutral-500 font-normal mt-1">v1.2</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(!showSettings)} className={`flex flex-col items-center hover:text-teal-400 ${hasAnyKey ? 'text-teal-400' : 'text-neutral-500'}`}><Icons.Settings /><span className="text-[10px] font-bold">SETTING</span></button>
          <button onClick={handleExport} className="flex flex-col items-center text-neutral-500 hover:text-teal-400"><Icons.Download /><span className="text-[10px] font-bold">BACKUP</span></button>
          <div className="relative flex flex-col items-center text-neutral-500 hover:text-teal-400 cursor-pointer"><Icons.Upload /><span className="text-[10px] font-bold">RESTORE</span><input type="file" ref={importInputRef} onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".json" /></div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-neutral-900 p-5 border-b border-neutral-800 animate-fadeIn">
          <div className="flex justify-between items-center mb-4"><h3 className="text-base font-bold text-white">設定</h3><span className={`text-xs px-2 py-1 rounded-full ${hasAnyKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{hasAnyKey ? '✅ Key 已設定' : '⚠️ Key 未設定'}</span></div>
          <div className="space-y-4">
            <div><label className="block text-sm font-bold text-teal-400 mb-1 flex items-center gap-1"><Icons.Zap className="w-4 h-4" /> 每日熱量目標 (KCAL)</label><input type="number" value={dailyTarget} onChange={e => setDailyTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-teal-500 outline-none text-white" /></div>
            <div><label className="block text-sm font-bold text-teal-400 mb-1 flex items-center gap-1"><Icons.Activity className="w-4 h-4" /> 每日運動目標 (KCAL)</label><input type="number" value={activityTarget} onChange={e => setActivityTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-teal-500 outline-none text-white" /></div>
            <div><label className="block text-sm font-bold text-blue-400 mb-1 flex items-center gap-1"><Icons.Water className="w-4 h-4" /> 每日飲水目標 (ml)</label><input type="number" value={waterTarget} onChange={e => setWaterTarget(Number(e.target.value))} className="w-full p-3 border rounded-lg text-sm bg-neutral-800 border-neutral-700 focus:border-blue-500 outline-none text-white" /></div>
            <div className="border-t border-neutral-700 pt-4"><label className="block text-sm font-bold text-neutral-400 mb-2">Google Gemini API Keys</label>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="mb-2"><input type="password" value={apiKeys[`free${i}`]} onChange={e => setApiKeys(p => ({ ...p, [`free${i}`]: e.target.value }))} placeholder={`Free Key ${i}`} className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-neutral-700 focus:border-neutral-500 outline-none text-neutral-300" /></div>
              ))}
              <div className="mt-2"><input type="password" value={apiKeys.paid} onChange={e => setApiKeys(p => ({ ...p, paid: e.target.value }))} placeholder="Paid Key (Backup)" className="w-full p-2 border rounded-lg text-xs bg-neutral-800 border-orange-900/50 focus:border-orange-500 outline-none text-orange-200" /></div>
            </div>
          </div>
          <button onClick={saveSettings} className="bg-teal-600 text-white px-4 py-4 rounded-xl text-sm w-full font-bold flex justify-center items-center gap-2 mt-6 hover:bg-teal-500 transition-colors"><Icons.Save /> 儲存設定</button>
        </div>
      )}

      {/* Target Modal */}
      {targetModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={(e) => { if (e.target === e.currentTarget) setTargetModal(null) }}>
          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 w-full max-w-xs shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              {targetModal.type === 'daily' ? <Icons.Zap className="text-teal-400" /> : <Icons.Activity className="text-teal-400" />}
              設定{targetModal.type === 'daily' ? '每日攝取' : '每日運動'}目標
            </h3>
            <div className="relative">
              <input type="number" autoFocus className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-2xl font-bold text-center text-white outline-none focus:border-teal-500 transition-colors" value={tempTargetValue} onChange={e => setTempTargetValue(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-sm">KCAL</span>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setTargetModal(null)} className="flex-1 py-3 bg-neutral-800 text-neutral-400 font-bold rounded-xl hover:bg-neutral-700">取消</button>
              <button onClick={saveTargetModal} className="flex-1 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 shadow-lg">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center border border-neutral-800">
            <div className="bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Icons.Trash className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-white mb-2">確定要刪除嗎？</h3>
            <p className="text-base text-neutral-400 mb-6">這筆記錄將會永久移除，無法復原。</p>
            <div className="flex gap-3"><button onClick={() => setConfirmModal(null)} className="flex-1 py-3 text-base font-bold text-neutral-300 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">取消</button><button onClick={executeDelete} className="flex-1 py-3 text-base font-bold text-white bg-red-600 rounded-xl hover:bg-red-500 shadow-md transition-colors">確認刪除</button></div>
          </div>
        </div>
      )}

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
            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6">
              <div className="flex justify-between items-end mb-4 border-b border-neutral-800 pb-4">
                <div><div className={`text-5xl font-extrabold tracking-tight ${remaining < 0 ? 'text-red-500' : 'text-white'}`}>{remaining} <span className="text-2xl font-bold text-neutral-400">KCAL</span></div><div className="text-sm text-neutral-400 font-bold mt-1">今日剩餘額度</div></div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-sm text-neutral-500 flex items-center gap-2">每日可消耗熱量</div>
                  <button onClick={() => openTargetModal('daily')} className="text-base font-bold text-teal-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 mt-1 border border-neutral-700">{dailyTarget} KCAL <Icons.Edit className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-orange-900/20 rounded-xl p-3 border border-orange-900/30"><div className="text-sm text-orange-400 mb-1 font-bold">攝取 IN</div><div className="text-2xl font-bold text-orange-500">{dailyFood.cal}</div></div>
                <div className="bg-teal-900/20 rounded-xl p-3 border border-teal-900/30 relative group">
                  <div className="text-sm text-teal-400 mb-1 font-bold">消耗 OUT</div><div className="text-2xl font-bold text-teal-500">-{dailyAct.cal}</div>
                </div>
              </div>
              <div className="mt-4 mb-4">
                <WaterCup current={dailyWater} target={waterTarget} onClick={() => setInputModalType('water')} />
              </div>
              <div className="mt-5 space-y-3">
                <div><div className="flex justify-between text-sm mb-1"><span className="text-neutral-400 font-medium">蛋白質攝取</span><span className="text-blue-300 font-bold">{dailyFood.pro} / {CONFIG.PRO_TARGET}g</span></div><div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min((dailyFood.pro / CONFIG.PRO_TARGET) * 100, 100)}%` }}></div></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-neutral-400 font-medium">碳水化合物攝取</span><span className="text-yellow-300 font-bold">{dailyFood.carbs} / {CONFIG.CARB_TARGET}g</span></div><div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${Math.min((dailyFood.carbs / CONFIG.CARB_TARGET) * 100, 100)}%` }}></div></div></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="text-neutral-400 font-medium">脂肪攝取</span><span className="text-green-300 font-bold">{dailyFood.fat} / {CONFIG.FAT_TARGET}g</span></div><div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${Math.min((dailyFood.fat / CONFIG.FAT_TARGET) * 100, 100)}%` }}></div></div></div>
              </div>
            </div>

            {/* Action Buttons */}
            {!isViewingHistory && (
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setInputModalType('food')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800"><div className="bg-orange-900/30 p-3 rounded-full text-orange-500"><Icons.Utensils /></div><span className="text-sm font-bold text-neutral-300">記錄飲食</span></button>
                <button onClick={() => setInputModalType('water')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800"><div className="bg-blue-900/30 p-3 rounded-full text-blue-500"><Icons.Water /></div><span className="text-sm font-bold text-neutral-300">記錄飲水</span></button>
                <button onClick={() => setInputModalType('activity')} className="bg-neutral-900 p-4 rounded-xl shadow-sm h-32 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-neutral-800"><div className="bg-teal-900/30 p-3 rounded-full text-teal-500"><Icons.Zap /></div><span className="text-sm font-bold text-neutral-300">記錄運動</span></button>
              </div>
            )}

            {/* Input Modal */}
            {inputModalType && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn" onClick={e => { if (e.target === e.currentTarget) setInputModalType(null) }}>
                <div className="bg-neutral-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-5 mb-6 sm:mb-0 border border-neutral-800 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between border-b border-neutral-800 pb-3 items-center"><h3 className="font-bold text-xl text-white">{inputModalType === 'food' ? '記錄飲食' : (inputModalType === 'water' ? '記錄飲水' : '記錄運動')}</h3><button onClick={() => setInputModalType(null)} className="text-neutral-400 p-2"><Icons.X /></button></div>

                  <div className="flex bg-neutral-800 p-1 rounded-xl">
                    <button onClick={() => setInputMethod('ai')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'ai' ? 'bg-neutral-700 text-teal-400 shadow-sm' : 'text-neutral-400'}`}>🤖 AI 分析</button>
                    <button onClick={() => setInputMethod('manual')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'manual' ? 'bg-neutral-700 text-teal-400 shadow-sm' : 'text-neutral-400'}`}>✏️ 手動</button>
                    {(inputModalType === 'food' || inputModalType === 'water') && (
                      <button onClick={() => setInputMethod('favorites')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${inputMethod === 'favorites' ? 'bg-rose-900/50 text-rose-400 shadow-sm' : 'text-neutral-400'}`}>❤️ 常用</button>
                    )}
                  </div>

                  {/* Favorites - Food */}
                  {inputMethod === 'favorites' && inputModalType === 'food' && (
                    <div className="space-y-3 min-h-[200px]">
                      {favoriteFoods.length > 0 ? favoriteFoods.map(fav => (
                        <div key={fav.id} onClick={() => selectFavorite(fav)} className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex justify-between items-center hover:bg-neutral-700 cursor-pointer transition-colors group">
                          <div>
                            <div className="font-bold text-neutral-200">{fav.foodName}</div>
                            <div className="text-xs text-neutral-400 mt-1 flex gap-2">
                              <span className="text-orange-400">{fav.calories} kcal</span>
                              <span className="text-blue-400">P:{fav.protein}</span>
                              <span className="text-yellow-400">C:{fav.carbs}</span>
                            </div>
                          </div>
                          <button onClick={(e) => deleteFavorite(fav.id, e)} className="p-2 text-neutral-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                        </div>
                      )) : (
                        <div className="text-center py-10 text-neutral-500 text-sm">還沒有常用食物，<br />在新增記錄時勾選「加入常用」即可！</div>
                      )}
                    </div>
                  )}

                  {/* Favorites - Water */}
                  {inputMethod === 'favorites' && inputModalType === 'water' && (
                    <div className="space-y-3 min-h-[200px]">
                      {favoriteWaterContainers.length > 0 ? favoriteWaterContainers.map(fav => (
                        <div key={fav.id} onClick={() => selectFavorite(fav)} className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex justify-between items-center hover:bg-neutral-700 cursor-pointer transition-colors group">
                          <div>
                            <div className="font-bold text-neutral-200">{fav.beverageName}</div>
                            <div className="text-xs text-neutral-400 mt-1 flex gap-2">
                              <span className="text-blue-400">{fav.amount} ml</span>
                              {(fav.calories || 0) > 0 && <span className="text-orange-400">{fav.calories} kcal</span>}
                            </div>
                          </div>
                          <button onClick={(e) => deleteFavorite(fav.id, e)} className="p-2 text-neutral-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                        </div>
                      )) : (
                        <div className="text-center py-10 text-neutral-500 text-sm">還沒有常用容器，<br />在新增記錄時勾選「加入常用」即可！</div>
                      )}
                    </div>
                  )}

                  {/* AI Analysis */}
                  {inputMethod === 'ai' && (
                    <div className="space-y-4">
                      {!selectedImage ? (
                        <>
                          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between p-5 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-dashed border-neutral-600 transition-colors"><div className="flex items-center gap-3"><div className="bg-blue-900/30 text-blue-400 p-2.5 rounded-lg"><Icons.Camera /></div><span className="font-bold text-neutral-300 text-base">拍照 / 上傳圖片</span></div></button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                          <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-neutral-800"></div><span className="mx-4 text-xs text-neutral-500">或輸入文字</span><div className="flex-grow border-t border-neutral-800"></div></div>
                          <div className="space-y-3">
                            <textarea value={manualText} onChange={e => setManualText(e.target.value)} className="w-full p-4 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none resize-none focus:border-teal-500 transition-colors text-white placeholder-neutral-500" placeholder={inputModalType === 'food' ? "例如：吃了一個雞腿便當..." : "例如：慢跑30分鐘..."} rows={3} />
                            <button onClick={executeAnalysis} disabled={isAnalyzing} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-base hover:bg-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">{isAnalyzing ? (<><Icons.Loader2 className="animate-spin w-5 h-5" /> {analysisStatus || "辨識中..."}</>) : (<><Icons.ScanEye /> 開始 AI 分析</>)}</button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="relative">
                            {imagePreview && <img src={imagePreview} className="w-full h-48 object-cover rounded-xl border border-neutral-700" alt="Preview" />}
                            <button onClick={() => { setSelectedImage(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full"><Icons.X /></button>
                          </div>
                          <div><label className="block text-sm font-bold text-neutral-400 mb-1">補充說明 (選填)</label><textarea value={imageNotes} onChange={e => setImageNotes(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base text-white placeholder-neutral-500 focus:border-teal-500 outline-none resize-none" placeholder="例如：飯只吃了一半、去皮..." rows={2} /></div>
                          <button onClick={executeAnalysis} disabled={isAnalyzing} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-lg hover:bg-teal-500 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isAnalyzing ? (<><Icons.Loader2 className="animate-spin w-5 h-5" /> {analysisStatus || "辨識中..."}</>) : (<><Icons.Rocket /> 🚀 開始分析</>)}</button>
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
                      <div className="flex gap-3"><div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">{inputModalType === 'food' ? '熱量 (kcal)' : (inputModalType === 'water' ? '容量 (ml)' : '消耗 (kcal)')}</label><input type="number" value={manualForm.val1} onChange={e => setManualForm(p => ({ ...p, val1: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div><div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">{inputModalType === 'food' ? '蛋白質 (g)' : (inputModalType === 'water' ? '熱量 (kcal)' : '時間 (分)')}</label><input type="number" value={manualForm.val2} onChange={e => setManualForm(p => ({ ...p, val2: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div></div>
                      {(inputModalType === 'food' || inputModalType === 'water') && (
                        <>
                          {inputModalType === 'food' && <div className="flex gap-3">
                            <div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">碳水 (g)</label><input type="number" value={manualForm.val3} onChange={e => setManualForm(p => ({ ...p, val3: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div>
                            <div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">脂肪 (g)</label><input type="number" value={manualForm.val4} onChange={e => setManualForm(p => ({ ...p, val4: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div>
                          </div>}
                          {inputModalType === 'water' && <div className="flex gap-3">
                            <div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">蛋白質 (g)</label><input type="number" value={manualForm.val3} onChange={e => setManualForm(p => ({ ...p, val3: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div>
                            <div className="flex-1"><label className="block text-sm font-bold text-neutral-400 mb-1">碳水 (g)</label><input type="number" value={manualForm.val4} onChange={e => setManualForm(p => ({ ...p, val4: e.target.value }))} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-base outline-none focus:border-teal-500 text-white" placeholder="0" /></div>
                          </div>}
                          <div className="flex items-center gap-2 pt-2 cursor-pointer" onClick={() => setAddToFavorites(!addToFavorites)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${addToFavorites ? 'bg-rose-500 border-rose-500' : 'border-neutral-500'}`}>
                              {addToFavorites && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <label className="text-sm text-neutral-300 font-bold cursor-pointer select-none">加入常用{inputModalType === 'water' ? '容器' : '食物'}</label>
                          </div>
                        </>
                      )}
                      <button onClick={() => saveLog('manual')} className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 text-base mt-2 hover:bg-teal-500 active:scale-[0.98] transition-all"><Icons.Check /> 加入紀錄</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analyzing Indicator */}
            {isAnalyzing && (
              <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-center text-teal-400 text-base font-bold animate-pulse flex flex-col items-center justify-center gap-3 shadow-md">
                <Icons.Loader2 className="animate-spin w-8 h-8" /> <span>{analysisStatus || "AI 正在分析中..."}</span>
              </div>
            )}

            {/* Analysis Result Modal */}
            {(analyzedFood || analyzedActivity || analyzedWater) && (
              <div className="bg-neutral-900 border-2 border-teal-500 p-5 rounded-2xl shadow-xl animate-fadeIn relative">
                <div className="absolute -top-3 left-4 bg-teal-500 text-white text-xs px-3 py-1 rounded-full font-bold">AI 分析結果</div>
                <div className="flex gap-4 mb-5 mt-2 items-start">
                  <div className="flex-shrink-0">
                    {analyzedFood?.imagePreview || analyzedActivity?.imagePreview || analyzedWater?.imagePreview ? <img src={analyzedFood ? analyzedFood.imagePreview : (analyzedWater ? analyzedWater.imagePreview : analyzedActivity?.imagePreview)} className="w-24 h-24 object-cover rounded-xl bg-neutral-800 shadow-sm" alt="Result" /> : <div className="w-24 h-24 bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-400"><Icons.Type className="w-10 h-10" /></div>}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-xl text-white mb-2">{analyzedFood ? analyzedFood.foodName : (analyzedWater ? analyzedWater.beverageName : "運動記錄")}</h4>
                    {analyzedFood ? (
                      <div className="flex flex-col gap-1"><span className="text-orange-400 text-sm font-bold">🔥 原始熱量: {analyzedFood.calories} kcal</span><span className="text-blue-400 text-sm font-bold">🥚 原始蛋白: {analyzedFood.protein}g</span><span className="text-yellow-400 text-sm font-bold">🍞 原始碳水: {analyzedFood.carbs || 0}g</span><span className="text-green-400 text-sm font-bold">🥑 原始脂肪: {analyzedFood.fat || 0}g</span></div>
                    ) : (
                      analyzedWater ? (
                        <div className="flex flex-col gap-1"><span className="text-blue-400 text-sm font-bold">💧 容量: {analyzedWater.amount} ml</span></div>
                      ) : (
                        <div className="flex flex-col gap-1"><span className="text-teal-400 text-sm font-bold">⚡ 消耗: {analyzedActivity?.activeCalories} kcal</span><span className="text-neutral-400 text-sm font-bold">⏱️ 時間: {analyzedActivity?.exerciseMinutes} 分</span></div>
                      )
                    )}
                  </div>
                </div>

                {analyzedFood && (
                  <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700">
                    <div className="flex justify-between items-center mb-2"><label className="font-bold text-neutral-300 text-sm">食用份量/比例</label><span className="font-bold text-teal-400 text-lg">{portion} 份</span></div>
                    <input type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    <div className="flex justify-between mt-3 pt-3 border-t border-neutral-700 text-center">
                      <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">熱量</div><div className="text-base font-bold text-orange-500">{Math.round(analyzedFood.calories * portion)}</div></div>
                      <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">蛋白</div><div className="text-base font-bold text-blue-400">{Math.round((analyzedFood.protein || 0) * portion)}</div></div>
                      <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">碳水</div><div className="text-base font-bold text-yellow-400">{Math.round((analyzedFood.carbs || 0) * portion)}</div></div>
                      <div className="w-1/4"><div className="text-xs text-neutral-400">脂肪</div><div className="text-base font-bold text-green-400">{Math.round((analyzedFood.fat || 0) * portion)}</div></div>
                    </div>
                  </div>
                )}
                {analyzedWater && (
                  <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700">
                    <div className="flex justify-between items-center mb-2"><label className="font-bold text-neutral-300 text-sm">飲用份量/比例</label><span className="font-bold text-teal-400 text-lg">{portion} 份</span></div>
                    <input type="range" min="0.1" max="3" step="0.1" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    <div className="flex justify-between mt-3 pt-3 border-t border-neutral-700 text-center">
                      <div className="w-full"><div className="text-xs text-neutral-400">總容量</div><div className="text-base font-bold text-blue-400">{Math.round(analyzedWater.amount * portion)} ml</div></div>
                    </div>
                    {((analyzedWater.calories || 0) > 0) && (
                      <div className="flex justify-between mt-3 pt-3 border-t border-neutral-700 text-center">
                        <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">熱量</div><div className="text-base font-bold text-orange-500">{Math.round((analyzedWater.calories || 0) * portion)}</div></div>
                        <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">蛋白</div><div className="text-base font-bold text-blue-400">{Math.round((analyzedWater.protein || 0) * portion)}</div></div>
                        <div className="w-1/4 border-r border-neutral-700"><div className="text-xs text-neutral-400">碳水</div><div className="text-base font-bold text-yellow-400">{Math.round((analyzedWater.carbs || 0) * portion)}</div></div>
                        <div className="w-1/4"><div className="text-xs text-neutral-400">脂肪</div><div className="text-base font-bold text-green-400">{Math.round((analyzedWater.fat || 0) * portion)}</div></div>
                      </div>
                    )}
                  </div>
                )}
                {(analyzedFood?.notes || analyzedActivity?.notes || analyzedWater?.notes) && (
                  <div className="mb-4 p-4 bg-teal-900/20 border border-teal-500/30 rounded-xl text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap shadow-inner">
                    <div className="flex items-center gap-2 text-teal-400 font-bold mb-2 text-xs uppercase tracking-wider">
                      <Icons.ScanEye className="w-4 h-4" /> AI 建議與點評
                    </div>
                    {analyzedFood ? analyzedFood.notes : (analyzedWater ? analyzedWater.notes : analyzedActivity?.notes)}
                  </div>
                )}

                {(analyzedFood || analyzedWater) && (
                  <div className="mb-4 flex items-center gap-2 cursor-pointer" onClick={() => setAddToFavorites(!addToFavorites)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${addToFavorites ? 'bg-rose-500 border-rose-500' : 'border-neutral-500'}`}>
                      {addToFavorites && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <label className="text-sm text-neutral-300 font-bold cursor-pointer select-none">加入常用{analyzedWater ? '容器' : '食物'}</label>
                  </div>
                )}

                <div className="flex gap-3"><button onClick={() => { setAnalyzedFood(null); setAnalyzedActivity(null); setAnalyzedWater(null) }} className="flex-1 py-4 text-base border border-neutral-700 rounded-xl font-bold text-neutral-400 hover:bg-neutral-800">取消</button><button onClick={() => saveLog(analyzedFood ? 'food' : (analyzedWater ? 'water' : 'activity'))} className="flex-1 py-4 text-base bg-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-500 shadow-md active:scale-95 transition-all"><Icons.Save className="w-5 h-5" /> 確認加入</button></div>
              </div>
            )}

            {/* Daily List */}
            <div className="space-y-4">
              <h3 className="font-bold text-neutral-300 text-base ml-1 border-l-4 border-teal-500 pl-3">今日明細</h3>
              {dailyList.length > 0 ? dailyList.map(l => (
                <div key={l.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${l._source === 'food' ? 'bg-orange-900/30 text-orange-500' : (l._source === 'water' ? 'bg-blue-900/30 text-blue-500' : 'bg-teal-900/30 text-teal-500')}`}>
                      {l._source === 'food' ? <Icons.Utensils className="w-5 h-5" /> : (l._source === 'water' ? <Icons.Water className="w-5 h-5" /> : <Icons.Zap className="w-5 h-5" />)}
                    </div>
                    <div>
                      <div className="font-bold text-neutral-200 text-base">
                        {l._source === 'food' ? (l as FoodLog).foodName : (l._source === 'water' ? ((l as WaterLog).beverageName || '飲水') : ((l as ActivityLog).activityName ? `運動 (${(l as ActivityLog).activityName})` : '運動'))}
                        {l._source === 'food' && (l as FoodLog).portion && (l as FoodLog).portion !== 1 && <span className="ml-2 text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">x{(l as FoodLog).portion}</span>}
                      </div>
                      <div className="text-sm text-neutral-500 font-medium mt-0.5 flex flex-wrap gap-x-3">
                        {(l as any).amount > 0 && (
                          <span className="text-blue-400 flex items-center gap-1"><Icons.Water className="w-3 h-3" /> {(l as any).amount} ml</span>
                        )}
                        {l._source !== 'water' && <span>{l._source === 'food' ? `+${(l as FoodLog).calories}` : `-${(l as ActivityLog).activeCalories}`} kcal</span>}
                        {l._source === 'food' && (
                          <>
                            <span className="text-blue-400">P:{(l as FoodLog).protein || 0}g</span>
                            <span className="text-yellow-500">C:{(l as FoodLog).carbs || 0}g</span>
                            <span className="text-green-500">F:{(l as FoodLog).fat || 0}g</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setConfirmModal({ id: l.id, type: l._source })} className="text-neutral-600 p-3 hover:text-red-500 active:scale-90 transition-transform"><Icons.Trash className="w-5 h-5" /></button>
                </div>
              )) : <div className="text-center py-10 text-neutral-600 text-sm">今天還沒有記錄喔！</div>}
            </div>

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
            <div className="bg-teal-900/20 rounded-2xl border border-teal-900/50 p-6 mt-8">
              <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-teal-400 text-lg flex items-center gap-2"><Icons.Doctor className="w-6 h-6" /> AI 智能教練</h2><div className="flex gap-2 items-center">{coachAdvice && (<button onClick={() => setCoachAdvice('')} className="text-teal-600 hover:text-red-500 p-2 rounded transition-colors" title="清除建議"><Icons.Trash className="w-5 h-5" /></button>)}<button onClick={handleAskCoach} disabled={isCoachThinking} className="bg-teal-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 hover:bg-teal-500">{isCoachThinking ? (<span className="flex items-center gap-2"><Icons.Loader2 className="animate-spin w-4 h-4" />{coachStatus || "思考中..."}</span>) : '👨‍⚕️ 諮詢意見'}</button></div></div>
              {isCoachThinking ? <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-center gap-3 text-teal-400 text-base font-medium">{coachStatus || "正在分析您的數據中..."}</div> : coachAdvice ? <div className="text-base text-teal-200 leading-relaxed whitespace-pre-wrap animate-fadeIn bg-neutral-900 p-5 rounded-xl border border-neutral-800 shadow-sm relative group">{coachAdvice}</div> : <p className="text-sm text-teal-600 text-center py-6">點擊諮詢按鈕，讓 AI 分析您的近期數據並提供專業建議。</p>}
            </div>
          </>
        )}

        {activeTab === 'weight' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 relative overflow-hidden"><div className="text-sm text-neutral-400 mb-2 font-bold">目前體重</div><div className="text-3xl font-extrabold text-blue-400 tracking-tight">{currentWeight} <span className="text-base text-neutral-500 font-medium">kg</span></div><div className="absolute top-3 right-3 opacity-10 text-white"><Icons.Scale /></div></div>
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 relative overflow-hidden"><div className="text-sm text-neutral-400 mb-2 font-bold">BMI 指數</div><div className="text-3xl font-extrabold text-yellow-400 tracking-tight">{bmi}</div><div className="absolute top-3 right-3 opacity-10 text-white"><Icons.Activity /></div></div>
            </div>
            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-neutral-300 text-base">體重目標追蹤</h2><select value={weightRange} onChange={(e) => setWeightRange(Number(e.target.value))} className="text-sm bg-neutral-800 border-none rounded-lg pl-3 pr-10 py-2 text-neutral-300 font-bold outline-none cursor-pointer"><option value={7}>7天</option><option value={14}>14天</option><option value={30}>30天</option><option value={90}>3個月</option><option value={180}>半年</option><option value={365}>一年</option></select></div>
              <WeightChart data={weightData} targetWeight={CONFIG.TARGET_W} />
            </div>
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h2 className="font-bold text-neutral-300 mb-4 text-lg flex items-center gap-2 border-b border-neutral-800 pb-3"><Icons.Plus /> 新增體重與身體組成</h2>
              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7 min-w-0">
                    <label className="text-xs font-bold text-neutral-400 block mb-1">日期</label>
                    <input type="date" value={inputDate} onChange={e => setInputDate(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0 appearance-none" />
                  </div>
                  <div className="sm:col-span-5 min-w-0">
                    <label className="text-xs font-bold text-neutral-400 block mb-1">體重 (kg)</label>
                    <input type="number" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-teal-500 text-white min-w-0" placeholder="0.0" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-bold text-rose-400 block mb-1 truncate">體脂率 %</label><input type="number" step="0.1" value={inputBodyFat} onChange={e => setInputBodyFat(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-rose-500 text-white" placeholder="0.0" /></div>
                  <div><label className="text-[10px] font-bold text-blue-400 block mb-1 truncate">骨骼肌 kg</label><input type="number" step="0.1" value={inputMuscle} onChange={e => setInputMuscle(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 text-white" placeholder="0.0" /></div>
                  <div><label className="text-[10px] font-bold text-zinc-400 block mb-1 truncate">內臟脂肪</label><input type="number" step="0.5" value={inputVisceral} onChange={e => setInputVisceral(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold outline-none focus:border-zinc-500 text-white" placeholder="0" /></div>
                </div>

                <div><label className="text-xs font-bold text-neutral-400 block mb-1">本週施打劑量 (mg)</label><select value={inputDose} onChange={e => setInputDose(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm font-bold text-neutral-300 outline-none focus:border-teal-500"><option value="2.5">2.5 mg (起始)</option><option value="5.0">5.0 mg (標準)</option><option value="7.5">7.5 mg</option><option value="10.0">10.0 mg</option><option value="12.5">12.5 mg</option><option value="15.0">15.0 mg</option><option value="0">0 mg (本週未施打)</option></select></div>
                <div><label className="text-xs font-bold text-neutral-400 block mb-1">副作用/不適感 (選填)</label><textarea value={inputNotes} onChange={e => setInputNotes(e.target.value)} className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-neutral-300 font-medium resize-none focus:outline-none focus:border-teal-500" placeholder="例如：輕微噁心、頭暈..." rows={2} /></div>
                <button type="submit" className="w-full bg-teal-600 text-white p-4 rounded-xl text-base font-bold mt-2 shadow-md active:scale-95 transition-all hover:bg-teal-500">儲存記錄</button>
              </form>
            </div>
            <div className="space-y-3">
              {weightLogs.slice(0, 7).map(l => (
                <div key={l.id} className="bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-800 flex flex-col hover:bg-neutral-800 transition-colors">
                  <div className="flex justify-between items-center w-full h-10">
                    <div className="flex items-center gap-4"><span className="text-neutral-500 font-bold text-xs w-auto min-w-[5rem] whitespace-nowrap">{l.date}</span><span className="font-extrabold text-white text-lg">{l.weight} kg</span></div>
                    <div className="flex items-center gap-3">{l.dose && l.dose !== '0' && (<span className="bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>{l.dose} mg</span>)}<button onClick={() => setConfirmModal({ id: l.id, type: 'weight' })} className="text-neutral-600 p-1 hover:text-red-500 active:scale-90 transition-transform"><Icons.Trash className="w-4 h-4" /></button></div>
                  </div>
                  <div className="flex gap-2 -mt-2 mb-1 pl-24">
                    {l.bodyFat && <span className="text-[10px] font-bold text-rose-300 bg-rose-900/40 px-1.5 py-0.5 rounded-md">脂 {l.bodyFat}%</span>}
                    {l.muscle && <span className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded-md">肌 {l.muscle}kg</span>}
                    {l.visceral && <span className="text-[10px] font-bold text-zinc-300 bg-zinc-700/40 px-1.5 py-0.5 rounded-md">內 {l.visceral}</span>}
                  </div>
                  {l.notes && <div className="text-[10px] text-neutral-500 pl-24 truncate pb-1">{l.notes}</div>}
                </div>
              ))}
            </div>
            <div className="mt-8 pb-8">
              <h3 className="font-bold text-neutral-400 text-sm mb-3 pl-1 flex items-center gap-2"><Icons.Calendar className="w-4 h-4" /> 歷史查詢</h3>
              <div className="relative bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center gap-3"><div className="flex-1 text-sm font-bold text-white pl-2">{weightHistoryDate ? weightHistoryDate : "選擇日期"}</div><div className="relative w-8 h-8 flex items-center justify-center bg-neutral-800 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"><Icons.Calendar className="w-5 h-5 text-white" /><input type="date" value={weightHistoryDate} onChange={(e) => setWeightHistoryDate(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" /></div></div>
              {currentWeightRecord && showWeightHistory && (
                <div className="pt-2 mt-2 border-t border-neutral-800 animate-fadeIn relative">
                  <button onClick={() => setShowWeightHistory(false)} className="absolute top-4 right-2 text-neutral-500 hover:text-white p-2 z-20"><Icons.X className="w-5 h-5" /></button>
                  <div className="bg-neutral-800/50 p-4 rounded-lg border border-neutral-700 mt-2">
                    <div className="flex justify-between items-center mb-2"><span className="text-teal-400 font-bold text-lg">{currentWeightRecord.date}</span></div>
                    <div className="grid grid-cols-2 gap-4 mb-3"><div><div className="text-xs text-neutral-500 mb-1">體重</div><div className="text-xl font-extrabold text-white">{currentWeightRecord.weight} kg</div></div><div><div className="text-xs text-neutral-500 mb-1">劑量</div><div className="text-xl font-extrabold text-purple-400">{currentWeightRecord.dose || 0} mg</div></div></div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {currentWeightRecord.bodyFat && <div><div className="text-xs text-neutral-500 mb-1">體脂率</div><div className="text-lg font-bold text-rose-400">{currentWeightRecord.bodyFat}%</div></div>}
                      {currentWeightRecord.muscle && <div><div className="text-xs text-neutral-500 mb-1">骨骼肌</div><div className="text-lg font-bold text-blue-400">{currentWeightRecord.muscle} kg</div></div>}
                      {currentWeightRecord.visceral && <div><div className="text-xs text-neutral-500 mb-1">內臟脂肪</div><div className="text-lg font-bold text-zinc-400">{currentWeightRecord.visceral}</div></div>}
                    </div>

                    {currentWeightRecord.notes ? (<div className="text-sm text-neutral-300 bg-black/20 p-3 rounded border border-neutral-700/50"><span className="text-neutral-500 text-xs block mb-1">備註</span>{currentWeightRecord.notes}</div>) : <div className="text-xs text-neutral-600 italic">無備註</div>}
                  </div>
                </div>
              )}
              {(!currentWeightRecord && weightHistoryDate && showWeightHistory) && (<div className="text-center py-6 text-neutral-600 text-sm pt-2 mt-2 border-t border-neutral-800 border-dashed rounded-xl relative"><button onClick={() => setShowWeightHistory(false)} className="absolute top-2 right-2 text-neutral-500 hover:text-white p-2"><Icons.X className="w-5 h-5" /></button>該日期沒有紀錄</div>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
