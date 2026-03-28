// kkphim.js
(function(){
  "use strict";

  if(!window.Lampa) {
    console.warn('Lampa not found, kkphim plugin aborted');
    return;
  }

  // Cấu hình nhanh (thay nếu cần)
  var CONFIG = {
    apiQuick: 'https://phimapi.com/api/v1/movies', // dùng để load nhanh poster/category
    imgBase: 'https://img.phimapi.com/',
    menuId: 'kkphim'
  };

  // Tạo menu item (Controller API nếu có, ngược lại DOM)
  function addLeftMenu(){
    try{
      // 1) Nếu Lampa.Controller.add tồn tại (Android builds)
      if(window.Lampa && Lampa.Controller && typeof Lampa.Controller.add === 'function'){
        try{
          Lampa.Controller.add({
            id: CONFIG.menuId,
            title: 'kkphim',
            icon: 'fa-film',
            onClick: function(){
              openCategory();
            },
            onSettings: function(){
              openSettings();
            }
          });
          console.log('kkphim menu added via Lampa.Controller');
          return;
        }catch(e){
          console.warn('kkphim Controller.add failed', e);
        }
      }

      // 2) Fallback DOM insertion (try several selectors)
      var selectors = ['.menu .menu__list', '.menu__list', '.left-menu', '.menu-list', '.menu'];
      var menuList = null;
      for(var i=0;i<selectors.length;i++){
        menuList = document.querySelector(selectors[i]);
        if(menuList) break;
      }
      if(!menuList){
        console.warn('kkphim: left menu container not found (DOM fallback)');
        return;
      }

      // tránh chèn trùng
      if(menuList.querySelector('[data-action="'+CONFIG.menuId+'"]')) return;

      var li = document.createElement('li');
      li.className = 'menu__item selector';
      li.setAttribute('data-action', CONFIG.menuId);
      li.innerHTML = ''
        + '<div class="menu__ico" style="font-size:18px;line-height:20px">🎬</div>'
        + '<div class="menu__text">kkphim</div>';

      // sự kiện chọn (hover:enter là event Lampa dùng)
      li.addEventListener('hover:enter', function(){
        openCategory();
      });

      menuList.appendChild(li);
      console.log('kkphim menu added via DOM fallback');
    }catch(err){
      console.error('kkphim addLeftMenu error', err);
    }
  }

  // Mở category: ưu tiên Lampa.Activity.push, fallback Lampa.Render.showList, cuối cùng mở popup HTML
  function openCategory(){
    // Try to fetch quick list (non-blocking)
    fetchQuickList().then(function(items){
      if(window.Lampa && Lampa.Activity && typeof Lampa.Activity.push === 'function'){
        var cards = items.map(function(it){ return { title: it.title, poster: it.poster, id: it.id, card: it }; });
        Lampa.Activity.push({ title: 'kkphim', component: 'category', source: 'kkphim', page: 1, cards: cards });
        return;
      }
      if(window.Lampa && Lampa.Render && typeof Lampa.Render.showList === 'function'){
        Lampa.Render.showList({ title: 'kkphim', items: items.map(function(it){ return { title: it.title, poster: it.poster, url: it.id, params: { card: it } }; }) });
        return;
      }
      // fallback simple HTML
      var html = '<div style="padding:12px;font-family:Arial"><h2>kkphim</h2>' + items.map(function(i){
        return '<div style="display:inline-block;width:140px;margin:8px;text-align:center"><img src="'+i.poster+'" style="width:120px;height:170px;object-fit:cover"><div style="font-size:12px">'+escapeHtml(i.title)+'</div></div>';
      }).join('') + '</div>';
      var w = window.open();
      if(w) w.document.body.innerHTML = html;
    }).catch(function(e){
      console.error('kkphim openCategory error', e);
      try{ Lampa.Noty && Lampa.Noty.show && Lampa.Noty.show('Lỗi tải kkphim'); }catch(e){}
    });
  }

  // Fetch nhanh danh sách (dùng để hiển thị poster grid)
  function fetchQuickList(){
    return fetch(CONFIG.apiQuick).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function(json){
      var arr = json.data || json.results || json.items || json;
      if(!Array.isArray(arr)) arr = [];
      return arr.slice(0,48).map(function(it){
        var poster = it.poster ? (CONFIG.imgBase.replace(/\/+$/,'/') + String(it.poster).replace(/^\/+/,'')) : (it.image || '');
        return { title: it.title || it.name || '', id: it.id || it.slug || '', poster: poster };
      });
    });
  }

  // Settings minimal (modal)
  function openSettings(){
    var s = loadSettings();
    var panel = document.createElement('div');
    panel.style.padding = '12px';
    panel.innerHTML = ''
      + '<label>API Base <input id="kk_api" style="width:100%" value="'+escapeHtml(s.apiBase)+'"></label><br>'
      + '<label>Image Base <input id="kk_img" style="width:100%" value="'+escapeHtml(s.imgBase)+'"></label><br>'
      + '<button id="kk_save" style="margin-top:8px">Lưu</button>';
    panel.querySelector('#kk_save').addEventListener('click', function(){
      var newApi = panel.querySelector('#kk_api').value || s.apiBase;
      var newImg = panel.querySelector('#kk_img').value || s.imgBase;
      saveSettings({ apiBase: newApi, imgBase: newImg });
      try{ Lampa.Noty && Lampa.Noty.show && Lampa.Noty.show('Cài đặt kkphim đã lưu'); }catch(e){ console.log('saved'); }
    });
    try{
      if(Lampa.Modal && typeof Lampa.Modal.open === 'function'){
        Lampa.Modal.open({ title: 'Cài đặt kkphim', html: panel });
        return;
      }
    }catch(e){}
    alert('Cài đặt kkphim: mở console để chỉnh');
  }

  // Settings storage
  var SETTINGS_KEY = 'kkphim_settings_v1';
  function loadSettings(){
    try{
      var s = localStorage.getItem(SETTINGS_KEY);
      return s ? JSON.parse(s) : { apiBase: CONFIG.apiQuick.replace(/\/api\/.*$/,''), imgBase: CONFIG.imgBase };
    }catch(e){ return { apiBase: CONFIG.apiQuick.replace(/\/api\/.*$/,''), imgBase: CONFIG.imgBase }; }
  }
  function saveSettings(obj){
    try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(Object.assign({}, loadSettings(), obj))); }catch(e){}
  }

  // Utility
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // Init: wait for app ready then add menu
  function init(){
    try{
      if(window.Lampa && Lampa.Listener && typeof Lampa.Listener.follow === 'function'){
        Lampa.Listener.follow('app', function(e){
          if(e && (e.type === 'ready' || e.action === 'ready')) setTimeout(addLeftMenu, 200);
        });
      } else {
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(addLeftMenu, 300); });
        setTimeout(addLeftMenu, 1000);
      }
      // expose quick helpers for debug
      window.kkphim = window.kkphim || {};
      window.kkphim.openCategory = openCategory;
      window.kkphim.fetchQuickList = fetchQuickList;
      console.log('kkphim plugin initialized');
    }catch(e){
      console.error('kkphim init error', e);
    }
  }

  init();

})();