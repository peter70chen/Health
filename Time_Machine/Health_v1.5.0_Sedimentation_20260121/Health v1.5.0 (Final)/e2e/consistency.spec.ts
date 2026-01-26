import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TARGET_NAME = process.env.TARGET_NAME || 'legacy';
const OUTPUT_DIR = path.join(process.cwd(), 'verification-results', TARGET_NAME);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

test.describe('Consistency Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Clear local storage before each test to ensure clean state
        await page.goto(BASE_URL);
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    const captureState = async (page: any, stepName: string) => {
        // 1. Screenshot
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${stepName}.png`), fullPage: true });

        // 2. LocalStorage Dump
        const storage = await page.evaluate(() => JSON.stringify(localStorage));
        fs.writeFileSync(path.join(OUTPUT_DIR, `${stepName}.json`), storage);

        // 3. DOM Snapshot (Key Text Content)
        const domSnapshot = await page.evaluate(() => {
            const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || 'N/A';
            return {
                title: document.title,
                // Adjust selectors for specific elements if needed
                // Example: Total Calories display, remaining calories, etc.
                // We'll rely on generic structure or specific class names found in Legacy
                remaining: document.querySelector('div.text-5xl')?.innerText || 'N/A', // Legacy has remaining cal in 5xl div
            };
        });
        fs.writeFileSync(path.join(OUTPUT_DIR, `${stepName}_dom.json`), JSON.stringify(domSnapshot, null, 2));
    };

    test('01_Initialization_Defaults', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page).toHaveTitle(/Health Plan/i);

        // Wait for hydration/render
        await page.waitForTimeout(1000);

        await captureState(page, '01_init');
    });

    test('02_Data_Input_Weight', async ({ page }) => {
        await page.goto(BASE_URL);

        // 1. Navigate to Weight Tab
        // Legacy: "體重與劑量", Vite: "體重與劑量"
        const weightTab = page.locator('button', { hasText: '體重' }).first();
        await weightTab.click();

        // 2. Input Weight
        // Legacy/Vite: input type="number", placeholder="0.0" (inside the form)
        const weightInput = page.locator('input[type="number"][placeholder="0.0"]').first();
        await expect(weightInput).toBeVisible();
        await weightInput.fill('75.5');

        // 3. Handle Submit
        // Legacy has alert("已儲存"), Vite has status overlay.
        // We register dialog handler for Legacy.
        page.on('dialog', async dialog => {
            await dialog.dismiss();
        });

        // Click "儲存記錄"
        const saveBtn = page.locator('button', { hasText: '儲存記錄' });
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();

        // Wait for save operation/state update
        await page.waitForTimeout(1500);
        await captureState(page, '02_weight_saved');
    });

});
