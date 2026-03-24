(function () {
'use strict';

if (window.lampa_torrent_plugin_ready) return;
window.lampa_torrent_plugin_ready = true;

console.log('Torrent Plugin Loaded');

var TORRENTIO = 'https://torrentio.strem.fun/sort=size/stream';
var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

function request(url, success, error){

var r = new Lampa.Reguest();
r.timeout(15000);

r.silent(url,function(data){
success(data);
},function(a,b){
error(a);
});

}

function parseSize(size){

if(!size) return 0;

var m = size.match(/([\d.]+)\s*(GB|MB|TB)/i);

if(!m) return 0;

var n = parseFloat(m[1]);

switch(m[2].toUpperCase()){

case 'TB': return n*1000*1000*1000*1000;
case 'GB': return n*1000*1000*1000;
case 'MB': return n*1000*1000;

}

return n;

}

function getIMDB(card){

var id = card.imdb_id || '';

if(!id && card.ids) id = card.ids.imdb;

if(!id && card.external_ids) id = card.external_ids.imdb_id;

if(id && !/^tt/.test(id)) id = 'tt'+id;

return id;

}

function getType(card){

if(card.type=='tv') return 'series';

if(card.name && card.first_air_date) return 'series';

return 'movie';

}

function fetchTorrent(imdb,type,callback){

var url;

if(type=='movie'){

url = TORRENTIO+'/movie/'+imdb+'.json';

}else{

url = TORRENTIO+'/series/'+imdb+':1:1.json';

}

request(url,function(data){

var streams = data.streams || [];

var list = [];

streams.forEach(function(s){

if(!s.infoHash) return;

var lines = (s.title||'').split('\n');

var name = lines[0] || 'Torrent';

var info = lines[1] || '';

var sizeMatch = info.match(/💾\s*(.*)/);

var size = sizeMatch ? sizeMatch[1] : '';

list.push({

title:name,
size:size,
sizeNum:parseSize(size),
hash:s.infoHash,
fileIdx:s.fileIdx || 0

});

});

list.sort(function(a,b){
return b.sizeNum - a.sizeNum;
});

callback(list);

},function(){

Lampa.Noty.show('Torrentio error');

callback([]);

});

}

function playTorrent(hash,index,title){

request(TORRSERVER+'/torrent/stat?hash='+hash,function(data){

var files = data.Files || [];

var video = files
.filter(function(f){

return /\.(mkv|mp4|avi|ts|m2ts|mov)$/i.test(f.Name);

})
.sort(function(a,b){

return b.Size-a.Size;

})[0];

if(!video){

Lampa.Noty.show('No video file');

return;

}

var url = TORRSERVER+'/stream?link='+hash+'&index='+video.Id+'&play';

Lampa.Player.play({

url:url,
title:title

});

},function(){

Lampa.Noty.show('Torrent load error');

});

}

function showList(list){

if(!list.length){

Lampa.Noty.show('No torrent found');

return;

}

Lampa.Select.show({

title:'Torrent',

items:list.map(function(t){

return{

title:t.title,
subtitle:t.size,
torrent:t

};

}),

onSelect:function(a){

var t = a.torrent;

playTorrent(t.hash,t.fileIdx,t.title);

}

});

}

function startSearch(card){

var imdb = getIMDB(card);

if(!imdb){

Lampa.Noty.show('No IMDB');

return;

}

var type = getType(card);

Lampa.Noty.show('Searching torrent...');

fetchTorrent(imdb,type,function(list){

showList(list);

});

}

Lampa.Listener.follow('full',function(e){

if(e.type!='complite') return;

var card = e.data.movie;

if(!card) return;

var btn = {

title:'Torrent',

onSelect:function(){

startSearch(card);

}

};

Lampa.Activity.push({

title:'Torrent',
component:'empty',
onStart:function(){

startSearch(card);

}

});

});

})();