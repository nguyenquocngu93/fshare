(function() {
    if (window.torrentio_fixed) return;
    window.torrentio_fixed = true;

    const TORRENTIO_API = 'https://torrentio.strem.fun';

    // Hàm tìm kiếm Torrentio
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

    // Hàm thêm nút vào card
    function addCustomButton() {
        Lampa.Listener.follow('full', function(e) {
            // e.type có thể là 'complite' (do Lampa viết sai) hoặc 'open'
            if (e.type === 'complite' || e.type === 'open') {
                var movie = e.object;  // Lấy trực tiếp từ sự kiện
                if (!movie) return;

                // Kiểm tra nếu nút đã tồn tại thì không thêm lại
                if ($('.full-start-new__buttons [data-action="torrentio-custom"]').length > 0) return;

                // Tìm container chứa nút phát (có thể khác tên class)
                var buttonsContainer = $('.full-start-new__buttons');
                if (buttonsContainer.length === 0) {
                    // Thử với class khác nếu không tìm thấy
                    buttonsContainer = $('.full-start__buttons');
                }
                if (buttonsContainer.length === 0) return;

                // Thêm nút
                buttonsContainer.append(`
                    <div class="full-start-new__button" data-action="torrentio-custom">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                        </svg>
                        <span>Torrentio</span>
                    </div>
                `);

                // Xử lý sự kiện click
                $('[data-action="torrentio-custom"]').on('click', function() {
                    Lampa.Loading.show();
                    searchTorrentio(movie.imdb_id, movie.type, movie.season, movie.episode).then(function(sources) {
                        Lampa.Loading.hide();
                        if (sources.length === 0) {
                            Lampa.Notify.show('Không tìm thấy nguồn Torrentio', null, 3000);
                            return;
                        }
                        // Hiển thị danh sách nguồn để chọn
                        Lampa.Select.show(sources.map(s => `${s.title} (${s.seeders} seeders)`), function(index) {
                            Lampa.Player.play(sources[index].url);
                        });
                    });
                });
            }
        });
    }

    // Khởi tạo plugin
    function init() {
        addCustomButton();
        console.log('Torrentio plugin with fixed card data loaded');
    }

    if (window.appready) init();
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') init(); });
})();