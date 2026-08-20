#!/data/data/com.termux/files/usr/bin/bash
# Lampac/Lampa web fix for the Android / MediaStationX APK-install prompt.
# Runs entirely separately from TorrShelf.
set -euo pipefail

REPO_DIR="${TORRSERVER_RENDER_DIR:-$HOME/torrserver-render}"
DISTRO="${LAMPAC_DISTRO:-ubuntu}"
LAMPAC_DIR="${LAMPAC_DIR:-/opt/lampac}"
PLUGIN_DIR="$LAMPAC_DIR/plugins/override"
PLUGIN_PATH="$PLUGIN_DIR/no-apk-force.js"
CONFIG_PATH="$LAMPAC_DIR/init.conf"
PLUGIN_SOURCE="$REPO_DIR/lampac-termux/plugins/no-apk-force.js"

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

command -v proot-distro >/dev/null 2>&1 || fail "Không tìm thấy proot-distro. Cài bằng: pkg install proot-distro"
command -v curl >/dev/null 2>&1 || fail "Không tìm thấy curl. Cài bằng: pkg install curl"
[ -d "$REPO_DIR" ] || fail "Không tìm thấy repo: $REPO_DIR"

proot-distro login "$DISTRO" -- test -f "$LAMPAC_DIR/Core.dll" \
  || fail "Không tìm thấy Lampac tại $LAMPAC_DIR trong distro $DISTRO. Hãy chạy lampac-termux/setup.sh trước."
proot-distro login "$DISTRO" -- command -v python3 >/dev/null 2>&1 \
  || fail "Distro thiếu python3. Vào distro rồi chạy: apt update && apt install -y python3"

printf '\n[1/4] Cập nhật plugin chặn popup APK...\n'
cat > "$PLUGIN_SOURCE" <<'JS'
/**
 * No APK Force v2 — remove Lampa's Android / MediaStationX APK prompt in web mode.
 * Loaded by Lampac LampaWeb as a custom plugin.
 */
(function () {
  'use strict';
  if (window.__lampac_no_apk_force_v2) return;
  window.__lampac_no_apk_force_v2 = true;

  var markers = [
    'how to install lampa on android',
    'mediastationx to run lampa',
    'installing lampa as an apk',
    'go to the @lampa_group',
    'установить lampa на android',
    'установить приложение'
  ];

  function textOf(node) {
    return String(node && (node.innerText || node.textContent) || '').toLowerCase();
  }

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
    console.log('[NoAPKForce] Android APK prompt removed');
  }

  function sweep(root) {
    var nodes = [];
    if (root && root.nodeType === 1) nodes.push(root);
    if (document.querySelectorAll) {
      nodes = nodes.concat(Array.prototype.slice.call(document.querySelectorAll('[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="popup"],[class*="notice"],[class*="full"]')));
    }
    nodes.sort(function (a, b) { return textOf(a).length - textOf(b).length; });
    nodes.some(function (node) {
      if (!isApkPrompt(node)) return false;
      dismiss(node);
      return true;
    });
  }

  function forceWebPlatform() {
    if (!window.Lampa || !window.Lampa.Platform) return;
    window.Lampa.Platform.get = function () { return 'browser'; };
    window.Lampa.Platform.is = function (need) {
      return Array.isArray(need) ? need.indexOf('browser') !== -1 : need === 'browser';
    };
  }

  function start() {
    forceWebPlatform();
    sweep(document.documentElement);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType === 1) sweep(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    var attempts = 0;
    var timer = setInterval(function () {
      forceWebPlatform();
      sweep(document.documentElement);
      attempts += 1;
      if (attempts >= 60) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
JS

printf '[2/4] Copy plugin vào Lampac...\n'
proot-distro login "$DISTRO" -- mkdir -p "$PLUGIN_DIR"
proot-distro login "$DISTRO" -- bash -c "cat > '$PLUGIN_PATH'" < "$PLUGIN_SOURCE"
proot-distro login "$DISTRO" -- ls -lh "$PLUGIN_PATH"

printf '[3/4] Tạo/cập nhật init.conf để Lampac nạp plugin...\n'
proot-distro login "$DISTRO" -- python3 - "$CONFIG_PATH" <<'PY'
import json
import os
import shutil
import sys

path = sys.argv[1]
base = {
    "listen": {
        "version": True,
        "ip": "0.0.0.0",
        "port": 9118,
        "scheme": "http",
        "localhost": "127.0.0.1",
    },
    "BaseModule": {
        "SkipModules": ["TorrServer", "Catalog", "DLNA", "JacRed", "Sync", "TimeCode", "Tracks", "Transcoding", "WebLog"],
    },
    "online": {"name": "Lampac", "version": True, "btn_priority_forced": True},
    "sisi": {"lgbt": False, "NextHUB": True},
}

if os.path.exists(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            config = json.load(fh)
        shutil.copy2(path, path + ".before-no-apk-force.bak")
    except Exception:
        config = base
else:
    config = base

lampa = config.setdefault("LampaWeb", {})
plugins = lampa.setdefault("customPlugins", [])
plugins = [plugin for plugin in plugins if "no-apk-force" not in str(plugin.get("url", ""))]
plugins.append({"url": "{localhost}/no-apk-force.js?v=2", "status": 1})
lampa["customPlugins"] = plugins

with open(path, "w", encoding="utf-8") as fh:
    json.dump(config, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print("Plugin enabled in", path)
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
  if curl -fsS "http://127.0.0.1:9118/no-apk-force.js?v=2" | grep -q 'No APK Force v2'; then
    printf '\n[OK] Plugin đang được Lampac serve.\n'
    printf 'Mở lại Chrome: http://127.0.0.1:9118\n'
    exit 0
  fi
  sleep 1
done

printf '\n[WARN] Lampac chưa serve plugin. Xem log: tail -80 ~/lampac.log\n'
exit 1
