#!/data/data/com.termux/files/usr/bin/bash
# One-command setup for the Lampa -> TorrShelf direct HTTP source bridge.
# Keeps Lampac/TorrServer/GStreamer settings untouched.
set -euo pipefail

TORRSHELF_DIR="${TORRSHELF_DIR:-$HOME/torr-shelf}"
TORRSHELF_INSTALLER="${TORRSHELF_INSTALLER:-https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/install-torr-shelf-v1.6.13-lampa-http-bridge.sh}"
BRIDGE_INSTALLER="${BRIDGE_INSTALLER:-https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/install-lampac-torrshelf-http-bridge-v1.1-direct-http.sh}"
TORRSHELF_LOG="${TORRSHELF_LOG:-$HOME/torrshelf.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v pkg >/dev/null 2>&1 || fail 'Hãy chạy ở Termux gốc (~ $), không ở trong Ubuntu/proot.'

printf '\n=== TorrShelf HTTP Sources cho Lampa ===\n'
printf 'Nguồn: UHDMovies, 4KHDHub, MoviesDrive, HDHub4u. Không dùng Stremio/magnet/Jackett.\n\n'

printf '[1/4] Chuẩn bị Node.js và curl...\n'
pkg install -y curl >/dev/null
if ! command -v node >/dev/null 2>&1; then
  pkg install -y nodejs-lts || pkg install -y nodejs
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || fail "TorrShelf cần Node.js 20+, máy đang có Node.js $(node -v)."

printf '[2/4] Cài TorrShelf HTTP bridge v1.6.13...\n'
curl -fsSL "$TORRSHELF_INSTALLER" | bash
[ -f "$TORRSHELF_DIR/server.mjs" ] || fail "Không thấy $TORRSHELF_DIR/server.mjs sau khi cài."

printf '[3/4] Khởi động TorrShelf trên cổng 8787...\n'
pkill -f '[n]ode server\.mjs' >/dev/null 2>&1 || true
nohup node "$TORRSHELF_DIR/server.mjs" > "$TORRSHELF_LOG" 2>&1 &
for _ in $(seq 1 25); do
  STATUS="$(curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8787/api/lampa/streams?title=x' || true)"
  [ "$STATUS" = '422' ] && break
  sleep 1
done
[ "${STATUS:-}" = '422' ] || {
  tail -80 "$TORRSHELF_LOG" >&2 || true
  fail 'TorrShelf chưa lên được ở cổng 8787.'
}

printf '[4/4] Gắn bridge vào Lampa/Lampac...\n'
curl -fsSL "$BRIDGE_INSTALLER" | bash

printf '\n=== Hoàn tất ===\n'
printf 'Đóng tab Lampa cũ, mở lại http://127.0.0.1:9118\n'
printf 'Vào chi tiết một phim rồi chọn nút: TorrShelf HTTP\n'
printf 'Log TorrShelf nếu cần: tail -80 %s\n' "$TORRSHELF_LOG"
