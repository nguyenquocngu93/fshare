// myplugin.js
// Plugin Lampa: KKPhim + Torrentio + AioStreams v2.0
// Fix: UI scroll + Nút phát hiện nguồn

(function () {
    'use strict';

    var PLUGIN_NAME = 'multi_source';
    var PLUGIN_TITLE = 'Đa Nguồn';

    // ============================================
    // 1. SETTINGS STORAGE
    // ============================================
    var Settings = {
        _p: 'msrc_',
        get: function (k, d) { return Lampa.Storage.get(this._p + k, d || ''); },
        set: function (k, v) { Lampa.Storage.set(this._p + k, v); },

        torrserver:       function () { return this.get('torrserver', 'http://127.0.0.1:8090'); },
        kkphim_url:       function () { return this.get('kkphim_url', 'https://phimapi.com'); },
        torrentio_url:    function () { return this.get('torrentio_url', 'https://torrentio.strem.fun'); },
        torrentio_config: function () { return this.get('torrentio_cfg', ''); },
        aio_url:          function () { return this.get('aio_url', 'https://aiostreams.elfhosted.com'); },
        aio_config:       function () { return this.get('aio_cfg', ''); },
        priority:         function () { return this.get('priority', 'kkphim,torrentio,aiostreams'); },
        enabled:          function (s) { return this.get(s + '_on', 'true') === 'true'; }
    };

    // ============================================
    // 2. MENU BÊN TRÁI - DÙNG LAMPA SETTINGS CHUẨN
    // ============================================
    function addSettingsMenu() {
        // Icon SVG
        var icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/><circle cx="19" cy="7" r="2.5" fill="#4CAF50"/></svg>';

        // Tạo mục menu bên trái
        var field = $(
            '<li class="menu__item selector" data-action="' + PLUGIN_NAME + '">' +
                '<div class="menu__ico">' + icon + '</div>' +
                '<div class="menu__text">' + PLUGIN_TITLE + '</div>' +
            '</li>'
        );

        field.on('hover:enter', function () {
            showSettings();
        });

        // Thêm vào cuối menu chính
        $('.menu .menu__list').eq(0).append(field);
    }

    // ============================================
    // 3. TRANG CÀI ĐẶT - SCROLL ĐƯỢC
    // ============================================
    function showSettings() {
        var controller = Lampa.Controller.enabled().name;

        var html = $('<div></div>');

        // CSS
        html.append(
            '<style>' +
            '.ms-page { padding: 1.5em; overflow-y: auto; max-height: 100vh; -webkit-overflow-scrolling: touch; }' +
            '.ms-group { margin-bottom: 1.5em; background: rgba(255,255,255,0.04); border-radius: 0.8em; padding: 1em 1.2em; }' +
            '.ms-group-title { color: #4CAF50; font-size: 1.1em; font-weight: 600; margin-bottom: 0.8em; padding-bottom: 0.5em; border-bottom: 1px solid rgba(255,255,255,0.08); }' +
            '.ms-item { display: flex; align-items: center; padding: 0.7em 0.8em; margin: 0.3em 0; border-radius: 0.5em; cursor: pointer; }' +
            '.ms-item.focus { background: rgba(255,255,255,0.12); outline: 2px solid #4CAF50; }' +
            '.ms-label { width: 9em; flex-shrink: 0; color: #aaa; font-size: 0.9em; }' +
            '.ms-val { flex: 1; color: #fff; word-break: break-all; min-width: 0; }' +
            '.ms-val.empty { color: #555; font-style: italic; }' +
            '.ms-badge { display: inline-block; padding: 0.2em 0.7em; border-radius: 0.3em; font-size: 0.8em; font-weight: 600; }' +
            '.ms-badge.on  { background: #4CAF50; color: #fff; }' +
            '.ms-badge.off { background: #555; color: #aaa; }' +
            '.ms-btn { text-align: center; padding: 0.8em; margin-top: 0.5em; border-radius: 0.5em; color: #4CAF50; font-weight: 600; cursor: pointer; }' +
            '.ms-btn.focus { background: rgba(76,175,80,0.2); outline: 2px solid #4CAF50; }' +
            '</style>'
        );

        var page = $('<div class="ms-page"></div>');

        // Header
        page.append('<div style="text-align:center;margin-bottom:1.2em;"><div style="font-size:1.4em;font-weight:700;">⚡ ' + PLUGIN_TITLE + '</div><div style="color:#777;font-size:0.8em;">KKPhim • Torrentio • AioStreams</div></div>');

        // ---- TorrServer ----
        page.append(buildGroup('🖥️ TorrServer', [
            { key: 'torrserver', label: 'URL', ph: 'http://127.0.0.1:8090' }
        ]));

        // ---- KKPhim ----
        page.append(buildGroup('🎬 KKPhim', [
            { key: 'kkphim_url', label: 'URL API', ph: 'https://phimapi.com' },
            { key: 'kkphim_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
        ]));

        // ---- Torrentio ----
        page.append(buildGroup('🌊 Torrentio', [
            { key: 'torrentio_url', label: 'URL', ph: 'https://torrentio.strem.fun' },
            { key: 'torrentio_cfg', label: 'Config', ph: 'sort=qualitysize|qualityfilter=...' },
            { key: 'torrentio_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
        ]));

        // ---- AioStreams ----
        page.append(buildGroup('🔄 AioStreams', [
            { key: 'aio_url', label: 'URL', ph: 'https://aiostreams.elfhosted.com' },
            { key: 'aio_cfg', label: 'Config', ph: 'Paste config string...' },
            { key: 'aio_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
        ]));

        // ---- Chung ----
        page.append(buildGroup('⚙️ Chung', [
            { key: 'priority', label: 'Thứ tự ưu tiên', ph: 'kkphim,torrentio,aiostreams' }
        ]));

        // ---- Test TorrServer ----
        var testBtn = $('<div class="ms-btn selector" data-type="action">🔍 Test TorrServer</div>');
        testBtn.on('hover:enter', function () { testTorrserver(); });
        page.append(testBtn);

        html.append(page);

        // Đẩy Activity
        Lampa.Activity.push({
            url: '',
            title: PLUGIN_TITLE,
            component: 'settings_page_ms',
            page: 1
        });

        // Render sau khi Activity sẵn sàng
        setTimeout(function () {
            var activity = Lampa.Activity.active();
            if (!activity) return;

            var render = activity.activity.render();
            render.empty().append(html);

            // Tạo danh sách focusable
            var items = page.find('.selector');
            var idx = 0;

            function focusItem(i) {
                items.removeClass('focus');
                idx = Math.max(0, Math.min(i, items.length - 1));
                var el = items.eq(idx);
                el.addClass('focus');

                // Scroll vào view
                var container = page[0];
                var item = el[0];
                if (container && item) {
                    var cRect = container.getBoundingClientRect();
                    var iRect = item.getBoundingClientRect();

                    if (iRect.bottom > cRect.bottom) {
                        container.scrollTop += (iRect.bottom - cRect.bottom + 40);
                    }
                    if (iRect.top < cRect.top) {
                        container.scrollTop -= (cRect.top - iRect.top + 40);
                    }
                }
            }

            focusItem(0);

            Lampa.Controller.add('ms_settings', {
                toggle: function () { },
                back: function () {
                    Lampa.Activity.backward();
                },
                up: function () {
                    focusItem(idx - 1);
                },
                down: function () {
                    focusItem(idx + 1);
                },
                left: function () {
                    Lampa.Activity.backward();
                },
                right: function () { },
                enter: function () {
                    items.eq(idx).trigger('hover:enter');
                }
            });

            Lampa.Controller.toggle('ms_settings');

        }, 150);
    }

    // Build group UI
    function buildGroup(title, fields) {
        var group = $('<div class="ms-group"></div>');
        group.append('<div class="ms-group-title">' + title + '</div>');

        fields.forEach(function (f) {
            var val = Settings.get(f.key, f.def || '');

            if (f.toggle) {
                // Toggle item
                var isOn = val === 'true' || (val === '' && f.def === 'true');
                var badge = '<span class="ms-badge ' + (isOn ? 'on' : 'off') + '">' + (isOn ? 'BẬT' : 'TẮT') + '</span>';

                var row = $('<div class="ms-item selector" data-key="' + f.key + '" data-type="toggle">' +
                    '<div class="ms-label">' + f.label + '</div>' +
                    '<div class="ms-val">' + badge + '</div>' +
                    '</div>');

                row.on('hover:enter', function () {
                    var cur = Settings.get(f.key, f.def || 'true');
                    var next = cur === 'true' ? 'false' : 'true';
                    Settings.set(f.key, next);

                    var b = $(this).find('.ms-badge');
                    b.attr('class', 'ms-badge ' + (next === 'true' ? 'on' : 'off'));
                    b.text(next === 'true' ? 'BẬT' : 'TẮT');

                    Lampa.Noty.show((next === 'true' ? '✅ Đã bật' : '❌ Đã tắt') + ' ' + f.label);
                });

                group.append(row);
            } else {
                // Input item
                var display = val || f.ph || '(trống)';
                var cls = val ? 'ms-val' : 'ms-val empty';

                var row = $('<div class="ms-item selector" data-key="' + f.key + '" data-type="input">' +
                    '<div class="ms-label">' + f.label + '</div>' +
                    '<div class="' + cls + '">' + display + '</div>' +
                    '</div>');

                row.on('hover:enter', function () {
                    var self = $(this);
                    var curVal = Settings.get(f.key, '');

                    Lampa.Input.edit({
                        title: f.label,
                        value: curVal,
                        placeholder: f.ph || '',
                        free: true,
                        nosave: false
                    }, function (newVal) {
                        Settings.set(f.key, newVal);
                        var d = newVal || f.ph || '(trống)';
                        var c = newVal ? 'ms-val' : 'ms-val empty';
                        self.find('.ms-val').attr('class', c).text(d);
                        Lampa.Noty.show('✅ Đã lưu: ' + f.label);
                    });
                });

                group.append(row);
            }
        });

        return group;
    }

    // Test TorrServer
    function testTorrserver() {
        var url = Settings.torrserver();
        if (!url) {
            Lampa.Noty.show('⚠️ Chưa nhập URL TorrServer');
            return;
        }

        Lampa.Noty.show('🔄 Đang test ' + url + '...');

        $.ajax({
            url: url + '/echo',
            timeout: 5000,
            success: function (data) {
                Lampa.Noty.show('✅ TorrServer OK! Version: ' + (data || 'unknown'));
            },
            error: function () {
                // Thử /settings
                $.ajax({
                    url: url + '/settings',
                    timeout: 5000,
                    success: function () {
                        Lampa.Noty.show('✅ TorrServer phản hồi!');
                    },
                    error: function () {
                        Lampa.Noty.show('❌ Không kết nối được: ' + url);
                    }
                });
            }
        });
    }


    // ============================================
    // 4. NGUỒN KKPHIM
    // ============================================
    var KKPhim = {
        search: function (movie, cb) {
            if (!Settings.enabled('kkphim')) return cb([]);

            var base = Settings.kkphim_url();
            var q = movie.title || movie.name || '';
            if (!q) return cb([]);

            $.ajax({
                url: base + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(q) + '&limit=10',
                timeout: 10000,
                success: function (res) {
                    var list = [];
                    var items = (res && res.data && res.data.items) || [];

                    items.forEach(function (it) {
                        list.push({
                            source: 'KKPhim',
                            title: it.name + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                            quality: it.quality || 'HD',
                            slug: it.slug,
                            type: 'kkphim_result'
                        });
                    });

                    cb(list);
                },
                error: function () { cb([]); }
            });
        },

        getStreams: function (slug, cb) {
            var base = Settings.kkphim_url();

            $.ajax({
                url: base + '/phim/' + slug,
                timeout: 10000,
                success: function (res) {
                    var streams = [];

                    if (res && res.episodes) {
                        res.episodes.forEach(function (srv) {
                            var srvName = srv.server_name || 'Server';
                            (srv.server_data || []).forEach(function (ep) {
                                if (ep.link_m3u8) {
                                    streams.push({
                                        source: 'KKPhim',
                                        title: srvName + ' - ' + (ep.name || ep.slug),
                                        url: ep.link_m3u8,
                                        quality: 'HD',
                                        type: 'hls'
                                    });
                                }
                            });
                        });
                    }
                    cb(streams);
                },
                error: function () { cb([]); }
            });
        }
    };

    // ============================================
    // 5. NGUỒN TORRENTIO
    // ============================================
    var Torrentio = {
        search: function (movie, cb) {
            if (!Settings.enabled('torrentio')) return cb([]);

            this._ensureImdb(movie, function (m) {
                if (!m.imdb_id) return cb([]);

                var base = Settings.torrentio_url();
                var cfg  = Settings.torrentio_config();
                var path = cfg ? (base + '/' + cfg + '/stream') : (base + '/stream');

                var type = m.type === 'tv' ? 'series' : 'movie';
                var url;

                if (type === 'series' && m.season && m.episode) {
                    url = path + '/' + type + '/' + m.imdb_id + ':' + m.season + ':' + m.episode + '.json';
                } else {
                    url = path + '/' + type + '/' + m.imdb_id + '.json';
                }

                $.ajax({
                    url: url,
                    timeout: 15000,
                    success: function (res) {
                        cb(parseStremioStreams(res, 'Torrentio', '🌊'));
                    },
                    error: function () { cb([]); }
                });
            });
        },

        _ensureImdb: function (movie, cb) {
            if (movie.imdb_id) return cb(movie);
            getImdbId(movie, function (id) {
                movie.imdb_id = id;
                cb(movie);
            });
        }
    };

    // ============================================
    // 6. NGUỒN AIOSTREAMS
    // ============================================
    var AioStreams = {
        search: function (movie, cb) {
            if (!Settings.enabled('aiostreams')) return cb([]);

            this._ensureImdb(movie, function (m) {
                if (!m.imdb_id) return cb([]);

                var base = Settings.aio_url();
                var cfg  = Settings.aio_config();
                var path = cfg ? (base + '/' + cfg + '/stream') : (base + '/stream');

                var type = m.type === 'tv' ? 'series' : 'movie';
                var url;

                if (type === 'series' && m.season && m.episode) {
                    url = path + '/' + type + '/' + m.imdb_id + ':' + m.season + ':' + m.episode + '.json';
                } else {
                    url = path + '/' + type + '/' + m.imdb_id + '.json';
                }

                $.ajax({
                    url: url,
                    timeout: 20000,
                    success: function (res) {
                        cb(parseStremioStreams(res, 'AioStreams', '🔄'));
                    },
                    error: function () { cb([]); }
                });
            });
        },

        _ensureImdb: function (movie, cb) {
            if (movie.imdb_id) return cb(movie);
            getImdbId(movie, function (id) {
                movie.imdb_id = id;
                cb(movie);
            });
        }
    };


    // ============================================
    // 7. HELPER FUNCTIONS
    // ============================================

    // Lấy IMDB ID từ TMDB
    function getImdbId(movie, cb) {
        var id = movie.id;
        var type = movie.type === 'tv' ? 'tv' : 'movie';
        if (!id) return cb(null);

        // Thử external_ids trước
        if (movie.external_ids && movie.external_ids.imdb_id) {
            return cb(movie.external_ids.imdb_id);
        }

        $.ajax({
            url: Lampa.TMDB.api(type + '/' + id + '/external_ids'),
            timeout: 8000,
            success: function (r) { cb(r && r.imdb_id ? r.imdb_id : null); },
            error: function () { cb(null); }
        });
    }

    // Parse Stremio stream format
    function parseStremioStreams(res, sourceName, icon) {
        var list = [];
        if (!res || !res.streams) return list;

        res.streams.forEach(function (s) {
            var title = s.title || s.name || sourceName;
            var item = {
                source: sourceName,
                title: icon + ' ' + title,
                quality: extractQuality(title),
                size: extractSize(title),
                seeders: s.seeders || 0
            };

            if (s.infoHash) {
                item.type = 'torrent';
                item.infoHash = s.infoHash;
                item.fileIdx = s.fileIdx || 0;
                item.magnet = 'magnet:?xt=urn:btih:' + s.infoHash;
                if (s.sources) {
                    s.sources.forEach(function (src) {
                        if (src.indexOf('tracker') >= 0) {
                            item.magnet += '&tr=' + encodeURIComponent(src);
                        }
                    });
                }
            } else if (s.url) {
                item.type = 'direct';
                item.url = s.url;
            } else if (s.externalUrl) {
                item.type = 'external';
                item.url = s.externalUrl;
            }

            list.push(item);
        });

        list.sort(function (a, b) { return (b.seeders || 0) - (a.seeders || 0); });

        return list;
    }

    function extractQuality(t) {
        if (/2160p|4k|uhd/i.test(t)) return '4K';
        if (/1080p/i.test(t)) return '1080p';
        if (/720p/i.test(t)) return '720p';
        if (/480p/i.test(t)) return '480p';
        return 'HD';
    }

    function extractSize(t) {
        var m = t.match(/([\d.]+)\s*(GB|MB|TB)/i);
        return m ? m[1] + ' ' + m[2].toUpperCase() : '';
    }


    // ============================================
    // 8. TORRSERVER PLAYER
    // ============================================
    var TorrServer = {
        play: function (stream, info) {
            var url = Settings.torrserver();
            if (!url) {
                Lampa.Noty.show('⚠️ Chưa cấu hình TorrServer');
                return;
            }

            Lampa.Noty.show('🔄 Gửi tới TorrServer...');

            var link = stream.magnet || ('magnet:?xt=urn:btih:' + stream.infoHash);

            // Thêm torrent
            $.ajax({
                url: url + '/torrents',
                method: 'POST',
                data: JSON.stringify({
                    action: 'add',
                    link: link,
                    title: info.title || info.name || '',
                    poster: info.poster || info.img || '',
                    save_to_db: true
                }),
                contentType: 'application/json',
                timeout: 30000,
                success: function (res) {
                    var hash = (res && res.hash) || stream.infoHash;
                    var idx = stream.fileIdx || 0;
                    var playUrl = url + '/stream?link=' + hash + '&index=' + idx + '&play';

                    startPlayer(playUrl, stream, info);
                },
                error: function () {
                    // Fallback: stream trực tiếp
                    var playUrl = url + '/stream?link=' + encodeURIComponent(link) + '&index=' + (stream.fileIdx || 0) + '&play';
                    startPlayer(playUrl, stream, info);
                }
            });
        }
    };

    function startPlayer(url, stream, info) {
        Lampa.Noty.show('▶️ Đang phát...');

        var data = {
            title: info.title || info.name || stream.title || '',
            url: url,
            quality: {}
        };

        data.quality[stream.quality || 'HD'] = url;

        Lampa.Player.play(data);
        Lampa.Player.playlist([data]);
    }


    // ============================================
    // 9. ĐĂNG KÝ VÀO NÚT PHÁT CỦA LAMPA ⭐
    // ============================================
    function hookIntoPlayer() {
        // Đăng ký component trống cho settings page
        Lampa.Component.add('settings_page_ms', function () {
            var _render = $('<div></div>');
            this.create = function () {};
            this.start = function () {};
            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return _render; };
            this.destroy = function () { _render.remove(); };
        });

        // === CÁCH 1: Hook vào trang chi tiết phim (full) ===
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    addPlayButton(e);
                }, 300);
            }
        });

        // === CÁCH 2: Thêm vào source selector (online_mod / lampac) ===
        // Đăng ký nguồn video mới
        if (Lampa.Params && Lampa.Params.trigger) {
            // Cho các phiên bản mới
        }

        // === CÁCH 3: Override nút xem ===
        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start' && e.component === 'full') {
                setTimeout(function () {
                    injectIntoFullPage(e);
                }, 500);
            }
        });
    }

    // Thêm nút "Đa Nguồn" vào trang chi tiết phim
    function addPlayButton(e) {
        try {
            var render;

            // Tìm render từ nhiều cách
            if (e.object && e.object.activity) {
                render = e.object.activity.render();
            } else if (e.activity) {
                render = e.activity.render();
            }

            if (!render) return;

            var btns = render.find('.full-start-new__buttons, .full-start__buttons, .buttons--container');
            if (!btns.length) {
                btns = render.find('[class*="button"]').parent();
            }
            if (!btns.length) return;

            // Tránh thêm trùng
            if (btns.find('.msrc-play-btn').length) return;

            var movieData = null;

            // Lấy data phim
            if (e.data) movieData = e.data;
            else if (e.object && e.object.data) movieData = e.object.data;

            if (!movieData) return;

            var btn = $(
                '<div class="full-start__button selector msrc-play-btn" style="background:linear-gradient(135deg,#4CAF50,#2196F3);">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:7px;"><path d="M8 5v14l11-7z"/></svg>' +
                    '<span>' + PLUGIN_TITLE + '</span>' +
                '</div>'
            );

            btn.on('hover:enter', function () {
                openMultiSource(movieData);
            });

            btns.append(btn);

        } catch (ex) {
            console.log('[MultiSource] addPlayButton error:', ex);
        }
    }

    // Inject cho activity start
    function injectIntoFullPage(e) {
        try {
            var act = Lampa.Activity.active();
            if (!act) return;

            var render = act.activity.render();
            var card = act.card || act.data || {};

            var btns = render.find('.full-start-new__buttons, .full-start__buttons');
            if (!btns.length) return;
            if (btns.find('.msrc-play-btn').length) return;

            var btn = $(
                '<div class="full-start__button selector msrc-play-btn" style="background:linear-gradient(135deg,#4CAF50,#2196F3);">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:7px;"><path d="M8 5v14l11-7z"/></svg>' +
                    '<span>' + PLUGIN_TITLE + '</span>' +
                '</div>'
            );

            btn.on('hover:enter', function () {
                openMultiSource(card);
            });

            btns.append(btn);

        } catch (ex) {
            console.log('[MultiSource] inject error:', ex);
        }
    }


    // ============================================
    // 10. TÌM VÀ HIỂN THỊ NGUỒN
    // ============================================
    function openMultiSource(card) {
        Lampa.Noty.show('🔍 Đang tìm nguồn phát...');

        // Chuẩn hóa movie info
        var movie = {
            id:             card.id,
            title:          card.title || card.name || '',
            name:           card.name || card.title || '',
            original_title: card.original_title || card.original_name || '',
            type:           (card.number_of_seasons || card.seasons || card.first_air_date) ? 'tv' : 'movie',
            imdb_id:        card.imdb_id || (card.external_ids && card.external_ids.imdb_id) || '',
            year:           card.year || (card.release_date ? card.release_date.substring(0, 4) : ''),
            poster:         card.poster || card.img || card.poster_path || '',
            season:         card.season || null,
            episode:        card.episode || null
        };

        // Nếu là series và chưa chọn tập
        if (movie.type === 'tv' && !movie.season) {
            selectEpisode(card, function (s, ep) {
                movie.season = s;
                movie.episode = ep;
                searchAllSources(movie);
            });
        } else {
            searchAllSources(movie);
        }
    }

    function selectEpisode(card, cb) {
        var seasons = [];
        var num = card.number_of_seasons || card.seasons_count || 1;

        if (card.seasons && card.seasons.length) {
            card.seasons.forEach(function (s) {
                if (s.season_number > 0) {
                    seasons.push({
                        title: 'Phần ' + s.season_number + (s.episode_count ? ' (' + s.episode_count + ' tập)' : ''),
                        season: s.season_number,
                        eps: s.episode_count || 24
                    });
                }
            });
        } else {
            for (var i = 1; i <= num; i++) {
                seasons.push({ title: 'Phần ' + i, season: i, eps: 24 });
            }
        }

        Lampa.Select.show({
            title: 'Chọn Phần',
            items: seasons,
            onSelect: function (s) {
                var eps = [];
                for (var j = 1; j <= s.eps; j++) {
                    eps.push({ title: 'Tập ' + j, episode: j });
                }

                Lampa.Select.show({
                    title: 'Phần ' + s.season + ' - Chọn Tập',
                    items: eps,
                    onSelect: function (ep) {
                        cb(s.season, ep.episode);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    function searchAllSources(movie) {
        var all = [];
        var done = 0;
        var total = 0;

        var srcs = [];
        if (Settings.enabled('kkphim'))     { srcs.push(KKPhim);     total++; }
        if (Settings.enabled('torrentio'))  { srcs.push(Torrentio);  total++; }
        if (Settings.enabled('aiostreams')) { srcs.push(AioStreams);  total++; }

        if (total === 0) {
            Lampa.Noty.show('⚠️ Chưa bật nguồn nào!');
            return;
        }

        srcs.forEach(function (src) {
            src.search(movie, function (results) {
                all = all.concat(results);
                done++;
                if (done >= total) {
                    showResults(all, movie);
                }
            });
        });

        // Timeout
        setTimeout(function () {
            if (done < total) {
                done = total;
                showResults(all, movie);
            }
        }, 25000);
    }

    function showResults(streams, movie) {
        if (!streams.length) {
            Lampa.Noty.show('😕 Không tìm thấy nguồn nào');
            return;
        }

        Lampa.Noty.show('✅ Tìm thấy ' + streams.length + ' nguồn');

        var items = streams.map(function (s, i) {
            var parts = [];
            if (s.quality) parts.push(s.quality);
            if (s.size) parts.push(s.size);
            if (s.seeders) parts.push('🌱' + s.seeders);
            if (s.type === 'torrent') parts.push('📦Torrent');
            if (s.type === 'hls') parts.push('📡HLS');

            return {
                title: s.title,
                subtitle: parts.join(' • '),
                stream: s,
                index: i
            };
        });

        Lampa.Select.show({
            title: '🎯 Nguồn phát (' + streams.length + ')',
            items: items,
            onSelect: function (item) {
                playSelected(item.stream, movie);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    // ============================================
    // 11. PHÁT
    // ============================================
    function playSelected(stream, movie) {
        if (stream.type === 'torrent') {
            TorrServer.play(stream, movie);

        } else if (stream.type === 'hls' || stream.type === 'direct') {
            startPlayer(stream.url, stream, movie);

        } else if (stream.type === 'kkphim_result' && stream.slug) {
            Lampa.Noty.show('🔄 Đang lấy link từ KKPhim...');
            KKPhim.getStreams(stream.slug, function (list) {
                if (list.length === 1) {
                    playSelected(list[0], movie);
                } else if (list.length > 1) {
                    showResults(list, movie);
                } else {
                    Lampa.Noty.show('😕 KKPhim không có link');
                }
            });

        } else if (stream.type === 'external' && stream.url) {
            // Thử phát external
            startPlayer(stream.url, stream, movie);

        } else {
            Lampa.Noty.show('⚠️ Không hỗ trợ loại stream này');
        }
    }


    // ============================================
    // 12. KHỞI TẠO
    // ============================================
    function init() {
        if (window.msrc_loaded) return;
        window.msrc_loaded = true;

        var start = function () {
            console.log('[MultiSource] v2.0 starting...');

            addSettingsMenu();
            hookIntoPlayer();

            // CSS global
            $('head').append(
                '<style>' +
                '.msrc-play-btn { transition: transform 0.2s, opacity 0.2s; }' +
                '.msrc-play-btn.focus, .msrc-play-btn:focus { transform: scale(1.08); box-shadow: 0 0 15px rgba(76,175,80,0.5); }' +
                '</style>'
            );

            console.log('[MultiSource] v2.0 ready!');
        };

        if (window.appready) {
            start();
        } else {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') start();
            });
        }
    }

    // Chạy
    init();

})();