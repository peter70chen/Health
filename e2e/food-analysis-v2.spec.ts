import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173/';
const IPHONE_SE = { width: 375, height: 667 };

const mockGeminiResponse = {
  mealName: '雞腿便當',
  confidence: 'medium',
  nutritionLabelDetected: false,
  suggestedConsumedFraction: 0.5,
  observations: ['便當內有白飯、雞腿與花椰菜'],
  assumptions: ['醬汁與用油量無法由照片確認'],
  clarificationQuestions: ['白飯是否有吃完？'],
  notes: '醬汁與白飯份量最需要確認。',
  items: [
    {
      id: 'rice',
      name: '白飯',
      category: '主食',
      cookingMethod: '蒸',
      grams: { low: 160, mid: 200, high: 240 },
      nutritionPer100g: { calories: 130, protein: 2.4, carbs: 28, fat: 0.3, fiber: 0.4 },
      nutritionSource: 'model_estimate',
      confidence: 'medium',
      evidence: '約佔便當盒四成'
    },
    {
      id: 'chicken',
      name: '滷雞腿',
      category: '肉類',
      cookingMethod: '滷',
      grams: { low: 100, mid: 120, high: 145 },
      nutritionPer100g: { calories: 215, protein: 24, carbs: 3, fat: 12, fiber: 0 },
      nutritionSource: 'model_estimate',
      confidence: 'medium',
      evidence: '一支帶骨雞腿'
    }
  ]
};

const seedPaidKey = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('mj_api_keys_v4', JSON.stringify({
      free1: '',
      free2: '',
      free3: '',
      free4: '',
      free5: '',
      paid: 'test-paid-key'
    }));
  });
};

test('分項重量、食用比例與 g 單位可完整走完一次', async ({ page }) => {
  await page.setViewportSize(IPHONE_SE);
  await seedPaidKey(page);
  await page.route('**/v1beta/models/*:generateContent?key=*', async route => {
    const request = route.request();
    const body = request.postDataJSON();
    expect(body.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_HIGH');
    expect(body.generationConfig.responseJsonSchema).toBeTruthy();
    expect(body.contents[0].parts[0].text).toContain('食指寬度約為 1.3 公分');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockGeminiResponse) }] } }]
      })
    });
  });

  await page.goto(BASE_URL);
  await page.getByRole('button', { name: '記錄飲食' }).click();
  await page.getByRole('button', { name: '拍照 / 上傳圖片' }).click();
  await page.locator('input[type="file"]').first().setInputFiles(resolve('public/icon.png'));
  await page.getByPlaceholder('例如：飯只吃了一半、去皮...').fill('我只吃一半');
  await page.getByRole('button', { name: '開始分析' }).click();

  await expect(page.getByText('照片中的食物項目')).toBeVisible();
  await expect(page.getByText('我實際吃了多少')).toBeVisible();
  await expect(page.getByText('50%')).toBeVisible();
  await expect(page.getByText(/營養值採 TFDA「白飯」/)).toBeVisible();

  const riceInput = page.getByRole('spinbutton', { name: '重量 g' }).first();
  await riceInput.fill('100');
  await expect(riceInput).toHaveValue('100');
  await page.screenshot({
    path: 'verification-results/food-analysis-v2-mobile.png',
    fullPage: true
  });

  await page.getByRole('button', { name: /確認加入/ }).click();
  await page.getByRole('button', { name: /食物記錄/ }).click();
  await expect(page.getByText(/110 g/)).toBeVisible();
  await expect(page.getByText('110 ml', { exact: true })).not.toBeVisible();
});
