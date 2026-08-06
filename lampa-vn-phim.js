(function () {
    'use strict';

    if (window.lampa_vn_phim_plugin_loaded) return;
    window.lampa_vn_phim_plugin_loaded = true;

    var CONFIG = {
        kkphim: {
            name: 'KKPhim',
            search: 'https://phimapi.com/v1/api/tim-kiem?keyword=',
            detail: 'https://phimapi.com/phim/',
            list: 'https://phimapi.com/v1/api/danh-sach/'
        },
        ophim: {
            name: 'OPhim',
            search: 'https://ophim1.cc/v1/api/tim-kiem?keyword=',
            detail: 'https://ophim1.cc/v1/api/phim/',
            list: 'https://ophim1.cc/v1/api/danh-sach/'
        }
    };

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
        xhr.onerror = function () {
            if (errorCallback) errorCallback('Network error');
        };
        xhr.ontimeout = function () {
            if (errorCallback) errorCallback('Timeout error');
        };
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

    function VNPhimPlugin() {
        this.init = function () {
            Lampa.Listener.follow('full', this.onFullLoaded.bind(this));
            this.injectSidebarMenu();
        };

        /**
         * Inject "Phim Việt Nam" into Lampa Left Sidebar Menu
         */
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

            // Run on app ready or when menu listener triggers
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    setTimeout(addMenuItem, 500);
                }
            });

            Lampa.Listener.follow('menu', function (e) {
                if (e.type === 'render') {
                    setTimeout(addMenuItem, 100);
                }
            });

            setTimeout(addMenuItem, 1000);
        };

        /**
         * Show Category Selector Menu
         */
        this.showCategoryMenu = function () {
            var categories = [
                { title: '🔥 Phim Mới Cập Nhật', cat: 'phim-moi-cap-nhat' },
                { title: '🎬 Phim Bộ', cat: 'phim-bo' },
                { title: '🎥 Phim Lẻ', cat: 'phim-le' },
                { title: '🧸 Hoạt Hình', cat: 'hoat-hinh' },
                { title: '📺 TV Shows', cat: 'tv-shows' }
            ];

            var items = categories.map(function (c) {
                return {
                    title: c.title,
                    cat: c.cat
                };
            });

            Lampa.Select.show({
                title: 'Danh Mục Phim Việt Nam (KKPhim & OPhim)',
                items: items,
                onSelect: function (item) {
                    this.loadCategoryList(item.cat, item.title, 1);
                }.bind(this),
                onBack: function () {
                    Lampa.Controller.toggle('menu');
                }
            });
        };

        /**
         * Load list of movies for a category
         */
        this.loadCategoryList = function (cat, catTitle, page) {
            var self = this;
            Lampa.Loading.start();

            var url = CONFIG.kkphim.list + cat + '?page=' + (page || 1);

            fetchJson(url, function (res) {
                Lampa.Loading.stop();

                var rawItems = (res && res.data && res.data.items) ? res.data.items : [];
                if (rawItems.length === 0) {
                    Lampa.Noty.show('Không có danh sách phim!');
                    return;
                }

                var selectItems = rawItems.map(function (it) {
                    return {
                        title: it.name + (it.origin_name ? ' (' + it.origin_name + ')' : ''),
                        subtitle: (it.year ? 'Năm: ' + it.year : '') + (it.episode_current ? ' | ' + it.episode_current : ''),
                        slug: it.slug,
                        raw: it
                    };
                });

                // Add Next Page option
                var totalPages = (res.data && res.data.params && res.data.params.pagination) 
                    ? Math.ceil(res.data.params.pagination.totalItems / res.data.params.pagination.totalItemsPerPage)
                    : 10;

                if (page < totalPages) {
                    selectItems.push({
                        title: '➡️ Trang Tiếp theo (' + (page + 1) + ')',
                        subtitle: 'Xem các phim tiếp theo...',
                        isNext: true
                    });
                }

                Lampa.Select.show({
                    title: catTitle + ' (Trang ' + page + ')',
                    items: selectItems,
                    onSelect: function (selected) {
                        if (selected.isNext) {
                            self.loadCategoryList(cat, catTitle, page + 1);
                        } else {
                            self.loadMovieDetail(selected.slug, CONFIG.kkphim);
                        }
                    },
                    onBack: function () {
                        self.showCategoryMenu();
                    }
                });
            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi tải danh mục: ' + err);
            });
        };

        /**
         * Movie Detail button handler
         */
        this.onFullLoaded = function (e) {
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
                        this.showSourcePicker(movie);
                    }.bind(this));
                }
            }
        };

        this.showSourcePicker = function (movie) {
            var items = [
                { title: 'KKPhim (Nguồn 1)', source: 'kkphim' },
                { title: 'OPhim (Nguồn 2)', source: 'ophim' }
            ];

            Lampa.Select.show({
                title: 'Chọn nguồn phát Việt Nam',
                items: items,
                onSelect: function (item) {
                    this.searchAndPlay(movie, item.source);
                }.bind(this),
                onBack: function () {
                    Lampa.Controller.toggle('content');
                }
            });
        };

        this.searchAndPlay = function (movie, sourceKey) {
            var cfg = CONFIG[sourceKey];
            var searchTitle = cleanTitle(movie.title || movie.name || movie.original_title);

            if (!searchTitle) {
                Lampa.Noty.show('Không tìm thấy tên phim!');
                return;
            }

            Lampa.Loading.start();
            var searchUrl = cfg.search + encodeURIComponent(searchTitle);

            fetchJson(searchUrl, function (res) {
                Lampa.Loading.stop();
                var items = (res && res.data && res.data.items) ? res.data.items : [];

                if (items.length === 0) {
                    if (movie.original_title && movie.original_title !== movie.title) {
                        Lampa.Loading.start();
                        fetchJson(cfg.search + encodeURIComponent(cleanTitle(movie.original_title)), function (res2) {
                            Lampa.Loading.stop();
                            if (res2 && res2.data && res2.data.items && res2.data.items.length > 0) {
                                this.handleSearchResults(res2.data.items, cfg, movie);
                            } else {
                                Lampa.Noty.show('Không tìm thấy phim trên ' + cfg.name);
                            }
                        }.bind(this), function () {
                            Lampa.Loading.stop();
                            Lampa.Noty.show('Lỗi kết nối ' + cfg.name);
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy phim trên ' + cfg.name);
                    }
                    return;
                }

                this.handleSearchResults(items, cfg, movie);
            }.bind(this), function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi tìm kiếm: ' + err);
            }.bind(this));
        };

        this.handleSearchResults = function (items, cfg, movie) {
            if (items.length === 1) {
                this.loadMovieDetail(items[0].slug, cfg);
            } else {
                var selectItems = items.map(function (item) {
                    return {
                        title: item.name + (item.origin_name ? ' (' + item.origin_name + ')' : ''),
                        subtitle: item.year ? ('Năm: ' + item.year) : '',
                        slug: item.slug
                    };
                });

                Lampa.Select.show({
                    title: 'Kết quả tìm kiếm (' + cfg.name + ')',
                    items: selectItems,
                    onSelect: function (selected) {
                        this.loadMovieDetail(selected.slug, cfg);
                    }.bind(this),
                    onBack: function () {
                        Lampa.Controller.toggle('content');
                    }
                });
            }
        };

        this.loadMovieDetail = function (slug, cfg) {
            Lampa.Loading.start();
            var detailUrl = cfg.detail + slug;

            fetchJson(detailUrl, function (res) {
                Lampa.Loading.stop();

                if (!res || (!res.movie && !res.status)) {
                    Lampa.Noty.show('Không thể lấy thông tin chi tiết phim!');
                    return;
                }

                var episodes = res.episodes || [];
                if (episodes.length === 0) {
                    Lampa.Noty.show('Phim chưa có tập phát sóng!');
                    return;
                }

                if (episodes.length === 1) {
                    this.showEpisodeList(episodes[0], res.movie || res.data?.item || {});
                } else {
                    var serverItems = episodes.map(function (server, idx) {
                        return {
                            title: server.server_name || ('Server ' + (idx + 1)),
                            serverData: server
                        };
                    });

                    Lampa.Select.show({
                        title: 'Chọn Server',
                        items: serverItems,
                        onSelect: function (selected) {
                            this.showEpisodeList(selected.serverData, res.movie || res.data?.item || {});
                        }.bind(this),
                        onBack: function () {
                            Lampa.Controller.toggle('content');
                        }
                    });
                }
            }.bind(this), function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi tải chi tiết: ' + err);
            });
        };

        this.showEpisodeList = function (server, movieDetail) {
            var serverData = server.server_data || [];
            if (serverData.length === 0) {
                Lampa.Noty.show('Server này không có tập phim!');
                return;
            }

            if (serverData.length === 1) {
                this.playVideo(serverData[0], serverData, 0, movieDetail);
            } else {
                var epItems = serverData.map(function (ep, idx) {
                    return {
                        title: ep.name || ('Tập ' + (idx + 1)),
                        epData: ep,
                        index: idx
                    };
                });

                Lampa.Select.show({
                    title: 'Chọn tập phim (' + (server.server_name || 'Server') + ')',
                    items: epItems,
                    onSelect: function (selected) {
                        this.playVideo(selected.epData, serverData, selected.index, movieDetail);
                    }.bind(this),
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
    }

    if (window.appready) {
        new VNPhimPlugin().init();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                new VNPhimPlugin().init();
            }
        });
    }
})();
