(function () {

'use strict';

if (window.lampa_torrent_plugin65) return;
window.lampa_torrent_plugin65 = true;

var TORRENTIO = 'https://torrentio.strem.fun/sort=seeders/stream';
var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

/* ---------------- HELPERS ---------------- */

function log(a){
console.log('TORRENT65:',a);
}

function getImdb(card){
var id = card.imdb_id
|| (card.ids && card.ids.imdb)
|| '';

if(id && !/^tt/.test(id)) id = 'tt'+id;

return id || null;
}

function getType(card){
if(card.name || card.first_air_date) return 'series';
return 'movie';
}

function makeMagnet(hash,name){

return 'magnet:?xt=urn:btih:'+hash+
'&dn='+encodeURIComponent(name||'')+
'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')+
'&tr='+encodeURIComponent('udp://open.stealth.si:80/announce');

}

/* ---------------- NETWORK ---------------- */

function request(url,ok,fail){

var net = new Lampa.Reguest();

net.timeout(15000);

net.silent(url,function(data){

ok(data);

},function(){

fail();

});

}

/* ---------------- TORRENTIO ---------------- */

function searchTorrent(card,season,episode){

var imdb = getImdb(card);

if(!imdb){

Lampa.Noty.show('Không có IMDB id');
return;

}

var type = getType(card);

var path;

if(type=='series'){

path='/series/'+imdb+':'+season+':'+episode+'.json';

}else{

path='/movie/'+imdb+'.json';

}

var url = TORRENTIO + path;

Lampa.Noty.show('Searching torrent...');

request(url,function(data){

var streams = data && data.streams ? data.streams : [];

var list = [];

streams.forEach(function(s){

if(!s.infoHash) return;

var lines = (s.title||'').split('\n');

var name = lines[0] || 'torrent';

list.push({

title:name,
hash:s.infoHash,
file:s.fileIdx||0,
magnet:makeMagnet(s.infoHash,name)

});

});

showList(list,card.title||card.name);

},function(){

Lampa.Noty.show('Torrentio error');

});

}

/* ---------------- TORRSERVER ---------------- */

function playTorrent(t){

var url = TORRSERVER +
'/stream?link=' +
t.hash +
'&index=' +
t.file +
'&play';

Lampa.Player.play({

title:t.title,
url:url

});

}

/* ---------------- UI ---------------- */

function showList(arr,title){

if(!arr.length){

Lampa.Noty.show('No torrent found');

return;

}

Lampa.Select.show({

title:'Torrent ('+arr.length+')',

items:arr.map(function(t){

return {

title:t.title,
result:t

};

}),

onSelect:function(a){

playTorrent(a.result);

},

onBack:function(){

Lampa.Controller.toggle('full');

}

});

}

/* ---------------- SEASON PICK ---------------- */

function askSeason(card){

var seasons = card.number_of_seasons || 1;

if(seasons==1){

askEpisode(card,1);
return;

}

var items=[];

for(var i=1;i<=seasons;i++){

items.push({

title:'Season '+i,
s:i

});

}

Lampa.Select.show({

title:'Select Season',

items:items,

onSelect:function(a){

askEpisode(card,a.s);

}

});

}

function askEpisode(card,s){

var items=[];

for(var i=1;i<=30;i++){

items.push({

title:'Episode '+i,
e:i

});

}

Lampa.Select.show({

title:'Season '+s,

items:items,

onSelect:function(a){

searchTorrent(card,s,a.e);

}

});

}

/* ---------------- BUTTON ---------------- */

function createButton(card){

var btn=$('<div class="full-start__button selector view--torrent65">'+
'<span>Torrent</span></div>');

btn.on('hover:enter',function(){

var type=getType(card);

if(type=='series'){

askSeason(card);

}else{

searchTorrent(card,1,1);

}

});

return btn;

}

/* ---------------- HOOK ---------------- */

Lampa.Listener.follow('full',function(e){

if(e.type!=='complite') return;

var card = e.data && e.data.movie
? e.data.movie
: (e.object && e.object.card);

if(!card) return;

var $ctx = e.object && e.object.activity
? e.object.activity.render()
: $('body');

if($ctx.find('.view--torrent65').length) return;

var btn=createButton(card);

$ctx.find('.full-start__buttons').append(btn);

});

console.log('Torrent Plugin v6.5 loaded');

})();