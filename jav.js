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
            // Detail page
            '.kkk-detail { padding: 1.5em; }',
            '.kkk-detail__backdrop { position: relative; height: 0; }',
            '.kkk-detail__backdrop img {',
            '   position: absolute; top: 0; left: 0;',
            '   width: 100%; height: 22em;',
            '   object-fit: cover; display: block;',
            '   mask-image: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);',
            '   -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);',
            '}',
            '.kkk-detail__body {',
            '   position: relative; z-index: 2;',
            '   display: flex; gap: 1.5em;',
            '}',
            '.kkk-detail__poster { width: 13em; flex-shrink: 0; }',
            '.kkk-detail__poster img {',
            '   width: 100%; border-radius: 1em;',
            '   aspect-ratio: 2/3; object-fit: cover;',
            '   box-shadow: 0 4px 30px rgba(0,0,0,0.6);',
            '}',
            '.kkk-detail__info { flex: 1; min-width: 0; padding-top: 1em; }',
            '.kkk-detail__name {',
            '   font-size: 1.7em; font-weight: 700;',
            '   color: #fff; line-height: 1.2; margin-bottom: 0.15em;',
            '}',
            '.kkk-detail__orig {',
            '   font-size: 0.9em; color: rgba(255,255,255,0.4);',
            '   margin-bottom: 0.8em;',
            '}',
            '.kkk-detail__tags {',
            '   display: flex; gap: 0.4em; flex-wrap: wrap;',
            '   margin-bottom: 0.7em;',
            '}',
            '.kkk-detail__tag {',
            '   background: rgba(255,255,255,0.08);',
            '   color: rgba(255,255,255,0.6);',
            '   font-size: 0.75em; padding: 0.25em 0.7em;',
            '   border-radius: 1em;',
            '}',
            '.kkk-detail__tag--accent {',
            '   background: rgba(255,200,0,0.15);',
            '   color: #ffcc00;',
            '}',
            '.kkk-detail__meta {',
            '   color: rgba(255,255,255,0.35);',
            '   font-size: 0.8em; margin-bottom: 0.2em;',
            '}',
            '.kkk-detail__desc {',
            '   color: rgba(255,255,255,0.5);',
            '   font-size: 0.85em; line-height: 1.55;',
            '   margin-top: 0.7em;',
            '   display: -webkit-box;',
            '   -webkit-line-clamp: 4;',
            '   -webkit-box-orient: vertical;',
            '   overflow: hidden;',
            '}',
            '.kkk-detail__desc--full {',
            '   -webkit-line-clamp: unset;',
            '}',
            '.kkk-detail__buttons {',
            '   display: flex; gap: 0.7em; flex-wrap: wrap;',
            '   margin-top: 1em;',
            '}',
            '.kkk-detail__btn {',
            '   display: inline-flex; align-items: center; gap: 0.4em;',
            '   background: rgba(255,255,255,0.07);',
            '   color: #fff; padding: 0.55em 1.3em;',
            '   border-radius: 0.7em; font-size: 0.9em;',
            '   cursor: pointer;',
            '}',
            '.kkk-detail__btn--primary {',
            '   background: #fff; color: #000; font-weight: 600;',
            '}',
            '.kkk-detail__btn.focus {',
            '   background: #fff; color: #000; font-weight: 600;',
            '}',

            // Episodes section
            '.kkk-episodes { padding: 1em 1.5em; }',
            '.kkk-episodes__title {',
            '   font-size: 1.1em; font-weight: 600;',
            '   color: #fff; margin-bottom: 0.6em;',
            '}',
            '.kkk-episodes__server {',
            '   font-size: 0.85em; color: rgba(255,200,0,0.8);',
            '   margin: 0.6em 0 0.3em; font-weight: 600;',
            '}',
            '.kkk-episodes__grid {',
            '   display: flex; flex-wrap: wrap; gap: 0.35em;',
            '   margin-bottom: 0.5em;',
            '}',
            '.kkk-episodes__ep {',
            '   background: rgba(255,255,255,0.06);',
            '   color: rgba(255,255,255,0.7);',
            '   padding: 0.5em 1em; border-radius: 0.5em;',
            '   font-size: 0.8em; min-width: 3em;',
            '   text-align: center; cursor: pointer;',
            '}',
            '.kkk-episodes__ep.focus {',
            '   background: #fff; color: #000; font-weight: 600;',
            '}',
            '.kkk-episodes__ep--active {',
            '   background: rgba(255,200,0,0.2);',
            '   color: #ffcc00;',
            '}'
        ].join('\n');
        document.head.appendChild(s);
    }

    // =================== Mở chi tiết phim ===================
    function openDetail(item) {
        Lampa.Activity.push({
            url: item.slug,
            title: item.name || item.origin_name || '',
            component: 'kkkphim_detail',
            page: 1
        });
    }

    // =================== Tạo card chuẩn Lampa ===================
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

        // Poster image
        var img = card.find('.card__img')[0] || card.find('img')[0];
        if (img) {
            if (img.tagName === 'IMG') {
                $(img).attr('src', imgUrl);
            } else {
                $(img).css('background-image', 'url(' + imgUrl + ')');
            }
        }

        // Thêm chất lượng
        if (quality || epText) {
            var viewEl = card.find('.card__view');
            if (viewEl.length) {
                if (quality) {
                    viewEl.append('<div style="position:absolute;top:0.5em;left:0.5em;background:rgba(0,0,0,0.7);color:#ffcc00;font-size:0.7em;padding:0.15em 0.5em;border-radius:0.3em;font-weight:600;z-index:2;">' + quality + '</div>');
                }
                if (epText) {
                    viewEl.append('<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.85));color:#fff;font-size:0.65em;padding:0.6em 0.3em 0.25em;text-align:center;z-index:2;">' + epText + '</div>');
                }
            }
        }

        card.on('hover:enter', function () {
            if (onEnter) onEnter(item);
        });

        return card;
    }

    // =============================================================
    //  MAIN COMPONENT (Home – scroll ngang từng hàng, chuẩn Lampa)
    // =============================================================
    function KKKMainComponent(object) {
        var network    = new Lampa.Reguest();
        var scroll     = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items      = [];
        var lines      = [];
        var created    = false;
        var loadedCount = 0;
        var rowsData   = [];
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

            rowsData.forEach(function (rd) {
                if (!rd || !rd.items.length) return;
                _this.buildLine(rd.cat, rd.items);
            });

            this.activity.toggle();
        };

        this.buildLine = function (cat, list) {
            var _this = this;

            var line = new Lampa.Line({
                title: cat.title,
                nomore: true
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
                var card = createLampaCard(item, openDetail);
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

            this.create();
        };

        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };

        this.resume = function () {
            active = true;
            this.activity.toggle();
        };

        this.render = function () {
            return scroll.render(true);
        };

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
    //  CATALOG COMPONENT (Grid phân trang, chuẩn Lampa)
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
        var bottomObserver;
        var moreBtn;

        this.create = function () {
            scroll.minus();

            body = $('<div class="category-full"></div>');
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

            // Xóa nút load more cũ
            if (moreBtn) {
                moreBtn.remove();
                moreBtn = null;
            }

            list.forEach(function (item) {
                var card = createLampaCard(item, openDetail);
                body.append(card);
                items.push(card[0]);
            });

            // Thêm nút load more
            if (page < totalPages) {
                moreBtn = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div><div class="card-more__subtitle">Trang ' + (page + 1) + ' / ' + totalPages + '</div></div></div>');

                moreBtn.on('hover:enter', function () {
                    _this.loadPage();
                });

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
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            this.create();
        };

        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };

        this.resume = function () {
            active = true;
            this.activity.toggle();
        };

        this.render = function () {
            return scroll.render(true);
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
            body = null;
            moreBtn = null;
        };
    }

    // =============================================================
    //  DETAIL COMPONENT (Info phim + danh sách tập)
    // =============================================================
    function KKKDetailComponent(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({ mask: true, over: true, step: 250 });
        var items   = [];
        var created = false;
        var slug    = object.url || '';
        var active  = false;
        var movieData;
        var episodesData;

        this.create = function () {
            var _this = this;
            this.activity.loader(true);
            scroll.minus();

            network.clear();
            network.timeout(15000);
            network.silent(detailUrl(slug), function (data) {
                _this.activity.loader(false);

                if (data && data.movie) {
                    movieData    = data.movie;
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

            // Container
            var detail = document.createElement('div');
            detail.className = 'kkk-detail';

            // Backdrop
            var backdrop = document.createElement('div');
            backdrop.className = 'kkk-detail__backdrop';
            backdrop.innerHTML = '<img src="' + backdropUrl + '" onerror="this.style.display=\'none\'" />';
            detail.appendChild(backdrop);

            // Body (poster + info)
            var bodyEl = document.createElement('div');
            bodyEl.className = 'kkk-detail__body';

            // Poster
            var posterDiv = document.createElement('div');
            posterDiv.className = 'kkk-detail__poster';
            posterDiv.innerHTML = '<img src="' + posterUrl + '" onerror="this.src=\'./img/img_broken.svg\'" />';
            bodyEl.appendChild(posterDiv);

            // Info
            var infoDiv = document.createElement('div');
            infoDiv.className = 'kkk-detail__info';

            // Name
            var nameEl = document.createElement('div');
            nameEl.className = 'kkk-detail__name';
            nameEl.textContent = movie.name || '';
            infoDiv.appendChild(nameEl);

            // Origin name
            if (movie.origin_name) {
                var origEl = document.createElement('div');
                origEl.className = 'kkk-detail__orig';
                origEl.textContent = movie.origin_name;
                infoDiv.appendChild(origEl);
            }

            // Tags
            var tagsDiv = document.createElement('div');
            tagsDiv.className = 'kkk-detail__tags';

            var tagList = [];
            if (movie.quality)         tagList.push({ t: movie.quality, accent: true });
            if (movie.lang)            tagList.push({ t: movie.lang, accent: false });
            if (movie.year)            tagList.push({ t: String(movie.year), accent: false });
            if (movie.episode_current) tagList.push({ t: movie.episode_current, accent: true });
            if (movie.time)            tagList.push({ t: movie.time, accent: false });
            if (movie.type)            tagList.push({ t: movie.type === 'single' ? 'Phim lẻ' : (movie.type === 'series' ? 'Phim bộ' : movie.type), accent: false });

            tagList.forEach(function (d) {
                var span = document.createElement('span');
                span.className = 'kkk-detail__tag' + (d.accent ? ' kkk-detail__tag--accent' : '');
                span.textContent = d.t;
                tagsDiv.appendChild(span);
            });
            infoDiv.appendChild(tagsDiv);

            // Meta info
            var genres    = (movie.category || []).map(function (c) { return c.name; }).join(', ');
            var countries = (movie.country  || []).map(function (c) { return c.name; }).join(', ');
            var directors = (movie.director || []).join(', ');
            var actors    = (movie.actor    || []).slice(0, 8).join(', ');

            if (genres) {
                var gEl = document.createElement('div');
                gEl.className = 'kkk-detail__meta';
                gEl.textContent = 'Thể loại: ' + genres;
                infoDiv.appendChild(gEl);
            }
            if (countries) {
                var cEl = document.createElement('div');
                cEl.className = 'kkk-detail__meta';
                cEl.textContent = 'Quốc gia: ' + countries;
                infoDiv.appendChild(cEl);
            }
            if (directors) {
                var dEl = document.createElement('div');
                dEl.className = 'kkk-detail__meta';
                dEl.textContent = 'Đạo diễn: ' + directors;
                infoDiv.appendChild(dEl);
            }
            if (actors) {
                var aEl = document.createElement('div');
                aEl.className = 'kkk-detail__meta';
                aEl.textContent = 'Diễn viên: ' + actors;
                infoDiv.appendChild(aEl);
            }

            // Description
            var desc = (movie.content || '').replace(/<[^>]*>/g, '').trim();
            if (desc) {
                var descEl = document.createElement('div');
                descEl.className = 'kkk-detail__desc';
                descEl.textContent = desc;
                infoDiv.appendChild(descEl);
            }

            // Buttons
            var buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'kkk-detail__buttons';

            // Nút Xem phim (phát tập đầu)
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

            // Nút Xem thêm mô tả
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

            // ---- Episodes ----
            if (episodes && episodes.length) {
                var epSection = document.createElement('div');
                epSection.className = 'kkk-episodes';

                var epTitle = document.createElement('div');
                epTitle.className = 'kkk-episodes__title';
                epTitle.textContent = 'Danh sách tập';
                epSection.appendChild(epTitle);

                episodes.forEach(function (server) {
                    if (!server.server_data || !server.server_data.length) return;

                    // Server name
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
                            // Đánh dấu đang phát
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

                        var timeHash = Lampa.Utils.hash(movie.slug + '_' + (e.slug || e.name || i));

                        playlist.push({
                            title:    (movie.name || 'KKKPhim') + ' - ' + (e.name || ('Tập ' + (i + 1))),
                            url:      eUrl,
                            quality:  {},
                            timeline: Lampa.Timeline.get(timeHash)
                        });
                    }
                });

                if (playlist.length) {
                    // === Tạo object để player nhận diện ===
                    var playerData = playlist[currentIdx];
                    playerData.playlist = playlist;

                    Lampa.Player.play(playerData);
                    Lampa.Player.playlist(playlist);

                    // Lưu timeline
                    if (Lampa.Platform.tv()) {
                        // trên TV
                    }
                }
            } else {
                // Embed link - thử mở
                Lampa.Noty.show('Đang mở link embed...');
                window.open(url, '_blank');
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
                    Navigator.move('down');
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            this.create();
        };

        this.pause = function () { active = false; };
        this.stop  = function () { active = false; };

        this.resume = function () {
            active = true;
            this.activity.toggle();
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

            body = $('<div class="category-full"></div>');
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

            if (moreBtn) {
                moreBtn.remove();
                moreBtn = null;
            }

            list.forEach(function (item) {
                var card = createLampaCard(item, openDetail);
                body.append(card);
                items.push(card[0]);
            });

            if (page < totalPages) {
                moreBtn = $('<div class="selector card-more"><div class="card-more__box"><div class="card-more__title">Tải thêm</div></div></div>');
                moreBtn.on('hover:enter', function () {
                    _this.loadPage();
                });
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
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(items.length ? items[0] : false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () { Navigator.move('right'); },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); }
            });

            this.create();
        };

        this.pause  = function () { active = false; };
        this.stop   = function () { active = false; };
        this.resume = function () {
            active = true;
            this.activity.toggle();
        };

        this.render = function () {
            return scroll.render(true);
        };

        this.destroy = function () {
            network.clear();
            scroll.destroy();
            items = [];
            body = null;
            moreBtn = null;
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
        Lampa.Component.add('kkkphim_search',  KKKSearchComponent);

        // Icon SVG
        var ico = [
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
                '<rect x="2" y="3" width="20" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>',
                '<polygon points="10,8 16,12 10,16" fill="currentColor"/>',
            '</svg>'
        ].join('');

        // Thêm vào menu
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

        // Chèn vào cuối menu list đầu tiên
        var addedToMenu = false;

        // Cách 1: Tìm menu__list
        var menuList = $('.menu .menu__list');
        if (menuList.length) {
            menuList.eq(0).append(menuItem);
            addedToMenu = true;
        }

        // Cách 2: Nếu không tìm thấy, thử selector khác
        if (!addedToMenu) {
            var altMenu = $('.navigation-menu .menu__list, .menu__body .menu__list');
            if (altMenu.length) {
                altMenu.eq(0).append(menuItem);
                addedToMenu = true;
            }
        }

        // === Tích hợp tìm kiếm ===
        // Lắng nghe sự kiện search của Lampa
        Lampa.Listener.follow('search', function (e) {
            if (e.type === 'start') {
                // Thêm source tìm kiếm KKKPhim
                var searchQuery = e.query || '';
                if (searchQuery.length > 1) {
                    // Thêm 1 kết quả vào panel search
                    var existItem = e.body ? e.body.find('[data-kkk-search]') : null;
                    if (existItem && existItem.length) return;

                    if (e.body) {
                        var searchCard = $('<div class="selector search-source" data-kkk-search="true">' +
                            '<div class="search-source__title">KKKPhim</div>' +
                            '<div class="search-source__descr">Tìm "' + searchQuery + '" trên KKKPhim</div>' +
                        '</div>');

                        searchCard.on('hover:enter', function () {
                            Lampa.Activity.push({
                                url:       searchQuery,
                                title:     'KKKPhim: ' + searchQuery,
                                component: 'kkkphim_search',
                                search:    searchQuery,
                                page:      1
                            });
                        });

                        e.body.append(searchCard);
                    }
                }
            }
        });
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