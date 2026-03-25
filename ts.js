(function () {
    'use strict';

    // Đợi trang chi tiết phim sẵn sàng
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'ready') {
            
            // Tạo nút với style rõ ràng để dễ bấm bằng chuột/tay
            var button = $(`
                <div class="full-start__button selector torrentio-sensor" style="background: #2c3e50; margin-left: 10px; cursor: pointer;">
                    <svg height="24" viewBox="0 0 24 24" width="24" style="vertical-align: middle; margin-right: 5px;">
                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="white"/>
                    </svg>
                    <span style="font-weight: bold;">Torrentio EN</span>
                </div>
            `);

            // Vì bạn dùng Sensor, ta dùng trực tiếp sự kiện 'click'
            button.on('click', function (event) {
                event.preventDefault();
                var card = e.object;
                
                if (!card.imdb_id) {
                    Lampa.Noty.show('Phim này không có IMDB ID.');
                    return;
                }

                Lampa.Noty.show('Đang quét nguồn quốc tế...');
                
                // Gọi API Torrentio
                var url = 'https://torrentio.strem.fun/stream/movie/' + card.imdb_id + '.json';
                
                $.getJSON(url, function (data) {
                    if (data && data.streams && data.streams.length > 0) {
                        var list = data.streams.map(function (s) {
                            return {
                                title: s.name + ' - ' + s.title.split('\n')[0],
                                magnet: 'magnet:?xt=urn:btih:' + s.infoHash,
                                hash: s.infoHash
                            };
                        });

                        // Hiển thị danh sách kết quả dạng Select
                        Lampa.Select.show({
                            title: 'Chọn chất lượng phim',
                            items: list,
                            onSelect: function (item) {
                                Lampa.Player.play({
                                    title: card.title || card.name,
                                    url: item.magnet,
                                    timeline: { hash: item.hash }
                                });
                            }
                        });
                    } else {
                        Lampa.Noty.show('Không tìm thấy link torrent nào.');
                    }
                });
            });

            // Chèn nút vào thanh công cụ
            e.html.find('.full-start__buttons').append(button);
        }
    });
})();
