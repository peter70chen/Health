import type { FoodLog } from '../types';

/**
 * 判定一筆 FoodLog 的 `amount` 該用什麼單位顯示。
 *
 * ## 為什麼需要這個函式
 *
 * `FoodLog.amount` 是一個被兩種量綱共用的欄位：
 * - 照片／文字辨識的食物 → 公克
 * - 飲料連動產生的 food log → 毫升
 *
 * 2026-07-26（commit d9ef6fe）加入 `amountUnit` 欄位後，新資料都會明確標單位。
 * 但**既有資料沒有這個欄位，而且沒有做 backfill migration**。
 * 2026-08-01 實測 Peter 的正式備份：2109 筆有 amount 的紀錄中，
 * 有 2030 筆（96%）缺 `amountUnit`——也就是絕大多數歷史資料都靠下面的推論在顯示。
 *
 * ## 推論依據與它的脆弱點
 *
 * 唯一可用的線索是 `linkId`：飲料連動產生的 food log 一定帶 `linkId`
 * （`App.tsx` 的 water→food 連動路徑），純食物紀錄則沒有。
 *
 * ⚠️ **這代表顯示單位隱性依賴 `linkId` 的語意。** 若日後有人把 `linkId` 改成
 * 其他用途（例如拿來串一般食物的關聯），這裡會**靜默**判錯——不會報錯、不會壞掉，
 * 只是單位顯示錯誤。這個耦合原本埋在 DailyList 的 JSX 裡沒有名字，
 * 抽成具名函式並加上 e2e 覆蓋，就是為了讓它壞掉時測試會叫。
 *
 * ## 為什麼不直接 backfill 寫進資料
 *
 * 這個推論在實測資料上約 99.3% 正確，但不是 100%
 * （已知例外：帶 linkId 的固體「鹽味毛豆」1 筆、無 linkId 的液體「滴雞精」14 筆）。
 * 目前單位是**渲染時**推出來的，判錯了改這個函式就全部修正；
 * 一旦 backfill 寫進 localStorage，錯誤就固化成永久資料並同步到 iCloud 與雲端備份，
 * 之後再也分不出哪些是推論、哪些是真值。用 99.3% 的推論產生永久資料並不划算。
 *
 * `amount` 不參與任何熱量或營養素加總（`dailyFood` 只累加 calories 與巨量營養素），
 * 所以即使個別判錯也只影響顯示，不會污染統計。
 */
export const resolveAmountUnit = (log: Pick<FoodLog, 'amountUnit' | 'linkId'>): 'g' | 'ml' => {
  if (log.amountUnit) return log.amountUnit;
  // 舊資料：沒有 linkId 就是自己記的食物（公克）
  return log.linkId ? 'ml' : 'g';
};

/** 這筆紀錄是否該用「飲品」的樣式呈現（水滴圖示＋藍色）。 */
export const isLiquidAmount = (log: Pick<FoodLog, 'amountUnit' | 'linkId'>): boolean =>
  resolveAmountUnit(log) === 'ml';
