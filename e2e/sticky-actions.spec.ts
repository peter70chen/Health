import { test, expect, type Page } from '@playwright/test';

/**
 * 驗證「不用自己滑去找按鈕」這件事真的成立。
 *
 * 走「常用食物」路徑觸發 AnalysisResult，因為 selectFavorite() 會直接設定
 * analyzedFood state —— 不需要 Gemini API key 就能重現真實的結果卡。
 */

const IPHONE_SE = { width: 375, height: 667 };
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/';

const seedStorage = async (page: Page) => {
  await page.addInitScript(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    localStorage.setItem('mj_favoriteFoods', JSON.stringify([
      { id: 1, foodName: '排骨便當', calories: 850, protein: 30, carbs: 105, fat: 32, fiber: 4 },
    ]));

    // 一筆新資料（有 fiber）+ 一筆舊資料（完全沒有 fiber 欄位，模擬既有 localStorage）
    localStorage.setItem('mj_foodLogs', JSON.stringify([
      {
        id: 1001, date: iso, type: 'food', foodName: '燕麥優格', calories: 320,
        protein: 15, carbs: 40, fat: 9, fiber: 7,
        baseCalories: 320, baseProtein: 15, baseCarbs: 40, baseFat: 9, baseFiber: 7, portion: 1,
      },
      {
        id: 1002, date: iso, type: 'food', foodName: '舊紀錄（無纖維欄位）', calories: 500,
        protein: 20, carbs: 60, fat: 18,
        baseCalories: 500, baseProtein: 20, baseCarbs: 60, baseFat: 18, portion: 1,
      },
    ]));
  });
};

test('分析結果卡的「確認加入」在視窗內可見，不需捲動', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedStorage(page);
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: '記錄飲食' }).click();
  await page.getByRole('button', { name: '常用', exact: true }).click();
  await page.getByText('排骨便當').click();

  const saveButton = page.getByRole('button', { name: /確認加入/ });
  await expect(saveButton).toBeVisible();

  // 關鍵斷言：按鈕的可視區塊必須完整落在視窗高度內。
  // 若 sticky footer 失效，卡片很長時按鈕會落在 viewport 外（y > 667）。
  const box = await saveButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(IPHONE_SE.height);
  expect(box!.y).toBeGreaterThanOrEqual(0);

  await page.screenshot({ path: 'verification-results/r2-sticky-save-button.png' });
});

test('捲到卡片中段時，按鈕仍釘在視窗底部', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedStorage(page);
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: '記錄飲食' }).click();
  await page.getByRole('button', { name: '常用', exact: true }).click();
  await page.getByText('排骨便當').click();

  const saveButton = page.getByRole('button', { name: /確認加入/ });
  await expect(saveButton).toBeVisible();

  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(500);

  const box = await saveButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(IPHONE_SE.height);

  await page.screenshot({ path: 'verification-results/r2-sticky-after-scroll.png' });
});

test('儀表板顯示四條營養素進度條，舊資料的纖維算作 0 不會是 NaN', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedStorage(page);
  await page.goto(BASE_URL);

  await expect(page.getByText('蛋白質攝取')).toBeVisible();
  await expect(page.getByText('碳水化合物攝取')).toBeVisible();
  await expect(page.getByText('脂肪攝取')).toBeVisible();
  await expect(page.getByText('膳食纖維攝取')).toBeVisible();

  // 燕麥優格 7g + 舊紀錄（無欄位）0g = 7g，不可以是 NaN
  await expect(page.getByText('7 / 25g')).toBeVisible();

  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain('NaN');

  await page.screenshot({ path: 'verification-results/r2-dashboard-4-macros.png', fullPage: true });
});
