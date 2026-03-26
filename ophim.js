// Thêm nút vào action bar trong card
function addCustomPlayButton(cardData) {
    var buttonHtml = `
        <div class="full-start-new__button" data-action="torrentio-play">
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
            </svg>
            <span>Torrentio</span>
        </div>
    `;
    
    $('.full-start-new__buttons').append(buttonHtml);
    
    $('[data-action="torrentio-play"]').on('click', function() {
        var movieData = Lampa.Activity.active().object;
        searchTorrentio(movieData.imdb_id, movieData.type).then(function(sources) {
            // Hiển thị dialog chọn nguồn
            Lampa.Select.show(sources, function(selected) {
                Lampa.Player.play(selected.url);
            });
        });
    });
}

// Hook vào sự kiện full
Lampa.Listener.follow('full', function(e) {
    if (e.type === 'complite') {
        addCustomPlayButton(e.object);
    }
});