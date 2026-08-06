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
        },
        ophim: {
            name: 'OPhim',
            search: 'https://ophim1.cc/v1/api/tim-kiem?keyword=',
            detail: 'https://ophim1.cc/v1/api/phim/',
            list: 'https://ophim1.cc/v1/api/danh-sach/',
            img: 'https://img.ophim.live/uploads/movies/'
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

    function injectStyles() {
        if ($('#vn-phim-styles').length > 0) return;
        var css = 
            '<style id="vn-phim-styles">' +
            '.vn-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 14, 23, 0.95); z-index: 1000; display: flex; flex-direction: column; color: #fff; font-family: sans-serif; overflow: hidden; animation: vnFadeIn 0.3s ease; }' +
            '@keyframes vnFadeIn { from { opacity: 0; } to { opacity: 1; } }' +
            '.vn-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 28px; background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }' +
            '.vn-modal-title { font-size: 1.4em; font-weight: bold; color: #e50914; display: flex; align-items: center; gap: 10px; }' +
            '.vn-modal-close { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 1em; }' +
            '.vn-modal-close:focus, .vn-modal-close:hover { background: #e50914; color: #fff; }' +
            '.vn-modal-body { flex: 1; overflow-y: auto; padding: 24px 28px; }' +
            '.vn-info-container { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 24px; }' +
            '.vn-info-poster { width: 220px; height: 320px; border-radius: 12px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.6); border: 2px solid rgba(255,255,255,0.1); }' +
            '.vn-info-details { flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 12px; }' +
            '.vn-movie-title { font-size: 1.8em; font-weight: bold; margin: 0; color: #fff; }' +
            '.vn-movie-orig { font-size: 1.1em; color: #aaa; font-style: italic; }' +
            '.vn-badges { display: flex; gap: 8px; flex-wrap: wrap; margin: 6px 0; }' +
            '.vn-badge { background: #e50914; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 0.85em; font-weight: bold; }' +
            '.vn-badge-sec { background: rgba(255,255,255,0.15); color: #ddd; padding: 4px 10px; border-radius: 4px; font-size: 0.85em; }' +
            '.vn-synopsis { font-size: 0.95em; line-height: 1.6; color: #ccc; background: rgba(0,0,0,0.3); padding: 14px; border-radius: 8px; border-left: 4px solid #e50914; max-height: 150px; overflow-y: auto; }' +
            '.vn-section-title { font-size: 1.2em; font-weight: bold; margin: 20px 0 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; color: #ffc107; }' +
            '.vn-episodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; }' +
            '.vn-ep-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.2s; font-size: 0.9em; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }' +
            '.vn-ep-btn:focus, .vn-ep-btn:hover { background: #e50914; border-color: #e50914; transform: scale(1.05); }' +
            '.vn-servers-list { display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }' +
            '.vn-server-btn { background: rgba(255,255,255,0.1); color: #fff; padding: 8px 14px; border-radius: 20px; cursor: pointer; border: 1px solid transparent; }' +
            '.vn-server-btn.active, .vn-server-btn:focus { background: #e50914; border-color: #fff; font-weight: bold; }' +
            '</style>';
        $('head').append(css);
    }

    function VNPhimPlugin() {
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
                        self.loadCategoryList(item.cat, item.title, 1);
                    }
                },
                onBack: function () {
                    Lampa.Controller.toggle('menu');
                }
            });
        };

        this.promptSearch = function () {
            var self = this;
            Lampa.Input.edit({
                title: 'Nhập tên phim cần tìm',
                value: '',
                free: true
            }, function (keyword) {
                if (keyword && keyword.trim()) {
                    self.executeSearch(keyword.trim(), 1);
                }
            });
        };

        this.executeSearch = function (keyword, page) {
            var self = this;
            Lampa.Loading.start();

            var searchUrl = CONFIG.kkphim.search + encodeURIComponent(keyword) + '&page=' + (page || 1);

            fetchJson(searchUrl, function (res) {
                Lampa.Loading.stop();
                var items = (res && res.data && res.data.items) ? res.data.items : [];

                if (items.length === 0) {
                    Lampa.Noty.show('Không tìm thấy phim phù hợp!');
                    return;
                }

                var selectItems = items.map(function (it) {
                    var poster = fixImgUrl(it.poster_url || it.thumb_url, CONFIG.kkphim.img);
                    return {
                        title: it.name,
                        subtitle: (it.origin_name ? it.origin_name + ' | ' : '') + (it.year ? 'Năm: ' + it.year : ''),
                        image: poster,
                        slug: it.slug,
                        raw: it
                    };
                });

                Lampa.Select.show({
                    title: 'Kết quả tìm kiếm: "' + keyword + '"',
                    items: selectItems,
                    onSelect: function (selected) {
                        self.openMovieInfoPage(selected.slug, CONFIG.kkphim);
                    },
                    onBack: function () {
                        self.showCategoryMenu();
                    }
                });
            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi tìm kiếm: ' + err);
            });
        };

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
                    var poster = fixImgUrl(it.poster_url || it.thumb_url, CONFIG.kkphim.img);
                    return {
                        title: it.name,
                        subtitle: (it.origin_name ? it.origin_name + ' | ' : '') + (it.year ? 'Năm: ' + it.year + ' | ' : '') + (it.episode_current || ''),
                        image: poster,
                        slug: it.slug,
                        raw: it
                    };
                });

                var pagination = res.data && res.data.params && res.data.params.pagination;
                var totalPages = pagination ? Math.ceil(pagination.totalItems / pagination.totalItemsPerPage) : 10;

                if (page < totalPages) {
                    selectItems.push({
                        title: '➡️ Trang Tiếp theo (' + (page + 1) + ')',
                        subtitle: 'Xem thêm phim trang sau...',
                        isNext: true
                    });
                }

                Lampa.Select.show({
                    title: catTitle + ' - Trang ' + page,
                    items: selectItems,
                    onSelect: function (selected) {
                        if (selected.isNext) {
                            self.loadCategoryList(cat, catTitle, page + 1);
                        } else {
                            self.openMovieInfoPage(selected.slug, CONFIG.kkphim);
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

        this.openMovieInfoPage = function (slug, cfg) {
            var self = this;
            cfg = cfg || CONFIG.kkphim;

            Lampa.Loading.start();

            var detailUrl = cfg.detail + slug;

            fetchJson(detailUrl, function (res) {
                Lampa.Loading.stop();

                var movie = (res && res.movie) ? res.movie : (res && res.data && res.data.item ? res.data.item : null);
                var episodes = (res && res.episodes) ? res.episodes : (res && res.data && res.data.episodes ? res.data.episodes : []);

                if (!movie) {
                    Lampa.Noty.show('Không thể lấy thông tin phim!');
                    return;
                }

                self.renderInfoModal(movie, episodes, cfg);

            }, function (err) {
                Lampa.Loading.stop();
                Lampa.Noty.show('Lỗi lấy thông tin phim: ' + err);
            });
        };

        this.renderInfoModal = function (movie, episodes, cfg) {
            var self = this;
            $('.vn-modal-overlay').remove();

            var poster = fixImgUrl(movie.poster_url || movie.thumb_url, cfg.img);
            var title = movie.name || movie.title || 'Chưa rõ tên';
            var origTitle = movie.origin_name || movie.original_name || '';
            var year = movie.year || '';
            var quality = movie.quality || 'HD';
            var lang = movie.lang || 'Vietsub';
            var epCurrent = movie.episode_current || movie.time || '';
            var categoryStr = (movie.category || []).map(function(c){ return c.name; }).join(', ');
            var countryStr = (movie.country || []).map(function(c){ return c.name; }).join(', ');
            var content = (movie.content || movie.description || 'Đang cập nhật nội dung phim...').replace(/<[^>]*>?/gm, '');

            var modalHtml = 
                '<div class="vn-modal-overlay">' +
                    '<div class="vn-modal-header">' +
                        '<div class="vn-modal-title">' +
                            '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H9l2 4H8L6 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>' +
                            '<span>' + title + '</span>' +
                        '</div>' +
                        '<button class="vn-modal-close selector">✕ Đóng</button>' +
                    '</div>' +
                    '<div class="vn-modal-body">' +
                        '<div class="vn-info-container">' +
                            '<img class="vn-info-poster" src="' + poster + '" alt="' + title + '" />' +
                            '<div class="vn-info-details">' +
                                '<h1 class="vn-movie-title">' + title + '</h1>' +
                                (origTitle ? '<div class="vn-movie-orig">' + origTitle + '</div>' : '') +
                                '<div class="vn-badges">' +
                                    '<span class="vn-badge">' + quality + '</span>' +
                                    '<span class="vn-badge">' + lang + '</span>' +
                                    (year ? '<span class="vn-badge-sec">📅 ' + year + '</span>' : '') +
                                    (epCurrent ? '<span class="vn-badge-sec">📺 ' + epCurrent + '</span>' : '') +
                                    (countryStr ? '<span class="vn-badge-sec">🌍 ' + countryStr + '</span>' : '') +
                                '</div>' +
                                (categoryStr ? '<div style="font-size:0.9em; color:#bbb;"><b>Thể loại:</b> ' + categoryStr + '</div>' : '') +
                                '<div class="vn-synopsis">' + content + '</div>' +
                            '</div>' +
                        '</div>' +

                        '<div class="vn-section-title">🎬 Danh Sách Tập Phim</div>' +
                        '<div class="vn-servers-container"></div>' +
                        '<div class="vn-episodes-grid"></div>' +
                    '</div>' +
                '</div>';

            var $modal = $(modalHtml);
            $('body').append($modal);

            $modal.find('.vn-modal-close').on('hover:enter click', function () {
                $modal.remove();
            });

            var handleBack = function(e) {
                if (e.keyCode === 27 || e.keyCode === 8 || e.code === 'BackSpace') {
                    $modal.remove();
                    $(document).off('keydown', handleBack);
                }
            };
            $(document).on('keydown', handleBack);

            if (!episodes || episodes.length === 0) {
                $modal.find('.vn-episodes-grid').html('<div style="color:#aaa;">Chưa có tập phim nào được cập nhật!</div>');
                return;
            }

            var $serversContainer = $modal.find('.vn-servers-container');
            var $episodesGrid = $modal.find('.vn-episodes-grid');

            function renderEpisodesForServer(serverIndex) {
                var server = episodes[serverIndex];
                var serverData = (server && server.server_data) ? server.server_data : [];

                $episodesGrid.empty();

                if (serverData.length === 0) {
                    $episodesGrid.html('<div style="color:#aaa;">Server này không có dữ liệu!</div>');
                    return;
                }

                serverData.forEach(function (ep, idx) {
                    var epBtn = $('<div class="vn-ep-btn selector">' + (ep.name || ('Tập ' + (idx + 1))) + '</div>');
                    epBtn.on('hover:enter click', function () {
                        self.playVideoStream(ep, serverData, idx, movie);
                    });
                    $episodesGrid.append(epBtn);
                });
            }

            if (episodes.length > 1) {
                var $serversList = $('<div class="vn-servers-list"></div>');
                episodes.forEach(function (srv, idx) {
                    var srvBtn = $('<button class="vn-server-btn selector ' + (idx === 0 ? 'active' : '') + '">' + (srv.server_name || ('Server ' + (idx + 1))) + '</button>');
                    srvBtn.on('hover:enter click', function () {
                        $serversList.find('.vn-server-btn').removeClass('active');
                        srvBtn.addClass('active');
                        renderEpisodesForServer(idx);
                    });
                    $serversList.append(srvBtn);
                });
                $serversContainer.append($serversList);
            }

            renderEpisodesForServer(0);

            setTimeout(function () {
                var $firstBtn = $modal.find('.selector').first();
                if ($firstBtn.length && Lampa.Controller) {
                    Lampa.Controller.focus($firstBtn);
                }
            }, 200);
        };

        this.playVideoStream = function (ep, allEpisodes, startIndex, movieDetail) {
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
                            self.executeSearch(searchTitle, 1);
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
