---
name: mobile-precision-dnd-expert
description: 針對行動裝置設計的頂級開發規範，包含精準觸控拖放、Vercel 現代美學與流暢交互邏輯。
---

# 手機端精準交互與美學開發規範

## 1. 精準拖放實作 (Precise Drag and Drop)
在使用 `dnd-kit` 進行開發時，必須嚴格執行以下優化，以確保在觸控螢幕上的操作精準度：

* **感測器配置 (Sensors Customization)**：
    * 必須優先使用 `PointerSensor` 或專用的 `TouchSensor`。
    * **啟動延遲 (Delay)**：為了區分「捲動頁面」與「開始拖拽」，觸控啟動延遲應設定在 **250ms** 至 **300ms** 之間。
    * **容錯範圍 (Tolerance)**：在延遲時間內，如果手指移動超過 **5px**，則判定為捲動而非拖拽，這能有效防止誤觸。
* **效能優化 (Performance)**：
    * 必須使用 `translate3d` 進行元素位移，以強制啟用手機端的 GPU 硬體加速，確保 60fps 的流暢度。
    * 在拖拽期間，應對非活動元素套用 `will-change: transform`。
* **觸覺與視覺回饋 (Feedback)**：
    * **震動回饋**：成功觸發拖拽時，應調用 `navigator.vibrate(10)` 提供微弱的物理回饋。
    * **佔位符效果**：拖拽物體時，原位置應保留一個具備低透明度（例如 `opacity: 0.3`）的佔位元素。

## 2. 移動端視覺美學 (Mobile Aesthetics)
根據 Vercel 工程文化，手機端的排版應具備以下特徵：

* **層次感 (Elevation)**：
    * 使用多層微弱陰影（Layered Shadows）取代單一深色陰影，營造物體浮動的真實感。
* **圓角邏輯 (Rounding)**：
    * 執行「嵌套圓角（Nested Radii）」規則：外層容器的圓角數值（例如 16px）必須大於內層組件（例如 12px）。
* **觸控目標 (Touch Targets)**：
    * 所有可點擊元件的有效點擊區域（Hit Target）不得小於 **44x44px**。

## 3. 代碼品質要求 (Implementation Standards)
* **無障礙支援**：必須自動為拖放組件添加 `aria-describedby` 說明，確保語音輔助功能正常。
* **響應式佈局**：禁止在代碼中使用固定像素寬度，應優先使用 Tailwind CSS 的百分比或 `vw` 單位。