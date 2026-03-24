(function () {
'use strict';

/*
========================================
LAMPA TORRENT SEARCH PLUGIN
Torrentio + TorrServer
Author: ChatGPT
========================================
*/

var plugin_name = 'torrent_search_plugin';
var torrserver = 'http://gren439e.tsarea.tv:8880';

var config = {
    auto_play: false,
    min_seeders: 5,
    sort: 'seeders'
};

var cache = {};

function log(){
    console.log.apply(console, arguments);
}

function ready(callback){
    if(window.appready) callback();
    else{
        Lampa.Listener.follow('app', function(e){
            if(e.type == 'ready') callback();
        });
    }
}

function init(){

    log('Torrent plugin init');

    Lampa.Listener.follow('full', function(e){

        if(e.type == 'complite'){

            var movie = e.data.movie;

            setTimeout(function(){
                createButton(movie);
            },200);

        }

    });

}

function createButton(movie){

    if($('.torrent-search-btn').length) return;

    var btn = $('<div class="full-start__button selector torrent-search-btn">'+
        '<div class="full-start__button-icon"></div>'+
        '<div class="full-start__button-text">Torrent</div>'+
    '</div>');

    btn.on('hover:enter', function(){
        startSearch(movie);
    });

    var container = $('.full-start__buttons');

    if(!container.length){
        container = $('.full-start-new__buttons');
    }

    container.append(btn);

}

function startSearch(movie){

    if(!movie){
        Lampa.Noty.show('Movie data missing');
        return;
    }

    var imdb = movie.imdb_id;

    if(!imdb){
        Lampa.Noty.show('IMDB id not found');
        return;
    }

    if(cache[imdb]){
        showResults(cache[imdb]);
        return;
    }

    Lampa.Noty.show('Searching torrents...');

    searchTorrentio(imdb);

}

function searchTorrentio(imdb){

    var url = 'https://torrentio.strem.fun/sort=seeders/stream/movie/'+imdb+'.json';

    fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){

        if(!data || !data.streams){
            Lampa.Noty.show('No torrents found');
            return;
        }

        var list = parseStreams(data.streams);

        cache[imdb] = list;

        showResults(list);

    })
    .catch(function(){
        Lampa.Noty.show('Torrent search error');
    });

}

function parseStreams(streams){

    var list = [];

    streams.forEach(function(s){

        var title = s.title || 'Torrent';

        var size = extractSize(title);
        var quality = extractQuality(title);
        var seed = extractSeeders(title);

        list.push({
            title: title,
            size: size,
            quality: quality,
            seeders: seed,
            hash: s.infoHash
        });

    });

    list = list.filter(function(t){
        return t.seeders >= config.min_seeders;
    });

    list.sort(function(a,b){
        return b.seeders - a.seeders;
    });

    return list;

}

function extractSize(title){

    var match = title.match(/([0-9.]+)\s?(GB|MB)/i);

    if(match) return match[0];

    return '';
}

function extractQuality(title){

    if(/2160|4k/i.test(title)) return '4K';
    if(/1080/i.test(title)) return '1080p';
    if(/720/i.test(title)) return '720p';

    return '';
}

function extractSeeders(title){

    var match = title.match(/👤\s?(\d+)/);

    if(match) return parseInt(match[1]);

    return 0;
}

function showResults(list){

    if(!list.length){
        Lampa.Noty.show('No good torrents');
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
        title: 'Torrent Results',
        items: items,
        onSelect: function(item){

            playTorrent(item.hash);

        }
    });

}

function buildTitle(t){

    var text = '';

    if(t.quality) text += '['+t.quality+'] ';
    text += t.title;

    if(t.size) text += ' • '+t.size;

    if(t.seeders) text += ' • 👤 '+t.seeders;

    return text;
}

function playTorrent(hash){

    var magnet = 'magnet:?xt=urn:btih:'+hash;

    var stream = torrserver + '/stream?link=' + encodeURIComponent(magnet);

    Lampa.Noty.show('Starting torrent...');

    setTimeout(function(){

        Lampa.Player.play(stream);

    },500);

}

function addSettings(){

    Lampa.SettingsApi.addComponent({
        component: plugin_name,
        name: 'Torrent'
    });

    Lampa.SettingsApi.addParam({
        component: plugin_name,
        param: {
            name: 'auto_play',
            type: 'trigger',
            default: false
        },
        field: {
            name: 'Auto play best torrent'
        },
        onChange: function(v){
            config.auto_play = v;
        }
    });

}

function start(){

    addSettings();

    init();

}

ready(start);

})();