(function () {
    'use strict';

    function TorrentioPlugin(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [];
        var html = $('<div></div>');
        
        // Hàm này để hiển thị danh sách khi nhấn nút
        this.search = function() {
            Lampa.Modal.open({
                title: 'Torrentio Search',
                html: $('<div>Đang quét nguồn...</div>'),
                onBack: function(){
                    Lampa.Modal.close();
                }
            });
            
            var url = 'https://torrentio.strem.fun/stream/movie/' + object.imdb_id + '.json';
            
            network.silent(url, function(data) {
                if(data.streams && data.streams.length > 0) {
                    // Render danh sách ở đây giống như bản cũ
                    Lampa.Modal.close();
                    // ... (Logic hiện Lampa.Select)
                }
            });
        };
    }

    // Lắng nghe sự kiện build trang chi tiết
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'build') {
            // Tạo template nút theo đúng chuẩn CSS của Lampa
            var btn = $(`
                <div class="full-start__button selector">
                    <svg height="24" viewBox="0 0 24 24" width="24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="white"/></svg>
                    <span>Torrentio EN</span>
                </div>
            `);

            btn.on('hover:enter click', function () {
                var plu = new TorrentioPlugin(e.object);
                plu.search();
            });

            // Tìm vị trí nút 'Trailer' hoặc 'Watch' để chèn vào sau
            e.html.find('.full-start__buttons').append(btn);
        }
    });
})();
