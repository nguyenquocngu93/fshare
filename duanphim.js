// myplugin.js - v5.0 Based on v1 (working settings)
(function () {
    'use strict';

    if (window.msrc_v5) return;
    window.msrc_v5 = true;

    var PLUGIN_NAME = 'multi_source';
    var PLUGIN_TITLE = 'Đa Nguồn';

    // ============================================
    // 1. STORAGE - ĐƠN GIẢN, MẶC ĐỊNH BẬT TẤT CẢ
    // ============================================
    var Config = {
        _data: null,

        _load: function () {
            if (this._data) return this._data;
            try {
                var raw = Lampa.Storage.get('msrc_config', '{}');
                this._data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch (e) {
                this._data = {};
            }
            return this._data;
        },

        _save: function () {
            Lampa.Storage.set('msrc_config', JSON.stringify(this._data));
        },

        get: function (key) {
            var data = this._load();
            return data[key];
        },

        set: function (key, val) {
            this._load();
            this._data[key] = val;
            this._save();
        },

        // === GETTERS VỚI DEFAULT ===
        torrserver: function () {
            return this.get('torrserver') || 'http://127.0.0.1:8090';
        },
        kkphim: function () {
            return this.get('kkphim') || 'https://phimapi.com';
        },
        torrentio: function () {
            return this.get('torrentio') || 'https://torrentio.strem.fun';
        },
        torrentio_cfg: function () {
            return this.get('torrentio_cfg') || '';
        },
        aio: function () {
            return this.get('aio') || 'https://aiostreams.elfhosted.com';
        },
        aio_cfg: function () {
            return this.get('aio_cfg') || '';
        },

        // === NGUỒN BẬT/TẮT - MẶC ĐỊNH = TRUE ===
        kkphim_on: function () {
            var val = this.get('kkphim_on');
            return val === undefined ? true : val === true;
        },
        torrentio_on: function () {
            var val = this.get('torrentio_on');
            return val === undefined ? true : val === true;
        },
        aio_on: function () {
            var val = this.get('aio_on');
            return val === undefined ? true : val === true;
        }
    };

    // ============================================
    // 2. MENU BÊN TRÁI
    // ============================================
    function addSettingsMenu() {
        var icon = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" fill="currentColor"/><circle cx="19" cy="7" r="2.5" fill="#4CAF50"/></svg>';

        var item = $('<li class="menu__item selector" data-action="' + PLUGIN_NAME + '"><div class="menu__ico">' + icon + '</div><div class="menu__text">' + PLUGIN_TITLE + '</div></li>');

        item.on('hover:enter', function () {
            openSettings();
        });

        $('.menu .menu__list').first().append(item);
        console.log('[MSRC] Menu added');
    }

    // ============================================
    // 3. SETTINGS PAGE
    // ============================================
    function openSettings() {
        var html = $('<div class="settings-msrc"></div>');

        // CSS
        var css = '\
            <style>\
            .settings-msrc { padding: 20px; }\
            .msrc-section { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px; }\
            .msrc-title { color: #4CAF50; font-weight: bold; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .msrc-row { display: flex; align-items: center; padding: 10px; margin: 5px 0; border-radius: 6px; }\
            .msrc-row.focus { background: rgba(255,255,255,0.1); outline: 2px solid #4CAF50; }\
            .msrc-label { width: 130px; color: #aaa; }\
            .msrc-value { flex: 1; color: #fff; word-break: break-all; }\
            .msrc-value.empty { color: #666; font-style: italic; }\
            .msrc-tag { padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; }\
            .msrc-tag.on { background: #4CAF50; color: white; }\
            .msrc-tag.off { background: #666; color: #ccc; }\
            .msrc-btn { text-align: center; padding: 12px; margin: 8px 0; border-radius: 6px; font-weight: bold; }\
            .msrc-btn.focus { background: rgba(76,175,80,0.2); outline: 2px solid #4CAF50; }\
            .msrc-info { background: rgba(33,150,243,0.1); border: 1px solid rgba(33,150,243,0.3); border-radius: 8px; padding: 12px; margin: 10px 0; color: #90CAF9; font-size: 13px; line-height: 1.5; }\
            </style>';
        html.append(css);

        // Header
        html.append('<div style="text-align:center;margin-bottom:20px;"><div style="font-size:22px;font-weight:bold;">⚡ ' + PLUGIN_TITLE + '</div><div style="color:#888;margin-top:5px;">KKPhim • Torrentio • AioStreams</div></div>');

        // === TORRSERVER ===
        var s1 = createSection('🖥️ TorrServer');
        s1.append(createInputRow('torrserver', 'URL', 'http://127.0.0.1:8090'));
        s1.append(createButton('🔍 Test TorrServer', function () {
            testEndpoint(Config.torrserver() + '/echo', 'TorrServer');
        }));
        html.append(s1);

        // === KKPHIM ===
        var s2 = createSection('🎬 KKPhim');
        s2.append(createInputRow('kkphim', 'URL API', 'https://phimapi.com'));
        s2.append(createToggleRow('kkphim_on', 'Trạng thái'));
        s2.append(createButton('🔍 Test KKPhim', function () {
            testEndpoint(Config.kkphim() + '/v1/api/tim-kiem?keyword=a&limit=1', 'KKPhim');
        }));
        html.append(s2);

        // === TORRENTIO ===
        var s3 = createSection('🌊 Torrentio');
        s3.append(createInfo('📝 <b>Cách lấy Config:</b><br>1. Vào <b>torrentio.strem.fun/configure</b><br>2. Chọn các tùy chọn<br>3. Copy phần sau "/configure/" trong URL<br>Ví dụ: <b>sort=qualitysize|qualityfilter=480p,scr,cam</b>'));
        s3.append(createInputRow('torrentio', 'URL', 'https://torrentio.strem.fun'));
        s3.append(createInputRow('torrentio_cfg', 'Config', 'Để trống = mặc định'));
        s3.append(createToggleRow('torrentio_on', 'Trạng thái'));
        s3.append(createButton('🔍 Test Torrentio', function () {
            testTorrentio();
        }));
        html.append(s3);

        // === AIOSTREAMS ===
        var s4 = createSection('🔄 AioStreams');
        s4.append(createInfo('📝 <b>Cách lấy Config:</b><br>1. Vào <b>aiostreams.elfhosted.com/configure</b><br>2. Cấu hình các dịch vụ (RealDebrid, v.v.)<br>3. Copy <b>toàn bộ chuỗi config</b> (rất dài)<br>⚠️ AioStreams <b>BẮT BUỘC</b> cần Config!'));
        s4.append(createInputRow('aio', 'URL', 'https://aiostreams.elfhosted.com'));
        s4.append(createInputRow('aio_cfg', 'Config', 'BẮT BUỘC - Paste config'));
        s4.append(createToggleRow('aio_on', 'Trạng thái'));
        s4.append(createButton('🔍 Test AioStreams', function () {
            testAioStreams();
        }));
        html.append(s4);

        // === TRẠNG THÁI ===
        var status = createSection('📊 Trạng thái nguồn');
        status.append('<div style="padding:10px;">' +
            '<div style="margin:5px 0;">KKPhim: <span style="color:' + (Config.kkphim_on() ? '#4CAF50' : '#f44336') + '">' + (Config.kkphim_on() ? '✅ BẬT' : '❌ TẮT') + '</span></div>' +
            '<div style="margin:5px 0;">Torrentio: <span style="color:' + (Config.torrentio_on() ? '#4CAF50' : '#f44336') + '">' + (Config.torrentio_on() ? '✅ BẬT' : '❌ TẮT') + '</span></div>' +
            '<div style="margin:5px 0;">AioStreams: <span style="color:' + (Config.aio_on() ? '#4CAF50' : '#f44336') + '">' + (Config.aio_on() ? '✅ BẬT' : '❌ TẮT') + '</span></div>' +
            '</div>');
        html.append(status);

        // Render
        Lampa.Activity.push({
            url: '',
            title: PLUGIN_TITLE + ' - Cài đặt',
            component: 'msrc_settings_page',
            page: 1
        });

        setTimeout(function () {
            var activity = Lampa.Activity.active();
            var render = activity.activity.render();
            render.empty().append(html);

            var items = html.find('.selector').toArray();
            var idx = 0;

            function focus(i) {
                $(items).removeClass('focus');
                idx = Math.max(0, Math.min(i, items.length - 1));
                $(items[idx]).addClass('focus');

                // Scroll vào view
                var el = items[idx];
                if (el && el.scrollIntoView) {
                    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }

            Lampa.Controller.add('msrc_set', {
                toggle: function () { },
                back: function () { Lampa.Activity.backward(); },
                left: function () { Lampa.Activity.backward(); },
                right: function () { },
                up: function () { focus(idx - 1); },
                down: function () { focus(idx + 1); },
                enter: function () {
                    var el = $(items[idx]);
                    if (el.data('handler')) el.data('handler')();
                }
            });

            Lampa.Controller.toggle('msrc_set');
            focus(0);
        }, 100);
    }

    // === UI Helpers ===
    function createSection(title) {
        return $('<div class="msrc-section"><div class="msrc-title">' + title + '</div></div>');
    }

    function createInfo(text) {
        return $('<div class="msrc-info">' + text + '</div>');
    }

    function createInputRow(key, label, placeholder) {
        var val = Config.get(key) || '';
        var display = val || placeholder;
        var cls = val ? 'msrc-value' : 'msrc-value empty';

        var row = $('<div class="msrc-row selector"><div class="msrc-label">' + label + '</div><div class="' + cls + '">' + display + '</div></div>');

        row.data('handler', function () {
            Lampa.Input.edit({
                title: label,
                value: val,
                placeholder: placeholder,
                free: true,
                nosave: false
            }, function (newVal) {
                Config.set(key, newVal);
                var d = newVal || placeholder;
                var c = newVal ? 'msrc-value' : 'msrc-value empty';
                row.find('.msrc-value').attr('class', c).text(d);
                Lampa.Noty.show('✅ Đã lưu: ' + label);
            });
        });

        return row;
    }

    function createToggleRow(key, label) {
        var isOn = Config.get(key);
        if (isOn === undefined) isOn = true; // Mặc định BẬT

        var tag = isOn ? '<span class="msrc-tag on">BẬT</span>' : '<span class="msrc-tag off">TẮT</span>';
        var row = $('<div class="msrc-row selector"><div class="msrc-label">' + label + '</div><div class="msrc-value">' + tag + '</div></div>');

        row.data('handler', function () {
            var current = Config.get(key);
            if (current === undefined) current = true;
            var next = !current;
            Config.set(key, next);

            var span = row.find('.msrc-tag');
            if (next) {
                span.attr('class', 'msrc-tag on').text('BẬT');
                Lampa.Noty.show('✅ Đã bật');
            } else {
                span.attr('class', 'msrc-tag off').text('TẮT');
                Lampa.Noty.show('❌ Đã tắt');
            }
        });

        return row;
    }

    function createButton(text, handler) {
        var btn = $('<div class="msrc-btn selector" style="color:#4CAF50;">' + text + '</div>');
        btn.data('handler', handler);
        return btn;
    }

    // === TEST FUNCTIONS ===
    function testEndpoint(url, name) {
        Lampa.Noty.show('🔄 Testing ' + name + '...');
        console.log('[MSRC] Test:', url);

        $.ajax({
            url: url,
            timeout: 10000,
            success: function (data) {
                console.log('[MSRC] Test OK:', data);
                var info = '';
                if (typeof data === 'object') {
                    if (data.streams) info = ' (' + data.streams.length + ' streams)';
                    else if (data.data && data.data.items) info = ' (' + data.data.items.length + ' items)';
                    else if (data.name) info = ' - ' + data.name;
                }
                Lampa.Noty.show('✅ ' + name + ' OK!' + info);
            },
            error: function (xhr, status, err) {
                console.log('[MSRC] Test Error:', status, err);
                if (xhr.status === 0) {
                    Lampa.Noty.show('⚠️ ' + name + ' - Có thể bị CORS');
                } else {
                    Lampa.Noty.show('❌ ' + name + ' lỗi: ' + (err || status));
                }
            }
        });
    }

    function testTorrentio() {
        var base = Config.torrentio();
        var cfg = Config.torrentio_cfg();
        // Test với phim The Matrix (tt0133093)
        var url = cfg ? base + '/' + cfg + '/stream/movie/tt0133093.json' : base + '/stream/movie/tt0133093.json';
        testEndpoint(url, 'Torrentio');
    }

    function testAioStreams() {
        var cfg = Config.aio_cfg();
        if (!cfg) {
            Lampa.Noty.show('⚠️ AioStreams cần Config! Xem hướng dẫn ở trên.');
            return;
        }
        var base = Config.aio();
        var url = base + '/' + cfg + '/stream/movie/tt0133093.json';
        testEndpoint(url, 'AioStreams');
    }

    // ============================================
    // 4. COMPONENT CHO SETTINGS PAGE
    // ============================================
    Lampa.Component.add('msrc_settings_page', function () {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        this.create = function () { };
        this.start = function () { };
        this.pause = function () { };
        this.stop = function () { };
        this.render = function () { return scroll.render(); };
        this.destroy = function () { scroll.destroy(); };
    });

    // ============================================
    // 5. ⭐ NÚT PHÁT TRÊN TRANG CHI TIẾT PHIM
    // ============================================
    function registerPlayButton() {
        console.log('[MSRC] Registering play button...');

        // Lắng nghe khi trang chi tiết phim được render
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                console.log('[MSRC] Full page complete');
                setTimeout(function () {
                    addPlayButtonToPage(e);
                }, 300);
            }
        });
    }

    function addPlayButtonToPage(e) {
        try {
            // Lấy render container
            var render = null;
            var card = null;

            if (e.object && e.object.activity) {
                render = e.object.activity.render();
            }
            if (e.data) {
                card = e.data;
            } else if (e.object && e.object.data) {
                card = e.object.data;
            }

            if (!render) {
                var act = Lampa.Activity.active();
                if (act && act.activity) {
                    render = act.activity.render();
                    card = act.card || act.data || {};
                }
            }

            if (!render) {
                console.log('[MSRC] No render found');
                return;
            }

            console.log('[MSRC] Looking for buttons container...');

            // Tìm container các nút
            var btns = render.find('.full-start-new__buttons');
            if (!btns.length) btns = render.find('.full-start__buttons');
            if (!btns.length) btns = render.find('.buttons--container');
            if (!btns.length) btns = render.find('.full-start__actions');

            console.log('[MSRC] Buttons container found:', btns.length);

            if (!btns.length) return;

            // Kiểm tra đã có nút chưa
            if (btns.find('.msrc-custom-btn').length) {
                console.log('[MSRC] Button already exists');
                return;
            }

            // Tạo nút
            var btn = $('<div class="full-start__button selector msrc-custom-btn" style="background:linear-gradient(135deg,#4CAF50,#2196F3);"></div>');
            btn.append('<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px;"><path d="M8 5v14l11-7z"/></svg>');
            btn.append('<span>' + PLUGIN_TITLE + '</span>');

            btn.on('hover:enter', function () {
                console.log('[MSRC] Play button clicked, card:', card);
                openStreamSelector(card);
            });

            // Thêm CSS cho nút
            if (!$('#msrc-btn-style').length) {
                $('head').append('<style id="msrc-btn-style">.msrc-custom-btn{transition:all 0.2s;}.msrc-custom-btn.focus,.msrc-custom-btn:hover{transform:scale(1.05);box-shadow:0 0 20px rgba(76,175,80,0.5);}</style>');
            }

            btns.append(btn);
            console.log('[MSRC] Button added successfully!');

        } catch (ex) {
            console.error('[MSRC] addPlayButton error:', ex);
        }
    }

    // ============================================
    // 6. STREAM SELECTOR
    // ============================================
    function openStreamSelector(card) {
        if (!card || !card.id) {
            Lampa.Noty.show('⚠️ Không có thông tin phim');
            return;
        }

        console.log('[MSRC] Opening stream selector for:', card.title || card.name);

        var movie = {
            id: card.id,
            title: card.title || card.name || '',
            name: card.name || card.title || '',
            type: (card.number_of_seasons || card.first_air_date) ? 'tv' : 'movie',
            imdb_id: card.imdb_id || (card.external_ids && card.external_ids.imdb_id) || '',
            poster: card.poster || card.img || '',
            season: card.season || null,
            episode: card.episode || null
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

    function selectEpisode(card, callback) {
        var seasons = [];
        var num = card.number_of_seasons || 1;

        if (card.seasons && card.seasons.length) {
            card.seasons.forEach(function (s) {
                if (s.season_number > 0) {
                    seasons.push({
                        title: 'Phần ' + s.season_number + ' (' + (s.episode_count || '?') + ' tập)',
                        season: s.season_number,
                        eps: s.episode_count || 20
                    });
                }
            });
        }

        if (!seasons.length) {
            for (var i = 1; i <= num; i++) {
                seasons.push({ title: 'Phần ' + i, season: i, eps: 20 });
            }
        }

        Lampa.Select.show({
            title: '📺 Chọn Phần',
            items: seasons,
            onSelect: function (s) {
                var eps = [];
                for (var j = 1; j <= s.eps; j++) {
                    eps.push({ title: 'Tập ' + j, episode: j });
                }
                Lampa.Select.show({
                    title: '📺 Phần ' + s.season + ' - Chọn Tập',
                    items: eps,
                    onSelect: function (ep) {
                        callback(s.season, ep.episode);
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

    // ============================================
    // 7. SEARCH ALL SOURCES
    // ============================================
    function searchAllSources(movie) {
        Lampa.Noty.show('🔍 Đang tìm từ tất cả nguồn...');
        console.log('[MSRC] Searching for:', movie);

        var allStreams = [];
        var pending = 0;
        var completed = 0;

        function checkDone() {
            completed++;
            if (completed >= pending) {
                showStreamResults(allStreams, movie);
            }
        }

        // KKPhim
        if (Config.kkphim_on()) {
            pending++;
            searchKKPhim(movie, function (list) {
                allStreams = allStreams.concat(list);
                checkDone();
            });
        }

        // Torrentio
        if (Config.torrentio_on()) {
            pending++;
            searchTorrentio(movie, function (list) {
                allStreams = allStreams.concat(list);
                checkDone();
            });
        }

        // AioStreams
        if (Config.aio_on() && Config.aio_cfg()) {
            pending++;
            searchAioStreams(movie, function (list) {
                allStreams = allStreams.concat(list);
                checkDone();
            });
        }

        if (pending === 0) {
            Lampa.Noty.show('⚠️ Chưa bật nguồn nào!');
            return;
        }

        // Timeout 25s
        setTimeout(function () {
            if (completed < pending) {
                completed = pending;
                showStreamResults(allStreams, movie);
            }
        }, 25000);
    }

    // === KKPHIM ===
    function searchKKPhim(movie, callback) {
        var url = Config.kkphim() + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(movie.title) + '&limit=10';
        console.log('[MSRC] KKPhim search:', url);

        $.ajax({
            url: url,
            timeout: 10000,
            success: function (res) {
                var list = [];
                var items = (res && res.data && res.data.items) || [];
                items.forEach(function (it) {
                    list.push({
                        source: 'KKPhim',
                        title: '🎬 ' + it.name + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                        quality: it.quality || 'HD',
                        slug: it.slug,
                        type: 'kkphim'
                    });
                });
                console.log('[MSRC] KKPhim found:', list.length);
                callback(list);
            },
            error: function (xhr, status, err) {
                console.log('[MSRC] KKPhim error:', err);
                callback([]);
            }
        });
    }

    // === TORRENTIO ===
    function searchTorrentio(movie, callback) {
        getImdbId(movie, function (imdbId) {
            if (!imdbId) {
                console.log('[MSRC] No IMDB ID for Torrentio');
                callback([]);
                return;
            }

            var base = Config.torrentio();
            var cfg = Config.torrentio_cfg();
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var url;

            if (cfg) {
                url = base + '/' + cfg + '/stream/' + type + '/' + imdbId;
            } else {
                url = base + '/stream/' + type + '/' + imdbId;
            }

            if (type === 'series' && movie.season && movie.episode) {
                url += ':' + movie.season + ':' + movie.episode;
            }
            url += '.json';

            console.log('[MSRC] Torrentio search:', url);

            $.ajax({
                url: url,
                timeout: 15000,
                success: function (res) {
                    var list = parseStremioStreams(res, 'Torrentio', '🌊');
                    console.log('[MSRC] Torrentio found:', list.length);
                    callback(list);
                },
                error: function (xhr, status, err) {
                    console.log('[MSRC] Torrentio error:', err);
                    callback([]);
                }
            });
        });
    }

    // === AIOSTREAMS ===
    function searchAioStreams(movie, callback) {
        var cfg = Config.aio_cfg();
        if (!cfg) {
            callback([]);
            return;
        }

        getImdbId(movie, function (imdbId) {
            if (!imdbId) {
                console.log('[MSRC] No IMDB ID for AioStreams');
                callback([]);
                return;
            }

            var base = Config.aio();
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var url = base + '/' + cfg + '/stream/' + type + '/' + imdbId;

            if (type === 'series' && movie.season && movie.episode) {
                url += ':' + movie.season + ':' + movie.episode;
            }
            url += '.json';

            console.log('[MSRC] AioStreams search:', url);

            $.ajax({
                url: url,
                timeout: 20000,
                success: function (res) {
                    var list = parseStremioStreams(res, 'AioStreams', '🔄');
                    console.log('[MSRC] AioStreams found:', list.length);
                    callback(list);
                },
                error: function (xhr, status, err) {
                    console.log('[MSRC] AioStreams error:', err);
                    callback([]);
                }
            });
        });
    }

    // === HELPERS ===
    function getImdbId(movie, callback) {
        if (movie.imdb_id) {
            callback(movie.imdb_id);
            return;
        }

        var type = movie.type === 'tv' ? 'tv' : 'movie';
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/external_ids');

        $.ajax({
            url: url,
            timeout: 8000,
            success: function (res) {
                var imdb = res && res.imdb_id ? res.imdb_id : null;
                console.log('[MSRC] Got IMDB ID:', imdb);
                callback(imdb);
            },
            error: function () {
                callback(null);
            }
        });
    }

    function parseStremioStreams(res, source, icon) {
        var list = [];
        if (!res || !res.streams) return list;

        res.streams.forEach(function (s) {
            var title = s.title || s.name || source;
            var item = {
                source: source,
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
                    s.sources.forEach(function (t) {
                        if (t.indexOf('tracker') !== -1) {
                            item.magnet += '&tr=' + encodeURIComponent(t);
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

        return list.sort(function (a, b) {
            return (b.seeders || 0) - (a.seeders || 0);
        });
    }

    function extractQuality(t) {
        if (/2160p|4k|uhd/i.test(t)) return '4K';
        if (/1080p/i.test(t)) return '1080p';
        if (/720p/i.test(t)) return '720p';
        if (/480p/i.test(t)) return '480p';
        return 'HD';
    }

    function extractSize(t) {
        var m = t.match(/([\d.]+)\s*(GB|MB)/i);
        return m ? m[1] + ' ' + m[2].toUpperCase() : '';
    }

    // ============================================
    // 8. SHOW RESULTS
    // ============================================
    function showStreamResults(streams, movie) {
        if (!streams.length) {
            Lampa.Noty.show('😕 Không tìm thấy nguồn nào');
            return;
        }

        Lampa.Noty.show('✅ Tìm thấy ' + streams.length + ' nguồn');

        var items = streams.map(function (s, i) {
            var info = [];
            if (s.quality) info.push(s.quality);
            if (s.size) info.push(s.size);
            if (s.seeders) info.push('🌱' + s.seeders);
            if (s.type === 'torrent') info.push('📦');
            else if (s.type === 'hls' || s.type === 'direct') info.push('📡');

            return {
                title: s.title,
                subtitle: '[' + s.source + '] ' + info.join(' • '),
                stream: s,
                index: i
            };
        });

        Lampa.Select.show({
            title: '🎯 Chọn nguồn phát (' + streams.length + ')',
            items: items,
            onSelect: function (item) {
                playStream(item.stream, movie);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }

    // ============================================
    // 9. PLAY STREAM
    // ============================================
    function playStream(stream, movie) {
        console.log('[MSRC] Playing:', stream);

        if (stream.type === 'torrent') {
            playViaTorrServer(stream, movie);
        } else if (stream.type === 'direct' || stream.type === 'hls') {
            playDirect(stream.url, stream, movie);
        } else if (stream.type === 'kkphim' && stream.slug) {
            Lampa.Noty.show('🔄 Lấy link từ KKPhim...');
            getKKPhimLinks(stream.slug, function (links) {
                if (links.length === 1) {
                    playDirect(links[0].url, links[0], movie);
                } else if (links.length > 1) {
                    Lampa.Select.show({
                        title: '🎬 Chọn server',
                        items: links.map(function (l) {
                            return { title: l.title, link: l };
                        }),
                        onSelect: function (item) {
                            playDirect(item.link.url, item.link, movie);
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('content');
                        }
                    });
                } else {
                    Lampa.Noty.show('😕 Không có link');
                }
            });
        } else if (stream.type === 'external' && stream.url) {
            playDirect(stream.url, stream, movie);
        } else {
            Lampa.Noty.show('⚠️ Loại stream không hỗ trợ');
        }
    }

    function getKKPhimLinks(slug, callback) {
        var url = Config.kkphim() + '/phim/' + slug;

        $.ajax({
            url: url,
            timeout: 10000,
            success: function (res) {
                var links = [];
                var episodes = (res && res.episodes) || [];
                episodes.forEach(function (srv) {
                    (srv.server_data || []).forEach(function (ep) {
                        if (ep.link_m3u8) {
                            links.push({
                                title: (srv.server_name || 'Server') + ' - ' + (ep.name || ep.slug),
                                url: ep.link_m3u8,
                                quality: 'HD',
                                type: 'hls'
                            });
                        }
                    });
                });
                callback(links);
            },
            error: function () {
                callback([]);
            }
        });
    }

    function playDirect(url, stream, movie) {
        Lampa.Noty.show('▶️ Đang phát...');

        var data = {
            title: movie.title || stream.title || '',
            url: url,
            quality: {}
        };
        data.quality[stream.quality || 'HD'] = url;

        Lampa.Player.play(data);
        Lampa.Player.playlist([data]);
    }

    function playViaTorrServer(stream, movie) {
        var base = Config.torrserver();
        if (!base) {
            Lampa.Noty.show('⚠️ Chưa cấu hình TorrServer');
            return;
        }

        Lampa.Noty.show('🔄 Gửi tới TorrServer...');

        var link = stream.magnet || ('magnet:?xt=urn:btih:' + stream.infoHash);

        $.ajax({
            url: base + '/torrents',
            method: 'POST',
            data: JSON.stringify({
                action: 'add',
                link: link,
                title: movie.title || '',
                poster: movie.poster || '',
                save_to_db: true
            }),
            contentType: 'application/json',
            timeout: 30000,
            success: function (res) {
                var hash = (res && res.hash) || stream.infoHash;
                var idx = stream.fileIdx || 0;
                var playUrl = base + '/stream?link=' + hash + '&index=' + idx + '&play';
                playDirect(playUrl, stream, movie);
            },
            error: function () {
                // Fallback
                var playUrl = base + '/stream?link=' + encodeURIComponent(link) + '&index=' + (stream.fileIdx || 0) + '&play';
                playDirect(playUrl, stream, movie);
            }
        });
    }

    // ============================================
    // 10. INIT
    // ============================================
    function init() {
        console.log('[MSRC] v5.0 starting...');

        addSettingsMenu();
        registerPlayButton();

        console.log('[MSRC] v5.0 ready!');
        console.log('[MSRC] KKPhim:', Config.kkphim_on() ? 'ON' : 'OFF');
        console.log('[MSRC] Torrentio:', Config.torrentio_on() ? 'ON' : 'OFF');
        console.log('[MSRC] AioStreams:', Config.aio_on() ? 'ON' : 'OFF');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();