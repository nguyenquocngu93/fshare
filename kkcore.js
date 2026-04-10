/* KKPhim UI v4.6.2 - File 1/3: Giao diện chính */
(function(){
'use strict';
if(window.__kkphim_ui_started)return;
window.__kkphim_ui_started=true;

/* FIX: Expose flag cho các plugin phụ thuộc */
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
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};
var HIST_KEY='kkphim_history';

/* FIX 3: Expose _detCtx ra window */
var _detCtx={imdbId:null};
window._kkphim_detCtx=_detCtx;

/* ---- STORAGE ---- */
function ls(){try{return JSON.parse(localStorage.getItem(STG_KEY))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem(STG_KEY,JSON.stringify(c));}catch(e){}}
function isSourceEnabled(key){var s=ls();if(s['source_'+key+'_enabled']===undefined)return true;return s['source_'+key+'_enabled']===true;}
function getEnabledSources(){var r={};Object.keys(SOURCES).forEach(function(k){if(isSourceEnabled(k))r[k]=SOURCES[k];});return r;}
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

/* ---- STRING HELPERS ---- */
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}
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
function getTypeLabel(item){var t=getItemType(item);return t==='tv'?'TV':'Phim';}

/* ---- FONT SCALE ---- */
/* FIX 1: Bổ sung tất cả class bị thiếu trong fontScale */
function applyFontScale(){
  var id='kkphim-font-scale';
  $('#'+id).remove();
  var fs=fontScale();
  var r=fs/100;
  var css=''
    /* Cards */
    +'.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}'
    +'.kk-card-origin,.kk-card-h .kk-card-origin{font-size:'+(0.95*r)+'em!important;}'
    /* Hero meta */
    +'.kk-hm-year{font-size:'+(1.15*r)+'em!important;}'
    +'.kk-hm-country{font-size:'+(1.1*r)+'em!important;}'
    +'.kk-hm-origin{font-size:'+(1.1*r)+'em!important;}'
    +'.kk-hm-tagline{font-size:'+(1.2*r)+'em!important;}'
    +'.kk-hm-vote{font-size:'+(1.8*r)+'em!important;}'
    +'.kk-hm-vote small{font-size:'+(0.5*r)+'em!important;}'
    +'.kk-hm-badge{font-size:'+(1.05*r)+'em!important;}'
    +'.kk-hm-rt,.kk-hm-genres{font-size:'+(1.1*r)+'em!important;}'
    /* Genres / Tags */
    +'.kk-body-genres .kk-genre{font-size:'+(1.15*r)+'em!important;}'
    /* FIX 1a: Tag chips */
    +'.kk-tag-chip{font-size:'+(0.85*r)+'em!important;}'
    /* Crew */
    +'.kk-crew-name{font-size:'+(1.5*r)+'em!important;}'
    /* Description */
    +'.kk-body-desc-text{font-size:'+(1.25*r)+'em!important;line-height:1.8!important;}'
    /* Source buttons */
    +'.kk-src-btn .kk-sb-main{font-size:'+(1.5*r)+'em!important;}'
    +'.kk-src-btn .kk-sb-sub{font-size:'+(1.1*r)+'em!important;}'
    /* Episode chips */
    +'.kk-ep-c{font-size:'+(1.1*r)+'em!important;}'
    /* Cast */
    +'.kk-cast-name{font-size:'+(1.3*r)+'em!important;}'
    /* Settings */
    +'.kk-stg-group-title{font-size:'+(1.3*r)+'em!important;}'
    /* Season detail */
    +'.kk-sd-title{font-size:'+(1.6*r)+'em!important;}'
    /* Netflix ep */
    +'.kk-netflix-ep-title{font-size:'+(1.3*r)+'em!important;font-weight:700!important;}'
    /* Block title */
    +'.kk-block-title{font-size:'+(1.2*r)+'em!important;}'
    /* FIX 1b: Tabs */
    +'.kk-type-tab{font-size:'+(0.9*r)+'em!important;}'
    /* FIX 1c: Production / Network */
    +'.kk-prod-name{font-size:'+(0.8*r)+'em!important;}'
    +'.kk-prod-country{font-size:'+(0.7*r)+'em!important;}'
    /* FIX 1d: Collection */
    +'.kk-coll-name{font-size:'+(1.0*r)+'em!important;}'
    +'.kk-coll-label{font-size:'+(0.75*r)+'em!important;}'
    /* Season cards */
    +'.kk-season-name{font-size:'+(0.8*r)+'em!important;}'
    +'.kk-season-meta{font-size:'+(0.7*r)+'em!important;}'
    /* Page header */
    +'.kk-page-header-name{font-size:'+(1.2*r)+'em!important;}'
    +'.kk-page-header-meta{font-size:'+(0.88*r)+'em!important;}'
    /* Keyword badge */
    +'.kk-keyword-header-badge{font-size:'+(1.1*r)+'em!important;}';
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

/* ---- UI HELPERS ---- */
function bE(el,fn){
  var sx=0,sy=0,mv=false,tc=false;
  el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
  el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
  el.on('touchend',function(e){
    if(mv)return;tc=true;e.preventDefault();e.stopPropagation();
    setTimeout(function(){fn.call(el[0],e);},100);
    setTimeout(function(){tc=false;},350);
  });
  el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
  el.on('hover:enter',function(e){fn.call(this,e);});
}
function eScr(scroll){
  var el=scroll.render();
  el.css({overflow:'hidden',position:'relative',height:'100%'});
  var b=el.find('.scroll__body');
  var p={'transform':'none','overflow-y':'auto','overflow-x':'hidden','-webkit-overflow-scrolling':'touch','height':'100%','padding-bottom':'8em','touch-action':'pan-y'};
  b.css($.extend({position:'relative'},p));
  if(b[0])Object.keys(p).forEach(function(k){b[0].style.setProperty(k,p[k],'important');});
}
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
  setTimeout(function(){
    Lampa.Controller.toggle('content');
    Lampa.Controller.collectionSet(scroll.render());
    Lampa.Controller.collectionFocus(false,scroll.render());
  },0);
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
    tmdb_id:item.id,media_type:mt,
    name:item.title||item.name||'',
    poster_url:item.poster_path?TMDB_W500+item.poster_path:'',
    backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',
    year:(item.release_date||item.first_air_date||'').slice(0,4),
    vote:item.vote_average?Number(item.vote_average).toFixed(1):'',
    origin_name:item.original_title||item.original_name||''
  };
}

/* ---- TMDB SEARCH helpers ---- */
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
      var nT=nStr(title);var nO=nStr(orig);
      var nameMatch=(nT&&(rName===nT||rOrig===nT))||(nO&&(rName===nO||rOrig===nO));
      var yearMatch=!year||!rYear||year===rYear||Math.abs(parseInt(year)-parseInt(rYear))<=1;
      if(nameMatch&&yearMatch)return{id:rv.id,type:rv.media_type||(rv.first_air_date?'tv':'movie')};
    }
    if(results.length)return{id:results[0].id,type:results[0].media_type||(results[0].first_air_date?'tv':'movie')};
  }catch(e){}
  return null;
}

/* ---- CARDS TMDB ---- */
function mkTC(item){
  var d=tNorm(item);
  if(!d||!d.tmdb_id)return $('<div></div>');
  var img=d.poster_url?'<img src="'+d.poster_url+'" loading="lazy">':'<div class="kk-card-noposter"><span>Không có ảnh</span></div>';
  var typeLabel=d.media_type==='tv'?'TV':'Phim';
  var h='<div class="kk-card selector"><div class="kk-card-img">'+img;
  if(d.vote)h+='<div class="kk-card-q">'+E(d.vote)+'</div>';
  h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div>';
  h+='<div class="kk-card-body"><div class="kk-card-name">'+E(d.name)+'</div>';
  if(d.origin_name&&d.origin_name!==d.name)h+='<div class="kk-card-origin">'+E(d.origin_name)+'</div>';
  h+='<div class="kk-card-meta">';
  if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
  h+='</div></div></div>';
  var c=$(h);
  bE(c,function(){
    saveHistory(d);
    Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});
  });
  return c;
}
function mkTCH(item){
  var d=tNorm(item);
  if(!d||!d.tmdb_id)return $('<div></div>');
  var backdrop=d.backdrop_url||d.poster_url||'';
  var imgH=backdrop?'<img src="'+backdrop+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>Không có ảnh</span></div>';
  var typeLabel=d.media_type==='tv'?'TV':'Phim';
  var h='<div class="kk-card-h selector"><div class="kk-card-h-img">'+imgH;
  if(d.vote)h+='<div class="kk-card-q">'+E(d.vote)+'</div>';
  h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div>';
  h+='<div class="kk-card-h-body"><div class="kk-card-name">'+E(d.name)+'</div>';
  if(d.origin_name&&d.origin_name!==d.name)h+='<div class="kk-card-origin">'+E(d.origin_name)+'</div>';
  h+='<div class="kk-card-meta">';
  if(d.year)h+='<span class="kk-card-year">'+E(d.year)+'</span>';
  h+='</div></div></div>';
  var c=$(h);
  bE(c,function(){
    saveHistory(d);
    Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});
  });
  return c;
}
function mkTCPF(item){
  var d=tNorm(item);
  if(!d||!d.tmdb_id)return $('<div></div>');
  var bk=d.backdrop_url||d.poster_url||'';
  var ps=d.poster_url||'';
  var vote=d.vote||'';
  var vNum=Number(vote);
  var vClass=vNum>=7?'high':vNum>=5?'mid':'low';
  var typeLabel=d.media_type==='tv'?'TV Series':'Phim lẻ';
  var card=$('<div class="kk-pfc selector"></div>');
  var html='<div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+'</div>';
  html+='<div class="kk-pfc-overlay"></div>';
  html+='<div class="kk-pfc-inner">';
  html+=ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'<div class="kk-pfc-poster kk-pfc-poster--empty"></div>';
  html+='<div class="kk-pfc-info"><div class="kk-pfc-badge">'+E(typeLabel)+'</div>';
  html+='<div class="kk-pfc-title">'+E(d.name)+'</div>';
  if(d.origin_name&&d.origin_name!==d.name)html+='<div class="kk-pfc-origin">'+E(d.origin_name)+'</div>';
  html+='<div class="kk-pfc-meta">';
  if(d.year)html+='<span class="kk-pfc-year">'+E(d.year)+'</span>';
  if(vote)html+='<span class="kk-pfc-vote kk-pfc-vote--'+vClass+'">'+vote+'</span>';
  html+='</div></div></div>';
  card.html(html);
  bE(card,function(){
    saveHistory(d);
    Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});
  });
  return card;
}

/* ---- SOURCE CARDS ---- */
function mkSourceCard(item,source){
  var p=fImg(item.poster_url||item.thumb_url,source);
  var typeLabel=getTypeLabel(item);
  var h='<div class="kk-card selector" data-loading="false"><div class="kk-card-img">';
  if(p)h+='<img src="'+p+'" loading="lazy">';
  else h+='<div class="kk-card-noposter"><span>Không có ảnh</span></div>';
  if(item.quality)h+='<div class="kk-card-q">'+E(item.quality)+'</div>';
  h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div>';
  h+='<div class="kk-card-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>';
  if(item.origin_name&&item.origin_name!==(item.name||item.title))h+='<div class="kk-card-origin">'+E(item.origin_name)+'</div>';
  h+='<div class="kk-card-meta">';
  if(item.year)h+='<span class="kk-card-year">'+E(item.year)+'</span>';
  h+='</div></div></div>';
  var c=$(h);
  bE(c,async function(){
    if(c.attr('data-loading')==='true')return;
    c.attr('data-loading','true');
    Lampa.Noty.show('Đang tìm TMDB...');
    var type=getItemType(item)==='tv'?'tv':'movie';
    var tmdbInfo=await findTmdbId(item,type);
    if(tmdbInfo&&tmdbInfo.id){
      Lampa.Activity.push({url:'',title:item.name||item.title||'',component:'kkphim_tmdb_detail',tmdb_id:tmdbInfo.id,media_type:tmdbInfo.type,page:1});
    }else{
      Lampa.Noty.show('Không tìm thấy trên TMDB');
    }
    c.attr('data-loading','false');
  });
  return c;
}
function mkSourceCardH(item,source){
  var p=fImg(item.thumb_url||item.poster_url,source);
  var typeLabel=getTypeLabel(item);
  var h='<div class="kk-card-h selector" data-loading="false"><div class="kk-card-h-img">';
  if(p)h+='<img src="'+p+'" loading="lazy">';
  else h+='<div class="kk-card-h-noposter"><span>Không có ảnh</span></div>';
  if(item.quality)h+='<div class="kk-card-q">'+E(item.quality)+'</div>';
  h+='<div class="kk-card-ep kk-card-ep--type">'+typeLabel+'</div></div>';
  h+='<div class="kk-card-h-body"><div class="kk-card-name">'+E(item.name||item.title||'')+'</div>';
  if(item.origin_name&&item.origin_name!==(item.name||item.title))h+='<div class="kk-card-origin">'+E(item.origin_name)+'</div>';
  h+='<div class="kk-card-meta">';
  if(item.year)h+='<span class="kk-card-year">'+E(item.year)+'</span>';
  h+='</div></div></div>';
  var c=$(h);
  bE(c,async function(){
    if(c.attr('data-loading')==='true')return;
    c.attr('data-loading','true');
    Lampa.Noty.show('Đang tìm TMDB...');
    var type=getItemType(item)==='tv'?'tv':'movie';
    var tmdbInfo=await findTmdbId(item,type);
    if(tmdbInfo&&tmdbInfo.id){
      Lampa.Activity.push({url:'',title:item.name||item.title||'',component:'kkphim_tmdb_detail',tmdb_id:tmdbInfo.id,media_type:tmdbInfo.type,page:1});
    }else{
      Lampa.Noty.show('Không tìm thấy trên TMDB');
    }
    c.attr('data-loading','false');
  });
  return c;
}
function mkRowList(items,isTmdb,source){
  var cm=cardMode();
  var rl=$('<div class="kk-row-list"></div>');
  if(cm==='poster'){
    items.forEach(function(i){rl.append(isTmdb?mkTCPF(i):mkSourceCard(i,source));});
  }else{
    items.forEach(function(i){rl.append(isTmdb?mkTCH(i):mkSourceCardH(i,source));});
  }
  return rl;
}

/* ---- CAST / CREW ---- */
function mkCastList(castArr,hasTmdb){
  var list=$('<div class="kk-cast-list"></div>');
  castArr.forEach(function(c){
    var av=c.profile_path?'<img src="'+TMDB_W500+c.profile_path+'" loading="lazy">':'<div class="kk-cast-empty"></div>';
    var card;
    if(hasTmdb&&c.id){
      card=$('<div class="kk-cast-card selector" data-pid="'+c.id+'"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');
      bE(card,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});
    }else{
      card=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');
    }
    list.append(card);
  });
  return list;
}
function mkDirHtml(dirs,isTmdb){
  if(!dirs||!dirs.length)return'';
  var first=dirs[0];var rest=dirs.slice(1);
  var avatarH=first.profile_path?'<div class="kk-crew-avatar"><img src="'+TMDB_W500+first.profile_path+'" loading="lazy"></div>':'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';
  var nameH=(isTmdb&&first.id)?'<span class="kk-crew-name selector" data-pid="'+first.id+'">'+E(first.name||'')+'</span>':'<span class="kk-crew-name">'+E(first.name||'')+'</span>';
  var restH='';
  if(rest.length){
    var restNames=rest.map(function(c){return(isTmdb&&c.id)?'<span class="kk-crew-rest-name selector" data-pid="'+c.id+'">'+E(c.name||'')+'</span>':'<span class="kk-crew-rest-name">'+E(c.name||'')+'</span>';});
    restH='<div class="kk-crew-rest">'+restNames.join('')+'</div>';
  }
  return'<div class="kk-crew">'+avatarH+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+nameH+'<span class="kk-crew-role">'+E(first.job||'Director')+'</span>'+restH+'</div></div>';
}
function bindDirClicks(el){
  el.find('.kk-crew-name[data-pid],.kk-crew-rest-name[data-pid]').each(function(){
    var sp=$(this);
    bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});
  });
}
function gHtml(genres,isTmdb){
  if(!genres||!genres.length)return'';
  var result='';
  for(var i=0;i<genres.length;i++){
    var g=genres[i];if(!g)continue;
    var gname=E(g.name||'');
    if(isTmdb)result+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gname+'">'+gname+'</span>';
    else result+='<span class="kk-genre">'+gname+'</span>';
  }
  return result;
}

/* ---- HERO / BODY ---- */
function mkHero(bk,ps,logoH,tH,origin,extra){
  extra=extra||{};
  var posterH=ps?'<img src="'+ps+'" loading="lazy">':'';
  var originH='';
  if(origin&&origin!==(extra._title||''))originH='<div class="kk-hm-origin">'+E(origin)+'</div>';
  var html='<div class="kk-hero">';
  html+='<div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-hero-backdrop-empty"></div>')+'</div>';
  html+='<div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+posterH+'</div></div>';
  html+='<div class="kk-hero-meta">';
  if(extra.year||extra.country){html+='<div class="kk-hm-yc">';if(extra.year)html+='<span class="kk-hm-year">'+E(extra.year)+'</span>';if(extra.country)html+='<span class="kk-hm-country">'+E(extra.country)+'</span>';html+='</div>';}
  html+=(logoH||tH)+originH;
  if(extra.tagline)html+='<div class="kk-hm-tagline">'+E(extra.tagline)+'</div>';
  html+='<div class="kk-hm-badges">';
  if(extra.vote)html+='<span class="kk-hm-vote">'+E(extra.vote)+' <small>TMDB</small></span>';
  if(extra.status)html+='<span class="kk-hm-badge">'+E(extra.status)+'</span>';
  html+='</div>';
  if(extra.runtime||extra.genres){html+='<div class="kk-hm-rtg">';if(extra.runtime)html+='<span class="kk-hm-rt">'+E(extra.runtime)+'</span>';if(extra.runtime&&extra.genres)html+='<span class="kk-hm-dot">&#8226;</span>';if(extra.genres)html+='<span class="kk-hm-genres">'+E(extra.genres)+'</span>';html+='</div>';}
  html+='</div></div></div>';
  return $(html);
}
function mkBody(v,y,rt,extra,genreHtml,crewH,desc){
  return $('<div class="kk-body"><div class="kk-body-genres">'+genreHtml+'</div>'+crewH+'<div class="kk-body-desc"><span class="kk-body-desc-label">Nội dung</span><div class="kk-body-desc-text">'+fTxt(desc)+'</div></div></div>');
}

/* ---- SECTIONS ---- */
function mkProductionSection(companies){
  if(!companies||!companies.length)return $('<div></div>');
  var sec=$('<div class="kk-section"></div>');
  sec.append('<div class="kk-block-title">Hãng sản xuất</div>');
  var list=$('<div class="kk-prod-list"></div>');
  companies.forEach(function(comp){
    var logoUrl=comp.logo_path?TMDB_W200+comp.logo_path:'';
    var card=$('<div class="kk-prod-card selector"></div>');
    var html='<div class="kk-prod-logo">'+(logoUrl?'<img src="'+logoUrl+'" loading="lazy">':'<div class="kk-prod-logo-empty">'+E((comp.name||'?')[0])+'</div>')+'</div>';
    html+='<div class="kk-prod-name">'+E(comp.name||'')+'</div>';
    if(comp.origin_country)html+='<div class="kk-prod-country">'+E(comp.origin_country)+'</div>';
    card.html(html);
    bE(card,function(){Lampa.Activity.push({url:'',title:comp.name||'',component:'kkphim_company',company_id:comp.id,company_name:comp.name||'',company_logo:logoUrl,page_num:1});});
    list.append(card);
  });
  sec.append(list);return sec;
}
function mkNetworkSection(networks){
  if(!networks||!networks.length)return $('<div></div>');
  var sec=$('<div class="kk-section"></div>');
  sec.append('<div class="kk-block-title">Kênh phát sóng</div>');
  var list=$('<div class="kk-prod-list"></div>');
  networks.forEach(function(net){
    var logoUrl=net.logo_path?TMDB_W200+net.logo_path:'';
    var card=$('<div class="kk-prod-card selector"></div>');
    var html='<div class="kk-prod-logo">'+(logoUrl?'<img src="'+logoUrl+'" loading="lazy">':'<div class="kk-prod-logo-empty">'+E((net.name||'?')[0])+'</div>')+'</div>';
    html+='<div class="kk-prod-name">'+E(net.name||'')+'</div>';
    if(net.origin_country)html+='<div class="kk-prod-country">'+E(net.origin_country)+'</div>';
    card.html(html);
    bE(card,function(){Lampa.Activity.push({url:'',title:net.name||'',component:'kkphim_network',network_id:net.id,network_name:net.name||'',network_logo:logoUrl,page_num:1});});
    list.append(card);
  });
  sec.append(list);return sec;
}
function mkTagsSection(keywords){
  if(!keywords||!keywords.length)return $('<div></div>');
  var sec=$('<div class="kk-section"></div>');
  sec.append('<div class="kk-block-title">Thẻ</div>');
  var list=$('<div class="kk-tags-list"></div>');
  keywords.forEach(function(kw){
    var tag=$('<div class="kk-tag-chip selector">'+E(kw.name||'')+'</div>');
    bE(tag,function(){Lampa.Activity.push({url:'',title:kw.name||'',component:'kkphim_keyword',keyword_id:kw.id,keyword_name:kw.name||'',page_num:1});});
    list.append(tag);
  });
  sec.append(list);return sec;
}

/* FIX 2: Sửa lại Collection section - layout lỗi do CSS position conflict */
function mkCollectionSection(collection){
  if(!collection||!collection.id)return $('<div></div>');
  var sec=$('<div class="kk-section"></div>');
  sec.append('<div class="kk-block-title">Bộ sưu tập</div>');
  var bk=collection.backdrop_path?TMDB_W500+collection.backdrop_path:'';
  var ps=collection.poster_path?TMDB_W200+collection.poster_path:'';
  var card=$('<div class="kk-coll-card selector"></div>');

  /* FIX 2: Dùng style inline rõ ràng tránh conflict với CSS cũ */
  var html='';
  html+='<div class="kk-coll-bg">'+(bk?'<img src="'+bk+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;">':'')+'</div>';
  html+='<div class="kk-coll-ov"></div>';
  html+='<div class="kk-coll-inner">';
  if(ps)html+='<div class="kk-coll-poster"><img src="'+ps+'" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></div>';
  html+='<div class="kk-coll-info">';
  html+='<div class="kk-coll-label">Bộ sưu tập</div>';
  html+='<div class="kk-coll-name">'+E(collection.name||'')+'</div>';
  if(collection.overview)html+='<div class="kk-coll-overview" style="font-size:0.78em;color:rgba(255,255,255,0.55);margin-top:0.3em;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+E(collection.overview)+'</div>';
  html+='</div>';
  html+='</div>';

  card.html(html);
  bE(card,function(){
    Lampa.Activity.push({url:'',title:collection.name||'',component:'kkphim_collection',collection_id:collection.id,page_num:1});
  });
  sec.append(card);
  return sec;
}

function mkSeasonsSection(seasons,tvId,tvTitle){
  if(!seasons||!seasons.length)return $('<div></div>');
  var sec=$('<div class="kk-section"></div>');
  sec.append('<div class="kk-block-title">Seasons</div>');
  var list=$('<div class="kk-seasons-list"></div>');
  seasons.forEach(function(s){
    var ps=s.poster_path?TMDB_W200+s.poster_path:'';
    var card=$('<div class="kk-season-card selector"></div>');
    var html='<div class="kk-season-poster">';
    html+=ps?'<img src="'+ps+'" loading="lazy">':'<div class="kk-season-poster-empty">S'+s.season_number+'</div>';
    html+='</div><div class="kk-season-info"><div class="kk-season-name">'+E(s.name||'Season '+s.season_number)+'</div>';
    var metaParts=[];
    if(s.air_date)metaParts.push(s.air_date.slice(0,4));
    if(s.episode_count)metaParts.push(s.episode_count+' tập');
    if(metaParts.length)html+='<div class="kk-season-meta">'+E(metaParts.join(' - '))+'</div>';
    html+='</div>';
    card.html(html);
    bE(card,function(){Lampa.Activity.push({url:'',title:tvTitle+' - '+s.name,component:'kkphim_season_detail',tv_id:tvId,season_number:s.season_number,tv_title:tvTitle,page:1});});
    list.append(card);
  });
  sec.append(list);return sec;
}

/* ---- ACTION BUTTONS ---- */
function mkSB(css,l1,l2){
  return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">&#9660;</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');
}

/* ---- CSS ---- */
function injectExtraCSS(){
  var id='kk-extra-css-v462';
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
    +'.kk-prod-name{font-size:0.78em;font-weight:600;color:rgba(255,255,255,0.85);text-align:center;line-height:1.25;}'
    +'.kk-prod-country{font-size:0.68em;color:rgba(255,255,255,0.35);}'
    +'.kk-tags-list{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.4em 0 0.5em;}'
    +'.kk-tag-chip{display:inline-flex;align-items:center;padding:0.3em 0.8em;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:2em;font-size:0.82em;color:rgba(255,255,255,0.7);cursor:pointer;transition:all 0.2s;white-space:nowrap;}'
    +'.kk-tag-chip:hover,.kk-tag-chip.focus,.kk-tag-chip.selected{background:rgba(1,180,228,0.18);border-color:rgba(1,180,228,0.5);color:#fff;}'
    /* FIX 2: Collection CSS viết lại hoàn toàn */
    +'.kk-coll-card{position:relative;border-radius:0.8em;overflow:hidden;cursor:pointer;min-height:9em;transition:all 0.25s;display:block;}'
    +'.kk-coll-card:hover,.kk-coll-card.focus,.kk-coll-card.selected{transform:scale(1.02);}'
    +'.kk-coll-bg{position:absolute;top:0;left:0;right:0;bottom:0;z-index:0;}'
    +'.kk-coll-ov{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.45) 60%,rgba(0,0,0,0.15) 100%);}'
    +'.kk-coll-inner{position:relative;z-index:2;display:flex;align-items:center;gap:0.8em;padding:0.9em 1em;min-height:9em;box-sizing:border-box;}'
    +'.kk-coll-poster{width:3.8em;height:5.5em;flex-shrink:0;border-radius:0.35em;overflow:hidden;background:rgba(255,255,255,0.05);}'
    +'.kk-coll-info{flex:1;min-width:0;}'
    +'.kk-coll-label{font-size:0.72em;text-transform:uppercase;color:rgba(1,180,228,0.85);font-weight:700;margin-bottom:0.2em;letter-spacing:0.05em;}'
    +'.kk-coll-name{font-size:1em;font-weight:700;color:#fff;line-height:1.3;}'
    /* Tabs - tăng size */
    +'.kk-type-tab{padding:0.4em 1em;border-radius:2em;font-size:0.88em;cursor:pointer;transition:all 0.2s;border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.04);}'
    +'.kk-type-tab--active{background:rgba(1,180,228,0.18);border-color:rgba(1,180,228,0.5);color:#01b4e4;font-weight:600;}'
    +'.kk-seasons-list{display:flex;overflow-x:auto;gap:0.7em;padding:0.4em 0 0.6em;-webkit-overflow-scrolling:touch;scrollbar-width:none;}'
    +'.kk-seasons-list::-webkit-scrollbar{display:none;}'
    +'.kk-season-card{flex:0 0 auto;width:10em;cursor:pointer;transition:all 0.25s;border-radius:0.5em;overflow:hidden;background:rgba(255,255,255,0.04);}'
    +'.kk-season-card:hover,.kk-season-card.focus,.kk-season-card.selected{background:rgba(255,255,255,0.1);transform:translateY(-2px);}'
    +'.kk-season-poster{width:100%;aspect-ratio:2/3;overflow:hidden;background:rgba(255,255,255,0.05);}'
    +'.kk-season-poster img{width:100%;height:100%;object-fit:cover;}'
    +'.kk-season-poster-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:700;color:rgba(255,255,255,0.12);}'
    +'.kk-season-info{padding:0.4em 0.4em 0.5em;}'
    +'.kk-season-name{font-size:0.78em;font-weight:600;color:rgba(255,255,255,0.88);}'
    +'.kk-season-meta{font-size:0.68em;color:rgba(255,255,255,0.4);margin-top:0.1em;}'
    +'.kk-ep-chips{display:flex;flex-wrap:wrap;gap:0.4em;padding:0.4em 0 0.6em;}'
    +'.kk-sv-hd{font-size:0.88em;font-weight:600;color:rgba(255,255,255,0.7);padding:0.5em 0 0.2em;}'
    +'.kk-ep-c{font-size:0.9em;padding:0.35em 0.75em;background:rgba(255,255,255,0.07);border-radius:0.4em;cursor:pointer;color:rgba(255,255,255,0.85);transition:all 0.15s;}'
    +'.kk-ep-c:hover,.kk-ep-c.focus,.kk-ep-c.selected{background:rgba(1,180,228,0.25);color:#fff;}'
    +'.kk-ep-c.off{opacity:0.35;cursor:default;}'
    +'.kk-ep-bk{font-size:0.88em;padding:0.4em 0.8em;margin-bottom:0.5em;cursor:pointer;color:rgba(1,180,228,0.8);}'
    +'.kk-ep-ld,.kk-ep-er{font-size:0.9em;padding:0.6em 0;color:rgba(255,255,255,0.5);}'
    +'.kk-sn-it{display:flex;justify-content:space-between;align-items:center;padding:0.5em 0.8em;border-radius:0.4em;cursor:pointer;background:rgba(255,255,255,0.04);margin-bottom:0.3em;transition:background 0.15s;}'
    +'.kk-sn-it:hover,.kk-sn-it.focus,.kk-sn-it.selected{background:rgba(255,255,255,0.1);}'
    +'.kk-sn-nm{color:rgba(255,255,255,0.85);font-size:0.9em;}'
    +'.kk-sn-bd{font-size:0.8em;color:rgba(255,255,255,0.4);}'
    +'.kk-sn-notfound{opacity:0.4;cursor:default;}'
    +'.kk-sd-header{padding:1.5em 1.5em 0.8em;display:flex;gap:1em;align-items:flex-start;}'
    +'.kk-sd-poster{width:6.5em;flex-shrink:0;border-radius:0.5em;overflow:hidden;aspect-ratio:2/3;background:rgba(255,255,255,0.05);}'
    +'.kk-sd-poster img{width:100%;height:100%;object-fit:cover;}'
    +'.kk-sd-info{flex:1;min-width:0;}'
    +'.kk-sd-title{font-size:1.1em;font-weight:700;color:#fff;margin-bottom:0.15em;}'
    +'.kk-sd-meta{font-size:0.84em;color:rgba(255,255,255,0.45);margin-bottom:0.25em;}'
    +'.kk-sd-overview{font-size:0.84em;color:rgba(255,255,255,0.55);line-height:1.35;}'
    +'.kk-netflix-eps{padding:0.5em 1.5em 1.5em;}'
    +'.kk-netflix-ep{display:flex;border-radius:0.5em;overflow:hidden;margin-bottom:0.5em;cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);}'
    +'.kk-netflix-ep:hover,.kk-netflix-ep.focus,.kk-netflix-ep.selected{background:rgba(255,255,255,0.1);}'
    +'.kk-netflix-ep-still{width:10em;min-width:10em;aspect-ratio:16/9;overflow:hidden;position:relative;background:rgba(255,255,255,0.04);flex-shrink:0;}'
    +'.kk-netflix-ep-still img{width:100%;height:100%;object-fit:cover;}'
    +'.kk-netflix-ep-still-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2em;color:rgba(255,255,255,0.08);}'
    +'.kk-netflix-ep-body{flex:1;padding:0.55em 0.7em;display:flex;flex-direction:column;justify-content:center;min-width:0;}'
    +'.kk-netflix-ep-title{font-size:0.9em;font-weight:600;color:rgba(255,255,255,0.92);margin-bottom:0.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    +'.kk-netflix-ep-desc{font-size:0.78em;color:rgba(255,255,255,0.45);line-height:1.4;}'
    +'.kk-type-tabs{display:flex;gap:0.5em;padding:0.3em 1.5em 0.6em;}'
    +'.kk-page-header{display:flex;align-items:center;gap:1.2em;padding:1.2em 1.5em 0.8em;}'
    +'.kk-page-header-logo{width:4.5em;height:4.5em;flex:0 0 auto;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border-radius:50%;padding:0.5em;overflow:hidden;}'
    +'.kk-page-header-logo img{max-width:85%;max-height:85%;object-fit:contain;}'
    +'.kk-page-header-logo-empty{font-size:1.6em;font-weight:700;color:#555;}'
    +'.kk-page-header-info{flex:1;min-width:0;}'
    +'.kk-page-header-name{font-size:1.15em;font-weight:700;color:#fff;}'
    +'.kk-page-header-meta{font-size:0.86em;color:rgba(255,255,255,0.5);}'
    +'.kk-keyword-header{padding:1.2em 1.5em 0.6em;}'
    +'.kk-keyword-header-badge{display:inline-flex;padding:0.5em 1.2em;background:rgba(1,180,228,0.12);border:1px solid rgba(1,180,228,0.3);border-radius:2em;font-size:1.08em;color:#01b4e4;font-weight:600;}'
    +'.kk-no-plugin-note{padding:0.6em 1em;background:rgba(255,200,0,0.08);border:1px solid rgba(255,200,0,0.2);border-radius:0.5em;font-size:0.85em;color:rgba(255,200,0,0.8);margin-top:0.5em;}';
  $('head').append('<style id="'+id+'">'+css+'</style>');
}

function inCSS(){
  if($('#kk-css').length)return;
  var l=document.createElement('link');
  l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;
  document.head.appendChild(l);
  var fixId='kk-hgrid-fix';
  if(!$('#'+fixId).length){
    $('head').append('<style id="'+fixId+'">.kk-grid--cat-h{display:grid!important;grid-template-columns:repeat('+hgridCols()+',minmax(0,1fr))!important;}</style>');
  }
  injectExtraCSS();
}

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

/* ---- GRID INFINITE ---- */
function mkGridInfinite(name,fetchFn,titleFn){
  Lampa.Component.add(name,function(obj){
    var scroll=new Lampa.Scroll({mask:true,over:true});
    var comp=this;
    var page=obj.page_num||1;
    var wrap=$('<div class="kk-grid-wrap"></div>');
    var titleEl=$('<div class="kk-grid-title">'+E(titleFn(obj))+'</div>');
    var gridContainer=$('<div></div>');
    var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
    var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
    var ld=false,done=false,curGrid=null;
    this.create=function(){
      comp.activity.loader(true);cScr(scroll);
      wrap.append(titleEl).append(gridContainer).append(spinner).append(endMsg);
      scroll.append(wrap);
      initGrid();
      var sb=scroll.render().find('.scroll__body');
      sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});
      doL();
    };
    function initGrid(){
      var cm=catMode();
      if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
      else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
      gridContainer.empty().append(curGrid);
    }
    function doL(){
      ld=true;spinner.show();
      fetchFn(obj,page).then(function(items){
        spinner.hide();
        if(!items.length){done=true;endMsg.show().text(page<=1?'Không có kết quả':'Đã hết');}
        else{
          var cm=catMode();
          items.forEach(function(i){curGrid.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});
          page++;
        }
        ld=false;comp.activity.loader(false);comp.start();
      }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi tải');comp.activity.loader(false);});
    }
    this.start=function(){aCtrl(scroll);eScr(scroll);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return scroll.render();};
    this.destroy=function(){scroll.destroy();};
  });
}

/* ---- SOURCE SEARCH ---- */
Lampa.Component.add('kkphim_source_search',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var sk=obj.source_key||'kkphim';
  var kw=obj.keyword||'';
  var source=SOURCES[sk];
  var page=1,ld=false,done=false,curGrid=null;
  var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
  var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
  var gridContainer=$('<div></div>');
  function initGrid(){
    var cm=catMode();
    if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
    gridContainer.empty().append(curGrid);
  }
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);initGrid();
    scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));
    scroll.render().find('.scroll__body').on('scroll',function(){if(ld||done)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
    doL();
  };
  function doL(){
    ld=true;spinner.show();
    sSrcAPI(source,kw,page).then(function(items){
      spinner.hide();
      if(!items||!items.length){done=true;endMsg.show().text(page<=1?'Không tìm thấy':'Đã hết');comp.activity.loader(false);ld=false;comp.start();return;}
      var cm=catMode();
      items.forEach(function(i){curGrid.append((cm==='hgrid'?mkSourceCardH(i,source):mkSourceCard(i,source)).addClass('kk-card--grid'));});
      page++;ld=false;comp.activity.loader(false);comp.start();
    }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};
  this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};
  this.destroy=function(){scroll.destroy();};
});

async function sSrcAPI(source,kw,page){
  try{
    var pg=page||1;
    var cleanKw=String(kw||'').replace(/\s+page:\d+$/,'').trim();
    if(!cleanKw)return[];
    var url=source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(cleanKw)+'&limit=30&page='+pg;
    var r=await fetch(url);if(!r.ok)return[];
    var d=await r.json();
    var items=[];
    if(d&&d.status==='success'&&d.data&&d.data.items)items=d.data.items;
    else if(d&&d.data&&d.data.items)items=d.data.items;
    else if(d&&d.items)items=d.items;
    else if(Array.isArray(d))items=d;
    return items.filter(function(i){return i&&(i.slug||i._id);});
  }catch(e){return[];}
}

/* ---- SOURCE LIST ---- */
Lampa.Component.add('kkphim_source_list',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var sk=obj.source_key||'ophim';
  var apiPath=obj.api_path||'';
  var source=SOURCES[sk]||SOURCES.ophim;
  var page=obj.page_num||1,ld=false,done=false,curGrid=null;
  var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
  var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
  var gridContainer=$('<div></div>');
  function initGrid(){
    var cm=catMode();
    if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
    gridContainer.empty().append(curGrid);
  }
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);initGrid();
    scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));
    var sb=scroll.render().find('.scroll__body');
    sb.on('scroll',function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});
    doL();
  };
  function doL(){
    ld=true;spinner.show();
    fetch(source.api+apiPath+'?page='+page).then(function(r){return r.json();}).then(function(res){
      var list=((res&&res.data&&res.data.items)||(res&&res.items)||[]).filter(function(i){return i&&i.slug;});
      spinner.hide();
      if(!list.length){done=true;endMsg.show().text(page<=1?'Không có':'Đã hết');comp.activity.loader(false);ld=false;comp.start();return;}
      var cm=catMode();
      list.forEach(function(i){curGrid.append((cm==='hgrid'?mkSourceCardH(i,source):mkSourceCard(i,source)).addClass('kk-card--grid'));});
      page++;ld=false;comp.activity.loader(false);comp.start();
    }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};
  this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};
  this.destroy=function(){scroll.destroy();};
});

/* ---- MAIN COMPONENT ---- */
Lampa.Component.add('kkphim_main',function(){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var currentTab='kkphim';
  var tabKK,tabOP,tabTMDB;
  var contentContainer;
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    var wrapper=$('<div class="kk-main-wrapper"></div>');
    var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">KKPhim</div><div class="kk-topbar-btns"><div class="kk-btn selector">Tìm kiếm</div><div class="kk-btn selector">Cài đặt</div></div></div>');
    bE($(tb.find('.kk-btn')[0]),function(){
      try{
        if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm kiếm',value:'',free:true},function(kw){if(kw)searchInCurrentTab(kw.trim());});return;}
      }catch(e){}
      var kw=window.prompt('Tìm kiếm:');if(kw)searchInCurrentTab(kw.trim());
    });
    bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});
    wrapper.append(tb);
    var tabs=$('<div class="kk-type-tabs" style="padding-top:0.8em"></div>');
    tabKK=$('<div class="kk-type-tab kk-type-tab--active selector">KKPhim</div>');
    tabOP=$('<div class="kk-type-tab selector">OPhim</div>');
    tabTMDB=$('<div class="kk-type-tab selector">TMDB</div>');
    bE(tabKK,function(){switchTab('kkphim');});
    bE(tabOP,function(){switchTab('ophim');});
    bE(tabTMDB,function(){switchTab('tmdb');});
    tabs.append(tabKK).append(tabOP).append(tabTMDB);
    wrapper.append(tabs);
    contentContainer=$('<div class="kk-tab-content"></div>');
    wrapper.append(contentContainer);
    scroll.append(wrapper);
    loadTab(currentTab);
    function switchTab(tab){
      if(currentTab===tab)return;
      currentTab=tab;
      tabKK.toggleClass('kk-type-tab--active',tab==='kkphim');
      tabOP.toggleClass('kk-type-tab--active',tab==='ophim');
      tabTMDB.toggleClass('kk-type-tab--active',tab==='tmdb');
      contentContainer.empty();comp.activity.loader(true);loadTab(tab);
    }
    function loadTab(tab){
      if(tab==='tmdb')loadTMDBTab();else loadSourceTab(SOURCES[tab]);
    }
    function searchInCurrentTab(kw){
      if(currentTab==='tmdb'){Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}
      else{var source=SOURCES[currentTab];Lampa.Activity.push({url:'',title:source.name+': '+kw,component:'kkphim_source_search',source_key:currentTab,keyword:kw,page_num:1});}
    }
  };
  function loadSourceTab(source){
    var srcCats=[
      {name:'Phim Mới Cập Nhật',api:'v1/api/danh-sach/phim-moi-cap-nhat'},
      {name:'Phim Lẻ Mới',api:'v1/api/danh-sach/phim-le'},
      {name:'Phim Bộ Mới',api:'v1/api/danh-sach/phim-bo'},
      {name:'Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'}
    ];
    var cm=cardMode();var cnt=cm==='poster'?12:rowCount();
    var loaded=0,total=srcCats.length;
    srcCats.forEach(function(cat){
      fetch(source.api+cat.api+'?page=1').then(function(r){return r.json();}).then(function(res){
        var list=((res&&res.data&&res.data.items)||(res&&res.items)||[]).filter(function(i){return i&&i.slug;});
        if(list.length){
          var row=$('<div class="kk-row"></div>');
          var mr=$('<div class="kk-row-more selector">Xem thêm</div>');
          bE(mr,function(){Lampa.Activity.push({url:'',title:cat.name,component:'kkphim_source_list',source_key:source.key,api_path:cat.api,page_num:1});});
          row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(cat.name)+'</div>').append(mr));
          row.append(mkRowList(list.slice(0,cnt),false,source));
          contentContainer.append(row);
        }
        loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}
      }).catch(function(){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}});
    });
  }
  function loadTMDBTab(){
    var tmdbSecs=[
      {name:'Xu hướng hôm nay',lt:'trending_day'},
      {name:'Xu hướng tuần',lt:'trending'},
      {name:'Chiếu rạp',lt:'now_playing'},
      {name:'Sắp chiếu',lt:'upcoming'},
      {name:'Phim lẻ phổ biến',lt:'popular_movies'},
      {name:'Phim bộ phổ biến',lt:'popular_tv'},
      {name:'Đang phát sóng',lt:'on_the_air'},
      {name:'Top phim lẻ',lt:'top_movies'},
      {name:'Top phim bộ',lt:'top_tv'}
    ];
    var cm=cardMode();var cnt=cm==='poster'?12:rowCount();
    var hist=lastHistory();
    if(hist&&hist.tmdb_id){
      tRec(hist.media_type||'movie',hist.tmdb_id,1).then(function(res){
        var items=(res.results||[]).slice(0,cnt);
        if(items.length){
          items.forEach(function(i){if(!i.media_type)i.media_type=hist.media_type||'movie';});
          var rowRec=$('<div class="kk-row"></div>');
          rowRec.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">Vì bạn đã xem "'+E(hist.name||'')+'"</div>'));
          rowRec.append(mkRowList(items,true));
          contentContainer.prepend(rowRec);
        }
      }).catch(function(){});
    }
    var rr=$('<div class="kk-row"></div>');
    rr.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">Ngẫu nhiên</div>'));
    var randC=$('<div></div>');rr.append(randC);contentContainer.append(rr);
    Promise.all([tRand('movie'),tRand('tv')]).then(function(res){
      var items=[];
      (res[0].results||[]).forEach(function(i){i.media_type='movie';items.push(i);});
      (res[1].results||[]).forEach(function(i){i.media_type='tv';items.push(i);});
      for(var si=items.length-1;si>0;si--){var sj=Math.floor(Math.random()*(si+1));var st=items[si];items[si]=items[sj];items[sj]=st;}
      randC.replaceWith(mkRowList(items.slice(0,cnt),true));
    }).catch(function(){});
    var loaded=0,total=tmdbSecs.length;
    tmdbSecs.forEach(function(sec){
      var fn=TFN[sec.lt];
      if(!fn){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}return;}
      fn(1).then(function(res){
        var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});
        if(items.length){
          var row=$('<div class="kk-row"></div>');
          var mr=$('<div class="kk-row-more selector">Xem thêm</div>');
          bE(mr,function(){Lampa.Activity.push({url:'',title:sec.name,component:'kkphim_tmdb_list',listType:sec.lt,page_num:1});});
          row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(sec.name)+'</div>').append(mr));
          row.append(mkRowList(items.slice(0,cnt),true));
          contentContainer.append(row);
        }
        loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}
      }).catch(function(){loaded++;if(loaded>=total){comp.activity.loader(false);comp.start();}});
    });
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};
  this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};
  this.destroy=function(){scroll.destroy();};
});

/* ---- TMDB LIST / SEARCH ---- */
mkGridInfinite('kkphim_tmdb_list',function(obj,page){
  var fn=TFN[obj.listType]||TFN.trending;
  return fn(page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});
},function(obj){return obj.title||'TMDB';});

mkGridInfinite('kkphim_tmdb_search',function(obj,page){
  return tSearchM(obj.keyword||'',page).then(function(r){return(r.results||[]).filter(function(i){return i.media_type!=='person';});});
},function(obj){return obj.keyword||'';});

/* ---- TABBED PAGE FACTORY ---- */
function mkTabbedPage(name,fetchMovie,fetchTV,mkHeader){
  Lampa.Component.add(name,function(obj){
    var scroll=new Lampa.Scroll({mask:true,over:true});
    var comp=this;
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
      if(mkHeader){var h=mkHeader(obj);if(h)scroll.append(h);}
      var tabs=$('<div class="kk-type-tabs"></div>');
      tabMovie=$('<div class="kk-type-tab kk-type-tab--active selector">Phim lẻ</div>');
      tabTV=$('<div class="kk-type-tab selector">Phim bộ</div>');
      bE(tabMovie,function(){if(curType==='movie')return;curType='movie';tabMovie.addClass('kk-type-tab--active');tabTV.removeClass('kk-type-tab--active');initGrid();endMsg.hide();mp=1;mdone=false;doL();});
      bE(tabTV,function(){if(curType==='tv')return;curType='tv';tabTV.addClass('kk-type-tab--active');tabMovie.removeClass('kk-type-tab--active');initGrid();endMsg.hide();tp=1;tdone=false;doL();});
      tabs.append(tabMovie).append(tabTV);scroll.append(tabs);
      scroll.append($('<div class="kk-grid-wrap" style="padding-top:0.3em"></div>').append(gridContainer).append(spinner).append(endMsg));
      initGrid();
      scroll.render().find('.scroll__body').on('scroll',function(){if(ld||(curType==='movie'?mdone:tdone))return;var el=this;if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)doL();});
      doL();
    };
    function doL(){
      ld=true;spinner.show();
      var page=curType==='movie'?mp:tp;
      var fn=curType==='movie'?fetchMovie:fetchTV;
      fn(obj,page).then(function(r){
        var items=(r.results||[]);spinner.hide();
        if(!items.length){if(curType==='movie')mdone=true;else tdone=true;endMsg.show().text(page<=1?'Không có':'Đã hết');}
        else{items.forEach(function(i){i.media_type=curType;});var cm=catMode();items.forEach(function(i){curGrid.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});if(curType==='movie')mp++;else tp++;}
        ld=false;comp.activity.loader(false);comp.start();
      }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});
    }
    this.start=function(){aCtrl(scroll);eScr(scroll);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return scroll.render();};
    this.destroy=function(){scroll.destroy();};
  });
}

mkTabbedPage('kkphim_company',
  function(obj,p){return tDiscoverCompany('movie',obj.company_id,p);},
  function(obj,p){return tDiscoverCompany('tv',obj.company_id,p);},
  function(obj){
    var header=$('<div class="kk-page-header"></div>');
    header.html('<div class="kk-page-header-logo">'+(obj.company_logo?'<img src="'+obj.company_logo+'">':'<div class="kk-page-header-logo-empty">'+E((obj.company_name||'?')[0])+'</div>')+'</div><div class="kk-page-header-info"><div class="kk-page-header-name">'+E(obj.company_name||'')+'</div><div class="kk-page-header-meta">Hãng sản xuất</div></div>');
    tCompanyDetail(obj.company_id).then(function(cd){if(cd&&cd.origin_country)header.find('.kk-page-header-meta').text('Hãng sản xuất - '+cd.origin_country);}).catch(function(){});
    return header;
  }
);

mkTabbedPage('kkphim_keyword',
  function(obj,p){return tDiscoverKeyword('movie',obj.keyword_id,p);},
  function(obj,p){return tDiscoverKeyword('tv',obj.keyword_id,p);},
  function(obj){return $('<div class="kk-keyword-header"></div>').html('<div class="kk-keyword-header-badge">'+E(obj.keyword_name||'')+'</div>');}
);

/* ---- NETWORK ---- */
Lampa.Component.add('kkphim_network',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var page=1,ld=false,done=false;
  var gridContainer=$('<div></div>'),curGrid=null;
  var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
  var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Đã hết</div>');
  function initGrid(){
    var cm=catMode();
    if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
    gridContainer.empty().append(curGrid);
  }
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    var header=$('<div class="kk-page-header"></div>');
    header.html('<div class="kk-page-header-logo">'+(obj.network_logo?'<img src="'+obj.network_logo+'">':'<div class="kk-page-header-logo-empty">'+E((obj.network_name||'?')[0])+'</div>')+'</div><div class="kk-page-header-info"><div class="kk-page-header-name">'+E(obj.network_name||'')+'</div><div class="kk-page-header-meta">Kênh phát sóng</div></div>');
    scroll.append(header);
    scroll.append($('<div class="kk-grid-wrap" style="padding-top:0.3em"></div>').append(gridContainer).append(spinner).append(endMsg));
    initGrid();
    scroll.render().find('.scroll__body').on('scroll',function(){if(ld||done)return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
    doL();
  };
  function doL(){
    ld=true;spinner.show();
    tDiscoverNetwork(obj.network_id,page).then(function(r){
      var items=(r.results||[]);spinner.hide();
      if(!items.length){done=true;endMsg.show().text(page<=1?'Không có':'Đã hết');}
      else{items.forEach(function(i){i.media_type='tv';});var cm=catMode();items.forEach(function(i){curGrid.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});page++;}
      ld=false;comp.activity.loader(false);comp.start();
    }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

/* ---- TMDB GENRE ---- */
Lampa.Component.add('kkphim_tmdb_genre',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var cg=String(obj.genre_id||'');
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
    var gb=$('<div class="kk-genre-bar"></div>');scroll.append(gb);
    var titleEl=$('<div class="kk-grid-title" style="padding:0 1.5em">'+E(obj.title||'')+'</div>');scroll.append(titleEl);
    var tabs=$('<div class="kk-type-tabs"></div>');
    tabMovie=$('<div class="kk-type-tab kk-type-tab--active selector">Phim lẻ</div>');
    tabTV=$('<div class="kk-type-tab selector">Phim bộ</div>');
    bE(tabMovie,function(){if(curType==='movie')return;curType='movie';tabMovie.addClass('kk-type-tab--active');tabTV.removeClass('kk-type-tab--active');initGrid();endMsg.hide();mp=1;mdone=false;doL();});
    bE(tabTV,function(){if(curType==='tv')return;curType='tv';tabTV.addClass('kk-type-tab--active');tabMovie.removeClass('kk-type-tab--active');initGrid();endMsg.hide();tp=1;tdone=false;doL();});
    tabs.append(tabMovie).append(tabTV);scroll.append(tabs);
    scroll.append($('<div class="kk-grid-wrap" style="padding-top:0.3em"></div>').append(gridContainer).append(spinner).append(endMsg));
    initGrid();
    scroll.render().find('.scroll__body').on('scroll',function(){if(ld||(curType==='movie'?mdone:tdone))return;if(this.scrollTop+this.clientHeight>=this.scrollHeight-400)doL();});
    Promise.all([lGenres('movie'),lGenres('tv')]).then(function(res){
      var mg2=[],sn={};
      (res[0]||[]).concat(res[1]||[]).forEach(function(g){if(!sn[g.id]){sn[g.id]=true;mg2.push(g);}});
      mg2.sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
      mg2.forEach(function(g){
        var on=String(g.id)===cg;
        var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+E(g.name)+'</div>');
        bE(ch,function(){Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',genre_id:g.id,page_num:1});});
        gb.append(ch);
      });
      var cur=mg2.find(function(g){return String(g.id)===cg;});
      if(cur)titleEl.text(cur.name);
      doL();
    }).catch(function(){doL();});
  };
  function doL(){
    ld=true;spinner.show();
    var page=curType==='movie'?mp:tp;
    tDiscover(curType,cg,page).then(function(r){
      var items=(r.results||[]);spinner.hide();
      if(!items.length){if(curType==='movie')mdone=true;else tdone=true;endMsg.show().text(page<=1?'Không có':'Đã hết');}
      else{items.forEach(function(i){i.media_type=curType;});var cm=catMode();items.forEach(function(i){curGrid.append((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});if(curType==='movie')mp++;else tp++;}
      ld=false;comp.activity.loader(false);comp.start();
    }).catch(function(){ld=false;spinner.hide();endMsg.show().text('Lỗi');comp.activity.loader(false);});
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

/* ---- COLLECTION ---- */
Lampa.Component.add('kkphim_collection',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    tCollectionDetail(obj.collection_id).then(function(coll){
      if(!coll){comp.activity.loader(false);return;}
      var bk=coll.backdrop_path?TMDB_W500+coll.backdrop_path:'';
      var ps=coll.poster_path?TMDB_W200+coll.poster_path:'';

      /* FIX 2: Header collection viết lại rõ ràng */
      var header=$('<div style="position:relative;overflow:hidden;min-height:12em;border-radius:0;"></div>');
      if(bk){
        header.append($('<img>').attr('src',bk).css({position:'absolute',top:0,left:0,width:'100%',height:'100%','object-fit':'cover','z-index':0}));
        header.append($('<div>').css({position:'absolute',top:0,left:0,right:0,bottom:0,'z-index':1,background:'linear-gradient(180deg,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.85) 100%)'}));
      }
      var inner=$('<div>').css({position:'relative','z-index':2,display:'flex','align-items':'flex-end',gap:'1em',padding:'1.5em 1.5em 1em'});
      if(ps){
        inner.append($('<div>').css({width:'5.5em','flex-shrink':0,'border-radius':'0.4em',overflow:'hidden','aspect-ratio':'2/3',background:'rgba(255,255,255,0.05)'}).append($('<img>').attr('src',ps).css({width:'100%',height:'100%','object-fit':'cover'})));
      }
      var info=$('<div>').css({'flex':1,'min-width':0});
      info.append($('<div>').css({'font-size':'0.72em','text-transform':'uppercase','color':'rgba(1,180,228,0.9)','font-weight':'700','margin-bottom':'0.2em','letter-spacing':'0.06em'}).text('Bộ sưu tập'));
      info.append($('<div>').css({'font-size':'1.3em','font-weight':'700','color':'#fff','line-height':'1.2'}).text(coll.name||''));
      info.append($('<div>').css({'font-size':'0.85em','color':'rgba(255,255,255,0.5)','margin-top':'0.25em'}).text((coll.parts||[]).length+' phim'));
      inner.append(info);
      header.append(inner);
      scroll.append(header);

      if(coll.overview){
        scroll.append($('<div>').css({padding:'0.8em 1.5em',color:'rgba(255,255,255,0.6)','font-size':'0.9em','line-height':'1.6'}).text(coll.overview));
      }

      var parts=coll.parts||[];
      parts.sort(function(a,b){return(a.release_date||'9999').localeCompare(b.release_date||'9999');});
      var cm=catMode(),grid;
      if(cm==='hgrid')grid=$('<div class="kk-grid kk-grid--cat-h"></div>');
      else{grid=$('<div class="kk-grid"></div>');grid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
      parts.forEach(function(p){p.media_type='movie';grid.append((cm==='hgrid'?mkTCH(p):mkTC(p)).addClass('kk-card--grid'));});
      scroll.append($('<div class="kk-grid-wrap" style="padding-top:0.5em"></div>').append(grid));
      comp.activity.loader(false);comp.start();
    }).catch(function(){comp.activity.loader(false);});
  };
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

/* ---- SEASON DETAIL ---- */
Lampa.Component.add('kkphim_season_detail',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var tvId=obj.tv_id,seasonNum=obj.season_number,tvTitle=obj.tv_title||'';
  var imdbId=null;
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    Promise.all([tSeasonDetail(tvId,seasonNum),gImdb('tv',tvId)]).then(function(res){
      var season=res[0];imdbId=res[1];
      if(!season){comp.activity.loader(false);return;}
      var ps=season.poster_path?TMDB_W300+season.poster_path:'';
      var header=$('<div class="kk-sd-header"></div>');
      var pHtml=ps?'<img src="'+ps+'">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.8em;color:rgba(255,255,255,0.12);">S'+seasonNum+'</div>';
      header.html('<div class="kk-sd-poster">'+pHtml+'</div><div class="kk-sd-info"><div class="kk-sd-title">'+E(season.name||'Season '+seasonNum)+'</div><div class="kk-sd-meta">'+E(tvTitle+' - '+(season.air_date||'')+' - '+(season.episodes||[]).length+' tập')+'</div>'+(season.overview?'<div class="kk-sd-overview">'+E(season.overview.substring(0,250))+'</div>':'')+'</div>');
      scroll.append(header);
      var epList=$('<div class="kk-netflix-eps"></div>');
      (season.episodes||[]).forEach(function(ep){
        var still=ep.still_path?TMDB_W500+ep.still_path:'';
        var item=$('<div class="kk-netflix-ep selector"></div>');
        var stillHtml=still?'<img src="'+still+'" loading="lazy">':'<div class="kk-netflix-ep-still-empty">'+ep.episode_number+'</div>';
        item.html('<div class="kk-netflix-ep-still">'+stillHtml+'</div><div class="kk-netflix-ep-body"><div class="kk-netflix-ep-title">'+E(ep.name||'Tập '+ep.episode_number)+'</div>'+(ep.overview?'<div class="kk-netflix-ep-desc">'+E(ep.overview)+'</div>':'')+'</div>');
        bE(item,function(){
          if(window.__kkphim_torrent&&imdbId){
            window.__kkphim_torrent.playEpTorrent(imdbId,seasonNum,ep.episode_number,tvTitle,ps||'');
          }else{
            Lampa.Noty.show('Cần cài File 3 (Torrent) để xem!');
          }
        });
        epList.append(item);
      });
      scroll.append(epList);
      comp.activity.loader(false);comp.start();
    }).catch(function(){comp.activity.loader(false);});
  };
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

/* ---- PERSON ---- */
Lampa.Component.add('kkphim_person',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var pid=obj.person_id;
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    if(!pid){comp.activity.loader(false);comp.start();return;}
    Promise.all([tFetch('/person/'+pid+'?language='+tmLang()),tPersonC(pid)]).then(function(res){
      var p=res[0],cr=res[1];
      var w=$('<div class="kk-detail-wrap"></div>');
      var av=p.profile_path?TMDB_W500+p.profile_path:'';
      w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'">':'<div class="kk-crew-avatar-empty"></div>')+'</div><div class="kk-person-info"><div class="kk-person-name">'+E(p.name||'')+'</div>'+(p.birthday?'<div class="kk-person-meta">'+E(p.birthday)+'</div>':'')+(p.known_for_department?'<div class="kk-person-meta">'+E(p.known_for_department)+'</div>':'')+'</div></div>');
      if(p.biography)w.append('<div class="kk-person-bio">'+fTxt((p.biography||'').substring(0,600))+'</div>');
      if(cr&&cr.cast){
        var mv=cr.cast.filter(function(c){return c.media_type==='movie';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
        var tv=cr.cast.filter(function(c){return c.media_type==='tv';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
        var rCnt=rowCount();
        if(mv.length){
          var r1=$('<div class="kk-row"></div>');
          var rl=$('<div class="kk-row-list"></div>');
          mv.slice(0,rCnt).forEach(function(c){rl.append(mkTC(c));});
          var mr=$('<div class="kk-row-more selector">Xem thêm ('+mv.length+')</div>');
          bE(mr,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim lẻ',component:'kkphim_person_films',person_id:pid,film_type:'movie'});});
          r1.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">Phim lẻ</div>').append(mr)).append(rl);
          w.append(r1);
        }
        if(tv.length){
          var r2=$('<div class="kk-row"></div>');
          var rl2=$('<div class="kk-row-list"></div>');
          tv.slice(0,rCnt).forEach(function(c){rl2.append(mkTC(c));});
          var mr2=$('<div class="kk-row-more selector">Xem thêm ('+tv.length+')</div>');
          bE(mr2,function(){Lampa.Activity.push({url:'',title:(p.name||'')+' - Phim bộ',component:'kkphim_person_films',person_id:pid,film_type:'tv'});});
          r2.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">Phim bộ</div>').append(mr2)).append(rl2);
          w.append(r2);
        }
      }
      scroll.append(w);comp.activity.loader(false);comp.start();
    }).catch(function(){comp.activity.loader(false);});
  };
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

Lampa.Component.add('kkphim_person_films',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var pid=obj.person_id,ft=obj.film_type||'movie';
  var all=[],rd=0,pp=20;
  var gridContainer=$('<div></div>'),curGrid=null;
  var spinner=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');
  var endMsg=$('<div class="kk-loadmore" style="display:none;cursor:default;background:transparent">Hết</div>');
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);initGrid();
    scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gridContainer).append(spinner).append(endMsg));
    var sb=scroll.render().find('.scroll__body');
    sb.on('scroll',function(){if(rd>=all.length)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)rMore();});
    tPersonC(pid).then(function(cr){
      if(cr&&cr.cast)all=cr.cast.filter(function(c){return c.media_type===ft;}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});
      rMore();comp.activity.loader(false);comp.start();
    }).catch(function(){comp.activity.loader(false);});
  };
  function initGrid(){
    var cm=catMode();
    if(cm==='hgrid')curGrid=$('<div class="kk-grid kk-grid--cat-h"></div>');
    else{curGrid=$('<div class="kk-grid"></div>');curGrid.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}
    gridContainer.empty().append(curGrid);
  }
  function rMore(){
    var b=all.slice(rd,rd+pp);if(!b.length){endMsg.show();return;}
    var cm=catMode();b.forEach(function(c){curGrid.append((cm==='hgrid'?mkTCH(c):mkTC(c)).addClass('kk-card--grid'));});
    rd+=b.length;if(rd>=all.length)endMsg.show();
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
});

/* ---- TMDB DETAIL ---- */
Lampa.Component.add('kkphim_tmdb_detail',function(obj){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  var tid=obj.tmdb_id;
  var mt=obj.media_type||'movie';
  this.create=function(){
    comp.activity.loader(true);cScr(scroll);
    if(!tid){comp.activity.loader(false);comp.start();return;}
    tDetFull(mt,tid).then(async function(tmdb){
      var logos=null;
      try{logos=await tImgFull(mt,tid);}catch(e){}
      var t=tmdb.title||tmdb.name||'';
      var o=tmdb.original_title||tmdb.original_name||'';
      var y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);
      saveHistory({tmdb_id:tid,media_type:mt,name:t,poster_url:tmdb.poster_path?TMDB_W500+tmdb.poster_path:'',year:y,origin_name:o});
      var keywordsPromise=tKeywords(mt,tid);
      var tmdbSeasons=null;
      if(mt==='tv'){try{tmdbSeasons=await gSeasons(tid);}catch(e){}}
      var imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;
      if(!imdb){try{imdb=await gImdb(mt,tid);}catch(e){}}

      /* FIX 3: Cập nhật cả _detCtx local và window._kkphim_detCtx */
      _detCtx.imdbId=imdb;
      window._kkphim_detCtx={imdbId:imdb};

      var keywords=[];try{keywords=await keywordsPromise;}catch(e){}
      bDet(tmdb,logos,tmdbSeasons,keywords,imdb,t,o,y);
    }).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});
  };
  async function bDet(tmdb,logos,tmdbSeasons,keywords,imdb,t,o2,y){
    cScr(scroll);
    var bk=tmdb.backdrop_path?TMDB_IMG+tmdb.backdrop_path:'';
    var ps=tmdb.poster_path?TMDB_W500+tmdb.poster_path:'';
    var d=tmdb.overview||'Không có mô tả';
    var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A';
    var rt=tmdb.runtime?tmdb.runtime+' phút':'';
    if(!rt&&tmdb.episode_run_time&&tmdb.episode_run_time.length)rt=tmdb.episode_run_time[0]+' phút/tập';
    var epExtra='';
    if(tmdb.number_of_episodes)epExtra=tmdb.number_of_episodes+' tập';
    if(tmdb.number_of_seasons)epExtra+=(epExtra?' | ':'')+tmdb.number_of_seasons+' season';
    var country='';
    if(tmdb.production_countries&&tmdb.production_countries.length)country=tmdb.production_countries.map(function(c){return c.iso_3166_1;}).join(', ');
    else if(tmdb.origin_country&&tmdb.origin_country.length)country=tmdb.origin_country[0];
    var genreStr=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');
    var status=tmdb.status||'';
    var logo=pLogo(logos||(tmdb.images||{}));
    var logoH='';
    if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+TMDB_W500+logo.file_path+'"></div>';
    var gh=gHtml(tmdb.genres,true);
    var dirsArr=[],castArr=[];
    if(tmdb.credits){
      castArr=(tmdb.credits.cast||[]).slice(0,15);
      dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator'||c.job==='Series Director';}).filter(function(p,i,a){return a.findIndex(function(x){return x.name===p.name;})===i;}).slice(0,8);
    }
    var crewH=mkDirHtml(dirsArr,true);
    var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';
    var hero=mkHero(bk,ps,logoH,tH,o2,{tagline:tmdb.tagline||'',vote:v,year:y,runtime:rt+(epExtra?' - '+epExtra:''),country:country,genres:genreStr,status:status,_title:t});
    var body=mkBody(v,y,rt,epExtra,gh,crewH,d);
    body.find('.kk-genre[data-gid]').each(function(){
      var g=$(this);
      bE(g,function(){Lampa.Activity.push({url:'',title:g.attr('data-gname')||'',component:'kkphim_tmdb_genre',genre_id:g.attr('data-gid'),page_num:1});});
    });
    bindDirClicks(body);

    /* ---- ACTION AREA ---- */
    var act=$('<div class="kk-actions"></div>');
    if(window.__kkphim_parser){
      window.__kkphim_parser.buildSourceButtons(act,tmdb,mt,tid,t,o2,y,ps,tmdbSeasons,imdb);
    }else{
      act.append($('<div class="kk-no-plugin-note">&#9432; Cài thêm File 2 (kkphim_parser.js) để xem phim từ KKPhim / OPhim</div>'));
    }
    if(window.__kkphim_torrent){
      act.append(window.__kkphim_torrent.buildTorrentBtn(mt,tid,t,ps,imdb));
    }else{
      act.append($('<div class="kk-no-plugin-note">&#9432; Cài thêm File 3 (kkphim_torrent.js) để xem qua Torrent</div>'));
    }
    body.append(act);

    var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);
    if(castArr.length){
      var castSec=$('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>');
      castSec.append(mkCastList(castArr,true));
      dw.append(castSec);
    }
    if(mt==='tv'&&tmdbSeasons&&tmdbSeasons.length)dw.append(mkSeasonsSection(tmdbSeasons,tid,t));
    if(tmdb.production_companies&&tmdb.production_companies.length)dw.append(mkProductionSection(tmdb.production_companies));
    if(mt==='tv'&&tmdb.networks&&tmdb.networks.length)dw.append(mkNetworkSection(tmdb.networks));
    if(mt==='movie'&&tmdb.belongs_to_collection)dw.append(mkCollectionSection(tmdb.belongs_to_collection));
    if(keywords&&keywords.length)dw.append(mkTagsSection(keywords));
    var simI=(tmdb.similar&&tmdb.similar.results)?tmdb.similar.results.slice(0,20):[];
    if(simI.length){
      var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');
      var sl=$('<div class="kk-similar-list"></div>');
      simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sl.append(mkTC(i));});
      ss2.append(sl);dw.append(ss2);
    }
    try{
      var rd2=await tRec(mt,tid,1);
      var ri=(rd2.results||[]).slice(0,20);
      if(ri.length){
        var rs2=$('<div class="kk-section kk-similar kk-section--last"></div>').append('<div class="kk-block-title">Gợi ý</div>');
        var rl2=$('<div class="kk-similar-list"></div>');
        ri.forEach(function(i){if(!i.media_type)i.media_type=mt;rl2.append(mkTC(i));});
        rs2.append(rl2);dw.append(rs2);
      }
    }catch(e){}
    scroll.append(dw);
    comp.activity.loader(false);comp.start();
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};
  this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};
  this.destroy=function(){scroll.destroy();};
});

/* ---- SETTINGS ---- */
Lampa.Component.add('kkphim_settings',function(){
  var scroll=new Lampa.Scroll({mask:true,over:true});
  var comp=this;
  this.create=function(){
    cScr(scroll);
    var s=ls();
    var w=$('<div class="kk-stg-wrap"></div>');
    w.append('<div class="kk-stg-title">Cài đặt</div>');

    var gSrc=mg('Bật/Tắt nguồn phim');
    Object.keys(SOURCES).forEach(function(k){
      var sc=SOURCES[k];var enabled=isSourceEnabled(k);
      gSrc.append(mo(sc.name,'API: '+sc.api,enabled,function(){var cur=isSourceEnabled(k);var o={};o['source_'+k+'_enabled']=!cur;ss(o);Lampa.Noty.show(sc.name+': '+(cur?'Đã tắt':'Đã bật'));comp.create();}));
    });
    w.append(gSrc);

    var gFont=mg('Cỡ chữ');
    var fs=String(s.font_scale||'100');
    [{k:'85',n:'Nhỏ'},{k:'100',n:'Mặc định'},{k:'115',n:'Lớn'},{k:'130',n:'Rất lớn'}].forEach(function(o){
      gFont.append(mo(o.n,'',fs===o.k,function(){ss({font_scale:o.k});applyFontScale();comp.create();}));
    });
    w.append(gFont);

    var gCard=mg('Trang chủ - Kiểu card');
    var cm=s.card_mode||'hgrid';
    [{k:'hgrid',n:'Lưới ngang',d:'2 cột, backdrop ngang'},{k:'poster',n:'Poster lớn',d:'1 card full'}].forEach(function(o){
      gCard.append(mo(o.n,o.d,cm===o.k,function(){ss({card_mode:o.k});comp.create();}));
    });
    w.append(gCard);

    var gRow=mg('Số phim trong row');
    var rc=s.row_count||'20';
    [{k:'10',n:'10'},{k:'15',n:'15'},{k:'20',n:'20'},{k:'30',n:'30'},{k:'50',n:'50'}].forEach(function(o){
      gRow.append(mo(o.n+' phim','',rc===o.k,function(){ss({row_count:o.k});comp.create();}));
    });
    w.append(gRow);

    var gCat=mg('Danh sách - Kiểu card');
    var ctm=s.cat_mode||'hgrid';
    [{k:'hgrid',n:'Ngang (x2)'},{k:'vgrid',n:'Dọc (tùy chỉnh)'}].forEach(function(o){
      gCat.append(mo(o.n,'',ctm===o.k,function(){ss({cat_mode:o.k});comp.create();}));
    });
    w.append(gCat);

    var g5=mg('Số cột poster dọc');
    var cg=s.card_style||'3';
    [{k:'2',n:'2 cột'},{k:'3',n:'3 cột'},{k:'4',n:'4 cột'}].forEach(function(o){
      g5.append(mo(o.n,'',cg===o.k,function(){ss({card_style:o.k});comp.create();}));
    });
    w.append(g5);

    var g6=mg('Ngôn ngữ TMDB');
    var cl2=s.tmdb_lang||'vi-VN';
    [{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'},{k:'ja-JP',n:'Japanese'},{k:'ko-KR',n:'Korean'},{k:'zh-CN',n:'Chinese'}].forEach(function(o){
      g6.append(mo(o.n,o.k,cl2===o.k,function(){ss({tmdb_lang:o.k});_gc={movie:null,tv:null};comp.create();}));
    });
    w.append(g6);

    /* Torrent settings */
    if(window.__kkphim_torrent){
      window.__kkphim_torrent.buildSettings(w,mg,mo,mi,si2,comp);
    }else{
      var gTorNote=mg('Torrent / AIOStreams');
      gTorNote.append($('<div class="kk-no-plugin-note" style="margin:0.5em 1em;">Cài File 3 (kkphim_torrent.js) để cấu hình Torrentio / TorrServer / AIOStreams</div>'));
      w.append(gTorNote);
    }

    var gHist=mg('Dữ liệu');
    var clearHist=si2('Xóa lịch sử','','Xóa');
    bE(clearHist,function(){localStorage.removeItem(HIST_KEY);Lampa.Noty.show('Đã xóa!');});
    gHist.append(clearHist);w.append(gHist);

    var g4=$('<div class="kk-stg-group"></div>');
    var cl=si2('Reset','Khôi phục mặc định','Xóa');
    cl.find('.kk-stg-value').css('color','#f87171');
    bE(cl,function(){localStorage.removeItem(STG_KEY);localStorage.removeItem(HIST_KEY);_gc={movie:null,tv:null};applyFontScale();Lampa.Activity.backward();});
    g4.append(cl);w.append(g4);

    w.append('<div class="kk-stg-ver">KKPhim v4.6.2 | UI</div>');
    scroll.append(w);comp.start();
  };
  function mg(t){return $('<div class="kk-stg-group"></div>').append('<div class="kk-stg-group-title">'+t+'</div>');}
  function si2(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
  function mo(n,d,on,cb){var it=si2(n,d,on?'ON':'OFF');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
  function mi(n,d,val,prompt,key,s){
    var it=si2(n,d,val);
    bE(it,function(){
      try{
        if(Lampa.Input&&Lampa.Input.edit){
          Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});
          return;
        }
      }catch(e){}
      var v=window.prompt(prompt,s[key]||'');
      if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}
    });
    return it;
  }
  this.start=function(){aCtrl(scroll);eScr(scroll);};
  this.pause=function(){};this.stop=function(){};
  this.render=function(){return scroll.render();};
  this.destroy=function(){scroll.destroy();};
});

/* ---- STARTUP ---- */
function startPlugin(){
  inCSS();
  applyFontScale();
  addM();
  console.log('[KKPhim UI] v4.6.2 OK');
}
if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});
})();