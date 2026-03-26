(function() {
    if (window.torrentio_play_plugin) return;
    window.torrentio_play_plugin = true;

    // URL API Torrentio
    const TORRENTIO_API = 'https://torrentio.strem.fun';
    
    // Hàm tìm kiếm torrent từ Torrentio
    async function searchTorrentio(imdbId, type, season, episode) {
        return new Promise((resolve) => {
            var searchQuery = '';
            if (type === 'movie') {
                searchQuery = `movie:${imdbId}`;
            } else if (type === 'tv') {
                searchQuery = `series:${imdbId}`;
                if (season) searchQuery += `:${season}`;
                if (episode) searchQuery += `:${episode}`;
            }
            
            var url = `${TORRENTIO_API}/stream/${searchQuery}`;
            
            Lampa.Network.get(url, function(response) {
                var sources = [];
                if (response && response.streams) {
                    response.streams.forEach(function(stream, idx) {
                        sources.push({
                            id: idx,
                            title: stream.title || 'Torrentio Source',
                            quality: stream.quality || 'Auto',
                            seeders: stream.seeders || 0,
                            size: stream.size || 'Unknown',
                            url: stream.url || stream.infoHash,
                            tracker: 'Torrentio'
                        });
                    });
                }
                resolve(sources);
            }, function(error) {
                console.error('Torrentio search error:', error);
                resolve([]);
            });
        });
    }
    
    // Hàm chính để hook vào nút phát
    function hookIntoPlayButton() {
        // Cách 1: Override hoặc mở rộng danh sách parser
        // Kiểm tra nếu Torrentio chưa được thêm vào providers
        if (Lampa.Parser && Lampa.Parser.providers && !Lampa.Parser.providers.torrentio) {
            Lampa.Parser.providers.torrentio = {
                name: 'Torrentio',
                search: function(params, callback) {
                    var imdbId = params.imdb_id || (params.card?.imdb_id);
                    var type = params.type;
                    var season = params.season;
                    var episode = params.episode;
                    
                    searchTorrentio(imdbId, type, season, episode).then(function(sources) {
                        callback(sources);
                    });
                }
            };
            console.log('Torrentio parser registered');
        }
        
        // Cách 2: Thêm vào menu settings để người dùng chọn
        addToParserSettings();
    }
    
    // Thêm tùy chọn Torrentio vào Settings → Parser
    function addToParserSettings() {
        if (Lampa.SettingsApi && Lampa.SettingsApi.add) {
            Lampa.SettingsApi.add({
                tab: 'parser',
                name: 'torrentio',
                title: 'Torrentio Parser',
                html: function() {
                    return `
                        <div class="settings-item">
                            <div class="settings-item__title">Torrentio</div>
                            <div class="settings-item__field">
                                <div class="selector">
                                    <div class="selector__value">Enabled</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        }
        
        // Thêm vào dropdown parser_torrent_type
        modifyParserDropdown();
    }
    
    // Thêm Torrentio vào dropdown chọn parser
    function modifyParserDropdown() {
        Lampa.Listener.follow('settings', function(e) {
            if (e.type === 'parser') {
                setTimeout(function() {
                    var selector = document.querySelector('[data-setting="parser_torrent_type"] .selector');
                    if (selector && !selector.querySelector('[data-value="torrentio"]')) {
                        var option = document.createElement('div');
                        option.className = 'selector__value';
                        option.innerText = 'Torrentio';
                        option.setAttribute('data-value', 'torrentio');
                        selector.appendChild(option);
                    }
                }, 500);
            }
        });
    }
    
    // Hook vào sự kiện mở card chi tiết để đảm bảo parser được load
    function init() {
        hookIntoPlayButton();
        console.log('Torrentio Play Plugin loaded - ready for play button');
    }
    
    // Khởi động plugin khi Lampa sẵn sàng
    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') init();
        });
    }
})();