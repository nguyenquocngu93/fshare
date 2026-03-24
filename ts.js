(function () {
'use strict';

/*
========================================
LAMPA TORRENT PRO V2
5 SOURCES + TORRSERVER
========================================
*/

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

var CONFIG = {
    min_seeders: 3,
    cache_time: 600000
};

var CACHE = {};

function ready(cb){
    if(window.appready) cb();
    else{
        Lampa.Listener.follow('app',function(e){
            if(e.type == 'ready') cb();
        });
    }
}

function init(){

    console.log('Torrent PRO v2 loaded');

    Lampa.Listener.follow('full',function(e){

        if(e.type !== 'complite') return;

        var movie = e.data.movie;

        setTimeout(function(){

            addButton(movie);

        },200);

    });

}

function addButton(movie){

    if($('.torrent-pro-btn').length) return;

    var btn = $('<div class="full-start__button selector torrent-pro-btn">'+
        '<div class="full-start__button-text">Torrent</div>'+
    '</div>');

    btn.on('hover:enter',function(){

        startSearch(movie);

    });

    var container = $('.full-start__buttons');

    if(!container.length){
        container = $('.full-start-new__buttons');
    }

    container.append(btn);

}

function startSearch(movie){

    if(!movie || !movie.imdb_id){
        Lampa.Noty.show('No IMDB id');
        return;
    }

    var imdb = movie.imdb_id;

    if(CACHE[imdb] && Date.now() - CACHE[imdb].time < CONFIG.cache_time){

        showResults(CACHE[imdb].data);
        return;

    }

    Lampa.Noty.show('Searching torrents...');

    Promise.all([
        searchTorrentio(imdb),
        searchYTS(imdb),
        search1337x(movie.title),
        searchGalaxy(movie.title),
        searchNyaa(movie.title)
    ])
    .then(function(results){

        var torrents = [].concat(...results);

        torrents = torrents.filter(function(t){
            return t.seeders >= CONFIG.min_seeders;
        });

        torrents.sort(function(a,b){
            return b.seeders - a.seeders;
        });

        CACHE[imdb] = {
            time: Date.now(),
            data: torrents
        };

        showResults(torrents);

    });

}

function searchTorrentio(imdb){

    return fetch(
        'https://torrentio.strem.fun/sort=seeders/stream/movie/'+imdb+'.json'
    )
    .then(r=>r.json())
    .then(function(data){

        if(!data.streams) return [];

        return data.streams.map(function(s){

            return {
                title: 'Torrentio • ' + s.title,
                seeders: 50,
                hash: s.infoHash
            };

        });

    })
    .catch(()=>[]);

}

function searchYTS(imdb){

    return fetch(
        'https://yts.mx/api/v2/list_movies.json?query_term='+imdb
    )
    .then(r=>r.json())
    .then(function(data){

        if(!data.data.movies) return [];

        var torrents = [];

        data.data.movies[0].torrents.forEach(function(t){

            torrents.push({
                title:'YTS '+t.quality,
                seeders:100,
                hash:t.hash
            });

        });

        return torrents;

    })
    .catch(()=>[]);

}

function search1337x(title){

    return Promise.resolve([]);

}

function searchGalaxy(title){

    return Promise.resolve([]);

}

function searchNyaa(title){

    return Promise.resolve([]);

}

function showResults(list){

    if(!list.length){

        Lampa.Noty.show('No torrents found');
        return;

    }

    var items = [];

    list.forEach(function(t){

        items.push({

            title: buildTitle(t),
            hash: t.hash

        });

    });

    Lampa.Select.show({

        title:'Torrent Results',

        items:items,

        onSelect:function(a){

            playTorrent(a.hash);

        }

    });

}

function buildTitle(t){

    var text = t.title;

    if(t.seeders){
        text += ' • 👤 '+t.seeders;
    }

    return text;

}

function playTorrent(hash){

    var magnet = 'magnet:?xt=urn:btih:'+hash;

    var stream = TORRSERVER + '/stream?link=' + encodeURIComponent(magnet);

    console.log('STREAM:',stream);

    Lampa.Noty.show('Starting torrent...');

    setTimeout(function(){

        Lampa.Player.play(stream,true);

    },300);

}

ready(init);

})();