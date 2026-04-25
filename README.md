# Health Plan v1.8.9

智能熱量與運動追蹤應用程式，由 Gemini AI 驅動。

## 功能特色

- 📱 **飲食記錄** - AI 圖片辨識或手動輸入
- 🏃 **運動追蹤** - 分析 Apple Watch/健身 App 截圖
- 💧 **飲水追蹤** - 視覺化水杯動畫
- ⚖️ **體重管理** - 體重、體脂、肌肉量追蹤
- 📊 **趨勢圖表** - 熱量攝取/消耗趨勢
- 🤖 **AI 教練** - 個人化健康建議

## 技術棧

- **框架**: React 18 + TypeScript
- **建置工具**: Vite 5
- **樣式**: TailwindCSS 3
- **AI**: Google Gemini API (`gemini-3.1-flash-lite-preview`)

## 開發指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器 (預設 http://localhost:3000)
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 執行 ESLint 檢查
npm run lint
```

## 專案結構

```
├── public/              # 靜態資源
│   └── icon.png         # App 圖示
├── src/
│   ├── components/      # React 元件
│   │   ├── charts/      # 圖表元件
│   │   ├── ui/          # UI 元件
│   │   └── Icons.tsx    # SVG 圖示
│   ├── lib/             # 工具函數與常數
│   │   ├── config.ts    # 應用程式設定
│   │   ├── prompts.ts   # AI 提示詞
│   │   └── utils.ts     # 工具函數
│   ├── services/        # API 服務
│   │   └── gemini.ts    # Gemini API
│   ├── types/           # TypeScript 型別
│   ├── styles/          # CSS 樣式
│   ├── App.tsx          # 主應用程式
│   └── main.tsx         # 入口點
├── index.html           # HTML 入口
├── vite.config.ts       # Vite 設定
├── tailwind.config.js   # TailwindCSS 設定
└── package.json         # 專案依賴
```

## 部署說明

### Netlify 拖放部署

1. 執行 `npm run build`
2. 將產生的 `dist/` 資料夾拖放到 [Netlify Drop](https://app.netlify.com/drop)
3. 完成！

### Netlify Git 連接

1. 將專案推送到 GitHub/GitLab
2. 在 Netlify 建立新站點並連接儲存庫
3. 設定建置指令：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Base Path 設定

如果部署在子路徑 (例如 `https://example.com/health/`)：

**方法 1: 環境變數**
```bash
VITE_BASE_PATH=/health/ npm run build
```

**方法 2: 修改 vite.config.ts**
```typescript
export default defineConfig({
  base: '/health/',
  // ...
})
```

### Vercel 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

## API 設定

應用程式需要 Google Gemini API Key 才能使用 AI 功能，目前照片食物辨識模型使用 `gemini-3.1-flash-lite-preview`：

1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 建立 API Key
3. 在應用程式中點擊「SETTING」輸入 API Key

支援多個免費 Key 輪替使用，當額度超過時自動切換。

## 授權

MIT License
