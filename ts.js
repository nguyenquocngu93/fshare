(function () {
    'use strict';

    const TORRENTIO_URL = 'https://torrentio.strem.fun/sort=qualitysize|qualityfilter=1080p,2160p';
    const TORRSERVER_URL = 'http://gren439e.tsarea.tv:8880';

    function log() {
        console.log.apply(console, arguments);
    }

    function searchTorentio(imdb_id) {
        return fetch(`${TORRENTIO_URL}/stream/movie/${imdb_id}.json`)
            .then(res => res.json())
            .then(data => data.streams || [])
            .catch(() => []);
    }

    function toMagnet(stream) {
        if (stream.infoHash) {
            return `magnet:?xt=urn:btih:${stream.infoHash}`;
        }
        return stream.url || '';
    }

    function toTorrServerLink(magnet) {
        return `${TORRSERVER_URL}/stream?link=${encodeURIComponent(magnet)}`;
    }

    function parse(streams) {
        return streams.map(s => {
            let magnet = toMagnet(s);

            return {
                title: s.title || s.name || 'Torrent',
                quality: (s.name || '').match(/(2160|1080|720)/)?.[0] || 'HD',
                size: s.size || '',
                url: toTorrServerLink(magnet)
            };
        });
    }

    function sortStreams(list) {
        return list.sort((a, b) => {
            const q = { '2160': 3, '1080': 2, '720': 1 };
            return (q[b.quality] || 0) - (q[a.quality] || 0);
        });
    }

    function showList(items) {
        let html = items.map((item, i) => {
            return `
                <div class="tor-item" data-index="${i}">
                    <div><b>${item.quality}p</b> - ${item.title}</div>
                    <div style="opacity:0.6">${item.size || ''}</div>
                </div>
            `;
        }).join('');

        let modal = $(`
            <div class="tor-modal">
                <div class="tor-list">${html}</div>
            </div>
        `);

        $('body').append(modal);

        modal.on('click', '.tor-item', function () {
            let index = $(this).data('index');
            let item = items[index];

            Lampa.Player.play(item.url);
            modal.remove();
        });
    }

    function load(imdb_id) {
        Lampa.Noty.show('🔎 Đang tìm torrent...');

        searchTorentio(imdb_id).then(streams => {
            if (!streams.length) {
                Lampa.Noty.show('❌ Không có nguồn');
                return;
            }

            let items = sortStreams(parse(streams));

            log('Streams:', items);

            // Auto play link tốt nhất
            Lampa.Player.play(items[0].url);

            // Hiện list để chọn lại
            showList(items);
        });
    }

    // Hook vào khi mở phim
    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            let movie = e.data.movie;

            if (!movie || !movie.imdb_id) return;

            // Thêm nút
            Lampa.Controller.add('tor_play', {
                name: '▶ Torrent',
                onSelect: function () {
                    load(movie.imdb_id);
                }
            });
        }
    });

})();