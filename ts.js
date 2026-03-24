(function(){

'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

function log(){
console.log('[Torrent V4.6]',arguments);
}

/* ADD BUTTON */

function addButton(){

if($('.torrent-v46').length) return;

var btn = $('<div class="selector torrent-v46">')
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

/* SEARCH TORRENTIO */

function search(movie){

var title = movie.title || movie.original_title || '';

var year = movie.release_date ? movie.release_date.split('-')[0] : '';

var query = encodeURIComponent(title + ' ' + year);

Lampa.Noty.show('🔎 Searching Torrentio...');

var url='https://torrentio.strem.fun/sort=size/stream/movie/'+query+'.json';

$.get(url,function(data){

try{

if(!data.streams || !data.streams.length){

Lampa.Noty.show('❌ No torrents found');
return;

}

showList(data.streams);

}catch(e){

Lampa.Noty.show('❌ Torrentio error');

}

});

}

/* SHOW LIST */

function showList(streams){

var items=[];

streams.forEach(function(s){

items.push({

title:s.title,

subtitle:s.name,

magnet:s.url

});

});

Lampa.Select.show({

title:'Torrentio Streams',

items:items,

onSelect:function(a){

sendTorrent(a.magnet);

}

});

}

/* SEND TORRENT */

function sendTorrent(magnet){

var hashMatch = magnet.match(/btih:([a-zA-Z0-9]+)/);

if(!hashMatch){

Lampa.Noty.show('❌ Magnet error');

return;

}

var hash = hashMatch[1];

var add = TORRSERVER+'/torrent/add?link='+encodeURIComponent(magnet);

Lampa.Noty.show('⬇ Adding torrent...');

$.get(add,function(){

setTimeout(function(){

play(hash);

},4000);

});

}

/* PLAY */

function play(hash){

var url = TORRSERVER+'/stream?link='+hash+'&index=1&play';

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

setTimeout(addButton,500);

}

});

})();