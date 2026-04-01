/* Torrent Parser - Torrentio + AIOStreams + Lampa Settings */
(function(){
'use strict';

var TORRENTIO_BASE='https://torrentio.strem.fun';

// ══════════════════════════════════════════════════════════════
// SETTINGS - Compatible with old KKPhim settings
// ══════════════════════════════════════════════════════════════

// Old KKPhim settings keys
var OLD_STG_KEY='kkphim_v5';  // hoặc 'kkphim_stg' tùy version cũ
var OLD_STG_KEY_V4='kkphim_stg';

function getOldSetting(key){
    // Try v5 format
    try{
        var s=JSON.parse(localStorage.getItem(OLD_STG_KEY)||'{}');
        if(s[key]!==undefined)return s[key];
    }catch(e){}
    // Try v4 format
    try{
        var s2=JSON.parse(localStorage.getItem(OLD_STG_KEY_V4)||'{}');
        if(s2[key]!==undefined)return s2[key];
    }catch(e){}
    // Try KK.get if core loaded
    if(window.KK&&window.KK.get){
        var v=window.KK.get(key);
        if(v!==undefined)return v;
    }
    return undefined;
}

// Get setting: Lampa Storage > Old KKPhim > Default
function getSetting(lampaKey,oldKey,def){
    // 1. Check Lampa Storage (new settings)
    var lampaVal=Lampa.Storage.get(lampaKey,'');
    if(lampaVal!==''&&lampaVal!==undefined&&lampaVal!==null)return lampaVal;
    
    // 2. Check old KKPhim settings
    var oldVal=getOldSetting(oldKey);
    if(oldVal!==undefined&&oldVal!==''&&oldVal!==null)return oldVal;
    
    // 3. Return default
    return def;
}

// ══════════════════════════════════════════════════════════════
// REGISTER LAMPA SETTINGS
// ══════════════════════════════════════════════════════════════
function registerSettings(){
    // Add settings component
    Lampa.SettingsApi.addComponent({
        component:'torrent_settings',
        name:'🧲 Torrent',
        icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>'
    });

    // Engine selection
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'torrent_engine',
            type:'select',
            values:{
                torrentio:'Torrentio',
                aio:'AIOStreams'
            },
            default:'torrentio'
        },
        field:{
            name:'Nguồn Torrent',
            description:'Chọn nguồn lấy link torrent'
        },
        onChange:function(val){
            Lampa.Storage.set('torrent_engine',val);
        },
        onRender:function(elem){
            // Load old value if exists
            var old=getOldSetting('torrent_engine')||getOldSetting('t_eng');
            if(old&&!Lampa.Storage.get('torrent_engine','')){
                setTimeout(function(){
                    Lampa.Storage.set('torrent_engine',old);
                },100);
            }
        }
    });

    // Torrentio config
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'torrentio_config',
            type:'input',
            default:''
        },
        field:{
            name:'Torrentio Config',
            description:'Dán link manifest.json từ torrentio.strem.fun/configure'
        },
        onChange:function(val){
            Lampa.Storage.set('torrentio_config',val);
        },
        onRender:function(elem){
            // Show old value if new is empty
            var old=getOldSetting('torrentio_config')||getOldSetting('tio_cfg')||getOldSetting('tio_config');
            if(old&&!Lampa.Storage.get('torrentio_config','')){
                elem.find('.settings-param__value').text(old.substring(0,30)+'...');
            }
        }
    });

    // AIO URL
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'aio_url',
            type:'input',
            default:''
        },
        field:{
            name:'AIOStreams URL',
            description:'URL manifest.json của AIOStreams'
        },
        onChange:function(val){
            Lampa.Storage.set('aio_url',val);
        },
        onRender:function(elem){
            var old=getOldSetting('aio_url');
            if(old&&!Lampa.Storage.get('aio_url','')){
                elem.find('.settings-param__value').text(old.substring(0,30)+'...');
            }
        }
    });

    // TorrServer host
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'ts_host',
            type:'input',
            default:''
        },
        field:{
            name:'TorrServer IP',
            description:'Ví dụ: 192.168.1.100:8090'
        },
        onChange:function(val){
            Lampa.Storage.set('ts_host',val);
        },
        onRender:function(elem){
            var old=getOldSetting('ts_host')||getOldSetting('torrserver_host');
            if(old&&!Lampa.Storage.get('ts_host','')){
                elem.find('.settings-param__value').text(old);
            }
        }
    });

    // TorrServer password
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'ts_password',
            type:'input',
            default:''
        },
        field:{
            name:'TorrServer Password',
            description:'Để trống nếu không có mật khẩu'
        },
        onChange:function(val){
            Lampa.Storage.set('ts_password',val);
        },
        onRender:function(elem){
            var old=getOldSetting('ts_pw')||getOldSetting('torrserver_password');
            if(old&&!Lampa.Storage.get('ts_password','')){
                elem.find('.settings-param__value').text('••••');
            }
        }
    });

    // Test TorrServer button
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'ts_test',
            type:'button'
        },
        field:{
            name:'🧪 Test TorrServer',
            description:'Kiểm tra kết nối TorrServer'
        },
        onChange:function(){
            testTorrServer();
        }
    });

    // Test AIO button
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'aio_test',
            type:'button'
        },
        field:{
            name:'🧪 Test AIOStreams',
            description:'Kiểm tra AIO với phim Inception'
        },
        onChange:function(){
            testAio();
        }
    });

    // Migrate button
    Lampa.SettingsApi.addParam({
        component:'torrent_settings',
        param:{
            name:'migrate_old',
            type:'button'
        },
        field:{
            name:'📦 Import từ KKPhim cũ',
            description:'Copy settings từ plugin KKPhim cũ sang đây'
        },
        onChange:function(){
            migrateOldSettings();
        }
    });

    console.log('[Torrent] Settings registered');
}

// Migrate old settings to Lampa Storage
function migrateOldSettings(){
    var count=0;
    
    // Torrentio config
    var tio=getOldSetting('torrentio_config')||getOldSetting('tio_cfg')||getOldSetting('tio_config');
    if(tio){Lampa.Storage.set('torrentio_config',tio);count++;}
    
    // AIO URL
    var aio=getOldSetting('aio_url');
    if(aio){Lampa.Storage.set('aio_url',aio);count++;}
    
    // Engine
    var eng=getOldSetting('torrent_engine')||getOldSetting('t_eng');
    if(eng){Lampa.Storage.set('torrent_engine',eng);count++;}
    
    // TorrServer
    var tsH=getOldSetting('ts_host')||getOldSetting('torrserver_host');
    if(tsH){Lampa.Storage.set('ts_host',tsH);count++;}
    
    var tsP=getOldSetting('ts_pw')||getOldSetting('torrserver_password');
    if(tsP){Lampa.Storage.set('ts_password',tsP);count++;}
    
    if(count>0){
        Lampa.Noty.show('✅ Đã import '+count+' settings!');
    }else{
        Lampa.Noty.show('ℹ️ Không tìm thấy settings cũ');
    }
}

// ══════════════════════════════════════════════════════════════
// GET SETTINGS (check all sources)
// ══════════════════════════════════════════════════════════════
function getEngine(){
    return getSetting('torrent_engine','t_eng','torrentio')||
           getSetting('torrent_engine','torrent_engine','torrentio');
}

function getTorrentioConfig(){
    var cfg=getSetting('torrentio_config','tio_cfg','')||
            getSetting('torrentio_config','tio_config','')||
            getSetting('torrentio_config','torrentio_config','');
    
    if(!cfg)return'';
    cfg=String(cfg).trim();
    
    // Parse config from various formats
    var m=cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||
          cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i)||
          cfg.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if(m)return m[1].replace(/\/+$/,'');
    if(cfg.indexOf('torrentio.strem.fun')>-1)return'';
    return cfg.replace(/^\/+|\/+$/g,'');
}

function getAioUrl(){
    var url=getSetting('aio_url','aio_url','');
    if(!url)return'';
    return String(url).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}

function getTsHost(){
    return getSetting('ts_host','ts_host','')||
           getSetting('ts_host','torrserver_host','');
}

function getTsPw(){
    return getSetting('ts_password','ts_pw','')||
           getSetting('ts_password','torrserver_password','');
}

function getTsUrl(path){
    var h=getTsHost();
    if(!h)return'';
    h=h.replace(/\/+$/,'');
    if(h.indexOf('http')!==0)h='http://'+h;
    return h+path;
}

function getTsHeaders(){
    var headers={'Content-Type':'application/json'};
    var pw=getTsPw();
    if(pw)headers.Authorization='Basic '+btoa('admin:'+pw);
    return headers;
}

// ══════════════════════════════════════════════════════════════
// TEST FUNCTIONS
// ══════════════════════════════════════════════════════════════
async function testTorrServer(){
    var host=getTsHost();
    if(!host){
        Lampa.Noty.show('❌ Chưa nhập địa chỉ TorrServer');
        return{ok:false,error:'Chưa cấu hình'};
    }
    
    Lampa.Noty.show('⏳ Đang kết nối '+host+'...');
    
    try{
        var url=getTsUrl('/echo');
        var r=await fetch(url,{method:'GET',headers:getTsHeaders()});
        
        if(r.ok){
            var txt=await r.text();
            try{
                var r2=await fetch(getTsUrl('/stat'),{method:'GET',headers:getTsHeaders()});
                if(r2.ok){
                    var stats=await r2.json();
                    Lampa.Noty.show('✅ TorrServer v'+(stats.version||'?')+' | '+stats.torrents_count+' torrents');
                    return{ok:true,stats:stats};
                }
            }catch(e){}
            Lampa.Noty.show('✅ TorrServer OK!');
            return{ok:true,echo:txt};
        }else if(r.status===401){
            Lampa.Noty.show('❌ Sai mật khẩu TorrServer');
            return{ok:false,error:'Sai mật khẩu'};
        }else{
            Lampa.Noty.show('❌ HTTP '+r.status);
            return{ok:false,error:'HTTP '+r.status};
        }
    }catch(e){
        Lampa.Noty.show('❌ Lỗi: '+(e.message||'Không kết nối được'));
        return{ok:false,error:e.message};
    }
}

async function testAio(){
    var base=getAioUrl();
    if(!base){
        Lampa.Noty.show('❌ Chưa nhập AIO URL');
        return{ok:false,error:'Chưa cấu hình'};
    }
    
    Lampa.Noty.show('⏳ Đang test AIO...');
    
    try{
        var r=await fetch(base+'/stream/movie/tt1375666.json');
        if(!r.ok){
            Lampa.Noty.show('❌ AIO HTTP '+r.status);
            return{ok:false,error:'HTTP '+r.status};
        }
        var d=await r.json();
        if(!d.streams||!d.streams.length){
            Lampa.Noty.show('❌ AIO không có stream');
            return{ok:false,error:'Không có stream'};
        }
        Lampa.Noty.show('✅ AIO OK! '+d.streams.length+' streams');
        return{ok:true,count:d.streams.length};
    }catch(e){
        Lampa.Noty.show('❌ AIO lỗi: '+(e.message||''));
        return{ok:false,error:e.message};
    }
}

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parseStream(st,parserId){
    var rn=String(st.name||''),rd=String(st.description||''),rt=String(st.title||'');
    var ra=rn+'\n'+rd+'\n'+rt;
    var name=rn.split('\n')[0].trim()||rt.split('\n')[0].trim()||'?';
    
    var q='',qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm)q=qm[0].toUpperCase();
    
    var sz='';
    var sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(TB|GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2]:sm[1];
    
    var sd='';
    var se=ra.match(/👤\s*(\d+)/i)||ra.match(/Seeders?:?\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);
    if(se)sd=se[1];
    
    var source='';
    var srm=ra.match(/🔗\s*([\w\.\-]+)/i)||ra.match(/\[([A-Z0-9\-]+)\]/);
    if(srm)source=srm[1];
    
    if(st.behaviorHints){
        var bh=st.behaviorHints;
        if(!sz&&bh.videoSize){
            var b=Number(bh.videoSize);
            if(b>=1099511627776)sz=(b/1099511627776).toFixed(2)+' TB';
            else if(b>=1073741824)sz=(b/1073741824).toFixed(1)+' GB';
            else if(b>=1048576)sz=(b/1048576).toFixed(0)+' MB';
        }
        if(!q&&bh.filename){
            var fq=bh.filename.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR)\b/i);
            if(fq)q=fq[1].toUpperCase();
        }
    }
    
    return{
        title:name,url:st.url||'',hash:st.infoHash||'',fileIdx:st.fileIdx,
        quality:q,size:sz,seeds:sd,source:source,parser:parserId
    };
}

// ══════════════════════════════════════════════════════════════
// FETCH STREAMS
// ══════════════════════════════════════════════════════════════
async function fetchTorrentio(type,imdbId,season,episode){
    var t=type==='tv'?'series':'movie';
    var id=imdbId;
    if(type==='tv'&&season&&episode)id=imdbId+':'+season+':'+episode;
    
    var cfg=getTorrentioConfig();
    var url=TORRENTIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';
    
    console.log('[Torrent] Fetch:',url);
    
    var r=await fetch(url);
    if(!r.ok)throw new Error('Torrentio '+r.status);
    var d=await r.json();
    
    return(d.streams||[]).map(function(s){return parseStream(s,'torrentio');});
}

async function fetchAio(type,imdbId,season,episode){
    var base=getAioUrl();
    if(!base)throw new Error('AIO chưa cấu hình');
    
    var t=type==='tv'?'series':'movie';
    var id=imdbId;
    if(type==='tv'&&season&&episode)id=imdbId+':'+season+':'+episode;
    
    var url=base+'/stream/'+t+'/'+id+'.json';
    
    console.log('[Torrent] Fetch AIO:',url);
    
    var r=await fetch(url);
    if(!r.ok)throw new Error('AIO '+r.status);
    var d=await r.json();
    
    return(d.streams||[]).map(function(s){return parseStream(s,'aio');});
}

async function getStreams(type,imdbId,season,episode){
    var engine=getEngine();
    console.log('[Torrent] Engine:',engine,'| Type:',type,'| IMDB:',imdbId);
    
    if(engine==='aio'){
        return await fetchAio(type,imdbId,season,episode);
    }else{
        return await fetchTorrentio(type,imdbId,season,episode);
    }
}

// ══════════════════════════════════════════════════════════════
// TORRSERVER PLAY
// ══════════════════════════════════════════════════════════════
async function playViaTorrServer(stream,title,poster){
    var tsUrl=getTsUrl('/torrents');
    if(!tsUrl){Lampa.Noty.show('Chưa cấu hình TorrServer');return false;}
    
    Lampa.Noty.show('Gửi TorrServer...');
    try{
        var mag='magnet:?xt=urn:btih:'+stream.hash;
        ['udp://tracker.opentrackr.org:1337/announce','udp://open.stealth.si:80/announce'].forEach(function(tr){
            mag+='&tr='+encodeURIComponent(tr);
        });
        
        var r=await fetch(tsUrl,{
            method:'POST',headers:getTsHeaders(),
            body:JSON.stringify({action:'add',link:mag,title:title||'',poster:poster||'',save_to_db:false})
        });
        
        if(!r.ok)throw new Error('TS:'+r.status);
        var td=await r.json();
        var hash=td.hash||stream.hash;
        
        await new Promise(function(res){setTimeout(res,2000);});
        
        var info=null;
        for(var rt=0;rt<3;rt++){
            try{
                var r2=await fetch(tsUrl,{method:'POST',headers:getTsHeaders(),body:JSON.stringify({action:'get',hash:hash})});
                info=await r2.json();
                if(info&&info.file_stats&&info.file_stats.length)break;
            }catch(e){}
            await new Promise(function(res){setTimeout(res,1500);});
        }
        
        var playUrl=getTsUrl('/stream/fname?link='+hash+'&index='+(stream.fileIdx||0)+'&play');
        
        if(info&&info.file_stats){
            var videos=info.file_stats.filter(function(f){
                return(f.path||'').toLowerCase().match(/\.(mp4|mkv|avi|mov|webm|ts|m2ts)$/);
            }).sort(function(a,b){return(a.id||0)-(b.id||0);});
            
            if(videos.length>1&&stream.fileIdx===undefined){
                Lampa.Select.show({
                    title:'Chọn file ('+videos.length+')',
                    items:videos.map(function(f){
                        var name=(f.path||'').split('/').pop();
                        var size=f.length?(f.length/1048576).toFixed(0)+' MB':'';
                        return{title:name+(size?' ('+size+')':''),value:f.id||0};
                    }),
                    onSelect:function(a){
                        Lampa.Player.play({title:title,url:getTsUrl('/stream/fname?link='+hash+'&index='+a.value+'&play')});
                    },
                    onBack:function(){Lampa.Controller.toggle('content');}
                });
                return true;
            }
        }
        
        Lampa.Player.play({title:title,url:playUrl});
        return true;
    }catch(e){
        Lampa.Noty.show('TorrServer lỗi: '+(e.message||''));
        return false;
    }
}

async function playStream(stream,title,poster){
    if(stream.hash&&getTsHost()){
        return await playViaTorrServer(stream,title,poster);
    }
    if(stream.url){
        Lampa.Player.play({title:title,url:stream.url});
        return true;
    }
    if(stream.hash){
        Lampa.Noty.show('Cần cấu hình TorrServer để phát');
    }else{
        Lampa.Noty.show('Không có link');
    }
    return false;
}

function showStreams(streams,title,poster){
    if(!streams||!streams.length){
        Lampa.Noty.show('Không có stream');
        return;
    }
    
    var ts=!!getTsHost();
    var items=streams.slice(0,50).map(function(s){
        var label=s.title||'Stream';
        if(s.quality&&label.toUpperCase().indexOf(s.quality)===-1)label+=' ['+s.quality+']';
        var meta=[];
        if(s.size)meta.push('💾 '+s.size);
        if(s.seeds)meta.push('👤 '+s.seeds);
        if(s.source)meta.push('🔗 '+s.source);
        if(meta.length)label+='\n'+meta.join('  ');
        return{title:label,value:s};
    });
    
    Lampa.Select.show({
        title:'Torrent: '+title+' ('+streams.length+')'+(ts?' → TS':''),
        items:items,
        onSelect:function(a){playStream(a.value,title,poster);},
        onBack:function(){Lampa.Controller.toggle('content');}
    });
}

// ══════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════
function register(){
    // Register Lampa Settings
    registerSettings();
    
    // Register with KK Core if available
    if(window.KK){
        window.KK.register({
            id:'torrent',
            name:'Torrent',
            type:'torrent',
            icon:'🧲',
            description:'Torrentio / AIO',
            priority:5,
            enabled:true,
            settings:null, // Using Lampa native settings
            
            getStreams:getStreams,
            play:playStream,
            showStreams:showStreams,
            getEngine:getEngine,
            getTsHost:getTsHost,
            testTorrServer:testTorrServer,
            testAio:testAio
        });
        console.log('[Torrent] Registered with KK Core');
    }
    
    // Expose globally for standalone use
    window.TorrentParser={
        getStreams:getStreams,
        play:playStream,
        showStreams:showStreams,
        testTorrServer:testTorrServer,
        testAio:testAio,
        getEngine:getEngine,
        getTsHost:getTsHost,
        getTorrentioConfig:getTorrentioConfig,
        getAioUrl:getAioUrl
    };
    
    console.log('[Torrent] Ready | Engine:',getEngine(),'| TS:',getTsHost()||'none');
}

// Wait for Lampa
if(window.appready){
    register();
}else{
    Lampa.Listener.follow('app',function(e){
        if(e.type==='ready')register();
    });
}

})();