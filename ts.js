(function () {
    'use strict';

    if (window.torrentio_fix) return;
    window.torrentio_fix = true;

    console.log('[TORRENTIO] loaded');

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

    function init() {

        if (!window.Lampa || !Lampa.Parser) return;

        Lampa.Parser.extend({
            name: 'torrentio',

            search: function (params, oncomplete) {

                var card = params && params.card ? params.card : {};
                var imdb = params.imdb_id || card.imdb_id;

                if (!imdb) {
                    oncomplete([]);
                    return;
                }

                var url = buildUrl(imdb, card);

                console.log('[TORRENTIO] fetch:', url);

                fetch(url)
                    .then(function (r) { return r.json(); })
                    .then(function (data) {

                        if (!data || !data.streams) {
                            oncomplete([]);
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

                                // 🔥 QUAN TRỌNG: giữ magnet
                                url: 'magnet:?xt=urn:btih:' + item.infoHash
                            });
                        }

                        oncomplete(results);
                    })
                    .catch(function () {
                        oncomplete([]);
                    });
            }
        });

        console.log('[TORRENTIO] parser added');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();