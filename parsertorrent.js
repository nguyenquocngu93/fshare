/* Torrent Parser v1.3 - Fixed Settings Menu */
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
    var map={engine:['torrent_engine','t_eng'],tio_config:['torrentio_config','tio_cfg','tio_config'],aio_url:['aio_url'],ts_host:['ts_host','torrserver_host'],ts_pw:['ts_pw','torrserver_password']};
    var tries=map[key]||[key];
    for(var i=0;i<tries.length;i++){var v2=getOld(tries[i]);if(v2!==null)return v2;}
    return def||'';
}
function ss(key,val){try{Lampa.Storage.set('t_'+key,val);}catch(e){}}
function getEngine(){return gs('engine','torrentio');}
function getTsHost(){return gs('ts_host','');}
function getTsPw(){return gs('ts_pw','');}
function getTorrentioConfig(){
    var cfg=gs('tio_config','');if(!cfg)return'';cfg=String(cfg).trim();
    var m=cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i)||cfg.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if(m)return m[1].replace(/\/+$/,'');if(cfg.indexOf('torrentio.strem.fun')>-1)return'';return cfg.replace(/^\/+|\/+$/g,'');
}
function getAioUrl(){
    var url=gs('aio_url','');if(!url)return'';
    return String(url).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}
function getTsUrl(path){var h=getTsHost();if(!h)return'';h=h.replace(/\/+$/,'');if(h.indexOf('http')!==0)h='http://'+h;return h+path;}
function getTsHeaders(){var headers={'Content-Type':'application/json'};var pw=getTsPw();if(pw)headers.Authorization='Basic '+btoa('admin:'+pw);return headers;}

// ══════════════════════════════════════════════════════════════
// INJECT SETTINGS MENU - Safe method
// ══════════════════════════════════════════════════════════════
function addSettingsMenu(){
    // Method 1: Lampa.SettingsApi
    if(Lampa.SettingsApi && typeof Lampa.SettingsApi.addComponent === 'function'){
        try{
            Lampa.SettingsApi.addComponent({
                component:'torrent_parser',
                name:'Torrent',
                icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
            });

            Lampa.SettingsApi.addParam({
                component:'torrent_parser',
                param:{name:'t_engine',type:'select',values:{torrentio:'Torrentio',aio:'AIOStreams'},default:'torrentio'},
                field:{name:'Nguồn Torrent',description:'Chọn engine'},
                onChange:function(val){ss('engine',val);}
            });
            Lampa.SettingsApi.addParam({
                component:'torrent_parser',
                param:{name:'t_tio_config',type:'input',default:''},
                field:{name:'Torrentio Config',description:'Dán link manifest.json'},
                onChange:function(val){ss('tio_config',val);}
            });
            Lampa.SettingsApi.addParam({
                component:'torrent_parser',
                param:{name:'t_aio_url',type:'input',default:''},
                field:{name:'AIOStreams URL',description:'URL manifest.json'},
                onChange:function(val){ss('aio_url',val);}
            });
            Lampa.SettingsApi.addParam({
                component:'torrent_parser',
                param:{name:'t_ts_host',type:'input',default:''},
                field:{name:'TorrServer IP',description:'192.168.1.x:8090'},
                onChange:function(val){ss('ts_host',val);}
            });
            Lampa.SettingsApi.addParam({
                component:'torrent_parser',
                param:{name:'t_ts_pw',type:'input',default:''},
                field:{name:'TorrServer Password',description:'Để trống nếu không có'},
                onChange:function(val){ss('ts_pw',val);}
            });

            console.log('[Torrent] SettingsApi OK');
            return;
        }catch(e){
            console.warn('[Torrent] SettingsApi fail:',e.message);
        }
    }

    // Method 2: Observe DOM for settings panel
    console.log('[Torrent] Using DOM observer for settings');
    
    var observer=new MutationObserver(function(mutations){
        mutations.forEach(function(mutation){
            mutation.addedNodes.forEach(function(node){
                if(node.nodeType!==1)return;
                var el=$(node);
                // Look for settings panel
                var folders=el.find('.settings-folder, [data-component]');
                if(!folders.length)folders=el.hasClass('settings-folder')?el:$();
                
                if(folders.length&&!el.closest('[data-tp-added]').length){
                    var parent=folders.last().parent();
                    if(parent.length&&!parent.find('[data-component="torrent_parser"]').length){
                        var btn=$('<div class="settings-folder selector" data-component="torrent_parser" data-tp-added="1"></div>');
                        btn.html('<div class="settings-folder__icon"><svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg></div><div class="settings-folder__name">🧲 Torrent</div>');
                        btn.on('hover:enter',function(){openSettings();});
                        folders.last().after(btn);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body,{childList:true,subtree:true});
}

function openSettings(){
    Lampa.Activity.push({url:'',title:'🧲 Torrent Settings',component:'tp_stg',page:1});
}

// ══════════════════════════════════════════════════════════════
// SETTINGS PAGE COMPONENT
// ══════════════════════════════════════════════════════════════
Lampa.Component.add('tp_stg',function(){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
    
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
            
            var el=$('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba(255,255,255,0.05);border-radius:0.5em"><div style="color:#fff;font-size:1.1em">'+E(item.name)+'</div><div style="color:rgba(255,255,255,0.4);font-size:0.85em;margin-top:0.2em">'+E(item.desc)+'</div><div class="sv" style="color:#4ade80;font-size:0.9em;margin-top:0.3em">'+E(display)+'</div></div>');
            
            el.on('hover:enter',function(){
                if(item.type==='select'){
                    Lampa.Select.show({title:item.name,items:item.values.map(function(v){return{title:v.n+(gs(item.key)=== v.k?' ✅':''),value:v.k};}),
                        onSelect:function(a){ss(item.key,a.value);el.find('.sv').text(a.value);Lampa.Noty.show('✅ '+a.value);},
                        onBack:function(){Lampa.Controller.toggle('content');}});
                }else{
                    try{if(Lampa.Input&&Lampa.Input.edit){Lampa.Input.edit({title:item.name,value:val,free:true,nosave:true},function(v){v=(v||'').trim();ss(item.key,v);var sh=v||'Chưa cài';if(item.key==='ts_pw'&&v)sh='••••';el.find('.sv').text(sh);});return;}}catch(ex){}
                    var v=window.prompt(item.name,val);if(v!==null){v=v.trim();ss(item.key,v);el.find('.sv').text(v||'Chưa cài');}
                }
            });
            w.append(el);
        });
        
        // Buttons
        [{name:'🧪 Test TorrServer',fn:testTS,c:'76,175,80'},{name:'🧪 Test AIO',fn:testAio,c:'33,150,243'},{name:'📦 Import KKPhim cũ',fn:migrateOld,c:'255,152,0'}].forEach(function(b){
            var btn=$('<div class="selector" style="padding:1em;margin:0.5em 0;background:rgba('+b.c+',0.1);border:1px solid rgba('+b.c+',0.3);border-radius:0.5em;text-align:center"><div style="color:rgb('+b.c+');font-size:1.1em">'+b.name+'</div></div>');
            btn.on('hover:enter',function(){b.fn();});
            w.append(btn);
        });
        
        // Debug
        w.append('<div style="margin-top:2em;padding:1em;background:rgba(255,255,255,0.03);border-radius:0.5em;font-size:0.8em;color:rgba(255,255,255,0.3)">Engine: '+E(getEngine())+'<br>TS: '+E(getTsHost()||'none')+'<br>Torrentio: '+(gs('tio_config','')?'✅':'❌')+'<br>AIO: '+(gs('aio_url','')?'✅':'❌')+'</div>');
        w.append('<div style="text-align:center;margin-top:1em;color:rgba(255,255,255,0.2);font-size:0.8em">Torrent Parser v1.3</div>');
        
        sc.append(w);comp.start();
    };
    
    this.start=function(){initCtrl(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// CONTROLLER & SCROLL HELPERS
// ══════════════════════════════════════════════════════════════
function initCtrl(sc){
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
}

// ══════════════════════════════════════════════════════════════
// TEST & MIGRATE
// ══════════════════════════════════════════════════════════════
async function testTS(){
    var h=getTsHost();if(!h){Lampa.Noty.show('❌ Chưa nhập TorrServer');return;}
    Lampa.Noty.show('⏳ Kết nối '+h+'...');
    try{
        var r=await fetch(getTsUrl('/echo'),{method:'GET',headers:getTsHeaders()});
        if(r.ok){try{var r2=await fetch(getTsUrl('/stat'),{method:'GET',headers:getTsHeaders()});if(r2.ok){var st=await r2.json();Lampa.Noty.show('✅ TS v'+(st.version||'?')+' | '+st.torrents_count+' torrents');return;}}catch(e){}Lampa.Noty.show('✅ OK!');}
        else Lampa.Noty.show('❌ HTTP '+r.status+(r.status===401?' (sai pass)':''));
    }catch(e){Lampa.Noty.show('❌ '+(e.message||'Lỗi'));}
}

async function testAio(){
    var base=getAioUrl();if(!base){Lampa.Noty.show('❌ Chưa nhập AIO URL');return;}
    Lampa.Noty.show('⏳ Test AIO...');
    try{var r=await fetch(base+'/stream/movie/tt1375666.json');if(!r.ok){Lampa.Noty.show('❌ HTTP '+r.status);return;}
        var d=await r.json();Lampa.Noty.show(d.streams&&d.streams.length?'✅ OK! '+d.streams.length+' streams':'❌ Không có stream');
    }catch(e){Lampa.Noty.show('❌ '+(e.message||'Lỗi'));}
}

function migrateOld(){
    var count=0,map={engine:['torrent_engine','t_eng'],tio_config:['torrentio_config','tio_cfg'],aio_url:['aio_url'],ts_host:['ts_host','torrserver_host'],ts_pw:['ts_pw','torrserver_password']};
    for(var key in map){for(var i=0;i<map[key].length;i++){var v=getOld(map[key][i]);if(v!==null&&v!==''){ss(key,v);count++;break;}}}
    Lampa.Noty.show(count>0?'✅ Import '+count+' settings!':'ℹ️ Không có settings cũ');
}

// ══════════════════════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════════════════════
function injectCSS(){
    if($('#tp-css').length)return;
    $('head').append('<style id="tp-css">\
.tp-wrap{padding:0.5em 0}\
.tp-header{display:flex;align-items:center;justify-content:space-between;padding:0.5em 0;margin-bottom:0.5em}\
.tp-count{color:rgba(255,255,255,0.5);font-size:0.85em}\
.tp-sort{display:flex;gap:0.4em;flex-wrap:wrap}\
.tp-sort-btn{padding:0.3em 0.7em;border-radius:1em;font-size:0.75em;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer;border:1px solid transparent}\
.tp-sort-btn.active{background:rgba(33,150,243,0.2);color:#64b5f6;border-color:rgba(33,150,243,0.4)}\
.tp-list{display:flex;flex-direction:column;gap:0.5em}\
.tp-card{display:flex;flex-direction:column;gap:0.4em;padding:0.8em;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:0.6em;cursor:pointer;transition:all 0.2s}\
.tp-card:hover,.tp-card.focus{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15)}\
.tp-top{display:flex;align-items:center;gap:0.5em;flex-wrap:wrap}\
.tp-badge{padding:0.15em 0.5em;border-radius:0.3em;font-size:0.75em;font-weight:bold;white-space:nowrap}\
.tp-q{background:rgba(76,175,80,0.2);color:#81c784}\
.tp-q4{background:rgba(255,152,0,0.2);color:#ffb74d}\
.tp-q1{background:rgba(33,150,243,0.2);color:#64b5f6}\
.tp-q7{background:rgba(156,39,176,0.2);color:#ce93d8}\
.tp-codec{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6)}\
.tp-audio{background:rgba(233,30,99,0.15);color:#f48fb1}\
.tp-name{color:rgba(255,255,255,0.85);font-size:0.9em;line-height:1.3;word-break:break-word}\
.tp-meta{display:flex;align-items:center;gap:0.8em;flex-wrap:wrap;font-size:0.8em;color:rgba(255,255,255,0.45)}\
.tp-mi{display:flex;align-items:center;gap:0.2em}\
.tp-sg{color:#81c784}.tp-sw{color:#ffb74d}.tp-sd{color:#e57373}\
.tp-sz{color:#90caf9}\
.tp-src{color:rgba(255,255,255,0.35)}\
.tp-fn{color:rgba(255,255,255,0.3);font-size:0.75em;margin-top:0.1em;word-break:break-all;max-height:2.5em;overflow:hidden}\
.tp-ts{background:rgba(76,175,80,0.15);color:#66bb6a;padding:0.15em 0.5em;border-radius:0.3em;font-size:0.7em;margin-left:auto}\
.tp-empty{text-align:center;padding:2em;color:rgba(255,255,255,0.3)}\
</style>');
}

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parseStream(st,pid){
    var rn=String(st.name||''),rd=String(st.description||''),rt=String(st.title||''),ra=rn+'\n'+rd+'\n'+rt;
    var name=rn.split('\n')[0].trim()||rt.split('\n')[0].trim()||'?';
    
    var q='',qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|WEBRip|REMUX|HDTV)\b/gi);
    if(qm){var qs={};qm.forEach(function(x){qs[x.toUpperCase()]=1;});q=Object.keys(qs).join(' ');}
    
    var sz='',sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(TB|GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2].toUpperCase():sm[1];
    
    var sd='',se=ra.match(/👤\s*(\d+)/i)||ra.match(/Seeders?:?\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);if(se)sd=se[1];
    var src='',srm=ra.match(/🔗\s*([\w\.\-]+)/i)||ra.match(/\[([A-Z0-9\.\-]+)\]/);if(srm)src=srm[1];
    var lang='';if(ra.match(/🇻🇳|Vietnamese|Vietsub/i))lang='🇻🇳';else if(ra.match(/Multi/i))lang='🌐';
    var codec='',cm2=ra.match(/\b(x265|x264|HEVC|H\.?265|H\.?264|AV1)\b/i);if(cm2)codec=cm2[1].toUpperCase();
    var audio='',am=ra.match(/\b(DTS-HD|DTS|Atmos|TrueHD|DD5\.1|AAC|AC3|EAC3)\b/i);if(am)audio=am[1].toUpperCase();
    var filename='';
    
    if(st.behaviorHints){var bh=st.behaviorHints;
        if(bh.filename)filename=String(bh.filename).trim();
        if(!sz&&bh.videoSize){var b=Number(bh.videoSize);if(b>=1073741824)sz=(b/1073741824).toFixed(1)+' GB';else if(b>=1048576)sz=(b/1048576).toFixed(0)+' MB';}
        if(!q&&bh.filename){var fq=bh.filename.match(/\b(2160p|4K|1080p|720p|480p|HDR)\b/i);if(fq)q=fq[1].toUpperCase();}
        if(!codec&&bh.filename){var fc=bh.filename.match(/\b(x265|x264|HEVC|AV1)\b/i);if(fc)codec=fc[1].toUpperCase();}
    }
    
    var seedNum=parseInt(sd)||0;
    var sizeBytes=0;
    if(sz){var szm=sz.match(/([\d.,]+)\s*(TB|GB|MB)/i);if(szm){var num=parseFloat(szm[1].replace(',','.'));var unit=szm[2].toUpperCase();sizeBytes=unit==='TB'?num*1099511627776:unit==='GB'?num*1073741824:num*1048576;}}
    var qScore=0;
    if(q.indexOf('2160')>-1||q.indexOf('4K')>-1)qScore=4;else if(q.indexOf('1080')>-1)qScore=3;else if(q.indexOf('720')>-1)qScore=2;else if(q.indexOf('480')>-1)qScore=1;
    
    return{title:name,url:st.url||'',hash:st.infoHash||'',fileIdx:st.fileIdx,quality:q,size:sz,seeds:sd,source:src,parser:pid,lang:lang,codec:codec,audio:audio,filename:filename,seedNum:seedNum,sizeBytes:sizeBytes,qScore:qScore};
}

// ══════════════════════════════════════════════════════════════
// FETCH
// ══════════════════════════════════════════════════════════════
async function fetchTio(type,imdb,s,e){
    var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    var cfg=getTorrentioConfig();var url=TORRENTIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';
    var r=await fetch(url);if(!r.ok)throw new Error('Torrentio '+r.status);var d=await r.json();
    return(d.streams||[]).map(function(x){return parseStream(x,'torrentio');});
}

async function fetchAio(type,imdb,s,e){
    var base=getAioUrl();if(!base)throw new Error('AIO chưa cấu hình');
    var t=type==='tv'?'series':'movie',id=imdb;if(type==='tv'&&s&&e)id=imdb+':'+s+':'+e;
    var r=await fetch(base+'/stream/'+t+'/'+id+'.json');if(!r.ok)throw new Error('AIO '+r.status);var d=await r.json();
    return(d.streams||[]).map(function(x){return parseStream(x,'aio');});
}

async function getStreams(type,imdb,s,e){
    return getEngine()==='aio'?await fetchAio(type,imdb,s,e):await fetchTio(type,imdb,s,e);
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
            await new Promise(function(r2){setTimeout(r2,2000);});
            
            var info=null;for(var i=0;i<3;i++){try{var r3=await fetch(getTsUrl('/torrents'),{method:'POST',headers:getTsHeaders(),body:JSON.stringify({action:'get',hash:hash})});info=await r3.json();if(info&&info.file_stats&&info.file_stats.length)break;}catch(e){}await new Promise(function(r4){setTimeout(r4,1500);});}
            
            if(info&&info.file_stats){
                var vids=info.file_stats.filter(function(f){return(f.path||'').match(/\.(mp4|mkv|avi|webm|ts|m2ts)$/i);}).sort(function(a,b){return(a.id||0)-(b.id||0);});
                if(vids.length>1&&stream.fileIdx===undefined){
                    Lampa.Select.show({title:'Chọn file',items:vids.map(function(f){return{title:(f.path||'').split('/').pop()+(f.length?' ('+(f.length/1048576).toFixed(0)+'MB)':''),value:f.id||0};}),
                        onSelect:function(a){Lampa.Player.play({title:title,url:getTsUrl('/stream/fname?link='+hash+'&index='+a.value+'&play')});},onBack:function(){Lampa.Controller.toggle('content');}});return;}
            }
            Lampa.Player.play({title:title,url:getTsUrl('/stream/fname?link='+hash+'&index='+(stream.fileIdx||0)+'&play')});
        }catch(e){Lampa.Noty.show('TS lỗi: '+(e.message||''));}
        return;
    }
    if(stream.url){Lampa.Player.play({title:title,url:stream.url});return;}
    Lampa.Noty.show(stream.hash?'Cần TorrServer':'Không có link');
}

// ══════════════════════════════════════════════════════════════
// STREAM CARDS
// ══════════════════════════════════════════════════════════════
var E=function(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};

function qClass(q){
    if(!q)return'tp-q';
    if(q.indexOf('2160')>-1||q.indexOf('4K')>-1||q.indexOf('UHD')>-1)return'tp-q tp-q4';
    if(q.indexOf('1080')>-1)return'tp-q tp-q1';
    if(q.indexOf('720')>-1)return'tp-q tp-q7';
    return'tp-q';
}

function mkCard(s,title,poster){
    var ts=!!getTsHost(),sn=s.seedNum||0;
    var sc2=sn>=10?'tp-sg':sn>=3?'tp-sw':'tp-sd';
    
    var h='<div class="tp-card selector"><div class="tp-top">';
    if(s.quality)h+='<span class="tp-badge '+qClass(s.quality)+'">'+E(s.quality)+'</span>';
    if(s.codec)h+='<span class="tp-badge tp-codec">'+E(s.codec)+'</span>';
    if(s.audio)h+='<span class="tp-badge tp-audio">'+E(s.audio)+'</span>';
    if(s.lang)h+='<span>'+s.lang+'</span>';
    if(ts&&s.hash)h+='<span class="tp-ts">→ TS</span>';
    h+='</div><div class="tp-name">'+E(s.title)+'</div><div class="tp-meta">';
    if(s.seeds)h+='<span class="tp-mi '+sc2+'">👤 '+E(s.seeds)+' seeds</span>';
    if(s.size)h+='<span class="tp-mi tp-sz">💾 '+E(s.size)+'</span>';
    if(s.source)h+='<span class="tp-mi tp-src">🔗 '+E(s.source)+'</span>';
    h+='</div>';
    if(s.filename){var fn=s.filename.length>80?s.filename.substring(0,80)+'…':s.filename;h+='<div class="tp-fn">📁 '+E(fn)+'</div>';}
    h+='</div>';
    
    var card=$(h);
    card.on('hover:enter',function(){playStream(s,title,poster);});
    card.on('click',function(e){e.preventDefault();playStream(s,title,poster);});
    return card;
}

var SORTS={
    seeds:function(a,b){return b.seedNum-a.seedNum;},
    quality:function(a,b){return b.qScore-a.qScore||b.seedNum-a.seedNum;},
    size_d:function(a,b){return b.sizeBytes-a.sizeBytes;},
    size_a:function(a,b){return a.sizeBytes-b.sizeBytes;}
};

function renderList(container,streams,title,poster,sortKey){
    sortKey=sortKey||'seeds';
    var sorted=streams.slice().sort(SORTS[sortKey]||SORTS.seeds);
    container.empty();
    
    var header=$('<div class="tp-header"><span class="tp-count">'+streams.length+' streams</span><div class="tp-sort"></div></div>');
    [{k:'seeds',n:'👤 Seeds'},{k:'quality',n:'🎬 Quality'},{k:'size_d',n:'💾 Lớn→Nhỏ'},{k:'size_a',n:'💾 Nhỏ→Lớn'}].forEach(function(s){
        var btn=$('<div class="tp-sort-btn selector'+(sortKey===s.k?' active':'')+'">'+s.n+'</div>');
        btn.on('hover:enter click',function(e){e.preventDefault();renderList(container,streams,title,poster,s.k);});
        header.find('.tp-sort').append(btn);
    });
    container.append(header);
    
    var list=$('<div class="tp-list"></div>');
    sorted.forEach(function(s){list.append(mkCard(s,title,poster));});
    container.append(list);
}

// Show in a container element (for inline use in detail page)
function showInContainer(container,streams,title,poster){
    injectCSS();
    if(!streams||!streams.length){container.html('<div class="tp-empty">❌ Không tìm thấy torrent</div>');return;}
    var wrap=$('<div class="tp-wrap"></div>');
    renderList(wrap,streams,title,poster,'seeds');
    container.empty().append(wrap);
}

// Show as full page
function showStreams(streams,title,poster){
    if(!streams||!streams.length){Lampa.Noty.show('Không có stream');return;}
    Lampa.Activity.push({url:'',title:'🧲 '+title,component:'tp_list',_streams:streams,_title:title,_poster:poster,page:1});
}

// Streams page
Lampa.Component.add('tp_list',function(obj){
    var sc=new Lampa.Scroll({mask:true,over:true}),comp=this;
    this.create=function(){
        injectCSS();try{sc.render().find('.scroll__body').empty();}catch(e){}
        var w=$('<div style="padding:0.5em"></div>');
        w.append('<div style="font-size:1.3em;font-weight:bold;color:#fff;margin-bottom:0.5em">🧲 '+E(obj._title||'')+'</div>');
        var container=$('<div></div>');w.append(container);
        renderList(container,obj._streams||[],obj._title||'',obj._poster||'','seeds');
        sc.append(w);comp.start();
    };
    this.start=function(){initCtrl(sc);};
    this.pause=function(){};this.stop=function(){};
    this.render=function(){return sc.render();};
    this.destroy=function(){sc.destroy();};
});

// ══════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════
function register(){
    injectCSS();
    addSettingsMenu();
    
    if(window.KK){
        window.KK.register({
            id:'torrent',name:'Torrent',type:'torrent',icon:'🧲',
            description:'Torrentio / AIO',priority:5,enabled:true,settings:null,
            getStreams:getStreams,play:playStream,
            showStreams:showStreams,showInContainer:showInContainer,
            openSettings:openSettings
        });
    }
    
    window.TorrentParser={
        getStreams:getStreams,play:playStream,
        showStreams:showStreams,showInContainer:showInContainer,
        openSettings:openSettings,testTS:testTS,testAio:testAio
    };
    
    console.log('[Torrent] v1.3 | Engine:',getEngine(),'| TS:',getTsHost()||'none');
}

if(window.appready)register();
else Lampa.Listener.follow('app',function(e){if(e.type==='ready')register();});

})();