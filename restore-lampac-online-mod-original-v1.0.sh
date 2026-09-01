#!/data/data/com.termux/files/usr/bin/bash
# Restore the user's original Online Mod URL after experimenting with a local
# patched copy. This does not delete Lampac, TorrShelf, or user settings.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
OVERRIDE_DIR="$LAMPAC_DIR/plugins/override"
MODULE_INVC="$LAMPAC_DIR/module/LampaWeb/plugins/lampainit-invc.js"
OVERRIDE_INVC="$OVERRIDE_DIR/lampainit-invc.js"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy Lampac tại $LAMPAC_DIR."
proot-distro login "$DISTRO" -- test -f "$MODULE_INVC" \
  || fail "Không thấy $MODULE_INVC."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/3] Khôi phục URL Online Mod gốc trong Lampa...\n'
proot-distro login "$DISTRO" -- python3 - "$MODULE_INVC" "$OVERRIDE_INVC" "$OVERRIDE_DIR" <<'PY'
import os
import re
import shutil
import sys

base, target, override_dir = sys.argv[1:]
os.makedirs(override_dir, exist_ok=True)
if not os.path.exists(target):
    shutil.copy2(base, target)
if not os.path.exists(target + '.before-restore-online-mod-v1.bak'):
    shutil.copy2(target, target + '.before-restore-online-mod-v1.bak')
with open(target, encoding='utf-8') as source:
    text = source.read()
# Remove only the experimental v3 local-Online-Mod migration block.
text = re.sub(r'\n?/\* TORRSHELF_NATIVE_ONLINE_MOD_URL_V3 \*/.*?\n\}\)\(\);\n', '\n', text, flags=re.S)
if 'TORRSHELF_RESTORE_ONLINE_MOD_ORIGINAL_V1' not in text:
    text += '''\n\n/* TORRSHELF_RESTORE_ONLINE_MOD_ORIGINAL_V1 */\n(function () {\n  var previousAppLoad = lampainit_invc.appload;\n  lampainit_invc.appload = function appload() {\n    if (typeof previousAppLoad === 'function') previousAppLoad();\n    if (!(window.Lampa && Lampa.Plugins && Lampa.Plugins.get && Lampa.Plugins.save)) return;\n    var originalUrl = Lampa.Storage.get('torrshelf_online_mod_original_url', '') || 'https://nb557.github.io/plugins/online_mod.js';\n    var plugins = Lampa.Plugins.get() || [];\n    var changed = false;\n    plugins.forEach(function (plugin) {\n      if (plugin && /online_mod-torrshelf\\.js/i.test(String(plugin.url || ''))) {\n        plugin.url = originalUrl;\n        changed = true;\n      }\n    });\n    if (changed) {\n      Lampa.Plugins.save();\n      try {\n        if (!sessionStorage.getItem('torrshelf_online_mod_restore_v1_reload')) {\n          sessionStorage.setItem('torrshelf_online_mod_restore_v1_reload', '1');\n          setTimeout(function () { window.location.reload(); }, 350);\n        }\n      } catch (error) { setTimeout(function () { window.location.reload(); }, 350); }\n    }\n  };\n})();\n'''
with open(target, 'w', encoding='utf-8') as output:
    output.write(text)
print('Original Online Mod restore hook enabled')
PY

printf '[2/3] Restart Lampac...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

printf '[3/3] Chờ web Lampac...\n'
for _ in $(seq 1 25); do
  if curl -fsS --max-time 3 http://127.0.0.1:9118/ >/dev/null 2>&1; then
    printf '\n[OK] Đã đặt khôi phục Online Mod gốc.\n'
    printf 'Đóng hẳn Lampa rồi mở lại; app sẽ tự reload một lần nếu cần.\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Lampac chưa lên. Log cuối:\n\n' >&2
tail -100 "$LOG_FILE" >&2 || true
exit 1
