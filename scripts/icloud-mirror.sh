#!/bin/zsh
# ─────────────────────────────────────────────────────────────
# Health Plan 雲端備份 → iCloud Drive 每日鏡像
#
# 從 Netlify 備份 API 抓最新快照，存到 iCloud Drive/HealthBackup/，
# 保留最近 30 份。任何失敗都發 Telegram 通知（成功不通知）。
#
# 設定檔 ~/.config/health-backup.env（不進 git）需含：
#   SITE_URL=https://<site>.netlify.app
#   BACKUP_TOKEN=<與 Netlify 環境變數 BACKUP_TOKEN 相同>
#
# 由 LaunchAgent com.peter.health-icloud-mirror 每日 09:00 執行。
# ─────────────────────────────────────────────────────────────
set -u

CONFIG="$HOME/.config/health-backup.env"
DEST_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/HealthBackup"
TELEGRAM_ENV="$HOME/.claude/channels/telegram/.env"
CHAT_ID="1898275512"
KEEP=30

notify_fail() {
    local msg="Health 備份 iCloud 鏡像失敗：$1"
    echo "$msg" >&2
    if [ -f "$TELEGRAM_ENV" ]; then
        # shellcheck disable=SC1090
        source "$TELEGRAM_ENV"
        if [ -n "${TELEGRAM_BOT_TOKEN:-}" ]; then
            curl -sS -m 15 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                --data-urlencode "chat_id=${CHAT_ID}" \
                --data-urlencode "text=${msg}" > /dev/null 2>&1
        fi
    fi
    exit 1
}

[ -f "$CONFIG" ] || notify_fail "找不到設定檔 $CONFIG"
# shellcheck disable=SC1090
source "$CONFIG"
[ -n "${SITE_URL:-}" ] || notify_fail "設定檔缺 SITE_URL"
[ -n "${BACKUP_TOKEN:-}" ] || notify_fail "設定檔缺 BACKUP_TOKEN"

mkdir -p "$DEST_DIR" || notify_fail "無法建立資料夾 $DEST_DIR"

TMP_BODY=$(mktemp)
TMP_HDR=$(mktemp)
trap 'rm -f "$TMP_BODY" "$TMP_HDR"' EXIT

HTTP_CODE=$(curl -sS -m 60 -w '%{http_code}' -o "$TMP_BODY" -D "$TMP_HDR" \
    -H "x-backup-token: ${BACKUP_TOKEN}" \
    "${SITE_URL%/}/api/backup?latest") || notify_fail "curl 連線失敗"

# 雲端還沒有任何備份（App 尚未設定 token）屬正常狀態，不發告警
if [ "$HTTP_CODE" = "404" ]; then
    echo "SKIP: 雲端尚無備份（HTTP 404），跳過本次鏡像"
    exit 0
fi
[ "$HTTP_CODE" = "200" ] || notify_fail "API 回應 HTTP $HTTP_CODE"

# 驗證是合法 JSON
python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$TMP_BODY" 2>/dev/null \
    || notify_fail "下載內容不是合法 JSON"

# 從 response header 取備份日期；取不到就用今天
BACKUP_DATE=$(awk 'tolower($1) == "x-backup-date:" {gsub(/\r/,"",$2); print $2}' "$TMP_HDR")
[ -n "$BACKUP_DATE" ] || BACKUP_DATE=$(date +%Y-%m-%d)

DEST_FILE="$DEST_DIR/PeterPlan_Backup_${BACKUP_DATE}.json"
cp "$TMP_BODY" "$DEST_FILE" || notify_fail "寫入 $DEST_FILE 失敗"

# 清理：只保留最新 KEEP 份
STALE=$(ls -1 "$DEST_DIR"/PeterPlan_Backup_*.json 2>/dev/null | sort -r | tail -n "+$((KEEP + 1))")
if [ -n "$STALE" ]; then
    echo "$STALE" | while IFS= read -r f; do rm -f "$f"; done
fi

echo "OK: $DEST_FILE ($(wc -c < "$TMP_BODY" | tr -d ' ') bytes)"
