/* KKPhim Torrent Extension v1.3 - Debug + Fix + Jackett Button */
(function(){
'use strict';
if(window.__kkphim_torrent_started)return;
window.__kkphim_torrent_started=true;

function waitForCore(cb){
  var t=0;
  var iv=setInterval(function(){
    t++;
    if(window.__kkphim_ui_started){clearInterval(iv);cb();}
    if(t>100){clearInterval(iv);console.warn('[KKTorrent] Timeout');}
  },100);
}
waitForCore(function(){init();});

function init(){

/* ---- HELPERS ---- */
function ls(){try{return JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){return{};}}
function ss(o){try{var c=ls();Object.keys(o).forEach(function(k){c[k]=o[k];});localStorage.setItem('kkphim_settings',JSON.stringify(c));}catch(e){}}
function tsHost(){return ls().torrserver_host||'';}
function tsPass(){return ls().torrserver_password||'';}
function tioConf(){return ls().torrentio_config||'';}
function aioUrl(){return ls().aio_url||'';}
function jackettUrl(){return(ls().jackett_url||'https://jac.maxvol.pro').replace(/\/+$/,'');}
function jackettKey(){return ls().jackett_key||'';}
function tEngine(){return ls().torrent_engine||'torrentio';}

var TIO_BASE='https://torrentio.strem.fun';
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';

function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}

/* ================================================================
   STREAM PARSE v1.3
   
   Torrentio THỰC TẾ (từ API):
     st.name = "Torrentio\n1080p"
     st.description = "👤 42 💾 1.74 GB ⚙️ YTS\nMovie.Title.1080p.mkv"
     st.infoHash = "abc123..."
   
   AIOStreams THỰC TẾ (từ API):  
     st.name = "AIOStreams\n[Prowlarr|RD] 1080p"  
     st.description = "👤 1080 💾 17.9 GB ⚙️ 1337x\nFilename.mkv"
     OR description không có seeds/size, chỉ có trong name
   
   QUAN TRỌNG: Log raw để debug
================================================================ */

function parseSize(text){
  if(!text)return'';
  /* 💾 17.9 GB hoặc 17.9 GB hoặc 17.9GB */
  var m=text.match(/💾\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);
  if(m)return m[1].replace(/\s+/,' ').trim();
  m=text.match(/\b([\d.,]+)\s*(TB|GB|GiB|MB|MiB)\b/i);
  if(m)return m[1]+' '+m[2].replace('GiB','GB').replace('MiB','MB');
  return'';
}

function parseSeeds(text){
  if(!text)return'';
  /* 👤 42 - emoji format (Torrentio/AIOStreams) */
  var m=text.match(/👤\s*(\d+)/);
  if(m)return m[1];
  /* Seeds: 42 */
  m=text.match(/[Ss]eeds?:?\s*(\d+)/);
  if(m)return m[1];
  return'';
}

function parseQuality(text){
  if(!text)return'';
  var m=text.match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  if(m){
    var q=m[1].toUpperCase();
    if(q==='4K UHD'||q==='UHD')return'2160P';
    if(q==='4K')return'2160P';
    return q;
  }
  return'';
}

function parseCodec(text){
  if(!text)return'';
  var m=text.match(/\b(H\.?265|HEVC|H\.?264|AVC|AV1|x265|x264)\b/i);
  return m?m[1].toUpperCase().replace('H.265','HEVC').replace('H.264','AVC'):'';
}

function parseAudio(text){
  if(!text)return'';
  var m=text.match(/\b(Atmos|TrueHD|DTS-HD|DTS|DD\+|EAC3|AC3|AAC)\b/i);
  return m?m[1].toUpperCase():'';
}

function parseSource(text){
  if(!text)return'';
  /* ⚙️ YTS hoặc ⚙️ 1337x */
  var m=text.match(/⚙️\s*([^\n\r\s][^\n\r]*)/);
  if(m)return m[1].trim();
  return'';
}

function bytesToSize(bytes){
  bytes=Number(bytes);
  if(!bytes||bytes<=0)return'';
  if(bytes>=1099511627776)return(bytes/1099511627776).toFixed(2)+' TB';
  if(bytes>=1073741824)return(bytes/1073741824).toFixed(2)+' GB';
  if(bytes>=1048576)return(bytes/1048576).toFixed(0)+' MB';
  return'';
}

function pStream(st){
  /* === RAW DATA LOG - giúp debug ===*/
  console.log('[KKTorrent] RAW stream:',{
    name: st.name,
    description: st.description,
    title: st.title,
    infoHash: st.infoHash,
    url: st.url ? st.url.substring(0,80)+'...' : '',
    behaviorHints: st.behaviorHints
  });

  var rawName = String(st.name||'');
  var rawDesc = String(st.description||'');
  var rawTitle= String(st.title||'');
  
  /* Ghép tất cả text để search */
  var allText = rawName+'\n'+rawDesc+'\n'+rawTitle;

  /* === PROVIDER NAME ===
     name thường là: "Torrentio\n1080p" hoặc "AIOStreams\n[badge] 1080p"
     Dòng 1 = tên provider */
  var nameLines = rawName.split(/[\n\r]+/);
  var providerLine = (nameLines[0]||'').trim();
  /* Xóa badge prefix như [RD+], [+], [Prowlarr] */
  var provider = providerLine.replace(/^\[([^\]]*)\]\s*/,'').trim()||'Stream';
  
  /* Dòng 2 của name = quality label */
  var qualLine = (nameLines[1]||'').trim();

  /* === SIZE ===
     Ưu tiên: rawDesc (có 💾) > behaviorHints */
  var size = parseSize(rawDesc);
  if(!size) size = parseSize(rawName);
  if(!size && st.behaviorHints){
    size = bytesToSize(st.behaviorHints.videoSize||st.behaviorHints.bingeGroup);
  }
  /* AIOStreams đôi khi có "Size: X GB" dạng text */
  if(!size){
    var sm = rawDesc.match(/[Ss]ize:?\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);
    if(sm) size = sm[1];
  }

  /* === SEEDS ===
     👤 số trong description */
  var seeds = parseSeeds(rawDesc);
  if(!seeds) seeds = parseSeeds(rawName);
  if(!seeds) seeds = parseSeeds(rawTitle);

  /* === QUALITY ===
     Từ dòng 2 name > description > allText */
  var quality = parseQuality(qualLine);
  if(!quality) quality = parseQuality(rawDesc);
  if(!quality) quality = parseQuality(allText);

  /* === CODEC + AUDIO ===*/
  var codec = parseCodec(allText);
  var audio = parseAudio(allText);

  /* === SOURCE (tracker) ===
     ⚙️ trong description */
  var source = parseSource(rawDesc)||parseSource(rawName);

  /* === FILENAME ===
     Dòng cuối description thường là tên file */
  var filename='';
  var descLines = rawDesc.split(/[\n\r]+/);
  for(var i=descLines.length-1;i>=0;i--){
    var dl=descLines[i].trim();
    if(dl&&dl.match(/\.(mkv|mp4|avi|ts|m2ts|webm|mov)$/i)){
      filename=dl;break;
    }
  }

  /* === BUILD DISPLAY NAME ===*/
  var displayName = provider;
  var badges=[];
  if(quality) badges.push(quality);
  if(codec)   badges.push(codec);
  if(audio)   badges.push(audio);
  /* Chỉ show source nếu khác provider */
  if(source && source.toLowerCase()!==provider.toLowerCase() && source.length<20){
    badges.push(source);
  }
  if(badges.length) displayName+=' ['+badges.join('|')+']';

  console.log('[KKTorrent] Parsed:',{
    displayName:displayName,size:size,seeds:seeds,
    quality:quality,codec:codec,source:source
  });

  return{
    name:displayName,
    provider:provider,
    infoHash:st.infoHash||'',
    fileIdx:st.fileIdx,
    url:st.url||'',
    size:size,
    seeds:seeds,
    quality:quality,
    codec:codec,
    audio:audio,
    source:source,
    filename:filename,
    /* Keep raw for fallback display */
    _rawName:rawName,
    _rawDesc:rawDesc
  };
}

function fmtStream(s){
  /* Line 1: Name + badges */
  var line1=s.name;
  /* Line 2: Size + Seeds */
  var meta=[];
  if(s.size)  meta.push('📦 '+s.size);
  if(s.seeds) meta.push('🌱 '+s.seeds);
  /* Line 3: filename (truncated) */
  var line3='';
  if(s.filename){
    line3=s.filename.length>55?s.filename.substring(0,52)+'...':s.filename;
  }
  var parts=[line1];
  if(meta.length) parts.push(meta.join('  '));
  if(line3) parts.push(line3);
  return parts.join('\n');
}

/* ================================================================
   TORRENTIO / AIOSTREAMS URL + FETCH
================================================================ */
function cTio(raw){
  if(!raw)return'';
  raw=String(raw).trim();
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);
  if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);
  if(m)return m[1];
  if(raw.indexOf('torrentio.strem.fun')>-1){
    raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'')
           .replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'')
           .replace(/^\/+|\/+$/g,'');
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

function tioU(type,imdb,s,e){
  var t=type==='tv'?'series':'movie';
  var id=imdb;
  if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
  var c=cTio(tioConf());
  var url=TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';
  console.log('[KKTorrent] Torrentio URL:',url);
  return url;
}

function aioU(type,imdb,s,e){
  var base=cAio(aioUrl());
  if(!base)return'';
  var t=type==='tv'?'series':'movie';
  var id=imdb;
  if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
  var url=base+'/stream/'+t+'/'+id+'.json';
  console.log('[KKTorrent] AIOStreams URL:',url);
  return url;
}

async function fStreams(type,imdb,s,e){
  var eng=tEngine();
  var url;
  if(eng==='aio'){
    url=aioU(type,imdb,s,e);
    if(!url)throw new Error('Chưa cấu hình AIOStreams URL');
  }else{
    url=tioU(type,imdb,s,e);
  }
  var r=await fetch(url);
  if(!r.ok)throw new Error((eng==='aio'?'AIOStreams':'Torrentio')+' HTTP '+r.status);
  var d=await r.json();
  console.log('[KKTorrent] Raw response streams count:',(d.streams||[]).length);
  /* Log first 2 streams raw */
  if(d.streams&&d.streams.length){
    console.log('[KKTorrent] First stream raw JSON:',JSON.stringify(d.streams[0]));
    if(d.streams[1])console.log('[KKTorrent] Second stream raw JSON:',JSON.stringify(d.streams[1]));
  }
  return (d.streams||[]).map(pStream);
}

/* ================================================================
   JACKETT
================================================================ */
async function searchJackett(query, cat){
  var base=jackettUrl();
  var key=jackettKey();
  if(!key)throw new Error('Chưa nhập Jackett API Key');
  var url=base+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(key)
         +'&Query='+encodeURIComponent(query)
         +'&Category[]='+( cat||2000);
  console.log('[KKTorrent] Jackett URL:',url);
  var r=await fetch(url);
  if(!r.ok)throw new Error('Jackett HTTP '+r.status);
  var d=await r.json();
  var results=d.Results||[];
  console.log('[KKTorrent] Jackett results:',results.length);
  return results.map(function(item){
    var title  = item.Title||'';
    var size   = bytesToSize(item.Size||0);
    var seeds  = String(item.Seeders||0);
    var tracker= item.Tracker||'Jackett';
    var quality= parseQuality(title);
    var codec  = parseCodec(title);
    var audio  = parseAudio(title);
    var displayName=tracker;
    var badges=[];
    if(quality)badges.push(quality);
    if(codec)  badges.push(codec);
    if(audio)  badges.push(audio);
    if(badges.length)displayName+=' ['+badges.join('|')+']';
    /* Extract infoHash from magnet */
    var magnet=item.MagnetUri||'';
    var infoHash='';
    if(magnet){
      var hm=magnet.match(/urn:btih:([a-fA-F0-9]{40,}|[A-Za-z2-7]{32})/i);
      if(hm)infoHash=hm[1].toLowerCase();
    }
    return{
      name:displayName,
      provider:tracker,
      infoHash:infoHash,
      fileIdx:undefined,
      url:magnet||item.Link||'',
      size:size,
      seeds:seeds,
      quality:quality,
      codec:codec,
      audio:audio,
      source:tracker,
      filename:title,
      _rawName:title,
      _rawDesc:''
    };
  }).filter(function(s){return parseInt(s.seeds)>0&&(s.infoHash||s.url);})
    .sort(function(a,b){return parseInt(b.seeds)-parseInt(a.seeds);});
}

/* ================================================================
   TMDB
================================================================ */
async function tFetch(path){
  var r=await fetch('https://api.themoviedb.org/3'+path,{
    headers:{'Authorization':'Bearer '+TMDB_TOKEN}
  });
  if(!r.ok)throw new Error('TMDB '+r.status);
  return r.json();
}

async function gImdb(type,id){
  if(!id)return null;
  try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}
  catch(e){return null;}
}

async function gSeasons(id){
  try{
    var r=await tFetch('/tv/'+id+'?language=vi-VN');
    if(r&&r.seasons)return r.seasons
      .filter(function(s){return s.season_number>0;})
      .map(function(s){return{
        season_number:s.season_number,
        name:s.name||('Season '+s.season_number),
        episode_count:s.episode_count||0
      };});
  }catch(e){}
  return[];
}

/* ================================================================
   TORRSERVER
================================================================ */
function tsU(p){
  var h=tsHost();if(!h)return'';
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
function bMag(hash){
  return'magnet:?xt=urn:btih:'+hash
    +'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')
    +'&tr='+encodeURIComponent('udp://open.stealth.si:80/announce')
    +'&tr='+encodeURIComponent('udp://tracker.torrent.eu.org:451/announce');
}

async function addToTS(stream,title,poster){
  var link=stream.infoHash?bMag(stream.infoHash):(stream.url||'');
  if(!link)throw new Error('Không có link/hash');
  var u=tsU('/torrents');
  var r=await fetch(u,{
    method:'POST',headers:tsH(),
    body:JSON.stringify({action:'add',link:link,title:title||'',poster:poster||'',save_to_db:false})
  });
  if(!r.ok)throw new Error('TS add: HTTP '+r.status);
  var td=await r.json();
  return td.hash||stream.infoHash;
}

async function getFilesFromTS(hash){
  var u=tsU('/torrents');
  var files=[];
  for(var i=0;i<5;i++){
    await dly(i===0?2000:1500);
    try{
      var r2=await fetch(u,{
        method:'POST',headers:tsH(),
        body:JSON.stringify({action:'get',hash:hash})
      });
      var info=await r2.json();
      if(info&&info.file_stats&&info.file_stats.length){
        files=info.file_stats.filter(function(f){
          return(f.path||'').match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/i);
        }).sort(function(a,b){return(a.id||0)-(b.id||0);});
        if(files.length)break;
      }
    }catch(e){}
  }
  return files;
}

/* Jackett: Add to TS và luôn hiện menu chọn file */
async function playTSJackett(stream,title,poster){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang thêm vào TorrServer...');
  try{
    var hash=await addToTS(stream,title,poster);
    Lampa.Noty.show('Đang tải danh sách file...');
    var files=await getFilesFromTS(hash);
    if(!files.length){
      /* Không lấy được file_stats, play trực tiếp index 0 */
      Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index=0&play')});
      return;
    }
    /* Luôn hiện menu chọn file cho Jackett */
    Lampa.Select.show({
      title:'Chọn file ('+files.length+')',
      items:files.map(function(f){
        var fname=(f.path||'').split('/').pop();
        var fsize=f.length?'('+( f.length>=1073741824?(f.length/1073741824).toFixed(1)+'GB':(f.length/1048576).toFixed(0)+'MB')+')'  :'';
        return{title:fname+' '+fsize, value:f};
      }),
      onSelect:function(a){
        Lampa.Player.play({
          title:title+' - '+((a.value.path||'').split('/').pop()),
          url:tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play')
        });
      },
      onBack:function(){Lampa.Controller.toggle('content');}
    });
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* Torrentio/AIO: play theo fileIdx hoặc chọn nếu nhiều file */
async function playTS(stream,title,poster){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang gửi TorrServer...');
  try{
    var hash=await addToTS(stream,title,poster);
    var files=await getFilesFromTS(hash);
    var playFile=function(url){Lampa.Player.play({title:title,url:url});};
    if(!files.length){
      playFile(tsU('/stream/fname?link='+hash+'&index=0&play'));
    }else if(files.length===1){
      playFile(tsU('/stream/fname?link='+hash+'&index='+files[0].id+'&play'));
    }else if(stream.fileIdx!==undefined&&stream.fileIdx!==null&&stream.fileIdx>=0){
      /* fileIdx từ Torrentio map sang files array */
      var fi=stream.fileIdx;
      var target=files.find(function(f){return f.id===fi;})||files[fi]||files[0];
      playFile(tsU('/stream/fname?link='+hash+'&index='+target.id+'&play'));
    }else{
      Lampa.Select.show({
        title:'Chọn file ('+files.length+')',
        items:files.map(function(f){
          var fname=(f.path||'').split('/').pop();
          var fsize=f.length?'('+(f.length>=1073741824?(f.length/1073741824).toFixed(1)+'GB':(f.length/1048576).toFixed(0)+'MB')+')'  :'';
          return{title:fname+' '+fsize,value:f};
        }),
        onSelect:function(a){
          playFile(tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play'));
        },
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }
  }catch(e){Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));}
}

/* ================================================================
   CSS
================================================================ */
function injectCSS(){
  if($('#kk-torrent-css').length)return;
  $('head').append('<style id="kk-torrent-css">'
    /* Stream list: cho text xuống dòng */
    +'.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;display:block!important;}'
    +'.selectbox .selectbox-item{height:auto!important;max-height:none!important;min-height:56px!important;padding:8px 16px!important;}'
    /* Torrentio button */
    +'.kk-btn--tio{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;border:1px solid rgba(220,38,38,.35)!important;}'
    +'.kk-btn--tio.focus,.kk-btn--tio.selected{background:linear-gradient(135deg,rgba(220,38,38,.35),rgba(220,38,38,.12))!important;border-color:rgba(220,38,38,.7)!important;}'
    /* AIO button */
    +'.kk-btn--aio{background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(124,58,237,.06))!important;border:1px solid rgba(124,58,237,.35)!important;}'
    +'.kk-btn--aio.focus,.kk-btn--aio.selected{background:linear-gradient(135deg,rgba(124,58,237,.35),rgba(124,58,237,.12))!important;border-color:rgba(124,58,237,.7)!important;}'
    /* Jackett button */
    +'.kk-btn--jac{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.06))!important;border:1px solid rgba(16,185,129,.35)!important;}'
    +'.kk-btn--jac.focus,.kk-btn--jac.selected{background:linear-gradient(135deg,rgba(16,185,129,.35),rgba(16,185,129,.12))!important;border-color:rgba(16,185,129,.7)!important;}'
    +'</style>');
}

/* ================================================================
   BUTTON EVENT
================================================================ */
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
}

/* ================================================================
   SHOW STREAMS
================================================================ */
function showStr(streams,title,poster,isJackett){
  if(!streams||!streams.length){Lampa.Noty.show('Không tìm thấy stream nào!');return;}
  /* Sort by seeds */
  streams=streams.slice().sort(function(a,b){return(parseInt(b.seeds)||0)-(parseInt(a.seeds)||0);});
  var ts=!!tsHost();
  var label=isJackett?'Jackett':(tEngine()==='aio'?'AIOStreams':'Torrentio');
  Lampa.Select.show({
    title:label+': '+title+' ('+streams.length+')'+(ts?' → TS':''),
    items:streams.slice(0,60).map(function(s){return{title:fmtStream(s),value:s};}),
    onSelect:function(a){
      var s=a.value;
      if(!ts){
        if(s.url)Lampa.Player.play({title:title,url:s.url});
        else Lampa.Noty.show('Chưa cấu hình TorrServer!');
        return;
      }
      if(isJackett){
        playTSJackett(s,title,poster);
      }else{
        playTS(s,title,poster);
      }
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ================================================================
   MOVIE
================================================================ */
async function oTorMov(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tìm torrent...');
  try{
    var id=imdb||await gImdb('movie',tid);
    if(!id){Lampa.Noty.show('Không tìm thấy IMDB ID');return;}
    var st=await fStreams('movie',id,null,null);
    if(!st.length){Lampa.Noty.show('Không có stream nào');return;}
    showStr(st,title,poster,false);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));console.error('[KKTorrent]',e);}
}

async function oJacMov(tid,title,poster){
  Lampa.Noty.show('Đang tìm Jackett...');
  try{
    var st=await searchJackett(title,2000);
    if(!st.length){Lampa.Noty.show('Jackett: Không tìm thấy');return;}
    showStr(st,title,poster,true);
  }catch(e){Lampa.Noty.show('Lỗi Jackett: '+(e.message||''));console.error('[KKTorrent]',e);}
}

/* ================================================================
   TV / SERIES
================================================================ */
async function oTorTV(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tải seasons...');
  try{
    var id=imdb||await gImdb('tv',tid);
    if(!id){Lampa.Noty.show('Không tìm thấy IMDB ID');return;}
    var sn=await gSeasons(tid);
    if(sn.length>1){
      Lampa.Select.show({
        title:'Chọn Season - '+title,
        items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+' tập)':''),value:s};}),
        onSelect:function(a){pTorEp(a.value,id,title,poster,false);},
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }else if(sn.length===1){
      pTorEp(sn[0],id,title,poster,false);
    }else{
      var st=await fStreams('tv',id,1,1);
      if(st.length)showStr(st,title+' S01E01',poster,false);
      else Lampa.Noty.show('Không tìm thấy stream');
    }
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));console.error('[KKTorrent]',e);}
}

/* Jackett TV: Chỉ search theo tên phim, chọn từ tất cả kết quả */
async function oJacTV(tid,title,poster){
  Lampa.Noty.show('Đang tìm Jackett...');
  try{
    /* Search chỉ tên phim, không kèm S01E01 */
    var st=await searchJackett(title,5000);
    if(!st.length){
      /* Thử category 0 (all) */
      st=await searchJackett(title,0);
    }
    if(!st.length){Lampa.Noty.show('Jackett: Không tìm thấy');return;}
    showStr(st,title,poster,true);
  }catch(e){Lampa.Noty.show('Lỗi Jackett: '+(e.message||''));console.error('[KKTorrent]',e);}
}

function pTorEp(season,imdb,title,poster,isJackett){
  var items=[];
  for(var i=1;i<=(season.episode_count||24);i++){
    items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});
  }
  Lampa.Select.show({
    title:season.name+' - '+title,
    items:items,
    onSelect:async function(a){
      var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);
      Lampa.Noty.show('Đang tìm '+lb+'...');
      try{
        var st=await fStreams('tv',imdb,a.value.s,a.value.e);
        if(!st.length){Lampa.Noty.show('Không có stream');return;}
        showStr(st,lb,poster,false);
      }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

async function playEpTorrent(imdbId,sNum,eNum,title,poster){
  var lb=title+' S'+pd(sNum)+'E'+pd(eNum);
  Lampa.Noty.show('Đang tìm '+lb+'...');
  try{
    var st=await fStreams('tv',imdbId,sNum,eNum);
    if(!st.length){Lampa.Noty.show('Không có stream');return;}
    showStr(st,lb,poster,false);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}

/* ================================================================
   BUILD BUTTONS
   - buildTorrentBtn: Torrentio / AIOStreams (toggle qua settings)
   - buildJackettBtn: Jackett (nút riêng, luôn hiện)
================================================================ */
function buildTorrentBtn(mt,tid,title,poster,imdb){
  var eng=tEngine();
  var label,css;
  if(eng==='aio'){label='AIOStreams';css='kk-btn--aio';}
  else{label='Torrentio';css='kk-btn--tio';}
  if(tsHost())label+=' → TS';

  var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Phát qua '+(eng==='aio'?'AIOStreams':'Torrentio')+'</div>'
    +'</div>');

  var resolvedImdb=imdb||(window._kkphim_detCtx&&window._kkphim_detCtx.imdbId)||null;
  if(mt==='movie'){bE(btn,function(){oTorMov(tid,title,poster,resolvedImdb);});}
  else{bE(btn,function(){oTorTV(tid,title,poster,resolvedImdb);});}
  return $('<div style="width:100%"></div>').append(btn);
}

function buildJackettBtn(mt,tid,title,poster){
  if(!jackettKey())return $(''); /* Ẩn nếu chưa cấu hình API key */
  var label='Jackett';
  if(tsHost())label+=' → TS';
  var btn=$('<div class="kk-src-btn kk-btn--jac selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Tìm kiếm qua Jackett</div>'
    +'</div>');
  if(mt==='movie'){bE(btn,function(){oJacMov(tid,title,poster);});}
  else{bE(btn,function(){oJacTV(tid,title,poster);});}
  return $('<div style="width:100%"></div>').append(btn);
}

/* ================================================================
   SETTINGS
================================================================ */
function buildSettings(w,mg,mo,mi,si2,comp){
  var s={};
  try{s=JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){}

  /* Engine: Torrentio vs AIOStreams */
  var gEng=mg('Torrent Engine (Torrentio/AIOStreams)');
  var eng=s.torrent_engine||'torrentio';
  [{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}].forEach(function(o){
    gEng.append(mo(o.n,'',eng===o.k,function(){
      ss({torrent_engine:o.k});Lampa.Noty.show('Engine: '+o.n);comp.create();
    }));
  });
  w.append(gEng);

  /* Torrentio */
  var gTio=mg('Torrentio Config');
  gTio.append(mi('Torrentio Config URL',
    'Từ torrentio.strem.fun/configure → Copy URL manifest',
    s.torrentio_config||'(chưa cấu hình)',
    'Torrentio Config URL','torrentio_config',s));
  w.append(gTio);

  /* AIOStreams */
  var gAio=mg('AIOStreams URL');
  gAio.append(mi('AIOStreams Base URL',
    'VD: https://aiostreams.yourdomain.com',
    s.aio_url||'(chưa cấu hình)',
    'AIOStreams Base URL','aio_url',s));
  w.append(gAio);

  /* Jackett - nút riêng */
  var gJac=mg('Jackett (nút riêng)');
  gJac.append(mi('Jackett URL',
    'Mặc định: https://jac.maxvol.pro',
    s.jackett_url||'https://jac.maxvol.pro',
    'Jackett URL','jackett_url',s));
  gJac.append(mi('Jackett API Key',
    'API Key từ Jackett → Settings',
    s.jackett_key?'••••':'(chưa nhập)',
    'Jackett API Key','jackett_key',s));
  /* Test Jackett */
  var tjac=si2('Test Jackett','Kiểm tra kết nối Jackett','Thử kết nối');
  bE(tjac,function(){
    if(!jackettKey()){Lampa.Noty.show('Chưa nhập API Key!');return;}
    Lampa.Noty.show('Đang test Jackett...');
    fetch(jackettUrl()+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(jackettKey())+'&Query=test&Category[]=2000')
      .then(function(r){Lampa.Noty.show(r.ok?'✓ Jackett OK!':'Jackett lỗi HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Không kết nối Jackett: '+(e.message||''));});
  });
  gJac.append(tjac);
  w.append(gJac);

  /* TorrServer */
  var gTS=mg('TorrServer');
  gTS.append(mi('TorrServer Host',
    'VD: http://192.168.1.100:8090',
    s.torrserver_host||'(chưa cấu hình)',
    'TorrServer Host','torrserver_host',s));
  gTS.append(mi('TorrServer Password',
    'Để trống nếu không có',
    s.torrserver_password?'••••':'(không có)',
    'TorrServer Password','torrserver_password',s));
  /* Test TS */
  var tts=si2('Test TorrServer','Kiểm tra kết nối TorrServer','Thử kết nối');
  bE(tts,function(){
    if(!tsHost()){Lampa.Noty.show('Chưa nhập host!');return;}
    Lampa.Noty.show('Đang test TorrServer...');
    fetch(tsU('/echo'),{method:'GET',headers:tsH()})
      .then(function(r){Lampa.Noty.show(r.ok?'✓ TorrServer OK!':'Lỗi HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Không kết nối: '+(e.message||''));});
  });
  gTS.append(tts);
  w.append(gTS);
}

/* ================================================================
   EXPOSE API
================================================================ */
window.__kkphim_torrent={
  buildTorrentBtn:  buildTorrentBtn,  /* Torrentio/AIO toggle */
  buildJackettBtn:  buildJackettBtn,  /* Jackett nút riêng */
  buildSettings:    buildSettings,
  playEpTorrent:    playEpTorrent,
  /* Internal */
  oTorMov:oTorMov, oTorTV:oTorTV,
  oJacMov:oJacMov, oJacTV:oJacTV,
  fStreams:fStreams, showStr:showStr,
  tsHost:tsHost, playTS:playTS
};

/* Patch detCtx */
try{
  Lampa.Listener.follow('activity',function(e){
    if(e.type==='start'||e.type==='push'){
      setTimeout(function(){
        try{
          var act=Lampa.Activity&&Lampa.Activity.active&&Lampa.Activity.active();
          if(act&&act.component==='kkphim_tmdb_detail'){
            window._kkphim_detCtx={imdbId:act.imdb_id||null};
          }
        }catch(e2){}
      },500);
    }
  });
}catch(e){}

injectCSS();
console.log('[KKTorrent] v1.3 loaded - Torrentio/AIO + Jackett separate button');

} /* end init() */
})();