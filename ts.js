(function () {
    'use strict';

    var config = {
        jacred_url: 'https://jac.maxvol.pro',
        torrentio_url: 'https://torrentio.strem.fun',
        api_key: '1'
    };

    function startSearch(query, source) {
        var url = '';
        if (source === 'jacred') {
            url = config.jacred_url + '/api/v1/search?api_key=' + config.api_key + '&query=' + encodeURIComponent(query);
        } else {
            url = config.torrentio_url + '/providers=yts,eztv,rarbg/stream/movie/' + query + '.json';
        }

        Lampa.Modal.open({
            title: 'Đang quét link...',
            html: $('<div class="broadcast__scan">Đợi xíu ní ơi, đang lùng phim...</div>'),
            onBack: function () {
                Lampa.Modal.close();
            }
        });

        Lampa.Network.silent(url, function (json) {
            Lampa.Modal.close();
            var results = (source === 'jacred') ? (json.result || []) : (json.streams || []);
            
            if (results.length > 0) {
                showResults(results, source);
            } else {
                Lampa.Noty.show('Không tìm thấy link nào rồi ní!');
            }
        }, function () {
            Lampa.Modal.close();
            Lampa.Noty.show('Lỗi kết nối server rồi!');
        });
    }

    function showResults(data, source) {
        var items = data.map(function (item) {
            return {
                title: item.title || item.name || 'Không rõ tên',
                size: item.size ? Lampa.Utils.bytesToSize(item.size) : 'N/A',
                magnet: item.magnet || (item.infoHash ? 'magnet:?xt=urn:btih:' + item.infoHash : ''),
                quality: item.quality || 'HD'
            };
        });

        Lampa.Select.show({
            title: 'Kết quả từ ' + source,
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
            var button = $('<div class="full-start__button selector"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 5V11C4 16.19 7.41 20.92 12 22C16.59 20.92 20 16.19 20 11V5L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Torrent Ní</span></div>');

            button.on('hover:enter', function () {
                var title = e.data.movie.title || e.data.movie.name;
                var year = (e.data.movie.release_date || e.data.movie.first_air_date || '').slice(0, 4);
                
                Lampa.Select.show({
                    title: 'Chọn nguồn tìm kiếm',
                    items: [
                        {title: 'Jacred (Maxvol)', source: 'jacred'},
                        {title: 'Torrentio (IMDb)', source: 'torrentio'}
                    ],
                    onSelect: function (item) {
                        if (item.source === 'jacred') {
                            startSearch(title + ' ' + year, 'jacred');
                        } else {
                            if (e.data.movie.imdb_id) {
                                startSearch(e.data.movie.imdb_id, 'torrentio');
                            } else {
                                Lampa.Noty.show('Phim này không có ID IMDb ní ơi!');
                            }
                        }
                    }
                });
            });

            // Chèn nút vào đúng vị trí container
            var container = e.object.container.find('.full-start__buttons');
            if (container.length) {
                container.append(button);
            }
        }
    });
})();
