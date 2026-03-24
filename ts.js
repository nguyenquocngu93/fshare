(function () {
'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

function init(){

    Lampa.Listener.follow('full',function(e){

        if(e.type !== 'complite') return;

        var movie = e.data.movie;

        var btn = $('<div class="full-start__button selector">'+
        '<div class="full-start__button-text">Torrent</div>'+
        '</div>');

        btn.on('hover:enter',function(){
            search(movie);
        });

        $('.full-start__buttons').append(btn);

    });
}

function search(movie){

    var imdb = movie.imdb_id;

    if(!imdb){
        Lampa.Noty.show('No IMDB id');
        return;
    }

    Lampa.Noty.show('Search torrent...');

    var url = 'https://torrentio.strem.fun/sort=seeders/stream/movie/'+imdb+'.json';

    fetch(url)
    .then(r=>r.json())
    .then(function(data){

        var list = [];

        data.streams.forEach(function(s){

            list.push({
                title:s.title,
                magnet:'magnet:?xt=urn:btih:'+s.infoHash
            });

        });

        show(list);

    });

}

function show(list){

    Lampa.Select.show({
        title:'Torrentio',
        items:list,
        onSelect:function(item){

            play(item.magnet);

        }
    });

}

function play(magnet){

    var url = TORRSERVER + '/stream?link=' + encodeURIComponent(magnet);

    Lampa.Player.play(url);

}

if(window.appready) init();
else{
    Lampa.Listener.follow('app',function(e){
        if(e.type === 'ready') init();
    });
}

})();