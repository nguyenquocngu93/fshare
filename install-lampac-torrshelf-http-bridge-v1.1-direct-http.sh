#!/data/data/com.termux/files/usr/bin/bash
# Deploy the TorrShelf v1.1 direct-HTTP bridge into an existing Lampac install.
# Requires a running TorrShelf v1.6.13+ at http://127.0.0.1:8787.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
PLUGIN_DIR="$LAMPAC_DIR/plugins/override"
PLUGIN_PATH="$PLUGIN_DIR/torrshelf-http-bridge.js"
CONFIG_PATH="$LAMPAC_DIR/init.conf"
PLUGIN_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/lampac-torrshelf-http-bridge-v1.1.js"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro.'
command -v curl >/dev/null 2>&1 || fail 'Không thấy curl.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy Lampac tại $LAMPAC_DIR trong Ubuntu."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/4] Kiểm tra TorrShelf HTTP API...\n'
STATUS="$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8787/api/lampa/streams?title=x' || true)"
[ "$STATUS" = '422' ] || fail 'TorrShelf chưa chạy hoặc chưa có /api/lampa/streams. Hãy cài TorrShelf v1.6.13+ trước.'

printf '[2/4] Chép plugin TorrShelf HTTP v1.1 vào Lampac...\n'
TMP_PLUGIN="$(mktemp)"
trap 'rm -f "$TMP_PLUGIN"' EXIT
curl -fsSL "$PLUGIN_URL" -o "$TMP_PLUGIN"
grep -q 'TorrShelf HTTP Bridge v1.1' "$TMP_PLUGIN" || fail 'Không tải được đúng file plugin v1.1.'
proot-distro login "$DISTRO" -- mkdir -p "$PLUGIN_DIR"
proot-distro login "$DISTRO" -- bash -c "cat > '$PLUGIN_PATH'" < "$TMP_PLUGIN"

printf '[3/4] Bật plugin trong init.conf...\n'
proot-distro login "$DISTRO" -- python3 - "$CONFIG_PATH" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {
    "listen": {"version": True, "ip": "0.0.0.0", "port": 9118, "scheme": "http", "localhost": "127.0.0.1"},
    "LampaWeb": {},
}
if os.path.exists(path):
    try:
        with open(path, encoding="utf-8") as source:
            config = json.load(source)
    except Exception as error:
        raise SystemExit(f"init.conf không phải JSON hợp lệ, không sửa: {error}")
    shutil.copy2(path, path + ".before-torrshelf-http-v1.1.bak")
else:
    config = base

lampa = config.setdefault("LampaWeb", {})
plugins = lampa.setdefault("customPlugins", [])
if not isinstance(plugins, list):
    plugins = []
plugins = [plugin for plugin in plugins if "torrshelf-http-bridge" not in str(plugin.get("url", ""))]
plugins.append({"url": "{localhost}/torrshelf-http-bridge.js?v=1.1", "status": 1})
lampa["customPlugins"] = plugins

with open(path, "w", encoding="utf-8") as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write("\n")
print("TorrShelf HTTP v1.1 enabled")
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; plugin đã chép nhưng chưa restart."

printf '[4/4] Khởi động lại Lampac...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

for _ in $(seq 1 30); do
  if curl -fsS 'http://127.0.0.1:9118/torrshelf-http-bridge.js?v=1.1' 2>/dev/null | grep -q 'TorrShelf HTTP Bridge v1.1'; then
    printf '\n[OK] Bridge HTTP đã được Lampac nạp.\n'
    printf 'Đóng tab Lampa cũ, mở lại http://127.0.0.1:9118 rồi vào chi tiết phim.\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Không kiểm tra được plugin. Log cuối:\n\n' >&2
tail -80 "$LOG_FILE" >&2 || true
exit 1
