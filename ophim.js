(function() {
    'use strict';

    var component_name = 'nguonc';
    var base_url = 'https://phim.nguonc.com';
    var api_url = 'https://phim.nguonc.com/api';

    // Parse HTML từ NguồnC
    function parseMovies(html) {
        var movies = [];
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        
        // Selector tùy thuộc cấu trúc HTML của NguồnC
        var items = doc.querySelectorAll('.movie-item, .film-item, .item');
        
        items.forEach(function(item) {
            var link = item.querySelector('a');
            var img = item.querySelector('img');
            var title = item.querySelector('.title, .name, h3');
            
            if (link && title) {
                movies.push({
                    id: link.href.split('/').pop(),
                    title: title.textContent.trim(),
                    poster: img ? img.src : '',
                    url: link.href
                });
            }
        });
        
        return movies;
    }

    // Lấy danh sách phim mới
    function getLatestMovies(page, callback) {
        $.ajax({
            url: base_url + '/phim-moi-cap-nhat?page=' + page,
            method: 'GET',
            success: function(html) {
                var movies = parseMovies(html);
                callback(movies);
            },
            error: function() {
                Lampa.Noty.show('Không thể tải danh sách phim');
                callback([]);
            }
        });
    }

    // Tìm kiếm phim
    function searchMovies(query, callback) {
        $.ajax({
            url: base_url + '/tim-kiem?keyword=' + encodeURIComponent(query),
            method: 'GET',
            success: function(html) {
                var movies = parseMovies(html);
                callback(movies);
            },
            error: function() {
                callback([]);
            }
        });
    }

    // Lấy thông tin phim + tập
    function getMovieInfo(movieId, callback) {
        $.ajax({
            url: base_url + '/phim/' + movieId,
            method: 'GET',
            success: function(html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                
                var episodes = [];
                var episodeElements = doc.querySelectorAll('.episode a, .ep-item');
                
                episodeElements.forEach(function(ep, index) {
                    episodes.push({
                        number: index + 1,
                        title: ep.textContent.trim(),
                        url: ep.href || ep.getAttribute('data-url')
                    });
                });
                
                var poster = doc.querySelector('.movie-poster img, .film-poster img');
                var title = doc.querySelector('h1, .movie-title');
                var desc = doc.querySelector('.description, .summary');
                
                callback({
                    id: movieId,
                    title: title ? title.textContent.trim() : '',
                    poster: poster ? poster.src : '',
                    description: desc ? desc.textContent.trim() : '',
                    episodes: episodes
                });
            },
            error: function() {
                Lampa.Noty.show('Không thể tải thông tin phim');
                callback(null);
            }
        });
    }

    // Lấy link video từ tập phim
    function getVideoUrl(episodeUrl, callback) {
        $.ajax({
            url: episodeUrl,
            method: 'GET',
            success: function(html) {
                // Tìm link video trong HTML
                var videoMatch = html.match(/(https?:\/\/[^"']+\.(m3u8|mp4)[^"']*)/i);
                var embedMatch = html.match(/iframe[^>]+src=["']([^"']+)["']/i);
                
                if (videoMatch) {
                    callback({
                        type: 'direct',
                        url: videoMatch[1]
                    });
                } else if (embedMatch) {
                    callback({
                        type: 'embed',
                        url: embedMatch[1]
                    });
                } else {
                    callback(null);
                }
            },
            error: function() {
                callback(null);
            }
        });
    }

    // Component chính
    Lampa.Component.add(component_name, {
        name: 'NguồnC',
        type: 'video',
        category: 'Phim Việt',

        create: function() {
            this.activity = arguments[0];
            this.movies = [];
            this.page = 1;
            this.render();
        },

        render: function() {
            var _this = this;
            
            var html = $('<div class="component-full">' +
                '<div class="component-head">' +
                    '<div class="component__title">NguồnC - Phim Mới</div>' +
                '</div>' +
                '<div class="category-full">' +
                    '<div class="items-cards"></div>' +
                    '<div class="button selector load-more">Tải thêm</div>' +
                '</div>' +
            '</div>');

            var container = html.find('.items-cards');
            var loadMore = html.find('.load-more');

            function renderMovies(movies) {
                movies.forEach(function(movie) {
                    var card = $('<div class="card selector">' +
                        '<div class="card__view">' +
                            '<img src="' + (movie.poster || 'https://via.placeholder.com/200x300') + '" class="card__img">' +
                            '<div class="card__quality"></div>' +
                        '</div>' +
                        '<div class="card__title">' + movie.title + '</div>' +
                    '</div>');

                    card.on('hover:enter', function() {
                        // Mở trang chi tiết phim
                        Lampa.Activity.push({
                            url: '',
                            component: 'nguonc_detail',
                            id: movie.id,
                            title: movie.title
                        });
                    });

                    container.append(card);
                });
            }

            // Load phim ban đầu
            getLatestMovies(this.page, function(movies) {
                _this.movies = movies;
                renderMovies(movies);
            });

            // Nút tải thêm
            loadMore.on('hover:enter', function() {
                _this.page++;
                getLatestMovies(_this.page, function(movies) {
                    renderMovies(movies);
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

            this.pause = function() {};
            this.stop = function() {};
            this.destroy = function() {};
        }
    });

    // Component chi tiết phim
    Lampa.Component.add('nguonc_detail', {
        name: 'Chi tiết phim',
        type: 'video',

        create: function() {
            this.activity = arguments[0];
            this.movieData = null;
            this.render();
        },

        render: function() {
            var _this = this;
            var movieId = this.activity.id;

            var html = $('<div class="component-full">' +
                '<div class="full-start">' +
                    '<div class="full-start__background"></div>' +
                    '<div class="full-start__content">' +
                        '<div class="full-start__poster">' +
                            '<img src="" class="full-start__img">' +
                        '</div>' +
                        '<div class="full-start__info">' +
                            '<div class="full-start__title"></div>' +
                            '<div class="full-start__description"></div>' +
                            '<div class="full-start__buttons">' +
                                '<div class="button selector play">Xem phim</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="full-episodes">' +
                        '<div class="full-episodes__title">Danh sách tập</div>' +
                        '<div class="full-episodes__list"></div>' +
                    '</div>' +
                '</div>' +
            '</div>');

            var poster = html.find('.full-start__img');
            var title = html.find('.full-start__title');
            var desc = html.find('.full-start__description');
            var episodesList = html.find('.full-episodes__list');

            getMovieInfo(movieId, function(data) {
                if (!data) return;
                
                _this.movieData = data;
                poster.attr('src', data.poster);
                title.text(data.title);
                desc.text(data.description);

                // Render danh sách tập
                data.episodes.forEach(function(ep) {
                    var epBtn = $('<div class="button selector episode">' +
                        'Tập ' + ep.number +
                    '</div>');

                    epBtn.on('hover:enter', function() {
                        getVideoUrl(ep.url, function(video) {
                            if (video) {
                                Lampa.Player.play({
                                    url: video.url,
                                    title: data.title + ' - Tập ' + ep.number
                                });
                            } else {
                                Lampa.Noty.show('Không thể tải link video');
                            }
                        });
                    });

                    episodesList.append(epBtn);
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

})();