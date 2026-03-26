(function() {
    if (window.torrentio_full_plugin) return;
    window.torrentio_full_plugin = true;

    const TORRENTIO_API = 'https://torrentio.strem.fun';

    function searchTorrentio(imdbId, type, season, episode) {
        return new Promise((resolve) => {
            var searchQuery = '';
            if (type === 'movie') searchQuery = `movie:${imdbId}`;
            else if (type === 'tv') {
                searchQuery = `series:${imdbId}`;
                if (season) searchQuery += `:${season}`;
                if (episode) searchQuery += `:${episode}`;
            }
            if (!searchQuery) return resolve([]);

            var url = `${TORRENTIO_API}/stream/${searchQuery}`;
            Lampa.Network.get(url, function(response) {
                var sources = [];
                if (response && response.streams) {
                    response.streams.forEach((stream, idx) => {
                        sources.push({
                            id: idx,
                            title: stream.title || 'Torrentio',
                            quality: stream.quality || 'Auto',
                            seeders: stream.seeders || 0,
                            size: stream.size || 'Unknown',
                            url: stream.url || stream.infoHash,
                            tracker: 'Torrentio'
                        });
                    });
                }
                resolve(sources);
            }, function(err) {
                console.error(err);
                resolve([]);
            });
        });
    }

    // Đăng ký parser
    function registerParser() {
        if (Lampa.Parser && Lampa.Parser.providers && !Lampa.Parser.providers.torrentio) {
            Lampa.Parser.providers.torrentio = {
                name: 'Torrentio',
                search: function(params, callback) {
                    searchTorrentio(params.imdb_id, params.type, params.season, params.episode).then(callback);
                }
            };
            console.log('Torrentio parser registered');
        }
    }

    // Thêm nút riêng
    function addCustomButton() {
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' || e.type === 'open') {
                if ($('.full-start-new__buttons [data-action="torrentio-custom"]').length === 0) {
                    $('.full-start-new__buttons').append(`
                        <div class="full-start-new__button" data-action="torrentio-custom">
                            <svg width="24" height="24" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                            </svg>
                            <span>Torrentio</span>
                        </div>
                    `);
                    $('[data-action="torrentio-custom"]').on('click', function() {
                        var movie = Lampa.Activity.active().object;
                        if (!movie) return;
                        Lampa.Loading.show();
                        searchTorrentio(movie.imdb_id, movie.type, movie.season, movie.episode).then(function(sources) {
                            Lampa.Loading.hide();
                            if (sources.length === 0) {
                                Lampa.Notify.show('Không tìm thấy nguồn Torrentio', null, 3000);
                                return;
                            }
                            Lampa.Select.show(sources.map(s => `${s.title} (${s.seeders} seeders)`), function(index) {
                                Lampa.Player.play(sources[index].url);
                            });
                        });
                    });
                }
            }
        });
    }

    function init() {
        registerParser();
        addCustomButton();
        console.log('Torrentio plugin with custom button loaded');
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') init(); });
})();