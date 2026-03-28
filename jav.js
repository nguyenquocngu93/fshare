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
        return API_BASE + '/v1/api/danh-sach/' + type + '?page=' + page + '&limit=36';
    }

    function searchUrl(keyword, page) {
        return API_BASE + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(keyword) + '&page=' + page + '&limit=36';
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

    function parseTotalPages(data) {
        if (data && data.pagination && data.pagination.totalPages) return data.pagination.totalPages;
        if (data && data.data && data.data.params && data.data.params.pagination) {
            return data.data.params.pagination.totalPages || 1;
        }
        return 1;
    }

    // =================== CSS ===================
    function addCSS() {
        if (document.getElementById('kkk-css')) return;
        var s = document.createElement('style');
        s.id = 'kkk-css';
        s.textContent = [
            // Line styles
            '.line { margin-bottom: 2em; }',
            '.line__head { display: flex; justify-content: space-between; align-items: center; padding: 0 1.5em 0.5em; }',
            '.line__title { font-size: 1.3em; font-weight: 600; color: #fff; }',
            '.line__more { font-size: 0.85em; color: rgba(255,255,255,0.5); cursor: pointer; }',
            '.line__more:hover { color: #fff; }',
            '.line__body { display: flex; gap: 1em; overflow-x: auto; padding: 0.5em 1.5em 1em; scroll-behavior: smooth; }',
            '.line__body::-webkit-scrollbar { height: 4px; }',
            '.line__body::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }',
            '.line__body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }',

            // Card styles
            '.kkk-card { width: 160px; flex-shrink: 0; }',
            '.card__img { aspect-ratio: 2/3; background-size: cover; background-position: center; }',
            '.card__info { margin-top: 0.5em; }',
            '.card__title { font-size: 0.9em; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
            '.card__meta { font-size: 0.7em; color: rgba(255,255,255,0.6); margin-top: 0.2em; }',
            '.card__quality, .card__episodes, .card__rating { display: inline-block; }',

            // Detail page - FIX BACKDROP
            '.kkk-detail { position: relative; min-height: 100vh; }',
            '.kkk-detail__backdrop { position: absolute; top: 0; left: 0; right: 0; height: 60vh; overflow: hidden; z-index: 0; }',
            '.kkk-detail__backdrop img { width: 100%; height: 100%; object-fit: cover; display: block; }',
            '.kkk-detail__backdrop::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 70%; background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,1) 100%); }',
            '.kkk-detail__body { position: relative; z-index: 2; display: flex; gap: 1.5em; padding: 12em 1.5em 1.5em; }',
            '.kkk-detail__poster { width: 13em; flex-shrink: 0; }',
            '.kkk-detail__poster img { width: 100%; border-radius: 1em; aspect-ratio: 2/3; object-fit: cover; box-shadow: 0 4px 30px rgba(0,0,0,0.6); }',
            '.kkk-detail__info { flex: 1; min-width: 0; padding-top: 1em; }',
            '.kkk-detail__name { font-size: 1.7em; font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 0.15em; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }',
            '.kkk-detail__orig { font-size: 0.9em; color: rgba(255,255,255,0.5); margin-bottom: 0.8em; }',
            '.kkk-detail__tags { display: flex; gap: 0.4em; flex-wrap: wrap; margin-bottom: 0.7em; }',
            '.kkk-detail__tag { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 0.75em; padding: 0.25em 0.7em; border-radius: 1em; backdrop-filter: blur(10px); }',
            '.kkk-detail__tag--accent { background: rgba(255,200,0,0.2); color: #ffcc00; }',
            '.kkk-detail__meta { color: rgba(255,255,255,0.5); font-size: 0.8em; margin-bottom: 0.2em; }',
            '.kkk-detail__desc { color: rgba(255,255,255,0.6); font-size: 0.85em; line-height: 1.55; margin-top: 0.7em; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }',
            '.kkk-detail__desc--full { -webkit-line-clamp: unset; }',
            '.kkk-detail__buttons { display: flex; gap: 0.7em; flex-wrap: wrap; margin-top: 1em; }',
            '.kkk-detail__btn { display: inline-flex; align-items: center; gap: 0.4em; background: rgba(255,255,255,0.1); color: #fff; padding: 0.55em 1.3em; border-radius: 0.7em; font-size: 0.9em; cursor: pointer; backdrop-filter: blur(10px); }',
            '.kkk-detail__btn--primary { background: #fff; color: #000; font-weight: 600; }',
            '.kkk-detail__btn.focus { background: #fff; color: #000; font-weight: 600; }',
            '.kkk-episodes { position: relative; z-index: 2; padding: 1em 1.5em; background: rgba(0,0,0,0.3); }',
            '.kkk-episodes__title { font-size: 1.1em; font-weight: 600; color: #fff; margin-bottom: 0.6em; }',
            '.kkk-episodes__server { font-size: 0.85em; color: rgba(255,200,0,0.8); margin: 0.6em 0 0.3em; font-weight: 600; }',
            '.kkk-episodes__grid { display: flex; flex-wrap: wrap; gap: 0.35em; margin-bottom: 0.5em; }',
            '.kkk-episodes__ep { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); padding: 0.5em 1em; border-radius: 0.5em; font-size: 0.8em; min-width: 3em; text-align: center; cursor: pointer; }',
            '.kkk-episodes__ep.focus { background: #fff; color: #000; font-weight: 600; }',
            '.kkk-episodes__ep--active { background: rgba(255,200,0,0.2); color: #ffcc00; }'
        ].join('\n');
        document.head.appendChild(s);
    }

    // =================== Card ===================
    function createLampaCard(item, onEnter) {
        var imgUrl  = Img.fix(item.poster_url || item.thumb_url || '');
        var title   = item.name || item.origin_name || '';
        var year    = item.year || '';
        var quality = item.quality || '';
        var epText  = item.episode_current || '';
        var vote    = item.tmdb && item.tmdb.vote_average ? item.tmdb.vote_average : '';

        var card = Lampa.Template.get('card', {
            title: title,
            release_year: year
        });

        var img = card.find('.card__img')[0] || card.find('img')[0];
        if (img) {
            if (img.tagName === 'IMG') {
                $(img).attr('src', imgUrl);
            } else {
                $(img).css('background-image', 'url(' + imgUrl + ')');
            }
        }

        var infoDiv = card.find('.card__info');
        if (infoDiv.length) {
            var metaInfo = [];
            if (quality) metaInfo.push('<span class="card__quality">' + quality + '</span>');
            if (epText) metaInfo.push('<span class="card__episodes">' + epText + '</span>');
            if (vote) metaInfo.push('<span class="card__rating">★ ' + vote + '</span>');
            if (metaInfo.length) {
                infoDiv.append('<div class="card__meta">' + metaInfo.join(' · ') + '</div>');
            }
        }

        card.addClass('kkk-card selector');
        card.on('hover:enter', function () {
            if (onEnter) onEnter(item);
        });

        return card;
    }

    // =================== Line ===================
    function createLine(options) {
        var lineDiv = $('<div class="line"></div>');
        var headDiv = $('<div class="line__head"></div>');
        var titleSpan = $('<div class="line__title">' + (options.title || '') + '</div>');
        var moreDiv = $('<div class="line__more selector">Xem thêm</div>');
        headDiv.append(titleSpan, moreDiv);
        lineDiv.append(headDiv);
        var bodyDiv = $('<div class="line__body"></div>');
        lineDiv.append(bodyDiv);

        var lineObj = {
            render: function () { return lineDiv; },
            head: function (config) {
                if (config.title) titleSpan.text(config.title);
                if (config.onMore) {
                    moreDiv.off('hover:enter').on('hover:enter', function () {
                        config.onMore();
                    });
                }
                if (options.nomore) moreDiv.hide();
            },
            body: function () { return bodyDiv; },
            destroy: function () { lineDiv.remove(); }
        };
        return lineObj;
    }

    // =============================================================
    //  MAIN COMPONENT - FIX TRÙNG LẶP
    // =============================================================
    function KKKMainComponent(object) {
        var network    = new Lampa.Reguest();
        var scroll     = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items      = [];
        var lines      = [];
        var created    = false;
        var loadedCount = 0;
        var rowsData   = new Array(categories.length); // FIX: pre-allocate để tránh trùng
        var active     = false;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);
            scroll.minus();

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

            // FIX: duyệt theo thứ tự categories, bỏ qua dòng rỗng
            rowsData.forEach(function (rd) {
                if (rd && rd.items && rd.items.length > 0) {
                    _this.buildLine(rd.cat, rd.items);
                }
            });

            this.activity.toggle();
        };

        this.buildLine = function (cat, list) {
            var line = createLine({
                title: cat.title,
                nomore: false  // FIX: hiện nút "Xem thêm"
            });

            line.head({
                title: cat.title,
                onMore: function () {
                    Lampa.Activity.push({
                        url: cat.url,
                        title: cat.title,
                        component: 'kkkphim_catalog',
                        page: 1
                    });
                }
            });

            list.slice(0, 20).forEach(function (item) {
                var card = createLampaCard(item, function (item) {
                    Lampa.Activity.push({
                        url: item.slug,
                        title: item.name || item.origin_name || '',
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });
                line.body().append(card);
                items.push(card[0]);
            });

            lines.push(line);
            scroll.append(line.render());
        };

        this.start = function () {
            if (created) return;
            created = true;

            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };
        this.resume = function () { active = true; this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            lines.forEach(function (l) { l.destroy(); });
            items = [];
            lines = [];
            rowsData = [];
            loadedCount = 0;
        };
    }

    // =============================================================
    //  CATALOG COMPONENT
    // =============================================================
    function KKKCatalogComponent(object) {
        var network      = new Lampa.Reguest();
        var scroll       = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items        = [];
        var created      = false;
        var page         = 0;
        var totalPages   = 999;
        var loading      = false;
        var category_url = object.url || 'phim-moi-cap-nhat';
        var active       = false;
        var body;
        var moreBtn;

        this.create = function () {
            scroll.minus();
            body = $('<div class="category-full grid-view"></div>');
            scroll.append(body);
            this.loadPage();
        };

        this.loadPage = function () {
            if (loading || page >= totalPages) return;
            loading = true;
            page++;

            var _this = this;
            if (page === 1) this.activity.loader(true);

            network.clear();
            network.timeout(15000);
            network.silent(catUrl(category_url, page), function (data) {
                _this.activity.loader(false);
                loading = false;
                totalPages = parseTotalPages(data);
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
            if (moreBtn) { moreBtn.remove(); moreBtn = null; }
            list.forEach(function (item) {
                var card = createLampaCard(item, function (item) {
                    Lampa.Activity.push({
                        url: item.slug,
                        title: item.name || item.origin_name || '',
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });
                body.append(card);
                items.push(card[0]);
            });
            if (page < totalPages) {
                moreBtn = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div><div class="card-more__subtitle">Trang ' + (page + 1) + ' / ' + totalPages + '</div></div></div>');
                moreBtn.on('hover:enter', function () { _this.loadPage(); });
                body.append(moreBtn);
                items.push(moreBtn[0]);
            }
        };

        this.showEmpty = function () {
            var el = $('<div class="empty"><div class="empty__title">Không tìm thấy phim nào</div></div>');
            scroll.append(el);
        };

        this.start = function () {
            if (created) return;
            created = true;
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render()); },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            this.create();
        };
        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };
        this.resume = function () { active = true; this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () { network.clear(); scroll.destroy(); items = []; body = null; moreBtn = null; };
    }

    // =============================================================
    //  DETAIL COMPONENT - FIX PLAYER
    // =============================================================
    function KKKDetailComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items   = [];
        var created = false;
        var slug    = object.url || '';
        var active  = false;
        var movieData, episodesData;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);
            scroll.minus();
            network.clear();
            network.timeout(15000);
            network.silent(detailUrl(slug), function (data) {
                _this.activity.loader(false);
                if (data && data.movie) {
                    movieData = data.movie;
                    episodesData = data.episodes || [];
                    _this.buildDetail(movieData, episodesData);
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

            var detail = document.createElement('div');
            detail.className = 'kkk-detail';

            var backdrop = document.createElement('div');
            backdrop.className = 'kkk-detail__backdrop';
            backdrop.innerHTML = '<img src="' + backdropUrl + '" onerror="this.style.display=\'none\'" />';
            detail.appendChild(backdrop);

            var bodyEl = document.createElement('div');
            bodyEl.className = 'kkk-detail__body';

            var posterDiv = document.createElement('div');
            posterDiv.className = 'kkk-detail__poster';
            posterDiv.innerHTML = '<img src="' + posterUrl + '" onerror="this.src=\'./img/img_broken.svg\'" />';
            bodyEl.appendChild(posterDiv);

            var infoDiv = document.createElement('div');
            infoDiv.className = 'kkk-detail__info';

            var nameEl = document.createElement('div');
            nameEl.className = 'kkk-detail__name';
            nameEl.textContent = movie.name || '';
            infoDiv.appendChild(nameEl);

            if (movie.origin_name) {
                var origEl = document.createElement('div');
                origEl.className = 'kkk-detail__orig';
                origEl.textContent = movie.origin_name;
                infoDiv.appendChild(origEl);
            }

            var tagsDiv = document.createElement('div');
            tagsDiv.className = 'kkk-detail__tags';
            var tagList = [];
            if (movie.quality) tagList.push({ t: movie.quality, accent: true });
            if (movie.lang) tagList.push({ t: movie.lang, accent: false });
            if (movie.year) tagList.push({ t: String(movie.year), accent: false });
            if (movie.episode_current) tagList.push({ t: movie.episode_current, accent: true });
            if (movie.time) tagList.push({ t: movie.time, accent: false });
            if (movie.type) tagList.push({ t: movie.type === 'single' ? 'Phim lẻ' : (movie.type === 'series' ? 'Phim bộ' : movie.type), accent: false });
            tagList.forEach(function (d) {
                var span = document.createElement('span');
                span.className = 'kkk-detail__tag' + (d.accent ? ' kkk-detail__tag--accent' : '');
                span.textContent = d.t;
                tagsDiv.appendChild(span);
            });
            infoDiv.appendChild(tagsDiv);

            var genres    = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countries = (movie.country  || []).map(function (c) { return c.name; }).join(', ');
            var directors = (movie.director || []).join(', ');
            var actors    = (movie.actor    || []).slice(0, 8).join(', ');
            if (genres) { var gEl = document.createElement('div'); gEl.className = 'kkk-detail__meta'; gEl.textContent = 'Thể loại: ' + genres; infoDiv.appendChild(gEl); }
            if (countries) { var cEl = document.createElement('div'); cEl.className = 'kkk-detail__meta'; cEl.textContent = 'Quốc gia: ' + countries; infoDiv.appendChild(cEl); }
            if (directors) { var dEl = document.createElement('div'); dEl.className = 'kkk-detail__meta'; dEl.textContent = 'Đạo diễn: ' + directors; infoDiv.appendChild(dEl); }
            if (actors) { var aEl = document.createElement('div'); aEl.className = 'kkk-detail__meta'; aEl.textContent = 'Diễn viên: ' + actors; infoDiv.appendChild(aEl); }

            var desc = (movie.content || '').replace(/<[^>]*>/g, '').trim();
            if (desc) {
                var descEl = document.createElement('div');
                descEl.className = 'kkk-detail__desc';
                descEl.textContent = desc;
                infoDiv.appendChild(descEl);
            }

            var buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'kkk-detail__buttons';
            if (episodes.length && episodes[0].server_data && episodes[0].server_data.length) {
                var playBtn = document.createElement('div');
                playBtn.className = 'selector kkk-detail__btn kkk-detail__btn--primary';
                playBtn.innerHTML = '▶ Xem phim';
                items.push(playBtn);
                $(playBtn).on('hover:enter', function () {
                    var firstEp = episodes[0].server_data[0];
                    _this.playEp(firstEp, movie, episodes[0].server_data);
                });
                buttonsDiv.appendChild(playBtn);
            }
            if (desc && desc.length > 150) {
                var descToggle = document.createElement('div');
                descToggle.className = 'selector kkk-detail__btn';
                descToggle.textContent = 'Mô tả đầy đủ';
                items.push(descToggle);
                var descExpanded = false;
                $(descToggle).on('hover:enter', function () {
                    descExpanded = !descExpanded;
                    if (descExpanded) {
                        descEl.classList.add('kkk-detail__desc--full');
                        descToggle.textContent = 'Thu gọn';
                    } else {
                        descEl.classList.remove('kkk-detail__desc--full');
                        descToggle.textContent = 'Mô tả đầy đủ';
                    }
                });
                buttonsDiv.appendChild(descToggle);
            }
            infoDiv.appendChild(buttonsDiv);
            bodyEl.appendChild(infoDiv);
            detail.appendChild(bodyEl);
            scroll.append(detail);

            if (episodes && episodes.length) {
                var epSection = document.createElement('div');
                epSection.className = 'kkk-episodes';
                var epTitle = document.createElement('div');
                epTitle.className = 'kkk-episodes__title';
                epTitle.textContent = 'Danh sách tập';
                epSection.appendChild(epTitle);
                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;
                    if (episodes.length > 1) {
                        var serverName = document.createElement('div');
                        serverName.className = 'kkk-episodes__server';
                        serverName.textContent = server.server_name || 'Server';
                        epSection.appendChild(serverName);
                    }
                    var epGrid = document.createElement('div');
                    epGrid.className = 'kkk-episodes__grid';
                    server.server_data.forEach(function (ep, idx) {
                        var btn = document.createElement('div');
                        btn.className = 'selector kkk-episodes__ep';
                        btn.textContent = ep.name || ep.slug || ('Tập ' + (idx + 1));
                        items.push(btn);
                        $(btn).on('hover:enter', function () {
                            $(epGrid).find('.kkk-episodes__ep--active').removeClass('kkk-episodes__ep--active');
                            $(btn).addClass('kkk-episodes__ep--active');
                            _this.playEp(ep, movie, server.server_data);
                        });
                        epGrid.appendChild(btn);
                    });
                    epSection.appendChild(epGrid);
                });
                scroll.append(epSection);
            }
        };

        // FIX: Player m3u8/embed
        this.playEp = function (ep, movie, allEps) {
            var url = ep.link_m3u8 || ep.link_embed || '';
            if (!url) { Lampa.Noty.show('Không tìm thấy link phát'); return; }
            
            if (url.indexOf('.m3u8') !== -1) {
                var playlist = [], currentIdx = 0;
                allEps.forEach(function (e, i) {
                    var eUrl = e.link_m3u8 || e.link_embed || '';
                    if (eUrl) {
                        if (eUrl === url) currentIdx = playlist.length;
                        var hashKey = Lampa.Utils.hash([movie.slug, e.slug || e.name || i].join(''));
                        playlist.push({
                            title: (movie.name || 'KKKPhim') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                            url: eUrl,
                            quality: {},
                            timeline: Lampa.Timeline.view(hashKey)
                        });
                    }
                });
                if (playlist.length) {
                    Lampa.Player.play(playlist[currentIdx]);
                    Lampa.Player.playlist(playlist);
                }
            } else if (url.indexOf('http') === 0) {
                // FIX: mở embed bằng player iframe
                Lampa.Player.play({
                    title: movie.name + ' - ' + (ep.name || ''),
                    url: url,
                    quality: {},
                    timeline: Lampa.Timeline.view(Lampa.Utils.hash([movie.slug, ep.slug].join('')))
                });
            }
        };

        this.showEmpty = function () {
            var el = $('<div class="empty"><div class="empty__title">Không tải được thông tin phim</div><div class="empty__descr">Vui lòng thử lại sau</div></div>');
            scroll.append(el);
        };

        this.start = function () {
            if (created) return;
            created = true;
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render()); },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            this.create();
        };
        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };
        this.resume = function () { active = true; this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () { network.clear(); scroll.destroy(); items = []; };
    }

    // =============================================================
    //  SEARCH COMPONENT
    // =============================================================
    function KKKSearchComponent(object) {
        var network    = new Lampa.Reguest();
        var scroll     = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items      = [];
        var created    = false;
        var page       = 0;
        var totalPages = 999;
        var loading    = false;
        var query      = object.search || object.url || '';
        var active     = false;
        var body;
        var moreBtn;

        this.create = function () {
            scroll.minus();
            body = $('<div class="category-full grid-view"></div>');
            scroll.append(body);
            this.loadPage();
        };

        this.loadPage = function () {
            if (loading || page >= totalPages) return;
            loading = true;
            page++;
            var _this = this;
            if (page === 1) this.activity.loader(true);
            network.clear();
            network.timeout(15000);
            network.silent(searchUrl(query, page), function (data) {
                _this.activity.loader(false);
                loading = false;
                totalPages = parseTotalPages(data);
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
            if (moreBtn) { moreBtn.remove(); moreBtn = null; }
            list.forEach(function (item) {
                var card = createLampaCard(item, function (item) {
                    Lampa.Activity.push({
                        url: item.slug,
                        title: item.name || item.origin_name || '',
                        component: 'kkkphim_detail',
                        page: 1
                    });
                });
                body.append(card);
                items.push(card[0]);
            });
            if (page < totalPages) {
                moreBtn = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div></div></div>');
                moreBtn.on('hover:enter', function () { _this.loadPage(); });
                body.append(moreBtn);
                items.push(moreBtn[0]);
            }
        };

        this.showEmpty = function () {
            var el = $('<div class="empty"><div class="empty__title">Không tìm thấy phim nào</div><div class="empty__descr">Thử từ khóa khác</div></div>');
            scroll.append(el);
        };

        this.start = function () {
            if (created) return;
            created = true;
            Lampa.Controller.add('content', {
                toggle: function () { Lampa.Controller.collectionSet(scroll.render()); Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render()); },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            this.create();
        };
        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };
        this.resume = function () { active = true; this.activity.toggle(); };
        this.render = function () { return scroll.render(true); };
        this.destroy = function () { network.clear(); scroll.destroy(); items = []; body = null; moreBtn = null; };
    }

    // =============================================================
    //  INIT
    // =============================================================
    function initPlugin() {
        addCSS();

        Lampa.Component.add('kkkphim_main',    KKKMainComponent);
        Lampa.Component.add('kkkphim_catalog', KKKCatalogComponent);
        Lampa.Component.add('kkkphim_detail',  KKKDetailComponent);
        Lampa.Component.add('kkkphim_search',  KKKSearchComponent);

        var ico = [
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>',
                '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
            '</svg>'
        ].join('');

        var menuItem = $('<li class="menu__item selector" data-action="kkkphim">' +
            '<div class="menu__ico">' + ico + '</div>' +
            '<div class="menu__text">KKKPhim</div>' +
        '</li>');

        menuItem.on('hover:enter', function () {
            Lampa.Activity.push({
                url: '',
                title: 'KKKPhim',
                component: 'kkkphim_main',
                page: 1
            });
        });

        var menuList = $('.menu .menu__list');
        if (menuList.length) menuList.eq(0).append(menuItem);

        Lampa.Listener.follow('search', function (e) {
            if (e.type === 'start' && e.query && e.body) {
                var searchQuery = e.query;
                if (searchQuery.length > 1) {
                    var searchCard = $('<div class="selector search-source" data-kkk-search="true">' +
                        '<div class="search-source__title">KKKPhim</div>' +
                        '<div class="search-source__descr">Tìm "' + searchQuery + '" trên KKKPhim</div>' +
                    '</div>');
                    searchCard.on('hover:enter', function () {
                        Lampa.Activity.push({
                            url: searchQuery,
                            title: 'KKKPhim: ' + searchQuery,
                            component: 'kkkphim_search',
                            search: searchQuery,
                            page: 1
                        });
                    });
                    e.body.append(searchCard);
                }
            }
        });
    }

    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }

})();