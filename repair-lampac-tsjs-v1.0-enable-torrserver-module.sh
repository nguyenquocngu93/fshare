#!/data/data/com.termux/files/usr/bin/bash
# Repair Lampac's bundled local TorrServer extension: /ts.js must return 200.
# This reverses the bad state where Lampa advertises ts.js while the TorrServer
# module is listed in BaseModule.SkipModules. It does not touch GStreamer,
# TorrShelf, custom plugins, or the user's torrent data.
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
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/module/TorrServer/Controller.cs" \
  || fail "Thiếu module $LAMPAC_DIR/module/TorrServer. Không thể tạo ts.js thật nếu module không có."
proot-distro login "$DISTRO" -- bash -lc 'command -v python3 >/dev/null' \
  || fail 'Ubuntu thiếu python3; chưa thay đổi gì.'

printf '\n[1/4] Bật module TorrServer tích hợp của Lampac...\n'
proot-distro login "$DISTRO" -- python3 - "$INIT_CONF" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {
    "listen": {"version": True, "ip": "0.0.0.0", "port": 9118, "scheme": "http", "localhost": "127.0.0.1"},
    "BaseModule": {},
    "LampaWeb": {},
}
if os.path.exists(path):
    try:
        with open(path, encoding="utf-8") as source:
            config = json.load(source)
    except Exception as error:
        raise SystemExit(f"init.conf không phải JSON hợp lệ, không sửa: {error}")
    shutil.copy2(path, path + ".before-enable-tsjs.bak")
else:
    config = base

base_module = config.setdefault("BaseModule", {})
skip = base_module.get("SkipModules", [])
if not isinstance(skip, list):
    skip = []
base_module["SkipModules"] = [name for name in skip if str(name).lower() != "torrserver"]

lampa = config.setdefault("LampaWeb", {})
init_plugins = lampa.setdefault("initPlugins", {})
init_plugins["torrserver"] = True

with open(path, "w", encoding="utf-8") as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write("\n")
print("Đã bỏ TorrServer khỏi SkipModules và đặt LampaWeb.initPlugins.torrserver = true")
PY

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; cấu hình đã sửa nhưng chưa tự khởi động lại."

printf '[2/4] Khởi động lại Lampac...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f '[d]otnet Core\\.dll' >/dev/null 2>&1 || true" || true
sleep 1
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

printf '[3/4] Chờ module TorrServer nạp...\n'
for _ in $(seq 1 45); do
  if curl -fsS --max-time 4 http://127.0.0.1:9118/ts.js >/dev/null 2>&1; then
    printf '\n[OK] /ts.js đã trả HTTP 200.\n'
    printf '[4/4] Đóng tab Lampa cũ rồi mở lại http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

STATUS="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 4 http://127.0.0.1:9118/ts.js 2>/dev/null || true)"
printf '\n[ERROR] /ts.js vẫn chưa trả 200 (HTTP %s). Log cuối:\n\n' "${STATUS:-không kết nối}" >&2
tail -100 "$LOG_FILE" >&2 || true
exit 1
