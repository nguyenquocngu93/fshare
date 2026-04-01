/* Torrent Parser - Torrentio + AIOStreams */
(function(){
'use strict';

var TORRENTIO_BASE='https://torrentio.strem.fun';

// ══════════════════════════════════════════════════════════════
// PARSE STREAM
// ══════════════════════════════════════════════════════════════
function parseStream(st,parserId){
    var rn=String(st.name||''),rd=String(st.description||''),rt=String(st.title||'');
    var ra=rn+'\n'+rd+'\n'+rt;
    var name=rn.split('\n')[0].trim()||rt.split('\n')[0].trim()||'?';
    
    // Quality
    var q='',qm=ra.match(/\b(2160p|4K|UHD|1080p|720p|480p|HDR10?\+?|BluRay|WEB-?DL|REMUX)\b/gi);
    if(qm)q=qm[0].toUpperCase();
    
    // Size
    var sz='';
    var sm=ra.match(/💾\s*([\d.,]+\s*(?:TB|GB|MB))/i)||ra.match(/\b([\d.,]+)\s*(TB|GB|MB)\b/i);
    if(sm)sz=sm[2]?sm[1]+' '+sm[2]:sm[1];
    
    // Seeds
    var sd='';
    var se=ra.match(/👤\s*(\d+)/i)||ra.match(/Seeders?:?\s*(\d+)/i)||ra.match(/(\d+)\s*seed/i);
    if(se)sd=se[1];
    
    // Source
    var source='';
    var srm=ra.match(/🔗\s*([\w\.\-]+)/i)||ra.match(/\[([A-Z0-9\-]+)\]/);
    if(srm)source=srm[1];
    
    // From behaviorHints
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
        if(!q&&bh.bingeGroup){
            var bq=bh.bingeGroup.match(/\b(2160p|4K|UHD|1080p|720p|480p)\b/i);
            if(bq)q=bq[1].toUpperCase();
        }
    }
    
    return{
        title:name,
        url:st.url||'',
        hash:st.infoHash||'',
        fileIdx:st.fileIdx,
        quality:q,
        size:sz,
        seeds:sd,
        source:source,
        parser:parserId
    };
}

// ══════════════════════════════════════════════════════════════
// TORRENTIO
// ══════════════════════════════════════════════════════════════
function getTorrentioConfig(){
    var cfg=window.KK?window.KK.get('torrentio_config',''):'';
    if(!cfg)return'';
    cfg=String(cfg).trim();
    var m=cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/manifest/i)||
          cfg.match(/torrentio\.strem\.fun\/([^\/]+?)\/stream/i)||
          cfg.match(/torrentio\.strem\.fun\/configure\/([^\s]+)/i);
    if(m)return m[1].replace(/\/+$/,'');
    if(cfg.indexOf('torrentio.strem.fun')>-1)return'';
    return cfg.replace(/^\/+|\/+$/g,'');
}

async function fetchTorrentio(type,imdbId,season,episode){
    var t=type==='tv'?'series':'movie';
    var id=imdbId;
    if(type==='tv'&&season&&episode)id=imdbId+':'+season+':'+episode;
    
    var cfg=getTorrentioConfig();
    var url=TORRENTIO_BASE+(cfg?'/'+cfg:'')+'/stream/'+t+'/'+id+'.json';
    
    var r=await fetch(url);
    if(!r.ok)throw new Error('Torrentio '+r.status);
    var d=await r.json();
    
    return(d.streams||[]).map(function(s){return parseStream(s,'torrentio');});
}

// ══════════════════════════════════════════════════════════════
// AIOSTREAMS
// ══════════════════════════════════════════════════════════════
function getAioUrl(){
    var url=window.KK?window.KK.get('aio_url',''):'';
    if(!url)return'';
    return String(url).trim().replace(/\/manifest\.json\s*$/i,'').replace(/\/+$/,'');
}

async function fetchAio(type,imdbId,season,episode){
    var base=getAioUrl();
    if(!base)throw new Error('AIO chưa cấu hình');
    
    var t=type==='tv'?'series':'movie';
    var id=imdbId;
    if(type==='tv'&&season&&episode)id=imdbId+':'+season+':'+episode;
    
    var url=base+'/stream/'+t+'/'+id+'.json';
    
    var r=await fetch(url);
    if(!r.ok)throw new Error('AIO '+r.status);
    var d=await r.json();
    
    return(d.streams||[]).map(function(s){return parseStream(s,'aio');});
}

// ══════════════════════════════════════════════════════════════
// TORRSERVER
// ══════════════════════════════════════════════════════════════
function getTsHost(){return window.KK?window.KK.get('ts_host',''):'';}
function getTsPw(){return window.KK?window.KK.get('ts_pw',''):'';}

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
            method:'POST',
            headers:getTsHeaders(),
            body:JSON.stringify({action:'add',link:mag,title:title||'',poster:poster||'',save_to_db:false})
        });
        
        if(!r.ok)throw new Error('TS:'+r.status);
        var td=await r.json();
        var hash=td.hash||stream.hash;
        
        // Wait for torrent to load
        await new Promise(function(res){setTimeout(res,2000);});
        
        // Get file list
        var info=null;
        for(var rt=0;rt<3;rt++){
            try{
                var r2=await fetch(tsUrl,{
                    method:'POST',
                    headers:getTsHeaders(),
                    body:JSON.stringify({action:'get',hash:hash})
                });
                info=await r2.json();
                if(info&&info.file_stats&&info.file_stats.length)break;
            }catch(e){}
            await new Promise(function(res){setTimeout(res,1500);});
        }
        
        var playUrl=getTsUrl('/stream/fname?link='+hash+'&index='+(stream.fileIdx||0)+'&play');
        
        // If multiple video files, let user choose
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

// ══════════════════════════════════════════════════════════════
// PLAY STREAM
// ══════════════════════════════════════════════════════════════
async function playStream(stream,title,poster){
    // If has hash and TorrServer configured
    if(stream.hash&&getTsHost()){
        return await playViaTorrServer(stream,title,poster);
    }
    
    // Direct URL
    if(stream.url){
        Lampa.Player.play({title:title,url:stream.url});
        return true;
    }
    
    // No link
    if(stream.hash){
        Lampa.Noty.show('Cần cấu hình TorrServer để phát');
    }else{
        Lampa.Noty.show('Không có link');
    }
    return false;
}

// ══════════════════════════════════════════════════════════════
// GET STREAMS (unified)
// ══════════════════════════════════════════════════════════════
async function getStreams(engine,type,imdbId,season,episode){
    if(engine==='aio'){
        return await fetchAio(type,imdbId,season,episode);
    }else{
        return await fetchTorrentio(type,imdbId,season,episode);
    }
}

// ══════════════════════════════════════════════════════════════
// SHOW STREAMS UI
// ══════════════════════════════════════════════════════════════
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
// REGISTER WITH CORE
// ══════════════════════════════════════════════════════════════
function register(){
    if(!window.KK){console.warn('[Torrent] Core not loaded');return;}
    
    // Single unified torrent parser
    window.KK.register({
        id:'torrent',
        name:'Torrent',
        type:'torrent',
        icon:'🧲',
        description:'Torrentio / AIOStreams',
        priority:5,
        enabled:true,
        
        settings:[
            {key:'torrent_engine',name:'Engine',description:'torrentio hoặc aio',default:'torrentio'},
            {key:'torrentio_config',name:'Torrentio Config',description:'Dán link manifest.json'},
            {key:'aio_url',name:'AIO URL',description:'URL của AIOStreams manifest'},
            {key:'ts_host',name:'TorrServer IP',description:'192.168.1.x:8090'},
            {key:'ts_pw',name:'TorrServer Password',description:'Để trống nếu không có'}
        ],
        
        getStreams:async function(type,imdbId,season,episode){
            var engine=window.KK.get('torrent_engine','torrentio');
            return await getStreams(engine,type,imdbId,season,episode);
        },
        
        play:playStream,
        showStreams:showStreams,
        
        // For testing
        testTorrServer:async function(){
            var url=getTsUrl('/echo');
            if(!url)return{ok:false,error:'Chưa cấu hình'};
            try{
                var r=await fetch(url,{method:'GET',headers:getTsHeaders()});
                if(r.ok){
                    var txt=await r.text();
                    // Get stats
                    var stats=null;
                    try{
                        var r2=await fetch(getTsUrl('/stat'),{method:'GET',headers:getTsHeaders()});
                        if(r2.ok)stats=await r2.json();
                    }catch(e){}
                    return{ok:true,echo:txt,stats:stats};
                }else if(r.status===401){
                    return{ok:false,error:'Sai mật khẩu'};
                }else{
                    return{ok:false,error:'HTTP '+r.status};
                }
            }catch(e){
                return{ok:false,error:e.message||'Lỗi mạng'};
            }
        },
        
        testAio:async function(){
            var base=getAioUrl();
            if(!base)return{ok:false,error:'Chưa cấu hình'};
            try{
                var r=await fetch(base+'/stream/movie/tt1375666.json');
                if(!r.ok)return{ok:false,error:'HTTP '+r.status};
                var d=await r.json();
                if(!d.streams||!d.streams.length)return{ok:false,error:'Không có stream'};
                return{ok:true,count:d.streams.length,sample:d.streams[0]};
            }catch(e){
                return{ok:false,error:e.message||'Lỗi'};
            }
        }
    });
    
    console.log('[Torrent] Registered');
}

if(window.KK)register();
else{
    var checkCore=setInterval(function(){
        if(window.KK){clearInterval(checkCore);register();}
    },100);
    setTimeout(function(){clearInterval(checkCore);},5000);
}

})();