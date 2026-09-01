#!/data/data/com.termux/files/usr/bin/bash
# Deploys the TorrShelf direct-HTTP bridge into Lampac/Lampa.
# Requires TorrShelf v1.6.13+ running at http://127.0.0.1:8787.
set -euo pipefail

REPO_DIR="${TORRSERVER_RENDER_DIR:-$HOME/torrserver-render}"
DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
PLUGIN_DIR="$LAMPAC_DIR/plugins/override"
PLUGIN_PATH="$PLUGIN_DIR/torrshelf-http-bridge.js"
CONFIG_PATH="$LAMPAC_DIR/init.conf"
PLUGIN_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/lampac-torrshelf-http-bridge-v1.0.js"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail "Không tìm thấy proot-distro."
command -v curl >/dev/null 2>&1 || fail "Không tìm thấy curl."
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không tìm thấy Lampac tại $LAMPAC_DIR trong distro $DISTRO."
proot-distro login "$DISTRO" -- command -v python3 >/dev/null 2>&1 \
  || fail "Distro thiếu python3. Cài bằng: apt update && apt install -y python3"

printf '\n[1/4] Kiểm tra TorrShelf bridge...\n'
STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8787/api/lampa/streams?title=x" || true)"
if [ "$STATUS" != "422" ]; then
  fail "TorrShelf chưa chạy hoặc chưa phải bản có /api/lampa/streams. Hãy cài v1.6.13+ và npm start trước."
fi

printf '[2/4] Tải plugin Lampa → TorrShelf...\n'
TMP_PLUGIN="$(mktemp)"
trap 'rm -f "$TMP_PLUGIN"' EXIT
curl -fsSL "$PLUGIN_URL" -o "$TMP_PLUGIN"
proot-distro login "$DISTRO" -- mkdir -p "$PLUGIN_DIR"
proot-distro login "$DISTRO" -- bash -c "cat > '$PLUGIN_PATH'" < "$TMP_PLUGIN"
proot-distro login "$DISTRO" -- ls -lh "$PLUGIN_PATH"

printf '[3/4] Bật plugin trong Lampac init.conf...\n'
proot-distro login "$DISTRO" -- python3 - "$CONFIG_PATH" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
if os.path.exists(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            config = json.load(fh)
        shutil.copy2(path, path + ".before-torrshelf-http.bak")
    except Exception:
        config = {}
else:
    config = {}

lampa = config.setdefault("LampaWeb", {})
plugins = lampa.setdefault("customPlugins", [])
plugins = [plugin for plugin in plugins if "torrshelf-http-bridge" not in str(plugin.get("url", ""))]
plugins.append({"url": "{localhost}/torrshelf-http-bridge.js?v=1", "status": 1})
lampa["customPlugins"] = plugins

with open(path, "w", encoding="utf-8") as fh:
    json.dump(config, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print("TorrShelf HTTP bridge enabled")
PY

printf '[4/4] Restart Lampac...\n'
if command -v lampac-stop >/dev/null 2>&1; then
  lampac-stop >/dev/null 2>&1 || true
else
  proot-distro login "$DISTRO" -- pkill -f 'dotnet Core.dll' >/dev/null 2>&1 || true
fi
sleep 1
if command -v lampac >/dev/null 2>&1; then
  nohup lampac > "$HOME/lampac.log" 2>&1 &
else
  nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$HOME/lampac.log" 2>&1 &
fi

for _ in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:9118/torrshelf-http-bridge.js?v=1" | grep -q 'TorrShelf HTTP Bridge'; then
    printf '\n[OK] Lampa bridge đã được serve.\n'
    printf 'Mở Lampa → trang chi tiết phim → nút TorrShelf HTTP.\n'
    exit 0
  fi
  sleep 1
done

printf '\n[WARN] Không kiểm tra được plugin. Xem log: tail -80 ~/lampac.log\n'
exit 1
