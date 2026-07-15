# 自動雲端備份（Auto Cloud Backup）設計

日期：2026-07-15
狀態：已由 Peter 核准（方案 B：Netlify Blobs 自動備份 + Mac iCloud 鏡像）

## 背景與目標

Health Plan 的所有資料存在瀏覽器 localStorage，目前備份是手動匯出 JSON 再自己存 iCloud。
目標：**每天自動留下一份備份**，不需要手動操作。

限制：資料只存在使用者裝置（主要是 iPhone）的 localStorage，伺服器無法主動拉取；
Web App 也無法直接寫 iCloud Drive。因此採「App 開啟時自動推送到雲端」+「Mac 排程鏡像到 iCloud」。

## 架構

```
iPhone 開 App（每日首次）
   └─ POST /api/backup  ──▶  Netlify Function ──▶ Netlify Blobs（60 天快照）
                                                        ▲
Home Mac LaunchAgent（每日 09:00）                        │
   └─ GET /api/backup?latest ───────────────────────────┘
        └─ 存 iCloud Drive/HealthBackup/（保留 30 份）＋失敗 Telegram 通知
```

## 元件

### 1. Netlify Function：`netlify/functions/backup.mts`

- 使用 `@netlify/blobs` 的 `getStore('backups')`。
- 驗證：所有請求須帶 `x-backup-token` header，與環境變數 `BACKUP_TOKEN` 相符，否則 401。
  `BACKUP_TOKEN` 未設定時一律 503（避免未配置就裸奔）。
- 操作：
  - `POST /api/backup` body = 備份 JSON（與手動匯出格式相同）。
    - key 為 `YYYY-MM-DD.json`（日期由 client 在 body 帶 `date` 欄位？否——由 server 以 UTC+8 台灣時間計算當日日期，避免 client 時鐘錯亂）。
    - 同日重複上傳直接覆蓋（保留當天最新）。
    - 寫入後清理：列出全部 key，保留最新 60 份，其餘刪除。
    - 大小上限 5 MB，超過拒收（413）。
  - `GET /api/backup?list` → `[{ key, date }]`（依日期新→舊）。
  - `GET /api/backup?date=YYYY-MM-DD` → 該日快照 JSON；不存在 404。
  - `GET /api/backup?latest` → 最新一份快照 JSON（給 Mac 鏡像用），並在 header `x-backup-date` 標明日期。
- `netlify.toml` 加 `[[redirects]] /api/backup → /.netlify/functions/backup`（status 200，
  且必須放在既有 SPA catch-all 之前）。

### 2. App 端

#### `src/hooks/useCloudBackup.ts`（新檔）

- 設定存放：localStorage key `mj_backup_settings`（`{ token: string }`），加進 `STORAGE_KEYS`。
- 上次成功備份日期：localStorage key `mj_last_cloud_backup`（`YYYY-MM-DD`）。
- 自動備份：App hydrate 完成後（`loading === false`），若
  `token 已設` 且 `navigator.onLine` 且 `mj_last_cloud_backup !== 今天（台灣時間）`
  → POST 備份（資料經既有 sanitize，與手動匯出同格式）。
  - 成功：記錄今天日期，statusMessage 顯示「已自動備份到雲端 ✓」。
  - 失敗：console.warn，不打擾使用者，下次開啟再試。
- 提供給 UI：`backupNow()`（手動備份，成功/失敗都顯示 statusMessage）、
  `listSnapshots()`、`fetchSnapshot(date)`。

#### SettingsPanel 雲端備份區塊

- Token 輸入欄（password type，跟 API keys 同儲存習慣，按「儲存設定」時一併存）。
- 「立即備份」按鈕。
- 「雲端還原」：展開快照清單（日期），點選某天 → 下載該快照 →
  重用既有匯入確認流程（顯示筆數摘要 → window.confirm → 匯入）。
  實作方式：把 `useImportExport` 的解析+確認+套用邏輯抽成可重用函式
  `applyImportedData(rawJson: string)`，檔案匯入與雲端還原共用。

### 3. Mac 端 iCloud 鏡像（不在 repo build 內，屬部署腳本）

- `scripts/icloud-mirror.sh`（進 repo，供兩台 Mac 安裝）：
  - `curl -H "x-backup-token: $TOKEN" "$SITE/api/backup?latest"` →
    存 `~/Library/Mobile Documents/com~apple~CloudDocs/HealthBackup/PeterPlan_Backup_<date>.json`
    （date 取自 `x-backup-date` header；同日覆蓋）。
  - 清理：資料夾內保留最新 30 份。
  - 失敗（curl 非 0 / HTTP 非 200 / JSON 不合法）→ 用既有 telegram 通知方式
    （讀 `~/.claude/channels/telegram/.env` 的 bot token，sendMessage 到 chat 1898275512）。
  - token 與 site URL 讀自 `~/.config/health-backup.env`（不進 git）。
- LaunchAgent plist：`com.peter.health-icloud-mirror`，每日 09:00，只裝在 Home Mac。

## 錯誤處理

- Function：try/catch 包全部，錯誤回 500 + `{ error }`；不回傳 stack。
- App 自動備份失敗靜默（console 留痕），手動備份失敗顯示紅色 statusMessage。
- 還原流程沿用既有的筆數摘要 + confirm，取消不動資料。
- Mac 鏡像：任何失敗都 Telegram 通知（含錯誤摘要），成功不通知。

## 安全

- `BACKUP_TOKEN` 只存在：Netlify 環境變數、Peter 手機 App 的 localStorage、
  Mac 的 `~/.config/health-backup.env`。不進 git。
- 快照內容含健康資料與 Gemini keys？——**不含**：備份格式沿用手動匯出的 ExportData，
  本來就不含 `apiKeys`，維持不變。

## 測試

- `npm run lint` + `npm run build`（tsc）必須乾淨。
- Function 邏輯：`netlify dev` 本地起，curl 驗證 401/POST/list/date/latest/覆蓋/清理。
- App 端：瀏覽器手動驗證——設 token → 重整 → 自動備份提示；設定頁立即備份、
  快照清單、還原確認流程。
- 鏡像腳本：手動跑一次驗證 iCloud 檔案落地與清理邏輯。

## 不做的事（YAGNI）

- 不做多使用者/帳號系統（單人 App，token 即身分）。
- 不做備份加密（Netlify Blobs 私有、token 保護，資料不含 API keys）。
- 不做「固定時刻」備份（技術上不可行，App 開啟即備份已滿足每日一份）。
- 不動既有手動匯出/匯入功能。
