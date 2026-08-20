#!/data/data/com.termux/files/usr/bin/bash
# Stop Lampac from advertising its built-in TorrServer ts.js plugin when the
# TorrServer module is intentionally disabled. Does not install TorrServer,
# remove GStreamer, change TorrShelf, or delete custom plugin files.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
INIT_CONF="$LAMPAC_DIR/init.conf"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail 'Không thấy proot-distro. Hãy chạy ở Termux gốc.'
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy $LAMPAC_DIR/Core.dll trong Ubuntu."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/3] Sửa cấu hình ts.js 404...\n'
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
    shutil.copy2(path, path + ".before-tsjs-fix.bak")
else:
    config = base

lampa = config.setdefault("LampaWeb", {})
plugins = lampa.setdefault("initPlugins", {})
plugins["torrserver"] = False

with open(path, "w", encoding="utf-8") as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write("\n")
print("Đã đặt LampaWeb.initPlugins.torrserver = false")
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; cấu hình đã sửa nhưng chưa tự khởi động lại."

printf '[2/3] Khởi động lại Lampac...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

printf '[3/3] Chờ web Lampac lên...\n'
for _ in $(seq 1 25); do
  if curl -fsS --max-time 3 http://127.0.0.1:9118/ >/dev/null 2>&1; then
    printf '\n[OK] Đã tắt plugin TorrServer ts.js bị 404.\n'
    printf 'Đóng tab Lampa hiện tại, rồi mở mới: http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Lampac chưa lên. Log cuối:\n\n' >&2
tail -80 "$LOG_FILE" >&2 || true
exit 1
