(function () {
    'use strict';

    var network = new Lampa.Reguest();
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    var files = new Lampa.Explorer(scroll);
    var filter = new Lampa.Filter({});

    var API_BASE = 'https://phimapi.com';

    // ===================== SOURCE =====================
    var source = {
        name: 'kkkphim',
        title: 'KKKPhim',
        url: API_BASE,
        searchUrl: function (query) {
            return API_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=20';
        },
        categoryUrl: function (type, page) {
            if (type === 'phim-moi-cap-nhat') {
                return API_BASE + '/danh-sach/phim-moi-cap-nhat?page=' + page;
            }
            return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=20';
        },
        detailUrl: function (slug) {
            return API_BASE + '/phim/' + slug;
        }
    };

    // ===================== UTILS =====================
    var Utils = {
        imgProxy: function (url) {
            if (!url) return '';
            if (url.startsWith('http')) return url;
            return API_BASE + '/' + url;
        },
        toCard: function (item) {
            return {
                title: item.name || item.origin_name || '',
                original_title: item.origin_name || item.name || '',
                name: item.name || '',
                overview: item.content || item.description || '',
                img: Utils.imgProxy(item.poster_url || item.thumb_url || ''),
                background: Utils.imgProxy(item.thumb_url || item.poster_url || ''),
                year: item.year || 0,
                vote_average: item.tmdb ? (item.tmdb.vote_average || 0) : 0,
                slug: item.slug || '',
                quality: item.quality || '',
                lang: item.lang || '',
                episode_current: item.episode_current || '',
                type: item.type || '',
                kkkphim: true
            };
        }
    };

    // ===================== COMPONENT =====================
    function KKKComponent(object) {
        var comp = new Lampa.InteractionCategory(object);
        var last;
        var page = 1;
        var category_type = object.url || 'phim-moi-cap-nhat';

        comp.create = function () {
            this.activity.loader(true);
            this.loadData(1);
        };

        comp.loadData = function (pg) {
            var _this = this;
            var url = source.categoryUrl(category_type, pg);

            network.clear();
            network.timeout(15000);
            network.silent(url, function (data) {
                _this.activity.loader(false);

                var items = [];
                if (data.items) {
                    items = data.items;
                } else if (data.data && data.data.items) {
                    items = data.data.items;
                } else if (Array.isArray(data)) {
                    items = data;
                }

                var cards = items.map(Utils.toCard);

                if (cards.length) {
                    page = pg;
                    _this.build(cards);
                } else {
                    _this.empty();
                }
            }, function (error) {
                _this.activity.loader(false);
                _this.empty();
            });
        };

        comp.build = function (cards) {
            var _this = this;

            cards.forEach(function (card) {
                var element = Lampa.Template.get('card', {
                    title: card.title,
                    release_year: card.year
                });

                var img = element.find('.card__img')[0] || element.find('img')[0];
                if (img) {
                    if (img.tagName === 'IMG') {
                        img.src = card.img;
                    } else {
                        img.style.backgroundImage = 'url(' + card.img + ')';
                    }
                }

                // Badge quality
                if (card.quality) {
                    var qual = document.createElement('div');
                    qual.className = 'card__quality';
                    qual.textContent = card.quality;
                    element[0].querySelector('.card__view').appendChild(qual);
                }

                element.on('hover:enter', function () {
                    _this.openDetail(card);
                });

                scroll.append(element);
            });

            // Load more
            scroll.onEnd = function () {
                _this.loadData(page + 1);
            };
        };

        comp.openDetail = function (card) {
            Lampa.Activity.push({
                url: card.slug,
                component: 'kkkphim_detail',
                title: card.title,
                page: 1,
                card: card
            });
        };

        comp.empty = function () {
            var empty = Lampa.Template.get('list_empty');
            scroll.append(empty);
        };

        return comp;
    }

    // ===================== DETAIL COMPONENT =====================
    function KKKDetailComponent(object) {
        var network_detail = new Lampa.Reguest();
        var scroll_detail = new Lampa.Scroll({ mask: true, over: true });
        var activity = object.activity;
        var slug = object.url;
        var card = object.card || {};

        this.create = function () {
            var _this = this;
            activity.loader(true);

            var url = source.detailUrl(slug);

            network_detail.clear();
            network_detail.timeout(15000);
            network_detail.silent(url, function (data) {
                activity.loader(false);

                if (data && data.movie) {
                    _this.buildDetail(data.movie, data.episodes || []);
                } else if (data && data.status && data.movie) {
                    _this.buildDetail(data.movie, data.episodes || []);
                } else {
                    _this.empty();
                }
            }, function () {
                activity.loader(false);
                _this.empty();
            });
        };

        this.buildDetail = function (movie, episodes) {
            var _this = this;

            // Info header
            var info = document.createElement('div');
            info.className = 'kkkphim-detail';
            info.innerHTML = '\
                <div class="kkkphim-detail__poster">\
                    <img src="' + Utils.imgProxy(movie.poster_url || movie.thumb_url || '') + '" />\
                </div>\
                <div class="kkkphim-detail__info">\
                    <div class="kkkphim-detail__title">' + (movie.name || '') + '</div>\
                    <div class="kkkphim-detail__original">' + (movie.origin_name || '') + '</div>\
                    <div class="kkkphim-detail__meta">\
                        <span>' + (movie.year || '') + '</span>\
                        <span>' + (movie.quality || '') + '</span>\
                        <span>' + (movie.lang || '') + '</span>\
                        <span>' + (movie.episode_current || '') + '</span>\
                        <span>' + (movie.time || '') + '</span>\
                    </div>\
                    <div class="kkkphim-detail__desc">' + (movie.content || '') + '</div>\
                    <div class="kkkphim-detail__genres">' +
                        (movie.category || []).map(function (c) { return c.name; }).join(', ') +
                    '</div>\
                    <div class="kkkphim-detail__countries">' +
                        (movie.country || []).map(function (c) { return c.name; }).join(', ') +
                    '</div>\
                </div>';

            scroll_detail.append($(info));

            // Episodes
            if (episodes && episodes.length) {
                episodes.forEach(function (server) {
                    if (server.server_data && server.server_data.length) {
                        var serverTitle = document.createElement('div');
                        serverTitle.className = 'kkkphim-server-title';
                        serverTitle.textContent = server.server_name || 'Server';
                        scroll_detail.append($(serverTitle));

                        var epList = document.createElement('div');
                        epList.className = 'kkkphim-episodes';

                        server.server_data.forEach(function (ep) {
                            var btn = document.createElement('div');
                            btn.className = 'selector kkkphim-episode-btn';
                            btn.textContent = ep.name || ep.slug || 'Tập';
                            btn.setAttribute('tabindex', '0');

                            btn.addEventListener('click', function () {
                                _this.play(ep, movie);
                            });

                            // For Lampa focus system
                            $(btn).on('hover:enter', function () {
                                _this.play(ep, movie);
                            });

                            epList.appendChild(btn);
                        });

                        scroll_detail.append($(epList));
                    }
                });
            }

            activity.toggle();
        };

        this.play = function (ep, movie) {
            var videoUrl = ep.link_m3u8 || ep.link_embed || '';

            if (!videoUrl) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            // If it's m3u8 direct link
            if (videoUrl.indexOf('.m3u8') !== -1) {
                var playerData = {
                    title: (movie.name || '') + ' - ' + (ep.name || ''),
                    url: videoUrl,
                    quality: {},
                    timeline: {}
                };

                // Try to set qualities
                playerData.quality['auto'] = videoUrl;

                Lampa.Player.play(playerData);
                Lampa.Player.playlist([playerData]);
            } else {
                // Embed link - open in iframe or try to extract
                Lampa.Noty.show('Đang mở embed...');

                // Try opening embed
                window.open(videoUrl, '_blank');
            }
        };

        this.empty = function () {
            var empty = Lampa.Template.get('list_empty');
            scroll_detail.append(empty);
            activity.toggle();
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== this.activity) return;
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };

        this.render = function () {
            return scroll_detail.render();
        };

        this.destroy = function () {
            network_detail.clear();
            scroll_detail.destroy();
        };
    }

    // ===================== SEARCH =====================
    function KKKSearch(object, data) {
        var network_search = new Lampa.Reguest();

        this.search = function (query, callback) {
            var url = source.searchUrl(query);

            network_search.clear();
            network_search.timeout(10000);
            network_search.silent(url, function (resp) {
                var items = [];
                if (resp && resp.data && resp.data.items) {
                    items = resp.data.items;
                } else if (resp && resp.items) {
                    items = resp.items;
                }

                var cards = items.map(Utils.toCard);
                callback(cards);
            }, function () {
                callback([]);
            });
        };
    }

    // ===================== MENU / CATEGORIES =====================
    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'phim-moi-cap-nhat' },
        { title: 'Phim Lẻ', url: 'phim-le' },
        { title: 'Phim Bộ', url: 'phim-bo' },
        { title: 'Hoạt Hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' },
        { title: 'Phim Vietsub', url: 'phim-vietsub' },
        { title: 'Phim Thuyết Minh', url: 'phim-thuyet-minh' },
        { title: 'Phim Lồng Tiếng', url: 'phim-long-tieng' }
    ];

    // ===================== CSS STYLES =====================
    function addStyles() {
        if (document.getElementById('kkkphim-styles')) return;

        var style = document.createElement('style');
        style.id = 'kkkphim-styles';
        style.textContent = '\
            .kkkphim-detail {\
                display: flex;\
                padding: 1.5em;\
                gap: 1.5em;\
            }\
            .kkkphim-detail__poster {\
                flex-shrink: 0;\
                width: 200px;\
            }\
            .kkkphim-detail__poster img {\
                width: 100%;\
                border-radius: 0.5em;\
            }\
            .kkkphim-detail__info {\
                flex: 1;\
            }\
            .kkkphim-detail__title {\
                font-size: 2em;\
                font-weight: bold;\
                margin-bottom: 0.2em;\
                color: #fff;\
            }\
            .kkkphim-detail__original {\
                font-size: 1.2em;\
                color: #999;\
                margin-bottom: 0.5em;\
            }\
            .kkkphim-detail__meta {\
                display: flex;\
                gap: 1em;\
                flex-wrap: wrap;\
                margin-bottom: 0.8em;\
                color: #ccc;\
            }\
            .kkkphim-detail__meta span {\
                background: rgba(255,255,255,0.1);\
                padding: 0.2em 0.6em;\
                border-radius: 0.3em;\
                font-size: 0.9em;\
            }\
            .kkkphim-detail__desc {\
                color: #bbb;\
                line-height: 1.5;\
                margin-bottom: 0.8em;\
                max-height: 6em;\
                overflow: hidden;\
            }\
            .kkkphim-detail__genres,\
            .kkkphim-detail__countries {\
                color: #888;\
                font-size: 0.9em;\
                margin-bottom: 0.3em;\
            }\
            .kkkphim-server-title {\
                font-size: 1.3em;\
                font-weight: bold;\
                color: #fff;\
                padding: 0.8em 1.5em 0.3em;\
            }\
            .kkkphim-episodes {\
                display: flex;\
                flex-wrap: wrap;\
                gap: 0.5em;\
                padding: 0.5em 1.5em;\
            }\
            .kkkphim-episode-btn {\
                background: rgba(255,255,255,0.12);\
                color: #fff;\
                padding: 0.5em 1.2em;\
                border-radius: 0.4em;\
                cursor: pointer;\
                font-size: 1em;\
                transition: background 0.2s;\
                min-width: 60px;\
                text-align: center;\
            }\
            .kkkphim-episode-btn:hover,\
            .kkkphim-episode-btn.focus {\
                background: rgba(255,165,0,0.7);\
            }\
            .card__quality {\
                position: absolute;\
                top: 0.3em;\
                right: 0.3em;\
                background: rgba(255,165,0,0.85);\
                color: #fff;\
                font-size: 0.7em;\
                padding: 0.15em 0.5em;\
                border-radius: 0.3em;\
                font-weight: bold;\
            }\
            .kkkphim-menu-item {\
                padding: 0.8em 1.2em;\
                font-size: 1.1em;\
                cursor: pointer;\
                color: #fff;\
            }\
            .kkkphim-menu-item.focus,\
            .kkkphim-menu-item:hover {\
                background: rgba(255,165,0,0.5);\
                border-radius: 0.3em;\
            }\
        ';
        document.head.appendChild(style);
    }

    // ===================== MAIN COMPONENT (CATALOG) =====================
    function KKKCatalogComponent(object) {
        var scroll_cat = new Lampa.Scroll({ mask: true, over: true });
        var network_cat = new Lampa.Reguest();
        var activity = object.activity;
        var page = 1;
        var category_url = object.url || 'phim-moi-cap-nhat';
        var loading = false;

        this.create = function () {
            this.loadPage(1);
        };

        this.loadPage = function (pg) {
            var _this = this;
            if (loading) return;
            loading = true;
            activity.loader(true);

            var url = source.categoryUrl(category_url, pg);

            network_cat.clear();
            network_cat.timeout(15000);
            network_cat.silent(url, function (data) {
                activity.loader(false);
                loading = false;

                var items = [];
                if (data && data.items) {
                    items = data.items;
                } else if (data && data.data && data.data.items) {
                    items = data.data.items;
                }

                var cards = items.map(Utils.toCard);
                page = pg;

                if (cards.length) {
                    _this.buildCards(cards);
                    activity.toggle();
                } else if (pg === 1) {
                    _this.empty();
                    activity.toggle();
                }
            }, function () {
                activity.loader(false);
                loading = false;
                if (pg === 1) {
                    _this.empty();
                }
                activity.toggle();
            });
        };

        this.buildCards = function (cards) {
            var _this = this;
            var grid = document.createElement('div');
            grid.style.display = 'flex';
            grid.style.flexWrap = 'wrap';
            grid.style.gap = '1em';
            grid.style.padding = '1em';

            cards.forEach(function (card) {
                var item = document.createElement('div');
                item.className = 'selector card-item';
                item.setAttribute('tabindex', '0');
                item.style.width = '160px';
                item.style.cursor = 'pointer';

                item.innerHTML = '\
                    <div style="position:relative;border-radius:0.5em;overflow:hidden;">\
                        <img src="' + card.img + '" style="width:100%;height:230px;object-fit:cover;" onerror="this.src=\'https://via.placeholder.com/160x230?text=No+Image\'" />\
                        ' + (card.quality ? '<div class="card__quality">' + card.quality + '</div>' : '') + '\
                        ' + (card.episode_current ? '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:#fff;font-size:0.75em;padding:0.2em 0.4em;text-align:center;">' + card.episode_current + '</div>' : '') + '\
                    </div>\
                    <div style="color:#fff;font-size:0.9em;margin-top:0.4em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + card.title + '</div>\
                    <div style="color:#888;font-size:0.75em;">' + (card.year || '') + '</div>';

                $(item).on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: card.slug,
                        component: 'kkkphim_detail',
                        title: card.title,
                        page: 1,
                        card: card
                    });
                });

                grid.appendChild(item);
            });

            scroll_cat.append($(grid));

            // Infinite scroll
            scroll_cat.onEnd = function () {
                _this.loadPage(page + 1);
            };
        };

        this.empty = function () {
            var empty = Lampa.Template.get('list_empty');
            scroll_cat.append(empty);
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== activity) return;
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };

        this.render = function () {
            return scroll_cat.render();
        };

        this.destroy = function () {
            network_cat.clear();
            scroll_cat.destroy();
        };
    }

    // ===================== MAIN MENU COMPONENT =====================
    function KKKMainComponent(object) {
        var scroll_main = new Lampa.Scroll({ mask: true, over: true });
        var activity = object.activity;

        this.create = function () {
            var _this = this;

            var container = document.createElement('div');
            container.style.padding = '1em';

            // Title
            var title = document.createElement('div');
            title.style.fontSize = '2em';
            title.style.fontWeight = 'bold';
            title.style.color = '#fff';
            title.style.marginBottom = '0.8em';
            title.style.textAlign = 'center';
            title.textContent = '🎬 KKKPhim';
            container.appendChild(title);

            var subtitle = document.createElement('div');
            subtitle.style.color = '#999';
            subtitle.style.marginBottom = '1.5em';
            subtitle.style.textAlign = 'center';
            subtitle.textContent = 'Xem phim miễn phí chất lượng cao';
            container.appendChild(subtitle);

            // Category buttons
            categories.forEach(function (cat) {
                var btn = document.createElement('div');
                btn.className = 'selector kkkphim-menu-item';
                btn.setAttribute('tabindex', '0');
                btn.textContent = cat.title;

                $(btn).on('hover:enter', function () {
                    Lampa.Activity.push({
                        url: cat.url,
                        component: 'kkkphim_catalog',
                        title: cat.title,
                        page: 1
                    });
                });

                container.appendChild(btn);
            });

            scroll_main.append($(container));
            activity.toggle();
        };

        this.start = function () {
            if (Lampa.Activity.active().activity !== activity) return;
            this.create();
        };

        this.pause = function () { };
        this.stop = function () { };

        this.render = function () {
            return scroll_main.render();
        };

        this.destroy = function () {
            scroll_main.destroy();
        };
    }

    // ===================== SEARCH INTEGRATION =====================
    function startSearchPlugin() {
        // Hook into Lampa search
        if (Lampa.Listener) {
            Lampa.Listener.follow('search', function (e) {
                if (e.type === 'start') {
                    var query = e.query || '';
                    if (!query) return;

                    var searcher = new KKKSearch();
                    searcher.search(query, function (cards) {
                        if (cards.length) {
                            // Add results to search
                            e.result && e.result('kkkphim', {
                                title: 'KKKPhim',
                                results: cards.map(function (card) {
                                    return {
                                        title: card.title,
                                        original_title: card.original_title,
                                        img: card.img,
                                        year: card.year,
                                        vote_average: card.vote_average,
                                        slug: card.slug,
                                        quality: card.quality,
                                        kkkphim: true,
                                        onClick: function () {
                                            Lampa.Activity.push({
                                                url: card.slug,
                                                component: 'kkkphim_detail',
                                                title: card.title,
                                                page: 1,
                                                card: card
                                            });
                                        }
                                    };
                                })
                            });
                        }
                    });
                }
            });
        }
    }

    // ===================== ONLINE MOVIE SOURCE (for player integration) =====================
    function KKKOnline(component, object) {
        var network_online = new Lampa.Reguest();
        var loaded = {};

        this.search = function (card, params) {
            var _this = this;

            if (!card || (!card.title && !card.name)) {
                component.emptyForQuery(Lampa.Lang.translate('title_not_found'));
                return;
            }

            var query = card.title || card.name || card.original_title || '';
            var url = source.searchUrl(query);

            network_online.clear();
            network_online.timeout(10000);
            network_online.silent(url, function (resp) {
                var items = [];
                if (resp && resp.data && resp.data.items) {
                    items = resp.data.items;
                } else if (resp && resp.items) {
                    items = resp.items;
                }

                if (items.length === 0) {
                    component.emptyForQuery(query);
                    return;
                }

                var results = items.map(function (item) {
                    return {
                        title: item.name + (item.origin_name ? ' (' + item.origin_name + ')' : ''),
                        slug: item.slug,
                        quality: item.quality || '',
                        year: item.year || '',
                        episode_current: item.episode_current || '',
                        lang: item.lang || ''
                    };
                });

                var filterItems = results.map(function (r, i) {
                    return { title: r.title, slug: r.slug, index: i };
                });

                // Show list of found movies
                _this.showResults(results);

            }, function () {
                component.emptyForQuery(query);
            });
        };

        this.showResults = function (results) {
            var _this = this;
            var items = [];

            results.forEach(function (result) {
                var badge = [];
                if (result.quality) badge.push(result.quality);
                if (result.lang) badge.push(result.lang);
                if (result.year) badge.push(result.year);
                if (result.episode_current) badge.push(result.episode_current);

                items.push({
                    title: result.title,
                    badge: badge.join(' | '),
                    slug: result.slug,
                    onClick: function () {
                        _this.loadEpisodes(result.slug);
                    }
                });
            });

            component.reset();

            items.forEach(function (item) {
                var elem = $('<div class="selector source-item">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                    '<span>' + item.title + '</span>' +
                    '<span style="color:#999;font-size:0.8em;">' + item.badge + '</span>' +
                    '</div></div>');

                elem.on('hover:enter', item.onClick);
                component.append(elem);
            });

            component.start(true);
        };

        this.loadEpisodes = function (slug) {
            var _this = this;
            var url = source.detailUrl(slug);

            component.reset();
            component.loader(true);

            network_online.clear();
            network_online.timeout(15000);
            network_online.silent(url, function (data) {
                component.loader(false);

                if (!data || !data.episodes || data.episodes.length === 0) {
                    component.emptyForQuery(slug);
                    return;
                }

                var movie = data.movie || {};
                var episodes = data.episodes || [];

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    var serverElem = $('<div class="source-server">' +
                        '<div style="font-weight:bold;padding:0.5em;color:#ffaa00;">' +
                        (server.server_name || 'Server') + '</div></div>');

                    component.append(serverElem);

                    server.server_data.forEach(function (ep) {
                        var epElem = $('<div class="selector source-episode">' +
                            '<span>📺 ' + (ep.name || ep.slug || 'Tập') + '</span>' +
                            '</div>');

                        epElem.on('hover:enter', function () {
                            _this.playEpisode(ep, movie);
                        });

                        component.append(epElem);
                    });
                });

                component.start(true);

            }, function () {
                component.loader(false);
                component.emptyForQuery(slug);
            });
        };

        this.playEpisode = function (ep, movie) {
            var videoUrl = ep.link_m3u8 || ep.link_embed || '';

            if (!videoUrl) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            if (videoUrl.indexOf('.m3u8') !== -1) {
                var playerItem = {
                    title: (movie.name || 'KKKPhim') + ' - ' + (ep.name || ''),
                    url: videoUrl,
                    quality: { 'auto': videoUrl },
                    subtitles: []
                };

                Lampa.Player.play(playerItem);
                Lampa.Player.playlist([playerItem]);
            } else {
                // Embed fallback
                Lampa.Noty.show('Link embed: ' + videoUrl);
            }
        };

        this.destroy = function () {
            network_online.clear();
        };
    }

    // ===================== REGISTER PLUGIN =====================
    function initPlugin() {
        addStyles();

        // Register components
        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);

        // Add menu button
        var menuItem = $('<li class="menu__item selector" data-action="kkkphim">\
            <div class="menu__ico">\
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\
                    <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/>\
                    <path d="M10 9l5 3-5 3V9z" fill="currentColor"/>\
                </svg>\
            </div>\
            <div class="menu__text">KKKPhim</div>\
        </li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                component: 'kkkphim_main',
                title: 'KKKPhim',
                page: 1
            });
        });

        // Insert into menu
        var menuList = $('.menu .menu__list');
        if (menuList.length) {
            menuList.eq(0).append(menuItem);
        }

        // Register as online source for player
        if (Lampa.Api && Lampa.Api.sources) {
            Lampa.Api.sources.kkkphim = KKKOnline;

            // Add to source selector
            var sources = Lampa.Params.values && Lampa.Params.values.source ?
                Lampa.Params.values.source : {};
            sources['kkkphim'] = 'KKKPhim';

            if (Lampa.Params.select) {
                Lampa.Params.select('source', sources, 'tmdb');
            }
        }

        // Search integration
        startSearchPlugin();

        Lampa.Noty.show('Plugin KKKPhim đã được tải thành công! 🎬');
    }

    // ===================== BOOT =====================
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                initPlugin();
            }
        });
    }

})();