/* KKPhim Torrent Extension v1.5 - Final Fix Display */
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
   PARSE - Confirmed working from console log
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
  var t=qualLine+' '+allText;
  var m=t.match(/\b(2160p|4K UHD|4K|UHD|1080p|1080i|720p|480p|360p)\b/i);
  if(!m)return'';
  var q=m[1].toUpperCase();
  if(q==='4K'||q==='UHD'||q==='4K UHD')return'2160P';
  return q;
}

function extractCodec(t){
  var m=(t||'').match(/\b(HEVC|H\.?265|x265|H\.?264|x264|AVC|AV1)\b/i);
  if(!m)return'';
  return m[1].toUpperCase().replace('H.265','HEVC').replace('H265','HEVC')
    .replace('H.264','AVC').replace('H264','AVC');
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
  var providerRaw=(nl[0]||'').trim().replace(/^\[[^\]]*\]\s*/,'').replace(/\[[^\]]*\]$/,'').trim()||'Stream';
  var qualLine=(nl[1]||'').trim().replace(/^\[[^\]]*\]\s*/,'').trim();
  var allText=rn+'\n'+rd;
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
  var displayName=providerRaw;
  var badges=[];
  if(qual)badges.push(qual);
  if(codec)badges.push(codec);
  if(audio)badges.push(audio);
  if(src&&src!==providerRaw&&src.length<25)badges.push(src);
  if(badges.length)displayName+=' ['+badges.join('|')+']';
  dbgLog('PARSED name='+displayName+' size='+size+' seeds='+seeds);
  return{name:displayName,provider:providerRaw,infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:qual,codec:codec,audio:audio,source:src,filename:fn};
}

/* ================================================================
   FORMAT STREAM - CUSTOM HTML RENDER
   Không dùng \n vì Lampa Select KHÔNG render pre-wrap đúng
   Dùng custom render function thay thế
================================================================ */

/* Tạo DOM element cho mỗi stream item */
function makeStreamEl(s, idx){
  var el=$('<div class="kkt-stream-item selector" data-idx="'+idx+'" tabindex="0" style="'
    +'padding:10px 16px;'
    +'border-bottom:1px solid rgba(255,255,255,0.06);'
    +'cursor:pointer;'
    +'min-height:60px;'
    +'display:flex;flex-direction:column;justify-content:center;'
    +'gap:3px;'
    +'"></div>');

  /* Line 1: Name */
  var l1=$('<div style="font-size:1em;font-weight:500;color:#fff;line-height:1.3;">'+s.name+'</div>');
  el.append(l1);

  /* Line 2: Size + Seeds */
  var meta=[];
  if(s.size) meta.push('<span style="color:#f59e0b;">📦 '+s.size+'</span>');
  if(s.seeds)meta.push('<span style="color:#34d399;">🌱 '+s.seeds+'</span>');
  if(meta.length){
    var l2=$('<div style="font-size:0.82em;opacity:0.9;display:flex;gap:14px;margin-top:2px;">'+meta.join('')+'</div>');
    el.append(l2);
  }

  /* Line 3: Filename */
  if(s.filename){
    var fn=s.filename.length>55?s.filename.substr(0,52)+'...':s.filename;
    var l3=$('<div style="font-size:0.75em;opacity:0.5;margin-top:1px;font-family:monospace;">'+fn+'</div>');
    el.append(l3);
  }

  return el;
}

/* ================================================================
   CUSTOM SCROLL POPUP - thay thế Lampa.Select cho stream list
================================================================ */
function showStreamPopup(streams, title, poster, isJackett){
  if(!streams||!streams.length){Lampa.Noty.show('Không tìm thấy stream nào!');return;}

  /* Sort by seeds desc */
  streams=streams.slice().sort(function(a,b){return(parseInt(b.seeds)||0)-(parseInt(a.seeds)||0);});

  var ts=!!tsHost();
  var label=isJackett?'Jackett':(tEngine()==='aio'?'AIOStreams':'Torrentio');
  var headerText=label+': '+title+' ('+streams.length+')'+(ts?' → TS':'');

  /* Overlay */
  var overlay=$('<div id="kkt-popup-overlay" style="'
    +'position:fixed;inset:0;z-index:9999;'
    +'background:rgba(0,0,0,0.85);'
    +'display:flex;flex-direction:column;'
    +'"></div>');

  /* Header */
  var header=$('<div style="'
    +'padding:14px 16px 10px;'
    +'font-size:1em;font-weight:600;color:#fff;'
    +'background:rgba(30,30,40,0.98);'
    +'border-bottom:1px solid rgba(255,255,255,0.1);'
    +'flex-shrink:0;'
    +'display:flex;align-items:center;gap:10px;'
    +'"></div>');

  /* Back button */
  var backBtn=$('<div style="'
    +'width:32px;height:32px;border-radius:50%;'
    +'background:rgba(255,255,255,0.1);'
    +'display:flex;align-items:center;justify-content:center;'
    +'cursor:pointer;flex-shrink:0;font-size:1.1em;'
    +'">←</div>');
  header.append(backBtn);
  header.append($('<span>'+headerText+'</span>'));
  overlay.append(header);

  /* Scroll list */
  var list=$('<div style="'
    +'flex:1;overflow-y:auto;overflow-x:hidden;'
    +'background:rgba(20,20,30,0.98);'
    +'"></div>');

  var selectedIdx=0;
  var items=streams.slice(0,60);

  items.forEach(function(s,idx){
    var el=makeStreamEl(s,idx);

    /* Focus style */
    el.on('mouseenter focus',function(){
      $('.kkt-stream-item').css('background','');
      el.css('background','rgba(255,255,255,0.08)');
      selectedIdx=idx;
    });
    el.on('mouseleave blur',function(){el.css('background','');});

    /* Click / touch */
    function onSelect(){
      closePopup();
      handleStreamSelect(s,title,poster,isJackett);
    }
    el.on('click',function(e){e.stopPropagation();onSelect();});
    el.on('touchend',function(e){e.preventDefault();e.stopPropagation();onSelect();});

    list.append(el);
  });
  overlay.append(list);

  /* Close on back */
  function closePopup(){
    overlay.remove();
    $(document).off('keydown.kktpopup');
    try{Lampa.Controller.toggle('content');}catch(e){}
  }

  backBtn.on('click',closePopup);
  overlay.on('click',function(e){if($(e.target).is(overlay))closePopup();});

  /* Keyboard nav */
  $(document).on('keydown.kktpopup',function(e){
    if(e.key==='Escape'||e.key==='Backspace'){closePopup();return;}
    if(e.key==='ArrowDown'){
      selectedIdx=Math.min(selectedIdx+1,items.length-1);
      $('.kkt-stream-item').css('background','');
      var target=$('.kkt-stream-item[data-idx='+selectedIdx+']');
      target.css('background','rgba(255,255,255,0.08)');
      target[0]&&target[0].scrollIntoView({block:'nearest'});
    }
    if(e.key==='ArrowUp'){
      selectedIdx=Math.max(selectedIdx-1,0);
      $('.kkt-stream-item').css('background','');
      var target2=$('.kkt-stream-item[data-idx='+selectedIdx+']');
      target2.css('background','rgba(255,255,255,0.08)');
      target2[0]&&target2[0].scrollIntoView({block:'nearest'});
    }
    if(e.key==='Enter'||e.key===' '){
      closePopup();
      handleStreamSelect(items[selectedIdx],title,poster,isJackett);
    }
  });

  $('body').append(overlay);
  /* Focus first item */
  setTimeout(function(){
    var first=$('.kkt-stream-item[data-idx=0]');
    if(first.length){first.css('background','rgba(255,255,255,0.08)');first[0].scrollIntoView({block:'start'});}
  },50);
}

function handleStreamSelect(s,title,poster,isJackett){
  var ts=!!tsHost();
  if(!ts){
    if(s.url)Lampa.Player.play({title:title,url:s.url});
    else Lampa.Noty.show('Chưa cấu hình TorrServer!');
    return;
  }
  if(isJackett){playTSWithFilePicker(s,title,poster,true);}
  else{playTS(s,title,poster);}
}

/* Legacy wrapper - dùng showStreamPopup thay showStr */
function showStr(streams,title,poster,isJackett){
  showStreamPopup(streams,title,poster,isJackett||false);
}

/* ================================================================
   DEBUG MENU
================================================================ */
function showDebugMenu(){
  Lampa.Select.show({
    title:'🔧 KKTorrent Debug v1.5',
    items:[
      {title:'📋 Raw Streams ('+_dbgRaw.length+')\nBấm TIO/AIO trước',value:'raw'},
      {title:'📡 Last URL\n'+(_dbgUrl||'(chưa có)').substr(0,60),value:'url'},
      {title:'📝 Log ('+_dbgLog.length+' dòng)',value:'log'},
      {title:'🧪 Test Parse',value:'test'},
      {title:'🗑️ Clear',value:'clear'},
    ],
    onSelect:function(a){
      if(a.value==='raw')showDebugRaw();
      else if(a.value==='url'){Lampa.Noty.show(_dbgUrl||'(chưa có URL)');}
      else if(a.value==='log')showDebugLog();
      else if(a.value==='test')showDebugTest();
      else if(a.value==='clear'){_dbgLog=[];_dbgRaw=[];Lampa.Noty.show('Cleared');}
    },
    onBack:function(){Lampa.Controller.toggle('content');}
  });
}

function showDebugRaw(){
  if(!_dbgRaw.length){Lampa.Noty.show('Chưa có data');return;}
  Lampa.Select.show({
    title:'Raw Streams',
    items:_dbgRaw.slice(0,20).map(function(st,i){
      var p=pStream(st);
      return{
        title:'#'+(i+1)+' '+JSON.stringify((st.name||'').substr(0,35))
             +'\nsize='+p.size+' seeds='+p.seeds+' qual='+p.quality,
        value:i
      };
    }),
    onSelect:function(a){
      var st=_dbgRaw[a.value];
      Lampa.Select.show({
        title:'Stream #'+(a.value+1),
        items:[
          {title:'name: '+JSON.stringify(st.name||''),value:''},
          {title:'desc: '+JSON.stringify((st.description||'').substr(0,100)),value:''},
          {title:'hash: '+(st.infoHash||'(none)'),value:''},
          {title:'url: '+((st.url||'').substr(0,60)),value:''},
          {title:'fileIdx: '+st.fileIdx,value:''},
          {title:'bh.videoSize: '+((st.behaviorHints||{}).videoSize||'(none)'),value:''},
          {title:'--- PARSED ---',value:''},
          {title:'size: '+pStream(st).size,value:''},
          {title:'seeds: '+pStream(st).seeds,value:''},
          {title:'quality: '+pStream(st).quality,value:''},
          {title:'source: '+pStream(st).source,value:''},
        ],
        onSelect:function(){},
        onBack:function(){showDebugRaw();}
      });
    },
    onBack:function(){showDebugMenu();}
  });
}

function showDebugLog(){
  var lines=_dbgLog.slice(-40).reverse();
  Lampa.Select.show({
    title:'Log ('+lines.length+')',
    items:lines.map(function(l){return{title:l,value:l};})||[{title:'(trống)',value:''}],
    onSelect:function(){},
    onBack:function(){showDebugMenu();}
  });
}

function showDebugTest(){
  var cases=[
    {name:'Torrentio\n1080p',description:'👤 42 💾 1.74 GB ⚙️ YTS\nMovie.mkv'},
    {name:'AIOStreams\n[Prowlarr|RD] 1080p',description:'👤 1080 💾 17.9 GB ⚙️ 1337x\nFilename.mkv'},
    {name:'AIOStreams\n2160p',description:'Size: 56.4 GB\nSeeds: 15\nMovie.2160p.mkv'},
  ];
  Lampa.Select.show({
    title:'Test Parse',
    items:cases.map(function(st,i){
      var p=pStream(st);
      return{title:'Case '+(i+1)+'\nsize='+p.size+' seeds='+p.seeds+' qual='+p.quality,value:i};
    }),
    onSelect:function(){},
    onBack:function(){showDebugMenu();}
  });
}

/* ================================================================
   URL BUILDERS
================================================================ */
function cTio(raw){
  if(!raw)return'';
  raw=String(raw).trim();
  var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];
  m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];
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
  var eng=tEngine();
  var url;
  if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIOStreams URL');}
  else{url=tioU(type,imdb,s,e);}
  _dbgUrl=url;
  dbgLog('Fetch: '+url);
  var r=await fetch(url);
  if(!r.ok)throw new Error((eng==='aio'?'AIOStreams':'Torrentio')+' HTTP '+r.status);
  var d=await r.json();
  _dbgRaw=d.streams||[];
  dbgLog('Got '+_dbgRaw.length+' streams');
  _dbgRaw.slice(0,3).forEach(function(st,i){
    dbgLog('RAW name='+JSON.stringify(st.name||''));
    dbgLog('RAW desc='+JSON.stringify(st.description||''));
  });
  return _dbgRaw.map(pStream);
}

/* ================================================================
   JACKETT
================================================================ */
async function searchJackett(query,cat){
  var base=jackettUrl(),key=jackettKey();
  if(!key)throw new Error('Chưa nhập Jackett API Key');
  var url=base+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(key)
         +'&Query='+encodeURIComponent(query)+'&Category[]='+(cat||0);
  _dbgUrl=url;
  dbgLog('Jackett: '+url);
  var r=await fetch(url);
  if(!r.ok)throw new Error('Jackett HTTP '+r.status);
  var d=await r.json();
  dbgLog('Jackett results: '+(d.Results||[]).length);
  return(d.Results||[]).map(function(item){
    var title=item.Title||'';
    var size=bytesToSize(item.Size||0);
    var seeds=String(item.Seeders||0);
    var tracker=item.Tracker||'Jackett';
    var qual=extractQuality(title,'');
    var codec=extractCodec(title);
    var audio=extractAudio(title);
    var badges=[];
    if(qual)badges.push(qual);if(codec)badges.push(codec);if(audio)badges.push(audio);
    var dn=tracker+(badges.length?' ['+badges.join('|')+']':'');
    var magnet=item.MagnetUri||'';
    var hash='';
    if(magnet){var hm=magnet.match(/urn:btih:([a-fA-F0-9]{40,})/i);if(hm)hash=hm[1].toLowerCase();}
    return{name:dn,provider:tracker,infoHash:hash,fileIdx:undefined,url:magnet||item.Link||'',
      size:size,seeds:seeds,quality:qual,codec:codec,audio:audio,source:tracker,filename:title};
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
   TORRSERVER
================================================================ */
function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(hash){return'magnet:?xt=urn:btih:'+hash+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce')+'&tr='+encodeURIComponent('udp://open.stealth.si:80/announce');}

async function addToTS(stream,title,poster){
  var link=stream.infoHash?bMag(stream.infoHash):(stream.url||'');
  if(!link)throw new Error('Không có link/hash');
  var r=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:link,title:title||'',poster:poster||'',save_to_db:false})});
  if(!r.ok)throw new Error('TS add HTTP '+r.status);
  var td=await r.json();return td.hash||stream.infoHash;
}

async function getFilesFromTS(hash){
  for(var i=0;i<5;i++){
    await dly(i===0?2500:1500);
    try{
      var r=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});
      var info=await r.json();
      if(info&&info.file_stats&&info.file_stats.length){
        var files=info.file_stats.filter(function(f){return/\.(mp4|mkv|avi|ts|m2ts|webm|mov)$/i.test(f.path||'');}).sort(function(a,b){return(a.id||0)-(b.id||0);});
        if(files.length)return files;
      }
    }catch(e){}
  }return[];
}

function showFilePicker(files,hash,title,onClose){
  Lampa.Select.show({
    title:'📁 Chọn file ('+files.length+')',
    items:files.map(function(f){
      var nm=(f.path||'').split('/').pop();
      var sz=f.length?'('+bytesToSize(f.length)+')':'';
      return{title:nm+'\n'+sz,value:f};
    }),
    onSelect:function(a){Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+a.value.id+'&play')});},
    onBack:onClose||function(){Lampa.Controller.toggle('content');}
  });
}

async function playTSWithFilePicker(stream,title,poster,alwaysPick){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang thêm vào TorrServer...');
  try{
    var hash=await addToTS(stream,title,poster);
    Lampa.Noty.show('Đang lấy danh sách file...');
    var files=await getFilesFromTS(hash);
    if(!files.length){Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index=0&play')});return;}
    if(alwaysPick||files.length>1){showFilePicker(files,hash,title);}
    else{Lampa.Player.play({title:title,url:tsU('/stream/fname?link='+hash+'&index='+files[0].id+'&play')});}
  }catch(e){Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));}
}

async function playTS(stream,title,poster){
  if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TorrServer!');return;}
  Lampa.Noty.show('Đang gửi TorrServer...');
  try{
    var hash=await addToTS(stream,title,poster);
    var files=await getFilesFromTS(hash);
    var playF=function(url){Lampa.Player.play({title:title,url:url});};
    if(!files.length){playF(tsU('/stream/fname?link='+hash+'&index=0&play'));return;}
    if(files.length===1){playF(tsU('/stream/fname?link='+hash+'&index='+files[0].id+'&play'));return;}
    if(stream.fileIdx!==undefined&&stream.fileIdx!==null&&stream.fileIdx>=0){
      var fi=stream.fileIdx;
      var tgt=files.find(function(f){return f.id===fi;})||files[fi]||files[0];
      playF(tsU('/stream/fname?link='+hash+'&index='+tgt.id+'&play'));return;
    }
    showFilePicker(files,hash,title);
  }catch(e){Lampa.Noty.show('Lỗi TorrServer: '+(e.message||''));}
}

/* ================================================================
   CSS
================================================================ */
function injectCSS(){
  if($('#kk-torrent-css').length)return;
  $('head').append('<style id="kk-torrent-css">'
    /* Stream popup */
    +'#kkt-popup-overlay{-webkit-overflow-scrolling:touch;}'
    +'.kkt-stream-item:focus{outline:none;}'
    /* Lampa Select override cho file picker */
    +'.selectbox .selectbox-item__title{white-space:pre-wrap!important;overflow:visible!important;text-overflow:unset!important;display:block!important;}'
    +'.selectbox .selectbox-item{height:auto!important;max-height:none!important;min-height:52px!important;}'
    /* Buttons */
    +'.kk-btn--tio{background:linear-gradient(135deg,rgba(220,38,38,.18),rgba(220,38,38,.06))!important;border:1px solid rgba(220,38,38,.4)!important;}'
    +'.kk-btn--tio.focus,.kk-btn--tio.selected{border-color:rgba(220,38,38,.9)!important;background:rgba(220,38,38,.25)!important;}'
    +'.kk-btn--aio{background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(124,58,237,.06))!important;border:1px solid rgba(124,58,237,.4)!important;}'
    +'.kk-btn--aio.focus,.kk-btn--aio.selected{border-color:rgba(124,58,237,.9)!important;background:rgba(124,58,237,.25)!important;}'
    +'.kk-btn--jac{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(16,185,129,.06))!important;border:1px solid rgba(16,185,129,.4)!important;}'
    +'.kk-btn--jac.focus,.kk-btn--jac.selected{border-color:rgba(16,185,129,.9)!important;background:rgba(16,185,129,.25)!important;}'
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
  el.on('touchmove',function(e){var t=((e.originalEvent||e).touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;});
  el.on('touchend',function(e){if(mv)return;tc=true;e.preventDefault();e.stopPropagation();setTimeout(function(){fn.call(el[0],e);},100);setTimeout(function(){tc=false;},350);});
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
  }catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));dbgLog('err: '+e.message);}
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
  for(var i=1;i<=(season.episode_count||24);i++){
    items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});
  }
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
    +'<div class="kk-sb-sub">Xem raw stream data</div>'
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
    gEng.append(mo(o.n,'Torrentio/AIO thay thế nhau',eng===o.k,function(){ss({torrent_engine:o.k});Lampa.Noty.show('Engine: '+o.n);comp.create();}));
  });
  w.append(gEng);

  var gTio=mg('Torrentio Config');
  gTio.append(mi('Config URL','Từ torrentio.strem.fun/configure',s.torrentio_config||'(chưa cấu hình)','Torrentio Config URL','torrentio_config',s));
  w.append(gTio);

  var gAio=mg('AIOStreams');
  gAio.append(mi('Base URL','VD: https://aiostreams.yourdomain.com',s.aio_url||'(chưa cấu hình)','AIOStreams Base URL','aio_url',s));
  w.append(gAio);

  var gJac=mg('Jackett (nút riêng)');
  gJac.append(mi('Jackett URL','Mặc định: https://jac.maxvol.pro',s.jackett_url||'https://jac.maxvol.pro','Jackett URL','jackett_url',s));
  gJac.append(mi('Jackett API Key','Lấy từ Jackett → Settings',s.jackett_key?'••••••':'(chưa nhập)','Jackett API Key','jackett_key',s));
  var tj=si2('Test Jackett','Kiểm tra kết nối','Thử');
  bE(tj,function(){
    if(!jackettKey()){Lampa.Noty.show('Chưa nhập API Key!');return;}
    Lampa.Noty.show('Đang test...');
    fetch(jackettUrl()+'/api/v2.0/indexers/all/results?apikey='+encodeURIComponent(jackettKey())+'&Query=test&Category[]=0')
      .then(function(r){Lampa.Noty.show(r.ok?'✓ Jackett OK!':'Jackett HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Lỗi: '+(e.message||''));});
  });
  gJac.append(tj);
  w.append(gJac);

  var gTS=mg('TorrServer');
  gTS.append(mi('Host','VD: http://192.168.1.100:8090',s.torrserver_host||'(chưa cấu hình)','TorrServer Host','torrserver_host',s));
  gTS.append(mi('Password','Để trống nếu không có',s.torrserver_password?'••••••':'(không có)','TorrServer Password','torrserver_password',s));
  var tts=si2('Test TorrServer','Kiểm tra kết nối','Thử');
  bE(tts,function(){
    if(!tsHost()){Lampa.Noty.show('Chưa nhập host!');return;}
    Lampa.Noty.show('Đang test...');
    fetch(tsU('/echo'),{method:'GET',headers:tsH()})
      .then(function(r){Lampa.Noty.show(r.ok?'✓ TorrServer OK!':'Lỗi HTTP '+r.status);})
      .catch(function(e){Lampa.Noty.show('Lỗi: '+(e.message||''));});
  });
  gTS.append(tts);
  w.append(gTS);

  var gDbg=mg('Debug');
  var dbgBtn=si2('🔧 Debug Menu','Xem raw stream data / logs','Mở');
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
dbgLog('v1.5 loaded. Engine='+tEngine()+' TS='+tsHost());
console.log('[KKTorrent] v1.5 loaded');

}/* end init */
})();