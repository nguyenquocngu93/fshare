// ==Plugin-Code==
// Plugin: KKPhim
// Description: Xem phim từ KKPhim (phimapi.com)
// Version: 1.0.0
// Author: Assistant
// ==/Plugin-Code==

(function() {
    'use strict';
    
    // Cấu hình API
    const CONFIG = {
        apiUrl: 'https://phimapi.com',
        imageUrl: 'https://img.phimapi.com',
        pluginName: 'KKPhim',
        pluginId: 'kkphim'
    };
    
    // Kiểm tra Lampa đã sẵn sàng chưa
    function init() {
        if (typeof Lampa === 'undefined') {
            setTimeout(init, 500);
            return;
        }
        
        console.log('[KKPhim] Plugin đang khởi tạo...');
        
        // Đợi ứng dụng sẵn sàng
        if (window.appready) {
            setupPlugin();
        } else {
            Lampa.Listener.follow('app', function(e) {
                if (e === 'ready') {
                    setupPlugin();
                }
            });
        }
    }
    
    // Thiết lập plugin
    function setupPlugin() {
        console.log('[KKPhim] Đang thiết lập plugin...');
        
        // Thêm nguồn phim vào danh sách
        addMovieSource();
        
        // Thêm vào phần cài đặt
        addSettings();
        
        console.log('[KKPhim] Plugin đã sẵn sàng!');
    }
    
    // Thêm nguồn phim
    function addMovieSource() {
        // Lấy danh sách nguồn hiện tại
        var sources = Lampa.Source.list();
        
        // Kiểm tra xem đã có chưa
        if (sources.some(function(s) { return s.id === CONFIG.pluginId; })) {
            console.log('[KKPhim] Nguồn đã tồn tại');
            return;
        }
        
        // Định nghĩa nguồn phim mới
        var kkphimSource = {
            id: CONFIG.pluginId,
            title: CONFIG.pluginName,
            api: CONFIG.apiUrl,
            type: 'movie',
            image: CONFIG.imageUrl,
            
            // Lấy danh sách phim theo loại
            getList: function(category, page, callback) {
                var url = '';
                var params = {
                    page: page || 1,
                    limit: 20
                };
                
                switch(category) {
                    case 'new':
                        url = CONFIG.apiUrl + '/v1/api/danh-sach/phim-moi';
                        break;
                    case 'hot':
                        url = CONFIG.apiUrl + '/v1/api/danh-sach/phim-hot';
                        break;
                    case 'phim-le':
                        url = CONFIG.apiUrl + '/v1/api/danh-sach/phim-le';
                        break;
                    case 'phim-bo':
                        url = CONFIG.apiUrl + '/v1/api/danh-sach/phim-bo';
                        break;
                    default:
                        url = CONFIG.apiUrl + '/v1/api/danh-sach/phim-moi';
                }
                
                url += '?page=' + params.page + '&limit=' + params.limit;
                
                Lampa.Api.fetch(url, function(data) {
                    if (data && data.items) {
                        var items = data.items.map(function(item) {
                            return {
                                id: item._id,
                                title: item.name,
                                original_title: item.origin_name,
                                poster: CONFIG.imageUrl + '/uploads/movies/' + item.poster,
                                year: item.year,
                                type: item.type === 'series' ? 'tv' : 'movie',
                                description: item.content
                            };
                        });
                        
                        callback({
                            items: items,
                            total: data.total || items.length,
                            page: page
                        });
                    } else {
                        callback({ items: [], total: 0, page: page });
                    }
                }, function(error) {
                    console.error('[KKPhim] Lỗi tải danh sách:', error);
                    callback({ items: [], total: 0, page: page });
                });
            },
            
            // Tìm kiếm phim
            search: function(query, page, callback) {
                var url = CONFIG.apiUrl + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(query) + '&page=' + (page || 1) + '&limit=20';
                
                Lampa.Api.fetch(url, function(data) {
                    if (data && data.items) {
                        var items = data.items.map(function(item) {
                            return {
                                id: item._id,
                                title: item.name,
                                original_title: item.origin_name,
                                poster: CONFIG.imageUrl + '/uploads/movies/' + item.poster,
                                year: item.year,
                                type: item.type === 'series' ? 'tv' : 'movie',
                                description: item.content
                            };
                        });
                        
                        callback({
                            items: items,
                            total: data.total || items.length,
                            page: page
                        });
                    } else {
                        callback({ items: [], total: 0, page: page });
                    }
                }, function(error) {
                    console.error('[KKPhim] Lỗi tìm kiếm:', error);
                    callback({ items: [], total: 0, page: page });
                });
            },
            
            // Lấy chi tiết phim
            getDetail: function(id, callback) {
                var url = CONFIG.apiUrl + '/v1/api/phim/' + id;
                
                Lampa.Api.fetch(url, function(data) {
                    if (data && data.movie) {
                        var movie = data.movie;
                        var detail = {
                            id: movie._id,
                            title: movie.name,
                            original_title: movie.origin_name,
                            poster: CONFIG.imageUrl + '/uploads/movies/' + movie.poster,
                            year: movie.year,
                            type: movie.type === 'series' ? 'tv' : 'movie',
                            description: movie.content,
                            rating: movie.imdb_rating || movie.tmdb_rating || 0,
                            genres: movie.genres || [],
                            country: movie.country || [],
                            casts: movie.casts || [],
                            director: movie.director || [],
                            duration: movie.time || '',
                            episodes: []
                        };
                        
                        // Xử lý tập phim cho phim bộ
                        if (movie.episodes && movie.episodes.length > 0) {
                            detail.episodes = movie.episodes.map(function(ep, index) {
                                return {
                                    season: ep.season || 1,
                                    episode: ep.episode_name || ep.episode || (index + 1),
                                    name: ep.name || 'Tập ' + (ep.episode_name || ep.episode || (index + 1)),
                                    link: ep.link
                                };
                            });
                        }
                        
                        callback(detail);
                    } else {
                        callback(null);
                    }
                }, function(error) {
                    console.error('[KKPhim] Lỗi tải chi tiết:', error);
                    callback(null);
                });
            },
            
            // Lấy link phát
            getStream: function(id, episode, callback) {
                var url = CONFIG.apiUrl + '/v1/api/phim/' + id;
                
                Lampa.Api.fetch(url, function(data) {
                    if (data && data.movie && data.movie.episodes) {
                        var episodes = data.movie.episodes;
                        var targetEp = null;
                        
                        // Tìm tập phim phù hợp
                        for (var i = 0; i < episodes.length; i++) {
                            var ep = episodes[i];
                            var epNum = ep.episode_name || ep.episode;
                            if (epNum == episode || epNum === 'full' && episode === 1) {
                                targetEp = ep;
                                break;
                            }
                        }
                        
                        if (targetEp && targetEp.link) {
                            // Trả về link phát
                            callback({
                                url: targetEp.link,
                                type: 'video/mp4'
                            });
                        } else {
                            callback(null);
                        }
                    } else {
                        callback(null);
                    }
                }, function(error) {
                    console.error('[KKPhim] Lỗi tải link phát:', error);
                    callback(null);
                });
            }
        };
        
        // Đăng ký nguồn
        Lampa.Source.add(kkphimSource);
        
        // Thêm vào menu chính nếu cần
        addToMainMenu();
    }
    
    // Thêm vào menu chính
    function addToMainMenu() {
        // Kiểm tra và thêm mục KKPhim vào menu
        Lampa.Listener.follow('menu', function(e) {
            if (e.type === 'complite') {
                var menuItems = document.querySelectorAll('.menu__item');
                var exists = false;
                
                for (var i = 0; i < menuItems.length; i++) {
                    if (menuItems[i].textContent === CONFIG.pluginName) {
                        exists = true;
                        break;
                    }
                }
                
                if (!exists) {
                    // Có thể thêm menu item bằng Lampa API
                    console.log('[KKPhim] Đã sẵn sàng, menu có thể được thêm thủ công');
                }
            }
        });
    }
    
    // Thêm vào phần cài đặt
    function addSettings() {
        Lampa.SettingsApi.addComponent({
            id: CONFIG.pluginId,
            name: CONFIG.pluginName,
            icon: '<svg>...</svg>',
            content: function(render) {
                render(`
                    <div class="settings__line">
                        <div class="settings__label">API KKPhim</div>
                        <div class="settings__field">
                            <input type="text" value="${CONFIG.apiUrl}" disabled>
                        </div>
                    </div>
                    <div class="settings__line">
                        <div class="settings__label">Trạng thái</div>
                        <div class="settings__field">
                            <span style="color: #4caf50;">✓ Đã kích hoạt</span>
                        </div>
                    </div>
                `);
            }
        });
    }
    
    // Khởi động plugin
    init();
})();