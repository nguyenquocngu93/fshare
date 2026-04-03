/* KKPhim Plugin v5.0.0 - Dual UI: Lampa Native + Custom */
(function(){
'use strict';
if(window.__kkphim_plugin_started)return;
window.__kkphim_plugin_started=true;

var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};
var SOURCE_NAME='kkphim';
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/';
var TMDB_BASE='https://api.themoviedb.org/3';
var TMDB_W500=TMDB_IMG+'w500';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var HIST_KEY='kkphim_history';
var _gc={movie:null,tv:null};
var _epsCache={};
var _injectedMap={};

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}
function uiMode(){return ls().ui_mode||'lampa';}
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
function saveHistory(item){try{if(!item||!item.tmdb_id)return;var arr=getHist();var id='tmdb_'+item.tmdb_id+'_'+item.media_type;arr=arr.filter(function(x){return x.id!==id;});arr.unshift({id:id,tmdb_id:item.tmdb_id,media_type:item.media_type,name:item.name||item.title||'',poster_url:item.poster_url||'',year:item.year||'',origin_name:item.origin_name||'',time:Date.now()});if(arr.length>50)arr=arr.slice(0,50);setHist(arr);}catch(e){}}
function lastHistory(){var h=getHist();return h&&h.length?h[0]:null;}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function applyFontScale(){var id='kkphim-font-scale';$('#'+id).remove();var fs=fontScale();if(!fs||fs===100)return;$('head').append('<style id="'+id+'">.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-person-header,.kk-person-bio,.kk-actions,.kk-section,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}</style>');}
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

function copyToClipboard(text){if(!text)return false;try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){}).catch(function(){});return true;}var ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px;top:-9999px;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();var ok=document.execCommand('copy');document.body.removeChild(ta);return ok;}catch(e){return false;}}

function bE(el,fn){var sx=0,sy=0,mv=false,tc=false;el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});el.on('hover:enter',function(e){fn.call(this,e);});}
function eScr(scroll){var el=scroll.render();el.css({overflow:'hidden',position:'relative',height:'100%'});var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};b.css($.extend({position:'relative'},p));if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});}
function cScr(scroll){try{scroll.render().find('.scroll__body').empty();}catch(e){}}
function aCtrl(scroll){Lampa.Controller.add('content',{toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},right:function(){Navigator.move('right');},up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},down:function(){Navigator.move('down');},back:function(){Lampa.Activity.backward();}});setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);}

// ══════════════════════════════════════════════════════════════
// TMDB
// ══════════════════════════════════════════════════════════════
async function tFetch(path){var r=await fetch(TMDB_BASE+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}
function tmdbAjax(url,onOk,onFail){$.ajax({url:url,type:'GET',headers:{'Authorization':'Bearer '+TMDB_TOKEN},success:onOk,error:onFail||function(){}});}
async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSeasons(id){try{var r=await tFetch('/tv/'+id+'?language='+tmLang());if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
async function lGenres(type){if(_gc[type])return _gc[type];try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}}
async function tPersonC(pid){try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}}
var TFN={trending:function(p){return tFetch('/trending/all/week?language='+tmLang()+'&page='+p);},trending_day:function(p){return tFetch('/trending/all/day?language='+tmLang()+'&page='+p);},popular_movies:function(p){return tFetch('/movie/popular?language='+tmLang()+'&page='+p);},popular_tv:function(p){return tFetch('/tv/popular?language='+tmLang()+'&page='+p);},top_movies:function(p){return tFetch('/movie/top_rated?language='+tmLang()+'&page='+p);},top_tv:function(p){return tFetch('/tv/top_rated?language='+tmLang()+'&page='+p);},now_playing:function(p){return tFetch('/movie/now_playing?language='+tmLang()+'&page='+p);},upcoming:function(p){return tFetch('/movie/upcoming?language='+tmLang()+'&page='+p);},airing_today:function(p){return tFetch('/tv/airing_today?language='+tmLang()+'&page='+p);},on_the_air:function(p){return tFetch('/tv/on_the_air?language='+tmLang()+'&page='+p);}};
async function tSearchM(q,p){return await tFetch('/search/multi?language='+tmLang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));}
async function tDetFull(type,id){return await tFetch('/'+type+'/'+id+'?language='+tmLang()+'&append_to_response=credits,images,similar,external_ids');}
async function tImgFull(type,id){return await tFetch('/'+type+'/'+id+'/images');}
async function tDiscover(type,gid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tRec(type,id,p){return await tFetch('/'+type+'/'+id+'/recommendations?language='+tmLang()+'&page='+(p||1));}
async function tRand(type){return await tFetch('/'+type+'/popular?language='+tmLang()+'&page='+(Math.floor(Math.random()*10)+1));}
function tNorm(item){if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',poster_url:item.poster_path?TMDB_W500+item.poster_path:'',backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',year:(item.release_date||item.first_air_date||'').slice(0,4),vote:item.vote_average?Number(item.vote_average).toFixed(1):'',origin_name:item.original_title||item.original_name||''};}

// ══════════════════════════════════════════════════════════════
// SOURCE HELPERS
// ══════════════════════════════════════════════════════════════
async function sSrc(source,kw){try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}
function mScore(item,title,orig,year){var score=0;var nT=nStr(title),nO=nStr(orig);var n1=nStr(item.name||item.title||''),n2=nStr(item.origin_name||item.original_name||'');if(nT&&(n1===nT||n2===nT))score+=100;else if(nO&&(n1===nO||n2===nO))score+=100;else if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))score+=50;else if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1))score+=50;if(year&&item.year){var iy=parseInt(item.year),ty=parseInt(year);if(iy===ty)score+=30;else if(Math.abs(iy-ty)<=1)score+=15;}return score;}
function mBest(items,title,orig,year){if(!items||!items.length)return null;var scored=items.map(function(it){return{item:it,score:mScore(it,title,orig,year)};}).filter(function(x){return x.score>0;}).sort(function(a,b){return b.score-a.score;});return scored.length?scored[0].item:null;}
async function fSlugs(title,orig,year){var r={},enabledSources=getEnabledSources();var terms=[title];if(orig&&orig!==title)terms.push(orig);if(year){terms.push(title+' '+year);if(orig&&orig!==title)terms.push(orig+' '+year);}for(var i=0;i<terms.length;i++){for(var key in enabledSources){if(!r[key]){var items=await sSrc(enabledSources[key],terms[i]);var f=mBest(items,title,orig,year);if(f&&f.slug)r[key]=f.slug;}}var allFound=true;for(var k in enabledSources){if(!r[k])allFound=false;}if(allFound)break;}return r;}
async function fDet(source,slug){try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}
function exSn(name,slug){var patterns=[/season\s*(\d+)/i,/phần\s*(\d+)/i,/mùa\s*(\d+)/i,/s(\d+)(?:\s|$|e)/i,/-season-(\d+)/i,/-phan-(\d+)/i,/(\d+)(?:st|nd|rd|th)\s*season/i];for(var i=0;i<patterns.length;i++){var m=(name+' '+slug).match(patterns[i]);if(m)return parseInt(m[1]);}var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;}
async function fSeasonSlugs(source,title,orig,targetSeason){var results=[];try{var searchTerms=[title];if(orig&&orig!==title)searchTerms.push(orig);var allItems=[];for(var t=0;t<searchTerms.length;t++){var items=await sSrc(source,searchTerms[t]);allItems=allItems.concat(items);}var seen={};allItems=allItems.filter(function(it){if(!it.slug||seen[it.slug])return false;seen[it.slug]=true;return true;});var nT=nStr(title),nO=nStr(orig);for(var i=0;i<allItems.length;i++){var it=allItems[i];if(!it.slug)continue;var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');var match=false;if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;if(!match&&results.length>0){var bs=nStr(results[0].slug),cs=nStr(it.slug);if(cs.indexOf(bs)>-1||bs.indexOf(cs)>-1)match=true;}if(match){var sn=exSn(it.name||it.title||'',it.slug||'');results.push({slug:it.slug,name:it.name||it.title||'',season:sn,source:source,year:it.year||''});}}results.sort(function(a,b){return a.season-b.season;});if(targetSeason){var exact=results.filter(function(r){return r.season===targetSeason;});if(exact.length)return exact;}}catch(e){}return results;}
async function findTmdbId(item,type){if(item.tmdb&&item.tmdb.id)return{id:item.tmdb.id,type:item.tmdb.type||type};var title=item.name||item.title||'',orig=item.origin_name||item.original_name||'',year=item.year||'';try{var searchType=type||'multi',endpoint=searchType==='multi'?'/search/multi':'/search/'+searchType;var res=await tFetch(endpoint+'?language='+tmLang()+'&query='+encodeURIComponent(orig||title)+'&page=1');var results=(res.results||[]).filter(function(r){return r.media_type!=='person';});for(var i=0;i<results.length;i++){var r=results[i];var rName=nStr(r.title||r.name||''),rOrig=nStr(r.original_title||r.original_name||'');var rYear=(r.release_date||r.first_air_date||'').slice(0,4);var nT=nStr(title),nO=nStr(orig);var nameMatch=(nT&&(rName===nT||rOrig===nT))||(nO&&(rName===nO||rOrig===nO));var yearMatch=!year||!rYear||year===rYear||Math.abs(parseInt(year)-parseInt(rYear))<=1;if(nameMatch&&yearMatch)return{id:r.id,type:r.media_type||(r.first_air_date?'tv':'movie')};}if(results.length)return{id:results[0].id,type:results[0].media_type||(results[0].first_air_date?'tv':'movie')};}catch(e){}return null;}

// ══════════════════════════════════════════════════════════════
// TORRENT
// ══════════════════════════════════════════════════════════════
function simplePlay(title,url){Lampa.Player.play({title:title,url:url});}
function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){var m='magnet:?xt=urn:btih:'+h;['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){m+='&tr='+encodeURIComponent(t);});return m;}
async function playTS(stream,title,poster,fi){if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}Lampa.Noty.show('Gửi TS...');try{var u=tsU('/torrents');var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});if(!r.ok)throw new Error('TS:'+r.status);var td=await r.json();var hash=td.hash||stream.infoHash;await dly(2000);var info=null,rt=0;while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}var files=[];if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});var playFile=function(fileUrl){Lampa.Player.play({title:title,url:fileUrl});};if(!files.length)playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));else if(files.length===1)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play'));else if(fi!==undefined&&fi!==null&&fi>=0)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play'));else{Lampa.Select.show({title:'Chọn file',items:files.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f};}),onSelect:function(a){playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));},onBack:function(){Lampa.Controller.toggle('content');}});}}catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}}
function pStream(st){var rawName=String(st.name||'');var rawDesc=String(st.description||'');var rawTitle=String(st.title||'');var rawAll=rawName+'\n'+rawDesc+'\n'+rawTitle;var name=rawName.split('\n')[0].trim()||rawTitle.split('\n')[0].trim()||'?';var qual='';var qm=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);if(qm)qual=qm[1].toUpperCase();var size='';var sP=[/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,/\b([\d.,]+)\s*(TB)\b/i,/\b([\d.,]+)\s*(GB|GiB)\b/i,/\b([\d.,]+)\s*(MB|MiB)\b/i];for(var i=0;i<sP.length;i++){var sm=rawAll.match(sP[i]);if(sm){size=sm[2]?sm[1]+' '+sm[2]:sm[1].trim();break;}}var seeds='';var sdP=[/👤\s*(?:Seeders?:?\s*)?(\d+)/i,/Seeders?:?\s*(\d+)/i,/(\d+)\s*seed/i];for(var j=0;j<sdP.length;j++){var se=rawAll.match(sdP[j]);if(se){seeds=se[1];break;}}var source='';var srP=[/🔗\s*(?:Source:?\s*)?([\w\.\-]+)/i,/Source:?\s*([\w\.\-]+)/i,/\[([A-Z0-9\-]+)\]/];for(var k=0;k<srP.length;k++){var srm=rawAll.match(srP[k]);if(srm){source=srm[1];break;}}var filename='';var fnm=rawAll.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();if(st.behaviorHints&&typeof st.behaviorHints==='object'){var bh=st.behaviorHints;if(!filename&&bh.filename)filename=String(bh.filename).trim();if(!size&&bh.videoSize){var bytes=Number(bh.videoSize);if(!isNaN(bytes)&&bytes>0){if(bytes>=1099511627776)size=(bytes/1099511627776).toFixed(2)+' TB';else if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';}}}return{name:name,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual,source:source,filename:filename};}
function fmtStream(s){var parts=[];var line1=s.name;if(s.quality&&line1.toUpperCase().indexOf(s.quality)===-1)line1+=' ['+s.quality+']';parts.push(line1);var meta=[];if(s.size)meta.push('💾 '+s.size);if(s.seeds)meta.push('👤 '+s.seeds);if(s.source)meta.push('🔗 '+s.source);if(meta.length)parts.push(meta.join('  '));if(s.filename)parts.push('📁 '+s.filename);return parts.join('\n');}
function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}
async function fStreams(type,imdb,s,e){var eng=tEngine(),url;if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}else{url=tioU(type,imdb,s,e);}var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);var d=await r.json();return(d.streams||[]).map(pStream);}

function injectTorrentMenuCSS(){var id='kk-torrent-menu-css';if($('#'+id).length)return;$('head').append('<style id="'+id+'">.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;-webkit-line-clamp:unset!important;display:block!important;}.selectbox .selectbox-item{height:auto!important;max-height:none!important;}</style>');}

function showStr(streams,title,poster){injectTorrentMenuCSS();var ts=!!tsHost(),eng=tEngine()==='aio'?'AIO':'Torrent';Lampa.Select.show({title:eng+': '+title+' ('+streams.length+')'+(ts?' → TS':''),items:streams.slice(0,40).map(function(s){return{title:fmtStream(s),value:s};}),onSelect:function(a){var s=a.value;if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);else if(s.url)Lampa.Player.play({title:title,url:s.url});else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TS!':'Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});}
async function oTorMov(tid,title,poster,imdb){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có stream');return;}showStr(st,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster);}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

// ══════════════════════════════════════════════════════════════
// LAMPA NATIVE API SOURCE (like bạn bạn's plugin)
// ══════════════════════════════════════════════════════════════
var CATEGORIES=[
    {url:'/danh-sach/phim-moi-cap-nhat',title:'Phim mới cập nhật'},
    {url:'/v1/api/danh-sach/phim-le',title:'Phim lẻ'},
    {url:'/v1/api/danh-sach/phim-bo',title:'Phim bộ'},
    {url:'/v1/api/danh-sach/hoat-hinh',title:'Hoạt hình'},
    {url:'/v1/api/danh-sach/tv-shows',title:'TV Shows'},
    {url:'/v1/api/the-loai/hanh-dong',title:'Hành Động'},
    {url:'/v1/api/the-loai/tinh-cam',title:'Tình Cảm'},
    {url:'/v1/api/the-loai/hai-huoc',title:'Hài Hước'},
    {url:'/v1/api/the-loai/kinh-di',title:'Kinh Dị'},
    {url:'/v1/api/the-loai/vien-tuong',title:'Viễn Tưởng'},
    {url:'/v1/api/the-loai/phieu-luu',title:'Phiêu Lưu'},
    {url:'/v1/api/the-loai/tam-ly',title:'Tâm Lý'},
    {url:'/v1/api/the-loai/vo-thuat',title:'Võ Thuật'},
    {url:'/v1/api/the-loai/chinh-kich',title:'Chính Kịch'},
    {url:'/v1/api/the-loai/the-thao',title:'Thể Thao'},
    {url:'/v1/api/the-loai/khoa-hoc',title:'Khoa Học'},
    {url:'/v1/api/the-loai/lich-su',title:'Lịch Sử'},
    {url:'/v1/api/the-loai/chien-tranh',title:'Chiến Tranh'},
    {url:'/v1/api/the-loai/tai-lieu',title:'Tài Liệu'},
    {url:'/v1/api/the-loai/gia-dinh',title:'Gia Đình'},
    {url:'/v1/api/the-loai/bi-an',title:'Bí Ẩn'},
    {url:'/v1/api/the-loai/am-nhac',title:'Âm Nhạc'}
];

function toNameArray(arr){if(!arr||!arr.length)return[];return arr.map(function(item){if(typeof item==='string')return{id:item,slug:item,name:item};var slug=item.slug||(typeof item.id==='string'&&isNaN(item.id)?item.id:'');return{id:slug||String(item.id||''),slug:slug,name:item.name||''};});}

function normalizeItem(item){
    if(!item)return{};
    var poster=fImg(item.poster_url,SOURCES.kkphim);
    var thumb=fImg(item.thumb_url||item.poster_url,SOURCES.kkphim);
    return{
        id:item.slug||'',title:item.name||'',name:item.name||'',
        original_title:item.origin_name||item.name||'',
        original_name:item.origin_name||item.name||'',
        img:thumb,poster:poster,poster_path:'',backdrop_path:'',
        background_image:thumb,
        release_date:item.year?(item.year+'-01-01'):'',
        first_air_date:item.year?(item.year+'-01-01'):'',
        vote_average:0,overview:item.content||'',
        genres:toNameArray(item.category||[]),
        countries:toNameArray(item.country||[]),
        type:'movie',media_type:'movie',source:SOURCE_NAME,
        kkphim_slug:item.slug||'',kkphim_type:item.type||'',
        kkphim_cats:item.category||[],kkphim_year:item.year||0
    };
}

function fetchPage(catUrl,page,onOk,onFail){
    var net=new Lampa.Reguest();
    var sep=(catUrl.indexOf('?')>=0)?'&':'?';
    net.silent(SOURCES.kkphim.api.replace(/\/$/,'')+catUrl+sep+'page='+page,function(data){
        var items=[],totalPages=1,totalItems=0;
        try{if(data.items){items=data.items.map(normalizeItem);totalPages=(data.pagination&&data.pagination.totalPages)||1;totalItems=(data.pagination&&data.pagination.totalItems)||items.length;}else if(data.data&&data.data.items){items=data.data.items.map(normalizeItem);var pag=data.data.params&&data.data.params.pagination;totalPages=(pag&&pag.totalPages)||1;totalItems=(pag&&pag.totalItems)||items.length;}}catch(e){}
        onOk({items:items,page:page,totalPages:totalPages,totalItems:totalItems});
    },onFail||function(){});
}

function fetchEpisodes(slug,callback){
    if(_epsCache[slug]){callback(_epsCache[slug]);return;}
    var net=new Lampa.Reguest();
    net.silent(SOURCES.kkphim.api+'phim/'+slug,function(res){
        _epsCache[slug]=res.episodes||[];callback(_epsCache[slug]);
    },function(){callback([]);});
}

function showEpList(card,server){
    var title=card.title||card.name||'';var poster=card.img||card.poster||'';var data=server.server_data||[];
    if(!data.length)return;
    if(data.length===1){var lk=data[0].link_m3u8||data[0].link_embed||'';if(lk)Lampa.Player.play({url:lk,title:title,poster:poster});return;}
    var playlist=data.map(function(ep){return{url:ep.link_m3u8||ep.link_embed||'',title:title+' - '+(ep.name||'')};});
    Lampa.Select.show({title:server.server_name||'Chọn tập',items:data.map(function(ep,idx){return{title:ep.name||('Tập '+(idx+1)),index:idx};}),onSelect:function(item){var l=data[item.index].link_m3u8||data[item.index].link_embed||'';if(!l)return;Lampa.Player.play({url:l,title:title+' - '+(data[item.index].name||''),poster:poster});Lampa.Player.playlist(playlist,item.index);}});
}

function showEpisodeMenu(card,episodes){
    var title=card.title||card.name||'';var poster=card.img||card.poster||'';
    if(!episodes.length)return;
    if(episodes.length===1&&(episodes[0].server_data||[]).length===1){var ep=episodes[0].server_data[0];var lk=ep.link_m3u8||ep.link_embed||'';if(lk)Lampa.Player.play({url:lk,title:title,poster:poster});return;}
    if(episodes.length===1){showEpList(card,episodes[0]);return;}
    Lampa.Select.show({title:'Chọn server',items:episodes.map(function(srv,si){return{title:srv.server_name||('Server '+(si+1)),index:si};}),onSelect:function(item){showEpList(card,episodes[item.index]);}});
}

// Lampa API Source
function KKPhimApi(){
    var self=this;
    self.network=new Lampa.Reguest();

    self.list=function(params,onComplete,onError){
        var page=params.page||1;var catUrl='';
        if(params.cat_url)catUrl=params.cat_url;
        else if(params.url)catUrl=params.url;
        else if(params.genres&&params.genres[0]){var g=params.genres[0];var slug=g.slug||(isNaN(g.id)?g.id:'');if(slug)catUrl='/v1/api/the-loai/'+slug;}
        else if(params.genre){var g2=params.genre;var slug2=(typeof g2==='object')?(g2.slug||(isNaN(g2.id)?g2.id:'')):((isNaN(g2)?g2:''));if(slug2)catUrl='/v1/api/the-loai/'+slug2;}
        if(!catUrl)catUrl='/danh-sach/phim-moi-cap-nhat';
        fetchPage(catUrl,page,function(res){onComplete({results:res.items,page:res.page,total_pages:res.totalPages,total_results:res.totalItems,cat_url:catUrl,url:catUrl});},onError);
    };

    self.category=function(params,onComplete,onError){
        var parts=CATEGORIES.map(function(cat){return function(cb){fetchPage(cat.url,1,function(res){cb({title:cat.title,results:res.items,url:cat.url,cat_url:cat.url,page:1,total_pages:res.totalPages,total_results:res.totalItems,source:SOURCE_NAME});},function(){cb({title:cat.title,results:[],url:cat.url,cat_url:cat.url});});};});
        Lampa.Api.partNext(parts,2,onComplete,onError);
    };

    self.full=function(params,onComplete,onError){
        var card=params.card||{};var slug=card.kkphim_slug||card.id;
        if(!slug){if(onError)onError('no slug');return;}
        self.network.silent(SOURCES.kkphim.api+'phim/'+slug,function(data){
            var movie=data.movie||{};var episodes=data.episodes||[];var seasons=[];
            episodes.forEach(function(server,si){var eps=(server.server_data||[]).map(function(ep,ei){return{episode_number:ei+1,season_number:si+1,name:ep.name||('Tập '+(ei+1)),air_date:'',link_m3u8:ep.link_m3u8||'',link_embed:ep.link_embed||''};});seasons.push({season_number:si+1,name:server.server_name||('Server '+(si+1)),episodes:eps});});
            var result=normalizeItem(movie);
            result.overview=movie.content||'';result.number_of_seasons=seasons.length||1;result.seasons=seasons;result.kkphim_episodes=episodes;
            var kkActors=(movie.actor||[]).map(function(n,i){return{id:i,name:n,character:'',profile_path:'',img:''};});
            var kkDirs=(movie.director||[]).map(function(n,i){return{id:9000+i,name:n,job:'Director',profile_path:'',img:''};});
            if(kkActors.length||kkDirs.length){result.credits={cast:kkActors,crew:kkDirs};result.persons=kkActors.concat(kkDirs);result.actors=kkActors;result.directors=kkDirs;}
            enrichWithTMDB(result,movie,function(enriched){onComplete({movie:enriched});});
        },onError);
    };

    self.search=function(params,onComplete,onError){
        var q=encodeURIComponent(params.query||'');
        self.network.silent(SOURCES.kkphim.api+'v1/api/tim-kiem?keyword='+q,function(data){
            var items=(data.data&&data.data.items)?data.data.items.map(normalizeItem):[];
            onComplete({results:items,page:1,total_pages:1,total_results:items.length});
        },onError);
    };

    self.seasons=function(params,onComplete,onError){
        var card=params.card||{};
        if(card.seasons&&card.seasons.length)onComplete({seasons:card.seasons});
        else self.full({card:card},function(res){onComplete({seasons:(res.movie&&res.movie.seasons)||[]});},onError);
    };

    self.person=function(params,onComplete,onError){
        var card=params.card||params.movie||params.item||{};
        var info=getTmdbInfo(card);
        if(!info.id){onError('no tmdb');return;}
        tmdbAjax(TMDB_BASE+'/'+info.type+'/'+info.id+'/credits?language=vi-VN',function(data){
            var cast=(data.cast||[]).slice(0,20).map(function(a){return{id:a.id,name:a.name,img:a.profile_path?TMDB_IMG+'w185'+a.profile_path:'',profile_path:a.profile_path||'',character:a.character||'',role:a.character||'',known_for_department:'Acting'};});
            var crew=(data.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Writer';}).slice(0,5).map(function(c){return{id:c.id,name:c.name,img:c.profile_path?TMDB_IMG+'w185'+c.profile_path:'',profile_path:c.profile_path||'',job:c.job,role:c.job,known_for_department:c.department};});
            onComplete({persons:cast.concat(crew),cast:cast,crew:crew,actors:cast,directors:crew.filter(function(c){return c.job==='Director';})});
        },function(){onError('failed');});
    };

    self.clear=function(){self.network.clear();};
}

function getTmdbInfo(card){
    var raw=card.tmdb||{};
    var tmdbId=(typeof raw==='object'?raw.id:raw)||card.tmdb_id||'';
    var mediaType=(typeof raw==='object'&&raw.type)?raw.type:((card.kkphim_type||card.type)==='single'?'movie':'tv');
    return{id:tmdbId?String(tmdbId):'',type:mediaType};
}

function enrichWithTMDB(result,movie,onDone){
    var info=getTmdbInfo(movie);
    var searchTitle=movie.origin_name||movie.name||'';
    var searchYear=movie.year?String(movie.year):'';
    function done(t){
        if(t){
            try{
                if(t.backdrop_path){result.backdrop_path=t.backdrop_path;result.background_image=TMDB_IMG+'original'+t.backdrop_path;}
                if(t.poster_path)result.poster_path=t.poster_path;
                var logos=(t.images&&t.images.logos)||[];var logo=logos.filter(function(l){return l.iso_639_1==='en';})[0]||logos[0];
                if(logo&&logo.file_path){result.logo=TMDB_IMG+'w300'+logo.file_path;result.logo_path=logo.file_path;}
                if(t.vote_average){result.vote_average=Math.round(t.vote_average*10)/10;result.vote_count=t.vote_count||0;}
                if(t.release_date)result.release_date=t.release_date;
                if(t.first_air_date)result.first_air_date=t.first_air_date;
                if(t.runtime)result.runtime=t.runtime;
                var credits=t.credits||{};
                var castList=(credits.cast||[]).slice(0,15).map(function(a){return{id:a.id,name:a.name,character:a.character||'',profile_path:a.profile_path||'',img:a.profile_path?TMDB_IMG+'w185'+a.profile_path:'',order:a.order||0};});
                var crewList=(credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Writer';}).slice(0,5).map(function(c){return{id:c.id,name:c.name,job:c.job,department:c.department||'',profile_path:c.profile_path||'',img:c.profile_path?TMDB_IMG+'w185'+c.profile_path:''};});
                if(castList.length||crewList.length){result.credits={cast:castList,crew:crewList};result.persons=castList.concat(crewList);result.actors=castList;result.directors=crewList.filter(function(c){return c.job==='Director';});}
                result.tmdb=String(t.id);result.tmdb_id=String(t.id);
            }catch(e){}
        }
        onDone(result,t);
    }
    if(info.id){tmdbAjax(TMDB_BASE+'/'+info.type+'/'+info.id+'?language=vi-VN&append_to_response=credits,images&include_image_language=en,vi,null',done,function(){onDone(result,null);});}
    else if(searchTitle){
        var sUrl=TMDB_BASE+'/search/'+(info.type||'movie')+'?query='+encodeURIComponent(searchTitle)+'&language=vi-VN'+(searchYear?'&year='+searchYear:'');
        tmdbAjax(sUrl,function(data){var results=(data&&data.results)||[];var matched=null;if(searchYear)matched=results.filter(function(r){return(r.release_date||r.first_air_date||'').slice(0,4)===searchYear;})[0];var found=matched||results[0];if(found)tmdbAjax(TMDB_BASE+'/'+info.type+'/'+found.id+'?language=vi-VN&append_to_response=credits,images&include_image_language=en,vi,null',done,function(){onDone(result,null);});else onDone(result,null);},function(){onDone(result,null);});
    }else onDone(result,null);
}

// ══════════════════════════════════════════════════════════════
// LAMPA NATIVE: Inject buttons, cast, similar, genres into full page
// ══════════════════════════════════════════════════════════════
function injectLampaFullHooks(){
    Lampa.Listener.follow('full',function(e){
        var obj=e.object||{};
        var card=(e.data&&e.data.movie)?e.data.movie:(obj.card||(obj.activity&&obj.activity.card));
        if(!card||card.source!==SOURCE_NAME)return;
        var slug=card.kkphim_slug||card.id;

        if(e.type==='destroy'){delete _injectedMap[slug];delete _epsCache[slug];return;}
        if(e.type!=='complite')return;

        fetchEpisodes(slug,function(){});
        var $render=obj.activity?obj.activity.render():(obj.render?obj.render():null);
        var $ctx=$render||$('body');

        // ═══ Play button ═══
        if(!$ctx.find('.view--kkphim').length){
            var $playBtn=$('<div class="full-start__button selector view--kkphim" data-subtitle="KKPhim"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg><span>KKPhim</span></div>');
            $playBtn.on('hover:enter',function(){
                fetchEpisodes(slug,function(eps){
                    if(!eps||!eps.length){Lampa.Noty.show('Không có link phim');return;}
                    // Auto copy for MX Player sub
                    var originName=card.original_title||card.original_name||'';
                    var year=(card.release_date||card.first_air_date||'').slice(0,4);
                    if(originName){var ct=originName+(year?' '+year:'');copyToClipboard(ct);Lampa.Noty.show('📋 '+ct);}
                    showEpisodeMenu(card,eps);
                });
            });
            var $tor=$ctx.find('.view--torrent');
            if($tor.length)$tor.after($playBtn);
            else $ctx.find('.full-start__buttons').append($playBtn);
        }

        // ═══ OPhim button ═══
        if(isSourceEnabled('ophim')&&!$ctx.find('.view--ophim').length){
            var $ophimBtn=$('<div class="full-start__button selector view--ophim" data-subtitle="OPhim"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 8.5L15.5 12L9.5 15.5V8.5Z" fill="currentColor"/></svg><span>OPhim</span></div>');
            $ophimBtn.on('hover:enter',function(){
                var title=card.title||card.name||'';
                var orig=card.original_title||card.original_name||'';
                var year=card.kkphim_year||'';
                Lampa.Noty.show('Tìm OPhim...');
                (async function(){
                    var items=await sSrc(SOURCES.ophim,orig||title);
                    var best=mBest(items,title,orig,year?String(year):'');
                    if(!best||!best.slug){Lampa.Noty.show('OPhim: Không tìm thấy');return;}
                    var det=await fDet(SOURCES.ophim,best.slug);
                    if(!det||!det.episodes||!det.episodes.length){Lampa.Noty.show('OPhim: Không có tập');return;}
                    showEpisodeMenu(card,det.episodes);
                })();
            });
            $ctx.find('.view--kkphim').after($ophimBtn);
        }

        // ═══ Torrent button ═══
        if(!$ctx.find('.view--torrent-kk').length){
            var info=getTmdbInfo(card);
            var eng=tEngine(),torLabel=eng==='aio'?'AIO':'Torrent';
            if(tsHost())torLabel+='→TS';
            var $torBtn=$('<div class="full-start__button selector view--torrent-kk" data-subtitle="'+torLabel+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="currentColor"/></svg><span>'+torLabel+'</span></div>');
            $torBtn.on('hover:enter',function(){
                if(!info.id){Lampa.Noty.show('Không có TMDB ID');return;}
                var mt=info.type==='tv'?'tv':'movie';var title=card.title||card.name||'';var poster=card.img||card.poster||'';
                (async function(){
                    var imdb=await gImdb(mt,info.id);
                    if(!imdb){Lampa.Noty.show('Không có IMDB');return;}
                    if(mt==='movie')oTorMov(info.id,title,poster,imdb);
                    else oTorTV(info.id,title,poster,imdb);
                })();
            });
            $ctx.find('.view--ophim,.view--kkphim').last().after($torBtn);
        }

        // ═══ Copy Sub button ═══
        if(!$ctx.find('.view--copysub').length){
            var origN=card.original_title||card.original_name||'';
            var yr=(card.release_date||card.first_air_date||'').slice(0,4);
            if(origN){
                var copyText=origN+(yr?' '+yr:'');
                var $copyBtn=$('<div class="full-start__button selector view--copysub" data-subtitle="Copy Sub"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="44" height="44"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5"/></svg><span>📋 Sub</span></div>');
                $copyBtn.on('hover:enter',function(){
                    var ok=copyToClipboard(copyText);
                    if(ok)Lampa.Noty.show('✅ Đã copy: "'+copyText+'"');
                    else Lampa.Noty.show('⚠️ Copy thất bại');
                });
                $ctx.find('.full-start__buttons').append($copyBtn);
            }
        }

        // ═══ Inject genres ═══
        injectGenres(card,$ctx);

        // ═══ Inject cast + logo from TMDB ═══
        var tmdbInfo=getTmdbInfo(card);
        if(tmdbInfo.id){
            tmdbAjax(TMDB_BASE+'/'+tmdbInfo.type+'/'+tmdbInfo.id+'?language=vi-VN&append_to_response=credits,images&include_image_language=en,vi,null',function(tmdbData){
                if(!$ctx.closest('body').length)return;
                injectCastToDOM($ctx,tmdbData);
                var logos=(tmdbData.images&&tmdbData.images.logos)||[];
                var logo=logos.filter(function(l){return l.iso_639_1==='en';})[0]||logos[0];
                if(logo&&logo.file_path){
                    var logoPath=logo.file_path.replace('.svg','.png');
                    var logoUrl=TMDB_IMG+'w300'+logoPath;
                    var $t=$ctx.find('.full-start-new__title');
                    if($t.length)$t.html('<img style="margin-top:5px;max-height:125px;" src="'+logoUrl+'"/>');
                }
            });
        }

        // ═══ Inject similar ═══
        injectSimilarMovies(card,$ctx);
    });
}

function injectGenres(card,$ctx){
    if(!card||card.source!==SOURCE_NAME)return;
    if($ctx.find('.kkp-genres-wrap').length)return;
    var genres=card.genres||[];if(!genres.length)return;
    var $wrap=$('<div class="kkp-genres-wrap" style="padding:.2em 1.5em 1em;"><div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:0 0 .8em;">Thể loại</div><div style="display:flex;flex-wrap:wrap;gap:8px;"></div></div>');
    var $row=$wrap.find('div').last();
    genres.forEach(function(g){
        var slug=g.slug||(isNaN(g.id)?g.id:'');if(!slug)return;
        var $tag=$('<div class="selector" style="padding:6px 16px;border-radius:20px;font-size:13px;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);">'+(g.name||'')+'</div>');
        $tag.on('hover:enter click',function(){
            if(uiMode()==='lampa')Lampa.Activity.push({title:g.name||slug,component:'kkphim_list',cat_url:'/v1/api/the-loai/'+slug,source:SOURCE_NAME,page:1});
            else Lampa.Activity.push({url:'',title:g.name||slug,component:'kkphim_tmdb_genre',genre_id:slug,page_num:1});
        });
        $row.append($tag);
    });
    var $d=$ctx.find('.full-descr').first();
    if($d.length)$d.after($wrap);else $ctx.find('.full-start').first().append($wrap);
}

function injectCastToDOM($ctx,tmdbData){
    if(!tmdbData||$ctx.find('.kkp-cast-wrap').length)return;
    var credits=tmdbData.credits||{};var cast=credits.cast||[];var directors=(credits.crew||[]).filter(function(c){return c.job==='Director';});
    if(!cast.length&&!directors.length)return;
    var $wrap=$('<div class="kkp-cast-wrap" style="padding:0 1.5em 1em;"></div>');
    if(directors.length){
        $wrap.append('<div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:1em 0 .6em;">Đạo diễn</div>');
        var $drow=$('<div style="display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;"></div>');
        directors.forEach(function(d){var img=d.profile_path?TMDB_IMG+'w185'+d.profile_path:'';var $item=$('<div class="selector" style="flex:0 0 100px;text-align:center;"></div>');$item.append(img?'<img src="'+img+'" style="width:86px;height:86px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 7px;background:#222;"/>':'<div style="width:86px;height:86px;border-radius:50%;background:#333;margin:0 auto 7px;"></div>');$item.append('<div style="font-size:11px;line-height:1.3;">'+(d.name||'')+'</div>');$item.append('<div style="font-size:10px;opacity:.4;margin-top:2px;">Director</div>');$drow.append($item);});
        $wrap.append($drow);
    }
    if(cast.length){
        $wrap.append('<div style="font-size:.8em;text-transform:uppercase;letter-spacing:.08em;opacity:.5;margin:1em 0 .6em;">Diễn viên</div>');
        var $crow=$('<div style="display:flex;gap:18px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;"></div>');
        cast.slice(0,15).forEach(function(a){var img=a.profile_path?TMDB_IMG+'w185'+a.profile_path:'';var $item=$('<div class="selector" style="flex:0 0 100px;text-align:center;"></div>');$item.append(img?'<img src="'+img+'" style="width:86px;height:86px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 7px;background:#222;"/>':'<div style="width:86px;height:86px;border-radius:50%;background:#333;margin:0 auto 7px;"></div>');$item.append('<div style="font-size:11px;line-height:1.3;">'+(a.name||'')+'</div>');if(a.character)$item.append('<div style="font-size:10px;opacity:.4;margin-top:2px;">'+a.character+'</div>');$crow.append($item);});
        $wrap.append($crow);
    }
    var $target=$ctx.find('.kkp-similar-wrap');if($target.length){$target.before($wrap);return;}
    $target=$ctx.find('.kkp-genres-wrap');if($target.length){$target.after($wrap);return;}
    $target=$ctx.find('.full-descr');if($target.length){$target.after($wrap);return;}
    $ctx.find('.full-start').first().append($wrap);
}

function getGenreSlug(card){
    var cats=card.kkphim_cats||[];
    for(var i=0;i<cats.length;i++){var c=cats[i];if(typeof c==='object'){if(c.slug)return{slug:c.slug,name:c.name||c.slug};if(typeof c.id==='string'&&isNaN(c.id)&&c.id)return{slug:c.id,name:c.name||c.id};}}
    var genres=card.genres||[];if(genres.length){var g=genres[0],s=g.slug||g.id||'';if(s&&isNaN(s))return{slug:String(s),name:g.name||String(s)};}return null;
}

function injectSimilarMovies(card,$ctx){
    if(!card||card.source!==SOURCE_NAME)return;
    var gi=getGenreSlug(card);if(!gi)return;
    var cardSlug=card.kkphim_slug||card.id;
    if(_injectedMap[cardSlug])return;_injectedMap[cardSlug]=true;
    setTimeout(function(){
        if(!$ctx.closest('body').length||$ctx.find('.kkp-similar-wrap').length)return;
        var net1=new Lampa.Reguest();
        net1.silent(SOURCES.kkphim.api+'v1/api/the-loai/'+gi.slug+'?page=1',function(fd){
            var tp=1;try{var p=fd.data&&fd.data.params&&fd.data.params.pagination;tp=(p&&p.totalPages)||1;}catch(e){}
            var rp=Math.floor(Math.random()*tp)+1;
            var net2=new Lampa.Reguest();
            net2.silent(SOURCES.kkphim.api+'v1/api/the-loai/'+gi.slug+'?page='+rp,function(data){
                if(!$ctx.closest('body').length)return;
                var items=[];try{items=(data.data&&data.data.items)?data.data.items.map(normalizeItem):[];}catch(e){return;}
                items=items.filter(function(i){return i.id!==cardSlug;}).sort(function(){return Math.random()-0.5;}).slice(0,20);
                if(!items.length)return;
                var $wrap=$('<div class="kkp-similar-wrap" style="padding:.5em 0 1.4em;"><div style="padding:0 1.5em 1.2em;"><span style="font-size:1.15em;font-weight:700;">Phim liên quan</span></div><div class="kkp-similar-row" style="display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;padding:0 1.5em .5em;-webkit-overflow-scrolling:touch;scrollbar-width:none;"></div></div>');
                var $row=$wrap.find('.kkp-similar-row');
                items.forEach(function(item){var poster=item.img||item.poster||'';var year=item.release_date?item.release_date.slice(0,4):'';var $c=$('<div class="kkp-sim-card selector" style="flex:0 0 110px;width:110px;cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;"><div style="position:relative;padding-top:150%;background:#111;"><img src="'+poster+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/></div><div style="padding:5px 6px;"><div style="font-size:11px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+(item.title||'')+'</div><div style="font-size:10px;opacity:.45;margin-top:2px;">'+year+'</div></div></div>');$c.on('hover:enter click',function(){Lampa.Activity.push({component:'full',id:item.id,source:SOURCE_NAME,card:item});});$row.append($c);});
                setTimeout(function(){if(!$ctx.closest('body').length)return;var $after=$ctx.find('.kkp-cast-wrap');if(!$after.length)$after=$ctx.find('.full-descr');if($after.length)$after.last().after($wrap);else $ctx.find('.full-start').append($wrap);},200);
            });
        });
    },700);
}

function injectViewMore(){
    Lampa.Listener.follow('activity',function(e){
        if(e.type!=='start')return;var obj=e.object||{};
        if(obj.source!==SOURCE_NAME||obj.component!=='category')return;
        setTimeout(function(){
            $('.items__head,.category__title').each(function(){
                var $head=$(this);if($head.find('.kkp-more-btn').length)return;
                var txt=$head.text().replace(/\s*[>›].*/g,'').trim();
                var cfg=null;CATEGORIES.forEach(function(c){if(c.title===txt)cfg=c;});
                if(!cfg)return;
                var $btn=$('<span class="kkp-more-btn selector" style="font-size:12px;opacity:.65;cursor:pointer;margin-left:10px;padding:2px 10px;border:1px solid rgba(255,255,255,.3);border-radius:20px;vertical-align:middle;">Xem thêm ›</span>');
                $btn.on('hover:enter click',function(){Lampa.Activity.push({title:cfg.title,component:'kkphim_list',cat_url:cfg.url,source:SOURCE_NAME,page:1});});
                $head.append($btn);
            });
        },900);
    });
}

// Lampa native list component (infinite scroll)
function KKPhimListComponent(object){
    var catUrl=object.cat_url||'/danh-sach/phim-moi-cap-nhat';
    var catTitle=object.title||'KKPhim';
    var curPage=1,totalPages=1,loading=false;
    var $html=$('<div class="kkp-list-wrap" style="min-height:100vh;"><div class="kkp-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px;"></div><div class="kkp-loader" style="text-align:center;padding:1.5em;display:none;"><span style="opacity:.5;">Đang tải...</span></div><div class="kkp-end" style="text-align:center;padding:1em;display:none;"><span style="opacity:.4;">— Đã hết —</span></div></div>');
    var $grid=$html.find('.kkp-grid'),$loader=$html.find('.kkp-loader'),$end=$html.find('.kkp-end');
    function renderCard(item){var poster=item.img||item.poster||'';var year=item.release_date?item.release_date.slice(0,4):'';var $card=$('<div class="kkp-card selector" style="cursor:pointer;border-radius:6px;overflow:hidden;background:#1a1a1a;"><div style="position:relative;padding-top:150%;background:#111;"><img src="'+poster+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.opacity=0.2"/></div><div style="padding:6px 8px;"><div style="font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+(item.title||'')+'</div><div style="font-size:11px;opacity:.5;margin-top:2px;">'+year+'</div></div></div>');$card.on('hover:enter click',function(){Lampa.Activity.push({component:'full',id:item.id,source:SOURCE_NAME,card:item});});$grid.append($card);}
    function loadPage(page){if(loading)return;loading=true;$loader.show();fetchPage(catUrl,page,function(res){totalPages=res.totalPages||1;res.items.forEach(renderCard);loading=false;$loader.hide();if(curPage>=totalPages)$end.show();},function(){loading=false;$loader.hide();});}
    function onScroll(){var selectors=['.activity__body','.layer__scroll','.app__content','.app'];var el=null;for(var i=0;i<selectors.length;i++){var found=document.querySelector(selectors[i]);if(found&&found.scrollHeight>found.clientHeight){el=found;break;}}if(!el)el=document.documentElement;var scrollTop=el.scrollTop||window.pageYOffset||0;var clientHeight=el.clientHeight||window.innerHeight;var scrollHeight=el.scrollHeight||document.body.scrollHeight;if(scrollTop+clientHeight>=scrollHeight-600){if(!loading&&curPage<totalPages){curPage++;loadPage(curPage);}}}
    this.create=function(){loadPage(1);window.addEventListener('scroll',onScroll,true);return $html;};
    this.start=function(){return this.create();};
    this.render=function(){return $html;};
    this.header=function(){return catTitle;};
    this.pause=function(){};this.resume=function(){};this.stop=function(){};
    this.destroy=function(){window.removeEventListener('scroll',onScroll,true);};
}

// ══════════════════════════════════════════════════════════════
// CUSTOM UI COMPONENTS (from original plugin)
// ══════════════════════════════════════════════════════════════
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw){if(uiMode()==='lampa')Lampa.Activity.push({component:'search',search:kw,source:SOURCE_NAME});else Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('kkphim_settings',function(){
    var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        cScr(scroll);var s=ls(),w=$('<div class="kk-stg-wrap" style="padding:1.5em;"></div>');
        w.append('<div style="font-size:1.3em;font-weight:700;margin-bottom:1em;">⚙️ KKPhim Settings</div>');

        // UI MODE
        var gUI=mg('🎨 Giao diện');var um=s.ui_mode||'lampa';
        gUI.append(mo('📺 Lampa (gốc)','Dùng giao diện Lampa native - backdrop, logo, nút bấm chuẩn',um==='lampa',function(){ss({ui_mode:'lampa'});Lampa.Noty.show('Đã chọn UI Lampa. Khởi động lại để áp dụng.');comp.create();}));
        gUI.append(mo('🎨 KKPhim (custom)','Giao diện tự thiết kế - hero banner, card grid, TMDB detail',um==='custom',function(){ss({ui_mode:'custom'});Lampa.Noty.show('Đã chọn UI Custom. Khởi động lại để áp dụng.');comp.create();}));
        w.append(gUI);

        var gSrc=mg('📺 Nguồn phim');
        Object.keys(SOURCES).forEach(function(k){var sc=SOURCES[k],enabled=isSourceEnabled(k);gSrc.append(mo(sc.name,'API: '+sc.api,enabled,function(){ss({['source_'+k+'_enabled']:!enabled});Lampa.Noty.show(sc.name+': '+(enabled?'Đã tắt':'Đã bật'));comp.create();}));});
        w.append(gSrc);

        var gLang=mg('🌐 Ngôn ngữ TMDB');var cl2=s.tmdb_lang||'vi-VN';
        [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'},{k:'ja-JP',n:'日本語'},{k:'ko-KR',n:'한국어'},{k:'zh-CN',n:'中文'}].forEach(function(o){gLang.append(mo(o.n,o.k,cl2===o.k,function(){ss({tmdb_lang:o.k});_gc={movie:null,tv:null};comp.create();}));});
        w.append(gLang);

        var gCopy=mg('📋 Auto Copy (MX Player Sub)');
        var acEnabled=s.auto_copy_sub!==false;
        gCopy.append(mo('Bật Auto Copy','Copy tên gốc + năm khi phát → dán vào MX Player tìm sub',acEnabled,function(){ss({auto_copy_sub:!acEnabled});comp.create();}));
        w.append(gCopy);

        var gE=mg('🎯 Torrent');var ce=s.torrent_engine||'torrentio';
        gE.append(mo('Torrentio','torrentio.strem.fun',ce==='torrentio',function(){ss({torrent_engine:'torrentio'});comp.create();}));
        gE.append(mo('AIOStreams','Tự host / public',ce==='aio',function(){ss({torrent_engine:'aio'});comp.create();}));
        w.append(gE);

        var g1=mg('🖥️ TorrServer');
        g1.append(mi('Địa chỉ','192.168.1.100:8090',s.torrserver_host||'Chưa cài','Địa chỉ TS','torrserver_host',s));
        g1.append(mi('Mật khẩu','Để trống nếu không',s.torrserver_password?'••••':'Không','Mật khẩu','torrserver_password',s));
        w.append(g1);

        var g2=mg('🧲 Torrentio Config');g2.append(mi('Config','Dán link manifest',s.torrentio_config?'Có':'Mặc định','Config','torrentio_config',s));w.append(g2);
        var gA=mg('🌊 AIOStreams');gA.append(mi('URL','Dán full URL manifest.json',s.aio_url||'Chưa cài','AIO URL','aio_url',s));w.append(gA);

        var g4=mg('🗑️ Dữ liệu');
        var cl=si2('Xóa toàn bộ cài đặt','Khôi phục mặc định','Xóa');cl.find('.kk-stg-value').css('color','#f87171');
        bE(cl,function(){localStorage.removeItem(STG_KEY);localStorage.removeItem(HIST_KEY);_gc={movie:null,tv:null};Lampa.Noty.show('Đã xóa');Lampa.Activity.backward();});
        g4.append(cl);w.append(g4);

        w.append('<div style="text-align:center;opacity:0.4;margin-top:2em;font-size:0.85em;">KKPhim v5.0.0 — Dual UI</div>');
        scroll.append(w);comp.start();
    };
    function mg(t){return $('<div style="margin-bottom:1.2em;"></div>').append('<div style="font-size:0.9em;font-weight:600;opacity:0.7;margin-bottom:0.6em;">'+t+'</div>');}
    function si2(n,d,v){return $('<div class="selector" style="display:flex;justify-content:space-between;align-items:center;padding:0.7em 1em;margin:0.3em 0;background:rgba(255,255,255,0.05);border-radius:8px;"><div><div style="font-weight:500;">'+E(n)+'</div>'+(d?'<div style="font-size:0.8em;opacity:0.5;margin-top:2px;">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value" style="opacity:0.6;font-size:0.9em;">'+E(v)+'</div></div>');}
    function mo(n,d,on,cb){var it=si2(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
    function mi(n,d,val,prompt,key,s){var it=si2(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(prompt,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
function inCSS(){
    if($('#kk-css').length)return;
    // Inject external CSS only for custom UI mode
    if(uiMode()==='custom'){
        var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;document.head.appendChild(l);
    }
    // Common CSS
    var commonId='kk-common-css';
    if(!$('#'+commonId).length){
        $('head').append('<style id="'+commonId+'">'+
            '.kkp-similar-row::-webkit-scrollbar{display:none}'+
            '.kkp-cast-row::-webkit-scrollbar{display:none}'+
            '.view--kkphim span,.view--ophim span,.view--torrent-kk span,.view--copysub span{font-size:0.85em;}'+
        '</style>');
    }
}

// ══════════════════════════════════════════════════════════════
// MENU
// ══════════════════════════════════════════════════════════════
function addMenu(){
    function ins(){
        if($('.menu__item[data-action="kkphim"]').length)return;

        // Main menu item
        var ICON='<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        var $item=$('<li data-action="kkphim" class="menu__item selector"><div class="menu__ico">'+ICON+'</div><div class="menu__text">KKPhim</div></li>');
        $item.on('hover:enter',function(){
            if(uiMode()==='lampa'){
                Lampa.Activity.push({title:'KKPhim',component:'category',source:SOURCE_NAME,page:1});
            }else{
                Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});
            }
        });
        $('.menu .menu__list').eq(0).append($item);

        // Settings menu item
        if(!$('.menu__item[data-action="kkphim_stg"]').length){
            var $stg=$('<li data-action="kkphim_stg" class="menu__item selector"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg></div><div class="menu__text">KK Settings</div></li>');
            $stg.on('hover:enter',function(){Lampa.Activity.push({url:'',title:'KK Settings',component:'kkphim_settings'});});
            $item.after($stg);
        }
    }
    setTimeout(ins,500);
    Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});
}

// ══════════════════════════════════════════════════════════════
// CUSTOM UI COMPONENTS (kept from original for custom mode)
// Only register if needed - simplified versions
// ══════════════════════════════════════════════════════════════
function registerCustomComponents(){
    // These are the custom UI components from your original plugin
    // They will only be used when ui_mode === 'custom'
    // For brevity, I'll register placeholder that redirects to Lampa native

    // Main page for custom mode
    Lampa.Component.add('kkphim_main',function(){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        this.create=function(){
            comp.activity.loader(true);cScr(scroll);
            var w=$('<div style="padding:1em;"></div>');
            w.append('<div style="font-size:1.3em;font-weight:700;margin-bottom:1em;color:#01b4e4;">KKPhim Custom UI</div>');
            w.append('<div class="selector" style="padding:1em;background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:0.5em;cursor:pointer;">🔍 Tìm phim</div>');
            bE(w.find('.selector').eq(0),oTSearch);

            // Load categories
            var enabledSources=getEnabledSources();
            Object.keys(enabledSources).forEach(function(sk){
                var source=enabledSources[sk];
                [{name:'🎬 Phim mới ('+source.name+')',api:'danh-sach/phim-moi-cap-nhat'},{name:'🎥 Phim lẻ ('+source.name+')',api:'v1/api/danh-sach/phim-le'},{name:'📺 Phim bộ ('+source.name+')',api:'v1/api/danh-sach/phim-bo'}].forEach(function(cat){
                    fetch(source.api+cat.api+'?page=1').then(function(r){return r.json();}).then(function(res){
                        var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).filter(function(i){return i&&i.slug;}).slice(0,10);
                        if(list.length){
                            var row=$('<div style="margin:1em 0;"><div style="font-weight:600;margin-bottom:0.5em;">'+E(cat.name)+'</div><div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;"></div></div>');
                            var $r=row.find('div').last();
                            list.forEach(function(item){
                                var poster=fImg(item.poster_url||item.thumb_url,source);
                                var $c=$('<div class="selector" style="flex:0 0 100px;cursor:pointer;"><img src="'+poster+'" style="width:100px;height:150px;object-fit:cover;border-radius:6px;" onerror="this.style.opacity=0.2"/><div style="font-size:11px;margin-top:4px;line-height:1.2;">'+E(item.name||'')+'</div></div>');
                                $c.on('hover:enter click',function(){Lampa.Activity.push({component:'full',id:item.slug,source:SOURCE_NAME,card:normalizeItem(item)});});
                                $r.append($c);
                            });
                            w.append(row);
                        }
                    }).catch(function(){});
                });
            });

            scroll.append(w);comp.activity.loader(false);comp.start();
        };
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    Lampa.Component.add('kkphim_tmdb_search',function(obj){
        // Redirect to Lampa native search
        Lampa.Activity.push({component:'search',search:obj.keyword||'',source:SOURCE_NAME});
    });
}

// ══════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════
function startPlugin(){
    inCSS();
    applyFontScale();
    injectTorrentMenuCSS();

    // Register Lampa API source (always, for both modes)
    Lampa.Api.sources[SOURCE_NAME]=new KKPhimApi();

    // Register components
    Lampa.Component.add('kkphim_list',KKPhimListComponent);
    registerCustomComponents();

    // Lampa native hooks (buttons, cast, similar on full page)
    injectLampaFullHooks();
    injectViewMore();

    // Menu
    addMenu();
}

if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});

})();