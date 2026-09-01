#!/data/data/com.termux/files/usr/bin/bash
# Repair the Lampac/Lampa direct HTTP bridge after a popup or missing button.
# - replaces the old No APK v2 browser override with v3
# - injects both plugins before Lampa's app-ready lifecycle
# - preserves TorrServer, GStreamer, and all unrelated custom plugins
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
PLUGIN_DIR="$LAMPAC_DIR/plugins/override"
INIT_CONF="$LAMPAC_DIR/init.conf"
INVC_PATH="$LAMPAC_DIR/module/LampaWeb/plugins/lampainit-invc.js"
NO_APK_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/lampac-no-apk-force-v3.js"
BRIDGE_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/lampac-torrshelf-http-bridge-v1.2.js"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || fail 'Không thấy curl.'
command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy Lampac tại $LAMPAC_DIR."
proot-distro login "$DISTRO" -- test -f "$INVC_PATH" \
  || fail "Không thấy $INVC_PATH; không dám vá sai file."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/5] Kiểm tra TorrShelf HTTP API...\n'
STATUS="$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8787/api/lampa/streams?title=x' || true)"
[ "$STATUS" = '422' ] || fail 'TorrShelf chưa chạy ở cổng 8787. Chạy setup nguồn trước hoặc gửi log ~/torrshelf.log.'

printf '[2/5] Tải No APK v3 và bridge HTTP v1.2...\n'
TMP_NOAPK="$(mktemp)"
TMP_BRIDGE="$(mktemp)"
trap 'rm -f "$TMP_NOAPK" "$TMP_BRIDGE"' EXIT
curl -fsSL "$NO_APK_URL" -o "$TMP_NOAPK"
curl -fsSL "$BRIDGE_URL" -o "$TMP_BRIDGE"
grep -q 'No APK Force v3' "$TMP_NOAPK" || fail 'Không tải được No APK v3.'
grep -q 'TorrShelf HTTP Bridge v1.2' "$TMP_BRIDGE" || fail 'Không tải được bridge v1.2.'
proot-distro login "$DISTRO" -- mkdir -p "$PLUGIN_DIR"
proot-distro login "$DISTRO" -- bash -c "cat > '$PLUGIN_DIR/no-apk-force.js'" < "$TMP_NOAPK"
proot-distro login "$DISTRO" -- bash -c "cat > '$PLUGIN_DIR/torrshelf-http-bridge.js'" < "$TMP_BRIDGE"

printf '[3/5] Nạp plugin trước khi màn hình Lampa sẵn sàng...\n'
proot-distro login "$DISTRO" -- bash -s -- "$INVC_PATH" <<'JS'
set -e
TARGET="$1"
if [ ! -f "${TARGET}.before-http-sources-v1.0.bak" ]; then
  cp "$TARGET" "${TARGET}.before-http-sources-v1.0.bak"
fi
if ! grep -q 'TORRSHELF_HTTP_EARLY_HOOK_V1' "$TARGET"; then
  cat >> "$TARGET" <<'INVC'

/* TORRSHELF_HTTP_EARLY_HOOK_V1 — appended without replacing existing hooks. */
(function () {
  var previousAppLoad = lampainit_invc.appload;
  lampainit_invc.appload = function appload() {
    if (typeof previousAppLoad === 'function') previousAppLoad();
    if (window.Lampa && Lampa.Utils && Lampa.Utils.putScriptAsync) {
      Lampa.Utils.putScriptAsync([
        '{localhost}/no-apk-force.js?v=3',
        '{localhost}/torrshelf-http-bridge.js?v=1.2'
      ]);
    }
  };
})();
INVC
fi
JS

printf '[4/5] Cập nhật init.conf, giữ nguyên các plugin khác...\n'
proot-distro login "$DISTRO" -- python3 - "$INIT_CONF" <<'PY'
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
    shutil.copy2(path, path + ".before-http-sources-v1.0.bak")
else:
    config = base

lampa = config.setdefault("LampaWeb", {})
plugins = lampa.setdefault("customPlugins", [])
if not isinstance(plugins, list):
    plugins = []
other = [plugin for plugin in plugins if "no-apk-force" not in str(plugin.get("url", "")) and "torrshelf-http-bridge" not in str(plugin.get("url", ""))]
lampa["customPlugins"] = [
    {"url": "{localhost}/no-apk-force.js?v=3", "status": 1},
    {"url": "{localhost}/torrshelf-http-bridge.js?v=1.2", "status": 1},
] + other

with open(path, "w", encoding="utf-8") as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write("\n")
print("No APK v3 và TorrShelf HTTP v1.2 đã được ưu tiên nạp")
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; file đã cập nhật nhưng chưa restart."

printf '[5/5] Khởi động lại Lampac và kiểm tra file plugin...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

for _ in $(seq 1 35); do
  if curl -fsS 'http://127.0.0.1:9118/no-apk-force.js?v=3' 2>/dev/null | grep -q 'No APK Force v3' \
    && curl -fsS 'http://127.0.0.1:9118/torrshelf-http-bridge.js?v=1.2' 2>/dev/null | grep -q 'TorrShelf HTTP Bridge v1.2'; then
    printf '\n[OK] Popup bypass v3 và nút TorrShelf HTTP v1.2 đã được Lampac serve.\n'
    printf 'Đóng toàn bộ tab 127.0.0.1:9118, rồi mở mới http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Lampac chưa serve đủ plugin. Log cuối:\n\n' >&2
tail -100 "$LOG_FILE" >&2 || true
exit 1
