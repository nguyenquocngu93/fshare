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
        if (type === 'phim-moi-cap-nhat') {
            return API_BASE + '/danh-sach/phim-moi-cap-nhat?page=' + page;
        }
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

    // =================== Tính số cột theo chiều rộng ===================
    function getColumns() {
        var w = window.innerWidth;
        if (w >= 1400) return 7;
        if (w >= 1200) return 6;
        if (w >= 1000) return 5;
        if (w >= 800)  return 4;
        if (w >= 600)  return 3;
        return 2;
    }

    // =================== Tạo card poster ===================
    function createCard(item, onEnter) {
        var imgUrl  = Img.fix(item.poster_url || item.thumb_url || '');
        var title   = item.name || item.origin_name || '';
        var year    = item.year || '';
        var quality = item.quality || '';
        var epText  = item.episode_current || '';

        var card = document.createElement('div');
        card.classList.add('card', 'selector');
        card.setAttribute('tabindex', '0');

        card.innerHTML = [
            '<div class="card__view">',
                '<img src="' + imgUrl + '" ',
                    'onerror="this.src=\'./img/img_broken.svg\'" ',
                    'loading="lazy" />',
                (quality
                    ? '<div class="card__quality">' + quality + '</div>'
                    : ''),
                (epText
                    ? '<div class="card__episode">' + epText + '</div>'
                    : ''),
            '</div>',
            '<div class="card__title">' + title + '</div>',
            '<div class="card__age">' + year + '</div>'
        ].join('');

        // === SỬA: Dùng sự kiện hover:enter đúng cách qua jQuery ===
        $(card).on('hover:enter', function () {
            if (onEnter) onEnter(item);
        });

        // === SỬA: Thêm xử lý focus/blur cho card ===
        $(card).on('hover:focus', function () {
            // Focus animation đã được CSS xử lý qua .focus class
        });

        return card;
    }

    // =================== CSS bổ sung ===================
    function addCSS() {
        if (document.getElementById('kkk-css')) return;

        var s = document.createElement('style');
        s.id = 'kkk-css';
        s.textContent = [
            /* ---- Card grid tự chia cột ---- */
            '.kkk-grid {',
            '   display: flex;',
            '   flex-wrap: wrap;',
            '   padding: 0 1em;',
            '}',
            '.kkk-grid > .card {',
            '   padding: 0.5em;',
            '   box-sizing: border-box;',
            '}',

            /* ---- Row (trang chủ) ---- */
            '.kkk-line {',
            '   margin-bottom: 1.5em;',
            '}',
            '.kkk-line__head {',
            '   display: flex;',
            '   align-items: center;',
            '   justify-content: space-between;',
            '   padding: 0 1.5em 0.5em;',
            '}',
            '.kkk-line__title {',
            '   font-size: 1.3em;',
            '   font-weight: bold;',
            '   color: #fff;',
            '}',
            '.kkk-line__more {',
            '   font-size: 0.85em;',
            '   color: #ffaa00;',
            '   cursor: pointer;',
            '   padding: 0.3em 0.8em;',
            '   border-radius: 0.3em;',
            '}',
            '.kkk-line__more.focus {',
            '   background: rgba(255,170,0,0.3);',
            '}',
            '.kkk-line__body {',
            '   display: flex;',
            '   padding: 0 1.5em;',
            '   overflow: visible;',
            '}',
            '.kkk-line__body > .card {',
            '   flex-shrink: 0;',
            '   width: 13em;',
            '   margin-right: 0.8em;',
            '}',

            /* ---- Card style ---- */
            '.card {',
            '   cursor: pointer;',
            '   outline: none;',
            '}',
            '.card.focus .card__view,',
            '.card.hover .card__view {',
            '   border-color: #fff;',
            '   transform: scale(1.04);',
            '}',
            '.card__view {',
            '   position: relative;',
            '   border-radius: 0.6em;',
            '   overflow: hidden;',
            '   border: 3px solid transparent;',
            '   transition: border-color 0.15s, transform 0.15s;',
            '   background: #222;',
            '}',
            '.card__view img {',
            '   width: 100%;',
            '   aspect-ratio: 2/3;',
            '   object-fit: cover;',
            '   display: block;',
            '}',
            '.card__quality {',
            '   position: absolute;',
            '   top: 0.3em;',
            '   left: 0.3em;',
            '   background: rgba(255,140,0,0.9);',
            '   color: #fff;',
            '   font-size: 0.6em;',
            '   padding: 1px 6px;',
            '   border-radius: 3px;',
            '   font-weight: bold;',
            '}',
            '.card__episode {',
            '   position: absolute;',
            '   bottom: 0;',
            '   left: 0;',
            '   right: 0;',
            '   background: linear-gradient(transparent, rgba(0,0,0,0.85));',
            '   color: #fff;',
            '   font-size: 0.6em;',
            '   padding: 8px 4px 3px;',
            '   text-align: center;',
            '}',
            '.card__title {',
            '   color: #fff;',
            '   font-size: 0.8em;',
            '   margin-top: 0.3em;',
            '   overflow: hidden;',
            '   text-overflow: ellipsis;',
            '   white-space: nowrap;',
            '}',
            '.card__age {',
            '   color: #666;',
            '   font-size: 0.7em;',
            '}',

            /* ---- Detail page ---- */
            '.kkk-detail__backdrop {',
            '   position: relative;',
            '}',
            '.kkk-detail__backdrop img {',
            '   width: 100%;',
            '   height: 280px;',
            '   object-fit: cover;',
            '   display: block;',
            '}',
            '.kkk-detail__backdrop-gradient {',
            '   position: absolute;',
            '   top: 0; left: 0; right: 0;',
            '   height: 280px;',
            '   background: linear-gradient(to top, #1a1a1a 0%, rgba(26,26,26,0.6) 50%, rgba(26,26,26,0.2) 100%);',
            '   pointer-events: none;',
            '}',
            '.kkk-detail__body {',
            '   position: relative;',
            '   margin-top: -90px;',
            '   padding: 0 1.5em;',
            '   z-index: 2;',
            '}',
            '.kkk-detail__top {',
            '   display: flex;',
            '   gap: 1.2em;',
            '}',
            '.kkk-detail__poster {',
            '   width: 130px;',
            '   flex-shrink: 0;',
            '}',
            '.kkk-detail__poster img {',
            '   width: 100%;',
            '   border-radius: 0.5em;',
            '   box-shadow: 0 4px 20px rgba(0,0,0,0.5);',
            '}',
            '.kkk-detail__info {',
            '   flex: 1;',
            '   min-width: 0;',
            '   padding-top: 8px;',
            '}',
            '.kkk-detail__name {',
            '   font-size: 1.4em;',
            '   font-weight: bold;',
            '   color: #fff;',
            '   line-height: 1.2;',
            '}',
            '.kkk-detail__orig {',
            '   font-size: 0.85em;',
            '   color: #888;',
            '   margin: 2px 0 8px;',
            '}',
            '.kkk-detail__tags {',
            '   display: flex;',
            '   gap: 0.4em;',
            '   flex-wrap: wrap;',
            '   margin-bottom: 8px;',
            '}',
            '.kkk-detail__tag {',
            '   background: rgba(255,255,255,0.1);',
            '   color: #ccc;',
            '   font-size: 0.7em;',
            '   padding: 2px 8px;',
            '   border-radius: 20px;',
            '}',
            '.kkk-detail__tag--accent {',
            '   background: rgba(255,140,0,0.25);',
            '   color: #ffaa00;',
            '}',
            '.kkk-detail__meta {',
            '   color: #777;',
            '   font-size: 0.75em;',
            '   margin-bottom: 3px;',
            '}',

            /* ---- Description ---- */
            '.kkk-desc {',
            '   padding: 0.8em 1.5em 0;',
            '}',
            '.kkk-desc__text {',
            '   color: #aaa;',
            '   font-size: 0.82em;',
            '   line-height: 1.5;',
            '   max-height: 4em;',
            '   overflow: hidden;',
            '   transition: max-height 0.3s;',
            '}',
            '.kkk-desc__text--full {',
            '   max-height: 999px;',
            '}',
            '.kkk-desc__toggle {',
            '   color: #ffaa00;',
            '   font-size: 0.78em;',
            '   cursor: pointer;',
            '   padding: 0.3em 0;',
            '   display: inline-block;',
            '}',
            '.kkk-desc__toggle.focus {',
            '   text-decoration: underline;',
            '}',

            /* ---- Episodes ---- */
            '.kkk-play {',
            '   padding: 0.8em 1.5em;',
            '}',
            '.kkk-play__title {',
            '   font-size: 1.1em;',
            '   font-weight: bold;',
            '   color: #fff;',
            '   margin-bottom: 0.6em;',
            '}',
            '.kkk-play__server {',
            '   font-size: 0.95em;',
            '   font-weight: bold;',
            '   color: #ffaa00;',
            '   margin: 0.6em 0 0.3em;',
            '}',
            '.kkk-play__grid {',
            '   display: flex;',
            '   flex-wrap: wrap;',
            '   gap: 0.4em;',
            '   margin-bottom: 0.6em;',
            '}',
            '.kkk-play__ep {',
            '   background: rgba(255,255,255,0.08);',
            '   color: #fff;',
            '   padding: 0.45em 0.9em;',
            '   border-radius: 0.4em;',
            '   font-size: 0.8em;',
            '   min-width: 42px;',
            '   text-align: center;',
            '   cursor: pointer;',
            '}',
            '.kkk-play__ep.focus {',
            '   background: #ff8c00;',
            '   color: #000;',
            '   font-weight: bold;',
            '}',

            /* ---- Load more ---- */
            '.kkk-more {',
            '   width: 100%;',
            '   text-align: center;',
            '   padding: 1.2em 0;',
            '}',
            '.kkk-more__btn {',
            '   display: inline-block;',
            '   background: rgba(255,255,255,0.08);',
            '   color: #ffaa00;',
            '   padding: 0.6em 2em;',
            '   border-radius: 2em;',
            '   font-size: 0.95em;',
            '   cursor: pointer;',
            '}',
            '.kkk-more__btn.focus {',
            '   background: rgba(255,140,0,0.3);',
            '}',

            /* ---- Empty ---- */
            '.kkk-empty {',
            '   padding: 3em;',
            '   color: #fff;',
            '   text-align: center;',
            '   font-size: 1.2em;',
            '}'
        ].join('\n');

        document.head.appendChild(s);
    }

    // =================== Cập nhật width card theo số cột ===================
    function updateCardWidth(gridEl) {
        var cols = getColumns();
        var el = gridEl instanceof $ ? gridEl[0] : gridEl;
        if (!el) return;
        var cards = el.querySelectorAll('.card');

        for (var i = 0; i < cards.length; i++) {
            cards[i].style.width = (100 / cols) + '%';
        }
    }

    // =================== OPEN DETAIL ===================
    function openDetail(item) {
        Lampa.Activity.push({
            url: item.slug,
            title: item.name || item.origin_name || '',
            component: 'kkkphim_detail',
            page: 1
        });
    }

    // =============================================================
    //  MAIN COMPONENT (Home – Các hàng ngang)
    // =============================================================
    function KKKMainComponent(object) {
        var comp     = this;
        var network  = new Lampa.Reguest();
        var scroll   = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items    = [];
        var created  = false;
        var loadedCount = 0;
        var rowsData = [];
        var active   = false;

        // === SỬA: Controller cho component ===
        this.create = function () {
            this.activity.loader(true);
            scroll.minus();

            var _this = this;

            categories.forEach(function (cat, idx) {
                _this.loadRow(cat, idx);
            });
        };

        this.loadRow = function (cat, idx) {
            var _this = this;

            network.timeout(15000);
            network.silent(catUrl(cat.url, 1), function (data) {
                rowsData[idx] = { cat: cat, items: parseItems(data) };
                loadedCount++;
                if (loadedCount >= categories.length) _this.build();
            }, function () {
                rowsData[idx] = { cat: cat, items: [] };
                loadedCount++;
                if (loadedCount >= categories.length) _this.build();
            });
        };

        this.build = function () {
            var _this = this;

            this.activity.loader(false);

            rowsData.forEach(function (rd) {
                if (!rd || !rd.items.length) return;
                _this.buildLine(rd.cat, rd.items);
            });

            // === SỬA: Kích hoạt Controller đúng cách ===
            this.activity.toggle();
        };

        this.buildLine = function (cat, list) {
            var line = document.createElement('div');
            line.className = 'kkk-line';

            // Head
            var head = document.createElement('div');
            head.className = 'kkk-line__head';

            var titleEl = document.createElement('div');
            titleEl.className = 'kkk-line__title';
            titleEl.textContent = cat.title;

            var moreEl = document.createElement('div');
            moreEl.className = 'selector kkk-line__more';
            moreEl.textContent = 'Xem thêm ›';
            items.push(moreEl);

            $(moreEl).on('hover:enter', function () {
                Lampa.Activity.push({
                    url: cat.url,
                    title: cat.title,
                    component: 'kkkphim_catalog',
                    page: 1
                });
            });

            head.appendChild(titleEl);
            head.appendChild(moreEl);
            line.appendChild(head);

            // Body (hàng ngang poster)
            var body = document.createElement('div');
            body.className = 'kkk-line__body';

            list.slice(0, 15).forEach(function (item) {
                var card = createCard(item, openDetail);
                items.push(card);
                body.appendChild(card);
            });

            line.appendChild(body);
            scroll.append(line);
        };

        this.start = function () {
            if (created) return;
            created = true;

            // === SỬA: Đăng ký controller ===
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
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

            this.create();
        };

        this.pause = function () {
            active = false;
        };

        this.stop = function () {
            active = false;
        };

        this.resume = function () {
            active = true;

            if (items.length) {
                this.activity.toggle();
            }
        };

        this.render = function () {
            return scroll.render(true);
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();

            items = [];
            rowsData = [];
            loadedCount = 0;
        };
    }

    // =============================================================
    //  CATALOG COMPONENT (Grid + Load More)
    // =============================================================
    function KKKCatalogComponent(object) {
        var comp         = this;
        var network      = new Lampa.Reguest();
        var scroll       = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items        = [];
        var created      = false;
        var page         = 0;
        var loading      = false;
        var category_url = object.url || 'phim-moi-cap-nhat';
        var gridEl;
        var loadMoreWrap;
        var active       = false;
        var resizeHandler;

        this.create = function () {
            scroll.minus();

            gridEl = document.createElement('div');
            gridEl.className = 'kkk-grid';
            scroll.append(gridEl);

            // === SỬA: Lưu handler để cleanup ===
            resizeHandler = function () {
                updateCardWidth(gridEl);
            };
            $(window).on('resize.kkkcat', resizeHandler);

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

                var list = parseItems(data);
                if (list.length) {
                    _this.appendCards(list);
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

        this.appendCards = function (list) {
            var _this = this;

            // Xóa nút load more cũ
            if (loadMoreWrap) {
                // === SỬA: Xóa item cũ khỏi danh sách items ===
                var oldBtn = loadMoreWrap.querySelector('.kkk-more__btn');
                if (oldBtn) {
                    var idx = items.indexOf(oldBtn);
                    if (idx > -1) items.splice(idx, 1);
                }
                loadMoreWrap.parentNode && loadMoreWrap.parentNode.removeChild(loadMoreWrap);
                loadMoreWrap = null;
            }

            var cols = getColumns();

            list.forEach(function (item) {
                var card = createCard(item, openDetail);
                card.style.width = (100 / cols) + '%';
                items.push(card);
                gridEl.appendChild(card);
            });

            // Nút load more
            loadMoreWrap = document.createElement('div');
            loadMoreWrap.className = 'kkk-more';

            var btn = document.createElement('div');
            btn.className = 'selector kkk-more__btn';
            btn.textContent = '📄 Tải thêm (Trang ' + (page + 1) + ')';
            items.push(btn);

            $(btn).on('hover:enter', function () {
                _this.loadMore();
            });

            loadMoreWrap.appendChild(btn);
            scroll.append(loadMoreWrap);
        };

        this.showEmpty = function () {
            var el = document.createElement('div');
            el.className = 'kkk-empty';
            el.textContent = 'Không tìm thấy phim nào';
            scroll.append(el);
        };

        this.start = function () {
            if (created) return;
            created = true;

            // === SỬA: Đăng ký controller ===
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
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

            this.create();
        };

        this.pause = function () {
            active = false;
        };

        this.stop = function () {
            active = false;
        };

        this.resume = function () {
            active = true;
            updateCardWidth(gridEl);

            if (items.length) {
                this.activity.toggle();
            }
        };

        this.render = function () {
            return scroll.render(true);
        };

        this.destroy = function () {
            $(window).off('resize.kkkcat');
            network.clear();
            scroll.destroy();
            items = [];
            gridEl = null;
            loadMoreWrap = null;
        };
    }

    // =============================================================
    //  DETAIL COMPONENT
    // =============================================================
    function KKKDetailComponent(object) {
        var comp    = this;
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items   = [];
        var created = false;
        var slug    = object.url || '';
        var active  = false;

        this.create = function () {
            var _this = this;

            this.activity.loader(true);
            scroll.minus();

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
            var posterUrl   = Img.fix(movie.poster_url || movie.thumb_url || '');

            // ---- Backdrop ----
            var backdropEl = document.createElement('div');
            backdropEl.className = 'kkk-detail__backdrop';
            backdropEl.innerHTML = [
                '<img src="' + backdropUrl + '" onerror="this.style.height=\'120px\';this.style.background=\'#333\';" />',
                '<div class="kkk-detail__backdrop-gradient"></div>'
            ].join('');
            scroll.append(backdropEl);

            // ---- Body ----
            var bodyEl = document.createElement('div');
            bodyEl.className = 'kkk-detail__body';

            // Tags
            var tagsHtml = '';
            var tagList = [];
            if (movie.quality)         tagList.push({ t: movie.quality, a: true });
            if (movie.lang)            tagList.push({ t: movie.lang, a: false });
            if (movie.year)            tagList.push({ t: String(movie.year), a: false });
            if (movie.episode_current) tagList.push({ t: movie.episode_current, a: true });
            if (movie.time)            tagList.push({ t: movie.time, a: false });

            tagList.forEach(function (d) {
                tagsHtml += '<span class="kkk-detail__tag' + (d.a ? ' kkk-detail__tag--accent' : '') + '">' + d.t + '</span>';
            });

            var genres    = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countries = (movie.country  || []).map(function (c) { return c.name; }).join(', ');

            var topEl = document.createElement('div');
            topEl.className = 'kkk-detail__top';
            topEl.innerHTML = [
                '<div class="kkk-detail__poster">',
                    '<img src="' + posterUrl + '" onerror="this.src=\'./img/img_broken.svg\'" />',
                '</div>',
                '<div class="kkk-detail__info">',
                    '<div class="kkk-detail__name">' + (movie.name || '') + '</div>',
                    '<div class="kkk-detail__orig">' + (movie.origin_name || '') + '</div>',
                    '<div class="kkk-detail__tags">' + tagsHtml + '</div>',
                    (genres    ? '<div class="kkk-detail__meta">🎭 ' + genres + '</div>'    : ''),
                    (countries ? '<div class="kkk-detail__meta">🌍 ' + countries + '</div>' : ''),
                '</div>'
            ].join('');

            bodyEl.appendChild(topEl);
            scroll.append(bodyEl);

            // ---- Description ----
            var desc = (movie.content || '').replace(/<[^>]*>/g, '').trim();
            if (desc) {
                var descSection = document.createElement('div');
                descSection.className = 'kkk-desc';

                var descText = document.createElement('div');
                descText.className = 'kkk-desc__text';
                descText.textContent = desc;
                descSection.appendChild(descText);

                if (desc.length > 120) {
                    var toggleBtn = document.createElement('div');
                    toggleBtn.className = 'selector kkk-desc__toggle';
                    toggleBtn.textContent = '▼ Xem thêm';
                    items.push(toggleBtn);

                    var expanded = false;
                    $(toggleBtn).on('hover:enter', function () {
                        expanded = !expanded;
                        if (expanded) {
                            descText.classList.add('kkk-desc__text--full');
                            toggleBtn.textContent = '▲ Thu gọn';
                        } else {
                            descText.classList.remove('kkk-desc__text--full');
                            toggleBtn.textContent = '▼ Xem thêm';
                        }
                    });

                    descSection.appendChild(toggleBtn);
                }

                scroll.append(descSection);
            }

            // ---- Episodes ----
            if (episodes && episodes.length) {
                var playSection = document.createElement('div');
                playSection.className = 'kkk-play';

                var playTitle = document.createElement('div');
                playTitle.className = 'kkk-play__title';
                playTitle.textContent = '🎬 Danh sách phát';
                playSection.appendChild(playTitle);

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    var serverName = document.createElement('div');
                    serverName.className = 'kkk-play__server';
                    serverName.textContent = '▶ ' + (server.server_name || 'Server');
                    playSection.appendChild(serverName);

                    var epGrid = document.createElement('div');
                    epGrid.className = 'kkk-play__grid';

                    server.server_data.forEach(function (ep, idx) {
                        var btn = document.createElement('div');
                        btn.className = 'selector kkk-play__ep';
                        btn.textContent = ep.name || ep.slug || ('Tập ' + (idx + 1));
                        items.push(btn);

                        $(btn).on('hover:enter', function () {
                            _this.playEp(ep, movie, server.server_data);
                        });

                        epGrid.appendChild(btn);
                    });

                    playSection.appendChild(epGrid);
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
                var playlist   = [];
                var currentIdx = 0;

                allEps.forEach(function (e, i) {
                    var eUrl = e.link_m3u8 || '';
                    if (eUrl) {
                        if (eUrl === url) currentIdx = playlist.length;

                        // === SỬA: Timeline đúng format ===
                        var timelineData = {};
                        try {
                            timelineData = Lampa.Timeline.view(movie.slug || slug);
                        } catch (ex) {
                            timelineData = {};
                        }

                        playlist.push({
                            title:    (movie.name || 'KKKPhim') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                            url:      eUrl,
                            quality:  { auto: eUrl },
                            timeline: timelineData
                        });
                    }
                });

                if (playlist.length) {
                    // === SỬA: Set playlist trước khi play ===
                    Lampa.Player.playlist(playlist);
                    Lampa.Player.play(playlist[currentIdx]);
                }
            } else {
                // === SỬA: Thử mở trong iframe/webview nếu là embed ===
                Lampa.Noty.show('Link embed - đang thử mở...');

                try {
                    Lampa.Player.play({
                        title: movie.name || 'KKKPhim',
                        url: url,
                        quality: { auto: url },
                        timeline: {}
                    });
                } catch (ex) {
                    Lampa.Noty.show('Link embed không hỗ trợ phát trực tiếp');
                }
            }
        };

        this.showEmpty = function () {
            var el = document.createElement('div');
            el.className = 'kkk-empty';
            el.textContent = 'Không tải được thông tin phim';
            scroll.append(el);
        };

        this.start = function () {
            if (created) return;
            created = true;

            // === SỬA: Đăng ký controller ===
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
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

            this.create();
        };

        this.pause = function () {
            active = false;
        };

        this.stop = function () {
            active = false;
        };

        this.resume = function () {
            active = true;

            if (items.length) {
                this.activity.toggle();
            }
        };

        this.render = function () {
            return scroll.render(true);
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
        };
    }

    // =============================================================
    //  INIT PLUGIN
    // =============================================================
    function initPlugin() {
        addCSS();

        // Đăng ký components
        Lampa.Component.add('kkkphim_main',    KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail',  KKKDetailComponent);

        // Icon SVG cho menu
        var ico = [
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>',
                '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
            '</svg>'
        ].join('');

        // === SỬA: Thêm menu item đúng cách ===
        var menuItem = $('<li class="menu__item selector" data-action="kkkphim">' +
            '<div class="menu__ico">' + ico + '</div>' +
            '<div class="menu__text">KKKPhim</div>' +
        '</li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url:       '',
                title:     'KKKPhim',
                component: 'kkkphim_main',
                page:      1
            });
        });

        // === SỬA: Chèn vào menu đúng selector ===
        var menuList = $('.menu .menu__list');
        if (menuList.length) {
            menuList.eq(0).append(menuItem);
        }

        // === SỬA: Thêm nút vào header/menu nếu Lampa hỗ trợ ===
        try {
            if (Lampa.Menu) {
                Lampa.Menu.append({
                    title: 'KKKPhim',
                    component: 'kkkphim_main',
                    icon: ico
                });
            }
        } catch (e) {
            // Không có Lampa.Menu thì bỏ qua
        }

        // === SỬA: Thêm search source (tìm kiếm) ===
        try {
            if (Lampa.Api) {
                // Có thể thêm API search sau
            }
        } catch (e) {}

        Lampa.Noty.show('✅ KKKPhim đã sẵn sàng!');
    }

    // Khởi chạy
    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }

})();