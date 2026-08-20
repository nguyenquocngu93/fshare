#!/data/data/com.termux/files/usr/bin/bash
# Full standalone Lampac setup for Termux + proot Ubuntu.
# Does not install, remove or edit TorrShelf.
set -euo pipefail

REPO_DIR="${TORRSERVER_RENDER_DIR:-$HOME/torrserver-render}"
TARGET_REPO="https://github.com/nguyenquocngu93/torrserver-render.git"
FIX_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/fix-lampac-msx-no-apk-v1.0.sh"

printf '\n=== Lampac standalone setup (proot Ubuntu) ===\n\n'

command -v pkg >/dev/null 2>&1 || { echo 'Hãy chạy script này từ Termux, không phải trong distro.' >&2; exit 1; }
pkg install -y git curl proot-distro

if [ ! -d "$REPO_DIR/.git" ]; then
  printf '[1/3] Clone torrserver-render...\n'
  git clone "$TARGET_REPO" "$REPO_DIR"
else
  printf '[1/3] Repo đã có, cập nhật source...\n'
  git -C "$REPO_DIR" pull --ff-only || echo 'Không pull được do local changes, dùng source hiện có.'
fi

printf '[2/3] Cài lại Lampac trong proot Ubuntu...\n'
bash "$REPO_DIR/lampac-termux/setup.sh"

printf '[3/3] Cài plugin chặn popup Android / MediaStationX...\n'
curl -fsSL "$FIX_URL" | bash

printf '\n=== Hoàn tất ===\n'
printf 'Mở lại Chrome ở: http://127.0.0.1:9118\n'
printf 'Nếu tab cũ còn cache, đóng hẳn Chrome/tab đó rồi mở lại.\n'
