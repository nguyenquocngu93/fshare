(function () {
'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';
var TORRENTIO = 'https://torrentio.strem.fun/sort=seeders';

function log(a){
console.log('TORRENT_PLUGIN:',a);
}

function getHash(magnet){
var m = magnet.match(/btih:([a-zA-Z0-9]+)/);
return m ? m[1] : null;
}

function searchTorrent(tmdb,type,season,episode,callback){

var url;

if(type == 'movie'){
url = TORRENTIO + '/stream/movie/' + tmdb + '.json';
}else{
url = TORRENTIO + '/stream/series/' + tmdb + ':' + season + ':' + episode + '.json';
}

$.getJSON(url,function(data){

if(!data || !data.streams){
callback([]);
return;
}

var list = [];

data.streams.forEach(function(s){

if(!s.infoHash) return;

list.push({
title:s.title,
hash:s.infoHash
});

});

callback(list);

}).fail(function(){
callback([]);
});

}

function playTorrent(hash){

var url = TORRSERVER + '/stream?link=' + hash + '&index=1&play';

log(url);

Lampa.Player.play({
url:url,
title:'Torrent Stream'
});

}

function showList(list){

if(!list.length){
Lampa.Noty.show('No torrent found');
return;
}

var items = [];

list.forEach(function(t){

items.push({
title:t.title,
icon:'play_arrow',
onSelect:function(){
playTorrent(t.hash);
}
});

});

Lampa.Select.show({
title:'Torrent Streams',
items:items
});

}

function createButton(movie){

var btn = $('<div class="torrent-search-btn selector">')
.text('Torrent')
.css({
marginLeft:'10px',
padding:'6px 14px',
background:'#1f1f1f',
borderRadius:'6px',
cursor:'pointer'
});

btn.on('hover:enter',function(){

var tmdb = movie.id;
var type = movie.name ? 'tv' : 'movie';

var season = movie.season || 1;
var episode = movie.episode || 1;

Lampa.Noty.show('Searching torrent...');

searchTorrent(tmdb,type,season,episode,function(list){

showList(list);

});

});

return btn;

}

function injectButton(){

Lampa.Listener.follow('full',function(e){

if(e.type !== 'complite') return;

var movie = e.data.movie;

var playButton = $('.full-start-new__buttons .selector').first();

if(!playButton.length) return;

if($('.torrent-search-btn').length) return;

var btn = createButton(movie);

playButton.after(btn);

});

}

function start(){

log('plugin start');

injectButton();

}

if(window.appready){
start();
}else{
Lampa.Listener.follow('app',function(e){
if(e.type=='ready') start();
});
}

})();