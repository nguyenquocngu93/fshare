#!/data/data/com.termux/files/usr/bin/bash
# Restore the Lampac NextGen GStreamer module in an existing Termux/proot Ubuntu.
# Based on Rugaroo888/lampacng's Debian package list (same GStreamer code as
# lampac-nextgen upstream), without its systemd/native-Linux installer.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
GST_REPO="${GST_REPO:-https://github.com/Rugaroo888/lampacng.git}"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"
BACKUP_CONF=""

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

restore_lampac_after_failure() {
  local reason="$1"
  printf '\n[ROLLBACK] %s\n' "$reason" >&2
  if [ -n "$BACKUP_CONF" ] && proot-distro login "$DISTRO" -- test -f "$BACKUP_CONF"; then
    proot-distro login "$DISTRO" -- cp "$BACKUP_CONF" "$LAMPAC_DIR/init.conf" || true
  fi
  # Even an old config can be missing SkipModules. Explicitly skip the restored
  # module on rollback so Lampac itself can come back up.
  proot-distro login "$DISTRO" -- python3 - "$LAMPAC_DIR/init.conf" <<'PY' || true
import json, os, sys
path = sys.argv[1]
try:
    config = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
except Exception:
    config = {}
base = config.setdefault('BaseModule', {})
skip = base.get('SkipModules', [])
if not isinstance(skip, list): skip = []
if not any(str(x).lower() == 'gstreamer' for x in skip): skip.append('GStreamer')
base['SkipModules'] = skip
with open(path, 'w', encoding='utf-8') as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write('\n')
PY
  proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
  sleep 1
  nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &
  printf 'GStreamer đã được tắt lại để Lampac không bị kẹt. Log: tail -100 %s\n' "$LOG_FILE" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro. Hãy chạy ở Termux gốc.'
command -v curl >/dev/null 2>&1 || fail 'Không thấy curl.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy $LAMPAC_DIR/Core.dll trong Ubuntu."
proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Không thấy $LAMPAC_DIR/start.sh."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/6] Kiểm tra tương thích Core/.NET...\n'
TFM="$(proot-distro login "$DISTRO" -- python3 - "$LAMPAC_DIR/Core.runtimeconfig.json" <<'PY'
import json, sys
try:
    print(json.load(open(sys.argv[1], encoding='utf-8')).get('runtimeOptions', {}).get('tfm', ''))
except Exception:
    pass
PY
)"
case "$TFM" in
  net10.*) ;;
  *) fail "Core hiện tại target '$TFM', không phải .NET 10. Không trộn module GStreamer NextGen vào bản này." ;;
esac

printf '[2/6] Cài GStreamer runtime Debian (không dùng systemd)...\n'
proot-distro login "$DISTRO" -- bash -s <<'SH'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends \
  ca-certificates git \
  libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
  gstreamer1.0-tools gstreamer1.0-plugins-base \
  gstreamer1.0-plugins-base-apps gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad gstreamer1.0-libav
# ugly is useful for some codecs but absent in a few minimal repositories.
apt-get install -y -qq --no-install-recommends gstreamer1.0-plugins-ugly 2>/dev/null || true
gst-inspect-1.0 --version
SH

printf '[3/6] Khôi phục module GStreamer sạch từ lampacng...\n'
STAMP="$(date +%Y%m%d-%H%M%S)"
proot-distro login "$DISTRO" -- bash -s -- "$GST_REPO" "$LAMPAC_DIR" "$STAMP" <<'SH'
set -e
REPO="$1"
LAMPAC_DIR="$2"
STAMP="$3"
WORK="/tmp/lampacng-gstreamer-$STAMP"
rm -rf "$WORK"
git clone --depth 1 --filter=blob:none --sparse "$REPO" "$WORK"
git -C "$WORK" sparse-checkout set Modules/GStreamer
test -f "$WORK/Modules/GStreamer/manifest.json"
mkdir -p "$LAMPAC_DIR/module"
if [ -d "$LAMPAC_DIR/module/GStreamer" ]; then
  mv "$LAMPAC_DIR/module/GStreamer" "$LAMPAC_DIR/module/GStreamer.before-restore-$STAMP"
fi
cp -a "$WORK/Modules/GStreamer" "$LAMPAC_DIR/module/GStreamer"
rm -rf "$WORK"
test -f "$LAMPAC_DIR/module/GStreamer/references/Gst-1.0.dll"
test -f "$LAMPAC_DIR/module/GStreamer/plugins/gst.js"
SH

printf '[4/6] Bật module với copy mode an toàn...\n'
BACKUP_CONF="$LAMPAC_DIR/init.conf.before-gst-restore-$STAMP.bak"
proot-distro login "$DISTRO" -- python3 - "$LAMPAC_DIR/init.conf" "$BACKUP_CONF" <<'PY'
import json, os, shutil, sys
path, backup = sys.argv[1:]
base = {
    'listen': {'version': True, 'ip': '0.0.0.0', 'port': 9118, 'scheme': 'http', 'localhost': '127.0.0.1'},
    'BaseModule': {},
    'LampaWeb': {},
}
if os.path.exists(path):
    try:
        with open(path, encoding='utf-8') as source:
            config = json.load(source)
    except Exception as error:
        raise SystemExit(f'init.conf không phải JSON hợp lệ, không sửa: {error}')
    shutil.copy2(path, backup)
else:
    config = base

module = config.setdefault('BaseModule', {})
skip = module.get('SkipModules', [])
if not isinstance(skip, list): skip = []
module['SkipModules'] = [name for name in skip if str(name).lower() != 'gstreamer']
load_modules = module.get('LoadModules')
if isinstance(load_modules, list) and load_modules and load_modules[0] != '.*' and 'GStreamer' not in load_modules:
    load_modules.append('GStreamer')
    module['LoadModules'] = load_modules

gst = config.setdefault('gst', {})
gst.update({
    'enable': True,
    'useGpu': False,
    'maxTasks': 1,
    'segment_buffer': 3,
    'segment_past': 1,
})
# Leave all transcode flags absent/false: direct copy mode is far lighter on a phone.

lampa = config.setdefault('LampaWeb', {})
plugins = lampa.setdefault('customPlugins', [])
if not isinstance(plugins, list): plugins = []
plugins = [p for p in plugins if '/gst.js' not in str(p.get('url', ''))]
plugins.append({'url': '{localhost}/gst.js?v=1', 'status': 1})
lampa['customPlugins'] = plugins

with open(path, 'w', encoding='utf-8') as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write('\n')
print('GStreamer enabled; backup:', backup)
PY

printf '[5/6] Restart Lampac và chờ GStreamer compile...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

printf '[6/6] Kiểm tra /gst.js = HTTP 200...\n'
for _ in $(seq 1 55); do
  GST_STATUS="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 'http://127.0.0.1:9118/gst.js?v=1' || true)"
  if [ "$GST_STATUS" = '200' ]; then
    printf '\n[OK] GStreamer đã được module Lampac nạp: http://127.0.0.1:9118/gst.js\n'
    printf 'Kiểm tra thêm trong Ubuntu: gst-inspect-1.0 --version\n'
    exit 0
  fi
  sleep 1
done

restore_lampac_after_failure "Không thấy /gst.js sau khi nạp module (HTTP ${GST_STATUS:-?})."
