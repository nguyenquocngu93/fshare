/* KKPhim Torrent Extension v1.1 - Fixed */
(function(){
'use strict';
if(window.__kkphim_torrent_started)return;
window.__kkphim_torrent_started=true;

/* Chờ file UI chính sẵn sàng - sửa flag đúng */
function waitForCore(cb){
  var t=0;
  var iv=setInterval(function(){
    t++;
    if(window.__kkphim_ui_started){ /* FIX 1: đúng flag */
      clearInterval(iv);
      cb();
    }
    if(t>100){
      clearInterval(iv);
      console.warn('[KKTorrent] Timeout waiting for core UI');
    }
  },100);
}

waitForCore(function(){
  init();
});

function init(){

/* ---- HELPERS ---- */
function ls(){try{return JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem('kkphim_settings',JSON.stringify(c));}catch(e){}}
function tsHost(){return ls().torrserver_host||'';}
function tsPass(){return ls().torrserver_password||'';}
function tioConf(){return ls().torrentio_config||'';}
function aioUrl(){return ls().aio_url||'';}
function tEngine(){return ls().torrent_engine||'torrentio';}

var TIO_BASE='https://torrentio.strem.fun';
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';

/* ---- UTILS ---- */
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ---- TORRENTIO CONFIG PARSER ---- */
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

  return{
    name:name,
    infoHash:st.infoHash||'',
    fileIdx:st.fileIdx,
    url:st.url||'',
    size:size,
    seeds:seeds,
    quality:qual
  };
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

/* ---- TMDB IMDB LOOKUP ---- */
async function tFetch(path){
  var r=await fetch('https://api.themoviedb.org/3'+path,{
    headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}
  });
  if(!r.ok)throw new Error('TMDB '+r.status);
  return await r.json();
}

async function gImdb(type,id){
  if(!id)return null;
  try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}
  catch(e){return null;}
}

async function gSeasons(id){
  try{
    var r=await tFetch('/tv/'+id+'?language=vi-VN');
    if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){
      return{
        season_number:s.season_number,
        name:s.name||('Season '+s.season_number),
        episode_count:s.episode_count||0,
        poster_path:s.poster_path||'',
        overview:s.overview||'',
        air_date:s.air_date||''
      };
    });
  }catch(e){}
  return[];
}

/* ---- TORRSERVER ---- */
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
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang gửi TorrServer...');
  try{
    var u=tsU('/torrents');
    var r=await fetch(u,{
      method:'POST',
      headers:tsH(),
      body:JSON.stringify({
        action:'add',
        link:bMag(stream.infoHash),
        title:title||'',
        poster:poster||'',
        save_to_db:false
      })
    });
    if(!r.ok)throw new Error('TS:'+r.status);
    var td=await r.json();
    var hash=td.hash||stream.infoHash;

    await dly(2000);

    var info=null;
    var rt=0;
    while(rt<3){
      try{
        var r2=await fetch(u,{
          method:'POST',
          headers:tsH(),
          body:JSON.stringify({action:'get',hash:hash})
        });
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

    if(!files.length){
      playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));
    }else if(files.length===1){
      playFile(tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play'));
    }else if(fi!==undefined&&fi!==null&&fi>=0){
      playFile(tsU('/stream/fname?link='+hash+'&index='+(files[fi].id||fi)+'&play'));
    }else{
      Lampa.Select.show({
        title:'Chọn file',
        items:files.map(function(f){
          return{
            title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),
            value:f
          };
        }),
        onSelect:function(a){
          playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));
        },
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }
  }catch(e){Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));}
}

/* ---- TORRENTIO / AIO URL BUILDER ---- */
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

/* ---- FETCH STREAMS ---- */
async function fStreams(type,imdb,s,e){
  var eng=tEngine();
  var url;
  if(eng==='aio'){
    url=aioU(type,imdb,s,e);
    if(!url)throw new Error('Chưa cấu hình AIOStreams');
  }else{
    url=tioU(type,imdb,s,e);
  }
  var r=await fetch(url);
  if(!r.ok)throw new Error(eng+' '+r.status);
  var d=await r.json();
  return(d.streams||[]).map(pStream);
}

/* ---- MENU CSS ---- */
function injectTorrentMenuCSS(){
  var id='kk-torrent-menu-css';
  if($('#'+id).length)return;
  $('head').append(
    '<style id="'+id+'">'
    +'.selectbox .selectbox-item__title{'
    +'white-space:pre-wrap!important;'
    +'overflow:visible!important;'
    +'text-overflow:unset!important;'
    +'display:block!important;}'
    +'.selectbox .selectbox-item{'
    +'height:auto!important;'
    +'max-height:none!important;}'
    +'</style>'
  );
}

/* ---- SHOW STREAM LIST ---- */
function showStr(streams,title,poster){
  injectTorrentMenuCSS();
  var ts=!!tsHost();
  var eng=tEngine()==='aio'?'AIOStreams':'Torrent';
  Lampa.Select.show({
    title:eng+': '+title+' ('+streams.length+')'+(ts?' → TS':''),
    items:streams.slice(0,40).map(function(s){
      return{title:fmtStream(s),value:s};
    }),
    onSelect:function(a){
      var s=a.value;
      if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx);
      else if(s.url)Lampa.Player.play({title:title,url:s.url});
      else Lampa.Noty.show(s.infoHash?'Chưa cấu hình TorrServer!':'Không có link');
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ---- MOVIE TORRENT ---- */
async function oTorMov(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tìm torrent...');
  try{
    var id=imdb||await gImdb('movie',tid);
    if(!id){Lampa.Noty.show('Không có IMDB ID');return;}
    var st=await fStreams('movie',id);
    if(!st.length){Lampa.Noty.show('Không có stream');return;}
    showStr(st,title,poster);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- TV TORRENT ---- */
async function oTorTV(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tải season...');
  try{
    var id=imdb||await gImdb('tv',tid);
    if(!id){Lampa.Noty.show('Không có IMDB ID');return;}
    var sn=await gSeasons(tid);
    if(sn.length>1){
      Lampa.Select.show({
        title:'Chọn Season',
        items:sn.map(function(s){
          return{
            title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),
            value:s
          };
        }),
        onSelect:function(a){pTorEp(a.value,id,title,poster);},
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }else if(sn.length===1){
      pTorEp(sn[0],id,title,poster);
    }else{
      Lampa.Noty.show('Đang tìm...');
      var st=await fStreams('tv',id,1,1);
      if(st.length)showStr(st,title+' S01E01',poster);
      else Lampa.Noty.show('Không tìm thấy stream');
    }
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- EPISODE PICKER ---- */
function pTorEp(season,imdb,title,poster){
  var items=[];
  for(var i=1;i<=(season.episode_count||24);i++){
    items.push({
      title:'S'+pd(season.season_number)+'E'+pd(i),
      value:{s:season.season_number,e:i}
    });
  }
  Lampa.Select.show({
    title:season.name,
    items:items,
    onSelect:async function(a){
      var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);
      Lampa.Noty.show('Đang tìm '+lb+'...');
      try{
        var st=await fStreams('tv',imdb,a.value.s,a.value.e);
        if(!st.length){Lampa.Noty.show('Không có stream');return;}
        showStr(st,lb,poster);
      }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ---- PLAY EPISODE DIRECT ---- */
async function playEpTorrent(imdbId,seasonNum,epNum,title,poster){
  var lb=title+' S'+pd(seasonNum)+'E'+pd(epNum);
  Lampa.Noty.show('Đang tìm torrent '+lb+'...');
  try{
    var st=await fStreams('tv',imdbId,seasonNum,epNum);
    if(!st.length){Lampa.Noty.show('Không có stream');return;}
    showStr(st,lb,poster);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ---- TORRENT BUTTON CSS ---- */
function injectTorrentCSS(){
  var id='kk-torrent-ext-css';
  if($('#'+id).length)return;
  $('head').append(
    '<style id="'+id+'">'
    +'.kk-src-btn--torrent{'
    +'background:linear-gradient(135deg,rgba(220,38,38,0.15),rgba(220,38,38,0.05))!important;'
    +'border:1px solid rgba(220,38,38,0.3)!important;}'
    +'.kk-src-btn--torrent:hover,.kk-src-btn--torrent.focus,.kk-src-btn--torrent.selected{'
    +'background:linear-gradient(135deg,rgba(220,38,38,0.3),rgba(220,38,38,0.1))!important;'
    +'border-color:rgba(220,38,38,0.6)!important;}'
    +'.kk-src-btn--aio{'
    +'background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.05))!important;'
    +'border:1px solid rgba(124,58,237,0.3)!important;}'
    +'.kk-src-btn--aio:hover,.kk-src-btn--aio.focus,.kk-src-btn--aio.selected{'
    +'background:linear-gradient(135deg,rgba(124,58,237,0.3),rgba(124,58,237,0.1))!important;'
    +'border-color:rgba(124,58,237,0.6)!important;}'
    +'</style>'
  );
}

/* ---- BUTTON EVENT HELPER ---- */
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
}

/* ---- BUILD TORRENT BUTTON
 * FIX 2: Đổi tên thành buildTorrentBtn để khớp với file UI
 * File UI gọi: window.__kkphim_torrent.buildTorrentBtn(mt,tid,t,ps,imdb)
 ---- */
function buildTorrentBtn(mt,tid,title,poster,imdb){
  var eng=tEngine();
  var label=eng==='aio'?'AIOStreams':'Torrent';
  if(tsHost())label+=' → TS';
  var css=eng==='aio'?'kk-src-btn--aio':'kk-src-btn--torrent';
  var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Phát qua torrent</div>'
    +'</div>');

  /* FIX 3: Lấy imdbId từ window._detCtx (đúng tên file UI dùng)
   * File UI set: _detCtx = {imdbId: imdb} nhưng là local var.
   * Ta expose nó qua window trong hàm này nếu được truyền vào */
  var resolvedImdb = imdb || (window._kkphim_detCtx && window._kkphim_detCtx.imdbId) || null;

  if(mt==='movie'){
    bE(btn,function(){oTorMov(tid,title,poster,resolvedImdb);});
  }else{
    bE(btn,function(){oTorTV(tid,title,poster,resolvedImdb);});
  }
  return $('<div style="width:100%"></div>').append(btn);
}

/* ---- BUILD SETTINGS SECTION
 * FIX 4: Thêm hàm buildSettings mà file UI gọi:
 * window.__kkphim_torrent.buildSettings(w, mg, mo, mi, si2, comp)
 ---- */
function buildSettings(w, mg, mo, mi, si2, comp){
  var s = {};
  try{ s = JSON.parse(localStorage.getItem('kkphim_settings'))||{}; }catch(e){}

  /* --- Engine selector --- */
  var gEng = mg('Torrent Engine');
  var eng = s.torrent_engine||'torrentio';
  [{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}].forEach(function(o){
    gEng.append(mo(o.n,'',eng===o.k,function(){
      ss({torrent_engine:o.k});
      Lampa.Noty.show('Engine: '+o.n);
      comp.create();
    }));
  });
  w.append(gEng);

  /* --- Torrentio config --- */
  var gTio = mg('Torrentio Config');
  var tioVal = s.torrentio_config||'';
  gTio.append(mi(
    'Torrentio Config URL',
    'Dán URL manifest hoặc chuỗi config',
    tioVal||'(chưa cấu hình)',
    'Torrentio Config URL',
    'torrentio_config',
    s
  ));
  w.append(gTio);

  /* --- AIOStreams URL --- */
  var gAio = mg('AIOStreams URL');
  var aioVal = s.aio_url||'';
  gAio.append(mi(
    'AIOStreams Base URL',
    'VD: https://aiostreams.example.com',
    aioVal||'(chưa cấu hình)',
    'AIOStreams Base URL',
    'aio_url',
    s
  ));
  w.append(gAio);

  /* --- TorrServer --- */
  var gTS = mg('TorrServer');
  var tsVal = s.torrserver_host||'';
  var tsPassVal = s.torrserver_password||'';
  gTS.append(mi(
    'TorrServer Host',
    'VD: http://192.168.1.100:8090',
    tsVal||'(chưa cấu hình)',
    'TorrServer Host (bao gồm http://)',
    'torrserver_host',
    s
  ));
  gTS.append(mi(
    'TorrServer Password',
    'Để trống nếu không có',
    tsPassVal?'••••••':'(không có)',
    'TorrServer Password',
    'torrserver_password',
    s
  ));
  w.append(gTS);

  /* --- Test connection --- */
  var gTest = mg('Kiểm tra kết nối');
  var testBtn = si2('Test TorrServer','Kiểm tra kết nối TorrServer','Thử');
  bE(testBtn, function(){
    var host = tsHost();
    if(!host){Lampa.Noty.show('Chưa nhập host!');return;}
    Lampa.Noty.show('Đang kiểm tra...');
    fetch(tsU('/echo'),{method:'GET',headers:tsH()})
      .then(function(r){
        if(r.ok)Lampa.Noty.show('TorrServer OK!');
        else Lampa.Noty.show('Lỗi: HTTP '+r.status);
      })
      .catch(function(e){Lampa.Noty.show('Không kết nối được: '+(e.message||''));});
  });
  gTest.append(testBtn);
  w.append(gTest);
}

/* ---- EXPOSE API ra window.__kkphim_torrent
 * FIX 2 (tiếp): Namespace phải là __kkphim_torrent (không phải __kkphim_torrent_api)
 * và phải có đúng các method mà file UI gọi:
 *   - buildTorrentBtn(mt, tid, t, ps, imdb)
 *   - buildSettings(w, mg, mo, mi, si2, comp)
 *   - playEpTorrent(imdbId, seasonNum, epNum, title, poster)
 ---- */
window.__kkphim_torrent = {
  buildTorrentBtn:  buildTorrentBtn,   /* File UI gọi cái này */
  buildSettings:    buildSettings,     /* File UI gọi cái này */
  playEpTorrent:    playEpTorrent,     /* kkphim_season_detail gọi */
  /* Bonus exports để dùng nội bộ nếu cần */
  oTorMov:          oTorMov,
  oTorTV:           oTorTV,
  fStreams:         fStreams,
  showStr:          showStr,
  tsHost:           tsHost,
  playTS:           playTS
};

/* FIX 3: Expose _detCtx ra window để file Torrent đọc được
 * File UI dùng local var _detCtx, ta patch window._kkphim_detCtx
 * bằng cách hook vào Activity */
function patchDetCtx(){
  Lampa.Listener.follow('activity', function(e){
    if(e.type==='start'||e.type==='push'){
      setTimeout(function(){
        try{
          var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
          if(act && act.component==='kkphim_tmdb_detail'){
            /* Đọc imdb từ act nếu có, hoặc để null */
            window._kkphim_detCtx = { imdbId: act.imdb_id || null };
          }
        }catch(e2){}
      }, 500);
    }
  });
}

/* ---- STARTUP ---- */
function startTorrent(){
  injectTorrentMenuCSS();
  injectTorrentCSS();
  patchDetCtx();
  console.log('[KKTorrent] v1.1 OK - Loaded, namespace: window.__kkphim_torrent');
  Lampa.Noty.show('KKPhim Torrent đã sẵn sàng');
}

startTorrent();

} /* end init() */

})();