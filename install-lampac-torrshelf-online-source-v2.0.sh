#!/data/data/com.termux/files/usr/bin/bash
# Integrate TorrShelf HTTP into Lampac Online's native source selector.
# The native Online component owns its timeline/history/player lifecycle.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
STATIC_DIR="$LAMPAC_DIR/wwwroot"
OVERRIDE_DIR="$LAMPAC_DIR/plugins/override"
MODULE_INVC="$LAMPAC_DIR/module/LampaWeb/plugins/lampainit-invc.js"
OVERRIDE_INVC="$OVERRIDE_DIR/lampainit-invc.js"
INIT_CONF="$LAMPAC_DIR/init.conf"
SOURCE_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/lampac-torrshelf-online-source-v2.0.js"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v curl >/dev/null 2>&1 || fail 'Không thấy curl.'
command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy Lampac tại $LAMPAC_DIR."
proot-distro login "$DISTRO" -- test -d "$STATIC_DIR" \
  || fail "Không thấy public folder $STATIC_DIR."
proot-distro login "$DISTRO" -- test -f "$MODULE_INVC" \
  || fail "Không thấy $MODULE_INVC."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/5] Kiểm tra TorrShelf HTTP API...\n'
STATUS="$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8787/api/lampa/streams?title=x' || true)"
[ "$STATUS" = '422' ] || fail 'TorrShelf chưa chạy ở cổng 8787. Xem: tail -80 ~/torrshelf.log'

printf '[2/5] Cài TorrShelf Online Source v2.0 vào public wwwroot...\n'
TMP_SOURCE="$(mktemp)"
trap 'rm -f "$TMP_SOURCE"' EXIT
curl -fsSL "$SOURCE_URL" -o "$TMP_SOURCE"
grep -q 'TorrShelf HTTP Online Source v2.0' "$TMP_SOURCE" || fail 'Không tải được plugin Online Source v2.0.'
proot-distro login "$DISTRO" -- bash -c "cat > '$STATIC_DIR/torrshelf-online-source.js'" < "$TMP_SOURCE"
# Older Lampa plugin URLs can remain in client storage. Keep the old URL valid
# but inert so the standalone detail-page button no longer competes with source mode.
proot-distro login "$DISTRO" -- bash -c "cat > '$STATIC_DIR/torrshelf-http-bridge.js'" <<'JS'
/* Retired standalone TorrShelf HTTP button. Online Source v2.0 owns playback. */
JS

printf '[3/5] Chuyển early hook sang Online Source...\n'
proot-distro login "$DISTRO" -- python3 - "$MODULE_INVC" "$OVERRIDE_INVC" "$OVERRIDE_DIR" <<'PY'
import os
import shutil
import sys

base, target, override_dir = sys.argv[1:]
os.makedirs(override_dir, exist_ok=True)
if not os.path.exists(target):
    shutil.copy2(base, target)
if not os.path.exists(target + '.before-online-source-v2.0.bak'):
    shutil.copy2(target, target + '.before-online-source-v2.0.bak')

with open(target, encoding='utf-8') as source:
    text = source.read()
text = text.replace('{localhost}/torrshelf-http-bridge.js?v=1.2', '{localhost}/torrshelf-online-source.js?v=2.0')
if 'TORRSHELF_ONLINE_SOURCE_EARLY_V2' not in text:
    text += '''\n\n/* TORRSHELF_ONLINE_SOURCE_EARLY_V2 */\n(function () {\n  var previousAppLoad = lampainit_invc.appload;\n  lampainit_invc.appload = function appload() {\n    if (typeof previousAppLoad === 'function') previousAppLoad();\n    if (window.Lampa && Lampa.Utils && Lampa.Utils.putScriptAsync) {\n      Lampa.Utils.putScriptAsync(['{localhost}/torrshelf-online-source.js?v=2.0']);\n    }\n  };\n})();\n'''
with open(target, 'w', encoding='utf-8') as output:
    output.write(text)
print('Early hook now loads TorrShelf Online Source v2.0')
PY

printf '[4/5] Đặt TorrShelf vào danh sách Source của Online...\n'
proot-distro login "$DISTRO" -- python3 - "$INIT_CONF" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {
    'listen': {'version': True, 'ip': '0.0.0.0', 'port': 9118, 'scheme': 'http', 'localhost': '127.0.0.1'},
    'LampaWeb': {},
}
if os.path.exists(path):
    try:
        with open(path, encoding='utf-8') as source:
            config = json.load(source)
    except Exception as error:
        raise SystemExit(f'init.conf không phải JSON hợp lệ, không sửa: {error}')
    shutil.copy2(path, path + '.before-online-source-v2.0.bak')
else:
    config = base

lampa = config.setdefault('LampaWeb', {})
plugins = lampa.setdefault('customPlugins', [])
if not isinstance(plugins, list):
    plugins = []
other = [plugin for plugin in plugins if 'torrshelf-http-bridge' not in str(plugin.get('url', '')) and 'torrshelf-online-source' not in str(plugin.get('url', ''))]
# Preserve the no-APK plugin if present, then make the native Online bridge next.
no_apk = [plugin for plugin in other if 'no-apk-force' in str(plugin.get('url', ''))]
other = [plugin for plugin in other if 'no-apk-force' not in str(plugin.get('url', ''))]
lampa['customPlugins'] = no_apk + [
    {'url': '{localhost}/torrshelf-online-source.js?v=2.0', 'status': 1},
] + other

with open(path, 'w', encoding='utf-8') as output:
    json.dump(config, output, ensure_ascii=False, indent=2)
    output.write('\n')
print('TorrShelf HTTP sẽ xuất hiện trong Source của Lampac Online')
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; file đã cập nhật nhưng chưa restart."

printf '[5/5] Restart Lampac và kiểm tra source plugin = HTTP 200...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

for _ in $(seq 1 35); do
  SOURCE_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 'http://127.0.0.1:9118/torrshelf-online-source.js?v=2.0' || true)"
  if [ "$SOURCE_STATUS" = '200' ]; then
    printf '\n[OK] TorrShelf Online Source v2.0 = HTTP 200.\n'
    printf 'Đóng toàn bộ tab Lampa rồi mở lại. Vào Watch online → Source → TorrShelf HTTP.\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Online Source chưa public được (HTTP %s). Log cuối:\n\n' "${SOURCE_STATUS:-?}" >&2
tail -100 "$LOG_FILE" >&2 || true
exit 1
