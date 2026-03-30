/**
 * NguonC Plugin for Lampa
 * Version: 2.1.0 - Android Optimized
 */

(function() {
    'use strict';
    
    // Kiểm tra Lampa đã load chưa
    if (typeof window.Lampa === 'undefined') {
        console.error('NguonC: Lampa not loaded');
        return;
    }

    // Config đơn giản
    var CONFIG = {
        name: 'NguonC',
        component: 'nguonc',
        version: '2.1.0',
        base_url: 'https://phim.nguonc.com',
        poster_default: 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster'
    };

    // State đơn giản
    var favorites = [];
    var history = [];
    
    try {
        favorites = JSON.parse(localStorage.getItem('nguonc_fav') || '[]');
        history = JSON.parse(localStorage.getItem('nguonc_hist') || '[]');
    } catch(e) {
        console.log('NguonC: Storage error', e);
    }

    // ===== UTILITY =====
    function saveData() {
        try {
            localStorage.setItem('nguonc_fav', JSON.stringify(favorites));
            localStorage.setItem('nguonc_hist', JSON.stringify(history));
        } catch(e) {}
    }

    function isFav(id) {
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === id) return true;
        }
        return false;
    }

    function addFav(item) {
        if (!isFav(item.id)) {
            favorites.push(item);
            saveData();
            return true;
        }
        return false;
    }

    function removeFav(id) {
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === id) {
                favorites.splice(i, 1);
                saveData();
                return true;
            }
        }
        return false;
    }

    function addHist(item) {
        // Xóa cũ nếu có
        for (var i = history.length - 1; i >= 0; i--) {
            if (history[i].id === item.id) history.splice(i, 1);
        }
        history.unshift(item);
        if (history.length > 30) history.pop();
        saveData();
    }

    // ===== API =====
    function getMovies(type, page, callback) {
        var urls = {
            latest: '/phim-moi-cap-nhat',
            single: '/phim-le',
            series: '/phim-bo',
            cinema: '/phim-chieu-rap',
            anime: '/hoat-hinh'
        };
        
        var url = CONFIG.base_url + (urls[type] || urls.latest) + '?page=' + (page || 1);
        
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function(html) {
                try {
                    var movies = [];
                    var div = document.createElement('div');
                    div.innerHTML = html;
                    
                    // Tìm các item phim
                    var items = div.querySelectorAll('.film-item, .movie-item, .item');
                    
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        var link = item.querySelector('a');
                        var img = item.querySelector('img');
                        var title = item.querySelector('.name, .title, h3, h2');
                        
                        if (link && title) {
                            var href = link.getAttribute('href') || '';
                            var id = href.replace(/.*\//, '').split('?')[0];
                            
                            movies.push({
                                id: id,
                                title: title.textContent.trim(),
                                poster: img ? (img.getAttribute('data-src') || img.getAttribute('src')) : CONFIG.poster_default,
                                url: href.indexOf('http') === 0 ? href : CONFIG.base_url + href
                            });
                        }
                    }
                    
                    callback(movies);
                } catch(e) {
                    console.error('NguonC parse error:', e);
                    callback([]);
                }
            },
            error: function() {
                callback([]);
            }
        });
    }

    function searchMovies(query, page, callback) {
        var url = CONFIG.base_url + '/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + (page || 1);
        
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function(html) {
                try {
                    var movies = [];
                    var div = document.createElement('div');
                    div.innerHTML = html;
                    var items = div.querySelectorAll('.film-item, .movie-item, .item, .search-item');
                    
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        var link = item.querySelector('a');
                        var img = item.querySelector('img');
                        var title = item.querySelector('.name, .title, h3');
                        
                        if (link && title) {
                            var href = link.getAttribute('href') || '';
                            movies.push({
                                id: href.replace(/.*\//, '').split('?')[0],
                                title: title.textContent.trim(),
                                poster: img ? (img.getAttribute('data-src') || img.getAttribute('src')) : CONFIG.poster_default,
                                url: href.indexOf('http') === 0 ? href : CONFIG.base_url + href
                            });
                        }
                    }
                    callback(movies);
                } catch(e) {
                    callback([]);
                }
            },
            error: function() {
                callback([]);
            }
        });
    }

    function getMovieInfo(id, callback) {
        var url = CONFIG.base_url + '/phim/' + id;
        
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function(html) {
                try {
                    var div = document.createElement('div');
                    div.innerHTML = html;
                    
                    var title = div.querySelector('h1, .film-title');
                    var poster = div.querySelector('.film-poster img, .movie-poster img');
                    var desc = div.querySelector('.description, .summary');
                    
                    // Parse episodes
                    var episodes = [];
                    var eps = div.querySelectorAll('.episode a, .ep-item, [data-episode]');
                    
                    for (var i = 0; i < eps.length; i++) {
                        var ep = eps[i];
                        var epUrl = ep.getAttribute('href') || ep.getAttribute('data-url');
                        var epNum = ep.getAttribute('data-episode') || (i + 1);
                        
                        if (epUrl) {
                            episodes.push({
                                number: parseInt(epNum) || (i + 1),
                                url: epUrl.indexOf('http') === 0 ? epUrl : CONFIG.base_url + epUrl
                            });
                        }
                    }
                    
                    // Nếu không có episodes, tạo 1 tập default
                    if (episodes.length === 0) {
                        episodes.push({ number: 1, url: url });
                    }
                    
                    callback({
                        id: id,
                        title: title ? title.textContent.trim() : 'Unknown',
                        poster: poster ? (poster.getAttribute('data-src') || poster.getAttribute('src')) : CONFIG.poster_default,
                        description: desc ? desc.textContent.trim() : '',
                        episodes: episodes
                    });
                } catch(e) {
                    callback(null);
                }
            },
            error: function() {
                callback(null);
            }
        });
    }

    function getVideo(url, callback) {
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 10000,
            success: function(html) {
                try {
                    var videoUrl = null;
                    
                    // Tìm link trực tiếp
                    var match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
                    if (match) videoUrl = match[1];
                    
                    // Hoặc embed
                    if (!videoUrl) {
                        var embed = html.match(/iframe[^>]+src=["']([^"']+)["']/i);
                        if (embed) videoUrl = embed[1];
                    }
                    
                    callback(videoUrl ? [{ url: videoUrl }] : null);
                } catch(e) {
                    callback(null);
                }
            },
            error: function() {
                callback(null);
            }
        });
    }

    // ===== UI COMPONENTS =====

    // Card component
    function createCard(movie, opts) {
        opts = opts || {};
        var badge = opts.badge ? '<div class="card__quality">' + opts.badge + '</div>' : '';
        
        return $('<div class="card selector">' +
            '<div class="card__view">' +
                '<img src="' + (movie.poster || CONFIG.poster_default) + '" class="card__img">' +
                badge +
            '</div>' +
            '<div class="card__title">' + movie.title + '</div>' +
        '</div>');
    }

    // ===== MAIN COMPONENT =====
    Lampa.Component.add(CONFIG.component, {
        name: CONFIG.name,
        type: 'video',
        component: 'category',
        category: 'Phim Online',

        create: function() {
            this.activity = arguments[0];
            this.tab = this.activity.tab || 'latest';
            this.page = 1;
            this.render();
        },

        render: function() {
            var _this = this;
            
            // HTML structure đơn giản
            var html = $('<div class="category-full" style="padding:20px;">' +
                '<div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">' +
                    '<div class="button selector tab ' + (this.tab === 'latest' ? 'active' : '') + '" data-tab="latest">Mới</div>' +
                    '<div class="button selector tab ' + (this.tab === 'single' ? 'active' : '') + '" data-tab="single">Phim lẻ</div>' +
                    '<div class="button selector tab ' + (this.tab === 'series' ? 'active' : '') + '" data-tab="series">Phim bộ</div>' +
                    '<div class="button selector tab ' + (this.tab === 'cinema' ? 'active' : '') + '" data-tab="cinema">Rạp</div>' +
                    '<div class="button selector tab ' + (this.tab === 'anime' ? 'active' : '') + '" data-tab="anime">Anime</div>' +
                    '<div class="button selector tab ' + (this.tab === 'fav' ? 'active' : '') + '" data-tab="fav">❤️</div>' +
                    '<div class="button selector tab ' + (this.tab === 'hist' ? 'active' : '') + '" data-tab="hist">🕐</div>' +
                    '<div class="button selector search">🔍 Tìm</div>' +
                '</div>' +
                '<div class="items-cards" style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px;"></div>' +
                '<div class="loading" style="text-align:center; padding:20px; display:none;">Đang tải...</div>' +
            '</div>');

            this.container = html.find('.items-cards');
            this.loading = html.find('.loading');

            // Tab click
            html.find('.tab').on('hover:enter', function() {
                var tab = $(this).data('tab');
                if (tab !== _this.tab) {
                    Lampa.Activity.push({
                        component: CONFIG.component,
                        tab: tab
                    });
                }
            });

            // Search click
            html.find('.search').on('hover:enter', function() {
                Lampa.Input.show({
                    title: 'Tìm kiếm',
                    value: '',
                    free: true,
                    callback: function(q) {
                        if (q) {
                            Lampa.Activity.push({
                                component: CONFIG.component + '_search',
                                query: q
                            });
                        }
                    }
                });
            });

            // Load content
            this.load();

            this.activity.render().find('.activity__body').html(html);

            this.start = function() {
                Lampa.Controller.add('content', {
                    toggle: function() {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };

            this.pause = function() {};
            this.stop = function() {};
            this.destroy = function() {};
        },

        load: function() {
            var _this = this;
            this.loading.show();
            this.container.empty();

            if (this.tab === 'fav') {
                this.showFav();
            } else if (this.tab === 'hist') {
                this.showHist();
            } else {
                getMovies(this.tab, 1, function(movies) {
                    _this.loading.hide();
                    _this.showMovies(movies);
                });
            }
        },

        showMovies: function(movies) {
            var _this = this;
            
            if (movies.length === 0) {
                this.container.html('<div style="grid-column:1/-1; text-align:center; padding:40px;">Không có phim</div>');
                return;
            }

            for (var i = 0; i < movies.length; i++) {
                (function(movie) {
                    var card = createCard(movie);
                    card.on('hover:enter', function() {
                        Lampa.Activity.push({
                            component: CONFIG.component + '_detail',
                            id: movie.id,
                            movie: movie
                        });
                    });
                    _this.container.append(card);
                })(movies[i]);
            }
        },

        showFav: function() {
            this.loading.hide();
            
            if (favorites.length === 0) {
                this.container.html('<div style="grid-column:1/-1; text-align:center; padding:40px;">Chưa có phim yêu thích</div>');
                return;
            }

            var _this = this;
            for (var i = 0; i < favorites.length; i++) {
                (function(movie) {
                    var card = createCard(movie, { badge: '❤️' });
                    card.on('hover:enter', function() {
                        Lampa.Activity.push({
                            component: CONFIG.component + '_detail',
                            id: movie.id,
                            movie: movie
                        });
                    });
                    _this.container.append(card);
                })(favorites[i]);
            }
        },

        showHist: function() {
            this.loading.hide();
            
            if (history.length === 0) {
                this.container.html('<div style="grid-column:1/-1; text-align:center; padding:40px;">Chưa có lịch sử</div>');
                return;
            }

            var _this = this;
            for (var i = 0; i < history.length; i++) {
                (function(item) {
                    var card = createCard(item, { badge: '▶️' });
                    card.on('hover:enter', function() {
                        Lampa.Activity.push({
                            component: CONFIG.component + '_detail',
                            id: item.id,
                            movie: item
                        });
                    });
                    _this.container.append(card);
                })(history[i]);
            }
        }
    });

    // ===== SEARCH COMPONENT =====
    Lampa.Component.add(CONFIG.component + '_search', {
        name: 'Tìm kiếm',
        type: 'video',

        create: function() {
            this.activity = arguments[0];
            this.query = this.activity.query;
            this.render();
        },

        render: function() {
            var _this = this;
            
            var html = $('<div class="category-full" style="padding:20px;">' +
                '<div style="margin-bottom:20px; font-size:18px;">🔍 Kết quả: ' + this.query + '</div>' +
                '<div class="items-cards" style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px;"></div>' +
                '<div class="loading" style="text-align:center; padding:20px;">Đang tìm...</div>' +
            '</div>');

            var container = html.find('.items-cards');

            searchMovies(this.query, 1, function(movies) {
                html.find('.loading').hide();
                
                if (movies.length === 0) {
                    container.html('<div style="grid-column:1/-1; text-align:center;">Không tìm thấy</div>');
                    return;
                }

                for (var i = 0; i < movies.length; i++) {
                    (function(movie) {
                        var card = createCard(movie);
                        card.on('hover:enter', function() {
                            Lampa.Activity.push({
                                component: CONFIG.component + '_detail',
                                id: movie.id,
                                movie: movie
                            });
                        });
                        container.append(card);
                    })(movies[i]);
                }
            });

            this.activity.render().find('.activity__body').html(html);

            this.start = function() {
                Lampa.Controller.add('content', {
                    toggle: function() {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };
        }
    });

    // ===== DETAIL COMPONENT =====
    Lampa.Component.add(CONFIG.component + '_detail', {
        name: 'Chi tiết',
        type: 'video',

        create: function() {
            this.activity = arguments[0];
            this.movie = this.activity.movie;
            this.id = this.activity.id;
            this.render();
        },

        render: function() {
            var _this = this;
            
            var html = $('<div class="full-start" style="padding:20px;">' +
                '<div style="display:flex; gap:20px; margin-bottom:20px;">' +
                    '<img src="' + (this.movie.poster || CONFIG.poster_default) + '" style="width:200px; border-radius:8px;">' +
                    '<div style="flex:1;">' +
                        '<h1 style="margin:0 0 10px;">' + (this.movie.title || 'Loading...') + '</h1>' +
                        '<div class="desc" style="color:#aaa; margin-bottom:15px;">Đang tải...</div>' +
                        '<div style="display:flex; gap:10px;">' +
                            '<div class="button selector play">▶️ Xem</div>' +
                            '<div class="button selector fav">🤍 Yêu thích</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="episodes" style="display:none;">' +
                    '<div style="margin-bottom:10px; font-size:16px;">📺 Chọn tập:</div>' +
                    '<div class="ep-list" style="display:flex; gap:10px; flex-wrap:wrap;"></div>' +
                '</div>' +
            '</div>');

            var desc = html.find('.desc');
            var episodes = html.find('.episodes');
            var epList = html.find('.ep-list');
            var favBtn = html.find('.fav');

            // Check fav status
            if (isFav(this.id)) favBtn.text('❤️ Bỏ thích');

            // Load info
            getMovieInfo(this.id, function(info) {
                if (!info) {
                    desc.text('Không tải được thông tin');
                    return;
                }

                _this.info = info;
                desc.text(info.description || 'Không có mô tả');

                // Show episodes if multiple
                if (info.episodes.length > 1) {
                    episodes.show();
                    for (var i = 0; i < info.episodes.length; i++) {
                        (function(ep) {
                            var btn = $('<div class="button selector">Tập ' + ep.number + '</div>');
                            btn.on('hover:enter', function() {
                                _this.play(ep);
                            });
                            epList.append(btn);
                        })(info.episodes[i]);
                    }
                }
            });

            // Play button
            html.find('.play').on('hover:enter', function() {
                if (_this.info && _this.info.episodes.length > 0) {
                    // Tìm tập đã xem gần nhất
                    var lastEp = 0;
                    for (var i = 0; i < history.length; i++) {
                        if (history[i].id === _this.id) {
                            for (var j = 0; j < _this.info.episodes.length; j++) {
                                if (_this.info.episodes[j].number == history[i].episode) {
                                    lastEp = j;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    _this.play(_this.info.episodes[lastEp]);
                }
            });

            // Fav button
            favBtn.on('hover:enter', function() {
                if (isFav(_this.id)) {
                    removeFav(_this.id);
                    $(this).text('🤍 Yêu thích');
                } else {
                    addFav({
                        id: _this.id,
                        title: _this.movie.title,
                        poster: _this.movie.poster
                    });
                    $(this).text('❤️ Bỏ thích');
                }
            });

            this.activity.render().find('.activity__body').html(html);

            this.start = function() {
                Lampa.Controller.add('content', {
                    toggle: function() {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };
        },

        play: function(episode) {
            var _this = this;
            
            // Add to history
            addHist({
                id: this.id,
                title: this.movie.title,
                poster: this.movie.poster,
                episode: episode.number
            });

            Lampa.Noty.show('Đang tải...');

            getVideo(episode.url, function(qualities) {
                if (!qualities || !qualities[0]) {
                    Lampa.Noty.show('Không tải được link');
                    return;
                }

                var url = qualities[0].url;
                
                // Play
                if (url.indexOf('http') === 0) {
                    Lampa.Player.play({
                        url: url,
                        title: _this.movie.title + ' - Tập ' + episode.number,
                        poster: _this.movie.poster
                    });
                } else {
                    Lampa.Noty.show('Link không hợp lệ');
                }
            });
        }
    });

    // ===== ADD TO MENU =====
    function initMenu() {
        try {
            // Cách 1: Dùng Lampa.Menu.add
            if (Lampa.Menu && Lampa.Menu.add) {
                Lampa.Menu.add({
                    component: CONFIG.component,
                    title: CONFIG.name,
                    icon: '🎬'
                });
                console.log('NguonC: Added to menu via Menu.add');
                return;
            }

            // Cách 2: Dùng Lampa.Source
            if (Lampa.Source && Lampa.Source.add) {
                Lampa.Source.add(CONFIG.component, {
                    title: CONFIG.name,
                    type: 'video',
                    component: CONFIG.component,
                    categories: [
                        { title: 'Mới cập nhật', url: '' },
                        { title: 'Phim lẻ', url: '' },
                        { title: 'Phim bộ', url: '' }
                    ]
                });
                console.log('NguonC: Added via Source.add');
                return;
            }

            // Cách 3: Force inject vào DOM
            var checkMenu = setInterval(function() {
                var menu = document.querySelector('.menu__list');
                if (menu) {
                    clearInterval(checkMenu);
                    
                    // Kiểm tra đã có chưa
                    var exists = menu.querySelector('[data-component="' + CONFIG.component + '"]');
                    if (exists) return;

                    var li = document.createElement('li');
                    li.className = 'menu__item selector';
                    li.setAttribute('data-component', CONFIG.component);
                    li.setAttribute('data-action', CONFIG.component);
                    li.innerHTML = '<div class="menu__ico">🎬</div><div class="menu__text">' + CONFIG.name + '</div>';
                    
                    li.addEventListener('click', function() {
                        Lampa.Activity.push({
                            component: CONFIG.component
                        });
                    });

                    menu.appendChild(li);
                    console.log('NguonC: Force injected to menu');
                }
            }, 1000);

            // Clear sau 10s
            setTimeout(function() {
                clearInterval(checkMenu);
            }, 10000);

        } catch(e) {
            console.error('NguonC menu error:', e);
        }
    }

    // Init khi ready
    if (window.appready) {
        initMenu();
    } else {
        document.addEventListener('appready', initMenu);
    }

    // Backup init
    setTimeout(initMenu, 3000);

    console.log('NguonC Plugin v' + CONFIG.version + ' loaded');

})();