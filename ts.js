(function () {
    'use strict';

    function TorrentioCustomParser() {
        // ĐỊA CHỈ SERVER CỦA BẠN
        var torrserver_url = 'http://gren439e.tsarea.tv:8880'; 

        function parseSizeToBytes(sizeStr) {
            if (!sizeStr || sizeStr === 'N/A') return 0;
            let match = sizeStr.match(/([\d.]+)\s*([GB|MB|KB]+)/i);
            if (!match) return 0;
            let num = parseFloat(match[1]);
            let unit = match[2].toUpperCase();
            if (unit === 'GB') return num * 1024 * 1024 * 1024;
            if (unit === 'MB') return num * 1024 * 1024;
            return num;
        }

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                // Tạo hàm tìm kiếm để Lampa gọi
                window.search_torrentio = function() {
                    let movie = e.data.movie;
                    let imdb_id = movie.imdb_id;
                    let type = movie.number_of_seasons ? 'series' : 'movie';
                    
                    // Lấy tập/phần đang chọn (nếu là series)
                    let s = Lampa.Storage.get('online_last_season_' + movie.id, 1);
                    let ep = Lampa.Storage.get('online_last_episode_' + movie.id, 1);
                    let query_id = type === 'series' ? `${imdb_id}:${s}:${ep}` : imdb_id;

                    if (!imdb_id) {
                        Lampa.Noty.show('Phim này thiếu IMDB ID để tìm trên Torrentio');
                        return;
                    }

                    Lampa.Select.show({
                        title: 'Đang quét Torrentio...',
                        items: [{ title: 'Vui lòng chờ giây lát...' }]
                    });

                    fetch(`https://torrentio.strem.io/streams/${type}/${query_id}.json`)
                        .then(res => res.json())
                        .then(json => {
                            if (json.streams && json.streams.length > 0) {
                                let items = json.streams.map(stream => {
                                    let lines = stream.title.split('\n');
                                    let info = lines[1] || "";
                                    
                                    let seeders = info.match(/👤\s*(\d+)/) ? info.match(/👤\s*(\d+)/)[1] : '0';
                                    let sizeMatch = info.match(/💾\s*([\d.]+\s*[GB|MB]+)/);
                                    let sizeText = sizeMatch ? sizeMatch[1] : '0 MB';

                                    return {
                                        title: lines[0], // Tên chất lượng/phim
                                        subtitle: `[${sizeText}] - Seeders: ${seeders}`,
                                        infoHash: stream.infoHash,
                                        url: stream.url,
                                        sizeBytes: parseSizeToBytes(sizeText)
                                    };
                                });

                                // Sắp xếp từ lớn đến nhỏ
                                items.sort((a, b) => b.sizeBytes - a.sizeBytes);

                                Lampa.Select.show({
                                    title: 'Torrentio (Sắp xếp: Size lớn nhất)',
                                    items: items,
                                    onSelect: (item) => {
                                        // Ưu tiên dùng infoHash để tạo magnet cho TorrServer
                                        let link = item.infoHash ? `magnet:?xt=urn:btih:${item.infoHash}` : item.url;
                                        let play_url = `${torrserver_url}/stream/magnet?link=${encodeURIComponent(link)}&play`;
                                        
                                        Lampa.Player.play({
                                            url: play_url,
                                            title: movie.title,
                                            subtitle: item.title
                                        });
                                    },
                                    onBack: () => Lampa.Controller.toggle('full_start')
                                });
                            } else {
                                Lampa.Noty.show('Không tìm thấy kết quả.');
                            }
                        })
                        .catch(() => Lampa.Noty.show('Lỗi kết nối Torrentio API'));
                };
            }
        });
    }

    if (window.appready) TorrentioCustomParser();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') TorrentioCustomParser(); });
})();
