/* Torrent Parser v1.4 - Minimal Safe */
(function(){
'use strict';
if(window.TorrentParser)return;

var TIO='https://torrentio.strem.fun';

// ══════════════════════════════════════════════════════════════
// SETTINGS - Simple localStorage only
// ══════════════════════════════════════════════════════════════
var SK='torrent_parser_stg';

function ls(){try{return JSON.parse(localStorage.getItem(SK))||{};}catch(e){return{};}}
function gs(k,d){
    var s=ls();
    if(s[k]!==undefined&&s[k]!=='')return s[k];
    // Fallback: old kkphim settings
    var old=['kkphim_v5','kkphim_stg','kkphim_settings'];
    var keyMap={engine:['torrent_engine','t_eng'],tio:['torrentio_config','tio_cfg','tio_config'],aio:['aio_url'],ts:['ts_host','torrserver_host'],pw:['ts_pw','torrserver_password']};
    var tries=keyMap[k]||[k];
    for(var i=0;i<old.length;i++){
        try{var o=JSON.parse(localStorage.getItem(old[i])||'{}');
            for(var j=0;j<tries.length;j++){if(o[tries[j]]!==undefined&&o[tries[j]]!=='')return o[tries[j]];}
        }catch(e){}
    }
    return d||'';
}
function ss(k,v){try{var s=ls();s[k]=v;localStorage.setItem(SK,JSON.stringify(s));}catch(e){}}

function getEngine(){return gs('engine','torrentio');}
function getTsHost(){return gs('ts','');}
function getTsPw(){return gs('pw','');}
function getTioConfig(){
    var c=gs('tio','');if(!c)return'';c=String(c).trim();
    var m=c.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||c.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i);
    if(m)return m[1];if(c.indexOf('torrentio')>-1)return'';return c.replace(/^\/+|\/+$/g,'');
}
function getAioUrl(){var u=gs('aio','');return u?String(u).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,''):'';}
function tsUrl(p){var h=getTsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+p;}
function tsHeaders(){var h={'Content-Type':'application/json'};var p=getTsPw();if(p)h.Authorization='Basic '+btoa('admin:'+p);return h;}
var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parse(st){
    var rn=String(st.name||''),rd=String(st.description||''),ra=rn+'\n'+rd;
    var name=rn.split('\n')[0].trim()||'?';
    var q='',sz='',sd='',src='',codec='',audio='',fn='';

    var qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm){var qs={};qm.forEach(function(x){qs[x.toUpperCase()]=1;});q=Object.keys(qs).join(' ');}
    var sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2].toUpperCase():sm[1];
    var se=ra.match(/👤\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);if(se)sd=se[1];
    var srm=ra.match(/🔗\s*([\w\.\-]+)/i)||ra.match(/\[([A-Z0-9\.\-]+)\]/);if(srm)src=srm[1];
    var cm=ra.match(/\b(x265|x264|HEVC|AV1)\b/i);if(cm)codec=cm[1].toUpperCase();
    var am=ra.match(/\b(DTS-HD|DTS|Atmos|TrueHD|DD5\.1|AAC|EAC3)\b/i);if(am)audio=am[1];

    if(st.behaviorHints){
        var bh=st.behaviorHints;
        if(bh.filename)fn=String(bh.filename);
        if(!sz&&bh.videoSize){var b=Number(bh.videoSize);if(b>=1073741824)sz=(b/1073741824).toFixed(1)+' GB';else if(b>=1048576)sz=(b/1048576).toFixed(0)+' MB';}
        if(!q&&fn){var fq=fn.match(/\b(2160p|4K|1080p|720p)\b/i);if(fq)q=fq[1].toUpperCase();}
        if(!codec&&fn){var fc=fn.match(/\b(x265|HEVC|x264|AV1)\b/i);if(fc)codec=fc[1].toUpperCase();}
    }

    var seedNum=parseInt(sd)||0,sizeBytes=0,qScore=0;
    if(sz){var szm=sz.match(/([\d.,]+)\s*(TB|GB|MB)/i);if(szm){var n=parseFloat(szm[1].replace(',','.'));sizeBytes=szm[2].toUpperCase()==='TB'?n*1e12:szm[2].toUpperCase()==='GB'?n*1e9:n*1e6;}}
    if(q.match(/2160|4K|UHD/))qScore=4;else if(q.match(/1080/))qScore=3;else if(q.match(/720/))qScore=2;else if(q.match(/480/))qScore=1;

    return{title:name,url:st.url||'',hash:st.infoHash||'',fi:st.fileIdx,q:q,sz:sz,sd:sd,src:src,codec:codec,audio:audio,fn:fn,seedNum:seedNum,sizeBytes:sizeBytes,qScore:qScore};
}

// ══════════════════════════════════════════════════════════════
// FETCH
// ══════════════════════════════════════════════════════════════
async function getStreams(type,imdb,s,e){
    var eng=getEngine(),t=type==='tv'?'series':'movie',id=imdb;
    if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    var url;
    if(eng==='aio'){var base=getAioUrl();if(!base)throw new Error('AIO chưa cấu hình');url=base+'/stream/'+t+'/'+id+'.json';}
    else{var cfg=getTioConfig();url=TIO+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';}
    var r=await fetch(url);if(!r.ok)throw new Error(eng+' '+r.status);
    var d=await r.json();return(d.streams||[]).map(parse);
}

// ══════════════════════════════════════════════════════════════
// PLAY
// ══════════════════════════════════════════════════════════════
async function play(stream,title,poster){
    if(stream.hash&&getTsHost()){
        Lampa.Noty.show('Gửi TorrServer...');
        try{
            var mag='magnet:?xt=urn:btih:'+stream.hash+'&tr='+encodeURIComponent('udp://tracker.opentrackr.org:1337/announce');
            var r=await fetch(tsUrl('/torrents'),{method:'POST',headers:tsHeaders(),body:JSON.stringify({action:'add',link:mag,title:title||'',poster:poster||'',save_to_db:false})});
            if(!r.ok)throw new Error('TS '+r.status);
            var td=await r.json(),hash=td.hash||stream.hash;
            await new Promise(function(ok){setTimeout(ok,2000);});
            Lampa.Player.play({title:title,url:tsUrl('/stream/fname?link='+hash+'&index='+(stream.fi||0)+'&play')});
        }catch(e){Lampa.Noty.show('TS lỗi: '+e.message);}
        return;
    }
    if(stream.url){Lampa.Player.play({title:title,url:stream.url});return;}
    Lampa.Noty.show(stream.hash?'Cần TorrServer':'Không có link');
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
function css(){
    if($('#tp-css').length)return;
    $('head').append('<style id="tp-css">\
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
.tp-btn{padding:0.8em;margin:0.4em 0;border-radius:0.5em;text-align:center}\
</style>');
}

// ══════════════════════════════════════════════════════════════
// STREAM CARD
// ══════════════════════════════════════════════════════════════
function qCls(q){
    if(!q)return'tp-bq';
    if(q.match(/2160|4K|UHD/))return'tp-b4';if(q.match(/1080/))return'tp-b1';if(q.match(/720/))return'tp-b7';return'tp-bq';
}

function mkCard(s,title,poster){
    var ts=!!getTsHost(),sn=s.seedNum,sc=sn>=10?'tp-sg':sn>=3?'tp-sw':'tp-sd';
    var h='<div class="tp-c selector"><div class="tp-r1">';
    if(s.q)h+='<span class="tp-b '+qCls(s.q)+'">'+E(s.q)+'</span>';
    if(s.codec)h+='<span class="tp-b tp-bc">'+E(s.codec)+'</span>';
    if(s.audio)h+='<span class="tp-b tp-ba">'+E(s.audio)+'</span>';
    if(ts&&s.hash)h+='<span class="tp-ts">→TS</span>';
    h+='</div><div class="tp-nm">'+E(s.title)+'</div><div class="tp-r2">';
    if(s.sd)h+='<span class="'+sc+'">👤 '+s.sd+'</span>';
    if(s.sz)h+='<span class="tp-sz">💾 '+s.sz+'</span>';
    if(s.src)h+='<span>🔗 '+E(s.src)+'</span>';
    h+='</div>';
    if(s.fn)h+='<div class="tp-fn">📁 '+E(s.fn.length>70?s.fn.substring(0,70)+'…':s.fn)+'</div>';
    h+='</div>';
    var card=$(h);
    card.on('hover:enter',function(){play(s,title,poster);});
    return card;
}

var SORTS={
    seeds:function(a,b){return b.seedNum-a.seedNum;},
    quality:function(a,b){return b.qScore-a.qScore||b.seedNum-a.seedNum;},
    size_d:function(a,b){return b.sizeBytes-a.sizeBytes;},
    size_a:function(a,b){return a.sizeBytes-b.sizeBytes;}
};

function renderList(box,streams,title,poster,sk){
    sk=sk||'seeds';box.empty();
    var sorted=streams.slice().sort(SORTS[sk]||SORTS.seeds);
    var hdr=$('<div class="tp-hdr"><span class="tp-cnt">'+streams.length+' streams</span><div class="tp-sort"></div></div>');
    [{k:'seeds',n:'👤 Seeds'},{k:'quality',n:'🎬 Quality'},{k:'size_d',n:'💾 Lớn→Nhỏ'},{k:'size_a',n:'💾 Nhỏ→Lớn'}].forEach(function(s){
        var btn=$('<div class="tp-sb selector'+(sk===s.k?' on':'')+'">'+s.n+'</div>');
        btn.on('hover:enter',function(){renderList(box,streams,title,poster,s.k);});
        hdr.find('.tp-sort').append(btn);
    });
    box.append(hdr);
    var list=$('<div class="tp-ls"></div>');
    sorted.forEach(function(s){list.append(mkCard(s,title,poster));});
    box.append(list);
}

// Show in container (inline in detail page)
function showInContainer(container,streams,title,poster){
    css();
    if(!streams||!streams.length){container.html('<div class="tp-em">❌ Không tìm thấy torrent</div>');return;}
    var wrap=$('<div class="tp-wrap"></div>');
    renderList(wrap,streams,title,poster,'seeds');
    container.empty().append(wrap);
}

// Show as full page
function showStreams(streams,title,poster){
    if(!streams||!streams.length){Lampa.Noty.show('Không có stream');return;}
    Lampa.Activity.push({url:'',title:'🧲 '+title,component:'tp_page',_s:streams,_t:title,_p:poster,page:1});
}

// ══════════════════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════════════════
function initScroll(sc){
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
    var b=el.find('.scroll__body');
    ['transform:none','overflow-y:auto','overflow-x:hidden','height:100%','padding-bottom:8em','touch-action:pan-y'].forEach(function(r){
        var kv=r.split(':');if(b[0])b[0].style.setProperty(kv[0],kv[1],'important');
    });
}

// Streams page
Lampa.Component.add('tp_page',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        css();
        try{sc.render().find('.scroll__body').empty();}catch(e){}
        var w=$('<div style="padding:0.5em"></div>');
        w.append('<div style="font-size:1.2em;font-weight:bold;color:#fff;margin-bottom:0.5em">🧲 '+E(obj._t||'')+'</div>');
        var box=$('<div></div>');w.append(box);
        renderList(box,obj._s||[],obj._t||'',obj._p||'','seeds');
        sc.append(w);comp.start();
    };
    this.start=function(){initScroll(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// Settings page
Lampa.Component.add('tp_stg',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    
    this.create=function(){
        css();
        try{sc.render().find('.scroll__body').empty();}catch(e){}
        var w=$('<div style="padding:1.5em"></div>');
        w.append('<div style="font-size:1.4em;font-weight:bold;margin-bottom:1em;color:#fff">🧲 Torrent Settings</div>');
        
        function mkItem(name,desc,key,type,vals){
            var val=gs(key,'');
            var show=val||(key==='engine'?'torrentio':'Chưa cài');
            if(key==='pw'&&val)show='••••';
            var el=$('<div class="tp-si selector"><div class="tp-si-n">'+E(name)+'</div><div class="tp-si-d">'+E(desc)+'</div><div class="tp-si-v">'+E(show)+'</div></div>');
            el.on('hover:enter',function(){
                if(type==='select'){
                    Lampa.Select.show({title:name,items:vals.map(function(v){return{title:v.n+(val===v.k?' ✅':''),value:v.k};}),
                        onSelect:function(a){ss(key,a.value);el.find('.tp-si-v').text(a.value);Lampa.Noty.show('✅ '+a.value);},
                        onBack:function(){Lampa.Controller.toggle('content');}});
                }else{
                    try{
                        Lampa.Input.edit({title:name,value:val||'',free:true,nosave:true},function(v){
                            v=(v||'').trim();ss(key,v);
                            var sh=v||'Chưa cài';if(key==='pw'&&v)sh='••••';
                            el.find('.tp-si-v').text(sh);
                        });
                    }catch(e){
                        var v=window.prompt(name,val||'');
                        if(v!==null){v=v.trim();ss(key,v);el.find('.tp-si-v').text(v||'Chưa cài');}
                    }
                }
            });
            return el;
        }
        
        w.append(mkItem('Nguồn Torrent','torrentio hoặc aio','engine','select',[{k:'torrentio',n:'Torrentio'},{k:'aio',n:'AIOStreams'}]));
        w.append(mkItem('Torrentio Config','Dán link manifest.json','tio','input'));
        w.append(mkItem('AIOStreams URL','URL manifest.json','aio','input'));
        w.append(mkItem('TorrServer IP','192.168.1.x:8090','ts','input'));
        w.append(mkItem('TorrServer Password','Để trống nếu không có','pw','input'));
        
        // Test buttons
        function mkBtn(name,color,fn){
            var btn=$('<div class="tp-btn selector" style="background:rgba('+color+',0.1);border:1px solid rgba('+color+',0.3)"><div style="color:rgb('+color+')">'+name+'</div></div>');
            btn.on('hover:enter',function(){fn();});
            return btn;
        }
        
        w.append(mkBtn('🧪 Test TorrServer','76,175,80',async function(){
            var h=getTsHost();if(!h){Lampa.Noty.show('❌ Chưa nhập IP');return;}
            Lampa.Noty.show('⏳ '+h+'...');
            try{
                var r=await fetch(tsUrl('/echo'),{method:'GET',headers:tsHeaders()});
                if(r.ok){try{var r2=await fetch(tsUrl('/stat'),{method:'GET',headers:tsHeaders()});if(r2.ok){var st=await r2.json();Lampa.Noty.show('✅ TS v'+(st.version||'?')+' | '+st.torrents_count+' torrents');return;}}catch(e){}Lampa.Noty.show('✅ OK!');}
                else Lampa.Noty.show('❌ HTTP '+r.status);
            }catch(e){Lampa.Noty.show('❌ '+e.message);}
        }));
        
        w.append(mkBtn('🧪 Test AIO','33,150,243',async function(){
            var base=getAioUrl();if(!base){Lampa.Noty.show('❌ Chưa nhập URL');return;}
            Lampa.Noty.show('⏳ Test AIO...');
            try{var r=await fetch(base+'/stream/movie/tt1375666.json');if(!r.ok){Lampa.Noty.show('❌ HTTP '+r.status);return;}
                var d=await r.json();Lampa.Noty.show(d.streams&&d.streams.length?'✅ OK! '+d.streams.length+' streams':'❌ Không có');
            }catch(e){Lampa.Noty.show('❌ '+e.message);}
        }));
        
        w.append(mkBtn('📦 Import KKPhim cũ','255,152,0',function(){
            var c=0,map={engine:['torrent_engine','t_eng'],tio:['torrentio_config','tio_cfg'],aio:['aio_url'],ts:['ts_host','torrserver_host'],pw:['ts_pw','torrserver_password']};
            for(var k in map){for(var i=0;i<map[k].length;i++){var v=getOld(map[k][i]);if(v){ss(k,v);c++;break;}}}
            Lampa.Noty.show(c?'✅ Import '+c+' settings!':'ℹ️ Không có');
            comp.create(); // Refresh
        }));
        
        // Debug info
        w.append('<div style="margin-top:2em;padding:0.8em;background:rgba(255,255,255,0.03);border-radius:0.5em;font-size:0.75em;color:rgba(255,255,255,0.25)">Engine: '+E(getEngine())+' | TS: '+E(getTsHost()||'none')+' | Tio: '+(gs('tio','')?'✅':'❌')+' | AIO: '+(gs('aio','')?'✅':'❌')+'</div>');
        w.append('<div style="text-align:center;margin-top:1em;color:rgba(255,255,255,0.15);font-size:0.75em">Torrent Parser v1.4</div>');
        
        sc.append(w);comp.start();
    };
    
    this.start=function(){initScroll(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// Helper for old settings
function getOld(key){
    var old=['kkphim_v5','kkphim_stg','kkphim_settings'];
    for(var i=0;i<old.length;i++){try{var s=JSON.parse(localStorage.getItem(old[i])||'{}');if(s[key]!==undefined&&s[key]!=='')return s[key];}catch(e){}}
    return null;
}

// ══════════════════════════════════════════════════════════════
// SETTINGS MENU INJECTION
// ══════════════════════════════════════════════════════════════
function addToSettings(){
    // Wait and retry
    var attempts=0;
    var tryAdd=function(){
        attempts++;
        if(attempts>20)return;
        
        // Find settings container
        var containers=$('.settings-folder').parent();
        if(!containers.length){
            setTimeout(tryAdd,1000);
            return;
        }
        
        // Already added?
        if($('[data-tp-menu]').length)return;
        
        // Create button
        var btn=$('<div class="settings-folder selector" data-tp-menu="1"></div>');
        btn.html('<div class="settings-folder__icon"><svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div><div class="settings-folder__name">🧲 Torrent</div>');
        
        btn.on('hover:enter',function(){
            Lampa.Activity.push({url:'',title:'🧲 Torrent',component:'tp_stg',page:1});
        });
        
        containers.first().append(btn);
        console.log('[TP] Settings menu added');
    };
    
    // Try on settings open via Lampa events
    if(Lampa.Settings){
        // Observe render
        var origOpen=Lampa.Settings.open;
        if(origOpen){
            Lampa.Settings.open=function(){
                origOpen.apply(this,arguments);
                setTimeout(tryAdd,300);
            };
        }
    }
    
    // Also try periodically when settings visible
    setInterval(function(){
        if($('.settings').is(':visible')&&!$('[data-tp-menu]').length){
            tryAdd();
        }
    },2000);
    
    // Initial try
    setTimeout(tryAdd,1500);
}

// ══════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════
function register(){
    css();
    addToSettings();
    
    // Register with KK Core if available
    if(window.KK&&window.KK.register){
        window.KK.register({
            id:'torrent',name:'Torrent',type:'torrent',icon:'🧲',
            description:'Torrentio / AIO',priority:5,enabled:true,settings:null,
            getStreams:getStreams,play:play,showStreams:showStreams,showInContainer:showInContainer,
            openSettings:function(){Lampa.Activity.push({url:'',title:'🧲 Torrent',component:'tp_stg',page:1});}
        });
    }
    
    // Global
    window.TorrentParser={
        getStreams:getStreams,
        play:play,
        showStreams:showStreams,
        showInContainer:showInContainer,
        openSettings:function(){Lampa.Activity.push({url:'',title:'🧲 Torrent',component:'tp_stg',page:1});}
    };
    
    console.log('[TP] v1.4 Ready |',getEngine(),'| TS:',getTsHost()||'none');
}

if(window.appready)register();
else{
    Lampa.Listener.follow('app',function(e){
        if(e.type==='ready')register();
    });
}

})();