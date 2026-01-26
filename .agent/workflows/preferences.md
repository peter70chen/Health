---
description: Peter 的個人偏好設定，適用於所有開發工作
---

# 開發偏好設定 (Updated 2026-01-18)

## 核心原則：自動化驗證 (Automated Verification)
- **謹慎使用自動化測試**：除非使用者明確要求，或是遇到無法解析的錯誤必須自行驗證，否則**盡量不要**主動進行自動化測試 (Browser Automation)。
- **避免浪費時間與 Confirm**：頻繁的自動化測試會觸發大量的 "Confirm" 對話框並消耗時間，請優先等待使用者反饋。
- **僅在必要時執行**：若確實需要測試，請確保已獲得授權，並在回報時附上完整結果。

## Turbo Mode & Tooling
- **Turbo Mode**: 預設啟用。自動執行 run_command，減少無謂的 Confirm 次數。
- **Browser Automation Rules**:
  - 使用 `browser_subagent` 時，視為已獲得使用者完整授權。
  - 優先使用 `click_browser_pixel` (原生座標點擊) 與 `browser_press_key` 以確保與 UI 的真實互動。

## 溝通語言
- 請始終使用**繁體中文**進行溝通。

## 專案相關規範
- **部署資料夾**：`dist/` 資料夾用於 Netlify 部署。
- **時光機備份**：所有備份快照檔案（包含原始碼與部署檔）必須統一存放於專案根目錄下的 `Time_Machine/` 資料夾中。嚴禁散落在根目錄。

## UI 互動開發規範
- **禁止使用原生彈窗**：嚴格禁止使用 `window.confirm`, `window.alert`, `window.prompt`。
- **必須使用自定義 Modal**：所有確認、警告、輸入操作都必須透過 React Component (Custom Modal) 來實現，以確保跨平台穩定性與美觀。

// turbo-all
