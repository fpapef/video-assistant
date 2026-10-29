// ==UserScript==
// @name         Video Assistant (lecteur faÃ§on Samsung)
// @namespace    video-assistant
// @version      1.0
// @description  Bouton flottant qui ouvre n'importe quelle vidÃ©o dans un lecteur plein Ã©cran avec gestes et raccourcis.
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// @all-frames   true
// @noframes     false
// ==/UserScript==
/* Video Assistant — lecteur plein écran façon Samsung Internet, pour n'importe quel navigateur. */
(function () {
  if (window.__VA) return;
  var VA = (window.__VA = {});
  var Z = 2147483647;

  // YouTube & co imposent les Trusted Types : innerHTML brut y est bloqué.
  var tt = null;
  try { tt = window.trustedTypes && trustedTypes.createPolicy('videoAssistant', { createHTML: function (s) { return s; } }); } catch (e) {}
  function H(s) { return tt ? tt.createHTML(s) : s; }

  var I = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    full: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    pip: 'M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z',
    vol: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.730 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    rot: 'M7.34 6.41L.86 12.9l6.49 6.48 6.49-6.48-6.5-6.49zM3.69 12.9l3.66-3.66L11 12.9l-3.66 3.66-3.65-3.66zm15.67-6.26C17.61 4.88 15.3 4 13 4V.76L8.76 5 13 9.24V6c1.79 0 3.58.68 4.95 2.05 2.73 2.73 2.73 7.17 0 9.9C16.58 19.32 14.79 20 13 20c-.97 0-1.94-.21-2.84-.61l-1.49 1.49C10.02 21.62 11.51 22 13 22c2.3 0 4.61-.88 6.36-2.640 3.52-3.51 3.52-9.21 0-12.72z',
    expand: 'M21 11V3h-8l3.29 3.29-10 10L3 13v8h8l-3.29-3.29 10-10z'
  };
  function svg(p) { return '<svg viewBox="0 0 24 24"><path d="' + p + '"/></svg>'; }

  function fmt(t) {
    if (!isFinite(t)) return '--:--';
    t = Math.max(0, Math.floor(t));
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // La vidéo "principale" : celle qui joue, sinon la plus grande à l'écran.
  function findVideo() {
    var best = null, bestScore = 0;
    document.querySelectorAll('video').forEach(function (v) {
      var r = v.getBoundingClientRect();
      var area = r.width * r.height;
      if (area < 2000 && !(v.videoWidth > 0)) return;
      var score = area + (!v.paused ? 1e9 : 0) + (v.readyState > 0 ? 1e8 : 0);
      if (score > bestScore) { bestScore = score; best = v; }
    });
    return best;
  }

  var CSS =
    ':host{all:initial}' +
    '.ov{position:fixed;inset:0;z-index:' + Z + ';background:#000;font:14px/1.2 system-ui,-apple-system,Roboto,sans-serif;color:#fff;touch-action:none;user-select:none;-webkit-user-select:none}' +
    'video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;object-fit:contain;background:#000;display:block!important;visibility:visible!important;opacity:1!important}' +
    '.ui{position:absolute;inset:0;transition:opacity .25s;background:linear-gradient(#000a,transparent 22%,transparent 70%,#000c)}' +
    '.hide .ui{opacity:0;pointer-events:none}.hide{cursor:none}' +
    '.top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:16px 20px}' +
    '.title{flex:1;font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.mid{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:56px}' +
    '.bot{position:absolute;left:0;right:0;bottom:0;padding:0 20px 14px}' +
    '.row{display:flex;align-items:center;gap:14px}.row.tools{justify-content:flex-end;gap:6px;margin-top:6px}' +
    'button{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;padding:0 8px;border-radius:22px;cursor:pointer;color:#fff;font:600 14px system-ui,sans-serif}' +
    'button:hover,button:focus-visible{background:#ffffff26;outline:2px solid #fff6}' +
    'button svg{width:26px;height:26px;fill:#fff}' +
    '.big{width:76px;height:76px;border-radius:50%;background:#0006}.big svg{width:44px;height:44px}' +
    '.skip{width:60px;height:60px;border-radius:50%;background:#0006;font-size:17px}' +
    '.t{font-variant-numeric:tabular-nums;min-width:52px;text-align:center}' +
    'input[type=range]{flex:1;height:28px;accent-color:#3e7bfa;cursor:pointer;margin:0}' +
    '.toast{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#000b;padding:14px 22px;border-radius:14px;font-size:22px;font-weight:600;opacity:0;transition:opacity .2s;pointer-events:none;white-space:nowrap}' +
    '.toast.on{opacity:1}' +
    '.fab{position:fixed;right:20px;bottom:90px;z-index:' + (Z - 1) + ';width:56px;height:56px;border-radius:50%;background:#3e7bfa;box-shadow:0 4px 14px #0007;display:none}' +
    '.fab.on{display:inline-flex}.fab svg{width:28px;height:28px}';

  var host = null, root = null, ov = null, video = null, placeholder = null;
  var saved = null, hideT = null, toastT = null, bright = 1, fitIdx = 0, ownHistory = false;
  var FITS = ['contain', 'cover', 'fill'];
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  function ensureHost() {
    if (host && host.isConnected) return;
    host = document.createElement('va-host');
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = H('<style>' + CSS + '</style>');
    (document.body || document.documentElement).appendChild(host);
  }

  function $(sel) { return ov.querySelector(sel); }

  function toast(msg) {
    var el = $('.toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('on'); }, 700);
  }

  function showUI() {
    ov.classList.remove('hide');
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (video && !video.paused) ov.classList.add('hide'); }, 3000);
  }

  function seek(d) {
    var dur = video.duration;
    var t = video.currentTime + d;
    video.currentTime = isFinite(dur) ? Math.min(Math.max(0, t), dur - 0.1) : Math.max(0, t);
    toast((d > 0 ? '+' : '−') + Math.abs(d) + ' s');
  }
  function togglePlay() { if (video.paused) video.play(); else video.pause(); }
  function setVol(v) {
    video.volume = Math.min(1, Math.max(0, v));
    video.muted = video.volume === 0;
    toast('Volume ' + Math.round(video.volume * 100) + ' %');
  }
  function setBright(b) {
    bright = Math.min(1.5, Math.max(0.2, b));
    video.style.setProperty('filter', bright === 1 ? 'none' : 'brightness(' + bright + ')', 'important');
    toast('Luminosité ' + Math.round(bright * 100) + ' %');
  }
  function cycleSpeed() {
    var i = SPEEDS.indexOf(video.playbackRate);
    video.playbackRate = SPEEDS[(i + 1) % SPEEDS.length] || 1;
    $('[data-a=speed]').textContent = video.playbackRate + '×';
    toast('Vitesse ' + video.playbackRate + '×');
  }
  function cycleFit() {
    fitIdx = (fitIdx + 1) % FITS.length;
    video.style.setProperty('object-fit', FITS[fitIdx], 'important');
    toast(['Ajuster', 'Remplir (rogner)', 'Étirer'][fitIdx]);
  }
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function toggleFS() {
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      var p = (host.requestFullscreen || host.webkitRequestFullscreen).call(host);
      if (p && p.catch) p.catch(function () {});
    }
  }
  function rotate() {
    try {
      var o = screen.orientation;
      var next = o.type.indexOf('landscape') === 0 ? 'portrait' : 'landscape';
      o.lock(next).then(function () { toast(next === 'landscape' ? 'Paysage' : 'Portrait'); }, function () { toast('Rotation indisponible ici'); });
    } catch (e) { toast('Rotation indisponible ici'); }
  }
  function pip() {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else if (video.requestPictureInPicture) video.requestPictureInPicture().catch(function () { toast('PiP indisponible'); });
  }

  function sync() {
    if (!ov || !video) return;
    var r = $('input[type=range]');
    if (!r.dragging) r.value = isFinite(video.duration) ? (video.currentTime / video.duration) * 1000 : 0;
    $('.cur').textContent = fmt(video.currentTime);
    $('.dur').textContent = fmt(video.duration);
    $('[data-a=play]').innerHTML = H(svg(video.paused ? I.play : I.pause));
    $('[data-a=mute]').innerHTML = H(svg(video.muted || video.volume === 0 ? I.mute : I.vol));
  }

  var EVENTS = ['timeupdate', 'play', 'pause', 'durationchange', 'volumechange', 'ratechange', 'loadedmetadata'];

  VA.find = findVideo;
  VA.open = function (v, quiet) {
    v = v || findVideo();
    if (!v) { if (!quiet) alert('Aucune vidéo trouvée sur cette page.'); return; }
    if (ov) return;
    ensureHost();
    video = v;
    var wasPlaying = !v.paused;
    saved = { style: v.getAttribute('style'), controls: v.controls };

    // On déplace la vraie <video> dans notre calque : aucun CSS ou z-index du site ne peut plus la cacher.
    placeholder = document.createComment('va-placeholder');
    v.parentNode.insertBefore(placeholder, v);

    ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = H(
      '<div class="ui">' +
        '<div class="top"><div class="title"></div>' +
        '<button data-a="close" title="Fermer (Échap)">' + svg(I.close) + '</button></div>' +
        '<div class="mid"><button class="skip" data-a="back">−10</button>' +
        '<button class="big" data-a="play"></button>' +
        '<button class="skip" data-a="fwd">+10</button></div>' +
        '<div class="bot"><div class="row"><span class="t cur"></span>' +
        '<input type="range" min="0" max="1000" step="1" value="0">' +
        '<span class="t dur"></span></div>' +
        '<div class="row tools">' +
        '<button data-a="mute" title="Muet (M)"></button>' +
        '<button data-a="speed" title="Vitesse">' + v.playbackRate + '×</button>' +
        '<button data-a="fit" title="Format">⤢ Format</button>' +
        '<button data-a="rot" title="Rotation">' + svg(I.rot) + '</button>' +
        '<button data-a="pip" title="Image dans l\'image">' + svg(I.pip) + '</button>' +
        '<button data-a="fs" title="Plein écran (F)">' + svg(I.full) + '</button>' +
        '</div></div></div><div class="toast"></div>'
    );
    $('.title').textContent = document.title;
    ov.insertBefore(v, ov.firstChild);
    v.controls = false;
    v.style.removeProperty('filter');
    bright = 1; fitIdx = 0;
    root.appendChild(ov);
    if (wasPlaying && v.paused) v.play().catch(function () {});

    EVENTS.forEach(function (e) { v.addEventListener(e, sync); });
    bindUI();
    sync();
    showUI();
    toggleFS();
    document.addEventListener('keydown', onKey, true);
    // Le bouton "Retour" (télécommande, manette, Android) ferme le lecteur au lieu de quitter la page.
    try { history.pushState({ va: 1 }, ''); ownHistory = true; window.addEventListener('popstate', onPop); } catch (e) {}
    VA.updateFab && VA.updateFab();
  };

  function onPop() { ownHistory = false; VA.close(); }

  VA.close = function () {
    if (!ov) return;
    var v = video, wasPlaying = !v.paused;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('popstate', onPop);
    EVENTS.forEach(function (e) { v.removeEventListener(e, sync); });
    if (fsEl() === host) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    try { screen.orientation.unlock(); } catch (e) {}
    if (placeholder && placeholder.parentNode) { placeholder.parentNode.insertBefore(v, placeholder); placeholder.remove(); }
    if (saved.style == null) v.removeAttribute('style'); else v.setAttribute('style', saved.style);
    v.controls = saved.controls;
    if (wasPlaying && v.paused) v.play().catch(function () {});
    ov.remove();
    ov = null; video = null; placeholder = null;
    clearTimeout(hideT);
    if (ownHistory) { ownHistory = false; history.back(); }
    VA.updateFab && VA.updateFab();
  };

  function bindUI() {
    var acts = {
      close: VA.close, play: togglePlay, back: function () { seek(-10); }, fwd: function () { seek(10); },
      mute: function () { video.muted = !video.muted; }, speed: cycleSpeed, fit: cycleFit, rot: rotate, pip: pip, fs: toggleFS
    };
    ov.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (b && acts[b.dataset.a]) { e.stopPropagation(); acts[b.dataset.a](); showUI(); }
    });
    var r = $('input[type=range]');
    r.addEventListener('input', function () {
      r.dragging = true;
      if (isFinite(video.duration)) { video.currentTime = (r.value / 1000) * video.duration; $('.cur').textContent = fmt(video.currentTime); }
      showUI();
    });
    r.addEventListener('change', function () { r.dragging = false; });
    ov.addEventListener('mousemove', showUI);

    // Gestes : tap = afficher/masquer, double-tap gauche/droite = ±10 s,
    // glisser horizontal = avancer/reculer, vertical à gauche = luminosité, à droite = volume.
    var st = null, lastTap = 0;
    var surf = ov;
    surf.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('button,input')) return;
      st = { x: e.clientX, y: e.clientY, t: video.currentTime, vol: video.volume, br: bright, mode: null };
    });
    surf.addEventListener('pointermove', function (e) {
      if (!st) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y, W = ov.clientWidth, Hh = ov.clientHeight;
      if (!st.mode && Math.hypot(dx, dy) > 24) st.mode = Math.abs(dx) > Math.abs(dy) ? 'seek' : (st.x < W / 2 ? 'bright' : 'vol');
      if (st.mode === 'seek') {
        st.delta = Math.round((dx / W) * Math.min(600, (video.duration || 600) / 2));
        toast((st.delta >= 0 ? '+' : '−') + Math.abs(st.delta) + ' s  →  ' + fmt(st.t + st.delta));
      } else if (st.mode === 'vol') setVol(st.vol - dy / (Hh * 0.6));
      else if (st.mode === 'bright') setBright(st.br - dy / (Hh * 0.6));
    });
    surf.addEventListener('pointerup', function (e) {
      if (!st) return;
      var s = st; st = null;
      if (s.mode === 'seek') { video.currentTime = Math.max(0, s.t + (s.delta || 0)); return; }
      if (s.mode) return;
      var now = Date.now(), W = ov.clientWidth;
      if (now - lastTap < 300) {
        lastTap = 0;
        if (e.clientX < W / 3) seek(-10); else if (e.clientX > (2 * W) / 3) seek(10); else toggleFS();
      } else {
        lastTap = now;
        setTimeout(function () {
          if (lastTap === now && ov) { if (ov.classList.contains('hide')) showUI(); else ov.classList.add('hide'); }
        }, 300);
      }
    });
    surf.addEventListener('pointercancel', function () { st = null; });
  }

  // Clavier / télécommande / manette.
  function onKey(e) {
    if (!ov) return;
    var k = e.key, focusedBtn = root.activeElement && root.activeElement.tagName === 'BUTTON';
    var handled = true;
    if (k === 'Escape' || k === 'GoBack' || k === 'BrowserBack') VA.close();
    else if (k === ' ' || k === 'k' || k === 'MediaPlayPause') togglePlay();
    else if (k === 'Enter') { if (focusedBtn) root.activeElement.click(); else togglePlay(); }
    else if ((k === 'ArrowLeft' || k === 'j' || k === 'MediaRewind') && !focusedBtn) seek(k === 'j' ? -10 : -5);
    else if ((k === 'ArrowRight' || k === 'l' || k === 'MediaFastForward') && !focusedBtn) seek(k === 'l' ? 10 : 5);
    else if (k === 'ArrowUp' && !focusedBtn) setVol(video.volume + 0.1);
    else if (k === 'ArrowDown' && !focusedBtn) setVol(video.volume - 0.1);
    else if (k === 'f') toggleFS();
    else if (k === 'm') video.muted = !video.muted;
    else if (k === '>' || k === '<') { cycleSpeed(); }
    else if (k === 'Tab') handled = false;
    else handled = false;
    if (handled) { e.preventDefault(); e.stopPropagation(); }
    showUI();
  }

  // Bouton flottant bleu (mode extension / userscript), comme Samsung Internet.
  VA.installButton = function () {
    ensureHost();
    var fab = document.createElement('button');
    fab.className = 'fab';
    fab.title = 'Ouvrir dans le lecteur vidéo';
    fab.innerHTML = H(svg(I.expand));
    fab.addEventListener('click', function () { VA.open(); });
    root.appendChild(fab);
    VA.updateFab = function () {
      if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
      var v = !ov && findVideo();
      var ok = v && (!v.paused || v.currentTime > 0) && v.getBoundingClientRect().width >= 200;
      fab.classList.toggle('on', !!ok);
    };
    setInterval(VA.updateFab, 1000);
    VA.updateFab();
  };
})();

window.__VA.installButton();
