(function () {

'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

function log(){
    console.log('TORRENT_PLUGIN', arguments);
}

/* =========================
   TORRENT SEARCH (TORRENTIO)
========================= */

function searchTorrent(title, year, callback){

    var query = encodeURIComponent(title + ' ' + year);

    var url = 'https://torrentio.strem.fun/sort=size%7Cqualityfilter=480p,scr,cam/stream/movie/' + query + '.json';

    fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){

        if(!data || !data.streams){
            callback([]);
            return;
        }

        var list = [];

        data.streams.forEach(function(item){

            if(item.infoHash){

                list.push({
                    name: item.title || 'Torrent',
                    hash: item.infoHash,
                    size: item.size || 0
                });

            }

        });

        callback(list);

    })
    .catch(function(){
        callback([]);
    });

}

/* =========================
   TORRSERVER STREAM LINK
========================= */

function buildStream(hash){

    return TORRSERVER + '/stream?link=' + hash + '&index=1&play';

}

/* =========================
   OPEN PLAYER
========================= */

function play(hash){

    var url = buildStream(hash);

    Lampa.Player.play({
        url: url,
        title: 'Torrent Stream'
    });

}

/* =========================
   TORRENT LIST WINDOW
========================= */

function showList(torrents){

    if(!torrents.length){

        Lampa.Noty.show('No torrent found');

        return;
    }

    var items = torrents.map(function(t){

        return {
            title: t.name,
            subtitle: 'Hash: ' + t.hash.substring(0,8),
            hash: t.hash
        };

    });

    var select = new Lampa.Select({
        title: 'Torrent List',
        items: items,
        onSelect: function(a){

            play(a.hash);

        }
    });

    select.open();

}

/* =========================
   MAIN SEARCH
========================= */

function startSearch(){

    var card = Lampa.Activity.active().card;

    if(!card){
        Lampa.Noty.show('No movie');
        return;
    }

    var title = card.title || card.original_title;
    var year = card.release_date ? card.release_date.substr(0,4) : '';

    Lampa.Noty.show('Searching torrent...');

    searchTorrent(title, year, function(list){

        showList(list);

    });

}

/* =========================
   ADD SOURCE BUTTON
========================= */

function addSource(){

    Lampa.Listener.follow('player_sources', function(e){

        e.sources.push({

            title: 'Torrent Search',
            icon: 'search',
            onSelect: function(){

                startSearch();

            }

        });

    });

}

/* =========================
   INIT
========================= */

function init(){

    log('INIT');

    addSource();

}

if(window.appready){
    init();
}
else{
    Lampa.Listener.follow('app', init);
}

})();