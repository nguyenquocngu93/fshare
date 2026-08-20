#!/data/data/com.termux/files/usr/bin/bash
# Native integration for NB557 Online Mod v3.1:
# patch its own source registry so TorrShelf HTTP is rendered by Online Mod's
# original card list, filters, Lampa.Player and Lampa.Timeline flow.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
STATIC_DIR="$LAMPAC_DIR/wwwroot"
OVERRIDE_DIR="$LAMPAC_DIR/plugins/override"
MODULE_INVC="$LAMPAC_DIR/module/LampaWeb/plugins/lampainit-invc.js"
OVERRIDE_INVC="$OVERRIDE_DIR/lampainit-invc.js"
INIT_CONF="$LAMPAC_DIR/init.conf"
ONLINE_MOD_URL="${ONLINE_MOD_URL:-https://nb557.github.io/plugins/online_mod.js}"
ONLINE_MOD_FALLBACK_URL="${ONLINE_MOD_FALLBACK_URL:-https://raw.githubusercontent.com/prog-prod/online_mod/main/online_mod.js}"
INJECTION_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/online-mod-torrshelf-native-injection-v3.js"
LOCAL_ONLINE_URL="{localhost}/online_mod-torrshelf.js?v=3.0"
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

printf '\n[1/6] Kiểm tra TorrShelf HTTP API...\n'
STATUS="$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8787/api/lampa/streams?title=x' || true)"
[ "$STATUS" = '422' ] || fail 'TorrShelf chưa chạy ở cổng 8787. Xem: tail -80 ~/torrshelf.log'

printf '[2/6] Tải Online Mod gốc và mã source TorrShelf...\n'
TMP_ONLINE="$(mktemp)"
TMP_INJECTION="$(mktemp)"
trap 'rm -f "$TMP_ONLINE" "$TMP_INJECTION"' EXIT
if ! curl -fsSL --retry 2 "$ONLINE_MOD_URL" -o "$TMP_ONLINE"; then
  printf '      Không tải được nguồn NB557, dùng bản mirror dự phòng...\n'
  curl -fsSL --retry 2 "$ONLINE_MOD_FALLBACK_URL" -o "$TMP_ONLINE" || fail 'Không tải được Online Mod.'
fi
curl -fsSL "$INJECTION_URL" -o "$TMP_INJECTION"
grep -q 'function component(object)' "$TMP_ONLINE" || fail 'Online Mod không đúng định dạng để vá an toàn.'
grep -q 'TORRSHELF_HTTP_ONLINE_MOD_NATIVE_V3' "$TMP_INJECTION" || fail 'Không tải được native source patch.'

printf '[3/6] Vá Online Mod để TorrShelf là source thật...\n'
proot-distro login "$DISTRO" -- mkdir -p "$STATIC_DIR/.torrshelf-patch" "$OVERRIDE_DIR"
proot-distro login "$DISTRO" -- bash -c "cat > '$STATIC_DIR/.torrshelf-patch/online_mod.js'" < "$TMP_ONLINE"
proot-distro login "$DISTRO" -- bash -c "cat > '$STATIC_DIR/.torrshelf-patch/injection.js'" < "$TMP_INJECTION"
proot-distro login "$DISTRO" -- python3 - "$STATIC_DIR/.torrshelf-patch/online_mod.js" "$STATIC_DIR/.torrshelf-patch/injection.js" "$STATIC_DIR/online_mod-torrshelf.js" <<'PY'
from pathlib import Path
import sys

source_path, injection_path, output_path = map(Path, sys.argv[1:])
source = source_path.read_text(encoding='utf-8')
injection = injection_path.read_text(encoding='utf-8')
component_anchor = '    function component(object) {'
source_anchor = '      var obj_filter_sources = all_sources.filter(function (s) {'
if component_anchor not in source or source_anchor not in source:
    raise SystemExit('Không tìm thấy điểm vá Online Mod; dừng để tránh làm hỏng plugin.')
if 'TORRSHELF_HTTP_ONLINE_MOD_NATIVE_V3' not in source:
    source = source.replace(component_anchor, injection + '\n\n' + component_anchor, 1)
source_entry = '''      all_sources.push({
        name: 'torrshelf_http',
        title: 'TorrShelf HTTP',
        source: new torrshelf_http(this, object),
        search: true,
        kp: false,
        imdb: false
      });

'''
if "name: 'torrshelf_http'" not in source:
    source = source.replace(source_anchor, source_entry + source_anchor, 1)
output_path.write_text(source, encoding='utf-8')
print('Native Online Mod source patched:', output_path)
PY
proot-distro login "$DISTRO" -- rm -rf "$STATIC_DIR/.torrshelf-patch"

printf '[4/6] Tắt bridge modal cũ, giữ No APK...\n'
# Existing stored URLs may still load this filename. Make it inert rather than 404.
proot-distro login "$DISTRO" -- bash -c "cat > '$STATIC_DIR/torrshelf-online-source.js'" <<'JS'
/* Retired modal bridge. Native Online Mod source v3.0 owns TorrShelf playback. */
JS
proot-distro login "$DISTRO" -- python3 - "$INIT_CONF" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {'listen': {'version': True, 'ip': '0.0.0.0', 'port': 9118, 'scheme': 'http', 'localhost': '127.0.0.1'}, 'LampaWeb': {}}
if os.path.exists(path):
    try:
        with open(path, encoding='utf-8') as source:
            config = json.load(source)
    except Exception as error:
        raise SystemExit(f'init.conf không phải JSON hợp lệ, không sửa: {error}')
    shutil.copy2(path, path + '.before-native-online-mod-v3.0.bak')
else:
    config = base
lampa = config.setdefault('LampaWeb', {})
plugins = lampa.setdefault('customPlugins', [])
if not isinstance(plugins, list):
    plugins = []
# The patched Online Mod itself comes from Lampa.Plugins storage; do not load
# the former modal bridge as an additional custom plugin.
lampa['customPlugins'] = [p for p in plugins if 'torrshelf-online-source' not in str(p.get('url', '')) and 'torrshelf-http-bridge' not in str(p.get('url', ''))]
with open(path, 'w', encoding='utf-8') as output:
    json.dump(config, output, ensure_ascii=False, indent=2)
    output.write('\n')
print('Old TorrShelf modal bridge disabled from Lampac customPlugins')
PY

printf '[5/6] Đổi URL Online Mod đang lưu trong Lampa sang bản local đã vá...\n'
proot-distro login "$DISTRO" -- python3 - "$MODULE_INVC" "$OVERRIDE_INVC" "$OVERRIDE_DIR" <<'PY'
import os
import shutil
import sys

base, target, override_dir = sys.argv[1:]
os.makedirs(override_dir, exist_ok=True)
if not os.path.exists(target):
    shutil.copy2(base, target)
if not os.path.exists(target + '.before-native-online-mod-v3.0.bak'):
    shutil.copy2(target, target + '.before-native-online-mod-v3.0.bak')
with open(target, encoding='utf-8') as source:
    text = source.read()
if 'TORRSHELF_NATIVE_ONLINE_MOD_URL_V3' not in text:
    text += '''\n\n/* TORRSHELF_NATIVE_ONLINE_MOD_URL_V3 */\n(function () {\n  var previousAppLoad = lampainit_invc.appload;\n  lampainit_invc.appload = function appload() {\n    if (typeof previousAppLoad === 'function') previousAppLoad();\n    if (!(window.Lampa && Lampa.Plugins && Lampa.Plugins.get && Lampa.Plugins.save)) return;\n    var localUrl = '{localhost}/online_mod-torrshelf.js?v=3.0';\n    var plugins = Lampa.Plugins.get() || [];\n    var changed = false;\n    plugins.forEach(function (plugin) {\n      var url = String(plugin && plugin.url || '');\n      if (/online_mod\\.js/i.test(url) && url.indexOf('online_mod-torrshelf.js') === -1) {\n        try { Lampa.Storage.set('torrshelf_online_mod_original_url', url); } catch (error) {}\n        plugin.url = localUrl;\n        changed = true;\n      }\n    });\n    if (changed) {\n      Lampa.Plugins.save();\n      try {\n        if (!sessionStorage.getItem('torrshelf_online_mod_native_v3_reload')) {\n          sessionStorage.setItem('torrshelf_online_mod_native_v3_reload', '1');\n          setTimeout(function () { window.location.reload(); }, 350);\n        }\n      } catch (error) { setTimeout(function () { window.location.reload(); }, 350); }\n    }\n  };\n})();\n'''
with open(target, 'w', encoding='utf-8') as output:
    output.write(text)
print('Lampa will replace its stored online_mod.js URL with the patched local URL once')
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; file đã cập nhật nhưng chưa restart."

printf '[6/6] Restart Lampac và kiểm tra Online Mod đã vá = HTTP 200...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

VERIFY_FILE="$(mktemp)"
trap 'rm -f "$TMP_ONLINE" "$TMP_INJECTION" "$VERIFY_FILE"' EXIT
for _ in $(seq 1 35); do
  PATCH_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 'http://127.0.0.1:9118/online_mod-torrshelf.js?v=3.0' || true)"
  if [ "$PATCH_STATUS" = '200' ]; then
    # Do not pipe a ~500 KB JS file into grep -q: grep exits early and curl
    # reports a harmless broken pipe as exit 23. Verify from a temp file instead.
    if curl -fsS --max-time 12 -o "$VERIFY_FILE" 'http://127.0.0.1:9118/online_mod-torrshelf.js?v=3.0' && grep -q 'TORRSHELF_HTTP_ONLINE_MOD_NATIVE_V3' "$VERIFY_FILE"; then
      printf '\n[OK] Patched Online Mod native source = HTTP 200.\n'
      printf 'Đóng hoàn toàn Lampa, mở lại; lần đầu app sẽ tự reload để đổi URL plugin.\n'
      exit 0
    fi
  fi
  sleep 1
done

printf '\n[ERROR] Online Mod đã vá chưa public được (HTTP %s). Log cuối:\n\n' "${PATCH_STATUS:-?}" >&2
tail -100 "$LOG_FILE" >&2 || true
exit 1
