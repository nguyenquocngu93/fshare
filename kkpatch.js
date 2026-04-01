/**
 * KKPhim - TS Progress Patch + 120Hz CSS Fix
 * Ghi đè lên plugin gốc, load SAU kkphim plugin
 * Version: 1.0
 */
(function () {
    'use strict';

    // ═══════════════════════════════════════════
    // 1. CSS FIX 120Hz - ghi đè style gốc
    // ═══════════════════════════════════════════
    function inject120HzCSS() {
        var id = 'kk-120hz-fix';
        if (document.getElementById(id)) return;
        var style = document.createElement('style');
        style.id = id;
        style.textContent = [
            /* Xóa scroll-behavior smooth - nguyên nhân chính block 120Hz */
            '.scroll__body {',
            '  scroll-behavior: auto !important;',
            '}',

            /* Dùng translate3d thay translateZ để GPU composite layer đúng */
            '.kk-row-list {',
            '  transform: translate3d(0,0,0) !important;',
            '  -webkit-overflow-scrolling: touch !important;',
            '  scroll-behavior: auto !important;',
            '  backface-visibility: hidden !important;',
            '  will-change: auto !important;',          /* will-change: transform gây memory pressure */
            '}',

            /* Card: chỉ promote lên composite layer khi focus/hover, không promote toàn bộ */
            '.kk-card, .kk-card-h, .kk-pfc {',
            '  transform: none !important;',
            '  backface-visibility: hidden !important;',
            '  -webkit-backface-visibility: hidden !important;',
            '  will-change: auto !important;',
            '}',

            /* Focus state mới - dùng scale3d để giữ GPU layer nhưng không tạo stacking context thừa */
            '.kk-card.focus, .kk-card-h.focus, .kk-pfc.focus {',
            '  transform: scale3d(1.05, 1.05, 1) !important;',
            '  will-change: transform !important;',
            '}',

            /* Transition chỉ apply khi cần, dùng cubic-bezier phù hợp 120Hz */
            '.kk-card, .kk-card-h, .kk-pfc {',
            '  transition: transform 0.12s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;',
            '}',

            /* Scroll body: tắt smooth, bật momentum scroll iOS/Android */
            '.scroll__body {',
            '  transform: translate3d(0,0,0) !important;',
            '  backface-visibility: hidden !important;',
            '  -webkit-backface-visibility: hidden !important;',
            '  will-change: auto !important;',
            '}',

            /* Image: content-visibility giúp browser skip render off-screen */
            '.kk-card img, .kk-card-h img, .kk-pfc img {',
            '  transform: none !important;',            /* bỏ translateZ thừa trên img */
            '  content-visibility: auto !important;',
            '  contain-intrinsic-size: auto 200px !important;',
            '}',
        ].join('\n');
        document.head.appendChild(style);
        console.log('[KK-Patch] 120Hz CSS injected');
    }

    // ═══════════════════════════════════════════
    // 2. TS PROGRESS POLLING
    // ═══════════════════════════════════════════

    // --- Helpers (duplicate-safe, dùng window namespace) ---
    var PROG_KEY = 'kkphim_progress';
    var CW_KEY   = 'kkphim_continue_watching';

    function getProgress() {
        try { return JSON.parse(localStorage.getItem(PROG_KEY)) || {}; } catch(e) { return {}; }
    }
    function setProgress(obj) {
        try { localStorage.setItem(PROG_KEY, JSON.stringify(obj)); } catch(e) {}
    }
    function getCW() {
        try { return JSON.parse(localStorage.getItem(CW_KEY)) || []; } catch(e) { return []; }
    }
    function setCW(v) {
        try { localStorage.setItem(CW_KEY, JSON.stringify(v || [])); } catch(e) {}
    }

    function pKey(url, cwId) {
        var src = cwId ? 'cw_' + cwId : (url || '');
        try {
            return btoa(unescape(encodeURIComponent(src)))
                .replace(/[^a-zA-Z0-9]/g, '').substring(0, 40);
        } catch(e) {
            return src.substring(0, 40);
        }
    }

    function saveP(url, time, dur, cwId) {
        if (!url || !dur || dur < 10) return;
        var p = getProgress();
        var k = pKey(url, cwId);
        p[k] = {
            url: url, cwId: cwId || '',
            time: Math.floor(time),
            duration: Math.floor(dur),
            percent: Math.min(99, Math.floor((time / dur) * 100)),
            updated: Date.now(),
            source: 'ts_poll'
        };
        // Giới hạn 200 entries
        var ks = Object.keys(p);
        if (ks.length > 200) {
            ks.sort(function(a,b){ return (p[a].updated||0)-(p[b].updated||0); });
            for (var i = 0; i < ks.length - 200; i++) delete p[ks[i]];
        }
        setProgress(p);
    }

    function updateCWP(cwId, time, dur) {
        if (!cwId || !dur || dur < 10) return;
        var a = getCW(), changed = false;
        for (var i = 0; i < a.length; i++) {
            if (a[i].id === cwId) {
                a[i].progress_time    = Math.floor(time);
                a[i].progress_duration = Math.floor(dur);
                a[i].progress_percent  = Math.min(99, Math.floor((time / dur) * 100));
                changed = true; break;
            }
        }
        if (changed) setCW(a);
    }

    function normalizeUrl(url) {
        if (!url) return '';
        return url.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
    }

    // --- TS helpers ---
    function tsHost() {
        try {
            var s = JSON.parse(localStorage.getItem('kkphim_settings')) || {};
            return s.torrserver_host || '';
        } catch(e) { return ''; }
    }
    function tsPass() {
        try {
            var s = JSON.parse(localStorage.getItem('kkphim_settings')) || {};
            return s.torrserver_password || '';
        } catch(e) { return ''; }
    }
    function tsU(path) {
        var h = tsHost();
        if (!h) return '';
        h = h.replace(/\/+$/, '');
        if (h.indexOf('http') !== 0) h = 'http://' + h;
        return h + path;
    }
    function tsHeaders() {
        var h = { 'Content-Type': 'application/json' };
        var pw = tsPass();
        if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw);
        return h;
    }

    // --- Poll state ---
    var _poll = {
        interval:  null,
        hash:      null,
        fileIdx:   0,
        url:       '',
        cwId:      null,
        duration:  0,       // giây, từ TMDB runtime hoặc video element
        lastPct:   0,
        stableCnt: 0,
        failCnt:   0
    };

    function stopTSPoll() {
        if (_poll.interval) {
            clearInterval(_poll.interval);
            _poll.interval = null;
        }
        _poll.hash = null;
        console.log('[KK-Patch] TS poll stopped');
    }

    /**
     * Fetch /torrents get → trả về % reader position
     * TorrServer stat object có:
     *   file_stats[i].reader  → bytes reader đang đứng
     *   file_stats[i].length  → tổng bytes file
     *   downloaded_pieces / pieces_count → fallback
     */
    async function fetchTSPercent(hash, fileIdx) {
        try {
            var r = await fetch(tsU('/torrents'), {
                method: 'POST',
                headers: tsHeaders(),
                body: JSON.stringify({ action: 'get', hash: hash })
            });
            if (!r.ok) return null;
            var d = await r.json();
            if (!d) return null;

            // Kiểm tra torrent còn sống không
            var stat = String(d.stat_string || d.stat || '').toLowerCase();
            if (stat.indexOf('closed') > -1 || stat.indexOf('stop') > -1) {
                return { percent: _poll.lastPct, stopped: true };
            }

            var fi = d.file_stats && d.file_stats[fileIdx]
                     ? d.file_stats[fileIdx]
                     : (d.file_stats && d.file_stats[0]);

            var pct = 0;

            // Ưu tiên 1: reader position / file size (chính xác nhất)
            if (fi && fi.reader > 0 && fi.length > 0) {
                pct = Math.min(99, Math.floor((fi.reader / fi.length) * 100));
            }
            // Ưu tiên 2: downloaded_pieces / pieces_count
            else if (d.downloaded_pieces > 0 && d.pieces_count > 0) {
                pct = Math.min(99, Math.floor((d.downloaded_pieces / d.pieces_count) * 100));
            }
            // Ưu tiên 3: preloaded_bytes / file size
            else if (fi && d.preloaded_bytes > 0 && fi.length > 0) {
                pct = Math.min(99, Math.floor((d.preloaded_bytes / fi.length) * 100));
            }

            return { percent: pct, stopped: false };
        } catch(e) {
            return null;
        }
    }

    /**
     * Bắt đầu poll TS stat mỗi 5 giây
     * @param {string} hash       - torrent hash
     * @param {number} fileIdx    - file index trong torrent
     * @param {string} url        - stream URL (đã normalize)
     * @param {string} cwId       - continue watching ID
     * @param {number} duration   - độ dài phim (giây), 0 nếu chưa biết
     */
    function startTSPoll(hash, fileIdx, url, cwId, duration) {
        stopTSPoll();
        if (!tsHost() || !hash) return;

        _poll.hash      = hash;
        _poll.fileIdx   = fileIdx || 0;
        _poll.url       = url || '';
        _poll.cwId      = cwId || null;
        _poll.duration  = duration || 0;
        _poll.lastPct   = 0;
        _poll.stableCnt = 0;
        _poll.failCnt   = 0;

        console.log('[KK-Patch] TS poll started | hash:', hash, '| dur:', duration);

        _poll.interval = setInterval(async function () {
            if (!_poll.hash) { stopTSPoll(); return; }

            var result = await fetchTSPercent(_poll.hash, _poll.fileIdx);

            if (!result) {
                _poll.failCnt++;
                // 5 lần liên tiếp fail → dừng
                if (_poll.failCnt >= 5) {
                    console.log('[KK-Patch] TS poll: too many failures, stopping');
                    stopTSPoll();
                }
                return;
            }
            _poll.failCnt = 0;

            if (result.stopped) {
                console.log('[KK-Patch] TS poll: torrent stopped');
                stopTSPoll();
                return;
            }

            var pct = result.percent;
            if (pct <= 0) return;

            // Tính estimated time từ %
            var estTime = 0;
            if (_poll.duration > 0) {
                estTime = Math.floor((_poll.duration * pct) / 100);
            }

            // Lưu progress
            saveP(_poll.url, estTime, _poll.duration || 0, _poll.cwId);
            if (_poll.cwId) updateCWP(_poll.cwId, estTime, _poll.duration || 0);

            console.log('[KK-Patch] TS poll: ' + pct + '% | ~' + Math.floor(estTime/60) + 'm' + (estTime%60) + 's');

            // Detect player tắt: % không thay đổi quá 60s (12 × 5s)
            if (Math.abs(pct - _poll.lastPct) < 2) {
                _poll.stableCnt++;
                if (_poll.stableCnt >= 12) {
                    console.log('[KK-Patch] TS poll: position stable too long, stopping');
                    stopTSPoll();
                    return;
                }
            } else {
                _poll.stableCnt = 0;
            }
            _poll.lastPct = pct;

        }, 5000);
    }

    // ═══════════════════════════════════════════
    // 3. HOOK VÀO LAMPA PLAYER EVENT
    //    Khi player destroy → dừng poll
    //    Khi player timeupdate → update duration nếu chưa có
    // ═══════════════════════════════════════════
    function hookPlayerEvents() {
        if (!window.Lampa || !Lampa.Listener) return;
        Lampa.Listener.follow('player', function (e) {
            if (e.type === 'destroy' || e.type === 'stop') {
                stopTSPoll();
            }
            // Lấy duration từ built-in player nếu đang poll TS
            if ((e.type === 'timeupdate' || e.type === 'play') && _poll.hash && _poll.duration === 0) {
                try {
                    var v = document.querySelector('video');
                    if (v && v.duration && v.duration > 10 && isFinite(v.duration)) {
                        _poll.duration = Math.floor(v.duration);
                        console.log('[KK-Patch] Got duration from video element:', _poll.duration);
                    }
                } catch(ex) {}
            }
        });
        console.log('[KK-Patch] Player events hooked');
    }

    // ═══════════════════════════════════════════
    // 4. EXPOSE API để plugin gốc gọi
    //    window.KKPatch.startTSPoll(...)
    //    window.KKPatch.stopTSPoll()
    // ═══════════════════════════════════════════
    window.KKPatch = {
        startTSPoll: startTSPoll,
        stopTSPoll:  stopTSPoll,

        /**
         * Gọi sau khi plugin gốc doPlay() để bắt đầu poll
         * Tự động lấy hash + fileIdx từ URL TorrServer
         *
         * Ví dụ URL: http://192.168.1.100:8090/stream/fname?link=HASH&index=0&play
         */
        attachToStreamUrl: function (streamUrl, cwId, duration) {
            var h = null, idx = 0;
            try {
                // Parse hash từ ?link=HASH
                var m = streamUrl.match(/[?&]link=([a-fA-F0-9]{40})/);
                if (m) h = m[1];
                // Parse index
                var m2 = streamUrl.match(/[?&]index=(\d+)/);
                if (m2) idx = parseInt(m2[1]);
            } catch(e) {}

            if (!h) {
                console.warn('[KK-Patch] Cannot parse hash from URL:', streamUrl);
                return;
            }

            var cleanUrl = normalizeUrl(streamUrl);
            startTSPoll(h, idx, cleanUrl, cwId || null, duration || 0);
        }
    };

    // ═══════════════════════════════════════════
    // 5. AUTO-INTERCEPT Lampa.Player.play
    //    Tự động detect URL TorrServer và bắt đầu poll
    //    KHÔNG cần sửa plugin gốc
    // ═══════════════════════════════════════════
    function interceptPlayerPlay() {
        if (!window.Lampa || !Lampa.Player) return false;

        var _origPlay = Lampa.Player.play.bind(Lampa.Player);

        Lampa.Player.play = function (data) {
            var url = (data && data.url) || '';
            var host = tsHost();

            // Chỉ intercept nếu URL là TorrServer stream
            if (host && url && url.indexOf(host.replace(/https?:\/\//, '')) > -1
                && url.indexOf('/stream/') > -1) {

                console.log('[KK-Patch] Intercepted TS play:', url);

                // Lấy cwId từ plugin gốc nếu có (qua _currentPlayingCWId)
                var cwId = window.__kk_current_cwid || null;
                var duration = window.__kk_current_duration || 0;

                // Attach poll sau 3s để TS kịp khởi động
                setTimeout(function () {
                    window.KKPatch.attachToStreamUrl(url, cwId, duration);
                }, 3000);
            }

            // Luôn gọi play gốc
            return _origPlay(data);
        };

        console.log('[KK-Patch] Lampa.Player.play intercepted');
        return true;
    }

    // ═══════════════════════════════════════════
    // 6. INIT
    // ═══════════════════════════════════════════
    function init() {
        inject120HzCSS();
        hookPlayerEvents();

        // Thử intercept ngay
        if (!interceptPlayerPlay()) {
            // Lampa chưa sẵn sàng → đợi
            var tries = 0;
            var iv = setInterval(function () {
                tries++;
                if (interceptPlayerPlay()) {
                    clearInterval(iv);
                } else if (tries > 20) {
                    clearInterval(iv);
                    console.warn('[KK-Patch] Could not intercept Lampa.Player.play');
                }
            }, 500);
        }

        console.log('[KK-Patch] v1.0 ready');
    }

    // Chờ Lampa sẵn sàng
    if (window.appready) {
        init();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(init, 1000);
        });
    }

})();