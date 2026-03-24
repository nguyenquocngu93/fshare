(function () {
    'use strict';

    if (window.torrentio_ts_fixed) return;
    window.torrentio_ts_fixed = true;

    const TS = 'http://gren439e.tsarea.tv:8880';

    console.log('[TORRENTIO+TS] ready:', TS);

    function parseQuality(title) {
        if (!title) return 'SD';
        title = title.toLowerCase();

        if (title.includes('2160') || title.includes('4k')) return '4K';
        if (title.includes('1080')) return '1080p';
        if (title.includes('720')) return '720p';

        return 'SD';
    }

    function parseSize(title) {
        if (!title) return 0;

        var m = title.match(/(\d+(\.\d+)?)\s?(gb|mb)/i);
        if (!m) return 0;

        var size = parseFloat(m[1]);

        if (m[3].toLowerCase() === 'gb') size *= 1024 * 1024 * 1024;
        if (m[3].toLowerCase() === 'mb') size *= 1024 * 1024;

        return size;
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

    function toTorrServer(magnet) {
        return TS + '/torrent/play?link=' + encodeURIComponent(magnet);
    }

    function init() {

        Lampa.Parser.extend({
            name: 'torrentio_ts',

            search: function (params, oncomplete) {

                var card = params.card || {};
                var imdb = params.imdb_id || card.imdb_id;

                function done(list) {
                    oncomplete(list || []);
                }

                if (!imdb) return done([]);

                var url = buildUrl(imdb, card);

                console.log('[TORRENTIO] fetch:', url);

                fetch(url)
                    .then(function (r) { return r.json(); })
                    .then(function (data) {

                        if (!data || !data.streams) return done([]);

                        var results = [];

                        for (var i = 0; i < data.streams.length; i++) {
                            var item = data.streams[i];

                            var magnet = 'magnet:?xt=urn:btih:' + item.infoHash;

                            results.push({
                                title: item.title || 'Torrentio',
                                quality: parseQuality(item.title),
                                size: parseSize(item.title),

                                // 🔥 KEY: trả link TorrServer luôn
                                url: toTorrServer(magnet)
                            });
                        }

                        done(results);
                    })
                    .catch(function () {
                        done([]);
                    });
            }
        });

        console.log('[TORRENTIO+TS] parser added');
    }

    if (window.appready) {
        init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') init();
        });
    }

})();