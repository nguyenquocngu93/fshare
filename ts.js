(function () {
    'use strict';

    if (window.torrentio_pubtorr) return;
    window.torrentio_pubtorr = true;

    console.log('[TORRENTIO PUB] start');

    var network = new Lampa.Reguest();

    function parseQuality(title) {
        if (!title) return 'SD';
        title = title.toLowerCase();

        if (title.indexOf('2160') >= 0 || title.indexOf('4k') >= 0) return '4K';
        if (title.indexOf('1080') >= 0) return '1080p';
        if (title.indexOf('720') >= 0) return '720p';

        return 'SD';
    }

    function buildUrl(imdb, card) {
        var isSeries = card && (card.season !== undefined || card.media_type === 'tv');

        if (isSeries) {
            var season = card.season || 1;
            var episode = card.episode || 1;
            return 'https://torrentio.strem.fun/stream/series/' + imdb + ':' + season + ':' + episode + '.json';
        }

        return 'https://torrentio.strem.fun/stream/movie/' + imdb + '.json';
    }

    function search(params, callback) {

        try {
            var card = params.card || {};
            var imdb = params.imdb_id || card.imdb_id;

            if (!imdb) {
                callback([]);
                return;
            }

            var url = buildUrl(imdb, card);

            console.log('[TORRENTIO PUB] fetch:', url);

            fetch(url)
                .then(function (r) { return r.json(); })
                .then(function (data) {

                    if (!data || !data.streams) {
                        callback([]);
                        return;
                    }

                    var results = [];

                    for (var i = 0; i < data.streams.length; i++) {
                        var item = data.streams[i];

                        results.push({
                            title: item.title || 'Torrentio',
                            quality: parseQuality(item.title),
                            size: 0,
                            seeders: item.seeders || 0,

                            // 🔥 BẮT BUỘC
                            url: 'magnet:?xt=urn:btih:' + item.infoHash
                        });
                    }

                    callback(results);
                })
                .catch(function () {
                    callback([]);
                });

        } catch (e) {
            console.log('TORRENTIO ERROR', e);
            callback([]);
        }
    }

    // 🔥 STYLE PUBTORR
    Lampa.Component.add('torrentio', {
        name: 'Torrentio',
        type: 'parser',
        search: search
    });

})();