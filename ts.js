(function () {
    'use strict';

    // ĐỊA CHỈ TORRSERVER CỦA BẠN ĐÃ ĐƯỢC CẬP NHẬT
    var TORRSERVER_URL = 'http://gren439e.tsarea.tv:8880'; 

    function TorrentioParser(object) {
        var network = new Lampa.Regard();
        
        this.search = function (data) {
            // Lấy IMDB ID từ dữ liệu phim của Lampa
            var imdb_id = data.movie.imdb_id || (data.movie.external_ids ? data.movie.external_ids.imdb_id : null);
            
            if (!imdb_id) {
                Lampa.Noty.show('Không tìm thấy IMDB ID cho phim này.');
                return;
            }

            var type = data.movie.number_of_seasons ? 'series' : 'movie';
            var id = imdb_id;
            
            // Xử lý Season và Episode cho phim bộ
            if (type === 'series') {
                // Lấy thông số tập đang chọn hoặc mặc định S01E01
                var s = data.movie.season || 1;
                var e = data.movie.episode || 1;
                id += ':' + s + ':' + e;
            }

            var url = 'https://torrentio.strem.fun/stream/' + type + '/' + id + '.json';

            Lampa.Select.show({
                title: 'Torrentio Search',
                items: [{ title: 'Đang quét luồng từ Torrentio...', subtitle: 'Vui lòng đợi' }],
                onSelect: function () {},
                onBack: function () {
                    network.clear();
                }
            });

            network.silent(url, function (res) {
                if (res.streams && res.streams.length > 0) {
                    var items = res.streams.map(function (stream) {
                        var desc = stream.title.split('\n');
                        return {
                            title: desc[0], // Tên file & Chất lượng (4K/1080p)
                            subtitle: desc.slice(1).join(' '), // Seeders/Size
                            infoHash: stream.infoHash,
                            fileIdx: stream.fileIdx || 0,
                            url: stream.url // Link direct nếu có (RD/AD)
                        };
                    });

                    Lampa.Select.show({
                        title: 'Kết quả Torrentio',
                        items: items,
                        onSelect: function (item) {
                            if (item.infoHash) {
                                // CHUYỂN HƯỚNG SANG TORRSERVER CỦA BẠN
                                var magnet = 'magnet:?xt=urn:btih:' + item.infoHash;
                                // Cấu trúc gọi TorrServer để phát ngay
                                var playUrl = TORRSERVER_URL + '/stream?link=' + encodeURIComponent(magnet) + '&index=' + item.fileIdx + '&play';
                                
                                Lampa.Player.play({
                                    url: playUrl,
                                    title: (data.movie.title || data.movie.name) + ' - ' + item.title
                                });
                            } else if (item.url) {
                                // Nếu có link trực tiếp (HTTP), phát luôn không qua TorrServer
                                Lampa.Player.play({
                                    url: item.url,
                                    title: data.movie.title || data.movie.name
                                });
                            }
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('full_start');
                        }
                    });
                } else {
                    Lampa.Noty.show('Torrentio không tìm thấy nguồn nào cho phim này.');
                }
            }, function () {
                Lampa.Noty.show('Lỗi kết nối tới API Torrentio.');
            });
        };
    }

    function init() {
        // Lắng nghe sự kiện mở trang chi tiết phim
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Tạo nút bấm Torrentio trong giao diện Lampa
                var btn = $('<div class="full-start__button text-uppercase"><span>Torrentio + Tor</span></div>');
                
                btn.on('hover:enter', function () {
                    var parser = new TorrentioParser(e.object);
                    parser.search(e);
                });

                // Tìm hàng chứa các nút chức năng và thêm nút mới vào cuối
                var container = e.container.find('.full-start__buttons');
                if (container.length > 0) {
                    container.append(btn);
                }
            }
        });
    }

    // Kiểm tra trạng thái app để khởi chạy
    if (window.appready) init();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') init(); });
})();
