(function () {
    'use strict';
    if (window.__kkphim_plugin_started) return;
    window.__kkphim_plugin_started = true;

    var SOURCES = {
        kkphim: { key: 'kkphim', name: 'KKPhim', api: 'https://phimapi.com/', img: 'https://phimimg.com/' },
        ophim: { key: 'ophim', name: 'OPhim', api: 'https://ophim1.com/', img: 'https://img.ophim.live/uploads/movies/' }
    };
    var TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
    var TMDB_IMG = 'https://image.tmdb.org/t/p/original';
    var TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    var TORRENTIO_BASE = 'https://torrentio.strem.fun';
    var SETTINGS_KEY = 'kkphim_settings';
    var CSS_URL = 'https://nguyenquocngu93.github.io/fshare/style.css';
    var _genreCache = { movie: null, tv: null };

    function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } }
    function saveSettings(o) { try { var c = loadSettings(); Object.keys(o).forEach(function (k) { c[k] = o[k]; }); localStorage.setItem(SETTINGS_KEY, JSON.stringify(c)); } catch (e) {} }
    function getSourceKey() { return loadSettings().source || 'ophim'; }
    function getSource() { return SOURCES[getSourceKey()] || SOURCES.ophim; }
    function SRC_API() { return getSource().api; }
    function SRC_IMG() { return getSource().img; }
    function getTSHost() { return loadSettings().torrserver_host || ''; }
    function getTSPass() { return loadSettings().torrserver_password || ''; }
    function getTioConfig() { return loadSettings().torrentio_config || ''; }
    function getAioUrl() { return loadSettings().aio_url || ''; }
    function getTorrentEngine() { return loadSettings().torrent_engine || 'torrentio'; }
    function getCardStyle() { return loadSettings().card_style || '3'; }
    function getTmdbLang() { return loadSettings().tmdb_lang || 'vi-VN'; }
    function tLang() { return getTmdbLang(); }

    function fullImg(u) { if (!u) return ''; if (u.indexOf('http') === 0) return u; var b = SRC_IMG(); return b ? b + u : u; }
    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function cleanDesc(s) { return String(s || '').replace(/<[^>]+>/g, '').trim() || 'Không có mô tả'; }
    function fmtTxt(s) { return esc(s || '').replace(/\n/g, '<br>'); }
    function normStr(s) { return String(s || '').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '').replace(/\s+/g, ' '); }
    function norm(i) { if (!i) return null; return { name: i.name || i.title || '', origin_name: i.origin_name || '', slug: i.slug || '', poster_url: i.poster_url || i.poster || '', thumb_url: i.thumb_url || i.thumb || '', year: i.year || '', quality: i.quality || '', episode_current: i.episode_current || '', tmdb: i.tmdb || {}, category: Array.isArray(i.category) ? i.category : [], director: i.director || '', content: i.content || '', time: i.time || '', episode_total: i.episode_total || '', type: i.type || '' }; }
    function detectType(d) { if (d && d.tmdb && d.tmdb.type === 'tv') return 'tv'; if (d && d.tmdb && d.tmdb.type === 'movie') return 'movie'; if (d && (d.type === 'series' || d.type === 'tvshows' || d.type === 'hoathinh')) return 'tv'; if (d && d.episode_total && d.episode_total !== '1') return 'tv'; return 'movie'; }
    function getTmdbId(d) { return (d && d.tmdb && d.tmdb.id) ? d.tmdb.id : null; }
    function getFirstEp(eps) { for (var i = 0; i < (eps || []).length; i++) if (eps[i] && eps[i].server_data && eps[i].server_data.length) return eps[i].server_data[0]; return null; }
    function pickLogo(imgs) { if (!imgs || !imgs.logos || !imgs.logos.length) return null; return imgs.logos.find(function (l) { return l.iso_639_1 === 'vi'; }) || imgs.logos.find(function (l) { return l.iso_639_1 === 'en'; }) || imgs.logos[0] || null; }
    function cleanTioConfig(raw) { if (!raw) return ''; raw = String(raw).trim(); if (!raw) return ''; var m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i); if (m) return m[1]; m = raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i); if (m) return m[1].replace(/\/+$/, ''); m = raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i); if (m) return m[1]; if (raw.indexOf('torrentio.strem.fun') > -1) { raw = raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i, '').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i, '').replace(/^\/+|\/+$/g, ''); if (raw && raw.indexOf('=') > -1) return raw.replace(/\|/g, '%7C'); return ''; } raw = raw.replace(/^\/+|\/+$/g, '').replace(/\|/g, '%7C'); return raw.indexOf('=') === -1 ? '' : raw; }

    // AIO: extract base URL from manifest.json link
    function cleanAioBase(raw) {
        if (!raw) return '';
        raw = String(raw).trim();
        // If it ends with /manifest.json, remove it to get base
        raw = raw.replace(/\/manifest\.json\s*$/i, '');
        // Remove trailing slashes
        raw = raw.replace(/\/+$/, '');
        return raw;
    }

    function bindEnter(el, fn) {
        var sx = 0, sy = 0, moved = false, touched = false;
        el.on('touchstart', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t) { sx = t.clientX; sy = t.clientY; moved = false; } });
        el.on('touchmove', function (e) { var t = ((e.originalEvent || e).touches || [])[0]; if (t && (Math.abs(t.clientX - sx) > 16 || Math.abs(t.clientY - sy) > 16)) moved = true; });
        el.on('touchend', function (e) { if (moved) return; touched = true; e.preventDefault(); e.stopPropagation(); setTimeout(function () { fn.call(el[0], e); }, 100); setTimeout(function () { touched = false; }, 350); });
        el.on('click', function (e) { if (touched || moved) return; e.preventDefault(); e.stopPropagation(); fn.call(this, e); });
        el.on('hover:enter', function (e) { fn.call(this, e); });
    }
    function enableScroll(scroll) { var el = scroll.render(); el.css({ overflow: 'hidden', position: 'relative', height: '100%' }); var b = el.find('.scroll__body'), p = { transform: 'none', 'overflow-y': 'auto', 'overflow-x': 'hidden', '-webkit-overflow-scrolling': 'touch', height: '100%', 'padding-bottom': '8em', 'touch-action': 'pan-y' }; b.css($.extend({ position: 'relative' }, p)); if (b[0]) Object.keys(p).forEach(function (k) { b[0].style.setProperty(k, p[k], 'important'); }); }
    function clearScroll(s) { try { s.render().find('.scroll__body').empty(); } catch (e) {} }
    function applyCtrl(scroll) { Lampa.Controller.add('content', { toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); }, right: function () { Navigator.move('right'); }, up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); }, down: function () { Navigator.move('down'); }, back: function () { Lampa.Activity.backward(); } }); setTimeout(function () { Lampa.Controller.toggle('content'); Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(false, scroll.render()); }, 0); }
    function openSearch() { function go(kw) { kw = String(kw || '').trim(); if (kw) Lampa.Activity.push({ url: '', title: 'Tìm kiếm', component: 'kkphim_search', keyword: kw, page_num: 1 }); } try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tìm phim', value: '', free: true }, go); return; } } catch (e) {} go(window.prompt('Tìm phim:')); }
    function openTmdbSearch() { function go(kw) { kw = String(kw || '').trim(); if (kw) Lampa.Activity.push({ url: '', title: 'TMDB: ' + kw, component: 'kkphim_tmdb_search', keyword: kw, page_num: 1 }); } try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: 'Tìm phim TMDB', value: '', free: true }, go); return; } } catch (e) {} go(window.prompt('Tìm phim TMDB:')); }

    // ==================== CSS ====================
    function injectAllCSS() {
        if ($('#kk-all-css').length) return;
        $('<style id="kk-all-css"></style>').text(
            // Source buttons - BIG, 2 lines, centered
            '.kk-src-btn{display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;width:100% !important;padding:1em 1em !important;border-radius:.7em !important;font-weight:700 !important;cursor:pointer !important;border:none !important;text-align:center !important;user-select:none !important;box-sizing:border-box !important;margin-bottom:.35em !important;min-height:3.8em !important}' +
            '.kk-src-btn .kk-sb-main{font-size:1.2em !important;line-height:1.3 !important}' +
            '.kk-src-btn .kk-sb-sub{font-size:.82em !important;opacity:.75 !important;margin-top:.15em !important}' +
            '.kk-src-btn .kk-arrow{font-size:.55em !important;transition:transform .3s !important;display:inline-block !important;margin-left:.3em !important}' +
            '.kk-src-btn.kk-open .kk-arrow{transform:rotate(180deg) !important}' +
            '.kk-src-btn--kkphim{background:linear-gradient(135deg,#e06000,#ff8c32) !important;color:#fff !important}' +
            '.kk-src-btn--ophim{background:linear-gradient(135deg,#0070e0,#3ca0ff) !important;color:#fff !important}' +
            '.kk-src-btn--current{background:linear-gradient(135deg,#2da85a,#5cdb8a) !important;color:#fff !important}' +
            '.kk-src-btn--no{background:rgba(80,80,80,.4) !important;color:rgba(255,255,255,.35) !important;cursor:default !important;min-height:auto !important;padding:.7em 1em !important}' +
            // Episode panel
            '.kk-ep-box{display:none !important;background:rgba(15,15,20,.93) !important;border-radius:.55em !important;margin-bottom:.5em !important;border:1px solid rgba(255,255,255,.07) !important;overflow:hidden !important}' +
            '.kk-ep-box.kk-show{display:block !important}' +
            '.kk-sv-hd{padding:.6em .85em .35em !important;font-size:.95em !important;color:rgba(255,255,255,.45) !important;font-weight:700 !important;text-transform:uppercase !important;letter-spacing:.03em !important}' +
            '.kk-sv-hd:not(:first-child){border-top:1px solid rgba(255,255,255,.06) !important;margin-top:.15em !important}' +
            '.kk-ep-chips{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(3.5em,1fr)) !important;gap:.35em !important;padding:.35em .7em .6em !important}' +
            '.kk-ep-c{display:flex !important;align-items:center !important;justify-content:center !important;padding:.5em .2em !important;border-radius:.4em !important;font-size:.95em !important;font-weight:500 !important;color:rgba(255,255,255,.82) !important;background:rgba(255,255,255,.07) !important;cursor:pointer !important;transition:all .15s !important;text-align:center !important;min-height:2.2em !important}' +
            '.kk-ep-c:hover,.kk-ep-c:focus,.kk-ep-c.focus{background:rgba(255,255,255,.22) !important;color:#fff !important;transform:scale(1.06) !important}' +
            '.kk-ep-c.off{opacity:.28 !important;cursor:default !important}.kk-ep-c.off:hover,.kk-ep-c.off:focus{transform:none !important;background:rgba(255,255,255,.07) !important}' +
            '.kk-ep-ld{padding:1.2em !important;text-align:center !important;color:rgba(255,255,255,.35) !important;font-size:1em !important}' +
            '.kk-ep-er{padding:1em !important;text-align:center !important;color:rgba(255,100,100,.55) !important;font-size:.95em !important}' +
            '.kk-sn-it{display:flex !important;align-items:center !important;gap:.6em !important;padding:.7em .85em !important;cursor:pointer !important;transition:background .15s !important;border-bottom:1px solid rgba(255,255,255,.04) !important}' +
            '.kk-sn-it:hover,.kk-sn-it:focus,.kk-sn-it.focus{background:rgba(255,255,255,.1) !important}' +
            '.kk-sn-it:last-child{border-bottom:none !important}' +
            '.kk-sn-nm{flex:1 !important;font-size:1em !important;color:rgba(255,255,255,.85) !important;font-weight:500 !important}' +
            '.kk-sn-bd{font-size:.78em !important;padding:.2em .5em !important;border-radius:.3em !important;background:rgba(255,255,255,.08) !important;color:rgba(255,255,255,.4) !important}' +
            '.kk-ep-bk{display:flex !important;align-items:center !important;gap:.4em !important;padding:.55em .85em !important;font-size:.9em !important;color:rgba(255,255,255,.5) !important;cursor:pointer !important;border-bottom:1px solid rgba(255,255,255,.06) !important;font-weight:600 !important}' +
            '.kk-ep-bk:hover,.kk-ep-bk:focus,.kk-ep-bk.focus{background:rgba(255,255,255,.08) !important;color:rgba(255,255,255,.8) !important}' +
            // BIGGER TEXT - applies to ALL detail cards
            '.kk-detail-wrap .kk-desc,.kk-body .kk-desc{font-size:1.25em !important;line-height:1.75 !important;color:rgba(255,255,255,.85) !important}' +
            '.kk-detail-wrap .kk-metas,.kk-body .kk-metas{font-size:1.15em !important;gap:.45em !important;flex-wrap:wrap !important}' +
            '.kk-detail-wrap .kk-meta,.kk-body .kk-meta{font-size:1.1em !important;padding:.45em .75em !important}' +
            '.kk-detail-wrap .kk-genres,.kk-body .kk-genres{font-size:1.1em !important;gap:.4em !important;flex-wrap:wrap !important}' +
            '.kk-detail-wrap .kk-genre,.kk-body .kk-genre{font-size:1.1em !important;padding:.45em .85em !important}' +
            '.kk-detail-wrap .kk-crew,.kk-body .kk-crew{font-size:1.2em !important}' +
            '.kk-detail-wrap .kk-crew b,.kk-body .kk-crew b{font-size:1.05em !important}' +
            '.kk-detail-wrap .kk-crew span,.kk-body .kk-crew span{font-size:1.05em !important}' +
            '.kk-detail-wrap .kk-origin,.kk-body .kk-origin{font-size:1.15em !important}' +
            '.kk-detail-wrap .kk-title,.kk-body .kk-title{font-size:1.7em !important}' +
            // Colorful genre chips
            '.kk-genre-bar{display:flex !important;flex-wrap:wrap !important;gap:.45em !important;padding:.8em 1em !important}' +
            '.kk-genre-chip{padding:.55em 1em !important;border-radius:2em !important;font-size:1.05em !important;font-weight:600 !important;cursor:pointer !important;transition:all .2s !important;border:2px solid transparent !important}' +
            '.kk-genre-chip--off{background:rgba(255,255,255,.08) !important;color:rgba(255,255,255,.7) !important;border-color:rgba(255,255,255,.12) !important}' +
            '.kk-genre-chip--off:hover,.kk-genre-chip--off:focus,.kk-genre-chip--off.focus{background:rgba(255,255,255,.15) !important;color:#fff !important;border-color:rgba(255,255,255,.25) !important;transform:scale(1.05) !important}' +
            '.kk-genre-chip--on{background:linear-gradient(135deg,#e06000,#ff9040) !important;color:#fff !important;border-color:#ff8030 !important;box-shadow:0 2px 12px rgba(255,120,0,.35) !important;transform:scale(1.05) !important}' +
            // Clickable cast
            '.kk-cast-card[data-person-id]{cursor:pointer !important;transition:transform .2s !important}' +
            '.kk-cast-card[data-person-id]:hover,.kk-cast-card[data-person-id]:focus,.kk-cast-card[data-person-id].focus{transform:scale(1.08) !important}' +
            // Torrent button also big
            '.kk-act--torrent{min-height:3.8em !important;font-size:1.15em !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important}' +
            ''
        ).appendTo('head');
    }

    // ==================== EXPAND BUILDERS (2-line buttons) ====================
    function mkSrcBtn(cssClass, line1, line2) {
        return $('<div class="kk-src-btn ' + cssClass + ' selector"><div class="kk-sb-main">' + line1 + ' <span class="kk-arrow">▼</span></div>' + (line2 ? '<div class="kk-sb-sub">' + line2 + '</div>' : '') + '</div>');
    }

    function buildMovieExpand(srcKey, srcName, slug, title, cssClass) {
        var wrap = $('<div></div>');
        var btn = mkSrcBtn(cssClass, '▶ ' + esc(srcName), 'Bấm để xem tập');
        var box = $('<div class="kk-ep-box"></div>');
        wrap.append(btn).append(box);
        var loaded = false, open = false;
        bindEnter(btn, function () {
            open = !open; btn.toggleClass('kk-open', open); box.toggleClass('kk-show', open);
            if (open && !loaded) { loaded = true; box.html('<div class="kk-ep-ld">⏳ Đang tải...</div>');
                fetchDetail(SOURCES[srcKey], slug).then(function (det) { if (!det || !det.episodes || !det.episodes.length) { box.html('<div class="kk-ep-er">❌ Không có tập</div>'); return; } box.empty(); fillEps(box, det.episodes, title); }).catch(function (e) { box.html('<div class="kk-ep-er">❌ ' + esc(e.message || 'Lỗi') + '</div>'); }); }
        });
        return wrap;
    }
    function buildTVExpand(srcKey, srcName, slug, title, origTitle, cssClass) {
        var wrap = $('<div></div>');
        var btn = mkSrcBtn(cssClass, '▶ ' + esc(srcName), 'Bấm để chọn season/tập');
        var box = $('<div class="kk-ep-box"></div>');
        wrap.append(btn).append(box);
        var loaded = false, open = false;
        bindEnter(btn, function () {
            open = !open; btn.toggleClass('kk-open', open); box.toggleClass('kk-show', open);
            if (open && !loaded) { loaded = true; box.html('<div class="kk-ep-ld">⏳ Đang tìm seasons...</div>');
                var source = SOURCES[srcKey];
                findAllSeasonSlugs(source, title, origTitle).then(function (entries) {
                    if (!entries.length && slug) entries = [{ slug: slug, name: title, season: 1, source: source }];
                    if (!entries.length) { box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>'); return; }
                    var sMap = {}; entries.forEach(function (e) { if (!sMap[e.season]) sMap[e.season] = []; sMap[e.season].push(e); });
                    var sNums = Object.keys(sMap).map(Number).sort(function (a, b) { return a - b; });
                    if (sNums.length === 1) loadSeason(box, sMap[sNums[0]], title, sNums[0], null);
                    else showSeasons(box, sMap, sNums, title);
                }).catch(function (e) { box.html('<div class="kk-ep-er">❌ ' + esc(e.message || 'Lỗi') + '</div>'); }); }
        });
        return wrap;
    }
    function buildDetailExpand(episodes, title, srcName, cssClass) {
        var wrap = $('<div></div>');
        var total = 0; (episodes || []).forEach(function (sv) { total += (sv.server_data || []).length; });
        var btn = mkSrcBtn(cssClass, '▶ ' + esc(srcName), total + ' tập • Bấm để mở');
        var box = $('<div class="kk-ep-box"></div>');
        wrap.append(btn).append(box);
        if (!episodes || !episodes.length || total === 0) { btn.removeClass(cssClass).addClass('kk-src-btn--no'); btn.html('⚠️ ' + esc(srcName) + ' - Không có tập'); return wrap; }
        if (total === 1) { var ep = getFirstEp(episodes); if (ep) { var link = ep.link_m3u8 || ep.link_embed || ''; btn.find('.kk-sb-main').html('▶ ' + esc(srcName)); btn.find('.kk-sb-sub').text('Phát ngay'); btn.find('.kk-arrow').remove(); bindEnter(btn, function () { if (link) Lampa.Player.play({ title: title, url: link }); else Lampa.Noty.show('Không có link'); }); return wrap; } }
        fillEps(box, episodes, title);
        var open = false;
        bindEnter(btn, function () { open = !open; btn.toggleClass('kk-open', open); box.toggleClass('kk-show', open); });
        return wrap;
    }
    function showSeasons(container, sMap, sNums, title) {
        container.empty();
        sNums.forEach(function (sn) {
            var item = $('<div class="kk-sn-it selector"><span class="kk-sn-nm">📺 Season ' + sn + '</span><span class="kk-sn-bd">' + sMap[sn].length + ' nguồn</span></div>');
            bindEnter(item, function () { loadSeason(container, sMap[sn], title, sn, function () { showSeasons(container, sMap, sNums, title); }); });
            container.append(item);
        });
    }
    async function loadSeason(container, entries, title, sNum, backFn) {
        container.html('<div class="kk-ep-ld">⏳ Tải Season ' + sNum + '...</div>');
        for (var i = 0; i < entries.length; i++) { try { var det = await fetchDetail(entries[i].source, entries[i].slug); if (det && det.episodes && det.episodes.length) { container.empty(); if (backFn) { var bk = $('<div class="kk-ep-bk selector">← Quay lại</div>'); bindEnter(bk, backFn); container.append(bk); } fillEps(container, det.episodes, title + ' S' + pad(sNum)); return; } } catch (e) {} }
        container.html('<div class="kk-ep-er">❌ Không có tập</div>');
    }
    function fillEps(container, episodes, title) {
        episodes.forEach(function (sv) {
            var sName = sv.server_name || 'Server', cnt = (sv.server_data || []).length;
            var icon = '📺', sn = sName.toLowerCase();
            if (sn.indexOf('thuyết minh') > -1 || sn.indexOf('thuyet minh') > -1) icon = '🇻🇳';
            else if (sn.indexOf('vietsub') > -1 || sn.indexOf('sub') > -1) icon = '📝';
            else if (sn.indexOf('lồng') > -1 || sn.indexOf('long') > -1) icon = '🎤';
            container.append('<div class="kk-sv-hd">' + icon + ' ' + esc(sName) + ' (' + cnt + ')</div>');
            var grid = $('<div class="kk-ep-chips"></div>');
            (sv.server_data || []).forEach(function (ep) {
                var link = ep.link_m3u8 || ep.link_embed || '';
                var chip = $('<div class="kk-ep-c selector' + (link ? '' : ' off') + '">' + esc(ep.name || 'Tập') + '</div>');
                bindEnter(chip, function () { if (link) Lampa.Player.play({ title: title + ' - ' + (ep.name || ''), url: link }); else Lampa.Noty.show('Không có link'); });
                grid.append(chip);
            });
            container.append(grid);
        });
    }

    // ==================== TORRSERVER ====================
    function tsUrl(p) { var h = getTSHost(); if (!h) return ''; h = h.replace(/\/+$/, ''); if (h.indexOf('http') !== 0) h = 'http://' + h; return h + p; }
    function tsHdr() { var h = { 'Content-Type': 'application/json' }; var pw = getTSPass(); if (pw) h['Authorization'] = 'Basic ' + btoa('admin:' + pw); return h; }
    function buildMag(h) { var m = 'magnet:?xt=urn:btih:' + h; ['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce','udp://tracker.torrent.eu.org:451/announce'].forEach(function (t) { m += '&tr=' + encodeURIComponent(t); }); return m; }
    async function playViaTS(stream, title, poster, fileIdx) {
        if (!getTSHost()) { Lampa.Noty.show('Chưa cấu hình TorrServer!'); return; } Lampa.Noty.show('Đang gửi TorrServer...');
        try { var u = tsUrl('/torrents'); var r = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'add', link: buildMag(stream.infoHash), title: title || '', poster: poster || '', save_to_db: false }) }); if (!r.ok) throw new Error('TS:' + r.status); var td = await r.json(); var hash = td.hash || stream.infoHash; await delay(2000);
            var info = null, rt = 0; while (rt < 3) { try { var r2 = await fetch(u, { method: 'POST', headers: tsHdr(), body: JSON.stringify({ action: 'get', hash: hash }) }); info = await r2.json(); if (info && info.file_stats && info.file_stats.length) break; } catch (e) {} rt++; await delay(1500); }
            var files = []; if (info && info.file_stats) files = info.file_stats.filter(function (f) { return (f.path || '').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/); }).sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
            if (!files.length) Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=0&play') });
            else if (files.length === 1) Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=' + (files[0].id || 0) + '&play') });
            else if (fileIdx !== undefined && fileIdx !== null && fileIdx >= 0) Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=' + (files[fileIdx].id || fileIdx) + '&play') });
            else { Lampa.Select.show({ title: 'Chọn file', items: files.map(function (f, i) { return { title: (f.path || '').split('/').pop() + (f.length ? ' (' + (f.length / 1048576).toFixed(0) + 'MB)' : ''), value: f }; }), onSelect: function (a) { Lampa.Player.play({ title: title, url: tsUrl('/stream/fname?link=' + hash + '&index=' + a.value.id + '&play') }); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
        } catch (e) { Lampa.Noty.show('Lỗi TS: ' + (e.message || '')); }
    }

    // ==================== TMDB ====================
    async function tmdbFetch(path) { var r = await fetch('https://api.themoviedb.org/3' + path, { headers: { 'Authorization': 'Bearer ' + TMDB_TOKEN, 'Content-Type': 'application/json' } }); if (!r.ok) throw new Error('TMDB ' + r.status); return await r.json(); }
    async function getImdbId(type, id) { if (!id) return null; try { return (await tmdbFetch('/' + type + '/' + id + '/external_ids')).imdb_id || null; } catch (e) { return null; } }
    async function getTmdbSeasons(id) { try { var r = await tmdbFetch('/tv/' + id + '?language=' + tLang()); if (r && r.seasons) return r.seasons.filter(function (s) { return s.season_number > 0; }).map(function (s) { return { season_number: s.season_number, name: s.name || ('Season ' + s.season_number), episode_count: s.episode_count || 0 }; }); } catch (e) {} return []; }
    async function loadGenres(type) { if (_genreCache[type]) return _genreCache[type]; try { var r = await tmdbFetch('/genre/' + type + '/list?language=' + tLang()); _genreCache[type] = r.genres || []; return _genreCache[type]; } catch (e) { return []; } }
    async function tmdbPersonCredits(personId) { try { return await tmdbFetch('/person/' + personId + '/combined_credits?language=' + tLang()); } catch (e) { return null; } }
    var TMDB_FN = { trending: function (p) { return tmdbFetch('/trending/all/week?language=' + tLang() + '&page=' + p); }, trending_day: function (p) { return tmdbFetch('/trending/all/day?language=' + tLang() + '&page=' + p); }, popular_movies: function (p) { return tmdbFetch('/movie/popular?language=' + tLang() + '&page=' + p); }, popular_tv: function (p) { return tmdbFetch('/tv/popular?language=' + tLang() + '&page=' + p); }, top_movies: function (p) { return tmdbFetch('/movie/top_rated?language=' + tLang() + '&page=' + p); }, top_tv: function (p) { return tmdbFetch('/tv/top_rated?language=' + tLang() + '&page=' + p); }, now_playing: function (p) { return tmdbFetch('/movie/now_playing?language=' + tLang() + '&page=' + p); }, upcoming: function (p) { return tmdbFetch('/movie/upcoming?language=' + tLang() + '&page=' + p); }, airing_today: function (p) { return tmdbFetch('/tv/airing_today?language=' + tLang() + '&page=' + p); }, on_the_air: function (p) { return tmdbFetch('/tv/on_the_air?language=' + tLang() + '&page=' + p); } };
    async function tmdbSearchMulti(q, p) { return await tmdbFetch('/search/multi?language=' + tLang() + '&query=' + encodeURIComponent(q) + '&page=' + (p || 1)); }
    async function tmdbDetailFull(type, id) { return await tmdbFetch('/' + type + '/' + id + '?language=' + tLang() + '&append_to_response=credits,images,similar,external_ids'); }
    async function tmdbImagesFull(type, id) { return await tmdbFetch('/' + type + '/' + id + '/images'); }
    async function tmdbDiscover(type, gid, p) { return await tmdbFetch('/discover/' + type + '?language=' + tLang() + '&sort_by=popularity.desc&with_genres=' + gid + '&page=' + (p || 1)); }
    function tmdbNormCard(item) { if (!item) return null; var mt = item.media_type || (item.first_air_date ? 'tv' : 'movie'); return { tmdb_id: item.id, media_type: mt, name: item.title || item.name || '', poster_url: item.poster_path ? TMDB_IMG_W500 + item.poster_path : '', year: (item.release_date || item.first_air_date || '').slice(0, 4), vote: item.vote_average ? Number(item.vote_average).toFixed(1) : '' }; }

    // ==================== SLUG / SEASON ====================
    async function searchSourceSlug(source, kw) { try { var r = await fetch(source.api + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=1'); if (!r.ok) return []; var d = await r.json(); return (d && d.data && d.data.items) || (d && d.items) || []; } catch (e) { return []; } }
    function matchBest(items, title, origTitle, year) { if (!items || !items.length) return null; var nT = normStr(title), nO = normStr(origTitle); for (var i = 0; i < items.length; i++) { var n1 = normStr(items[i].name || items[i].title || ''), n2 = normStr(items[i].origin_name || items[i].original_name || ''); if ((nT && (n1 === nT || n2 === nT)) || (nO && (n1 === nO || n2 === nO))) { if (!year || !items[i].year || String(items[i].year) === String(year)) return items[i]; } } for (var j = 0; j < items.length; j++) { var m1 = normStr(items[j].name || items[j].title || ''), m2 = normStr(items[j].origin_name || items[j].original_name || ''); if ((nT && (m1.indexOf(nT) > -1 || nT.indexOf(m1) > -1)) || (nO && (m2.indexOf(nO) > -1 || nO.indexOf(m2) > -1))) { if (!year || !items[j].year || String(items[j].year) === String(year)) return items[j]; } } return null; }
    async function findAllSlugs(title, origTitle, year) { var results = { kkphim: null, ophim: null }; var terms = [title]; if (origTitle && origTitle !== title) terms.push(origTitle); for (var i = 0; i < terms.length; i++) { if (!results.kkphim) { var f1 = matchBest(await searchSourceSlug(SOURCES.kkphim, terms[i]), title, origTitle, year); if (f1 && f1.slug) results.kkphim = f1.slug; } if (!results.ophim) { var f2 = matchBest(await searchSourceSlug(SOURCES.ophim, terms[i]), title, origTitle, year); if (f2 && f2.slug) results.ophim = f2.slug; } if (results.kkphim && results.ophim) break; } return results; }
    async function fetchDetail(source, slug) { try { var r = await fetch(source.api + 'phim/' + slug); if (!r.ok) return null; var d = await r.json(); return { movie: d.movie || d || {}, episodes: d.episodes || [] }; } catch (e) { return null; } }
    function extractSeasonNum(name, slug) { var m = name.match(/season\s*(\d+)/i) || name.match(/phần\s*(\d+)/i) || slug.match(/season-(\d+)/i) || slug.match(/phan-(\d+)/i) || name.match(/S(\d+)/); if (m) return parseInt(m[1]); var nm = name.match(/(\d+)$/) || slug.match(/-(\d+)$/); if (nm) { var n = parseInt(nm[1]); if (n >= 2 && n <= 30) return n; } return 1; }
    async function findAllSeasonSlugs(source, title, origTitle) { var results = []; try { var items = await searchSourceSlug(source, title); if (!items.length && origTitle) items = await searchSourceSlug(source, origTitle); var nT = normStr(title), nO = normStr(origTitle); for (var i = 0; i < items.length; i++) { var it = items[i]; if (!it.slug) continue; var n1 = normStr(it.name || it.title || ''), n2 = normStr(it.origin_name || it.original_name || ''); var match = false; if (nT && (n1.indexOf(nT) > -1 || nT.indexOf(n1) > -1 || n1 === nT)) match = true; if (nO && (n2.indexOf(nO) > -1 || nO.indexOf(n2) > -1 || n2 === nO)) match = true; if (!match && results.length > 0) { var bs = normStr(results[0].slug), cs = normStr(it.slug); if (cs.indexOf(bs) > -1 || bs.indexOf(cs) > -1) match = true; } if (match) results.push({ slug: it.slug, name: it.name || it.title || '', season: extractSeasonNum(it.name || it.title || '', it.slug || ''), source: source }); } } catch (e) {} return results; }

    // ==================== TORRENTIO / AIO ====================
    function tioUrl(type, imdbId, s, e) { var t = type === 'tv' ? 'series' : 'movie', id = imdbId; if (type === 'tv' && s && e) id = imdbId + ':' + s + ':' + e; var c = cleanTioConfig(getTioConfig()); return TORRENTIO_BASE + (c ? '/' + c : '') + '/stream/' + t + '/' + id + '.json'; }

    function aioStreamUrl(type, imdbId, s, e) {
        var base = cleanAioBase(getAioUrl());
        if (!base) return '';
        var t = type === 'tv' ? 'series' : 'movie', id = imdbId;
        if (type === 'tv' && s && e) id = imdbId + ':' + s + ':' + e;
        return base + '/stream/' + t + '/' + id + '.json';
    }

    async function fetchStreams(type, imdbId, s, e) {
        var engine = getTorrentEngine(), url;
        if (engine === 'aio') {
            url = aioStreamUrl(type, imdbId, s, e);
            if (!url) throw new Error('Chưa cấu hình AIOStreams');
        } else {
            url = tioUrl(type, imdbId, s, e);
        }
        var r = await fetch(url); if (!r.ok) throw new Error(engine + ' ' + r.status); var d = await r.json();
        return (d.streams || []).map(function (st) { var lines = (st.title || '').split('\n'), name = lines[0] || '?', info = lines.slice(1).join(' | '); var sm = info.match(/([\d.]+\s*[GMKT]B)/i), sd = info.match(/(\d+)\s*(seed|peer)/i); return { name: name, title: st.title || '', infoHash: st.infoHash || '', fileIdx: st.fileIdx, url: st.url || '', size: sm ? sm[1] : '', seeds: sd ? sd[1] : '', rawName: st.name || '' }; });
    }
    function showStreamResults(streams, title, poster) { var ts = !!getTSHost(); var eng = getTorrentEngine() === 'aio' ? 'AIO' : 'Torrent'; Lampa.Select.show({ title: eng + ': ' + title + ' (' + streams.length + ')' + (ts ? ' → TS' : ''), items: streams.slice(0, 40).map(function (s) { var l = s.name; if (s.size) l += ' | ' + s.size; if (s.seeds) l += ' | S:' + s.seeds; return { title: l, value: s }; }), onSelect: function (a) { var s = a.value; if (ts && s.infoHash) playViaTS(s, title, poster, s.fileIdx); else if (s.url) Lampa.Player.play({ title: title, url: s.url }); else Lampa.Noty.show(s.infoHash ? 'Chưa cấu hình TS!' : 'Không có link'); }, onBack: function () { Lampa.Controller.toggle('content'); } }); }
    async function openTorrentMovie(tmdbId, title, poster, imdbId) { Lampa.Noty.show('Tìm torrent...'); try { var imdb = imdbId || await getImdbId('movie', tmdbId); if (!imdb) { Lampa.Noty.show('Không tìm thấy IMDB ID'); return; } var streams = await fetchStreams('movie', imdb); if (!streams.length) { Lampa.Noty.show('Không có torrent'); return; } showStreamResults(streams, title, poster); } catch (e) { Lampa.Noty.show('Lỗi: ' + (e.message || '')); } }
    async function openTorrentTV(tmdbId, title, poster, imdbId) { Lampa.Noty.show('Tải danh sách season...'); try { var imdb = imdbId || await getImdbId('tv', tmdbId); if (!imdb) { Lampa.Noty.show('Không tìm thấy IMDB ID'); return; } var seasons = await getTmdbSeasons(tmdbId); if (seasons.length > 1) { Lampa.Select.show({ title: 'Chọn Season', items: seasons.map(function (s) { return { title: s.name + (s.episode_count ? ' (' + s.episode_count + ' tập)' : ''), value: s }; }), onSelect: function (a) { pickTorrentEp(a.value, imdb, title, poster); }, onBack: function () { Lampa.Controller.toggle('content'); } }); } else if (seasons.length === 1) pickTorrentEp(seasons[0], imdb, title, poster); else { Lampa.Noty.show('Không tìm thấy season'); } } catch (e) { Lampa.Noty.show('Lỗi: ' + (e.message || '')); } }
    function pickTorrentEp(season, imdb, title, poster) { var items = []; for (var i = 1; i <= (season.episode_count || 1); i++) items.push({ title: 'S' + pad(season.season_number) + 'E' + pad(i), value: { s: season.season_number, e: i } }); Lampa.Select.show({ title: season.name, items: items, onSelect: async function (a) { var label = title + ' S' + pad(a.value.s) + 'E' + pad(a.value.e); Lampa.Noty.show('Tìm ' + label + '...'); try { var streams = await fetchStreams('tv', imdb, a.value.s, a.value.e); if (!streams.length) { Lampa.Noty.show('Không có torrent'); return; } showStreamResults(streams, label, poster); } catch (e) { Lampa.Noty.show('Lỗi: ' + (e.message || '')); } }, onBack: function () { Lampa.Controller.toggle('content'); } }); }

    // ==================== CARDS ====================
    function mkPeople(list, key, clickable) { return (list || []).map(function (p) { var av = p.profile_path ? '<img src="' + TMDB_IMG_W500 + p.profile_path + '">' : '<div class="kk-cast-empty"></div>'; var cls = clickable && p.id ? ' selector" data-person-id="' + p.id + '"' : '"'; return '<div class="kk-cast-card' + cls + '><div class="kk-cast-img">' + av + '</div><div class="kk-cast-name">' + esc(p.name || '') + '</div><div class="kk-cast-role">' + esc(p[key] || '') + '</div></div>'; }).join(''); }
    function bindCastClicks(container) { container.find('.kk-cast-card[data-person-id]').each(function () { var card = $(this); bindEnter(card, function () { var pid = card.attr('data-person-id'); if (pid) Lampa.Activity.push({ url: '', title: card.find('.kk-cast-name').text() || 'Diễn viên', component: 'kkphim_person', person_id: parseInt(pid), page: 1 }); }); }); }
    function mkCard(item) { var n = norm(item); if (!n) return $('<div></div>'); var p = fullImg(n.poster_url || n.thumb_url); var c = $('<div class="kk-card selector"><div class="kk-card-img"><img src="' + p + '">' + (n.quality ? '<div class="kk-card-q">' + esc(n.quality) + '</div>' : '') + (n.episode_current ? '<div class="kk-card-ep">' + esc(n.episode_current) + '</div>' : '') + '</div><div class="kk-card-name">' + esc(n.name) + '</div><div class="kk-card-year">' + esc(n.year) + '</div></div>'); bindEnter(c, function () { if (n.slug) Lampa.Activity.push({ url: '', title: n.name || '', component: 'kkphim_detail', movie: n, page: 1 }); }); return c; }
    function mkTmdbCard(item) { var d = tmdbNormCard(item); if (!d || !d.tmdb_id) return $('<div></div>'); var c = $('<div class="kk-card selector"><div class="kk-card-img">' + (d.poster_url ? '<img src="' + d.poster_url + '">' : '<div style="width:100%;height:100%;background:#333"></div>') + (d.vote ? '<div class="kk-card-q">⭐' + esc(d.vote) + '</div>' : '') + (d.media_type === 'tv' ? '<div class="kk-card-ep">TV</div>' : '') + '</div><div class="kk-card-name">' + esc(d.name) + '</div><div class="kk-card-year">' + esc(d.year) + '</div></div>'); bindEnter(c, function () { Lampa.Activity.push({ url: '', title: d.name || '', component: 'kkphim_tmdb_detail', tmdb_id: d.tmdb_id, media_type: d.media_type, page: 1 }); }); return c; }
    function makeGridComp(name, fetchItems, titleFn) { Lampa.Component.add(name, function (obj) { var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, page = obj.page_num || 1; var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true; this.create = function () { comp.activity.loader(true); clearScroll(scroll); grid.css('grid-template-columns', 'repeat(' + getCardStyle() + ',minmax(0,1fr))'); scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(titleFn(obj)) + '</div>').append(grid).append(lm)); bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad(); }; function doLoad() { loading = true; lm.text('Đang tải...'); fetchItems(obj, page).then(function (items) { if (!items.length) { hasMore = false; lm.text(page <= 1 ? 'Không có kết quả' : 'Hết'); } else { items.forEach(function (i) { grid.append(mkTmdbCard(i).addClass('kk-card--grid')); }); page++; lm.text('Tải thêm'); } loading = false; comp.activity.loader(false); comp.start(); }).catch(function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }); } this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); }; }); }

    function injectCSS() { if ($('#kk-css').length) return; var link = document.createElement('link'); link.id = 'kk-css'; link.rel = 'stylesheet'; link.href = CSS_URL; document.head.appendChild(link); }
    function addMenu() { function ins() { if ($('.menu__item[data-action="kkphim"]').length) return; var m = $('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>'); bindEnter(m, function () { Lampa.Activity.push({ url: '', title: 'KKPhim', component: 'kkphim_main', page: 1 }); }); $('.menu .menu__list').first().append(m); } setTimeout(ins, 500); Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') setTimeout(ins, 500); }); }

    function startPlugin() {
        injectCSS(); injectAllCSS(); addMenu();

        // ===== SETTINGS =====
        Lampa.Component.add('kkphim_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            this.create = function () {
                clearScroll(scroll); var s = loadSettings(), w = $('<div class="kk-stg-wrap"></div>');
                w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');
                var g0 = mkGroup('📺 Nguồn phim'); var cur = s.source || 'ophim';
                Object.keys(SOURCES).forEach(function (k) { var src = SOURCES[k]; g0.append(mkOpt(src.name, 'API: ' + src.api, cur === k, function () { saveSettings({ source: k }); Lampa.Noty.show(src.name); comp.create(); })); }); w.append(g0);
                var g5 = mkGroup('🎨 Giao diện'); var curGrid = s.card_style || '3';
                [{ k:'2',n:'2 cột' },{ k:'3',n:'3 cột' },{ k:'4',n:'4 cột' }].forEach(function (opt) { g5.append(mkOpt(opt.n, 'Số cột', curGrid === opt.k, function () { saveSettings({ card_style: opt.k }); Lampa.Noty.show(opt.n); comp.create(); })); }); w.append(g5);
                var g6 = mkGroup('🌐 Ngôn ngữ TMDB'); var curLang = s.tmdb_lang || 'vi-VN';
                [{ k:'vi-VN',n:'Tiếng Việt' },{ k:'en-US',n:'English' },{ k:'ja-JP',n:'日本語' },{ k:'ko-KR',n:'한국어' },{ k:'zh-CN',n:'中文' }].forEach(function (opt) { g6.append(mkOpt(opt.n, opt.k, curLang === opt.k, function () { saveSettings({ tmdb_lang: opt.k }); _genreCache = { movie: null, tv: null }; Lampa.Noty.show(opt.n); comp.create(); })); }); w.append(g6);
                // Torrent engine
                var gE = mkGroup('🎯 Nguồn Torrent'); var curEngine = s.torrent_engine || 'torrentio';
                gE.append(mkOpt('Torrentio', 'torrentio.strem.fun', curEngine === 'torrentio', function () { saveSettings({ torrent_engine: 'torrentio' }); comp.create(); }));
                gE.append(mkOpt('AIOStreams', 'Dán link manifest.json', curEngine === 'aio', function () { saveSettings({ torrent_engine: 'aio' }); comp.create(); }));
                w.append(gE);
                // TS
                var g1 = mkGroup('🖥️ TorrServer');
                g1.append(mkInput('Địa chỉ', '192.168.1.100:8090', s.torrserver_host || 'Chưa cài', 'Địa chỉ TS', 'torrserver_host', s));
                g1.append(mkInput('Mật khẩu', 'Để trống nếu không', s.torrserver_password ? '••••' : 'Không', 'Mật khẩu', 'torrserver_password', s));
                w.append(g1);
                // Torrentio config
                var g2 = mkGroup('🧲 Torrentio');
                g2.append(mkInput('Config URL', 'Dán link manifest', s.torrentio_config ? 'Có' : 'Mặc định', 'Torrentio Config', 'torrentio_config', s));
                w.append(g2);
                // AIO - just a URL input
                var gA = mkGroup('🌊 AIOStreams');
                gA.append(mkInput('Link manifest.json', 'Dán full link .../manifest.json', s.aio_url || 'Chưa cài', 'AIO manifest URL', 'aio_url', s));
                var stA = $('<div class="kk-stg-status" style="display:none"></div>');
                var tA = si('🧪 Kiểm tra AIO', 'Test Inception', 'Nhấn');
                bindEnter(tA, async function () {
                    var base = cleanAioBase(getAioUrl());
                    if (!base) { stA.show().attr('class', 'kk-stg-status kk-stg-status--err').text('❌ Chưa nhập link'); return; }
                    stA.show().attr('class', 'kk-stg-status kk-stg-status--loading').text('⏳');
                    try { var r = await fetch(base + '/stream/movie/tt1375666.json'); if (!r.ok) { stA.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + r.status); return; } var d = await r.json(); stA.attr('class', 'kk-stg-status kk-stg-status--ok').text('✅ ' + (d.streams || []).length + ' streams'); } catch (e) { stA.attr('class', 'kk-stg-status kk-stg-status--err').text('❌ ' + (e.message || '')); }
                });
                gA.append(tA).append(stA); w.append(gA);
                // Cache
                var g7 = mkGroup('🗃️ Cache');
                var cc = si('Xóa cache', 'Đặt lại genres', 'Xóa'); bindEnter(cc, function () { _genreCache = { movie: null, tv: null }; Lampa.Noty.show('OK'); }); g7.append(cc); w.append(g7);
                var g4 = $('<div class="kk-stg-group"></div>');
                var cl = si('🗑️ Xóa toàn bộ', 'Khôi phục mặc định', 'Xóa'); cl.find('.kk-stg-value').css('color', '#f87171');
                bindEnter(cl, function () { localStorage.removeItem(SETTINGS_KEY); _genreCache = { movie: null, tv: null }; Lampa.Noty.show('OK'); Lampa.Activity.backward(); }); g4.append(cl); w.append(g4);
                w.append('<div class="kk-stg-ver">KKPhim v2.7</div>');
                scroll.append(w); comp.start();
            };
            function mkGroup(t) { return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">' + t + '</div>'); }
            function si(n, d, v) { return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">' + esc(n) + '</div>' + (d ? '<div class="kk-stg-label-desc">' + esc(d) + '</div>' : '') + '</div><div class="kk-stg-value">' + esc(v) + '</div></div>'); }
            function mkOpt(n, d, on, cb) { var it = si(n, d, on ? '✅' : '○'); if (on) it.find('.kk-stg-value').css('color', '#4ade80'); bindEnter(it, cb); return it; }
            function mkInput(n, d, val, prompt, key, s) { var it = si(n, d, val); bindEnter(it, function () { try { if (Lampa.Input && Lampa.Input.edit) { Lampa.Input.edit({ title: prompt, value: s[key] || '', free: true, nosave: true }, function (v) { v = (v || '').trim(); var o = {}; o[key] = v; saveSettings(o); s[key] = v; it.find('.kk-stg-value').text(v || val); }); return; } } catch (e) {} var v = window.prompt(prompt, s[key] || ''); if (v !== null) { v = v.trim(); var o = {}; o[key] = v; saveSettings(o); s[key] = v; it.find('.kk-stg-value').text(v || val); } }); return it; }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // ===== PERSON (2 rows + infinite load page) =====
        Lampa.Component.add('kkphim_person', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, personId = obj.person_id;
            this.create = function () {
                comp.activity.loader(true); clearScroll(scroll);
                if (!personId) { comp.activity.loader(false); comp.start(); return; }
                Promise.all([tmdbFetch('/person/' + personId + '?language=' + tLang()), tmdbPersonCredits(personId)]).then(function (res) {
                    var person = res[0], credits = res[1];
                    var w = $('<div class="kk-detail-wrap"></div>');
                    var av = person.profile_path ? TMDB_IMG_W500 + person.profile_path : '';
                    w.append('<div style="padding:1em;display:flex;gap:1em;align-items:flex-start"><div style="width:120px;flex-shrink:0;border-radius:.5em;overflow:hidden">' + (av ? '<img src="' + av + '" style="width:100%;display:block">' : '') + '</div><div style="flex:1"><div style="font-size:1.5em;font-weight:700;margin-bottom:.3em">' + esc(person.name || '') + '</div>' + (person.birthday ? '<div style="font-size:1em;color:rgba(255,255,255,.5)">🎂 ' + esc(person.birthday) + '</div>' : '') + (person.known_for_department ? '<div style="font-size:.95em;color:rgba(255,255,255,.5)">🎬 ' + esc(person.known_for_department) + '</div>' : '') + '</div></div>');
                    if (person.biography) w.append('<div style="padding:0 1em 1em;font-size:1.1em;line-height:1.6;color:rgba(255,255,255,.7)">' + fmtTxt((person.biography || '').substring(0, 600)) + (person.biography.length > 600 ? '...' : '') + '</div>');

                    if (credits && credits.cast) {
                        var movies = credits.cast.filter(function (c) { return c.media_type === 'movie'; }).sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
                        var tvs = credits.cast.filter(function (c) { return c.media_type === 'tv'; }).sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
                        // Movies row
                        if (movies.length) {
                            var row1 = $('<div class="kk-row"></div>'), rl1 = $('<div class="kk-row-list"></div>');
                            var more1 = $('<div class="kk-row-more selector">Xem thêm (' + movies.length + ')</div>');
                            bindEnter(more1, function () { Lampa.Activity.push({ url: '', title: (person.name || '') + ' - Phim lẻ', component: 'kkphim_person_films', person_id: personId, film_type: 'movie', page: 1 }); });
                            movies.slice(0, 10).forEach(function (c) { rl1.append(mkTmdbCard(c)); });
                            row1.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎬 Phim lẻ (' + movies.length + ')</div>').append(more1)).append(rl1);
                            w.append(row1);
                        }
                        // TV row
                        if (tvs.length) {
                            var row2 = $('<div class="kk-row"></div>'), rl2 = $('<div class="kk-row-list"></div>');
                            var more2 = $('<div class="kk-row-more selector">Xem thêm (' + tvs.length + ')</div>');
                            bindEnter(more2, function () { Lampa.Activity.push({ url: '', title: (person.name || '') + ' - Phim bộ', component: 'kkphim_person_films', person_id: personId, film_type: 'tv', page: 1 }); });
                            tvs.slice(0, 10).forEach(function (c) { rl2.append(mkTmdbCard(c)); });
                            row2.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">📺 Phim bộ (' + tvs.length + ')</div>').append(more2)).append(rl2);
                            w.append(row2);
                        }
                    }
                    scroll.append(w); comp.activity.loader(false); comp.start();
                }).catch(function (e) { comp.activity.loader(false); Lampa.Noty.show('Lỗi: ' + (e.message || '')); });
            };
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // Person films - infinite load grid
        Lampa.Component.add('kkphim_person_films', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var personId = obj.person_id, filmType = obj.film_type || 'movie';
            var allFilms = [], rendered = 0, perPage = 20;
            var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>');
            this.create = function () {
                comp.activity.loader(true); clearScroll(scroll);
                grid.css('grid-template-columns', 'repeat(' + getCardStyle() + ',minmax(0,1fr))');
                scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(obj.title || 'Phim') + '</div>').append(grid).append(lm));
                bindEnter(lm, function () { renderMore(); });
                tmdbPersonCredits(personId).then(function (credits) {
                    if (credits && credits.cast) {
                        allFilms = credits.cast.filter(function (c) { return c.media_type === filmType; }).sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
                    }
                    renderMore();
                    comp.activity.loader(false); comp.start();
                }).catch(function () { comp.activity.loader(false); lm.text('Lỗi'); });
            };
            function renderMore() {
                var batch = allFilms.slice(rendered, rendered + perPage);
                if (!batch.length) { lm.text('Hết'); return; }
                batch.forEach(function (c) { grid.append(mkTmdbCard(c).addClass('kk-card--grid')); });
                rendered += batch.length;
                lm.text(rendered >= allFilms.length ? 'Hết (' + allFilms.length + ')' : 'Tải thêm (' + rendered + '/' + allFilms.length + ')');
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // ===== MAIN =====
        Lampa.Component.add('kkphim_main', function () {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, _src = '';
            var cats = [{ name: 'Phim Mới', api: 'danh-sach/phim-moi-cap-nhat' }, { name: 'Phim Bộ', api: 'v1/api/danh-sach/phim-bo' }, { name: 'Phim Lẻ', api: 'v1/api/danh-sach/phim-le' }, { name: 'Hoạt Hình', api: 'v1/api/danh-sach/hoat-hinh' }, { name: 'TV Shows', api: 'v1/api/danh-sach/tv-shows' }];
            this.create = function () { network.clear(); this.activity.loader(true); clearScroll(scroll); var src = getSource(); _src = src.key; var tb = $('<div class="kk-topbar"><div class="kk-topbar-title">' + esc(src.name) + '</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>'); bindEnter($(tb.find('.kk-btn')[0]), openSearch); bindEnter($(tb.find('.kk-btn')[1]), function () { Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings' }); }); scroll.append(tb); var sb = $('<div class="kk-srcbar"></div>'); Object.keys(SOURCES).forEach(function (k) { var s = SOURCES[k], on = k === src.key; var btn = $('<div class="kk-srcbtn selector ' + (on ? 'kk-srcbtn--on' : 'kk-srcbtn--off') + '">' + esc(s.name) + '</div>'); bindEnter(btn, function () { if (on) return; saveSettings({ source: k }); Lampa.Noty.show(s.name); comp.create(); }); sb.append(btn); }); var tmdbBtn = $('<div class="kk-srcbtn selector kk-srcbtn--off" style="background:rgba(1,180,228,.15);border-color:rgba(1,180,228,.4);color:#01b4e4">TMDB</div>'); bindEnter(tmdbBtn, function () { Lampa.Activity.push({ url: '', title: 'TMDB', component: 'kkphim_tmdb_main', page: 1 }); }); sb.append(tmdbBtn); scroll.append(sb); var loaded = 0; cats.forEach(function (cat) { network.silent(SRC_API() + cat.api + '?page=1', function (res) { var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; }); if (list.length) { var row = $('<div class="kk-row"></div>'), more = $('<div class="kk-row-more selector">Xem thêm</div>'), rl = $('<div class="kk-row-list"></div>'); bindEnter(more, function () { Lampa.Activity.push({ url: '', title: cat.name, component: 'kkphim_category', cat: cat, page_num: 1, mode: 'api' }); }); list.slice(0, 12).forEach(function (i) { rl.append(mkCard(i)); }); row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + esc(cat.name) + '</div>').append(more)).append(rl); scroll.append(row); } loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } }, function () { loaded++; if (loaded >= cats.length) { comp.activity.loader(false); comp.start(); } }); }); };
            this.start = function () { if (_src && _src !== getSourceKey()) { comp.create(); return; } applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });

        // ===== TMDB MAIN =====
        Lampa.Component.add('kkphim_tmdb_main', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this;
            var sections = [{ name: '🔥 Xu hướng', lt: 'trending_day' }, { name: '🌟 Tuần', lt: 'trending' }, { name: '🎬 Chiếu rạp', lt: 'now_playing' }, { name: '📅 Sắp chiếu', lt: 'upcoming' }, { name: '🌟 Phim lẻ', lt: 'popular_movies' }, { name: '📺 Phim bộ', lt: 'popular_tv' }, { name: '📺 Phát sóng', lt: 'on_the_air' }, { name: '⭐ Top lẻ', lt: 'top_movies' }, { name: '⭐ Top bộ', lt: 'top_tv' }];
            this.create = function () { comp.activity.loader(true); clearScroll(scroll); var tb = $('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">TMDB</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>'); bindEnter($(tb.find('.kk-btn')[0]), openTmdbSearch); bindEnter($(tb.find('.kk-btn')[1]), function () { Lampa.Activity.push({ url: '', title: 'Cài đặt', component: 'kkphim_settings' }); }); scroll.append(tb); var sb = $('<div class="kk-srcbar"></div>'); Object.keys(SOURCES).forEach(function (k) { var s = SOURCES[k]; var btn = $('<div class="kk-srcbtn selector kk-srcbtn--off">' + esc(s.name) + '</div>'); bindEnter(btn, function () { saveSettings({ source: k }); Lampa.Activity.push({ url: '', title: 'KKPhim', component: 'kkphim_main', page: 1 }); }); sb.append(btn); }); sb.append('<div class="kk-srcbtn kk-srcbtn--on" style="background:rgba(1,180,228,.25);border-color:rgba(1,180,228,.5);color:#01b4e4">TMDB</div>'); scroll.append(sb); var loaded = 0; sections.forEach(function (sec) { var fn = TMDB_FN[sec.lt]; if (!fn) { loaded++; return; } fn(1).then(function (res) { var items = (res.results || []).filter(function (i) { return i.media_type !== 'person'; }); if (items.length) { var row = $('<div class="kk-row"></div>'), more = $('<div class="kk-row-more selector">Xem thêm</div>'), rl = $('<div class="kk-row-list"></div>'); bindEnter(more, function () { Lampa.Activity.push({ url: '', title: sec.name, component: 'kkphim_tmdb_list', listType: sec.lt, page_num: 1 }); }); items.slice(0, 12).forEach(function (i) { rl.append(mkTmdbCard(i)); }); row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">' + esc(sec.name) + '</div>').append(more)).append(rl); scroll.append(row); } loaded++; if (loaded >= sections.length) { comp.activity.loader(false); comp.start(); } }).catch(function () { loaded++; if (loaded >= sections.length) { comp.activity.loader(false); comp.start(); } }); }); };
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        makeGridComp('kkphim_tmdb_list', function (obj, page) { var fn = TMDB_FN[obj.listType] || TMDB_FN.trending; return fn(page).then(function (r) { return (r.results || []).filter(function (i) { return i.media_type !== 'person'; }); }); }, function (obj) { return obj.title || 'TMDB'; });
        makeGridComp('kkphim_tmdb_search', function (obj, page) { return tmdbSearchMulti(obj.keyword || '', page).then(function (r) { return (r.results || []).filter(function (i) { return i.media_type !== 'person'; }); }); }, function (obj) { return '🔍 ' + (obj.keyword || ''); });

        // ===== TMDB GENRE - infinite scroll =====
        Lampa.Component.add('kkphim_tmdb_genre', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, curGid = String(obj.genre_id || '');
            var grid = $('<div class="kk-grid"></div>');
            var loading = false, movieDone = false, tvDone = false, moviePage = 1, tvPage = 1, allItems = [], renderedSet = {};
            this.create = function () {
                comp.activity.loader(true); clearScroll(scroll);
                grid.css('grid-template-columns', 'repeat(' + getCardStyle() + ',minmax(0,1fr))');
                var genreBar = $('<div class="kk-genre-bar"></div>'); scroll.append(genreBar);
                var wrap = $('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title" id="kk-gtitle">' + esc(obj.title || 'Thể loại') + '</div>').append(grid);
                scroll.append(wrap);
                // Infinite scroll
                var scrollBody = scroll.render().find('.scroll__body');
                scrollBody.on('scroll', function () {
                    if (loading || (movieDone && tvDone)) return;
                    var el = scrollBody[0];
                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) doLoad();
                });
                bindEnter($('<div>'), function () {}); // dummy for focus
                Promise.all([loadGenres('movie'), loadGenres('tv')]).then(function (res) {
                    var merged = [], seen = {}; (res[0] || []).concat(res[1] || []).forEach(function (g) { if (!seen[g.id]) { seen[g.id] = true; merged.push(g); } });
                    merged.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
                    merged.forEach(function (g) { var on = String(g.id) === curGid; var chip = $('<div class="kk-genre-chip selector ' + (on ? 'kk-genre-chip--on' : 'kk-genre-chip--off') + '">' + esc(g.name) + '</div>'); bindEnter(chip, function () { Lampa.Activity.push({ url: '', title: g.name, component: 'kkphim_tmdb_genre', genre_id: g.id, page_num: 1 }); }); genreBar.append(chip); });
                    var cur = merged.find(function (g) { return String(g.id) === curGid; }); if (cur) scroll.render().find('#kk-gtitle').text(cur.name);
                    doLoad();
                }).catch(function () { doLoad(); });
            };
            function doLoad() {
                if (loading) return; loading = true;
                var promises = [];
                if (!movieDone) promises.push(tmdbDiscover('movie', curGid, moviePage).then(function (r) { var items = r.results || []; if (!items.length) movieDone = true; else { items.forEach(function (i) { i.media_type = 'movie'; }); allItems = allItems.concat(items); moviePage++; } }).catch(function () { movieDone = true; }));
                if (!tvDone) promises.push(tmdbDiscover('tv', curGid, tvPage).then(function (r) { var items = r.results || []; if (!items.length) tvDone = true; else { items.forEach(function (i) { i.media_type = 'tv'; }); allItems = allItems.concat(items); tvPage++; } }).catch(function () { tvDone = true; }));
                Promise.all(promises).then(function () {
                    allItems.sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
                    for (var i = 0; i < allItems.length; i++) { var key = allItems[i].media_type + '_' + allItems[i].id; if (!renderedSet[key]) { renderedSet[key] = true; grid.append(mkTmdbCard(allItems[i]).addClass('kk-card--grid')); } }
                    loading = false; comp.activity.loader(false); comp.start();
                }).catch(function () { loading = false; comp.activity.loader(false); });
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // ===== TMDB DETAIL =====
        Lampa.Component.add('kkphim_tmdb_detail', function (obj) {
            var scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, tmdbId = obj.tmdb_id, mediaType = obj.media_type || 'movie';
            this.create = function () { comp.activity.loader(true); clearScroll(scroll); if (!tmdbId) { comp.activity.loader(false); comp.start(); return; } tmdbDetailFull(mediaType, tmdbId).then(async function (tmdb) { var logos = null; try { logos = await tmdbImagesFull(mediaType, tmdbId); } catch (e) {} var title = tmdb.title || tmdb.name || '', origTitle = tmdb.original_title || tmdb.original_name || '', year = (tmdb.release_date || tmdb.first_air_date || '').slice(0, 4); Lampa.Noty.show('Tìm nguồn...'); var slugs = await findAllSlugs(title, origTitle, year); buildDetail(tmdb, logos, slugs); }).catch(function (e) { comp.activity.loader(false); Lampa.Noty.show('Lỗi: ' + (e.message || '')); }); };
            async function buildDetail(tmdb, logos, slugs) {
                clearScroll(scroll);
                var bk = tmdb.backdrop_path ? TMDB_IMG + tmdb.backdrop_path : '', ps = tmdb.poster_path ? TMDB_IMG_W500 + tmdb.poster_path : '';
                var t = tmdb.title || tmdb.name || '', o = tmdb.original_title || tmdb.original_name || '', d = tmdb.overview || '';
                var v = tmdb.vote_average ? Number(tmdb.vote_average).toFixed(1) : 'N/A', y = (tmdb.release_date || tmdb.first_air_date || '').slice(0, 4);
                var rt = tmdb.runtime ? tmdb.runtime + ' phút' : ''; if (!rt && tmdb.episode_run_time && tmdb.episode_run_time.length) rt = tmdb.episode_run_time[0] + ' phút/tập';
                var epTotal = tmdb.number_of_episodes ? tmdb.number_of_episodes + ' tập' : '', nSeasons = tmdb.number_of_seasons ? tmdb.number_of_seasons + ' season' : '';
                var logo = pickLogo(logos || (tmdb.images || {})), logoH = ''; if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>';
                var ghtml = ''; if (tmdb.genres && tmdb.genres.length) ghtml = tmdb.genres.map(function (g) { return '<span class="kk-genre selector" data-gid="' + g.id + '" data-gname="' + esc(g.name || '') + '">' + esc(g.name || '') + '</span>'; }).join('');
                var castH = '', dirH = '', crewH = '', dir = '';
                if (tmdb.credits) { castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character', true); var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator' || c.job === 'Series Director'; }).filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10); if (dirs.length) { dir = dirs.map(function (c) { return c.name; }).join(', '); dirH = mkPeople(dirs.map(function (c) { return { id: c.id, name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job', true); } }
                if (dir) crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + esc(dir) + '</span></div>';
                var imdbId = (tmdb.external_ids && tmdb.external_ids.imdb_id) || null;
                var tH = logoH ? '' : '<div class="kk-title">' + esc(t) + '</div>';
                var hero = $('<div class="kk-hero"><div class="kk-hero-bg">' + (bk ? '<img src="' + bk + '">' : '') + '<div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster">' + (ps ? '<img src="' + ps + '">' : '') + '</div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + esc(o) + '</div></div></div></div></div>');
                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + esc(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + esc(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + esc(rt) + '</span>' : '') + (epTotal ? '<span class="kk-meta">🎬 ' + esc(epTotal) + '</span>' : '') + (nSeasons ? '<span class="kk-meta">📺 ' + esc(nSeasons) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + fmtTxt(d) + '</div></div>');
                body.find('.kk-genre[data-gid]').each(function () { var g = $(this); bindEnter(g, function () { Lampa.Activity.push({ url: '', title: g.attr('data-gname') || '', component: 'kkphim_tmdb_genre', genre_id: g.attr('data-gid'), page_num: 1 }); }); });
                var actions = $('<div class="kk-actions"></div>');
                if (slugs.kkphim) { if (mediaType === 'movie') actions.append(buildMovieExpand('kkphim', 'KKPhim', slugs.kkphim, t, 'kk-src-btn--kkphim')); else actions.append(buildTVExpand('kkphim', 'KKPhim', slugs.kkphim, t, o, 'kk-src-btn--kkphim')); }
                if (slugs.ophim) { if (mediaType === 'movie') actions.append(buildMovieExpand('ophim', 'OPhim', slugs.ophim, t, 'kk-src-btn--ophim')); else actions.append(buildTVExpand('ophim', 'OPhim', slugs.ophim, t, o, 'kk-src-btn--ophim')); }
                if (!slugs.kkphim && !slugs.ophim) actions.append('<div class="kk-src-btn kk-src-btn--no">⚠️ Không tìm thấy nguồn</div>');
                var engLabel = getTorrentEngine() === 'aio' ? '🌊 AIOStreams' : '🧲 Torrent';
                var torrentBtn = $('<div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector">' + engLabel + (getTSHost() ? ' → TS' : '') + '</div></div>');
                if (mediaType === 'movie') bindEnter(torrentBtn.find('.kk-act--torrent'), function () { openTorrentMovie(tmdbId, t, ps, imdbId); });
                else bindEnter(torrentBtn.find('.kk-act--torrent'), function () { openTorrentTV(tmdbId, t, ps, imdbId); });
                actions.append(torrentBtn); body.append(actions);
                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if (dirH) { var ds = $('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + dirH + '</div></div>'); bindCastClicks(ds); dw.append(ds); }
                if (castH) { var cs = $('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>'); bindCastClicks(cs); dw.append(cs); }
                if (tmdb.similar && tmdb.similar.results && tmdb.similar.results.length) { var simRow = $('<div class="kk-section kk-section--last kk-similar"></div>').append('<div class="kk-block-title">Phim liên quan</div>'); var simList = $('<div class="kk-similar-list"></div>'); tmdb.similar.results.slice(0, 12).forEach(function (i) { if (!i.media_type) i.media_type = mediaType; simList.append(mkTmdbCard(i)); }); simRow.append(simList); dw.append(simRow); }
                scroll.append(dw); comp.activity.loader(false); comp.start();
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { scroll.destroy(); };
        });

        // ===== CATEGORY / SEARCH / DETAIL =====
        Lampa.Component.add('kkphim_category', function (obj) { var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this; var page = obj.page_num || 1, title = obj.title || (obj.cat && obj.cat.name) || '', mode = obj.mode || 'api', apiPath = obj.cat ? obj.cat.api : null, catSlug = obj.category_slug || ''; var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true; this.create = function () { this.activity.loader(true); clearScroll(scroll); grid.css('grid-template-columns', 'repeat(' + getCardStyle() + ',minmax(0,1fr))'); scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">' + esc(title) + '</div>').append(grid).append(lm)); bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad(); }; function hr(res) { var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; }); if (!list.length) { hasMore = false; lm.text('Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); } function doLoad() { loading = true; lm.text('Đang tải...'); var url = (mode === 'category' && catSlug) ? SRC_API() + 'v1/api/the-loai/' + catSlug + '?page=' + page : SRC_API() + apiPath + '?page=' + page; network.silent(url, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }); } this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); }; });
        Lampa.Component.add('kkphim_search', function (obj) { var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), comp = this, kw = obj.keyword || '', page = obj.page_num || 1; var grid = $('<div class="kk-grid"></div>'), lm = $('<div class="kk-loadmore selector">Tải thêm</div>'), loading = false, hasMore = true; this.create = function () { this.activity.loader(true); clearScroll(scroll); grid.css('grid-template-columns', 'repeat(' + getCardStyle() + ',minmax(0,1fr))'); scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 ' + esc(kw) + '</div>').append(grid).append(lm)); bindEnter(lm, function () { if (!loading && hasMore) doLoad(); }); doLoad(); }; function hr(res) { var list = ((res && res.items) || (res && res.data && res.data.items) || []).map(norm).filter(function (i) { return i && i.slug; }); if (!list.length) { hasMore = false; lm.text(page === 1 ? 'Không có' : 'Hết'); comp.activity.loader(false); loading = false; comp.start(); return; } list.forEach(function (i) { grid.append(mkCard(i).addClass('kk-card--grid')); }); page++; loading = false; lm.text('Tải thêm'); comp.activity.loader(false); comp.start(); } function doLoad() { loading = true; lm.text('Đang tải...'); network.silent(SRC_API() + 'v1/api/tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () { network.silent(SRC_API() + 'tim-kiem?keyword=' + encodeURIComponent(kw) + '&page=' + page, hr, function () { loading = false; lm.text('Lỗi'); comp.activity.loader(false); }); }); } this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); }; });

        Lampa.Component.add('kkphim_detail', function (obj) {
            var network = new Lampa.Reguest(), scroll = new Lampa.Scroll({ mask: true, over: true }), movie = norm(obj.movie), comp = this, rendered = false;
            this.create = function () { this.activity.loader(true); clearScroll(scroll); rendered = false; if (!movie || !movie.slug) { this.activity.loader(false); comp.start(); return; } network.silent(SRC_API() + 'phim/' + movie.slug, function (res) { if (rendered) return; loadAll(norm(res.movie || res || {}), res.episodes || []); }, function () { comp.activity.loader(false); }); };
            async function loadAll(data, episodes) { if (!data || !data.slug) data = movie; try { var tid = getTmdbId(data), tt = detectType(data), tmdb = null, logos = null; if (tid) { try { tmdb = await tmdbFetch('/' + tt + '/' + tid + '?language=' + tLang() + '&append_to_response=credits,images'); } catch (e) {} try { logos = await tmdbFetch('/' + tt + '/' + tid + '/images'); } catch (e) {} } if (!rendered) { build(data, episodes, tmdb, logos, tt); rendered = true; } } catch (e) { if (!rendered) { build(data, episodes, null, null, detectType(data)); rendered = true; } } comp.activity.loader(false); comp.start(); }
            function build(data, episodes, tmdb, logos, ttype) {
                clearScroll(scroll); if (!Array.isArray(data.category)) data.category = [];
                var bk = fullImg(data.thumb_url || data.poster_url), ps = fullImg(data.poster_url || data.thumb_url);
                var t = data.name || '', o2 = data.origin_name || '', d = cleanDesc(data.content);
                var v = (data.tmdb && data.tmdb.vote_average) || 'N/A', y = data.year || '', rt = data.time || '', epCur = data.episode_current || '';
                var ghtml = '', castH = '', dirH = '', crewH = '', logoH = '', dir = '';
                if (tmdb) { if (tmdb.backdrop_path) bk = TMDB_IMG + tmdb.backdrop_path; if (tmdb.poster_path) ps = TMDB_IMG + tmdb.poster_path; if (tmdb.title || tmdb.name) t = tmdb.title || tmdb.name; if (tmdb.original_title || tmdb.original_name) o2 = tmdb.original_title || tmdb.original_name; if (tmdb.overview) d = tmdb.overview; if (tmdb.vote_average) v = Number(tmdb.vote_average).toFixed(1); if (tmdb.release_date) y = tmdb.release_date.slice(0, 4); if (tmdb.runtime) rt = tmdb.runtime + ' phút'; var logo = pickLogo(logos || tmdb.images); if (logo && logo.file_path) logoH = '<div class="kk-logo"><img src="' + TMDB_IMG_W500 + logo.file_path + '"></div>'; if (tmdb.credits) { castH = mkPeople((tmdb.credits.cast || []).slice(0, 12), 'character', true); var dirs = (tmdb.credits.crew || []).filter(function (c) { return c.job === 'Director' || c.job === 'Creator'; }).filter(function (p, i, a) { return a.findIndex(function (x) { return x.name === p.name; }) === i; }).slice(0, 10); if (dirs.length) { dir = dirs.map(function (c) { return c.name; }).join(', '); dirH = mkPeople(dirs.map(function (c) { return { id: c.id, name: c.name, profile_path: c.profile_path, job: c.job || 'Đạo diễn' }; }), 'job', true); } } }
                var pCats = data.category || [];
                if (pCats.length) ghtml = pCats.map(function (g) { return g ? '<span class="kk-genre selector" data-slug="' + esc(g.slug || '') + '" data-title="' + esc(g.name || '') + '">' + esc(g.name || '') + '</span>' : ''; }).join('');
                if (data.director && !dir) dir = Array.isArray(data.director) ? data.director.join(', ') : String(data.director || '');
                if (dir && !dirH) crewH = '<div class="kk-crew"><b>Đạo diễn</b><span>' + esc(dir) + '</span></div>';
                var hasTmdb = !!getTmdbId(data);
                var tH = logoH ? '' : '<div class="kk-title">' + esc(t) + '</div>';
                var hero = $('<div class="kk-hero"><div class="kk-hero-bg"><img src="' + bk + '"><div class="kk-hero-mask"></div></div><div class="kk-hero-bottom"><div class="kk-hero-flex"><div class="kk-hero-poster"><img src="' + ps + '"></div><div class="kk-hero-info">' + logoH + tH + '<div class="kk-origin">' + esc(o2) + '</div></div></div></div></div>');
                var body = $('<div class="kk-body"><div class="kk-metas"><span class="kk-meta">⭐ ' + esc(v) + '</span>' + (y ? '<span class="kk-meta">📅 ' + esc(y) + '</span>' : '') + (rt ? '<span class="kk-meta">⏱ ' + esc(rt) + '</span>' : '') + (epCur ? '<span class="kk-meta">🎬 ' + esc(epCur) + '</span>' : '') + '</div><div class="kk-genres">' + ghtml + '</div>' + crewH + '<div class="kk-desc">' + fmtTxt(d) + '</div></div>');
                body.find('.kk-genre[data-slug]').each(function () { var g = $(this); bindEnter(g, function () { var slug = g.attr('data-slug'); if (slug) Lampa.Activity.push({ url: '', title: g.attr('data-title') || '', component: 'kkphim_category', mode: 'category', category_slug: slug, page_num: 1 }); }); });
                var actions = $('<div class="kk-actions"></div>');
                var curSrc = getSource(); var srcCss = curSrc.key === 'kkphim' ? 'kk-src-btn--kkphim' : 'kk-src-btn--ophim';
                if (episodes && episodes.length) actions.append(buildDetailExpand(episodes, data.name || t, curSrc.name, srcCss));
                else actions.append('<div class="kk-src-btn kk-src-btn--no">⚠️ Không có tập</div>');
                if (hasTmdb) { var engLabel = getTorrentEngine() === 'aio' ? '🌊 AIOStreams' : '🧲 Torrent'; var tBtn = $('<div class="kk-act-wrap"><div class="kk-act kk-act--torrent selector">' + engLabel + (getTSHost() ? ' → TS' : '') + '</div></div>'); bindEnter(tBtn.find('.kk-act--torrent'), function () { var tid2 = getTmdbId(data); if (ttype === 'tv') openTorrentTV(tid2, data.name || '', ps, null); else openTorrentMovie(tid2, data.name || '', ps, null); }); actions.append(tBtn); }
                body.append(actions);
                var dw = $('<div class="kk-detail-wrap"></div>').append(hero).append(body);
                if (dirH) { var ds = $('<div class="kk-section"><div class="kk-block-title">Đạo diễn</div><div class="kk-cast-list">' + dirH + '</div></div>'); bindCastClicks(ds); dw.append(ds); }
                if (castH) { var cs = $('<div class="kk-section"><div class="kk-block-title">Diễn viên</div><div class="kk-cast-list">' + castH + '</div></div>'); bindCastClicks(cs); dw.append(cs); }
                scroll.append(dw);
            }
            this.start = function () { applyCtrl(scroll); enableScroll(scroll); }; this.pause = function () {}; this.stop = function () {}; this.render = function () { return scroll.render(); }; this.destroy = function () { network.clear(); scroll.destroy(); };
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });
})();