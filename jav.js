(function () {
    'use strict';

    var KKPhim = {
        name: 'KKPhim',
        version: '2.0.0',
        api_base: 'https://phimapi.com',
        img_base: 'https://phimimg.com',

        // ==================== NETWORK ====================
        request: function (url, callback, errorCallback) {
            var full_url = url.indexOf('http') === 0 ? url : this.api_base + url;
            $.ajax({
                url: full_url,
                method: 'GET',
                timeout: 15000,
                headers: {
                    'Accept': 'application/json'
                },
                success: function (data) {
                    if (typeof data === 'string') {
                        try { data = JSON.parse(data); } catch (e) { }
                    }
                    callback(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    if (errorCallback) errorCallback({ status: jqXHR.status, statusText: textStatus });
                }
            });
        },

        // ==================== IMAGE HELPERS ====================
        getImageUrl: function (path) {
            if (!path) return '';
            if (path.indexOf('http') === 0) return path;
            return this.img_base + '/' + path.replace(/^\//, '');
        },

        getPosterUrl: function (item) {
            return this.getImageUrl(item.poster_url || item.thumb_url || '');
        },

        getBackdropUrl: function (item) {
            return this.getImageUrl(item.thumb_url || item.poster_url || '');
        },

        // ==================== DATA MAPPING ====================
        mapCard: function (item) {
            return {
                id: 'kkphim_' + (item.slug || item._id),
                title: item.name || '',
                original_title: item.origin_name || '',
                overview: item.content || '',
                release_date: item.year ? item.year + '' : '',
                vote_average: item.tmdb ? (item.tmdb.vote_average || 0) : 0,
                poster: this.getPosterUrl(item),
                backdrop: this.getBackdropUrl(item),
                slug: item.slug,
                quality: item.quality || '',
                lang: item.lang || '',
                episode_current: item.episode_current || '',
                type: item.type || '',
                year: item.year || '',
                category: item.category || [],
                country: item.country || [],
                kkphim: true
            };
        },

        mapCards: function (items) {
            var self = this;
            return (items || []).map(function (item) {
                return self.mapCard(item);
            });
        },

        // ==================== SOURCE COMPONENT ====================
        sourceComponent: function () {
            var self = this;

            Lampa.Component.add('kkphim_main', function (object) {
                var comp = new Lampa.InteractionCategory(object);
                var network = new Lampa.Reguest();
                var scroll = comp.scroll;
                var content = comp.content;
                var active = 0;

                var categories = [
                    { title: '🔥 Phim Mới Cập Nhật', url: '/danh-sach/phim-moi-cap-nhat?page=1', isNew: true },
                    { title: '🎬 Phim Lẻ', url: '/v1/api/danh-sach/phim-le?page=1' },
                    { title: '📺 Phim Bộ', url: '/v1/api/danh-sach/phim-bo?page=1' },
                    { title: '🎨 Hoạt Hình', url: '/v1/api/danh-sach/hoat-hinh?page=1' },
                    { title: '📡 TV Shows', url: '/v1/api/danh-sach/tv-shows?page=1' },
                    { title: '🇺🇸 Phim Âu Mỹ', url: '/v1/api/quoc-gia/au-my?page=1' },
                    { title: '🇰🇷 Phim Hàn Quốc', url: '/v1/api/quoc-gia/han-quoc?page=1' },
                    { title: '🇯🇵 Phim Nhật Bản', url: '/v1/api/quoc-gia/nhat-ban?page=1' },
                    { title: '🇨🇳 Phim Trung Quốc', url: '/v1/api/quoc-gia/trung-quoc?page=1' },
                    { title: '🇹🇭 Phim Thái Lan', url: '/v1/api/quoc-gia/thai-lan?page=1' },
                    { title: '💥 Hành Động', url: '/v1/api/the-loai/hanh-dong?page=1' },
                    { title: '😂 Hài Hước', url: '/v1/api/the-loai/hai-huoc?page=1' },
                    { title: '💕 Tình Cảm', url: '/v1/api/the-loai/tinh-cam?page=1' },
                    { title: '👻 Kinh Dị', url: '/v1/api/the-loai/kinh-di?page=1' },
                    { title: '🔬 Viễn Tưởng', url: '/v1/api/the-loai/vien-tuong?page=1' }
                ];

                comp.create = function () {
                    this.activity.loader(true);
                    this.buildCategories();
                };

                comp.buildCategories = function () {
                    var loaded = 0;
                    var total = categories.length;
                    var _this = this;

                    categories.forEach(function (cat, index) {
                        self.request(cat.url, function (data) {
                            var items = [];
                            if (cat.isNew) {
                                items = data.items || [];
                            } else {
                                items = (data.data && data.data.items) ? data.data.items : [];
                            }

                            if (items.length > 0) {
                                var mapped = self.mapCards(items.slice(0, 12));
                                _this.buildRow(cat.title, mapped, index, cat.url);
                            }

                            loaded++;
                            if (loaded >= Math.min(3, total)) {
                                _this.activity.loader(false);
                                _this.activity.toggle();
                            }
                        }, function () {
                            loaded++;
                            if (loaded >= Math.min(3, total)) {
                                _this.activity.loader(false);
                                _this.activity.toggle();
                            }
                        });
                    });
                };

                comp.buildRow = function (title, items, index, url) {
                    if (!items || items.length === 0) return;

                    var row = $('<div class="kkphim-row"></div>');
                    var row_title = $('<div class="kkphim-row__title">' + title + '</div>');
                    var row_line = $('<div class="kkphim-row__line"></div>');

                    row.append(row_title);
                    row.append(row_line);

                    items.forEach(function (card) {
                        var card_el = self.createPosterCard(card);
                        row_line.append(card_el);
                    });

                    // Insert in order
                    var rows = content.find('.kkphim-row');
                    var inserted = false;
                    rows.each(function () {
                        var rowIndex = parseInt($(this).attr('data-index'));
                        if (index < rowIndex) {
                            $(this).before(row);
                            row.attr('data-index', index);
                            inserted = true;
                            return false;
                        }
                    });
                    if (!inserted) {
                        content.append(row);
                        row.attr('data-index', index);
                    }

                    scroll.update();
                };

                comp.background = function (item) {
                    // Do nothing for background
                };

                return comp;
            });
        },

        // ==================== POSTER CARD ====================
        createPosterCard: function (card) {
            var self = this;
            var poster_url = card.poster || '';
            var quality = card.quality || '';
            var lang = card.lang || '';
            var episode = card.episode_current || '';

            var el = $('\
                <div class="kkphim-card selector" data-slug="' + card.slug + '">\
                    <div class="kkphim-card__poster-wrap">\
                        <div class="kkphim-card__poster">\
                            <img class="kkphim-card__img" />\
                        </div>\
                        ' + (quality ? '<div class="kkphim-card__quality">' + quality + '</div>' : '') + '\
                        ' + (episode ? '<div class="kkphim-card__episode">' + episode + '</div>' : '') + '\
                        ' + (lang ? '<div class="kkphim-card__lang">' + lang + '</div>' : '') + '\
                    </div>\
                    <div class="kkphim-card__title">' + (card.title || '') + '</div>\
                    <div class="kkphim-card__original">' + (card.original_title || '') + '</div>\
                </div>\
            ');

            // Lazy load image
            var img = el.find('.kkphim-card__img');
            if (poster_url) {
                img.attr('src', poster_url);
                img.on('error', function () {
                    $(this).attr('src', './img/img_broken.svg');
                });
            } else {
                img.attr('src', './img/img_broken.svg');
            }

            el.on('hover:enter', function () {
                self.openDetail(card.slug);
            });

            el.on('hover:focus', function () {
                scroll && scroll.update(el, true);
            });

            return el;
        },

        // ==================== DETAIL PAGE ====================
        openDetail: function (slug) {
            var self = this;
            Lampa.Loading.start();

            self.request('/phim/' + slug, function (data) {
                Lampa.Loading.stop();

                if (!data || !data.movie) {
                    Lampa.Noty.show('Không tìm thấy thông tin phim');
                    return;
                }

                var movie = data.movie;
                var episodes = data.episodes || [];

                self.showInfoCard(movie, episodes);
            }, function () {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi khi tải thông tin phim');
            });
        },

        showInfoCard: function (movie, episodes) {
            var self = this;

            var backdrop_url = self.getBackdropUrl(movie);
            var poster_url = self.getPosterUrl(movie);
            var year = movie.year || '';
            var quality = movie.quality || '';
            var lang = movie.lang || '';
            var duration = movie.time || '';
            var ep_current = movie.episode_current || '';
            var ep_total = movie.episode_total || '';
            var rating = movie.tmdb ? (movie.tmdb.vote_average || '') : '';
            var categories = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countries = (movie.country || []).map(function (c) { return c.name; }).join(', ');
            var actors = (movie.actor || []).join(', ');
            var directors = (movie.director || []).join(', ');
            var content = (movie.content || '').replace(/<[^>]*>/g, '');

            // Create activity for detail view
            var activity = {
                url: '',
                title: movie.name,
                component: 'kkphim_detail',
                movie: movie,
                episodes: episodes,
                page: 1
            };

            // Build the full detail page
            var html = $('\
                <div class="kkphim-detail">\
                    <div class="kkphim-detail__backdrop">\
                        <img class="kkphim-detail__backdrop-img" />\
                        <div class="kkphim-detail__backdrop-gradient"></div>\
                    </div>\
                    <div class="kkphim-detail__content">\
                        <div class="kkphim-detail__left">\
                            <div class="kkphim-detail__poster-wrap">\
                                <img class="kkphim-detail__poster-img" />\
                            </div>\
                        </div>\
                        <div class="kkphim-detail__right">\
                            <div class="kkphim-detail__title">' + (movie.name || '') + '</div>\
                            <div class="kkphim-detail__original-title">' + (movie.origin_name || '') + '</div>\
                            <div class="kkphim-detail__meta">\
                                ' + (year ? '<span class="kkphim-detail__meta-item"><span class="kkphim-detail__meta-icon">📅</span> ' + year + '</span>' : '') + '\
                                ' + (quality ? '<span class="kkphim-detail__meta-item kkphim-detail__meta-quality">' + quality + '</span>' : '') + '\
                                ' + (lang ? '<span class="kkphim-detail__meta-item kkphim-detail__meta-lang">' + lang + '</span>' : '') + '\
                                ' + (duration ? '<span class="kkphim-detail__meta-item"><span class="kkphim-detail__meta-icon">⏱</span> ' + duration + '</span>' : '') + '\
                                ' + (rating ? '<span class="kkphim-detail__meta-item kkphim-detail__meta-rating">⭐ ' + parseFloat(rating).toFixed(1) + '</span>' : '') + '\
                                ' + (ep_current ? '<span class="kkphim-detail__meta-item"><span class="kkphim-detail__meta-icon">📺</span> ' + ep_current + (ep_total ? '/' + ep_total : '') + '</span>' : '') + '\
                            </div>\
                            ' + (categories ? '<div class="kkphim-detail__info-row"><span class="kkphim-detail__label">Thể loại:</span> ' + categories + '</div>' : '') + '\
                            ' + (countries ? '<div class="kkphim-detail__info-row"><span class="kkphim-detail__label">Quốc gia:</span> ' + countries + '</div>' : '') + '\
                            ' + (directors ? '<div class="kkphim-detail__info-row"><span class="kkphim-detail__label">Đạo diễn:</span> ' + directors + '</div>' : '') + '\
                            ' + (actors ? '<div class="kkphim-detail__info-row kkphim-detail__actors"><span class="kkphim-detail__label">Diễn viên:</span> ' + actors + '</div>' : '') + '\
                            <div class="kkphim-detail__overview">' + content + '</div>\
                            <div class="kkphim-detail__buttons">\
                                <div class="kkphim-detail__btn kkphim-detail__btn-play selector">▶ Xem Phim</div>\
                                <div class="kkphim-detail__btn kkphim-detail__btn-back selector">↩ Quay Lại</div>\
                            </div>\
                        </div>\
                    </div>\
                    <div class="kkphim-detail__episodes"></div>\
                </div>\
            ');

            // Set images
            if (backdrop_url) {
                html.find('.kkphim-detail__backdrop-img').attr('src', backdrop_url);
            }
            if (poster_url) {
                html.find('.kkphim-detail__poster-img').attr('src', poster_url);
            }

            // Build episodes
            if (episodes && episodes.length > 0) {
                var ep_container = html.find('.kkphim-detail__episodes');
                episodes.forEach(function (server, si) {
                    var server_data = server.server_data || [];
                    if (server_data.length === 0) return;

                    var server_title = $('<div class="kkphim-detail__server-title">' + (server.server_name || 'Server ' + (si + 1)) + '</div>');
                    var ep_grid = $('<div class="kkphim-detail__ep-grid"></div>');

                    server_data.forEach(function (ep) {
                        var ep_name = ep.name || '';
                        var ep_slug = ep.slug || '';
                        var ep_link = ep.link_m3u8 || ep.link_embed || '';

                        var ep_btn = $('<div class="kkphim-detail__ep-btn selector" data-link="' + ep_link + '">' + ep_name + '</div>');

                        ep_btn.on('hover:enter', function () {
                            var link = $(this).data('link');
                            if (link) {
                                self.playVideo(link, movie.name + ' - ' + ep_name, poster_url);
                            } else {
                                Lampa.Noty.show('Không tìm thấy link phim');
                            }
                        });

                        ep_grid.append(ep_btn);
                    });

                    ep_container.append(server_title);
                    ep_container.append(ep_grid);
                });
            }

            // Button events
            html.find('.kkphim-detail__btn-play').on('hover:enter', function () {
                // Play first episode
                if (episodes && episodes.length > 0) {
                    var firstServer = episodes[0];
                    var firstEp = firstServer.server_data && firstServer.server_data[0];
                    if (firstEp) {
                        var link = firstEp.link_m3u8 || firstEp.link_embed || '';
                        if (link) {
                            self.playVideo(link, movie.name, poster_url);
                        }
                    }
                }
            });

            html.find('.kkphim-detail__btn-back').on('hover:enter', function () {
                Lampa.Activity.backward();
            });

            // Show as modal/full page
            Lampa.Activity.push({
                url: '',
                title: movie.name,
                component: 'kkphim_detail_view',
                movie: movie,
                episodes: episodes,
                html: html
            });
        },

        // ==================== PLAYER ====================
        playVideo: function (url, title, poster) {
            if (!url) {
                Lampa.Noty.show('Không có link phát');
                return;
            }

            // Check if it's m3u8
            if (url.indexOf('.m3u8') !== -1) {
                Lampa.Player.play({
                    title: title || '',
                    url: url,
                    poster: poster || '',
                    subtitles: []
                });

                Lampa.Player.callback(function () {
                    // Player closed
                });
            } else {
                // Embed link - open in player or external
                Lampa.Player.play({
                    title: title || '',
                    url: url,
                    poster: poster || ''
                });
            }
        },

        // ==================== SEARCH ====================
        initSearch: function () {
            var self = this;

            // Add search source
            if (Lampa.Manifest && Lampa.Manifest.plugins) {
                // Alternative search integration
            }

            // Component for search results
            Lampa.Component.add('kkphim_search', function (object) {
                var comp = new Lampa.InteractionCategory(object);
                var scroll = comp.scroll;
                var content = comp.content;

                comp.create = function () {
                    this.activity.loader(true);
                    var query = object.search || object.query || '';
                    if (!query) {
                        this.activity.loader(false);
                        this.activity.toggle();
                        return;
                    }

                    self.request('/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=20', function (data) {
                        comp.activity.loader(false);

                        var items = (data.data && data.data.items) ? data.data.items : [];
                        if (items.length === 0) {
                            comp.emptyCard();
                            return;
                        }

                        var mapped = self.mapCards(items);
                        mapped.forEach(function (card) {
                            var card_el = self.createPosterCard(card);
                            content.append(card_el);
                        });

                        scroll.update();
                        comp.activity.toggle();
                    }, function () {
                        comp.activity.loader(false);
                        comp.emptyCard();
                    });
                };

                comp.emptyCard = function () {
                    var empty = $('<div class="kkphim-empty">Không tìm thấy phim nào</div>');
                    content.append(empty);
                    scroll.update();
                    comp.activity.toggle();
                };

                return comp;
            });
        },

        // ==================== DETAIL VIEW COMPONENT ====================
        initDetailComponent: function () {
            var self = this;

            Lampa.Component.add('kkphim_detail_view', function (object) {
                var comp = new Lampa.InteractionCategory(object);
                var scroll = comp.scroll;
                var content = comp.content;

                comp.create = function () {
                    this.activity.loader(false);

                    if (object.html) {
                        content.append(object.html);
                    }

                    scroll.update();
                    this.activity.toggle();
                };

                return comp;
            });
        },

        // ==================== MENU ====================
        addMenu: function () {
            var self = this;
            var ico = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8H2V20C2 21.1 2.9 22 4 22H16V20H4V8Z" fill="currentColor"/><path d="M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H8V4H20V16Z" fill="currentColor"/><path d="M12 5.5V14.5L18 10L12 5.5Z" fill="currentColor"/></svg>';

            // Add to main menu
            var menu_item = $('<li class="menu__item selector" data-action="kkphim">\
                <div class="menu__ico">' + ico + '</div>\
                <div class="menu__text">KKPhim</div>\
            </li>');

            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim_main',
                    page: 1
                });
            });

            // Insert after existing menu items
            $('.menu .menu__list').eq(0).append(menu_item);

            // Add search integration
            if (Lampa.Search) {
                var original = Lampa.Search;
                // Hook into search if possible
            }
        },

        // ==================== STYLES ====================
        addStyles: function () {
            var css = '\
                /* ==================== ROW STYLES ==================== */\
                .kkphim-row {\
                    padding: 1.5em 1.5em 0;\
                }\
                .kkphim-row__title {\
                    font-size: 1.4em;\
                    font-weight: 700;\
                    color: #fff;\
                    margin-bottom: 0.8em;\
                    padding-left: 0.2em;\
                    letter-spacing: 0.02em;\
                }\
                .kkphim-row__line {\
                    display: flex;\
                    flex-wrap: nowrap;\
                    overflow-x: auto;\
                    gap: 0.8em;\
                    padding-bottom: 0.5em;\
                    -ms-overflow-style: none;\
                    scrollbar-width: none;\
                }\
                .kkphim-row__line::-webkit-scrollbar {\
                    display: none;\
                }\
                \
                /* ==================== CARD STYLES ==================== */\
                .kkphim-card {\
                    flex: 0 0 auto;\
                    width: 12em;\
                    cursor: pointer;\
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;\
                    position: relative;\
                    border-radius: 0.8em;\
                }\
                .kkphim-card.focus {\
                    transform: scale(1.08);\
                    z-index: 5;\
                }\
                .kkphim-card__poster-wrap {\
                    position: relative;\
                    border-radius: 0.8em;\
                    overflow: hidden;\
                    background: #1a1a2e;\
                    aspect-ratio: 2/3;\
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4);\
                    transition: box-shadow 0.3s ease;\
                }\
                .kkphim-card.focus .kkphim-card__poster-wrap {\
                    box-shadow: 0 0 0 3px #e50914, 0 8px 30px rgba(229,9,20,0.4);\
                }\
                .kkphim-card__poster {\
                    width: 100%;\
                    height: 100%;\
                    position: relative;\
                }\
                .kkphim-card__img {\
                    width: 100%;\
                    height: 100%;\
                    object-fit: cover;\
                    display: block;\
                    transition: transform 0.5s ease;\
                }\
                .kkphim-card.focus .kkphim-card__img {\
                    transform: scale(1.05);\
                }\
                .kkphim-card__quality {\
                    position: absolute;\
                    top: 0.5em;\
                    left: 0.5em;\
                    background: linear-gradient(135deg, #e50914, #b20710);\
                    color: #fff;\
                    font-size: 0.7em;\
                    font-weight: 700;\
                    padding: 0.2em 0.6em;\
                    border-radius: 0.4em;\
                    text-transform: uppercase;\
                    letter-spacing: 0.05em;\
                    box-shadow: 0 2px 8px rgba(229,9,20,0.4);\
                }\
                .kkphim-card__episode {\
                    position: absolute;\
                    top: 0.5em;\
                    right: 0.5em;\
                    background: linear-gradient(135deg, #00b4d8, #0077b6);\
                    color: #fff;\
                    font-size: 0.6em;\
                    font-weight: 600;\
                    padding: 0.2em 0.5em;\
                    border-radius: 0.4em;\
                    max-width: 60%;\
                    overflow: hidden;\
                    text-overflow: ellipsis;\
                    white-space: nowrap;\
                }\
                .kkphim-card__lang {\
                    position: absolute;\
                    bottom: 0.5em;\
                    left: 0.5em;\
                    background: rgba(0,0,0,0.75);\
                    backdrop-filter: blur(4px);\
                    color: #ccc;\
                    font-size: 0.6em;\
                    padding: 0.2em 0.5em;\
                    border-radius: 0.3em;\
                }\
                .kkphim-card__title {\
                    color: #fff;\
                    font-size: 0.85em;\
                    font-weight: 600;\
                    margin-top: 0.6em;\
                    line-height: 1.3;\
                    display: -webkit-box;\
                    -webkit-line-clamp: 2;\
                    -webkit-box-orient: vertical;\
                    overflow: hidden;\
                    padding: 0 0.2em;\
                }\
                .kkphim-card__original {\
                    color: #888;\
                    font-size: 0.7em;\
                    margin-top: 0.2em;\
                    line-height: 1.2;\
                    display: -webkit-box;\
                    -webkit-line-clamp: 1;\
                    -webkit-box-orient: vertical;\
                    overflow: hidden;\
                    padding: 0 0.2em;\
                }\
                \
                /* ==================== DETAIL STYLES ==================== */\
                .kkphim-detail {\
                    position: relative;\
                    min-height: 100vh;\
                    color: #fff;\
                }\
                .kkphim-detail__backdrop {\
                    position: absolute;\
                    top: 0;\
                    left: 0;\
                    width: 100%;\
                    height: 60vh;\
                    z-index: 0;\
                    overflow: hidden;\
                }\
                .kkphim-detail__backdrop-img {\
                    width: 100%;\
                    height: 100%;\
                    object-fit: cover;\
                    filter: brightness(0.5);\
                }\
                .kkphim-detail__backdrop-gradient {\
                    position: absolute;\
                    bottom: 0;\
                    left: 0;\
                    right: 0;\
                    height: 70%;\
                    background: linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.95) 20%, rgba(13,13,13,0.7) 50%, transparent 100%);\
                }\
                .kkphim-detail__content {\
                    position: relative;\
                    z-index: 1;\
                    display: flex;\
                    padding: 3em 3em 2em;\
                    gap: 2.5em;\
                    align-items: flex-start;\
                    min-height: 50vh;\
                }\
                .kkphim-detail__left {\
                    flex: 0 0 auto;\
                }\
                .kkphim-detail__poster-wrap {\
                    width: 14em;\
                    border-radius: 1em;\
                    overflow: hidden;\
                    box-shadow: 0 8px 40px rgba(0,0,0,0.6);\
                    aspect-ratio: 2/3;\
                    background: #1a1a2e;\
                }\
                .kkphim-detail__poster-img {\
                    width: 100%;\
                    height: 100%;\
                    object-fit: cover;\
                }\
                .kkphim-detail__right {\
                    flex: 1;\
                    padding-top: 1em;\
                }\
                .kkphim-detail__title {\
                    font-size: 2.2em;\
                    font-weight: 800;\
                    line-height: 1.2;\
                    margin-bottom: 0.2em;\
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);\
                }\
                .kkphim-detail__original-title {\
                    font-size: 1.1em;\
                    color: #aaa;\
                    margin-bottom: 1em;\
                    font-style: italic;\
                }\
                .kkphim-detail__meta {\
                    display: flex;\
                    flex-wrap: wrap;\
                    gap: 0.6em;\
                    margin-bottom: 1.2em;\
                }\
                .kkphim-detail__meta-item {\
                    background: rgba(255,255,255,0.1);\
                    backdrop-filter: blur(10px);\
                    padding: 0.35em 0.8em;\
                    border-radius: 2em;\
                    font-size: 0.85em;\
                    color: #ddd;\
                    border: 1px solid rgba(255,255,255,0.08);\
                }\
                .kkphim-detail__meta-icon {\
                    margin-right: 0.3em;\
                }\
                .kkphim-detail__meta-quality {\
                    background: linear-gradient(135deg, #e50914, #b20710) !important;\
                    color: #fff !important;\
                    font-weight: 700;\
                    border: none !important;\
                }\
                .kkphim-detail__meta-lang {\
                    background: linear-gradient(135deg, #667eea, #764ba2) !important;\
                    color: #fff !important;\
                    border: none !important;\
                }\
                .kkphim-detail__meta-rating {\
                    background: linear-gradient(135deg, #f7971e, #ffd200) !important;\
                    color: #000 !important;\
                    font-weight: 700;\
                    border: none !important;\
                }\
                .kkphim-detail__info-row {\
                    font-size: 0.9em;\
                    color: #ccc;\
                    margin-bottom: 0.5em;\
                    line-height: 1.5;\
                }\
                .kkphim-detail__actors {\
                    display: -webkit-box;\
                    -webkit-line-clamp: 2;\
                    -webkit-box-orient: vertical;\
                    overflow: hidden;\
                }\
                .kkphim-detail__label {\
                    color: #888;\
                    font-weight: 600;\
                    margin-right: 0.3em;\
                }\
                .kkphim-detail__overview {\
                    font-size: 0.9em;\
                    color: #bbb;\
                    line-height: 1.7;\
                    margin-top: 1em;\
                    margin-bottom: 1.5em;\
                    display: -webkit-box;\
                    -webkit-line-clamp: 5;\
                    -webkit-box-orient: vertical;\
                    overflow: hidden;\
                    max-width: 50em;\
                }\
                .kkphim-detail__buttons {\
                    display: flex;\
                    gap: 1em;\
                    margin-top: 1.5em;\
                }\
                .kkphim-detail__btn {\
                    padding: 0.7em 2em;\
                    border-radius: 0.6em;\
                    font-size: 1em;\
                    font-weight: 700;\
                    cursor: pointer;\
                    transition: all 0.3s ease;\
                    border: 2px solid transparent;\
                }\
                .kkphim-detail__btn-play {\
                    background: linear-gradient(135deg, #e50914, #b20710);\
                    color: #fff;\
                    box-shadow: 0 4px 15px rgba(229,9,20,0.4);\
                }\
                .kkphim-detail__btn-play.focus {\
                    transform: scale(1.05);\
                    box-shadow: 0 0 0 3px rgba(229,9,20,0.6), 0 6px 25px rgba(229,9,20,0.5);\
                    background: linear-gradient(135deg, #ff1a25, #e50914);\
                }\
                .kkphim-detail__btn-back {\
                    background: rgba(255,255,255,0.1);\
                    color: #fff;\
                    border: 2px solid rgba(255,255,255,0.2);\
                    backdrop-filter: blur(10px);\
                }\
                .kkphim-detail__btn-back.focus {\
                    background: rgba(255,255,255,0.2);\
                    border-color: #fff;\
                    transform: scale(1.05);\
                }\
                \
                /* ==================== EPISODE STYLES ==================== */\
                .kkphim-detail__episodes {\
                    position: relative;\
                    z-index: 1;\
                    padding: 0 3em 3em;\
                }\
                .kkphim-detail__server-title {\
                    font-size: 1.1em;\
                    font-weight: 700;\
                    color: #e50914;\
                    margin-bottom: 0.8em;\
                    margin-top: 1.5em;\
                    padding-left: 0.3em;\
                    border-left: 3px solid #e50914;\
                    padding-left: 0.8em;\
                }\
                .kkphim-detail__ep-grid {\
                    display: flex;\
                    flex-wrap: wrap;\
                    gap: 0.5em;\
                }\
                .kkphim-detail__ep-btn {\
                    background: rgba(255,255,255,0.08);\
                    color: #ddd;\
                    padding: 0.5em 1em;\
                    border-radius: 0.5em;\
                    font-size: 0.85em;\
                    cursor: pointer;\
                    transition: all 0.2s ease;\
                    border: 1px solid rgba(255,255,255,0.05);\
                    min-width: 3.5em;\
                    text-align: center;\
                    font-weight: 600;\
                }\
                .kkphim-detail__ep-btn.focus {\
                    background: linear-gradient(135deg, #e50914, #b20710);\
                    color: #fff;\
                    transform: scale(1.1);\
                    box-shadow: 0 0 0 2px rgba(229,9,20,0.5), 0 4px 15px rgba(229,9,20,0.3);\
                    border-color: transparent;\
                }\
                .kkphim-detail__ep-btn:hover {\
                    background: rgba(255,255,255,0.15);\
                }\
                \
                /* ==================== SEARCH STYLES ==================== */\
                .kkphim-empty {\
                    text-align: center;\
                    color: #888;\
                    font-size: 1.2em;\
                    padding: 3em;\
                }\
                \
                /* ==================== ANIMATION ==================== */\
                @keyframes kkphim-fadeIn {\
                    from { opacity: 0; transform: translateY(20px); }\
                    to { opacity: 1; transform: translateY(0); }\
                }\
                .kkphim-row {\
                    animation: kkphim-fadeIn 0.5s ease forwards;\
                }\
                .kkphim-detail__content {\
                    animation: kkphim-fadeIn 0.6s ease forwards;\
                }\
                \
                /* ==================== RESPONSIVE ==================== */\
                @media (max-width: 768px) {\
                    .kkphim-card {\
                        width: 9em;\
                    }\
                    .kkphim-detail__content {\
                        flex-direction: column;\
                        padding: 2em 1.5em;\
                    }\
                    .kkphim-detail__poster-wrap {\
                        width: 10em;\
                    }\
                    .kkphim-detail__title {\
                        font-size: 1.5em;\
                    }\
                }\
            ';

            if ($('#kkphim-styles').length === 0) {
                $('head').append('<style id="kkphim-styles">' + css + '</style>');
            }
        },

        // ==================== INIT ====================
        init: function () {
            var self = this;
            this.addStyles();
            this.sourceComponent();
            this.initSearch();
            this.initDetailComponent();
            this.addMenu();

            // Add to Lampa search sources
            if (Lampa.Api && Lampa.Api.sources) {
                Object.defineProperty(Lampa.Api.sources, 'kkphim', {
                    get: function () {
                        return self.sourceApi();
                    }
                });
            }

            console.log('KKPhim Plugin v' + this.version + ' loaded!');
            // Lampa.Noty.show('KKPhim Plugin đã được tải!', { time: 3000 });
        },

        sourceApi: function () {
            var self = this;
            return {
                search: function (query, page) {
                    return new Promise(function (resolve, reject) {
                        self.request('/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&limit=20&page=' + (page || 1), function (data) {
                            var items = (data.data && data.data.items) ? data.data.items : [];
                            resolve(self.mapCards(items));
                        }, function () {
                            reject();
                        });
                    });
                },
                list: function (params) {
                    return new Promise(function (resolve, reject) {
                        var url = params.url || '/danh-sach/phim-moi-cap-nhat?page=' + (params.page || 1);
                        self.request(url, function (data) {
                            var items = data.items || (data.data && data.data.items) || [];
                            resolve(self.mapCards(items));
                        }, function () {
                            reject();
                        });
                    });
                },
                detail: function (slug) {
                    return new Promise(function (resolve, reject) {
                        self.request('/phim/' + slug, function (data) {
                            if (data && data.movie) {
                                resolve({
                                    movie: data.movie,
                                    episodes: data.episodes || []
                                });
                            } else {
                                reject();
                            }
                        }, function () {
                            reject();
                        });
                    });
                }
            };
        }
    };

    // Auto-init when Lampa is ready
    if (window.appready) {
        KKPhim.init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                KKPhim.init();
            }
        });
    }

})();