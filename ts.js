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

log(url);

$.getJSON(url,function(data){

if(!data || !data.streams){
callback([]);
return;
}

var list = [];

data.streams.forEach(function(s){

if(!s.infoHash) return;

list.push({
title:s.title || 'torrent',
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

if(window.Android){
Android.open(url);
}else{
window.open(url);
}

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
subtitle:'torrent',
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

function interceptPlay(){

Lampa.Listener.follow('play',function(e){

if(!e.data || !e.data.movie) return;

var movie = e.data.movie;

var tmdb = movie.id;
var type = movie.name ? 'tv' : 'movie';

var season = e.data.season || 1;
var episode = e.data.episode || 1;

log('play intercept');

searchTorrent(tmdb,type,season,episode,function(list){

showList(list);

});

return false;

});

}

function start(){

log('plugin start');

interceptPlay();

}

if(window.appready){
start();
}else{
Lampa.Listener.follow('app',function(e){
if(e.type=='ready') start();
});
}

})();