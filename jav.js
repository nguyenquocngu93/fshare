/* KKPhim Plugin v4.4.0 - Production Companies & Tags with Infinite Scroll */
(function(){
'use strict';
if(window.__kkphim_plugin_started)return;
window.__kkphim_plugin_started=true;

var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};

var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/original';
var TMDB_W500='https://image.tmdb.org/t/p/w500';
var TMDB_W200='https://image.tmdb.org/t/p/w200';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};
var HIST_KEY='kkphim_history';

function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}

function isSourceEnabled(key){var s=ls();if(s['source_'+key+'_enabled']===undefined)return true;return s['source_'+key+'_enabled']===true;}
function getEnabledSources(){var r={};Object.keys(SOURCES).forEach(function(k){if(isSourceEnabled(k))r[k]=SOURCES[k];});return r;}

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
function hgridCols(){return 2;}

function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(e){return[];}}
function setHist(v){try{localStorage.setItem(HIST_KEY,JSON.stringify(v||[]));}catch(e){}}

function saveHistory(item){
    try{
        if(!item||!item.tmdb_id)return;
        var arr=getHist();var id='tmdb_'+item.tmdb_id+'_'+item.media_type;
        arr=arr.filter(function(x){return x.id!==id;});
        arr.unshift({id:id,tmdb_id:item.tmdb_id,media_type:item.media_type,name:item.name||item.title||'',poster_url:item.poster_url||'',year:item.year||'',origin_name:item.origin_name||'',time:Date.now()});
        if(arr.length>50)arr=arr.slice(0,50);setHist(arr);
    }catch(e){}
}
function lastHistory(){var h=getHist();return h&&h.length?h[0]:null;}

function applyFontScale(){
    var id='kkphim-font-scale';$('#'+id).remove();var fs=fontScale();
    if(!fs||fs===100)return;
    var css='.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-person-header,.kk-person-bio,.kk-actions,.kk-section,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}'
    +'.kk-card-name,.kk-pfc-title,.kk-title,.kk-row-title,.kk-grid-title,.kk-block-title,.kk-person-name,.kk-stg-title{font-size:calc(1em * 1.06)!important;}'
    +'.kk-card-origin,.kk-card-meta,.kk-card-cats,.kk-card-overview,.kk-pfc-origin,.kk-pfc-meta,.kk-pfc-desc,.kk-body-desc-text,.kk-stg-label-desc{font-size:calc(1em * 0.92)!important;}';
    $('head').append('<style id="'+id+'">'+css+'</style>');
}

function fImg(u,src){if(!u)return'';if(u.indexOf('http')===0)return u;var b=src?src.img:SOURCES.kkphim.img;return b?b+u:u;}
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}
function gEp1(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}
function pLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}
function cTio(raw){if(!raw)return'';raw=String(raw).trim();if(!raw)return'';var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];m=raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);if(m)return m[1].replace(/\/+$/,'');m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];if(raw.indexOf('torrentio.strem.fun')>-1){raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');return'';}raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');return raw.indexOf('=')===-1?'':raw;}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}

function copyToClipboard(text){
    if(!text)return false;
    try{
        if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(text).then(function(){}).catch(function(){});
            return true;
        }
        var ta=document.createElement('textarea');
        ta.value=text;
        ta.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus();ta.select();
        var ok=document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    }catch(e){return false;}
}

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
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}

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
        var bh=st.behaviorHints;if(!filename&&bh.filename)filename=String(bh.filename).trim();
        if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}
        if(bh.bingeGroup){var bg=String(bh.bingeGroup);if(!qual){var bqm=bg.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(bqm)qual=bqm[1].toUpperCase();}}
        if(!qual&&filename){var fqm=filename.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(fqm)qual=fqm[1].toUpperCase();}
    }
    return{name:name,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual,source:source,filename:filename,rawName:rawName,rawDesc:rawDesc,rawTitle:rawTitle};
}

function fmtStream(s){
    var parts=[];
    var line1=s.name;
    if(s.quality&&line1.toUpperCase().indexOf(s.quality)===-1)line1+=' ['+s.quality+']';
    parts.push(line1);
    var meta=[];
    if(s.size)meta.push('💾 '+s.size);
    if(s.seeds)meta.push('👤 '+s.seeds);
    if(s.source)meta.push('🔗 '+s.source);
    if(meta.length)parts.push(meta.join('  '));
    if(s.filename)parts.push('📁 '+s.filename);
    return parts.join('\n');
}

async function tFetch(path){var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}
async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSeasons(id){try{var r=await tFetch('/tv/'+id+'?language='+tmLang());if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
async function lGenres(type){if(_gc[type])return _gc[type];try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}}
async function tPersonC(pid){try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}}

// NEW: Fetch keywords for a movie/tv
async function tKeywords(type,id){
    try{
        var path=type==='tv'?'/tv/'+id+'/keywords':'/movie/'+id+'/keywords';
        var r=await tFetch(path);
        return r.keywords||r.results||[];
    }catch(e){return[];}
}

// NEW: Discover by company
async function tDiscoverCompany(type,companyId,p){
    return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_companies='+companyId+'&page='+(p||1));
}

// NEW: Discover by keyword
async function tDiscoverKeyword(type,keywordId,p){
    return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_keywords='+keywordId+'&page='+(p||1));
}

// NEW: Company details
async function tCompanyDetail(companyId){
    try{return await tFetch('/company/'+companyId);}catch(e){return null;}
}

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
async function tRec(type,id,p){return await tFetch('/'+type+'/'+id+'/recommendations?language='+tmLang()+'&page='+(p||1));}
async function tRand(type){return await tFetch('/'+type+'/popular?language='+tmLang()+'&page='+(Math.floor(Math.random()*10)+1));}
function tNorm(item){if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',poster_url:item.poster_path?TMDB_W500+item.poster_path:'',backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',year:(item.release_date||item.first_air_date||'').slice(0,4),vote:item.vote_average?Number(item.vote_average).toFixed(1):'',origin_name:item.original_title||item.original_name||''};}

async function sSrc(source,kw){try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}

function mScore(item,title,orig,year){
    var score=0;var nT=nStr(title),nO=nStr(orig);
    var n1=nStr(item.name||item.title||''),n2=nStr(item.origin_name||item.original_name||'');
    if(nT&&(n1===nT||n2===nT))score+=100;else if(nO&&(n1===nO||n2===nO))score+=100;
    else if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))score+=50;else if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1))score+=50;
    if(year&&item.year){var iy=parseInt(item.year),ty=parseInt(year);if(iy===ty)score+=30;else if(Math.abs(iy-ty)<=1)score+=15;}
    return score;
}
function mBest(items,title,orig,year){if(!items||!items.length)return null;var scored=items.map(function(it){return{item:it,score:mScore(it,title,orig,year)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;});return scored.length?scored[0].item:null;}

async function fSlugs(title,orig,year){
    var r={},enabledSources=getEnabledSources();var terms=[title];
    if(orig&&orig!==title)terms.push(orig);if(year){terms.push(title+' '+year);if(orig&&orig!==title)terms.push(orig+' '+year);}
    for(var i=0;i<terms.length;i++){for(var key in enabledSources){if(!r[key]){var items=await sSrc(enabledSources[key],terms[i]);var f=mBest(items,title,orig,year);if(f&&f.slug)r[key]=f.slug;}}var allFound=true;for(var k in enabledSources){if(!r[k])allFound=false;}if(allFound)break;}
    return r;
}

async function fDet(source,slug){try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}

function exSn(name,slug){
    var patterns=[/season\s*(\d+)/i,/phần\s*(\d+)/i,/mùa\s*(\d+)/i,/s(\d+)(?:\s|$|e)/i,/-season-(\d+)/i,/-phan-(\d+)/i,/(\d+)(?:st|nd|rd|th)\s*season/i];
    for(var i=0;i<patterns.length;i++){var m=(name+' '+slug).match(patterns[i]);if(m)return parseInt(m[1]);}
    var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;
}

async function fSeasonSlugs(source,title,orig,targetSeason){
    var results=[];
    try{var searchTerms=[title];if(orig&&orig!==title)searchTerms.push(orig);
    var allItems=[];for(var t=0;t<searchTerms.length;t++){var items=await sSrc(source,searchTerms[t]);allItems=allItems.concat(items);}
    var seen={};allItems=allItems.filter(function(it){if(!it.slug||seen[it.slug])return false;seen[it.slug]=true;return true;});
    var nT=nStr(title),nO=nStr(orig);
    for(var i=0;i<allItems.length;i++){var it=allItems[i];if(!it.slug)continue;var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');var match=false;
    if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;
    if(!match&&results.length>0){var bs=nStr(results[0].slug),cs=nStr(it.slug);if(cs.indexOf(bs)>-1||bs.indexOf(cs)>-1)match=true;}
    if(match){var sn=exSn(it.name||it.title||'',it.slug||'');results.push({slug:it.slug,name:it.name||it.title||'',season:sn,source:source,year:it.year||''});}}
    results.sort(function(a,b){return a.season-b.season;});
    if(targetSeason){var exact=results.filter(function(r){return r.season===targetSeason;});if(exact.length)return exact;}}catch(e){}
    return results;
}

async function findTmdbId(item,type){
    if(item.tmdb&&item.tmdb.id)return{id:item.tmdb.id,type:item.tmdb.type||type};
    var title=item.name||item.title||'',orig=item.origin_name||item.original_name||'',year=item.year||'';
    try{var searchType=type||'multi',endpoint=searchType==='multi'?'/search/multi':'/search/'+searchType;
    var res=await tFetch(endpoint+'?language='+tmLang()+'&query='+encodeURIComponent(orig||title)+'&page=1');
    var results=(res.results||[]).filter(function(r){return r.media_type!=='person';});
    for(var i=0;i<results.length;i++){var r=results[i];var rName=nStr(r.title||r.name||''),rOrig=nStr(r.original_title||r.original_name||'');var rYear=(r.release_date||r.first_air_date||'').slice(0,4);var nT=nStr(title),nO=nStr(orig);var nameMatch=(nT&&(rName===nT||rOrig===nT))||(nO&&(rName===nO||rOrig===nO));var yearMatch=!year||!rYear||year===rYear||Math.abs(parseInt(year)-parseInt(rYear))<=1;if(nameMatch&&yearMatch)return{id:r.id,type:r.media_type||(r.first_air_date?'tv':'movie')};}
    if(results.length)return{id:results[0].id,type:results[0].media_type||(results[0].first_air_date?'tv':'movie')};}catch(e){}
    return null;
}

function simplePlay(title,url){Lampa.Player.play({title:title,url:url});}

function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){var m='magnet:?xt=urn:btih:'+h;['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){m+='&tr='+encodeURIComponent(t);});return m;}

async function playTS(stream,title,poster,fi){
    if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}Lampa.Noty.show('Gửi TS...');
    try{var u=tsU('/torrents');var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});if(!r.ok)throw new Error('TS:'+r.status);
    var td=await r.json();var hash=td.hash||stream.infoHash;await dly(2000);var info=null,rt=0;
    while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}
    var files=[];if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
    var playFile=function(fileUrl){Lampa.Player.play({title:title,url:fileUrl});};
    if(!files.length)playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));
    else if(files.length===1)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play'));
    else if(fi!==undefined&&fi!==null&&fi>=0)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play'));
    else{Lampa.Select.show({title:'Chọn file',items:files.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f};}),onSelect:function(a){playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));},onBack:function(){Lampa.Controller.toggle('content');}});}}catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}
async function fStreams(type,imdb,s,e){var eng=tEngine(),url;if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}else{url=tioU(type,imdb,s,e);}var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);var d=await r.json();return(d.streams||[]).map(pStream);}

function injectTorrentMenuCSS(){
    var id='kk-torrent-menu-css';
    if($('#'+id).length)return;
    $('head').append('<style id="'+id+'">'+
        '.selectbox .selectbox-item__title{'+
            'white-space:pre-wrap!important;'+
            'overflow:visible!important;'+
            'text-overflow:unset!important;'+
            '-webkit-line-clamp:unset!important;'+
            'display:block!important;'+
        '}'+
        '.selectbox .selectbox-item{'+
            'height:auto!important;'+
            'max-height:none!important;'+
        '}'+
    '</style>');
}

function showStr(streams,title,poster){
    injectTorrentMenuCSS();
    var ts=!!tsHost(),eng=tEngine()==='aio'?'AIO':'Torrent';
    var menuTitle=eng+': '+title+' ('+streams.length+')'+(ts?' → TS':'');
    Lampa.Select.show({
        title:menuTitle,
        items:streams.slice(0,40).map(function(s){return{title:fmtStream(s),value:s};}),
        onSelect:function(a){
            var s=a.value;
            if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);
            else if(s.url)Lampa.Player.play({title:title,url:s.url});
            else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TS!':'Không có link');
        },onBack:function(){Lampa.Controller.toggle('content');}
    });
}

async function oTorMov(tid,title,poster,imdb){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có stream');return;}showStr(st,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

// Cards
function mkTC(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var img=d.poster_url?'<img src="'+d.poster_url+'" loading="lazy">':'<div class="kk-card-noposter"><span>No Poster</span></div>';var typeLabel=d.media_type==='tv'?'TV':'Film';var h='<div class="kk-card selector"><div class="kk-card-img">'+img;if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+E(d.name)+'</div>';if(d.origin_name&&d.origin_name!==d.name)h+='<div class="kk-card-origin">'+E(d.origin_name)+'</div>';h+='<div class="kk-card-meta">';if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';h+='</div></div></div>';var c=$(h);bE(c,function(){saveHistory(d);Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}

function mkTCH(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var backdrop=d.backdrop_url||d.poster_url||'';var imgH=backdrop?'<img src="'+backdrop+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No Image</span></div>';var typeLabel=d.media_type==='tv'?'TV':'Film';var h='<div class="kk-card-h selector"><div class="kk-card-h-img">'+imgH;if(d.vote)h+='<div class="kk-card-q">⭐ '+E(d.vote)+'</div>';h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+E(d.name)+'</div>';if(d.origin_name&&d.origin_name!==d.name)h+='<div class="kk-card-origin">'+E(d.origin_name)+'</div>';h+='<div class="kk-card-meta">';if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';h+='</div></div></div>';var c=$(h);bE(c,function(){saveHistory(d);Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}

function mkTCPF(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var bk=d.backdrop_url||d.poster_url||'',ps=d.poster_url||'';var vote=d.vote||'',vNum=Number(vote),vClass=vNum>=7?'high':vNum>=5?'mid':'low';var typeLabel=d.media_type==='tv'?'TV Series':'Film';var card=$('<div class="kk-pfc selector"></div>');card.html('<div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'<div class="kk-pfc-poster kk-pfc-poster--empty"></div>')+'<div class="kk-pfc-info"><div class="kk-pfc-badge">'+E(typeLabel)+'</div><div class="kk-pfc-title">'+E(d.name)+'</div>'+(d.origin_name&&d.origin_name!==d.name?'<div class="kk-pfc-origin">'+E(d.origin_name)+'</div>':'')+'<div class="kk-pfc-meta">'+(d.year?'<span class="kk-pfc-year">'+E(d.year)+'</span>':'')+(vote?'<span class="kk-pfc-vote kk-pfc-vote--'+vClass+'">⭐ '+vote+'</span>':'')+'</div></div></div>');bE(card,function(){saveHistory(d);Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return card;}

function openSourceDirect(item,source){var slug=item.slug;if(!slug){Lampa.Noty.show('Không có slug');return;}var title=item.name||item.title||'';Lampa.Noty.show('Đang tải...');fDet(source,slug).then(function(det){if(!det||!det.episodes||!det.episodes.length){Lampa.Noty.show('Không có tập');return;}var totalEps=0;det.episodes.forEach(function(sv){totalEps+=(sv.server_data||[]).length;});if(totalEps===0){Lampa.Noty.show('Không có tập');return;}if(totalEps===1){var ep=gEp1(det.episodes);if(ep){var link=ep.link_m3u8||ep.link_embed||'';if(link)simplePlay(title,link);else Lampa.Noty.show('Không có link');}return;}if(det.episodes.length===1&&det.episodes[0].server_data)showEpisodeSelect(det.episodes[0],title);else showServerSelect(det.episodes,title);}).catch(function(e){Lampa.Noty.show('Lỗi: '+(e.message||''));});}

function showServerSelect(episodes,title){Lampa.Select.show({title:'Chọn Server - '+title,items:episodes.map(function(sv){return{title:(sv.server_name||'Server')+' ('+(sv.server_data||[]).length+' tập)',value:sv};}),onSelect:function(a){showEpisodeSelect(a.value,title);},onBack:function(){Lampa.Controller.toggle('content');}});}

function showEpisodeSelect(serverData,title){var eps=serverData.server_data||[];if(!eps.length){Lampa.Noty.show('Không có tập');return;}Lampa.Select.show({title:(serverData.server_name||'Server')+' - '+title,items:eps.map(function(ep){var link=ep.link_m3u8||ep.link_embed||'';return{title:(ep.name||'Tập')+(!link?' [N/A]':''),value:ep};}),onSelect:function(a){var ep=a.value,link=ep.link_m3u8||ep.link_embed||'';if(link)simplePlay(title+' - '+(ep.name||''),link);else Lampa.Noty.show('Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});}

function mkSourceCard(item,source){var p=fImg(item.poster_url||item.thumb_url,source);var typeLabel=item.type==='series'||item.type==='tvshows'?'TV':'Film';var h='<div class="kk-card selector" data-loading="false"><div class="kk-card-img">';if(p)h+='<img src="'+p+'" loading="lazy">';else h+='<div class="kk-card-noposter"><span>No Poster</span></div>';if(item.quality)h+='<div class="kk-card-q">'+E(item.quality)+'</div>';h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>';if(item.origin_name&&item.origin_name!==(item.name||item.title))h+='<div class="kk-card-origin">'+E(item.origin_name)+'</div>';h+='<div class="kk-card-meta">';if(item.year)h+='<span class="kk-card-year">'+E(item.year)+'</span>';h+='</div></div></div>';var c=$(h);bE(c,async function(){if(c.attr('data-loading')==='true')return;c.attr('data-loading','true');Lampa.Noty.show('Tìm TMDB...');var type=item.type==='series'||item.type==='tvshows'||item.type==='hoathinh'?'tv':'movie';var tmdbInfo=await findTmdbId(item,type);if(tmdbInfo&&tmdbInfo.id)Lampa.Activity.push({url:'',title:item.name||item.title||'',component:'kkphim_tmdb_detail',tmdb_id:tmdbInfo.id,media_type:tmdbInfo.type,page:1});else{Lampa.Noty.show('TMDB không tìm thấy, phát trực tiếp...');openSourceDirect(item,source);}c.attr('data-loading','false');});return c;}

function mkSourceCardH(item,source){var p=fImg(item.thumb_url||item.poster_url,source);var typeLabel=item.type==='series'||item.type==='tvshows'?'TV':'Film';var h='<div class="kk-card-h selector" data-loading="false"><div class="kk-card-h-img">';if(p)h+='<img src="'+p+'" loading="lazy">';else h+='<div class="kk-card-h-noposter"><span>No Image</span></div>';if(item.quality)h+='<div class="kk-card-q">'+E(item.quality)+'</div>';h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>';if(item.origin_name&&item.origin_name!==(item.name||item.title))h+='<div class="kk-card-origin">'+E(item.origin_name)+'</div>';h+='<div class="kk-card-meta">';if(item.year)h+='<span class="kk-card-year">'+E(item.year)+'</span>';h+='</div></div></div>';var c=$(h);bE(c,async function(){if(c.attr('data-loading')==='true')return;c.attr('data-loading','true');Lampa.Noty.show('Tìm TMDB...');var type=item.type==='series'||item.type==='tvshows'||item.type==='hoathinh'?'tv':'movie';var tmdbInfo=await findTmdbId(item,type);if(tmdbInfo&&tmdbInfo.id)Lampa.Activity.push({url:'',title:item.name||item.title||'',component:'kkphim_tmdb_detail',tmdb_id:tmdbInfo.id,media_type:tmdbInfo.type,page:1});else{Lampa.Noty.show('TMDB không tìm thấy, phát trực tiếp...');openSourceDirect(item,source);}c.attr('data-loading','false');});return c;}

function mkRowList(items,isTmdb,source){var cm=cardMode(),rl=$('<div class="kk-row-list"></div>');if(cm==='poster')items.forEach(function(i){rl.append(isTmdb?mkTCPF(i):mkSourceCard(i,source));});else items.forEach(function(i){rl.append(isTmdb?mkTCH(i):mkSourceCardH(i,source));});return rl;}

function mkCastList(castArr,hasTmdb){var list=$('<div class="kk-cast-list"></div>');castArr.forEach(function(c){var av=c.profile_path?'<img src="'+TMDB_W500+c.profile_path+'" loading="lazy">':'<div class="kk-cast-empty"></div>';var card;if(hasTmdb&&c.id){card=$('<div class="kk-cast-card selector" data-pid="'+c.id+'"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');bE(card,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});}else card=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');list.append(card);});return list;}

function mkDirHtml(dirs,isTmdb){if(!dirs||!dirs.length)return'';var first=dirs[0],rest=dirs.slice(1);var avatarH=first.profile_path?'<div class="kk-crew-avatar"><img src="'+TMDB_W500+first.profile_path+'" loading="lazy"></div>':'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';var nameH=(isTmdb&&first.id)?'<span class="kk-crew-name selector" data-pid="'+first.id+'">'+E(first.name||'')+'</span>':'<span class="kk-crew-name">'+E(first.name||'')+'</span>';var restH='';if(rest.length){var restNames=rest.map(function(c){return(isTmdb&&c.id)?'<span class="kk-crew-rest-name selector" data-pid="'+c.id+'">'+E(c.name||'')+'</span>':'<span class="kk-crew-rest-name">'+E(c.name||'')+'</span>';});restH='<div class="kk-crew-rest">'+restNames.join('')+'</div>';}return'<div class="kk-crew">'+avatarH+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+nameH+'<span class="kk-crew-role">'+E(first.job||'Director')+'</span>'+restH+'</div></div>';}

function bindDirClicks(el){el.find('.kk-crew-name[data-pid],.kk-crew-rest-name[data-pid]').each(function(){var sp=$(this);bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});});}

function gHtml(genres,isTmdb){if(!genres||!genres.length)return'';var result='';for(var i=0;i<genres.length;i++){var g=genres[i];if(!g)continue;var gname=E(g.name||'');if(isTmdb)result+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gname+'">'+gname+'</span>';else result+='<span class="kk-genre">'+gname+'</span>';}return result;}

function mkHero(bk,ps,logoH,tH,origin,extra){extra=extra||{};var posterH=ps?'<img src="'+ps+'" loading="lazy">':'';return $('<div class="kk-hero"><div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-hero-backdrop-empty"></div>')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+posterH+'</div></div><div class="kk-hero-meta">'+(extra.year||extra.country?'<div class="kk-hm-yc">'+(extra.year?'<span class="kk-hm-year">'+E(extra.year)+'</span>':'')+(extra.country?'<span class="kk-hm-country">'+E(extra.country)+'</span>':'')+'</div>':'')+(logoH||tH)+(extra.tagline?'<div class="kk-hm-tagline">'+E(extra.tagline)+'</div>':'')+'<div class="kk-hm-badges">'+(extra.vote?'<span class="kk-hm-vote">'+E(extra.vote)+' <small>TMDB</small></span>':'')+(extra.status?'<span class="kk-hm-badge">'+E(extra.status)+'</span>':'')+'</div>'+(extra.runtime||extra.genres?'<div class="kk-hm-rtg">'+(extra.runtime?'<span class="kk-hm-rt">'+E(extra.runtime)+'</span>':'')+(extra.runtime&&extra.genres?'<span class="kk-hm-dot">•</span>':'')+(extra.genres?'<span class="kk-hm-genres">'+E(extra.genres)+'</span>':'')+'</div>':'')+'</div></div></div>');}

function mkCopyLine(originName,year){
    var text=String(originName||'').trim();
    if(!text)return $('<div></div>');
    if(year)text+=' '+year;
    var line=$('<div class="kk-copy-line selector"></div>');
    line.html('<span class="kk-copy-text">'+E(text)+'</span> <span class="kk-copy-icon">📋</span>');
    bE(line,function(){
        var ok=copyToClipboard(text);
        if(ok){
            Lampa.Noty.show('✅ Đã copy: "'+text+'"');
            line.find('.kk-copy-icon').text('✅');
            setTimeout(function(){line.find('.kk-copy-icon').text('📋');},2000);
        }else{
            Lampa.Noty.show('⚠️ Copy thất bại');
        }
    });
    return line;
}

function mkBody(v,y,rt,extra,genreHtml,crewH,desc,originName){
    var copyLineHtml='';
    var copyText=String(originName||'').trim();
    if(copyText){
        if(y)copyText+=' '+y;
        copyLineHtml='<div class="kk-copy-line-wrap" id="kk-copy-line-placeholder"></div>';
    }
    return $('<div class="kk-body"><div class="kk-body-genres">'+genreHtml+'</div>'+crewH+copyLineHtml+'<div class="kk-body-desc"><span class="kk-body-desc-label">Nội dung</span><div class="kk-body-desc-text">'+fTxt(desc)+'</div></div></div>');
}

// ══════════════════════════════════════════════════════════════
// NEW: Production Companies Section
// ══════════════════════════════════════════════════════════════
function mkProductionSection(companies){
    if(!companies||!companies.length)return $('<div></div>');
    var sec=$('<div class="kk-section kk-production-section"></div>');
    sec.append('<div class="kk-block-title">🏢 Hãng sản xuất</div>');
    var list=$('<div class="kk-production-list"></div>');
    companies.forEach(function(comp){
        var logoUrl=comp.logo_path?TMDB_W200+comp.logo_path:'';
        var card=$('<div class="kk-production-card selector"></div>');
        var inner='<div class="kk-production-logo">';
        if(logoUrl){
            inner+='<img src="'+logoUrl+'" loading="lazy" alt="'+E(comp.name)+'">';
        }else{
            inner+='<div class="kk-production-logo-empty"><span>🏢</span></div>';
        }
        inner+='</div>';
        inner+='<div class="kk-production-info">';
        inner+='<div class="kk-production-name">'+E(comp.name||'')+'</div>';
        if(comp.origin_country)inner+='<div class="kk-production-country">'+E(comp.origin_country)+'</div>';
        inner+='</div>';
        card.html(inner);
        bE(card,function(){
            Lampa.Activity.push({
                url:'',
                title:'🏢 '+comp.name,
                component:'kkphim_company',
                company_id:comp.id,
                company_name:comp.name||'',
                company_logo:logoUrl,
                page_num:1
            });
        });
        list.append(card);
    });
    sec.append(list);
    return sec;
}

// ══════════════════════════════════════════════════════════════
// NEW: Tags / Keywords Section
// ══════════════════════════════════════════════════════════════
function mkTagsSection(keywords){
    if(!keywords||!keywords.length)return $('<div></div>');
    var sec=$('<div class="kk-section kk-tags-section"></div>');
    sec.append('<div class="kk-block-title">🏷️ Tags</div>');
    var list=$('<div class="kk-tags-list"></div>');
    keywords.forEach(function(kw){
        var tag=$('<div class="kk-tag-chip selector">'+E(kw.name||'')+'</div>');
        bE(tag,function(){
            Lampa.Activity.push({
                url:'',
                title:'🏷️ '+kw.name,
                component:'kkphim_keyword',
                keyword_id:kw.id,
                keyword_name:kw.name||'',
                page_num:1
            });
        });
        list.append(tag);
    });
    sec.append(list);
    return sec;
}

// ══════════════════════════════════════════════════════════════
// NEW CSS for Production & Tags
// ══════════════════════════════════════════════════════════════
function injectProductionTagsCSS(){
    var id='kk-prod-tags-css';
    if($('#'+id).length)return;
    $('head').append('<style id="'+id+'">'+
        /* Production Section */
        '.kk-production-section{'+
            'padding:0.8em 1em 0.4em;'+
            'margin-top:0.6em;'+
        '}'+
        '.kk-production-list{'+
            'display:flex;'+
            'overflow-x:auto;'+
            'gap:0.8em;'+
            'padding:0.6em 0 0.8em;'+
            '-webkit-overflow-scrolling:touch;'+
            'scrollbar-width:none;'+
        '}'+
        '.kk-production-list::-webkit-scrollbar{display:none;}'+
        '.kk-production-card{'+
            'flex:0 0 auto;'+
            'width:8.5em;'+
            'background:rgba(255,255,255,0.06);'+
            'border-radius:0.8em;'+
            'padding:0.8em 0.6em;'+
            'display:flex;'+
            'flex-direction:column;'+
            'align-items:center;'+
            'gap:0.5em;'+
            'cursor:pointer;'+
            'transition:all 0.25s ease;'+
            'border:1.5px solid rgba(255,255,255,0.08);'+
        '}'+
        '.kk-production-card:hover,.kk-production-card.focus,.kk-production-card.selected{'+
            'background:rgba(255,255,255,0.12);'+
            'border-color:rgba(1,180,228,0.5);'+
            'transform:translateY(-2px);'+
            'box-shadow:0 4px 16px rgba(1,180,228,0.15);'+
        '}'+
        '.kk-production-logo{'+
            'width:5em;'+
            'height:3em;'+
            'display:flex;'+
            'align-items:center;'+
            'justify-content:center;'+
            'border-radius:0.5em;'+
            'overflow:hidden;'+
            'background:rgba(255,255,255,0.9);'+
            'padding:0.3em;'+
        '}'+
        '.kk-production-logo img{'+
            'max-width:100%;'+
            'max-height:100%;'+
            'object-fit:contain;'+
            'filter:none;'+
        '}'+
        '.kk-production-logo-empty{'+
            'width:100%;'+
            'height:100%;'+
            'display:flex;'+
            'align-items:center;'+
            'justify-content:center;'+
            'font-size:1.6em;'+
            'opacity:0.4;'+
        '}'+
        '.kk-production-info{'+
            'text-align:center;'+
            'width:100%;'+
        '}'+
        '.kk-production-name{'+
            'font-size:0.78em;'+
            'font-weight:600;'+
            'color:rgba(255,255,255,0.92);'+
            'line-height:1.3;'+
            'overflow:hidden;'+
            'text-overflow:ellipsis;'+
            'display:-webkit-box;'+
            '-webkit-line-clamp:2;'+
            '-webkit-box-orient:vertical;'+
        '}'+
        '.kk-production-country{'+
            'font-size:0.68em;'+
            'color:rgba(255,255,255,0.45);'+
            'margin-top:0.15em;'+
        '}'+

        /* Tags Section */
        '.kk-tags-section{'+
            'padding:0.6em 1em 0.4em;'+
            'margin-top:0.3em;'+
        '}'+
        '.kk-tags-list{'+
            'display:flex;'+
            'flex-wrap:wrap;'+
            'gap:0.45em;'+
            'padding:0.5em 0 0.6em;'+
        '}'+
        '.kk-tag-chip{'+
            'display:inline-flex;'+
            'align-items:center;'+
            'padding:0.35em 0.85em;'+
            'background:rgba(255,255,255,0.07);'+
            'border:1px solid rgba(255,255,255,0.12);'+
            'border-radius:2em;'+
            'font-size:0.78em;'+
            'color:rgba(255,255,255,0.78);'+
            'cursor:pointer;'+
            'transition:all 0.2s ease;'+
            'white-space:nowrap;'+
        '}'+
        '.kk-tag-chip:hover,.kk-tag-chip.focus,.kk-tag-chip.selected{'+
            'background:rgba(1,180,228,0.18);'+
            'border-color:rgba(1,180,228,0.5);'+
            'color:#fff;'+
            'transform:scale(1.05);'+
        '}'+

        /* Company page header */
        '.kk-company-header{'+
            'display:flex;'+
            'align-items:center;'+
            'gap:1.2em;'+
            'padding:1.2em 1em 0.8em;'+
            'margin-bottom:0.3em;'+
        '}'+
        '.kk-company-header-logo{'+
            'width:5em;'+
            'height:3.5em;'+
            'flex:0 0 auto;'+
            'display:flex;'+
            'align-items:center;'+
            'justify-content:center;'+
            'background:rgba(255,255,255,0.9);'+
            'border-radius:0.6em;'+
            'padding:0.4em;'+
            'overflow:hidden;'+
        '}'+
        '.kk-company-header-logo img{'+
            'max-width:100%;'+
            'max-height:100%;'+
            'object-fit:contain;'+
        '}'+
        '.kk-company-header-logo-empty{'+
            'font-size:2em;'+
            'opacity:0.4;'+
        '}'+
        '.kk-company-header-info{'+
            'flex:1;'+
            'min-width:0;'+
        '}'+
        '.kk-company-header-name{'+
            'font-size:1.15em;'+
            'font-weight:700;'+
            'color:#fff;'+
            'margin-bottom:0.15em;'+
        '}'+
        '.kk-company-header-meta{'+
            'font-size:0.82em;'+
            'color:rgba(255,255,255,0.5);'+
        '}'+
        '.kk-company-header-country{'+
            'display:inline-flex;'+
            'align-items:center;'+
            'gap:0.3em;'+
            'background:rgba(255,255,255,0.08);'+
            'padding:0.2em 0.6em;'+
            'border-radius:1em;'+
            'font-size:0.82em;'+
            'color:rgba(255,255,255,0.6);'+
            'margin-top:0.3em;'+
        '}'+
        '.kk-company-header-homepage{'+
            'font-size:0.75em;'+
            'color:rgba(1,180,228,0.7);'+
            'margin-top:0.15em;'+
            'overflow:hidden;'+
            'text-overflow:ellipsis;'+
            'white-space:nowrap;'+
        '}'+

        /* Keyword page header */
        '.kk-keyword-header{'+
            'padding:1.2em 1em 0.6em;'+
            'margin-bottom:0.3em;'+
        '}'+
        '.kk-keyword-header-badge{'+
            'display:inline-flex;'+
            'align-items:center;'+
            'gap:0.4em;'+
            'background:rgba(1,180,228,0.12);'+
            'border:1px solid rgba(1,180,228,0.3);'+
            'padding:0.5em 1.2em;'+
            'border-radius:2em;'+
            'font-size:1.05em;'+
            'color:#01b4e4;'+
            'font-weight:600;'+
        '}'+

        /* Section type tabs for company/keyword pages */
        '.kk-type-tabs{'+
            'display:flex;'+
            'gap:0.5em;'+
            'padding:0.3em 1em 0.6em;'+
        '}'+
        '.kk-type-tab{'+
            'padding:0.4em 1em;'+
            'border-radius:2em;'+
            'font-size:0.82em;'+
            'cursor:pointer;'+
            'transition:all 0.2s;'+
            'border:1px solid rgba(255,255,255,0.12);'+
            'color:rgba(255,255,255,0.6);'+
            'background:rgba(255,255,255,0.04);'+
        '}'+
        '.kk-type-tab--active{'+
            'background:rgba(1,180,228,0.18);'+
            'border-color:rgba(1,180,228,0.5);'+
            'color:#01b4e4;'+
            'font-weight:600;'+
        '}'+
        '.kk-type-tab:hover,.kk-type-tab.focus,.kk-type-tab.selected{'+
            'background:rgba(1,180,228,0.25);'+
            'border-color:rgba(1,180,228,0.6);'+
            'color:#fff;'+
        '}'+
    '</style>');
}

function inCSS(){
    if($('#kk-css').length)return;
    var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;document.head.appendChild(l);
    var fixId='kk-hgrid-fix';
    if(!$('#'+fixId).length){
        $('head').append('<style id="'+fixId+'">'+
            '.kk-grid--cat-h{display:grid!important;grid-template-columns:repeat('+hgridCols()+',minmax(0,1fr))!important;}'+
            '@media(orientation:landscape){.kk-grid--cat-h{grid-template-columns:repeat('+hgridCols()+',minmax(0,1fr))!important;}}'+
        '</style>');
    }
    var copyId='kk-copy-line-css';
    if(!$('#'+copyId).length){
        $('head').append('<style id="'+copyId+'">'+
            '.kk-copy-line{'+
                'text-align:center;'+
                'padding:0.6em 1em;'+
                'margin:0.3em 0;'+
                'cursor:pointer;'+
                'opacity:0.75;'+
                'transition:opacity 0.2s;'+
            '}'+
            '.kk-copy-line:hover,.kk-copy-line.focus,.kk-copy-line.selected{opacity:1;}'+
            '.kk-copy-text{'+
                'color:rgba(255,255,255,0.85);'+
                'font-size:0.95em;'+
            '}'+
            '.kk-copy-icon{'+
                'font-size:1em;'+
                'margin-left:0.4em;'+
                'vertical-align:middle;'+
            '}'+
        '</style>');
    }
    injectProductionTagsCSS();
}

function addM(){function ins(){if($('.menu__item[data-action="kkphim"]').length)return;var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});$('.menu .menu__list').first().append(m);}setTimeout(ins,500);Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});}

function mkGridInfinite(name,fetchFn,titleFn,headerFn){Lampa.Component.add(name,function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1;var wrap=$('<div class="kk-grid-wrap"></div>'),titleEl=$('<div class="kk-grid-title">'+E(titleFn(obj))+'</div>');var gridContainer=$('<div></div>'),spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');var ld=false,done=false,curGrid=null;this.create=function(){comp.activity.loader(true);cScr(scroll);
    // Optional header
    if(headerFn){var hdr=headerFn(obj);if(hdr)scroll.append(hdr);}
    wrap.append(titleEl).append(gridContainer).append(spinner).append(endMsg);scroll.append(wrap);initGrid();var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});doL();};function initGrid(){var cm=catMode();if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gridContainer.empty().append(curGrid);}function doL(){ld=true;spinner.show();fetchFn(obj,page).then(function(items){spinner.hide();if(!items.length){done=true;endMsg.show().text(page<=1?'Không có kết quả':'Đã hết');}else{var cm=catMode();items.forEach(function(i){var card=cm==='hgrid'?mkTCH(i):mkTC(i);card.addClass('kk-card--grid');curGrid.append(card);});page++;}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi tải');comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});}

function mkSB(css,l1,l2){return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">▼</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');}

var _detCtx={imdbId:null,mediaType:null,tmdbId:null,originName:null,year:null,title:null};

function fillE(c,eps,title,seasonNum){
    eps.forEach(function(sv){var sn2=sv.server_name||'Server',cnt=(sv.server_data||[]).length;var icon='📺',snl=sn2.toLowerCase();if(snl.indexOf('thuyết minh')>-1||snl.indexOf('thuyet minh')>-1)icon='🇻🇳';else if(snl.indexOf('vietsub')>-1||snl.indexOf('sub')>-1)icon='📝';else if(snl.indexOf('lồng')>-1)icon='🎤';c.append('<div class="kk-sv-hd">'+icon+' '+E(sn2)+' ('+cnt+')</div>');var grid=$('<div class="kk-ep-chips"></div>');
    (sv.server_data||[]).forEach(function(ep,idx){var link=ep.link_m3u8||ep.link_embed||'';var chip=$('<div class="kk-ep-c selector'+(link?'':' off')+'">'+E(ep.name||'Tập')+'</div>');
    bE(chip,function(){if(!link){Lampa.Noty.show('Không có link');return;}
    var originName=_detCtx.originName||'';
    var year=_detCtx.year||'';
    if(originName){
        var epNum=parseInt(ep.name)||idx+1;
        var copyText=originName;
        if(year)copyText+=' '+year;
        if(seasonNum)copyText+=' S'+pd(seasonNum)+'E'+pd(epNum);
        copyToClipboard(copyText);
        Lampa.Noty.show('📋 Đã copy: "'+copyText+'"');
    }
    Lampa.Player.play({title:title+' - '+(ep.name||''),url:link});
    });grid.append(chip);});c.append(grid);});
}

function bMovExp(sk,sn,slug,title,css){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Bấm để xem'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Đang tải...</div>');fDet(SOURCES[sk],slug).then(function(det){if(!det||!det.episodes||!det.episodes.length){box.html('<div class="kk-ep-er">❌ Không có tập</div>');return;}box.empty();fillE(box,det.episodes,title,null);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});}});return w;}

function bTVExp(sk,sn,slug,title,orig,css,tmdbSeasons){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Chọn season/tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳ Tìm seasons...</div>');var source=SOURCES[sk];fSeasonSlugs(source,title,orig,null).then(function(entries){if(!entries.length&&slug)entries=[{slug:slug,name:title,season:1,source:source}];if(!entries.length){box.html('<div class="kk-ep-er">❌ Không tìm thấy</div>');return;}var sMap={};entries.forEach(function(e){if(!sMap[e.season])sMap[e.season]=[];sMap[e.season].push(e);});var sNums=Object.keys(sMap).map(Number).sort(function(a,b){return a-b;});if(tmdbSeasons&&tmdbSeasons.length){tmdbSeasons.forEach(function(ts){if(!sMap[ts.season_number]){sMap[ts.season_number]=[{slug:null,name:ts.name,season:ts.season_number,source:source,notFound:true}];if(sNums.indexOf(ts.season_number)===-1)sNums.push(ts.season_number);}});sNums.sort(function(a,b){return a-b;});}if(sNums.length===1)ldSn(box,sMap[sNums[0]],title,sNums[0],null);else shSn(box,sMap,sNums,title);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'Lỗi')+'</div>');});}});return w;}

function bTorBtn(mt,tid,title,poster,imdb){var eng=tEngine(),label=eng==='aio'?'🌊 AIOStreams':'🧲 Torrent';if(tsHost())label+=' → TS';var css=eng==='aio'?'kk-src-btn--aio':'kk-src-btn--torrent';var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%"><div class="kk-sb-main">'+label+'</div><div class="kk-sb-sub">Phát qua torrent</div></div>');if(mt==='movie')bE(btn,function(){oTorMov(tid,title,poster,imdb);});else bE(btn,function(){oTorTV(tid,title,poster,imdb);});return $('<div style="width:100%"></div>').append(btn);}

function shSn(c,sMap,sNums,title){c.empty();sNums.forEach(function(sn){var entries=sMap[sn],isNotFound=entries.length===1&&entries[0].notFound;var item=$('<div class="kk-sn-it selector'+(isNotFound?' kk-sn-notfound':'')+'"><span class="kk-sn-nm">📺 Season '+sn+'</span><span class="kk-sn-bd">'+(isNotFound?'N/A':entries.length)+'</span></div>');if(!isNotFound)bE(item,function(){ldSn(c,entries,title,sn,function(){shSn(c,sMap,sNums,title);});});c.append(item);});}

async function ldSn(c,entries,title,sNum,backFn){c.html('<div class="kk-ep-ld">⏳ Tải S'+sNum+'...</div>');for(var i=0;i<entries.length;i++){if(entries[i].notFound)continue;try{var det=await fDet(entries[i].source,entries[i].slug);if(det&&det.episodes&&det.episodes.length){c.empty();if(backFn){var bk=$('<div class="kk-ep-bk selector">← Quay lại</div>');bE(bk,backFn);c.append(bk);}fillE(c,det.episodes,title+' S'+pd(sNum),sNum);return;}}catch(e){}}c.html('<div class="kk-ep-er">❌ Không có tập</div>');}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_settings',function(){
    var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        cScr(scroll);var s=ls(),w=$('<div class="kk-stg-wrap"></div>');
        w.append('<div class="kk-stg-title">⚙️ Cài đặt</div>');

        var gSrc=mg('📺 Bật/Tắt nguồn phim');
        Object.keys(SOURCES).forEach(function(k){var sc=SOURCES[k],enabled=isSourceEnabled(k);gSrc.append(mo(sc.name,'API: '+sc.api,enabled,function(){ss({['source_'+k+'_enabled']:!enabled});Lampa.Noty.show(sc.name+': '+(enabled?'Đã tắt':'Đã bật'));comp.create();}));});
        w.append(gSrc);

        var gFont=mg('🔠 Cỡ font');var fs=String(s.font_scale||'100');
        [{k:'85',n:'Nhỏ'},{k:'100',n:'Mặc định'},{k:'115',n:'Lớn'},{k:'130',n:'Rất lớn'}].forEach(function(o){gFont.append(mo(o.n,'Cỡ chữ toàn plugin',fs===o.k,function(){ss({font_scale:o.k});applyFontScale();comp.create();}));});
        w.append(gFont);

        var gCard=mg('🃏 Trang chủ - Kiểu card');var cm=s.card_mode||'hgrid';
        [{k:'hgrid',n:'📐 Lưới ngang',d:'2 cột, backdrop ngang'},{k:'poster',n:'🖼️ Poster lớn',d:'1 card full màn hình'}].forEach(function(o){gCard.append(mo(o.n,o.d,cm===o.k,function(){ss({card_mode:o.k});comp.create();}));});
        w.append(gCard);

        var gRow=mg('📊 Số phim trong row');var rc=s.row_count||'20';
        [{k:'10',n:'10 phim'},{k:'15',n:'15 phim'},{k:'20',n:'20 phim'},{k:'30',n:'30 phim'},{k:'50',n:'50 phim'}].forEach(function(o){gRow.append(mo(o.n,'Số phim mỗi row',rc===o.k,function(){ss({row_count:o.k});comp.create();}));});
        w.append(gRow);

        var gCat=mg('📋 Danh sách - Kiểu card');var ctm=s.cat_mode||'hgrid';
        [{k:'hgrid',n:'📐 Ngang (x2)',d:'2 cột, backdrop ngang'},{k:'vgrid',n:'🖼️ Dọc (tùy chỉnh)',d:'Số cột theo cài đặt bên dưới'}].forEach(function(o){gCat.append(mo(o.n,o.d,ctm===o.k,function(){ss({cat_mode:o.k});comp.create();}));});
        w.append(gCat);

        var g5=mg('🎨 Số cột poster dọc');var cg=s.card_style||'3';
        [{k:'2',n:'2 cột'},{k:'3',n:'3 cột'},{k:'4',n:'4 cột'}].forEach(function(o){g5.append(mo(o.n,'Chỉ áp dụng cho poster dọc',cg===o.k,function(){ss({card_style:o.k});comp.create();}));});
        w.append(g5);

        var g6=mg('🌐 Ngôn ngữ TMDB');var cl2=s.tmdb_lang||'vi-VN';
        [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'},{k:'ja-JP',n:'日本語'},{k:'ko-KR',n:'한국어'},{k:'zh-CN',n:'中文'}].forEach(function(o){g6.append(mo(o.n,o.k,cl2===o.k,function(){ss({tmdb_lang:o.k});_gc={movie:null,tv:null};comp.create();}));});
        w.append(g6);

        var gCopy=mg('📋 Auto Copy (MX Player Sub)');
        var acEnabled=s.auto_copy_sub!==false;
        gCopy.append(mo('Bật Auto Copy','Copy tên gốc + năm khi phát tập → dán vào MX Player tìm sub',acEnabled,function(){ss({auto_copy_sub:!acEnabled});comp.create();}));
        w.append(gCopy);

        var gE=mg('🎯 Nguồn Torrent');var ce=s.torrent_engine||'torrentio';
        gE.append(mo('Torrentio','torrentio.strem.fun',ce==='torrentio',function(){ss({torrent_engine:'torrentio'});comp.create();}));
        gE.append(mo('AIOStreams','Tự host / public',ce==='aio',function(){ss({torrent_engine:'aio'});comp.create();}));
        w.append(gE);

        var g1=mg('🖥️ TorrServer');
        g1.append(mi('Địa chỉ','192.168.1.100:8090',s.torrserver_host||'Chưa cài','Địa chỉ TS','torrserver_host',s));
        g1.append(mi('Mật khẩu','Để trống nếu không',s.torrserver_password?'••••':'Không','Mật khẩu','torrserver_password',s));
        var stTS=$('<div class="kk-stg-status" style="display:none"></div>');var tTS=si2('🧪 Test TorrServer','Kiểm tra kết nối','Test');
        bE(tTS,async function(){var h=tsHost();if(!h){stTS.show().attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ Chưa nhập địa chỉ</span>');return;}stTS.show().attr('class','kk-stg-status kk-stg-status--loading').html('<span class="kk-dbg-loading">⏳ Đang kết nối...</span>');try{var r=await fetch(tsU('/echo'),{method:'GET',headers:tsH()});if(r.ok)stTS.attr('class','kk-stg-status kk-stg-status--ok').html('<span class="kk-dbg-total">✅ Kết nối thành công!</span>');else stTS.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ HTTP '+r.status+'</span>');}catch(e){stTS.attr('class','kk-stg-status kk-stg-status--err').html('<span class="kk-dbg-err">❌ '+(e.message||'Lỗi')+'</span>');}});
        g1.append(tTS).append(stTS);w.append(g1);

        var g2=mg('🧲 Torrentio');g2.append(mi('Config','Dán link manifest',s.torrentio_config?'Có':'Mặc định','Config','torrentio_config',s));w.append(g2);
        var gA=mg('🌊 AIOStreams');gA.append(mi('URL manifest.json','Dán full URL',s.aio_url||'Chưa cài','AIO URL','aio_url',s));w.append(gA);

        var gHist=mg('🕘 Dữ liệu');var clearHist=si2('Xóa lịch sử xem','Xóa gợi ý đã xem','Xóa');bE(clearHist,function(){localStorage.removeItem(HIST_KEY);Lampa.Noty.show('Đã xóa');});gHist.append(clearHist);w.append(gHist);
        var g7=mg('🗃️ Cache');var cc=si2('Xóa cache genres','','Xóa');bE(cc,function(){_gc={movie:null,tv:null};Lampa.Noty.show('OK');});g7.append(cc);w.append(g7);
        var g4=$('<div class="kk-stg-group"></div>');var cl=si2('🗑️ Xóa toàn bộ','Khôi phục mặc định','Xóa');cl.find('.kk-stg-value').css('color','#f87171');bE(cl,function(){localStorage.removeItem(STG_KEY);localStorage.removeItem(HIST_KEY);_gc={movie:null,tv:null};applyFontScale();Lampa.Activity.backward();});g4.append(cl);w.append(g4);
        w.append('<div class="kk-stg-ver">KKPhim v4.4.0</div>');
        scroll.append(w);comp.start();
    };
    function mg(t){return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">'+t+'</div>');}
    function si2(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
    function mo(n,d,on,cb){var it=si2(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
    function mi(n,d,val,prompt,key,s){var it=si2(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(prompt,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

// Person
Lampa.Component.add('kkphim_person',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id;this.create=function(){comp.activity.loader(true);cScr(scroll);if(!pid){comp.activity.loader(false);comp.start();return;}Promise.all([tFetch('/person/'+pid+'?language='+tmLang()),tPersonC(pid)]).then(function(res){var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');var av=p.profile_path?TMDB_W500+p.profile_path:'';w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'">':'<div class="kk-crew-avatar-empty"></div>')+'</div><div class="kk-person-info"><div class="kk-person-name">'+E(p.name||'')+'</div>'+(p.birthday?'<div class="kk-person-meta">🎂 '+E(p.birthday)+'</div>':'')+(p.known_for_department?'<div class="kk-person-meta">🎬 '+E(p.known_for_department)+'</div>':'')+'</div></div>');if(p.biography)w.append('<div class="kk-person-bio">'+fTxt((p.biography||'').substring(0,600))+'</div>');if(cr&&cr.cast){var mv=cr.cast.filter(function(c){return c.media_type==='movie';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var tv=cr.cast.filter(function(c){return c.media_type==='tv';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var rCnt=rowCount();if(mv.length){var r1=$('<div class="kk-row"></div>'),rl=$('<div class="kk-row-list"></div>');mv.slice(0,rCnt).forEach(function(c){rl.append(mkTC(c));});var mr=$('<div class="kk-row-more selector">Xem thêm ('+mv.length+')</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim lẻ',component:'kkphim_person_films',person_id:pid,film_type:'movie'});});r1.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎬 Phim lẻ</div>').append(mr)).append(rl);w.append(r1);}if(tv.length){var r2=$('<div class="kk-row"></div>'),rl2=$('<div class="kk-row-list"></div>');tv.slice(0,rCnt).forEach(function(c){rl2.append(mkTC(c));});var mr2=$('<div class="kk-row-more selector">Xem thêm ('+tv.length+')</div>');bE(mr2,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim bộ',component:'kkphim_person_films',person_id:pid,film_type:'tv'});});r2.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">📺 Phim bộ</div>').append(mr2)).append(rl2);w.append(r2);}}scroll.append(w);comp.activity.loader(false);comp.start();}).catch(function(){comp.activity.loader(false);});};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

Lampa.Component.add('kkphim_person_films',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id,ft=obj.film_type||'movie';var all=[],rd=0,pp=20,gridContainer=$('<div></div>'),curGrid=null;var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Hết</div>');this.create=function(){comp.activity.loader(true);cScr(scroll);initGrid();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(rd>=all.length)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)rMore();});tPersonC(pid).then(function(cr){if(cr&&cr.cast)all=cr.cast.filter(function(c){return c.media_type===ft;}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});rMore();comp.activity.loader(false);comp.start();}).catch(function(){comp.activity.loader(false);});};function initGrid(){var cm=catMode();if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gridContainer.empty().append(curGrid);}function rMore(){var b=all.slice(rd,rd+pp);if(!b.length){endMsg.show();return;}spinner.show();var cm=catMode();b.forEach(function(c){var card=cm==='hgrid'?mkTCH(c):mkTC(c);curGrid.append(card.addClass('kk-card--grid'));});rd+=b.length;spinner.hide();if(rd>=all.length)endMsg.show();}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

// Main
Lampa.Component.add('kkphim_main',function(){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var srcCats=[{name:'🎬 Phim Mới Cập Nhật',api:'danh-sach/phim-moi-cap-nhat'},{name:'🎥 Phim Lẻ Mới',api:'v1/api/danh-sach/phim-le'},{name:'📺 Phim Bộ Mới',api:'v1/api/danh-sach/phim-bo'},{name:'🎭 Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'}];var tmdbSecs=[{name:'🔥 Xu hướng hôm nay',lt:'trending_day'},{name:'🌟 Xu hướng tuần',lt:'trending'},{name:'🎬 Chiếu rạp',lt:'now_playing'},{name:'📅 Sắp chiếu',lt:'upcoming'},{name:'🌟 Phim lẻ phổ biến',lt:'popular_movies'},{name:'📺 Phim bộ phổ biến',lt:'popular_tv'},{name:'📺 Đang phát sóng',lt:'on_the_air'},{name:'⭐ Top phim lẻ',lt:'top_movies'},{name:'⭐ Top phim bộ',lt:'top_tv'}];this.create=function(){comp.activity.loader(true);cScr(scroll);var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">KKPhim</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');bE($(tb.find('.kk-btn')[0]),oTSearch);bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});scroll.append(tb);var cm=cardMode(),cnt=cm==='poster'?12:rowCount();var totalSections=0,loadedSections=0;function checkDone(){loadedSections++;if(loadedSections>=totalSections){comp.activity.loader(false);comp.start();}}var hist=lastHistory();if(hist&&hist.tmdb_id){tRec(hist.media_type||'movie',hist.tmdb_id,1).then(function(res){var items=(res.results||[]).slice(0,cnt);if(items.length){items.forEach(function(i){if(!i.media_type)i.media_type=hist.media_type||'movie';});var rowRec=$('<div class="kk-row"></div>'),moreRec=$('<div class="kk-row-more selector">Xem thêm</div>');bE(moreRec,function(){Lampa.Activity.push({url:'',title:'Gợi ý',component:'kkphim_tmdb_list',listType:'trending',page_num:1});});rowRec.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">💡 Vì bạn đã xem "'+E(hist.name||'')+'"</div>').append(moreRec));rowRec.append(mkRowList(items,true));scroll.render().find('.kk-topbar').after(rowRec);}}).catch(function(){});}var rr=$('<div class="kk-row"></div>'),rm=$('<div class="kk-row-more selector">Thêm</div>');bE(rm,function(){Lampa.Activity.push({url:'',title:'🎲 Ngẫu nhiên',component:'kkphim_tmdb_list',listType:'trending',page_num:Math.floor(Math.random()*5)+2});});rr.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">🎲 Ngẫu nhiên</div>').append(rm));var randC=$('<div></div>');rr.append(randC);scroll.append(rr);Promise.all([tRand('movie'),tRand('tv')]).then(function(res){var items=[];(res[0].results||[]).forEach(function(i){i.media_type='movie';items.push(i);});(res[1].results||[]).forEach(function(i){i.media_type='tv';items.push(i);});for(var si2=items.length-1;si2>0;si2--){var sj=Math.floor(Math.random()*(si2+1));var st=items[si2];items[si2]=items[sj];items[sj]=st;}randC.replaceWith(mkRowList(items.slice(0,cnt),true));}).catch(function(){});var enabledSources=getEnabledSources(),sourceKeys=Object.keys(enabledSources);sourceKeys.forEach(function(sk){var source=enabledSources[sk];srcCats.forEach(function(cat){totalSections++;fetch(source.api+cat.api+'?page=1').then(function(r){return r.json();}).then(function(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).filter(function(i){return i&&i.slug;});if(list.length){var row=$('<div class="kk-row"></div>'),rowTitle=cat.name+' ('+source.name+')',mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:rowTitle,component:'kkphim_source_list',source_key:sk,api_path:cat.api,page_num:1});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(rowTitle)+'</div>').append(mr));row.append(mkRowList(list.slice(0,cnt),false,source));scroll.append(row);}checkDone();}).catch(function(){checkDone();});});});tmdbSecs.forEach(function(sec){totalSections++;var fn=TFN[sec.lt];if(!fn){checkDone();return;}fn(1).then(function(res){var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});if(items.length){var row=$('<div class="kk-row"></div>'),mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:sec.name,component:'kkphim_tmdb_list',listType:sec.lt,page_num:1});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(sec.name)+'</div>').append(mr));row.append(mkRowList(items.slice(0,cnt),true));scroll.append(row);}checkDone();}).catch(function(){checkDone();});});if(totalSections===0){comp.activity.loader(false);comp.start();}};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

// Source list
Lampa.Component.add('kkphim_source_list',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var sk=obj.source_key||'ophim',apiPath=obj.api_path||'',source=SOURCES[sk]||SOURCES.ophim;var page=obj.page_num||1,gridContainer=$('<div></div>'),ld=false,done=false,curGrid=null;var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');function initGrid(){var cm=catMode();if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gridContainer.empty().append(curGrid);}this.create=function(){comp.activity.loader(true);cScr(scroll);initGrid();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));var sb=scroll.render().find('.scroll__body');sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});doL();};function doL(){ld=true;spinner.show();fetch(source.api+apiPath+'?page='+page).then(function(r){return r.json();}).then(function(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).filter(function(i){return i&&i.slug;});spinner.hide();if(!list.length){done=true;endMsg.show().text(page<=1?'Không có':'Đã hết');comp.activity.loader(false);ld=false;comp.start();return;}var cm=catMode();list.forEach(function(i){var card=cm==='hgrid'?mkSourceCardH(i,source):mkSourceCard(i,source);curGrid.append(card.addClass('kk-card--grid'));});page++;ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

mkGridInfinite('kkphim_tmdb_list',function(obj,page){var fn=TFN[obj.listType]||TFN.trending;return fn(page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return obj.title||'TMDB';});
mkGridInfinite('kkphim_tmdb_search',function(obj,page){return tSearchM(obj.keyword||'',page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});},function(obj){return'🔍 '+(obj.keyword||'');});

// ══════════════════════════════════════════════════════════════
// NEW: Company Page - Infinite Scroll with header + tabs
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_company',function(obj){
    var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var companyId=obj.company_id,companyName=obj.company_name||'',companyLogo=obj.company_logo||'';
    var curType='movie',mp=1,tp=1,ld=false,mdone=false,tdone=false;
    var gridContainer=$('<div></div>'),curGrid=null;
    var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
    var tabMovie,tabTV;

    function initGrid(){
        var cm=catMode();
        if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
        else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
        gridContainer.empty().append(curGrid);
    }

    this.create=function(){
        comp.activity.loader(true);cScr(scroll);

        // Header
        var header=$('<div class="kk-company-header"></div>');
        var logoH='<div class="kk-company-header-logo">';
        if(companyLogo)logoH+='<img src="'+companyLogo+'" loading="lazy">';
        else logoH+='<div class="kk-company-header-logo-empty">🏢</div>';
        logoH+='</div>';
        var infoH='<div class="kk-company-header-info"><div class="kk-company-header-name">'+E(companyName)+'</div></div>';
        header.html(logoH+infoH);

        // Try to get company details for extra info
        tCompanyDetail(companyId).then(function(cd){
            if(cd){
                var metaParts=[];
                if(cd.origin_country)header.find('.kk-company-header-info').append('<div class="kk-company-header-country">🌍 '+E(cd.origin_country)+'</div>');
                if(cd.homepage)header.find('.kk-company-header-info').append('<div class="kk-company-header-homepage">'+E(cd.homepage)+'</div>');
            }
        }).catch(function(){});

        scroll.append(header);

        // Tabs
        var tabs=$('<div class="kk-type-tabs"></div>');
        tabMovie=$('<div class="kk-type-tab kk-type-tab--active selector">🎬 Phim lẻ</div>');
        tabTV=$('<div class="kk-type-tab selector">📺 Phim bộ</div>');
        bE(tabMovie,function(){
            if(curType==='movie')return;
            curType='movie';
            tabMovie.addClass('kk-type-tab--active');tabTV.removeClass('kk-type-tab--active');
            initGrid();endMsg.hide();
            if(mdone&&curGrid.children().length===0){endMsg.show().text('Không có kết quả');return;}
            mp=1;mdone=false;doL();
        });
        bE(tabTV,function(){
            if(curType==='tv')return;
            curType='tv';
            tabTV.addClass('kk-type-tab--active');tabMovie.removeClass('kk-type-tab--active');
            initGrid();endMsg.hide();
            tp=1;tdone=false;doL();
        });
        tabs.append(tabMovie).append(tabTV);
        scroll.append(tabs);

        var wrap=$('<div class="kk-grid-wrap" style="padding-top:0.3em"></div>');
        wrap.append(gridContainer).append(spinner).append(endMsg);
        scroll.append(wrap);

        initGrid();

        var sb=scroll.render().find('.scroll__body');
        sb.on('scroll',function(){
            if(ld)return;
            var isDone=curType==='movie'?mdone:tdone;
            if(isDone)return;
            var el=sb[0];
            if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();
        });

        doL();
    };

    function doL(){
        ld=true;spinner.show();
        var page=curType==='movie'?mp:tp;
        tDiscoverCompany(curType,companyId,page).then(function(r){
            var items=(r.results||[]);
            spinner.hide();
            if(!items.length){
                if(curType==='movie')mdone=true;else tdone=true;
                endMsg.show().text(page<=1?'Không có kết quả':'Đã hết');
            }else{
                items.forEach(function(i){i.media_type=curType;});
                var cm=catMode();
                items.forEach(function(i){
                    var card=cm==='hgrid'?mkTCH(i):mkTC(i);
                    card.addClass('kk-card--grid');
                    curGrid.append(card);
                });
                if(curType==='movie')mp++;else tp++;
            }
            ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){
            ld=false;spinner.hide();endMsg.show().text('Lỗi tải');comp.activity.loader(false);
        });
    }

    this.start=function(){aCtrl(scroll);eScr(scroll);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return scroll.render();};
    this.destroy=function(){scroll.destroy();};
});

// ══════════════════════════════════════════════════════════════
// NEW: Keyword Page - Infinite Scroll with header + tabs
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_keyword',function(obj){
    var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var keywordId=obj.keyword_id,keywordName=obj.keyword_name||'';
    var curType='movie',mp=1,tp=1,ld=false,mdone=false,tdone=false;
    var gridContainer=$('<div></div>'),curGrid=null;
    var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
    var tabMovie,tabTV;

    function initGrid(){
        var cm=catMode();
        if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
        else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
        gridContainer.empty().append(curGrid);
    }

    this.create=function(){
        comp.activity.loader(true);cScr(scroll);

        // Header
        var header=$('<div class="kk-keyword-header"></div>');
        header.html('<div class="kk-keyword-header-badge">🏷️ '+E(keywordName)+'</div>');
        scroll.append(header);

        // Tabs
        var tabs=$('<div class="kk-type-tabs"></div>');
        tabMovie=$('<div class="kk-type-tab kk-type-tab--active selector">🎬 Phim lẻ</div>');
        tabTV=$('<div class="kk-type-tab selector">📺 Phim bộ</div>');
        bE(tabMovie,function(){
            if(curType==='movie')return;
            curType='movie';
            tabMovie.addClass('kk-type-tab--active');tabTV.removeClass('kk-type-tab--active');
            initGrid();endMsg.hide();
            mp=1;mdone=false;doL();
        });
        bE(tabTV,function(){
            if(curType==='tv')return;
            curType='tv';
            tabTV.addClass('kk-type-tab--active');tabMovie.removeClass('kk-type-tab--active');
            initGrid();endMsg.hide();
            tp=1;tdone=false;doL();
        });
        tabs.append(tabMovie).append(tabTV);
        scroll.append(tabs);

        var wrap=$('<div class="kk-grid-wrap" style="padding-top:0.3em"></div>');
        wrap.append(gridContainer).append(spinner).append(endMsg);
        scroll.append(wrap);

        initGrid();

        var sb=scroll.render().find('.scroll__body');
        sb.on('scroll',function(){
            if(ld)return;
            var isDone=curType==='movie'?mdone:tdone;
            if(isDone)return;
            var el=sb[0];
            if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();
        });

        doL();
    };

    function doL(){
        ld=true;spinner.show();
        var page=curType==='movie'?mp:tp;
        tDiscoverKeyword(curType,keywordId,page).then(function(r){
            var items=(r.results||[]);
            spinner.hide();
            if(!items.length){
                if(curType==='movie')mdone=true;else tdone=true;
                endMsg.show().text(page<=1?'Không có kết quả':'Đã hết');
            }else{
                items.forEach(function(i){i.media_type=curType;});
                var cm=catMode();
                items.forEach(function(i){
                    var card=cm==='hgrid'?mkTCH(i):mkTC(i);
                    card.addClass('kk-card--grid');
                    curGrid.append(card);
                });
                if(curType==='movie')mp++;else tp++;
            }
            ld=false;comp.activity.loader(false);comp.start();
        }).catch(function(){
            ld=false;spinner.hide();endMsg.show().text('Lỗi tải');comp.activity.loader(false);
        });
    }

    this.start=function(){aCtrl(scroll);eScr(scroll);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return scroll.render();};
    this.destroy=function(){scroll.destroy();};
});

// Genre
Lampa.Component.add('kkphim_tmdb_genre',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,cg=String(obj.genre_id||'');var gridContainer=$('<div></div>'),ld=false,md=false,td=false,mp=1,tp=1,all=[],rs={},curGrid=null;var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');function initGrid(){var cm=catMode();if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gridContainer.empty().append(curGrid);}this.create=function(){comp.activity.loader(true);cScr(scroll);var gb=$('<div class="kk-genre-bar"></div>');scroll.append(gb);initGrid();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title" id="kk-gtitle">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));var sb2=scroll.render().find('.scroll__body');sb2.on('scroll',function(){if(ld||(md&&td))return;var el=sb2[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});Promise.all([lGenres('movie'),lGenres('tv')]).then(function(res){var mg2=[],sn={};(res[0]||[]).concat(res[1]||[]).forEach(function(g){if(!sn[g.id]){sn[g.id]=true;mg2.push(g);}});mg2.sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});mg2.forEach(function(g){var on=String(g.id)===cg;var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+E(g.name)+'</div>');bE(ch,function(){Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',genre_id:g.id,page_num:1});});gb.append(ch);});var cur=mg2.find(function(g){return String(g.id)===cg;});if(cur)scroll.render().find('#kk-gtitle').text(cur.name);doL();}).catch(function(){doL();});};function doL(){if(ld)return;ld=true;spinner.show();var ps=[];if(!md)ps.push(tDiscover('movie',cg,mp).then(function(r){var items=r.results||[];if(!items.length)md=true;else{items.forEach(function(i){i.media_type='movie';});all=all.concat(items);mp++;}}).catch(function(){md=true;}));if(!td)ps.push(tDiscover('tv',cg,tp).then(function(r){var items=r.results||[];if(!items.length)td=true;else{items.forEach(function(i){i.media_type='tv';});all=all.concat(items);tp++;}}).catch(function(){td=true;}));Promise.all(ps).then(function(){all.sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var cm=catMode();for(var i=0;i<all.length;i++){var key=all[i].media_type+'_'+all[i].id;if(!rs[key]){rs[key]=true;var card=cm==='hgrid'?mkTCH(all[i]):mkTC(all[i]);curGrid.append(card.addClass('kk-card--grid'));}}spinner.hide();if(md&&td)endMsg.show();ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;spinner.hide();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

// ══════════════════════════════════════════════════════════════
// DETAIL - Updated with Production & Tags
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_tmdb_detail',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.media_type||'movie';this.create=function(){comp.activity.loader(true);cScr(scroll);if(!tid){comp.activity.loader(false);comp.start();return;}tDetFull(mt,tid).then(async function(tmdb){var logos=null;try{logos=await tImgFull(mt,tid);}catch(e){}var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'';var y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);saveHistory({tmdb_id:tid,media_type:mt,name:t,poster_url:tmdb.poster_path?TMDB_W500+tmdb.poster_path:'',year:y,origin_name:o});Lampa.Noty.show('Tìm nguồn...');

// Fetch keywords in parallel with slugs
var keywordsPromise=tKeywords(mt,tid);
var slugs=await fSlugs(t,o,y);var tmdbSeasons=null;if(mt==='tv'){try{tmdbSeasons=await gSeasons(tid);}catch(e){}}var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;if(!imdb)try{imdb=await gImdb(mt,tid);}catch(e){}_detCtx={imdbId:imdb,mediaType:mt,tmdbId:tid,originName:o,year:y,title:t};

var keywords=[];
try{keywords=await keywordsPromise;}catch(e){}

bDet(tmdb,logos,slugs,tmdbSeasons,keywords);}).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});};

async function bDet(tmdb,logos,slugs,tmdbSeasons,keywords){cScr(scroll);var bk=tmdb.backdrop_path?TMDB_IMG+tmdb.backdrop_path:'',ps=tmdb.poster_path?TMDB_W500+tmdb.poster_path:'';var t=tmdb.title||tmdb.name||'',o2=tmdb.original_title||tmdb.original_name||'';var d=tmdb.overview||'Không có mô tả',v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A';var y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);var rt=tmdb.runtime?tmdb.runtime+' phút':'';if(!rt&&tmdb.episode_run_time&&tmdb.episode_run_time.length)rt=tmdb.episode_run_time[0]+' phút/tập';var epExtra='';if(tmdb.number_of_episodes)epExtra=tmdb.number_of_episodes+' tập';if(tmdb.number_of_seasons)epExtra+=(epExtra?' | ':'')+tmdb.number_of_seasons+' season';var country='';if(tmdb.production_countries&&tmdb.production_countries.length)country=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');else if(tmdb.origin_country&&tmdb.origin_country.length)country=tmdb.origin_country[0];var genreStr=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');var status=tmdb.status||'';var logo=pLogo(logos||(tmdb.images||{})),logoH='';if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_W500+logo.file_path+'"></div>';var gh=gHtml(tmdb.genres,true),dirsArr=[],castArr=[];if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator'||c.job==='Series Director';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,8);}var crewH=mkDirHtml(dirsArr,true);var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||_detCtx.imdbId||null;var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';var hero=mkHero(bk,ps,logoH,tH,o2,{tagline:tmdb.tagline||'',vote:v,year:y,runtime:rt+(epExtra?' · '+epExtra:''),country:country,genres:genreStr,status:status});var body=mkBody(v,y,rt,epExtra,gh,crewH,d,o2);

// Insert copy line
var placeholder=body.find('#kk-copy-line-placeholder');
if(placeholder.length&&o2){
    var copyLine=mkCopyLine(o2,y);
    placeholder.replaceWith(copyLine);
}

body.find('.kk-genre[data-gid]').each(function(){var g=$(this);bE(g,function(){Lampa.Activity.push({url:'',title:g.attr('data-gname')||'',component:'kkphim_tmdb_genre',genre_id:g.attr('data-gid'),page_num:1});});});bindDirClicks(body);var act=$('<div class="kk-actions"></div>');

var enabledSources=getEnabledSources();Object.keys(enabledSources).forEach(function(sk){var sn=enabledSources[sk].name,css=sk==='kkphim'?'kk-src-btn--kkphim':'kk-src-btn--ophim';if(slugs[sk]){if(mt==='movie')act.append(bMovExp(sk,sn,slugs[sk],t,css));else act.append(bTVExp(sk,sn,slugs[sk],t,o2,css,tmdbSeasons));}else{var naBtn=$('<div class="kk-src-btn kk-src-btn--no selector" style="width:100%"><div class="kk-sb-main">'+E(sn)+' – Không tìm thấy</div><div class="kk-sb-sub">Bấm để thử lại</div></div>');var naWrap=$('<div style="width:100%"></div>').append(naBtn);bE(naBtn,async function(){Lampa.Noty.show('Đang tìm lại...');var source=enabledSources[sk];var terms=[t,o2];if(y){terms.push(t+' '+y);terms.push(o2+' '+y);}var cleanT=t.replace(/[:\-–—]/g,' ').replace(/\s+/g,' ').trim();if(cleanT!==t)terms.push(cleanT);for(var i=0;i<terms.length;i++){if(!terms[i])continue;var items=await sSrc(source,terms[i]);var best=mBest(items,t,o2,y);if(best&&best.slug){slugs[sk]=best.slug;Lampa.Noty.show('Tìm thấy!');bDet(tmdb,logos||(tmdb.images||{}),slugs,tmdbSeasons,keywords);return;}}Lampa.Noty.show('Vẫn không tìm thấy');});act.append(naWrap);}});act.append(bTorBtn(mt,tid,t,ps,imdb));body.append(act);var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);

// Cast section
if(castArr.length){var castSec=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>');castSec.append(mkCastList(castArr,true));dw.append(castSec);}

// ══════════════════════════════════════════════════════════════
// NEW: Production Companies section
// ══════════════════════════════════════════════════════════════
if(tmdb.production_companies&&tmdb.production_companies.length){
    dw.append(mkProductionSection(tmdb.production_companies));
}

// ══════════════════════════════════════════════════════════════
// NEW: Tags / Keywords section
// ══════════════════════════════════════════════════════════════
if(keywords&&keywords.length){
    dw.append(mkTagsSection(keywords));
}

// Similar
var simI=(tmdb.similar&&tmdb.similar.results)?tmdb.similar.results.slice(0,20):[];if(simI.length){var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');var sl=$('<div class="kk-similar-list"></div>');simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(mkTC(i));});ss2.append(sl);dw.append(ss2);}

// Recommendations
try{var rd2=await tRec(mt,tid,1);var ri=(rd2.results||[]).slice(0,20);if(ri.length){var rs2=$('<div class="kk-section kk-similar kk-section--last"></div>').append('<div class="kk-block-title">🎲 Gợi ý</div>');var rl2=$('<div class="kk-similar-list"></div>');ri.forEach(function(i){if(!i.media_type)i.media_type=mt;rl2.append(mkTC(i));});rs2.append(rl2);dw.append(rs2);}else if(simI.length)dw.find('.kk-similar').last().addClass('kk-section--last');}catch(e){if(simI.length)dw.find('.kk-similar').last().addClass('kk-section--last');}scroll.append(dw);comp.activity.loader(false);comp.start();}
this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

// Start
function startPlugin(){inCSS();applyFontScale();addM();injectTorrentMenuCSS();}
if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});

})();