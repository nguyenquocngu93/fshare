/* VOD Parser - KKPhim + OPhim */
(function(){
'use strict';

var SOURCES={
    kkphim:{
        id:'kkphim',
        name:'KKPhim',
        api:'https://phimapi.com/',
        img:'https://phimimg.com/',
        icon:'🎬',
        priority:10
    },
    ophim:{
        id:'ophim',
        name:'OPhim',
        api:'https://ophim1.com/',
        img:'https://img.ophim.live/uploads/movies/',
        icon:'📺',
        priority:9
    }
};

function ns(s){return String(s||'').toLowerCase().trim().replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g,'').replace(/\s+/g,' ');}

// ══════════════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════════════
async function searchSource(src,title,orig,year){
    var terms=[title];
    if(orig&&orig!==title)terms.push(orig);
    if(year){terms.push(title+' '+year);if(orig&&orig!==title)terms.push(orig+' '+year);}
    // Clean special chars
    var clean=title.replace(/[:\-–—]/g,' ').trim();
    if(clean!==title)terms.push(clean);
    
    for(var i=0;i<terms.length;i++){
        try{
            var r=await fetch(src.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(terms[i])+'&page=1');
            var d=await r.json();
            var items=(d&&d.data&&d.data.items)||(d&&d.items)||[];
            var best=matchBest(items,title,orig,year);
            if(best)return best;
        }catch(e){}
    }
    return null;
}

function matchBest(items,t,o,y){
    if(!items||!items.length)return null;
    var nT=ns(t),nO=ns(o||'');
    
    // Exact match
    for(var i=0;i<items.length;i++){
        var it=items[i],n1=ns(it.name||''),n2=ns(it.origin_name||'');
        if((nT&&(n1===nT||n2===nT))||(nO&&(n1===nO||n2===nO))){
            if(!y||!it.year||String(it.year)===String(y)||Math.abs(parseInt(it.year)-parseInt(y))<=1){
                return{slug:it.slug,name:it.name,year:it.year,origin_name:it.origin_name};
            }
        }
    }
    // Partial match
    for(var j=0;j<items.length;j++){
        var it2=items[j],m1=ns(it2.name||''),m2=ns(it2.origin_name||'');
        if((nT&&(m1.indexOf(nT)>-1||nT.indexOf(m1)>-1))||(nO&&(m2.indexOf(nO)>-1||nO.indexOf(m2)>-1))){
            if(!y||!it2.year||Math.abs(parseInt(it2.year)-parseInt(y))<=1){
                return{slug:it2.slug,name:it2.name,year:it2.year,origin_name:it2.origin_name};
            }
        }
    }
    return null;
}

// ══════════════════════════════════════════════════════════════
// GET EPISODES
// ══════════════════════════════════════════════════════════════
async function getEpisodes(src,slug){
    var r=await fetch(src.api+'phim/'+slug);
    var d=await r.json();
    return d.episodes||[];
}

// ══════════════════════════════════════════════════════════════
// GET HOME
// ══════════════════════════════════════════════════════════════
async function getHome(src,page){
    var r=await fetch(src.api+'danh-sach/phim-moi-cap-nhat?page='+(page||1));
    var d=await r.json();
    var items=(d&&d.items)||[];
    return{
        items:items.map(function(i){
            return{
                name:i.name,origin_name:i.origin_name,slug:i.slug,
                poster_url:i.poster_url,thumb_url:i.thumb_url,
                year:i.year,quality:i.quality,type:i.type
            };
        }),
        hasNext:items.length>=20
    };
}

// ══════════════════════════════════════════════════════════════
// SEARCH SEASONS (for TV shows with multiple seasons)
// ══════════════════════════════════════════════════════════════
function extractSeason(name,slug){
    var ps=[/season\s*(\d+)/i,/ph[aầ]n\s*(\d+)/i,/m[uù]a\s*(\d+)/i,/s(\d+)(?:\s|$|e)/i,/-season-(\d+)/i,/-phan-(\d+)/i];
    for(var i=0;i<ps.length;i++){
        var m=(name+' '+slug).match(ps[i]);
        if(m)return parseInt(m[1]);
    }
    var nm=name.match(/(\d+)$/)||slug.match(/-(\d+)$/);
    if(nm){var v=parseInt(nm[1]);if(v>=2&&v<=30)return v;}
    return 1;
}

async function searchSeasons(src,title,orig){
    var results=[],seen={};
    var terms=[title];
    if(orig&&orig!==title)terms.push(orig);
    
    for(var i=0;i<terms.length;i++){
        try{
            var r=await fetch(src.api+'v1/api/tim-kiem?keyword='+encodeURIComponent(terms[i])+'&page=1');
            var d=await r.json();
            var items=(d&&d.data&&d.data.items)||(d&&d.items)||[];
            
            var nT=ns(title),nO=ns(orig||'');
            for(var j=0;j<items.length;j++){
                var it=items[j];
                if(!it.slug||seen[it.slug])continue;
                
                var n1=ns(it.name||''),n2=ns(it.origin_name||'');
                var match=false;
                if(nT&&(n1.indexOf(nT)>-1||nT.indexOf(n1)>-1))match=true;
                if(nO&&(n2.indexOf(nO)>-1||nO.indexOf(n2)>-1))match=true;
                if(!match&&results.length>0){
                    var bs=ns(results[0].slug),cs=ns(it.slug);
                    if(cs.indexOf(bs)>-1||bs.indexOf(cs)>-1)match=true;
                }
                
                if(match){
                    seen[it.slug]=true;
                    results.push({
                        slug:it.slug,
                        name:it.name||'',
                        season:extractSeason(it.name||'',it.slug||''),
                        year:it.year
                    });
                }
            }
        }catch(e){}
    }
    
    results.sort(function(a,b){return a.season-b.season;});
    return results;
}

// ══════════════════════════════════════════════════════════════
// MAIN: GET STREAMS
// ══════════════════════════════════════════════════════════════
async function getStreams(srcId,title,orig,year,mediaType,tmdbSeasons){
    var src=SOURCES[srcId];
    if(!src)return{found:false,episodes:[]};
    
    // For TV with multiple seasons, search all season variants
    if(mediaType==='tv'&&tmdbSeasons&&tmdbSeasons.length>1){
        var seasonSlugs=await searchSeasons(src,title,orig);
        if(seasonSlugs.length){
            return{
                found:true,
                type:'multi_season',
                seasons:seasonSlugs,
                source:src
            };
        }
    }
    
    // Single search
    var found=await searchSource(src,title,orig,year);
    if(!found||!found.slug)return{found:false,episodes:[]};
    
    var eps=await getEpisodes(src,found.slug);
    return{
        found:true,
        type:'single',
        slug:found.slug,
        episodes:eps,
        source:src
    };
}

// Load season episodes
async function loadSeasonEpisodes(srcId,slug){
    var src=SOURCES[srcId];
    if(!src)return[];
    return await getEpisodes(src,slug);
}

// ══════════════════════════════════════════════════════════════
// REGISTER WITH CORE
// ══════════════════════════════════════════════════════════════
function register(){
    if(!window.KK){console.warn('[VOD] Core not loaded');return;}
    
    for(var key in SOURCES){
        (function(srcId,src){
            window.KK.register({
                id:srcId,
                name:src.name,
                type:'vod',
                icon:src.icon,
                description:src.api.replace('https://','').replace('/',''),
                priority:src.priority,
                enabled:true,
                imgBase:src.img,
                
                // Interface methods
                search:function(t,o,y){return searchSource(src,t,o,y);},
                getEpisodes:function(slug){return getEpisodes(src,slug);},
                getHome:function(page){return getHome(src,page);},
                getStreams:function(t,o,y,mt,tid,tSn){return getStreams(srcId,t,o,y,mt,tSn);},
                loadSeasonEpisodes:function(slug){return loadSeasonEpisodes(srcId,slug);},
                searchSeasons:function(t,o){return searchSeasons(src,t,o);}
            });
        })(key,SOURCES[key]);
    }
    
    console.log('[VOD] Registered:',Object.keys(SOURCES).join(', '));
}

// Wait for core or register immediately
if(window.KK)register();
else{
    var checkCore=setInterval(function(){
        if(window.KK){clearInterval(checkCore);register();}
    },100);
    setTimeout(function(){clearInterval(checkCore);},5000);
}

})();