/**
 * NguồnC Plugin for Lampa
 * Version: 2.0.0
 * Author: Your Name
 * Features: Multi-category, Search, History, Favorites, Auto-next episode, Quality selector
 */

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    var CONFIG = {
        name: 'NguồnC',
        component: 'nguonc',
        version: '2.0.0',
        base_url: 'https://phim.nguonc.com',
        poster_default: 'https://via.placeholder.com/300x450/1a1a1a/666?text=No+Poster',
        items_per_page: 24,
        cache_time: 3600 // seconds
    };

    // ============ STATE MANAGEMENT ============
    var STATE = {
        favorites: Lampa.Storage.get('nguonc_favorites') || [],
        history: Lampa.Storage.get('nguonc_history') || [],
        settings: Lampa.Storage.get('nguonc_settings') || {
            auto_next: true,
            default_quality: 'auto',
            skip_intro: false
        }
    };

    // ============ UTILITY FUNCTIONS ============
    
    // Save state to storage
    function saveState() {
        Lampa.Storage.set('nguonc_favorites', STATE.favorites);
        Lampa.Storage.set('nguonc_history', STATE.history);
        Lampa.Storage.set('nguonc_settings', STATE.settings);
    }

    // Add to history
    function addToHistory(item) {
        var exists = STATE.history.findIndex(function(h) { return h.id === item.id; });
        if (exists > -1) STATE.history.splice(exists, 1);
        STATE.history.unshift({
            id: item.id,
            title: item.title,
            poster: item.poster,
            episode: item.episode || null,
            time: Date.now()
        });
        if (STATE.history.length > 50) STATE.history.pop();
        saveState();
    }

    // Toggle favorite
    function toggleFavorite(item) {
        var index = STATE.favorites.findIndex(function(f) { return f.id === item.id; });
        if (index > -1) {
            STATE.favorites.splice(index, 1);
            Lampa.Noty.show('Đã xóa khỏi yêu thích');
        } else {
            STATE.favorites.push({
                id: item.id,
                title: item.title,
                poster: item.poster,
                added: Date.now()
            });
            Lampa.Noty.show('Đã thêm vào yêu thích');
        }
        saveState();
        return index === -1;
    }

    // Check is favorite
    function isFavorite(id) {
        return STATE.favorites.some(function(f) { return f.id === id; });
    }

    // Format time
    function formatTime(timestamp) {
        var date = new Date(timestamp);
        return date.toLocaleDateString('vi-VN');
    }

    // Parse HTML helper
    function parseHTML(html) {
        var parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    // ============ API FUNCTIONS ============

    // Fetch with error handling
    function fetch(url, callback, errorCallback) {
        $.ajax({
            url: url,
            method: 'GET',
            timeout: 15000,
            success: callback,
            error: function(xhr, status, error) {
                console.log('NguonC Error:', status, error);
                if (errorCallback) errorCallback();
                else Lampa.Noty.show('Lỗi kết nối: ' + status);
            }
        });
    }

    // Get movies by category
    function getMovies(type, page, callback) {
        var urls = {
            latest: '/phim-moi-cap-nhat',
            single: '/phim-le',
            series: '/phim-bo',
            cinema: '/phim-chieu-rap',
            anime: '/hoat-hinh',
            tvshow: '/tv-show'
        };
        
        var url = CONFIG.base_url + (urls[type] || urls.latest) + '?page=' + page;
        
        fetch(url, function(html) {
            var doc = parseHTML(html);
            var movies = [];
            
            // Try multiple selectors
            var selectors = [
                '.film-item',
                '.movie-item', 
                '.item',
                '.card',
                '.poster'
            ];
            
            var items = [];
            for (var i = 0; i < selectors.length; i++) {
                items = doc.querySelectorAll(selectors[i]);
                if (items.length > 0) break;
            }
            
            items.forEach(function(item) {
                var link = item.querySelector('a');
                var img = item.querySelector('img');
                var title = item.querySelector('.name, .title, h3, h2, .film-name');
                var quality = item.querySelector('.quality, .resolution, .label');
                var episode = item.querySelector('.episode, .ep, .status');
                
                if (link && title) {
                    var href = link.getAttribute('href') || '';
                    var id = href.split('/').pop().split('?')[0];
                    
                    movies.push({
                        id: id,
                        title: title.textContent.trim(),
                        poster: img ? (img.getAttribute('data-src') || img.getAttribute('src')) : CONFIG.poster_default,
                        quality: quality ? quality.textContent.trim() : '',
                        episode: episode ? episode.textContent.trim() : '',
                        url: href.startsWith('http') ? href : CONFIG.base_url + href
                    });
                }
            });
            
            callback(movies);
        }, function() {
            callback([]);
        });
    }

    // Search movies
    function searchMovies(query, page, callback) {
        var url = CONFIG.base_url + '/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + page;
        
        fetch(url, function(html) {
            var doc = parseHTML(html);
            var movies = [];
            
            var items = doc.querySelectorAll('.film-item, .movie-item, .item, .search-item');
            
            items.forEach(function(item) {
                var link = item.querySelector('a');
                var img = item.querySelector('img');
                var title = item.querySelector('.name, .title, h3, .film-name');
                
                if (link && title) {
                    var href = link.getAttribute('href') || '';
                    movies.push({
                        id: href.split('/').pop().split('?')[0],
                        title: title.textContent.trim(),
                        poster: img ? (img.getAttribute('data-src') || img.getAttribute('src')) : CONFIG.poster_default,
                        url: href.startsWith('http') ? href : CONFIG.base_url + href
                    });
                }
            });
            
            callback(movies);
        }, function() {
            callback([]);
        });
    }

    // Get movie details
    function getMovieDetails(id, callback) {
        var url = CONFIG.base_url + '/phim/' + id;
        
        fetch(url, function(html) {
            var doc = parseHTML(html);
            
            var title = doc.querySelector('h1, .film-title, .movie-title');
            var poster = doc.querySelector('.film-poster img, .movie-poster img, .poster img');
            var desc = doc.querySelector('.description, .summary, .content, .film-description');
            var info = doc.querySelector('.film-info, .movie-info, .info');
            
            // Parse episodes
            var episodes = [];
            var epElements = doc.querySelectorAll('.episode a, .ep-item, .episode-item, [data-episode]');
            
            epElements.forEach(function(ep, index) {
                var epNum = ep.getAttribute('data-episode') || 
                           ep.textContent.match(/\d+/) || 
                           (index + 1);
                var epUrl = ep.getAttribute('href') || ep.getAttribute('data-url');
                
                if (epUrl) {
                    episodes.push({
                        number: parseInt(epNum) || (index + 1),
                        title: 'Tập ' + (parseInt(epNum) || (index + 1)),
                        url: epUrl.startsWith('http') ? epUrl : CONFIG.base_url + epUrl
                    });
                }
            });
            
            // If no episodes found, create single episode
            if (episodes.length === 0) {
                episodes.push({
                    number: 1,
                    title: 'Full',
                    url: url
                });
            }
            
            var details = {
                id: id,
                title: title ? title.textContent.trim() : 'Unknown',
                poster: poster ? (poster.getAttribute('data-src') || poster.getAttribute('src')) : CONFIG.poster_default,
                description: desc ? desc.textContent.trim() : '',
                info: info ? info.textContent.trim() : '',
                episodes: episodes
            };
            
            callback(details);
        }, function() {
            callback(null);
        });
    }

    // Get video URL from episode
    function getVideoUrl(episodeUrl, callback) {
        fetch(episodeUrl, function(html) {
            var videoUrl = null;
            var qualities = [];
            
            // Try to find direct video URL
            var videoMatch = html.match(/(https?:\/\/[^"']+\.(m3u8|mp4)[^"']*)/i);
            if (videoMatch) {
                qualities.push({ quality: 'auto', url: videoMatch[1] });
            }
            
            // Find HLS streams
            var hlsMatch = html.match(/["']([^"']*\.m3u8[^"']*)["']/);
            if (hlsMatch) {
                videoUrl = hlsMatch[1].replace(/\\\//g, '/');
                qualities.push({ quality: 'HLS', url: videoUrl });
            }
            
            // Find embed iframe (for extracting later)
            var embedMatch = html.match(/iframe[^>]+src=["']([^"']+)["']/i);
            if (embedMatch && !videoUrl) {
                var embedUrl = embedMatch[1];
                // Handle relative URLs
                if (embedUrl.startsWith('//')) embedUrl = 'https:' + embedUrl;
                else if (embedUrl.startsWith('/')) embedUrl = CONFIG.base_url + embedUrl;
                
                qualities.push({ quality: 'embed', url: embedUrl, type: 'embed' });
            }
            
            // Multiple quality patterns
            var qualityMatches = html.matchAll(/(1080p|720p|480p|360p)[^"']*(https?:\/\/[^"']+\.(m3u8|mp4)[^"']*)/gi);
            for (var match of qualityMatches) {
                qualities.push({ quality: match[1], url: match[2] });
            }
            
            callback(qualities.length > 0 ? qualities : null);
        }, function() {
            callback(null);
        });
    }

    // ============ UI COMPONENTS ============

    // Create movie card
    function createCard(movie, options) {
        options = options || {};
        
        var card = $('<div class="card selector">' +
            '<div class="card__view">' +
                '<img src="' + (movie.poster || CONFIG.poster_default) + '" class="card__img" loading="lazy">' +
                (movie.quality ? '<div class="card__quality">' + movie.quality + '</div>' : '') +
                (movie.episode ? '<div class="card__episode">' + movie.episode + '</div>' : '') +
                (options.badge ? '<div class="card__badge">' + options.badge + '</div>' : '') +
            '</div>' +
            '<div class="card__title">' + movie.title + '</div>' +
            (options.subtitle ? '<div class="card__subtitle">' + options.subtitle + '</div>' : '') +
        '</div>');
        
        return card;
    }

    // ============ MAIN COMPONENT ============
    
    Lampa.Component.add(CONFIG.component, {
        name: CONFIG.name,
        type: 'video',
        component: 'category',
        category: 'Phim Online',

        create: function() {
            this.activity = arguments[0];
            this.currentTab = this.activity.tab || 'latest';
            this.page = 1;
            this.movies = [];
            this.loading = false;
            this.render();
        },

        render: function() {
            var _this = this;
            
            // Main container
            var html = $('<div class="category-full">' +
                '<div class="category__tabs">' +
                    '<div class="tabs">' +
                        '<div class="tab selector' + (this.currentTab === 'latest' ? ' active' : '') + '" data-tab="latest">Mới cập nhật</div>' +
                        '<div class="tab selector' + (this.currentTab === 'single' ? ' active' : '') + '" data-tab="single">Phim lẻ</div>' +
                        '<div class="tab selector' + (this.currentTab === 'series' ? ' active' : '') + '" data-tab="series">Phim bộ</div>' +
                        '<div class="tab selector' + (this.currentTab === 'cinema' ? ' active' : '') + '" data-tab="cinema">Chiếu rạp</div>' +
                        '<div class="tab selector' + (this.currentTab === 'anime' ? ' active' : '') + '" data-tab="anime">Hoạt hình</div>' +
                        '<div class="tab selector' + (this.currentTab === 'favorites' ? ' active' : '') + '" data-tab="favorites">❤️ Yêu thích</div>' +
                        '<div class="tab selector' + (this.currentTab === 'history' ? ' active' : '') + '" data-tab="history">🕐 Lịch sử</div>' +
                    '</div>' +
                '</div>' +
                '<div class="category__search">' +
                    '<div class="search-field selector">' +
                        '<div class="search-field__icon">🔍</div>' +
                        '<div class="search-field__input">Tìm kiếm phim...</div>' +
                    '</div>' +
                '</div>' +
                '<div class="category__content">' +
                    '<div class="items-cards"></div>' +
                    '<div class="loading-spinner" style="display:none; text-align:center; padding:20px;">⏳ Đang tải...</div>' +
                    '<div class="end-message" style="display:none; text-align:center; padding:20px; color:#666;">Không còn phim để hiển thị</div>' +
                '</div>' +
            '</div>');

            this.cardsContainer = html.find('.items-cards');
            this.loadingSpinner = html.find('.loading-spinner');
            this.endMessage = html.find('.end-message');

            // Tab switching
            html.find('.tab').on('hover:enter', function() {
                var tab = $(this).data('tab');
                if (tab === _this.currentTab) return;
                
                Lampa.Activity.push({
                    component: CONFIG.component,
                    tab: tab
                });
            });

            // Search
            html.find('.search-field').on('hover:enter', function() {
                Lampa.Input.show({
                    title: 'Tìm kiếm phim',
                    value: '',
                    free: true,
                    numpad: true,
                    callback: function(query) {
                        if (query) {
                            Lampa.Activity.push({
                                component: CONFIG.component + '_search',
                                query: query
                            });
                        }
                    }
                });
            });

            // Load content based on tab
            this.loadContent();

            // Infinite scroll
            html.on('scroll', function() {
                if (_this.loading) return;
                var scrollTop = $(this).scrollTop();
                var scrollHeight = this.scrollHeight - this.clientHeight;
                
                if (scrollTop > scrollHeight - 500) {
                    _this.loadMore();
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

            this.pause = function() {};
            this.stop = function() {};
            this.destroy = function() {};
        },

        loadContent: function() {
            var _this = this;
            this.loading = true;
            this.loadingSpinner.show();

            if (this.currentTab === 'favorites') {
                this.renderFavorites();
            } else if (this.currentTab === 'history') {
                this.renderHistory();
            } else {
                getMovies(this.currentTab, this.page, function(movies) {
                    _this.movies = movies;
                    _this.renderMovies(movies);
                    _this.loading = false;
                    _this.loadingSpinner.hide();
                });
            }
        },

        loadMore: function() {
            if (this.currentTab === 'favorites' || this.currentTab === 'history') return;
            
            var _this = this;
            this.page++;
            this.loading = true;
            this.loadingSpinner.show();

            getMovies(this.currentTab, this.page, function(movies) {
                if (movies.length === 0) {
                    _this.endMessage.show();
                } else {
                    _this.renderMovies(movies, true);
                }
                _this.loading = false;
                _this.loadingSpinner.hide();
            });
        },

        renderMovies: function(movies, append) {
            var _this = this;
            if (!append) this.cardsContainer.empty();

            movies.forEach(function(movie) {
                var card = createCard(movie);
                
                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        component: CONFIG.component + '_detail',
                        id: movie.id,
                        movie: movie
                    });
                });

                _this.cardsContainer.append(card);
            });

            Lampa.Controller.collectionSet(this.activity.render().find('.category-full'));
        },

        renderFavorites: function() {
            this.loading = false;
            this.loadingSpinner.hide();
            
            if (STATE.favorites.length === 0) {
                this.cardsContainer.html('<div style="text-align:center; padding:40px; color:#666;">Chưa có phim yêu thích nào<br>💕 Hãy thêm phim vào đây!</div>');
                return;
            }

            var _this = this;
            STATE.favorites.forEach(function(movie) {
                var card = createCard(movie, { 
                    badge: '❤️',
                    subtitle: 'Thêm: ' + formatTime(movie.added)
                });
                
                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        component: CONFIG.component + '_detail',
                        id: movie.id,
                        movie: movie
                    });
                });

                _this.cardsContainer.append(card);
            });
        },

        renderHistory: function() {
            this.loading = false;
            this.loadingSpinner.hide();
            
            if (STATE.history.length === 0) {
                this.cardsContainer.html('<div style="text-align:center; padding:40px; color:#666;">Chưa có lịch sử xem<br>🎬 Hãy xem phim nào!</div>');
                return;
            }

            var _this = this;
            STATE.history.forEach(function(item) {
                var card = createCard(item, {
                    badge: item.episode ? '▶️ Tập ' + item.episode : '▶️',
                    subtitle: 'Xem: ' + formatTime(item.time)
                });
                
                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        component: CONFIG.component + '_detail',
                        id: item.id,
                        movie: item,
                        resume: item.episode
                    });
                });

                _this.cardsContainer.append(card);
            });
        }
    });

    // ============ SEARCH COMPONENT ============
    
    Lampa.Component.add(CONFIG.component + '_search', {
        name: 'Tìm kiếm - NguồnC',
        type: 'video',

        create: function() {
            this.activity = arguments[0];
            this.query = this.activity.query;
            this.page = 1;
            this.render();
        },

        render: function() {
            var _this = this;
            
            var html = $('<div class="category-full">' +
                '<div class="category__title">🔍 Kết quả tìm: ' + this.query + '</div>' +
                '<div class="items-cards"></div>' +
                '<div class="loading-spinner" style="text-align:center; padding:20px;">⏳ Đang tìm...</div>' +
            '</div>');

            var container = html.find('.items-cards');

            searchMovies(this.query, 1, function(movies) {
                html.find('.loading-spinner').hide();
                
                if (movies.length === 0) {
                    container.html('<div style="text-align:center; padding:40px;">Không tìm thấy phim nào 😔</div>');
                    return;
                }

                movies.forEach(function(movie) {
                    var card = createCard(movie);
                    card.on('hover:enter', function() {
                        Lampa.Activity.push({
                            component: CONFIG.component + '_detail',
                            id: movie.id,
                            movie: movie
                        });
                    });
                    container.append(card);
                });
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

    // ============ DETAIL COMPONENT ============
    
    Lampa.Component.add(CONFIG.component + '_detail', {
        name: 'Chi tiết phim',
        type: 'video',

        create: function() {
            this.activity = arguments[0];
            this.movie = this.activity.movie;
            this.id = this.activity.id;
            this.render();
        },

        render: function() {
            var _this = this;
            
            var html = $('<div class="full-start">' +
                '<div class="full-start__background"></div>' +
                '<div class="full-start__content">' +
                    '<div class="full-start__left">' +
                        '<div class="full-start__poster">' +
                            '<img src="' + (this.movie.poster || CONFIG.poster_default) + '" class="full-start__img">' +
                        '</div>' +
                    '</div>' +
                    '<div class="full-start__right">' +
                        '<div class="full-start__title">' + (this.movie.title || 'Loading...') + '</div>' +
                        '<div class="full-start__description">Đang tải thông tin...</div>' +
                        '<div class="full-start__buttons">' +
                            '<div class="button selector play">▶️ Xem phim</div>' +
                            '<div class="button selector favorite">🤍 Yêu thích</div>' +
                            '<div class="button selector trailer">🎬 Trailer</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="full-episodes" style="display:none;">' +
                    '<div class="full-episodes__title">📺 Chọn tập</div>' +
                    '<div class="full-episodes__list"></div>' +
                '</div>' +
            '</div>');

            var desc = html.find('.full-start__description');
            var episodesSection = html.find('.full-episodes');
            var episodesList = html.find('.full-episodes__list');
            var favBtn = html.find('.favorite');

            // Update favorite button state
            if (isFavorite(this.id)) {
                favBtn.text('❤️ Bỏ yêu thích');
            }

            // Load details
            getMovieDetails(this.id, function(details) {
                if (!details) {
                    desc.text('Không thể tải thông tin phim');
                    return;
                }

                _this.details = details;
                desc.text(details.description || 'Không có mô tả');
                
                // Render episodes
                if (details.episodes.length > 1) {
                    episodesSection.show();
                    details.episodes.forEach(function(ep) {
                        var epBtn = $('<div class="button selector episode">Tập ' + ep.number + '</div>');
                        epBtn.on('hover:enter', function() {
                            _this.playEpisode(ep);
                        });
                        episodesList.append(epBtn);
                    });
                }

                // Resume watching
                var historyItem = STATE.history.find(function(h) { return h.id === _this.id; });
                if (historyItem && historyItem.episode) {
                    html.find('.play').text('▶️ Tiếp tục tập ' + historyItem.episode);
                }
            });

            // Play button
            html.find('.play').on('hover:enter', function() {
                if (_this.details && _this.details.episodes.length > 0) {
                    var lastEp = 0;
                    var historyItem = STATE.history.find(function(h) { return h.id === _this.id; });
                    if (historyItem) lastEp = _this.details.episodes.findIndex(function(e) { 
                        return e.number == historyItem.episode; 
                    });
                    if (lastEp < 0) lastEp = 0;
                    
                    _this.playEpisode(_this.details.episodes[lastEp]);
                }
            });

            // Favorite button
            favBtn.on('hover:enter', function() {
                var isFav = toggleFavorite({
                    id: _this.id,
                    title: _this.movie.title,
                    poster: _this.movie.poster
                });
                $(this).text(isFav ? '❤️ Bỏ yêu thích' : '🤍 Yêu thích');
            });

            // Trailer button
            html.find('.trailer').on('hover:enter', function() {
                Lampa.Noty.show('Tính năng đang phát triển');
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

        playEpisode: function(episode) {
            var _this = this;
            
            Lampa.Noty.show('Đang tải link phim...');
            
            getVideoUrl(episode.url, function(qualities) {
                if (!qualities || qualities.length === 0) {
                    Lampa.Noty.show('Không thể tải link phim 😔');
                    return;
                }

                // Add to history
                addToHistory({
                    id: _this.id,
                    title: _this.movie.title,
                    poster: _this.movie.poster,
                    episode: episode.number
                });

                // Select quality
                var selected = qualities.find(function(q) { 
                    return q.quality === STATE.settings.default_quality; 
                }) || qualities[0];

                // Play
                if (selected.type === 'embed') {
                    // Handle embed (open in external player or webview)
                    Lampa.Browser.open({
                        title: _this.movie.title + ' - Tập ' + episode.number,
                        url: selected.url
                    });
                } else {
                    Lampa.Player.play({
                        url: selected.url,
                        title: _this.movie.title + ' - Tập ' + episode.number,
                        poster: _this.movie.poster,
                        from: CONFIG.name
                    });

                    // Auto next episode
                    if (STATE.settings.auto_next && _this.details.episodes.length > episode.number) {
                        Lampa.Player.on('ended', function() {
                            var nextEp = _this.details.episodes[episode.number]; // index = number (0-based)
                            if (nextEp) {
                                Lampa.Noty.show('Chuyển sang tập tiếp theo...');
                                setTimeout(function() {
                                    _this.playEpisode(nextEp);
                                }, 3000);
                            }
                        });
                    }
                }
            });
        }
    });

    // ============ SETTINGS COMPONENT ============
    
    Lampa.Component.add(CONFIG.component + '_settings', {
        name: 'Cài đặt NguồnC',
        type: 'settings',

        create: function() {
            this.activity = arguments[0];
            this.render();
        },

        render: function() {
            var html = $('<div class="settings">' +
                '<div class="settings__title">⚙️ Cài đặt NguồnC</div>' +
                '<div class="settings__content">' +
                    '<div class="setting selector">' +
                        '<div class="setting__name">Tự động chuyển tập</div>' +
                        '<div class="setting__value">' + (STATE.settings.auto_next ? 'Bật' : 'Tắt') + '</div>' +
                    '</div>' +
                    '<div class="setting selector">' +
                        '<div class="setting__name">Chất lượng mặc định</div>' +
                        '<div class="setting__value">' + STATE.settings.default_quality + '</div>' +
                    '</div>' +
                    '<div class="setting selector">' +
                        '<div class="setting__name">Xóa lịch sử xem</div>' +
                        '<div class="setting__value">🗑️</div>' +
                    '</div>' +
                '</div>' +
            '</div>');

            // Toggle auto next
            html.find('.setting').eq(0).on('hover:enter', function() {
                STATE.settings.auto_next = !STATE.settings.auto_next;
                $(this).find('.setting__value').text(STATE.settings.auto_next ? 'Bật' : 'Tắt');
                saveState();
                Lampa.Noty.show(STATE.settings.auto_next ? 'Đã bật tự động chuyển tập' : 'Đã tắt tự động chuyển tập');
            });

            // Change default quality
            html.find('.setting').eq(1).on('hover:enter', function() {
                var qualities = ['auto', '1080p', '720p', '480p', '360p'];
                var current = qualities.indexOf(STATE.settings.default_quality);
                var next = (current + 1) % qualities.length;
                STATE.settings.default_quality = qualities[next];
                $(this).find('.setting__value').text(STATE.settings.default_quality);
                saveState();
            });

            // Clear history
            html.find('.setting').eq(2).on('hover:enter', function() {
                STATE.history = [];
                saveState();
                Lampa.Noty.show('Đã xóa lịch sử xem');
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

    // ============ REGISTER TO LAMPA MENU ============
    
    function addToLampaMenu() {
        // Wait for Lampa to be ready
        if (!window.Lampa || !Lampa.Menu) {
            setTimeout(addToLampaMenu, 1000);
            return;
        }

        // Add to main menu
        var menuItems = Lampa.Menu.items || [];
        var exists = menuItems.find(function(item) { 
            return item.component === CONFIG.component; 
        });
        
        if (!exists) {
            Lampa.Menu.add({
                component: CONFIG.component,
                title: CONFIG.name,
                icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M10 8l6 4-6 4V8z"/></svg>',
                icon_path: ''
            });
        }

        // Add settings to Lampa settings
        if (Lampa.Settings) {
            Lampa.Settings.add({
                component: CONFIG.component + '_settings',
                title: CONFIG.name,
                icon: '🎬'
            });
        }
    }

    // Initialize when ready
    if (window.appready) {
        addToLampaMenu();
    } else {
        $(document).on('appready', addToLampaMenu);
    }

    // Also try after a delay for Android
    setTimeout(addToLampaMenu, 2000);

    console.log('NguonC Plugin v' + CONFIG.version + ' loaded');

})();