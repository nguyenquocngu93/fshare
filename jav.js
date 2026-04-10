/* KKPhim Plugin v4.6.1 - FIXED */
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
var TMDB_W300='https://image.tmdb.org/t/p/w300';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};
var HIST_KEY='kkphim_history';
var _detCtx={imdbId:null};

/* ---- STORAGE ---- */
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

/* ---- HISTORY ---- */
function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(e){return[];}}
function setHist(v){try{localStorage.setItem(HIST_KEY,JSON.stringify(v||[]));}catch(e){}}
function saveHistory(item){
 try{
 if(!item||!item.tmdb_id)return;
 var arr=getHist();
 var id='tmdb_'+item.tmdb_id+'_'+item.media_type;
 arr=arr.filter(function(x){return x.id!==id;});
 arr.unshift({id:id,tmdb_id:item.tmdb_id,media_type:item.media_type,name:item.name||item.title||'',poster_url:item.poster_url||'',year:item.year||'',origin_name:item.origin_name||'',time:Date.now()});
 if(arr.length>50)arr=arr.slice(0,50);
 setHist(arr);
 }catch(e){}
}
function lastHistory(){var h=getHist();return h&&h.length?h[0]:null;}

/* ---- STRING HELPERS - FIXED ---- */
function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

function nStr(s){
    var str = String(s||'').toLowerCase().trim();
    str = removeVietnameseTones(str);
    return str.replace(/[^\w\s]/g,'').replace(/\s+/g,' ');
}

function getBaseName(name){
 if(!name)return'';
 return name
 .replace(/[\s\-]*[\(\[]?\s*[Ss]eason\s*\d+\s*[\)\]]?/gi,'')
 .replace(/[\s\-]*[\(\[]?\s*[Pp]h[aầ]n\s*\d+\s*[\)\]]?/gi,'')
 .replace(/[\s\-]*[\(\[]?\s*[Mm][uù]a\s*\d+\s*[\)\]]?/gi,'')
 .replace(/[\s\-]*[\(\[]?\s*[Pp]han\s*\d+\s*[\)\]]?/gi,'')
 .replace(/[\s\-]*\bS\d+\b/g,'')
 .trim();
}

function getBaseSlug(slug){
 if(!slug)return'';
 return slug
 .replace(/-?season-?\d+/gi,'')
 .replace(/-?phan-?\d+/gi,'')
 .replace(/-?mua-?\d+/gi,'')
 .replace(/-?s\d+$/gi,'')
 .replace(/^-+|-+$/g,'')
 .replace(/-+/g,'-');
}

function getItemType(item){
 var t=item.type||'';
 if(t==='series'||t==='tvshows'||t==='tv'||t==='hoathinh')return'tv';
 if(t==='single'||t==='movie')return'movie';
 var ec=String(item.episode_current||'');
 var et=String(item.episode_total||'');
 if(ec&&ec!=='Full'&&ec!=='full')return'tv';
 if(et&&parseInt(et)>1)return'tv';
 return'movie';
}

function getTypeLabel(item){
 var t=getItemType(item);
 return t==='tv'?'TV':'Film';
}

/* ---- FONT SCALE - FIXED ---- */
function applyFontScale(){
 var id='kkphim-font-scale';
 $('#'+id).remove();
 var fs=fontScale();
 var r=fs/100;
 var css='.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}'
 +'.kk-card-origin,.kk-card-h .kk-card-origin{font-size:'+(0.95*r)+'em!important;}'
 +'.kk-hm-year{font-size:'+(1.15*r)+'em!important;}'
 +'.kk-hm-country{font-size:'+(1.1*r)+'em!important;}'
 +'.kk-hm-origin{font-size:'+(1.1*r)+'em!important;}'
 +'.kk-hm-tagline{font-size:'+(1.2*r)+'em!important;}'
 +'.kk-hm-vote{font-size:'+(1.8*r)+'em!important;}'
 +'.kk-hm-vote small{font-size:'+(0.5*r)+'em!important;}'
 +'.kk-hm-badge{font-size:'+(1.05*r)+'em!important;}'
 +'.kk-hm-rt,.kk-hm-genres{font-size:'+(1.1*r)+'em!important;}'
 +'.kk-body-genres .kk-genre{font-size:'+(1.15*r)+'em!important;}'
 +'.kk-crew-name{font-size:'+(1.5*r)+'em!important;}'
 +'.kk-body-desc-text{font-size:'+(1.25*r)+'em!important;line-height:1.8!important;}'
 +'.kk-src-btn .kk-sb-main{font-size:'+(1.5*r)+'em!important;}'
 +'.kk-src-btn .kk-sb-sub{font-size:'+(1.1*r)+'em!important;}'
 +'.kk-ep-c{font-size:'+(1.1*r)+'em!important;}'
 +'.kk-cast-name{font-size:'+(1.3*r)+'em!important;}'
 +'.kk-stg-group-title{font-size:'+(1.3*r)+'em!important;}'
 +'.kk-sd-title{font-size:'+(1.6*r)+'em!important;}'
 +'.kk-netflix-ep-title{font-size:'+(1.3*r)+'em!important;font-weight:700!important;}'
 +'.kk-block-title{font-size:'+(1.2*r)+'em!important;}'
 +'.kk-type-tab{font-size:'+(0.88*r)+'em!important;padding:'+(0.4*r)+'em '+(1*r)+'em!important;}'
 +'.kk-tag-chip{font-size:'+(0.8*r)+'em!important;padding:'+(0.3*r)+'em '+(0.8*r)+'em!important;}'
 +'.kk-prod-name{font-size:'+(0.75*r)+'em!important;}'
 +'.kk-prod-country{font-size:'+(0.65*r)+'em!important;}'
 +'.kk-genre-chip{font-size:'+(0.84*r)+'em!important;}'
 +'.kk-sn-nm{font-size:'+(0.88*r)+'em!important;}'
 +'.kk-sn-bd{font-size:'+(0.78*r)+'em!important;}';
 $('head').append('<style id="'+id+'">'+css+'</style>');
}

/* ---- IMAGE / UTILS ---- */
function fImg(u,src){
 if(!u)return'';
 if(u.indexOf('http')===0)return u;
 var b=src?src.img:SOURCES.kkphim.img;
 return b?b+u:u;
}
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function gEp1(eps){
 for(var i=0;i<(eps||[]).length;i++){
 if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];
 }
 return null;
}
function pLogo(imgs){
 if(!imgs||!imgs.logos||!imgs.logos.length)return null;
 return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;
}
function cTio(raw){
 if(!raw)return'';
 raw=String(raw).trim();
 if(!raw)return'';
 var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
 if(m)return m[1];
 m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
 if(m)return m[1];
 if(raw.indexOf('torrentio.strem.fun')>-1){
 raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');
 if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');
 return'';
 }
 raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');
 return raw.indexOf('=')===-1?'':raw;
}
function cAio(raw){
 if(!raw)return'';
 return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}

/* ---- UI HELPERS ---- */
function bE(el,fn){
 var sx=0,sy=0,mv=false,tc=false;
 el.on('touchstart',function(e){
 var t=((e.originalEvent||e).touches||[])[0];
 if(t){sx=t.clientX;sy=t.clientY;mv=false;}
 });
 el.on('touchmove',function(e){
 var t=((e.originalEvent||e).touches||[])[0];
 if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;
 });
 el.on('touchend',function(e){
 if(mv)return;
 tc=true;
 e.preventDefault();
 e.stopPropagation();
 setTimeout(function(){fn.call(el[0],e);},100);
 setTimeout(function(){tc=false;},350);
 });
 el.on('click',function(e){
 if(tc||mv)return;
 e.preventDefault();
 e.stopPropagation();
 fn.call(this,e);
 });
 el.on('hover:enter',function(e){fn.call(this,e);});
}

function eScr(scroll){
 var el=scroll.render();
 el.css({overflow:'hidden',position:'relative',height:'100%'});
 var b=el.find('.scroll__body');
 var p={
 'transform':'none',
 'overflow-y':'auto',
 'overflow-x':'hidden',
 '-webkit-overflow-scrolling':'touch',
 'height':'100%',
 'padding-bottom':'8em',
 'touch-action':'pan-y'
 };
 b.css($.extend({position:'relative'},p));
 if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});
}

function cScr(scroll){try{scroll.render().find('.scroll__body').empty();}catch(e){}}

function aCtrl(scroll){
 Lampa.Controller.add('content',{
 toggle:function(){
 Lampa.Controller.collectionSet(scroll.render());
 Lampa.Controller.collectionFocus(false,scroll.render());
 },
 left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
 right:function(){Navigator.move('right');},
 up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
 down:function(){Navigator.move('down');},
 back:function(){Lampa.Activity.backward();}
 });
 setTimeout(function(){
 Lampa.Controller.toggle('content');
 Lampa.Controller.collectionSet(scroll.render());
 Lampa.Controller.collectionFocus(false,scroll.render());
 },0);
}

/* ---- STREAM PARSE ---- */
function pStream(st){
 var rawName=String(st.name||'');
 var rawDesc=String(st.description||'');
 var rawTitle=String(st.title||'');
 var rawAll=rawName+'\n'+rawDesc+'\n'+rawTitle;
 var name=rawName.split('\n')[0].trim()||rawTitle.split('\n')[0].trim()||'?';
 var qual='';
 var qm=rawAll.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?|BluRay|WEB-?DL|HDTV|CAM)\b/i);
 if(qm)qual=qm[1].toUpperCase();
 var size='';
 var sP=[
 /\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i,
 /\b([\d.,]+)\s*(GB|GiB)\b/i,
 /\b([\d.,]+)\s*(MB|MiB)\b/i
 ];
 for(var i=0;i<sP.length;i++){
 var sm=rawAll.match(sP[i]);
 if(sm){size=sm[2]?sm[1]+' '+sm[2]:sm[1].trim();break;}
 }
 var seeds='';
 var sdP=[/\s*(?:Seeders?:?\s*)?(\d+)/i,/(\d+)\s*seed/i];
 for(var j=0;j<sdP.length;j++){
 var se=rawAll.match(sdP[j]);
 if(se){seeds=se[1];break;}
 }
 if(st.behaviorHints&&typeof st.behaviorHints==='object'){
 var bh=st.behaviorHints;
 if(!size&&bh.videoSize){
 var bytes=Number(bh.videoSize);
 if(!isNaN(bytes)&&bytes>0){
 if(bytes>=1073741824)size=(bytes/1073741824).toFixed(1)+' GB';
 else if(bytes>=1048576)size=(bytes/1048576).toFixed(0)+' MB';
 }
 }
 }
return{name:name,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual};
}

function fmtStream(s){
 var parts=[s.name];
 if(s.quality&&s.name.toUpperCase().indexOf(s.quality)===-1)parts[0]+=' ['+s.quality+']';
 var meta=[];
 if(s.size)meta.push('Size: '+s.size);
 if(s.seeds)meta.push('Seeds: '+s.seeds);
 if(meta.length)parts.push(meta.join(' | '));
 return parts.join('\n');
}

/* ---- TMDB API ---- */
async function tFetch(path){
 var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});
 if(!r.ok)throw new Error('TMDB '+r.status);
 return await r.json();
}

async function gImdb(type,id){
 if(!id)return null;
 try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}
}

async function gSeasons(id){
 try{
 var r=await tFetch('/tv/'+id+'?language='+tmLang());
 if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){
 return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0,poster_path:s.poster_path||'',overview:s.overview||'',air_date:s.air_date||''};
 });
 }catch(e){}
 return[];
}

async function lGenres(type){
 if(_gc[type])return _gc[type];
 try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}
}

async function tPersonC(pid){
 try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}
}

async function tKeywords(type,id){
 try{
 var path=type==='tv'?'/tv/'+id+'/keywords':'/movie/'+id+'/keywords';
 var r=await tFetch(path);
 return r.keywords||r.results||[];
 }catch(e){return[];}
}

async function tDiscoverCompany(type,cid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_companies='+cid+'&page='+(p||1));}
async function tDiscoverKeyword(type,kid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_keywords='+kid+'&page='+(p||1));}
async function tCompanyDetail(cid){try{return await tFetch('/company/'+cid);}catch(e){return null;}}
async function tDiscoverNetwork(nid,p){return await tFetch('/discover/tv?language='+tmLang()+'&sort_by=popularity.desc&with_networks='+nid+'&page='+(p||1));}
async function tCollectionDetail(cid){try{return await tFetch('/collection/'+cid+'?language='+tmLang());}catch(e){return null;}}
async function tSeasonDetail(tvId,sn){try{return await tFetch('/tv/'+tvId+'/season/'+sn+'?language='+tmLang());}catch(e){return null;}}

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

function tNorm(item){
 if(!item)return null;
 var mt=item.media_type||(item.first_air_date?'tv':'movie');
 return{
 tmdb_id:item.id,
 media_type:mt,
 name:item.title||item.name||'',
 poster_url:item.poster_path?TMDB_W500+item.poster_path:'',
 backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',
 year:(item.release_date||item.first_air_date||'').slice(0,4),
 vote:item.vote_average?Number(item.vote_average).toFixed(1):'',
 origin_name:item.original_title||item.original_name||''
 };
}

/* ---- SEARCH & SLUG - FIXED ---- */
async function sSrc(source,kw,page){
 try{
 var pg=page||1;
 var cleanKw=String(kw||'').replace(/\s+page:\d+$/,'').trim();
 if(!cleanKw)return[];
 var url=source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(cleanKw)+'&limit=30&page='+pg;
 var r=await fetch(url);
 if(!r.ok)return[];
 var d=await r.json();
 var items=[];
 if(d&&d.status==='success'&&d.data&&d.data.items)items=d.data.items;
 else if(d&&d.data&&d.data.items)items=d.data.items;
 else if(d&&d.items)items=d.items;
 else if(Array.isArray(d))items=d;
 return items.filter(function(i){return i&&(i.slug||i._id);});
 }catch(e){
 console.warn('sSrc ['+source.key+']:',e.message||e);
 return[];
 }
}

function mScore(item,title,orig,year){
 var score=0;
 var nT=nStr(title||'');
 var nO=nStr(orig||'');
 var n1=nStr(item.name||item.title||'');
 var n2=nStr(item.origin_name||item.original_name||'');
 var nT_base=nStr(getBaseName(title||''));
 var nO_base=nStr(getBaseName(orig||''));
 var n1_base=nStr(getBaseName(item.name||item.title||''));
 var n2_base=nStr(getBaseName(item.origin_name||item.original_name||''));
 if(nT&&(n1===nT||n2===nT))score+=100;
 else if(nO&&nO!==nT&&(n1===nO||n2===nO))score+=100;
 else if(nT_base&&(n1_base===nT_base||n2_base===nT_base))score+=90;
 else if(nO_base&&nO_base!==nT_base&&(n1_base===nO_base||n2_base===nO_base))score+=90;
 else if(nT&&nT.length>=3&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))score+=60;
 else if(nO&&nO.length>=3&&(n1.indexOf(nO)>-1||nO.indexOf(n1)>-1))score+=55;
 else if(nT_base&&nT_base.length>=3&&(n1_base.indexOf(nT_base)>-1||nT_base.indexOf(n1_base)>-1))score+=40;
 else if(nO_base&&nO_base.length>=3&&(n2_base.indexOf(nO_base)>-1||nO_base.indexOf(n2_base)>-1))score+=40;
 if(score>0&&year&&item.year){
 var iy=parseInt(item.year);
 var ty=parseInt(year);
 if(iy===ty)score+=30;
 else if(Math.abs(iy-ty)<=1)score+=15;
 }
 return score;
}

function mBest(items,title,orig,year){
 if(!items||!items.length)return null;
 var scored=items.map(function(it){return{item:it,score:mScore(it,title,orig,year)};});
 scored.sort(function(a,b){return b.score-a.score;});
 if(scored[0].score>0)return scored[0].item;
 if(items.length===1)return items[0];
 if(year&&items.length<=3)return items[0];
 return null;
}

async function fSlugs(title,orig,year){
 var r={};
 var enabledSources=getEnabledSources();
 var baseTitle=getBaseName(title||'');
 var baseOrig=getBaseName(orig||'');
 var terms=[];
 if(baseOrig)terms.push(baseOrig);
 if(baseTitle&&terms.indexOf(baseTitle)===-1)terms.push(baseTitle);
 if(orig&&orig!==baseOrig&&terms.indexOf(orig)===-1)terms.push(orig);
 if(title&&title!==baseTitle&&terms.indexOf(title)===-1)terms.push(title);
 if(year){
 if(baseOrig)terms.push(baseOrig+' '+year);
 if(baseTitle&&baseTitle!==baseOrig)terms.push(baseTitle+' '+year);
 }
 if(!terms.length)terms.push(title||'');
 for(var i=0;i<terms.length;i++){
 var term=terms[i];
 if(!term||term.length<2)continue;
 var hasPending=false;
 for(var k in enabledSources){if(!r[k]){hasPending=true;break;}}
 if(!hasPending)break;
 for(var key in enabledSources){
 if(r[key])continue;
 var items=await sSrc(enabledSources[key],term,1);
 if(!items.length)continue;
 var best=mBest(items,title,orig,year);
 if(best&&best.slug)r[key]=best.slug;
 }
 }
 return r;
}

async function fDet(source,slug){
 try{
 var r=await fetch(source.api+'v1/api/phim/'+slug);
 if(r.ok){
 var d=await r.json();
 if(d&&d.status==='success'&&d.data){
 var item=d.data.item||d.data;
 return{movie:item,episodes:d.data.episodes||item.episodes||[]};
 }
 }
 }catch(e){}
 try{
 var r2=await fetch(source.api+'phim/'+slug);
 if(!r2.ok)return null;
 var d2=await r2.json();
 return{movie:d2.movie||d2.item||d2||{},episodes:d2.episodes||[]};
 }catch(e){return null;}
}

function exSn(name,slug){
 var text=(name||'')+' '+(slug||'');
 var patterns=[
 /[Ss]eason[\s\-._]*(\d+)/i,
 /[Pp]h[aầ]n[\s\-._]*(\d+)/i,
 /[Mm][uù]a[\s\-._]*(\d+)/i,
 /[Pp]han[\s\-._]*(\d+)/i,
 /\bS(\d{1,2})\b(?!\d)/,
 /-season-(\d+)/i,
 /-phan-(\d+)/i,
 /-mua-(\d+)/i,
 /(\d+)(?:st|nd|rd|th)\s*season/i
 ];
 for(var i=0;i<patterns.length;i++){
 var m=text.match(patterns[i]);
 if(m){var n=parseInt(m[1]);if(n>=1&&n<=50)return n;}
 }
 var slugEnd=(slug||'').match(/-(\d{1,2})$/);
 if(slugEnd){
 var n=parseInt(slugEnd[1]);
 var before=(slug||'').replace(/-(\d{1,2})$/,'');
 if(n>=2&&n<=20&&!before.match(/\d{3}$/))return n;
 }
 return 1;
}

async function fSeasonSlugs(source,title,orig,targetSeason,tmdbTotalSeasons){
 var results=[];
 try{
 var baseTitle=getBaseName(title||'');
 var baseOrig=getBaseName(orig||'');
 var terms=[];
 if(baseOrig)terms.push(baseOrig);
 if(baseTitle&&terms.indexOf(baseTitle)===-1)terms.push(baseTitle);
 if(orig&&orig!==baseOrig&&terms.indexOf(orig)===-1)terms.push(orig);
 if(title&&title!==baseTitle&&terms.indexOf(title)===-1)terms.push(title);
 if(!terms.length)terms.push(title||'');
 var allItems=[];
 var seenSlugs={};
 for(var t=0;t<terms.length;t++){
 var items=await sSrc(source,terms[t],1);
 for(var i=0;i<items.length;i++){
 if(items[i].slug&&!seenSlugs[items[i].slug]){
 seenSlugs[items[i].slug]=true;
 allItems.push(items[i]);
 }
 }
 }
 if(!allItems.length)return results;
 var groups={};
 for(var i=0;i<allItems.length;i++){
 var item=allItems[i];
 var base=getBaseSlug(item.slug||'');
 var sn=exSn(item.name||item.title||'',item.slug||'');
 if(!groups[base])groups[base]=[];
 var dup=false;
 for(var d=0;d<groups[base].length;d++){
 if(groups[base][d].season===sn&&groups[base][d].slug===item.slug){dup=true;break;}
 }
 if(!dup)groups[base].push({season:sn,slug:item.slug,name:item.name||item.title||'',year:item.year||'',_raw:item});
 }
 var bestBase=null;
 var bestScore=-1;
 for(var base in groups){
 if(!groups.hasOwnProperty(base))continue;
 var score=0;
 var seasons=groups[base];
 for(var s=0;s<seasons.length;s++){
 var ms=mScore(seasons[s]._raw||{},title,orig,seasons[s].year);
 if(ms>score)score=ms;
 }
 if(seasons.length>1)score+=5;
 if(score>bestScore){bestScore=score;bestBase=base;}
 }
 if(!bestBase||bestScore<10){
 var first=allItems[0];
 return[{slug:first.slug,name:first.name||first.title||'',season:1,source:source,year:first.year||''}];
 }
 var bestSeasons=groups[bestBase];
 bestSeasons.sort(function(a,b){return a.season-b.season;});
 var seenSn={};
 for(var i=0;i<bestSeasons.length;i++){
 var sv=bestSeasons[i];
 if(seenSn[sv.season])continue;
 if(tmdbTotalSeasons&&sv.season>tmdbTotalSeasons)continue;
 seenSn[sv.season]=true;
 results.push({slug:sv.slug,name:sv.name,season:sv.season,source:source,year:sv.year});
 }
 if(targetSeason){
 var exact=results.filter(function(rv){return rv.season===targetSeason;});
 if(exact.length)return exact;
 }
 }catch(e){console.error('fSeasonSlugs:',e);}
 return results;
}

async function findTmdbId(item,type){
 if(item.tmdb&&item.tmdb.id)return{id:item.tmdb.id,type:item.tmdb.type||type};
 var title=item.name||item.title||'';
 var orig=item.origin_name||item.original_name||'';
 var year=item.year||'';
 try{
 var searchType=type||'multi';
 var endpoint=searchType==='multi'?'/search/multi':'/search/'+searchType;
 var res=await tFetch(endpoint+'?language='+tmLang()+'&query='+encodeURIComponent(orig||title)+'&page=1');
 var results=(res.results||[]).filter(function(rv){return rv.media_type!=='person';});
 for(var i=0;i<results.length;i++){
 var rv=results[i];
 var rName=nStr(rv.title||rv.name||'');
 var rOrig=nStr(rv.original_title||rv.original_name||'');
 var rYear=(rv.release_date||rv.first_air_date||'').slice(0,4);
 var nT=nStr(title);
 var nO=nStr(orig);
 var nameMatch=(nT&&(rName===nT||rOrig===nT))||(nO&&(rName===nO||rOrig===nO));
 var yearMatch=!year||!rYear||year===rYear||Math.abs(parseInt(year)-parseInt(rYear))<=1;
 if(nameMatch&&yearMatch)return{id:rv.id,type:rv.media_type||(rv.first_air_date?'tv':'movie')};
 }
 if(results.length)return{id:results[0].id,type:results[0].media_type||(results[0].first_air_date?'tv':'movie')};
 }catch(e){}
 return null;
}

/* ---- TORRSERVER ---- */
function simplePlay(title,url){Lampa.Player.play({title:title,url:url});}
function tsU(p){
 var h=tsHost();
 if(!h)return'';
 h=h.replace(/\/+$/,'');
 if(h.indexOf('http')!==0)h='http://'+h;
 return h+p;
}
function tsH(){
 var h={'Content-Type':'application/json'};
 var pw=tsPass();
 if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);
 return h;
}
function bMag(h){
 var m='magnet:?xt=urn:btih:'+h;
 ['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){
 m+='&tr='+encodeURIComponent(t);
 });
 return m;
}

async function playTS(stream,title,poster,fi){
 if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}
 Lampa.Noty.show('Gửi TS...');
 try{
 var u=tsU('/torrents');
 var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});
 if(!r.ok)throw new Error('TS:'+r.status);
 var td=await r.json();
 var hash=td.hash||stream.infoHash;
 await dly(2000);
 var info=null;
 var rt=0;
 while(rt<3){
 try{
 var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});
 info=await r2.json();
 if(info&&info.file_stats&&info.file_stats.length)break;
 }catch(e){}
 rt++;
 await dly(1500);
 }
 var files=[];
 if(info&&info.file_stats){
 files=info.file_stats.filter(function(f){
 return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
 }).sort(function(a,b){return(a.id||0)-(b.id||0);});
 }
 var playFile=function(fileUrl){Lampa.Player.play({title:title,url:fileUrl});};
 if(!files.length)playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));
 else if(files.length===1)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play'));
 else if(fi!==undefined&&fi!==null&&fi>=0)playFile(tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play'));
 else{
 Lampa.Select.show({
 title:'Chọn file',
 items:files.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f};}),
 onSelect:function(a){playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));},
 onBack:function(){Lampa.Controller.toggle('content');}
 });
 }
 }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

function tioU(type,imdb,s,e){
 var t=type==='tv'?'series':'movie';
 var id=imdb;
 if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
 var c=cTio(tioConf());
 return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';
}

function aioU(type,imdb,s,e){
 var base=cAio(aioUrl());
 if(!base)return'';
 var t=type==='tv'?'series':'movie';
 var id=imdb;
 if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
 return base+'/stream/'+t+'/'+id+'.json';
}

async function fStreams(type,imdb,s,e){
 var eng=tEngine();
 var url;
 if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}
 else{url=tioU(type,imdb,s,e);}
 var r=await fetch(url);
 if(!r.ok)throw new Error(eng+' '+r.status);
 var d=await r.json();
 return(d.streams||[]).map(pStream);
}

function injectTorrentMenuCSS(){
 var id='kk-torrent-menu-css';
 if($('#'+id).length)return;
 $('head').append('<style id="'+id+'">.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;display:block!important;}.selectbox .selectbox-item{height:auto!important;max-height:none!important;}</style>');
}

function showStr(streams,title,poster){
 injectTorrentMenuCSS();
 var ts=!!tsHost();
 var eng=tEngine()==='aio'?'AIO':'Torrent';
 Lampa.Select.show({
 title:eng+': '+title+' ('+streams.length+')'+(ts?' > TS':''),
 items:streams.slice(0,40).map(function(s){return{title:fmtStream(s),value:s};}),
 onSelect:function(a){
 var s=a.value;
 if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);
 else if(s.url)Lampa.Player.play({title:title,url:s.url});
 else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TS!':'Không có link');
 },
 onBack:function(){Lampa.Controller.toggle('content');}
 });
}

async function oTorMov(tid,title,poster,imdb){
 Lampa.Noty.show('Tìm torrent...');
 try{
 var id=imdb||await gImdb('movie',tid);
 if(!id){Lampa.Noty.show('Không có IMDB');return;}
 var st=await fStreams('movie',id);
 if(!st.length){Lampa.Noty.show('Không có stream');return;}
 showStr(st,title,poster);
 }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

async function oTorTV(tid,title,poster,imdb){
 Lampa.Noty.show('Tải season...');
 try{
 var id=imdb||await gImdb('tv',tid);
 if(!id){Lampa.Noty.show('Không có IMDB');return;}
 var sn=await gSeasons(tid);
 if(sn.length>1){
 Lampa.Select.show({
 title:'Chọn Season',
 items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),
 onSelect:function(a){pTorEp(a.value,id,title,poster);},
 onBack:function(){Lampa.Controller.toggle('content');}
 });
 }else if(sn.length===1)pTorEp(sn[0],id,title,poster);
 }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

function pTorEp(season,imdb,title,poster){
 var items=[];
 for(var i=1;i<=(season.episode_count||1);i++){
 items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});
 }
 Lampa.Select.show({
 title:season.name,
 items:items,
 onSelect:async function(a){
 var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);
 Lampa.Noty.show('Tìm '+lb+'...');
 try{
 var st=await fStreams('tv',imdb,a.value.s,a.value.e);
 if(!st.length){Lampa.Noty.show('Không có');return;}
 showStr(st,lb,poster);
 }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
 },
 onBack:function(){Lampa.Controller.toggle('content');}
 });
}

async function playEpTorrent(imdbId,seasonNum,epNum,title,poster){
 var lb=title+' S'+pd(seasonNum)+'E'+pd(epNum);
 Lampa.Noty.show('Tìm torrent '+lb+'...');
 try{
 var st=await fStreams('tv',imdbId,seasonNum,epNum);
 if(!st.length){Lampa.Noty.show('Không có stream');return;}
 showStr(st,lb,poster);
 }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- CSS - FIXED FOR COLLECTION ---- */
function injectExtraCSS(){
 var id='kk-extra-css-v461';
 if($('#'+id).length)return;
 var css=''
 +'.kk-hm-origin{font-size:0.78em;color:rgba(255,255,255,0.45);margin-top:0.15em;font-style:italic;}'
 +'.kk-prod-list{display:flex;overflow-x:auto;gap:1.2em;padding:0.5em 0 0.6em;-webkit-overflow-scrolling:touch;scrollbar-width:none;}'
 +'.kk-prod-list::-webkit-scrollbar{display:none;}'
 +'.kk-prod-card{flex:0 0 auto;width:6em;display:flex;flex-direction:column;align-items:center;gap:0.4em;cursor:pointer;transition:all 0.25s;padding:0.4em 0;border-radius:0.8em;opacity:0.85;}'
 +'.kk-prod-card:hover,.kk-prod-card.focus,.kk-prod-card.selected{transform:translateY(-3px);opacity:1;background:rgba(255,255,255,0.06);}'
 +'.kk-prod-logo{width:4em;height:4em;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:rgba(255,255,255,0.95);padding:0.45em;}'
 +'.kk-prod-logo img{max-width:80%;max-height:80%;object-fit:contain;}'
 +'.kk-prod-logo-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.3em;font-weight:700;color:#666;border-radius:50%;}'
 +'.kk-prod-name{font-size:0.75em;font-weight:600;color:rgba(255,255,255,0.85);text-align:center;line-height:1.25;}'
 +'.kk-prod-country{font-size:0.65em;color:rgba(255,255,255,0.35);}'
 +'.kk-tags-list{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.4em 0 0.5em;}'
 +'.kk-tag-chip{display:inline-flex;align-items:center;padding:0.3em 0.8em;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:2em;font-size:0.8em;color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.2s;white-space:nowrap;}'
 +'.kk-tag-chip:hover,.kk-tag-chip.focus,.kk-tag-chip.selected{background:rgba(1,180,228,0.18);border-color:rgba(1,180,228,0.5);color:#fff;}'
 +'.kk-coll-card{position:relative;border-radius:0.8em;overflow:hidden;cursor:pointer;min-height:9em;transition:all 0.25s;}'
 +'.kk-coll-card:hover,.kk-coll-card.focus,.kk-coll-card.selected{transform:scale(1.02);}'
 +'.kk-coll-bg{position:absolute;inset:0;}'
 +'.kk-coll-bg img{width:100%;height:100%;object-fit:cover;}'
 +'.kk-coll-ov{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0.15) 100%);}'
 +'.kk-coll-inner{position:relative;z-index:1;display:flex;align-items:center;gap:0.8em;padding:1.2em;min-height:9em;}'
 +'.kk-coll-poster{width:3.5em;height:5.2em;flex-shrink:0;border-radius:0.3em;overflow:hidden;}'
 +'.kk-coll-poster img{width:100%;height:100%;object-fit:cover;}'
 +'.kk-coll-info{flex:1;}'
 +'.kk-coll-label{font-size:0.7em;text-transform:uppercase;color:rgba(1,180,228,0.8);font-weight:600;margin-bottom:0.15em;}'
 +'.kk-coll-name{font-size:0.95em;font-weight:700;color:#fff;line-height:1.3;}'
 +'.kk-coll-header{position:relative;overflow:hidden;min-height:12em;}'
 +'.kk-coll-header-bg{position:absolute;inset:0;}'
 +'.kk-coll-header-bg img{width:100%;height:100%;object-fit:cover;}'
 +'.kk-coll-header-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.9));}'
 +'.kk-coll-header-inner{position:relative;z-index:1;display:flex;align-items:center;gap:1.2em;padding:2em 1.5em;min-height:12em;}'
 +'.kk-coll-header-poster{width:5em;height:7.5em;flex-shrink:0;border-radius:0.5em;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.5);}'
 +'.kk-coll-header-poster img{width:100%;height:100%;object-fit:cover;}'
 +'.kk-coll-header-info{flex:1;}'
 +'.kk-coll-header-label{font-size:0.8em;text-transform:uppercase;color:rgba(1,180,228,0.9);font-weight:600;margin-bottom:0.3em;}'
 +'.kk-coll-header-name{font-size:1.4em;font-weight:700;color:#fff;line-height:1.3;margin-bottom:0.3em;}'
 +'.kk-coll-header-count{font-size:0.9em;color:rgba(255,255,255,0.6);}'
 +'.kk-coll-overview{padding:1em 1.5em;color:rgba(255,255,255,0.75);line-height:1.6;font-size:0.95em;}'
 +'.kk-seasons-list{display:flex;overflow-x:auto;gap:0.7em;padding:0.4em 0 0.6em;-webkit-overflow-scrolling:touch;scrollbar-width:none;}'
 +'.kk-seasons-list::-webkit-scrollbar{display:none;}'
 +'.kk-season-card{flex:0 0 auto;width:10em;cursor:pointer;transition:all 0.25s;border-radius:0.5em;overflow:hidden;background:rgba(255,255,255,0.04);}'
 +'.kk-season-card:hover,.kk-season-card.focus,.kk-season-card.selected{background:rgba(255,255,255,0.1);transform:translateY(-2px);}'
 +'.kk-season-poster{width:100%;aspect-ratio:2/3;overflow:hidden;background:rgba(255,255,255,0.05);}'
 +'.kk-season-poster img{width:100%;height:100%;object-fit:cover;}'
 +'.kk-season-poster-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:700;color:rgba(255,255,255,0.12);}'
 +'.kk-season-info{padding:0.4em 0.4em 0.5em;}'
 +'.kk-season-name{font-size:0.75em;font-weight:600;color:rgba(255,255,255,0.88);}'
 +'.kk-season-meta{font-size:0.65em;color:rgba(255,255,255,0.4);margin-top:0.1em;}'
 +'.kk-ep-chips{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.4em 0 0.6em;}'
 +'.kk-sv-hd{font-size:0.85em;font-weight:600;color:rgba(255,255,255,0.7);padding:0.5em 0 0.2em;}'
 +'.kk-ep-c{font-size:0.88em;padding:0.35em 0.75em;background:rgba(255,255,255,0.07);border-radius:0.4em;cursor:pointer;color:rgba(255,255,255,0.85);transition:all 0.15s;}'
 +'.kk-ep-c:hover,.kk-ep-c.focus,.kk-ep-c.selected{background:rgba(1,180,228,0.25);color:#fff;}'
 +'.kk-ep-c.off{opacity:0.35;cursor:default;}'
 +'.kk-ep-bk{font-size:0.85em;padding:0.4em 0.8em;margin-bottom:0.5em;cursor:pointer;color:rgba(1,180,228,0.8);}'
 +'.kk-ep-ld,.kk-ep-er{font-size:0.88em;padding:0.6em 0;color:rgba(255,255,255,0.5);}'
 +'.kk-sn-it{display:flex;justify-content:space-between;align-items:center;padding:0.5em 0.8em;border-radius:0.4em;cursor:pointer;background:rgba(255,255,255,0.04);margin-bottom:0.3em;transition:background 0.15s;}'
 +'.kk-sn-it:hover,.kk-sn-it.focus,.kk-sn-it.selected{background:rgba(255,255,255,0.1);}'
 +'.kk-sn-nm{color:rgba(255,255,255,0.85);font-size:0.88em;}'
 +'.kk-sn-bd{font-size:0.78em;color:rgba(255,255,255,0.4);}'
 +'.kk-sn-notfound{opacity:0.4;cursor:default;}';
 $('head').append('<style id="'+id+'">'+css+'</style>');
}

function inCSS(){
 if($('#kk-css').length)return;
 var l=document.createElement('link');
 l.id='kk-css';
 l.rel='stylesheet';
 l.href=CSS_URL;
 document.head.appendChild(l);
 var fixId='kk-hgrid-fix';
 if(!$('#'+fixId).length){
 $('head').append('<style id="'+fixId+'">.kk-grid--cat-h{display:grid!important;grid-template-columns:repeat('+hgridCols()+',minmax(0,1fr))!important;}</style>');
 }
 injectExtraCSS();
}

/* ---- COLLECTION SECTION - FIXED ---- */
function mkCollectionSection(collection){
 if(!collection||!collection.id)return $('<div></div>');
 var sec=$('<div class="kk-section" style="padding:2.5em 1.5em 0;background:#1a1a1e;"></div>');
 var bk=collection.backdrop_path?TMDB_W500+collection.backdrop_path:'';
 var ps=collection.poster_path?TMDB_W200+collection.poster_path:'';
 var card=$('<div class="kk-coll-card selector"></div>');
 var html='<div class="kk-coll-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div style="background:#222;height:100%;"></div>')+'</div>';
 html+='<div class="kk-coll-ov"></div>';
 html+='<div class="kk-coll-inner">';
 if(ps)html+='<div class="kk-coll-poster"><img src="'+ps+'" loading="lazy"></div>';
 html+='<div class="kk-coll-info">';
 html+='<div class="kk-coll-label">Bộ sưu tập</div>';
 html+='<div class="kk-coll-name">'+E(collection.name||'')+'</div>';
 html+='</div>';
 html+='</div>';
 card.html(html);
 bE(card,function(){
   Lampa.Activity.push({
     url:'',
     title:collection.name||'',
     component:'kkphim_collection',
     collection_id:collection.id,
     page_num:1
   });
 });
 sec.append(card);
 return sec;
}

/* ---- COLLECTION COMPONENT - FIXED ---- */
Lampa.Component.add('kkphim_collection',function(obj){
 var scroll=new Lampa.Scroll({mask:true,over:true});
 var comp=this;
 
 this.create=function(){
   comp.activity.loader(true);
   cScr(scroll);
   
   tCollectionDetail(obj.collection_id).then(function(coll){
     if(!coll){comp.activity.loader(false);return;}
     
     var bk=coll.backdrop_path?TMDB_W500+coll.backdrop_path:'';
     var ps=coll.poster_path?TMDB_W200+coll.poster_path:'';
     
     var header=$('<div class="kk-coll-header"></div>');
     header.html('<div class="kk-coll-header-bg">'+(bk?'<img src="'+bk+'">':'<div style="background:#1a1a1e;height:100%;"></div>')+'</div>'
       +'<div class="kk-coll-header-overlay"></div>'
       +'<div class="kk-coll-header-inner">'
       +(ps?'<div class="kk-coll-header-poster"><img src="'+ps+'"></div>':'')
       +'<div class="kk-coll-header-info">'
       +'<div class="kk-coll-header-label">Bộ sưu tập</div>'
       +'<div class="kk-coll-header-name">'+E(coll.name||'')+'</div>'
       +'<div class="kk-coll-header-count">'+((coll.parts||[]).length)+' phim</div>'
       +'</div></div>');
     scroll.append(header);
     
     if(coll.overview){
       scroll.append($('<div class="kk-coll-overview">'+fTxt(coll.overview)+'</div>'));
     }
     
     var parts=coll.parts||[];
     parts.sort(function(a,b){
       return(a.release_date||'9999').localeCompare(b.release_date||'9999');
     });
     
     var cm=catMode();
     var grid;
     if(cm==='hgrid'){
       grid=$('<div class="kk-grid kk-grid--cat-h"></div>');
     }else{
       grid=$('<div class="kk-grid"></div>');
       grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');
     }
     
     parts.forEach(function(p){
       p.media_type='movie';
       var cardFunc=cm==='hgrid'?mkTCH:mkTC;
       grid.append(cardFunc(p).addClass('kk-card--grid'));
     });
     
     scroll.append($('<div class="kk-grid-wrap" style="padding:1.5em;"></div>').append(grid));
     comp.activity.loader(false);
     comp.start();
   }).catch(function(){
     comp.activity.loader(false);
   });
 };
 
 this.start=function(){aCtrl(scroll);eScr(scroll);};
 this.pause=function(){};
 this.stop=function(){};
 this.render=function(){return scroll.render();};
 this.destroy=function(){scroll.destroy();};
});

/* ---- MENU ---- */
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

/* ---- STARTUP ---- */
function startPlugin(){
 inCSS();
 applyFontScale();
 addM();
 injectTorrentMenuCSS();
 console.log('[KKPhim] v4.6.1 FIXED OK');
}

if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});

})();