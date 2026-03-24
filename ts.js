(function () {
    'use strict';

    if (window.torrentio_pub_full) return;
    window.torrentio_pub_full = true;

    console.log('[TORRENTIO PUB] init');

    // =========================
    // CONFIG
    // =========================
    var CONFIG = {
        name: 'torrentio',
        timeout: 15000,
        debug: true
    };

    // =========================
    // LOGGER
    // =========================
    function log() {
        if (CONFIG.debug) console.log('[TORRENTIO PUB]', ...arguments);
    }

    // =========================
    // PARSE HELPERS
    // =========================
    function parseQuality(title) {
        if (!title) return 'SD';

        title = title.toLowerCase();

        if (title.indexOf('2160') >= 0 || title.indexOf('4k') >= 0) return '4K';
        if (title.indexOf('1080') >= 0) return '1080p';
        if (title.indexOf('720') >= 0) return '720p';

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

    // =========================
    // URL BUILDER
    // =========================
    function buildUrl(imdb, card) {
        var isSeries = card && (card.season !== undefined || card.media_type === 'tv');

        if (isSeries) {
            var season = card.season || 1;
            var episode = card.episode || 1;

            return 'https://torrentio.strem.fun/stream/series/' +
                imdb + ':' + season + ':' + episode + '.json';
        }

        return 'https://torrentio.strem.fun/stream/movie/' + imdb + '.json';
    }

    // =========================
    // FETCH WITH TIMEOUT
    // =========================
    function fetchWithTimeout(url, callback) {

        var done = false;

        var timer = setTimeout(function () {
            if (!done) {
                done = true;
                log('timeout');
                callback(null);
            }
        }, CONFIG.timeout);

        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (done) return;

                clearTimeout(timer);
                done = true;

                callback(data);
            })
            .catch(function () {
                if (done) return;

                clearTimeout(timer);
                done = true;

                callback(null);
            });
    }

    // =========================
    // RESULT BUILDER
    // =========================
    function buildResults(data) {

        var results = [];

        if (!data || !data.streams) return results;

        for (var i = 0; i < data.streams.length; i++) {

            var item = data.streams[i];
            var title = item.title || 'Torrentio';

            results.push({
                title: title,
                quality: parseQuality(title),
                size: parseSize(title),
                seeders: item.seeders || 0,
                url: 'magnet:?xt=urn:btih:' + item.infoHash
            });
        }

        return results;
    }

    // =========================
    // MAIN SEARCH
    // =========================
    function search(params, oncomplete) {

        try {

            var card = params.card || {};
            var imdb = params.imdb_id || card.imdb_id;

            if (!imdb) {
                log('no imdb');
                oncomplete([]);
                return;
            }

            var url = buildUrl(imdb, card);

            log('fetch:', url);

            fetchWithTimeout(url, function (data) {

                var results = buildResults(data);

                log('results:', results.length);

                oncomplete(results);
            });

        } catch (e) {
            log('error:', e);
            oncomplete([]);
        }
    }

    // =========================
    // REGISTER (PUBTORR STYLE)
    // =========================
    function register() {

        if (!window.Lampa || !Lampa.Component) {
            log('Lampa not ready');
            return;
        }

        Lampa.Component.add(CONFIG.name, {
            name: 'Torrentio',
            type: 'parser',
            search: search
        });

        log('registered');
    }

    // =========================
    // INIT
    // =========================
    if (window.appready) {
        register();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') register();
        });
    }

})();