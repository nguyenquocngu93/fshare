/* KKPhim Torrent Extension v1.8 - Back to basics */
(function(){
'use strict';
if(window.__kkphim_torrent_started)return;
window.__kkphim_torrent_started=true;

function waitForCore(cb){
  var t=0;
  var iv=setInterval(function(){
    t++;
    if(window.__kkphim_ui_started){clearInterval(iv);cb();}
    if(t>100){clearInterval(iv);}
  },100);
}
waitForCore(init);

function init(){

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
function bytesToSize(b){
  b=Number(b)||0;if(!b)return'';
  if(b>=1099511627776)return(b/1099511627776).toFixed(2)+' TB';
  if(b>=1073741824)return(b/1073741824).toFixed(2)+' GB';
  if(b>=1048576)return(b/1048576).toFixed(0)+' MB';
  return'';
}

/* ---- DEBUG ---- */
var _dbgRaw=[];
var _dbgUrl='';
var _dbgLog=[];
function dbgLog(msg){
  var t=new Date().toISOString().substr(11,8);
  _dbgLog.push('['+t+'] '+msg);
  if(_dbgLog.length>300)_dbgLog.shift();
  console.log('[KKTorrent]',msg);
}

/* ================================================================
   PARSE - Confirmed working từ console log
================================================================ */
function extractSize(name,desc,bh){
  var texts=[desc,name];
  for(var i=0;i<texts.length;i++){
    var t=texts[i]||'';
    var m=t.match(/💾\s*([\d]+(?:[.,][\d]+)?)\s*(TB|GB|GiB|MB|MiB)/i);
    if(m)return m[1].replace(',','.')+' '+m[2].replace(/gib/i,'GB').replace(/mib/i,'MB');
    m=t.match(/[Ss]ize:?\s*([\d]+(?:[.,][\d]+)?)\s*(TB|GB|GiB|MB|MiB)/i);
    if(m)return m[1].replace(',','.')+' '+m[2].replace(/gib/i,'GB').replace(/mib/i,'MB');
    m=t.match(/\b([\d]+(?:[.,][\d]+)?)\s*(TB|GB|GiB|MB|MiB)\b/i);
    if(m)return m[1].replace(',','.')+' '+m[2].replace(/gib/i,'GB').replace(/mib/i,'MB');
  }
  if(bh){var vs=bh.videoSize||bh.VideoSize;if(vs)return bytesToSize(vs);}
  return'';
}
function extractSeeds(name,desc){
  var texts=[desc,name];
  for(var i=0;i<texts.length;i++){
    var t=texts[i]||'';
    var m=t.match(/👤\s*(\d+)/);if(m)return m[1];
    m=t.match(/[Ss]eeds?:?\s*(\d+)/);if(m)return m[1];
    m=t.match(/[Ss]eeders?:?\s*(\d+)/);if(m)return m[1];
  }
  return'';
}
function extractQuality(qualLine,allText){
  var t=(qualLine||'')+' '+(allText||'');
  var m=t.match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  if(!m)return'';
  var q=m[1].toUpperCase();
  if(q==='4K'||q==='UHD'||q==='4K UHD')return'2160P';
  return q;
}
function extractCodec(t){
  var m=(t||'').match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AVC|AV1)\b/i);
  if(!m)return'';
  return m[1].toUpperCase().replace('H.265','HEVC').replace('H265','HEVC').replace('H.264','AVC').replace('H264','AVC');
}
function extractAudio(t){
  var m=(t||'').match(/\b(Atmos|TrueHD|DTS-HD MA|DTS-HD|DTS|DD\+|EAC3|AC3|AAC)\b/i);
  return m?m[1].toUpperCase():'';
}
function extractSource(desc){
  var m=(desc||'').match(/⚙️\s*([^\n\r]+)/);
  return m?m[1].trim():'';
}

function pStream(st){
  var rn=String(st.name||'');
  var rd=String(st.description||'');
  var bh=st.behaviorHints||{};
  var nl=rn.split(/[\n\r]+/);
  var provider=(nl[0]||'').trim().replace(/^\[[^\]]*\]\s*/,'').replace(/\[[^\]]*\]$/,'').trim()||'Stream';
  var qualLine=(nl[1]||'').trim().replace(/^\[[^\]]*\]\s*/,'').trim();
  var allText=rn+' '+rd;
  var size=extractSize(rn,rd,bh);
  var seeds=extractSeeds(rn,rd);
  var qual=extractQuality(qualLine,allText);
  var codec=extractCodec(allText);
  var audio=extractAudio(allText);
  var src=extractSource(rd)||extractSource(rn);
  var fn='';
  var dl=rd.split(/[\n\r]+/);
  for(var i=dl.length-1;i>=0;i--){
    var dli=dl[i].trim();
    if(dli&&/\.(mkv|mp4|avi|ts|m2ts|webm|mov)$/i.test(dli)&&!/👤|💾|⚙️|[Ss]eeds?/i.test(dli)){fn=dli;break;}
  }
  var badges=[];
  if(qual)badges.push(qual);
  if(codec)badges.push(codec);
  if(audio)badges.push(audio);
  if(src&&src!==provider&&src.length<25)badges.push(src);
  var displayName=provider+(badges.length?' ['+badges.join('|')+']':'');
  return{
    name:displayName,provider:provider,
    infoHash:st.infoHash||'',fileIdx:st.fileIdx,
    url:st.url||'',size:size,seeds:seeds,
    quality:qual,codec:codec,audio:audio,source:src,filename:fn
  };
}

/* ================================================================
   STREAM POPUP - HTML overlay với size+seeds hiện rõ
================================================================ */
var _pop={streams:[],title:'',poster:'',isJac:false};

function injectPopupCSS(){
  if($('#kkt-css').length)return;
  $('head').append('<style id="kkt-css">'
    +'#kkt-wrap{position:fixed;inset:0;z-index:99999;background:#0e0e12;display:flex;flex-direction:column;}'
    +'#kkt-hdr{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#15151c;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0;}'
    +'#kkt-hdr button{background:rgba(255,255,255,0.1);border:none;color:#fff;padding:5px 12px;border-radius:16px;cursor:pointer;font-size:0.88em;white-space:nowrap;}'
    +'#kkt-hdr button:active{background:rgba(255,255,255,0.22);}'
    +'#kkt-hdr span{font-size:0.8em;color:rgba(255,255,255,0.55);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    +'#kkt-body{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}'
    +'.kkt-item{padding:11px 14px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;-webkit-tap-highlight-color:rgba(255,255,255,0.08);}'
    +'.kkt-item:active{background:rgba(255,255,255,0.1);}'
    +'.kkt-item.kkt-focus{background:rgba(255,255,255,0.07);}'
    +'.kkt-n{font-size:0.97em;color:#fff;font-weight:500;line-height:1.35;}'
    +'.kkt-m{font-size:0.8em;margin-top:3px;display:flex;gap:10px;}'
    +'.kkt-sz{color:#fbbf24;}'
    +'.kkt-sd{color:#4ade80;}'
    +'.kkt-f{font-size:0.7em;color:rgba(255,255,255,0.35);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    +'</style>');
}

function showStreamPopup(streams,title,poster,isJac){
  if(!streams||!streams.length){Lampa.Noty.show('Không có stream nào!');return;}
  streams=streams.slice().sort(function(a,b){return(parseInt(b.seeds)||0)-(parseInt(a.seeds)||0);});
  _pop.streams=streams;_pop.title=title;_pop.poster=poster;_pop.isJac=isJac;

  injectPopupCSS();
  $('#kkt-wrap').remove();
  $(document).off('keydown.kkt');

  var label=isJac?'Jackett':(tEngine()==='aio'?'AIOStreams':'Torrentio');
  var ts=!!tsHost();

  /* Build item HTML */
  var items=streams.slice(0,60);
  var rows=items.map(function(s,i){
    var meta='';
    if(s.size||s.seeds){
      meta='<div class="kkt-m">'
        +(s.size?'<span class="kkt-sz">📦 '+s.size+'</span>':'')
        +(s.seeds?'<span class="kkt-sd">🌱 '+s.seeds+'</span>':'')
        +'</div>';
    }
    var fn=s.filename?'<div class="kkt-f">'+(s.filename.length>52?s.filename.substr(0,49)+'...':s.filename)+'</div>':'';
    return '<div class="kkt-item" data-i="'+i+'">'
      +'<div class="kkt-n">'+s.name+'</div>'
      +meta+fn
      +'</div>';
  }).join('');

  var wrap=$('<div id="kkt-wrap">'
    +'<div id="kkt-hdr">'
    +'<button id="kkt-back">← Quay lại</button>'
    +'<span>'+label+': '+title+' ('+streams.length+')'+(ts?' → TS':'')+'</span>'
    +'</div>'
    +'<div id="kkt-body">'+rows+'</div>'
    +'</div>');

  $('body').append(wrap);

  $('#kkt-back').on('click touchend',function(e){e.preventDefault();closePop();});

  /* Touch - chống nhạy */
  var ty0=0,tx0=0,moved=false,lastT=0;
  $('#kkt-body')
    .on('touchstart','.kkt-item',function(e){
      var t=e.originalEvent.touches[0];
      ty0=t.clientY;tx0=t.clientX;moved=false;
    })
    .on('touchmove','#kkt-body',function(e){
      /* touchmove trên container để detect scroll */
      if(e.originalEvent.touches[0]){
        if(Math.abs(e.originalEvent.touches[0].clientY-ty0)>10)moved=true;
      }
    })
    .on('touchend','.kkt-item',function(e){
      if(moved)return;
      var now=Date.now();
      if(now-lastT<500)return;
      lastT=now;
      e.preventDefault();
      var i=parseInt($(this).data('i'));
      setTimeout(function(){closePop();onSelect(items[i]);},120);
    })
    .on('click','.kkt-item',function(e){
      var now=Date.now();
      if(now-lastT<500)return;
      lastT=now;
      var i=parseInt($(this).data('i'));
      closePop();
      onSelect(items[i]);
    });

  /* Keyboard */
  var fi=0;
  function setFocus(idx){
    fi=Math.max(0,Math.min(idx,items.length-1));
    $('.kkt-item').removeClass('kkt-focus');
    var el=$('.kkt-item[data-i='+fi+']');
    el.addClass('kkt-focus');
    el[0]&&el[0].scrollIntoView({block:'nearest'});
  }
  $(document).on('keydown.kkt',function(e){
    var k=e.key||e.keyCode;
    if(k==='Escape'||k==='Backspace'||k===8||k===27){e.preventDefault();closePop();return;}
    if(k==='ArrowDown'||k===40){e.preventDefault();setFocus(fi+1);}
    if(k==='ArrowUp'||k===38){e.preventDefault();setFocus(fi-1);}
    if(k==='Enter'||k===13){e.preventDefault();closePop();onSelect(items[fi]);}
  });
  setTimeout(function(){setFocus(0);},80);

  function onSelect(s){
    if(!s)return;
    var ts2=!!tsHost();
    if(!ts2){
      if(s.url)Lampa.Player.play({title:_pop.title,url:s.url});
      else Lampa.Noty.show('Chưa cấu hình TorrServer!');
      return;
    }
    if(_pop.isJac)playTSJac(s,_pop.title,_pop.poster);
    else playTS(s,_pop.title,_pop.poster);
  }
}

function closePop(){
  $('#kkt-wrap').remove();
  $(document).off('keydown.kkt');
  try{Lampa.Controller.toggle('content');}catch(e){}
}

function showStr(streams,title,poster,isJac){
  showStreamPopup(streams,title,poster,!!isJac);
}

/* ================================================================
   TORRSERVER - Giữ nguyên 100% như file gốc
================================================================ */
function tsU(p){
  var h=tsHost();if(!h)return'';
  h=h.replace(/\/+$/,'');
  if(h.indexOf('http')!==0)h='http://'+h;
  return h+p;
}
function tsH(){
  var h={'Content-Type':'application/json'};
  var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);
  return h;
}
function bMag(h){
  var m='magnet:?xt=urn:btih:'+h;
  ['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(t){
    m+='&tr='+encodeURIComponent(t);
  });
  return m;
}

/* ---- playTS: COPY NGUYÊN từ file gốc, chỉ thêm log ---- */
async function playTS(stream,title,poster){
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
    dbgLog('TS add ok hash='+hash);

    await dly(2000);

    /* GET file_stats - retry như file gốc */
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
    dbgLog('TS files='+files.length);

    /* ---- URL format GIỐNG HỆT file gốc ---- */
    var mkUrl=function(id){
      return tsU('/stream/fname?link='+hash+'&index='+id+'&play');
    };

    if(!files.length){
      Lampa.Player.play({title:title,url:mkUrl(0)});
    }else if(files.length===1){
      Lampa.Player.play({title:title,url:mkUrl(files[0].id||0)});
    }else if(stream.fileIdx!==undefined&&stream.fileIdx!==null&&stream.fileIdx>=0){
      var tgt=files[stream.fileIdx]||files[0];
      Lampa.Player.play({title:title,url:mkUrl(tgt.id||stream.fileIdx)});
    }else{
      /* Nhiều file → chọn */
      showFilePicker(files,hash,title,mkUrl);
    }
  }catch(e){
    Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));
    dbgLog('playTS err: '+e.message);
  }
}

/* Jackett: luôn hiện file picker */
async function playTSJac(stream,title,poster){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang thêm vào TorrServer...');
  try{
    var link=stream.infoHash?bMag(stream.infoHash):(stream.url||'');
    if(!link)throw new Error('Không có link');
    var u=tsU('/torrents');
    var r=await fetch(u,{
      method:'POST',headers:tsH(),
      body:JSON.stringify({action:'add',link:link,title:title||'',poster:poster||'',save_to_db:false})
    });
    if(!r.ok)throw new Error('TS:'+r.status);
    var td=await r.json();
    var hash=td.hash||stream.infoHash;
    dbgLog('TS jac hash='+hash);

    Lampa.Noty.show('Đang lấy danh sách file...');
    await dly(2000);
    var info=null,rt=0;
    while(rt<4){
      try{
        var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});
        info=await r2.json();
        if(info&&info.file_stats&&info.file_stats.length)break;
      }catch(e){}
      rt++;await dly(1500);
    }
    var files=[];
    if(info&&info.file_stats){
      files=info.file_stats.filter(function(f){
        return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);
      }).sort(function(a,b){return(a.id||0)-(b.id||0);});
    }

    var mkUrl=function(id){return tsU('/stream/fname?link='+hash+'&index='+id+'&play');};

    if(!files.length){
      Lampa.Player.play({title:title,url:mkUrl(0)});
      return;
    }
    /* Luôn hiện picker cho Jackett */
    showFilePicker(files,hash,title,mkUrl);
  }catch(e){
    Lampa.Noty.show('Lỗi: '+(e.message||''));
    dbgLog('playTSJac err: '+e.message);
  }
}

function showFilePicker(files,hash,title,mkUrl){
  Lampa.Select.show({
    title:'📁 Chọn file ('+files.length+')',
    items:files.map(function(f){
      var nm=(f.path||'').split('/').pop()||('File '+f.id);
      var sz=f.length?'  ('+bytesToSize(f.length)+')':'';
      return{title:nm+sz,value:f};
    }),
    onSelect:function(a){
      var url=mkUrl(a.value.id||0);
      dbgLog('play: '+url);
      Lampa.Player.play({title:title,url:url});
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

/* ================================================================
   URL BUILDERS
================================================================ */
function cTio(raw){
  if(!raw)return'';raw=String(raw).trim();
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];
  if(raw.indexOf('torrentio.strem.fun')>-1){
    raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');
    if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');
    return'';
  }
  raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');
  return raw.indexOf('=')===-1?'':raw;
}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}
function tioU(type,imdb,s,e){
  var t=type==='tv'?'series':'movie';
  var id=imdb+(type==='tv'&&s&&e?':'+s+':'+e:'');
  var c=cTio(tioConf());
  return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';
}
function aioU(type,imdb,s,e){
  var base=cAio(aioUrl());if(!base)return'';
  var t=type==='tv'?'series':'movie';
  var id=imdb+(type==='tv'&&s&&e?':'+s+':'+e:'');
  return base+'/stream/'+t+'/'+id+'.json';
}
async function fStreams(type,imdb,s,e){
  var eng=tEngine(),url;
  if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIOStreams URL');}
  else url=tioU(type,imdb,s,e);
  _dbgUrl=url;dbgLog('Fetch: '+url);
  var r=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!r.ok)throw new Error((eng==='aio'?'AIOStreams':'Torrentio')+' HTTP '+r.status);
  var d=await r.json();
  _dbgRaw=d.streams||[];
  dbgLog('Got '+_dbgRaw.length+' streams');
  return _dbgRaw.map(pStream);
}

/* ================================================================
   JACKETT
================================================================ */
async function searchJackett(query,cat){
  var base=jackettUrl(),key=jackettKey();
  if(!key)throw new Error('Chưa nhập Jackett API Key');
  var url=base+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(key)+'&Query='+encodeURIComponent(query)+'&Category[]='+(cat||0);
  _dbgUrl=url;dbgLog('Jackett: '+url);
  var r=await fetch(url);
  if(!r.ok)throw new Error('Jackett HTTP '+r.status);
  var d=await r.json();
  dbgLog('Jackett results: '+(d.Results||[]).length);
  return(d.Results||[]).map(function(item){
    var t=item.Title||'';
    var size=bytesToSize(item.Size||0);
    var seeds=String(item.Seeders||0);
    var tracker=item.Tracker||'Jackett';
    var qual=extractQuality(t,'');
    var codec=extractCodec(t);
    var audio=extractAudio(t);
    var badges=[];if(qual)badges.push(qual);if(codec)badges.push(codec);if(audio)badges.push(audio);
    var dn=tracker+(badges.length?' ['+badges.join('|')+']':'');
    var magnet=item.MagnetUri||'';
    var hash='';
    if(magnet){var hm=magnet.match(/urn:btih:([a-fA-F0-9]{40,})/i);if(hm)hash=hm[1].toLowerCase();}
    return{name:dn,provider:tracker,infoHash:hash,fileIdx:undefined,url:magnet||item.Link||'',size:size,seeds:seeds,quality:qual,codec:codec,audio:audio,source:tracker,filename:t};
  }).filter(function(s){return parseInt(s.seeds)>0&&(s.infoHash||s.url);})
    .sort(function(a,b){return parseInt(b.seeds)-parseInt(a.seeds);});
}

/* ================================================================
   TMDB
================================================================ */
async function tFetch(path){
  var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN}});
  if(!r.ok)throw new Error('TMDB '+r.status);return r.json();
}
async function gImdb(type,id){
  if(!id)return null;
  try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}
}
async function gSeasons(id){
  try{
    var r=await tFetch('/tv/'+id+'?language=vi-VN');
    if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;})
      .map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});
  }catch(e){}return[];
}

/* ================================================================
   DEBUG MENU
================================================================ */
function showDebugMenu(){
  Lampa.Select.show({
    title:'🔧 KKTorrent Debug v1.8',
    items:[
      {title:'📋 Raw Streams ('+_dbgRaw.length+')',value:'raw'},
      {title:'📡 Last URL',value:'url'},
      {title:'📝 Log ('+_dbgLog.length+')',value:'log'},
      {title:'🗑️ Clear',value:'clear'},
    ],
    onSelect:function(a){
      if(a.value==='raw')showDebugRaw();
      else if(a.value==='url'){Lampa.Select.show({title:'URL',items:[{title:_dbgUrl||'(none)',value:''}],onSelect:function(){},onBack:function(){showDebugMenu();}});}
      else if(a.value==='log')showDebugLog();
      else if(a.value==='clear'){_dbgLog=[];_dbgRaw=[];Lampa.Noty.show('Cleared');}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}
function showDebugRaw(){
  if(!_dbgRaw.length){Lampa.Noty.show('Chưa có data');return;}
  Lampa.Select.show({
    title:'Raw ('+_dbgRaw.length+')',
    items:_dbgRaw.slice(0,15).map(function(st,i){
      var p=pStream(st);
      return{title:'#'+(i+1)+' '+p.name+'\nsize='+p.size+' seeds='+p.seeds,value:i};
    }),
    onSelect:function(a){
      var st=_dbgRaw[a.value];var p=pStream(st);
      Lampa.Select.show({
        title:'#'+(a.value+1),
        items:[
          {title:'name: '+JSON.stringify(st.name||''),value:''},
          {title:'desc: '+JSON.stringify((st.description||'').substr(0,100)),value:''},
          {title:'hash: '+(st.infoHash||'none'),value:''},
          {title:'fileIdx: '+st.fileIdx,value:''},
          {title:'[size]: '+(p.size||'EMPTY'),value:''},
          {title:'[seeds]: '+(p.seeds||'EMPTY'),value:''},
          {title:'[qual]: '+(p.quality||'EMPTY'),value:''},
        ],
        onSelect:function(){},onBack:function(){showDebugRaw();}
      });
    },
    onBack:function(){showDebugMenu();}
  });
}
function showDebugLog(){
  var lines=_dbgLog.slice(-50).reverse();
  Lampa.Select.show({
    title:'Log',
    items:(lines.length?lines:['(trống)']).map(function(l){return{title:l,value:l};}),
    onSelect:function(){},onBack:function(){showDebugMenu();}
  });
}

/* ================================================================
   CSS - Buttons
================================================================ */
function injectCSS(){
  if($('#kk-torrent-css').length)return;
  $('head').append('<style id="kk-torrent-css">'
    +'.selectbox .selectbox-item{height:auto!important;min-height:48px!important;}'
    +'.kk-btn--tio{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;border:1px solid rgba(220,38,38,.4)!important;}'
    +'.kk-btn--tio.focus,.kk-btn--tio.selected{border-color:rgba(220,38,38,.9)!important;background:rgba(220,38,38,.22)!important;}'
    +'.kk-btn--aio{background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(124,58,237,.06))!important;border:1px solid rgba(124,58,237,.4)!important;}'
    +'.kk-btn--aio.focus,.kk-btn--aio.selected{border-color:rgba(124,58,237,.9)!important;background:rgba(124,58,237,.22)!important;}'
    +'.kk-btn--jac{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.06))!important;border:1px solid rgba(16,185,129,.4)!important;}'
    +'.kk-btn--jac.focus,.kk-btn--jac.selected{border-color:rgba(16,185,129,.9)!important;background:rgba(16,185,129,.22)!important;}'
    +'.kk-btn--dbg{background:linear-gradient(135deg,rgba(245,158,11,.18),rgba(245,158,11,.06))!important;border:1px solid rgba(245,158,11,.4)!important;}'
    +'.kk-btn--dbg.focus,.kk-btn--dbg.selected{border-color:rgba(245,158,11,.9)!important;}'
    +'</style>');
}

/* ================================================================
   BUTTON EVENT
================================================================ */
function bE(el,fn){
  var sx=0,sy=0,mv=false,tc=false;
  el.on('touchstart',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}});
  el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10))mv=true;});
  el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},150);setTimeout(function(){tc=false;},500);});
  el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
}

/* ================================================================
   MOVIE / TV
================================================================ */
async function oTorMov(tid,title,poster,imdb){
  Lampa.Noty.show('Đang tìm torrent...');
  try{
    var id=imdb||await gImdb('movie',tid);
    if(!id){Lampa.Noty.show('Không tìm thấy IMDB ID');return;}
    var st=await fStreams('movie',id);
    if(!st.length){Lampa.Noty.show('Không có stream nào');return;}
    showStreamPopup(st,title,poster,false);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));dbgLog('oTorMov: '+e.message);}
}
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
        onSelect:function(a){pTorEp(a.value,id,title,poster);},
        onBack:function(){Lampa.Controller.toggle('content');}
      });
    }else if(sn.length===1){pTorEp(sn[0],id,title,poster);}
    else{
      var st=await fStreams('tv',id,1,1);
      if(st.length)showStreamPopup(st,title+' S01E01',poster,false);
      else Lampa.Noty.show('Không tìm thấy stream');
    }
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}
function pTorEp(season,imdb,title,poster){
  var items=[];
  for(var i=1;i<=(season.episode_count||24);i++){items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});}
  Lampa.Select.show({
    title:season.name+' - '+title,items:items,
    onSelect:async function(a){
      var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);
      Lampa.Noty.show('Đang tìm...');
      try{
        var st=await fStreams('tv',imdb,a.value.s,a.value.e);
        if(!st.length){Lampa.Noty.show('Không có stream');return;}
        showStreamPopup(st,lb,poster,false);
      }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}
async function playEpTorrent(imdbId,sNum,eNum,title,poster){
  var lb=title+' S'+pd(sNum)+'E'+pd(eNum);
  Lampa.Noty.show('Đang tìm...');
  try{
    var st=await fStreams('tv',imdbId,sNum,eNum);
    if(!st.length){Lampa.Noty.show('Không có stream');return;}
    showStreamPopup(st,lb,poster,false);
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}
}
async function oJacMov(tid,title,poster){
  Lampa.Noty.show('Đang tìm Jackett...');
  try{
    var st=await searchJackett(title,2000);
    if(!st.length)st=await searchJackett(title,0);
    if(!st.length){Lampa.Noty.show('Không tìm thấy');return;}
    showStreamPopup(st,title,poster,true);
  }catch(e){Lampa.Noty.show('Lỗi Jackett: '+(e.message||''));}
}
async function oJacTV(tid,title,poster){
  Lampa.Noty.show('Đang tìm Jackett...');
  try{
    var st=await searchJackett(title,5000);
    if(!st.length)st=await searchJackett(title,0);
    if(!st.length){Lampa.Noty.show('Không tìm thấy');return;}
    showStreamPopup(st,title,poster,true);
  }catch(e){Lampa.Noty.show('Lỗi Jackett: '+(e.message||''));}
}

/* ================================================================
   BUILD BUTTONS
================================================================ */
function buildTorrentBtn(mt,tid,title,poster,imdb){
  var eng=tEngine();
  var label=eng==='aio'?'AIOStreams':'Torrentio';
  var css=eng==='aio'?'kk-btn--aio':'kk-btn--tio';
  if(tsHost())label+=' → TS';
  var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Phát qua '+(eng==='aio'?'AIOStreams':'Torrentio')+'</div>'
    +'</div>');
  var rImdb=imdb||(window._kkphim_detCtx&&window._kkphim_detCtx.imdbId)||null;
  if(mt==='movie'){bE(btn,function(){oTorMov(tid,title,poster,rImdb);});}
  else{bE(btn,function(){oTorTV(tid,title,poster,rImdb);});}
  return $('<div style="width:100%"></div>').append(btn);
}

function buildJackettBtn(mt,tid,title,poster){
  var label='Jackett'+(tsHost()?' → TS':'');
  var btn=$('<div class="kk-src-btn kk-btn--jac selector" style="width:100%">'
    +'<div class="kk-sb-main">'+label+'</div>'
    +'<div class="kk-sb-sub">Tìm qua Jackett (jac.maxvol.pro)</div>'
    +'</div>');
  if(mt==='movie'){bE(btn,function(){oJacMov(tid,title,poster);});}
  else{bE(btn,function(){oJacTV(tid,title,poster);});}
  return $('<div style="width:100%"></div>').append(btn);
}

function buildDebugBtn(){
  var btn=$('<div class="kk-src-btn kk-btn--dbg selector" style="width:100%">'
    +'<div class="kk-sb-main">🔧 Debug</div>'
    +'<div class="kk-sb-sub">Raw data / logs</div>'
    +'</div>');
  bE(btn,function(){showDebugMenu();});
  return $('<div style="width:100%"></div>').append(btn);
}

/* ================================================================
   SETTINGS
================================================================ */
function buildSettings(w,mg,mo,mi,si2,comp){
  var s={};try{s=JSON.parse(localStorage.getItem('kkphim_settings'))||{};}catch(e){}

  var gEng=mg('Torrent Engine');
  var eng=s.torrent_engine||'torrentio';
  [{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}].forEach(function(o){
    gEng.append(mo(o.n,'Torrentio và AIOStreams thay thế nhau',eng===o.k,function(){
      ss({torrent_engine:o.k});Lampa.Noty.show('Engine: '+o.n);comp.create();
    }));
  });
  w.append(gEng);

  var gTio=mg('Torrentio');
  gTio.append(mi('Config URL','URL từ torrentio.strem.fun/configure',s.torrentio_config||'(chưa cấu hình)','Torrentio Config URL','torrentio_config',s));
  w.append(gTio);

  var gAio=mg('AIOStreams');
  gAio.append(mi('Base URL','VD: https://aiostreams.yourdomain.com',s.aio_url||'(chưa cấu hình)','AIOStreams Base URL','aio_url',s));
  w.append(gAio);

  var gJac=mg('Jackett (nút riêng)');
  gJac.append(mi('Jackett URL','',s.jackett_url||'https://jac.maxvol.pro','Jackett URL','jackett_url',s));
  gJac.append(mi('Jackett API Key','Từ Jackett → Settings',s.jackett_key?'••••••':'(chưa nhập)','Jackett API Key','jackett_key',s));
  var tj=si2('Test Jackett','','Thử');
  bE(tj,function(){
    if(!jackettKey()){Lampa.Noty.show('Chưa nhập API Key!');return;}
    fetch(jackettUrl()+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(jackettKey())+'&Query=test&Category[]=0')
      .then(function(r){Lampa.Noty.show(r.ok?'✓ Jackett OK!':'HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Lỗi: '+(e.message||''));});
  });
  gJac.append(tj);
  w.append(gJac);

  var gTS=mg('TorrServer');
  gTS.append(mi('Host','VD: http://192.168.1.100:8090',s.torrserver_host||'(chưa cấu hình)','TorrServer Host','torrserver_host',s));
  gTS.append(mi('Password','Để trống nếu không có',s.torrserver_password?'••••••':'(không có)','TorrServer Password','torrserver_password',s));
  var tts=si2('Test TorrServer','','Thử');
  bE(tts,function(){
    if(!tsHost()){Lampa.Noty.show('Chưa nhập host!');return;}
    fetch(tsU('/echo'),{method:'GET',headers:tsH()})
      .then(function(r){Lampa.Noty.show(r.ok?'✓ TorrServer OK!':'HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Lỗi: '+(e.message||''));});
  });
  gTS.append(tts);
  w.append(gTS);

  var gDbg=mg('Debug');
  var dbgBtn=si2('🔧 Debug Menu','','Mở');
  bE(dbgBtn,function(){showDebugMenu();});
  gDbg.append(dbgBtn);
  w.append(gDbg);
}

/* ================================================================
   EXPOSE
================================================================ */
window.__kkphim_torrent={
  buildTorrentBtn:buildTorrentBtn,
  buildJackettBtn:buildJackettBtn,
  buildDebugBtn:  buildDebugBtn,
  buildSettings:  buildSettings,
  playEpTorrent:  playEpTorrent,
  showDebugMenu:  showDebugMenu,
  showStr:        showStr,
  oTorMov:oTorMov,oTorTV:oTorTV,
  oJacMov:oJacMov,oJacTV:oJacTV,
  fStreams:fStreams,tsHost:tsHost,playTS:playTS
};

/* Patch detCtx */
try{
  Lampa.Listener.follow('activity',function(e){
    if(e.type==='start'||e.type==='push'){
      setTimeout(function(){
        try{
          var act=Lampa.Activity&&Lampa.Activity.active&&Lampa.Activity.active();
          if(act&&act.component==='kkphim_tmdb_detail'){window._kkphim_detCtx={imdbId:act.imdb_id||null};}
        }catch(e2){}
      },500);
    }
  });
}catch(e){}

injectCSS();
injectPopupCSS();
dbgLog('v1.8 loaded. Engine='+tEngine()+' TS='+tsHost());
console.log('[KKTorrent] v1.8 loaded');

}/* end init */
})();