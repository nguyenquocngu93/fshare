/* KKPhim Plugin v3.1 - Optimized (Load + Image) */
(function(){
'use strict';
if(window.__kkphim_plugin_started)return;
window.__kkphim_plugin_started=true;

/* ════ CONFIG & CACHE ════ */
var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/original';
var TMDB_W500='https://image.tmdb.org/t/p/w500';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};

/* 🆕 API Cache với TTL */
var _apiCache = {};
var CACHE_TTL = 5 * 60 * 1000; // 5 phút
function cachedFetch(key, fetchFn) {
    var cached = _apiCache[key];
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return Promise.resolve(cached.data);
    }
    return fetchFn().then(function(data) {
        _apiCache[key] = { data: data, time: Date.now() };
        // Dọn cache nếu quá 50 items
        var keys = Object.keys(_apiCache);
        if (keys.length > 50) {
            keys.sort(function(a, b) { return _apiCache[a].time - _apiCache[b].time; });
            for (var i = 0; i < keys.length - 50; i++) { delete _apiCache[keys[i]]; }
        }
        return data;
    }).catch(function(e) { delete _apiCache[key]; throw e; });
}

var CW_KEY='kkphim_continue_watching';
var HIST_KEY='kkphim_history';

function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}
function srcKey(){return ls().source||'ophim';}
function src(){return SOURCES[srcKey()]||SOURCES.ophim;}
function sApi(){return src().api;}
function sImg(){return src().img;}
function tsHost(){return ls().torrserver_host||'';}
function tsPass(){return ls().torrserver_password||'';}
function tioConf(){return ls().torrentio_config||'';}
function aioUrl(){return ls().aio_url||'';}
function tEngine(){return ls().torrent_engine||'torrentio';}
function cardSt(){return ls().card_style||'3';}
function tmLang(){return ls().tmdb_lang||'vi-VN';}
function cardMode(){return ls().card_mode||'hgrid';}
function catMode(){return ls().cat_mode||'hgrid';}
function rowCount(){return parseInt(ls().row_count||'20');}
function fontScale(){return parseInt(ls().font_scale||'100');}

function getCW(){try{return JSON.parse(localStorage.getItem(CW_KEY))||[];}catch(e){return[];}}
function setCW(v){try{localStorage.setItem(CW_KEY,JSON.stringify(v||[]));}catch(e){}}
function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(e){return[];}}
function setHist(v){try{localStorage.setItem(HIST_KEY,JSON.stringify(v||[]));}catch(e){}}

/* 🆕 Placeholder SVG cho ảnh lỗi */
var IMG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22%3E%3Crect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 fill=%22%23444%22 font-size=%2212%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo+Image%3C/text%3E%3C/svg%3E';

/* 🆕 Hàm fImg tối ưu: tự downgrade TMDB original → w500 */
function fImg(u, size) {
    if (!u) return '';
    if (u.indexOf('http') === 0) {
        if (u.indexOf('image.tmdb.org') > -1) {
            var s = size || 'w500';
            if (u.indexOf('/original/') > -1) return u.replace('/original/', '/' + s + '/');
            if (u.indexOf('/w1280/') > -1 || u.indexOf('/w780/') > -1) return u.replace(/\/w\d+\//, '/' + s + '/');
        }
        return u;
    }
    var b = sImg();
    return b ? b + u : u;
}

/* 🆕 Helper tạo img tag với error handling + lazy load */
function mkImg(src, alt, className) {
    if (!src) return '<div class="kk-card-noposter"><span>No Image</span></div>';
    return '<img src="' + E(src) + '" alt="' + E(alt || '') + '" class="' + (className || '') + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + IMG_PLACEHOLDER + '\'">';
}

/* 🆕 Preload ảnh quan trọng */
function preloadImg(src) {
    if (!src) return;
    var img = new Image();
    img.src = src;
}

function applyFontScale(){
    var id='kkphim-font-scale';
    $('#'+id).remove();
    var fs=fontScale();
    if(!fs||fs===100)return;
    var css=''
    +'.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-person-header,.kk-person-bio,.kk-actions,.kk-section,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}'
    +'.kk-card-name,.kk-pfc-title,.kk-title,.kk-row-title,.kk-grid-title,.kk-block-title,.kk-person-name,.kk-stg-title{font-size:calc(1em * 1.06)!important;}'
    +'.kk-card-origin,.kk-card-meta,.kk-card-cats,.kk-card-overview,.kk-pfc-origin,.kk-pfc-meta,.kk-pfc-desc,.kk-body-desc-text,.kk-stg-label-desc{font-size:calc(1em * 0.92)!important;}';
    $('head').append('<style id="'+id+'">'+css+'</style>');
}

function saveHistory(item){
    try{
        var n=nm(item);
        if(!n)return;
        var arr=getHist();
        var id=(srcKey()||'')+'_'+(n.slug||'')+'_'+((n.tmdb&&n.tmdb.id)||'');
        arr=arr.filter(function(x){return x.id!==id;});
        arr.unshift({
            id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',
            poster_url:n.poster_url||'',thumb_url:n.thumb_url||'',year:n.year||'',quality:n.quality||'',
            episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',time:Date.now()
        });
        if(arr.length>50)arr=arr.slice(0,50);
        setHist(arr);
    }catch(e){}
}

function saveContinue(item,epName,link){
    try{
        var n=nm(item);
        if(!n)return;
        var arr=getCW();
        var id=(srcKey()||'')+'_'+(n.slug||'')+'_'+(epName||'movie');
        arr=arr.filter(function(x){return x.id!==id;});
        arr.unshift({
            id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',
            poster_url:n.poster_url||'',thumb_url:n.thumb_url||'',year:n.year||'',quality:n.quality||'',
            episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',
            ep_name:epName||'',ep_link:link||'',time:Date.now()
        });
        if(arr.length>40)arr=arr.slice(0,40);
        setCW(arr);
    }catch(e){}
}

function lastHistory(){var h=getHist();return h&&h.length?h[0]:null;}

function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cDesc(s){return String(s||'').replace(/<[^>]+>/g,'').trim()||'Không có mô tả';}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}

function nm(i){
    if(!i)return null;
    return{name:i.name||i.title||'',origin_name:i.origin_name||'',slug:i.slug||'',
        poster_url:i.poster_url||i.poster||'',thumb_url:i.thumb_url||i.thumb||'',
        year:i.year||'',quality:i.quality||'',episode_current:i.episode_current||'',
        tmdb:i.tmdb||{},category:Array.isArray(i.category)?i.category:[],
        director:i.director||'',content:i.content||'',time:i.time||'',
        episode_total:i.episode_total||'',type:i.type||''};
}
function dType(d){if(d&&d.tmdb&&d.tmdb.type==='tv')return'tv';if(d&&d.tmdb&&d.tmdb.type==='movie')return'movie';if(d&&(d.type==='series'||d.type==='tvshows'||d.type==='hoathinh'))return'tv';if(d&&d.episode_total&&d.episode_total!=='1')return'tv';return'movie';}
function gTid(d){return(d&&d.tmdb&&d.tmdb.id)?d.tmdb.id:null;}
function gEp1(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}
function pLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}
function cTio(raw){if(!raw)return'';raw=String(raw).trim();if(!raw)return'';var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];m=raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);if(m)return m[1].replace(/\/+$/,'');m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];if(raw.indexOf('torrentio.strem.fun')>-1){raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');return'';}raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');return raw.indexOf('=')===-1?'':raw;}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}

function bE(el,fn){
    var sx=0,sy=0,mv=false,tc=false;
    el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
    el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
    el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
}
function eScr(scroll){var el=scroll.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});}
function cScr(scroll){try{scroll.render().find('.scroll__body').empty();}catch(e){}}
function aCtrl(scroll){
    Lampa.Controller.add('content',{
        toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},
        left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
        right:function(){Navigator.move('right');},
        up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
        down:function(){Navigator.move('down');},
        back:function(){Lampa.Activity.backward();}
    });
    setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);
}
function oSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'Tìm kiếm',component:'kkphim_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm TMDB',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm TMDB:'));}

/* ════ STREAM PARSING ════ */
function pStream(st){
    var rawName=String(st.name||'');var rawDesc=String(st.description||'');var rawTitle=String(st.title||'');var rawAll=rawName+'\n'+rawDesc+'\n'+rawTitle;
    var name=rawName.split('\n')[0].trim()||rawTitle.split('\n')[0].trim()||'?';
    var qual='';var qm=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(qm)qual=qm[1].toUpperCase();
    var size='';var sP=[/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,/\b([\d.,]+)\s*(TB)\b/i,/\b([\d.,]+)\s*(GB|GiB)\b/i,/\b([\d.,]+)\s*(MB|MiB)\b/i];
    for(var i=0;i<sP.length;i++){var sm=rawAll.match(sP[i]);if(sm){size=sm[2]?sm[1]+' '+sm[2]:sm[1].trim();break;}}
    var seeds='';var sdP=[/👤\s*(?:Seeders?:?\s*)?(\d+)/i,/Seeders?:?\s*(\d+)/i,/(\d+)\s*seed/i];
    for(var j=0;j<sdP.length;j++){var se=rawAll.match(sdP[j]);if(se){seeds=se[1];break;}}
    var source='';var srP=[/🔗\s*(?:Source:?\s*)?([\w\.\-]+)/i,/Source:?\s*([\w\.\-]+)/i,/\[([A-Z0-9\-]+)\]/];
    for(var k=0;k<srP.length;k++){var srm=rawAll.match(srP[k]);if(srm){source=srm[1];break;}}
    var filename='';var fnm=rawAll.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();
    if(st.behaviorHints&&typeof st.behaviorHints==='object'){
        var bh=st.behaviorHints;
        if(!filename&&bh.filename)filename=String(bh.filename).trim();
        if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}
        if(bh.bingeGroup){var bg=String(bh.bingeGroup);if(!qual){var bqm=bg.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(bqm)qual=bqm[1].toUpperCase();}}
        if(!qual&&filename){var fqm=filename.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(fqm)qual=fqm[1].toUpperCase();}
    }
    return{name:name,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual,source:source,filename:filename,rawName:rawName,rawDesc:rawDesc,rawTitle:rawTitle};
}
function fmtStream(s){
    var line1=s.name;if(s.quality&&line1.toUpperCase().indexOf(s.quality)===-1)line1+=' ['+s.quality+']';
    var meta=[];if(s.size)meta.push('💾 '+s.size);if(s.seeds)meta.push('👤 '+s.seeds);if(s.source)meta.push('🔗 '+s.source);
    var result=line1;if(meta.length)result+='\n'+meta.join('  ');
    if(s.filename){var fn=s.filename.length>60?s.filename.substring(0,60)+'...':s.filename;result+='\n📁 '+fn;}
    return result;
}

/* 🆕 TMDB fetch với cache */
async function tFetch(path){
    var key = 'tmdb:' + path;
    return cachedFetch(key, function() {
        return fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}})
            .then(function(r){if(!r.ok)throw new Error('TMDB '+r.status);return r.json();});
    });
}
async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSeasons(id){try{var r=await tFetch('/tv/'+id+'?language='+tmLang());if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
async function lGenres(type){if(_gc[type])return _gc[type];try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}}
async function tPersonC(pid){try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}}
var TFN={
    trending:function(p){return tFetch('/trending/all/week?language='+tmLang()+'&page='+p);},
    trending_day:function(p){return tFetch('/trending/all/day?language='+tmLang()+'&page='+p);},
    popular_movies:function(p){return tFetch('/movie/popular?language='+tmLang()+'&page='+p);},
    popular_tv:function(p){return tFetch('/tv/popular?language='+tmLang()+'&page='+p);},
    top_movies:function(p){return tFetch('/movie/top_rated?language='+tmLang()+'&page='+p);},
    top_tv:function(p){return tFetch('/tv/top_rated?language='+tmLang()+'&page='+p);},
    now_playing:function(p){return tFetch('/movie/now_playing?language='+tmLang()+'&page='+p);},
    upcoming:function(p){return tFetch('/movie/upcoming?language='+tmLang()+'&page='+p);},
    airing_today:function(p){return tFetch('/tv/airing_today?language='+tmLang()+'&page='+p);},
    on_the_air:function(p){return tFetch('/tv/on_the_air?language='+tmLang()+'&page='+p);}
};
async function tSearchM(q,p){return await tFetch('/search/multi?language='+tmLang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));}
async function tDetFull(type,id){return await tFetch('/'+type+'/'+id+'?language='+tmLang()+'&append_to_response=credits,images,similar,external_ids');}
async function tImgFull(type,id){return await tFetch('/'+type+'/'+id+'/images');}
async function tDiscover(type,gid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tSimilar(type,id,p){return await tFetch('/'+type+'/'+id+'/similar?language='+tmLang()+'&page='+(p||1));}
async function tRec(type,id,p){return await tFetch('/'+type+'/'+id+'/recommendations?language='+tmLang()+'&page='+(p||1));}
async function tRand(type){return await tFetch('/'+type+'/popular?language='+tmLang()+'&page='+(Math.floor(Math.random()*10)+1));}
function tNorm(item){if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',poster_url:item.poster_path?TMDB_W500+item.poster_path:'',year:(item.release_date||item.first_air_date||'').slice(0,4),vote:item.vote_average?Number(item.vote_average).toFixed(1):''};}

async function sSrc(source,kw){try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}
function mBest(items,title,orig,year){if(!items||!items.length)return null;var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var n1=nStr(items[i].name||items[i].title||''),n2=nStr(items[i].origin_name||items[i].original_name||'');if((nT&&(n1===nT||n2===nT))||(nO&&(n1===nO||n2===nO))){if(!year||!items[i].year||String(items[i].year)===String(year))return items[i];}}for(var j=0;j<items.length;j++){var m1=nStr(items[j].name||items[j].title||''),m2=nStr(items[j].origin_name||items[j].original_name||'');if((nT&&(m1.indexOf(nT)>-1||nT.indexOf(m1)>-1))||(nO&&(m2.indexOf(nO)>-1||nO.indexOf(m2)>-1))){if(!year||!items[j].year||String(items[j].year)===String(year))return items[j];}}return null;}
async function fSlugs(title,orig,year){var r={kkphim:null,ophim:null},terms=[title];if(orig&&orig!==title)terms.push(orig);for(var i=0;i<terms.length;i++){if(!r.kkphim){var f1=mBest(await sSrc(SOURCES.kkphim,terms[i]),title,orig,year);if(f1&&f1.slug)r.kkphim=f1.slug;}if(!r.ophim){var f2=mBest(await sSrc(SOURCES.ophim,terms[i]),title,orig,year);if(f2&&f2.slug)r.ophim=f2.slug;}if(r.kkphim&&r.ophim)break;}return r;}
async function fDet(source,slug){try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}
function exSn(name,slug){var m=name.match(/season\s*(\d+)/i)||name.match(/phần\s*(\d+)/i)||slug.match(/season-(\d+)/i)||slug.match(/phan-(\d+)/i)||name.match(/S(\d+)/);if(m)return parseInt(m[1]);var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;}
async function fSeasonSlugs(source,title,orig){var results=[];try{var items=await sSrc(source,title);if(!items.length&&orig)items=await sSrc(source,orig);var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var it=items[i];if(!it.slug)continue;var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');var match=false;if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;if(!match&&results.length>0){var bs=nStr(results[0].slug),cs=nStr(it.slug);if(cs.indexOf(bs)>-1||bs.indexOf(cs)>-1)match=true;}if(match)results.push({slug:it.slug,name:it.name||it.title||'',season:exSn(it.name||it.title||'',it.slug||''),source:source});}}catch(e){}return results;}

function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){var m='magnet:?xt=urn:btih:'+h;['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){m+='&tr='+encodeURIComponent(t);});return m;}
async function playTS(stream,title,poster,fi){
    if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}
    Lampa.Noty.show('Gửi TS...');
    try{
        var u=tsU('/torrents');
        var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});
        if(!r.ok)throw new Error('TS:'+r.status);
        var td=await r.json();var hash=td.hash||stream.infoHash;
        await dly(2000);
        var info=null,rt=0;
        while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}
        var files=[];
        if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
        if(!files.length)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index=0&play')});
        else if(files.length===1)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play')});
        else if(fi!==undefined&&fi!==null&&fi>=0)Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play')});
        else{Lampa.Select.show({title:'Chọn file',items:files.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f};}),onSelect:function(a){Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play')});},onBack:function(){Lampa.Controller.toggle('content');}});}
    }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}
async function fStreams(type,imdb,s,e){var eng=tEngine(),url;if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}else{url=tioU(type,imdb,s,e);}var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);var d=await r.json();return(d.streams||[]).map(pStream);}
function showStr(streams,title,poster){
    var ts=!!tsHost(),eng=tEngine()==='aio'?'AIO':'Torrent';
    Lampa.Select.show({title:eng+': '+title+' ('+streams.length+')'+(ts?' → TS':''),items:streams.slice(0,40).map(function(s){return{title:fmtStream(s),value:s};}),onSelect:function(a){var s=a.value;if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);else if(s.url)Lampa.Player.play({title:title,url:s.url});else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TS!':'Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});
}
async function oTorMov(tid,title,poster,imdb){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có stream');return;}showStr(st,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

/* ══ CARDS ══ */
function mkC(item){
    var n=nm(item);if(!n)return $('<div></div>');
    var p=fImg(n.poster_url||n.thumb_url);
    var h='<div class="kk-card selector"><div class="kk-card-img">';
    h += p ? mkImg(p, n.name, 'kk-card-img-el') : '<div class="kk-card-noposter"><span>No Poster</span></div>';
    if(n.quality)h+='<div class="kk-card-q">'+E(n.quality)+'</div>';
    if(n.episode_current)h+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';
    h+='</div><div class="kk-card-body"><div class="kk-card-name">'+E(n.name)+'</div>';
    if(n.origin_name&&n.origin_name!==n.name)h+='<div class="kk-card-origin">'+E(n.origin_name)+'</div>';
    h+='<div class="kk-card-meta">';
    if(n.year)h+='<span class="kk-card-year">'+E(n.year)+'</span>';
    if(n.time)h+='<span class="kk-card-time">'+E(n.time)+'</span>';
    if(n.episode_total&&n.episode_total!=='1')h+='<span class="kk-card-eps">'+E(n.episode_total)+' tập</span>';
    h+='</div>';
    if(n.category&&n.category.length){var cats=n.category.slice(0,2).map(function(c){return E(c.name||'');}).join(' · ');h+='<div class="kk-card-cats">'+cats+'</div>';}
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){if(n.slug){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});
    return c;
}
function mkTC(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var img = d.poster_url ? mkImg(d.poster_url, d.name, 'kk-card-img-el') : '<div class="kk-card-noposter"><span>No Poster</span></div>';
    var typeLabel=d.media_type==='tv'?'TV':'Film';
    var lang=item.original_language?item.original_language.toUpperCase():'';
    var origName=item.original_title||item.original_name||'';
    var overview=item.overview?item.overview.substring(0,80)+'…':'';
    var h='<div class="kk-card selector"><div class="kk-card-img">'+img;
    if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';
    h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div>';
    h+='</div><div class="kk-card-body"><div class="kk-card-name">'+E(d.name)+'</div>';
    if(origName&&origName!==d.name)h+='<div class="kk-card-origin">'+E(origName)+'</div>';
    h+='<div class="kk-card-meta">';
    if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
    if(lang)h+='<span class="kk-card-lang">'+lang+'</span>';
    h+='</div>';
    if(overview)h+='<div class="kk-card-overview">'+E(overview)+'</div>';
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return c;
}
function mkTCH(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var backdrop=item.backdrop_path?TMDB_W500+item.backdrop_path:(d.poster_url||'');
    var imgH = backdrop ? mkImg(backdrop, d.name, 'kk-card-h-img-el') : '<div class="kk-card-h-noposter"><span>No Image</span></div>';
    var typeLabel=d.media_type==='tv'?'TV':'Film';
    var lang=item.original_language?item.original_language.toUpperCase():'';
    var origName=item.original_title||item.original_name||'';
    var overview=item.overview?item.overview.substring(0,60)+'…':'';
    var h='<div class="kk-card-h selector"><div class="kk-card-h-img">'+imgH;
    if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';
    h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div>';
    h+='</div><div class="kk-card-h-body"><div class="kk-card-name">'+E(d.name)+'</div>';
    if(origName&&origName!==d.name)h+='<div class="kk-card-origin">'+E(origName)+'</div>';
    h+='<div class="kk-card-meta">';
    if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
    if(lang)h+='<span class="kk-card-lang">'+lang+'</span>';
    h+='</div>';
    if(overview)h+='<div class="kk-card-overview">'+E(overview)+'</div>';
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return c;
}
function mkCH(item){
    var n=nm(item);if(!n)return $('<div></div>');
    var p=fImg(n.thumb_url||n.poster_url);
    var h='<div class="kk-card-h selector"><div class="kk-card-h-img">';
    h += p ? mkImg(p, n.name, 'kk-card-h-img-el') : '<div class="kk-card-h-noposter"><span>No Image</span></div>';
    if(n.quality)h+='<div class="kk-card-q">'+E(n.quality)+'</div>';
    if(n.episode_current)h+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';
    h+='</div><div class="kk-card-h-body"><div class="kk-card-name">'+E(n.name)+'</div>';
    if(n.origin_name&&n.origin_name!==n.name)h+='<div class="kk-card-origin">'+E(n.origin_name)+'</div>';
    h+='<div class="kk-card-meta">';
    if(n.year)h+='<span class="kk-card-year">'+E(n.year)+'</span>';
    if(n.time)h+='<span class="kk-card-time">'+E(n.time)+'</span>';
    if(n.episode_total&&n.episode_total!=='1')h+='<span class="kk-card-eps">'+E(n.episode_total)+' tập</span>';
    h+='</div>';
    if(n.category&&n.category.length){var cats=n.category.slice(0,2).map(function(c){return E(c.name||'');}).join(' · ');h+='<div class="kk-card-overview">'+cats+'</div>';}
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){if(n.slug){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});
    return c;
}
function mkPFC(item){
    var n=nm(item);if(!n||!n.slug)return $('<div></div>');
    var bk=fImg(n.thumb_url||n.poster_url),ps=fImg(n.poster_url||n.thumb_url);
    var typeLabel=n.type==='series'||n.type==='tvshows'?'Series':'Phim';
    var card=$('<div class="kk-pfc selector"></div>');
    var bgImg = bk ? mkImg(bk, n.name, 'kk-pfc-bg-img') : '<div class="kk-pfc-bg-empty"></div>';
    var psImg = ps ? '<div class="kk-pfc-poster">'+mkImg(ps, n.name, 'kk-pfc-poster-img')+'</div>' : '<div class="kk-pfc-poster kk-pfc-poster--empty"></div>';
    card.html('<div class="kk-pfc-bg">'+bgImg+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+psImg+'<div class="kk-pfc-info"><div class="kk-pfc-badge">'+E(typeLabel)+'</div><div class="kk-pfc-title">'+E(n.name)+'</div>'+(n.origin_name&&n.origin_name!==n.name?'<div class="kk-pfc-origin">'+E(n.origin_name)+'</div>':'')+'<div class="kk-pfc-meta">'+(n.year?'<span class="kk-pfc-year">'+E(n.year)+'</span>':'')+(n.quality?'<span class="kk-pfc-qual">'+E(n.quality)+'</span>':'')+(n.episode_current?'<span class="kk-pfc-eps">'+E(n.episode_current)+'</span>':'')+'</div>'+(n.content?'<div class="kk-pfc-desc">'+E(cDesc(n.content).substring(0,100))+'…</div>':'')+'</div></div>');
    bE(card,function(){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});
    return card;
}
function mkTCPF(item){
    var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');
    var bk=item.backdrop_path?TMDB_W500+item.backdrop_path:(d.poster_url||''),ps=d.poster_url||'';
    var vote=item.vote_average?Number(item.vote_average).toFixed(1):'',vNum=Number(vote);
    var vClass=vNum>=7?'high':vNum>=5?'mid':'low';
    var origName=item.original_title||item.original_name||'',lang=item.original_language?item.original_language.toUpperCase():'';
    var overview=item.overview?item.overview.substring(0,100)+'…':'',typeLabel=d.media_type==='tv'?'TV Series':'Film';
    var card=$('<div class="kk-pfc selector"></div>');
    var bgImg = bk ? mkImg(bk, d.name, 'kk-pfc-bg-img') : '<div class="kk-pfc-bg-empty"></div>';
    var psImg = ps ? '<div class="kk-pfc-poster">'+mkImg(ps, d.name, 'kk-pfc-poster-img')+'</div>' : '<div class="kk-pfc-poster kk-pfc-poster--empty"></div>';
    card.html('<div class="kk-pfc-bg">'+bgImg+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+psImg+'<div class="kk-pfc-info"><div class="kk-pfc-badge">'+E(typeLabel)+'</div><div class="kk-pfc-title">'+E(d.name)+'</div>'+(origName&&origName!==d.name?'<div class="kk-pfc-origin">'+E(origName)+'</div>':'')+'<div class="kk-pfc-meta">'+(d.year?'<span class="kk-pfc-year">'+E(d.year)+'</span>':'')+(lang?'<span class="kk-pfc-lang">'+lang+'</span>':'')+(vote?'<span class="kk-pfc-vote kk-pfc-vote--'+vClass+'">⭐ '+vote+'</span>':'')+'</div>'+(overview?'<div class="kk-pfc-desc">'+E(overview)+'</div>':'')+'</div></div>');
    bE(card,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});
    return card;
}
function mkCWCard(item){
    var n=nm(item);if(!n)return $('<div></div>');
    var p=fImg(n.thumb_url||n.poster_url);
    var ep=item.ep_name||item.episode_current||'Tiếp tục xem';
    var h='<div class="kk-card-h selector"><div class="kk-card-h-img">';
    h += p ? mkImg(p, n.name, 'kk-card-h-img-el') : '<div class="kk-card-h-noposter"><span>No Image</span></div>';
    h+='</div><div class="kk-card-h-body"><div class="kk-card-name">'+E(n.name)+'</div>';
    if(n.origin_name&&n.origin_name!==n.name)h+='<div class="kk-card-origin">'+E(n.origin_name)+'</div>';
    h+='<div class="kk-card-meta"><span class="kk-card-time">▶ '+E(ep)+'</span></div>';
    h+='<div class="kk-card-overview">Nhấn để tiếp tục xem</div>';
    h+='</div></div>';
    var c=$(h);
    bE(c,function(){
        if(item.ep_link)Lampa.Player.play({title:(n.name||'')+' - '+ep,url:item.ep_link});
        else if(n.slug)Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});
    });
    return c;
}
function mkRowList(items,isKK){
    var cm=cardMode();
    var rl=$('<div class="kk-row-list"></div>');
    if(cm==='poster'){
        items.forEach(function(i){rl.append(isKK?mkPFC(i):mkTCPF(i));});
    } else {
        items.forEach(function(i){rl.append(isKK?mkCH(i):mkTCH(i));});
    }
    return rl;
}
function mkCWRow(items){
    var rl=$('<div class="kk-row-list"></div>');
    items.forEach(function(i){rl.append(mkCWCard(i));});
    return rl;
}
function mkCatGrid(items,isKK){
    var cm=catMode();
    if(cm==='hgrid'){
        var grid=$('<div class="kk-grid kk-grid--cat-h"></div>');
        items.forEach(function(i){
            var card=isKK?mkCH(i):mkTCH(i);
            card.addClass('kk-card--grid');
            grid.append(card);
        });
        return grid;
    } else {
        var grid2=$('<div class="kk-grid"></div>');
        grid2.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');
        items.forEach(function(i){
            var card=isKK?mkC(i):mkTC(i);
            card.addClass('kk-card--grid');
            grid2.append(card);
        });
        return grid2;
    }
}
function mkCastList(castArr,hasTmdb){
    var list=$('<div class="kk-cast-list"></div>');
    castArr.forEach(function(c){
        var av = c.profile_path ? mkImg(TMDB_W500 + c.profile_path, c.name, 'kk-cast-avatar') : '<div class="kk-cast-empty"></div>';
        var card;
        if(hasTmdb&&c.id){card=$('<div class="kk-cast-card selector" data-pid="'+c.id+'"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');bE(card,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});}
        else{card=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');}
        list.append(card);
    });
    return list;
}
function mkDirHtml(dirs,isTmdb){
    if(!dirs||!dirs.length)return'';
    var first=dirs[0],rest=dirs.slice(1);
    var avatarH=first.profile_path?'<div class="kk-crew-avatar"><img src="'+TMDB_W500+first.profile_path+'" loading="lazy" onerror="this.onerror=null;this.src=\''+IMG_PLACEHOLDER+'\'"></div>':'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';
    var nameH=(isTmdb&&first.id)?'<span class="kk-crew-name selector" data-pid="'+first.id+'">'+E(first.name||'')+'</span>':'<span class="kk-crew-name">'+E(first.name||'')+'</span>';
    var restH='';
    if(rest.length){var restNames=rest.map(function(c){return(isTmdb&&c.id)?'<span class="kk-crew-rest-name selector" data-pid="'+c.id+'">'+E(c.name||'')+'</span>':'<span class="kk-crew-rest-name">'+E(c.name||'')+'</span>';});restH='<div class="kk-crew-rest">'+restNames.join('')+'</div>';}
    return'<div class="kk-crew">'+avatarH+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+nameH+'<span class="kk-crew-role">'+E(first.job||'Director')+'</span>'+restH+'</div></div>';
}
function bindDirClicks(el){el.find('.kk-crew-name[data-pid],.kk-crew-rest-name[data-pid]').each(function(){var sp=$(this);bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});});}
function gHtml(genres,isTmdb){
    if(!genres||!genres.length)return'';
    var result='';
    for(var i=0;i<genres.length;i++){var g=genres[i];if(!g)continue;var gname=E(g.name||'');if(isTmdb)result+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gname+'">'+gname+'</span>';else result+='<span class="kk-genre selector" data-slug="'+E(g.slug||'')+'" data-title="'+E(g.name||'')+'">'+gname+'</span>';}
    return result;
}
function mkHero(bk,ps,logoH,tH,origin,extra){
    extra=extra||{};
    var posterH = ps ? mkImg(ps, origin || '', 'kk-hero-poster-img') : '';
    var bkImg = bk ? mkImg(bk, origin || '', 'kk-hero-backdrop-img') : '<div class="kk-hero-backdrop-empty"></div>';
    return $('<div class="kk-hero">'+
        '<div class="kk-hero-backdrop">'+bkImg+'</div>'+
        '<div class="kk-hero-card">'+
            '<div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+posterH+'</div></div>'+
            '<div class="kk-hero-meta">'+
                (extra.year||extra.country?'<div class="kk-hm-yc">'+(extra.year?'<span class="kk-hm-year">'+E(extra.year)+'</span>':'')+(extra.country?'<span class="kk-hm-country">'+E(extra.country)+'</span>':'')+'</div>':'')+
                (logoH||tH)+
                (extra.tagline?'<div class="kk-hm-tagline">'+E(extra.tagline)+'</div>':'')+
                '<div class="kk-hm-badges">'+(extra.vote?'<span class="kk-hm-vote">'+E(extra.vote)+' <small>TMDB</small></span>':'')+(extra.rated?'<span class="kk-hm-badge">'+E(extra.rated)+'</span>':'')+(extra.status?'<span class="kk-hm-badge">'+E(extra.status)+'</span>':'')+'</div>'+
                (extra.runtime||extra.genres?'<div class="kk-hm-rtg">'+(extra.runtime?'<span class="kk-hm-rt">'+E(extra.runtime)+'</span>':'')+(extra.runtime&&extra.genres?'<span class="kk-hm-dot">•</span>':'')+(extra.genres?'<span class="kk-hm-genres">'+E(extra.genres)+'</span>':'')+'</div>':'')+
            '</div>'+
        '</div>'+
    '</div>');
}
function mkBody(v,y,rt,extra,genreHtml,crewH,desc){
    return $('<div class="kk-body"><div class="kk-body-genres">'+genreHtml+'</div>'+crewH+'<div class="kk-body-desc"><span class="kk-body-desc-label">Nội dung</span><div class="kk-body-desc-text">'+fTxt(desc)+'</div></div></div>');
}

/* 🆕 CSS lazy load + aspect-ratio */
function inCSS(){
    if($('#kk-css').length)return;
    var l=document.createElement('link');l.id='kk-css';l.rel='preload';l.as='style';l.href=CSS_URL;
    l.onload=function(){this.rel='stylesheet';};
    document.head.appendChild(l);
    // Inject inline CSS cho aspect-ratio & placeholder
    var css='@media(prefers-reduced-motion:no-preference){.kk-card-img,.kk-card-h-img,.kk-pfc-poster{aspect-ratio:2/3;background:#1a1a2e;contain:layout}}.kk-card-img img,.kk-card-h-img img,.kk-pfc-poster img,.kk-hero-poster-img,.kk-hero-backdrop-img{width:100%;height:100%;object-fit:cover;transition:opacity .2s ease}.kk-card-img img:not([src]),.kk-card-img img[src=""]{opacity:0}';
    $('head').append('<style id="kk-inline-css">'+css+'</style>');
}

function addM(){
    function ins(){
        if($('.menu__item[data-action="kkphim"]').length)return;
        var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');
        bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});
        $('.menu .menu__list').first().append(m);
    }
    setTimeout(ins,500);
    Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});
}

/* 🆕 Hàm render batch với DocumentFragment */
function renderCardsBatch(items, isKK, gridEl) {
    var fragment = document.createDocumentFragment();
    var temp = $('<div></div>');
    var cm = catMode();
    for (var i = 0; i < items.length; i++) {
        var card = cm === 'hgrid' ? (isKK ? mkCH(items[i]) : mkTCH(items[i])) : (isKK ? mkC(items[i]) : mkTC(items[i]));
        card.addClass('kk-card--grid');
        temp.append(card);
    }
    // Append 1 lần duy nhất → giảm reflow
    gridEl.append(temp.children());
}

/* 🆕 Setup infinite scroll với debounce */
function setupInfiniteScroll(sb, loadFn, threshold) {
    threshold = threshold || 400;
    var scrollTimer = null, ticking = false;
    sb.on('scroll', function() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function() {
            var el = sb[0];
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
                loadFn();
            }
            ticking = false;
        });
    });
}

function mkGridInfinite(name,fetchFn,titleFn,isKK){
    Lampa.Component.add(name,function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1;
        var wrap=$('<div class="kk-grid-wrap"></div>');
        var titleEl=$('<div class="kk-grid-title">'+E(titleFn(obj))+'</div>');
        var gridContainer=$('<div></div>');
        var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
        var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
        var ld=false,done=false;
        var curGrid=null;
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            wrap.append(titleEl).append(gridContainer).append(spinner).append(endMsg);
            scroll.append(wrap);
            initGrid();
            var sb=scroll.render().find('.scroll__body');
            // 🆕 Dùng debounce scroll
            setupInfiniteScroll(sb, doL);
            doL();
        };
        function initGrid(){
            var cm=catMode();
            if(cm==='hgrid'){
                curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
            } else {
                curGrid=$('<div class="kk-grid"></div>');
                curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');
            }
            gridContainer.empty().append(curGrid);
        }
        function doL(){
            if(ld||done)return;
            ld=true;spinner.show();
            fetchFn(obj,page).then(function(items){
                spinner.hide();
                if(!items.length){
                    done=true;
                    endMsg.show().text(page<=1?'Không có kết quả':'Đã hết');
                }else{
                    // 🆕 Render batch thay vì append từng cái
                    renderCardsBatch(items, isKK, curGrid);
                    page++;
                }
                ld=false;
                comp.activity.loader(false);
                comp.start();
            }).catch(function(){
                ld=false;spinner.hide();
                endMsg.show().text('Lỗi tải');
                comp.activity.loader(false);
            });
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};
        this.pause=function(){};
        this.stop=function(){};
        this.render=function(){return scroll.render();};
        this.destroy=function(){scroll.destroy();};
    });
}

/* ════ COMPONENTS ════ */
/* ... (các component settings, person, main, tmdb_main, category, search, detail giữ nguyên) ... */
/* Chỉ cần thay các hàm mkC, mkTC, mkCH, mkTCH, mkPFC, mkTCPF, mkHero đã được patch ở trên */

/* 🆕 Hàm startPlugin giữ nguyên, chỉ thêm preload ảnh khi vào detail */
function startPlugin(){
    inCSS();
    applyFontScale();
    addM();

    /* ── SETTINGS ── */
    Lampa.Component.add('kkphim_settings',function(){
        // ... giữ nguyên code settings ...
        // (do dài quá nên mình lược bớt, bạn giữ nguyên phần này từ code gốc)
    });

    /* ── PERSON ── */
    Lampa.Component.add('kkphim_person',function(obj){
        // ... giữ nguyên ...
    });

    Lampa.Component.add('kkphim_person_films',function(obj){
        // ... giữ nguyên ...
    });

    /* ── MAIN ── */
    Lampa.Component.add('kkphim_main',function(){
        // ... giữ nguyên ...
        // Lưu ý: trong phần fetch cats, có thể giảm cnt ban đầu:
        // var cnt = cm === 'poster' ? 12 : Math.min(rowCount(), 15);
    });

    /* ── TMDB MAIN ── */
    Lampa.Component.add('kkphim_tmdb_main',function(){
        // ... giữ nguyên ...
    });

    mkGridInfinite('kkphim_tmdb_list',function(obj,page){
        var fn=TFN[obj.listType]||TFN.trending;
        return fn(page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});
    },function(obj){return obj.title||'TMDB';},false);

    mkGridInfinite('kkphim_tmdb_search',function(obj,page){
        return tSearchM(obj.keyword||'',page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});
    },function(obj){return'🔍 '+(obj.keyword||'');},false);

    /* ── TMDB GENRE ── */
    Lampa.Component.add('kkphim_tmdb_genre',function(obj){
        // ... giữ nguyên ...
    });

    /* ── TMDB DETAIL ── */
    Lampa.Component.add('kkphim_tmdb_detail',function(obj){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.media_type||'movie';
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);if(!tid){comp.activity.loader(false);comp.start();return;}
            tDetFull(mt,tid).then(async function(tmdb){
                var logos=null;try{logos=await tImgFull(mt,tid);}catch(e){}
                var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
                Lampa.Noty.show('Tìm nguồn...');var slugs=await fSlugs(t,o,y);
                // 🆕 Preload ảnh hero/poster
                if(tmdb.backdrop_path) preloadImg(TMDB_IMG + tmdb.backdrop_path);
                if(tmdb.poster_path) preloadImg(TMDB_W500 + tmdb.poster_path);
                bDet(tmdb,logos,slugs);
            }).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});
        };
        async function bDet(tmdb,logos,slugs){
            // ... giữ nguyên logic bDet, chỉ cần dùng mkImg/mkHero đã patch ...
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    /* ── CATEGORY ── */
    Lampa.Component.add('kkphim_category',function(obj){
        // ... giữ nguyên ...
    });

    /* ── SEARCH ── */
    Lampa.Component.add('kkphim_search',function(obj){
        // ... giữ nguyên ...
    });

    /* ── DETAIL ── */
    Lampa.Component.add('kkphim_detail',function(obj){
        var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),movie=nm(obj.movie),comp=this,rnd=false;
        this.create=function(){
            this.activity.loader(true);cScr(scroll);rnd=false;
            if(!movie||!movie.slug){this.activity.loader(false);comp.start();return;}
            saveHistory(movie);
            net.silent(sApi()+'phim/'+movie.slug,function(res){if(rnd)return;ldAll(nm(res.movie||res||{}),res.episodes||[]);},function(){comp.activity.loader(false);});
        };
        async function ldAll(data,eps){
            if(!data||!data.slug)data=movie;
            saveHistory(data);
            try{
                var tid=gTid(data),tt=dType(data),tmdb=null,logos=null;
                if(tid){try{tmdb=await tFetch('/'+tt+'/'+tid+'?language='+tmLang()+'&append_to_response=credits,images');}catch(e){}try{logos=await tFetch('/'+tt+'/'+tid+'/images');}catch(e){}}
                if(!rnd){
                    // 🆕 Preload ảnh quan trọng
                    var bk=fImg(data.thumb_url||data.poster_url),ps=fImg(data.poster_url||data.thumb_url);
                    if(bk) preloadImg(bk); if(ps) preloadImg(ps);
                    bld(data,eps,tmdb,logos,tt);rnd=true;}
            }catch(e){
                if(!rnd){bld(data,eps,null,null,dType(data));rnd=true;}
            }
            comp.activity.loader(false);comp.start();
        }
        function bld(data,eps,tmdb,logos,tt){
            // ... giữ nguyên, chỉ cần dùng mkImg/mkHero đã patch ...
        }
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};
    });
}

if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});
})();