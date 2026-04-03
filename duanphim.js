// myplugin.js v4.0 - Simplified & Fixed
(function () {
    'use strict';

    // Chặn load trùng
    if (window.multi_source_v4) return;
    window.multi_source_v4 = true;

    // ============================================
    // 1. STORAGE - FIX HOÀN TOÀN
    // ============================================
    var DB = {
        // Dùng localStorage trực tiếp, không qua Lampa.Storage
        _key: 'msrc_data_v4',

        _load: function () {
            try {
                var raw = localStorage.getItem(this._key);
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                return {};
            }
        },

        _save: function (data) {
            try {
                localStorage.setItem(this._key, JSON.stringify(data));
            } catch (e) {
                console.error('[DB] Save error:', e);
            }
        },

        get: function (key, def) {
            var data = this._load();
            if (data.hasOwnProperty(key)) {
                return data[key];
            }
            return def;
        },

        set: function (key, val) {
            var data = this._load();
            data[key] = val;
            this._save(data);
            
            // Verify ngay
            var check = this._load();
            console.log('[DB] SET', key, '=', val, '| Verify:', check[key]);
        },

        // Getters
        torrserver: function () {
            return this.get('torrserver', 'http://127.0.0.1:8090');
        },
        kkphim: function () {
            return this.get('kkphim', 'https://phimapi.com');
        },
        torrentio: function () {
            return this.get('torrentio', 'https://torrentio.strem.fun');
        },
        torrentio_cfg: function () {
            return this.get('torrentio_cfg', '');
        },
        aio: function () {
            return this.get('aio', 'https://aiostreams.elfhosted.com');
        },
        aio_cfg: function () {
            return this.get('aio_cfg', '');
        },
        
        // Enabled flags - MẶC ĐỊNH LÀ TRUE
        kkphim_on: function () {
            return this.get('kkphim_on', true) === true;
        },
        torrentio_on: function () {
            return this.get('torrentio_on', true) === true;
        },
        aio_on: function () {
            return this.get('aio_on', true) === true;
        },

        // Debug
        debug: function () {
            console.log('[DB] All data:', this._load());
        }
    };

    // ============================================
    // 2. CSS
    // ============================================
    function addCSS() {
        if (document.getElementById('msrc-css-v4')) return;
        
        var style = document.createElement('style');
        style.id = 'msrc-css-v4';
        style.textContent = '\
            .msrc-page { padding: 20px; }\
            .msrc-section { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; margin-bottom: 15px; }\
            .msrc-title { color: #4CAF50; font-size: 16px; font-weight: bold; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }\
            .msrc-row { display: flex; align-items: center; padding: 10px; margin: 5px 0; border-radius: 6px; cursor: pointer; }\
            .msrc-row.focus { background: rgba(255,255,255,0.1); outline: 2px solid #4CAF50; }\
            .msrc-label { width: 120px; color: #aaa; }\
            .msrc-value { flex: 1; color: #fff; word-break: break-all; }\
            .msrc-value.empty { color: #666; font-style: italic; }\
            .msrc-toggle { padding: 3px 10px; border-radius: 4px; font-size: 13px; font-weight: bold; }\
            .msrc-toggle.on { background: #4CAF50; color: white; }\
            .msrc-toggle.off { background: #666; color: #ccc; }\
            .msrc-btn { text-align: center; padding: 12px; border-radius: 6px; margin: 5px 0; cursor: pointer; font-weight: bold; }\
            .msrc-btn.focus { background: rgba(76,175,80,0.2); outline: 2px solid #4CAF50; }\
            .msrc-btn.green { color: #4CAF50; }\
            .msrc-btn.blue { color: #2196F3; }\
            .msrc-play-btn { background: linear-gradient(135deg, #4CAF50, #2196F3) !important; }\
            .msrc-play-btn.focus { transform: scale(1.05); box-shadow: 0 0 15px rgba(76,175,80,0.5); }\
            .msrc-stream { padding: 12px; margin: 5px 0; border-radius: 6px; background: rgba(255,255,255,0.03); cursor: pointer; }\
            .msrc-stream.focus { background: rgba(76,175,80,0.15); outline: 2px solid #4CAF50; }\
            .msrc-stream-title { color: #fff; margin-bottom: 4px; }\
            .msrc-stream-info { color: #888; font-size: 12px; }\
        ';
        document.head.appendChild(style);
    }

    // ============================================
    // 3. SETTINGS PAGE COMPONENT
    // ============================================
    function registerSettingsComponent() {
        Lampa.Component.add('msrc_settings', function () {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var content = document.createElement('div');
            content.className = 'msrc-page';
            
            var items = [];
            var currentIndex = 0;

            this.create = function () {
                this.activity.loader(false);
                buildUI();
            };

            function buildUI() {
                content.innerHTML = '';
                items = [];

                // Header
                content.innerHTML += '<div style="text-align:center;margin-bottom:20px;"><div style="font-size:20px;font-weight:bold;">⚡ Đa Nguồn - Cài đặt</div><div style="color:#888;font-size:12px;margin-top:5px;">KKPhim • Torrentio • AioStreams</div></div>';

                // TorrServer
                addSection('🖥️ TorrServer', [
                    { type: 'input', key: 'torrserver', label: 'URL', ph: 'http://127.0.0.1:8090' }
                ]);
                addButton('🔍 Test TorrServer', 'green', function () {
                    testUrl(DB.torrserver() + '/echo', 'TorrServer');
                });

                // KKPhim
                addSection('🎬 KKPhim', [
                    { type: 'input', key: 'kkphim', label: 'URL API', ph: 'https://phimapi.com' },
                    { type: 'toggle', key: 'kkphim_on', label: 'Bật/Tắt' }
                ]);
                addButton('🔍 Test KKPhim', 'green', function () {
                    testUrl(DB.kkphim() + '/v1/api/tim-kiem?keyword=a&limit=1', 'KKPhim');
                });

                // Torrentio
                addSection('🌊 Torrentio', [
                    { type: 'input', key: 'torrentio', label: 'URL', ph: 'https://torrentio.strem.fun' },
                    { type: 'input', key: 'torrentio_cfg', label: 'Config', ph: 'Để trống nếu không có' },
                    { type: 'toggle', key: 'torrentio_on', label: 'Bật/Tắt' }
                ]);
                addButton('🔍 Test Torrentio', 'green', function () {
                    // Test bằng stream thực tế (The Matrix - tt0133093)
                    var base = DB.torrentio();
                    var cfg = DB.torrentio_cfg();
                    var url = cfg ? base + '/' + cfg + '/stream/movie/tt0133093.json' : base + '/stream/movie/tt0133093.json';
                    testUrl(url, 'Torrentio');
                });

                // AioStreams
                addSection('🔄 AioStreams', [
                    { type: 'input', key: 'aio', label: 'URL', ph: 'https://aiostreams.elfhosted.com' },
                    { type: 'input', key: 'aio_cfg', label: 'Config', ph: 'Paste config từ trang AIO' },
                    { type: 'toggle', key: 'aio_on', label: 'Bật/Tắt' }
                ]);
                addButton('🔍 Test AioStreams', 'green', function () {
                    var base = DB.aio();
                    var cfg = DB.aio_cfg();
                    if (!cfg) {
                        Lampa.Noty.show('⚠️ AioStreams cần Config để test');
                        return;
                    }
                    var url = base + '/' + cfg + '/stream/movie/tt0133093.json';
                    testUrl(url, 'AioStreams');
                });

                // Debug
                addButton('🐛 Xem Settings (Console)', 'blue', function () {
                    DB.debug();
                    Lampa.Noty.show('Mở Console để xem');
                });

                addButton('🗑️ Reset Settings', 'blue', function () {
                    Lampa.Select.show({
                        title: 'Xác nhận reset?',
                        items: [
                            { title: 'Có, reset tất cả', reset: true },
                            { title: 'Không, hủy', reset: false }
                        ],
                        onSelect: function (item) {
                            if (item.reset) {
                                localStorage.removeItem('msrc_data_v4');
                                Lampa.Noty.show('✅ Đã reset');
                                buildUI();
                                focusItem(0);
                            }
                        }
                    });
                });

                scroll.render().appendChild(content);
            }

            function addSection(title, fields) {
                var section = document.createElement('div');
                section.className = 'msrc-section';
                section.innerHTML = '<div class="msrc-title">' + title + '</div>';

                fields.forEach(function (f) {
                    var row = document.createElement('div');
                    row.className = 'msrc-row selector';
                    row.setAttribute('data-key', f.key);
                    row.setAttribute('data-type', f.type);

                    if (f.type === 'toggle') {
                        var isOn = DB.get(f.key, true) === true;
                        row.innerHTML = '<div class="msrc-label">' + f.label + '</div>' +
                            '<div class="msrc-value"><span class="msrc-toggle ' + (isOn ? 'on' : 'off') + '">' + (isOn ? 'BẬT' : 'TẮT') + '</span></div>';

                        row.onclick = function () {
                            toggleSetting(f.key, row);
                        };
                    } else {
                        var val = DB.get(f.key, '');
                        var display = val || f.ph;
                        var cls = val ? 'msrc-value' : 'msrc-value empty';
                        row.innerHTML = '<div class="msrc-label">' + f.label + '</div>' +
                            '<div class="' + cls + '">' + display + '</div>';

                        row.onclick = function () {
                            editSetting(f.key, f.label, f.ph, row);
                        };
                    }

                    section.appendChild(row);
                    items.push(row);
                });

                content.appendChild(section);
            }

            function addButton(text, color, handler) {
                var btn = document.createElement('div');
                btn.className = 'msrc-btn selector ' + color;
                btn.textContent = text;
                btn.onclick = handler;
                content.appendChild(btn);
                items.push(btn);
            }

            function toggleSetting(key, row) {
                var current = DB.get(key, true);
                var next = current === true ? false : true;
                DB.set(key, next);

                var toggle = row.querySelector('.msrc-toggle');
                if (next) {
                    toggle.className = 'msrc-toggle on';
                    toggle.textContent = 'BẬT';
                    Lampa.Noty.show('✅ Đã bật');
                } else {
                    toggle.className = 'msrc-toggle off';
                    toggle.textContent = 'TẮT';
                    Lampa.Noty.show('❌ Đã tắt');
                }
            }

            function editSetting(key, label, ph, row) {
                Lampa.Input.edit({
                    title: label,
                    value: DB.get(key, ''),
                    placeholder: ph || '',
                    free: true,
                    nosave: false
                }, function (newVal) {
                    DB.set(key, newVal);
                    var valDiv = row.querySelector('.msrc-value');
                    valDiv.textContent = newVal || ph;
                    valDiv.className = newVal ? 'msrc-value' : 'msrc-value empty';
                    Lampa.Noty.show('✅ Đã lưu: ' + label);
                });
            }

            function testUrl(url, name) {
                Lampa.Noty.show('🔄 Đang test ' + name + '...');
                console.log('[Test]', name, url);

                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.timeout = 10000;

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            var info = '';
                            if (data.name) info += ' ' + data.name;
                            if (data.streams) info += ' (' + data.streams.length + ' streams)';
                            if (data.data && data.data.items) info += ' (' + data.data.items.length + ' items)';
                            Lampa.Noty.show('✅ ' + name + ' OK!' + info);
                        } catch (e) {
                            Lampa.Noty.show('✅ ' + name + ' phản hồi (non-JSON)');
                        }
                    } else {
                        Lampa.Noty.show('❌ ' + name + ' HTTP ' + xhr.status);
                    }
                };

                xhr.onerror = function () {
                    Lampa.Noty.show('❌ ' + name + ' lỗi kết nối (có thể CORS)');
                };

                xhr.ontimeout = function () {
                    Lampa.Noty.show('❌ ' + name + ' timeout');
                };

                xhr.send();
            }

            function focusItem(i) {
                items.forEach(function (el) { el.classList.remove('focus'); });
                currentIndex = Math.max(0, Math.min(i, items.length - 1));
                if (items[currentIndex]) {
                    items[currentIndex].classList.add('focus');
                    items[currentIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }

            this.start = function () {
                Lampa.Controller.add('msrc_settings_ctrl', {
                    toggle: function () {},
                    back: function () { Lampa.Activity.backward(); },
                    left: function () { Lampa.Activity.backward(); },
                    right: function () {},
                    up: function () { focusItem(currentIndex - 1); },
                    down: function () { focusItem(currentIndex + 1); },
                    enter: function () {
                        if (items[currentIndex] && items[currentIndex].onclick) {
                            items[currentIndex].onclick();
                        }
                    }
                });
                Lampa.Controller.toggle('msrc_settings_ctrl');
                focusItem(0);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });
    }

    // ============================================
    // 4. ONLINE COMPONENT - HIỂN THỊ STREAMS
    // ============================================
    function registerOnlineComponent() {
        Lampa.Component.add('msrc_online', function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var content = document.createElement('div');
            content.className = 'msrc-page';

            var card = object.card || {};
            var items = [];
            var currentIndex = 0;
            var streams = [];

            this.create = function () {
                var movie = normalizeCard(card);

                // Nếu là series và chưa chọn tập
                if (movie.type === 'tv' && !movie.season) {
                    this.activity.loader(false);
                    selectEpisode(card, (function (s, ep) {
                        movie.season = s;
                        movie.episode = ep;
                        this.activity.loader(true);
                        searchAll(movie, this);
                    }).bind(this));
                } else {
                    searchAll(movie, this);
                }
            };

            function searchAll(movie, comp) {
                Lampa.Noty.show('🔍 Đang tìm nguồn...');
                
                var allStreams = [];
                var pending = 0;
                var completed = 0;

                if (DB.kkphim_on()) {
                    pending++;
                    searchKKPhim(movie, function (list) {
                        allStreams = allStreams.concat(list);
                        completed++;
                        if (completed >= pending) showStreams(allStreams, movie, comp);
                    });
                }

                if (DB.torrentio_on()) {
                    pending++;
                    searchTorrentio(movie, function (list) {
                        allStreams = allStreams.concat(list);
                        completed++;
                        if (completed >= pending) showStreams(allStreams, movie, comp);
                    });
                }

                if (DB.aio_on()) {
                    pending++;
                    searchAio(movie, function (list) {
                        allStreams = allStreams.concat(list);
                        completed++;
                        if (completed >= pending) showStreams(allStreams, movie, comp);
                    });
                }

                if (pending === 0) {
                    comp.activity.loader(false);
                    content.innerHTML = '<div style="text-align:center;padding:50px;color:#888;">⚠️ Chưa bật nguồn nào!<br><br>Vào menu Đa Nguồn bên trái để cài đặt.</div>';
                    scroll.render().appendChild(content);
                    return;
                }

                // Timeout
                setTimeout(function () {
                    if (completed < pending) {
                        completed = pending;
                        showStreams(allStreams, movie, comp);
                    }
                }, 20000);
            }

            function showStreams(list, movie, comp) {
                comp.activity.loader(false);
                streams = list;
                content.innerHTML = '';
                items = [];

                if (!list.length) {
                    content.innerHTML = '<div style="text-align:center;padding:50px;color:#888;">😕 Không tìm thấy nguồn nào</div>';
                    scroll.render().appendChild(content);
                    comp.start();
                    return;
                }

                content.innerHTML += '<div style="text-align:center;padding:10px;color:#4CAF50;font-weight:bold;">⚡ Tìm thấy ' + list.length + ' nguồn</div>';

                list.forEach(function (s, i) {
                    var info = [];
                    if (s.quality) info.push(s.quality);
                    if (s.size) info.push(s.size);
                    if (s.seeders) info.push('🌱' + s.seeders);
                    if (s.type === 'torrent') info.push('📦Torrent');
                    else if (s.type === 'hls') info.push('📡HLS');

                    var div = document.createElement('div');
                    div.className = 'msrc-stream selector';
                    div.setAttribute('data-idx', i);
                    div.innerHTML = '<div class="msrc-stream-title">' + s.title + '</div>' +
                        '<div class="msrc-stream-info">' + info.join(' • ') + '</div>';

                    div.onclick = function () {
                        playStream(streams[i], movie);
                    };

                    content.appendChild(div);
                    items.push(div);
                });

                scroll.render().appendChild(content);
                comp.start();
            }

            function focusItem(i) {
                items.forEach(function (el) { el.classList.remove('focus'); });
                currentIndex = Math.max(0, Math.min(i, items.length - 1));
                if (items[currentIndex]) {
                    items[currentIndex].classList.add('focus');
                    items[currentIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }

            this.start = function () {
                Lampa.Controller.add('msrc_online_ctrl', {
                    toggle: function () {},
                    back: function () { Lampa.Activity.backward(); },
                    left: function () { Lampa.Activity.backward(); },
                    right: function () {},
                    up: function () { focusItem(currentIndex - 1); },
                    down: function () { focusItem(currentIndex + 1); },
                    enter: function () {
                        if (items[currentIndex] && items[currentIndex].onclick) {
                            items[currentIndex].onclick();
                        }
                    }
                });
                Lampa.Controller.toggle('msrc_online_ctrl');
                if (items.length) focusItem(0);
            };

            this.pause = function () {};
            this.stop = function () {};
            this.render = function () { return scroll.render(); };
            this.destroy = function () { scroll.destroy(); };
        });
    }

    // ============================================
    // 5. SEARCH FUNCTIONS
    // ============================================
    function searchKKPhim(movie, callback) {
        var url = DB.kkphim() + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(movie.title) + '&limit=10';
        
        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var list = [];
                var items = (data && data.data && data.data.items) || [];
                items.forEach(function (it) {
                    list.push({
                        source: 'KKPhim',
                        title: '🎬 ' + it.name + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                        quality: it.quality || 'HD',
                        slug: it.slug,
                        type: 'kkphim'
                    });
                });
                callback(list);
            })
            .catch(function () { callback([]); });
    }

    function searchTorrentio(movie, callback) {
        getImdbId(movie, function (imdbId) {
            if (!imdbId) return callback([]);

            var base = DB.torrentio();
            var cfg = DB.torrentio_cfg();
            var root = cfg ? base + '/' + cfg : base;
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var url;

            if (type === 'series' && movie.season && movie.episode) {
                url = root + '/stream/' + type + '/' + imdbId + ':' + movie.season + ':' + movie.episode + '.json';
            } else {
                url = root + '/stream/' + type + '/' + imdbId + '.json';
            }

            fetch(url)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    callback(parseStremioStreams(data, 'Torrentio', '🌊'));
                })
                .catch(function () { callback([]); });
        });
    }

    function searchAio(movie, callback) {
        var cfg = DB.aio_cfg();
        if (!cfg) return callback([]);

        getImdbId(movie, function (imdbId) {
            if (!imdbId) return callback([]);

            var base = DB.aio();
            var root = base + '/' + cfg;
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var url;

            if (type === 'series' && movie.season && movie.episode) {
                url = root + '/stream/' + type + '/' + imdbId + ':' + movie.season + ':' + movie.episode + '.json';
            } else {
                url = root + '/stream/' + type + '/' + imdbId + '.json';
            }

            fetch(url)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    callback(parseStremioStreams(data, 'AioStreams', '🔄'));
                })
                .catch(function () { callback([]); });
        });
    }

    function parseStremioStreams(data, source, icon) {
        var list = [];
        if (!data || !data.streams) return list;

        data.streams.forEach(function (s) {
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
            }

            list.push(item);
        });

        return list.sort(function (a, b) { return (b.seeders || 0) - (a.seeders || 0); });
    }

    function extractQuality(t) {
        if (/2160p|4k|uhd/i.test(t)) return '4K';
        if (/1080p/i.test(t)) return '1080p';
        if (/720p/i.test(t)) return '720p';
        return 'HD';
    }

    function extractSize(t) {
        var m = t.match(/([\d.]+)\s*(GB|MB)/i);
        return m ? m[1] + m[2].toUpperCase() : '';
    }

    function getImdbId(movie, callback) {
        if (movie.imdb_id) return callback(movie.imdb_id);

        var type = movie.type === 'tv' ? 'tv' : 'movie';
        var url = Lampa.TMDB.api(type + '/' + movie.id + '/external_ids');

        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                callback(data && data.imdb_id ? data.imdb_id : null);
            })
            .catch(function () { callback(null); });
    }

    function normalizeCard(card) {
        return {
            id: card.id,
            title: card.title || card.name || '',
            name: card.name || card.title || '',
            type: (card.number_of_seasons || card.first_air_date) ? 'tv' : 'movie',
            imdb_id: card.imdb_id || (card.external_ids && card.external_ids.imdb_id) || '',
            poster: card.poster || card.img || '',
            season: card.season || null,
            episode: card.episode || null
        };
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
                    title: 'Phần ' + s.season,
                    items: eps,
                    onSelect: function (ep) { callback(s.season, ep.episode); },
                    onBack: function () { Lampa.Controller.toggle('content'); }
                });
            },
            onBack: function () { Lampa.Controller.toggle('content'); }
        });
    }

    // ============================================
    // 6. PLAY FUNCTIONS
    // ============================================
    function playStream(stream, movie) {
        console.log('[Play]', stream);

        if (stream.type === 'torrent') {
            playViaTorrserver(stream, movie);
        } else if (stream.type === 'hls' || stream.type === 'direct') {
            playDirect(stream.url, stream, movie);
        } else if (stream.type === 'kkphim' && stream.slug) {
            Lampa.Noty.show('🔄 Lấy link KKPhim...');
            getKKPhimStreams(stream.slug, function (list) {
                if (list.length === 1) {
                    playDirect(list[0].url, list[0], movie);
                } else if (list.length > 1) {
                    Lampa.Select.show({
                        title: '🎬 Chọn server',
                        items: list.map(function (s, i) {
                            return { title: s.title, stream: s };
                        }),
                        onSelect: function (item) {
                            playDirect(item.stream.url, item.stream, movie);
                        },
                        onBack: function () { Lampa.Controller.toggle('content'); }
                    });
                } else {
                    Lampa.Noty.show('😕 Không có link');
                }
            });
        } else {
            Lampa.Noty.show('⚠️ Không hỗ trợ');
        }
    }

    function getKKPhimStreams(slug, callback) {
        fetch(DB.kkphim() + '/phim/' + slug)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var list = [];
                var episodes = (data && data.episodes) || [];
                episodes.forEach(function (srv) {
                    (srv.server_data || []).forEach(function (ep) {
                        if (ep.link_m3u8) {
                            list.push({
                                title: (srv.server_name || 'Server') + ' - ' + (ep.name || ep.slug),
                                url: ep.link_m3u8,
                                type: 'hls'
                            });
                        }
                    });
                });
                callback(list);
            })
            .catch(function () { callback([]); });
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

    function playViaTorrserver(stream, movie) {
        var base = DB.torrserver();
        if (!base) {
            Lampa.Noty.show('⚠️ Chưa cấu hình TorrServer');
            return;
        }

        Lampa.Noty.show('🔄 Gửi tới TorrServer...');

        var link = stream.magnet || ('magnet:?xt=urn:btih:' + stream.infoHash);

        fetch(base + '/torrents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add',
                link: link,
                title: movie.title || '',
                poster: movie.poster || '',
                save_to_db: true
            })
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var hash = (data && data.hash) || stream.infoHash;
            var url = base + '/stream?link=' + hash + '&index=' + (stream.fileIdx || 0) + '&play';
            playDirect(url, stream, movie);
        })
        .catch(function () {
            // Fallback
            var url = base + '/stream?link=' + encodeURIComponent(link) + '&index=' + (stream.fileIdx || 0) + '&play';
            playDirect(url, stream, movie);
        });
    }

    // ============================================
    // 7. ADD MENU & BUTTONS
    // ============================================
    function addMenuButton() {
        var icon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/><circle cx="19" cy="7" r="2" fill="#4CAF50"/></svg>';

        var item = document.createElement('li');
        item.className = 'menu__item selector';
        item.innerHTML = '<div class="menu__ico">' + icon + '</div><div class="menu__text">Đa Nguồn</div>';

        item.addEventListener('click', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Đa Nguồn',
                component: 'msrc_settings',
                page: 1
            });
        });

        // Cho Lampa controller
        $(item).on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Đa Nguồn',
                component: 'msrc_settings',
                page: 1
            });
        });

        var menuList = document.querySelector('.menu .menu__list');
        if (menuList) menuList.appendChild(item);
    }

    function addPlayButtons() {
        // Thêm nút vào trang chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type === 'complite') {
                setTimeout(function () {
                    try {
                        var render = e.object && e.object.activity ? e.object.activity.render() : null;
                        if (!render) return;

                        var btns = render.find('.full-start-new__buttons, .full-start__buttons').eq(0);
                        if (!btns.length) return;
                        if (btns.find('.msrc-play-btn').length) return;

                        var card = e.data || (e.object && e.object.data) || {};

                        var btn = $('<div class="full-start__button selector msrc-play-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px"><path d="M8 5v14l11-7z"/></svg><span>Đa Nguồn</span></div>');

                        btn.on('hover:enter', function () {
                            Lampa.Activity.push({
                                url: '',
                                title: 'Đa Nguồn',
                                component: 'msrc_online',
                                page: 1,
                                card: card
                            });
                        });

                        btns.append(btn);
                    } catch (ex) {
                        console.log('[MultiSource] Button error:', ex);
                    }
                }, 500);
            }
        });
    }

    // ============================================
    // 8. INIT
    // ============================================
    function init() {
        console.log('[MultiSource] v4.0 starting...');

        addCSS();
        registerSettingsComponent();
        registerOnlineComponent();
        addMenuButton();
        addPlayButtons();

        console.log('[MultiSource] v4.0 ready!');
        
        // Debug initial state
        DB.debug();
    }

    // Start
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();