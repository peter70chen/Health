/**
 * Gemini AI Prompts
 * All prompts used for AI analysis of food, activity, and water
 */

export const PROMPTS = {
    foodImage: `你是一位營養師。請分析這張食物圖片。1.辨識食物名稱。2.估算熱量(kcal)與三大營養素(蛋白質、碳水化合物、脂肪，單位皆為克)。3.若包含飲料或湯品，請估算其「水分含量」(ml)，若無則為0。4.給予簡短的健康建議。回傳純 JSON：{ "foodName": "食物名稱", "calories": 數字, "protein": 數字, "carbs": 數字, "fat": 數字, "amount": 數字, "notes": "簡短建議" }`,

    activityImage: `你是一個健身數據分析師。請分析這張 iPhone 健康或健身 App 的截圖。請提取：1.動態能量(Active Energy)紅色圈圈, 2.步數, 3.運動分鐘數綠色圈圈。4. 請根據畫面內容判斷運動類型(例如：慢跑、走路、健身環)，若無明確類型則回傳「綜合運動」。回傳純 JSON：{ "activityName": "運動名稱", "activeCalories": 數字, "steps": 數字, "exerciseMinutes": 數字, "notes": "請提供約30-50字的運動成效點評與建議。" }。補充說明：{{NOTES}}`,

    foodText: `你是一位專業營養師。請分析這段食物描述：「{{TEXT}}」。估算總熱量(大卡)、蛋白質(克)、碳水化合物(克)與脂肪(克)。若包含飲料，請估算「水分含量」(ml)。回傳純 JSON：{ "foodName": "名稱 (根據描述)", "calories": 數字, "protein": 數字, "carbs": 數字, "fat": 數字, "amount": 數字, "notes": "請提供約30-50字的營養建議與點評。" }`,

    activityText: `你是一個健身數據分析師。請分析這段運動描述：「{{TEXT}}」。估算：1.消耗熱量(kcal), 2.步數(若無則填0), 3.運動分鐘數。並從描述中提取運動類型作為名稱。回傳純 JSON：{ "activityName": "運動名稱", "activeCalories": 數字, "steps": 數字, "exerciseMinutes": 數字, "notes": "請提供約30-50字的運動成效點評與建議。" }`,

    waterImage: `你是一位營養師。請分析這張飲料/水杯圖片。1.辨識飲料種類(例如：開水、美式咖啡、拿鐵、茶、果汁)。2.估算液體容量(毫升 ml)。3.若為有熱量的飲料，請估算其熱量(kcal)與三大營養素(g)，若是白開水則數值為0。回傳純 JSON：{ "amount": 數字, "beverageName": "飲料名稱", "calories": 數字, "protein": 數字, "carbs": 數字, "fat": 數字, "notes": "簡短描述判斷依據。" }`,

    coachReview: `你是一位熟悉 GLP-1/GIP 雙促效劑（如猛健樂 Mounjaro）的專業減重教練與營養師。
用戶目前正在使用猛健樂，最新記錄到的劑量為 {{dose}} mg。
請根據用戶最近 7 天的數據給予綜合建議：
數據摘要：
- 體重變化：從 {{startW}} kg 變為 {{endW}} kg
- 7天總攝取熱量：{{totalIn}} kcal (日均 {{avgIn}} kcal)
- 7天總運動消耗：{{totalOut}} kcal (日均 {{avgOut}} kcal)
請給出一段約 150-200 字的建議，內容需包含：
1. 飲食與運動建議：考慮藥物抑制食慾的特性，特別注意蛋白質與水分攝取，避免肌肉流失。
2. 藥物與體重評估：
- 若體重停滯：分析是否熱量赤字不足或身體適應，是否建議與醫師討論調整劑量？
- 若體重下降順利：鼓勵維持，並注意副作用。
- 若副作用明顯（參考備註）：提供緩解建議。
3. 心理支持。
請用繁體中文，語氣專業、溫暖且具體。請務必加上「藥物調整與副作用處理請務必諮詢主治醫師」的免責聲明。
回傳純 JSON 格式：{ "advice": "建議內容..." }`,
} as const;
