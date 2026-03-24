(function () {
    'use strict';

    var config = {
        jacred_url: 'https://jac.maxvol.pro',
        torrentio_url: 'https://torrentio.strem.fun',
        api_key: '1'
    };

    function startSearch(query, source, is_movie) {
        var url = '';
        if (source === 'jacred') {
            url = config.jacred_url + '/api/v1/search?api_key=' + config.api_key + '&query=' + encodeURIComponent(query);
        } else {
            // Torrentio: Cần ID IMDb (ví dụ tt1234567). Nếu không có, Torrentio sẽ khó tìm.
            var type = is_movie ? 'movie' : 'series';
            url = config.torrentio_url + '/providers=yts,eztv,rarbg,1337x,thepiratebay/stream/' + type + '/' + query + '.json';
        }

        Lampa.Modal.open({
            title: 'Đang quét link...',
            html: $('<div class="broadcast__scan" style="padding: 20px; text-align: center;">Đợi xíu ní ơi, đang lùng phim từ ' + source + '...</div>'),
            onBack: function () {
                Lampa.Modal.close();
            }
        });

        // Sử dụng Lampa.Network.ajax để lấy dữ liệu chính xác hơn
        Lampa.Network.ajax({
            url: url,
            success: function (json) {
                Lampa.Modal.close();
                var results = (source === 'jacred') ? (json.result || []) : (json.streams || []);
                
                if (results && results.length > 0) {
                    showResults(results, source);
                } else {
                    Lampa.Noty.show('Không tìm thấy link nào rồi ní ơi!');
                }
            },
            error: function () {
                Lampa.Modal.close();
                Lampa.Noty.show('Lỗi kết nối server rồi ní ơi!');
            }
        });
    }

    function showResults(data, source) {
        var items = data.map(function (item) {
            var title = item.title || item.name || 'Không rõ tên';
            var size = item.size ? Lampa.Utils.bytesToSize(item.size) : 'N/A';
            var magnet = '';

            if (source === 'torrentio') {
                // Torrentio trả về title chứa độ phân giải, dung lượng...
                // Link magnet build từ infoHash
                if (item.infoHash) {
                    magnet = 'magnet:?xt=urn:btih:' + item.infoHash + '&dn=N%C3%AD%20Xem%20Phim&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';
                } else {
                    magnet = item.url; // Một số nguồn trả về link trực tiếp
                }
            } else {
                magnet = item.magnet;
            }

            return {
                title: title.replace(/\n/g, ' '), // Xóa xuống dòng trong title của Torrentio
                description: 'Nguồn: ' + source.toUpperCase() + (item.size ? ' | Dung lượng: ' + size : ''),
                magnet: magnet
            };
        });

        Lampa.Select.show({
            title: 'Kết quả tìm được',
            items: items,
            onSelect: function (selected) {
                if (selected.magnet) {
                    Lampa.Torrent.run({
                        title: selected.title,
                        url: selected.magnet
                    });
                } else {
                    Lampa.Noty.show('Link này không có magnet rồi!');
                }
            }
        });
    }

    Lampa.Listener.follow('full', function (e) {
        if (e.type === 'complite') {
            setTimeout(function() {
                var container = e.object.container.find('.full-start__buttons');
                
                if (container.length && !container.find('.btn-ni-mod').length) {
                    var button = $('<div class="full-start__button selector btn-ni-mod"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 10px; vertical-align: middle; stroke: currentColor;"><path d="M12 2L4 5V11C4 16.19 7.41 20.92 12 22C16.59 20.92 20 16.19 20 11V5L12 2Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Torrent Ní</span></div>');

                    button.on('hover:enter click', function () {
                        var movie = e.data.movie;
                        var is_movie = movie.number_of_seasons ? false : true;

                        Lampa.Select.show({
                            title: 'Chọn nguồn tìm kiếm',
                            items: [
                                {title: 'Jacred (Maxvol)', source: 'jacred'},
                                {title: 'Torrentio (Stremio)', source: 'torrentio'}
                            ],
                            onSelect: function (item) {
                                if (item.source === 'jacred') {
                                    var query = (movie.title || movie.name) + ' ' + (movie.release_date || movie.first_air_date || '').slice(0, 4);
                                    startSearch(query, 'jacred', is_movie);
                                } else {
                                    // Torrentio ưu tiên IMDb ID (có dạng ttxxxx)
                                    var id = movie.imdb_id || movie.id;
                                    startSearch(id, 'torrentio', is_movie);
                                }
                            }
                        });
                    });

                    container.append(button);
                    // Ép Lampa nhận diện lại controller để di chuyển được vào nút
                    Lampa.Controller.add('full', {
                        toggle: function () {
                            Lampa.Controller.collectionSet(e.object.container);
                            Lampa.Controller.active().enable();
                        }
                    });
                }
            }, 400);
        }
    });
})();
