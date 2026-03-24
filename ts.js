(function () {
    'use strict';

    if (window.torrentio_ts_plugin) return;
    window.torrentio_ts_plugin = true;

    console.log('[TORRENTIO+TS] loaded');

    // =========================
    // CONFIG
    // =========================
    const TORRSERVER_URL = 'http://127.0.0.1:8090'; // đổi nếu cần

    // =========================
    // HELPERS
    // =========================
    function log() {
        console.log('[TORRENTIO+TS]', ...arguments);
    }

    function parseQuality(title) {
        if (!title) return 'SD';
        title = title.toLowerCase();

        if (title.includes('2160') || title.includes('4k')) return '4K';
        if (title.includes('1080')) return '1080p';
        if (title.includes('720')) return '720p';

        return 'SD';
    }

    function parseSize(title) {
        const m = title && title.match(/(\d+(\.\d+)?)\s?(gb|mb)/i);
        if (!m) return 0;

        let size = parseFloat(m[1]);
        if (m[3].toLowerCase() === 'gb') size *= 1024 * 1024 * 1024;
        if (m[3].toLowerCase() === 'mb') size *= 1024 * 1024;

        return size;
    }

    function getImdb(tmdbId, type) {
        return new Promise(resolve => {
            if (!tmdbId) return resolve(null);

            fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids`, {
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzYWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0'
                }
            })
            .then(r => r.json())
            .then(d => resolve(d.imdb_id))
            .catch(() => resolve(null));
        });
    }

    function buildUrl(imdb, card) {
        const isSeries = card && (card.season !== undefined || card.media_type === 'tv');

        if (isSeries) {
            const season = card.season || 1;
            const episode = card.episode || 1;
            return `https://torrentio.strem.fun/stream/series/${imdb}:${season}:${episode}.json`;
        }

        return `https://torrentio.strem.fun/stream/movie/${imdb}.json`;
    }

    // =========================
    // TORRSERVER PLAY
    // =========================
    function playMagnet(magnet, title) {

        const url = TORRSERVER_URL + '/stream?link=' + encodeURIComponent(magnet);

        log('play:', url);

        Lampa.Player.play({
            url: url,
            title: title
        });
    }

    function openList(results) {
        if (!results.length) {
            Lampa.Noty.show('Không có torrent');
            return;
        }

        if (results.length === 1) {
            playMagnet(results[0].magnet, results[0].title);
            return;
        }

        Lampa.Select.show({
            title: 'Torrentio',
            items: results.map((r, i) => ({
                title: `${r.title} (${r.quality})`,
                index: i
            })),
            onSelect: function (item) {
                const r = results[item.index];
                playMagnet(r.magnet, r.title);
            }
        });
    }

    // =========================
    // CORE
    // =========================
    function searchAndPlay(card) {

        let imdb = card.imdb_id;

        function run(imdbId) {
            if (!imdbId) {
                Lampa.Noty.show('Không có IMDB');
                return;
            }

            const url = buildUrl(imdbId, card);
            log('fetch:', url);

            fetch(url)
                .then(r => r.json())
                .then(data => {

                    if (!data || !data.streams) {
                        Lampa.Noty.show('Không có stream');
                        return;
                    }

                    const results = data.streams.map(item => ({
                        title: item.title || 'Torrentio',
                        quality: parseQuality(item.title),
                        size: parseSize(item.title),
                        magnet: `magnet:?xt=urn:btih:${item.infoHash}`
                    }));

                    openList(results);
                })
                .catch(() => {
                    Lampa.Noty.show('Lỗi Torrentio');
                });
        }

        if (imdb) {
            run(imdb);
            return;
        }

        const tmdbId = card.tmdb_id || card.tmdb;
        const type = (card.media_type === 'tv') ? 'tv' : 'movie';

        getImdb(tmdbId, type).then(run);
    }

    // =========================
    // ADD BUTTON
    // =========================
    function injectButton() {

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const obj = e.object || {};
            const card = (e.data && e.data.movie) || obj.card;

            if (!card) return;

            const $ctx = obj.activity ? obj.activity.render() : $('body');

            if ($ctx.find('.view--torrentio').length) return;

            const $btn = $(`
                <div class="full-start__button selector view--torrentio">
                    <span>TORRENTIO</span>
                </div>
            `);

            $btn.on('hover:enter', function () {
                searchAndPlay(card);
            });

            const $torrent = $ctx.find('.view--torrent');

            if ($torrent.length) $torrent.after($btn);
            else $ctx.find('.full-start__buttons').append($btn);
        });
    }

    // =========================
    // INIT
    // =========================
    function start() {
        injectButton();
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }

})();