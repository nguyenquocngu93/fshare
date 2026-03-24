(function(){

'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

var VIDEO_EXT = ['.mkv','.mp4','.avi','.ts','.webm','.mov'];

function log(){
console.log('[TORRENT V4.5]',arguments);
}

/* BUTTON */

function addButton(){

if($('.torrent-v45').length) return;

var btn = $('<div class="selector torrent-v45">')
.text('🔎 Torrent')
.css({
padding:'0.6em',
margin:'1em',
background:'#E50914',
color:'#fff',
'border-radius':'6px',
'text-align':'center'
});

btn.on('hover:enter',function(){

var movie = Lampa.Activity.active().card;

if(!movie) return;

search(movie);

});

$('.full-start-new__buttons').append(btn);

}

/* SEARCH */

function search(movie){

var title = movie.title || movie.original_title || '';
var year = movie.release_date ? movie.release_date.split('-')[0] : '';

var q = encodeURIComponent(title+' '+year);

Lampa.Noty.show('🔎 Searching torrent...');

var sources=[torrentio,yts,tpb,x1337,eztv];

runSources(sources,q);

}

function runSources(list,q){

if(!list.length){

Lampa.Noty.show('❌ No torrent found');
return;

}

var fn=list.shift();

fn(q,function(magnet){

if(magnet){

sendTorrent(magnet);

}else{

runSources(list,q);

}

});

}

/* SOURCES */

function torrentio(q,cb){

var url='https://torrentio.strem.fun/sort=size/stream/movie/'+q+'.json';

$.get(url,function(data){

try{

if(data.streams.length){

cb(data.streams[0].url);
return;

}

}catch(e){}

cb(null);

}).fail(function(){cb(null);});

}

function yts(q,cb){

var url='https://yts.mx/api/v2/list_movies.json?query_term='+q;

$.get(url,function(data){

try{

if(data.data.movies.length){

var hash=data.data.movies[0].torrents[0].hash;

cb('magnet:?xt=urn:btih:'+hash);

return;

}

}catch(e){}

cb(null);

}).fail(function(){cb(null);});

}

function tpb(q,cb){

var url='https://apibay.org/q.php?q='+q;

$.get(url,function(data){

if(data.length){

cb('magnet:?xt=urn:btih:'+data[0].info_hash);

return;

}

cb(null);

}).fail(function(){cb(null);});

}

function x1337(q,cb){

var url='https://api.allorigins.win/raw?url=https://1337x.to/search/'+q+'/1/';

$.get(url,function(html){

var m=html.match(/magnet:\?xt=urn:btih:[^"]+/);

cb(m?m[0]:null);

}).fail(function(){cb(null);});

}

function eztv(q,cb){

var url='https://eztv.re/api/get-torrents?limit=1&imdb_id='+q;

$.get(url,function(data){

try{

if(data.torrents.length){

cb(data.torrents[0].magnet_url);

return;

}

}catch(e){}

cb(null);

}).fail(function(){cb(null);});

}

/* TORRENT ADD */

function sendTorrent(magnet){

var hashMatch=magnet.match(/btih:([a-zA-Z0-9]+)/);

if(!hashMatch){

Lampa.Noty.show('❌ Magnet error');

return;

}

var hash=hashMatch[1];

var add=TORRSERVER+'/torrent/add?link='+encodeURIComponent(magnet);

Lampa.Noty.show('⬇ Adding torrent...');

$.get(add,function(){

setTimeout(function(){

getTorrentFiles(hash);

},5000);

});

}

/* GET FILE LIST */

function getTorrentFiles(hash){

var url=TORRSERVER+'/torrent/list';

$.get(url,function(data){

try{

var torrent=null;

for(var i in data){

if(data[i].hash.toLowerCase()==hash.toLowerCase()){

torrent=data[i];

break;

}

}

if(!torrent){

play(hash,1);

return;

}

detectVideo(hash,torrent.files);

}catch(e){

play(hash,1);

}

});

}

/* DETECT VIDEO */

function detectVideo(hash,files){

if(!files || !files.length){

play(hash,1);

return;

}

var bestIndex=1;
var bestSize=0;

for(var i=0;i<files.length;i++){

var name=files[i].name.toLowerCase();

for(var j=0;j<VIDEO_EXT.length;j++){

if(name.indexOf(VIDEO_EXT[j])>-1){

if(files[i].size>bestSize){

bestSize=files[i].size;
bestIndex=i+1;

}

}

}

}

play(hash,bestIndex);

}

/* PLAY */

function play(hash,index){

var url=TORRSERVER+'/stream?link='+hash+'&index='+index+'&play';

log('PLAY',url);

Lampa.Player.play({

url:url,

title:'Torrent Stream',

type:'video',

player:'android'

});

}

/* INIT */

Lampa.Listener.follow('full',function(e){

if(e.type=='complite'){

setTimeout(addButton,600);

}

});

})();