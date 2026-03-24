(function () {
'use strict';

/*
========================================
LAMPA TORRENT PRO
Torrentio + TorrServer
========================================
*/

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

var CONFIG = {
    min_seeders: 5,
    auto_play: false,
    cache_time: 600000
};

var CACHE = {};

function ready(cb){
    if(window.appready) cb();
    else{
        Lampa.Listener.follow('app',function(e){
            if(e.type=='ready') cb();
        });
    }
}

function init(){

    console.log('Torrent PRO loaded');

    Lampa.Listener.follow('full',function(e){

        if(e.type !== 'complite') return;

        var movie = e.data.movie;

        setTimeout(function(){

            addButton(movie);

        },300);

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

    if(CACHE[imdb] && Date.now()-CACHE[imdb].time < CONFIG.cache_time){

        showResults(CACHE[imdb].data);
        return;

    }

    Lampa.Noty.show('Searching torrents...');

    searchTorrentio(imdb);

}

function searchTorrentio(imdb){

    var url = 'https://torrentio.strem.fun/sort=seeders/stream/movie/'+imdb+'.json';

    fetch(url)
    .then(function(r){return r.json()})
    .then(function(data){

        if(!data || !data.streams){
            Lampa.Noty.show('No torrents');
            return;
        }

        var list = parseStreams(data.streams);

        CACHE[imdb] = {
            time: Date.now(),
            data: list
        };

        showResults(list);

    })
    .catch(function(){

        Lampa.Noty.show('Search error');

    });

}

function parseStreams(streams){

    var list = [];

    streams.forEach(function(s){

        var title = s.title || 'torrent';

        var seed = getSeed(title);

        list.push({

            title: title,
            seeders: seed,
            size: getSize(title),
            quality: getQuality(title),
            hash: s.infoHash

        });

    });

    list = list.filter(function(t){

        return t.seeders >= CONFIG.min_seeders;

    });

    list.sort(function(a,b){

        return b.seeders - a.seeders;

    });

    return list;

}

function getSeed(t){

    var m = t.match(/👤\s?(\d+)/);

    return m ? parseInt(m[1]) : 0;

}

function getSize(t){

    var m = t.match(/([0-9.]+)\s?(GB|MB)/i);

    return m ? m[0] : '';

}

function getQuality(t){

    if(/2160|4k/i.test(t)) return '4K';
    if(/1080/i.test(t)) return '1080p';
    if(/720/i.test(t)) return '720p';

    return '';

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

        title:'Torrent Results',

        items:items,

        onSelect:function(a){

            playTorrent(a.hash);

        }

    });

}

function buildTitle(t){

    var s='';

    if(t.quality) s+='['+t.quality+'] ';

    s+=t.title;

    if(t.size) s+=' • '+t.size;

    if(t.seeders) s+=' • 👤 '+t.seeders;

    return s;

}

function playTorrent(hash){

    var magnet = 'magnet:?xt=urn:btih:'+hash;

    var add = TORRSERVER + '/torrent/add?link='+encodeURIComponent(magnet);

    Lampa.Noty.show('Loading torrent...');

    fetch(add)
    .then(function(r){return r.json()})
    .then(function(data){

        if(!data || !data.hash){

            Lampa.Noty.show('Torrent add error');
            return;

        }

        selectFile(data.hash);

    });

}

function selectFile(hash){

    var list = TORRSERVER + '/torrent/files?hash='+hash;

    fetch(list)
    .then(function(r){return r.json()})
    .then(function(files){

        if(!files || !files.length){

            Lampa.Noty.show('No video files');
            return;

        }

        var biggest = files[0];

        files.forEach(function(f){

            if(f.length > biggest.length){

                biggest = f;

            }

        });

        var stream = TORRSERVER + '/torrent/play?hash='+hash+'&file='+biggest.id;

        setTimeout(function(){

            Lampa.Player.play(stream);

        },500);

    });

}

ready(init);

})();