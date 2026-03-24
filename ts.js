(function(){

'use strict';

if(window.torrent_plugin_v8) return;
window.torrent_plugin_v8 = true;

var TORRENTIO = 'https://torrentio.strem.fun/sort=size/stream';

function getImdb(card){

return card.imdb_id ||
(card.ids && card.ids.imdb) ||
(card.external_ids && card.external_ids.imdb_id);

}

function tsUrl(){

return 'http://gren439e.tsarea.tv:8880';

}

function play(hash,index,title){

var url = tsUrl() + '/stream?link=' + hash + '&index=' + index + '&play';

Lampa.Player.play({
title:title,
url:url
});

}

function parseSize(s){

if(!s) return 0;

var m = s.match(/([\d\.]+)\s*(GB|MB|TB)/i);

if(!m) return 0;

var n = parseFloat(m[1]);

var u = m[2].toUpperCase();

if(u=='TB') n*=1000;
if(u=='GB') n*=1;
if(u=='MB') n/=1000;

return n;

}

function search(card){

var imdb = getImdb(card);

if(!imdb){

Lampa.Noty.show('Không có IMDB');
return;

}

Lampa.Noty.show('Searching torrent...');

var url = TORRENTIO + '/movie/' + imdb + '.json';

new Lampa.Reguest().silent(url,function(data){

var arr = (data.streams || []).map(function(s){

var lines = (s.title||'').split('\n');

var sizeMatch = (lines[1]||'').match(/💾\s*(.+)/);

var size = sizeMatch ? sizeMatch[1] : '';

return {

title:lines[0],
size:size,
sizeNum:parseSize(size),
seeds:(lines[1]||'').match(/👤\s*(\d+)/)?.[1]||0,
hash:s.infoHash,
index:s.fileIdx || 0

};

});

arr.sort(function(a,b){
return b.sizeNum - a.sizeNum;
});

show(arr,card.title);

});

}

function show(list,title){

if(!list.length){

Lampa.Noty.show('No torrent found');
return;

}

Lampa.Select.show({

title:'Torrent',

items:list.map(function(t){

return {

title:t.title,
subtitle:'👤 '+t.seeds+' 💾 '+t.size,
torrent:t

};

}),

onSelect:function(a){

play(a.torrent.hash,a.torrent.index,a.torrent.title);

}

});

}

Lampa.Listener.follow('full',function(e){

if(e.type!='complite') return;

var card = e.data.movie;

if(!card) return;

setTimeout(function(){

var buttons = document.querySelector('.full-start__buttons');

if(!buttons) return;

if(document.querySelector('.torrent-btn')) return;

var btn = document.createElement('div');

btn.className='full-start__button selector torrent-btn';

btn.innerHTML='<span>Torrent</span>';

btn.onclick=function(){

search(card);

};

buttons.appendChild(btn);

},500);

});

console.log('Torrent Plugin v8 loaded');

})();