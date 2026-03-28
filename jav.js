(function () {
    'use strict';

    var KKPhim = {
        API_URL: 'https://phimapi.com',
        network: new Lampa.Reguest(),
        cache: {},

        /**
         * Khởi tạo plugin
         */
        init: function () {
            // Thêm CSS
            this.addStyles();

            // Đăng ký component
            Lampa.Component.add('kkphim', this.component);
            Lampa.Component.add('kkphim_info', this.infoComponent);
            Lampa.Component.add('kkphim_category', this.categoryComponent);

            // Thêm nút vào menu
            this.addMenuItem();

            // Đăng ký source
            this.registerSource();
        },

        /**
         * Thêm CSS styles
         */
        addStyles: function () {
            var style = document.createElement('style');
            style.textContent = `
                /* ====== TRANG CHỦ ====== */
                .kkphim-page {
                    padding: 1.5em;
                    position: relative;
                }

                .kkphim-section {
                    margin-bottom: 2em;
                }

                .kkphim-section__title {
                    font-size: 1.6em;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 0.6em;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .kkphim-section__title span {
                    font-size: 0.55em;
                    color: rgba(255,255,255,0.5);
                    cursor: pointer;
                    padding: 0.3em 0.8em;
                    border-radius: 0.5em;
                    transition: all 0.3s;
                }

                .kkphim-section__title span:hover,
                .kkphim-section__title span.focus {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                }

                .kkphim-row {
                    display: flex;
                    overflow-x: auto;
                    gap: 0.8em;
                    padding-bottom: 0.5em;
                    scrollbar-width: none;
                }

                .kkphim-row::-webkit-scrollbar {
                    display: none;
                }

                /* ====== POSTER CARD ====== */
                .kkphim-card {
                    flex-shrink: 0;
                    width: 12em;
                    cursor: pointer;
                    position: relative;
                    border-radius: 1em;
                    overflow: hidden;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .kkphim-card.focus,
                .kkphim-card:hover {
                    transform: scale(1.08);
                    box-shadow: 0 0 0 3px #fff, 0 8px 25px rgba(0,0,0,0.5);
                    z-index: 5;
                }

                .kkphim-card__img-wrap {
                    width: 100%;
                    aspect-ratio: 2/3;
                    background: #1a1a2e;
                    position: relative;
                    overflow: hidden;
                }

                .kkphim-card__img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s;
                }

                .kkphim-card.focus .kkphim-card__img,
                .kkphim-card:hover .kkphim-card__img {
                    transform: scale(1.1);
                }

                .kkphim-card__quality {
                    position: absolute;
                    top: 0.5em;
                    left: 0.5em;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    font-size: 0.7em;
                    font-weight: 700;
                    padding: 0.2em 0.5em;
                    border-radius: 0.4em;
                    text-transform: uppercase;
                }

                .kkphim-card__year {
                    position: absolute;
                    top: 0.5em;
                    right: 0.5em;
                    background: rgba(0,0,0,0.7);
                    color: #fff;
                    font-size: 0.7em;
                    padding: 0.2em 0.5em;
                    border-radius: 0.4em;
                }

                .kkphim-card__ep {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0,0,0,0.9));
                    color: #fff;
                    font-size: 0.7em;
                    padding: 1.5em 0.5em 0.4em;
                    text-align: center;
                    font-weight: 600;
                }

                .kkphim-card__title {
                    padding: 0.5em 0.3em;
                    font-size: 0.85em;
                    color: #fff;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: 600;
                }

                .kkphim-card__orig-title {
                    font-size: 0.7em;
                    color: rgba(255,255,255,0.5);
                    text-align: center;
                    padding: 0 0.3em 0.5em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* ====== INFO PAGE ====== */
                .kkinfo {
                    position: relative;
                    min-height: 100%;
                }

                .kkinfo__backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 60vh;
                    background-size: cover;
                    background-position: center top;
                    z-index: 0;
                }

                .kkinfo__backdrop::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom,
                        rgba(0,0,0,0.3) 0%,
                        rgba(0,0,0,0.6) 50%,
                        #0d0d15 100%
                    );
                }

                .kkinfo__content {
                    position: relative;
                    z-index: 2;
                    padding: 3em 2em 2em;
                    display: flex;
                    gap: 2em;
                }

                .kkinfo__poster-wrap {
                    flex-shrink: 0;
                    width: 16em;
                }

                .kkinfo__poster {
                    width: 100%;
                    aspect-ratio: 2/3;
                    border-radius: 1em;
                    object-fit: cover;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }

                .kkinfo__details {
                    flex: 1;
                    padding-top: 1em;
                }

                .kkinfo__title {
                    font-size: 2.2em;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 0.1em;
                    line-height: 1.2;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }

                .kkinfo__orig-title {
                    font-size: 1.1em;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 1em;
                    font-style: italic;
                }

                .kkinfo__meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.8em;
                    margin-bottom: 1.2em;
                }

                .kkinfo__meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.3em;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    padding: 0.4em 0.8em;
                    border-radius: 2em;
                    font-size: 0.85em;
                    color: rgba(255,255,255,0.9);
                }

                .kkinfo__meta-item svg {
                    width: 1em;
                    height: 1em;
                    fill: currentColor;
                }

                .kkinfo__meta-item--quality {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    font-weight: 700;
                }

                .kkinfo__genres {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5em;
                    margin-bottom: 1.2em;
                }

                .kkinfo__genre {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: rgba(255,255,255,0.8);
                    padding: 0.3em 0.8em;
                    border-radius: 2em;
                    font-size: 0.8em;
                    transition: all 0.3s;
                    cursor: pointer;
                }

                .kkinfo__genre:hover,
                .kkinfo__genre.focus {
                    background: rgba(255,255,255,0.2);
                    color: #fff;
                }

                .kkinfo__description {
                    font-size: 0.95em;
                    color: rgba(255,255,255,0.75);
                    line-height: 1.7;
                    max-width: 40em;
                    margin-bottom: 1.5em;
                    max-height: 6em;
                    overflow: hidden;
                    position: relative;
                }

                .kkinfo__description::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2em;
                    background: linear-gradient(transparent, #0d0d15);
                }

                /* ====== BUTTONS ====== */
                .kkinfo__actions {
                    display: flex;
                    gap: 1em;
                    margin-bottom: 2em;
                    flex-wrap: wrap;
                }

                .kkinfo__btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5em;
                    padding: 0.8em 1.8em;
                    border-radius: 0.8em;
                    font-size: 1em;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
                    outline: none;
                }

                .kkinfo__btn svg {
                    width: 1.3em;
                    height: 1.3em;
                    fill: currentColor;
                }

                .kkinfo__btn--play {
                    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(229,9,20,0.4);
                }

                .kkinfo__btn--play:hover,
                .kkinfo__btn--play.focus {
                    background: linear-gradient(135deg, #ff1a25 0%, #e50914 100%);
                    transform: scale(1.05);
                    box-shadow: 0 6px 25px rgba(229,9,20,0.6);
                }

                .kkinfo__btn--fav {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .kkinfo__btn--fav:hover,
                .kkinfo__btn--fav.focus {
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.05);
                }

                .kkinfo__btn--trailer {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .kkinfo__btn--trailer:hover,
                .kkinfo__btn--trailer.focus {
                    background: rgba(255,255,255,0.2);
                    transform: scale(1.05);
                }

                /* ====== EPISODES ====== */
                .kkinfo__episodes {
                    position: relative;
                    z-index: 2;
                    padding: 0 2em 2em;
                }

                .kkinfo__episodes-title {
                    font-size: 1.4em;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 0.8em;
                    display: flex;
                    align-items: center;
                    gap: 0.5em;
                }

                .kkinfo__episodes-title .ep-count {
                    font-size: 0.6em;
                    background: rgba(255,255,255,0.1);
                    padding: 0.2em 0.6em;
                    border-radius: 1em;
                    color: rgba(255,255,255,0.6);
                }

                .kkinfo__server-tabs {
                    display: flex;
                    gap: 0.5em;
                    margin-bottom: 1em;
                    flex-wrap: wrap;
                }

                .kkinfo__server-tab {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.7);
                    padding: 0.4em 1em;
                    border-radius: 0.5em;
                    font-size: 0.85em;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .kkinfo__server-tab.active,
                .kkinfo__server-tab.focus {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    border-color: transparent;
                }

                .kkinfo__ep-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5em;
                }

                .kkinfo__ep-btn {
                    min-width: 3.5em;
                    padding: 0.6em 0.8em;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.8);
                    text-align: center;
                    border-radius: 0.5em;
                    font-size: 0.85em;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: 600;
                }

                .kkinfo__ep-btn:hover,
                .kkinfo__ep-btn.focus {
                    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
                    color: #fff;
                    border-color: transparent;
                    transform: scale(1.1);
                    box-shadow: 0 4px 15px rgba(229,9,20,0.4);
                }

                .kkinfo__ep-btn.watched {
                    background: rgba(255,255,255,0.15);
                    color: rgba(255,255,255,0.5);
                }

                /* ====== CATEGORY PAGE (Infinite Scroll) ====== */
                .kkcategory {
                    padding: 1.5em;
                }

                .kkcategory__title {
                    font-size: 1.8em;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 1em;
                }

                .kkcategory__grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1em;
                }

                .kkcategory__grid .kkphim-card {
                    width: calc(100% / 7 - 1em);
                }

                @media (max-width: 1200px) {
                    .kkcategory__grid .kkphim-card {
                        width: calc(100% / 5 - 1em);
                    }
                }

                @media (max-width: 800px) {
                    .kkcategory__grid .kkphim-card {
                        width: calc(100% / 3 - 1em);
                    }
                    .kkinfo__content {
                        flex-direction: column;
                        align-items: center;
                    }
                    .kkinfo__poster-wrap {
                        width: 12em;
                    }
                    .kkinfo__title {
                        font-size: 1.5em;
                        text-align: center;
                    }
                    .kkinfo__orig-title {
                        text-align: center;
                    }
                    .kkinfo__meta {
                        justify-content: center;
                    }
                    .kkinfo__genres {
                        justify-content: center;
                    }
                    .kkinfo__actions {
                        justify-content: center;
                    }
                }

                .kkcategory__loading {
                    text-align: center;
                    padding: 2em;
                    color: rgba(255,255,255,0.5);
                    font-size: 1em;
                }

                .kkcategory__loading .spinner {
                    display: inline-block;
                    width: 2em;
                    height: 2em;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: kk-spin 0.8s linear infinite;
                }

                @keyframes kk-spin {
                    to { transform: rotate(360deg); }
                }

                /* ====== SCROLL ====== */
                .kkphim-page .scroll,
                .kkinfo .scroll,
                .kkcategory .scroll {
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        },

        /**
         * Thêm vào menu Lampa
         */
        addMenuItem: function () {
            var ico = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8z" fill="currentColor"/><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 12.5v-9l6 4.5-6 4.5z" fill="currentColor"/></svg>';

            // Thêm button vào menu
            var menu_item = $('<li class="menu__item selector" data-action="kkphim">' +
                '<div class="menu__ico">' + ico + '</div>' +
                '<div class="menu__text">KKPhim</div>' +
                '</li>');

            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: '',
                    title: 'KKPhim',
                    component: 'kkphim',
                    page: 1
                });
            });

            // Chèn vào menu
            $('.menu .menu__list').eq(0).append(menu_item);
        },

        /**
         * Tạo card poster
         */
        createCard: function (item) {
            var card = document.createElement('div');
            card.className = 'kkphim-card selector';
            card.setAttribute('data-slug', item.slug);

            var quality = item.quality || item.lang || '';
            var year = item.year || '';
            var ep_text = item.episode_current || '';
            var poster = item.poster_url || item.thumb_url || '';

            // Fix relative URL
            if (poster && !poster.startsWith('http')) {
                poster = KKPhim.API_URL + '/uploads/movies/' + poster;
            }

            card.innerHTML =
                '<div class="kkphim-card__img-wrap">' +
                    '<img class="kkphim-card__img" src="' + poster + '" alt="" onerror="this.src=\'https://via.placeholder.com/200x300/1a1a2e/333?text=No+Image\'">' +
                    (quality ? '<div class="kkphim-card__quality">' + quality + '</div>' : '') +
                    (year ? '<div class="kkphim-card__year">' + year + '</div>' : '') +
                    (ep_text ? '<div class="kkphim-card__ep">' + ep_text + '</div>' : '') +
                '</div>' +
                '<div class="kkphim-card__title">' + (item.name || 'N/A') + '</div>' +
                '<div class="kkphim-card__orig-title">' + (item.origin_name || '') + '</div>';

            card.addEventListener('click', function () {
                KKPhim.openInfo(item.slug);
            });

            return card;
        },

        /**
         * Gọi API
         */
        request: function (path, params, callback, errorCallback) {
            var url = this.API_URL + path;
            if (params) {
                var query = Object.keys(params).map(function (k) {
                    return k + '=' + encodeURIComponent(params[k]);
                }).join('&');
                url += '?' + query;
            }

            this.network.clear();
            this.network.timeout(15000);
            this.network.silent(url, function (data) {
                if (callback) callback(data);
            }, function (err) {
                if (errorCallback) errorCallback(err);
            });
        },

        /**
         * Mở trang info phim
         */
        openInfo: function (slug) {
            Lampa.Activity.push({
                url: slug,
                title: 'Chi tiết phim',
                component: 'kkphim_info',
                slug: slug
            });
        },

        /**
         * Mở category với infinite scroll
         */
        openCategory: function (title, apiPath, params) {
            Lampa.Activity.push({
                url: apiPath,
                title: title,
                component: 'kkphim_category',
                apiPath: apiPath,
                apiParams: params || {},
                page: 1
            });
        },

        /**
         * Phát video
         */
        playVideo: function (url, title, subtitle) {
            if (!url) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            // Detect if it's m3u8
            var isHLS = url.indexOf('.m3u8') > -1;

            Lampa.Player.play({
                title: title || 'KKPhim',
                url: url,
                quality: {},
                subtitles: subtitle ? [{ label: 'Vietsub', url: subtitle }] : []
            });

            Lampa.Player.playlist([{
                title: title || 'KKPhim',
                url: url
            }]);
        },

        // =============================================
        // COMPONENT: Trang chủ
        // =============================================
        component: function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var content = document.createElement('div');
            content.className = 'kkphim-page';

            var categories = [
                { title: 'Phim Mới Cập Nhật', path: '/danh-sach/phim-moi-cap-nhat', params: {} },
                { title: 'Phim Bộ', path: '/v1/api/danh-sach/phim-bo', params: {} },
                { title: 'Phim Lẻ', path: '/v1/api/danh-sach/phim-le', params: {} },
                { title: 'Hoạt Hình', path: '/v1/api/danh-sach/hoat-hinh', params: {} },
                { title: 'TV Shows', path: '/v1/api/danh-sach/tv-shows', params: {} },
                { title: 'Phim Vietsub', path: '/v1/api/danh-sach/phim-vietsub', params: {} },
                { title: 'Phim Thuyết Minh', path: '/v1/api/danh-sach/phim-thuyet-minh', params: {} },
                { title: 'Phim Lồng Tiếng', path: '/v1/api/danh-sach/phim-long-tieng', params: {} },
            ];

            var loaded = 0;

            function loadCategory(cat, index) {
                var section = document.createElement('div');
                section.className = 'kkphim-section';

                var titleWrap = document.createElement('div');
                titleWrap.className = 'kkphim-section__title';
                titleWrap.innerHTML = cat.title + '<span class="selector kkphim-more" data-index="' + index + '">Xem thêm ➤</span>';

                var row = document.createElement('div');
                row.className = 'kkphim-row';

                section.appendChild(titleWrap);
                section.appendChild(row);
                content.appendChild(section);

                // Nút xem thêm
                var moreBtn = titleWrap.querySelector('.kkphim-more');
                moreBtn.addEventListener('click', function () {
                    KKPhim.openCategory(cat.title, cat.path, cat.params);
                });

                // Load data
                var apiPath = cat.path;
                var params = Object.assign({}, cat.params, { page: 1 });

                // API mới và cũ có cấu trúc khác nhau
                if (apiPath.indexOf('/v1/api/') > -1) {
                    params.limit = 16;
                }

                KKPhim.request(apiPath, params, function (data) {
                    var items = [];

                    if (data && data.items) {
                        items = data.items;
                    } else if (data && data.data && data.data.items) {
                        items = data.data.items;
                    }

                    items.forEach(function (item) {
                        // Fix poster URL cho API v1
                        if (data.data && data.data.APP_DOMAIN_CDN_IMAGE) {
                            if (item.poster_url && !item.poster_url.startsWith('http')) {
                                item.poster_url = data.data.APP_DOMAIN_CDN_IMAGE + '/' + item.poster_url;
                            }
                            if (item.thumb_url && !item.thumb_url.startsWith('http')) {
                                item.thumb_url = data.data.APP_DOMAIN_CDN_IMAGE + '/' + item.thumb_url;
                            }
                        }

                        var card = KKPhim.createCard(item);
                        row.appendChild(card);
                    });

                    loaded++;
                    if (loaded >= categories.length) {
                        scroll.append(content);
                        object.activity.loader(false);
                        Lampa.Controller.toggle('content');
                    }
                }, function () {
                    loaded++;
                    if (loaded >= categories.length) {
                        scroll.append(content);
                        object.activity.loader(false);
                        Lampa.Controller.toggle('content');
                    }
                });
            }

            this.create = function () {
                return scroll.render();
            };

            this.start = function () {
                object.activity.loader(true);
                categories.forEach(function (cat, i) {
                    loadCategory(cat, i);
                });
            };

            this.pause = function () {};
            this.stop = function () {};

            this.render = function () {
                return scroll.render();
            };

            this.destroy = function () {
                scroll.destroy();
                KKPhim.network.clear();
            };

            this.start();

            // Controller
            this.activity = {
                component: 'kkphim',
                enter: function () {
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
                            Navigator.move('down');
                        },
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('content');
                }
            };
        },

        // =============================================
        // COMPONENT: Info phim
        // =============================================
        infoComponent: function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var wrap = document.createElement('div');
            wrap.className = 'kkinfo';

            var currentServer = 0;
            var movieData = null;

            function buildInfoPage(movie, episodes) {
                movieData = movie;
                wrap.innerHTML = '';

                var backdrop = movie.thumb_url || movie.poster_url || '';
                var poster = movie.poster_url || movie.thumb_url || '';

                // Backdrop
                var backdropEl = document.createElement('div');
                backdropEl.className = 'kkinfo__backdrop';
                if (backdrop) {
                    backdropEl.style.backgroundImage = 'url(' + backdrop + ')';
                }
                wrap.appendChild(backdropEl);

                // Content
                var contentEl = document.createElement('div');
                contentEl.className = 'kkinfo__content';

                // Poster
                var posterWrap = document.createElement('div');
                posterWrap.className = 'kkinfo__poster-wrap';
                posterWrap.innerHTML = '<img class="kkinfo__poster" src="' + poster + '" alt="" onerror="this.src=\'https://via.placeholder.com/300x450/1a1a2e/333?text=No+Image\'">';
                contentEl.appendChild(posterWrap);

                // Details
                var detailsEl = document.createElement('div');
                detailsEl.className = 'kkinfo__details';

                // Title
                detailsEl.innerHTML += '<div class="kkinfo__title">' + (movie.name || 'N/A') + '</div>';
                if (movie.origin_name) {
                    detailsEl.innerHTML += '<div class="kkinfo__orig-title">' + movie.origin_name + '</div>';
                }

                // Meta
                var metaHtml = '<div class="kkinfo__meta">';
                if (movie.quality) {
                    metaHtml += '<div class="kkinfo__meta-item kkinfo__meta-item--quality">' + movie.quality + '</div>';
                }
                if (movie.year) {
                    metaHtml += '<div class="kkinfo__meta-item">📅 ' + movie.year + '</div>';
                }
                if (movie.time) {
                    metaHtml += '<div class="kkinfo__meta-item">⏱ ' + movie.time + '</div>';
                }
                if (movie.lang) {
                    metaHtml += '<div class="kkinfo__meta-item">🌐 ' + movie.lang + '</div>';
                }
                if (movie.episode_current) {
                    metaHtml += '<div class="kkinfo__meta-item">📺 ' + movie.episode_current + '</div>';
                }
                if (movie.view) {
                    metaHtml += '<div class="kkinfo__meta-item">👁 ' + movie.view.toLocaleString() + '</div>';
                }
                metaHtml += '</div>';
                detailsEl.innerHTML += metaHtml;

                // Genres
                if (movie.category && movie.category.length) {
                    var genresHtml = '<div class="kkinfo__genres">';
                    movie.category.forEach(function (g) {
                        genresHtml += '<div class="kkinfo__genre selector" data-slug="' + (g.slug || '') + '">' + g.name + '</div>';
                    });
                    genresHtml += '</div>';
                    detailsEl.innerHTML += genresHtml;
                }

                // Description
                var desc = movie.content || '';
                desc = desc.replace(/<[^>]*>/g, ''); // strip HTML
                if (desc) {
                    detailsEl.innerHTML += '<div class="kkinfo__description">' + desc + '</div>';
                }

                // Action Buttons
                var actionsHtml = '<div class="kkinfo__actions">';

                // Play button
                actionsHtml += '<div class="kkinfo__btn kkinfo__btn--play selector" data-action="play">' +
                    '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
                    '<span>Phát Phim</span>' +
                    '</div>';

                // Trailer button
                if (movie.trailer_url) {
                    actionsHtml += '<div class="kkinfo__btn kkinfo__btn--trailer selector" data-action="trailer">' +
                        '<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9.5 7.5v9l7-4.5z"/></svg>' +
                        '<span>Trailer</span>' +
                        '</div>';
                }

                // Fav button
                actionsHtml += '<div class="kkinfo__btn kkinfo__btn--fav selector" data-action="fav">' +
                    '<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>' +
                    '<span>Yêu thích</span>' +
                    '</div>';

                actionsHtml += '</div>';
                detailsEl.innerHTML += actionsHtml;

                contentEl.appendChild(detailsEl);
                wrap.appendChild(contentEl);

                // Episodes section
                if (episodes && episodes.length > 0) {
                    var epSection = document.createElement('div');
                    epSection.className = 'kkinfo__episodes';

                    // Count total episodes
                    var totalEps = 0;
                    episodes.forEach(function (s) {
                        totalEps += (s.server_data || []).length;
                    });

                    epSection.innerHTML += '<div class="kkinfo__episodes-title">Danh sách tập phim <span class="ep-count">' + totalEps + ' tập</span></div>';

                    // Server tabs
                    if (episodes.length > 1) {
                        var tabsHtml = '<div class="kkinfo__server-tabs">';
                        episodes.forEach(function (server, si) {
                            tabsHtml += '<div class="kkinfo__server-tab selector' + (si === 0 ? ' active' : '') + '" data-server="' + si + '">' + (server.server_name || 'Server ' + (si + 1)) + '</div>';
                        });
                        tabsHtml += '</div>';
                        epSection.innerHTML += tabsHtml;
                    }

                    // Episode grids (one per server)
                    episodes.forEach(function (server, si) {
                        var gridEl = document.createElement('div');
                        gridEl.className = 'kkinfo__ep-grid';
                        gridEl.id = 'kk-server-' + si;
                        if (si > 0) gridEl.style.display = 'none';

                        (server.server_data || []).forEach(function (ep) {
                            var epBtn = document.createElement('div');
                            epBtn.className = 'kkinfo__ep-btn selector';
                            epBtn.textContent = ep.name || 'Tập ?';
                            epBtn.setAttribute('data-server', si);
                            epBtn.setAttribute('data-ep-name', ep.name || '');
                            epBtn.setAttribute('data-link', ep.link_m3u8 || ep.link_embed || '');
                            epBtn.setAttribute('data-filename', ep.filename || '');

                            epBtn.addEventListener('click', function () {
                                var link = this.getAttribute('data-link');
                                var epName = this.getAttribute('data-ep-name');
                                var filename = this.getAttribute('data-filename');

                                var playTitle = (movie.name || '') + ' - ' + (epName || filename || '');
                                KKPhim.playVideo(link, playTitle);

                                // Mark as watched
                                this.classList.add('watched');
                            });

                            gridEl.appendChild(epBtn);
                        });

                        epSection.appendChild(gridEl);
                    });

                    wrap.appendChild(epSection);

                    // Bind server tab clicks
                    setTimeout(function () {
                        var tabs = wrap.querySelectorAll('.kkinfo__server-tab');
                        tabs.forEach(function (tab) {
                            tab.addEventListener('click', function () {
                                var si = parseInt(this.getAttribute('data-server'));

                                // Update tabs
                                tabs.forEach(function (t) { t.classList.remove('active'); });
                                this.classList.add('active');

                                // Show/hide grids
                                episodes.forEach(function (_, idx) {
                                    var grid = document.getElementById('kk-server-' + idx);
                                    if (grid) grid.style.display = (idx === si) ? 'flex' : 'none';
                                });
                            });
                        });
                    }, 100);
                }

                scroll.append(wrap);

                // Bind action buttons
                setTimeout(function () {
                    var playBtn = wrap.querySelector('[data-action="play"]');
                    if (playBtn) {
                        playBtn.addEventListener('click', function () {
                            // Play first episode of first server
                            if (episodes && episodes.length > 0 && episodes[0].server_data && episodes[0].server_data.length > 0) {
                                var firstEp = episodes[0].server_data[0];
                                var link = firstEp.link_m3u8 || firstEp.link_embed || '';
                                var playTitle = (movie.name || '') + ' - ' + (firstEp.name || '');
                                KKPhim.playVideo(link, playTitle);
                            } else {
                                Lampa.Noty.show('Chưa có tập phim nào');
                            }
                        });
                    }

                    var trailerBtn = wrap.querySelector('[data-action="trailer"]');
                    if (trailerBtn) {
                        trailerBtn.addEventListener('click', function () {
                            if (movie.trailer_url) {
                                // Convert youtube URL to embed if needed
                                var trailerUrl = movie.trailer_url;
                                if (trailerUrl.indexOf('youtube.com/watch') > -1) {
                                    var vid = trailerUrl.split('v=')[1];
                                    if (vid) {
                                        vid = vid.split('&')[0];
                                        trailerUrl = 'https://www.youtube.com/embed/' + vid;
                                    }
                                }
                                window.open(trailerUrl, '_blank');
                            }
                        });
                    }

                    var favBtn = wrap.querySelector('[data-action="fav"]');
                    if (favBtn) {
                        favBtn.addEventListener('click', function () {
                            Lampa.Noty.show('Đã thêm vào yêu thích!');
                        });
                    }

                    // Genre clicks
                    var genres = wrap.querySelectorAll('.kkinfo__genre');
                    genres.forEach(function (g) {
                        g.addEventListener('click', function () {
                            var slug = this.getAttribute('data-slug');
                            var name = this.textContent;
                            if (slug) {
                                KKPhim.openCategory(name, '/v1/api/the-loai/' + slug, {});
                            }
                        });
                    });
                }, 200);
            }

            this.create = function () {
                return scroll.render();
            };

            this.start = function () {
                var slug = object.slug;
                object.activity.loader(true);

                KKPhim.request('/phim/' + slug, null, function (data) {
                    object.activity.loader(false);

                    if (data && data.movie) {
                        buildInfoPage(data.movie, data.episodes || []);
                        Lampa.Controller.toggle('content');
                    } else {
                        Lampa.Noty.show('Không tìm thấy phim');
                    }
                }, function () {
                    object.activity.loader(false);
                    Lampa.Noty.show('Lỗi tải dữ liệu phim');
                });
            };

            this.pause = function () {};
            this.stop = function () {};

            this.render = function () {
                return scroll.render();
            };

            this.destroy = function () {
                scroll.destroy();
                KKPhim.network.clear();
            };

            this.start();

            this.activity = {
                component: 'kkphim_info',
                enter: function () {
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
                            Navigator.move('down');
                        },
                        back: function () {
                            Lampa.Activity.backward();
                        }
                    });
                    Lampa.Controller.toggle('content');
                }
            };
        },

        // =============================================
        // COMPONENT: Category với Infinite Scroll
        // =============================================
        categoryComponent: function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var wrap = document.createElement('div');
            wrap.className = 'kkcategory';

            var currentPage = 1;
            var totalPages = 1;
            var isLoading = false;
            var allLoaded = false;

            var titleEl = document.createElement('div');
            titleEl.className = 'kkcategory__title';
            titleEl.textContent = object.title || 'Danh mục';
            wrap.appendChild(titleEl);

            var grid = document.createElement('div');
            grid.className = 'kkcategory__grid';
            wrap.appendChild(grid);

            var loadingEl = document.createElement('div');
            loadingEl.className = 'kkcategory__loading';
            loadingEl.innerHTML = '<div class="spinner"></div><div style="margin-top:0.5em">Đang tải...</div>';
            loadingEl.style.display = 'none';
            wrap.appendChild(loadingEl);

            scroll.append(wrap);

            function loadPage(page) {
                if (isLoading || allLoaded) return;
                isLoading = true;
                loadingEl.style.display = 'block';

                var apiPath = object.apiPath;
                var params = Object.assign({}, object.apiParams || {}, { page: page });

                if (apiPath.indexOf('/v1/api/') > -1) {
                    params.limit = 24;
                }

                KKPhim.request(apiPath, params, function (data) {
                    isLoading = false;
                    loadingEl.style.display = 'none';

                    var items = [];
                    var cdnImage = '';

                    if (data && data.items) {
                        items = data.items;
                        // Cũ API
                        totalPages = data.pagination ? data.pagination.totalPages : 1;
                    } else if (data && data.data && data.data.items) {
                        items = data.data.items;
                        cdnImage = data.data.APP_DOMAIN_CDN_IMAGE || '';
                        totalPages = data.data.params ? data.data.params.pagination.totalPages : 1;
                    }

                    if (!items || items.length === 0) {
                        allLoaded = true;
                        return;
                    }

                    items.forEach(function (item) {
                        // Fix poster
                        if (cdnImage) {
                            if (item.poster_url && !item.poster_url.startsWith('http')) {
                                item.poster_url = cdnImage + '/' + item.poster_url;
                            }
                            if (item.thumb_url && !item.thumb_url.startsWith('http')) {
                                item.thumb_url = cdnImage + '/' + item.thumb_url;
                            }
                        }

                        var card = KKPhim.createCard(item);
                        grid.appendChild(card);
                    });

                    currentPage = page;
                    if (currentPage >= totalPages) {
                        allLoaded = true;
                    }

                    Lampa.Controller.toggle('content');
                }, function () {
                    isLoading = false;
                    loadingEl.style.display = 'none';
                    Lampa.Noty.show('Lỗi tải dữ liệu');
                });
            }

            // Infinite scroll detection
            scroll.onScroll = function (scrollData) {
                if (allLoaded || isLoading) return;

                var scrollEl = scroll.render().find('.scroll__content')[0] || scroll.render()[0];
                if (scrollEl) {
                    var sh = scrollEl.scrollHeight;
                    var st = scrollEl.scrollTop || 0;
                    var ch = scrollEl.clientHeight;

                    if (sh - st - ch < 300) {
                        loadPage(currentPage + 1);
                    }
                }
            };

            // Monitor scroll
            var scrollTimer = null;
            function startScrollMonitor() {
                scrollTimer = setInterval(function () {
                    if (allLoaded || isLoading) return;

                    var scrollContent = scroll.render().find('.scroll__body, .scroll__content');
                    if (scrollContent.length) {
                        var el = scrollContent[0];
                        // Check using transform
                        var transform = el.style.transform || '';
                        var match = transform.match(/translateY\((-?\d+)/);
                        var translateY = match ? Math.abs(parseInt(match[1])) : 0;
                        var totalHeight = el.scrollHeight || el.offsetHeight;
                        var viewHeight = scroll.render()[0].clientHeight || scroll.render()[0].offsetHeight;

                        if (translateY + viewHeight + 400 >= totalHeight) {
                            loadPage(currentPage + 1);
                        }
                    }
                }, 500);
            }

            this.create = function () {
                return scroll.render();
            };

            this.start = function () {
                object.activity.loader(true);
                loadPage(1);
                startScrollMonitor();

                setTimeout(function () {
                    object.activity.loader(false);
                }, 1500);
            };

            this.pause = function () {};
            this.stop = function () {
                if (scrollTimer) clearInterval(scrollTimer);
            };

            this.render = function () {
                return scroll.render();
            };

            this.destroy = function () {
                if (scrollTimer) clearInterval(scrollTimer);
                scroll.destroy();
                KKPhim.network.clear();
            };

            this.start();

            this.activity = {
                component: 'kkphim_category',
                enter: function () {
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
                }
            };
        },

        /**
         * Register source cho tìm kiếm
         */
        registerSource: function () {
            // Thêm vào search
            if (Lampa.Search) {
                var originalSearch = Lampa.Search;
            }
        }
    };

    // =============================================
    // KHỞI TẠO PLUGIN
    // =============================================
    if (window.appready) {
        KKPhim.init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                KKPhim.init();
            }
        });
    }

    // Export
    window.kkphim_plugin = KKPhim;

})();