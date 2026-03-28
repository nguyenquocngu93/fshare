(function () {
    'use strict';

    var API_BASE = 'https://phimapi.com';

    var categories = [
        { title: 'Phim Mới Cập Nhật', url: 'phim-moi-cap-nhat' },
        { title: 'Phim Lẻ', url: 'phim-le' },
        { title: 'Phim Bộ', url: 'phim-bo' },
        { title: 'Hoạt Hình', url: 'hoat-hinh' },
        { title: 'TV Shows', url: 'tv-shows' }
    ];

    var Img = {
        fix: function (url) {
            if (!url) return '';
            if (url.indexOf('http') === 0) return url;
            return 'https://phimimg.com/' + url;
        }
    };

    function catUrl(type, page) {
        if (type === 'phim-moi-cap-nhat') return API_BASE + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=24';
    }

    function detailUrl(slug) {
        return API_BASE + '/phim/' + slug;
    }

    function parseItems(data) {
        if (data && data.items) return data.items;
        if (data && data.data && data.data.items) return data.data.items;
        if (Array.isArray(data)) return data;
        return [];
    }

    // =================== CSS ===================
    function addCSS() {
        if (document.getElementById('kkk-css')) return;
        var s = document.createElement('style');
        s.id = 'kkk-css';
        s.textContent = '\
.kkk-row { margin-bottom:1.5em; }\
.kkk-row__title { display:flex; align-items:center; justify-content:space-between; padding:0 1.5em 0.5em; }\
.kkk-row__name { font-size:1.3em; font-weight:bold; color:#fff; }\
.kkk-row__more { font-size:0.85em; color:#ffaa00; cursor:pointer; padding:0.3em 0.8em; border-radius:0.3em; }\
.kkk-row__more.focus { background:rgba(255,170,0,0.3); }\
.kkk-row__items { display:flex; gap:0.8em; padding:0 1.5em; overflow:visible; }\
.kkk-poster { flex-shrink:0; width:130px; cursor:pointer; }\
.kkk-poster.focus .kkk-poster__img-wrap { border-color:#fff; transform:scale(1.05); }\
.kkk-poster__img-wrap { position:relative; border-radius:0.6em; overflow:hidden; border:2px solid transparent; transition:all 0.15s; }\
.kkk-poster__img { width:100%; height:195px; object-fit:cover; display:block; }\
.kkk-poster__quality { position:absolute; top:4px; left:4px; background:rgba(255,140,0,0.9); color:#fff; font-size:0.6em; padding:1px 5px; border-radius:3px; font-weight:bold; }\
.kkk-poster__ep { position:absolute; bottom:0; left:0; right:0; background:linear-gradient(transparent,rgba(0,0,0,0.85)); color:#fff; font-size:0.6em; padding:8px 4px 3px; text-align:center; }\
.kkk-poster__title { color:#fff; font-size:0.78em; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\
.kkk-poster__year { color:#666; font-size:0.68em; }\
\
.kkk-detail { position:relative; }\
.kkk-backdrop { width:100%; height:280px; object-fit:cover; display:block; }\
.kkk-backdrop-gradient { position:absolute; top:0; left:0; right:0; height:280px; background:linear-gradient(to top,#1a1a1a 0%,rgba(26,26,26,0.6) 50%,rgba(26,26,26,0.2) 100%); pointer-events:none; }\
.kkk-detail__body { position:relative; margin-top:-90px; padding:0 1.5em; z-index:2; }\
.kkk-detail__top { display:flex; gap:1.2em; }\
.kkk-detail__poster-wrap { width:130px; flex-shrink:0; }\
.kkk-detail__poster-wrap img { width:100%; border-radius:0.5em; box-shadow:0 4px 20px rgba(0,0,0,0.5); }\
.kkk-detail__info { flex:1; min-width:0; padding-top:8px; }\
.kkk-detail__name { font-size:1.4em; font-weight:bold; color:#fff; line-height:1.2; }\
.kkk-detail__orig { font-size:0.85em; color:#888; margin:2px 0 8px; }\
.kkk-detail__tags { display:flex; gap:0.4em; flex-wrap:wrap; margin-bottom:8px; }\
.kkk-detail__tag { background:rgba(255,255,255,0.1); color:#ccc; font-size:0.7em; padding:2px 8px; border-radius:20px; }\
.kkk-detail__tag--accent { background:rgba(255,140,0,0.25); color:#ffaa00; }\
.kkk-detail__genres { color:#777; font-size:0.75em; margin-bottom:3px; }\
.kkk-detail__countries { color:#777; font-size:0.75em; }\
\
.kkk-desc-section { padding:0.8em 1.5em 0; }\
.kkk-desc-text { color:#aaa; font-size:0.82em; line-height:1.5; max-height:4em; overflow:hidden; transition:max-height 0.3s; }\
.kkk-desc-text--full { max-height:999px; }\
.kkk-desc-toggle { color:#ffaa00; font-size:0.78em; cursor:pointer; padding:0.3em 0; display:inline-block; }\
.kkk-desc-toggle.focus { text-decoration:underline; }\
\
.kkk-play-section { padding:0.8em 1.5em; }\
.kkk-play-title { font-size:1.1em; font-weight:bold; color:#fff; margin-bottom:0.6em; }\
.kkk-server-name { font-size:0.95em; font-weight:bold; color:#ffaa00; margin:0.6em 0 0.3em; }\
.kkk-ep-grid { display:flex; flex-wrap:wrap; gap:0.4em; margin-bottom:0.6em; }\
.kkk-ep-btn { background:rgba(255,255,255,0.08); color:#fff; padding:0.45em 0.9em; border-radius:0.4em; font-size:0.8em; min-width:42px; text-align:center; cursor:pointer; }\
.kkk-ep-btn.focus { background:#ff8c00; color:#000; font-weight:bold; }\
\
.kkk-catalog-wrap { display:flex; flex-wrap:wrap; gap:0.8em; padding:0.5em 1.5em; }\
.kkk-load-wrap { width:100%; text-align:center; padding:1.2em 0; }\
.kkk-load-btn { display:inline-block; background:rgba(255,255,255,0.08); color:#ffaa00; padding:0.6em 2em; border-radius:2em; font-size:0.95em; cursor:pointer; }\
.kkk-load-btn.focus { background:rgba(255,140,0,0.3); }\
';
        document.head.appendChild(s);
    }

    // =================== Helpers ===================
    function createPosterElement(item, onClick) {
        var card = document.createElement('div');
        card.className = 'selector kkk-poster';

        var imgUrl = Img.fix(item.poster_url || item.thumb_url || '');

        card.innerHTML =
            '<div class="kkk-poster__img-wrap">' +
                '<img class="kkk-poster__img" src="' + imgUrl + '" onerror="this.src=\'https://via.placeholder.com/130x195?text=No\'" loading="lazy" />' +
                (item.quality ? '<div class="kkk-poster__quality">' + item.quality + '</div>' : '') +
                (item.episode_current ? '<div class="kkk-poster__ep">' + item.episode_current + '</div>' : '') +
            '</div>' +
            '<div class="kkk-poster__title">' + (item.name || item.origin_name || '') + '</div>' +
            '<div class="kkk-poster__year">' + (item.year || '') + '</div>';

        card.addEventListener('hover:enter', function () {
            if (onClick) onClick(item);
        });

        return card;
    }

    function openDetail(item) {
        Lampa.Activity.push({
            url: item.slug,
            title: item.name || item.origin_name || '',
            component: 'kkkphim_detail',
            page: 1
        });
    }

    // =================== MAIN (Home rows) ===================
    function KKKMainComponent(object) {
        var comp = this;
        var body = $('<div></div>');
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var network = new Lampa.Reguest();
        var created = false;
        var loadedCount = 0;
        var rowsData = [];

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            scroll.minus();
            scroll.body().addClass('torrent-list');

            categories.forEach(function (cat, idx) {
                _this.loadRow(cat, idx);
            });
        };

        this.loadRow = function (cat, idx) {
            var _this = this;
            var url = catUrl(cat.url, 1);

            network.timeout(15000);
            network.silent(url, function (data) {
                var items = parseItems(data);
                rowsData[idx] = { cat: cat, items: items };
                loadedCount++;
                if (loadedCount >= categories.length) {
                    _this.renderAllRows();
                }
            }, function () {
                rowsData[idx] = { cat: cat, items: [] };
                loadedCount++;
                if (loadedCount >= categories.length) {
                    _this.renderAllRows();
                }
            });
        };

        this.renderAllRows = function () {
            var _this = this;
            this.activity.loader(false);

            rowsData.forEach(function (rd) {
                if (!rd || !rd.items.length) return;
                _this.buildRow(rd.cat, rd.items);
            });

            this.activity.toggle();
        };

        this.buildRow = function (cat, items) {
            var row = $('<div class="kkk-row"></div>');

            // Title
            var titleBar = $('<div class="kkk-row__title"></div>');
            titleBar.append('<div class="kkk-row__name">' + cat.title + '</div>');

            var moreBtn = $('<div class="selector kkk-row__more">Xem thêm ›</div>');
            moreBtn.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkkphim_catalog',
                    page: 1
                });
            });
            titleBar.append(moreBtn);
            row.append(titleBar);

            // Items row (horizontal)
            var rowItems = $('<div class="kkk-row__items"></div>');

            items.slice(0, 15).forEach(function (item) {
                var card = createPosterElement(item, openDetail);
                rowItems.append(card);
            });

            row.append(rowItems);
            scroll.append(row);
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
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
    }

    // =================== CATALOG (Grid + Load More) ===================
    function KKKCatalogComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var network = new Lampa.Reguest();
        var created = false;
        var page = 0;
        var loading = false;
        var category_url = object.url || 'phim-moi-cap-nhat';
        var gridEl;
        var loadMoreWrap;

        this.create = function () {
            scroll.minus();
            scroll.body().addClass('torrent-list');

            gridEl = $('<div class="kkk-catalog-wrap"></div>');
            scroll.append(gridEl);

            this.loadMore();
        };

        this.loadMore = function () {
            if (loading) return;
            loading = true;
            page++;

            var _this = this;
            if (page === 1) this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(catUrl(category_url, page), function (data) {
                _this.activity.loader(false);
                loading = false;

                var items = parseItems(data);
                if (items.length) {
                    _this.appendCards(items);
                    _this.activity.toggle();
                } else if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            }, function () {
                _this.activity.loader(false);
                loading = false;
                if (page === 1) {
                    _this.showEmpty();
                    _this.activity.toggle();
                }
            });
        };

        this.appendCards = function (items) {
            var _this = this;

            // Remove old load more
            if (loadMoreWrap) {
                loadMoreWrap.remove();
                loadMoreWrap = null;
            }

            items.forEach(function (item) {
                var card = createPosterElement(item, openDetail);
                card.style.width = '130px';
                gridEl.append(card);
            });

            // Add load more button
            loadMoreWrap = $('<div class="kkk-load-wrap"></div>');
            var btn = $('<div class="selector kkk-load-btn">📄 Tải thêm (Trang ' + (page + 1) + ')</div>');
            btn.on('hover:enter', function () {
                _this.loadMore();
            });
            loadMoreWrap.append(btn);
            scroll.append(loadMoreWrap);
        };

        this.showEmpty = function () {
            scroll.append($('<div style="padding:3em;color:#fff;text-align:center;font-size:1.2em;">Không tìm thấy phim nào</div>'));
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== DETAIL (Backdrop) ===================
    function KKKDetailComponent(object) {
        var scroll = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var network = new Lampa.Reguest();
        var created = false;
        var slug = object.url || '';

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            scroll.minus();
            scroll.body().addClass('torrent-list');

            network.clear();
            network.timeout(15000);
            network.silent(detailUrl(slug), function (data) {
                _this.activity.loader(false);

                if (data && data.movie) {
                    _this.buildDetail(data.movie, data.episodes || []);
                } else {
                    _this.showEmpty();
                }
                _this.activity.toggle();
            }, function () {
                _this.activity.loader(false);
                _this.showEmpty();
                _this.activity.toggle();
            });
        };

        this.buildDetail = function (movie, episodes) {
            var _this = this;

            var backdropUrl = Img.fix(movie.thumb_url || movie.poster_url || '');
            var posterUrl = Img.fix(movie.poster_url || movie.thumb_url || '');

            // ---- Backdrop ----
            var backdropWrap = $('<div class="kkk-detail"></div>');
            backdropWrap.html(
                '<img class="kkk-backdrop" src="' + backdropUrl + '" onerror="this.style.height=\'120px\';this.style.background=\'#333\';" />' +
                '<div class="kkk-backdrop-gradient"></div>'
            );

            // ---- Body (poster + info) ----
            var bodyEl = $('<div class="kkk-detail__body"></div>');
            var topEl = $('<div class="kkk-detail__top"></div>');

            // Tags
            var tagsHtml = '';
            var tagData = [];
            if (movie.quality) tagData.push({ t: movie.quality, a: true });
            if (movie.lang) tagData.push({ t: movie.lang, a: false });
            if (movie.year) tagData.push({ t: String(movie.year), a: false });
            if (movie.episode_current) tagData.push({ t: movie.episode_current, a: true });
            if (movie.time) tagData.push({ t: movie.time, a: false });

            tagData.forEach(function (d) {
                tagsHtml += '<span class="kkk-detail__tag' + (d.a ? ' kkk-detail__tag--accent' : '') + '">' + d.t + '</span>';
            });

            var genres = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countries = (movie.country || []).map(function (c) { return c.name; }).join(', ');

            topEl.html(
                '<div class="kkk-detail__poster-wrap">' +
                    '<img src="' + posterUrl + '" onerror="this.src=\'https://via.placeholder.com/130x195?text=No\'" />' +
                '</div>' +
                '<div class="kkk-detail__info">' +
                    '<div class="kkk-detail__name">' + (movie.name || '') + '</div>' +
                    '<div class="kkk-detail__orig">' + (movie.origin_name || '') + '</div>' +
                    '<div class="kkk-detail__tags">' + tagsHtml + '</div>' +
                    (genres ? '<div class="kkk-detail__genres">🎭 ' + genres + '</div>' : '') +
                    (countries ? '<div class="kkk-detail__countries">🌍 ' + countries + '</div>' : '') +
                '</div>'
            );

            bodyEl.append(topEl);
            backdropWrap.append(bodyEl);
            scroll.append(backdropWrap);

            // ---- Description ----
            var desc = (movie.content || '').replace(/<[^>]*>/g, '').trim();
            if (desc) {
                var descSection = $('<div class="kkk-desc-section"></div>');
                var descText = $('<div class="kkk-desc-text"></div>');
                descText.text(desc);
                descSection.append(descText);

                if (desc.length > 120) {
                    var toggleBtn = $('<div class="selector kkk-desc-toggle">▼ Xem thêm</div>');
                    var expanded = false;

                    toggleBtn.on('hover:enter', function () {
                        expanded = !expanded;
                        if (expanded) {
                            descText.addClass('kkk-desc-text--full');
                            toggleBtn.text('▲ Thu gọn');
                        } else {
                            descText.removeClass('kkk-desc-text--full');
                            toggleBtn.text('▼ Xem thêm');
                        }
                    });

                    descSection.append(toggleBtn);
                }

                scroll.append(descSection);
            }

            // ---- Episodes ----
            if (episodes && episodes.length) {
                var playSection = $('<div class="kkk-play-section"></div>');
                playSection.append('<div class="kkk-play-title">🎬 Danh sách phát</div>');

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    playSection.append('<div class="kkk-server-name">▶ ' + (server.server_name || 'Server') + '</div>');

                    var epGrid = $('<div class="kkk-ep-grid"></div>');

                    server.server_data.forEach(function (ep, idx) {
                        var btn = $('<div class="selector kkk-ep-btn">' + (ep.name || ep.slug || ('Tập ' + (idx + 1))) + '</div>');

                        btn.on('hover:enter', function () {
                            _this.playEp(ep, movie, server.server_data);
                        });

                        epGrid.append(btn);
                    });

                    playSection.append(epGrid);
                });

                scroll.append(playSection);
            }
        };

        this.playEp = function (ep, movie, allEps) {
            var url = ep.link_m3u8 || ep.link_embed || '';

            if (!url) {
                Lampa.Noty.show('Không tìm thấy link phát');
                return;
            }

            if (url.indexOf('.m3u8') !== -1) {
                var playlist = [];
                var currentIdx = 0;

                allEps.forEach(function (e, i) {
                    var eUrl = e.link_m3u8 || '';
                    if (eUrl) {
                        if (eUrl === url) currentIdx = playlist.length;
                        playlist.push({
                            title: (movie.name || 'KKKPhim') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                            url: eUrl,
                            quality: { auto: eUrl },
                            timeline: Lampa.Timeline.view({})
                        });
                    }
                });

                if (playlist.length) {
                    Lampa.Player.play(playlist[currentIdx]);
                    Lampa.Player.playlist(playlist);
                }
            } else {
                Lampa.Noty.show('Link embed không hỗ trợ phát trực tiếp');
            }
        };

        this.showEmpty = function () {
            scroll.append($('<div style="padding:3em;color:#fff;text-align:center;font-size:1.2em;">Không tải được thông tin phim</div>'));
        };

        this.start = function () {
            if (created) return;
            created = true;
            this.create();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
        };
    }

    // =================== INIT ===================
    function initPlugin() {
        addCSS();

        Lampa.Component.add('kkkphim_main', KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail', KKKDetailComponent);

        var ico = '<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/><polygon points="10,8 16,12 10,16" fill="currentColor"/></svg>';

        var menuItem = $('<li class="menu__item selector" data-action="kkkphim"><div class="menu__ico">' + ico + '</div><div class="menu__text">KKKPhim</div></li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKKPhim',
                component: 'kkkphim_main',
                page: 1
            });
        });

        $('.menu .menu__list').eq(0).append(menuItem);

        Lampa.Noty.show('✅ KKKPhim v3 đã sẵn sàng!');
    }

    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }

})();