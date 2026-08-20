#!/data/data/com.termux/files/usr/bin/bash
# Standalone Lampac recovery installer for Termux + proot Ubuntu.
# v1.2 deliberately does NOT call torrserver-render/lampac-termux/setup.sh:
# that upstream helper can try to reinstall an already-running Ubuntu container.
# It does not read, reset, pull, or alter ~/torrserver-render or TorrShelf.
set -euo pipefail

DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
PREFIX_BIN="${PREFIX:-/data/data/com.termux/files/usr}/bin"
RELEASE_URL="${LAMPAC_RELEASE_URL:-https://github.com/lampac-nextgen/lampac/releases/latest/download/lampac-nextgen.zip}"
TMP_DIR="${TMPDIR:-/data/data/com.termux/files/usr/tmp}/lampac-recovery-$$"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

printf '\n=== Lampac recovery v1.2 (không dùng Git) ===\n\n'
command -v pkg >/dev/null 2>&1 || fail 'Hãy chạy lệnh này ở Termux gốc (prompt thường là ~ $), không ở trong Ubuntu/proot.'

printf '[1/6] Chuẩn bị Termux...\n'
pkg install -y curl proot-distro
mkdir -p "$TMP_DIR"

# Do not use `proot-distro list`: on some Termux versions it does not reliably
# mean that the distro is installed. An actual short login is the check.
printf '[2/6] Kiểm tra Ubuntu proot...\n'
if ! proot-distro login "$DISTRO" -- /bin/true >/dev/null 2>&1; then
  printf '      Ubuntu chưa có, đang cài lần đầu...\n'
  proot-distro install "$DISTRO"
fi
proot-distro login "$DISTRO" -- /bin/true >/dev/null 2>&1 \
  || fail "Không mở được Ubuntu. Đóng mọi phiên Ubuntu đang mở rồi chạy lại lệnh này."

cat > "$TMP_DIR/dependencies.sh" <<'SH'
set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl wget unzip python3 procps
ICU_PKG="$(apt-cache search '^libicu[0-9]' 2>/dev/null | awk '!/(-dev|java)/ {print $1}' | sort -V | tail -1 || true)"
if [ -n "$ICU_PKG" ]; then
  apt-get install -y -qq "$ICU_PKG"
else
  apt-get install -y -qq libicu-dev
fi
apt-get install -y -qq libssl3 2>/dev/null \
  || apt-get install -y -qq libssl3t64 2>/dev/null \
  || apt-get install -y -qq libssl-dev 2>/dev/null \
  || true
SH

printf '[3/6] Cài phụ thuộc Ubuntu (ICU/.NET)...\n'
proot-distro login "$DISTRO" -- bash -s < "$TMP_DIR/dependencies.sh"

cat > "$TMP_DIR/lampac-files.sh" <<'SH'
set -e
LAMPAC_DIR="$1"
RELEASE_URL="$2"
if [ -f "$LAMPAC_DIR/Core.dll" ]; then
  echo "Đã có Lampac tại $LAMPAC_DIR — giữ nguyên dữ liệu hiện có."
  exit 0
fi
mkdir -p "$LAMPAC_DIR"
cd /tmp
rm -f lampac-nextgen.zip
printf 'Đang tải Lampac NextGen (file lớn, cần chờ tải xong)...\n'
curl -fL --retry 3 --retry-delay 2 "$RELEASE_URL" -o lampac-nextgen.zip
unzip -qo lampac-nextgen.zip -d "$LAMPAC_DIR"
rm -f lampac-nextgen.zip
test -f "$LAMPAC_DIR/Core.dll"
SH

printf '[4/6] Kiểm tra/tải Lampac...\n'
proot-distro login "$DISTRO" -- bash -s -- "$LAMPAC_DIR" "$RELEASE_URL" < "$TMP_DIR/lampac-files.sh" \
  || fail 'Không tải hoặc giải nén được Lampac. Hãy kiểm tra mạng và còn ít nhất 1.5 GB bộ nhớ trống.'

RUNTIME_CHANNEL="$({
  proot-distro login "$DISTRO" -- python3 -c '
import json
path = "/opt/lampac/Core.runtimeconfig.json"
try:
    with open(path, encoding="utf-8") as source:
        tfm = json.load(source).get("runtimeOptions", {}).get("tfm", "net10.0")
    print(tfm[3:] if tfm.startswith("net") else "10.0")
except Exception:
    print("10.0")
'
} | tr -d '\r\n')"
case "$RUNTIME_CHANNEL" in
  [0-9]*.[0-9]*) ;;
  *) RUNTIME_CHANNEL="10.0" ;;
esac

cat > "$TMP_DIR/runtime.sh" <<'SH'
set -e
CHANNEL="$1"
DOTNET_ROOT="$HOME/.dotnet"
export DOTNET_ROOT
export PATH="$DOTNET_ROOT:$PATH"
if ! command -v dotnet >/dev/null 2>&1 \
  || ! dotnet --list-runtimes 2>/dev/null | grep -q "^Microsoft.AspNetCore.App $CHANNEL"; then
  cd /tmp
  rm -f dotnet-install.sh
  curl -fL --retry 3 --retry-delay 2 https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
  bash dotnet-install.sh --runtime aspnetcore --channel "$CHANNEL" --install-dir "$DOTNET_ROOT"
  rm -f dotnet-install.sh
fi
dotnet --list-runtimes
SH

printf '[5/6] Cài .NET runtime %s...\n' "$RUNTIME_CHANNEL"
proot-distro login "$DISTRO" -- bash -s -- "$RUNTIME_CHANNEL" < "$TMP_DIR/runtime.sh" \
  || fail 'Cài .NET không thành công. Hãy gửi toàn bộ lỗi hiển thị ngay phía trên.'

cat > "$TMP_DIR/no-apk-force.js" <<'JS'
/** No APK Force v2 — remove Lampa Android / MediaStationX APK prompt in web mode. */
(function () {
  'use strict';
  if (window.__lampac_no_apk_force_v2) return;
  window.__lampac_no_apk_force_v2 = true;
  var markers = [
    'how to install lampa on android', 'mediastationx to run lampa',
    'installing lampa as an apk', 'go to the @lampa_group',
    'установить lampa на android', 'установить приложение'
  ];
  function textOf(node) { return String(node && (node.innerText || node.textContent) || '').toLowerCase(); }
  function isApkPrompt(node) {
    var text = textOf(node);
    return text.length > 20 && markers.some(function (marker) { return text.indexOf(marker) !== -1; });
  }
  function modalRoot(node) {
    var current = node;
    while (current && current !== document.body) {
      var classes = String(current.className || '');
      var style = window.getComputedStyle ? window.getComputedStyle(current) : null;
      if (/(modal|dialog|overlay|popup|full-start|notice)/i.test(classes) || (style && style.position === 'fixed')) return current;
      current = current.parentElement;
    }
    return node;
  }
  function dismiss(node) {
    if (!node || !node.parentNode) return;
    var target = modalRoot(node);
    target.style.setProperty('display', 'none', 'important');
    target.remove();
    if (document.body) document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  function sweep(root) {
    var nodes = [];
    if (root && root.nodeType === 1) nodes.push(root);
    nodes = nodes.concat(Array.prototype.slice.call(document.querySelectorAll('[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="popup"],[class*="notice"],[class*="full"]')));
    nodes.sort(function (a, b) { return textOf(a).length - textOf(b).length; });
    nodes.some(function (node) { if (isApkPrompt(node)) { dismiss(node); return true; } return false; });
  }
  function forceWebPlatform() {
    if (!window.Lampa || !window.Lampa.Platform) return;
    window.Lampa.Platform.get = function () { return 'browser'; };
    window.Lampa.Platform.is = function (need) { return Array.isArray(need) ? need.indexOf('browser') !== -1 : need === 'browser'; };
  }
  function start() {
    forceWebPlatform(); sweep(document.documentElement);
    new MutationObserver(function (records) {
      records.forEach(function (record) { Array.prototype.forEach.call(record.addedNodes, function (node) { if (node.nodeType === 1) sweep(node); }); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    var tries = 0;
    var timer = setInterval(function () { forceWebPlatform(); sweep(document.documentElement); if (++tries >= 60) clearInterval(timer); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();
JS

printf '[6/6] Tạo lệnh chạy và plugin web...\n'
mkdir -p "$PREFIX_BIN"
proot-distro login "$DISTRO" -- mkdir -p "$LAMPAC_DIR/plugins/override"
proot-distro login "$DISTRO" -- bash -c "cat > '$LAMPAC_DIR/plugins/override/no-apk-force.js'" < "$TMP_DIR/no-apk-force.js"

proot-distro login "$DISTRO" -- python3 - "$LAMPAC_DIR/init.conf" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {
    "listen": {"version": True, "ip": "0.0.0.0", "port": 9118, "scheme": "http", "localhost": "127.0.0.1"},
    "LampaWeb": {"customPlugins": []},
}
if os.path.isfile(path):
    try:
        with open(path, encoding="utf-8") as source:
            config = json.load(source)
        shutil.copy2(path, path + ".before-recovery-v1.2.bak")
    except Exception:
        config = base
else:
    config = base
plugins = config.setdefault("LampaWeb", {}).setdefault("customPlugins", [])
plugins = [item for item in plugins if "no-apk-force" not in str(item.get("url", ""))]
plugins.append({"url": "{localhost}/no-apk-force.js?v=2", "status": 1})
config["LampaWeb"]["customPlugins"] = plugins
with open(path, "w", encoding="utf-8") as target:
    json.dump(config, target, ensure_ascii=False, indent=2)
    target.write("\n")
PY

cat > "$TMP_DIR/start.sh" <<EOF
#!/bin/bash
set -e
export DOTNET_ROOT="\$HOME/.dotnet"
export PATH="\$DOTNET_ROOT:\$PATH"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
cd "$LAMPAC_DIR"
exec dotnet Core.dll
EOF
proot-distro login "$DISTRO" -- bash -c "cat > '$LAMPAC_DIR/start.sh' && chmod +x '$LAMPAC_DIR/start.sh'" < "$TMP_DIR/start.sh"

cat > "$PREFIX_BIN/lampac" <<EOF
#!/data/data/com.termux/files/usr/bin/bash
exec proot-distro login "$DISTRO" -- bash "$LAMPAC_DIR/start.sh"
EOF
cat > "$PREFIX_BIN/lampac-stop" <<EOF
#!/data/data/com.termux/files/usr/bin/bash
proot-distro login "$DISTRO" -- bash -c "pkill -f 'dotnet Core.dll' >/dev/null 2>&1 || true"
EOF
cat > "$PREFIX_BIN/lampac-status" <<EOF
#!/data/data/com.termux/files/usr/bin/bash
if curl -fsS --max-time 3 http://127.0.0.1:9118/ >/dev/null; then
  echo 'Lampac: RUNNING — http://127.0.0.1:9118'
else
  echo 'Lampac: STOPPED'
fi
EOF
chmod +x "$PREFIX_BIN/lampac" "$PREFIX_BIN/lampac-stop" "$PREFIX_BIN/lampac-status"

"$PREFIX_BIN/lampac-stop" || true
nohup "$PREFIX_BIN/lampac" > "$HOME/lampac.log" 2>&1 &

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:9118/no-apk-force.js?v=2 2>/dev/null | grep -q 'No APK Force v2'; then
    printf '\n[OK] Lampac đang chạy: http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

printf '\n[ERROR] Lampac chưa khởi động được. Log cuối:\n\n' >&2
tail -80 "$HOME/lampac.log" >&2 || true
exit 1
