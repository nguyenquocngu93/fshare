/* ============================================================================
 * FShare All-in-One Parser v1.0.0 - Plugin Lampa MX
 * ----------------------------------------------------------------------------
 * Hub hợp nhất 4 nguồn: KKPhim + OPhim + Torrentio + Magnetz
 * Cấu trúc: Hybrid - bật/tắt từng nguồn trong Settings
 *
 * Tính năng:
 *   - Tìm kiếm thông minh (chấm điểm match)
 *   - Danh mục + filter (năm, quốc gia, thể loại)
 *   - Yêu thích + Lịch sử xem
 *   - Tiếp tục xem (nhớ tập dở)
 *   - Settings UI riêng
 *   - TorrServer + mở ngoài (cho Torrentio/Magnetz)
 * ============================================================================
 */
(function(){
'use strict';

if(window.__fshare_all_loaded)return;
window.__fshare_all_loaded=true;

var VERSION='1.0.0';
var STORAGE_KEY='fshare_all';
var CACHE_KEY='fshare_all_cache';
var FAV_KEY='fshare_all_fav';
var HIST_KEY='fshare_all_hist';
var CONT_KEY='fshare_all_continue';
var CACHE_TTL=30*60*1000;

/* ============================================================================
 * CẤU HÌNH 4 NGUỒN
 * ============================================================================ */

var SOURCES={
  kkphim:{
    key:'kkphim',
    name:'KKPhim',
    icon:'KK',
    color:'#3b82f6',
    type:'api',                 // 'api' hoặc 'scrape'
    api:'https://phimapi.com/',
    img:'https://phimimg.com/',
    endpoints:{
      search:'v1/api/tim-kiem',
      detail:'v1/api/phim/',
      list:'v1/api/danh-sach/'
    },
    enabled:true
  },
  ophim:{
    key:'ophim',
    name:'OPhim',
    icon:'OP',
    color:'#10b981',
    type:'api',
    api:'https://ophim1.com/',
    img:'https://img.ophim.live/uploads/movies/',
    endpoints:{
      search:'v1/api/tim-kiem',
      detail:'v1/api/phim/',
      list:'v1/api/danh-sach/'
    },
    enabled:true
  },
  torrentio:{
    key:'torrentio',
    name:'Torrentio',
    icon:'🧲',
    color:'#ef4444',
    type:'torrent',
    api:'https://torrentio.strem.fun',     // Sẽ append /{config}/stream/{type}/{id}.json
    config:'',                              // Để trống nếu dùng config mặc định, hoặc từ torrentio.strem.fun/configure
    needsImdb:true,
    enabled:true
  },
  magnetz:{
    key:'magnetz',
    name:'Magnetz',
    icon:'🧲',
    color:'#f59e0b',
    type:'torrent',
    api:'https://magnetz.io',               // API key từ magnetz.io
    apiKey:'',                              // User nhập trong Settings
    needsSearch:true,                       // Tìm theo tên (không cần IMDB)
    enabled:false                            // Mặc định tắt, cần cấu hình key
  }
};

/* ============================================================================
 * STATE & STORAGE
 * ============================================================================ */

function _ls(key, def){
  try{var v=localStorage.getItem(key);return v==null?def:JSON.parse(v);}catch(e){return def;}
}
function _sv(key, val){
  try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}
}
function _rm(key){try{localStorage.removeItem(key);}catch(e){}}

function getCfg(){
  var c=_ls(STORAGE_KEY,{});
  c.torrserver_url=c.torrserver_url||'';
  c.torrserver_pass=c.torrserver_pass||'';
  c.tmdb_key=c.tmdb_key||'4ef0d7355d9ffb5151e987764708ce96';  // TMDB public key mặc định
  c.torrentio_config=c.torrentio_config||'';
  c.magnetz_key=c.magnetz_key||'';
  c.lang=c.lang||'vi-VN';
  c.page_size=c.page_size||24;
  // Source enable/disable
  Object.keys(SOURCES).forEach(function(k){
    if(c['src_'+k+'_en']===undefined)c['src_'+k+'_en']=SOURCES[k].enabled;
  });
  return c;
}
function setCfg(c){_sv(STORAGE_KEY,c);}

/* Cache */
function cacheGet(k){
  var c=_ls(CACHE_KEY,{});
  var it=c[k];
  if(it&&(Date.now()-it.t)<CACHE_TTL)return it.d;
  return null;
}
function cacheSet(k,d){
  var c=_ls(CACHE_KEY,{});
  c[k]={d:d,t:Date.now()};
  try{
    var s=JSON.stringify(c);
    if(s.length>4*1024*1024){
      var keys=Object.keys(c).sort(function(a,b){return c[a].t-c[b].t;});
      for(var i=0;i<Math.floor(keys.length/4);i++)delete c[keys[i]];
    }
    localStorage.setItem(CACHE_KEY,JSON.stringify(c));
  }catch(e){}
}

/* ============================================================================
 * TIỆN ÍCH
 * ============================================================================ */

function E(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function pad2(n){return(n<10?'0':'')+n;}
function nrm(s){
  return String(s||'').toLowerCase().trim()
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d')
    .replace(/[^a-z0-9\s\u00C0-\u024F\u1E00-\u1EFF]/g,'')
    .replace(/\s+/g,' ');
}
function absUrl(u,b){
  if(!u)return'';
  if(u.indexOf('//')===0)return'https:'+u;
  if(u.indexOf('http')!==0)return(b||'')+(u.charAt(0)==='/'?'':'/')+u;
  return u;
}
function getImgSrc(sk){return SOURCES[sk]?SOURCES[sk].img||'':'';}
function isSourceEnabled(sk){return getCfg()['src_'+sk+'_en']===true;}

/* ============================================================================
 * HTTP CLIENT
 * ============================================================================ */

function http(url,cb,err,timeout){
  timeout=timeout||15000;
  if(window.Lampa&&Lampa.Reguest){
    var r=new Lampa.Reguest();
    r.timeout(timeout);
    r.silent(url,function(d){
      try{cb(typeof d==='string'?JSON.parse(d):d);}catch(e){cb(d);}
    },function(a,b){(err||function(){})((a&&a.status)||0,b);});
  }else{
    fetch(url).then(function(r){return r.json();}).then(cb).catch(function(e){(err||function(){})(0,e);});
  }
}
function httpRaw(url,cb,err,timeout){
  timeout=timeout||15000;
  if(window.Lampa&&Lampa.Reguest){
    var r=new Lampa.Reguest();
    r.timeout(timeout);
    r.silent(url,cb,err||function(){});
  }else{
    fetch(url).then(function(r){return r.text();}).then(cb).catch(function(e){(err||function(){})(0,e);});
  }
}

/* ============================================================================
 * CÁC NGUỒN PHIM (KKPhim / OPhim)
 * ============================================================================ */

function fetchFromKKLike(source, endpoint, params){
  var url=source.api+endpoint;
  Object.keys(params).forEach(function(k){
    url+=(url.indexOf('?')>-1?'&':'?')+k+'='+encodeURIComponent(params[k]);
  });
  return new Promise(function(resolve){
    http(url,function(d){
      var items=[];
      if(d&&d.data&&d.data&&d.data.items)items=d.data.items;
      else if(d&&d.data&&d.data.items)items=d.data.items;
      else if(d&&d.items)items=d.items;
      else if(Array.isArray(d))items=d;
      resolve(items);
    },function(){resolve([]);});
  });
}

function searchKKPhimLike(source, keyword, page){
  page=page||1;
  return fetchFromKKLike(source,source.endpoints.search,{
    keyword:keyword,limit:30,page:page
  });
}

function detailKKPhimLike(source, slug){
  return new Promise(function(resolve){
    http(source.api+source.endpoints.detail+slug,function(d){
      if(d&&(d.data||d.item||d.episodes)){
        var item=d.data&&(d.data.item||d.data)||d.item||d;
        var eps=(d.data&&d.data.episodes)||(d.episodes)||(item&&item.episodes)||[];
        resolve({movie:item,episodes:eps});
      }else resolve(null);
    },function(){resolve(null);});
  });
}

function listKKPhimLike(source, catSlug, page){
  page=page||1;
  return fetchFromKKLike(source,source.endpoints.list,{
    page:page,limit:30
  });
}

function normKKItem(it, source){
  if(!it)return null;
  return {
    title:it.name||it.title||'',
    origin_name:it.origin_name||it.original_name||'',
    year:it.year||(it.modified_time?new Date(it.modified_time).getFullYear():'')||'',
    slug:it.slug||'',
    poster:absUrl(it.poster_url||it.thumb_url||it.image||'',source.img),
    type:it.type==='series'||it.type==='hoathinh'?'tv':'movie',
    episode_current:it.episode_current||'',
    episode_total:it.episode_total||'',
    quality:it.quality||'',
    lang:it.lang||'',
    source:source.key
  };
}

function searchAll(keyword, page){
  page=page||1;
  return new Promise(function(resolve){
    var results=[];
    var pending=0;
    var terms=[keyword];
    Object.keys(SOURCES).forEach(function(k){
      var src=SOURCES[k];
      if(!isSourceEnabled(k))return;
      if(src.type!=='api')return;  // Torrent sources tìm riêng
      pending++;
      var done=function(items){
        results=results.concat(items.map(function(it){return normKKItem(it,src);}).filter(Boolean));
        pending--;
        if(pending===0)resolve(results);
      };
      searchKKPhimLike(src,keyword,page).then(done);
    });
    if(pending===0)resolve([]);
  });
}

function getDetailAny(slug, sourceKey){
  return new Promise(function(resolve){
    if(!sourceKey||!SOURCES[sourceKey]){
      // Thử tất cả API source enabled
      var tried=0,total=0;
      Object.keys(SOURCES).forEach(function(k){
        if(SOURCES[k].type!=='api'||!isSourceEnabled(k))return;
        total++;
        detailKKPhimLike(SOURCES[k],slug).then(function(d){
          tried++;
          if(d){resolve({sourceKey:k,detail:d});return;}
          if(tried===total)resolve(null);
        });
      });
      if(total===0)resolve(null);
    }else{
      detailKKPhimLike(SOURCES[sourceKey],slug).then(function(d){
        resolve(d?{sourceKey:sourceKey,detail:d}:null);
      });
    }
  });
}

function listCategoryAny(catSlug, page){
  page=page||1;
  return new Promise(function(resolve){
    var results=[];
    var pending=0;
    Object.keys(SOURCES).forEach(function(k){
      var src=SOURCES[k];
      if(!isSourceEnabled(k))return;
      if(src.type!=='api')return;
      pending++;
      listKKPhimLike(src,catSlug,page).then(function(items){
        results=results.concat(items.map(function(it){return normKKItem(it,src);}).filter(Boolean));
        pending--;
        if(pending===0)resolve(results);
      });
    });
    if(pending===0)resolve([]);
  });
}

/* ============================================================================
 * TORRENTIO & MAGNETZ
 * ============================================================================ */

function getTmdbInfo(tmdbId, mediaType){
  var cfg=getCfg();
  return new Promise(function(resolve){
    if(!tmdbId){resolve(null);return;}
    var type=mediaType==='tv'||mediaType==='series'?'tv':'movie';
    var key=cfg.tmdb_key;
    var url='https://api.themoviedb.org/3/'+type+'/'+tmdbId+'/external_ids?api_key='+key;
    http(url,function(d){
      resolve({imdbId:d&&d.imdb_id?d.imdb_id:null,type:type});
    },function(){resolve(null);});
  });
}

function searchTorrentio(card){
  var cfg=getCfg();
  return new Promise(function(resolve){
    if(!cfg.torrentio_config&&!cfg.torrserver_url){
      // Vẫn thử với URL mặc định
    }
    getTmdbInfo(card.id||card.tmdb_id, card.type==='tv'||card.number_of_seasons?'tv':'movie').then(function(info){
      if(!info||!info.imdbId){resolve([]);return;}
      var base=cfg.torrentio_config
        ? SOURCES.torrentio.api+'/'+cfg.torrentio_config
        : SOURCES.torrentio.api;
      var url=base+'/stream/'+(info.type==='tv'?'series':'movie')+'/'+info.imdbId+'.json';
      http(url,function(d){
        var streams=(d&&d.streams)||[];
        resolve(streams.map(function(s){
          return parseTorrentioStream(s,card.title);
        }));
      },function(){resolve([]);});
    });
  });
}

function parseTorrentioStream(s, title){
  var name=String(s.title||'');
  var desc=String(s.description||'');
  var all=name+'\n'+desc;
  var provider=name.split('\n')[0].replace(/^\[[^\]]*\]\s*/,'').trim()||'Stream';
  // Hash
  var hash='';
  if(s.infoHash)hash=s.infoHash.toLowerCase();
  // Quality
  var qm=all.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
  var quality=qm?qm[1].toUpperCase():'';
  if(quality==='4K'||quality==='UHD')quality='2160P';
  // Size
  var szm=desc.match(/💾\s*([\d.,]+\s*(?:GB|GiB|MB|MiB))/i)||all.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB)\b/i);
  var size=szm?szm[1]:'';
  // Seeds
  var sdm=desc.match(/👤\s*(\d+)/);
  var seeds=sdm?parseInt(sdm[1]):0;
  // Codec, audio
  var cm=all.match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AV1)\b/i);
  var codec=cm?cm[1].toUpperCase().replace(/H\.?265/i,'HEVC').replace(/x265/i,'HEVC').replace(/H\.?264/i,'AVC').replace(/x264/i,'AVC'):'';
  var am=all.match(/\b(Atmos|TrueHD|DTS-HD|DTS|EAC3|AC3|AAC|FLAC)\b/i);
  var audio=am?am[1].toUpperCase():'';
  // Display
  var badges=[];
  if(quality)badges.push(quality);
  if(codec)badges.push(codec);
  if(audio)badges.push(audio);
  var display=provider+(badges.length?' ['+badges.join('|')+']':'');
  // Magnet
  var magnet=hash?makeMagnet(hash,display):'';
  return {
    title:display,
    provider:provider,
    quality:quality,
    size:size,
    seeds:seeds,
    hash:hash,
    magnet:magnet,
    url:s.url||'',
    behaviorHints:s.behaviorHints||{}
  };
}

function makeMagnet(hash,name){
  return'magnet:?xt=urn:btih:'+hash.toLowerCase()
    +'&dn='+encodeURIComponent(name||'')
    +'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')
    +'&tr='+encodeURIComponent('udp://open.stealth.si:80/announce')
    +'&tr='+encodeURIComponent('udp://tracker.torrent.eu.org:451/announce');
}

function searchMagnetz(query, type){
  var cfg=getCfg();
  if(!cfg.magnetz_key)return Promise.resolve([]);
  return new Promise(function(resolve){
    var url=SOURCES.magnetz.api+'/api/v1/search?query='+encodeURIComponent(query)+'&key='+cfg.magnetz_key;
    http(url,function(d){
      var results=(d&&d.results)||(Array.isArray(d)?d:[]);
      resolve(results.map(function(r){
        return {
          title:r.title||r.name||query,
          provider:'Magnetz',
          quality:(r.title||'').match(/\b(2160p|1080p|720p)\b/i)?RegExp.$1.toUpperCase():'',
          size:r.size||'',
          seeds:parseInt(r.seeders||r.seeds)||0,
          hash:r.infoHash||r.hash||'',
          magnet:r.magnet||(r.infoHash?makeMagnet(r.infoHash,r.title):''),
          url:r.url||''
        };
      }));
    },function(){resolve([]);});
  });
}

/* ============================================================================
 * TORRSERVER
 * ============================================================================ */

function getTsUrl(){
  var u=getCfg().torrserver_url;
  if(!u)return null;
  u=u.replace(/\/+$/,'');
  if(!/^https?:\/\//i.test(u))u='http://'+u;
  return u;
}
function getTsPass(){return getCfg().torrserver_pass||'';}

function tsHeaders(){
  var h={'Content-Type':'application/json'};
  var p=getTsPass();
  if(p)h['Authorization']='Basic '+btoa('admin:'+p);
  return h;
}

function tsAddAndPlay(link, hash, title, card, onErr){
  var tsUrl=getTsUrl();
  if(!tsUrl){if(onErr)onErr();return;}
  Lampa.Noty.show('Đang thêm torrent...');
  var done=function(returnedHash){
    var h=returnedHash||hash;
    if(!h){Lampa.Noty.show('Không lấy được hash!');return;}
    // Lấy file list
    setTimeout(function(){
      $.ajax({
        url:tsUrl+'/torrents',type:'POST',headers:tsHeaders(),
        data:JSON.stringify({action:'get',hash:h}),
        dataType:'json',timeout:15000,
        success:function(data){
          var files=((data&&data.file_stats)||[])
            .filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts)$/);})
            .sort(function(a,b){return(a.path||'').localeCompare(b.path||'',undefined,{numeric:true});});
          if(!files.length){
            tsPlayFile(h,0,title,card);
            return;
          }
          if(files.length===1){
            tsPlayFile(h,files[0].id||0,title,card);
            return;
          }
          // Nếu có nhiều file -> chọn
          Lampa.Select.show({
            title:'📂 Chọn file - '+title,
            items:files.map(function(f){
              var fn=(f.path||'').split('/').pop()||'File';
              return{title:fn,fileId:f.id||0};
            }),
            onSelect:function(it){
              tsPlayFile(h,it.fileId,title,card);
            },
            onBack:function(){try{Lampa.Controller.toggle('content');}catch(e){}}
          });
        },
        error:function(){
          tsPlayFile(h,0,title,card);
        }
      });
    },2000);
  };

  $.ajax({
    url:tsUrl+'/torrents',type:'POST',headers:tsHeaders(),
    data:JSON.stringify({action:'add',link:link,title:title,save_to_db:false}),
    dataType:'json',timeout:15000,
    success:function(data){done(data&&data.hash);},
    error:function(){if(hash)done(hash);else if(onErr)onErr();}
  });
}

function tsPlayFile(hash, fileId, title, card){
  var tsUrl=getTsUrl();
  var url=tsUrl+'/stream/'+encodeURIComponent(title||'video')+'?link='+hash+'&index='+fileId+'&play';
  setTimeout(function(){
    Lampa.Player.play({title:title,url:url,movie:card||{}});
  },100);
}

function playTorrent(stream, title, card){
  if(!stream){Lampa.Noty.show('Stream không hợp lệ');return;}
  var tsUrl=getTsUrl();
  if(tsUrl&&(stream.magnet||stream.hash)){
    tsAddAndPlay(stream.magnet||makeMagnet(stream.hash,stream.title),stream.hash,title,card,function(){
      playExternal(stream,title,card);
    });
  }else{
    playExternal(stream,title,card);
  }
}

function playExternal(stream, title, card){
  if(stream.magnet){
    Lampa.Player.play({title:title,url:stream.magnet,movie:card||{}});
  }else if(stream.url){
    Lampa.Player.play({title:title,url:stream.url,movie:card||{}});
  }else{
    Lampa.Noty.show('Stream không có link');
  }
}

/* ============================================================================
 * YÊU THÍCH + LỊCH SỬ + TIẾP TỤC XEM
 * ============================================================================ */

function getFav(){return _ls(FAV_KEY,[]);}
function setFav(v){_sv(FAV_KEY,v);}

function toggleFav(item){
  if(!item||!item.id)return false;
  var arr=getFav();
  var id=item.id;
  var idx=-1;
  for(var i=0;i<arr.length;i++)if(arr[i].id===id){idx=i;break;}
  if(idx>-1){
    arr.splice(idx,1);
    Lampa.Noty.show('Đã xoá khỏi yêu thích');
    setFav(arr);
    return false;
  }else{
    item.added=Date.now();
    arr.unshift(item);
    if(arr.length>200)arr=arr.slice(0,200);
    setFav(arr);
    Lampa.Noty.show('Đã thêm vào yêu thích');
    return true;
  }
}

function isFav(id){
  var arr=getFav();
  for(var i=0;i<arr.length;i++)if(arr[i].id===id)return true;
  return false;
}

function getHist(){return _ls(HIST_KEY,[]);}
function setHist(v){_sv(HIST_KEY,v);}

function addHist(item){
  if(!item||!item.id)return;
  var arr=getHist();
  var id=item.id;
  arr=arr.filter(function(x){return x.id!==id;});
  item.viewed=Date.now();
  arr.unshift(item);
  if(arr.length>100)arr=arr.slice(0,100);
  setHist(arr);
}

function getContinue(){return _ls(CONT_KEY,{});}
function setContinue(v){_sv(CONT_KEY,v);}

function saveProgress(mediaId, sourceKey, slug, season, episode, title, card){
  if(!mediaId||!slug)return;
  var c=getContinue();
  c[mediaId]={
    sourceKey:sourceKey,
    slug:slug,
    season:season||1,
    episode:episode||1,
    title:title||'',
    poster:card&&card.poster?card.poster:'',
    mediaType:card&&(card.type==='tv'||card.number_of_seasons)?'tv':'movie',
    time:Date.now()
  };
  setContinue(c);
}

function getProgress(mediaId){
  var c=getContinue();
  return c[mediaId]||null;
}

function clearProgress(mediaId){
  var c=getContinue();
  delete c[mediaId];
  setContinue(c);
}

/* ============================================================================
 * UI - TÌM KIẾM, DANH SÁCH, MENU
 * ============================================================================ */

function bindEvents(el,fn){
  var sx=0,sy=0,mv=false,tc=false;
  el.on('touchstart',function(e){
    var t=(e.originalEvent||e).touches;
    t=t&&t[0];
    if(t){sx=t.clientX;sy=t.clientY;mv=false;}
  });
  el.on('touchmove',function(e){
    var t=(e.originalEvent||e).touches;
    t=t&&t[0];
    if(t&&(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10))mv=true;
  });
  el.on('touchend',function(e){
    if(mv)return;
    tc=true;
    e.preventDefault();
    e.stopPropagation();
    setTimeout(function(){fn.call(el[0],e);},100);
    setTimeout(function(){tc=false;},400);
  });
  el.on('click',function(e){
    if(tc||mv)return;
    e.preventDefault();
    e.stopPropagation();
    fn.call(this,e);
  });
  el.on('hover:enter',function(e){fn.call(this,e);});
}

function restoreController(){
  setTimeout(function(){
    try{
      if(Lampa.Controller.enabled()!=='content'){
        Lampa.Controller.toggle('content');
      }
    }catch(e){try{Lampa.Activity.backward();}catch(e2){}}
  },150);
}

function noty(msg){
  try{Lampa.Noty.show(msg);}catch(e){console.log('[FShare]',msg);}
}

function showLoading(show){
  try{
    if(show)Lampa.Loading.show();
    else Lampa.Loading.hide();
  }catch(e){}
}

/* --- CSS INJECT --- */
function injectCSS(){
  if($('#fshare-all-css').length)return;
  var css=''
    +'.fs-page{padding:3em 2em;background:#0a0a0a;min-height:100vh;color:#fff;box-sizing:border-box;}'
    +'.fs-header{font-size:1.8em;font-weight:700;margin-bottom:.3em;}'
    +'.fs-sub{font-size:.95em;color:rgba(255,255,255,.6);margin-bottom:1.5em;}'
    +'.fs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1.5em;margin-bottom:2em;}'
    +'.fs-card{cursor:pointer;transition:transform .2s;position:relative;}'
    +'.fs-card:hover,.fs-card.focus{transform:scale(1.05);z-index:2;}'
    +'.fs-poster{width:100%;padding-top:150%;background-size:cover;background-position:center;border-radius:6px;background-color:#222;position:relative;overflow:hidden;}'
    +'.fs-poster-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1f2937,#111827);color:#9ca3af;font-size:.85em;text-align:center;padding:.5em;}'
    +'.fs-badge{position:absolute;top:.4em;left:.4em;background:rgba(0,0,0,.75);color:#fbbf24;padding:.15em .5em;border-radius:3px;font-size:.7em;font-weight:600;}'
    +'.fs-ep{position:absolute;bottom:.4em;right:.4em;background:rgba(220,38,38,.85);color:#fff;padding:.15em .5em;border-radius:3px;font-size:.7em;font-weight:600;}'
    +'.fs-year{position:absolute;top:.4em;right:.4em;background:rgba(0,0,0,.7);color:#fff;padding:.15em .5em;border-radius:3px;font-size:.7em;}'
    +'.fs-info{margin-top:.5em;}'
    +'.fs-title{font-size:.95em;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;}'
    +'.fs-origin{font-size:.8em;color:rgba(255,255,255,.55);margin-top:.2em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    +'.fs-source-tag{position:absolute;bottom:.4em;left:.4em;background:rgba(0,0,0,.75);color:#fff;padding:.1em .4em;border-radius:3px;font-size:.65em;font-weight:500;}'
    +'.fs-loadmore{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.4);color:#fff;padding:1em 2em;border-radius:6px;text-align:center;cursor:pointer;margin:1em auto;display:block;font-size:1em;}'
    +'.fs-loadmore.focus{background:rgba(59,130,246,.3);}'
    +'.fs-empty{text-align:center;padding:4em 2em;color:rgba(255,255,255,.5);font-size:1.1em;}'
    +'.fs-search-bar{display:flex;gap:.5em;margin-bottom:1.5em;}'
    +'.fs-input{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;padding:.8em 1em;border-radius:6px;font-size:1em;}'
    +'.fs-input:focus{outline:none;border-color:rgba(59,130,246,.6);}'
    +'.fs-btn{background:linear-gradient(135deg,rgba(59,130,246,.18),rgba(59,130,246,.06));border:1px solid rgba(59,130,246,.4);color:#fff;padding:.8em 1.5em;border-radius:6px;cursor:pointer;font-size:1em;transition:all .2s;display:inline-block;margin:.3em;text-align:center;min-width:120px;}'
    +'.fs-btn:hover,.fs-btn.focus{background:rgba(59,130,246,.3);border-color:rgba(59,130,246,.8);transform:scale(1.02);}'
    +'.fs-fav-btn{position:absolute;top:.4em;right:.4em;background:rgba(0,0,0,.6);color:#fff;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:1em;z-index:3;display:flex;align-items:center;justify-content:center;}'
    +'.fs-fav-btn.on{color:#ef4444;}'
    +'.fs-actions{display:flex;gap:.5em;flex-wrap:wrap;margin-top:1em;}'
    +'.fs-source-row{display:flex;gap:.5em;flex-wrap:wrap;margin:1em 0;}'
    +'.fs-source-chip{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);color:#fff;padding:.5em 1em;border-radius:20px;cursor:pointer;font-size:.9em;}'
    +'.fs-source-chip.on{background:rgba(59,130,246,.2);border-color:rgba(59,130,246,.6);}'
    +'.fs-section{margin:1.5em 0;}'
    +'.fs-section-title{font-size:1.2em;font-weight:600;margin-bottom:.8em;color:rgba(255,255,255,.85);}';
  $('head').append('<style id="fshare-all-css">'+css+'</style>');
}

/* --- Hiển thị danh sách phim --- */
function renderItemCard(it, opts){
  opts=opts||{};
  var poster=it.poster||it.poster_url||it.thumb||'';
  var t=it.title||it.name||'';
  var origin=it.origin_name||it.original_name||'';
  var year=it.year||'';
  var qual=it.quality||'';
  var ep=it.episode_current||'';
  var srcTag=it.source?SOURCES[it.source]?SOURCES[it.source].name:'':'';
  var cardId=it.id||(it.slug+'|'+it.source)||it.slug||t;
  var favOn=isFav(cardId);

  var html='<div class="fs-card" data-id="'+E(cardId)+'" data-slug="'+E(it.slug||'')+'" data-source="'+E(it.source||'')+'" data-title="'+E(t)+'" data-year="'+E(year)+'" data-origin="'+E(origin)+'" data-type="'+E(it.type||'')+'">'
    +'<div class="fs-poster" '+(poster?'style="background-image:url('+E(poster)+')"':'')+'>'
    +(poster?'':'<div class="fs-poster-empty">'+(t?t.substring(0,2):'NP')+'</div>')
    +(opts.showFav!==false?'<button class="fs-fav-btn '+(favOn?'on':'')+'">'+(favOn?'❤':'♡')+'</button>':'')
    +(qual?'<span class="fs-badge">'+E(qual)+'</span>':'')
    +(year?'<span class="fs-year">'+E(year)+'</span>':'')
    +(ep?'<span class="fs-ep">'+E(ep)+'</span>':'')
    +(srcTag?'<span class="fs-source-tag">'+E(srcTag)+'</span>':'')
    +'</div>'
    +'<div class="fs-info">'
    +'<div class="fs-title">'+E(t)+'</div>'
    +(origin?'<div class="fs-origin">'+E(origin)+'</div>':'')
    +'</div></div>';
  return html;
}

function showItemsPage(title, items, opts, callbacks){
  opts=opts||{};
  callbacks=callbacks||{};
  var html='<div class="fs-page">'
    +'<div class="fs-header">'+E(title)+'</div>'
    +'<div class="fs-sub">'+(items.length||0)+' kết quả</div>'
    +'<div class="fs-grid">';

  items.forEach(function(it){
    html+=renderItemCard(it,opts);
  });
  html+='</div>';

  if(opts.hasMore){
    html+='<div class="fs-loadmore" id="fs-loadmore">Tải thêm</div>';
  }
  html+='</div>';

  var $view=$('<div></div>').html(html);
  var activity={
    url:'',
    title:title,
    component:'fshare_page',
    source:$view,
    onAppend:function(){}
  };
  Lampa.Activity.push(activity);

  // Bind card click
  $view.find('.fs-card').on('click hover:enter',function(){
    var $c=$(this);
    var slug=$c.attr('data-slug');
    var sourceKey=$c.attr('data-source');
    var t=$c.attr('data-title');
    if(slug)openMovie(slug,sourceKey,t,{
      id:$c.attr('data-id'),
      year:$c.attr('data-year'),
      origin_name:$c.attr('data-origin'),
      type:$c.attr('data-type')
    });
  });
  // Bind fav
  $view.find('.fs-fav-btn').on('click',function(e){
    e.stopPropagation();e.preventDefault();
    var $c=$(this).closest('.fs-card');
    var item={
      id:$c.attr('data-id'),
      title:$c.attr('data-title'),
      slug:$c.attr('data-slug'),
      source:$c.attr('data-source'),
      year:$c.attr('data-year'),
      origin_name:$c.attr('data-origin'),
      poster:$c.find('.fs-poster').css('background-image').replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
    };
    var on=toggleFav(item);
    $(this).toggleClass('on').text(on?'❤':'♡');
  });
  // Load more
  if(opts.hasMore&&callbacks.onLoadMore){
    $view.find('#fs-loadmore').on('click hover:enter',function(){
      $(this).text('Đang tải...');
      callbacks.onLoadMore();
    });
  }
  return $view;
}

function appendItems($view, moreItems, append){
  var $grid=$view.find('.fs-grid');
  var html='';
  moreItems.forEach(function(it){
    html+=renderItemCard(it,{});
  });
  if(append){
    $grid.append(html);
    // Re-bind new cards
    $grid.find('.fs-card').off('click hover:enter').on('click hover:enter',function(){
      var $c=$(this);
      openMovie($c.attr('data-slug'),$c.attr('data-source'),$c.attr('data-title'),{
        id:$c.attr('data-id'),
        year:$c.attr('data-year'),
        origin_name:$c.attr('data-origin'),
        type:$c.attr('data-type')
      });
    });
  }else{
    $view.find('.fs-loadmore').remove();
  }
}

/* --- Tìm kiếm --- */
function doSearch(keyword, page){
  page=page||1;
  if(!keyword){noty('Nhập từ khoá');return;}
  showLoading(true);
  searchAll(keyword,page).then(function(items){
    showLoading(false);
    if(!items.length){
      noty('Không tìm thấy');
      // Vẫn show trang trống
      showItemsPage('Tìm: '+keyword,[],{hasMore:false});
      return;
    }
    var $view=showItemsPage('Tìm: '+keyword+' ('+items.length+')',items,{hasMore:items.length>=20},{
      onLoadMore:function(){doSearch(keyword,page+1);}
    });
  });
}

/* --- Trang chi tiết phim --- */
function openMovie(slug, sourceKey, fallbackTitle, card){
  if(!slug){noty('Không có slug');return;}
  showLoading(true);
  getDetailAny(slug,sourceKey).then(function(res){
    showLoading(false);
    if(!res||!res.detail){noty('Không tải được chi tiết');return;}
    showMoviePage(slug,res.sourceKey,res.detail,card);
  });
}

function showMoviePage(slug, sourceKey, detail, cardInfo){
  var movie=detail.movie||{};
  var episodes=detail.episodes||[];
  var title=movie.name||movie.title||movie.origin_name||cardInfo&&cardInfo.title||'Phim';
  var origin=movie.origin_name||movie.original_name||'';
  var year=movie.year||(movie.modified_time?new Date(movie.modified_time).getFullYear():'');
  var poster=absUrl(movie.poster_url||movie.thumb_url||movie.image||'',getImgSrc(sourceKey));
  var desc=movie.content||movie.description||'';
  desc=desc.replace(/<[^>]+>/g,'').trim();
  var type=movie.type==='series'||movie.type==='hoathinh'||(cardInfo&&cardInfo.type==='tv')?'tv':'movie';
  var mediaId=cardInfo&&cardInfo.id?(cardInfo.id):(slug+'|'+sourceKey);

  // Lưu lịch sử
  addHist({
    id:mediaId,
    title:title,
    origin_name:origin,
    year:year,
    poster:poster,
    slug:slug,
    source:sourceKey,
    type:type,
    viewed:Date.now()
  });

  // Check tiếp tục xem
  var prog=getProgress(mediaId);

  // Build server list
  var servers=[];
  episodes.forEach(function(sv){
    var sname=sv.server_name||'Server';
    var eps=(sv.server_data||[]).map(function(ep){
      return{name:ep.name||'Tập',link:ep.link_m3u8||ep.link_embed||ep.link||''};
    });
    if(eps.length)servers.push({name:sname,episodes:eps});
  });

  var html='<div class="fs-page">'
    +'<div style="display:flex;gap:1.5em;margin-bottom:1.5em;align-items:flex-start;">'
    +'<div style="flex:0 0 180px;">'
    +'<div class="fs-poster" '+(poster?'style="background-image:url('+E(poster)+')"':'')+'>'
    +(poster?'':'<div class="fs-poster-empty">'+E(title.substring(0,2))+'</div>')
    +'</div></div>'
    +'<div style="flex:1;min-width:0;">'
    +'<div class="fs-header" style="font-size:1.6em;">'+E(title)+'</div>'
    +(origin?'<div class="fs-sub" style="margin-bottom:.5em;">'+E(origin)+'</div>':'')
    +'<div style="margin-bottom:.5em;color:rgba(255,255,255,.7);">'
    +(year?E(year)+' · ':'')
    +(SOURCES[sourceKey]?E(SOURCES[sourceKey].name):'')
    +(movie.quality?' · '+E(movie.quality):'')
    +(movie.episode_current?' · '+E(movie.episode_current):'')
    +'</div>'
    +(desc?'<div style="color:rgba(255,255,255,.75);line-height:1.6;font-size:.95em;max-height:8em;overflow:hidden;">'+E(desc.substring(0,500))+(desc.length>500?'...':'')+'</div>':'')
    +'</div></div>';

  // Nút yêu thích + tiếp tục
  html+='<div class="fs-actions">'
    +'<div class="fs-btn" id="fs-fav">'+E(isFav(mediaId)?'❤ Đã thích':'♡ Yêu thích')+'</div>'
    +(prog?'<div class="fs-btn" id="fs-cont">▶ Tiếp tục: '+(type==='tv'?'S'+pad2(prog.season)+'E'+pad2(prog.episode):(prog.episode==1?'Bắt đầu':'Tiếp tục'))+'</div>':'')
    +'</div>';

  // Episode UI cho series
  if(type==='tv'&&servers.length){
    html+='<div class="fs-section"><div class="fs-section-title">📺 Chọn tập</div>';
    // Nếu 1 server -> show grid
    if(servers.length===1){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:.5em;">';
      servers[0].episodes.forEach(function(ep,i){
        var isPlaying=prog&&(i+1)===prog.episode;
        html+='<div class="fs-btn" data-server="0" data-ep="'+(i+1)+'" data-link="'+E(ep.link)+'" style="min-width:auto;padding:.5em;font-size:.9em;'+(isPlaying?'background:rgba(34,197,94,.3);border-color:rgba(34,197,94,.6);':'')+'">'+E(ep.name)+'</div>';
      });
      html+='</div>';
    }else{
      // Nhiều server -> chọn server trước
      html+='<div class="fs-source-row">';
      servers.forEach(function(sv,i){
        html+='<div class="fs-source-chip" data-server="'+i+'">'+E(sv.name)+' ('+sv.episodes.length+')</div>';
      });
      html+='</div><div id="fs-ep-list"></div>';
    }
    html+='</div>';
  }else if(type!=='tv'&&servers.length&&servers[0].episodes.length){
    // Movie
    html+='<div class="fs-section">'
      +'<div class="fs-btn" id="fs-play-movie" data-link="'+E(servers[0].episodes[0].link)+'">▶ Xem phim</div>'
      +'</div>';
  }

  // Nút Torrentio/Magnetz
  if(isSourceEnabled('torrentio')||isSourceEnabled('magnetz')){
    html+='<div class="fs-section">'
      +'<div class="fs-section-title">🧲 Torrent</div>'
      +'<div class="fs-actions">'
      +(isSourceEnabled('torrentio')?'<div class="fs-btn" id="fs-tio">▶ Torrentio</div>':'')
      +(isSourceEnabled('magnetz')?'<div class="fs-btn" id="fs-mgz">▶ Magnetz</div>':'')
      +'</div></div>';
  }

  html+='</div>';

  var $view=$('<div></div>').html(html);
  Lampa.Activity.push({
    url:'',
    title:title,
    component:'fshare_movie',
    source:$view,
    onAppend:function(){}
  });

  var fullCard=$.extend({},cardInfo||{},{id:mediaId,title:title,name:title,poster:poster,type:type});

  // Bind yêu thích
  $view.find('#fs-fav').on('click hover:enter',function(){
    var item={id:mediaId,title:title,slug:slug,source:sourceKey,year:year,origin_name:origin,poster:poster,type:type};
    var on=toggleFav(item);
    $(this).text(on?'❤ Đã thích':'♡ Yêu thích');
  });

  // Bind play movie
  $view.find('#fs-play-movie').on('click hover:enter',function(){
    var link=$(this).attr('data-link');
    if(!link){noty('Không có link');return;}
    saveProgress(mediaId,sourceKey,slug,1,1,title,fullCard);
    Lampa.Player.play({title:title,url:link,movie:fullCard});
  });

  // Bind episode click (1 server)
  $view.find('[data-ep]').on('click hover:enter',function(){
    var $b=$(this);
    var ep=parseInt($b.attr('data-ep'));
    var link=$b.attr('data-link');
    if(!link){noty('Tập chưa có link');return;}
    saveProgress(mediaId,sourceKey,slug,1,ep,title,fullCard);
    Lampa.Player.play({title:title+' - Tập '+ep,url:link,movie:fullCard});
  });

  // Bind chọn server (nhiều server)
  $view.find('.fs-source-chip').on('click hover:enter',function(){
    var idx=parseInt($(this).attr('data-server'));
    var sv=servers[idx];
    if(!sv)return;
    $view.find('.fs-source-chip').removeClass('on');
    $(this).addClass('on');
    var $list=$view.find('#fs-ep-list');
    var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:.5em;">';
    sv.episodes.forEach(function(ep,i){
      var isPlaying=prog&&(i+1)===prog.episode;
      h+='<div class="fs-btn" data-ep="'+(i+1)+'" data-link="'+E(ep.link)+'" style="min-width:auto;padding:.5em;font-size:.9em;'+(isPlaying?'background:rgba(34,197,94,.3);border-color:rgba(34,197,94,.6);':'')+'">'+E(ep.name)+'</div>';
    });
    h+='</div>';
    $list.html(h);
    $list.find('[data-ep]').on('click hover:enter',function(){
      var $b=$(this);
      var ep=parseInt($b.attr('data-ep'));
      var link=$b.attr('data-link');
      if(!link){noty('Tập chưa có link');return;}
      saveProgress(mediaId,sourceKey,slug,1,ep,title,fullCard);
      Lampa.Player.play({title:title+' - Tập '+ep,url:link,movie:fullCard});
    });
  });

  // Tiếp tục xem
  $view.find('#fs-cont').on('click hover:enter',function(){
    if(!prog)return;
    // Tìm link tập
    var sv=servers[0];
    if(!sv||!sv.episodes[prog.episode-1]){
      noty('Tập không khả dụng');
      return;
    }
    var link=sv.episodes[prog.episode-1].link;
    if(!link){noty('Tập chưa có link');return;}
    Lampa.Player.play({title:title+' - Tập '+prog.episode,url:link,movie:fullCard});
  });

  // Torrentio
  $view.find('#fs-tio').on('click hover:enter',function(){
    showTorrentioSearch(fullCard);
  });
  // Magnetz
  $view.find('#fs-mgz').on('click hover:enter',function(){
    showMagnetzSearch(fullCard);
  });
}

/* --- Torrentio trong phim --- */
function showTorrentioSearch(card){
  if(!isSourceEnabled('torrentio')){noty('Tắt nguồn Torrentio trong Settings');return;}
  showLoading(true);
  searchTorrentio(card).then(function(streams){
    showLoading(false);
    if(!streams.length){noty('Không có stream');return;}
    showTorrentStreams(card.title||card.name,streams);
  });
}

function showMagnetzSearch(card){
  if(!isSourceEnabled('magnetz')){noty('Tắt nguồn Magnetz trong Settings');return;}
  var q=card.original_title||card.title||card.name||'';
  if(!q){noty('Không có tên để tìm');return;}
  showLoading(true);
  searchMagnetz(q,card.type==='tv'?'tv':'movie').then(function(streams){
    showLoading(false);
    if(!streams.length){noty('Magnetz: không có kết quả (cần API key)');return;}
    showTorrentStreams(card.title||card.name,streams);
  });
}

function showTorrentStreams(title, streams){
  // Sort by seeds desc
  streams.sort(function(a,b){return(b.seeds||0)-(a.seeds||0);});
  Lampa.Select.show({
    title:'🧲 '+title+' ('+streams.length+')',
    items:streams.map(function(s){
      var sub='';
      if(s.quality)sub+=s.quality+'  ';
      if(s.size)sub+='💾 '+s.size+'  ';
      if(s.seeds)sub+='👤 '+s.seeds;
      return{title:s.title,subtitle:sub.trim(),value:s};
    }),
    onSelect:function(a){
      playTorrent(a.value,title,{});
    },
    onBack:function(){restoreController();}
  });
}

/* --- Danh sách theo category --- */
function showCategoryPage(catSlug, catName, page){
  page=page||1;
  showLoading(true);
  listCategoryAny(catSlug,page).then(function(items){
    showLoading(false);
    showItemsPage(catName+(page>1?' (trang '+page+')':''),items,{hasMore:items.length>=20},{
      onLoadMore:function(){showCategoryPage(catSlug,catName,page+1);}
    });
  });
}

/* ============================================================================
 * MENU CHÍNH
 * ============================================================================ */

function openHome(){
  var items=[
    {title:'🔍 Tìm kiếm',value:'search'},
    {title:'📂 Danh mục',value:'cat'},
    {title:'▶ Tiếp tục xem ('+Object.keys(getContinue()).length+')',value:'cont'},
    {title:'❤ Yêu thích ('+getFav().length+')',value:'fav'},
    {title:'🕘 Lịch sử ('+getHist().length+')',value:'hist'},
    {title:'⚙️ Cài đặt',value:'set'}
  ];
  Lampa.Select.show({
    title:'FShare All-in-One',
    items:items,
    onSelect:function(a){
      switch(a.value){
        case 'search': openSearch(); break;
        case 'cat': openCategoryMenu(); break;
        case 'cont': openContinue(); break;
        case 'fav': openFav(); break;
        case 'hist': openHist(); break;
        case 'set': openSettings(); break;
      }
    },
    onBack:function(){restoreController();}
  });
}

function openSearch(){
  if(Lampa.Prompt){
    Lampa.Prompt.open({
      title:'Tìm phim',
      value:'',
      placeholder:'Nhập tên phim...',
      onSubmit:function(v){if(v)doSearch(v,1);}
    });
  }else{
    // Fallback: in-page input
    var html='<div class="fs-page">'
      +'<div class="fs-header">Tìm phim</div>'
      +'<div class="fs-search-bar">'
      +'<input type="text" class="fs-input" id="fs-search-input" placeholder="Nhập tên phim..." />'
      +'<div class="fs-btn" id="fs-search-btn">Tìm</div>'
      +'</div></div>';
    var $v=$('<div></div>').html(html);
    Lampa.Activity.push({url:'',title:'Tìm phim',component:'fshare_search',source:$v,onAppend:function(){}});
    setTimeout(function(){
      $v.find('#fs-search-btn').on('click hover:enter',function(){
        var v=$v.find('#fs-search-input').val();
        if(v)doSearch(v,1);
      });
      $v.find('#fs-search-input').on('keypress',function(e){
        if(e.which===13){
          var v=$(this).val();
          if(v)doSearch(v,1);
        }
      });
    },100);
  }
}

function openCategoryMenu(){
  var items=[
    {title:'🔥 Phim Mới',value:'phim-moi'},
    {title:'🎬 Phim Lẻ',value:'phim-le'},
    {title:'📺 Phim Bộ',value:'phim-bo'},
    {title:'🎨 Hoạt Hình',value:'hoat-hinh'},
    {title:'🍿 Chiếu Rạp',value:'phim-chieu-rap'},
    {title:'🌏 Phim Việt Nam',value:'phim-viet-nam'},
    {title:'🇨🇳 Phim Trung Quốc',value:'phim-trung-quoc'},
    {title:'🇰🇷 Phim Hàn Quốc',value:'phim-han-quoc'},
    {title:'🇯🇵 Phim Nhật Bản',value:'phim-nhat-ban'},
    {title:'🇺🇸 Phim Âu Mỹ',value:'phim-au-my'}
  ];
  Lampa.Select.show({
    title:'Danh mục',
    items:items,
    onSelect:function(a){showCategoryPage(a.value,a.title,1);},
    onBack:function(){restoreController();}
  });
}

function openContinue(){
  var cont=getContinue();
  var keys=Object.keys(cont);
  if(!keys.length){noty('Chưa có lịch sử xem');return;}
  var items=keys.map(function(k){
    var p=cont[k];
    return{
      title:p.title+' - '+(p.mediaType==='tv'?'S'+pad2(p.season)+'E'+pad2(p.episode):'Xem tiếp'),
      value:p
    };
  });
  Lampa.Select.show({
    title:'▶ Tiếp tục xem',
    items:items,
    onSelect:function(a){
      var p=a.value;
      // Tìm lại link tập
      getDetailAny(p.slug,p.sourceKey).then(function(res){
        if(!res||!res.detail){noty('Không tải được');return;}
        var eps=(res.detail.episodes||[]);
        if(!eps.length){noty('Không có tập');return;}
        var target=null;
        for(var i=0;i<eps.length;i++){
          var sd=eps[i].server_data||[];
          for(var j=0;j<sd.length;j++){
            if((j+1)===p.episode){
              target=sd[j];
              break;
            }
          }
          if(target)break;
        }
        if(!target){noty('Tập không khả dụng');return;}
        var link=target.link_m3u8||target.link_embed||target.link||'';
        if(!link){noty('Tập chưa có link');return;}
        Lampa.Player.play({title:p.title+' - Tập '+p.episode,url:link,movie:{id:p.title}});
      });
    },
    onBack:function(){restoreController();}
  });
}

function openFav(){
  var favs=getFav();
  if(!favs.length){noty('Chưa có yêu thích');return;}
  showItemsPage('❤ Yêu thích',favs.map(function(f){
    return{
      title:f.title,origin_name:f.origin_name,year:f.year,
      poster:f.poster,slug:f.slug,source:f.source,type:f.type,id:f.id
    };
  }),{hasMore:false});
}

function openHist(){
  var hist=getHist();
  if(!hist.length){noty('Chưa có lịch sử');return;}
  showItemsPage('🕘 Lịch sử',hist.map(function(h){
    return{
      title:h.title,origin_name:h.origin_name,year:h.year,
      poster:h.poster,slug:h.slug,source:h.source,type:h.type,id:h.id
    };
  }),{hasMore:false});
}

/* ============================================================================
 * SETTINGS UI
 * ============================================================================ */

function openSettings(){
  var cfg=getCfg();
  var html='<div class="fs-page">'
    +'<div class="fs-header">⚙️ Cài đặt FShare All</div>'
    +'<div class="fs-section">'
    +'<div class="fs-section-title">📡 Nguồn phim</div>'
    +'<div class="fs-source-row">';
  Object.keys(SOURCES).forEach(function(k){
    var s=SOURCES[k];
    var on=cfg['src_'+k+'_en'];
    html+='<div class="fs-source-chip '+(on?'on':'')+'" data-src="'+k+'">'+s.icon+' '+s.name+(on?' ✓':'')+'</div>';
  });
  html+='</div></div>'

    +'<div class="fs-section">'
    +'<div class="fs-section-title">🧲 TorrServer (cho Torrentio/Magnetz)</div>'
    +'<input type="text" class="fs-input" id="fs-ts-url" placeholder="TorrServer URL (VD: 192.168.1.100:8090)" value="'+E(cfg.torrserver_url)+'" style="margin-bottom:.5em;" />'
    +'<input type="password" class="fs-input" id="fs-ts-pass" placeholder="Password (để trống nếu không có)" value="'+E(cfg.torrserver_pass)+'" />'
    +'</div>'

    +'<div class="fs-section">'
    +'<div class="fs-section-title">⚙️ Cấu hình Torrentio</div>'
    +'<input type="text" class="fs-input" id="fs-tio-cfg" placeholder="Torrentio config (để trống nếu dùng mặc định)" value="'+E(cfg.torrentio_config)+'" style="margin-bottom:.3em;" />'
    +'<div style="color:rgba(255,255,255,.5);font-size:.85em;margin-top:.3em;">Lấy config từ: torrentio.strem.fun/configure</div>'
    +'</div>'

    +'<div class="fs-section">'
    +'<div class="fs-section-title">🔑 Magnetz API Key</div>'
    +'<input type="password" class="fs-input" id="fs-mgz-key" placeholder="API key từ magnetz.io" value="'+E(cfg.magnetz_key)+'" />'
    +'</div>'

    +'<div class="fs-section">'
    +'<div class="fs-section-title">🎬 TMDB API Key</div>'
    +'<input type="text" class="fs-input" id="fs-tmdb" placeholder="TMDB API key" value="'+E(cfg.tmdb_key)+'" />'
    +'</div>'

    +'<div class="fs-section">'
    +'<div class="fs-btn" id="fs-save">💾 Lưu cài đặt</div>'
    +'<div class="fs-btn" id="fs-clear-cache">🗑️ Xoá cache</div>'
    +'<div class="fs-btn" id="fs-clear-cont">🗑️ Xoá tiếp tục xem</div>'
    +'<div class="fs-btn" id="fs-test-ts">🧪 Test TorrServer</div>'
    +'</div>'

    +'<div style="text-align:center;color:rgba(255,255,255,.4);font-size:.85em;margin-top:2em;">FShare All-in-One v'+VERSION+'</div>'
    +'</div>';

  var $v=$('<div></div>').html(html);
  Lampa.Activity.push({url:'',title:'Cài đặt',component:'fshare_settings',source:$v,onAppend:function(){}});

  $v.find('.fs-source-chip').on('click hover:enter',function(){
    var k=$(this).attr('data-src');
    var c=getCfg();
    c['src_'+k+'_en']=!c['src_'+k+'_en'];
    setCfg(c);
    var on=c['src_'+k+'_en'];
    $(this).toggleClass('on').text(SOURCES[k].icon+' '+SOURCES[k].name+(on?' ✓':''));
  });
  $v.find('#fs-save').on('click hover:enter',function(){
    var c=getCfg();
    c.torrserver_url=$v.find('#fs-ts-url').val().trim();
    c.torrserver_pass=$v.find('#fs-ts-pass').val();
    c.torrentio_config=$v.find('#fs-tio-cfg').val().trim();
    c.magnetz_key=$v.find('#fs-mgz-key').val().trim();
    c.tmdb_key=$v.find('#fs-tmdb').val().trim()||'4ef0d7355d9ffb5151e987764708ce96';
    setCfg(c);
    noty('Đã lưu cài đặt');
  });
  $v.find('#fs-clear-cache').on('click hover:enter',function(){
    _rm(CACHE_KEY);
    noty('Đã xoá cache');
  });
  $v.find('#fs-clear-cont').on('click hover:enter',function(){
    _rm(CONT_KEY);
    noty('Đã xoá tiếp tục xem');
  });
  $v.find('#fs-test-ts').on('click hover:enter',function(){
    var u=c.torrserver_url=$v.find('#fs-ts-url').val().trim();
    if(!u){noty('Chưa nhập URL');return;}
    u=u.replace(/\/+$/,'');
    if(!/^https?:\/\//i.test(u))u='http://'+u;
    $.ajax({url:u+'/echo',type:'GET',timeout:5000,
      success:function(){noty('✅ TorrServer OK!');},
      error:function(xhr){noty('❌ Lỗi: '+(xhr.status||'timeout'));}
    });
  });
}

/* ============================================================================
 * HOOKS - TỰ ĐỘNG THÊM VÀO LAMPA
 * ============================================================================ */

function injectToMenu(){
  if(!Lampa.Menu||!Lampa.Menu.show)return;
  try{
    Lampa.Menu.add({
      id:'fshare_all',
      title:'FShare All',
      icon:'<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 4h16v3H4zm0 5h16v3H4zm0 5h16v3H4z"/></svg>',
      onClick:openHome
    });
  }catch(e){console.warn('[FShare] Menu.add failed:',e);}
}

function injectToMoviePage(){
  Lampa.Listener.follow('full',function(e){
    if(e.type!=='complite')return;
    var card=(e.data&&e.data.movie)||(e.object&&e.object.card);
    if(!card)return;
    var $ctx=(e.object&&e.object.activity&&e.object.activity.render)?e.object.activity.render():null;
    if(!$ctx||!$ctx.length)return;
    if($ctx.find('.view--fshare').length)return;
    var btn=$('<div class="kk-src-btn view--fshare selector" style="background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(99,102,241,.06));border:1px solid rgba(99,102,241,.4);">'
      +'<div class="kk-sb-main">🎬 FShare <span class="kk-arrow">▼</span></div>'
      +'<div class="kk-sb-sub">KKPhim · OPhim · Torrent</div>'
      +'</div>');
    bindEvents(btn,function(){
      // Mở menu chọn nguồn
      var items=[];
      if(isSourceEnabled('kkphim')||isSourceEnabled('ophim')){
        items.push({title:'📡 KKPhim/OPhim - tìm tự động',value:'auto'});
      }
      if(isSourceEnabled('torrentio'))items.push({title:'🧲 Torrentio',value:'torrentio'});
      if(isSourceEnabled('magnetz'))items.push({title:'🧲 Magnetz',value:'magnetz'});
      if(!items.length){noty('Bật nguồn trong Settings');return;}
      Lampa.Select.show({
        title:'FShare - '+(card.title||card.name||''),
        items:items,
        onSelect:function(a){
          if(a.value==='auto'){
            // Tìm slug từ tên
            var t=card.title||card.name||'';
            var o=card.original_title||card.original_name||'';
            var y=(card.release_date||card.first_air_date||'').slice(0,4);
            var terms=[];
            if(o)terms.push(o);
            if(t)terms.push(t);
            if(y){if(o)terms.push(o+' '+y);if(t)terms.push(t+' '+y);}
            if(!terms.length){noty('Không có tên');return;}
            noty('Đang tìm...');
            showLoading(true);
            searchAll(terms[0],1).then(function(items){
              showLoading(false);
              var best=null,bs=0;
              items.forEach(function(it){
                var sc=scoreMatchItem(it,t,o,y);
                if(sc>bs){bs=sc;best=it;}
              });
              if(!best){noty('Không tìm thấy');return;}
              openMovie(best.slug,best.source,best.title,{
                id:card.id||(card.tmdb_id||''),
                year:y,origin_name:o,
                type:(card.type==='tv'||card.number_of_seasons)?'tv':'movie'
              });
            });
          }else if(a.value==='torrentio'){
            showTorrentioSearch({id:card.id||card.tmdb_id,title:card.title||card.name,type:card.type==='tv'?'tv':'movie'});
          }else if(a.value==='magnetz'){
            showMagnetzSearch({original_title:card.original_title,title:card.title||card.name,type:card.type==='tv'?'tv':'movie'});
          }
        },
        onBack:function(){restoreController();}
      });
    });
    var anchor=$ctx.find('.full-start__buttons,.view--torrent,.view--kkphim');
    if(anchor.length)anchor.last().after(btn);
    else $ctx.find('.full-start').append(btn);
  });
}

function scoreMatchItem(it, title, orig, year){
  var s=0;
  var nT=nrm(title),nO=nrm(orig);
  var nIT=nrm(it.title),nIO=nrm(it.origin_name);
  if(nT&&(nIT===nT||nIO===nT))s+=100;
  else if(nO&&(nIT===nO||nIO===nO))s+=95;
  else if(nT.length>=3&&(nIT.indexOf(nT)>=0||nT.indexOf(nIT)>=0))s+=60;
  if(s>0&&year&&it.year){
    var iy=parseInt(it.year),ty=parseInt(year);
    if(iy===ty)s+=30;else if(Math.abs(iy-ty)<=1)s+=15;
  }
  return s;
}

/* ============================================================================
 * INIT
 * ============================================================================ */

function start(){
  if(window.__fshare_all_started)return;
  window.__fshare_all_started=true;
  injectCSS();
  try{injectToMenu();}catch(e){}
  try{injectToMoviePage();}catch(e){}
  console.log('[FShare All] v'+VERSION+' ready');
}

if(window.appready)start();
else{
  if(window.Lampa&&Lampa.Listener){
    Lampa.Listener.follow('app',function(e){if(e.type==='ready')start();});
  }else{
    document.addEventListener('DOMContentLoaded',start);
  }
}

/* ============================================================================
 * PUBLIC API
 * ============================================================================ */

window.__fshare_all={
  version:VERSION,
  search:doSearch,
  openMovie:openMovie,
  openHome:openHome,
  openSettings:openSettings,
  toggleFav:toggleFav,
  getFav:getFav,
  getHist:getHist,
  getContinue:getContinue,
  saveProgress:saveProgress,
  clearProgress:function(mediaId){clearProgress(mediaId);},
  sources:SOURCES,
  config:{
    get:getCfg,
    set:setCfg
  },
  clearCache:function(){_rm(CACHE_KEY);},
  /* Add custom source */
  addSource:function(key,cfg){
    SOURCES[key]=$.extend({key:key,enabled:true,type:'api',endpoints:{}},cfg);
  }
};

})();
