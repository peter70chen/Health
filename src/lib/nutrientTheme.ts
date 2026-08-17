/**
 * 營養素的單一色彩來源。
 *
 * 在此之前，蛋白質/碳水/脂肪的顏色在 DashboardCard、AnalysisResult、DailyList、
 * 份量編輯器四處各寫一份，色階還不一致（有的 400 有的 500），
 * 加第四個營養素時很容易再走鐘一次。集中在這裡，改一次就到處生效。
 *
 * 註：這些字串必須是字面值，Tailwind JIT 才掃得到（tailwind.config 的 content
 * 已涵蓋 src/**\/*.ts）。不要改成樣板字串或動態組合。
 */
export type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';

export type NutrientStyle = {
  /** 儀表板等處的完整名稱 */
  label: string;
  /** 清單裡的縮寫 */
  short: string;
  /** 數值文字色（深底可讀） */
  text: string;
  /** 進度條填色 */
  bar: string;
  /** 進度條旁的數值文字色，比 text 再亮一階 */
  barText: string;
};

export const NUTRIENTS: Record<NutrientKey, NutrientStyle> = {
  // 碳水刻意用 amber 而非 yellow：yellow-400 在 neutral-900 深底上偏刺眼且對比較弱
  calories: { label: '熱量', short: 'kcal', text: 'text-orange-500', bar: 'bg-orange-500', barText: 'text-orange-300' },
  protein: { label: '蛋白質', short: 'P', text: 'text-blue-400', bar: 'bg-blue-500', barText: 'text-blue-300' },
  carbs: { label: '碳水化合物', short: 'C', text: 'text-amber-400', bar: 'bg-amber-500', barText: 'text-amber-300' },
  // 脂肪用 rose，讓 green 保留給「完成／正常」等狀態，不讓資料與狀態撞色。
  fat: { label: '脂肪', short: 'F', text: 'text-rose-400', bar: 'bg-rose-500', barText: 'text-rose-300' },
  // 纖維維持紫色，與另外三項及介面狀態都有清楚區隔。
  fiber: { label: '膳食纖維', short: '纖', text: 'text-violet-400', bar: 'bg-violet-500', barText: 'text-violet-300' },
};
