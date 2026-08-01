import { test, expect, type Page } from '@playwright/test';

/**
 * 保護「舊資料沒有 amountUnit 時，單位仍要顯示正確」這件事。
 *
 * 為什麼需要這條測試：
 * `amountUnit` 欄位是 2026-07-26（commit d9ef6fe）才加的，而且**沒有做 backfill**。
 * 2026-08-01 實測 Peter 的正式備份：2109 筆有 amount 的紀錄裡，2030 筆（96%）
 * 缺 `amountUnit`——也就是絕大多數真實資料都走 `resolveAmountUnit()` 的推論路徑，
 * 而在這條測試出現之前，**整個 e2e 沒有任何一條覆蓋這個形狀的資料**
 * （既有 spec 的 seed 不是帶了 amountUnit，就是根本沒有 amount）。
 *
 * 推論依據是 `linkId`：飲料連動產生的 food log 帶 linkId，純食物沒有。
 * 這是隱性耦合——有人改動 linkId 語意時不會報錯，只會靜默顯示錯單位。
 * 這條測試就是讓它壞掉時會叫。
 */

const IPHONE_SE = { width: 375, height: 667 };
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/';

const seedLegacyLogs = async (page: Page) => {
  await page.addInitScript(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 三筆刻意模擬真實備份裡的資料形狀
    localStorage.setItem('mj_foodLogs', JSON.stringify([
      // ① 舊固體食物：有 amount、無 amountUnit、無 linkId → 應顯示 g
      {
        id: 9001, date: iso, type: 'food', foodName: '舊紀錄油飯',
        calories: 420, protein: 8, carbs: 60, fat: 15, fiber: 2,
        amount: 250,
      },
      // ② 舊飲料連動：有 amount、無 amountUnit、有 linkId → 應顯示 ml
      {
        id: 9002, linkId: 8002, date: iso, type: 'food', foodName: '舊紀錄手沖黑咖啡',
        calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0,
        amount: 336,
      },
      // ③ 明確標示必須勝過推論——這兩筆刻意讓 amountUnit 與 linkId 推論「答案相反」。
      //    若只放「無 linkId + amountUnit:'g'」是測不出退化的：推論剛好也給 g，
      //    就算實作忽略了 amountUnit 測試仍會通過（2026-08-01 實際踩到這個洞）。
      {
        // 有 linkId（推論會說 ml）但明確標 g → 必須顯示 g
        id: 9003, linkId: 8003, date: iso, type: 'food', foodName: '明確標克數的鹽味毛豆',
        calories: 120, protein: 11, carbs: 9, fat: 5, fiber: 5,
        amount: 66, amountUnit: 'g',
      },
      {
        // 無 linkId（推論會說 g）但明確標 ml → 必須顯示 ml
        id: 9004, date: iso, type: 'food', foodName: '明確標毫升的滴雞精',
        calories: 40, protein: 9, carbs: 0, fat: 0, fiber: 0,
        amount: 60, amountUnit: 'ml',
      },
    ]));
  });
};

const openFoodSection = async (page: Page) => {
  // 食物記錄區塊預設收合，要先展開才看得到明細
  const toggle = page.getByRole('button', { name: /食物記錄/ });
  if ((await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click();
  }
};

test('舊食物紀錄缺 amountUnit 時，無 linkId 顯示 g、有 linkId 顯示 ml', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedLegacyLogs(page);
  await page.goto(BASE_URL);
  await openFoodSection(page);

  // ① 無 linkId 的舊固體食物 → g，且不可被誤標成 ml
  const solid = page.locator('div').filter({ hasText: /^舊紀錄油飯$/ }).last()
    .locator('xpath=following-sibling::div').first();
  await expect(page.getByText('250 g', { exact: true })).toBeVisible();
  await expect(page.getByText('250 ml', { exact: true })).toHaveCount(0);
  void solid;

  // ② 有 linkId 的舊飲料 → ml，且不可被誤標成 g
  await expect(page.getByText('336 ml', { exact: true })).toBeVisible();
  await expect(page.getByText('336 g', { exact: true })).toHaveCount(0);

  // ③ 明確標示勝過推論——這兩筆的 amountUnit 與 linkId 推論答案相反
  await expect(page.getByText('66 g', { exact: true })).toBeVisible();
  await expect(page.getByText('66 ml', { exact: true })).toHaveCount(0);

  await expect(page.getByText('60 ml', { exact: true })).toBeVisible();
  await expect(page.getByText('60 g', { exact: true })).toHaveCount(0);
});

test('舊飲料紀錄顯示水滴圖示，舊固體食物不顯示', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedLegacyLogs(page);
  await page.goto(BASE_URL);
  await openFoodSection(page);

  // 液體用藍色 + 水滴 icon；固體是中性色且沒有 icon。
  // 鎖在包住數量文字的那個 span 上判斷，避免抓到其他藍色元素。
  const liquidSpan = page.locator('span').filter({ hasText: /^336 ml$/ });
  await expect(liquidSpan).toHaveClass(/text-blue-400/);
  await expect(liquidSpan.locator('svg')).toHaveCount(1);

  const solidSpan = page.locator('span').filter({ hasText: /^250 g$/ });
  await expect(solidSpan).toHaveClass(/text-neutral-400/);
  await expect(solidSpan.locator('svg')).toHaveCount(0);
});
