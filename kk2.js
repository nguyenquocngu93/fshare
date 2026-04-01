/* KKPhim Plugin v4.3 - Performance + TS Features + 120Hz Mobile Fix */
(function(){
'use strict';
if(window.__kkphim_plugin_started)return;
window.__kkphim_plugin_started=true;

// ═══ Mobile Detection Helpers ═══
function isMobile(){
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent||'');
}
function isHighRefresh(){
    if(window.matchMedia){
        return window.matchMedia('(min-resolution: 120dpi), (min-resolution: 1.25dppx), (update: fast)').matches;
    }
    return false;
}

var SOURCES={
    kkphim:{key:'kkphim',name:'KKPhim',api:'https://phimapi.com/',img:'https://phimimg.com/'},
    ophim:{key:'ophim',name:'OPhim',api:'https://ophim1.com/',img:'https://img.ophim.live/uploads/movies/'}
};
var TMDB_TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2OTc5YzhlYzEwMWVkODQ5ZjQ0ZDE5N2M4NjU4MjY0NCIsIm5iZiI6MTcwMzc4NzYwMi4wNjA5OTk5LCJzdWIiOiI2NThkYmM1MmYyY2YyNTc5YjI0Y2MwM2IiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.T8DjYYtgce168bXmm1exuat1K_4DOlq6QtB53IhzVJ0';
var TMDB_IMG='https://image.tmdb.org/t/p/original';
var TMDB_W500='https://image.tmdb.org/t/p/w500';
var TMDB_W300='https://image.tmdb.org/t/p/w300';
var TIO_BASE='https://torrentio.strem.fun';
var STG_KEY='kkphim_settings';
var CSS_URL='https://nguyenquocngu93.github.io/fshare/style.css';
var _gc={movie:null,tv:null};
var CW_KEY='kkphim_continue_watching';
var HIST_KEY='kkphim_history';
var PROG_KEY='kkphim_progress';
var _currentPlayingUrl=null;
var _currentPlayingCWId=null;
var _progressInterval=null;
var _lastProgressSave=0;

// ═══ Performance: RAF-based utilities ═══
var _rafQueue=[];var _rafRunning=false;
function rafBatch(fn){
    if(isMobile()){
        requestAnimationFrame(function(){try{fn();}catch(e){}});
        return;
    }
    _rafQueue.push(fn);
    if(!_rafRunning){
        _rafRunning=true;
        requestAnimationFrame(function flush(){
            var q=_rafQueue.splice(0);
            for(var i=0;i<q.length;i++)try{q[i]();}catch(e){}
            if(_rafQueue.length)requestAnimationFrame(flush);
            else _rafRunning=false;
        });
    }
}
function throttle(fn,d){var l=0;return function(){var n=Date.now();if(n-l>=d){l=n;fn.apply(this,arguments);}};}
function batchAppend(p,els){
    var f=document.createDocumentFragment();
    for(var i=0;i<els.length;i++){
        var e=els[i];
        var node=e instanceof $?e[0]:e;
        if(node.parentNode&&node.parentNode!==f){
            try{node.parentNode.removeChild(node);}catch(ex){}
        }
        f.appendChild(node);
    }
    (p instanceof $?p[0]:p).appendChild(f);
}

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
function imgQuality(){return ls().img_quality||'medium';}

function getCW(){try{return JSON.parse(localStorage.getItem(CW_KEY))||[];}catch(e){return[];}}
function setCW(v){try{localStorage.setItem(CW_KEY,JSON.stringify(v||[]));}catch(e){}}
function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY))||[];}catch(e){return[];}}
function setHist(v){try{localStorage.setItem(HIST_KEY,JSON.stringify(v||[]));}catch(e){}}
function getProgress(){try{return JSON.parse(localStorage.getItem(PROG_KEY))||{};}catch(e){return{};}}
function setProgress(obj){try{localStorage.setItem(PROG_KEY,JSON.stringify(obj));}catch(e){}}
function normalizeUrl(url){if(!url)return'';try{return url.trim().replace(/[?#].*$/,'').replace(/\/+$/,'');}catch(e){return url.trim();}}
function progressKey(url,cwId){if(cwId){try{return'cw_'+btoa(unescape(encodeURIComponent(cwId))).replace(/[^a-zA-Z0-9]/g,'').substring(0,40);}catch(e){return'cw_'+cwId.substring(0,40);}}if(!url)return'';var n=normalizeUrl(url);try{return btoa(unescape(encodeURIComponent(n))).replace(/[^a-zA-Z0-9]/g,'').substring(0,40);}catch(e){return n.substring(n.length-40);}}
function saveProgress(url,ct,dur,cwId){if(!url||!ct||!dur||ct<5||dur<10)return;var p=getProgress();var k=progressKey(url,cwId);p[k]={url:url,cwId:cwId||'',time:Math.floor(ct),duration:Math.floor(dur),percent:Math.min(99,Math.floor((ct/dur)*100)),updated:Date.now()};var ks=Object.keys(p);if(ks.length>200){ks.sort(function(a,b){return(p[a].updated||0)-(p[b].updated||0);});for(var i=0;i<ks.length-200;i++)delete p[ks[i]];}setProgress(p);}
function getProgressFor(url,cwId){if(!url&&!cwId)return null;var p=getProgress();var k=cwId?progressKey(url,cwId):progressKey(url);var r=p[k];if(!r&&cwId)r=p[progressKey(url)];if(!r)return null;if(Date.now()-r.updated>30*86400000){delete p[k];setProgress(p);return null;}return r;}
function clearProgressFor(url,cwId){if(!url&&!cwId)return;var p=getProgress();delete p[progressKey(url,cwId)];if(cwId)delete p[progressKey(url)];setProgress(p);}
function formatTime(s){if(!s||isNaN(s))return'0:00';s=Math.floor(s);var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),s2=s%60;if(h>0)return h+':'+pd(m)+':'+pd(s2);return m+':'+pd(s2);}
function startProgressTracking(url,cwId){stopProgressTracking();_currentPlayingUrl=url;_currentPlayingCWId=cwId||null;_lastProgressSave=0;_progressInterval=setInterval(function(){try{var v=document.querySelector('video');if(v&&v.currentTime>0&&v.duration>10){var n=Date.now();if(n-_lastProgressSave>=4500){_lastProgressSave=n;saveProgress(_currentPlayingUrl,v.currentTime,v.duration,_currentPlayingCWId);updateCWProgress(_currentPlayingCWId,v.currentTime,v.duration);}}}catch(e){}},5000);}
function stopProgressTracking(){if(_progressInterval){clearInterval(_progressInterval);_progressInterval=null;}try{var v=document.querySelector('video');if(v&&_currentPlayingUrl&&v.currentTime>0&&v.duration>10){saveProgress(_currentPlayingUrl,v.currentTime,v.duration,_currentPlayingCWId);updateCWProgress(_currentPlayingCWId,v.currentTime,v.duration);}}catch(e){}_currentPlayingUrl=null;_currentPlayingCWId=null;}
function updateCWProgress(cwId,ct,dur){if(!cwId||!dur||dur<10)return;try{var a=getCW();var ch=false;for(var i=0;i<a.length;i++){if(a[i].id===cwId){a[i].progress_time=Math.floor(ct);a[i].progress_duration=Math.floor(dur);a[i].progress_percent=Math.min(99,Math.floor((ct/dur)*100));ch=true;break;}}if(ch)setCW(a);}catch(e){}}
function initPlayerHook(){Lampa.Listener.follow('player',function(e){if(e.type==='destroy'||e.type==='stop')stopProgressTracking();});}
function resumeVideo(t){if(!t||t<5)return;var a=0;var iv=setInterval(function(){a++;try{var v=document.querySelector('video');if(v&&v.readyState>=2&&v.duration>10){v.currentTime=t;clearInterval(iv);Lampa.Noty.show('▶ '+formatTime(t));}}catch(e){}if(a>40)clearInterval(iv);},500);}
function applyFontScale(){var id='kkphim-font-scale';$('#'+id).remove();var fs=fontScale();if(!fs||fs===100)return;$('head').append('<style id="'+id+'">.kk-topbar,.kk-row,.kk-grid-wrap,.kk-detail-wrap,.kk-stg-wrap,.kk-person-header,.kk-actions,.kk-section,.kk-card,.kk-card-h,.kk-pfc{font-size:'+fs+'%!important;}</style>');}
function optimizeImgUrl(url){if(!url)return'';var q=imgQuality();if(url.indexOf('image.tmdb.org')>-1){if(q==='low')return url.replace('/original','/w300').replace('/w500','/w300');if(q==='medium')return url.replace('/original','/w500');}return url;}
function saveHistory(item){try{var n=nm(item);if(!n)return;var a=getHist();var id=(srcKey()||'')+'_'+(n.slug||'')+'_'+((n.tmdb&&n.tmdb.id)||'');a=a.filter(function(x){return x.id!==id;});a.unshift({id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',poster_url:n.poster_url||'',thumb_url:n.thumb_url||'',year:n.year||'',quality:n.quality||'',episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',time:Date.now()});if(a.length>50)a=a.slice(0,50);setHist(a);}catch(e){}}
function saveContinue(item,ep,link,pu,bu){try{var n=nm(item);if(!n)return;var a=getCW();var nk=nStr(n.name||n.origin_name||'');var id=nk+'_'+(ep||'movie');a=a.filter(function(x){return x.id!==id;});var fp=pu||bu||n.poster_url||'';var ft=bu||pu||n.thumb_url||'';var pg=getProgressFor(link,id);a.unshift({id:id,source:srcKey(),slug:n.slug||'',name:n.name||'',origin_name:n.origin_name||'',poster_url:fp,thumb_url:ft,year:n.year||'',quality:n.quality||'',episode_current:n.episode_current||'',tmdb:n.tmdb||{},category:n.category||[],type:n.type||'',ep_name:ep||'',ep_link:link||'',progress_time:pg?pg.time:0,progress_duration:pg?pg.duration:0,progress_percent:pg?pg.percent:0,time:Date.now()});if(a.length>40)a=a.slice(0,40);setCW(a);}catch(e){}}

function fImg(u){if(!u)return'';if(u.indexOf('http')===0)return u;var b=sImg();return b?b+u:u;}
function dly(ms){return new Promise(function(r){setTimeout(r,ms);});}
function pd(n){return(n<10?'0':'')+n;}
function E(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cDesc(s){return String(s||'').replace(/<[^>]+>/g,'').trim()||'';}
function fTxt(s){return E(s||'').replace(/\n/g,'<br>');}
function nStr(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}
function nm(i){if(!i)return null;return{name:i.name||i.title||'',origin_name:i.origin_name||'',slug:i.slug||'',poster_url:i.poster_url||i.poster||'',thumb_url:i.thumb_url||i.thumb||'',year:i.year||'',quality:i.quality||'',episode_current:i.episode_current||'',tmdb:i.tmdb||{},category:Array.isArray(i.category)?i.category:[],director:i.director||'',content:i.content||'',time:i.time||'',episode_total:i.episode_total||'',type:i.type||'',country:i.country||[]};}
function dType(d){if(d&&d.tmdb&&d.tmdb.type==='tv')return'tv';if(d&&d.tmdb&&d.tmdb.type==='movie')return'movie';if(d&&(d.type==='series'||d.type==='tvshows'||d.type==='hoathinh'))return'tv';if(d&&d.episode_total&&d.episode_total!=='1')return'tv';return'movie';}
function gTid(d){return(d&&d.tmdb&&d.tmdb.id)?d.tmdb.id:null;}
function gEp1(eps){for(var i=0;i<(eps||[]).length;i++)if(eps[i]&&eps[i].server_data&&eps[i].server_data.length)return eps[i].server_data[0];return null;}
function pLogo(imgs){if(!imgs||!imgs.logos||!imgs.logos.length)return null;return imgs.logos.find(function(l){return l.iso_639_1==='vi';})||imgs.logos.find(function(l){return l.iso_639_1==='en';})||imgs.logos[0]||null;}
function cTio(raw){if(!raw)return'';raw=String(raw).trim();if(!raw)return'';var m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest\.json/i);if(m)return m[1];m=raw.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);if(m)return m[1].replace(/\/+$/,'');m=raw.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream\//i);if(m)return m[1];if(raw.indexOf('torrentio.strem.fun')>-1){raw=raw.replace(/^https?:\/\/torrentio\.strem\.fun\/?/i,'').replace(/\/(manifest\.json|stream\/.*|configure\/?.*)?$/i,'').replace(/^\/+|\/+$/g,'');if(raw&&raw.indexOf('=')>-1)return raw.replace(/\|/g,'%7C');return'';}raw=raw.replace(/^\/+|\/+$/g,'').replace(/\|/g,'%7C');return raw.indexOf('=')===-1?'':raw;}
function cAio(raw){if(!raw)return'';return String(raw).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');}

// ═══ FIX: bE() native touch + jQuery click/hover - PASSIVE EVENTS ═══
function bE(el,fn){
    if(!el||!el.length||typeof fn!=='function')return;
    var sx=0,sy=0,mv=false,tc=false;
    var dom=el[0];
    if(dom&&dom.addEventListener){
        // ✅ passive: true để không block scroll thread
        dom.addEventListener('touchstart',function(e){var t=(e.touches||[])[0];if(t){sx=t.clientX;sy=t.clientY;mv=false;}},{passive:true});
        dom.addEventListener('touchmove',function(e){var t=(e.touches||[])[0];if(t&&(Math.abs(t.clientX-sx)>16||Math.abs(t.clientY-sy)>16))mv=true;},{passive:true});
        // ✅ FIX: touchend cần passive: false để có thể preventDefault
        dom.addEventListener('touchend',function(e){if(mv)return;tc=true;if(e.cancelable)e.preventDefault();e.stopPropagation();fn.call(dom,e);setTimeout(function(){tc=false;},300);},{passive:false});
    }
    el.on('click',function(e){if(tc||mv)return;e.preventDefault();e.stopPropagation();fn.call(this,e);});
    el.on('hover:enter',function(e){fn.call(this,e);});
}

// ═══ FIX: eScr() scroll optimization for 120Hz ═══
function eScr(scroll){
    var el=scroll.render();
    el.css({overflow:'hidden',position:'relative',height:'100%',contain:'layout'});
    var b=el.find('.scroll__body');
    
    var p={
        'transform':'translate3d(0,0,0)',
        '-webkit-transform':'translate3d(0,0,0)',
        'overflow-y':'auto',
        'overflow-x':'hidden',
        '-webkit-overflow-scrolling':'touch',
        'height':'100%',
        'padding-bottom':'8em',
        'touch-action':'pan-y',
        'will-change':'transform',
        'contain':'layout paint',
        'backface-visibility':'hidden',
        '-webkit-backface-visibility':'hidden',
        'overscroll-behavior':'contain'
    };
    
    b.css($.extend({position:'relative'},p));
    
    if(b[0]){
        Object.keys(p).forEach(function(k){
            b[0].style.setProperty(k,p[k],'important');
        });
    }
    
    if(isMobile()){
        b.css('scroll-behavior','auto');
        b.css('transition','none');
    }
}

function cScr(scroll){try{scroll.render().find('.scroll__body').empty();}catch(e){}}
function aCtrl(scroll){Lampa.Controller.add('content',{toggle:function(){Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},right:function(){Navigator.move('right');},up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},down:function(){Navigator.move('down');},back:function(){Lampa.Activity.backward();}});setTimeout(function(){Lampa.Controller.toggle('content');Lampa.Controller.collectionSet(scroll.render());Lampa.Controller.collectionFocus(false,scroll.render());},0);}
function oSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'Tìm kiếm',component:'kkphim_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm phim',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm phim:'));}
function oTSearch(){function go(kw){kw=String(kw||'').trim();if(kw)Lampa.Activity.push({url:'',title:'TMDB: '+kw,component:'kkphim_tmdb_search',keyword:kw,page_num:1});}try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:'Tìm TMDB',value:'',free:true},go);return;}}catch(e){}go(window.prompt('Tìm TMDB:'));}

// ═══ Play functions ═══
function playWithResume(title,url,pu,bu,md,ep){
    if(!url){Lampa.Noty.show('Không có link');return;}
    var cwId='';if(md){var n=nm(md);if(n)cwId=nStr(n.name||n.origin_name||'')+'_'+(ep||'movie');}
    var pg=getProgressFor(url,cwId);
    if(!pg&&cwId){var cw=getCW();for(var i=0;i<cw.length;i++){if(cw[i].id===cwId&&cw[i].progress_time>0){pg={time:cw[i].progress_time,duration:cw[i].progress_duration,percent:cw[i].progress_percent};break;}}}
    if(pg&&pg.time>10&&pg.percent<95){
        Lampa.Select.show({title:'Tiếp tục xem?',items:[{title:'▶️ Tiếp tục từ '+formatTime(pg.time)+' ('+pg.percent+'%)',value:'resume'},{title:'🔄 Xem từ đầu',value:'restart'}],onSelect:function(a){if(a.value==='resume')doPlay(title,url,pg.time,pu,bu,md,ep,cwId);else{clearProgressFor(url,cwId);doPlay(title,url,0,pu,bu,md,ep,cwId);}},onBack:function(){Lampa.Controller.toggle('content');}});
    }else doPlay(title,url,0,pu,bu,md,ep,cwId);
}
function doPlay(title,url,rt,pu,bu,md,ep,cwId){
    if(md)saveContinue(md,ep||'',url,pu||'',bu||'');
    startProgressTracking(url,cwId);
    var playUrl=url;
    if(tsHost()&&url.indexOf(tsHost().replace(/https?:\/\//,''))>-1&&url.indexOf('preload')===-1){
        playUrl+=url.indexOf('?')>-1?'&preload':'?preload';
    }
    Lampa.Player.play({title:title,url:playUrl});
    if(rt>0)resumeVideo(rt);
}

// ═══ Stream parsing ═══
function detectStreamSource(st){var rn=String(st.name||'');var rd=String(st.description||'');if(rd.match(/⚙️|🎥|🔊|🌐|📺/))return'aio';if(rn.match(/^\[[\w\-\.]+\]/))return'aio';return'torrentio';}
function parseStream(st,type){var rn=String(st.name||st.title||''),rd=String(st.description||''),ra=rn+'\n'+rd;var name='',source='',seeds='',size='',quality='',filename='';var nl=rn.split('\n');
if(type==='aio'){var fl=nl[0].trim();var tm=fl.match(/^\[([^\]]+)\]\s*(.*)/);if(tm){source=tm[1].trim();name=tm[2].trim();}else name=fl;}
else{name=nl[0].replace(/^[^\w\[({]*/,'').trim();}
if(nl.length>1){var qm=nl.slice(1).join(' ').match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm)quality=qm[1].toUpperCase();}
rd.split('\n').forEach(function(dl){dl=dl.trim();if(!dl)return;if(!size){var sm=dl.match(/[📀💾]\s*([\d.,]+\s*(?:TB|GB|GiB|MB|MiB))/i);if(sm)size=sm[1].trim();}if(!seeds){var sdm=dl.match(/👤\s*(\d+)/);if(sdm)seeds=sdm[1];}if(!source){var srcm=dl.match(/⚙️\s*(.+)/);if(srcm)source=srcm[1].trim();}if(!filename){var fnm=dl.match(/📁\s*(.+)/);if(fnm)filename=fnm[1].trim();}if(!quality){var qm2=dl.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm2)quality=qm2[1].toUpperCase();}});
if(!quality){var qm3=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);if(qm3)quality=qm3[1].toUpperCase();}
if(!size){var sm2=ra.match(/\b([\d.,]+)\s*(GB|GiB|MB|MiB|TB)\b/i);if(sm2)size=sm2[1]+' '+sm2[2];}
if(!seeds){var sdm2=ra.match(/[Ss]eed(?:er)?s?[:\s]*(\d+)/);if(sdm2)seeds=sdm2[1];}
if(st.behaviorHints){var bh=st.behaviorHints;if(!filename&&bh.filename)filename=String(bh.filename).trim();if(!size&&bh.videoSize){var by=Number(bh.videoSize);if(!isNaN(by)&&by>0){if(by>=1099511627776)size=(by/1099511627776).toFixed(2)+' TB';else if(by>=1073741824)size=(by/1073741824).toFixed(1)+' GB';else if(by>=1048576)size=(by/1048576).toFixed(0)+' MB';}}if(!source&&bh.bingeGroup){var bgm=String(bh.bingeGroup).match(/\|([^|]+)$/);if(bgm)source=bgm[1].trim();}}
if(!name||name==='?'){if(filename)name=filename.replace(/\.\w{2,4}$/,'').replace(/\./g,' ');}
return{name:name||'Unknown',infoHash:st.infoHash||'',fileIdx:st.fileIdx,url:st.url||'',size:size,seeds:seeds,quality:quality,source:source,filename:filename};}
function pStream(st){if(!st)return{name:'?',infoHash:'',fileIdx:undefined,url:'',size:'',seeds:'',quality:'',source:'',filename:''};var t=tEngine()==='aio'?'aio':detectStreamSource(st);return parseStream(st,t);}
function fmtStream(s){var p=[];var l1=s.name||'Unknown';if(s.quality&&l1.toUpperCase().indexOf(s.quality)===-1)l1+=' ['+s.quality+']';p.push(l1);var m=[];if(s.size)m.push('💾 '+s.size);if(s.seeds)m.push('👤 '+s.seeds);if(s.source)m.push('⚙️ '+s.source);if(m.length)p.push(m.join('  '));if(s.filename&&s.filename!==s.name){var fn=s.filename;if(fn.length>60)fn=fn.substring(0,57)+'...';p.push('📁 '+fn);}return p.join('\n');}

// ═══ TMDB ═══
async function tFetch(path){var r=await fetch('https://api.themoviedb.org/3'+path,{headers:{'Authorization':'Bearer '+TMDB_TOKEN,'Content-Type':'application/json'}});if(!r.ok)throw new Error('TMDB '+r.status);return await r.json();}
async function tFetchFB(path,need){var d=await tFetch(path);if(need&&(!d.overview||!d.overview.trim())){var lang=tmLang();if(lang!=='en-US'){try{var en=await tFetch(path.replace('language='+lang,'language=en-US'));if(en.overview&&en.overview.trim()){d.overview=en.overview;d.overview_fallback=true;}}catch(e){}}}return d;}
async function gImdb(type,id){if(!id)return null;try{return(await tFetch('/'+type+'/'+id+'/external_ids')).imdb_id||null;}catch(e){return null;}}
async function gSeasons(id){try{var r=await tFetch('/tv/'+id+'?language='+tmLang());if(r&&r.seasons)return r.seasons.filter(function(s){return s.season_number>0;}).map(function(s){return{season_number:s.season_number,name:s.name||('Season '+s.season_number),episode_count:s.episode_count||0};});}catch(e){}return[];}
async function lGenres(type){if(_gc[type])return _gc[type];try{var r=await tFetch('/genre/'+type+'/list?language='+tmLang());_gc[type]=r.genres||[];return _gc[type];}catch(e){return[];}}
async function tPersonC(pid){try{return await tFetch('/person/'+pid+'/combined_credits?language='+tmLang());}catch(e){return null;}}
var TFN={trending:function(p){return tFetch('/trending/all/week?language='+tmLang()+'&page='+p);},trending_day:function(p){return tFetch('/trending/all/day?language='+tmLang()+'&page='+p);},popular_movies:function(p){return tFetch('/movie/popular?language='+tmLang()+'&page='+p);},popular_tv:function(p){return tFetch('/tv/popular?language='+tmLang()+'&page='+p);},top_movies:function(p){return tFetch('/movie/top_rated?language='+tmLang()+'&page='+p);},top_tv:function(p){return tFetch('/tv/top_rated?language='+tmLang()+'&page='+p);},now_playing:function(p){return tFetch('/movie/now_playing?language='+tmLang()+'&page='+p);},upcoming:function(p){return tFetch('/movie/upcoming?language='+tmLang()+'&page='+p);},airing_today:function(p){return tFetch('/tv/airing_today?language='+tmLang()+'&page='+p);},on_the_air:function(p){return tFetch('/tv/on_the_air?language='+tmLang()+'&page='+p);}};
var RANDOM_LISTS=['trending','popular_movies','popular_tv','top_movies','top_tv','now_playing','airing_today'];
async function tSearchM(q,p){return await tFetch('/search/multi?language='+tmLang()+'&query='+encodeURIComponent(q)+'&page='+(p||1));}
async function tDetFull(type,id){return await tFetchFB('/'+type+'/'+id+'?language='+tmLang()+'&append_to_response=credits,images,similar,external_ids',true);}
async function tImgFull(type,id){return await tFetch('/'+type+'/'+id+'/images');}
async function tDiscover(type,gid,p){return await tFetch('/discover/'+type+'?language='+tmLang()+'&sort_by=popularity.desc&with_genres='+gid+'&page='+(p||1));}
async function tSimilar(type,id,p){return await tFetch('/'+type+'/'+id+'/similar?language='+tmLang()+'&page='+(p||1));}
function tNorm(item){if(!item)return null;var mt=item.media_type||(item.first_air_date?'tv':'movie');return{tmdb_id:item.id,media_type:mt,name:item.title||item.name||'',poster_url:item.poster_path?TMDB_W300+item.poster_path:'',backdrop_url:item.backdrop_path?TMDB_W500+item.backdrop_path:'',year:(item.release_date||item.first_air_date||'').slice(0,4),vote:item.vote_average?Number(item.vote_average).toFixed(1):''};}

// ═══ Source search ═══
async function sSrc(source,kw){try{var r=await fetch(source.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page=1');if(!r.ok)return[];var d=await r.json();return(d&&d.data&&d.data.items)||(d&&d.items)||[];}catch(e){return[];}}
function mBest(items,title,orig,year){if(!items||!items.length)return null;var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var n1=nStr(items[i].name||items[i].title||''),n2=nStr(items[i].origin_name||items[i].original_name||'');if((nT&&(n1===nT||n2===nT))||(nO&&(n1===nO||n2===nO))){if(!year||!items[i].year||String(items[i].year)===String(year))return items[i];}}for(var j=0;j<items.length;j++){var m1=nStr(items[j].name||items[j].title||''),m2=nStr(items[j].origin_name||items[j].original_name||'');if((nT&&(m1.indexOf(nT)>-1||nT.indexOf(m1)>-1))||(nO&&(m2.indexOf(nO)>-1||nO.indexOf(m2)>-1))){if(!year||!items[j].year||String(items[j].year)===String(year))return items[j];}}return null;}
async function fSlugs(title,orig,year){var r={kkphim:null,ophim:null},terms=[title];if(orig&&orig!==title)terms.push(orig);for(var i=0;i<terms.length;i++){if(!r.kkphim){var f1=mBest(await sSrc(SOURCES.kkphim,terms[i]),title,orig,year);if(f1&&f1.slug)r.kkphim=f1.slug;}if(!r.ophim){var f2=mBest(await sSrc(SOURCES.ophim,terms[i]),title,orig,year);if(f2&&f2.slug)r.ophim=f2.slug;}if(r.kkphim&&r.ophim)break;}return r;}
async function fDet(source,slug){try{var r=await fetch(source.api+'phim/'+slug);if(!r.ok)return null;var d=await r.json();return{movie:d.movie||d||{},episodes:d.episodes||[]};}catch(e){return null;}}
function exSn(name,slug){var m=name.match(/season\s*(\d+)/i)||name.match(/phần\s*(\d+)/i)||slug.match(/season-(\d+)/i)||slug.match(/phan-(\d+)/i)||name.match(/S(\d+)/);if(m)return parseInt(m[1]);var nm2=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);if(nm2){var n=parseInt(nm2[1]);if(n>=2&&n<=30)return n;}return 1;}
async function fSeasonSlugs(source,title,orig){var results=[];try{var items=await sSrc(source,title);if(!items.length&&orig)items=await sSrc(source,orig);var nT=nStr(title),nO=nStr(orig);for(var i=0;i<items.length;i++){var it=items[i];if(!it.slug)continue;var n1=nStr(it.name||it.title||''),n2=nStr(it.origin_name||it.original_name||'');var match=false;if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1||n1===nT))match=true;if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1||n2===nO))match=true;if(match)results.push({slug:it.slug,name:it.name||it.title||'',season:exSn(it.name||it.title||'',it.slug||''),source:source});}}catch(e){}return results;}

// ═══ TorrServer ═══
function tsU(p){var h=tsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsH(){var h={'Content-Type':'application/json'};var pw=tsPass();if(pw)h['Authorization']='Basic '+btoa('admin:'+pw);return h;}
function bMag(h){return'magnet:?xt=urn:btih:'+h+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');}

async function tsSpeedTest(){
    var h=tsHost();if(!h)return{ok:false,msg:'Chưa cấu hình'};
    try{
        var t0=Date.now();
        var r=await fetch(tsU('/echo'),{method:'GET',headers:tsH()});
        var ping=Date.now()-t0;
        if(!r.ok)return{ok:false,msg:'HTTP '+r.status,ping:ping};
        var t1=Date.now();
        var r2=await fetch(tsU('/settings'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'get'})});
        var latency=Date.now()-t1;
        var settings=null;try{settings=await r2.json();}catch(e){}
        var r3=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'list'})});
        var torrents=[];try{torrents=await r3.json();if(!Array.isArray(torrents))torrents=[];}catch(e){}
        return{ok:true,ping:ping,latency:latency,settings:settings,torrents:torrents,msg:'Ping: '+ping+'ms | API: '+latency+'ms | Torrents: '+torrents.length};
    }catch(e){return{ok:false,msg:e.message||'Lỗi kết nối'};}
}

async function tsCacheInfo(){
    try{
        var r=await fetch(tsU('/settings'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'get'})});
        if(!r.ok)return null;
        var s=await r.json();
        return{
            cacheSize:s.CacheSize||0,
            preloadBuffer:s.PreloadBuffer||0,
            readerReadAHead:s.ReaderReadAHead||0,
            version:s.TorrServerVersion||'?',
            enableDLNA:s.EnableDLNA||false
        };
    }catch(e){return null;}
}

async function tsClearCache(){
    try{
        var r=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'list'})});
        var list=await r.json();if(!Array.isArray(list))return 0;
        var count=0;
        for(var i=0;i<list.length;i++){
            try{await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'rem',hash:list[i].hash})});count++;}catch(e){}
        }
        return count;
    }catch(e){return-1;}
}

async function tsActiveTorrents(){
    try{
        var r=await fetch(tsU('/torrents'),{method:'POST',headers:tsH(),body:JSON.stringify({action:'list'})});
        var list=await r.json();if(!Array.isArray(list))return[];
        return list.map(function(t){
            var totalSize=0;if(t.file_stats)t.file_stats.forEach(function(f){totalSize+=(f.length||0);});
            return{hash:t.hash,title:t.title||t.name||'Unknown',size:totalSize,status:t.stat_string||t.stat||'',poster:t.poster||''};
        });
    }catch(e){return[];}
}

async function playTS(stream,title,poster,fi,md,ep){
    if(!tsHost()){Lampa.Noty.show('Chưa cấu hình TS!');return;}Lampa.Noty.show('Gửi TS...');
    try{var u=tsU('/torrents');var r=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'add',link:bMag(stream.infoHash),title:title||'',poster:poster||'',save_to_db:false})});if(!r.ok)throw new Error('TS:'+r.status);var td=await r.json();var hash=td.hash||stream.infoHash;await dly(2000);var info=null,rt=0;while(rt<3){try{var r2=await fetch(u,{method:'POST',headers:tsH(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}rt++;await dly(1500);}
    var files=[];if(info&&info.file_stats)files=info.file_stats.filter(function(f){return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|flv|webm|ts|m2ts)$/);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
    if(!files.length){playWithResume(title,tsU('/stream/fname?link='+hash+'&index=0&play&preload'),poster,'',md,ep);}
    else if(files.length===1){playWithResume(title,tsU('/stream/fname?link='+hash+'&index='+(files[0].id||0)+'&play&preload'),poster,'',md,ep);}
    else{Lampa.Select.show({title:'Chọn file ('+files.length+')',items:files.map(function(f){var sz=f.length?(f.length/1073741824).toFixed(1)+' GB':'';return{title:(f.path||'').split('/').pop()+(sz?' ['+sz+']':''),value:f};}),onSelect:function(a){playWithResume(title,tsU('/stream/fname?link='+hash+'&index='+(a.value.id||0)+'&play&preload'),poster,'',md,ep);},onBack:function(){Lampa.Controller.toggle('content');}});}
    }catch(e){Lampa.Noty.show('Lỗi TS: '+(e.message||''));}
}

function tioU(type,imdb,s,e){var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;var c=cTio(tioConf());return TIO_BASE+(c?'/'+c:'')+'/stream/'+t+'/'+id+'.json';}
function aioU(type,imdb,s,e){var base=cAio(aioUrl());if(!base)return'';var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;return base+'/stream/'+t+'/'+id+'.json';}
async function fStreams(type,imdb,s,e){var eng=tEngine(),url;if(eng==='aio'){url=aioU(type,imdb,s,e);if(!url)throw new Error('Chưa cấu hình AIO');}else url=tioU(type,imdb,s,e);var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);var d=await r.json();var st=d.streams||[];if(!st.length){if(Array.isArray(d))st=d;else if(d.data&&Array.isArray(d.data))st=d.data;}return st.map(pStream).filter(function(s2){return s2.infoHash||s2.url;});}
function showStr(streams,title,poster,md,ep){var ts=!!tsHost();if(!streams.length){Lampa.Noty.show('Không tìm thấy');return;}Lampa.Select.show({title:title+' ('+streams.length+')',items:streams.slice(0,50).map(function(s){return{title:fmtStream(s),value:s};}),onSelect:function(a){var s=a.value;if(ts&&s.infoHash)playTS(s,title,poster,s.fileIdx,md,ep);else if(s.url)playWithResume(title,s.url,poster,'',md,ep);else Lampa.Noty.show(s.infoHash?'Cần TorrServer':'Không có link');},onBack:function(){Lampa.Controller.toggle('content');}});}
async function oTorMov(tid,title,poster,imdb,md){Lampa.Noty.show('Tìm torrent...');try{var id=imdb||await gImdb('movie',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var st=await fStreams('movie',id);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,title,poster,md,'Torrent');}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
async function oTorTV(tid,title,poster,imdb,md){Lampa.Noty.show('Tải season...');try{var id=imdb||await gImdb('tv',tid);if(!id){Lampa.Noty.show('Không có IMDB');return;}var sn=await gSeasons(tid);if(sn.length>1){Lampa.Select.show({title:'Chọn Season',items:sn.map(function(s){return{title:s.name+(s.episode_count?' ('+s.episode_count+')':''),value:s};}),onSelect:function(a){pTorEp(a.value,id,title,poster,md);},onBack:function(){Lampa.Controller.toggle('content');}});}else if(sn.length===1)pTorEp(sn[0],id,title,poster,md);else Lampa.Noty.show('Không có season');}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}}
function pTorEp(season,imdb,title,poster,md){var items=[];for(var i=1;i<=(season.episode_count||1);i++)items.push({title:'S'+pd(season.season_number)+'E'+pd(i),value:{s:season.season_number,e:i}});Lampa.Select.show({title:season.name,items:items,onSelect:async function(a){var lb=title+' S'+pd(a.value.s)+'E'+pd(a.value.e);Lampa.Noty.show('Tìm '+lb+'...');try{var st=await fStreams('tv',imdb,a.value.s,a.value.e);if(!st.length){Lampa.Noty.show('Không có');return;}showStr(st,lb,poster,md,'S'+pd(a.value.s)+'E'+pd(a.value.e));}catch(e){Lampa.Noty.show('Lỗi: '+(e.message||''));}},onBack:function(){Lampa.Controller.toggle('content');}});}

/* ══ CARDS ══ */
function mkC(item){var n=nm(item);if(!n)return $('<div></div>');var p=optimizeImgUrl(fImg(n.poster_url||n.thumb_url));var b='';if(n.quality)b+='<div class="kk-card-q">'+E(n.quality)+'</div>';if(n.episode_current)b+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';var c=$('<div class="kk-card selector"><div class="kk-card-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-noposter"><span>No Poster</span></div>')+b+'</div><div class="kk-card-body"><div class="kk-card-name">'+E(n.name)+'</div>'+(n.origin_name&&n.origin_name!==n.name?'<div class="kk-card-origin">'+E(n.origin_name)+'</div>':'')+'<div class="kk-card-meta">'+(n.year?'<span class="kk-card-year">'+E(n.year)+'</span>':'')+'</div></div></div>');bE(c,function(){if(n.slug){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});return c;}
function mkTC(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var p=optimizeImgUrl(d.poster_url||d.backdrop_url);var c=$('<div class="kk-card selector"><div class="kk-card-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-noposter"><span>No</span></div>')+(d.vote?'<div class="kk-card-q">⭐'+E(d.vote)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+(d.media_type==='tv'?'TV':'Film')+'</div></div><div class="kk-card-body"><div class="kk-card-name">'+E(d.name)+'</div><div class="kk-card-meta">'+(d.year?'<span class="kk-card-year">'+E(d.year)+'</span>':'')+'</div></div></div>');bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}
function mkTCH(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var bk=optimizeImgUrl(d.backdrop_url||d.poster_url);var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No</span></div>')+(d.vote?'<div class="kk-card-q">⭐'+E(d.vote)+'</div>':'')+'<div class="kk-card-ep kk-card-ep--type">'+(d.media_type==='tv'?'TV':'Film')+'</div></div><div class="kk-card-h-body"><div class="kk-card-name">'+E(d.name)+'</div><div class="kk-card-meta">'+(d.year?'<span class="kk-card-year">'+E(d.year)+'</span>':'')+'</div></div></div>');bE(c,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return c;}
function mkCH(item){var n=nm(item);if(!n)return $('<div></div>');var p=optimizeImgUrl(fImg(n.thumb_url||n.poster_url));var b='';if(n.quality)b+='<div class="kk-card-q">'+E(n.quality)+'</div>';if(n.episode_current)b+='<div class="kk-card-ep">'+E(n.episode_current)+'</div>';var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No</span></div>')+b+'</div><div class="kk-card-h-body"><div class="kk-card-name">'+E(n.name)+'</div>'+(n.origin_name&&n.origin_name!==n.name?'<div class="kk-card-origin">'+E(n.origin_name)+'</div>':'')+'<div class="kk-card-meta">'+(n.year?'<span class="kk-card-year">'+E(n.year)+'</span>':'')+'</div></div></div>');bE(c,function(){if(n.slug){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});}});return c;}
function mkPFC(item){var n=nm(item);if(!n||!n.slug)return $('<div></div>');var bk=optimizeImgUrl(fImg(n.thumb_url||n.poster_url)),ps=optimizeImgUrl(fImg(n.poster_url||n.thumb_url));var b='';if(n.quality)b+='<div class="kk-pfc-q">'+E(n.quality)+'</div>';if(n.episode_current)b+='<div class="kk-pfc-ep">'+E(n.episode_current)+'</div>';var card=$('<div class="kk-pfc selector"><div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+b+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'')+'<div class="kk-pfc-info"><div class="kk-pfc-title">'+E(n.name)+'</div><div class="kk-pfc-meta">'+(n.year?'<span>'+E(n.year)+'</span>':'')+'</div></div></div></div>');bE(card,function(){saveHistory(n);Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});return card;}
function mkTCPF(item){var d=tNorm(item);if(!d||!d.tmdb_id)return $('<div></div>');var bk=optimizeImgUrl(d.backdrop_url||d.poster_url),ps=optimizeImgUrl(d.poster_url);var card=$('<div class="kk-pfc selector"><div class="kk-pfc-bg">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-pfc-bg-empty"></div>')+(d.vote?'<div class="kk-pfc-q">⭐'+d.vote+'</div>':'')+'</div><div class="kk-pfc-overlay"></div><div class="kk-pfc-inner">'+(ps?'<div class="kk-pfc-poster"><img src="'+ps+'" loading="lazy"></div>':'')+'<div class="kk-pfc-info"><div class="kk-pfc-title">'+E(d.name)+'</div><div class="kk-pfc-meta">'+(d.year?'<span>'+E(d.year)+'</span>':'')+'</div></div></div></div>');bE(card,function(){Lampa.Activity.push({url:'',title:d.name||'',component:'kkphim_tmdb_detail',tmdb_id:d.tmdb_id,media_type:d.media_type,page:1});});return card;}
function mkCWCard(item){var n=nm(item);if(!n)return $('<div></div>');var p=optimizeImgUrl(item.thumb_url||item.poster_url||fImg(n.thumb_url||n.poster_url));var ep=item.ep_name||item.episode_current||'Tiếp tục';var link=item.ep_link||'';var cwId=item.id||'';var pg=null;if(link)pg=getProgressFor(link,cwId);if(!pg&&item.progress_time>0&&item.progress_duration>0)pg={time:item.progress_time,duration:item.progress_duration,percent:item.progress_percent};var pH='',tI='';if(pg&&pg.percent>0&&pg.percent<95&&pg.duration>10){pH='<div class="kk-cw-progress"><div class="kk-cw-progress-bar" style="width:'+pg.percent+'%"></div></div>';tI=formatTime(pg.time)+'/'+formatTime(pg.duration)+' ('+pg.percent+'%)';}var sub=tI?'▶ '+tI:'Nhấn để xem';var c=$('<div class="kk-card-h selector"><div class="kk-card-h-img">'+(p?'<img src="'+p+'" loading="lazy">':'<div class="kk-card-h-noposter"><span>No</span></div>')+pH+'</div><div class="kk-card-h-body"><div class="kk-card-name">'+E(n.name)+'</div><div class="kk-card-meta"><span class="kk-card-time">'+E(ep)+'</span></div><div class="kk-card-overview">'+sub+'</div></div></div>');bE(c,function(){if(link)playWithResume((n.name||'')+' - '+ep,link,item.poster_url,item.thumb_url,item,ep);else if(n.slug)Lampa.Activity.push({url:'',title:n.name||'',component:'kkphim_detail',movie:n,page:1});});return c;}

function mkRowList(items,isKK){var cm=cardMode();var rl=$('<div class="kk-row-list"></div>');var cards=[];if(cm==='poster')items.forEach(function(i){cards.push(isKK?mkPFC(i):mkTCPF(i));});else items.forEach(function(i){cards.push(isKK?mkCH(i):mkTCH(i));});batchAppend(rl,cards);return rl;}
function mkCWRow(items){var rl=$('<div class="kk-row-list"></div>');var cards=[];items.forEach(function(i){cards.push(mkCWCard(i));});batchAppend(rl,cards);return rl;}
function mkCastList(ca,ht){var l=$('<div class="kk-cast-list"></div>');var cards=[];ca.forEach(function(c){var av=c.profile_path?'<img src="'+optimizeImgUrl(TMDB_W300+c.profile_path)+'" loading="lazy">':'<div class="kk-cast-empty"></div>';var cd;if(ht&&c.id){cd=$('<div class="kk-cast-card selector"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div><div class="kk-cast-role">'+E(c.character||'')+'</div></div></div>');bE(cd,function(){Lampa.Activity.push({url:'',title:c.name||'',component:'kkphim_person',person_id:c.id,page:1});});}else cd=$('<div class="kk-cast-card"><div class="kk-cast-img">'+av+'</div><div class="kk-cast-info"><div class="kk-cast-name">'+E(c.name||'')+'</div></div></div>');cards.push(cd);});batchAppend(l,cards);return l;}
function mkDirHtml(dirs,isTmdb){if(!dirs||!dirs.length)return'';var f=dirs[0];var av=f.profile_path?'<div class="kk-crew-avatar"><img src="'+optimizeImgUrl(TMDB_W300+f.profile_path)+'" loading="lazy"></div>':'<div class="kk-crew-avatar"><div class="kk-crew-avatar-empty"></div></div>';var n2=(isTmdb&&f.id)?'<span class="kk-crew-name selector" data-pid="'+f.id+'">'+E(f.name||'')+'</span>':'<span class="kk-crew-name">'+E(f.name||'')+'</span>';return'<div class="kk-crew">'+av+'<div class="kk-crew-info"><span class="kk-crew-label">Đạo diễn</span>'+n2+'</div></div>';}
function bindDirClicks(el){el.find('.kk-crew-name[data-pid]').each(function(){var sp=$(this);bE(sp,function(){var pid=sp.attr('data-pid');if(pid)Lampa.Activity.push({url:'',title:sp.text()||'',component:'kkphim_person',person_id:parseInt(pid),page:1});});});}
function gHtml(genres,isTmdb){if(!genres||!genres.length)return'';var r='';for(var i=0;i<genres.length;i++){var g=genres[i];if(!g)continue;var gn=E(g.name||'');if(isTmdb)r+='<span class="kk-genre selector" data-gid="'+(g.id||'')+'" data-gname="'+gn+'">'+gn+'</span>';else r+='<span class="kk-genre selector" data-slug="'+E(g.slug||'')+'" data-title="'+E(g.name||'')+'">'+gn+'</span>';}return r;}
function mkHero(bk,ps,logoH,tH,origin,extra){extra=extra||{};var ctH='';if(extra.countries&&extra.countries.length){ctH='<span class="kk-country-tags">';extra.countries.slice(0,3).forEach(function(c){var code=c.iso_3166_1||c.name||'';if(code)ctH+='<span class="kk-country-tag">'+E(code)+'</span>';});ctH+='</span>';}return $('<div class="kk-hero"><div class="kk-hero-backdrop">'+(bk?'<img src="'+bk+'" loading="lazy">':'<div class="kk-hero-backdrop-empty"></div>')+'</div><div class="kk-hero-card"><div class="kk-hero-poster-wrap"><div class="kk-hero-poster">'+(ps?'<img src="'+ps+'" loading="lazy">':'')+'</div></div><div class="kk-hero-meta">'+(extra.year||ctH?'<div class="kk-hm-yc">'+(extra.year?'<span class="kk-hm-year">'+E(extra.year)+'</span>':'')+ctH+'</div>':'')+(logoH||tH)+'<div class="kk-hm-badges">'+(extra.vote?'<span class="kk-hm-vote">'+E(extra.vote)+' <small>TMDB</small></span>':'')+'</div>'+(extra.runtime||extra.genres?'<div class="kk-hm-rtg">'+(extra.runtime?'<span class="kk-hm-rt">'+E(extra.runtime)+'</span>':'')+(extra.genres?'<span class="kk-hm-genres">'+E(extra.genres)+'</span>':'')+'</div>':'')+'</div></div></div>');}
function mkBody(v,y,rt,extra,genreHtml,crewH,desc,isF){var dl='Nội dung';if(isF)dl+=' <small style="opacity:0.6">(EN)</small>';return $('<div class="kk-body"><div class="kk-body-genres">'+genreHtml+'</div>'+crewH+'<div class="kk-body-desc"><span class="kk-body-desc-label">'+dl+'</span><div class="kk-body-desc-text">'+fTxt(desc||'Không có mô tả')+'</div></div></div>');}

// ═══ CSS ═══
function inCSS(){
    if($('#kk-css').length)return;
    var l=document.createElement('link');l.id='kk-css';l.rel='stylesheet';l.href=CSS_URL;document.head.appendChild(l);
    $('head').append('<style id="kk-extra-css">'+
        '*{-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;}'+
        'html,body{overscroll-behavior-y:contain;}'+
        '.kk-stg-item,.kk-stg-group,.kk-card,.kk-card-h,.kk-pfc,.kk-row,.kk-section,.kk-body,.kk-hero,.kk-actions,.kk-detail-wrap,.kk-grid-wrap,.kk-topbar,.kk-srcbar,.kk-genre-bar,.kk-cast-card,.kk-crew,.kk-body-desc,.kk-body-genres,.kk-ep-box,.kk-sv-hd,.kk-sn-it,.kk-ep-bk,.kk-src-btn,.kk-row-head,.kk-block-title,.kk-similar,.kk-person-header,.kk-person-info{border:none!important;outline:none!important;box-shadow:none!important;backface-visibility:hidden;-webkit-backface-visibility:hidden;}'+
        '.kk-stg-item::before,.kk-stg-item::after,.kk-stg-group::before,.kk-stg-group::after,.kk-row::before,.kk-row::after{display:none!important;}'+
        'hr,.kk-divider{display:none!important;}'+
        '.kk-row-list{transform:translate3d(0,0,0);-webkit-transform:translate3d(0,0,0);will-change:transform;contain:layout paint;overflow:hidden;}'+
        '.kk-card,.kk-card-h,.kk-pfc{transform:translate3d(0,0,0);-webkit-transform:translate3d(0,0,0);will-change:transform;contain:layout style;backface-visibility:hidden;-webkit-backface-visibility:hidden;}'+
        '.kk-card img,.kk-card-h img,.kk-pfc img{transform:translate3d(0,0,0);-webkit-transform:translate3d(0,0,0);content-visibility:auto;contain-intrinsic-size:auto 200px;image-rendering:auto;}'+
        '.scroll__body{transform:translate3d(0,0,0);-webkit-transform:translate3d(0,0,0);will-change:transform;contain:layout paint;backface-visibility:hidden;-webkit-backface-visibility:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}'+
        '.kk-card:hover,.kk-card-h:hover,.kk-pfc:hover,.selector.focus{transition:transform .08s cubic-bezier(.4,0,.2,1),opacity .08s!important;will-change:transform,opacity;}'+
        '.kk-card.focus,.kk-card-h.focus,.kk-pfc.focus{transform:translate3d(0,0,0) scale(1.03)!important;-webkit-transform:translate3d(0,0,0) scale(1.03)!important;}'+
        '.kk-cw-progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.25);border-radius:0;overflow:hidden;will-change:width;transform:translateZ(0);}'+
        '.kk-cw-progress-bar{height:100%;background:linear-gradient(90deg,#e50914,#ff6b6b);will-change:width;transform:translateZ(0);}'+
        '.kk-card-h-img,.kk-card-img,.kk-pfc-bg{position:relative;contain:layout;}'+
        '.kk-pfc-q,.kk-pfc-ep{position:absolute;top:6px;padding:2px 6px;border-radius:3px;font-size:.7em;font-weight:600;z-index:2;transform:translateZ(0);}.kk-pfc-q{left:6px;background:rgba(229,9,20,.95);color:#fff;}.kk-pfc-ep{right:6px;background:rgba(0,0,0,.75);color:#fff;}'+
        '.kk-stg-status{margin:.5em 1em;padding:.8em;border-radius:8px;font-size:.85em;transform:translateZ(0);}'+
        '.kk-stg-status--loading{background:rgba(59,130,246,.15);color:#60a5fa;}'+
        '.kk-stg-status--ok{background:rgba(34,197,94,.15);color:#4ade80;}'+
        '.kk-stg-status--err{background:rgba(239,68,68,.15);color:#f87171;}'+
        '.kk-ep-c{position:relative;overflow:hidden;contain:layout;}'+
        '.kk-country-tags{display:inline-flex;gap:4px;margin-left:6px;vertical-align:middle;}.kk-country-tag{display:inline-block;padding:0;background:none;font-size:.8em;font-weight:700;letter-spacing:.3px;color:#f0a030;text-transform:uppercase;}'+
        '.kk-ts-info{margin:.5em 1em;padding:.8em;border-radius:8px;background:rgba(255,255,255,.05);font-size:.8em;line-height:1.6;transform:translateZ(0);}'+
        '.kk-ts-row{display:flex;justify-content:space-between;padding:2px 0;}'+
        '.kk-ts-key{opacity:.7;}'+
        '.kk-ts-val{font-weight:600;color:#4ade80;}'+
        '.kk-ts-torrent{padding:.5em;margin:.25em 0;border-radius:5px;background:rgba(255,255,255,.03);}'+
        '.kk-ts-torrent-title{font-weight:600;margin-bottom:1px;font-size:.9em;}'+
        '.kk-ts-torrent-meta{font-size:.75em;opacity:.6;}'+
    '</style>');
}

function addM(){function ins(){if($('.menu__item[data-action="kkphim"]').length)return;var m=$('<li class="menu__item selector" data-action="kkphim"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2 2v2h2V6H6zm4 0v2h2V6h-2zm4 0v2h2V6h-2zm4 0v2h2V6h-2zM6 10v8h12v-8H6z"/></svg></div><div class="menu__text">KKPhim</div></li>');bE(m,function(){Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});$('.menu .menu__list').first().append(m);}setTimeout(ins,500);Lampa.Listener.follow('app',function(e){if(e.type==='ready')setTimeout(ins,500);});}

function mkSB(css,l1,l2){return $('<div class="kk-src-btn '+css+' selector"><div class="kk-sb-main">'+l1+' <span class="kk-arrow">▼</span></div>'+(l2?'<div class="kk-sb-sub">'+l2+'</div>':'')+'</div>');}
function bMovExp(sk,sn,slug,title,css,md,pu,bu){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Bấm để xem'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳</div>');fDet(SOURCES[sk],slug).then(function(det){if(!det||!det.episodes||!det.episodes.length){box.html('<div class="kk-ep-er">❌ Không có</div>');return;}var mD=$.extend({},md||{});if(!mD.slug)mD.slug=slug;box.empty();fillE(box,det.episodes,title,mD,pu,bu);}).catch(function(e){box.html('<div class="kk-ep-er">❌ '+E(e.message||'')+'</div>');});}});return w;}
function bTVExp(sk,sn,slug,title,orig,css,md,pu,bu){var w=$('<div style="width:100%"></div>'),btn=mkSB(css,'▶ '+E(sn),'Chọn season/tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);var ld=false,op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);if(op&&!ld){ld=true;box.html('<div class="kk-ep-ld">⏳</div>');var source=SOURCES[sk];fSeasonSlugs(source,title,orig).then(function(entries){if(!entries.length&&slug)entries=[{slug:slug,name:title,season:1,source:source}];if(!entries.length){box.html('<div class="kk-ep-er">❌</div>');return;}var sMap={};entries.forEach(function(e2){if(!sMap[e2.season])sMap[e2.season]=[];sMap[e2.season].push(e2);});var sNums=Object.keys(sMap).map(Number).sort(function(a,b){return a-b;});var mD=$.extend({},md||{});if(!mD.slug)mD.slug=slug;if(sNums.length===1)ldSn(box,sMap[sNums[0]],title,sNums[0],null,mD,pu,bu);else shSn(box,sMap,sNums,title,mD,pu,bu);}).catch(function(e2){box.html('<div class="kk-ep-er">❌ '+E(e2.message||'')+'</div>');});}});return w;}
function bDetExp(eps,title,sn,css,md,pu,bu){var w=$('<div style="width:100%"></div>'),total=0;(eps||[]).forEach(function(sv){total+=(sv.server_data||[]).length;});var btn=mkSB(css,'▶ '+E(sn),total+' tập'),box=$('<div class="kk-ep-box"></div>');w.append(btn).append(box);if(!eps||!eps.length||total===0){btn.removeClass(css).addClass('kk-src-btn--no');btn.html('⚠️ Không có tập');return w;}if(total===1){var ep=gEp1(eps);if(ep){var link=ep.link_m3u8||ep.link_embed||'';btn.find('.kk-sb-main').html('▶ '+E(sn));btn.find('.kk-sb-sub').text('Phát ngay');btn.find('.kk-arrow').remove();bE(btn,function(){if(link)playWithResume(title,link,pu,bu,md,ep.name||'Full');else Lampa.Noty.show('Không có link');});return w;}}fillE(box,eps,title,md,pu,bu);var op=false;bE(btn,function(){op=!op;btn.toggleClass('kk-open',op);box.toggleClass('kk-show',op);});return w;}
function bTorBtn(mt,tid,title,poster,imdb,md){var eng=tEngine();var label=eng==='aio'?'🌊 AIO':'🧲 Torrent';if(tsHost())label+=' → TS';var css=eng==='aio'?'kk-src-btn--aio':'kk-src-btn--torrent';var btn=$('<div class="kk-src-btn '+css+' selector" style="width:100%"><div class="kk-sb-main">'+label+'</div></div>');if(mt==='movie')bE(btn,function(){oTorMov(tid,title,poster,imdb,md);});else bE(btn,function(){oTorTV(tid,title,poster,imdb,md);});return $('<div style="width:100%"></div>').append(btn);}
function shSn(c,sMap,sNums,title,md,pu,bu){c.empty();sNums.forEach(function(sn){var item=$('<div class="kk-sn-it selector"><span class="kk-sn-nm">📺 Season '+sn+'</span></div>');bE(item,function(){ldSn(c,sMap[sn],title,sn,function(){shSn(c,sMap,sNums,title,md,pu,bu);},md,pu,bu);});c.append(item);});}
async function ldSn(c,entries,title,sNum,backFn,md,pu,bu){c.html('<div class="kk-ep-ld">⏳ S'+sNum+'...</div>');for(var i=0;i<entries.length;i++){try{var det=await fDet(entries[i].source,entries[i].slug);if(det&&det.episodes&&det.episodes.length){c.empty();if(backFn){var bk=$('<div class="kk-ep-bk selector">← Quay lại</div>');bE(bk,backFn);c.append(bk);}var mD=$.extend({},md||{});if(!mD.slug)mD.slug=entries[i].slug;fillE(c,det.episodes,title+' S'+pd(sNum),mD,pu,bu);return;}}catch(e2){}}c.html('<div class="kk-ep-er">❌</div>');}
function fillE(c,eps,title,md,pu,bu){var frag=document.createDocumentFragment();eps.forEach(function(sv){var sn2=sv.server_name||'Server',cnt=(sv.server_data||[]).length,icon='📺',snl=sn2.toLowerCase();if(snl.indexOf('thuyết minh')>-1||snl.indexOf('thuyet minh')>-1)icon='🇻🇳';else if(snl.indexOf('vietsub')>-1||snl.indexOf('sub')>-1)icon='📝';var hd=document.createElement('div');hd.className='kk-sv-hd';hd.textContent=icon+' '+sn2+' ('+cnt+')';frag.appendChild(hd);var grid=$('<div class="kk-ep-chips"></div>');var chips=[];(sv.server_data||[]).forEach(function(ep){var link=ep.link_m3u8||ep.link_embed||'';var cwId='';if(md){var n=nm(md);if(n)cwId=nStr(n.name||n.origin_name||'')+'_'+(ep.name||'Tập');}var pg=link?getProgressFor(link,cwId):null;var pH='';if(pg&&pg.percent>0&&pg.percent<95&&pg.duration>10)pH='<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,.3);"><div style="width:'+pg.percent+'%;height:100%;background:#e50914;"></div></div>';var chip=$('<div class="kk-ep-c selector'+(link?'':' off')+'">'+E(ep.name||'Tập')+pH+'</div>');bE(chip,function(){if(link)playWithResume(title+' - '+(ep.name||''),link,pu,bu,md,ep.name||'Tập');else Lampa.Noty.show('Không có link');});chips.push(chip);});batchAppend(grid,chips);frag.appendChild(grid[0]);});c[0].appendChild(frag);}

/* ════ COMPONENTS ════ */
function startPlugin(){
    if(!document.querySelector('meta[name="viewport"]')){
        var vp=document.createElement('meta');
        vp.name='viewport';
        vp.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no';
        document.head.appendChild(vp);
    }
    
    if(isMobile()){
        document.body.style.transform='translateZ(0)';
        document.body.style.backfaceVisibility='hidden';
        document.body.style.webkitBackfaceVisibility='hidden';
    }
    
    inCSS();initPlayerHook();applyFontScale();addM();

    // ═══ SETTINGS ═══
    Lampa.Component.add('kkphim_settings',function(){
        var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;
        this.create=function(){cScr(scroll);var s=ls(),w=$('<div class="kk-stg-wrap"></div>');w.append('<div class="kk-stg-title">⚙️ Cài đặt KKPhim</div>');
        var g0=mg('📺 Nguồn phim','');var cur=s.source||'ophim';Object.keys(SOURCES).forEach(function(k){var sc=SOURCES[k];g0.append(mo(sc.name,sc.api,cur===k,function(){ss({source:k});comp.create();}));});w.append(g0);
        var gFont=mg('🔠 Cỡ chữ','');var fs=String(s.font_scale||'100');[{k:'85',n:'Nhỏ'},{k:'100',n:'Mặc định'},{k:'115',n:'Lớn'},{k:'130',n:'Rất lớn'}].forEach(function(o){gFont.append(mo(o.n,'',fs===o.k,function(){ss({font_scale:o.k});applyFontScale();comp.create();}));});w.append(gFont);
        var gImg=mg('🖼️ Chất lượng ảnh','');var iq=s.img_quality||'medium';[{k:'low',n:'Thấp'},{k:'medium',n:'TB'},{k:'high',n:'Cao'}].forEach(function(o){gImg.append(mo(o.n,'',iq===o.k,function(){ss({img_quality:o.k});comp.create();}));});w.append(gImg);
        var gCard=mg('🃏 Kiểu card','');var cm=s.card_mode||'hgrid';[{k:'hgrid',n:'Ngang'},{k:'poster',n:'Poster'}].forEach(function(o){gCard.append(mo(o.n,'',cm===o.k,function(){ss({card_mode:o.k});comp.create();}));});w.append(gCard);
        var gRow=mg('📊 Số phim/hàng','');var rc=s.row_count||'20';[{k:'10',n:'10'},{k:'20',n:'20'},{k:'30',n:'30'}].forEach(function(o){gRow.append(mo(o.n,'',rc===o.k,function(){ss({row_count:o.k});comp.create();}));});w.append(gRow);
        var gCat=mg('📋 Kiểu danh sách','');var ctm=s.cat_mode||'hgrid';[{k:'hgrid',n:'Ngang'},{k:'vgrid',n:'Dọc'}].forEach(function(o){gCat.append(mo(o.n,'',ctm===o.k,function(){ss({cat_mode:o.k});comp.create();}));});w.append(gCat);
        var g5=mg('🎨 Cột poster','');var cg=s.card_style||'3';[{k:'2',n:'2'},{k:'3',n:'3'},{k:'4',n:'4'}].forEach(function(o){g5.append(mo(o.n,'',cg===o.k,function(){ss({card_style:o.k});comp.create();}));});w.append(g5);
        var g6=mg('🌐 Ngôn ngữ TMDB','');var cl2=s.tmdb_lang||'vi-VN';[{k:'vi-VN',n:'Tiếng Việt'},{k:'en-US',n:'English'}].forEach(function(o){g6.append(mo(o.n,'',cl2===o.k,function(){ss({tmdb_lang:o.k});_gc={movie:null,tv:null};comp.create();}));});w.append(g6);
        var gE=mg('🎯 Nguồn Torrent','');var ce=s.torrent_engine||'torrentio';gE.append(mo('Torrentio','',ce==='torrentio',function(){ss({torrent_engine:'torrentio'});comp.create();}));gE.append(mo('AIOStreams','',ce==='aio',function(){ss({torrent_engine:'aio'});comp.create();}));w.append(gE);

        var g1=mg('🖥️ TorrServer','');
        g1.append(mi('Địa chỉ','192.168.1.100:8090',s.torrserver_host||'Chưa cài','Địa chỉ TS','torrserver_host',s));
        g1.append(mi('Mật khẩu','',s.torrserver_password?'••••':'Không','Mật khẩu','torrserver_password',s));
        var stTS=$('<div class="kk-stg-status" style="display:none"></div>');
        var tsInfoBox=$('<div class="kk-ts-info" style="display:none"></div>');
        var tTS=si2('🧪 Test kết nối & Speed','','Test');
        bE(tTS,async function(){
            var h=tsHost();if(!h){stTS.show().attr('class','kk-stg-status kk-stg-status--err').html('❌ Chưa nhập');return;}
            stTS.show().attr('class','kk-stg-status kk-stg-status--loading').html('⏳ Testing...');tsInfoBox.hide();
            var result=await tsSpeedTest();
            if(result.ok){
                stTS.attr('class','kk-stg-status kk-stg-status--ok').html('✅ '+result.msg);
                var cache=await tsCacheInfo();
                var infoHtml='';
                if(cache){
                    infoHtml+='<div class="kk-ts-row"><span class="kk-ts-key">Version</span><span class="kk-ts-val">'+E(cache.version)+'</span></div>';
                    infoHtml+='<div class="kk-ts-row"><span class="kk-ts-key">Cache</span><span class="kk-ts-val">'+(cache.cacheSize/1048576).toFixed(0)+' MB</span></div>';
                    infoHtml+='<div class="kk-ts-row"><span class="kk-ts-key">Preload</span><span class="kk-ts-val">'+(cache.preloadBuffer/1048576).toFixed(0)+' MB</span></div>';
                    infoHtml+='<div class="kk-ts-row"><span class="kk-ts-key">DLNA</span><span class="kk-ts-val">'+(cache.enableDLNA?'✅':'❌')+'</span></div>';
                }
                if(result.torrents&&result.torrents.length){
                    infoHtml+='<div style="margin-top:8px;font-weight:600;">📦 Active Torrents ('+result.torrents.length+')</div>';
                    result.torrents.slice(0,5).forEach(function(t){
                        var sz=t.size?(t.size/1073741824).toFixed(1)+' GB':'?';
                        infoHtml+='<div class="kk-ts-torrent"><div class="kk-ts-torrent-title">'+E(t.title)+'</div><div class="kk-ts-torrent-meta">'+sz+'</div></div>';
                    });
                }
                if(infoHtml)tsInfoBox.html(infoHtml).show();
            }else{stTS.attr('class','kk-stg-status kk-stg-status--err').html('❌ '+result.msg);}
        });
        g1.append(tTS).append(stTS).append(tsInfoBox);
        var tClear=si2('🗑️ Xóa tất cả torrent','Xóa cache TS','Xóa');
        bE(tClear,async function(){
            if(!tsHost()){Lampa.Noty.show('Chưa cấu hình');return;}
            Lampa.Noty.show('⏳ Đang xóa...');
            var count=await tsClearCache();
            if(count>=0)Lampa.Noty.show('✅ Đã xóa '+count+' torrent');
            else Lampa.Noty.show('❌ Lỗi');
        });
        g1.append(tClear);
        w.append(g1);

        var g2=mg('🧲 Torrentio','');g2.append(mi('Config','',s.torrentio_config||'Mặc định','Config','torrentio_config',s));
        var stTio=$('<div class="kk-stg-status" style="display:none"></div>');var tTio=si2('🧪 Test','','Test');bE(tTio,async function(){stTio.show().attr('class','kk-stg-status kk-stg-status--loading').html('⏳...');try{var parsed=cTio(tioConf());var testUrl=TIO_BASE+(parsed?'/'+parsed:'')+'/stream/movie/tt0111161.json';var r=await fetch(testUrl);if(r.ok){var d=await r.json();stTio.attr('class','kk-stg-status kk-stg-status--ok').html('✅ '+((d.streams||[]).length)+' streams');}else stTio.attr('class','kk-stg-status kk-stg-status--err').html('❌ HTTP '+r.status);}catch(e){stTio.attr('class','kk-stg-status kk-stg-status--err').html('❌ '+E(e.message||''));}});g2.append(tTio).append(stTio);w.append(g2);
        var gA=mg('🌊 AIOStreams','');gA.append(mi('URL','',s.aio_url||'Chưa cài','URL','aio_url',s));
        var stAio=$('<div class="kk-stg-status" style="display:none"></div>');var tAio=si2('🧪 Test','','Test');bE(tAio,async function(){var base=cAio(aioUrl());if(!base){stAio.show().attr('class','kk-stg-status kk-stg-status--err').html('❌ Chưa nhập');return;}stAio.show().attr('class','kk-stg-status kk-stg-status--loading').html('⏳...');try{var r=await fetch(base+'/stream/movie/tt0111161.json');if(r.ok){var d=await r.json();stAio.attr('class','kk-stg-status kk-stg-status--ok').html('✅ '+((d.streams||[]).length)+' streams');}else stAio.attr('class','kk-stg-status kk-stg-status--err').html('❌ HTTP '+r.status);}catch(e){stAio.attr('class','kk-stg-status kk-stg-status--err').html('❌ '+E(e.message||''));}});gA.append(tAio).append(stAio);w.append(gA);
        var gH=mg('🕘 Dữ liệu','');
        var c1=si2('Xóa CW',getCW().length+'','Xóa');bE(c1,function(){localStorage.removeItem(CW_KEY);Lampa.Noty.show('OK');comp.create();});
        var c2=si2('Xóa lịch sử',getHist().length+'','Xóa');bE(c2,function(){localStorage.removeItem(HIST_KEY);Lampa.Noty.show('OK');comp.create();});
        var c3=si2('Xóa tiến trình',Object.keys(getProgress()).length+'','Xóa');bE(c3,function(){localStorage.removeItem(PROG_KEY);Lampa.Noty.show('OK');comp.create();});
        gH.append(c1).append(c2).append(c3);w.append(gH);
        var g4=$('<div class="kk-stg-group"></div>');var cl=si2('🗑️ Reset','','Reset');cl.find('.kk-stg-value').css('color','#f87171');bE(cl,function(){localStorage.removeItem(STG_KEY);localStorage.removeItem(CW_KEY);localStorage.removeItem(HIST_KEY);localStorage.removeItem(PROG_KEY);_gc={movie:null,tv:null};applyFontScale();Lampa.Activity.backward();});g4.append(cl);w.append(g4);
        w.append('<div class="kk-stg-ver">KKPhim v4.3</div>');scroll.append(w);comp.start();};
        function mg(t){var g=$('<div class="kk-stg-group"></div>');g.append('<div class="kk-stg-group-title">'+t+'</div>');return g;}
        function si2(n,d,v){return $('<div class="kk-stg-item selector"><div class="kk-stg-label"><div class="kk-stg-label-name">'+E(n)+'</div>'+(d?'<div class="kk-stg-label-desc">'+E(d)+'</div>':'')+'</div><div class="kk-stg-value">'+E(v)+'</div></div>');}
        function mo(n,d,on,cb){var it=si2(n,d,on?'✅':'○');if(on)it.find('.kk-stg-value').css('color','#4ade80');bE(it,cb);return it;}
        function mi(n,d,val,prompt,key,s){var it=si2(n,d,val);bE(it,function(){try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:prompt,value:s[key]||'',free:true,nosave:true},function(v){v=(v||'').trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);});return;}}catch(e){}var v=window.prompt(prompt,s[key]||'');if(v!==null){v=v.trim();var o={};o[key]=v;ss(o);s[key]=v;it.find('.kk-stg-value').text(v||val);}});return it;}
        this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};
    });

    Lampa.Component.add('kkphim_person',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,pid=obj.person_id;this.create=function(){comp.activity.loader(true);cScr(scroll);if(!pid){comp.activity.loader(false);comp.start();return;}Promise.all([tFetch('/person/'+pid+'?language='+tmLang()),tPersonC(pid)]).then(function(res){var p=res[0],cr=res[1],w=$('<div class="kk-detail-wrap"></div>');var av=p.profile_path?optimizeImgUrl(TMDB_W500+p.profile_path):'';w.append('<div class="kk-person-header"><div class="kk-person-avatar">'+(av?'<img src="'+av+'" loading="lazy">':'')+'</div><div class="kk-person-info"><div class="kk-person-name">'+E(p.name||'')+'</div></div></div>');if(cr&&cr.cast){var mv=cr.cast.filter(function(c){return c.media_type==='movie';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var tv=cr.cast.filter(function(c){return c.media_type==='tv';}).sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});if(mv.length){var r1=$('<div class="kk-row"></div>');r1.append('<div class="kk-row-head"><div class="kk-row-title">🎬 Phim lẻ</div></div>');r1.append(mkRowList(mv.slice(0,rowCount()),false));w.append(r1);}if(tv.length){var r2=$('<div class="kk-row"></div>');r2.append('<div class="kk-row-head"><div class="kk-row-title">📺 Phim bộ</div></div>');r2.append(mkRowList(tv.slice(0,rowCount()),false));w.append(r2);}}scroll.append(w);comp.activity.loader(false);comp.start();}).catch(function(){comp.activity.loader(false);});};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    Lampa.Component.add('kkphim_main',function(){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,_s='';var cats=[{name:'Phim Mới',api:'danh-sach/phim-moi-cap-nhat'},{name:'Phim Bộ',api:'v1/api/danh-sach/phim-bo'},{name:'Phim Lẻ',api:'v1/api/danh-sach/phim-le'},{name:'Hoạt Hình',api:'v1/api/danh-sach/hoat-hinh'},{name:'TV Shows',api:'v1/api/danh-sach/tv-shows'}];this.create=function(){net.clear();this.activity.loader(true);cScr(scroll);var sc=src();_s=sc.key;var tb=$('<div class="kk-topbar"><div class="kk-topbar-title">'+E(sc.name)+'</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');bE($(tb.find('.kk-btn')[0]),oSearch);bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});scroll.append(tb);var sb=$('<div class="kk-srcbar"></div>');Object.keys(SOURCES).forEach(function(k){var s2=SOURCES[k],on=k===sc.key;var btn=$('<div class="kk-srcbtn selector '+(on?'kk-srcbtn--on':'kk-srcbtn--off')+'">'+E(s2.name)+'</div>');bE(btn,function(){if(on)return;ss({source:k});comp.create();});sb.append(btn);});var tb2=$('<div class="kk-srcbtn selector kk-srcbtn--off" style="background:rgba(1,180,228,.15);color:#01b4e4">TMDB</div>');bE(tb2,function(){Lampa.Activity.push({url:'',title:'TMDB',component:'kkphim_tmdb_main',page:1});});sb.append(tb2);scroll.append(sb);var cw=getCW();if(cw.length){var rowCW=$('<div class="kk-row"></div>');var moreCW=$('<div class="kk-row-more selector">Xóa</div>');bE(moreCW,function(){localStorage.removeItem(CW_KEY);comp.create();});rowCW.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">▶ Continue Watching</div>').append(moreCW));rowCW.append(mkCWRow(cw.slice(0,rowCount())));scroll.append(rowCW);}var cm2=cardMode(),cnt=cm2==='poster'?12:rowCount();var ci=0;function lnc(){if(ci>=cats.length){comp.activity.loader(false);comp.start();return;}var cat=cats[ci];ci++;net.silent(sApi()+cat.api+'?page=1',function(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});if(list.length){rafBatch(function(){var row=$('<div class="kk-row"></div>');var mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:cat.name,component:'kkphim_category',cat:cat,page_num:1,mode:'api'});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(cat.name)+'</div>').append(mr));row.append(mkRowList(list.slice(0,cnt),true));scroll.append(row);});}if(ci===1){comp.activity.loader(false);comp.start();}setTimeout(lnc,30);},function(){if(ci===1){comp.activity.loader(false);comp.start();}setTimeout(lnc,30);});}lnc();};this.start=function(){if(_s&&_s!==srcKey()){comp.create();return;}aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    Lampa.Component.add('kkphim_tmdb_main',function(){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var secs=[{name:'🔥 Xu hướng',lt:'trending_day'},{name:'🎬 Chiếu rạp',lt:'now_playing'},{name:'📅 Sắp chiếu',lt:'upcoming'},{name:'🌟 Phim lẻ',lt:'popular_movies'},{name:'📺 Phim bộ',lt:'popular_tv'},{name:'⭐ Top phim',lt:'top_movies'}];this.create=function(){comp.activity.loader(true);cScr(scroll);var tb=$('<div class="kk-topbar"><div class="kk-topbar-title" style="color:#01b4e4">TMDB</div><div class="kk-topbar-btns"><div class="kk-btn selector">🔍</div><div class="kk-btn selector">⚙️</div></div></div>');bE($(tb.find('.kk-btn')[0]),oTSearch);bE($(tb.find('.kk-btn')[1]),function(){Lampa.Activity.push({url:'',title:'Cài đặt',component:'kkphim_settings'});});scroll.append(tb);var sb=$('<div class="kk-srcbar"></div>');Object.keys(SOURCES).forEach(function(k){var s2=SOURCES[k];var btn=$('<div class="kk-srcbtn selector kk-srcbtn--off">'+E(s2.name)+'</div>');bE(btn,function(){ss({source:k});Lampa.Activity.push({url:'',title:'KKPhim',component:'kkphim_main',page:1});});sb.append(btn);});sb.append('<div class="kk-srcbtn kk-srcbtn--on" style="background:rgba(1,180,228,.25);color:#01b4e4">TMDB</div>');scroll.append(sb);var cw=getCW();if(cw.length){var rowCW=$('<div class="kk-row"></div>');var moreCW=$('<div class="kk-row-more selector">Xóa</div>');bE(moreCW,function(){localStorage.removeItem(CW_KEY);comp.create();});rowCW.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">▶ Continue Watching</div>').append(moreCW));rowCW.append(mkCWRow(cw.slice(0,rowCount())));scroll.append(rowCW);}var cm2=cardMode(),cnt=cm2==='poster'?12:rowCount();var si=0;function lns(){if(si>=secs.length){comp.activity.loader(false);comp.start();return;}var sec=secs[si];si++;var fn=TFN[sec.lt];if(!fn){setTimeout(lns,10);return;}fn(1).then(function(res){var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});if(items.length){rafBatch(function(){var row=$('<div class="kk-row"></div>'),mr=$('<div class="kk-row-more selector">Xem thêm</div>');bE(mr,function(){Lampa.Activity.push({url:'',title:sec.name,component:'kkphim_tmdb_list',listType:sec.lt,page_num:1});});row.append($('<div class="kk-row-head"></div>').append('<div class="kk-row-title">'+E(sec.name)+'</div>').append(mr));row.append(mkRowList(items.slice(0,cnt),false));scroll.append(row);});}if(si===1){comp.activity.loader(false);comp.start();}setTimeout(lns,30);}).catch(function(){if(si===1){comp.activity.loader(false);comp.start();}setTimeout(lns,30);});}lns();};this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    Lampa.Component.add('kkphim_tmdb_list',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1;var gc=$('<div></div>');var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');var ld=false,done=false,cg=null;this.create=function(){comp.activity.loader(true);cScr(scroll);scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'TMDB')+'</div>').append(gc).append(sp).append(em));ig();var sb=scroll.render().find('.scroll__body');sb.on('scroll',throttle(function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();},200));dl2();};function ig(){var cm=catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}function dl2(){ld=true;sp.show();var fn=TFN[obj.listType]||TFN.trending;fn(page).then(function(r){var items=(r.results||[]).filter(function(i){return i.media_type!=='person';});sp.hide();if(!items.length){done=true;em.show();}else{var cm=catMode();var cards=[];items.forEach(function(i){cards.push((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});rafBatch(function(){batchAppend(cg,cards);});page++;}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    Lampa.Component.add('kkphim_tmdb_search',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,page=obj.page_num||1,kw=obj.keyword||'';var gc=$('<div></div>');var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');var ld=false,done=false,cg=null;this.create=function(){comp.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+E(kw)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',throttle(function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();},200));dl2();};function ig(){var cm=catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}function dl2(){ld=true;sp.show();tSearchM(kw,page).then(function(r){var items=(r.results||[]).filter(function(i){return i.media_type!=='person';});sp.hide();if(!items.length){done=true;em.show();}else{var cm=catMode();var cards=[];items.forEach(function(i){cards.push((cm==='hgrid'?mkTCH(i):mkTC(i)).addClass('kk-card--grid'));});rafBatch(function(){batchAppend(cg,cards);});page++;}ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    Lampa.Component.add('kkphim_tmdb_genre',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,cgid=String(obj.genre_id||'');var gc=$('<div></div>'),ld=false,md=false,td=false,mp=1,tp=1,all=[],rs={};var cg=null;var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');function ig(){var cm=catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}this.create=function(){comp.activity.loader(true);cScr(scroll);var gb=$('<div class="kk-genre-bar"></div>');scroll.append(gb);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(obj.title||'')+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',throttle(function(){if(ld||(md&&td))return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();},200));Promise.all([lGenres('movie'),lGenres('tv')]).then(function(res){var mg2=[],sn={};(res[0]||[]).concat(res[1]||[]).forEach(function(g){if(!sn[g.id]){sn[g.id]=true;mg2.push(g);}});mg2.forEach(function(g){var on=String(g.id)===cgid;var ch=$('<div class="kk-genre-chip selector '+(on?'kk-genre-chip--on':'kk-genre-chip--off')+'">'+E(g.name)+'</div>');bE(ch,function(){Lampa.Activity.push({url:'',title:g.name,component:'kkphim_tmdb_genre',genre_id:g.id,page_num:1});});gb.append(ch);});dl2();}).catch(function(){dl2();});};function dl2(){if(ld)return;ld=true;sp.show();var ps=[];if(!md)ps.push(tDiscover('movie',cgid,mp).then(function(r){var items=r.results||[];if(!items.length)md=true;else{items.forEach(function(i){i.media_type='movie';});all=all.concat(items);mp++;}}).catch(function(){md=true;}));if(!td)ps.push(tDiscover('tv',cgid,tp).then(function(r){var items=r.results||[];if(!items.length)td=true;else{items.forEach(function(i){i.media_type='tv';});all=all.concat(items);tp++;}}).catch(function(){td=true;}));Promise.all(ps).then(function(){all.sort(function(a,b){return(b.popularity||0)-(a.popularity||0);});var cm=catMode();var cards=[];for(var i=0;i<all.length;i++){var key=all[i].media_type+'_'+all[i].id;if(!rs[key]){rs[key]=true;cards.push((cm==='hgrid'?mkTCH(all[i]):mkTC(all[i])).addClass('kk-card--grid'));}}rafBatch(function(){batchAppend(cg,cards);});sp.hide();if(md&&td)em.show();ld=false;comp.activity.loader(false);comp.start();}).catch(function(){ld=false;sp.hide();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    // ═══ TMDB Detail ═══
    Lampa.Component.add('kkphim_tmdb_detail',function(obj){var scroll=new Lampa.Scroll({mask:true,over:true}),comp=this,tid=obj.tmdb_id,mt=obj.media_type||'movie';this.create=function(){comp.activity.loader(true);cScr(scroll);if(!tid){comp.activity.loader(false);comp.start();return;}tDetFull(mt,tid).then(async function(tmdb){var logos=null;try{logos=await tImgFull(mt,tid);}catch(e){}var t=tmdb.title||tmdb.name||'',o=tmdb.original_title||tmdb.original_name||'',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);Lampa.Noty.show('Tìm nguồn...');var slugs=await fSlugs(t,o,y);bDet(tmdb,logos,slugs);}).catch(function(e){comp.activity.loader(false);Lampa.Noty.show('Lỗi: '+(e.message||''));});};
    async function bDet(tmdb,logos,slugs){cScr(scroll);var bk=tmdb.backdrop_path?optimizeImgUrl(TMDB_IMG+tmdb.backdrop_path):'';var ps=tmdb.poster_path?optimizeImgUrl(TMDB_W500+tmdb.poster_path):'';var bkW5=tmdb.backdrop_path?optimizeImgUrl(TMDB_W500+tmdb.backdrop_path):'';var t=tmdb.title||tmdb.name||'',o2=tmdb.original_title||tmdb.original_name||'';var d=tmdb.overview||'';var isF=tmdb.overview_fallback||false;var v=tmdb.vote_average?Number(tmdb.vote_average).toFixed(1):'N/A',y=(tmdb.release_date||tmdb.first_air_date||'').slice(0,4);var rt=tmdb.runtime?tmdb.runtime+' phút':'';var gs=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');var logo=pLogo(logos||(tmdb.images||{})),logoH='';if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+optimizeImgUrl(TMDB_W500+logo.file_path)+'" loading="lazy"></div>';var gh=gHtml(tmdb.genres,true),dirsArr=[],castArr=[];if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).slice(0,4);}var crewH=mkDirHtml(dirsArr,true),imdb=(tmdb.external_ids&&tmdb.external_ids.imdb_id)||null;var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';var countries=tmdb.production_countries||[];if(!countries.length&&tmdb.origin_country)countries=tmdb.origin_country.map(function(c){return{iso_3166_1:c};});var hero=mkHero(bk,ps,logoH,tH,o2,{vote:v,year:y,runtime:rt,genres:gs,countries:countries});var body=mkBody(v,y,rt,'',gh,crewH,d,isF);body.find('.kk-genre[data-gid]').each(function(){var g=$(this);bE(g,function(){Lampa.Activity.push({url:'',title:g.attr('data-gname')||'',component:'kkphim_tmdb_genre',genre_id:g.attr('data-gid'),page_num:1});});});bindDirClicks(body);var act=$('<div class="kk-actions"></div>');var bmd={name:t,origin_name:o2,slug:'',poster_url:ps,thumb_url:bkW5,year:y,tmdb:{id:tid,type:mt},category:tmdb.genres||[],type:mt==='tv'?'series':'single'};if(slugs.kkphim){var kD=$.extend({},bmd,{slug:slugs.kkphim});if(mt==='movie')act.append(bMovExp('kkphim','KKPhim',slugs.kkphim,t,'kk-src-btn--kkphim',kD,ps,bkW5));else act.append(bTVExp('kkphim','KKPhim',slugs.kkphim,t,o2,'kk-src-btn--kkphim',kD,ps,bkW5));}else act.append('<div class="kk-src-btn kk-src-btn--no">KKPhim – N/A</div>');if(slugs.ophim){var oD=$.extend({},bmd,{slug:slugs.ophim});if(mt==='movie')act.append(bMovExp('ophim','OPhim',slugs.ophim,t,'kk-src-btn--ophim',oD,ps,bkW5));else act.append(bTVExp('ophim','OPhim',slugs.ophim,t,o2,'kk-src-btn--ophim',oD,ps,bkW5));}else act.append('<div class="kk-src-btn kk-src-btn--no">OPhim – N/A</div>');act.append(bTorBtn(mt,tid,t,ps||bkW5,imdb,bmd));body.append(act);var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);if(castArr.length)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>').append(mkCastList(castArr,true)));
    // Similar
    var simI=(tmdb.similar&&tmdb.similar.results)?tmdb.similar.results.slice(0,20):[];if(simI.length){var ss2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">Phim tương tự</div>');var sl=$('<div class="kk-similar-list"></div>');var sc=[];simI.forEach(function(i){if(!i.media_type)i.media_type=mt;sc.push(mkTC(i));});batchAppend(sl,sc);ss2.append(sl);dw.append(ss2);}
    // Random TMDB Row
    var randSec=$('<div class="kk-section kk-similar"></div>');var randTitle=$('<div class="kk-block-title">🎲 Gợi ý ngẫu nhiên</div>');var randList=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');randSec.append(randTitle).append(randList);dw.append(randSec);
    setTimeout(function(){
        var rIdx=Math.floor(Math.random()*RANDOM_LISTS.length);
        var rPage=Math.floor(Math.random()*3)+1;
        var rFn=TFN[RANDOM_LISTS[rIdx]];
        var rNames={trending:'🔥 Trending',popular_movies:'🌟 Phim hot',popular_tv:'📺 TV hot',top_movies:'⭐ Top phim',top_tv:'⭐ Top TV',now_playing:'🎬 Đang chiếu',airing_today:'📡 Phát hôm nay'};
        randTitle.text(rNames[RANDOM_LISTS[rIdx]]||'🎲 Gợi ý');
        if(rFn)rFn(rPage).then(function(res){
            var items=(res.results||[]).filter(function(i){return i.media_type!=='person'&&i.id!==tid;});randList.empty();
            if(items.length){var cards=[];items.slice(0,20).forEach(function(i){if(!i.media_type)i.media_type=mt==='tv'?'tv':'movie';cards.push(mkTC(i));});batchAppend(randList,cards);}else randList.html('Không có');
        }).catch(function(){randList.empty();});
    },600);
    scroll.append(dw);comp.activity.loader(false);comp.start();}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){scroll.destroy();};});

    Lampa.Component.add('kkphim_category',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var page=obj.page_num||1,title=obj.title||(obj.cat&&obj.cat.name)||'',mode=obj.mode||'api',apiPath=obj.cat?obj.cat.api:null,catSlug=obj.category_slug||'';var gc=$('<div></div>'),ld=false,done=false,cg=null;var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');function ig(){var cm=catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}this.create=function(){this.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">'+E(title)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',throttle(function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();},200));dl2();};function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});sp.hide();if(!list.length){done=true;em.show();comp.activity.loader(false);ld=false;comp.start();return;}var cm=catMode();var cards=[];list.forEach(function(i){cards.push((cm==='hgrid'?mkCH(i):mkC(i)).addClass('kk-card--grid'));});rafBatch(function(){batchAppend(cg,cards);});page++;ld=false;comp.activity.loader(false);comp.start();}function dl2(){ld=true;sp.show();var url=(mode==='category'&&catSlug)?sApi()+'v1/api/the-loai/'+catSlug+'?page='+page:sApi()+apiPath+'?page='+page;net.silent(url,hr,function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    Lampa.Component.add('kkphim_search',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),comp=this;var kw=obj.keyword||'',page=obj.page_num||1;var gc=$('<div></div>'),ld=false,done=false,cg=null;var sp=$('<div class="kk-row-loading" style="display:none"><div class="kk-row-spinner"></div></div>');var em=$('<div class="kk-loadmore" style="display:none">Đã hết</div>');function ig(){var cm=catMode();if(cm==='hgrid')cg=$('<div class="kk-grid kk-grid--cat-h"></div>');else{cg=$('<div class="kk-grid"></div>');cg.css('grid-template-columns','repeat('+cardSt()+',minmax(0,1fr))');}gc.empty().append(cg);}this.create=function(){this.activity.loader(true);cScr(scroll);ig();scroll.append($('<div class="kk-grid-wrap"></div>').append('<div class="kk-grid-title">🔍 '+E(kw)+'</div>').append(gc).append(sp).append(em));var sb=scroll.render().find('.scroll__body');sb.on('scroll',throttle(function(){if(ld||done)return;var el=sb[0];if(el.scrollTop+el.clientHeight>=el.scrollHeight-400)dl2();},200));dl2();};function hr(res){var list=((res&&res.items)||(res&&res.data&&res.data.items)||[]).map(nm).filter(function(i){return i&&i.slug;});sp.hide();if(!list.length){done=true;em.show();comp.activity.loader(false);ld=false;comp.start();return;}var cm=catMode();var cards=[];list.forEach(function(i){cards.push((cm==='hgrid'?mkCH(i):mkC(i)).addClass('kk-card--grid'));});rafBatch(function(){batchAppend(cg,cards);});page++;ld=false;comp.activity.loader(false);comp.start();}function dl2(){ld=true;sp.show();net.silent(sApi()+'v1/api/tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){net.silent(sApi()+'tim-kiem?keyword='+encodeURIComponent(kw)+'&page='+page,hr,function(){ld=false;sp.hide();em.show();comp.activity.loader(false);});});}this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});

    Lampa.Component.add('kkphim_detail',function(obj){var net=new Lampa.Reguest(),scroll=new Lampa.Scroll({mask:true,over:true}),movie=nm(obj.movie),comp=this,rnd=false;this.create=function(){this.activity.loader(true);cScr(scroll);rnd=false;if(!movie||!movie.slug){this.activity.loader(false);comp.start();return;}saveHistory(movie);net.silent(sApi()+'phim/'+movie.slug,function(res){if(rnd)return;ldAll(nm(res.movie||res||{}),res.episodes||[],res.movie||res||{});},function(){comp.activity.loader(false);});};
    async function ldAll(data,eps,rawMovie){if(!data||!data.slug)data=movie;saveHistory(data);try{var tid=gTid(data),tt=dType(data),tmdb=null,logos=null;if(tid){try{tmdb=await tFetchFB('/'+tt+'/'+tid+'?language='+tmLang()+'&append_to_response=credits,images',true);}catch(e){}try{logos=await tFetch('/'+tt+'/'+tid+'/images');}catch(e){}}if(!rnd){bld(data,eps,tmdb,logos,tt,rawMovie);rnd=true;}}catch(e){if(!rnd){bld(data,eps,null,null,dType(data),rawMovie);rnd=true;}}comp.activity.loader(false);comp.start();}
    function bld(data,eps,tmdb,logos,tt,rawMovie){cScr(scroll);var bk=optimizeImgUrl(fImg(data.thumb_url||data.poster_url)),ps=optimizeImgUrl(fImg(data.poster_url||data.thumb_url));var t=data.name||'',o2=data.origin_name||'',d=cDesc(data.content);var v=(data.tmdb&&data.tmdb.vote_average)||'N/A',y=data.year||'',rt=data.time||'';var dirsArr=[],castArr=[],logoH='',gs='',isF=false;if(tmdb){if(tmdb.backdrop_path)bk=optimizeImgUrl(TMDB_IMG+tmdb.backdrop_path);if(tmdb.poster_path)ps=optimizeImgUrl(TMDB_IMG+tmdb.poster_path);if(tmdb.title||tmdb.name)t=tmdb.title||tmdb.name;if(tmdb.overview){d=tmdb.overview;isF=tmdb.overview_fallback||false;}if(tmdb.vote_average)v=Number(tmdb.vote_average).toFixed(1);if(tmdb.release_date)y=tmdb.release_date.slice(0,4);if(tmdb.runtime)rt=tmdb.runtime+' phút';gs=(tmdb.genres||[]).slice(0,3).map(function(g){return g.name;}).join(' | ');var logo=pLogo(logos||tmdb.images);if(logo&&logo.file_path)logoH='<div class="kk-logo"><img src="'+optimizeImgUrl(TMDB_W500+logo.file_path)+'" loading="lazy"></div>';if(tmdb.credits){castArr=(tmdb.credits.cast||[]).slice(0,15);dirsArr=(tmdb.credits.crew||[]).filter(function(c){return c.job==='Director'||c.job==='Creator';}).slice(0,4);}}if(!dirsArr.length&&data.director){var dn=Array.isArray(data.director)?data.director:[String(data.director)];dirsArr=dn.filter(Boolean).map(function(n){return{name:n,id:null};});}if(!gs&&data.category&&data.category.length)gs=data.category.slice(0,3).map(function(c2){return c2.name||'';}).join(' | ');var countries=[];if(tmdb){countries=tmdb.production_countries||[];if(!countries.length&&tmdb.origin_country)countries=tmdb.origin_country.map(function(c){return{iso_3166_1:c};});}if(!countries.length&&rawMovie&&rawMovie.country){var rc=rawMovie.country;if(Array.isArray(rc))countries=rc.map(function(c){return{iso_3166_1:(c.slug||'').toUpperCase(),name:c.name||''};});}var hasTmdb=!!gTid(data),crewH=mkDirHtml(dirsArr,hasTmdb),gh=gHtml(data.category,false);var tH=logoH?'':'<div class="kk-title">'+E(t)+'</div>';var hero=mkHero(bk,ps,logoH,tH,o2,{vote:v,year:y,runtime:rt,genres:gs,countries:countries});var body=mkBody(v,y,rt,'',gh,crewH,d||'Không có mô tả',isF);body.find('.kk-genre[data-slug]').each(function(){var g=$(this);bE(g,function(){var slug=g.attr('data-slug');if(slug)Lampa.Activity.push({url:'',title:g.attr('data-title')||'',component:'kkphim_category',mode:'category',category_slug:slug,page_num:1});});});bindDirClicks(body);var act=$('<div class="kk-actions"></div>'),cSrc=src(),sCss=cSrc.key==='kkphim'?'kk-src-btn--kkphim':'kk-src-btn--ophim';
    // ✅ FIX: đóng đúng dấu nháy kép cho class attribute
    if(eps&&eps.length)act.append(bDetExp(eps,data.name||t,cSrc.name,sCss,data,ps,bk));else act.append('<div class="kk-src-btn kk-src-btn--no">⚠️ Không có tập</div>');
    if(hasTmdb)act.append(bTorBtn(tt,gTid(data),data.name||t,ps||bk,null,data));body.append(act);var dw=$('<div class="kk-detail-wrap"></div>').append(hero).append(body);if(castArr.length)dw.append($('<div class="kk-section"><div class="kk-block-title">Diễn viên</div></div>').append(mkCastList(castArr,hasTmdb)));
    // Related
    var pCats=data.category||[];if(pCats.length&&pCats[0]&&pCats[0].slug){var rs2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">📺 Phim liên quan</div>');var rl2=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');rs2.append(rl2);dw.append(rs2);setTimeout(function(){fetch(sApi()+'v1/api/the-loai/'+pCats[0].slug+'?page=1').then(function(r){return r.json();}).then(function(res){var items=((res&&res.data&&res.data.items)||(res&&res.items)||[]).map(nm).filter(function(i){return i&&i.slug&&i.slug!==data.slug;});rl2.empty();if(items.length){var cards=[];items.slice(0,20).forEach(function(i){cards.push(mkC(i));});batchAppend(rl2,cards);}else rl2.html('Không có');}).catch(function(){rl2.empty();});},300);}
    // TMDB similar
    if(hasTmdb){
        // ✅ FIX: đóng đúng dấu nháy kép cho class attribute
        var ts2=$('<div class="kk-section kk-similar"></div>').append('<div class="kk-block-title">🎬 TMDB gợi ý</div>');
        var tl=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');ts2.append(tl);dw.append(ts2);setTimeout(function(){tSimilar(tt,gTid(data),1).then(function(res){var items=(res.results||[]).slice(0,20);tl.empty();if(items.length){var cards=[];items.forEach(function(i){if(!i.media_type)i.media_type=tt;cards.push(mkTC(i));});batchAppend(tl,cards);}else tl.html('Không có');}).catch(function(){tl.empty();});},500);
    // Random row
    var randSec=$('<div class="kk-section kk-similar"></div>');var randList=$('<div class="kk-similar-list"><div class="kk-ep-ld">⏳</div></div>');var rIdx=Math.floor(Math.random()*RANDOM_LISTS.length);var rNames={trending:'🔥 Trending',popular_movies:'🌟 Phim hot',popular_tv:'📺 TV hot',top_movies:'⭐ Top phim',top_tv:'⭐ Top TV',now_playing:'🎬 Đang chiếu',airing_today:'📡 Phát hôm nay'};randSec.append('<div class="kk-block-title">'+(rNames[RANDOM_LISTS[rIdx]]||'🎲 Gợi ý')+'</div>').append(randList);dw.append(randSec);setTimeout(function(){var rFn=TFN[RANDOM_LISTS[rIdx]];var rPage=Math.floor(Math.random()*3)+1;if(rFn)rFn(rPage).then(function(res){var items=(res.results||[]).filter(function(i){return i.media_type!=='person';});randList.empty();if(items.length){var cards=[];items.slice(0,20).forEach(function(i){if(!i.media_type)i.media_type=tt;cards.push(mkTC(i));});batchAppend(randList,cards);}}).catch(function(){randList.empty();});},800);}
    scroll.append(dw);}
    this.start=function(){aCtrl(scroll);eScr(scroll);};this.pause=function(){};this.stop=function(){};this.render=function(){return scroll.render();};this.destroy=function(){net.clear();scroll.destroy();};});
}

if(window.appready)startPlugin();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')startPlugin();});
})();