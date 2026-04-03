// myplugin.js
// Plugin Lampa: KKPhim + Torrentio + AioStreams
// Tác giả: Custom Plugin
// Phiên bản: 1.0.0

(function () {
    'use strict';

    // ============================================
    // 1. PHẦN CÀI ĐẶT (Settings Storage)
    // ============================================
    var PluginSettings = {
        prefix: 'my_multi_source_',

        get: function (key, defaultVal) {
            var val = Lampa.Storage.get(this.prefix + key, '');
            return val || defaultVal || '';
        },

        set: function (key, value) {
            Lampa.Storage.set(this.prefix + key, value);
        },

        // Torrserver
        getTorrserverUrl: function () {
            return this.get('torrserver_url', 'http://127.0.0.1:8090');
        },

        // Torrentio
        getTorrentioUrl: function () {
            return this.get('torrentio_url', 'https://torrentio.strem.fun');
        },
        getTorrentioConfig: function () {
            return this.get('torrentio_config', '');
        },

        // AioStreams
        getAiostreamsUrl: function () {
            return this.get('aiostreams_url', 'https://aiostreams.elfhosted.com');
        },
        getAiostreamsConfig: function () {
            return this.get('aiostreams_config', '');
        },

        // KKPhim
        getKkphimUrl: function () {
            return this.get('kkphim_url', 'https://phimapi.com');
        },

        // Nguồn ưu tiên
        getSourcePriority: function () {
            return this.get('source_priority', 'kkphim,torrentio,aiostreams');
        },

        // Bật/tắt nguồn
        isSourceEnabled: function (source) {
            return this.get('source_' + source + '_enabled', 'true') === 'true';
        }
    };


    // ============================================
    // 2. MENU CÀI ĐẶT BÊN TRÁI LAMPA
    // ============================================
    function addMenuButton() {
        var MENU_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/><circle cx="20" cy="7" r="3" fill="#4CAF50"/></svg>';

        // Thêm nút vào menu trái
        var menuItem = $('<li class="menu__item selector" data-action="multi_source_settings">' +
            '<div class="menu__ico">' + MENU_ICON + '</div>' +
            '<div class="menu__text">Đa Nguồn</div>' +
            '</li>');

        menuItem.on('hover:enter', function () {
            openSettingsPage();
        });

        // Chèn vào menu
        if ($('.menu .menu__list').length) {
            $('.menu .menu__list').eq(0).append(menuItem);
        }
    }


    // ============================================
    // 3. TRANG CÀI ĐẶT CHI TIẾT
    // ============================================
    function openSettingsPage() {
        var controller = Lampa.Controller.enabled().name;

        var settingsContent = $('<div class="settings-multi-source"></div>');

        // CSS cho trang cài đặt
        var style = $('<style>' +
            '.settings-multi-source { padding: 20px; max-width: 600px; margin: 0 auto; }' +
            '.sms-section { margin-bottom: 25px; background: rgba(255,255,255,0.05); border-radius: 10px; padding: 15px; }' +
            '.sms-section-title { font-size: 1.2em; color: #4CAF50; margin-bottom: 12px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }' +
            '.sms-row { display: flex; align-items: center; margin-bottom: 10px; padding: 8px; border-radius: 6px; }' +
            '.sms-row.selector:focus, .sms-row.selector.focused { background: rgba(255,255,255,0.1); outline: 2px solid #4CAF50; }' +
            '.sms-label { flex: 0 0 140px; color: #aaa; font-size: 0.9em; }' +
            '.sms-value { flex: 1; color: #fff; word-break: break-all; }' +
            '.sms-value.empty { color: #666; font-style: italic; }' +
            '.sms-toggle { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 0.85em; }' +
            '.sms-toggle.on { background: #4CAF50; color: #fff; }' +
            '.sms-toggle.off { background: #666; color: #ccc; }' +
            '.sms-header { text-align: center; margin-bottom: 20px; }' +
            '.sms-header h1 { font-size: 1.5em; color: #fff; }' +
            '.sms-header p { color: #888; font-size: 0.85em; }' +
            '.sms-status { margin-top: 15px; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.03); }' +
            '.sms-status-item { display: flex; justify-content: space-between; padding: 4px 0; }' +
            '.sms-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }' +
            '.sms-status-dot.active { background: #4CAF50; }' +
            '.sms-status-dot.inactive { background: #f44336; }' +
            '</style>');

        settingsContent.append(style);

        // Header
        settingsContent.append(
            '<div class="sms-header">' +
            '<h1>⚡ Cài Đặt Đa Nguồn</h1>' +
            '<p>KKPhim • Torrentio • AioStreams</p>' +
            '</div>'
        );

        // --- Section: TorrServer ---
        var torrserverSection = createSection('🖥️ TorrServer', [
            {
                key: 'torrserver_url',
                label: 'URL TorrServer',
                type: 'input',
                placeholder: 'http://127.0.0.1:8090',
                description: 'Địa chỉ TorrServer để phát torrent'
            }
        ]);
        settingsContent.append(torrserverSection);

        // --- Section: KKPhim ---
        var kkphimSection = createSection('🎬 KKPhim', [
            {
                key: 'kkphim_url',
                label: 'URL API',
                type: 'input',
                placeholder: 'https://phimapi.com',
                description: 'API endpoint của KKPhim'
            },
            {
                key: 'source_kkphim_enabled',
                label: 'Kích hoạt',
                type: 'toggle',
                defaultVal: 'true'
            }
        ]);
        settingsContent.append(kkphimSection);

        // --- Section: Torrentio ---
        var torrentioSection = createSection('🌊 Torrentio', [
            {
                key: 'torrentio_url',
                label: 'URL Torrentio',
                type: 'input',
                placeholder: 'https://torrentio.strem.fun',
                description: 'URL addon Torrentio Stremio'
            },
            {
                key: 'torrentio_config',
                label: 'Config',
                type: 'input',
                placeholder: 'sort=qualitysize|qualityfilter=...',
                description: 'Cấu hình bộ lọc Torrentio'
            },
            {
                key: 'source_torrentio_enabled',
                label: 'Kích hoạt',
                type: 'toggle',
                defaultVal: 'true'
            }
        ]);
        settingsContent.append(torrentioSection);

        // --- Section: AioStreams ---
        var aioSection = createSection('🔄 AioStreams', [
            {
                key: 'aiostreams_url',
                label: 'URL AioStreams',
                type: 'input',
                placeholder: 'https://aiostreams.elfhosted.com',
                description: 'URL addon AioStreams'
            },
            {
                key: 'aiostreams_config',
                label: 'Config',
                type: 'input',
                placeholder: 'Config string từ AioStreams',
                description: 'Config đã encode từ trang cài đặt AioStreams'
            },
            {
                key: 'source_aiostreams_enabled',
                label: 'Kích hoạt',
                type: 'toggle',
                defaultVal: 'true'
            }
        ]);
        settingsContent.append(aioSection);

        // --- Section: Ưu tiên nguồn ---
        var prioritySection = createSection('⚙️ Cài đặt chung', [
            {
                key: 'source_priority',
                label: 'Thứ tự ưu tiên',
                type: 'input',
                placeholder: 'kkphim,torrentio,aiostreams',
                description: 'Thứ tự nguồn, cách nhau bằng dấu phẩy'
            }
        ]);
        settingsContent.append(prioritySection);

        // --- Trạng thái ---
        var statusHtml = '<div class="sms-status">';
        statusHtml += '<div style="color:#aaa; margin-bottom:8px; font-weight:bold;">📊 Trạng thái:</div>';

        var sources = [
            { name: 'KKPhim', key: 'kkphim', url: PluginSettings.getKkphimUrl() },
            { name: 'Torrentio', key: 'torrentio', url: PluginSettings.getTorrentioUrl() },
            { name: 'AioStreams', key: 'aiostreams', url: PluginSettings.getAiostreamsUrl() },
            { name: 'TorrServer', key: 'torrserver', url: PluginSettings.getTorrserverUrl() }
        ];

        sources.forEach(function (s) {
            var enabled = s.key === 'torrserver' ? (s.url ? true : false) : PluginSettings.isSourceEnabled(s.key);
            var dotClass = enabled ? 'active' : 'inactive';
            var statusText = enabled ? 'Bật' : 'Tắt';
            statusHtml += '<div class="sms-status-item">' +
                '<span><span class="sms-status-dot ' + dotClass + '"></span>' + s.name + '</span>' +
                '<span style="color:#888; font-size:0.8em;">' + statusText + ' | ' + (s.url || 'Chưa cấu hình') + '</span>' +
                '</div>';
        });

        statusHtml += '</div>';
        settingsContent.append(statusHtml);

        // Nút test kết nối
        var testBtn = $('<div class="sms-row selector" tabindex="0" style="justify-content:center; margin-top:15px; cursor:pointer;">' +
            '<span style="color:#4CAF50; font-weight:bold;">🔍 Test Kết Nối TorrServer</span>' +
            '</div>');
        testBtn.on('hover:enter', function () {
            testTorrserverConnection();
        });
        settingsContent.append(testBtn);

        // Hiển thị Activity
        Lampa.Activity.push({
            url: '',
            title: 'Đa Nguồn - Cài đặt',
            component: 'settings_multi_source',
            page: 1
        });

        // Render
        setTimeout(function () {
            var render = Lampa.Activity.active().activity.render();
            render.empty().append(settingsContent);

            // Controller
            Lampa.Controller.add('settings_ms', {
                toggle: function () { },
                back: function () {
                    Lampa.Activity.backward();
                    Lampa.Controller.toggle(controller);
                },
                up: function () {
                    Navigator.move('up');
                },
                down: function () {
                    Navigator.move('down');
                },
                right: function () { },
                left: function () {
                    Lampa.Activity.backward();
                    Lampa.Controller.toggle(controller);
                },
                enter: function () { }
            });

            Lampa.Controller.toggle('settings_ms');

            // Focus
            var selectors = settingsContent.find('.selector');
            if (selectors.length) {
                Navigator.start(settingsContent[0]);
            }
        }, 100);
    }

    // Hàm tạo section
    function createSection(title, fields) {
        var section = $('<div class="sms-section"></div>');
        section.append('<div class="sms-section-title">' + title + '</div>');

        fields.forEach(function (field) {
            var currentValue = PluginSettings.get(field.key, field.defaultVal || '');
            var row;

            if (field.type === 'input') {
                var displayValue = currentValue || field.placeholder;
                var valueClass = currentValue ? 'sms-value' : 'sms-value empty';

                row = $('<div class="sms-row selector" tabindex="0" data-key="' + field.key + '" data-type="input">' +
                    '<div class="sms-label">' + field.label + '</div>' +
                    '<div class="' + valueClass + '">' + displayValue + '</div>' +
                    '</div>');

                row.on('hover:enter', function () {
                    editField(field, $(this));
                });

            } else if (field.type === 'toggle') {
                var isOn = currentValue === 'true' || currentValue === '';
                var toggleClass = isOn ? 'sms-toggle on' : 'sms-toggle off';
                var toggleText = isOn ? 'BẬT' : 'TẮT';

                row = $('<div class="sms-row selector" tabindex="0" data-key="' + field.key + '" data-type="toggle">' +
                    '<div class="sms-label">' + field.label + '</div>' +
                    '<div class="sms-value"><span class="' + toggleClass + '">' + toggleText + '</span></div>' +
                    '</div>');

                row.on('hover:enter', function () {
                    toggleField(field, $(this));
                });
            }

            if (field.description) {
                row.attr('title', field.description);
            }

            section.append(row);
        });

        return section;
    }

    // Chỉnh sửa field input
    function editField(field, rowElement) {
        var currentValue = PluginSettings.get(field.key, '');

        Lampa.Input.edit({
            title: field.label,
            value: currentValue,
            placeholder: field.placeholder || '',
            free: true,
            nosave: false
        }, function (newValue) {
            PluginSettings.set(field.key, newValue);

            var display = newValue || field.placeholder;
            var cls = newValue ? 'sms-value' : 'sms-value empty';
            rowElement.find('.sms-value').attr('class', cls).text(display);

            Lampa.Noty.show('✅ Đã lưu: ' + field.label);
        });
    }

    // Toggle field
    function toggleField(field, rowElement) {
        var currentValue = PluginSettings.get(field.key, field.defaultVal || 'true');
        var newValue = currentValue === 'true' ? 'false' : 'true';

        PluginSettings.set(field.key, newValue);

        var isOn = newValue === 'true';
        var toggleClass = isOn ? 'sms-toggle on' : 'sms-toggle off';
        var toggleText = isOn ? 'BẬT' : 'TẮT';

        rowElement.find('.sms-toggle').attr('class', toggleClass).text(toggleText);

        Lampa.Noty.show((isOn ? '✅ Đã bật' : '❌ Đã tắt') + ': ' + field.label);
    }

    // Test kết nối TorrServer
    function testTorrserverConnection() {
        var url = PluginSettings.getTorrserverUrl();
        if (!url) {
            Lampa.Noty.show('⚠️ Chưa cấu hình URL TorrServer');
            return;
        }

        Lampa.Noty.show('🔄 Đang kiểm tra TorrServer...');

        $.ajax({
            url: url + '/echo',
            timeout: 5000,
            success: function () {
                Lampa.Noty.show('✅ TorrServer hoạt động bình thường!');
            },
            error: function () {
                Lampa.Noty.show('❌ Không kết nối được TorrServer: ' + url);
            }
        });
    }


    // ============================================
    // 4. NGUỒN KKPHIM
    // ============================================
    var KKPhimSource = {
        name: 'KKPhim',

        search: function (movie, callback) {
            if (!PluginSettings.isSourceEnabled('kkphim')) {
                return callback([]);
            }

            var baseUrl = PluginSettings.getKkphimUrl();
            var query = movie.title || movie.name || '';

            if (!query) return callback([]);

            var searchUrl = baseUrl + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=10';

            $.ajax({
                url: searchUrl,
                timeout: 10000,
                success: function (response) {
                    var results = [];

                    if (response && response.data && response.data.items) {
                        response.data.items.forEach(function (item) {
                            results.push({
                                source: 'KKPhim',
                                title: item.name + (item.origin_name ? ' (' + item.origin_name + ')' : ''),
                                quality: item.quality || 'HD',
                                slug: item.slug,
                                year: item.year,
                                type: item.type,
                                thumb: item.thumb_url || item.poster_url
                            });
                        });
                    }

                    callback(results);
                },
                error: function () {
                    console.log('[KKPhim] Search error');
                    callback([]);
                }
            });
        },

        getStreams: function (slug, callback) {
            var baseUrl = PluginSettings.getKkphimUrl();
            var detailUrl = baseUrl + '/phim/' + slug;

            $.ajax({
                url: detailUrl,
                timeout: 10000,
                success: function (response) {
                    var streams = [];

                    if (response && response.episodes) {
                        response.episodes.forEach(function (server) {
                            if (server.server_data) {
                                server.server_data.forEach(function (ep) {
                                    if (ep.link_m3u8) {
                                        streams.push({
                                            source: 'KKPhim',
                                            title: (server.server_name || 'Server') + ' - ' + (ep.name || ep.slug),
                                            url: ep.link_m3u8,
                                            quality: 'HD',
                                            type: 'hls'
                                        });
                                    }
                                    if (ep.link_embed) {
                                        streams.push({
                                            source: 'KKPhim',
                                            title: (server.server_name || 'Server') + ' - ' + (ep.name || ep.slug) + ' (Embed)',
                                            url: ep.link_embed,
                                            quality: 'HD',
                                            type: 'embed'
                                        });
                                    }
                                });
                            }
                        });
                    }

                    callback(streams);
                },
                error: function () {
                    callback([]);
                }
            });
        }
    };


    // ============================================
    // 5. NGUỒN TORRENTIO (Stremio Addon Protocol)
    // ============================================
    var TorrentioSource = {
        name: 'Torrentio',

        getStreamUrl: function (config) {
            var base = PluginSettings.getTorrentioUrl();
            var cfg = config || PluginSettings.getTorrentioConfig();

            if (cfg) {
                return base + '/' + cfg + '/stream';
            }
            return base + '/stream';
        },

        search: function (movie, callback) {
            if (!PluginSettings.isSourceEnabled('torrentio')) {
                return callback([]);
            }

            var imdbId = movie.imdb_id || '';
            if (!imdbId) {
                // Thử tìm IMDB ID từ TMDB
                this.getImdbFromTmdb(movie, function (id) {
                    if (id) {
                        movie.imdb_id = id;
                        TorrentioSource._fetchStreams(movie, callback);
                    } else {
                        callback([]);
                    }
                });
                return;
            }

            this._fetchStreams(movie, callback);
        },

        _fetchStreams: function (movie, callback) {
            var imdbId = movie.imdb_id;
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var streamUrl = this.getStreamUrl();

            var path;
            if (type === 'series' && movie.season && movie.episode) {
                path = streamUrl + '/' + type + '/' + imdbId + ':' + movie.season + ':' + movie.episode + '.json';
            } else {
                path = streamUrl + '/' + type + '/' + imdbId + '.json';
            }

            $.ajax({
                url: path,
                timeout: 15000,
                success: function (response) {
                    var results = [];

                    if (response && response.streams) {
                        response.streams.forEach(function (stream) {
                            var title = stream.title || stream.name || 'Unknown';
                            var streamData = {
                                source: 'Torrentio',
                                title: '🌊 ' + title,
                                quality: TorrentioSource._extractQuality(title),
                                size: TorrentioSource._extractSize(title),
                                seeders: stream.seeders || 0
                            };

                            // Xác định loại stream
                            if (stream.infoHash) {
                                // Torrent - sẽ phát qua TorrServer
                                streamData.type = 'torrent';
                                streamData.infoHash = stream.infoHash;
                                streamData.fileIdx = stream.fileIdx;
                                streamData.magnetLink = 'magnet:?xt=urn:btih:' + stream.infoHash;
                                if (stream.sources) {
                                    stream.sources.forEach(function (s) {
                                        if (s.indexOf('tracker') >= 0) {
                                            streamData.magnetLink += '&tr=' + encodeURIComponent(s);
                                        }
                                    });
                                }
                            } else if (stream.url) {
                                // Direct link
                                streamData.type = 'direct';
                                streamData.url = stream.url;
                            } else if (stream.externalUrl) {
                                streamData.type = 'external';
                                streamData.url = stream.externalUrl;
                            }

                            results.push(streamData);
                        });
                    }

                    // Sắp xếp theo seeders
                    results.sort(function (a, b) {
                        return (b.seeders || 0) - (a.seeders || 0);
                    });

                    callback(results);
                },
                error: function (xhr, status, error) {
                    console.log('[Torrentio] Error:', error);
                    callback([]);
                }
            });
        },

        getImdbFromTmdb: function (movie, callback) {
            var tmdbId = movie.id;
            var type = movie.type === 'tv' ? 'tv' : 'movie';

            if (!tmdbId) return callback(null);

            var tmdbUrl = 'https://api.themoviedb.org/3/' + type + '/' + tmdbId + '/external_ids?api_key=' + Lampa.TMDB.key();

            $.ajax({
                url: tmdbUrl,
                timeout: 8000,
                success: function (resp) {
                    callback(resp.imdb_id || null);
                },
                error: function () {
                    callback(null);
                }
            });
        },

        _extractQuality: function (title) {
            if (/2160p|4k|uhd/i.test(title)) return '4K';
            if (/1080p/i.test(title)) return '1080p';
            if (/720p/i.test(title)) return '720p';
            if (/480p/i.test(title)) return '480p';
            return 'HD';
        },

        _extractSize: function (title) {
            var match = title.match(/([\d.]+)\s*(GB|MB|TB)/i);
            if (match) return match[1] + ' ' + match[2].toUpperCase();
            return '';
        }
    };


    // ============================================
    // 6. NGUỒN AIOSTREAMS (Stremio Addon Protocol)
    // ============================================
    var AioStreamsSource = {
        name: 'AioStreams',

        getStreamUrl: function () {
            var base = PluginSettings.getAiostreamsUrl();
            var config = PluginSettings.getAiostreamsConfig();

            if (config) {
                return base + '/' + config + '/stream';
            }
            return base + '/stream';
        },

        search: function (movie, callback) {
            if (!PluginSettings.isSourceEnabled('aiostreams')) {
                return callback([]);
            }

            var imdbId = movie.imdb_id || '';
            if (!imdbId) {
                TorrentioSource.getImdbFromTmdb(movie, function (id) {
                    if (id) {
                        movie.imdb_id = id;
                        AioStreamsSource._fetchStreams(movie, callback);
                    } else {
                        callback([]);
                    }
                });
                return;
            }

            this._fetchStreams(movie, callback);
        },

        _fetchStreams: function (movie, callback) {
            var imdbId = movie.imdb_id;
            var type = movie.type === 'tv' ? 'series' : 'movie';
            var streamUrl = this.getStreamUrl();

            var path;
            if (type === 'series' && movie.season && movie.episode) {
                path = streamUrl + '/' + type + '/' + imdbId + ':' + movie.season + ':' + movie.episode + '.json';
            } else {
                path = streamUrl + '/' + type + '/' + imdbId + '.json';
            }

            $.ajax({
                url: path,
                timeout: 20000,
                success: function (response) {
                    var results = [];

                    if (response && response.streams) {
                        response.streams.forEach(function (stream) {
                            var title = stream.title || stream.name || 'AioStreams';
                            var streamData = {
                                source: 'AioStreams',
                                title: '🔄 ' + title,
                                quality: TorrentioSource._extractQuality(title),
                                size: TorrentioSource._extractSize(title),
                                behaviorHints: stream.behaviorHints || {}
                            };

                            if (stream.infoHash) {
                                streamData.type = 'torrent';
                                streamData.infoHash = stream.infoHash;
                                streamData.fileIdx = stream.fileIdx;
                                streamData.magnetLink = 'magnet:?xt=urn:btih:' + stream.infoHash;
                                if (stream.sources) {
                                    stream.sources.forEach(function (s) {
                                        if (s.indexOf('tracker') >= 0) {
                                            streamData.magnetLink += '&tr=' + encodeURIComponent(s);
                                        }
                                    });
                                }
                            } else if (stream.url) {
                                streamData.type = 'direct';
                                streamData.url = stream.url;
                            } else if (stream.externalUrl) {
                                streamData.type = 'external';
                                streamData.url = stream.externalUrl;
                            }

                            results.push(streamData);
                        });
                    }

                    callback(results);
                },
                error: function () {
                    console.log('[AioStreams] Error');
                    callback([]);
                }
            });
        }
    };


    // ============================================
    // 7. TORRSERVER INTEGRATION
    // ============================================
    var TorrServerPlayer = {
        // Thêm torrent vào TorrServer và lấy link phát
        play: function (streamData, movieInfo) {
            var torrserverUrl = PluginSettings.getTorrserverUrl();

            if (!torrserverUrl) {
                Lampa.Noty.show('⚠️ Chưa cấu hình TorrServer URL');
                return;
            }

            Lampa.Noty.show('🔄 Đang kết nối TorrServer...');

            if (streamData.magnetLink) {
                this._addAndPlay(torrserverUrl, streamData, movieInfo);
            } else if (streamData.infoHash) {
                streamData.magnetLink = 'magnet:?xt=urn:btih:' + streamData.infoHash;
                this._addAndPlay(torrserverUrl, streamData, movieInfo);
            }
        },

        _addAndPlay: function (torrserverUrl, streamData, movieInfo) {
            var self = this;
            var addUrl = torrserverUrl + '/torrents';

            var requestData = {
                action: 'add',
                link: streamData.magnetLink,
                title: movieInfo.title || movieInfo.name || 'Unknown',
                poster: movieInfo.poster || movieInfo.img || '',
                save_to_db: true
            };

            $.ajax({
                url: addUrl,
                method: 'POST',
                data: JSON.stringify(requestData),
                contentType: 'application/json',
                timeout: 30000,
                success: function (response) {
                    var hash = response.hash || streamData.infoHash;
                    var fileIdx = streamData.fileIdx || 0;

                    // Tạo link stream từ TorrServer
                    var playUrl = torrserverUrl + '/stream?link=' + hash + '&index=' + fileIdx + '&play';

                    // Thêm preload
                    self._preload(torrserverUrl, hash, fileIdx, function () {
                        self._startPlayback(playUrl, streamData, movieInfo);
                    });
                },
                error: function (xhr, status, error) {
                    console.log('[TorrServer] Add error:', error);

                    // Thử phương thức cũ
                    var playUrl = torrserverUrl + '/stream?link=' + encodeURIComponent(streamData.magnetLink) + '&index=' + (streamData.fileIdx || 0) + '&play';
                    self._startPlayback(playUrl, streamData, movieInfo);
                }
            });
        },

        _preload: function (torrserverUrl, hash, fileIdx, callback) {
            $.ajax({
                url: torrserverUrl + '/torrents',
                method: 'POST',
                data: JSON.stringify({
                    action: 'get',
                    hash: hash
                }),
                contentType: 'application/json',
                timeout: 10000,
                complete: function () {
                    callback();
                }
            });
        },

        _startPlayback: function (playUrl, streamData, movieInfo) {
            Lampa.Noty.show('▶️ Đang phát qua TorrServer...');

            // Phát video
            var playerData = {
                title: movieInfo.title || movieInfo.name || '',
                url: playUrl,
                quality: {}
            };

            playerData.quality[streamData.quality || 'HD'] = playUrl;

            // Sử dụng Lampa Player
            Lampa.Player.play(playerData);
            Lampa.Player.playlist([playerData]);
        }
    };


    // ============================================
    // 8. ĐĂNG KÝ NGUỒN VÀO NÚT PHÁT CỦA LAMPA
    // ============================================
    function registerSourceButton() {
        // Component settings_multi_source (cho Activity)
        Lampa.Component.add('settings_multi_source', function () {
            var comp = new Lampa.InteractionLine();
            this.create = function () { };
            this.start = function () { };
            this.pause = function () { };
            this.stop = function () { };
            this.render = function () { return comp.render(); };
            this.destroy = function () { comp.destroy(); };
        });

        // Lắng nghe sự kiện khi người dùng nhấn nút phát
        // Hook vào full event của Lampa
        Lampa.Listener.follow('full', function (event) {
            if (event.type === 'complite') {
                var render = event.object.activity.render();
                addCustomPlayButton(render, event.data);
            }
        });

        // Thêm vào menu select source khi nhấn play
        Lampa.Listener.follow('player', function (event) {
            if (event.type === 'select') {
                // Có thể mở rộng thêm
            }
        });
    }

    // Thêm nút phát tùy chỉnh vào trang chi tiết phim
    function addCustomPlayButton(render, data) {
        // Tìm container nút hành động
        setTimeout(function () {
            var actionsContainer = render.find('.full-start__buttons');
            if (!actionsContainer.length) return;

            // Kiểm tra nếu đã thêm rồi
            if (actionsContainer.find('.multi-source-btn').length) return;

            var btn = $('<div class="full-start__button selector multi-source-btn">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">' +
                '<path d="M8 5v14l11-7z"/>' +
                '</svg>' +
                '<span>Đa Nguồn</span>' +
                '</div>');

            btn.on('hover:enter', function () {
                openSourceSelector(data);
            });

            actionsContainer.append(btn);
        }, 500);
    }


    // ============================================
    // 9. GIAO DIỆN CHỌN NGUỒN PHÁT
    // ============================================
    function openSourceSelector(movieData) {
        Lampa.Noty.show('🔍 Đang tìm từ tất cả nguồn...');

        var allStreams = [];
        var sourcesCompleted = 0;
        var totalSources = 0;

        var priority = PluginSettings.getSourcePriority().split(',').map(function (s) { return s.trim(); });

        // Movie info chuẩn hóa
        var movie = {
            id: movieData.id,
            title: movieData.title || movieData.name,
            name: movieData.name || movieData.title,
            original_title: movieData.original_title || movieData.original_name,
            type: movieData.number_of_seasons ? 'tv' : 'movie',
            imdb_id: movieData.imdb_id || movieData.external_ids?.imdb_id || '',
            year: movieData.year || (movieData.release_date ? movieData.release_date.substring(0, 4) : ''),
            poster: movieData.poster || movieData.img,
            season: movieData.season || null,
            episode: movieData.episode || null
        };

        // Nếu là series, hỏi chọn tập
        if (movie.type === 'tv' && !movie.season) {
            selectSeasonEpisode(movieData, function (season, episode) {
                movie.season = season;
                movie.episode = episode;
                doSearch(movie);
            });
        } else {
            doSearch(movie);
        }

        function doSearch(movie) {
            var sources = [];

            if (PluginSettings.isSourceEnabled('kkphim')) {
                totalSources++;
                sources.push({ name: 'KKPhim', handler: KKPhimSource });
            }
            if (PluginSettings.isSourceEnabled('torrentio')) {
                totalSources++;
                sources.push({ name: 'Torrentio', handler: TorrentioSource });
            }
            if (PluginSettings.isSourceEnabled('aiostreams')) {
                totalSources++;
                sources.push({ name: 'AioStreams', handler: AioStreamsSource });
            }

            if (totalSources === 0) {
                Lampa.Noty.show('⚠️ Chưa bật nguồn nào! Vào Cài đặt Đa Nguồn để bật.');
                return;
            }

            sources.forEach(function (src) {
                src.handler.search(movie, function (results) {
                    allStreams = allStreams.concat(results);
                    sourcesCompleted++;

                    if (sourcesCompleted >= totalSources) {
                        showStreamSelector(allStreams, movie);
                    }
                });
            });

            // Timeout 20s
            setTimeout(function () {
                if (sourcesCompleted < totalSources) {
                    sourcesCompleted = totalSources;
                    showStreamSelector(allStreams, movie);
                }
            }, 20000);
        }
    }

    // Chọn Season/Episode cho series
    function selectSeasonEpisode(movieData, callback) {
        var seasons = [];
        var numSeasons = movieData.number_of_seasons || 1;

        for (var i = 1; i <= numSeasons; i++) {
            seasons.push({
                title: 'Phần ' + i,
                season: i
            });
        }

        Lampa.Select.show({
            title: 'Chọn Phần',
            items: seasons,
            onSelect: function (item) {
                // Chọn tập
                var episodes = [];
                var numEps = 24; // Mặc định

                // Thử lấy số tập thực tế
                if (movieData.seasons) {
                    movieData.seasons.forEach(function (s) {
                        if (s.season_number === item.season) {
                            numEps = s.episode_count || 24;
                        }
                    });
                }

                for (var j = 1; j <= numEps; j++) {
                    episodes.push({
                        title: 'Tập ' + j,
                        episode: j
                    });
                }

                Lampa.Select.show({
                    title: 'Chọn Tập - Phần ' + item.season,
                    items: episodes,
                    onSelect: function (ep) {
                        callback(item.season, ep.episode);
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

    // Hiển thị danh sách stream để chọn
    function showStreamSelector(streams, movieInfo) {
        if (!streams.length) {
            Lampa.Noty.show('😕 Không tìm thấy nguồn phát nào');
            return;
        }

        Lampa.Noty.show('✅ Tìm thấy ' + streams.length + ' nguồn');

        var items = [];

        streams.forEach(function (stream, index) {
            var icon = '';
            if (stream.source === 'KKPhim') icon = '🎬';
            else if (stream.source === 'Torrentio') icon = '🌊';
            else if (stream.source === 'AioStreams') icon = '🔄';

            var details = [];
            if (stream.quality) details.push(stream.quality);
            if (stream.size) details.push(stream.size);
            if (stream.seeders) details.push('🌱 ' + stream.seeders);
            if (stream.type === 'torrent') details.push('📦 Torrent');

            items.push({
                title: icon + ' [' + stream.source + '] ' + stream.title,
                subtitle: details.join(' • '),
                stream: stream,
                index: index
            });
        });

        Lampa.Select.show({
            title: '🎯 Chọn nguồn phát (' + streams.length + ' nguồn)',
            items: items,
            onSelect: function (item) {
                playStream(item.stream, movieInfo);
            },
            onBack: function () {
                Lampa.Controller.toggle('content');
            }
        });
    }


    // ============================================
    // 10. PHÁT VIDEO
    // ============================================
    function playStream(stream, movieInfo) {
        console.log('[MultiSource] Playing:', stream);

        if (stream.type === 'torrent') {
            // Phát qua TorrServer
            TorrServerPlayer.play(stream, movieInfo);

        } else if (stream.type === 'hls' || stream.type === 'direct') {
            // Phát trực tiếp
            playDirectStream(stream, movieInfo);

        } else if (stream.type === 'embed') {
            // Mở embed
            Lampa.Noty.show('⚠️ Link embed không hỗ trợ phát trực tiếp');

        } else if (stream.source === 'KKPhim' && stream.slug) {
            // KKPhim cần lấy stream từ slug
            KKPhimSource.getStreams(stream.slug, function (streams) {
                if (streams.length > 0) {
                    if (streams.length === 1) {
                        playStream(streams[0], movieInfo);
                    } else {
                        showStreamSelector(streams, movieInfo);
                    }
                } else {
                    Lampa.Noty.show('😕 Không lấy được link phát từ KKPhim');
                }
            });

        } else {
            Lampa.Noty.show('⚠️ Loại stream không hỗ trợ');
        }
    }

    function playDirectStream(stream, movieInfo) {
        var playerData = {
            title: movieInfo.title || movieInfo.name || stream.title,
            url: stream.url,
            quality: {}
        };

        playerData.quality[stream.quality || 'HD'] = stream.url;

        Lampa.Player.play(playerData);
        Lampa.Player.playlist([playerData]);
    }


    // ============================================
    // 11. NAVIGATOR CHO CÀI ĐẶT
    // ============================================
    var Navigator = {
        current: -1,
        items: [],

        start: function (container) {
            this.items = $(container).find('.selector');
            this.current = 0;
            this.focus();
        },

        move: function (direction) {
            if (direction === 'up') {
                this.current = Math.max(0, this.current - 1);
            } else if (direction === 'down') {
                this.current = Math.min(this.items.length - 1, this.current + 1);
            }
            this.focus();
        },

        focus: function () {
            this.items.removeClass('focused');
            if (this.items[this.current]) {
                $(this.items[this.current]).addClass('focused');

                // Scroll vào view
                var el = this.items[this.current];
                if (el.scrollIntoView) {
                    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        }
    };


    // ============================================
    // 12. KHỞI TẠO PLUGIN
    // ============================================
    function initPlugin() {
        // Đợi Lampa sẵn sàng
        if (window.appready) {
            startPlugin();
        } else {
            Lampa.Listener.follow('app', function (event) {
                if (event.type === 'ready') {
                    startPlugin();
                }
            });
        }
    }

    function startPlugin() {
        console.log('[MultiSource] Plugin starting...');

        // 1. Thêm menu bên trái
        addMenuButton();

        // 2. Đăng ký component và listener
        registerSourceButton();

        // 3. CSS bổ sung
        addGlobalStyles();

        console.log('[MultiSource] Plugin loaded successfully!');
        Lampa.Noty.show('⚡ Plugin Đa Nguồn đã sẵn sàng');
    }

    function addGlobalStyles() {
        var css = '<style>' +
            '.multi-source-btn { background: linear-gradient(135deg, #4CAF50, #2196F3) !important; }' +
            '.multi-source-btn:hover, .multi-source-btn.focused { background: linear-gradient(135deg, #66BB6A, #42A5F5) !important; transform: scale(1.05); }' +
            '.multi-source-btn svg { margin-right: 6px; }' +
            '</style>';
        $('head').append(css);
    }


    // Chạy plugin
    initPlugin();

})();