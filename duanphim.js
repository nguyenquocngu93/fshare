// myplugin.js
// Plugin Lampa: KKPhim + Torrentio + AioStreams v3.0

(function () {
    'use strict';

    if (window.msrc_loaded_v3) return;
    window.msrc_loaded_v3 = true;

    var PLUGIN_NAME  = 'multi_source';
    var PLUGIN_TITLE = 'Đa Nguồn';

    // ============================================
    // 1. SETTINGS - FIX LƯU TOGGLE
    // ============================================
    var Settings = {
        _p: 'msrc_',

        // FIX: Kiểm tra key tồn tại trước khi trả default
        get: function (k, def) {
            var full_key = this._p + k;
            var raw = Lampa.Storage.get(full_key, 'msrc_undefined');

            // Nếu chưa từng lưu → trả default
            if (raw === 'msrc_undefined' || raw === null || raw === undefined) {
                return def !== undefined ? def : '';
            }

            return raw;
        },

        set: function (k, v) {
            Lampa.Storage.set(this._p + k, v);
        },

        // Getter tiện lợi
        torrserver:       function () { return this.get('torrserver', 'http://127.0.0.1:8090'); },
        kkphim_url:       function () { return this.get('kkphim_url', 'https://phimapi.com'); },
        torrentio_url:    function () { return this.get('torrentio_url', 'https://torrentio.strem.fun'); },
        torrentio_config: function () { return this.get('torrentio_cfg', ''); },
        aio_url:          function () { return this.get('aio_url', 'https://aiostreams.elfhosted.com'); },
        aio_config:       function () { return this.get('aio_cfg', ''); },
        priority:         function () { return this.get('priority', 'kkphim,torrentio,aiostreams'); },

        // FIX: enabled kiểm tra chính xác
        enabled: function (src) {
            var val = this.get(src + '_on', 'true');
            return val === 'true';
        },

        // Debug: xem tất cả settings
        debug: function () {
            var keys = ['torrserver', 'kkphim_url', 'kkphim_on',
                        'torrentio_url', 'torrentio_cfg', 'torrentio_on',
                        'aio_url', 'aio_cfg', 'aio_on', 'priority'];
            var self = this;
            keys.forEach(function (k) {
                console.log('[Settings]', k, '=', self.get(k, '(default)'));
            });
        }
    };


    // ============================================
    // 2. MENU BÊN TRÁI
    // ============================================
    function addMenuButton() {
        var icon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                   '<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/>' +
                   '<circle cx="19" cy="7" r="2.5" fill="#4CAF50"/></svg>';

        var item = $(
            '<li class="menu__item selector" data-action="' + PLUGIN_NAME + '">' +
                '<div class="menu__ico">' + icon + '</div>' +
                '<div class="menu__text">' + PLUGIN_TITLE + '</div>' +
            '</li>'
        );

        item.on('hover:enter', function () {
            Lampa.Activity.push({
                url:       '',
                title:     PLUGIN_TITLE + ' - Cài đặt',
                component: 'msrc_settings',
                page:      1
            });
        });

        // Thêm vào menu
        var list = $('.menu .menu__list').eq(0);
        if (list.length) list.append(item);
    }


    // ============================================
    // 3. COMPONENT CÀI ĐẶT - SCROLL FIX
    // ============================================
    function registerSettingsComponent() {
        Lampa.Component.add('msrc_settings', function () {
            var _this   = this;
            var _scroll = new Lampa.Scroll({ mask: true, over: true });
            var _content = $('<div class="msrc-settings-content"></div>');
            var _items  = [];
            var _idx    = 0;

            this.create = function () {
                this.activity.loader(false);

                // CSS
                if (!$('#msrc-settings-css').length) {
                    $('head').append(
                        '<style id="msrc-settings-css">' +
                        '.msrc-settings-content { padding: 1.5em; }' +
                        '.ms-grp { margin-bottom: 1.5em; background: rgba(255,255,255,0.04); border-radius: 0.8em; padding: 1em 1.2em; }' +
                        '.ms-grp-t { color: #4CAF50; font-size: 1.1em; font-weight: 600; margin-bottom: 0.8em; padding-bottom: 0.5em; border-bottom: 1px solid rgba(255,255,255,0.08); }' +
                        '.ms-row { display: flex; align-items: center; padding: 0.7em 0.8em; margin: 0.3em 0; border-radius: 0.5em; }' +
                        '.ms-row.focus { background: rgba(255,255,255,0.12); outline: 2px solid #4CAF50; }' +
                        '.ms-lbl { width: 9em; flex-shrink: 0; color: #aaa; font-size: 0.9em; }' +
                        '.ms-val { flex: 1; color: #fff; word-break: break-all; }' +
                        '.ms-val.empty { color: #555; font-style: italic; }' +
                        '.ms-tag { display: inline-block; padding: 0.15em 0.6em; border-radius: 0.3em; font-size: 0.8em; font-weight: 600; }' +
                        '.ms-tag.on  { background: #4CAF50; color: #fff; }' +
                        '.ms-tag.off { background: #555; color: #aaa; }' +
                        '.ms-btn { text-align: center; padding: 0.8em; margin: 0.3em 0; border-radius: 0.5em; font-weight: 600; }' +
                        '.ms-btn.focus { background: rgba(76,175,80,0.2); outline: 2px solid #4CAF50; }' +
                        '.ms-hdr { text-align: center; margin-bottom: 1.2em; }' +
                        '.ms-hdr h2 { font-size: 1.4em; margin: 0; }' +
                        '.ms-hdr p  { color: #777; font-size: 0.8em; margin: 0.3em 0 0; }' +
                        '</style>'
                    );
                }

                _content.empty();

                // Header
                _content.append(
                    '<div class="ms-hdr">' +
                        '<h2>⚡ ' + PLUGIN_TITLE + '</h2>' +
                        '<p>KKPhim • Torrentio • AioStreams</p>' +
                    '</div>'
                );

                // ==== TorrServer ====
                _content.append(buildGroup('🖥️ TorrServer', [
                    { key: 'torrserver', label: 'URL', ph: 'http://127.0.0.1:8090' }
                ]));
                _content.append(buildActionBtn('🔍 Test TorrServer', function () {
                    testConnection(Settings.torrserver(), '/echo', 'TorrServer');
                }));

                // ==== KKPhim ====
                _content.append(buildGroup('🎬 KKPhim', [
                    { key: 'kkphim_url', label: 'URL API', ph: 'https://phimapi.com' },
                    { key: 'kkphim_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
                ]));
                _content.append(buildActionBtn('🔍 Test KKPhim', function () {
                    testConnection(Settings.kkphim_url(), '/v1/api/tim-kiem?keyword=test&limit=1', 'KKPhim');
                }));

                // ==== Torrentio ====
                _content.append(buildGroup('🌊 Torrentio', [
                    { key: 'torrentio_url', label: 'URL', ph: 'https://torrentio.strem.fun' },
                    { key: 'torrentio_cfg', label: 'Config', ph: 'sort=qualitysize|qualityfilter=...' },
                    { key: 'torrentio_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
                ]));
                _content.append(buildActionBtn('🔍 Test Torrentio', function () {
                    var base = Settings.torrentio_url();
                    var cfg  = Settings.torrentio_config();
                    var url  = cfg ? base + '/' + cfg : base;
                    testConnection(url, '/manifest.json', 'Torrentio');
                }));

                // ==== AioStreams ====
                _content.append(buildGroup('🔄 AioStreams', [
                    { key: 'aio_url', label: 'URL', ph: 'https://aiostreams.elfhosted.com' },
                    { key: 'aio_cfg', label: 'Config', ph: 'Paste config...' },
                    { key: 'aio_on',  label: 'Kích hoạt', toggle: true, def: 'true' }
                ]));
                _content.append(buildActionBtn('🔍 Test AioStreams', function () {
                    var base = Settings.aio_url();
                    var cfg  = Settings.aio_config();
                    var url  = cfg ? base + '/' + cfg : base;
                    testConnection(url, '/manifest.json', 'AioStreams');
                }));

                // ==== Chung ====
                _content.append(buildGroup('⚙️ Thứ tự ưu tiên', [
                    { key: 'priority', label: 'Nguồn', ph: 'kkphim,torrentio,aiostreams' }
                ]));

                // Debug button
                _content.append(buildActionBtn('🐛 Debug Settings', function () {
                    Settings.debug();
                    Lampa.Noty.show('Xem console log');
                }));

                // Mount vào scroll
                _scroll.render().addClass('layer--height');
                _scroll.append(_content);

                // Collect tất cả selector items
                _items = _content.find('.selector').toArray();
            };

            // Focus item
            function focusAt(i) {
                $(_items).removeClass('focus');
                _idx = Math.max(0, Math.min(i, _items.length - 1));
                var el = $(_items[_idx]);
                el.addClass('focus');
                _scroll.update(el);
            }

            this.start = function () {
                // Lấy lại items (sau khi DOM sẵn sàng)
                _items = _content.find('.selector').toArray();

                Lampa.Controller.add('msrc_ctrl', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(_scroll.render());
                        Lampa.Controller.collectionFocus(false, _scroll.render());
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    },
                    up: function () {
                        focusAt(_idx - 1);
                    },
                    down: function () {
                        focusAt(_idx + 1);
                    },
                    left: function () {
                        if (Navigator.canBack()) Navigator.back();
                        else Lampa.Activity.backward();
                    },
                    right: function () {},
                    enter: function () {
                        if (_items[_idx]) {
                            $(_items[_idx]).trigger('hover:enter');
                        }
                    }
                });

                Lampa.Controller.toggle('msrc_ctrl');

                if (_items.length) focusAt(0);
            };

            this.pause = function () {};
            this.stop  = function () {};

            this.render = function () {
                return _scroll.render();
            };

            this.destroy = function () {
                _scroll.destroy();
            };
        });
    }

    // Build group
    function buildGroup(title, fields) {
        var grp = $('<div class="ms-grp"></div>');
        grp.append('<div class="ms-grp-t">' + title + '</div>');

        fields.forEach(function (f) {
            var val = Settings.get(f.key, f.def !== undefined ? f.def : '');

            if (f.toggle) {
                var isOn    = val === 'true';
                var tagCls  = isOn ? 'ms-tag on' : 'ms-tag off';
                var tagText = isOn ? 'BẬT' : 'TẮT';

                var row = $(
                    '<div class="ms-row selector" data-key="' + f.key + '">' +
                        '<div class="ms-lbl">' + f.label + '</div>' +
                        '<div class="ms-val"><span class="' + tagCls + '">' + tagText + '</span></div>' +
                    '</div>'
                );

                row.on('hover:enter', function () {
                    // FIX: Đọc giá trị THỰC TẾ đã lưu
                    var current = Settings.get(f.key, 'true');
                    var next    = (current === 'true') ? 'false' : 'true';

                    Settings.set(f.key, next);

                    // Verify
                    var saved = Settings.get(f.key, 'true');
                    console.log('[Toggle]', f.key, ':', current, '->', next, '| verify:', saved);

                    var tag = $(this).find('.ms-tag');
                    if (next === 'true') {
                        tag.attr('class', 'ms-tag on').text('BẬT');
                    } else {
                        tag.attr('class', 'ms-tag off').text('TẮT');
                    }

                    Lampa.Noty.show((next === 'true' ? '✅ Bật' : '❌ Tắt') + ' ' + f.label);
                });

                grp.append(row);
            } else {
                var display = val || f.ph || '(trống)';
                var valCls  = val ? 'ms-val' : 'ms-val empty';

                var row = $(
                    '<div class="ms-row selector" data-key="' + f.key + '">' +
                        '<div class="ms-lbl">' + f.label + '</div>' +
                        '<div class="' + valCls + '">' + display + '</div>' +
                    '</div>'
                );

                row.on('hover:enter', function () {
                    var self   = $(this);
                    var curVal = Settings.get(f.key, '');

                    Lampa.Input.edit({
                        title:       f.label,
                        value:       curVal,
                        placeholder: f.ph || '',
                        free:        true,
                        nosave:      false
                    }, function (newVal) {
                        Settings.set(f.key, newVal);

                        var d = newVal || f.ph || '(trống)';
                        var c = newVal ? 'ms-val' : 'ms-val empty';
                        self.find('.ms-val').attr('class', c).text(d);

                        Lampa.Noty.show('✅ Đã lưu: ' + f.label);
                    });
                });

                grp.append(row);
            }
        });

        return grp;
    }

    // Build action button
    function buildActionBtn(text, handler) {
        var btn = $('<div class="ms-btn selector">' + text + '</div>');
        btn.on('hover:enter', handler);
        return btn;
    }

    // Test connection
    function testConnection(baseUrl, path, name) {
        if (!baseUrl) {
            Lampa.Noty.show('⚠️ Chưa nhập URL ' + name);
            return;
        }

        Lampa.Noty.show('🔄 Testing ' + name + '...');

        var url = baseUrl.replace(/\/+$/, '') + path;

        $.ajax({
            url:      url,
            timeout:  8000,
            dataType: 'json',
            success: function (data) {
                if (data) {
                    var info = '';
                    if (data.name) info = ' - ' + data.name;
                    if (data.version) info += ' v' + data.version;
                    Lampa.Noty.show('✅ ' + name + ' OK!' + info);
                } else {
                    Lampa.Noty.show('✅ ' + name + ' phản hồi!');
                }
            },
            error: function (xhr) {
                if (xhr.status === 200 || xhr.status === 0) {
                    // CORS hoặc text response
                    Lampa.Noty.show('⚠️ ' + name + ' phản hồi nhưng có thể bị CORS');
                } else {
                    Lampa.Noty.show('❌ ' + name + ' lỗi: ' + (xhr.status || 'timeout'));
                }
            }
        });
    }


    // ============================================
    // 4. NGUỒN KKPHIM
    // ============================================
    var KKPhim = {
        search: function (movie, cb) {
            if (!Settings.enabled('kkphim')) return cb([]);

            var q = movie.title || movie.name || '';
            if (!q) return cb([]);

            var url = Settings.kkphim_url().replace(/\/+$/, '');

            $.ajax({
                url:     url + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(q) + '&limit=10',
                timeout: 10000,
                success: function (res) {
                    var list  = [];
                    var items = (res && res.data && res.data.items) || [];

                    items.forEach(function (it) {
                        list.push({
                            source:  'KKPhim',
                            title:   '🎬 ' + it.name + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                            quality: it.quality || 'HD',
                            slug:    it.slug,
                            type:    'kkphim_search'
                        });
                    });
                    cb(list);
                },
                error: function () { cb([]); }
            });
        },

        getStreams: function (slug, cb) {
            var url = Settings.kkphim_url().replace(/\/+$/, '');

            $.ajax({
                url:     url + '/phim/' + slug,
                timeout: 10000,
                success: function (res) {
                    var streams = [];
                    var episodes = (res && res.episodes) || (res && res.movie && res.movie.episodes) || [];

                    episodes.forEach(function (srv) {
                        var name = srv.server_name || 'Server';
                        (srv.server_data || srv.items || []).forEach(function (ep) {
                            if (ep.link_m3u8) {
                                streams.push({
                                    source:  'KKPhim',
                                    title:   '🎬 ' + name + ' - ' + (ep.name || ep.slug),
                                    url:     ep.link_m3u8,
                                    quality: 'HD',
                                    type:    'hls'
                                });
                            }
                            if (ep.link_embed) {
                                streams.push({
                                    source:  'KKPhim',
                                    title:   '🎬 ' + name + ' - ' + (ep.name || ep.slug) + ' [Embed]',
                                    url:     ep.link_embed,
                                    quality: 'HD',
                                    type:    'embed'
                                });
                            }
                        });
                    });
                    cb(streams);
                },
                error: function () { cb([]); }
            });
        }
    };

    // ============================================
    // 5. NGUỒN TORRENTIO
    // ============================================
    var TorrentioSrc = {
        search: function (movie, cb) {
            if (!Settings.enabled('torrentio')) return cb([]);

            ensureImdb(movie, function (m) {
                if (!m.imdb_id) return cb([]);

                var base = Settings.torrentio_url().replace(/\/+$/, '');
                var cfg  = Settings.torrentio_config();
                var root = cfg ? base + '/' + cfg : base;

                var type = m.type === 'tv' ? 'series' : 'movie';
                var url;

                if (type === 'series' && m.season && m.episode) {
                    url = root + '/stream/' + type + '/' + m.imdb_id + ':' + m.season + ':' + m.episode + '.json';
                } else {
                    url = root + '/stream/' + type + '/' + m.imdb_id + '.json';
                }

                $.ajax({
                    url:     url,
                    timeout: 15000,
                    success: function (res) { cb(parseStremio(res, 'Torrentio', '🌊')); },
                    error:   function () { cb([]); }
                });
            });
        }
    };

    // ============================================
    // 6. NGUỒN AIOSTREAMS
    // ============================================
    var AioSrc = {
        search: function (movie, cb) {
            if (!Settings.enabled('aiostreams')) return cb([]);

            ensureImdb(movie, function (m) {
                if (!m.imdb_id) return cb([]);

                var base = Settings.aio_url().replace(/\/+$/, '');
                var cfg  = Settings.aio_config();
                var root = cfg ? base + '/' + cfg : base;

                var type = m.type === 'tv' ? 'series' : 'movie';
                var url;

                if (type === 'series' && m.season && m.episode) {
                    url = root + '/stream/' + type + '/' + m.imdb_id + ':' + m.season + ':' + m.episode + '.json';
                } else {
                    url = root + '/stream/' + type + '/' + m.imdb_id + '.json';
                }

                $.ajax({
                    url:     url,
                    timeout: 20000,
                    success: function (res) { cb(parseStremio(res, 'AioStreams', '🔄')); },
                    error:   function () { cb([]); }
                });
            });
        }
    };


    // ============================================
    // 7. HELPERS
    // ============================================
    function ensureImdb(movie, cb) {
        if (movie.imdb_id) return cb(movie);

        var id   = movie.id;
        var type = movie.type === 'tv' ? 'tv' : 'movie';

        if (!id) return cb(movie);

        $.ajax({
            url:     Lampa.TMDB.api(type + '/' + id + '/external_ids'),
            timeout: 8000,
            success: function (r) {
                movie.imdb_id = (r && r.imdb_id) || '';
                cb(movie);
            },
            error: function () { cb(movie); }
        });
    }

    function parseStremio(res, source, icon) {
        var list = [];
        if (!res || !res.streams) return list;

        res.streams.forEach(function (s) {
            var title = s.title || s.name || source;
            var item  = {
                source:  source,
                title:   icon + ' ' + title,
                quality: exQ(title),
                size:    exS(title),
                seeders: s.seeders || 0
            };

            if (s.infoHash) {
                item.type     = 'torrent';
                item.infoHash = s.infoHash;
                item.fileIdx  = s.fileIdx || 0;
                item.magnet   = 'magnet:?xt=urn:btih:' + s.infoHash;
                if (s.sources) {
                    s.sources.forEach(function (t) {
                        if (t.indexOf('tracker') >= 0) {
                            item.magnet += '&tr=' + encodeURIComponent(t);
                        }
                    });
                }
            } else if (s.url) {
                item.type = 'direct';
                item.url  = s.url;
            } else if (s.externalUrl) {
                item.type = 'external';
                item.url  = s.externalUrl;
            }

            list.push(item);
        });

        list.sort(function (a, b) { return (b.seeders || 0) - (a.seeders || 0); });
        return list;
    }

    function exQ(t) {
        if (/2160p|4k|uhd/i.test(t)) return '4K';
        if (/1080p/i.test(t))        return '1080p';
        if (/720p/i.test(t))         return '720p';
        if (/480p/i.test(t))         return '480p';
        return 'HD';
    }

    function exS(t) {
        var m = t.match(/([\d.]+)\s*(GB|MB|TB)/i);
        return m ? m[1] + ' ' + m[2].toUpperCase() : '';
    }


    // ============================================
    // 8. TORRSERVER PLAYER
    // ============================================
    var TorrServer = {
        play: function (stream, info) {
            var base = Settings.torrserver();
            if (!base) {
                Lampa.Noty.show('⚠️ Chưa cấu hình TorrServer');
                return;
            }

            base = base.replace(/\/+$/, '');

            Lampa.Noty.show('🔄 Gửi tới TorrServer...');

            var link = stream.magnet || ('magnet:?xt=urn:btih:' + stream.infoHash);

            $.ajax({
                url:         base + '/torrents',
                method:      'POST',
                data:        JSON.stringify({
                    action:     'add',
                    link:       link,
                    title:      info.title || info.name || '',
                    poster:     info.poster || '',
                    save_to_db: true
                }),
                contentType: 'application/json',
                timeout:     30000,
                success: function (res) {
                    var hash = (res && res.hash) || stream.infoHash;
                    var idx  = stream.fileIdx || 0;
                    var pUrl = base + '/stream?link=' + hash + '&index=' + idx + '&play';
                    doPlay(pUrl, stream, info);
                },
                error: function () {
                    var pUrl = base + '/stream?link=' + encodeURIComponent(link) +
                               '&index=' + (stream.fileIdx || 0) + '&play';
                    doPlay(pUrl, stream, info);
                }
            });
        }
    };

    function doPlay(url, stream, info) {
        Lampa.Noty.show('▶️ Đang phát...');

        var obj = {
            title:   info.title || info.name || stream.title || '',
            url:     url,
            quality: {}
        };
        obj.quality[stream.quality || 'HD'] = url;

        Lampa.Player.play(obj);
        Lampa.Player.playlist([obj]);
    }


    // ============================================
    // 9. ⭐ ĐĂNG KÝ ONLINE COMPONENT (GIỐNG ONLINE MOD)
    // ============================================
    function registerOnlineComponent() {

        // ---- Component "multi_source_online" ----
        // Lampa gọi component này khi user nhấn nút PLAY gốc
        // nếu ta đăng ký đúng source

        Lampa.Component.add('msrc_online', function (object) {
            var network   = new Lampa.Reguest();
            var _scroll   = new Lampa.Scroll({ mask: true, over: true });
            var _content  = $('<div class="category-full"></div>');
            var _loading  = $('<div class="activity__loader"><div class="activity__loader-content"><div class="activity__loader-icon"></div></div></div>');
            var _empty    = $('<div class="empty"><div class="empty__title">Không tìm thấy nguồn</div><div class="empty__descr">Thử nguồn khác hoặc kiểm tra cài đặt</div></div>');

            var card      = object.card || {};
            var _items    = [];
            var _idx      = 0;
            var _streams  = [];

            this.create = function () {
                this.activity.loader(true);

                var movie = normalizeCard(card);

                if (movie.type === 'tv' && !movie.season) {
                    this.activity.loader(false);
                    selectEpisodeUI(card, (function (s, ep) {
                        movie.season  = s;
                        movie.episode = ep;
                        this.activity.loader(true);
                        doSearchAll(movie, this);
                    }).bind(this));
                } else {
                    doSearchAll(movie, this);
                }
            };

            var doSearchAll = function (movie, comp) {
                var all   = [];
                var done  = 0;
                var total = 0;
                var srcs  = [];

                if (Settings.enabled('kkphim'))     { srcs.push(KKPhim);      total++; }
                if (Settings.enabled('torrentio'))  { srcs.push(TorrentioSrc); total++; }
                if (Settings.enabled('aiostreams')) { srcs.push(AioSrc);       total++; }

                if (total === 0) {
                    comp.activity.loader(false);
                    _content.append(_empty);
                    _scroll.append(_content);
                    return;
                }

                srcs.forEach(function (src) {
                    src.search(movie, function (results) {
                        all  = all.concat(results);
                        done++;
                        if (done >= total) {
                            comp.activity.loader(false);
                            renderStreams(all, movie, comp);
                        }
                    });
                });

                setTimeout(function () {
                    if (done < total) {
                        done = total;
                        comp.activity.loader(false);
                        renderStreams(all, movie, comp);
                    }
                }, 25000);
            };

            var renderStreams = function (streams, movie, comp) {
                _streams = streams;
                _content.empty();

                if (!streams.length) {
                    _content.append(_empty);
                    _scroll.append(_content);
                    comp.start();
                    return;
                }

                // Header
                _content.append('<div style="padding:0.5em 1em;color:#4CAF50;font-weight:600;">⚡ Tìm thấy ' + streams.length + ' nguồn</div>');

                streams.forEach(function (s, i) {
                    var parts = [];
                    if (s.quality) parts.push(s.quality);
                    if (s.size) parts.push(s.size);
                    if (s.seeders) parts.push('🌱' + s.seeders);
                    var tag = s.type === 'torrent' ? '📦' : (s.type === 'hls' ? '📡' : '🔗');
                    parts.push(tag);

                    var el = $(
                        '<div class="selector card-item msrc-stream-item" data-idx="' + i + '" style="padding:0.8em 1em;margin:0.3em 0.5em;border-radius:0.5em;background:rgba(255,255,255,0.04);">' +
                            '<div style="font-size:0.95em;color:#fff;margin-bottom:0.3em;">' + s.title + '</div>' +
                            '<div style="font-size:0.75em;color:#888;">' + parts.join(' • ') + '</div>' +
                        '</div>'
                    );

                    el.on('hover:enter', function () {
                        var idx = parseInt($(this).data('idx'));
                        playStream(_streams[idx], movie);
                    });

                    el.on('hover:focus', function () {
                        _idx = streams.indexOf(_streams[parseInt($(this).data('idx'))]);
                        _scroll.update($(this));
                    });

                    _content.append(el);
                });

                _scroll.append(_content);
                comp.start();
            };

            this.start = function () {
                Lampa.Controller.add('msrc_online_ctrl', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(_scroll.render());
                        Lampa.Controller.collectionFocus(false, _scroll.render());
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    },
                    left: function () {
                        if (Navigator.canBack()) Navigator.back();
                        else Lampa.Activity.backward();
                    },
                    right: function () {},
                    up: function () {
                        Navigator.move('up');
                    },
                    down: function () {
                        Navigator.move('down');
                    },
                    enter: function () {
                        // Handled by hover:enter
                    }
                });

                Lampa.Controller.toggle('msrc_online_ctrl');
            };

            this.pause  = function () {};
            this.stop   = function () { network.clear(); };
            this.render = function () { return _scroll.render(); };
            this.destroy = function () {
                network.clear();
                _scroll.destroy();
            };
        });
    }


    // ============================================
    // 10. ⭐ HOOK VÀO NÚT PLAY GỐC CỦA LAMPA
    // ============================================
    function hookPlayButton() {

        // === CÁCH CHÍNH: Thêm source vào danh sách online ===
        // Khi nhấn nút Play, Lampa mở menu chọn nguồn
        // Ta thêm "Đa Nguồn" vào danh sách đó

        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                addButtonToFull(e);
            }
        });

        // Lắng nghe khi render xong trang chi tiết
        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start') {
                setTimeout(function () {
                    addButtonToActivity();
                }, 600);
            }
        });

        // ⭐ Hook vào sự kiện online/source select
        // Đây là cách online_mod hoạt động
        var origOnline = Lampa.Player.online;

        // Thêm vào danh sách source buttons
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    var card = getCardFromActivity();
                    if (card) injectSourceButton(card);
                }, 800);
            }
        });
    }

    function getCardFromActivity() {
        try {
            var act = Lampa.Activity.active();
            if (act && act.card) return act.card;
            if (act && act.data)  return act.data;
            if (act && act.activity && act.activity.card) return act.activity.card;

            // Thử lấy từ activity params
            var p = act && act.activity && act.activity.params;
            if (p && p.object) return p.object;
            if (p && p.card)   return p.card;

            return null;
        } catch (e) { return null; }
    }

    function addButtonToFull(e) {
        try {
            var render, card;

            if (e.object) {
                render = e.object.activity ? e.object.activity.render() : null;
                card   = e.data || e.object.data || e.object.card || {};
            }

            if (!render) {
                var act = Lampa.Activity.active();
                if (act && act.activity) {
                    render = act.activity.render();
                    card   = act.card || act.data || {};
                }
            }

            if (!render) return;

            // Tìm container buttons
            var btns = render.find('.full-start-new__buttons').eq(0);
            if (!btns.length) btns = render.find('.full-start__buttons').eq(0);
            if (!btns.length) btns = render.find('.buttons--container').eq(0);
            if (!btns.length) return;

            // Tránh trùng
            if (btns.find('.msrc-btn').length) return;

            var btn = $(
                '<div class="full-start__button selector msrc-btn" style="background:linear-gradient(135deg,#4CAF50,#2196F3);">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;">' +
                        '<path d="M8 5v14l11-7z"/>' +
                    '</svg>' +
                    '<span>' + PLUGIN_TITLE + '</span>' +
                '</div>'
            );

            btn.on('hover:enter', function () {
                openMultiSourcePage(card);
            });

            btns.append(btn);

        } catch (ex) {
            console.log('[MultiSource] addButton error:', ex);
        }
    }

    function addButtonToActivity() {
        var act = Lampa.Activity.active();
        if (!act || !act.activity) return;

        var render = act.activity.render();
        var card   = act.card || act.data || {};

        var btns = render.find('.full-start-new__buttons, .full-start__buttons').eq(0);
        if (!btns.length) return;
        if (btns.find('.msrc-btn').length) return;

        var btn = $(
            '<div class="full-start__button selector msrc-btn" style="background:linear-gradient(135deg,#4CAF50,#2196F3);">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;">' +
                    '<path d="M8 5v14l11-7z"/>' +
                '</svg>' +
                '<span>' + PLUGIN_TITLE + '</span>' +
            '</div>'
        );

        btn.on('hover:enter', function () {
            openMultiSourcePage(card);
        });

        btns.append(btn);
    }

    // ⭐ Inject nút nguồn bên cạnh nút xem/online
    function injectSourceButton(card) {
        var act = Lampa.Activity.active();
        if (!act || !act.activity) return;

        var render = act.activity.render();

        // Tìm nút "Xem" hoặc "Online"
        var watchBtns = render.find('.full-start__button').filter(function () {
            var txt = $(this).text().toLowerCase();
            return txt.indexOf('xem') >= 0 || txt.indexOf('online') >= 0 ||
                   txt.indexOf('watch') >= 0 || txt.indexOf('play') >= 0 ||
                   txt.indexOf('phát') >= 0;
        });

        // Nếu có nút xem, thêm handler bổ sung
        if (watchBtns.length && !render.data('msrc_injected')) {
            render.data('msrc_injected', true);

            // Lắng nghe khi user nhấn nút xem gốc
            // và thêm nguồn của mình vào select menu
            var origHandler = watchBtns.eq(0).data('events');

            // Thêm listener vào Lampa Select
            var origSelectShow = Lampa.Select.show;
            Lampa.Select.show = function (params) {
                // Kiểm tra nếu đây là menu chọn nguồn
                if (params && params.items && isSourceMenu(params.items)) {
                    // Thêm nguồn của mình
                    params.items.push({
                        title: '⚡ ' + PLUGIN_TITLE,
                        subtitle: 'KKPhim + Torrentio + AioStreams',
                        source_type: 'msrc_custom'
                    });

                    var origSelect = params.onSelect;
                    params.onSelect = function (item) {
                        if (item.source_type === 'msrc_custom') {
                            openMultiSourcePage(card);
                        } else if (origSelect) {
                            origSelect(item);
                        }
                    };
                }

                origSelectShow.call(Lampa.Select, params);
            };
        }
    }

    function isSourceMenu(items) {
        if (!items || !items.length) return false;
        // Kiểm tra xem đây có phải menu chọn nguồn phát không
        for (var i = 0; i < items.length; i++) {
            var t = (items[i].title || '').toLowerCase();
            if (t.indexOf('online') >= 0 || t.indexOf('torrent') >= 0 ||
                t.indexOf('source') >= 0 || t.indexOf('nguồn') >= 0) {
                return true;
            }
        }
        return false;
    }


    // ============================================
    // 11. MỞ TRANG TÌM NGUỒN
    // ============================================
    function openMultiSourcePage(card) {
        Lampa.Activity.push({
            url:       '',
            title:     PLUGIN_TITLE,
            component: 'msrc_online',
            page:      1,
            card:      card
        });
    }

    function normalizeCard(card) {
        return {
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
    }

    function selectEpisodeUI(card, cb) {
        var seasons = [];
        var num     = card.number_of_seasons || 1;

        if (card.seasons && card.seasons.length) {
            card.seasons.forEach(function (s) {
                if (s.season_number > 0) {
                    seasons.push({
                        title:  'Phần ' + s.season_number + ' (' + (s.episode_count || '?') + ' tập)',
                        season: s.season_number,
                        eps:    s.episode_count || 24
                    });
                }
            });
        }

        if (!seasons.length) {
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
                    title:    'Phần ' + s.season + ' - Chọn Tập',
                    items:    eps,
                    onSelect: function (ep) { cb(s.season, ep.episode); },
                    onBack:   function () { Lampa.Controller.toggle('content'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }


    // ============================================
    // 12. PHÁT STREAM
    // ============================================
    function playStream(stream, movie) {
        console.log('[MultiSource] Play:', stream.type, stream.source);

        if (stream.type === 'torrent') {
            TorrServer.play(stream, movie);

        } else if (stream.type === 'hls' || stream.type === 'direct') {
            doPlay(stream.url, stream, movie);

        } else if (stream.type === 'kkphim_search' && stream.slug) {
            Lampa.Noty.show('🔄 Lấy link từ KKPhim...');
            KKPhim.getStreams(stream.slug, function (list) {
                if (list.length === 1) {
                    playStream(list[0], movie);
                } else if (list.length > 1) {
                    // Hiện select cho user chọn
                    var items = list.map(function (s, i) {
                        return {
                            title:    s.title,
                            subtitle: s.quality + ' | ' + s.type,
                            stream:   s,
                            index:    i
                        };
                    });

                    Lampa.Select.show({
                        title:    '🎬 KKPhim - Chọn server',
                        items:    items,
                        onSelect: function (it) { playStream(it.stream, movie); },
                        onBack:   function () { Lampa.Controller.toggle('content'); }
                    });
                } else {
                    Lampa.Noty.show('😕 Không lấy được link');
                }
            });

        } else if (stream.type === 'external' && stream.url) {
            doPlay(stream.url, stream, movie);

        } else {
            Lampa.Noty.show('⚠️ Loại stream không hỗ trợ');
        }
    }


    // ============================================
    // 13. KHỞI TẠO
    // ============================================
    function boot() {
        console.log('[MultiSource] v3.0 booting...');

        // Đăng ký components
        registerSettingsComponent();
        registerOnlineComponent();

        // Thêm menu
        addMenuButton();

        // Hook play button
        hookPlayButton();

        // CSS
        if (!$('#msrc-global-css').length) {
            $('head').append(
                '<style id="msrc-global-css">' +
                '.msrc-btn { transition: all 0.2s; }' +
                '.msrc-btn.focus, .msrc-btn:hover {' +
                '  transform: scale(1.06);' +
                '  box-shadow: 0 0 20px rgba(76,175,80,0.4);' +
                '}' +
                '.msrc-stream-item.focus {' +
                '  background: rgba(76,175,80,0.15) !important;' +
                '  outline: 2px solid #4CAF50;' +
                '}' +
                '</style>'
            );
        }

        console.log('[MultiSource] v3.0 ready!');
    }

    if (window.appready) {
        boot();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') boot();
        });
    }

})();