(function() {
    'use strict';

    // ===== CONFIG =====
    var API_BASE = 'https://phimapi.com';
    var TMDB_KEY = '6979c8ec101ed849f44d197c86582644'; // Thay bằng key của bạn
    var TMDB_BASE = 'https://api.themoviedb.org/3';
    var TMDB_IMG = 'https://image.tmdb.org/t/p';

    // ===== LOAD CSS =====
    function loadCSS() {
        if (window.kkphim_css_loaded) return;
        
        var cssURL = 'https://nguyenquocngu93.github.io/fshare/style.css'; // THAY ĐỔI URL NÀY
        
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssURL;
        document.head.appendChild(link);
        
        window.kkphim_css_loaded = true;
        console.log('[KKPhim] CSS loaded from:', cssURL);
    }

    // ===== NETWORK REQUEST =====
    function request(url, onSuccess, onError) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 10000;
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    onSuccess(data);
                } catch(e) {
                    console.error('[KKPhim] Parse error:', e);
                    if (onError) onError(e);
                }
            } else {
                console.error('[KKPhim] HTTP error:', xhr.status);
                if (onError) onError(xhr);
            }
        };
        
        xhr.onerror = function() {
            console.error('[KKPhim] Network error:', url);
            if (onError) onError(xhr);
        };
        
        xhr.ontimeout = function() {
            console.error('[KKPhim] Timeout:', url);
            if (onError) onError(xhr);
        };
        
        xhr.send();
    }

    // ===== TMDB HELPERS =====
    function getTMDBData(name, year, type, callback) {
        var searchType = type === 'series' ? 'tv' : 'movie';
        var query = encodeURIComponent(name);
        var url = TMDB_BASE + '/search/' + searchType + '?api_key=' + TMDB_KEY + '&language=vi-VN&query=' + query;
        if (year) url += '&year=' + year;
        
        request(url, function(data) {
            if (data.results && data.results.length > 0) {
                var tmdbId = data.results[0].id;
                getDetailedTMDB(tmdbId, searchType, callback);
            } else {
                callback(null);
            }
        }, function() {
            callback(null);
        });
    }

    function getDetailedTMDB(id, type, callback) {
        var result = {};
        var pending = 3;

        function check() {
            pending--;
            if (pending === 0) callback(result);
        }

        var urls = {
            details: TMDB_BASE + '/' + type + '/' + id + '?api_key=' + TMDB_KEY + '&language=vi-VN',
            credits: TMDB_BASE + '/' + type + '/' + id + '/credits?api_key=' + TMDB_KEY + '&language=vi-VN',
            similar: TMDB_BASE + '/' + type + '/' + id + '/similar?api_key=' + TMDB_KEY + '&language=vi-VN&page=1'
        };

        request(urls.details, function(data) { 
            result.details = data; 
            check(); 
        }, check);
        
        request(urls.credits, function(data) { 
            result.credits = data; 
            check(); 
        }, check);
        
        request(urls.similar, function(data) { 
            result.similar = data; 
            check(); 
        }, check);
    }

    // ===== UTILS =====
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createElement(html) {
        var div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }

    // ===== MAIN COMPONENT =====
    function KKPhimComponent(object) {
        var component = Lampa.Component.create('items_line');
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var page = 1;
        var type = object.type || 'phim-moi-cap-nhat';
        var isLoading = false;

        loadCSS();

        function loadData() {
            if (isLoading) return;
            isLoading = true;

            Lampa.Activity.loader(true);
            var url = API_BASE + '/danh-sach/' + type + '?page=' + page;

            request(url, function(resp) {
                Lampa.Activity.loader(false);
                isLoading = false;

                if (resp && resp.data && resp.data.items) {
                    items = items.concat(resp.data.items);
                    build();
                } else {
                    showEmpty('Không có dữ liệu');
                }
            }, function() {
                Lampa.Activity.loader(false);
                isLoading = false;
                showEmpty('Lỗi tải dữ liệu');
            });
        }

        function build() {
            scroll.clear();

            var container = createElement('<div class="kk-grid-wrap"></div>');
            var grid = createElement('<div class="kk-grid kk-grid--hgrid-2"></div>');

            items.forEach(function(item) {
                var card = createCard(item);
                grid.appendChild(card);
            });

            container.appendChild(grid);

            var more = createElement('<div class="kk-loadmore selector">Xem thêm</div>');
            Lampa.Controller.add('loadmore', {
                name: more,
                onEnter: function() {
                    page++;
                    loadData();
                }
            });
            container.appendChild(more);

            scroll.append(container);
            component.append(scroll.render());

            Lampa.Controller.toggle('content');
        }

        function createCard(item) {
            var thumb = item.thumb_url ? '<img src="' + escapeHtml(item.thumb_url) + '" alt="">' : '<div class="kk-card-h-noposter">Không có ảnh</div>';
            var quality = item.quality ? '<div class="kk-card-q">' + escapeHtml(item.quality) + '</div>' : '';
            var episode = item.episode_current ? '<div class="kk-card-ep">' + escapeHtml(item.episode_current) + '</div>' : '';

            var html = '<div class="kk-card-h selector">' +
                '<div class="kk-card-h-img">' + thumb + quality + episode + '</div>' +
                '<div class="kk-card-h-body">' +
                    '<div class="kk-card-name">' + escapeHtml(item.name) + '</div>' +
                    '<div class="kk-card-origin">' + escapeHtml(item.origin_name || '') + '</div>' +
                    '<div class="kk-card-meta">' +
                        '<span class="kk-card-year">' + escapeHtml(item.year || 'N/A') + '</span>' +
                        '<span class="kk-card-lang">' + escapeHtml(item.lang || 'Vietsub') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

            var card = createElement(html);

            Lampa.Controller.add('card_' + item.slug, {
                name: card,
                onEnter: function() {
                    Lampa.Activity.push({
                        url: '',
                        title: item.name,
                        component: 'kkphim_detail',
                        slug: item.slug,
                        page: 1
                    });
                }
            });

            return card;
        }

        function showEmpty(msg) {
            var empty = Lampa.Template.get('list_empty');
            empty.querySelector('.empty__descr').textContent = msg || 'Không có dữ liệu';
            scroll.append(empty);
            component.append(scroll.render());
        }

        loadData();

        component.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        return component;
    }

    // ===== DETAIL COMPONENT =====
    function KKPhimDetail(object) {
        var component = Lampa.Component.create('kkphim_detail');
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var slug = object.slug;
        var movie = null;
        var tmdb = null;

        loadCSS();

        function loadMovie() {
            Lampa.Activity.loader(true);
            var url = API_BASE + '/phim/' + slug;

            request(url, function(resp) {
                if (resp && resp.movie) {
                    movie = resp.movie;
                    loadTMDB();
                } else {
                    Lampa.Activity.loader(false);
                    showEmpty('Không tìm thấy phim');
                }
            }, function() {
                Lampa.Activity.loader(false);
                showEmpty('Lỗi tải dữ liệu');
            });
        }

        function loadTMDB() {
            getTMDBData(
                movie.origin_name || movie.name,
                movie.year,
                movie.type,
                function(data) {
                    tmdb = data;
                    Lampa.Activity.loader(false);
                    build();
                }
            );
        }

        function build() {
            scroll.clear();

            var container = createElement('<div class="kk-detail-wrap"></div>');

            // Hero
            container.appendChild(createHero());

            // Body
            var body = createElement('<div class="kk-body"></div>');

            if (tmdb && tmdb.credits) {
                var crew = createCrew();
                if (crew) body.appendChild(crew);

                var cast = createCast();
                if (cast) body.appendChild(cast);
            }

            var desc = createDescription();
            if (desc) body.appendChild(desc);

            var actions = createActions();
            if (actions) body.appendChild(actions);

            container.appendChild(body);

            // Similar
            if (tmdb && tmdb.similar) {
                var similar = createSimilar();
                if (similar) container.appendChild(similar);
            }

            scroll.append(container);
            component.append(scroll.render());

            Lampa.Controller.toggle('content');
        }

        function createHero() {
            var backdrop = tmdb && tmdb.details && tmdb.details.backdrop_path
                ? TMDB_IMG + '/original' + tmdb.details.backdrop_path
                : movie.thumb_url || '';

            var poster = tmdb && tmdb.details && tmdb.details.poster_path
                ? TMDB_IMG + '/w500' + tmdb.details.poster_path
                : movie.poster_url || '';

            var backdropHtml = backdrop 
                ? '<img src="' + backdrop + '" alt="">' 
                : '<div class="kk-hero-backdrop-empty"></div>';

            var logoHtml = '';
            if (tmdb && tmdb.details && tmdb.details.belongs_to_collection && tmdb.details.belongs_to_collection.logo_path) {
                var logo = TMDB_IMG + '/w500' + tmdb.details.belongs_to_collection.logo_path;
                logoHtml = '<div class="kk-logo"><img src="' + logo + '" alt=""></div>';
            } else {
                logoHtml = '<h1 class="kk-title">' + escapeHtml(movie.name) + '</h1>';
            }

            var year = movie.year || 'N/A';
            var country = movie.country && movie.country.length > 0 ? movie.country[0].name : '';
            var tagline = tmdb && tmdb.details && tmdb.details.tagline ? tmdb.details.tagline : '';
            var vote = tmdb && tmdb.details && tmdb.details.vote_average ? tmdb.details.vote_average.toFixed(1) : '';

            var html = '<div class="kk-hero">' +
                '<div class="kk-hero-backdrop">' + backdropHtml + '</div>' +
                '<div class="kk-hero-card">' +
                    '<div class="kk-hero-poster-wrap">' +
                        '<div class="kk-hero-poster"><img src="' + poster + '" alt=""></div>' +
                    '</div>' +
                    '<div class="kk-hero-meta">' +
                        logoHtml +
                        '<div class="kk-origin">' + escapeHtml(movie.origin_name || '') + '</div>' +
                        '<div class="kk-hm-yc">' +
                            '<span class="kk-hm-year">' + year + '</span>' +
                            (country ? '<span class="kk-hm-country">' + escapeHtml(country) + '</span>' : '') +
                        '</div>' +
                        (tagline ? '<div class="kk-hm-tagline">' + escapeHtml(tagline) + '</div>' : '') +
                        '<div class="kk-hm-badges">' +
                            (vote ? '<div class="kk-hm-vote">' + vote + '<small>/10</small></div>' : '') +
                            (movie.time ? '<div class="kk-hm-badge">' + escapeHtml(movie.time) + '</div>' : '') +
                            (movie.episode_current ? '<div class="kk-hm-badge">' + escapeHtml(movie.episode_current) + '</div>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

            return createElement(html);
        }

        function createCrew() {
            if (!tmdb || !tmdb.credits || !tmdb.credits.crew) return null;

            var directors = tmdb.credits.crew.filter(function(c) { return c.job === 'Director'; });
            if (directors.length === 0) return null;

            var director = directors[0];
            var avatar = director.profile_path ? TMDB_IMG + '/w185' + director.profile_path : '';

            var avatarHtml = avatar 
                ? '<img src="' + avatar + '" alt="">' 
                : '<div class="kk-crew-avatar-empty"></div>';

            var html = '<div class="kk-section">' +
                '<div class="kk-block-title">ĐẠO DIỄN</div>' +
                '<div class="kk-crew">' +
                    '<div class="kk-crew-avatar">' + avatarHtml + '</div>' +
                    '<div class="kk-crew-info">' +
                        '<div class="kk-crew-label">Đạo diễn</div>' +
                        '<div class="kk-crew-name">' + escapeHtml(director.name) + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

            return createElement(html);
        }

        function createCast() {
            if (!tmdb || !tmdb.credits || !tmdb.credits.cast) return null;

            var cast = tmdb.credits.cast.slice(0, 10);
            if (cast.length === 0) return null;

            var listHtml = '';
            cast.forEach(function(person) {
                var img = person.profile_path ? TMDB_IMG + '/w185' + person.profile_path : '';
                var imgHtml = img 
                    ? '<img src="' + img + '" alt="">' 
                    : '<div class="kk-cast-empty"></div>';

                listHtml += '<div class="kk-cast-card selector">' +
                    '<div class="kk-cast-img">' + imgHtml + '</div>' +
                    '<div class="kk-cast-info">' +
                        '<div class="kk-cast-name">' + escapeHtml(person.name) + '</div>' +
                        '<div class="kk-cast-role">' + escapeHtml(person.character || '') + '</div>' +
                    '</div>' +
                '</div>';
            });

            var html = '<div class="kk-section">' +
                '<div class="kk-block-title">DIỄN VIÊN</div>' +
                '<div class="kk-cast-list">' + listHtml + '</div>' +
            '</div>';

            return createElement(html);
        }

        function createDescription() {
            var desc = tmdb && tmdb.details && tmdb.details.overview ? tmdb.details.overview : movie.content || '';
            if (!desc) return null;

            var html = '<div class="kk-body-desc">' +
                '<div class="kk-body-desc-label">NỘI DUNG</div>' +
                '<div class="kk-body-desc-text">' + escapeHtml(desc) + '</div>' +
            '</div>';

            return createElement(html);
        }

        function createActions() {
            var html = '<div class="kk-actions">' +
                '<div class="kk-src-btn kk-src-btn--kkphim selector">' +
                    '<div class="kk-sb-main">▶ Xem phim</div>' +
                    '<div class="kk-sb-sub">KKPhim</div>' +
                '</div>' +
            '</div>';

            var actions = createElement(html);
            var playBtn = actions.querySelector('.kk-src-btn');

            Lampa.Controller.add('play_button', {
                name: playBtn,
                onEnter: playMovie
            });

            return actions;
        }

        function createSimilar() {
            if (!tmdb || !tmdb.similar || !tmdb.similar.results) return null;

            var items = tmdb.similar.results.slice(0, 10);
            if (items.length === 0) return null;

            var listHtml = '';
            items.forEach(function(item) {
                var poster = item.poster_path ? TMDB_IMG + '/w342' + item.poster_path : '';
                var posterHtml = poster 
                    ? '<img src="' + poster + '" alt="">' 
                    : '<div class="kk-card-noposter">N/A</div>';

                var year = (item.release_date || item.first_air_date || '').substring(0, 4);

                listHtml += '<div class="kk-card selector">' +
                    '<div class="kk-card-img">' + posterHtml + '</div>' +
                    '<div class="kk-card-body">' +
                        '<div class="kk-card-name">' + escapeHtml(item.title || item.name) + '</div>' +
                        '<div class="kk-card-meta">' +
                            '<span class="kk-card-year">' + year + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            });

            var html = '<div class="kk-section kk-section--last kk-similar">' +
                '<div class="kk-block-title">PHIM TƯƠNG TỰ</div>' +
                '<div class="kk-similar-list">' + listHtml + '</div>' +
            '</div>';

            return createElement(html);
        }

        function playMovie() {
            if (!movie.episodes || movie.episodes.length === 0) {
                Lampa.Noty.show('Không có tập phim');
                return;
            }

            var firstServer = movie.episodes[0];
            var firstEp = firstServer.server_data[0];

            if (!firstEp) {
                Lampa.Noty.show('Không tìm thấy link');
                return;
            }

            Lampa.Player.play({
                title: movie.name,
                url: firstEp.link_m3u8 || firstEp.link_embed
            });
        }

        function showEmpty(msg) {
            var empty = Lampa.Template.get('list_empty');
            empty.querySelector('.empty__descr').textContent = msg;
            scroll.append(empty);
            component.append(scroll.render());
        }

        loadMovie();

        component.start = function() {
            Lampa.Controller.add('content', {
                toggle: function() {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                back: function() {
                    Lampa.Activity.backward();
                }
            });
            Lampa.Controller.toggle('content');
        };

        return component;
    }

    // ===== REGISTER =====
    Lampa.Component.add('kkphim', KKPhimComponent);
    Lampa.Component.add('kkphim_detail', KKPhimDetail);

    // ===== ADD MENU =====
    Lampa.Listener.follow('app', function(e) {
        if (e.type === 'ready') {
            var menuHTML = '<li class="menu__item selector" data-action="kkphim">' +
                '<div class="menu__ico">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
                        '<path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                    '</svg>' +
                '</div>' +
                '<div class="menu__text">KKPhim</div>' +
            '</li>';

            var menuItem = createElement(menuHTML);

            Lampa.Controller.add('menu_kkphim', {
                name: menuItem,
                onEnter: function() {
                    Lampa.Activity.push({
                        url: '',
                        title: 'KKPhim',
                        component: 'kkphim',
                        type: 'phim-moi-cap-nhat',
                        page: 1
                    });
                }
            });

            var menu = document.querySelector('.menu .menu__list');
            if (menu) menu.appendChild(menuItem);
        }
    });

    console.log('[KKPhim] Plugin loaded ✓');

})();