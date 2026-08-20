#!/data/data/com.termux/files/usr/bin/bash
# Full standalone Lampac setup for Termux + proot Ubuntu.
# v1.1 fixes the false "Ubuntu already installed" detection in the upstream helper.
# Does not install, remove or edit TorrShelf.
set -euo pipefail

REPO_DIR="${TORRSERVER_RENDER_DIR:-$HOME/torrserver-render}"
TARGET_REPO="https://github.com/nguyenquocngu93/torrserver-render.git"
FIX_URL="https://raw.githubusercontent.com/nguyenquocngu93/fshare/arena/019ffb6f-fshare/fix-lampac-msx-no-apk-v1.0.sh"
DISTRO="${LAMPAC_DISTRO:-ubuntu}"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

printf '\n=== Lampac standalone setup (Termux + proot Ubuntu) ===\n\n'

command -v pkg >/dev/null 2>&1 || fail 'Hãy chạy script này từ Termux gốc, không phải bên trong Ubuntu/proot.'

printf '[1/5] Cài công cụ Termux...\n'
pkg install -y git curl proot-distro

# `proot-distro list` lists supported distros too, so it cannot tell whether
# Ubuntu is actually installed. Test an actual login instead.
printf '[2/5] Kiểm tra Ubuntu proot...\n'
if ! proot-distro login "$DISTRO" -- /bin/true >/dev/null 2>&1; then
  printf '      Chưa có Ubuntu — đang tải và cài Ubuntu lần đầu...\n'
  proot-distro install "$DISTRO"
fi
proot-distro login "$DISTRO" -- /bin/true >/dev/null 2>&1 \
  || fail "Không thể mở distro $DISTRO. Chạy 'proot-distro login $DISTRO' để xem lỗi rồi gửi lại toàn bộ lỗi đó."

# The popup/config fixer uses Python. Install it before invoking either
# external setup helper so a minimal Ubuntu image is supported too.
printf '[3/5] Chuẩn bị phụ thuộc Ubuntu...\n'
proot-distro login "$DISTRO" -- bash -lc '
  set -e
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq python3
'

if [ ! -d "$REPO_DIR/.git" ]; then
  printf '[4/5] Clone torrserver-render...\n'
  git clone "$TARGET_REPO" "$REPO_DIR"
else
  printf '[4/5] Cập nhật torrserver-render...\n'
  git -C "$REPO_DIR" pull --ff-only || echo '      Repo có local changes; dùng source hiện có.'
fi

SETUP_SCRIPT="$REPO_DIR/lampac-termux/setup.sh"
[ -f "$SETUP_SCRIPT" ] || fail "Không thấy $SETUP_SCRIPT"

printf '[5/5] Cài Lampac, rồi tự bật plugin web...\n'
bash "$SETUP_SCRIPT"
curl -fsSL "$FIX_URL" | bash

printf '\n=== Hoàn tất ===\n'
printf 'Lampac đã được kiểm tra qua plugin tại: http://127.0.0.1:9118\n'
printf 'Mở URL đó trên chính điện thoại Android. Nếu Chrome còn tab cũ, đóng tab rồi mở lại.\n'
printf 'Dừng: lampac-stop | Chạy foreground để xem lỗi: lampac\n'
