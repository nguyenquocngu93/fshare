(function () {
'use strict';

var TORRSERVER = 'http://gren439e.tsarea.tv:8880';

function log(){
console.log('TORRENT_PLUGIN:',...arguments);
}

function sizeToGB(size){
if(!size) return 0;
size = size.toUpperCase();

if(size.includes('GB')) return parseFloat(size);
if(size.includes('MB')) return parseFloat(size)/1024;

return 0;
}

function sortBySize(list){

return list.sort(function(a,b){

return sizeToGB(b.size) - sizeToGB(a.size);

});

}

function searchTorrent(title,year,callback){

var url = 'https://torrentio.strem.fun/sort=size%7Cqualityfilter=480p,scr,cam/stream/movie/' 
+ title + '.json';

fetch(url)
.then(r=>r.json())
.then(data=>{

var torrents = [];

if(data && data.streams){

data.streams.forEach(function(t){

if(t.infoHash){

torrents.push({

title: t.title,
hash: t.infoHash,
size: t.title.match(/(\d+(\.\d+)?\s?(GB|MB))/i)?.[0] || '',
seeders: t.seeders || 0

});

}

});

}

callback(sortBySize(torrents));

})
.catch(()=>callback([]));

}

function playTorrent(hash){

var stream = TORRSERVER + '/stream?link=' + hash + '&index=1&play';

log('PLAY',stream);

Lampa.Player.play(stream);

}

function openList(list){

if(!list.length){

Lampa.Noty.show('No torrent found');

return;

}

var items = list.map(function(t){

return {

title: t.title + '  (' + t.size + ')',

subtitle: 'Seeders: ' + t.seeders,

onSelect: function(){

playTorrent(t.hash);

}

};

});

Lampa.Select.show({

title: 'Torrentio',

items: items

});

}

function search(){

var card = Lampa.Activity.active().card;

if(!card) return;

var title = card.original_title || card.title;

var year = card.release_date ? card.release_date.split('-')[0] : '';

Lampa.Noty.show('Searching torrent...');

searchTorrent(title,year,function(list){

openList(list);

});

}

function addButton(){

Lampa.Listener.follow('full',function(e){

if(e.type !== 'complite') return;

setTimeout(function(){

var container = document.querySelector('.full-start__buttons');

if(!container) return;

if(document.querySelector('.torrent-btn')) return;

var btn = document.createElement('div');

btn.className = 'full-start__button selector torrent-btn';

btn.innerHTML = '<span>TORRENT</span>';

btn.onclick = search;

container.appendChild(btn);

},500);

});

}

function init(){

log('INIT');

addButton();

}

if(window.appready) init();
else Lampa.Listener.follow('app',init);

})();