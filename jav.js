(function () {
    'use strict';

    var API_URL = 'https://phimapi.com';
    var IMG_DOMAIN = 'https://phimimg.com/'; // Domain ảnh của KKPhim
    var network = new Lampa.Reguest();

    // 1. Hàm Helper chuẩn hoá dữ liệu KKPhim -> Lampa
    function formatImage(url) {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return IMG_DOMAIN + url;
    }

    function mapItem(item) {
        return {
            id: item.slug, // Dùng slug làm ID
            title: item.name,
            original_title: item.origin_name,
            img: formatImage(item.thumb_url),
            background: formatImage(item.poster_url || item.thumb_url),
            release_date: item.year ? item.year + '' : 'N/A',
            vote_average: 10,
            type: item.type === 'series' || item.type === 'tvshows' ? 'tv' : 'movie',
            source: 'kkphim'
        };
    }

    // 2. Đăng ký Source API mới cho Lampa
    Lampa.Api.sources.kkphim = {
        title: 'KKPhim',
        // Hàm list: Phục vụ cho Infinity Scroll (Trang danh mục)
        list: function (params, oncomplite, onerror) {
            var page = params.page || 1;
            // params.url do chúng ta truyền vào từ nút "Xem thêm"
            var url = API_URL + params.url + '?page=' + page;

            network.clear();
            network.timeout(10000);
            network.request(url, function (json) {
                var data = json.data ? json.data.items : (json.items || []);
                var results = data.map(mapItem);

                oncomplite({
                    results: results,
                    total_pages: json.data && json.data.params ? json.data.params.pagination.totalPages : (json.pagination ? json.pagination.totalPages : 1)
                });
            }, onerror);
        },

        // Hàm full: Phục vụ cho trang INFO PHIM ĐẸP của Lampa
        full: function (params, oncomplite, onerror) {
            var url = API_URL + '/phim/' + params.id;
            network.clear();
            network.timeout(10000);
            network.request(url, function (json) {
                var m = json.movie;
                var movie = mapItem(m);
                
                // Bổ sung thông tin chi tiết cho trang Info
                movie.overview = m.content ? m.content.replace(/(<([^>]+)>)/gi, "") : 'Chưa có tóm tắt';
                movie.genres = m.category ? m.category.map(function (c) { return { id: c.id, name: c.name }; }) : [];
                movie.production_companies = m.country ? m.country.map(function (c) { return { name: c.name }; }) : [];
                movie.status = m.episode_current + ' / ' + m.episode_total;
                
                // Lưu lại danh sách tập phim để dùng cho nút XEM PHIM
                movie.kkphim_episodes = json.episodes;

                oncomplite({
                    movie: movie,
                    similar: { results: [] }, // Có thể gọi API phim liên quan nếu KKPhim hỗ trợ
                    persons: { results: [] }
                });
            }, onerror);
        },
        search: function(params, oncomplite, onerror) {
            // Hỗ trợ tìm kiếm
             var url = API_URL + '/v1/api/tim-kiem?keyword=' + encodeURIComponent(params.query) + '&page=1';
             network.request(url, function (json) {
                var data = json.data ? json.data.items : [];
                oncomplite({ results: data.map(mapItem) });
            }, onerror);
        }
    };

    // 3. Xử lý nút XEM PHIM và Danh sách tập trên trang Info
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'build' && e.data.movie.source == 'kkphim') {
            // Xóa các nút mặc định (Trailer, Torrent...)
            e.object.activity.render().find('.button--play').remove();
            e.object.activity.render().find('.button--book').remove();
            
            // Tạo nút XEM PHIM
            var playBtn = $('<div class="full-start__button selector button--play"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>XEM PHIM</span></div>');
            
            // Chèn lên đầu
            e.object.activity.render().find('.full-start__buttons').prepend(playBtn);

            playBtn.on('hover:enter', function () {
                var episodes = e.data.movie.kkphim_episodes;
                if (!episodes || episodes.length === 0 || episodes[0].server_data.length === 0) {
                    Lampa.Noty.show('Chưa có tập phim nào!');
                    return;
                }

                var serverData = episodes[0].server_data;

                // Nếu là phim lẻ (1 tập) -> Phát luôn
                if (serverData.length === 1) {
                    playEpisode(serverData[0], e.data.movie, serverData);
                } 
                // Nếu là phim bộ -> Hiện bảng chọn tập
                else {
                    showEpisodes(serverData, e.data.movie);
                }
            });
        }
    });

    function playEpisode(episode, movieData, allEpisodes) {
        var playlist = allEpisodes.map(function(ep) {
            return {
                title: 'Tập ' + ep.name,
                url: ep.link_m3u8
            };
        });

        // Tìm index của tập đang chọn
        var startIndex = allEpisodes.findIndex(function(ep) { return ep.slug === episode.slug; });
        startIndex = startIndex > -1 ? startIndex : 0;

        Lampa.Player.play({
            title: movieData.title,
            url: episode.link_m3u8,
            movie: movieData
        });
        Lampa.Player.playlist(playlist);
        Lampa.Player.stat(playlist[startIndex]);
    }

    function showEpisodes(episodes, movieData) {
        var items = episodes.map(function (ep) {
            return {
                title: 'Tập ' + ep.name,
                ep_data: ep
            };
        });

        Lampa.Select.show({
            title: 'Chọn Tập Phim',
            items: items,
            onSelect: function (a) {
                playEpisode(a.ep_data, movieData, episodes);
            },
            onBack: function () {
                Lampa.Controller.toggle('full');
            }
        });
    }

    // 4. Trang chủ KKPhim (Giao diện Row Poster & Xem thêm)
    function KKPhimComponent() {
        var comp = new Lampa.Interaction.Main({});
        var lines = [];
        var scroll = new Lampa.Scroll({ mask: true, over: true });

        // Cấu hình các Danh mục hiển thị ở trang chủ
        var catalogs = [
            { title: 'Phim Mới Cập Nhật', url: '/danh-sach/phim-moi-cap-nhat', isV1: false },
            { title: 'Phim Hành Động', url: '/v1/api/the-loai/hanh-dong', isV1: true },
            { title: 'Phim Tình Cảm', url: '/v1/api/the-loai/tinh-cam', isV1: true },
            { title: 'Phim Hoạt Hình', url: '/v1/api/danh-sach/hoat-hinh', isV1: true }
        ];

        this.create = function () {
            this.activity.loader(true);
            var _this = this;

            Lampa.Background.change(IMG_DOMAIN);

            var loaded = 0;
            catalogs.forEach(function (cat) {
                network.request(API_URL + cat.url + '?page=1', function (json) {
                    var data = cat.isV1 ? (json.data ? json.data.items : []) : (json.items || []);
                    if (data.length > 0) {
                        var mapped = data.map(mapItem);
                        
                        var line = new Lampa.Line(mapped, {
                            title: cat.title,
                            object: { source: 'kkphim' },
                            nomore: false // Hiển thị nút mũi tên (Xem thêm)
                        });

                        // Xử lý sự kiện khi bấm nút "Xem thêm" (Mũi tên phải hoặc thẻ cuối cùng)
                        line.onMore = function () {
                            Lampa.Activity.push({
                                url: cat.url,
                                title: cat.title,
                                component: 'category', // Trình quản lý Infinity Scroll mặc định của Lampa
                                source: 'kkphim',      // Trỏ về Source ta đã đăng ký ở bước 2
                                page: 1
                            });
                        };

                        // Xử lý khi người dùng chọn 1 phim cụ thể
                        line.onEnter = function (element) {
                            Lampa.Activity.push({
                                id: element.id,
                                title: element.title,
                                component: 'full',   // Mở trang Info phim đẹp mặc định
                                source: 'kkphim'
                            });
                        };

                        line.create();
                        lines.push(line);
                        scroll.append(line.render());
                    }

                    loaded++;
                    if (loaded === catalogs.length) {
                        _this.activity.loader(false);
                        _this.activity.render().append(scroll.render());
                        // Render xong thì focus dòng đầu tiên
                        Lampa.Controller.add('content', {
                            toggle: function () {
                                Lampa.Controller.collectionSet(scroll.render());
                                Lampa.Controller.collectionFocus(lines[0] ? lines[0].render() : false, scroll.render());
                            },
                            up: function () {
                                navigator.control('up');
                            },
                            down: function () {
                                navigator.control('down');
                            },
                            back: function () {
                                Lampa.Activity.backward();
                            }
                        });
                        Lampa.Controller.toggle('content');
                    }
                }, function() {
                    loaded++;
                });
            });
        };

        this.start = function () {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                up: function () { navigator.control('up'); },
                down: function () { navigator.control('down'); },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        };

        this.pause = function () {};
        this.stop = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            lines.forEach(function (l) { l.destroy(); });
            lines = [];
        };
    }

    // 5. Thêm KKPhim vào Menu bên trái của Lampa
    Lampa.Component.add('kkphim_main', KKPhimComponent);

    var menu_item = $('<li class="menu__item selector focus" data-action="kkphim"><div class="menu__ico"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v12H4z"/></svg></div><div class="menu__text">KKPhim API</div></li>');

    menu_item.on('hover:enter', function () {
        Lampa.Activity.push({
            url: '',
            title: 'KKPhim',
            component: 'kkphim_main',
            page: 1
        });
    });

    $('.menu .menu__list').eq(0).append(menu_item);

})();