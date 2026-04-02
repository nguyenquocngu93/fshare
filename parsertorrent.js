/* Torrent Parser v1.4 - Fixed */
(function(){
'use strict';
if(window.TorrentParser)return;

var TIO='https://torrentio.strem.fun';
var FETCH_TIMEOUT=15000;
var TS_POLL_INTERVAL=1000;
var TS_POLL_MAX=15;

// ══════════════════════════════════════════════════════════════
// SAFE FETCH WITH TIMEOUT
// ══════════════════════════════════════════════════════════════
function fetchWithTimeout(url,options,timeout){
    timeout=timeout||FETCH_TIMEOUT;
    return new Promise(function(resolve,reject){
        var controller=new AbortController();
        var id=setTimeout(function(){
            controller.abort();
            reject(new Error('Timeout after '+timeout+'ms'));
        },timeout);
        options=options||{};
        options.signal=controller.signal;
        fetch(url,options).then(function(r){
            clearTimeout(id);
            resolve(r);
        }).catch(function(e){
            clearTimeout(id);
            if(e.name==='AbortError')reject(new Error('Timeout after '+timeout+'ms'));
            else reject(e);
        });
    });
}

// ══════════════════════════════════════════════════════════════
// HTML ESCAPE - Full protection including attributes
// ══════════════════════════════════════════════════════════════
function E(s){
    return String(s||'')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#x27;')
        .replace(/`/g,'&#x60;');
}

// ══════════════════════════════════════════════════════════════
// SETTINGS - Simple localStorage only
// ══════════════════════════════════════════════════════════════
var SK='torrent_parser_stg';

function ls(){
    try{
        return JSON.parse(localStorage.getItem(SK))||{};
    }catch(e){
        console.warn('[TP] Settings read failed:',e);
        return{};
    }
}

function gs(k,d){
    var s=ls();
    if(s[k]!==undefined&&s[k]!=='')return s[k];
    var old=['kkphim_v5','kkphim_stg','kkphim_settings'];
    var keyMap={
        engine:['torrent_engine','t_eng'],
        tio:['torrentio_config','tio_cfg','tio_config'],
        aio:['aio_url'],
        ts:['ts_host','torrserver_host'],
        pw:['ts_pw','torrserver_password']
    };
    var tries=keyMap[k]||[k];
    for(var i=0;i<old.length;i++){
        try{
            var o=JSON.parse(localStorage.getItem(old[i])||'{}');
            for(var j=0;j<tries.length;j++){
                if(o[tries[j]]!==undefined&&o[tries[j]]!=='')return o[tries[j]];
            }
        }catch(e){}
    }
    return d||'';
}

function ss(k,v){
    try{
        var s=ls();
        s[k]=v;
        localStorage.setItem(SK,JSON.stringify(s));
    }catch(e){
        console.error('[TP] Settings save failed:',e);
        try{Lampa.Noty.show('⚠️ Lưu thất bại');}catch(e2){}
    }
}

function getEngine(){return gs('engine','torrentio');}
function getTsHost(){return gs('ts','');}
function getTsPw(){return gs('pw','');}

function getTioConfig(){
    var c=gs('tio','');
    if(!c)return'';
    c=String(c).trim();
    var m=c.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||
        c.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i);
    if(m)return m[1];
    if(c.indexOf('torrentio')>-1)return'';
    return c.replace(/^\/+|\/+$/g,'');
}

function getAioUrl(){
    var u=gs('aio','');
    if(!u)return'';
    return String(u).trim()
        .replace(/\/manifest\.json\s*$/i,'')
        .replace(/\/+$/,'');
}

function tsUrl(p){
    var h=getTsHost();
    if(!h)return'';
    h=h.replace(/\/+$/,'');
    if(h.indexOf('http')!==0)h='http://'+h;
    return h+p;
}

function tsHeaders(){
    var h={'Content-Type':'application/json'};
    var p=getTsPw();
    if(p)h['Authorization']='Basic '+btoa('admin:'+p);
    return h;
}

// ══════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ══════════════════════════════════════════════════════════════
function validateImdb(id){
    if(!id||!/^tt\d{1,15}$/.test(String(id)))throw new Error('Invalid IMDB ID: '+String(id));
    return String(id);
}

function validateNum(v,name){
    var n=parseInt(v,10);
    if(isNaN(n)||n<0||n>9999)throw new Error('Invalid '+name+': '+String(v));
    return String(n);
}

function validateUrl(u){
    try{
        var url=new URL(u);
        if(url.protocol!=='http:'&&url.protocol!=='https:')throw new Error('Invalid protocol');
        return url.toString();
    }catch(e){
        throw new Error('Invalid URL: '+String(u).substring(0,100));
    }
}

// ══════════════════════════════════════════════════════════════
// SIZE HELPERS (Binary units - correct)
// ══════════════════════════════════════════════════════════════
var SIZE_TB=1099511627776; // 1024^4
var SIZE_GB=1073741824;    // 1024^3
var SIZE_MB=1048576;       // 1024^2

function parseSizeToBytes(sz){
    if(!sz)return 0;
    var m=String(sz).match(/([\d.,]+)\s*(TB|GB|MB)/i);
    if(!m)return 0;
    var n=parseFloat(m[1].replace(',','.'));
    var unit=m[2].toUpperCase();
    if(unit==='TB')return Math.round(n*SIZE_TB);
    if(unit==='GB')return Math.round(n*SIZE_GB);
    if(unit==='MB')return Math.round(n*SIZE_MB);
    return 0;
}

function formatBytes(bytes){
    if(bytes>=SIZE_GB)return(bytes/SIZE_GB).toFixed(1)+' GB';
    if(bytes>=SIZE_MB)return(bytes/SIZE_MB).toFixed(0)+' MB';
    return '';
}

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parse(st){
    if(!st||typeof st!=='object')return null;

    var rn=String(st.name||'');
    var rd=String(st.description||'');
    var ra=rn+'\n'+rd;
    var name=rn.split('\n')[0].trim()||'?';
    var q='',sz='',sd='',src='',codec='',audio='',fn='';

    // Quality
    var qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm){
        var qs={};
        qm.forEach(function(x){qs[x.toUpperCase()]=1;});
        q=Object.keys(qs).join(' ');
    }

    // Size
    var sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2].toUpperCase():sm[1];

    // Seeds
    var se=ra.match(/👤\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);
    if(se)sd=se[1];

    // Source
    var srm=ra.match(/🔗\s*([\w.\-]+)/i)||ra.match(/\[([A-Z0-9.\-]+)\]/);
    if(srm)src=srm[1];

    // Codec
    var cm=ra.match(/\b(x265|x264|HEVC|AV1)\b/i);
    if(cm)codec=cm[1].toUpperCase();

    // Audio
    var am=ra.match(/\b(DTS-HD|DTS|Atmos|TrueHD|DD5\.1|AAC|EAC3)\b/i);
    if(am)audio=am[1];

    // Behavior hints
    if(st.behaviorHints&&typeof st.behaviorHints==='object'){
        var bh=st.behaviorHints;
        if(bh.filename)fn=String(bh.filename);
        if(!sz&&bh.videoSize){
            var b=Number(bh.videoSize);
            if(b>0){sz=formatBytes(b);}
        }
        if(!q&&fn){
            var fq=fn.match(/\b(2160p|4K|1080p|720p)\b/i);
            if(fq)q=fq[1].toUpperCase();
        }
        if(!codec&&fn){
            var fc=fn.match(/\b(x265|HEVC|x264|AV1)\b/i);
            if(fc)codec=fc[1].toUpperCase();
        }
    }

    var seedNum=parseInt(sd,10)||0;
    var sizeBytes=parseSizeToBytes(sz);
    var qScore=0;
    if(q.match(/2160|4K|UHD/))qScore=4;
    else if(q.match(/1080/))qScore=3;
    else if(q.match(/720/))qScore=2;
    else if(q.match(/480/))qScore=1;

    // Validate hash if present
    var hash=st.infoHash?String(st.infoHash):'';
    if(hash&&!/^[a-fA-F0-9]{40}$/.test(hash)){
        console.warn('[TP] Invalid hash skipped:',hash.substring(0,20));
        hash='';
    }

    // Validate URL if present
    var url=st.url?String(st.url):'';
    if(url){
        try{validateUrl(url);}catch(e){
            console.warn('[TP] Invalid stream URL skipped');
            url='';
        }
    }

    // Validate fileIdx
    var fi=st.fileIdx;
    if(fi!==undefined&&fi!==null){
        fi=parseInt(fi,10);
        if(isNaN(fi)||fi<0)fi=0;
    }else{
        fi=0;
    }

    return{
        title:name,url:url,hash:hash,fi:fi,
        q:q,sz:sz,sd:sd,src:src,codec:codec,audio:audio,fn:fn,
        seedNum:seedNum,sizeBytes:sizeBytes,qScore:qScore
    };
}

// ══════════════════════════════════════════════════════════════
// FETCH STREAMS
// ══════════════════════════════════════════════════════════════
async function getStreams(type,imdb,s,e){
    var eng=getEngine();
    var t=type==='tv'?'series':'movie';

    // Validate inputs
    var validImdb=validateImdb(imdb);
    var id=validImdb;
    if(type==='tv'&&s&&e){
        var vs=validateNum(s,'season');
        var ve=validateNum(e,'episode');
        id=validImdb+':'+vs+':'+ve;
    }

    var url;
    if(eng==='aio'){
        var base=getAioUrl();
        if(!base)throw new Error('AIO chưa cấu hình');
        url=validateUrl(base+'/stream/'+t+'/'+id+'.json');
    }else{
        var cfg=getTioConfig();
        var tioUrl=TIO+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';
        url=validateUrl(tioUrl);
    }

    var r=await fetchWithTimeout(url);
    if(!r.ok)throw new Error(eng+' HTTP '+r.status);

    var d;
    try{
        d=await r.json();
    }catch(e){
        throw new Error('Invalid JSON from '+eng);
    }

    if(!d||!Array.isArray(d.streams)){
        return[];
    }

    var results=[];
    for(var i=0;i<d.streams.length;i++){
        var parsed=parse(d.streams[i]);
        if(parsed&&(parsed.url||parsed.hash)){
            results.push(parsed);
        }
    }
    return results;
}

// ══════════════════════════════════════════════════════════════
// TORRSERVER POLLING
// ══════════════════════════════════════════════════════════════
async function waitForTorrent(hash){
    for(var i=0;i<TS_POLL_MAX;i++){
        await new Promise(function(ok){setTimeout(ok,TS_POLL_INTERVAL);});
        try{
            var r=await fetchWithTimeout(tsUrl('/torrents'),{
                method:'POST',
                headers:tsHeaders(),
                body:JSON.stringify({action:'get',hash:hash})
            },5000);
            if(r.ok){
                var data=await r.json();
                if(data&&data.hash){
                    // Check if torrent has file stats
                    if(data.file_stats&&data.file_stats.length>0){
                        return true;
                    }
                }
            }
        }catch(e){
            // Continue polling
        }
    }
    // Return true anyway - player will buffer
    console.warn('[TP] Torrent poll timeout, attempting play anyway');
    return true;
}

// ══════════════════════════════════════════════════════════════
// PLAY
// ══════════════════════════════════════════════════════════════
async function play(stream,title,poster){
    try{
        if(stream.hash&&getTsHost()){
            Lampa.Noty.show('Gửi TorrServer...');
            var mag='magnet:?xt=urn:btih:'+encodeURIComponent(stream.hash)+
                '&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');

            var addUrl=tsUrl('/torrents');
            var r=await fetchWithTimeout(addUrl,{
                method:'POST',
                headers:tsHeaders(),
                body:JSON.stringify({
                    action:'add',
                    link:mag,
                    title:String(title||''),
                    poster:String(poster||''),
                    save_to_db:false
                })
            },10000);

            if(!r.ok)throw new Error('TorrServer HTTP '+r.status);

            var td;
            try{td=await r.json();}catch(e){throw new Error('TorrServer invalid response');}

            var hash=(td&&td.hash)?td.hash:stream.hash;

            // Poll until ready instead of fixed delay
            await waitForTorrent(hash);

            var fi=parseInt(stream.fi,10)||0;
            var playUrl=tsUrl('/stream/fname?link='+encodeURIComponent(hash)+'&index='+fi+'&play');

            Lampa.Player.play({
                title:String(title||''),
                url:playUrl
            });
            return;
        }

        if(stream.url){
            Lampa.Player.play({
                title:String(title||''),
                url:stream.url
            });
            return;
        }

        Lampa.Noty.show(stream.hash?'Cần cấu hình TorrServer':'Không có link phát');
    }catch(e){
        console.error('[TP] Play error:',e);
        Lampa.Noty.show('❌ Lỗi: '+(e.message||'Unknown'));
    }
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
var CSS_TEXT='\
.tp-wrap{padding:0.5em 0}\
.tp-hdr{display:flex;align-items:center;justify-content:space-between;padding:0.5em 0;margin-bottom:0.5em;flex-wrap:wrap;gap:0.5em}\
.tp-cnt{color:rgba(255,255,255,0.5);font-size:0.85em}\
.tp-sort{display:flex;gap:0.3em;flex-wrap:wrap}\
.tp-sb{padding:0.25em 0.6em;border-radius:1em;font-size:0.7em;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);border:1px solid transparent}\
.tp-sb.on{background:rgba(33,150,243,0.2);color:#64b5f6;border-color:rgba(33,150,243,0.4)}\
.tp-ls{display:flex;flex-direction:column;gap:0.4em}\
.tp-c{display:flex;flex-direction:column;gap:0.35em;padding:0.7em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:0.5em}\
.tp-c.focus{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2)}\
.tp-r1{display:flex;align-items:center;gap:0.4em;flex-wrap:wrap}\
.tp-b{padding:0.1em 0.4em;border-radius:0.25em;font-size:0.7em;font-weight:bold}\
.tp-bq{background:rgba(76,175,80,0.2);color:#81c784}\
.tp-b4{background:rgba(255,152,0,0.2);color:#ffb74d}\
.tp-b1{background:rgba(33,150,243,0.2);color:#64b5f6}\
.tp-b7{background:rgba(156,39,176,0.2);color:#ce93d8}\
.tp-bc{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6)}\
.tp-ba{background:rgba(233,30,99,0.15);color:#f48fb1}\
.tp-ts{background:rgba(76,175,80,0.15);color:#66bb6a;padding:0.1em 0.4em;border-radius:0.25em;font-size:0.65em;margin-left:auto}\
.tp-nm{color:rgba(255,255,255,0.8);font-size:0.85em;line-height:1.3}\
.tp-r2{display:flex;gap:0.7em;flex-wrap:wrap;font-size:0.78em;color:rgba(255,255,255,0.4)}\
.tp-sg{color:#81c784}.tp-sw{color:#ffb74d}.tp-sd{color:#e57373}\
.tp-sz{color:#90caf9}\
.tp-fn{color:rgba(255,255,255,0.25);font-size:0.7em;word-break:break-all;max-height:1.5em;overflow:hidden}\
.tp-em{text-align:center;padding:2em;color:rgba(255,255,255,0.3)}\
.tp-si{padding:0.8em;margin:0.4em 0;background:rgba(255,255,255,0.05);border-radius:0.5em}\
.tp-si-n{color:#fff;font-size:1em}.tp-si-d{color:rgba(255,255,255,0.4);font-size:0.8em;margin-top:0.15em}\
.tp-si-v{color:#4ade80;font-size:0.85em;margin-top:0.2em}\
.tp-btn{padding:0.8em;margin:0.4em 0;border-radius:0.5em;text-align:center}';

function css(){
    if(document.getElementById('tp-css'))return;
    var style=document.createElement('style');
    style.id='tp-css';
    style.textContent=CSS_TEXT;
    document.head.appendChild(style);
}

// ══════════════════════════════════════════════════════════════
// STREAM CARD
// ══════════════════════════════════════════════════════════════
function qCls(q){
    if(!q)return'tp-bq';
    if(q.match(/2160|4K|UHD/))return'tp-b4';
    if(q.match(/1080/))return'tp-b1';
    if(q.match(/720/))return'tp-b7';
    return'tp-bq';
}

function mkCard(s,title,poster){
    var ts=!!getTsHost();
    var sn=s.seedNum;
    var sc=sn>=10?'tp-sg':sn>=3?'tp-sw':'tp-sd';

    // Build card using DOM methods to avoid injection
    var card=$('<div class="tp-c selector"></div>');

    // Row 1 - badges
    var r1=$('<div class="tp-r1"></div>');
    if(s.q){
        $('<span class="tp-b"></span>').addClass(qCls(s.q)).text(s.q).appendTo(r1);
    }
    if(s.codec){
        $('<span class="tp-b tp-bc"></span>').text(s.codec).appendTo(r1);
    }
    if(s.audio){
        $('<span class="tp-b tp-ba"></span>').text(s.audio).appendTo(r1);
    }
    if(ts&&s.hash){
        $('<span class="tp-ts"></span>').text('→TS').appendTo(r1);
    }
    card.append(r1);

    // Name
    $('<div class="tp-nm"></div>').text(s.title).appendTo(card);

    // Row 2 - meta
    var r2=$('<div class="tp-r2"></div>');
    if(s.sd){
        $('<span></span>').addClass(sc).text('👤 '+s.sd).appendTo(r2);
    }
    if(s.sz){
        $('<span class="tp-sz"></span>').text('💾 '+s.sz).appendTo(r2);
    }
    if(s.src){
        $('<span></span>').text('🔗 '+s.src).appendTo(r2);
    }
    card.append(r2);

    // Filename
    if(s.fn){
        var fnText=s.fn.length>70?s.fn.substring(0,70)+'…':s.fn;
        $('<div class="tp-fn"></div>').text('📁 '+fnText).appendTo(card);
    }

    // Click handler with error catching
    card.on('hover:enter',function(){
        play(s,title,poster).catch(function(e){
            console.error('[TP] Play error:',e);
            Lampa.Noty.show('❌ '+(e.message||'Lỗi'));
        });
    });

    return card;
}

// ══════════════════════════════════════════════════════════════
// SORTING
// ══════════════════════════════════════════════════════════════
var SORTS={
    seeds:function(a,b){return b.seedNum-a.seedNum;},
    quality:function(a,b){return b.qScore-a.qScore||b.seedNum-a.seedNum;},
    size_d:function(a,b){return b.sizeBytes-a.sizeBytes;},
    size_a:function(a,b){return a.sizeBytes-b.sizeBytes;}
};

function renderList(box,streams,title,poster,sk){
    sk=sk||'seeds';
    box.empty();

    var sorted=streams.slice().sort(SORTS[sk]||SORTS.seeds);

    // Header
    var hdr=$('<div class="tp-hdr"></div>');
    $('<span class="tp-cnt"></span>').text(streams.length+' streams').appendTo(hdr);

    var sortBox=$('<div class="tp-sort"></div>');
    var sortButtons=[
        {k:'seeds',n:'👤 Seeds'},
        {k:'quality',n:'🎬 Quality'},
        {k:'size_d',n:'💾 Lớn→Nhỏ'},
        {k:'size_a',n:'💾 Nhỏ→Lớn'}
    ];

    sortButtons.forEach(function(s){
        var btn=$('<div class="tp-sb selector"></div>').text(s.n);
        if(sk===s.k)btn.addClass('on');
        btn.on('hover:enter',function(){
            renderList(box,streams,title,poster,s.k);
        });
        sortBox.append(btn);
    });
    hdr.append(sortBox);
    box.append(hdr);

    // List
    var list=$('<div class="tp-ls"></div>');
    sorted.forEach(function(s){
        list.append(mkCard(s,title,poster));
    });
    box.append(list);
}

// ══════════════════════════════════════════════════════════════
// PUBLIC DISPLAY FUNCTIONS
// ══════════════════════════════════════════════════════════════
function showInContainer(container,streams,title,poster){
    css();
    if(!streams||!streams.length){
        container.empty();
        $('<div class="tp-em"></div>').text('❌ Không tìm thấy torrent').appendTo(container);
        return;
    }
    var wrap=$('<div class="tp-wrap"></div>');
    renderList(wrap,streams,title,poster,'seeds');
    container.empty().append(wrap);
}

function showStreams(streams,title,poster){
    if(!streams||!streams.length){
        Lampa.Noty.show('Không có stream');
        return;
    }
    Lampa.Activity.push({
        url:'',
        title:'🧲 '+String(title||''),
        component:'tp_page',
        _s:streams,
        _t:String(title||''),
        _p:String(poster||''),
        page:1
    });
}

// ══════════════════════════════════════════════════════════════
// SCROLL CONTROLLER - Fixed Navigator reference
// ══════════════════════════════════════════════════════════════
function initScroll(sc){
    var body=sc.render();

    Lampa.Controller.add('content',{
        toggle:function(){
            Lampa.Controller.collectionSet(body);
            Lampa.Controller.collectionFocus(false,body);
        },
        left:function(){
            if(Lampa.Controller.own(this).canmove('left')){
                Lampa.Controller.own(this).move('left');
            }else{
                Lampa.Controller.toggle('menu');
            }
        },
        right:function(){
            Lampa.Controller.own(this).move('right');
        },
        up:function(){
            if(Lampa.Controller.own(this).canmove('up')){
                Lampa.Controller.own(this).move('up');
            }else{
                Lampa.Controller.toggle('head');
            }
        },
        down:function(){
            Lampa.Controller.own(this).move('down');
        },
        back:function(){
            Lampa.Activity.backward();
        }
    });

    setTimeout(function(){
        Lampa.Controller.toggle('content');
    },0);

    // Fix scroll body styles
    var el=sc.render();
    el.css({overflow:'hidden',position:'relative',height:'100%'});
    var b=el.find('.scroll__body');
    if(b.length&&b[0]){
        var styles={
            'transform':'none',
            'overflow-y':'auto',
            'overflow-x':'hidden',
            'height':'100%',
            'padding-bottom':'8em',
            'touch-action':'pan-y'
        };
        for(var prop in styles){
            if(styles.hasOwnProperty(prop)){
                b[0].style.setProperty(prop,styles[prop],'important');
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════

// Streams page component
Lampa.Component.add('tp_page',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true});
    var comp=this;

    this.create=function(){
        css();
        try{sc.render().find('.scroll__body').empty();}catch(e){}

        var w=$('<div style="padding:0.5em"></div>');

        var header=$('<div></div>').css({
            'font-size':'1.2em',
            'font-weight':'bold',
            'color':'#fff',
            'margin-bottom':'0.5em'
        }).text('🧲 '+(obj._t||''));
        w.append(header);

        var box=$('<div></div>');
        w.append(box);
        renderList(box,obj._s||[],obj._t||'',obj._p||'','seeds');

        sc.append(w);
        comp.start();
    };

    this.start=function(){initScroll(sc);};
    this.pause=function(){};
    this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// Settings page component
Lampa.Component.add('tp_stg',function(){
    var sc=new Lampa.Scroll({mask:true,over:true});
    var comp=this;

    this.create=function(){
        css();
        try{sc.render().find('.scroll__body').empty();}catch(e){}

        var w=$('<div style="padding:1.5em"></div>');

        $('<div></div>').css({
            'font-size':'1.4em',
            'font-weight':'bold',
            'margin-bottom':'1em',
            'color':'#fff'
        }).text('🧲 Torrent Settings').appendTo(w);

        // Setting item builder
        function mkItem(name,desc,key,type,vals){
            var val=gs(key,'');
            var show=val||(key==='engine'?'torrentio':'Chưa cài');
            if(key==='pw'&&val)show='••••';

            var el=$('<div class="tp-si selector"></div>');
            $('<div class="tp-si-n"></div>').text(name).appendTo(el);
            $('<div class="tp-si-d"></div>').text(desc).appendTo(el);
            var valEl=$('<div class="tp-si-v"></div>').text(show).appendTo(el);

            el.on('hover:enter',function(){
                if(type==='select'){
                    Lampa.Select.show({
                        title:name,
                        items:vals.map(function(v){
                            return{title:v.n+(val===v.k?' ✅':''),value:v.k};
                        }),
                        onSelect:function(a){
                            ss(key,a.value);
                            val=a.value;
                            valEl.text(a.value);
                            Lampa.Noty.show('✅ '+a.value);
                        },
                        onBack:function(){
                            Lampa.Controller.toggle('content');
                        }
                    });
                }else{
                    try{
                        Lampa.Input.edit({
                            title:name,
                            value:val||'',
                            free:true,
                            nosave:true
                        },function(v){
                            v=(v||'').trim();
                            ss(key,v);
                            val=v;
                            var sh=v||'Chưa cài';
                            if(key==='pw'&&v)sh='••••';
                            valEl.text(sh);
                        });
                    }catch(e){
                        var v=window.prompt(name,val||'');
                        if(v!==null){
                            v=v.trim();
                            ss(key,v);
                            val=v;
                            var sh=v||'Chưa cài';
                            if(key==='pw'&&v)sh='••••';
                            valEl.text(sh);
                        }
                    }
                }
            });
            return el;
        }

        // Setting items
        w.append(mkItem('Nguồn Torrent','torrentio hoặc aio','engine','select',[
            {k:'torrentio',n:'Torrentio'},
            {k:'aio',n:'AIOStreams'}
        ]));
        w.append(mkItem('Torrentio Config','Dán link manifest.json','tio','input'));
        w.append(mkItem('AIOStreams URL','URL manifest.json','aio','input'));
        w.append(mkItem('TorrServer IP','192.168.1.x:8090','ts','input'));
        w.append(mkItem('TorrServer Password','Để trống nếu không có','pw','input'));

        // Test button builder
        function mkBtn(name,color,fn){
            var btn=$('<div class="tp-btn selector"></div>').css({
                'background':'rgba('+color+',0.1)',
                'border':'1px solid rgba('+color+',0.3)'
            });
            $('<div></div>').css('color','rgb('+color+')').text(name).appendTo(btn);
            btn.on('hover:enter',function(){
                try{fn();}catch(e){
                    console.error('[TP] Button error:',e);
                    Lampa.Noty.show('❌ '+(e.message||'Lỗi'));
                }
            });
            return btn;
        }

        // Test TorrServer
        w.append(mkBtn('🧪 Test TorrServer','76,175,80',async function(){
            var h=getTsHost();
            if(!h){Lampa.Noty.show('❌ Chưa nhập IP');return;}
            Lampa.Noty.show('⏳ '+h+'...');
            try{
                var r=await fetchWithTimeout(tsUrl('/echo'),{
                    method:'GET',
                    headers:tsHeaders()
                },8000);
                if(r.ok){
                    try{
                        var r2=await fetchWithTimeout(tsUrl('/stat'),{
                            method:'GET',
                            headers:tsHeaders()
                        },5000);
                        if(r2.ok){
                            var st=await r2.json();
                            Lampa.Noty.show('✅ TS v'+(st.version||'?')+' | '+(st.torrents_count||0)+' torrents');
                            return;
                        }
                    }catch(e){}
                    Lampa.Noty.show('✅ Kết nối OK!');
                }else{
                    Lampa.Noty.show('❌ HTTP '+r.status);
                }
            }catch(e){
                Lampa.Noty.show('❌ '+e.message);
            }
        }));

        // Test AIO
        w.append(mkBtn('🧪 Test AIO','33,150,243',async function(){
            var base=getAioUrl();
            if(!base){Lampa.Noty.show('❌ Chưa nhập URL');return;}
            Lampa.Noty.show('⏳ Test AIO...');
            try{
                var testUrl=base+'/stream/movie/tt1375666.json';
                var r=await fetchWithTimeout(testUrl,{},10000);
                if(!r.ok){Lampa.Noty.show('❌ HTTP '+r.status);return;}
                var d=await r.json();
                if(d.streams&&d.streams.length){
                    Lampa.Noty.show('✅ OK! '+d.streams.length+' streams');
                }else{
                    Lampa.Noty.show('❌ Không có streams');
                }
            }catch(e){
                Lampa.Noty.show('❌ '+e.message);
            }
        }));

        // Import old settings
        w.append(mkBtn('📦 Import KKPhim cũ','255,152,0',function(){
            var c=0;
            var map={
                engine:['torrent_engine','t_eng'],
                tio:['torrentio_config','tio_cfg'],
                aio:['aio_url'],
                ts:['ts_host','torrserver_host'],
                pw:['ts_pw','torrserver_password']
            };
            for(var k in map){
                if(!map.hasOwnProperty(k))continue;
                for(var i=0;i<map[k].length;i++){
                    var v=getOld(map[k][i]);
                    if(v){ss(k,v);c++;break;}
                }
            }
            Lampa.Noty.show(c?'✅ Import '+c+' settings!':'ℹ️ Không có settings cũ');
            comp.create();
        }));

        // Debug info
        var debugInfo='Engine: '+getEngine()+
            ' | TS: '+(getTsHost()||'none')+
            ' | Tio: '+(gs('tio','')?'✅':'❌')+
            ' | AIO: '+(gs('aio','')?'✅':'❌');

        $('<div></div>').css({
            'margin-top':'2em',
            'padding':'0.8em',
            'background':'rgba(255,255,255,0.03)',
            'border-radius':'0.5em',
            'font-size':'0.75em',
            'color':'rgba(255,255,255,0.25)'
        }).text(debugInfo).appendTo(w);

        $('<div></div>').css({
            'text-align':'center',
            'margin-top':'1em',
            'color':'rgba(255,255,255,0.15)',
            'font-size':'0.75em'
        }).text('Torrent Parser v1.4').appendTo(w);

        sc.append(w);
        comp.start();
    };

    this.start=function(){initScroll(sc);};
    this.pause=function(){};
    this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// Helper for importing old settings
function getOld(key){
    var old=['kkphim_v5','kkphim_stg','kkphim_settings'];
    for(var i=0;i<old.length;i++){
        try{
            var s=JSON.parse(localStorage.getItem(old[i])||'{}');
            if(s[key]!==undefined&&s[key]!=='')return s[key];
        }catch(e){}
    }
    return null;
}

// ══════════════════════════════════════════════════════════════
// SETTINGS MENU INJECTION
// ══════════════════════════════════════════════════════════════
function addToSettings(){
    var attempts=0;
    var menuInterval=null;

    var tryAdd=function(){
        attempts++;
        if(attempts>20){
            if(menuInterval){clearInterval(menuInterval);menuInterval=null;}
            return;
        }

        var containers=$('.settings-folder').parent();
        if(!containers.length)return false;

        // Already added
        if($('[data-tp-menu]').length){
            if(menuInterval){clearInterval(menuInterval);menuInterval=null;}
            return true;
        }

        var btn=$('<div class="settings-folder selector" data-tp-menu="1"></div>');
        var icon=$('<div class="settings-folder__icon"></div>');
        icon.html('<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>');
        btn.append(icon);
        $('<div class="settings-folder__name"></div>').text('🧲 Torrent').appendTo(btn);

        btn.on('hover:enter',function(){
            Lampa.Activity.push({
                url:'',
                title:'🧲 Torrent',
                component:'tp_stg',
                page:1
            });
        });

        containers.first().append(btn);
        console.log('[TP] Settings menu added');

        if(menuInterval){clearInterval(menuInterval);menuInterval=null;}
        return true;
    };

    // Use Lampa events if available
    if(Lampa.Listener){
        Lampa.Listener.follow('settings',function(e){
            if(e.type==='open'||e.type==='render'){
                setTimeout(tryAdd,300);
            }
        });
    }

    // Fallback: check periodically but with auto-cleanup
    menuInterval=setInterval(function(){
        if($('.settings').is(':visible')&&!$('[data-tp-menu]').length){
            tryAdd();
        }
        // Cleanup once added
        if($('[data-tp-menu]').length&&menuInterval){
            clearInterval(menuInterval);
            menuInterval=null;
        }
    },2000);

    // Initial attempt
    setTimeout(tryAdd,1500);
}

// ══════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════
function register(){
    css();
    addToSettings();

    // Register with KK Core if available
    if(window.KK&&typeof window.KK.register==='function'){
        window.KK.register({
            id:'torrent',
            name:'Torrent',
            type:'torrent',
            icon:'🧲',
            description:'Torrentio / AIO',
            priority:5,
            enabled:true,
            settings:null,
            getStreams:getStreams,
            play:play,
            showStreams:showStreams,
            showInContainer:showInContainer,
            openSettings:function(){
                Lampa.Activity.push({
                    url:'',
                    title:'🧲 Torrent',
                    component:'tp_stg',
                    page:1
                });
            }
        });
    }

    // Global API
    window.TorrentParser={
        getStreams:getStreams,
        play:play,
        showStreams:showStreams,
        showInContainer:showInContainer,
        openSettings:function(){
            Lampa.Activity.push({
                url:'',
                title:'🧲 Torrent',
                component:'tp_stg',
                page:1
            });
        }
    };

    console.log('[TP] v1.4 Ready |',getEngine(),'| TS:',getTsHost()||'none');
}

// Boot
if(window.appready){
    register();
}else{
    Lampa.Listener.follow('app',function(e){
        if(e.type==='ready')register();
    });
}

})();