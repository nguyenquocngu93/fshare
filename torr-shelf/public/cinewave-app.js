const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const CLOUDSTREAM_ENABLED = false;

const els = {
  header: $('.cw-header'), headerBrand: $('.cw-brand'), headerSearch: $('.cw-header-search'), detailHeaderIdentity: $('#detailHeaderIdentity'), detailHeaderLogo: $('#detailHeaderLogo'), detailHeaderTitle: $('#detailHeaderTitle'), detailHeaderBack: $('#detailHeaderBack'), detailHeaderShare: $('#detailHeaderShare'), detailHeaderTrailer: $('#detailHeaderTrailer'), detailHeaderLibrary: $('#detailHeaderLibrary'),
  views: $$('.view'),
  home: $('#homeView'), homeSkeleton: $('#homeSkeleton'), homeContent: $('#homeContent'), hero: $('#hero'), homeRows: $('#homeRows'), tmdbSetup: $('#tmdbSetup'),
  discover: $('#discoverView'), discoverTitle: $('#discoverTitle'), discoverControls: $('#discoverControls'), discoverSort: $('#discoverSort'), discoverResultsTitle: $('#discoverResultsTitle'), discoverGrid: $('#discoverGrid'), discoverSentinel: $('#discoverSentinel'), discoverLoader: $('#discoverLoader'),
  browse: $('#browseView'), browseTitle: $('#browseTitle'), browseSubtitle: $('#browseSubtitle'), browseGrid: $('#browseGrid'), peopleResults: $('#peopleResults'), peopleGrid: $('#peopleGrid'), browsePrev: $('#browsePrev'), browseNext: $('#browseNext'), browsePage: $('#browsePage'),
  library: $('#libraryView'), libraryTabs: $('#libraryTabs'), libraryAddedPanel: $('#libraryAddedPanel'), libraryLikedPanel: $('#libraryLikedPanel'), libraryAddedCount: $('#libraryAddedCount'), libraryLikedCount: $('#libraryLikedCount'), libraryGrid: $('#libraryGrid'), libraryEmpty: $('#libraryEmpty'), continueWatchingSection: $('#continueWatchingSection'), continueWatchingGrid: $('#continueWatchingGrid'), likedGrid: $('#likedGrid'), likedEmpty: $('#likedEmpty'), likedRecommendationSection: $('#likedRecommendationSection'), likedRecommendationTitle: $('#likedRecommendationTitle'), likedRecommendationGrid: $('#likedRecommendationGrid'),
  detail: $('#detailView'), detailContent: $('#detailContent'),
  person: $('#personView'), personContent: $('#personContent'),
  torrent: $('#torrentView'), torrentForm: $('#torrentSearchForm'), torrentQuery: $('#torrentQuery'), maxSize: $('#maxSize'), minSeeds: $('#minSeeds'), torrentSort: $('#torrentSort'), hideAdult: $('#hideAdult'), torrentResults: $('#torrentResults'), torrentCount: $('#torrentCount'), torrentTitle: $('#torrentResultTitle'), torrentMeta: $('#torrentMeta'), torrentNotice: $('#torrentNotice'), torrentPrev: $('#torrentPrev'), torrentNext: $('#torrentNext'), torrentPage: $('#torrentPage'),
  settings: $('#settingsView'), settingsServerDot: $('#settingsServerDot'), settingsServerVersion: $('#settingsServerVersion'), settingsServerUrl: $('#settingsServerUrl'), settingsTmdb: $('#settingsTmdb'), openTorrServer: $('#openTorrServer'), checkConnection: $('#checkConnection'), torrServerSettingsForm: $('#torrServerSettingsForm'), torrServerUrlInput: $('#torrServerUrlInput'), torrServerConfigStatus: $('#torrServerConfigStatus'), torrServerConfigBadge: $('#torrServerConfigBadge'), useLocalTorrServer: $('#useLocalTorrServer'), playerPreference: $('#playerPreference'), playerPreferenceNote: $('#playerPreferenceNote'), posterColumns: $('#posterColumns'), nativeProviderForm: $('#nativeProviderForm'), stremioAddonForm: $('#stremioAddonForm'), stremioAddonUrl: $('#stremioAddonUrl'), stremioAddonList: $('#stremioAddonList'), stremioAddonCount: $('#stremioAddonCount'), cloudStreamRepoForm: $('#cloudStreamRepoForm'), cloudStreamRepoUrl: $('#cloudStreamRepoUrl'), cloudStreamPluginList: $('#cloudStreamPluginList'), cloudStreamStatusBadge: $('#cloudStreamStatusBadge'), cloudStreamBridgeForm: $('#cloudStreamBridgeForm'), cloudStreamBridgeUrl: $('#cloudStreamBridgeUrl'), cloudStreamBridgeStatus: $('#cloudStreamBridgeStatus'),
  globalSearchForm: $('#globalSearchForm'), globalSearchInput: $('#globalSearchInput'),
  toast: $('#toast'),
};

function readStoredAddons(){try{const value=JSON.parse(localStorage.getItem('torrshelf:stremio-addons')||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
function readCloudStreamState(){try{return JSON.parse(localStorage.getItem('torrshelf:cloudstream')||'null')||{repo:null,plugins:[]};}catch{return{repo:null,plugins:[]};}}
function readLibrary(){try{const items=JSON.parse(localStorage.getItem('torrshelf:library')||'[]');return Array.isArray(items)?items:[];}catch{return[];}}
function readLikedMedia(){
  try{
    const items=JSON.parse(localStorage.getItem('torrshelf:liked-media')||'[]'),liked=new Map();
    (Array.isArray(items)?items:[]).forEach(entry=>{
      if(typeof entry==='string'){
        const match=entry.match(/^(movie|tv):(\d+)$/);if(match)liked.set(entry,{id:Number(match[2]),mediaType:match[1],title:'Đã thích',originalTitle:'',year:'',posterPath:'',backdropPath:'',logoPath:'',likedAt:0});
      }else if(entry&&Number(entry.id)){
        const mediaType=entry.mediaType==='tv'?'tv':'movie',key=`${mediaType}:${Number(entry.id)}`;liked.set(key,{id:Number(entry.id),mediaType,title:String(entry.title||entry.originalTitle||'Đã thích'),originalTitle:String(entry.originalTitle||entry.title||''),year:String(entry.year||''),posterPath:String(entry.posterPath||''),backdropPath:String(entry.backdropPath||''),logoPath:String(entry.logoPath||''),imdbId:String(entry.imdbId||''),rating:Number(entry.rating)||0,likedAt:Number(entry.likedAt)||0});
      }
    });
    return liked;
  }catch{return new Map();}
}
function readPlayerPreference(){const value=localStorage.getItem('torrshelf:player')||'torrshelf';return['torrshelf','mpv','mx','external'].includes(value)?value:'torrshelf';}
function readPosterColumns(){return localStorage.getItem('torrshelf:poster-columns')==='2'?2:3;}
const NATIVE_PROVIDER_DEFAULT={enabled:true,torrentioEnabled:true,jacredEnabled:true,knabenEnabled:true,magnetzEnabled:true,fourKhdHubEnabled:false,moviesDriveEnabled:false,hdHub4uEnabled:false,vadapavEnabled:false,uhdMoviesEnabled:false,hubCloudSearchEnabled:false,jacredDomain:'jac.red',torrentioManifestUrl:'https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex,nekobt,rutor,rutracker,torrent9,ilcorsaronero,mejortorrent,wolfmax4k,cinecalidad,besttorrents|sort=size|language=russian,ukrainian|qualityfilter=480p/manifest.json',commonSortBy:'size',commonQualityFilter:[],maxResults:30,sizeMinGB:0,sizeMaxGB:1000,preferPack:true,animeMode:false};
function readNativeProviderConfig(){try{const saved=JSON.parse(localStorage.getItem('torrshelf:native-provider')||'{}');return{...NATIVE_PROVIDER_DEFAULT,...(saved&&typeof saved==='object'?saved:{})};}catch{return{...NATIVE_PROVIDER_DEFAULT};}}

localStorage.removeItem('torrshelf:external-playback');

const state = {
  view: 'home',
  health: null,
  playerPreference: readPlayerPreference(),
  posterColumns: readPosterColumns(),
  nativeProviderConfig: readNativeProviderConfig(),
  customTorrServerUrl: localStorage.getItem('torrshelf:torrserver-url')||'',
  stremioAddons: readStoredAddons(),
  cloudStream: readCloudStreamState(),
  likedMedia: readLikedMedia(),
  cloudStreamBridgeUrl: localStorage.getItem('torrshelf:cloudstream-bridge')||'http://127.0.0.1:8080/manifest.json',
  infoStreams: new Map(),
  infoStreamContext: null,
  library: readLibrary(),
  progressRecords: [], progressByMedia: new Map(), syncLoaded: false,
  media: new Map(),
  homeRails: [], heroItems: [], heroIndex: 0, heroTimer: null, homeLoaded: false, homeLoading: false,
  discoverTab: 'hub', discoverSort: 'popular', discoverFilter: { kind: 'genre', id: '28,53', label: 'Adrenaline' }, discoverPage: 0, discoverPages: 1, discoverItems: [], discoverLoading: false, discoverRequestKey: '', discoverRequestId: 0,
  browseMode: 'search', browseQuery: '', browsePage: 1, browsePages: 1,
  selected: null, selectedSeason: null, selectedEpisode: null, seasonEpisodes: new Map(), seasonCache: new Map(), seasonRequests: new Map(), selectedPerson: null, detailRequestId: 0,
  streamGroups: new Map(), selectedStreamAddon: '', streamPanelMeta: null, streamTabScrollLeft: 0, streamRequestId: 0, forceFreshStreams: false,
  torrentQuery: '', torrentSource: 'all', torrentPage: 1, torrentPages: 1, torrentContext: null, addedTorrents: new Set(),
  libraryTab: localStorage.getItem('torrshelf:library-tab')==='liked'?'liked':'added', likedRecommendationKey: '', likedRecommendations: null, likedRecommendationRequestId: 0,
};

const esc = (value) => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const mediaKey = (item) => `${item.mediaType}:${item.id}`;
const image = (path, size='w500') => path ? `/api/tmdb/image?path=${encodeURIComponent(path)}&size=${size}` : '';
const detailBackdropUrl = (item) => item?.imdbId ? `/api/cinemeta/background?imdb=${encodeURIComponent(item.imdbId)}` : image(item?.backdropPath,'w1280');
const detailLogoUrl = (item) => item?.imdbId ? `/api/cinemeta/logo?imdb=${encodeURIComponent(item.imdbId)}` : image(item?.logoPath);
const typeName = (type) => type === 'tv' ? 'Series' : 'Movie';
const syncMediaKey = (item) => item ? `${item.mediaType==='tv'?'tv':'movie'}:${Number(item.id)||0}` : '';
const progressForItem = (item) => state.progressByMedia.get(syncMediaKey(item))||null;
const formatBytes = (bytes) => { const n=Number(bytes)||0;if(!n)return 'Unknown';const u=['B','KB','MB','GB','TB'];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),u.length-1);const x=n/1024**i;return `${x>=10||i===0?x.toFixed(0):x.toFixed(1)} ${u[i]}`; };
const formatRuntime = (minutes) => { const n=Number(minutes)||0;if(!n)return '';const h=Math.floor(n/60),m=n%60;return h?`${h}h${m?` ${m}m`:''}`:`${m}m`; };
const formatAge = (value) => { const d=new Date(value);if(!value||Number.isNaN(d.getTime()))return '';const days=Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));if(days===0)return 'Hôm nay';if(days<30)return `${days} ngày trước`;const months=Math.floor(days/30);if(months<12)return `${months} tháng trước`;return `${Math.floor(months/12)} năm trước`; };

async function api(path, options={}) {
  const response = await fetch(path,{...options,headers:{Accept:'application/json',...(options.headers||{})}});
  const data = await response.json().catch(()=>({error:'Invalid server response'}));
  if(!response.ok){const error=new Error(data.error||data.message||`HTTP ${response.status}`);error.payload=data;throw error;}
  return data;
}

function notify(message, type='ok') {
  els.toast.textContent=message;els.toast.className=`cw-toast ${type}`;
  clearTimeout(notify.timer);notify.timer=setTimeout(()=>els.toast.classList.add('hidden'),3500);
}
function openStremioAddonSettings(){navigate('settings');requestAnimationFrame(()=>requestAnimationFrame(()=>{const section=$('#stremioAddonSettings');section?.scrollIntoView({behavior:'smooth',block:'start'});els.stremioAddonUrl?.focus({preventScroll:true});}));}

function clearInfoStreamState({hidePanel=true}={}){
  state.streamRequestId+=1;state.infoStreams.clear();state.streamGroups.clear();state.selectedStreamAddon='';state.streamTabScrollLeft=0;state.streamPanelMeta=null;state.infoStreamContext=null;
  const panel=$('#infoStreams');if(panel){panel.innerHTML='';if(hidePanel)panel.classList.add('hidden');}
}
function markStremioAddonsChanged(){state.forceFreshStreams=true;clearInfoStreamState();}
async function clearBackendStremioCache(){try{await api('/api/stremio/cache/clear',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});}catch{/* A fresh import also clears backend caches. */}}

function resetScroll(){history.scrollRestoration='manual';window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;requestAnimationFrame(()=>window.scrollTo(0,0));}
function resetDetailHeaderMotion(){
  els.header.classList.remove('cw-detail-context','cw-detail-header-active');els.detailHeaderIdentity.style.opacity='0';els.detailHeaderIdentity.style.transform='translate(-50%,-35%) scale(.82)';
  const hero=$('.cw-detail-hero'),heroLogo=$('.cw-detail-logo,.cw-detail-title-visual h1'),backdrop=$('#detailBackdrop img'),shade=$('.cw-detail-gradient');if(heroLogo){heroLogo.style.transform='';heroLogo.style.opacity='';}if(backdrop){backdrop.style.transform='';backdrop.style.maskImage='';backdrop.style.webkitMaskImage='';}if(shade)shade.style.opacity='';if(hero){hero.style.height='';delete hero.dataset.normalHeight;delete hero.dataset.normalWidth;delete hero.dataset.frameHeight;}
}
function setDetailHeader(item){
  const logoSource=detailLogoUrl(item),logoFallback=item.logoPath?image(item.logoPath):'';els.header.classList.add('cw-detail-context');els.detailHeaderTitle.textContent=item.title||'';
  if(logoSource){els.detailHeaderLogo.src=logoSource;if(logoFallback&&logoFallback!==logoSource)els.detailHeaderLogo.dataset.logoFallback=logoFallback;else delete els.detailHeaderLogo.dataset.logoFallback;els.detailHeaderLogo.classList.remove('hidden');els.detailHeaderTitle.classList.add('hidden');}else{els.detailHeaderTitle.classList.remove('hidden');els.detailHeaderLogo.classList.add('hidden');}
  if(item.trailerUrl){els.detailHeaderTrailer.href=item.trailerUrl;els.detailHeaderTrailer.classList.remove('hidden')}else els.detailHeaderTrailer.classList.add('hidden');updateLibraryButtons();updateLikeButtons();updateDetailHeaderMotion();
}
function updateDetailHeaderMotion(){
  if(state.view!=='detail')return;const hero=$('.cw-detail-hero');if(!hero)return;
  const backdrop=$('#detailBackdrop img'),shade=$('.cw-detail-gradient'),width=Math.round(hero.clientWidth||0);let normalHeight=Number(hero.dataset.normalHeight)||0;
  if(!normalHeight||hero.dataset.normalWidth!==String(width)){hero.style.height='';normalHeight=hero.getBoundingClientRect().height;hero.dataset.normalHeight=String(normalHeight);hero.dataset.normalWidth=String(width);}
  const landscape=matchMedia('(orientation: landscape) and (min-width: 640px)').matches,progress=Math.max(0,Math.min(1,scrollY/Math.max(220,normalHeight*.92))),zoomEnd=.20,zoomOut=landscape?0:Math.min(1,progress/zoomEnd),sourceRatio=backdrop?.naturalWidth&&backdrop?.naturalHeight?backdrop.naturalWidth/backdrop.naturalHeight:0;
  /* At zoom-out=1 the hero matches Cinemeta's natural aspect ratio: the full
     image fills the frame with no crop or letterbox. Landscape uses its own
     stable Stremio-like stage rather than applying the phone zoom animation. */
  if(!landscape&&sourceRatio&&width){const fullHeight=width/sourceRatio,frameHeight=normalHeight+(fullHeight-normalHeight)*zoomOut,previousHeight=Number(hero.dataset.frameHeight)||0;if(Math.abs(previousHeight-frameHeight)>.1){hero.style.height=`${frameHeight}px`;hero.dataset.frameHeight=String(frameHeight);}}else if(landscape&&hero.dataset.frameHeight){hero.style.height='';delete hero.dataset.frameHeight;}
  /* Normal state uses the user's 16:11 Cinemeta crop at scale 1. Zoom-out
     expands only the frame to the source's native aspect ratio, so the full
     image becomes visible without adding crop or edges. */
  if(backdrop){backdrop.style.transform='translateY(0) scale(1)';backdrop.style.maskImage='none';backdrop.style.webkitMaskImage='none';}
  if(shade)shade.style.opacity='';
  const heroLogo=$('.cw-detail-logo,.cw-detail-title-visual h1');
  /* The page scrolls as one unit. Only when the original logo naturally reaches
     the fixed header do we cross-fade it into the compact header identity. */
  let merge=0;if(heroLogo){const titleBox=heroLogo.getBoundingClientRect(),headerBox=els.header.getBoundingClientRect(),mergeDistance=Math.max(56,titleBox.height+24);merge=Math.max(0,Math.min(1,(headerBox.bottom+10-titleBox.top)/mergeDistance));heroLogo.style.transform=merge?`translateY(${-12*merge}px) scale(${1-merge*.12})`:'';heroLogo.style.opacity=merge?String(1-merge*.94):'';}
  els.detailHeaderIdentity.style.opacity=String(merge);els.detailHeaderIdentity.style.transform=`translate(-50%,-50%) translateY(${(1-merge)*14}px) scale(${.82+merge*.18})`;els.header.classList.toggle('cw-detail-header-active',merge>.62);
}
function route(params={},replace=false){const url=new URL(location.origin+location.pathname);Object.entries(params).forEach(([k,v])=>{if(v!==''&&v!=null)url.searchParams.set(k,String(v))});history[replace?'replaceState':'pushState']({cw:true},'',url);}
function showView(name){if(name!=='detail')resetDetailHeaderMotion();state.view=name;els.views.forEach(v=>v.classList.toggle('hidden',v.id!==`${name}View`));$$('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===name));if(name!=='home')clearInterval(state.heroTimer);else startHero();resetScroll();if(name==='detail')requestAnimationFrame(updateDetailHeaderMotion);}
function navigate(name,params={}){showView(name);route({view:name,...params});}
function back(){if(history.length>1)history.back();else navigate('home');}

function poster(item,showProgress=false) {
  const key=mediaKey(item),progress=showProgress?progressForItem(item):null,percent=Math.max(0,Math.min(100,Number(progress?.percent||0)*100));state.media.set(key,item);
  return `<button class="cw-poster" data-media="${key}" type="button" aria-label="${esc(item.title)}">${item.posterPath?`<img src="${image(item.posterPath)}" alt="${esc(item.title)}" loading="lazy">`:'<span class="cw-no-poster">TS</span>'}${item.rating?`<b>${Number(item.rating).toFixed(1)} ★</b>`:''}${showProgress&&percent>0?`<svg class="cw-poster-progress" viewBox="0 0 100 5" preserveAspectRatio="none" role="img" aria-label="Đã xem ${Math.round(percent)}%"><rect class="cw-poster-progress-track" x="0" y="0" width="100" height="5" rx="2.5"></rect><rect class="cw-poster-progress-value" x="0" y="0" width="${percent.toFixed(1)}" height="5" rx="2.5"></rect></svg>`:''}</button>`;
}
function personCard(person){return `<button class="cw-person" data-person="${person.id}" type="button">${person.profilePath?`<img src="${image(person.profilePath,'w300')}" alt="${esc(person.name)}" loading="lazy">`:'<span>?</span>'}<strong>${esc(person.name)}</strong><small>${esc(person.knownForDepartment||'')}</small></button>`;}

function heroMarkup(item,index){if(!item)return'';state.media.set(mediaKey(item),item);return `<div class="cw-hero-bg">${item.backdropPath?`<img src="${image(item.backdropPath,'w1280')}" alt="">`:''}</div><div class="cw-hero-copy"><div class="cw-rank"><span>TOP TRENDING</span><b>#${index+1} This Week</b></div><h1>${esc(item.title)}</h1><p>${esc(item.overview||'')}</p><div class="cw-hero-actions"><button data-detail="${mediaKey(item)}" type="button">▶ Watch Now</button><div class="cw-dots">${state.heroItems.map((_,i)=>`<button class="${i===index?'active':''}" data-slide="${i}" type="button" aria-label="Slide ${i+1}"></button>`).join('')}</div></div></div>`;}
function setHero(index){if(!state.heroItems.length)return;state.heroIndex=(index+state.heroItems.length)%state.heroItems.length;els.hero.innerHTML=heroMarkup(state.heroItems[state.heroIndex],state.heroIndex);}
function startHero(){clearInterval(state.heroTimer);if(state.view==='home'&&state.heroItems.length>1)state.heroTimer=setInterval(()=>setHero(state.heroIndex+1),7000);}

const homeIcons={
  trending:'<svg viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></svg>',
  randomPicks:'<svg viewBox="0 0 24 24"><path d="M4 7h3c5 0 5 10 10 10h3"/><path d="m17 14 3 3-3 3M4 17h3c2.4 0 3.6-2.3 5-4.8M14 7h6M17 4l3 3-3 3"/></svg>',
  nowPlaying:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/></svg>',
  popularMovies:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
  popularTv:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 2 4 4 4-4"/></svg>',
  upcoming:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  topRated:'<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  default:'<svg viewBox="0 0 24 24"><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/></svg>'
};
function row(title,items,key='default',showProgress=false){return `<section class="cw-row"><h2><i>${homeIcons[key]||homeIcons.default}</i>${esc(title)}</h2><div class="cw-poster-row">${items.slice(0,20).map(item=>poster(item,showProgress)).join('')}</div></section>`;}
function syncRecordItem(record){return record&&Number(record.tmdbId)?{id:Number(record.tmdbId),mediaType:record.mediaType==='tv'?'tv':'movie',title:record.title||record.originalTitle||'TorrShelf',originalTitle:record.originalTitle||record.title||'',year:record.year||'',posterPath:record.posterPath||'',backdropPath:record.backdropPath||'',logoPath:record.logoPath||'',imdbId:record.imdbId||''}:null;}
function continueWatchingItems(){const seen=new Set(),items=[];for(const record of state.progressRecords){if(record.completed||Number(record.percent)<=0)continue;const item=syncRecordItem(record),key=syncMediaKey(item);if(!item||seen.has(key))continue;seen.add(key);items.push(item);}return items;}
function renderHomeRows(){if(!state.homeLoaded)return;const continuing=continueWatchingItems();els.homeRows.innerHTML=(continuing.length?row('Tiếp tục xem',continuing,'nowPlaying',true):'')+state.homeRails.map(r=>row(r.title,r.items,r.key,false)).join('');}
function likedItems(){return[...state.likedMedia.values()].filter(item=>Number(item?.id)).sort((a,b)=>(Number(b.likedAt)||0)-(Number(a.likedAt)||0));}
function persistLikedMedia(){localStorage.setItem('torrshelf:liked-media',JSON.stringify([...state.likedMedia.values()]));}
function likedMediaSnapshot(item){return{id:Number(item.id),mediaType:item.mediaType==='tv'?'tv':'movie',title:item.title||item.originalTitle||'Đã thích',originalTitle:item.originalTitle||item.title||'',year:item.year||'',posterPath:item.posterPath||'',backdropPath:item.backdropPath||'',logoPath:item.logoPath||'',imdbId:item.imdbId||'',rating:Number(item.rating)||0,likedAt:Date.now()};}
function setLibraryTab(tab){state.libraryTab=tab==='liked'?'liked':'added';localStorage.setItem('torrshelf:library-tab',state.libraryTab);renderLibrary();}
function renderLibrary(){
  if(!els.libraryGrid)return;const continuing=continueWatchingItems(),liked=likedItems(),isLiked=state.libraryTab==='liked';
  els.libraryAddedPanel.classList.toggle('hidden',isLiked);els.libraryLikedPanel.classList.toggle('hidden',!isLiked);
  els.libraryTabs?.querySelectorAll('[data-library-tab]').forEach(button=>{const active=button.dataset.libraryTab===state.libraryTab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));});
  if(els.libraryAddedCount)els.libraryAddedCount.textContent=String(state.library.length);if(els.libraryLikedCount)els.libraryLikedCount.textContent=String(liked.length);
  els.continueWatchingSection.classList.toggle('hidden',!continuing.length);els.continueWatchingGrid.innerHTML=continuing.map(item=>poster(item,true)).join('');
  els.libraryGrid.innerHTML=state.library.map(item=>poster(item,false)).join('');els.libraryEmpty.classList.toggle('hidden',Boolean(state.library.length));
  if(els.likedGrid){els.likedGrid.innerHTML=liked.map(item=>poster(item,false)).join('');els.likedEmpty.classList.toggle('hidden',Boolean(liked.length));}
  if(isLiked&&state.view==='library')void loadLikedRecommendations(liked);
}
async function loadLikedRecommendations(liked=likedItems()){
  if(!els.likedRecommendationSection||state.libraryTab!=='liked')return;
  const seed=liked.find(item=>item.title&&item.title!=='Đã thích')||liked[0];
  if(!seed){els.likedRecommendationSection.classList.add('hidden');return;}
  const key=mediaKey(seed);els.likedRecommendationSection.classList.remove('hidden');els.likedRecommendationTitle.textContent=`Vì bạn đã thích ${seed.title||'video này'}`;
  if(state.likedRecommendationKey===key&&Array.isArray(state.likedRecommendations)){els.likedRecommendationGrid.innerHTML=state.likedRecommendations.map(item=>poster(item,false)).join('')||'<p class="cw-addon-empty">Chưa có gợi ý phù hợp.</p>';return;}
  const requestId=++state.likedRecommendationRequestId;state.likedRecommendationKey=key;state.likedRecommendations=null;els.likedRecommendationGrid.innerHTML=Array.from({length:6},()=>'<span class="cw-card-skeleton"></span>').join('');
  try{
    const data=await api(`/api/tmdb/recommendations?media=${seed.mediaType}&id=${seed.id}`);if(requestId!==state.likedRecommendationRequestId||state.libraryTab!=='liked'||state.likedRecommendationKey!==key)return;
    const excluded=new Set([...liked.map(mediaKey),...state.library.map(mediaKey)]);state.likedRecommendations=(data.items||[]).filter(item=>!excluded.has(mediaKey(item))).slice(0,12);els.likedRecommendationGrid.innerHTML=state.likedRecommendations.map(item=>poster(item,false)).join('')||'<p class="cw-addon-empty">Chưa có gợi ý phù hợp.</p>';
  }catch(error){if(requestId!==state.likedRecommendationRequestId||state.libraryTab!=='liked')return;els.likedRecommendationGrid.innerHTML='<p class="cw-addon-empty">Chưa tải được gợi ý lúc này.</p>';}
}
function applySyncState(data){
  if(!data)return;state.library=Array.isArray(data.library)?data.library:[];state.progressRecords=Array.isArray(data.progress)?data.progress:[];state.progressByMedia.clear();
  state.progressRecords.forEach(record=>{if(record.mediaKey&&!state.progressByMedia.has(record.mediaKey))state.progressByMedia.set(record.mediaKey,record)});state.syncLoaded=true;localStorage.setItem('torrshelf:library',JSON.stringify(state.library));renderLibrary();renderHomeRows();updateLibraryButtons();updateLikeButtons();
}
async function loadSyncState(){
  const localLibrary=[...state.library];try{let data=await api('/api/sync/state');if(!(data.library||[]).length&&localLibrary.length){await Promise.allSettled(localLibrary.map(media=>api('/api/sync/library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({media,inLibrary:true})})));data=await api('/api/sync/state');}applySyncState(data);}catch{renderLibrary();}
}

async function loadHome(){
  if(state.homeLoading)return;state.homeLoading=true;showView('home');els.homeSkeleton.classList.remove('hidden');els.homeContent.classList.add('hidden');els.tmdbSetup.classList.add('hidden');
  try{const data=await api('/api/tmdb/home');state.media.clear();state.homeRails=data.rails||[];state.homeRails.forEach(r=>r.items.forEach(i=>state.media.set(mediaKey(i),i)));state.heroItems=(state.homeRails.find(r=>r.key==='trending')?.items||[data.hero]).filter(Boolean).slice(0,5);state.heroIndex=0;setHero(0);startHero();els.homeSkeleton.classList.add('hidden');els.homeContent.classList.remove('hidden');state.homeLoaded=true;renderHomeRows();}
  catch(error){els.homeSkeleton.classList.add('hidden');els.tmdbSetup.classList.remove('hidden');notify(error.message,'error');}
  finally{state.homeLoading=false;}
}

function discoverKey(){return [state.discoverTab,state.discoverSort,state.discoverFilter.kind,state.discoverFilter.id,state.discoverFilter.label].join('|');}
function updateDiscoverChrome(){
  $$('[data-discover-tab]').forEach(b=>b.classList.toggle('active',b.dataset.discoverTab===state.discoverTab));
  $$('[data-sort]').forEach(b=>b.classList.toggle('active',b.dataset.sort===state.discoverSort));
  [...els.discoverControls.querySelectorAll('[data-mood],[data-genre]')].forEach(b=>b.classList.toggle('active',(b.dataset.mood||b.dataset.genre)===state.discoverFilter.id));
  els.discoverControls.classList.toggle('hidden',state.discoverTab!=='hub');
  els.discoverSort.classList.toggle('hidden',state.discoverTab==='hub');
  els.discoverTitle.textContent=state.discoverTab==='hub'?'Discovery Hub':state.discoverTab==='movies'?(state.discoverSort==='latest'?'Latest Releases':'Popular Movies'):(state.discoverSort==='latest'?'Latest Releases':'Popular Shows');
  els.discoverResultsTitle.textContent=state.discoverTab==='hub'?`${state.discoverFilter.label} Hits`:'';
}
function updateDiscoverLoader(){
  if(state.discoverLoading){els.discoverLoader.textContent=state.discoverPage?'Đang tải thêm':'Đang tải';els.discoverLoader.className='loading';return;}
  if(state.discoverPage>=state.discoverPages){els.discoverLoader.textContent='Đã tải hết';els.discoverLoader.className='done';return;}
  els.discoverLoader.textContent='Cuộn để tải thêm';els.discoverLoader.className='';
}
async function loadDiscovery(append=false){
  const key=discoverKey();
  if(append&&(state.discoverLoading||state.discoverPage>=state.discoverPages||state.discoverRequestKey!==key))return;
  if(!append){
    showView('discover');updateDiscoverChrome();state.discoverPage=0;state.discoverPages=1;state.discoverItems=[];state.discoverRequestKey=key;state.discoverRequestId+=1;
    els.discoverGrid.innerHTML=Array.from({length:12},()=>'<span class="cw-card-skeleton"></span>').join('');
  }
  const requestId=state.discoverRequestId,page=state.discoverPage+1;
  state.discoverLoading=true;updateDiscoverLoader();let succeeded=false;
  try{
    const media=state.discoverTab==='tv'?'tv':'movie';
    const p=new URLSearchParams({kind:state.discoverTab==='hub'?state.discoverFilter.kind:'all',id:state.discoverTab==='hub'?state.discoverFilter.id:'',label:state.discoverFilter.label,media,sort:state.discoverSort,page});
    const data=await api(`/api/tmdb/discover?${p}`);
    if(requestId!==state.discoverRequestId||key!==discoverKey())return;
    const incoming=[...(data.items||[])],known=new Set(append?state.discoverItems.map(item=>mediaKey(item)):[]),fresh=[];
    incoming.forEach(item=>{const id=mediaKey(item);if(known.has(id))return;known.add(id);fresh.push(item)});
    if(append)state.discoverItems.push(...fresh);else state.discoverItems=fresh;
    state.discoverPage=Number(data.page)||page;state.discoverPages=Number(data.totalPages)||1;
    els.discoverResultsTitle.textContent=state.discoverTab==='hub'?`${state.discoverFilter.label} Hits`:'';
    const markup=fresh.map(item=>poster(item,false)).join('');if(append){if(markup)els.discoverGrid.insertAdjacentHTML('beforeend',markup)}else els.discoverGrid.innerHTML=markup||'<div class="cw-notice">No titles found.</div>';succeeded=true;
  }catch(error){
    if(requestId!==state.discoverRequestId)return;
    if(!append)els.discoverGrid.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;else notify(error.message,'error');
  }finally{
    if(requestId===state.discoverRequestId){state.discoverLoading=false;updateDiscoverLoader();if(succeeded)requestAnimationFrame(()=>{const r=els.discoverSentinel.getBoundingClientRect();if(state.view==='discover'&&r.top<innerHeight+700&&r.bottom>-200)loadDiscovery(true);});}
  }
}

async function searchTmdb(query,page=1,updateRoute=true){const q=String(query||'').trim();if(q.length<2)return;state.browseMode='search';state.browseQuery=q;state.browsePage=page;showView('browse');if(updateRoute)route({view:'browse',q,page});els.browseTitle.textContent=`Search: ${q}`;els.browseSubtitle.textContent='Movies, shows and people';els.browseGrid.innerHTML=Array.from({length:18},()=>'<span class="cw-card-skeleton"></span>').join('');try{const data=await api(`/api/tmdb/search?q=${encodeURIComponent(q)}&page=${page}`);state.browsePages=data.totalPages||1;els.browseGrid.innerHTML=(data.items||[]).map(item=>poster(item,false)).join('');els.peopleResults.classList.toggle('hidden',!data.people?.length);els.peopleGrid.innerHTML=(data.people||[]).map(personCard).join('');els.browsePage.textContent=`${data.page} / ${data.totalPages}`;els.browsePrev.disabled=data.page<=1;els.browseNext.disabled=data.page>=data.totalPages;}catch(error){els.browseGrid.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;}}

async function openDetail(item,updateRoute=true){
  if(!item)return;const requestId=++state.detailRequestId;state.selected=item;state.selectedSeason=null;state.selectedEpisode=null;state.seasonEpisodes.clear();state.seasonCache.clear();state.seasonRequests.clear();els.detail.classList.remove('episode-selected');clearInfoStreamState();resetDetailHeaderMotion();els.detailHeaderLogo.classList.add('hidden');els.detailHeaderLogo.removeAttribute('src');delete els.detailHeaderLogo.dataset.logoFallback;els.detailHeaderTitle.textContent='';els.detailHeaderTitle.classList.add('hidden');showView('detail');
  if(updateRoute)route({view:'detail',type:item.mediaType,id:item.id});els.detailContent.innerHTML='<div class="cw-detail-skeleton"></div>';
  try{
    const {data}=await api(`/api/tmdb/${item.mediaType}/${item.id}`);if(requestId!==state.detailRequestId)return;state.selected=data;state.media.set(mediaKey(data),data);els.detailContent.innerHTML=detailMarkup(data);setDetailHeader(data);loadRelated(data);
    if(data.mediaType==='tv'&&data.seasons?.length){state.selectedSeason=data.seasons.find(s=>s.seasonNumber>0)?.seasonNumber??data.seasons[0].seasonNumber;$$('[data-season]').forEach(button=>button.classList.toggle('active',Number(button.dataset.season)===state.selectedSeason));const selectedLoad=loadSeason(data.id,state.selectedSeason);void preloadSeasons(data.id,data.seasons);await selectedLoad;}
    else loadInfoStreams({scroll:false});
  }catch(error){if(requestId===state.detailRequestId)els.detailContent.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;}
}

function detailMarkup(item){
  const creditCard=(person,subtitle)=>`<button class="cw-cast" data-person="${person.id}" type="button"><span class="cw-cast-avatar">${person.profilePath?`<img src="${image(person.profilePath,'w300')}" alt="${esc(person.name)}" loading="lazy">`:'<b>?</b>'}</span><strong>${esc(person.name)}</strong><small>${esc(subtitle||'')}</small></button>`;
  const cast=(item.cast||[]).slice(0,15).map(p=>creditCard(p,p.character)).join('');
  const directors=(item.directors||[]).map(p=>creditCard(p,p.job)).join('');
  const genrePills=(item.genres||[]).map(g=>`<button data-genre="${g.id}" data-label="${esc(g.name)}" type="button">${esc(String(g.name).replace(/^Phim\s+/i,''))}</button>`).join('');
  const backdropFallback=image(item.backdropPath,'w1280'),backdropSource=detailBackdropUrl(item);
  const posterImage=item.posterPath?`<img class="cw-detail-poster" src="${image(item.posterPath)}" alt="${esc(item.title)}">`:'<div class="cw-detail-poster cw-no-poster">TS</div>';
  const logoSource=detailLogoUrl(item),logoFallback=item.logoPath?image(item.logoPath):'';
  const titleVisual=logoSource?`<img class="cw-detail-logo" src="${esc(logoSource)}"${logoFallback&&logoFallback!==logoSource?` data-logo-fallback="${esc(logoFallback)}"`:''} alt="${esc(item.title)}"><h1 class="cw-logo-title-fallback hidden">${esc(item.title)}</h1>`:`<h1>${esc(item.title)}</h1>`;
  const trailer=item.trailerUrl?`<a class="cw-detail-icon" href="${esc(item.trailerUrl)}" target="_blank" rel="noreferrer" aria-label="Trailer" title="Trailer"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg></a>`:'';
  const share='<button class="cw-detail-icon" data-share-current type="button" aria-label="Share" title="Share"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4"/></svg></button>';
  const library='<button class="cw-detail-icon" data-library-current type="button" aria-label="Add to library" title="Library"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 2v6M16 2v6M8 13h8M12 9v8"/></svg></button>';
  const like='<button class="cw-detail-meta-icon" data-like-current type="button" aria-label="Thích" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M7.2 10.2v9.2H4.4a1.4 1.4 0 0 1-1.4-1.4v-6.4a1.4 1.4 0 0 1 1.4-1.4z"/><path d="M7.2 19.4h8.4a2 2 0 0 0 1.9-1.4l1.7-5.7A1.6 1.6 0 0 0 17.7 10h-4.1l.5-2.7a3.4 3.4 0 0 0-1-3l-.4-.4-3.2 6.3z"/></svg></button>';
  const heart='<button class="cw-detail-meta-icon" data-library-current type="button" aria-label="Add to library" aria-pressed="false"><svg viewBox="0 0 24 24"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.3a5.5 5.5 0 0 0-.1-7.8z"/></svg></button>';
  const metaFacts=[
    item.runtime?`<span>${Number(item.runtime)} min</span>`:'',
    item.year?`<span>${esc(item.year)}</span>`:'',
    item.rating?`<span>${Number(item.rating).toFixed(1)}</span><span class="cw-imdb-badge">IMDb</span>`:'',
  ].filter(Boolean);
  const detailMeta=`<div class="cw-detail-meta"><div class="cw-detail-meta-facts">${metaFacts.map((fact,index)=>`${index?'<i aria-hidden="true">•</i>':''}${fact}`).join('')}</div><div class="cw-detail-meta-actions">${like}${heart}</div></div>`;
  const relatedSkeleton=Array.from({length:12},()=>'<span class="cw-card-skeleton"></span>').join('');
  const episodeSection=item.mediaType==='tv'&&item.seasons?.length?`<section id="episodeSection" class="cw-info cw-episode-section"><h2>Episodes</h2><div class="cw-episode-browser"><div class="cw-episodes-toolbar"><div class="cw-season-tabs">${item.seasons.map(s=>`<button data-season="${s.seasonNumber}" type="button">${esc(s.name||`Season ${s.seasonNumber}`)}</button>`).join('')}</div></div><div id="episodeList" class="cw-episode-list"></div></div></section>`:'';
  return `
    <section class="cw-detail-hero">
      <button class="cw-detail-hero-back" data-detail-back type="button" aria-label="Back"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
      <div id="detailBackdrop" class="cw-detail-bg">${backdropSource?`<img src="${esc(backdropSource)}"${backdropFallback?` data-backdrop-fallback="${esc(backdropFallback)}"`:''} alt="">`:''}<div class="cw-detail-gradient"></div></div>
      <div class="cw-detail-shell"><div class="cw-detail-layout">${posterImage}<div class="cw-detail-copy"><div id="detailTitleVisual" class="cw-detail-title-visual">${titleVisual}</div><div class="cw-detail-actions"><div class="cw-detail-secondary">${share}${trailer}${library}</div></div></div></div></div>
    </section>
    <div class="cw-detail-body">
      <main class="cw-detail-content">
        ${detailMeta}
        <section id="detailEpisodeInfo" class="cw-episode-detail-info hidden"><h2 id="detailEpisodeTitle"></h2><p id="detailEpisodeOverview"></p></section>
        <section class="cw-info cw-overview-info"><p>${esc(item.overview||'No overview available.')}</p></section>
        <div class="cw-detail-body-genres">${genrePills}</div>
        ${episodeSection}
      </main>
      <aside id="detailLinksColumn" class="cw-detail-links-column">
        <div class="cw-detail-links-head"><small>STREAMS & LINKS</small><h2>Link phát</h2></div>
        <section id="infoStreams" class="cw-info-streams hidden"></section>
      </aside>
      <div class="cw-detail-supporting">
        <section class="cw-info"><h2>Top Cast</h2><div class="cw-cast-row">${cast||'<p>No cast information.</p>'}</div></section>
        <section class="cw-info"><h2>Director & Crew</h2><div class="cw-cast-row">${directors||'<p>No crew information.</p>'}</div></section>
        <section class="cw-related-section"><h2>Related Content</h2><div id="relatedRow" class="cw-poster-grid">${relatedSkeleton}</div></section>
      </div>
    </div>`;
}

function libraryKey(item){return item?`${item.mediaType}:${item.id}`:'';}
function isInLibrary(item=state.selected){const key=libraryKey(item);return Boolean(key&&state.library.some(entry=>libraryKey(entry)===key));}
function updateLibraryButtons(){const active=isInLibrary();$$('[data-library-current]').forEach(button=>{button.classList.toggle('active',active);button.setAttribute('aria-label',active?'Remove from library':'Add to library');button.setAttribute('aria-pressed',String(active));});els.detailHeaderLibrary.classList.toggle('active',active);els.detailHeaderLibrary.setAttribute('aria-label',active?'Remove from library':'Add to library');}
function isCurrentLiked(){return Boolean(state.selected&&state.likedMedia.has(libraryKey(state.selected)));}
function updateLikeButtons(){const active=isCurrentLiked();$$('[data-like-current]').forEach(button=>{button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
function toggleCurrentLike(){const item=state.selected,key=libraryKey(item);if(!key||!item)return;if(state.likedMedia.has(key)){state.likedMedia.delete(key);notify('Đã bỏ thích');}else{state.likedMedia.set(key,likedMediaSnapshot(item));notify('Đã thích');}state.likedRecommendationKey='';state.likedRecommendations=null;persistLikedMedia();updateLikeButtons();renderLibrary();}
async function toggleCurrentLibrary(){
  const item=state.selected;if(!item)return;const exists=isInLibrary(item),media={id:item.id,mediaType:item.mediaType,title:item.title,originalTitle:item.originalTitle,year:item.year,imdbId:item.imdbId,posterPath:item.posterPath,backdropPath:item.backdropPath,logoPath:item.logoPath};
  try{const result=await api('/api/sync/library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({media,inLibrary:!exists})});applySyncState(result.state);notify(exists?'Đã xóa khỏi thư viện':'Đã thêm vào thư viện');}
  catch(error){notify(`Không đồng bộ được thư viện: ${error.message}`,'error');}
}

async function shareSelected(){
  if(!state.selected)return;const title=state.selected.title||'TorrShelf',url=location.href,text=`${title}${state.selected.year?` (${state.selected.year})`:''}`;
  try{if(navigator.share){await navigator.share({title,text,url});notify('Đã chia sẻ');}else{await navigator.clipboard.writeText(url);notify('Đã sao chép liên kết');}}catch(error){if(error?.name!=='AbortError')notify('Không thể chia sẻ','error');}
}

async function sharePersonProfile(){
  const person=state.selectedPerson;if(!person)return;const url=location.href,title=person.name||'TorrShelf';
  try{if(navigator.share){await navigator.share({title,text:`${title} · TorrShelf`,url});notify('Đã chia sẻ');}else{await navigator.clipboard.writeText(url);notify('Đã sao chép liên kết');}}catch(error){if(error?.name!=='AbortError')notify('Không thể chia sẻ','error');}
}

async function loadRelated(item){const row=$('#relatedRow');if(!row)return;try{const data=await api(`/api/tmdb/recommendations?media=${item.mediaType}&id=${item.id}`);row.innerHTML=(data.items||[]).slice(0,18).map(item=>poster(item,false)).join('');}catch{row.innerHTML='<p>No related titles.</p>';}}
function seasonCacheKey(id,season){return `${Number(id)}:${Number(season)}`;}
async function fetchSeasonCached(id,season){
  const key=seasonCacheKey(id,season);if(state.seasonCache.has(key))return state.seasonCache.get(key);if(state.seasonRequests.has(key))return state.seasonRequests.get(key);
  const request=api(`/api/tmdb/tv/${id}/season/${season}`).then(({data})=>{const episodes=data.episodes||[];state.seasonCache.set(key,episodes);return episodes;}).finally(()=>{if(state.seasonRequests.get(key)===request)state.seasonRequests.delete(key)});state.seasonRequests.set(key,request);return request;
}
async function preloadSeasons(id,seasons){await Promise.allSettled((seasons||[]).map(item=>fetchSeasonCached(id,item.seasonNumber)));}
function renderSeasonEpisodes(episodes){
  const list=$('#episodeList');if(!list)return;state.seasonEpisodes.clear();state.selectedEpisode=null;(episodes||[]).forEach(episode=>state.seasonEpisodes.set(Number(episode.episodeNumber),episode));
  list.innerHTML=(episodes||[]).map(e=>`<button class="cw-episode" data-episode="${e.episodeNumber}" type="button"><div class="cw-episode-thumb">${e.stillPath?`<img src="${image(e.stillPath)}" alt="" loading="lazy">`:`<span>EP ${e.episodeNumber}</span>`}</div><div class="cw-episode-copy"><div><strong>${e.episodeNumber}. ${esc(e.name)}</strong>${e.airDate?`<time>${esc(new Date(e.airDate).toLocaleDateString('vi-VN'))}</time>`:''}</div>${e.overview?`<p>${esc(e.overview)}</p>`:''}</div></button>`).join('')||'<span class="cw-loading">No episodes.</span>';
}
async function loadSeason(id,season){
  const list=$('#episodeList'),mediaId=Number(id),seasonNumber=Number(season);if(!list)return;state.seasonEpisodes.clear();state.selectedEpisode=null;list.innerHTML='<span class="cw-loading">Loading episodes…</span>';
  try{const episodes=await fetchSeasonCached(mediaId,seasonNumber);if(state.view!=='detail'||Number(state.selected?.id)!==mediaId||Number(state.selectedSeason)!==seasonNumber)return;renderSeasonEpisodes(episodes);}
  catch(error){if(state.view==='detail'&&Number(state.selected?.id)===mediaId&&Number(state.selectedSeason)===seasonNumber)list.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;}
}

function resetEpisodeHero(){
  state.selectedEpisode=null;els.detail.classList.remove('episode-selected');const info=$('#detailEpisodeInfo');if(info)info.classList.add('hidden');const backdrop=$('#detailBackdrop img');if(backdrop&&state.selected){const fallback=image(state.selected.backdropPath,'w1280');if(fallback)backdrop.dataset.backdropFallback=fallback;backdrop.src=detailBackdropUrl(state.selected)||fallback;}
  const panel=$('#infoStreams'),links=$('#detailLinksColumn');if(panel&&links)links.append(panel);clearInfoStreamState();
}
function handleDetailBack(){
  if(state.view==='detail'&&state.selectedEpisode){resetEpisodeHero();requestAnimationFrame(()=>$('#episodeSection')?.scrollIntoView({behavior:'smooth',block:'start'}));return;}back();
}
function selectEpisode(episode){
  if(!episode||!state.selected)return;state.selectedEpisode=episode;els.detail.classList.add('episode-selected');const info=$('#detailEpisodeInfo'),title=$('#detailEpisodeTitle'),overview=$('#detailEpisodeOverview'),backdrop=$('#detailBackdrop img');
  if(episode.stillPath&&backdrop)backdrop.src=image(episode.stillPath,'w1280');
  if(title)title.textContent=`S${String(state.selectedSeason).padStart(2,'0')}E${String(episode.episodeNumber).padStart(2,'0')} – ${episode.name}`;
  if(overview)overview.textContent=episode.overview||'';info?.classList.remove('hidden');
  const panel=$('#infoStreams'),links=$('#detailLinksColumn');if(panel&&links)links.append(panel);
  if(document.activeElement instanceof HTMLElement)document.activeElement.blur();requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
  loadInfoStreams({season:state.selectedSeason,episode:Number(episode.episodeNumber),scroll:false});
}

async function openPerson(id,updateRoute=true){
  showView('person');if(updateRoute)route({view:'person',id});els.personContent.innerHTML='<div class="cw-detail-skeleton"></div>';
  try{
    const {data}=await api(`/api/tmdb/person/${id}`);state.selectedPerson=data;
    const born=data.birthday&&!Number.isNaN(new Date(data.birthday).getTime())?new Date(data.birthday).toLocaleDateString('vi-VN',{year:'numeric',month:'long',day:'numeric'}):'';
    const profile=data.profilePath?`<img src="${image(data.profilePath)}" alt="${esc(data.name)}">`:'<span>?</span>';
    const shareIcon='<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4"/></svg>';
    els.personContent.innerHTML=`<section class="cw-person-profile"><div class="cw-person-photo"><i></i>${profile}</div><div class="cw-person-main"><div class="cw-person-title-row"><h1>${esc(data.name)}</h1><button data-share-person type="button" title="Share Profile" aria-label="Share Profile">${shareIcon}</button></div><div class="cw-person-meta">${data.knownForDepartment?`<span>${esc(data.knownForDepartment)}</span>`:''}${born?`<span>Born: ${esc(born)}</span>`:''}${data.placeOfBirth?`<span>${esc(data.placeOfBirth)}</span>`:''}</div><div class="cw-person-biography"><h2>Biography</h2><p data-person-bio>${esc(data.biography||`No biography available for ${data.name}.`)}</p></div></div></section>${data.filmography?.length?`<section class="cw-person-works"><h2>Most Popular Works</h2><div class="cw-poster-grid">${data.filmography.slice(0,60).map(item=>poster(item,false)).join('')}</div></section>`:''}`;
  }catch(error){els.personContent.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;}
}

function torrentBadges(item){
  const text=`${item.title||''} ${item.category||''}`,badges=[];
  if(/\b(2160p|4k|uhd)\b/i.test(text))badges.push('4K');else if(/\b1080p?\b/i.test(text))badges.push('1080P');else if(/\b720p?\b/i.test(text))badges.push('720P');
  if(/dolby[ ._-]?vision|\bDV\b/i.test(text))badges.push('DOLBY VISION');else if(/\bHDR10?\+?\b/i.test(text))badges.push('HDR');
  if(/\b(remux)\b/i.test(text))badges.push('REMUX');
  if(/\b(hevc|x265|h[ ._-]?265)\b/i.test(text))badges.push('HEVC');
  if(/web[ ._-]?dl/i.test(text))badges.push('WEB-DL');else if(/blu[ ._-]?ray|bdrip/i.test(text))badges.push('BLURAY');
  if(/\bS\d{1,2}\s*E\d{1,3}\b/i.test(text))badges.push('EPISODE');else if(/\b(complete|season|S\d{1,2})\b/i.test(text))badges.push('PACK');
  return [...new Set(badges)].slice(0,5);
}
function torrentCard(item){
  state.torrentItems=state.torrentItems||new Map();state.torrentItems.set(item.ref,item);
  const source=esc((item.sources||[item.source]).join(' + ')),badges=torrentBadges(item),added=state.addedTorrents.has(item.ref);
  const copyIcon='<svg viewBox="0 0 24 24"><path d="M9 8h10v11H9z"/><path d="M5 15H4V4h10v1"/></svg>';
  const openIcon='<svg viewBox="0 0 24 24"><path d="M14 5h5v5"/><path d="m11 13 8-8"/><path d="M19 13v6H5V5h6"/></svg>';
  const addIcon=added?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>':'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
  return `<article class="ts-torrent-card"><header><span class="ts-source-tag">${source}</span><small>${esc(item.origin)}</small></header><h3>${esc(item.title)}</h3>${badges.length?`<div class="ts-stream-badges">${badges.map(tag=>`<span>${tag}</span>`).join('')}</div>`:''}<div class="ts-torrent-stats"><span>▣ &nbsp;${esc(item.humanSize||formatBytes(item.size))}</span><span class="seed">♧ &nbsp;${Number(item.seeders).toLocaleString()} seed</span><span>${Number(item.leechers).toLocaleString()} leech</span><span>${esc(item.category)}</span></div><footer><small>${formatAge(item.date)}</small><div class="ts-card-actions"><button data-copy="${item.ref}" type="button" aria-label="Sao chép magnet">${copyIcon}</button>${item.detailsUrl?`<a href="${esc(item.detailsUrl)}" target="_blank" rel="noreferrer" aria-label="Mở trang nguồn">${openIcon}</a>`:''}<button class="ts-add${added?' added':''}" data-add="${item.ref}" type="button"${added?' disabled':''}>${addIcon}<span>${added?'Đã thêm':'Gửi TorrServer'}</span></button></div></footer></article>`;
}
async function searchTorrents(updateRoute=true){
  const q=els.torrentQuery.value.trim();if(q.length<2)return;
  state.torrentQuery=q;state.torrentItems=new Map();
  els.torrentCount.textContent='ĐANG TÌM KIẾM';
  els.torrentTitle.textContent=`“${q}”`;
  els.torrentMeta.textContent='Magnetz + Knaben';
  els.torrentResults.innerHTML='<div class="cw-loading">Đang tìm torrent…</div>';
  if(updateRoute)route({view:'torrent',q,source:state.torrentSource,page:state.torrentPage});
  const p=new URLSearchParams({q,source:state.torrentSource,page:state.torrentPage,maxGb:els.maxSize.value,minSeeds:els.minSeeds.value||'0',sort:els.torrentSort.value,hideXxx:String(els.hideAdult.checked)});
  try{
    const data=await api(`/api/search?${p}`);state.torrentPages=data.meta.maxPages||1;
    const sourceTotal=Object.values(data.meta.sourceTotals||{}).reduce((sum,value)=>sum+(Number(value)||0),0);
    els.torrentCount.textContent=`${data.meta.returned} KẾT QUẢ ĐÃ LỌC`;
    els.torrentMeta.textContent=`${sourceTotal.toLocaleString('vi-VN')} kết quả nguồn · ${data.meta.durationMs} ms`;
    els.torrentResults.innerHTML=(data.data||[]).map(torrentCard).join('')||'<div class="cw-notice">Không có kết quả phù hợp.</div>';
    els.torrentPage.textContent=`${data.meta.page} / ${data.meta.maxPages}`;
    els.torrentPrev.disabled=data.meta.page<=1;els.torrentNext.disabled=!data.meta.hasNextPage;
    els.torrentNotice.classList.toggle('hidden',!data.meta.errors?.length);
    els.torrentNotice.textContent=(data.meta.errors||[]).map(e=>`${e.source}: ${e.message}`).join(' · ');
  }catch(error){
    els.torrentCount.textContent='TÌM KIẾM THẤT BẠI';
    els.torrentMeta.textContent='';
    els.torrentResults.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;
  }
}
function launchExternalPlayer(streamUrl,title=''){
  const url=new URL(streamUrl),path=url.pathname.toLowerCase();
  if(/Android/i.test(navigator.userAgent)){
    const scheme=url.protocol.replace(':',''),fallback=encodeURIComponent(streamUrl),mime=path.endsWith('.m3u8')?'application/x-mpegURL':path.endsWith('.mpd')?'application/dash+xml':path.endsWith('.mkv')?'video/x-matroska':path.endsWith('.webm')?'video/webm':'video/mp4',intentTitle=encodeURIComponent(title||'TorrShelf');
    location.href=`intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;type=${mime};S.title=${intentTitle};S.android.intent.extra.TITLE=${intentTitle};S.browser_fallback_url=${fallback};end`;
  }else location.href=streamUrl;
}
function launchPlayerSession(deepLink,fallbackUrl,engine=''){
  if(!/Android/i.test(navigator.userAgent)){location.href=fallbackUrl;return;}
  const url=new URL(deepLink),fallback=encodeURIComponent(fallbackUrl);if(engine)url.searchParams.set('engine',engine);
  location.href=`intent://${url.host}${url.pathname}${url.search}#Intent;scheme=torrshelf-player;package=app.torrshelf.player;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;S.browser_fallback_url=${fallback};end`;
}
async function addTorrent(ref,button){
  const item=state.torrentItems?.get(ref);if(!item||state.addedTorrents.has(ref)||button?.disabled)return;
  const original=button.innerHTML;button.disabled=true;button.classList.add('sending');button.innerHTML='<span class="ts-play-spinner"></span><span>Đang thêm…</span>';
  try{
    await api('/api/torrserver/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref,tmdb:state.torrentContext,torrServerUrl:state.customTorrServerUrl||''})});
    state.addedTorrents.add(ref);button.classList.remove('sending');button.classList.add('added');button.innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg><span>Đã thêm</span>';notify('Đã thêm');
  }catch(error){button.disabled=false;button.classList.remove('sending');button.innerHTML=original;notify(error.message,'error');}
}
function infoStreamCard(stream){
  const lines=String(stream.title||stream.name||'Stream').split(/\n+/).map(line=>line.trim()).filter(Boolean),headline=lines.shift()||stream.name||'Stream',badges=torrentBadges({title:`${stream.name||''} ${stream.title||''}`}),tracker=stream.tracker||stream.addonName||stream.nativeProvider||'Nguồn';
  state.infoStreams.set(stream.key,stream);
  return `<button class="cw-stream-row" data-info-stream="${esc(stream.key)}" type="button"><span class="cw-stream-row-copy"><span class="cw-stream-tracker">${esc(tracker)}</span><span class="cw-stream-title">${esc(headline)}</span>${badges.length?`<span class="cw-stream-badges">${badges.map(tag=>`<span>${tag}</span>`).join('')}</span>`:''}${lines.length?`<span class="cw-stream-details">${esc(lines.join(' · '))}</span>`:''}</span></button>`;
}
function restoreStreamTabPosition(panel=$('#infoStreams')){const strip=panel?.querySelector('.cw-stream-addon-tabs');if(!strip)return;requestAnimationFrame(()=>{strip.scrollLeft=Math.max(0,Math.min(state.streamTabScrollLeft||0,strip.scrollWidth-strip.clientWidth));});}
function renderStreamGroups({id='',label='',errors=[]}={}){
  const panel=$('#infoStreams');if(!panel)return;const names=[...state.streamGroups.keys()];
  if(!state.selectedStreamAddon||!state.streamGroups.has(state.selectedStreamAddon))state.selectedStreamAddon=names[0]||'';
  const streams=state.streamGroups.get(state.selectedStreamAddon)||[];
  panel.innerHTML=`<div class="cw-stream-addon-tabs">${names.map(name=>`<button class="${name===state.selectedStreamAddon?'active':''}" data-stream-addon="${esc(name)}" type="button">${esc(name)} <b>${state.streamGroups.get(name).length}</b></button>`).join('')}</div><div class="cw-stream-results">${streams.map(infoStreamCard).join('')||'<div class="cw-notice">Không addon nào trả về stream.</div>'}</div>${errors.length?`<div class="cw-stream-errors">${errors.map(error=>esc(error.message)).join(' · ')}</div>`:''}`;
  restoreStreamTabPosition(panel);
}
function activeStreamAddons(){return state.stremioAddons.filter(addon=>CLOUDSTREAM_ENABLED||addon.sourceKind!=='cloudstream-bridge');}
function queriedStreamAddons(){return activeStreamAddons().filter(addon=>!(state.nativeProviderConfig.enabled&&/hybrid/i.test(`${addon.id} ${addon.name}`)));}
async function loadInfoStreams({season=0,episode=0,scroll=true}={}){
  const panel=$('#infoStreams'),item=state.selected,addons=queriedStreamAddons(),nativeEnabled=Boolean(state.nativeProviderConfig.enabled);if(!panel||!item)return;
  const requestId=++state.streamRequestId;
  if(item.mediaType==='tv'&&(!season||!episode)){const episodePanel=$('.cw-episode-browser');episodePanel?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  state.infoStreams.clear();state.streamGroups.clear();state.selectedStreamAddon='';state.streamPanelMeta=null;state.infoStreamContext=null;
  panel.classList.remove('hidden');panel.innerHTML='<div class="cw-stream-loading"><span class="cw-stream-loader"></span><b>Đang tải nguồn…</b></div>';if(scroll)panel.scrollIntoView({behavior:'smooth',block:'start'});
  if(!item.imdbId){panel.innerHTML='<div class="cw-notice">Phim này chưa có IMDb ID để truy vấn nguồn.</div>';return;}
  if(!addons.length&&!nativeEnabled){panel.innerHTML='<div class="cw-stream-empty"><h2>Chưa có nguồn phát</h2><p>Bật Hybrid tích hợp hoặc import Stremio addon trong Settings.</p><button data-open-addon-settings type="button">Mở Settings</button></div>';return;}
  const isAnime=item.mediaType==='tv'&&item.originalLanguage==='ja'&&item.genres?.some(genre=>Number(genre.id)===16),type=item.mediaType==='tv'?(isAnime?'anime':'series'):'movie',id=item.mediaType==='tv'?`${item.imdbId}:${season}:${episode}`:item.imdbId,refresh=state.forceFreshStreams,media={tmdbId:item.id,title:item.title,originalTitle:item.originalTitle,year:item.year,season,episode};
  state.forceFreshStreams=false;state.infoStreamContext={type,id,season,episode};
  try{
    const requests=[];
    if(nativeEnabled)requests.push(api('/api/native/streams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,id,media,config:state.nativeProviderConfig,torrServerUrl:state.customTorrServerUrl||''})}));
    if(addons.length)requests.push(api('/api/stremio/streams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,id,addons:addons.map(addon=>addon.manifestUrl),refresh,media})}));
    const settled=await Promise.allSettled(requests);if(requestId!==state.streamRequestId||state.selected!==item)return;
    const streams=[],errors=[];settled.forEach(result=>{if(result.status==='fulfilled'){streams.push(...(result.value.streams||[]));errors.push(...(result.value.errors||[]));}else errors.push({message:result.reason?.message||'Không tải được nguồn'})});
    state.infoStreams.clear();state.streamGroups.clear();streams.forEach(stream=>{state.infoStreams.set(stream.key,stream);const name=stream.addonName||'Addon';if(!state.streamGroups.has(name))state.streamGroups.set(name,[]);state.streamGroups.get(name).push(stream)});const label=item.mediaType==='tv'?`S${String(season).padStart(2,'0')}E${String(episode).padStart(2,'0')}`:'Movie';
    state.streamPanelMeta={id,label,errors};renderStreamGroups(state.streamPanelMeta);
  }catch(error){if(requestId===state.streamRequestId&&state.selected===item)panel.innerHTML=`<div class="cw-notice">${esc(error.message)}</div>`;}
}
async function playInfoStream(key,button){
  const stream=state.infoStreams.get(key),item=state.selected,context=state.infoStreamContext;if(!stream||!item||!context||button.disabled)return;
  button.disabled=true;button.classList.add('loading');
  try{
    const result=await api('/api/stremio/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...stream,torrServerUrl:state.customTorrServerUrl||''})});
    if(state.playerPreference==='external'){const baseTitle=item.originalTitle||item.title,externalTitle=item.mediaType==='tv'?`${baseTitle} S${String(context.season).padStart(2,'0')}E${String(context.episode).padStart(2,'0')}`:`${baseTitle}${item.year?` (${item.year})`:''}`,handoff=await api('/api/player/external',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({streamUrl:result.streamUrl,title:externalTitle})});notify('Đang mở trình phát ngoài');launchExternalPlayer(handoff.handoffUrl,handoff.title||externalTitle);setTimeout(()=>{button.disabled=false;button.classList.remove('loading');},2500);return;}
    try{
      const poster=item.posterPath?`${location.origin}${image(item.posterPath)}`:'';
      const session=await api('/api/player/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({streamUrl:result.streamUrl,title:item.title,originalTitle:item.originalTitle,year:item.year,poster,posterPath:item.posterPath,backdropPath:item.backdropPath,logoPath:item.logoPath,tmdbId:item.id,mediaType:item.mediaType,imdbId:item.imdbId,season:context.season,episode:context.episode,type:context.type,id:context.id,runtimeMinutes:item.mediaType==='tv'?(Number(state.selectedEpisode?.runtime)||Number(item.runtime)||45):(Number(item.runtime)||120),headers:stream.headers||{},subtitleAddons:activeStreamAddons().map(addon=>addon.manifestUrl)})});
      notify(session.subtitleCount?`Đã tìm thấy ${session.subtitleCount} subtitle`:'Không có subtitle phù hợp');
      launchPlayerSession(session.deepLink,result.streamUrl,['mpv','mx'].includes(state.playerPreference)?state.playerPreference:'');
    }catch(sessionError){notify(`Không tải được subtitle: ${sessionError.message}`,'error');launchExternalPlayer(result.streamUrl,item.originalTitle||item.title);}
    setTimeout(()=>{button.disabled=false;button.classList.remove('loading');},2500);
  }catch(error){button.disabled=false;button.classList.remove('loading');notify(error.message,'error');}
}

function saveStremioAddons(){localStorage.setItem('torrshelf:stremio-addons',JSON.stringify(state.stremioAddons));renderStremioAddons();}
function addonConfigUrl(addon){try{const base=new URL(addon.configUrl||addon.baseUrl||addon.manifestUrl);if(addon.configUrl)return base.href;base.pathname=base.pathname.replace(/\/$/, '')+'/configure';base.search='';base.hash='';return base.href;}catch{return'';}}
function openAddonConfig(value){try{const url=new URL(value);if(!['http:','https:'].includes(url.protocol))throw new Error('invalid');const popup=window.open(url.href,'_blank','noopener,noreferrer');if(!popup)location.href=url.href;}catch{notify('Addon này không có link configure hợp lệ','error');}}
function renderStremioAddons(){
  const addons=activeStreamAddons();els.stremioAddonCount.textContent=String(addons.length);
  els.stremioAddonList.innerHTML=addons.map(addon=>{const replaced=state.nativeProviderConfig.enabled&&/hybrid/i.test(`${addon.id} ${addon.name}`),configUrl=addonConfigUrl(addon)||addon.manifestUrl;return`<article><span>＋</span><div><strong>${esc(addon.name)}</strong><small>${esc(`${addon.version?`v${addon.version} · `:''}${addon.id}${addon.resources?.length?` · ${addon.resources.join(' + ')}`:''}${replaced?' · Native đang thay thế':''}`)}</small><p>${esc(addon.manifestUrl)}</p></div><button class="cw-addon-config" data-config-addon="${esc(configUrl)}" type="button" title="Cấu hình ${esc(addon.name)}" aria-label="Cấu hình ${esc(addon.name)}">⚙</button><button data-remove-addon="${esc(addon.manifestUrl)}" type="button" aria-label="Remove addon">×</button></article>`}).join('')||'<p class="cw-addon-empty">Chưa import addon nào.</p>';
}
async function importStremioAddon(value){
  const submit=els.stremioAddonForm.querySelector('button[type="submit"]'),original=submit.textContent;submit.disabled=true;submit.textContent='Đang import…';markStremioAddonsChanged();
  try{const {addon}=await api('/api/stremio/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value,refresh:true})});state.stremioAddons=[...state.stremioAddons.filter(item=>item.manifestUrl!==addon.manifestUrl&&item.id!==addon.id),addon];markStremioAddonsChanged();saveStremioAddons();els.stremioAddonUrl.value='';notify(`Đã import ${addon.name}`);}catch(error){notify(error.message,'error');}finally{submit.disabled=false;submit.textContent=original;}
}
async function removeStremioAddon(manifestUrl){
  const before=state.stremioAddons.length;state.stremioAddons=state.stremioAddons.filter(addon=>addon.manifestUrl!==manifestUrl);if(state.stremioAddons.length===before)return;
  markStremioAddonsChanged();saveStremioAddons();renderCloudStream();await clearBackendStremioCache();notify('Đã gỡ addon và xóa cache nguồn cũ');
}
function saveCloudStreamState(){localStorage.setItem('torrshelf:cloudstream',JSON.stringify(state.cloudStream));renderCloudStream();}
function renderCloudStream(){
  const plugins=state.cloudStream?.plugins||[],repo=state.cloudStream?.repo,connected=state.stremioAddons.some(addon=>addon.sourceKind==='cloudstream-bridge'||addon.manifestUrl===state.cloudStreamBridgeUrl);
  if(document.activeElement!==els.cloudStreamBridgeUrl)els.cloudStreamBridgeUrl.value=state.cloudStreamBridgeUrl;
  els.cloudStreamStatusBadge.textContent=connected?'LIVE':plugins.length?'READY':'ALPHA';els.cloudStreamStatusBadge.classList.toggle('public',connected);
  els.cloudStreamPluginList.innerHTML=plugins.map(plugin=>`<article><span>CS</span><div><strong>${esc(plugin.name)} <b>v${plugin.version}</b></strong><small>${esc((plugin.authors||[]).join(', '))} · ${esc(plugin.language||'multi')}</small><p>${esc(plugin.description||'CloudStream plugin')}</p></div><a href="${esc(plugin.url)}" target="_blank" rel="noreferrer">.cs3 ↗</a></article>`).join('')||(repo?'<p class="cw-addon-empty">Repo đã import nhưng chưa tìm thấy StreamPlay.</p>':'<p class="cw-addon-empty">Import Phisher repo để nhận diện StreamPlay.</p>');
  els.cloudStreamBridgeStatus.textContent=connected?'Bridge đã kết nối. Nguồn StreamPlay sẽ xuất hiện chung trong list stream.':'Cài StreamPlay trong Bridge, bật local server rồi dán manifest URL hiển thị trong Bridge.';
}
async function importCloudStreamRepo(value){
  const submit=els.cloudStreamRepoForm.querySelector('button'),original=submit.textContent;submit.disabled=true;submit.textContent='Đang đọc repo…';
  try{const data=await api('/api/cloudstream/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});const streamPlay=data.plugins.find(plugin=>String(plugin.internalName).toLowerCase()==='streamplay');state.cloudStream={repo:data.repo,plugins:streamPlay?[streamPlay]:[]};saveCloudStreamState();notify(streamPlay?`Đã nhận diện StreamPlay v${streamPlay.version}`:'Repo không có StreamPlay','ok');}catch(error){notify(error.message,'error');}finally{submit.disabled=false;submit.textContent=original;}
}
async function connectCloudStreamBridge(value){
  const submit=els.cloudStreamBridgeForm.querySelector('button'),original=submit.textContent;submit.disabled=true;submit.textContent='Đang kết nối…';
  try{const {addon}=await api('/api/stremio/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:value})});const bridgeAddon={...addon,sourceKind:'cloudstream-bridge'};state.stremioAddons=[...state.stremioAddons.filter(item=>item.manifestUrl!==bridgeAddon.manifestUrl),bridgeAddon];state.cloudStreamBridgeUrl=bridgeAddon.manifestUrl;localStorage.setItem('torrshelf:cloudstream-bridge',bridgeAddon.manifestUrl);saveStremioAddons();renderCloudStream();notify('Đã kết nối CloudStream Bridge');}catch(error){notify(error.message,'error');}finally{submit.disabled=false;submit.textContent=original;}
}

function normalizeTorrServerInput(value){
  let raw=String(value||'').trim();if(!raw)throw new Error('Nhập địa chỉ TorrServer.');
  if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw))raw=`http://${raw}`;
  const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw new Error('Chỉ hỗ trợ HTTP hoặc HTTPS.');
  return url.origin;
}
function activeTorrServerUrl(){return state.customTorrServerUrl||state.health?.torrServerPublicUrl||'http://127.0.0.1:8090';}
function showTorrServerTarget({url,online,version,custom=Boolean(state.customTorrServerUrl),message=''}){
  els.settingsServerDot.classList.toggle('online',!!online);
  els.settingsServerVersion.textContent=online?`TorrServer ${version}`:'TorrServer Offline';
  els.settingsServerUrl.textContent=url;els.openTorrServer.href=url;
  els.torrServerConfigBadge.textContent=custom?'PUBLIC':'LOCAL';els.torrServerConfigBadge.classList.toggle('public',custom);
  els.torrServerConfigStatus.textContent=message||(online?'Kết nối thành công. Stream mới sẽ phát qua máy chủ này.':'Không kết nối được TorrServer.');
}
function applyPosterLayout(){document.body.dataset.posterColumns=String(state.posterColumns);if(els.posterColumns)els.posterColumns.value=String(state.posterColumns)}
function updatePlayerPreferenceUI(){
  if(!els.playerPreference)return;els.playerPreference.value=state.playerPreference;els.playerPreferenceNote.textContent=state.playerPreference==='external'?'Mở URL stream trực tiếp bằng trình phát Android đã chọn. Chế độ này không nhận lại tiến độ.':state.playerPreference==='mpv'?'TorrShelf Bridge gửi mốc resume và subtitle sang mpv-android. Một số stream TorrServer có thể bị mpv bỏ qua initial seek.':state.playerPreference==='mx'?'TorrShelf Bridge dùng API ActivityResult chính thức của MX Player để resume và nhận lại tiến độ, không sửa APK MX Player.':'TorrShelf Player nhận play session, HTTP headers và phụ đề theo đúng IMDb/tập phim.';
}
function renderNativeProviderSettings(){
  const form=els.nativeProviderForm;if(!form)return;const c=state.nativeProviderConfig;
  ['enabled','torrentioEnabled','jacredEnabled','knabenEnabled','magnetzEnabled','fourKhdHubEnabled','moviesDriveEnabled','hdHub4uEnabled','vadapavEnabled','uhdMoviesEnabled','hubCloudSearchEnabled','preferPack','animeMode'].forEach(name=>{form.elements[name].checked=Boolean(c[name])});
  ['jacredDomain','torrentioManifestUrl','commonSortBy','maxResults','sizeMinGB','sizeMaxGB'].forEach(name=>{form.elements[name].value=c[name]??''});
  form.querySelectorAll('input[name="quality"]').forEach(input=>{input.checked=(c.commonQualityFilter||[]).includes(input.value)});
}
function readNativeProviderForm(){
  const form=els.nativeProviderForm,number=(name,fallback)=>{const value=Number(form.elements[name].value);return Number.isFinite(value)?value:fallback};
  return{enabled:form.elements.enabled.checked,torrentioEnabled:form.elements.torrentioEnabled.checked,jacredEnabled:form.elements.jacredEnabled.checked,knabenEnabled:form.elements.knabenEnabled.checked,magnetzEnabled:form.elements.magnetzEnabled.checked,fourKhdHubEnabled:form.elements.fourKhdHubEnabled.checked,moviesDriveEnabled:form.elements.moviesDriveEnabled.checked,hdHub4uEnabled:form.elements.hdHub4uEnabled.checked,vadapavEnabled:form.elements.vadapavEnabled.checked,uhdMoviesEnabled:form.elements.uhdMoviesEnabled.checked,hubCloudSearchEnabled:form.elements.hubCloudSearchEnabled.checked,jacredDomain:form.elements.jacredDomain.value,torrentioManifestUrl:form.elements.torrentioManifestUrl.value.trim(),commonSortBy:form.elements.commonSortBy.value,commonQualityFilter:[...form.querySelectorAll('input[name="quality"]:checked')].map(input=>input.value),maxResults:Math.max(5,Math.min(200,Math.round(number('maxResults',30)))),sizeMinGB:Math.max(0,number('sizeMinGB',0)),sizeMaxGB:Math.max(0,number('sizeMaxGB',1000)),preferPack:form.elements.preferPack.checked,animeMode:form.elements.animeMode.checked};
}
function updateSettings(){
  updatePlayerPreferenceUI();applyPosterLayout();renderNativeProviderSettings();const h=state.health;if(!h)return;const active=activeTorrServerUrl(),custom=Boolean(state.customTorrServerUrl);
  if(document.activeElement!==els.torrServerUrlInput)els.torrServerUrlInput.value=active;
  if(custom)showTorrServerTarget({url:active,online:false,version:null,custom:true,message:'Đã lưu máy chủ public. Bấm Check connection để kiểm tra lại.'});
  else showTorrServerTarget({url:active,online:!!h.torrServer.online,version:h.torrServer.version,custom:false});
  els.settingsTmdb.textContent=h.tmdb.configured?`TMDB ${h.tmdb.validated?'validated':'configured'} · ${h.tmdb.language} · ${h.tmdb.region}`:'TMDB not configured';
}
async function checkTorrServerTarget(value,{save=false,notifyUser=false}={}){
  let url;try{url=normalizeTorrServerInput(value);}catch(error){els.torrServerConfigStatus.textContent=error.message;if(notifyUser)notify(error.message,'error');return null;}
  els.torrServerConfigStatus.textContent='Đang kiểm tra kết nối…';els.torrServerConfigBadge.textContent='CHECK';
  try{
    const result=await api('/api/torrserver/check',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
    if(save){state.customTorrServerUrl=result.url;localStorage.setItem('torrshelf:torrserver-url',result.url);state.addedTorrents.clear();}
    els.torrServerUrlInput.value=result.url;showTorrServerTarget({url:result.url,online:true,version:result.version,custom:save||Boolean(state.customTorrServerUrl)});
    if(notifyUser)notify(save?'Đã lưu TorrServer':'Kết nối thành công');return result;
  }catch(error){showTorrServerTarget({url,online:false,version:null,custom:Boolean(state.customTorrServerUrl),message:error.message});if(notifyUser)notify(error.message,'error');return null;}
}
async function checkHealth(){
  try{state.health=await api('/api/health');updateSettings();if(state.customTorrServerUrl)await checkTorrServerTarget(state.customTorrServerUrl);}catch{state.health=null;}
}
function rememberContext(item,extra={}){state.torrentContext={id:item.id,mediaType:item.mediaType,title:item.title,originalTitle:item.originalTitle,year:item.year,posterPath:item.posterPath,backdropPath:item.backdropPath,season:Number(extra.season)||0,episode:Number(extra.episode)||0};}
function findTorrentFor(item,query,extra={}){rememberContext(item,extra);els.torrentQuery.value=query||`${item.originalTitle||item.title} ${item.year||''}`.trim();state.torrentPage=1;navigate('torrent',{q:els.torrentQuery.value});searchTorrents(false);}

function handleMediaClick(button){const item=state.media.get(button.dataset.media||button.dataset.detail||button.dataset.find);if(!item)return;if(button.dataset.find!==undefined)findTorrentFor(item);else openDetail(item);}

els.globalSearchForm.addEventListener('submit',e=>{e.preventDefault();searchTmdb(els.globalSearchInput.value,1)});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>{const view=b.dataset.go;if(view==='discover'){route({view:'discover'});loadDiscovery(false);}else if(view==='home'){route({view:'home'});state.homeLoaded?showView('home'):loadHome();}else if(view==='library'){navigate('library');loadSyncState();}else navigate(view);}));
$$('[data-back]').forEach(b=>b.addEventListener('click',back));
els.detailHeaderBack.addEventListener('click',handleDetailBack);
els.detailHeaderShare.addEventListener('click',shareSelected);
els.detailHeaderLibrary.addEventListener('click',toggleCurrentLibrary);
els.hero.addEventListener('click',e=>{const slide=e.target.closest('[data-slide]');if(slide){setHero(Number(slide.dataset.slide));startHero();return;}const b=e.target.closest('[data-detail],[data-find]');if(b)handleMediaClick(b)});
els.homeRows.addEventListener('click',e=>{const b=e.target.closest('[data-media]');if(b)handleMediaClick(b)});
els.discoverGrid.addEventListener('click',e=>{const b=e.target.closest('[data-media]');if(b)handleMediaClick(b)});
els.browseGrid.addEventListener('click',e=>{const b=e.target.closest('[data-media]');if(b)handleMediaClick(b)});
els.library.addEventListener('click',e=>{const tab=e.target.closest('[data-library-tab]');if(tab)return setLibraryTab(tab.dataset.libraryTab);const b=e.target.closest('[data-media]');if(b)handleMediaClick(b)});
els.peopleGrid.addEventListener('click',e=>{const b=e.target.closest('[data-person]');if(b)openPerson(Number(b.dataset.person))});
els.personContent.addEventListener('click',e=>{const share=e.target.closest('[data-share-person]');if(share)return sharePersonProfile();const bio=e.target.closest('[data-person-bio]');if(bio){bio.classList.toggle('expanded');return;}const b=e.target.closest('[data-media]');if(b)handleMediaClick(b)});
function handleDetailArtworkError(e){
  const backdrop=e.target.closest?.('img[data-backdrop-fallback]');if(backdrop){const fallback=backdrop.dataset.backdropFallback;delete backdrop.dataset.backdropFallback;if(fallback&&backdrop.src!==new URL(fallback,location.origin).href)backdrop.src=fallback;return;}
  const logo=e.target.closest?.('img.cw-detail-logo,img#detailHeaderLogo');if(!logo)return;const fallback=logo.dataset.logoFallback;delete logo.dataset.logoFallback;if(fallback&&logo.src!==new URL(fallback,location.origin).href){logo.src=fallback;return;}logo.classList.add('hidden');if(logo.id==='detailHeaderLogo')els.detailHeaderTitle.classList.remove('hidden');else logo.parentElement?.querySelector('.cw-logo-title-fallback')?.classList.remove('hidden');
}
els.detailContent.addEventListener('error',handleDetailArtworkError,true);els.detailHeaderLogo.addEventListener('error',handleDetailArtworkError);els.detailContent.addEventListener('load',e=>{if(e.target.matches?.('#detailBackdrop img'))requestAnimationFrame(updateDetailHeaderMotion);},true);
els.detailContent.addEventListener('click',e=>{
  const detailBack=e.target.closest('[data-detail-back]');if(detailBack)return handleDetailBack();
  const library=e.target.closest('[data-library-current]');if(library)return toggleCurrentLibrary();
  const like=e.target.closest('[data-like-current]');if(like)return toggleCurrentLike();
  const addonTab=e.target.closest('[data-stream-addon]');if(addonTab){state.streamTabScrollLeft=addonTab.closest('.cw-stream-addon-tabs')?.scrollLeft||0;state.selectedStreamAddon=addonTab.dataset.streamAddon;renderStreamGroups(state.streamPanelMeta||{});return;}
  const stream=e.target.closest('[data-info-stream]');if(stream)return playInfoStream(stream.dataset.infoStream,stream);
  const openSettings=e.target.closest('[data-open-addon-settings]');if(openSettings)return openStremioAddonSettings();
  const share=e.target.closest('[data-share-current]');if(share)return shareSelected();
  const p=e.target.closest('[data-person]');if(p)return openPerson(Number(p.dataset.person));
  const m=e.target.closest('[data-media]');if(m)return handleMediaClick(m);
  const genre=e.target.closest('[data-genre]');if(genre){state.discoverFilter={kind:'genre',id:genre.dataset.genre,label:genre.dataset.label};navigate('discover');loadDiscovery();return;}
  const seasonButton=e.target.closest('[data-season]');if(seasonButton&&state.selected){state.selectedSeason=Number(seasonButton.dataset.season);$$('[data-season]').forEach(button=>button.classList.toggle('active',button===seasonButton));const panel=$('#infoStreams');if(panel){panel.classList.add('hidden');panel.innerHTML='';}resetEpisodeHero();loadSeason(state.selected.id,state.selectedSeason);return;}
  const ep=e.target.closest('[data-episode]');if(ep&&state.selected){$$('.cw-episode').forEach(button=>button.classList.toggle('active',button===ep));selectEpisode(state.seasonEpisodes.get(Number(ep.dataset.episode)));}
});
$$('[data-discover-tab]').forEach(b=>b.addEventListener('click',()=>{state.discoverTab=b.dataset.discoverTab;loadDiscovery(false)}));
$$('[data-sort]').forEach(b=>b.addEventListener('click',()=>{state.discoverSort=b.dataset.sort;loadDiscovery(false)}));
els.discoverControls.addEventListener('click',e=>{const mood=e.target.closest('[data-mood]');const genre=e.target.closest('[data-genre]');const b=mood||genre;if(!b)return;state.discoverFilter={kind:'genre',id:mood?mood.dataset.mood:genre.dataset.genre,label:b.dataset.label};state.discoverTab='hub';$$('[data-mood],[data-genre]').forEach(x=>x.classList.toggle('active',x===b));loadDiscovery(false)});
els.browsePrev.addEventListener('click',()=>{if(state.browsePage>1)searchTmdb(state.browseQuery,--state.browsePage)});els.browseNext.addEventListener('click',()=>{if(state.browsePage<state.browsePages)searchTmdb(state.browseQuery,++state.browsePage)});
els.torrentQuery.addEventListener('input',()=>{state.torrentContext=null});
els.torrentForm.addEventListener('submit',e=>{e.preventDefault();state.torrentPage=1;searchTorrents()});
$$('[data-source]').forEach(b=>b.addEventListener('click',()=>{state.torrentSource=b.dataset.source;state.torrentPage=1;$$('[data-source]').forEach(x=>x.classList.toggle('active',x===b));if(state.torrentQuery)searchTorrents()}));
els.torrentResults.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add)return addTorrent(add.dataset.add,add);const copy=e.target.closest('[data-copy]');if(copy){const item=state.torrentItems?.get(copy.dataset.copy);if(item)navigator.clipboard.writeText(item.link).then(()=>notify('Magnet copied'))}});
els.torrentPrev.addEventListener('click',()=>{if(state.torrentPage>1){state.torrentPage--;searchTorrents()}});els.torrentNext.addEventListener('click',()=>{if(state.torrentPage<state.torrentPages){state.torrentPage++;searchTorrents()}});
els.torrServerSettingsForm.addEventListener('submit',e=>{e.preventDefault();checkTorrServerTarget(els.torrServerUrlInput.value,{save:true,notifyUser:true})});
els.useLocalTorrServer.addEventListener('click',()=>{state.customTorrServerUrl='';state.addedTorrents.clear();localStorage.removeItem('torrshelf:torrserver-url');updateSettings();notify('Đã dùng TorrServer local')});
els.playerPreference.addEventListener('change',()=>{state.playerPreference=['torrshelf','mpv','mx','external'].includes(els.playerPreference.value)?els.playerPreference.value:'torrshelf';localStorage.setItem('torrshelf:player',state.playerPreference);updatePlayerPreferenceUI();notify(state.playerPreference==='external'?'Đã chọn trình phát ngoài':state.playerPreference==='mpv'?'Đã chọn mpv-android':state.playerPreference==='mx'?'Đã chọn MX Player sync':'Đã chọn TorrShelf Player')});
els.posterColumns?.addEventListener('change',()=>{state.posterColumns=els.posterColumns.value==='2'?2:3;localStorage.setItem('torrshelf:poster-columns',String(state.posterColumns));applyPosterLayout();notify(`Đã dùng ${state.posterColumns} cột poster`)});
els.nativeProviderForm.addEventListener('submit',e=>{e.preventDefault();const config=readNativeProviderForm();if(config.sizeMaxGB&&config.sizeMaxGB<config.sizeMinGB)config.sizeMaxGB=config.sizeMinGB;state.nativeProviderConfig=config;localStorage.setItem('torrshelf:native-provider',JSON.stringify(config));state.forceFreshStreams=true;clearInfoStreamState();renderNativeProviderSettings();renderStremioAddons();notify('Đã lưu Hybrid tích hợp')});
els.checkConnection.addEventListener('click',()=>state.customTorrServerUrl?checkTorrServerTarget(state.customTorrServerUrl,{notifyUser:true}):checkHealth());
els.stremioAddonForm.addEventListener('submit',e=>{e.preventDefault();importStremioAddon(els.stremioAddonUrl.value)});
els.stremioAddonList.addEventListener('click',e=>{const config=e.target.closest('[data-config-addon]');if(config)return openAddonConfig(config.dataset.configAddon);const remove=e.target.closest('[data-remove-addon]');if(remove)removeStremioAddon(remove.dataset.removeAddon)});
els.cloudStreamRepoForm.addEventListener('submit',e=>{e.preventDefault();importCloudStreamRepo(els.cloudStreamRepoUrl.value)});
els.cloudStreamBridgeForm.addEventListener('submit',e=>{e.preventDefault();connectCloudStreamBridge(els.cloudStreamBridgeUrl.value)});
renderStremioAddons();renderCloudStream();updatePlayerPreferenceUI();applyPosterLayout();renderNativeProviderSettings();

let detailScrollFrame=0;
addEventListener('scroll',()=>{if(detailScrollFrame)return;detailScrollFrame=requestAnimationFrame(()=>{detailScrollFrame=0;updateDetailHeaderMotion()})},{passive:true});
addEventListener('resize',()=>requestAnimationFrame(updateDetailHeaderMotion));

const discoverObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)&&state.view==='discover')loadDiscovery(true);},{rootMargin:'700px 0px'});
discoverObserver.observe(els.discoverSentinel);

async function restore(){const url=new URL(location.href),view=url.searchParams.get('view')||'home';if(view==='home')return state.homeLoaded?showView('home'):loadHome();if(view==='discover')return loadDiscovery();if(view==='torrent'){showView('torrent');const q=url.searchParams.get('q');if(q){els.torrentQuery.value=q;state.torrentQuery=q;searchTorrents(false)}return;}if(view==='library'){showView('library');loadSyncState();return;}if(view==='settings'){showView('settings');updateSettings();return;}if(view==='browse'&&url.searchParams.get('q'))return searchTmdb(url.searchParams.get('q'),Number(url.searchParams.get('page'))||1,false);if(view==='detail'&&url.searchParams.get('id'))return openDetail({id:Number(url.searchParams.get('id')),mediaType:url.searchParams.get('type')==='tv'?'tv':'movie',title:'Loading…'},false);if(view==='person'&&url.searchParams.get('id'))return openPerson(Number(url.searchParams.get('id')),false);loadHome();}
let syncReturnTimer=0;function refreshSyncAfterReturn(){clearTimeout(syncReturnTimer);syncReturnTimer=setTimeout(loadSyncState,180)}
history.scrollRestoration='manual';history.replaceState({cw:true},'',location.href);addEventListener('popstate',restore);addEventListener('focus',refreshSyncAfterReturn);addEventListener('pageshow',refreshSyncAfterReturn);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSyncAfterReturn()});checkHealth();loadSyncState();restore();
