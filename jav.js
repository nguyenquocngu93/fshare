(function () {
    'use strict';

    // =============================================
    // CẤU HÌNH
    // =============================================
    var API_HOST = 'https://phimapi.com';

    // =============================================
    // NETWORK HELPER
    // =============================================
    function get(path, params, onSuccess, onError) {
        var url = API_HOST + path;
        if (params && Object.keys(params).length) {
            var q = [];
            for (var k in params) {
                if (params.hasOwnProperty(k)) q.push(k + '=' + encodeURIComponent(params[k]));
            }
            url += (url.indexOf('?') > -1 ? '&' : '?') + q.join('&');
        }

        var net = new Lampa.Reguest();
        net.timeout(15000);
        net.silent(url, function (json) {
            if (onSuccess) onSuccess(json);
        }, function (a, c) {
            if (onError) onError(a, c);
        }, false, {
            dataType: 'json'
        });

        return net;
    }

    // =============================================
    // UTILS
    // =============================================
    function fixImg(url, cdn) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        if (cdn) return cdn + '/' + url;
        return API_HOST + '/' + url;
    }

    function stripHTML(html) {
        if (!html) return '';
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // =============================================
    // CSS STYLES
    // =============================================
    function addStyles() {
        if (document.getElementById('kkphim-styles')) return;
        var s = document.createElement('style');
        s.id = 'kkphim-styles';
        s.textContent = `
            /* ===== ROW SECTION ===== */
            .kkphim-section {
                margin-bottom: 1.5em;
            }
            .kkphim-section-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 1.5em;
                margin-bottom: 0.7em;
            }
            .kkphim-section-head__title {
                font-size: 1.5em;
                font-weight: 700;
                color: #fff;
            }
            .kkphim-section-head__more {
                font-size: 0.9em;
                color: rgba(255,255,255,0.5);
                padding: 0.4em 1em;
                border-radius: 1em;
                background: rgba(255,255,255,0.06);
                cursor: pointer;
                transition: 0.3s;
            }
            .kkphim-section-head__more.focus {
                color: #fff;
                background: rgba(255,255,255,0.15);
                box-shadow: 0 0 0 2px #fff;
            }

            /* ===== CARD ===== */
            .kkphim-card-wrap {
                width: 12em;
                flex-shrink: 0;
                cursor: pointer;
                transition: 0.2s;
            }
            .kkphim-card-wrap.focus .kkphim-card__poster-box {
                transform: scale(1.06);
                box-shadow: 0 0 0 0.2em #fff;
            }
            .kkphim-card__poster-box {
                position: relative;
                width: 100%;
                padding-bottom: 150%;
                border-radius: 0.8em;
                overflow: hidden;
                background: #1a1a2e;
                transition: 0.3s;
            }
            .kkphim-card__poster-box img {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover;
            }
            .kkphim-card__quality {
                position: absolute;
                top: 0.4em; left: 0.4em;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                font-size: 0.65em;
                font-weight: 700;
                padding: 0.15em 0.45em;
                border-radius: 0.3em;
                text-transform: uppercase;
            }
            .kkphim-card__year {
                position: absolute;
                top: 0.4em; right: 0.4em;
                background: rgba(0,0,0,0.7);
                color: #fff;
                font-size: 0.65em;
                padding: 0.15em 0.45em;
                border-radius: 0.3em;
            }
            .kkphim-card__ep {
                position: absolute;
                bottom: 0; left: 0; right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.85));
                color: #fff;
                font-size: 0.65em;
                font-weight: 600;
                text-align: center;
                padding: 1.2em 0.4em 0.4em;
            }
            .kkphim-card__title {
                margin-top: 0.45em;
                font-size: 0.85em;
                color: #fff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: center;
                padding: 0 0.2em;
            }
            .kkphim-card__orig {
                font-size: 0.7em;
                color: rgba(255,255,255,0.45);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-align: center;
                padding: 0 0.2em 0.3em;
            }

            /* ===== INFO PAGE ===== */
            .kkinfo-page {
                position: relative;
            }
            .kkinfo-backdrop {
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 55vh;
                background-size: cover;
                background-position: center top;
                z-index: 0;
            }
            .kkinfo-backdrop::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 50%, #0e0e16 100%);
            }
            .kkinfo-body {
                position: relative;
                z-index: 2;
                display: flex;
                gap: 2em;
                padding: 2.5em 2em 1em;
            }
            .kkinfo-poster {
                flex-shrink: 0;
                width: 14em;
            }
            .kkinfo-poster img {
                width: 100%;
                border-radius: 1em;
                box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            }
            .kkinfo-detail {
                flex: 1;
                min-width: 0;
            }
            .kkinfo-title {
                font-size: 2em;
                font-weight: 800;
                color: #fff;
                line-height: 1.2;
                margin-bottom: 0.15em;
            }
            .kkinfo-orig {
                font-size: 1em;
                color: rgba(255,255,255,0.55);
                font-style: italic;
                margin-bottom: 0.8em;
            }
            .kkinfo-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin-bottom: 1em;
            }
            .kkinfo-meta__tag {
                display: inline-flex;
                align-items: center;
                gap: 0.3em;
                background: rgba(255,255,255,0.1);
                padding: 0.3em 0.7em;
                border-radius: 2em;
                font-size: 0.8em;
                color: rgba(255,255,255,0.85);
            }
            .kkinfo-meta__tag--q {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                font-weight: 700;
            }
            .kkinfo-genres {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 1em;
            }
            .kkinfo-genre {
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.12);
                padding: 0.25em 0.7em;
                border-radius: 2em;
                font-size: 0.78em;
                color: rgba(255,255,255,0.7);
                cursor: pointer;
                transition: 0.3s;
            }
            .kkinfo-genre.focus {
                background: rgba(255,255,255,0.2);
                color: #fff;
                box-shadow: 0 0 0 2px #fff;
            }
            .kkinfo-desc {
                font-size: 0.88em;
                color: rgba(255,255,255,0.65);
                line-height: 1.65;
                max-height: 5.5em;
                overflow: hidden;
                margin-bottom: 1.2em;
            }

            /* BUTTONS */
            .kkinfo-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.7em;
                margin-bottom: 1.5em;
            }
            .kkinfo-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.65em 1.5em;
                border-radius: 0.7em;
                font-size: 0.95em;
                font-weight: 700;
                cursor: pointer;
                transition: 0.3s;
                border: none;
            }
            .kkinfo-btn svg { width: 1.2em; height: 1.2em; fill: currentColor; }
            .kkinfo-btn--play {
                background: linear-gradient(135deg, #e50914, #b20710);
                color: #fff;
            }
            .kkinfo-btn--play.focus {
                transform: scale(1.07);
                box-shadow: 0 0 0 3px #fff, 0 6px 20px rgba(229,9,20,0.5);
            }
            .kkinfo-btn--sec {
                background: rgba(255,255,255,0.1);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.15);
            }
            .kkinfo-btn--sec.focus {
                transform: scale(1.07);
                background: rgba(255,255,255,0.2);
                box-shadow: 0 0 0 2px #fff;
            }

            /* EPISODES */
            .kkinfo-episodes {
                position: relative;
                z-index: 2;
                padding: 0 2em 2em;
            }
            .kkinfo-ep-title {
                font-size: 1.3em;
                font-weight: 700;
                color: #fff;
                margin-bottom: 0.6em;
            }
            .kkinfo-ep-title .cnt {
                font-size: 0.55em;
                background: rgba(255,255,255,0.1);
                padding: 0.2em 0.6em;
                border-radius: 1em;
                color: rgba(255,255,255,0.5);
                margin-left: 0.5em;
            }
            .kkinfo-servers {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4em;
                margin-bottom: 0.8em;
            }
            .kkinfo-srv {
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.6);
                padding: 0.3em 0.9em;
                border-radius: 0.5em;
                font-size: 0.8em;
                cursor: pointer;
                transition: 0.3s;
            }
            .kkinfo-srv.active,
            .kkinfo-srv.focus {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #fff;
                border-color: transparent;
            }
            .kkinfo-ep-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 0.45em;
            }
            .kkinfo-ep {
                min-width: 3.2em;
                padding: 0.5em 0.7em;
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.8);
                text-align: center;
                border-radius: 0.5em;
                font-size: 0.8em;
                cursor: pointer;
                font-weight: 600;
                transition: 0.3s;
            }
            .kkinfo-ep.focus {
                background: linear-gradient(135deg, #e50914, #b20710);
                color: #fff;
                border-color: transparent;
                transform: scale(1.12);
                box-shadow: 0 4px 12px rgba(229,9,20,0.4);
            }
            .kkinfo-ep.watched {
                opacity: 0.4;
            }

            /* ===== CATEGORY PAGE ===== */
            .kk-cat-head {
                font-size: 1.6em;
                font-weight: 700;
                color: #fff;
                padding: 0.8em 1em 0.5em;
            }
            .kk-cat-grid {
                display: flex;
                flex-wrap: wrap;
                padding: 0 1em;
                gap: 0.7em;
            }
            .kk-cat-grid .kkphim-card-wrap {
                width: 12em;
            }
            .kk-cat-loading {
                text-align: center;
                padding: 1.5em;
                color: rgba(255,255,255,0.4);
            }
            .kk-cat-loading .dot-loader {
                display: inline-block;
            }
            .kk-cat-loading .dot-loader::after {
                content: '⠋';
                animation: kk-dots 1s steps(10) infinite;
            }
            @keyframes kk-dots {
                0% { content: '⠋'; }
                10% { content: '⠙'; }
                20% { content: '⠹'; }
                30% { content: '⠸'; }
                40% { content: '⠼'; }
                50% { content: '⠴'; }
                60% { content: '⠦'; }
                70% { content: '⠧'; }
                80% { content: '⠇'; }
                90% { content: '⠏'; }
            }
        `;
        document.head.appendChild(s);
    }

    // =============================================
    // CARD BUILDER
    // =============================================
    function createCardHTML(item, cdn) {
        var poster = fixImg(item.poster_url || item.thumb_url, cdn);
        var quality = item.quality || '';
        var year = item.year || '';
        var ep = item.episode_current || '';
        var name = item.name || '';
        var orig = item.origin_name || '';
        var slug = item.slug || '';

        var html = '<div class="kkphim-card-wrap selector" data-slug="' + slug + '">' +
            '<div class="kkphim-card__poster-box">' +
                '<img src="' + poster + '" loading="lazy" onerror="this.src=\'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text fill=%22%23333%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2216%22>No Image</text></svg>\'" />' +
                (quality ? '<div class="kkphim-card__quality">' + quality + '</div>' : '') +
                (year ? '<div class="kkphim-card__year">' + year + '</div>' : '') +
                (ep ? '<div class="kkphim-card__ep">' + ep + '</div>' : '') +
            '</div>' +
            '<div class="kkphim-card__title">' + name + '</div>' +
            '<div class="kkphim-card__orig">' + orig + '</div>' +
        '</div>';

        return html;
    }

    // =============================================
    // COMPONENT: TRANG CHỦ (kkphim_main)
    // =============================================
    Lampa.Component.add('kkphim_main', function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div></div>');
        var active = 0;

        var categories = [
            { title: 'Phim Mới Cập Nhật', path: '/danh-sach/phim-moi-cap-nhat', params: { page: 1 }, isV1: false },
            { title: 'Phim Bộ', path: '/v1/api/danh-sach/phim-bo', params: { page: 1, limit: 16 }, isV1: true },
            { title: 'Phim Lẻ', path: '/v1/api/danh-sach/phim-le', params: { page: 1, limit: 16 }, isV1: true },
            { title: 'Hoạt Hình', path: '/v1/api/danh-sach/hoat-hinh', params: { page: 1, limit: 16 }, isV1: true },
            { title: 'TV Shows', path: '/v1/api/danh-sach/tv-shows', params: { page: 1, limit: 16 }, isV1: true },
            { title: 'Phim Vietsub', path: '/v1/api/danh-sach/phim-vietsub', params: { page: 1, limit: 16 }, isV1: true },
            { title: 'Phim Thuyết Minh', path: '/v1/api/danh-sach/phim-thuyet-minh', params: { page: 1, limit: 16 }, isV1: true }
        ];

        this.create = function () {
            this.activity.loader(true);
            this.buildSections();
        };

        this.buildSections = function () {
            var _this = this;
            var loadedCount = 0;
            var totalCats = categories.length;

            categories.forEach(function (cat, idx) {
                // Section wrapper
                var section = $('<div class="kkphim-section"></div>');

                // Head
                var head = $('<div class="kkphim-section-head"></div>');
                head.append('<div class="kkphim-section-head__title">' + cat.title + '</div>');

                var moreBtn = $('<div class="kkphim-section-head__more selector">Xem thêm ›</div>');
                moreBtn.on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: '',
                        title: cat.title,
                        component: 'kkphim_category',
                        page: 1,
                        cat_path: cat.path,
                        cat_params: cat.params,
                        cat_isV1: cat.isV1
                    });
                });
                head.append(moreBtn);
                section.append(head);

                // Row container
                var row = $('<div class="selector" style="display:flex;gap:0.7em;padding:0 1.5em;overflow:visible;"></div>');
                section.append(row);

                html.append(section);

                // Load data
                var url = API_HOST + cat.path;
                var params = Object.assign({}, cat.params);
                var qArr = [];
                for (var k in params) {
                    if (params.hasOwnProperty(k)) qArr.push(k + '=' + encodeURIComponent(params[k]));
                }
                if (qArr.length) url += '?' + qArr.join('&');

                $.ajax({
                    url: url,
                    dataType: 'json',
                    timeout: 15000,
                    success: function (data) {
                        var list = [];
                        var cdn = '';

                        if (cat.isV1 && data && data.data) {
                            list = data.data.items || [];
                            cdn = data.data.APP_DOMAIN_CDN_IMAGE || '';
                        } else if (data && data.items) {
                            list = data.items || [];
                        }

                        list.forEach(function (item) {
                            var cardHtml = createCardHTML(item, cdn);
                            var cardEl = $(cardHtml);

                            cardEl.on('hover:enter', function () {
                                var slug = $(this).data('slug');
                                if (slug) {
                                    Lampa.Activity.push({
                                        url: '',
                                        title: item.name || 'Chi tiết',
                                        component: 'kkphim_info',
                                        slug: slug
                                    });
                                }
                            });

                            row.append(cardEl);
                        });

                        loadedCount++;
                        if (loadedCount >= totalCats) {
                            _this.finishLoading();
                        }
                    },
                    error: function () {
                        loadedCount++;
                        if (loadedCount >= totalCats) {
                            _this.finishLoading();
                        }
                    }
                });
            });
        };

        this.finishLoading = function () {
            scroll.append(html);
            this.activity.loader(false);
            this.activity.toggle();
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    });

    // =============================================
    // COMPONENT: INFO PHIM (kkphim_info)
    // =============================================
    Lampa.Component.add('kkphim_info', function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div class="kkinfo-page"></div>');
        var activeServer = 0;

        this.create = function () {
            var _this = this;
            var slug = object.slug;

            this.activity.loader(true);

            $.ajax({
                url: API_HOST + '/phim/' + slug,
                dataType: 'json',
                timeout: 15000,
                success: function (data) {
                    _this.activity.loader(false);

                    if (data && data.movie) {
                        _this.buildInfo(data.movie, data.episodes || []);
                        _this.activity.toggle();
                    } else {
                        _this.empty();
                    }
                },
                error: function () {
                    _this.activity.loader(false);
                    _this.empty();
                }
            });
        };

        this.empty = function () {
            var empty = new Lampa.Empty();
            html.append(empty.render());
            scroll.append(html);
            this.activity.toggle();
        };

        this.buildInfo = function (movie, episodes) {
            var backdrop = movie.thumb_url || movie.poster_url || '';
            var poster = movie.poster_url || movie.thumb_url || '';

            // Backdrop
            html.append('<div class="kkinfo-backdrop" style="background-image:url(' + backdrop + ')"></div>');

            // Body: poster + details
            var body = $('<div class="kkinfo-body"></div>');

            // Poster
            body.append(
                '<div class="kkinfo-poster">' +
                    '<img src="' + poster + '" onerror="this.style.display=\'none\'" />' +
                '</div>'
            );

            // Detail
            var detail = $('<div class="kkinfo-detail"></div>');

            detail.append('<div class="kkinfo-title">' + (movie.name || '') + '</div>');

            if (movie.origin_name) {
                detail.append('<div class="kkinfo-orig">' + movie.origin_name + '</div>');
            }

            // Meta tags
            var meta = $('<div class="kkinfo-meta"></div>');
            if (movie.quality) meta.append('<span class="kkinfo-meta__tag kkinfo-meta__tag--q">' + movie.quality + '</span>');
            if (movie.year) meta.append('<span class="kkinfo-meta__tag">📅 ' + movie.year + '</span>');
            if (movie.time) meta.append('<span class="kkinfo-meta__tag">⏱ ' + movie.time + '</span>');
            if (movie.lang) meta.append('<span class="kkinfo-meta__tag">🌐 ' + movie.lang + '</span>');
            if (movie.episode_current) meta.append('<span class="kkinfo-meta__tag">📺 ' + movie.episode_current + '</span>');
            if (movie.view) meta.append('<span class="kkinfo-meta__tag">👁 ' + Number(movie.view).toLocaleString() + '</span>');
            detail.append(meta);

            // Genres
            if (movie.category && movie.category.length) {
                var genres = $('<div class="kkinfo-genres"></div>');
                movie.category.forEach(function (g) {
                    var genreEl = $('<div class="kkinfo-genre selector">' + g.name + '</div>');
                    genreEl.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: g.name,
                            component: 'kkphim_category',
                            page: 1,
                            cat_path: '/v1/api/the-loai/' + g.slug,
                            cat_params: { page: 1, limit: 24 },
                            cat_isV1: true
                        });
                    });
                    genres.append(genreEl);
                });
                detail.append(genres);
            }

            // Description
            var desc = stripHTML(movie.content || '');
            if (desc) {
                detail.append('<div class="kkinfo-desc">' + desc + '</div>');
            }

            // Country info
            if (movie.country && movie.country.length) {
                var countries = movie.country.map(function(c){ return c.name; }).join(', ');
                detail.append('<div class="kkinfo-meta" style="margin-bottom:0.8em"><span class="kkinfo-meta__tag">🌍 ' + countries + '</span></div>');
            }

            // Actor info
            if (movie.actor && movie.actor.length) {
                var actors = movie.actor.slice(0, 5).join(', ');
                if (movie.actor.length > 5) actors += '...';
                detail.append('<div class="kkinfo-meta" style="margin-bottom:0.8em"><span class="kkinfo-meta__tag">🎭 ' + actors + '</span></div>');
            }

            // Director
            if (movie.director && movie.director.length) {
                detail.append('<div class="kkinfo-meta" style="margin-bottom:0.8em"><span class="kkinfo-meta__tag">🎬 ' + movie.director.join(', ') + '</span></div>');
            }

            // Actions
            var actions = $('<div class="kkinfo-actions"></div>');

            // Play button
            var playBtn = $('<div class="kkinfo-btn kkinfo-btn--play selector"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg><span>Phát Phim</span></div>');
            playBtn.on('hover:enter', function () {
                if (episodes.length > 0 && episodes[0].server_data && episodes[0].server_data.length > 0) {
                    var ep = episodes[0].server_data[0];
                    playEpisode(movie, ep);
                } else {
                    Lampa.Noty.show('Chưa có tập phim');
                }
            });
            actions.append(playBtn);

            // Trailer
            if (movie.trailer_url) {
                var trailerBtn = $('<div class="kkinfo-btn kkinfo-btn--sec selector"><svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg><span>Trailer</span></div>');
                trailerBtn.on('hover:enter', function () {
                    var tUrl = movie.trailer_url;
                    if (tUrl.indexOf('youtube.com/watch') > -1) {
                        var vid = tUrl.split('v=')[1];
                        if (vid) vid = vid.split('&')[0];
                        if (vid) tUrl = 'https://www.youtube.com/embed/' + vid;
                    }
                    Lampa.Player.play({ title: movie.name + ' - Trailer', url: tUrl });
                });
                actions.append(trailerBtn);
            }

            // Favorite
            var favBtn = $('<div class="kkinfo-btn kkinfo-btn--sec selector"><svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg><span>Yêu thích</span></div>');
            favBtn.on('hover:enter', function () {
                Lampa.Noty.show('Đã thêm vào yêu thích!');
            });
            actions.append(favBtn);

            detail.append(actions);
            body.append(detail);
            html.append(body);

            // Episodes Section
            if (episodes.length > 0) {
                var epWrap = $('<div class="kkinfo-episodes"></div>');

                var totalEps = 0;
                episodes.forEach(function (s) { totalEps += (s.server_data || []).length; });

                epWrap.append('<div class="kkinfo-ep-title">Danh sách tập phim <span class="cnt">' + totalEps + ' tập</span></div>');

                // Server tabs
                if (episodes.length > 1) {
                    var servers = $('<div class="kkinfo-servers"></div>');
                    episodes.forEach(function (srv, si) {
                        var tab = $('<div class="kkinfo-srv selector' + (si === 0 ? ' active' : '') + '" data-si="' + si + '">' + (srv.server_name || 'Server ' + (si + 1)) + '</div>');
                        tab.on('hover:enter', function () {
                            activeServer = si;
                            servers.find('.kkinfo-srv').removeClass('active');
                            $(this).addClass('active');
                            epWrap.find('.kkinfo-ep-grid').hide();
                            epWrap.find('.kkinfo-ep-grid[data-si="' + si + '"]').show();
                        });
                        servers.append(tab);
                    });
                    epWrap.append(servers);
                }

                // Episode grids
                episodes.forEach(function (srv, si) {
                    var grid = $('<div class="kkinfo-ep-grid" data-si="' + si + '"' + (si > 0 ? ' style="display:none"' : '') + '></div>');

                    (srv.server_data || []).forEach(function (ep) {
                        var epBtn = $('<div class="kkinfo-ep selector">' + (ep.name || '?') + '</div>');
                        epBtn.on('hover:enter', function () {
                            $(this).addClass('watched');
                            playEpisode(movie, ep);
                        });
                        grid.append(epBtn);
                    });

                    epWrap.append(grid);
                });

                html.append(epWrap);
            }

            scroll.append(html);
        };

        function playEpisode(movie, ep) {
            var link = ep.link_m3u8 || ep.link_embed || '';
            if (!link) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            var title = (movie.name || 'KKPhim') + ' - ' + (ep.name || ep.filename || '');

            Lampa.Player.play({
                title: title,
                url: link,
                quality: false,
                subtitles: false
            });

            Lampa.Player.playlist([{
                title: title,
                url: link
            }]);
        }

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    });

    // =============================================
    // COMPONENT: CATEGORY - INFINITE SCROLL (kkphim_category)
    // =============================================
    Lampa.Component.add('kkphim_category', function (object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var grid = $('<div class="kk-cat-grid"></div>');
        var loadingEl = $('<div class="kk-cat-loading" style="display:none"><div class="dot-loader"></div> Đang tải thêm...</div>');

        var currentPage = 1;
        var isLoading = false;
        var allLoaded = false;
        var scrollCheckTimer = null;

        this.create = function () {
            html.append('<div class="kk-cat-head">' + (object.title || 'Danh mục') + '</div>');
            html.append(grid);
            html.append(loadingEl);

            scroll.append(html);

            this.activity.loader(true);
            this.loadPage(1);
            this.startScrollMonitor();
        };

        this.loadPage = function (page) {
            var _this = this;
            if (isLoading || allLoaded) return;

            isLoading = true;
            loadingEl.show();

            var catPath = object.cat_path;
            var params = Object.assign({}, object.cat_params || {}, { page: page });
            if (object.cat_isV1) params.limit = params.limit || 24;

            var url = API_HOST + catPath;
            var qArr = [];
            for (var k in params) {
                if (params.hasOwnProperty(k)) qArr.push(k + '=' + encodeURIComponent(params[k]));
            }
            if (qArr.length) url += '?' + qArr.join('&');

            $.ajax({
                url: url,
                dataType: 'json',
                timeout: 15000,
                success: function (data) {
                    isLoading = false;
                    loadingEl.hide();
                    _this.activity.loader(false);

                    var list = [];
                    var cdn = '';
                    var totalPages = 1;

                    if (object.cat_isV1 && data && data.data) {
                        list = data.data.items || [];
                        cdn = data.data.APP_DOMAIN_CDN_IMAGE || '';
                        if (data.data.params && data.data.params.pagination) {
                            totalPages = data.data.params.pagination.totalPages || 1;
                        }
                    } else if (data) {
                        list = data.items || [];
                        if (data.pagination) {
                            totalPages = data.pagination.totalPages || 1;
                        }
                    }

                    if (!list.length) {
                        allLoaded = true;
                        if (currentPage === 1) _this.empty();
                        return;
                    }

                    list.forEach(function (item) {
                        var cardHtml = createCardHTML(item, cdn);
                        var cardEl = $(cardHtml);

                        cardEl.on('hover:enter', function () {
                            var slug = $(this).data('slug');
                            if (slug) {
                                Lampa.Activity.push({
                                    url: '',
                                    title: item.name || 'Chi tiết',
                                    component: 'kkphim_info',
                                    slug: slug
                                });
                            }
                        });

                        grid.append(cardEl);
                    });

                    currentPage = page;
                    if (currentPage >= totalPages) {
                        allLoaded = true;
                    }

                    _this.activity.toggle();
                },
                error: function () {
                    isLoading = false;
                    loadingEl.hide();
                    _this.activity.loader(false);

                    if (currentPage === 1) _this.empty();
                }
            });
        };

        this.empty = function () {
            var empty = new Lampa.Empty();
            html.append(empty.render());
            this.activity.toggle();
        };

        this.startScrollMonitor = function () {
            var _this = this;
            scrollCheckTimer = setInterval(function () {
                if (allLoaded || isLoading) return;

                var render = scroll.render();
                if (!render || !render.length) return;

                var scrollBody = render.find('.scroll__body');
                if (!scrollBody.length) return;

                var body = scrollBody[0];
                var transform = body.style.transform || '';
                var match = transform.match(/translateY\((-?\d+)/);
                var translateY = match ? Math.abs(parseInt(match[1])) : 0;
                var totalHeight = body.scrollHeight || body.offsetHeight || 0;
                var viewHeight = render[0].clientHeight || render[0].offsetHeight || 0;

                if (totalHeight > 0 && translateY + viewHeight + 500 >= totalHeight) {
                    _this.loadPage(currentPage + 1);
                }
            }, 400);
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {
            if (scrollCheckTimer) {
                clearInterval(scrollCheckTimer);
                scrollCheckTimer = null;
            }
        };

        this.render = function () {
            return scroll.render();
        };

        this.destroy = function () {
            if (scrollCheckTimer) {
                clearInterval(scrollCheckTimer);
                scrollCheckTimer = null;
            }
            network.clear();
            scroll.destroy();
        };
    });

    // =============================================
    // MENU ITEM
    // =============================================
    function addMenuItem() {
        var ico = [
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
            '<path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z" fill="currentColor"/>',
            '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z" fill="currentColor"/>',
            '</svg>'
        ].join('');

        var field = $('<li class="menu__item selector" data-action="kkphim">' +
            '<div class="menu__ico">' + ico + '</div>' +
            '<div class="menu__text">KKPhim</div>' +
            '</li>');

        field.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKPhim',
                component: 'kkphim_main',
                page: 1
            });
        });

        // Thêm vào menu chính
        $('.menu .menu__list').eq(0).append(field);
    }

    // =============================================
    // KHỞI CHẠY
    // =============================================
    function startPlugin() {
        addStyles();
        addMenuItem();
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                startPlugin();
            }
        });
    }

    window.kkphim_plugin_v2 = true;

})();