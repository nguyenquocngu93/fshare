(function(){

'use strict';

var TORRSERVER='http://gren439e.tsarea.tv:8880';

function addButton(){

if($('.torrent-clean').length) return;

var btn=$('<div class="selector torrent-clean">')
.append('<span>Torrent</span>');

btn.on('hover:enter',function(){

var movie=Lampa.Activity.active().card;

if(!movie) return;

search(movie);

});

$('.full-start-new__buttons').append(btn);

}

/* SEARCH */

function search(movie){

var imdb=movie.imdb_id;

if(!imdb){

Lampa.Noty.show('No IMDB id');
return;

}

var url='https://torrentio.strem.fun/sort=seeders%7Csize/stream/movie/'+imdb+'.json';

Lampa.Noty.show('Searching torrents...');

$.get(url,function(data){

if(!data || !data.streams || !data.streams.length){

Lampa.Noty.show('No torrents found');
return;

}

showList(data.streams);

}).fail(function(){

Lampa.Noty.show('Network error');

});

}

/* SHOW LIST */

function showList(streams){

var items=[];

streams.forEach(function(s){

items.push({

title:s.title || 'Torrent',

subtitle:s.name || '',

data:s.url

});

});

Lampa.Select.show({

title:'Torrent Streams',

items:items,

onSelect:function(a){

sendTorrent(a.data);

}

});

}

/* ADD TORRENT */

function sendTorrent(magnet){

if(!magnet){

Lampa.Noty.show('Magnet error');
return;

}

var hashMatch=magnet.match(/btih:([a-zA-Z0-9]+)/);

if(!hashMatch){

Lampa.Noty.show('Magnet invalid');
return;

}

var hash=hashMatch[1];

var add=TORRSERVER+'/torrent/add?link='+encodeURIComponent(magnet);

Lampa.Noty.show('Adding torrent...');

$.get(add,function(){

setTimeout(function(){

play(hash);

},4000);

});

}

/* PLAY */

function play(hash){

var url=TORRSERVER+'/stream?link='+hash+'&index=1&play';

Lampa.Player.play({

url:url,

title:'Torrent Stream',

type:'video',

player:'android'

});

}

/* INIT */

Lampa.Listener.follow('activity',function(e){

if(e.component=='full'){

setTimeout(addButton,500);

}

});

})();