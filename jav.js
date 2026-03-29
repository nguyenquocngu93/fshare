(function () {
    'use strict';

    var Manifest = {
        name: 'KKPhim',
        version: '1.0.0',
        description: 'Plugin xem phim từ KKPhim',
        author: 'Your Name'
    };

    var API_URL = 'https://phimapi.com/';

    function startPlugin() {
        // Thêm component chính
        Lampa.Component.add('kkphim', KKPhimComponent);

        // Thêm vào menu
        Lampa.Template.add('menu_kkphim', '<img src="https://img.icons8.com/color/48/film-reel.png" />');
        
        Lampa.Menu.add({
            title: 'KKPhim',
            component: 'kkphim',
            icon: Lampa.Template.get('menu_kkphim', {}, true)
        });

        // CSS tùy chỉnh
        addCustomCSS();
    }

    function KKPhimComponent(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var items = [];
        var html = $('<div></div>');
        var active = 0;

        var categories = [
            { name: 'Phim Bộ', slug: 'phim-bo', page: 1 },
            { name: 'Phim Lẻ', slug: 'phim-le', page: 1 },
            { name: 'TV Shows', slug: 'tv-shows', page: 1 },
            { name: 'Hoạt Hình', slug: 'hoat-hinh', page: 1 }
        ];

        this.create = function () {
            this.activity.loader(true);
            html.append(scroll.render());
            loadCategories();
            return html;
        };

        function loadCategories() {
            categories.forEach(function(cat, index) {
                loadCategory(cat, index === categories.length - 1);
            });
        }

        function loadCategory(category, isLast) {
            var url = API_URL + 'danh-sach/' + category.slug + '?page=' + category.page;

            network.silent(url, function(data) {
                if (data && data.items) {
                    createRow(category.name, data.items, category);
                    if (isLast) {
                        scroll.append(html);
                        Lampa.Controller.enable('content');
                    }
                }
            }, function(error) {
                console.log('Error loading category:', category.name);
            });
        }

        function createRow(title, movies, category) {
            var row = $('<div class="kkphim-row"></div>');
            var rowTitle = $('<div class="kkphim-row-title">' + title + '</div>');
            var rowContent = $('<div class="kkphim-row-content"></div>');
            var viewMore = $('<div class="kkphim-view-more">Xem thêm →</div>');

            // Hiển thị tối đa 10 phim mỗi row
            var displayMovies = movies.slice(0, 10);

            displayMovies.forEach(function(movie) {
                var card = createCard(movie);
                rowContent.append(card);
            });

            viewMore.on('click', function() {
                openCategoryPage(category);
            });

            row.append(rowTitle);
            row.append(rowContent);
            row.append(viewMore);
            scroll.append(row);
        }

        function createCard(movie) {
            var card = $('<div class="kkphim-card selector"></div>');
            var poster = movie.poster_url || movie.thumb_url;
            
            var cardHTML = `
                <div class="kkphim-card-poster">
                    <img src="${poster}" onerror="this.src='https://via.placeholder.com/300x450/333/fff?text=No+Image'" />
                    <div class="kkphim-card-quality">${movie.quality || 'HD'}</div>
                    <div class="kkphim-card-episode">${movie.episode_current || ''}</div>
                </div>
                <div class="kkphim-card-info">
                    <div class="kkphim-card-title">${movie.name}</div>
                    <div class="kkphim-card-year">${movie.year || ''}</div>
                </div>
            `;

            card.html(cardHTML);

            card.on('hover:enter', function() {
                showMovieInfo(movie, card);
            });

            card.on('hover:focus', function() {
                scroll.update(card, true);
            });

            return card;
        }

        function showMovieInfo(movie, card) {
            Lampa.Activity.push({
                url: '',
                title: movie.name,
                component: 'kkphim_detail',
                movie: movie,
                page: 1
            });
        }

        function openCategoryPage(category) {
            // Mở trang danh mục đầy đủ
            Lampa.Activity.push({
                url: '',
                title: category.name,
                component: 'kkphim_category',
                category: category,
                page: 1
            });
        }

        this.start = function () {
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

            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return html; };
        this.destroy = function () { 
            network.clear();
            scroll.destroy();
            html.remove();
        };
    }

    // Component chi tiết phim với backdrop đẹp
    Lampa.Component.add('kkphim_detail', function(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({ mask: true, over: true });
        var html = $('<div></div>');
        var movie = object.movie;

        this.create = function() {
            this.activity.loader(true);
            
            var url = API_URL + 'phim/' + movie.slug;
            
            network.silent(url, function(data) {
                if (data && data.movie) {
                    buildDetailPage(data.movie);
                }
            }, function(error) {
                Lampa.Noty.show('Lỗi tải thông tin phim');
            });

            return html;
        };

        function buildDetailPage(movieData) {
            var detailHTML = `
                <div class="kkphim-detail">
                    <div class="kkphim-detail-backdrop">
                        <img src="${movieData.poster_url}" class="kkphim-backdrop-img" />
                        <div class="kkphim-backdrop-overlay"></div>
                    </div>
                    <div class="kkphim-detail-content">
                        <div class="kkphim-detail-poster">
                            <img src="${movieData.thumb_url}" />
                        </div>
                        <div class="kkphim-detail-info">
                            <h1 class="kkphim-detail-title">${movieData.name}</h1>
                            <div class="kkphim-detail-original">${movieData.origin_name || ''}</div>
                            <div class="kkphim-detail-meta">
                                <span class="meta-item">⭐ ${movieData.tmdb?.vote_average || 'N/A'}</span>
                                <span class="meta-item">📅 ${movieData.year || ''}</span>
                                <span class="meta-item">⏱️ ${movieData.time || ''}</span>
                                <span class="meta-item">🎬 ${movieData.episode_current || ''}</span>
                            </div>
                            <div class="kkphim-detail-genres">
                                ${(movieData.category || []).map(c => `<span class="genre-tag">${c.name}</span>`).join('')}
                            </div>
                            <div class="kkphim-detail-description">
                                ${movieData.content || 'Không có mô tả'}
                            </div>
                            <div class="kkphim-detail-buttons">
                                <div class="kkphim-btn kkphim-btn-play selector">▶ Phát ngay</div>
                                <div class="kkphim-btn kkphim-btn-trailer selector">🎥 Trailer</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            var detailElement = $(detailHTML);
            
            // Thêm danh sách tập phim
            if (movieData.episodes && movieData.episodes.length > 0) {
                var episodesSection = createEpisodesSection(movieData.episodes);
                detailElement.find('.kkphim-detail-content').append(episodesSection);
            }

            html.append(detailElement);
            scroll.append(html);
            
            Lampa.Controller.enable('content');
            this.activity.loader(false);

            // Xử lý nút phát
            detailElement.find('.kkphim-btn-play').on('hover:enter', function() {
                if (movieData.episodes && movieData.episodes[0].server_data[0]) {
                    playEpisode(movieData.episodes[0].server_data[0]);
                }
            });
        }

        function createEpisodesSection(episodes) {
            var section = $('<div class="kkphim-episodes-section"></div>');
            var title = $('<h2 class="kkphim-episodes-title">Danh sách tập</h2>');
            section.append(title);

            episodes.forEach(function(server) {
                var serverName = $('<div class="kkphim-server-name">' + server.server_name + '</div>');
                var episodesGrid = $('<div class="kkphim-episodes-grid"></div>');

                server.server_data.forEach(function(episode) {
                    var episodeBtn = $(`
                        <div class="kkphim-episode-btn selector">
                            <span class="episode-name">${episode.name}</span>
                        </div>
                    `);

                    episodeBtn.on('hover:enter', function() {
                        playEpisode(episode);
                    });

                    episodesGrid.append(episodeBtn);
                });

                section.append(serverName);
                section.append(episodesGrid);
            });

            return section;
        }

        function playEpisode(episode) {
            Lampa.Player.play({
                title: movie.name + ' - ' + episode.name,
                url: episode.link_embed || episode.link_m3u8,
                timeline: {},
                onCompleted: function() {}
            });

            Lampa.Player.playlist([{
                title: episode.name,
                url: episode.link_embed || episode.link_m3u8
            }]);
        }

        this.start = function() {
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

        this.pause = function() {};
        this.stop = function() {};
        this.render = function() { return html; };
        this.destroy = function() {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    });

    function addCustomCSS() {
        var css = `
            /* Row styles */
            .kkphim-row {
                margin: 20px 0;
                padding: 0 30px;
            }

            .kkphim-row-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #fff;
            }

            .kkphim-row-content {
                display: flex;
                overflow-x: auto;
                gap: 15px;
                padding: 10px 0;
                scrollbar-width: none;
            }

            .kkphim-row-content::-webkit-scrollbar {
                display: none;
            }

            .kkphim-view-more {
                text-align: right;
                color: #fff;
                margin-top: 10px;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s;
            }

            .kkphim-view-more:hover {
                opacity: 1;
            }

            /* Card styles */
            .kkphim-card {
                min-width: 200px;
                max-width: 200px;
                cursor: pointer;
                transition: transform 0.3s;
                border-radius: 8px;
                overflow: hidden;
            }

            .kkphim-card:hover,
            .kkphim-card.focus {
                transform: scale(1.05);
                box-shadow: 0 8px 20px rgba(0,0,0,0.5);
            }

            .kkphim-card-poster {
                position: relative;
                width: 100%;
                height: 300px;
                overflow: hidden;
            }

            .kkphim-card-poster img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .kkphim-card-quality {
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(255, 193, 7, 0.9);
                color: #000;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }

            .kkphim-card-episode {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(244, 67, 54, 0.9);
                color: #fff;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
            }

            .kkphim-card-info {
                padding: 10px;
                background: rgba(0,0,0,0.8);
            }

            .kkphim-card-title {
                font-size: 14px;
                font-weight: bold;
                color: #fff;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .kkphim-card-year {
                font-size: 12px;
                color: #aaa;
                margin-top: 5px;
            }

            /* Detail page styles */
            .kkphim-detail {
                position: relative;
                min-height: 100vh;
            }

            .kkphim-detail-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 60vh;
                overflow: hidden;
            }

            .kkphim-backdrop-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: blur(10px);
            }

            .kkphim-backdrop-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.95));
            }

            .kkphim-detail-content {
                position: relative;
                display: flex;
                padding: 100px 50px 50px;
                gap: 30px;
                z-index: 1;
            }

            .kkphim-detail-poster {
                flex-shrink: 0;
            }

            .kkphim-detail-poster img {
                width: 300px;
                height: 450px;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            .kkphim-detail-info {
                flex: 1;
                color: #fff;
            }

            .kkphim-detail-title {
                font-size: 42px;
                font-weight: bold;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            }

            .kkphim-detail-original {
                font-size: 20px;
                color: #aaa;
                margin-bottom: 20px;
            }

            .kkphim-detail-meta {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .meta-item {
                background: rgba(255,255,255,0.1);
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
            }

            .kkphim-detail-genres {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .genre-tag {
                background: rgba(76, 175, 80, 0.3);
                border: 1px solid rgba(76, 175, 80, 0.6);
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 13px;
            }

            .kkphim-detail-description {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
                max-width: 800px;
                opacity: 0.9;
            }

            .kkphim-detail-buttons {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
            }

            .kkphim-btn {
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            }

            .kkphim-btn-play {
                background: #e50914;
                color: #fff;
            }

            .kkphim-btn-play:hover,
            .kkphim-btn-play.focus {
                background: #f40612;
                transform: scale(1.05);
            }

            .kkphim-btn-trailer {
                background: rgba(255,255,255,0.2);
                color: #fff;
                border: 2px solid #fff;
            }

            .kkphim-btn-trailer:hover,
            .kkphim-btn-trailer.focus {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }

            /* Episodes section */
            .kkphim-episodes-section {
                margin-top: 40px;
                width: 100%;
            }

            .kkphim-episodes-title {
                font-size: 24px;
                margin-bottom: 20px;
                color: #fff;
            }

            .kkphim-server-name {
                font-size: 18px;
                color: #4CAF50;
                margin: 20px 0 10px;
                font-weight: bold;
            }

            .kkphim-episodes-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }

            .kkphim-episode-btn {
                background: rgba(255,255,255,0.1);
                padding: 12px;
                border-radius: 6px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }

            .kkphim-episode-btn:hover,
            .kkphim-episode-btn.focus {
                background: #e50914;
                transform: scale(1.05);
            }

            .episode-name {
                font-size: 14px;
                color: #fff;
            }
        `;

        $('<style></style>').text(css).appendTo('head');
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }

})();