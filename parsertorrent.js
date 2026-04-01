/* Torrent Parser v1.2 - Rich Stream Cards */
(function(){
'use strict';

var TORRENTIO_BASE='https://torrentio.strem.fun';
var OLD_KEYS=['kkphim_v5','kkphim_stg','kkphim_settings'];

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function getOld(key){
    for(var i=0;i<OLD_KEYS.length;i++){
        try{var s=JSON.parse(localStorage.getItem(OLD_KEYS[i])||'{}');if(s[key]!==undefined&&s[key]!=='')return s[key];}catch(e){}
    }
    if(window.KK&&window.KK.get){var v=window.KK.get(key);if(v!==undefined&&v!=='')return v;}
    return null;
}

function gs(key,def){
    try{var v=Lampa.Storage.get('t_'+key,'');if(v!==''&&v!==undefined&&v!==null)return v;}catch(e){}
    var map={
        'engine':['torrent_engine','t_eng'],
        'tio_config':['torrentio_config','tio_cfg','tio_config'],
        'aio_url':['aio_url'],
        'ts_host':['ts_host','torrserver_host'],
        'ts_pw':['ts_pw','torrserver_password']
    };
    var tries=map[key]||[key];
    for(var i=0;i<tries.length;i++){var v2=getOld(tries[i]);if(v2!==null)return v2;}
    return def||'';
}

function ss(key,val){try{Lampa.Storage.set('t_'+key,val);}catch(e){}}
function getEngine(){return gs('engine','torrentio');}
function getTsHost(){return gs('ts_host','');}
function getTsPw(){return gs('ts_pw','');}

function getTorrentioConfig(){
    var cfg=gs('tio_config','');if(!cfg)return'';
    cfg=String(cfg).trim();
    var m=cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i)||cfg.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if(m)return m[1].replace(/\/+$/,'');
    if(cfg.indexOf('torrentio.strem.fun')>-1)return'';
    return cfg.replace(/^\/+|\/+$/g,'');
}

function getAioUrl(){
    var url=gs('aio_url','');if(!url)return'';
    return String(url).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}

function getTsUrl(path){
    var h=getTsHost();if(!h)return'';
    h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;
    return h+path;
}

function getTsHeaders(){
    var headers={'Content-Type':'application/json'};var pw=getTsPw();
    if(pw)headers.Authorization='Basic '+btoa('admin:'+pw);
    return headers;
}

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parseStream(st,pid){
    var rn=String(st.name||''),rd=String(st.description||''),rt=String(st.title||'');
    var ra=rn+'\n'+rd+'\n'+rt;
    var name=rn.split('\n')[0].trim()||rt.split('\n')[0].trim()||'?';
    
    var q='',qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|WEBRip|REMUX|HDTV)\b/gi);
    if(qm){
        // Get best quality tag
        var qSet={};qm.forEach(function(x){qSet[x.toUpperCase()]=true;});
        q=Object.keys(qSet).join(' ');
    }
    
    var sz='',sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(TB|GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2].toUpperCase():sm[1];
    
    var sd='',se=ra.match(/👤\s*(\d+)/i)||ra.match(/Seeders?:?\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);
    if(se)sd=se[1];
    
    var src='',srm=ra.match(/🔗\s*([\w\.\-]+)/i)||ra.match(/Source:?\s*([\w\.\-]+)/i)||ra.match(/\[([A-Z0-9\.\-]+)\]/);
    if(srm)src=srm[1];
    
    var lang='',lm=ra.match(/🇻🇳|Vietnamese|Vietsub/i);if(lm)lang='🇻🇳';
    if(!lang){lm=ra.match(/🇬🇧|🇺🇸|English/i);if(lm)lang='🇬🇧';}
    if(!lang){lm=ra.match(/Multi/i);if(lm)lang='🌐';}
    
    var codec='',cm2=ra.match(/\b(x265|x264|HEVC|H\.?265|H\.?264|AV1|VP9)\b/i);
    if(cm2)codec=cm2[1].toUpperCase();
    
    var audio='',am=ra.match(/\b(DTS-HD|DTS|Atmos|TrueHD|DD5\.1|AAC|AC3|EAC3|FLAC)\b/i);
    if(am)audio=am[1].toUpperCase();
    
    var filename='';
    if(st.behaviorHints){
        var bh=st.behaviorHints;
        if(bh.filename)filename=String(bh.filename).trim();
        if(!sz&&bh.videoSize){
            var b=Number(bh.videoSize);
            if(b>=1099511627776)sz=(b/1099511627776).toFixed(2)+' TB';
            else if(b>=1073741824)sz=(b/1073741824).toFixed(1)+' GB';
            else if(b>=1048576)sz=(b/1048576).toFixed(0)+' MB';
        }
        if(!q&&bh.filename){var fq=bh.filename.match(/\b(2160p|4K|1080p|720p|480p|HDR)\b/i);if(fq)q=fq[1].toUpperCase();}
        if(!codec&&bh.filename){var fc=bh.filename.match(/\b(x265|x264|HEVC|H\.?265|AV1)\b/i);if(fc)codec=fc[1].toUpperCase();}
    }
    
    // Seeds number for sorting
    var seedNum=parseInt(sd)||0;
    
    // Size in bytes for sorting
    var sizeBytes=0;
    if(sz){
        var szm=sz.match(/([\d.,]+)\s*(TB|GB|MB)/i);
        if(szm){
            var num=parseFloat(szm[1].replace(',','.'));
            var unit=szm[2].toUpperCase();
            if(unit==='TB')sizeBytes=num*1099511627776;
            else if(unit==='GB')sizeBytes=num*1073741824;
            else sizeBytes=num*1048576;
        }
    }
    
    // Quality score for sorting
    var qScore=0;
    if(q.indexOf('2160')>-1||q.indexOf('4K')>-1)qScore=4;
    else if(q.indexOf('1080')>-1)qScore=3;
    else if(q.indexOf('720')>-1)qScore=2;
    else if(q.indexOf('480')>-1)qScore=1;
    
    return{
        title:name,url:st.url||'',hash:st.infoHash||'',fileIdx:st.fileIdx,
        quality:q,size:sz,seeds:sd,source:src,parser:pid,
        lang:lang,codec:codec,audio:audio,filename:filename,
        seedNum:seedNum,sizeBytes:sizeBytes,qScore:qScore
    };
}

// ══════════════════════════════════════════════════════════════
// FETCH STREAMS
// ══════════════════════════════════════════════════════════════
async function fetchTorrentio(type,imdb,s,e){
    var t=type==='tv'?'series':'movie',id=imdb;
    if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    var cfg=getTorrentioConfig();
    var url=TORRENTIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';
    var r=await fetch(url);if(!r.ok)throw new Error('Torrentio '+r.status);
    var d=await r.json();
    return(d.streams||[]).map(function(x){return parseStream(x,'torrentio');});
}

async function fetchAio(type,imdb,s,e){
    var base=getAioUrl();if(!base)throw new Error('AIO chưa cấu hình');
    var t=type==='tv'?'series':'movie',id=imdb;
    if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    var r=await fetch(base+'/stream/'+t+'/'+id+'.json');if(!r.ok)throw new Error('AIO '+r.status);
    var d=await r.json();
    return(d.streams||[]).map(function(x){return parseStream(x,'aio');});
}

async function getStreams(type,imdb,s,e){
    var eng=getEngine();
    return eng==='aio'?await fetchAio(type,imdb,s,e):await fetchTorrentio(type,imdb,s,e);
}

// ══════════════════════════════════════════════════════════════
// PLAY
// ══════════════════════════════════════════════════════════════
async function playStream(stream,title,poster){
    if(stream.hash&&getTsHost()){
        Lampa.Noty.show('Gửi TorrServer...');
        try{
            var mag='magnet:?xt=urn:btih:'+stream.hash+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');
            var r=await fetch(getTsUrl('/torrents'),{method:'POST',headers:getTsHeaders(),body:JSON.stringify({action:'add',link:mag,title:title||'',poster:poster||'',save_to_db:false})});
            if(!r.ok)throw new Error('TS:'+r.status);
            var td=await r.json(),hash=td.hash||stream.hash;
            await new Promise(function(res){setTimeout(res,2000);});
            
            var info=null;
            for(var i=0;i<3;i++){
                try{var r2=await fetch(getTsUrl('/torrents'),{method:'POST',headers:getTsHeaders(),body:JSON.stringify({action:'get',hash:hash})});info=await r2.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}
                await new Promise(function(res){setTimeout(res,1500);});
            }
            
            if(info&&info.file_stats){
                var vids=info.file_stats.filter(function(f){return(f.path||'').match(/\.(mp4|mkv|avi|webm|ts|m2ts)$/i);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
                if(vids.length>1&&stream.fileIdx===undefined){
                    Lampa.Select.show({title:'Chọn file',items:vids.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f.id||0};}),
                        onSelect:function(a){Lampa.Player.play({title:title,url:getTsUrl('/stream/fname?link='+hash+'&index='+a.value+'&play')});},
                        onBack:function(){Lampa.Controller.toggle('content');}});
                    return;
                }
            }
            Lampa.Player.play({title:title,url:getTsUrl('/stream/fname?link='+hash+'&index='+(stream.fileIdx||0)+'&play')});
        }catch(e){Lampa.Noty.show('TS lỗi: '+(e.message||''));}
        return;
    }
    if(stream.url){Lampa.Player.play({title:title,url:stream.url});return;}
    Lampa.Noty.show(stream.hash?'Cần TorrServer':'Không có link');
}

// ══════════════════════════════════════════════════════════════
// STREAM CARDS UI
// ══════════════════════════════════════════════════════════════
var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};

function injectCSS(){
    if($('#torrent-parser-css').length)return;
    $('head').append('<style id="torrent-parser-css">\
.tp-wrap{padding:0.5em 0;}\
.tp-header{display:flex;align-items:center;justify-content:space-between;padding:0.5em 0;margin-bottom:0.5em;}\
.tp-count{color:rgba(255,255,255,0.5);font-size:0.85em;}\
.tp-sort{display:flex;gap:0.4em;flex-wrap:wrap;}\
.tp-sort-btn{padding:0.3em 0.7em;border-radius:1em;font-size:0.75em;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer;border:1px solid transparent;}\
.tp-sort-btn.active{background:rgba(33,150,243,0.2);color:#64b5f6;border-color:rgba(33,150,243,0.4);}\
.tp-list{display:flex;flex-direction:column;gap:0.5em;}\
.tp-card{display:flex;flex-direction:column;gap:0.4em;padding:0.8em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:0.6em;cursor:pointer;transition:all 0.2s;}\
.tp-card:hover,.tp-card.focus{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);}\
.tp-card-top{display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;}\
.tp-badge{padding:0.15em 0.5em;border-radius:0.3em;font-size:0.75em;font-weight:bold;white-space:nowrap;}\
.tp-q{background:rgba(76,175,80,0.2);color:#81c784;}\
.tp-q-4k{background:rgba(255,152,0,0.2);color:#ffb74d;}\
.tp-q-1080{background:rgba(33,150,243,0.2);color:#64b5f6;}\
.tp-q-720{background:rgba(156,39,176,0.2);color:#ce93d8;}\
.tp-codec{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);}\
.tp-audio{background:rgba(233,30,99,0.15);color:#f48fb1;}\
.tp-lang{font-size:0.9em;}\
.tp-name{color:rgba(255,255,255,0.85);font-size:0.9em;line-height:1.3;word-break:break-word;}\
.tp-meta{display:flex;align-items:center;gap:0.8em;flex-wrap:wrap;font-size:0.8em;color:rgba(255,255,255,0.45);}\
.tp-meta-item{display:flex;align-items:center;gap:0.2em;}\
.tp-seeds{color:#81c784;}\
.tp-seeds-low{color:#ffb74d;}\
.tp-seeds-dead{color:#e57373;}\
.tp-size{color:#90caf9;}\
.tp-source{color:rgba(255,255,255,0.35);}\
.tp-file{color:rgba(255,255,255,0.3);font-size:0.75em;margin-top:0.1em;word-break:break-all;max-height:2.5em;overflow:hidden;}\
.tp-divider{border:none;border-top:1px solid rgba(255,255,255,0.05);margin:0.3em 0;}\
.tp-empty{text-align:center;padding:2em;color:rgba(255,255,255,0.3);}\
.tp-ts-badge{background:rgba(76,175,80,0.15);color:#66bb6a;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.7em;margin-left:auto;}\
</style>');
}

function qualityClass(q){
    if(!q)return'tp-q';
    if(q.indexOf('2160')>-1||q.indexOf('4K')>-1||q.indexOf('UHD')>-1)return'tp-q tp-q-4k';
    if(q.indexOf('1080')>-1)return'tp-q tp-q-1080';
    if(q.indexOf('720')>-1)return'tp-q tp-q-720';
    return'tp-q';
}

function seedsClass(n){
    if(n>=10)return'tp-seeds';
    if(n>=3)return'tp-seeds-low';
    return'tp-seeds-dead';
}

function mkStreamCard(stream,title,poster){
    var ts=!!getTsHost();
    var sn=stream.seedNum||0;
    
    var html='<div class="tp-card selector">';
    
    // Top row: badges
    html+='<div class="tp-card-top">';
    if(stream.quality)html+='<span class="tp-badge '+qualityClass(stream.quality)+'">'+E(stream.quality)+'</span>';
    if(stream.codec)html+='<span class="tp-badge tp-codec">'+E(stream.codec)+'</span>';
    if(stream.audio)html+='<span class="tp-badge tp-audio">'+E(stream.audio)+'</span>';
    if(stream.lang)html+='<span class="tp-lang">'+stream.lang+'</span>';
    if(ts&&stream.hash)html+='<span class="tp-ts-badge">→ TS</span>';
    html+='</div>';
    
    // Name
    html+='<div class="tp-name">'+E(stream.title)+'</div>';
    
    // Meta row: seeds, size, source
    html+='<div class="tp-meta">';
    if(stream.seeds)html+='<span class="tp-meta-item"><span class="'+seedsClass(sn)+'">👤 '+E(stream.seeds)+(sn>=10?' seeds':sn>=3?' seeds':' seeds')+'</span></span>';
    if(stream.size)html+='<span class="tp-meta-item tp-size">💾 '+E(stream.size)+'</span>';
    if(stream.source)html+='<span class="tp-meta-item tp-source">🔗 '+E(stream.source)+'</span>';
    html+='</div>';
    
    // Filename
    if(stream.filename){
        var fn=stream.filename.length>80?stream.filename.substring(0,80)+'...':stream.filename;
        html+='<div class="tp-file">📁 '+E(fn)+'</div>';
    }
    
    html+='</div>';
    
    var card=$(html);
    
    card.on('hover:enter',function(){
        playStream(stream,title,poster);
    });
    card.on('click',function(e){
        e.preventDefault();e.stopPropagation();
        playStream(stream,title,poster);
    });
    
    return card;
}

// Sort functions
var SORTS={
    seeds:function(a,b){return b.seedNum-a.seedNum;},
    quality:function(a,b){return b.qScore-a.qScore||b.seedNum-a.seedNum;},
    size_desc:function(a,b){return b.sizeBytes-a.sizeBytes;},
    size_asc:function(a,b){return a.sizeBytes-b.sizeBytes;}
};

function renderStreams(container,streams,title,poster,sortKey){
    sortKey=sortKey||'seeds';
    var sorted=streams.slice().sort(SORTS[sortKey]||SORTS.seeds);
    
    container.empty();
    
    // Header
    var header=$('<div class="tp-header"></div>');
    header.append('<span class="tp-count">'+streams.length+' streams</span>');
    
    var sortBar=$('<div class="tp-sort"></div>');
    [
        {k:'seeds',n:'👤 Seeds'},
        {k:'quality',n:'🎬 Chất lượng'},
        {k:'size_desc',n:'💾 Lớn→Nhỏ'},
        {k:'size_asc',n:'💾 Nhỏ→Lớn'}
    ].forEach(function(s){
        var btn=$('<div class="tp-sort-btn selector'+(sortKey===s.k?' active':'')+'">'+s.n+'</div>');
        btn.on('hover:enter click',function(e){
            e.preventDefault();e.stopPropagation();
            renderStreams(container,streams,title,poster,s.k);
        });
        sortBar.append(btn);
    });
    header.append(sortBar);
    container.append(header);
    
    // List
    var list=$('<div class="tp-list"></div>');
    sorted.forEach(function(stream){
        list.append(mkStreamCard(stream,title,poster));
    });
    container.append(list);
}

// Main function to show streams in a container (for plugin integration)
function showStreamsInContainer(container,streams,title,poster){
    injectCSS();
    
    if(!streams||!streams.length){
        container.html('<div class="tp-empty">❌ Không tìm thấy torrent</div>');
        return;
    }
    
    var wrap=$('<div class="tp-wrap"></div>');
    renderStreams(wrap,streams,title,poster,'seeds');
    container.empty().append(wrap);
}

// Standalone popup (backward compat)
function showStreams(streams,title,poster){
    if(!streams||!streams.length){Lampa.Noty.show('Không có stream');return;}
    
    // Open as activity with rich UI
    Lampa.Activity.push({
        url:'',
        title:'🧲 '+title,
        component:'tp_streams',
        streams:streams,
        stream_title:title,
        stream_poster:poster,
        page:1
    });
}

// Streams page component
Lampa.Component.add('tp_streams',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    
    this.create=function(){
        injectCSS();
        try{sc.render().find('.scroll__body').empty();}catch(e){}
        
        var wrap=$('<div style="padding:0.5em"></div>');
        wrap.append('<div style="font-size:1.3em;font-weight:bold;color:#fff;margin-bottom:0.5em">🧲 '+E(obj.stream_title||'Torrent')+'</div>');
        
        var container=$('<div></div>');
        wrap.append(container);
        
        renderStreams(container,obj.streams||[],obj.stream_title||'',obj.stream_poster||'','seeds');
        
        sc.append(wrap);
        comp.start();
    };
    
    this.start=function(){
        Lampa.Controller.add('content',{
            toggle:function(){Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},
            left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
            right:function(){Navigator.move('right');},
            up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
            down:function(){Navigator.move('down');},
            back:function(){Lampa.Activity.backward();}
        });
        setTimeout(function(){Lampa.Controller.toggle('content');},0);
        
        var el=sc.render();el.css({overflow:'hidden',position:'relative',height:'100%'});
        var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};
        b.css($.extend({position:'relative'},p));
        if(b[0])for(var k in p)b[0].style.setProperty(k,p[k],'important');
    };
    
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
function openSettings(){
    Lampa.Activity.push({url:'',title:'🧲 Torrent Settings',component:'tp_settings',page:1});
}

Lampa.Component.add('tp_settings',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    
    this.create=function(){
        try{sc.render().find('.scroll__body').empty();}catch(e){}
        
        var w=$('<div style="padding:1.5em"></div>');
        w.append('<div style="font-size:1.5em;font-weight:bold;margin-bottom:1em;color:#fff">🧲 Torrent Settings</div>');
        
        var items=[
            {key:'engine',name:'Nguồn Torrent',desc:'torrentio / aio',type:'select',values:[{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}]},
            {key:'tio_config',name:'Torrentio Config',desc:'Dán link manifest.json',type:'input'},
            {key:'aio_url',name:'AIOStreams URL',desc:'URL manifest.json',type:'input'},
            {key:'ts_host',name:'TorrServer IP',desc:'192.168.1.x:8090',type:'input'},
            {key:'ts_pw',name:'TorrServer Password',desc:'Để trống nếu không có',type:'input'}
        ];
        
        items.forEach(function(item){
            var val=gs(item.key,'');
            var display=val||(item.key==='engine'?'torrentio':'Chưa cài');
            if(item.key==='ts_pw'&&val)display='••••';
            
            var el=$('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba(255,255,255,0.05);border-radius:0.5em;cursor:pointer"><div style="color:#fff;font-size:1.1em">'+E(item.name)+'</div><div style="color:rgba(255,255,255,0.4);font-size:0.85em;margin-top:0.2em">'+E(item.desc)+'</div><div class="sv" style="color:#4ade80;font-size:0.9em;margin-top:0.3em">'+E(display)+'</div></div>');
            
            el.on('hover:enter click',function(e){
                e.preventDefault();
                if(item.type==='select'){
                    Lampa.Select.show({title:item.name,items:item.values.map(function(v){return{title:v.n+(gs(item.key,'')=== v.k?' ✅':''),value:v.k};}),
                        onSelect:function(a){ss(item.key,a.value);el.find('.sv').text(a.value);Lampa.Noty.show('Đã chọn: '+a.value);},
                        onBack:function(){Lampa.Controller.toggle('content');}});
                }else{
                    try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:item.name,value:val,free:true,nosave:true},function(v){v=(v||'').trim();ss(item.key,v);var show=v||'Chưa cài';if(item.key==='ts_pw'&&v)show='••••';el.find('.sv').text(show);});return;}}catch(ex){}
                    var v=window.prompt(item.name,val);if(v!==null){v=v.trim();ss(item.key,v);el.find('.sv').text(v||'Chưa cài');}
                }
            });
            w.append(el);
        });
        
        // Test buttons
        [
            {name:'🧪 Test TorrServer',fn:testTorrServer,bg:'76,175,80'},
            {name:'🧪 Test AIOStreams',fn:testAio,bg:'33,150,243'},
            {name:'📦 Import từ KKPhim cũ',fn:migrateOld,bg:'255,152,0'}
        ].forEach(function(b){
            var btn=$('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba('+b.bg+',0.1);border:1px solid rgba('+b.bg+',0.3);border-radius:0.5em;cursor:pointer;text-align:center"><div style="color:rgb('+b.bg+');font-size:1.1em">'+b.name+'</div></div>');
            btn.on('hover:enter click',function(e){e.preventDefault();b.fn();});
            w.append(btn);
        });
        
        w.append('<div style="text-align:center;margin-top:2em;color:rgba(255,255,255,0.2);font-size:0.8em">Torrent Parser v1.2</div>');
        sc.append(w);comp.start();
    };
    
    this.start=function(){
        Lampa.Controller.add('content',{
            toggle:function(){Lampa.Controller.collectionSet(sc.render());Lampa.Controller.collectionFocus(false,sc.render());},
            left:function(){if(Navigator.canmove('left'))Navigator.move('left');else Lampa.Controller.toggle('menu');},
            right:function(){Navigator.move('right');},
            up:function(){if(Navigator.canmove('up'))Navigator.move('up');else Lampa.Controller.toggle('head');},
            down:function(){Navigator.move('down');},
            back:function(){Lampa.Activity.backward();}
        });
        setTimeout(function(){Lampa.Controller.toggle('content');},0);
        var el=sc.render();el.css({overflow:'hidden',position:'relative',height:'100%'});
        var b=el.find('.scroll__body'),p={'transform':'none','overflow-y':'auto','overflow-x':'hidden',height:'100%','padding-bottom':'8em','touch-action':'pan-y'};
        b.css($.extend({position:'relative'},p));
        if(b[0])for(var k in p)b[0].style.setProperty(k,p[k],'important');
    };
    
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// TEST & MIGRATE
// ══════════════════════════════════════════════════════════════
async function testTorrServer(){
    var host=getTsHost();
    if(!host){Lampa.Noty.show('❌ Chưa nhập TorrServer');return;}
    Lampa.Noty.show('⏳ Kết nối '+host+'...');
    try{
        var r=await fetch(getTsUrl('/echo'),{method:'GET',headers:getTsHeaders()});
        if(r.ok){
            try{var r2=await fetch(getTsUrl('/stat'),{method:'GET',headers:getTsHeaders()});if(r2.ok){var st=await r2.json();Lampa.Noty.show('✅ TS v'+(st.version||'?')+' | '+st.torrents_count+' torrents');return;}}catch(e){}
            Lampa.Noty.show('✅ TorrServer OK!');
        }else Lampa.Noty.show('❌ HTTP '+r.status+(r.status===401?' (sai pass)':''));
    }catch(e){Lampa.Noty.show('❌ '+(e.message||'Lỗi'));}
}

async function testAio(){
    var base=getAioUrl();
    if(!base){Lampa.Noty.show('❌ Chưa nhập AIO URL');return;}
    Lampa.Noty.show('⏳ Test AIO...');
    try{
        var r=await fetch(base+'/stream/movie/tt1375666.json');
        if(!r.ok){Lampa.Noty.show('❌ HTTP '+r.status);return;}
        var d=await r.json();
        Lampa.Noty.show(d.streams&&d.streams.length?'✅ AIO OK! '+d.streams.length+' streams':'❌ Không có stream');
    }catch(e){Lampa.Noty.show('❌ '+(e.message||'Lỗi'));}
}

function migrateOld(){
    var count=0,map={engine:['torrent_engine','t_eng'],tio_config:['torrentio_config','tio_cfg'],aio_url:['aio_url'],ts_host:['ts_host','torrserver_host'],ts_pw:['ts_pw','torrserver_password']};
    for(var key in map){for(var i=0;i<map[key].length;i++){var v=getOld(map[key][i]);if(v!==null&&v!==''){ss(key,v);count++;break;}}}
    Lampa.Noty.show(count>0?'✅ Import '+count+' settings!':'ℹ️ Không có settings cũ');
}

// ══════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════
function register(){
    injectCSS();
    
    // Add settings button
    Lampa.Listener.follow('settings',function(e){
        if(e.type==='open'){
            setTimeout(function(){
                var body=$(e.body||e.render||'.settings .scroll__body');
                if(!body.length||body.find('[data-tp]').length)return;
                var btn=$('<div class="settings-folder selector" data-tp="1"><div class="settings-folder__icon" style="background:none;font-size:1.5em">🧲</div><div class="settings-folder__name">Torrent</div></div>');
                btn.on('hover:enter',function(){openSettings();});
                body.append(btn);
            },200);
        }
    });
    
    // Register with KK Core
    if(window.KK){
        window.KK.register({
            id:'torrent',name:'Torrent',type:'torrent',icon:'🧲',
            description:'Torrentio / AIO',priority:5,enabled:true,settings:null,
            getStreams:getStreams,play:playStream,
            showStreams:showStreams,
            showStreamsInContainer:showStreamsInContainer
        });
    }
    
    // Global export
    window.TorrentParser={
        getStreams:getStreams,
        play:playStream,
        showStreams:showStreams,
        showStreamsInContainer:showStreamsInContainer,
        openSettings:openSettings,
        testTorrServer:testTorrServer,
        testAio:testAio
    };
    
    console.log('[Torrent] v1.2 Ready | Engine:',getEngine(),'| TS:',getTsHost()||'none');
}

if(window.appready)register();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')register();});

})();