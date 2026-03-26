(function() {
    // Kiểm tra tránh load nhiều lần
    if (window.torrentio_plugin_loaded) return;
    window.torrentio_plugin_loaded = true;

    // 1. Khai báo service chính
    var TorrentioService = {
        // URL API của Torrentio (thay đổi nếu cần)
        apiUrl: 'https://torrentio.strem.fun',
        
        // Hàm tìm kiếm chính
        search: function(query, callback) {
            console.log('Torrentio: Searching for', query);
            
            // Torrentio yêu cầu định dạng: "movie: tt1234567" hoặc "series: tt1234567:season:episode"
            var searchQuery = '';
            if (query.imdb_id) {
                if (query.type === 'movie') {
                    searchQuery = 'movie: ' + query.imdb_id;
                } else if (query.type === 'tv') {
                    searchQuery = 'series: ' + query.imdb_id;
                    if (query.season) searchQuery += ':' + query.season;
                    if (query.episode) searchQuery += ':' + query.episode;
                }
            } else {
                // Fallback: tìm bằng tên
                searchQuery = query.title;
            }
            
            // Gọi API Torrentio
            var url = this.apiUrl + '/manifest';
            if (searchQuery) {
                url = this.apiUrl + '/stream/' + searchQuery.replace(/ /g, '');
            }
            
            Lampa.Network.get(url, function(response) {
                var results = [];
                if (response && response.streams) {
                    response.streams.forEach(function(stream) {
                        results.push({
                            title: stream.title || 'Unknown Quality',
                            size: stream.size || 'Unknown',
                            seeders: stream.seeders || 0,
                            tracker: 'Torrentio',
                            magnet: stream.url || stream.infoHash,
                            quality: stream.quality || 'Auto',
                            hash: stream.infoHash
                        });
                    });
                }
                callback(results);
            }, function(error) {
                console.error('Torrentio API error:', error);
                callback([]);
            });
        }
    };
    
    // 2. Đăng ký Parser vào hệ thống Lampa
    function registerTorrentioParser() {
        // Kiểm tra Parser đã tồn tại chưa
        if (Lampa.Parser && Lampa.Parser.providers) {
            // Thêm Torrentio như một provider mới
            Lampa.Parser.providers.torrentio = {
                name: 'Torrentio',
                search: function(params, callback) {
                    TorrentioService.search(params, callback);
                }
            };
            
            // Thêm vào danh sách parser trong Settings
            if (Lampa.SettingsApi && Lampa.SettingsApi.add) {
                Lampa.SettingsApi.add({
                    tab: 'parser',
                    name: 'torrentio',
                    title: 'Torrentio',
                    html: function() {
                        return '<div class="settings-item">' +
                               '<div class="settings-item__title">Torrentio Parser</div>' +
                               '<div class="settings-item__field">' +
                               '<div class="selector">' +
                               '<div class="selector__value">Enabled</div>' +
                               '</div></div></div>';
                    }
                });
            }
        }
    }
    
    // 3. Hook vào menu cài đặt Parser
    function addToParserSettings() {
        // Chờ Lampa sẵn sàng
        var init = function() {
            registerTorrentioParser();
        };
        
        if (window.appready) {
            init();
        } else {
            Lampa.Listener.follow('app', function(e) {
                if (e.type === 'ready') init();
            });
        }
    }
    
    // 4. Thêm lựa chọn Torrentio vào Parser Settings
    function modifyParserSelect() {
        // Chờ Settings component load
        Lampa.Listener.follow('settings', function(e) {
            if (e.type === 'parser') {
                // Tìm selector của parser_torrent_type
                setTimeout(function() {
                    var parserTypeSelect = document.querySelector('[data-setting="parser_torrent_type"] .selector');
                    if (parserTypeSelect) {
                        // Thêm option Torrentio
                        var options = parserTypeSelect.querySelectorAll('.selector__value');
                        var hasTorrentio = false;
                        options.forEach(function(opt) {
                            if (opt.innerText === 'Torrentio') hasTorrentio = true;
                        });
                        if (!hasTorrentio) {
                            var newOption = document.createElement('div');
                            newOption.className = 'selector__value';
                            newOption.innerText = 'Torrentio';
                            newOption.setAttribute('data-value', 'torrentio');
                            parserTypeSelect.appendChild(newOption);
                        }
                    }
                }, 500);
            }
        });
    }
    
    // 5. Khởi chạy plugin
    addToParserSettings();
    modifyParserSelect();
    
    console.log('Torrentio plugin loaded successfully!');
})();