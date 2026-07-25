import { test, expect, type Page } from '@playwright/test';

/**
 * 迴歸測試：熱量趨勢圖的「消耗」必須含阻力訓練。
 *
 * 原始 bug（2026-07-25 發現）：App.tsx 的 trendData 只加總 activityLogs，
 * 漏了 resistanceLogs。但儀表板 OUT、歷史查詢、過去記錄區都有算阻力訓練，
 * 所以重訓日的趨勢圖消耗柱會偏低，跟儀表板數字對不上。
 *
 * 測試策略刻意避開絕對座標：
 * 昨天「只有有氧 220 kcal」、今天「只有阻力 220 kcal」，
 * 兩天消耗相同 → 兩根柱子高度必須相等。
 * 修正前今天完全不會產生柱子（TrendChart 只在 out > 0 時畫 rect），
 * 所以柱子數會是 1 而不是 2，測試必然 FAIL。
 */

const IPHONE_SE = { width: 375, height: 667 };
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/';

const BURN = 220; // 兩天的消耗刻意設成同一個數字

const seedTwoDays = async (page: Page) => {
  await page.addInitScript((burn) => {
    const toISO = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 昨天：只有有氧
    localStorage.setItem('mj_activityLogs', JSON.stringify([
      {
        id: 2001, date: toISO(yesterday), type: 'activity',
        activityName: '快走', activeCalories: burn, duration: 40,
      },
    ]));

    // 今天：只有阻力訓練
    localStorage.setItem('mj_resistanceLogs', JSON.stringify([
      {
        id: 3001, date: toISO(today), items: [], totalCalories: burn, notes: '',
      },
    ]));
  }, BURN);
};

/** 取得趨勢圖裡的消耗柱（teal 色 rect），依 x 座標排序 */
const getBurnBars = async (page: Page) => {
  const bars = page.locator('svg[viewBox="0 0 100 115"] rect[fill="#14b8a6"]');
  const count = await bars.count();
  const out: { x: number; height: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Number(await bars.nth(i).getAttribute('x')),
      height: Number(await bars.nth(i).getAttribute('height')),
    });
  }
  return out.sort((a, b) => a.x - b.x);
};

test('趨勢圖的消耗柱要含阻力訓練：純有氧日與純重訓日消耗相同時，柱高必須相等', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedTwoDays(page);
  await page.goto(BASE_URL);

  await expect(page.getByText('熱量趨勢')).toBeVisible();

  const bars = await getBurnBars(page);

  // 關鍵斷言 1：兩天都要有柱子。修正前今天的 out 是 0，只會畫出 1 根。
  expect(bars).toHaveLength(2);

  // 關鍵斷言 2：同樣 220 kcal，不管來自有氧或重訓，柱高都要一樣。
  expect(bars[1].height).toBeCloseTo(bars[0].height, 5);
});

test('儀表板 OUT 與趨勢圖同口徑：重訓當日兩邊都要認得這 220 kcal', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedTwoDays(page);
  await page.goto(BASE_URL);

  // 儀表板側：今天只有阻力訓練，OUT 必須顯示 -220 而不是 -0。
  // （這一半在修正前就是對的——儀表板從來沒漏算，漏的是趨勢圖。）
  // 刻意鎖在「消耗 OUT」那張卡片內，不用全頁 getByText('-220')：
  // 頁面其他地方（例如過去記錄的負值結餘）可能出現同樣字串而撞上 strict mode。
  const outCard = page.getByText('消耗 OUT', { exact: true }).locator('..');
  await expect(outCard.getByText(`-${BURN}`, { exact: true })).toBeVisible();

  // 趨勢圖側：今天是 7 天區間的最後一格，x 會落在最右緣（getX(6) = 100）。
  // 修正前唯一的柱子是昨天的（x ≈ 78.6），這條斷言會 FAIL——
  // 這才是「兩邊同口徑」真正被測到的地方。
  const bars = await getBurnBars(page);
  expect(bars.length).toBeGreaterThan(0);
  expect(bars[bars.length - 1].x).toBeGreaterThan(90);
});
