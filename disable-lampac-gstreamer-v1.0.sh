#!/data/data/com.termux/files/usr/bin/bash
# Disable/remove the GStreamer module from an existing Lampac installation.
# Does not install Ubuntu, pull git repositories, or change TorrShelf.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
LOG_FILE="${LAMPAC_LOG_FILE:-$HOME/lampac.log}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 \
  || fail 'Không thấy proot-distro. Hãy chạy từ Termux gốc.'

# Only test the existing distro. Never call `proot-distro install`, because an
# already-running Ubuntu container can report itself as busy during installation.
proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không thấy Lampac tại $LAMPAC_DIR trong Ubuntu. Không cài lại gì cả."

printf '\n[1/3] Dừng Lampac cũ...\n'
proot-distro login "$DISTRO" -- bash -c "pkill -f 'dotnet Core.dll' >/dev/null 2>&1 || true" || true
sleep 1

printf '[2/3] Xoá GStreamer khỏi Lampac...\n'
proot-distro login "$DISTRO" -- bash -s -- "$LAMPAC_DIR" <<'SH'
set -e
LAMPAC_DIR="$1"
rm -rf "$LAMPAC_DIR/module/GStreamer" "$LAMPAC_DIR/modules/GStreamer"
if [ -d "$LAMPAC_DIR/runtimes" ]; then
  find "$LAMPAC_DIR/runtimes" \
    \( -type f -o -type l \) \
    \( -iname '*gstreamer*' -o -iname '*gst*' -o -iname '*libglib*' \) \
    -print -delete 2>/dev/null || true
fi
printf 'GStreamer đã được gỡ khỏi %s\n' "$LAMPAC_DIR"
SH

proot-distro login "$DISTRO" -- test -x "$LAMPAC_DIR/start.sh" \
  || fail "Thiếu $LAMPAC_DIR/start.sh; chưa tự chạy lại để tránh làm sai cấu hình."

printf '[3/3] Khởi động lại Lampac...\n'
nohup proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh" > "$LOG_FILE" 2>&1 &

for _ in $(seq 1 25); do
  if curl -fsS --max-time 3 http://127.0.0.1:9118/ >/dev/null 2>&1; then
    printf '\n[OK] Lampac đang chạy không có GStreamer: http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Lampac chưa lên. Log cuối:\n\n' >&2
tail -80 "$LOG_FILE" >&2 || true
exit 1
