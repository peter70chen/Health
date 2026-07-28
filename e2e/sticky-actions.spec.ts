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

  // 只確認 bounding box 在畫面內還不夠：底部導覽曾經疊在按鈕上方，
  // 看得到「確認加入」，但手指實際點到的是「體重與劑量」。
  const buttonAtCenter = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    return hit?.closest('button')?.textContent?.trim() ?? '';
  }, {
    x: box!.x + box!.width / 2,
    y: box!.y + box!.height / 2,
  });
  expect(buttonAtCenter).toContain('確認加入');

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

/**
 * 迴歸測試：R2 曾經因為 useUserScrolling 回傳不穩定的物件 identity，
 * 讓自動捲動的 effect 每次 re-render 都重跑 —— 在結果卡打字或拖滑桿時
 * 畫面會被反覆拉回卡片頂端。這個測試就是為了永遠擋住那個行為。
 */
test('在結果卡編輯欄位或拖份量時，畫面不會被拉回卡片頂端', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedStorage(page);
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: '記錄飲食' }).click();
  await page.getByRole('button', { name: '常用', exact: true }).click();
  await page.getByText('排骨便當').click();
  await expect(page.getByRole('button', { name: /確認加入/ })).toBeVisible();

  // 等首次自動捲動完成（會停在卡片頂端對齊 sticky header 的位置）。
  await page.waitForTimeout(1200);

  // 模擬真實情境：使用者往下捲一點，去修改卡片下半部的「膳食纖維」欄位。
  // 此時卡片頂端已經在畫面外 —— 這是能觀察到「被拉回頂端」的必要前提。
  //
  // 註：不要用「捲到很遠再打字」的寫法。真人沒辦法對著看不到的欄位打字，
  // Playwright 也會為了點擊而先把欄位捲進畫面，量到的會是測試框架的捲動而非 App 的。
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000);
  const scrollBefore = await page.evaluate(() => window.scrollY);

  const fiberInput = page.locator('label', { hasText: '膳食纖維 g' }).locator('input');
  await expect(fiberInput).toBeInViewport();

  // 打字會 setAnalyzedFood({...}) 產生新物件。若捲動 effect 依賴那個物件，
  // 每一個字都會把畫面拉回卡片頂端，正在編輯的欄位就被推出畫面。
  await fiberInput.pressSequentially('12', { delay: 60 });
  await page.waitForTimeout(1800);

  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(120);
  // 編輯中的欄位必須仍然看得見
  await expect(fiberInput).toBeInViewport();
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

test('易讀字級在 320px 手機仍可完成首頁、體重與飲食記錄操作', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(BASE_URL);

  const typeScale = await page.evaluate(() => ({
    label: getComputedStyle(document.querySelector('.text-xs')!).fontSize,
    bodySmall: getComputedStyle(document.querySelector('.text-sm')!).fontSize,
  }));
  expect(typeScale).toEqual({ label: '14px', bodySmall: '16px' });

  const hasHorizontalOverflow = async () => page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );

  expect(await hasHorizontalOverflow()).toBe(false);
  await expect(page.getByRole('button', { name: '記錄飲食' })).toBeVisible();

  await page.getByRole('button', { name: /體重與劑量/ }).click();
  expect(await hasHorizontalOverflow()).toBe(false);
  await expect(page.getByLabel('體重 (kg)')).toBeVisible();

  await page.getByRole('button', { name: /^今日/ }).click();
  await page.getByRole('button', { name: '記錄飲食' }).click();
  expect(await hasHorizontalOverflow()).toBe(false);
  await expect(page.getByRole('button', { name: '拍照 / 上傳圖片' })).toBeVisible();
});

test('小螢幕記錄阻力運動時，計算按鈕不會被底部導覽遮住', async ({ page }) => {
  const compactPhone = { width: 320, height: 568 };
  await page.setViewportSize(compactPhone);
  await page.addInitScript(() => {
    localStorage.setItem('mj_resistanceDefs', JSON.stringify([
      { id: 101, name: '啞鈴彎舉' },
    ]));
  });
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: '記錄運動' }).click();
  await page.getByRole('button', { name: '阻力', exact: true }).click();
  await page.getByRole('checkbox', { name: '啞鈴彎舉' }).check();

  await expect(page.locator('nav[aria-label="主要功能"]')).toHaveCount(0);

  const calculateButton = page.getByRole('button', { name: '開始計算並儲存' });
  await calculateButton.scrollIntoViewIfNeeded();
  await expect(calculateButton).toBeInViewport();

  const box = await calculateButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(compactPhone.height);

  const hitTargets = await page.evaluate(({ xPositions, y }) => (
    xPositions.map((x) => (
      document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim() ?? ''
    ))
  ), {
    xPositions: [
      box!.x + box!.width * 0.2,
      box!.x + box!.width * 0.5,
      box!.x + box!.width * 0.8,
    ],
    y: box!.y + box!.height * 0.9,
  });
  expect(hitTargets).toEqual([
    '開始計算並儲存',
    '開始計算並儲存',
    '開始計算並儲存',
  ]);
});

test('飲水常用項目很長時，清單仍位於底部導覽上方且最後一項可操作', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const containers = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      beverageName: index === 9 ? '測試保溫杯' : `常用飲品 ${index + 1}`,
      amount: 300 + index * 10,
      calories: index * 5,
      protein: 0,
      carbs: 0,
      fat: 0,
    }));
    localStorage.setItem('mj_favoriteWaterContainers', JSON.stringify(containers));
  });
  await page.goto(BASE_URL);

  await page.getByRole('button', { name: '記錄飲水', exact: true }).click();
  await page.getByRole('button', { name: '常用', exact: true }).click();

  const dialog = page.getByRole('dialog');
  const overlayZIndex = await dialog.evaluate((element) => (
    Number(getComputedStyle(element.parentElement!).zIndex)
  ));
  expect(overlayZIndex).toBeGreaterThan(50);
  await expect(page.locator('nav[aria-label="主要功能"]')).toHaveCount(0);

  const lastContainer = page.locator('button').filter({ hasText: '測試保溫杯' });
  await lastContainer.scrollIntoViewIfNeeded();
  await expect(lastContainer).toBeInViewport();

  const [dialogBox, containerBox] = await Promise.all([
    dialog.boundingBox(),
    lastContainer.boundingBox(),
  ]);
  expect(dialogBox).not.toBeNull();
  expect(containerBox).not.toBeNull();
  expect(containerBox!.y + containerBox!.height).toBeLessThanOrEqual(
    dialogBox!.y + dialogBox!.height
  );

  const hitTarget = await page.evaluate(({ x, y }) => (
    document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim() ?? ''
  ), {
    x: containerBox!.x + containerBox!.width / 2,
    y: containerBox!.y + containerBox!.height * 0.9,
  });
  expect(hitTarget).toContain('測試保溫杯');
});
