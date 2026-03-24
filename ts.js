(function () {
    'use strict';

    if (window.torrentio_parser) return;
    window.torrentio_parser = true;

    console.log('[TORRENTIO] Parser ready');

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

    Lampa.Parser.extend({
        name: 'torrentio',

        search: function (params, oncomplete) {

            const card = params.card || {};
            let imdb = params.imdb_id || card.imdb_id;

            function done(list) {
                console.log('[TORRENTIO] results:', list.length);
                oncomplete(list || []);
            }

            function fetchData(imdbId) {
                if (!imdbId) return done([]);

                const url = buildUrl(imdbId, card);

                console.log('[TORRENTIO] fetch:', url);

                fetch(url)
                    .then(r => r.json())
                    .then(data => {

                        if (!data || !data.streams) return done([]);

                        const results = data.streams.map(item => ({
                            title: item.title || 'Torrentio',
                            quality: parseQuality(item.title),
                            size: parseSize(item.title),
                            seeders: item.seeders || 0,

                            // 🔥 QUAN TRỌNG NHẤT
                            url: `magnet:?xt=urn:btih:${item.infoHash}`
                        }));

                        done(results);
                    })
                    .catch(() => done([]));
            }

            if (imdb) {
                fetchData(imdb);
                return;
            }

            const tmdbId = card.tmdb_id || card.tmdb;
            const type = (card.media_type === 'tv') ? 'tv' : 'movie';

            getImdb(tmdbId, type).then(fetchData);
        }
    });

})();