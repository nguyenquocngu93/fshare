(function () {
    'use strict';

    if (window.lampa_vn_phim_plugin_loaded) return;
    window.lampa_vn_phim_plugin_loaded = true;

    var CONFIG = {
        kkphim: {
            name: 'KKPhim',
            search: 'https://phimapi.com/v1/api/tim-kiem?keyword=',
            detail: 'https://phimapi.com/phim/',
            list: 'https://phimapi.com/v1/api/danh-sach/',
            img: 'https://phimimg.com/'
        }
    };

    function fixImgUrl(url, domainImg) {
        if (!url) return '';
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
        return (domainImg || CONFIG.kkphim.img) + url.replace(/^\//, '');
    }

    function fetchJson(url, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 12000;
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    callback(data);
                } catch (e) {
                    if (errorCallback) errorCallback('Error parsing JSON');
                }
            } else {
                if (errorCallback) errorCallback('HTTP Error ' + xhr.status);
            }
        };
        xhr.onerror = function () { if (errorCallback) errorCallback('Network error'); };
        xhr.ontimeout = function () { if (errorCallback) errorCallback('Timeout error'); };
        xhr.send();
    }

    function cleanTitle(title) {
        if (!title) return '';
        return title
            .replace(/[\(\)\[\]]/g, ' ')
            .replace(/season\s+\d+/gi, '')
            .replace(/tập\s+\d+/gi, '')
            .trim();
    }

    // Inject CSS Fix to remove Lampa default red card background and force poster visibility
    function injectStyles() {
        if ($('#vn-phim-styles').length > 0) return;
        var css = 
            '<style id="vn-phim-styles">' +
            '.card__view { background: #141824 !important; position: relative !important; overflow: hidden !important; border-radius: 8px !important; }' +
            '.card__view::before, .card__view::after { display: none !important; content: none !important; background: transparent !important; }' +
            '.card__view img, .card__img { opacity: 1 !important; visibility: visible !important; display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: 1 !important; }' +
            '.card__quality { z-index: 5 !important; }' +
            '</style>';
        $('head').append(css);
    }

    /**
     * Create Lampa Native Card Element with direct Poster Image Tag
     */
    function createLampaNativeCard(item, onEnter, onFocus) {
        var poster = fixImgUrl(item.poster_url || item.thumb_url, CONFIG.kkphim.img);
        var title = item.name || item.title || '';
        var orig = item.origin_name || item.original_name || '';
        var year = item.year || '';
        var epBadge = item.episode_current || '';

        var imgHtml = poster 
            ? '<img src="' + poster + '" class="card__img" loading="lazy" />'
            : '<div class="card__img-empty" style="background:#222; display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:#aaa; font-size:0.8em;">Không có ảnh</div>';

        var cardHtml = 
            '<div class="card selector card--category">' +
                '<div class="card__view">' +
                    imgHtml +
                    (epBadge ? '<div class="card__quality" style="position:absolute; top:6px; right:6px; background:#e50914; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75em; font-weight:bold; z-index:5;">' + epBadge + '</div>' : '') +
                '</div>' +
                '<div class="card__title">' + title + '</div>' +
                (orig ? '<div class="card__age" style="color:#aaa; font-size:0.8em;">' + orig + (year ? ' (' + year + ')' : '') + '</div>' : '') +
            '</div>';

        var $card = $(cardHtml);

        $card.on('hover:focus focus', function () {
            if (onFocus) onFocus(this);
        });

        $card.on('hover:enter click', function () {
            if (onEnter) onEnter();
        });

        return $card;
    }

    /**
     * Native Lampa Catalog Component
     */
    function VNPhimCatalogComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var comp = this;
        var page = object.page || 1;
        var wrap = $('<div class="category-full"></div>');
        var lastFocus = null;

        this.create = function () {
            injectStyles();
            try {
                if (comp.activity && comp.activity.loader) comp.activity.loader(true);
            } catch(e){}

            scroll.render().addClass('scroll--style');
            scroll.append(wrap);

            this.loadData();
        };

        this.loadData = function () {
            var url = '';
            if (object.isSearch) {
                url = CONFIG.kkphim.search + encodeURIComponent(object.keyword || '') + '&page=' + page;
            } else {
                url = CONFIG.kkphim.list + (object.cat || 'phim-moi-cap-nhat') + '?page=' + page;
            }

            fetchJson(url, function (res) {
                try {
                    if (comp.activity && comp.activity.loader) comp.activity.loader(false);
                } catch(e){}

                var rawItems = (res && res.data && res.data.items) ? res.data.items : [];
                if (rawItems.length === 0) {
                    wrap.html('<div class="empty__title" style="padding:40px; text-align:center;">Không tìm thấy phim!</div>');
                    comp.start();
                    return;
                }

                wrap.empty();

                rawItems.forEach(function (rawIt) {
                    try {
                        var $card = createLampaNativeCard(rawIt, function () {
                            comp.openMovieDetail(rawIt.slug);
                        }, function (target) {
                            lastFocus = target;
                            scroll.update($(target));
                        });

                        wrap.append($card);
                    } catch(e) {
                        console.error('[VNPhim] Error creating card', e);
                    }
                });

                // Next Page Button
                var pagination = res.data && res.data.params && res.data.params.pagination;
                var totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) : 10;

                if (page < totalPages) {
                    var nextBtn = $('<div class="category-full__more selector" style="width:100%; text-align:center; padding:16px; margin-top:20px; background:rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-weight:bold;">➡️ Trang Tiếp theo (' + (page + 1) + '/' + totalPages + ')</div>');
                    nextBtn.on('hover:enter click', function () {
                        Lampa.Activity.push({
                            url: '',
                            title: object.title + ' - Trang ' + (page + 1),
                            component: 'vn_phim_catalog',
                            cat: object.cat,
                            isSearch: object.isSearch,
                            keyword: object.keyword,
                            page: page + 1
                        });
                    });
                    wrap.append(nextBtn);
                }

                comp.start();
            }, function (err) {
                try {
                    if (comp.activity && comp.activity.loader) comp.activity.loader(false);
                } catch(e){}
                Lampa.Noty.show('Lỗi tải dữ liệu: ' + err);
            });
        };

        this.openMovieDetail = function (slug) {
            Lampa.Loading.start();
            fetchJson(CONFIG.kkphim.detail + slug, function (res) {
                Lampa.Loading.stop();
                var movie = (res && res.movie) ? res.movie : (res && res.data && res.data.item ? res.data.item : null);
                var episodes = (res && res.episodes) ? res.episodes : (res && res.data && res.data.episodes ? res.data.episodes : []);

                if (!movie) {
                    Lampa.Noty.show('Không thể lấy chi tiết phim!');
                    return;
                }

                VNPhimPluginInstance.openEpisodesModal(movie, episodes);
            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi lấy chi tiết phim: ' + err);
            });
        };

        this.start = function () {
            try {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        var selectors = scroll.render().find('.selector');
                        Lampa.Controller.collectionSet(selectors);
                        Lampa.Controller.collectionFocus(lastFocus || selectors.eq(0)[0], scroll.render());
                    },
                    left: function () {
                        Lampa.Controller.toggle('menu');
                    },
                    up: function () {
                        Lampa.Controller.toggle('head');
                    }
                });
                Lampa.Controller.toggle('content');
            } catch(e) {}
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () {
            return scroll.render();
        };
        this.destroy = function () {
            scroll.destroy();
        };
    }

    // Register Component
    Lampa.Component.add('vn_phim_catalog', VNPhimCatalogComponent);

    var VNPhimPluginInstance = null;

    function VNPhimPlugin() {
        VNPhimPluginInstance = this;

        this.init = function () {
            injectStyles();
            Lampa.Listener.follow('full', this.onFullLoaded.bind(this));
            this.injectSidebarMenu();
        };

        this.injectSidebarMenu = function () {
            var self = this;
            var addMenuItem = function () {
                var $menuList = $('.menu .menu__list, .menu__items').first();
                if (!$menuList.length || $menuList.find('.menu__item--vn-phim').length > 0) return;

                var menuHtml = 
                    '<li class="menu__item selector menu__item--vn-phim">' +
                        '<div class="menu__ico">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">' +
                                '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>' +
                            '</svg>' +
                        '</div>' +
                        '<div class="menu__text">Phim Việt Nam</div>' +
                    '</li>';

                var $item = $(menuHtml);
                $menuList.append($item);

                $item.on('hover:enter click', function () {
                    self.showCategoryMenu();
                });
            };

            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') setTimeout(addMenuItem, 500);
            });
            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'render') setTimeout(addMenuItem, 100);
            });
            setTimeout(addMenuItem, 1000);
        };

        this.showCategoryMenu = function () {
            var self = this;
            var categories = [
                { title: '🔥 Phim Mới Cập Nhật', cat: 'phim-moi-cap-nhat' },
                { title: '🎬 Phim Bộ', cat: 'phim-bo' },
                { title: '🎥 Phim Lẻ', cat: 'phim-le' },
                { title: '🧸 Hoạt Hình', cat: 'hoat-hinh' },
                { title: '📺 TV Shows', cat: 'tv-shows' },
                { title: '🔍 Tìm Kiếm Phim', isSearch: true }
            ];

            var items = categories.map(function (c) {
                return {
                    title: c.title,
                    cat: c.cat,
                    isSearch: c.isSearch
                };
            });

            Lampa.Select.show({
                title: 'Danh Mục Phim Việt Nam (KKPhim & OPhim)',
                items: items,
                onSelect: function (item) {
                    if (item.isSearch) {
                        self.promptSearch();
                    } else {
                        Lampa.Activity.push({
                            url: '',
                            title: item.title,
                            component: 'vn_phim_catalog',
                            cat: item.cat,
                            page: 1
                        });
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('menu');
                }
            });
        };

        this.promptSearch = function () {
            Lampa.Input.edit({
                title: 'Nhập tên phim cần tìm',
                value: '',
                free: true
            }, function (keyword) {
                if (keyword && keyword.trim()) {
                    Lampa.Activity.push({
                        url: '',
                        title: 'Tìm kiếm: "' + keyword.trim() + '"',
                        component: 'vn_phim_catalog',
                        isSearch: true,
                        keyword: keyword.trim(),
                        page: 1
                    });
                }
            });
        };

        this.openEpisodesModal = function (movie, episodes) {
            var self = this;
            if (!episodes || episodes.length === 0) {
                Lampa.Noty.show('Phim chưa có tập phát sóng!');
                return;
            }

            if (episodes.length === 1) {
                self.showServerEpisodes(episodes[0], movie);
            } else {
                var serverItems = episodes.map(function (srv, idx) {
                    return {
                        title: srv.server_name || ('Server ' + (idx + 1)),
                        serverData: srv
                    };
                });

                Lampa.Select.show({
                    title: (movie.name || 'Phim') + ' - Chọn Server',
                    items: serverItems,
                    onSelect: function (selected) {
                        self.showServerEpisodes(selected.serverData, movie);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            }
        };

        this.showServerEpisodes = function (server, movie) {
            var self = this;
            var serverData = server.server_data || [];

            if (serverData.length === 0) {
                Lampa.Noty.show('Server này không có dữ liệu!');
                return;
            }

            if (serverData.length === 1) {
                self.playVideo(serverData[0], serverData, 0, movie);
            } else {
                var epItems = serverData.map(function (ep, idx) {
                    return {
                        title: ep.name || ('Tập ' + (idx + 1)),
                        epData: ep,
                        index: idx
                    };
                });

                Lampa.Select.show({
                    title: (movie.name || 'Phim') + ' (' + (server.server_name || 'Server') + ')',
                    items: epItems,
                    onSelect: function (selected) {
                        self.playVideo(selected.epData, serverData, selected.index, movie);
                    },
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            }
        };

        this.playVideo = function (ep, allEpisodes, startIndex, movieDetail) {
            var streamUrl = ep.link_m3u8;

            if (!streamUrl) {
                Lampa.Noty.show('Không tìm thấy link m3u8!');
                return;
            }

            var playlist = allEpisodes.map(function (item) {
                return {
                    title: (movieDetail.name || 'Phim') + ' - ' + (item.name || 'Tập phim'),
                    url: item.link_m3u8
                };
            });

            Lampa.Player.play(playlist[startIndex]);
            Lampa.Player.playlist(playlist);
        };

        this.onFullLoaded = function (e) {
            var self = this;
            if (e.type === 'complite') {
                var render = e.object.activity.render();
                var movie = e.data.movie;

                if (render.find('.button--vn-phim').length > 0) return;

                var btnHtml = 
                    '<div class="full-start__button selector button--vn-phim">' +
                        '<svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor">' +
                            '<path d="M8 5v14l11-7z"/>' +
                        '</svg>' +
                        '<span>Xem Phim (VN)</span>' +
                    '</div>';

                var $btn = $(btnHtml);
                var $buttonsContainer = render.find('.full-start__buttons, .full-start-new__buttons').first();

                if ($buttonsContainer.length) {
                    $buttonsContainer.append($btn);
                    $btn.on('hover:enter click', function () {
                        var searchTitle = cleanTitle(movie.title || movie.name || movie.original_title);
                        if (searchTitle) {
                            Lampa.Activity.push({
                                url: '',
                                title: 'Tìm kiếm: "' + searchTitle + '"',
                                component: 'vn_phim_catalog',
                                isSearch: true,
                                keyword: searchTitle,
                                page: 1
                            });
                        } else {
                            Lampa.Noty.show('Không lấy được tên phim!');
                        }
                    });
                }
            }
        };
    }

    if (window.appready) {
        new VNPhimPlugin().init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') new VNPhimPlugin().init();
        });
    }
})();
