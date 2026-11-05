/* Zero-Call 발표용 웹사이트 — 차트, 등장 효과, 키보드 발표 내비게이션, 5분 타이머 */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var tip = document.querySelector('.tip');

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  /* 위쪽 모서리만 4px 둥근 막대 (바닥은 직각) */
  function barPath(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
      'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
  }

  /* ---------- 툴팁 ---------- */
  function bindTip(node, html) {
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'img');
    function show(e) {
      tip.innerHTML = html;
      tip.hidden = false;
      var r = node.getBoundingClientRect();
      var x = e && e.clientX != null ? e.clientX : r.left + r.width / 2;
      var y = e && e.clientY != null ? e.clientY : r.top;
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.min(Math.max(8, x + 14), window.innerWidth - tw - 8);
      var top = y - th - 12 < 8 ? y + 18 : y - th - 12;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    }
    function hide() { tip.hidden = true; }
    node.addEventListener('mousemove', show);
    node.addEventListener('mouseleave', hide);
    node.addEventListener('focus', function () { show(); });
    node.addEventListener('blur', hide);
    node.addEventListener('click', function (e) { show(e); });
  }
  document.addEventListener('scroll', function () { if (tip) tip.hidden = true; }, { passive: true });

  /* ---------- 에너지 절감: 묶은 막대 차트 ---------- */
  var energy = [
    { k: '조명', b: 45, a: 30, p: '−33%' },
    { k: '냉난방', b: 150, a: 120, p: '−20%' },
    { k: '대기전력', b: 30, a: 9, p: '−70%' },
    { k: '가전·기타', b: 115, a: 105, p: '−9%' }
  ];
  (function () {
    var host = document.getElementById('bar-chart');
    if (!host) return;
    var W = 270, H = 190, L = 28, R = 4, T = 22, B = 26;
    var pw = W - L - R, ph = H - T - B, max = 165;
    var y = function (v) { return T + ph - (v / max) * ph; };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    [0, 50, 100, 150].forEach(function (v) {
      el('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }, svg);
      txt(svg, L - 6, y(v) + 4, v, { class: 'axis-num', 'text-anchor': 'end', 'font-size': 11 });
    });
    var band = pw / energy.length, bw = 20, gap = 2;
    energy.forEach(function (d) {
      var i = energy.indexOf(d);
      var cx = L + band * i + band / 2;
      var g = el('g', { class: 'grp' }, svg);
      var xb = cx - gap / 2 - bw, xa = cx + gap / 2;
      el('path', { class: 'bar', d: barPath(xb, y(d.b), bw, y(0) - y(d.b), 4), fill: '#9fa4a8' }, g);
      el('path', { class: 'bar', d: barPath(xa, y(d.a), bw, y(0) - y(d.a), 4), fill: '#007e80' }, g);
      txt(g, cx, y(d.b) - 6, d.p, { class: 'val', 'text-anchor': 'middle', 'font-size': 12.5 });
      txt(g, cx, H - 8, d.k, { class: 'cat', 'text-anchor': 'middle', 'font-size': 12.5 });
      var hit = el('rect', { class: 'hit', x: L + band * i, y: T - 18, width: band, height: ph + 18 + B }, g);
      g.appendChild(hit);
      bindTip(g, '<b>' + d.k + ' ' + d.p + '</b>' +
        '<i style="background:var(--before)"></i>도입 전 ' + d.b + ' kWh<br>' +
        '<i style="background:var(--after)"></i>도입 후 ' + d.a + ' kWh');
      g.setAttribute('aria-label', d.k + ': 도입 전 ' + d.b + ' kWh, 도입 후 ' + d.a + ' kWh, ' + d.p);
    });
    el('line', { class: 'grid', x1: L, x2: W - R, y1: y(0), y2: y(0), stroke: '#b9c4c2' }, svg);
    host.appendChild(svg);
    host.classList.add('anim');
  })();

  /* ---------- 안전사고 예방: 덤벨(점) 차트 ---------- */
  var safety = [
    { k: '가스 누출', b: 30, a: 1 },
    { k: '화재(연기)', b: 15, a: 1 },
    { k: '누수', b: 180, a: 2 },
    { k: '침입', b: 60, a: 1 },
    { k: '가전 켜둠', b: 240, a: 5 }
  ];
  (function () {
    var host = document.getElementById('dot-chart');
    if (!host) return;
    var W = 270, H = 190, L = 62, R = 76, T = 8, B = 24;
    var pw = W - L - R, ph = H - T - B, max = 250;
    var x = function (v) { return L + (v / max) * pw; };
    var rowH = ph / safety.length;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    [0, 100, 200].forEach(function (v) {
      el('line', { class: 'grid', x1: x(v), x2: x(v), y1: T, y2: T + ph }, svg);
      txt(svg, x(v), H - 8, v, { class: 'axis-num', 'text-anchor': 'middle', 'font-size': 11 });
    });
    safety.forEach(function (d, i) {
      var cy = T + rowH * i + rowH / 2;
      var g = el('g', { class: 'row' }, svg);
      txt(g, L - 8, cy + 4, d.k, { class: 'cat', 'text-anchor': 'end', 'font-size': 12.5 });
      el('line', { class: 'link', x1: x(d.a), x2: x(d.b), y1: cy, y2: cy, stroke: '#b9c4c2', 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
      el('circle', { class: 'dot dot--before', cx: x(d.b), cy: cy, r: 5, fill: '#9fa4a8', stroke: '#ecf5f3', 'stroke-width': 2 }, g);
      el('circle', { class: 'dot dot--after', cx: x(d.a), cy: cy, r: 5, fill: '#007e80', stroke: '#ecf5f3', 'stroke-width': 2 }, g);
      txt(g, W - 4, cy + 4, d.b + ' → ' + d.a + '분', { class: 'cat', 'text-anchor': 'end', 'font-size': 12.5 });
      var hit = el('rect', { class: 'hit', x: 0, y: cy - rowH / 2, width: W, height: rowH }, g);
      g.appendChild(hit);
      bindTip(g, '<b>' + d.k + '</b>' +
        '<i style="background:var(--before)"></i>도입 전 ' + d.b + '분<br>' +
        '<i style="background:var(--after)"></i>도입 후 ' + d.a + '분');
      g.setAttribute('aria-label', d.k + ': 감지 시간 ' + d.b + '분에서 ' + d.a + '분으로');
    });
    host.appendChild(svg);
    host.classList.add('anim');
  })();

  /* ---------- 등장 효과 & 숫자 카운트업 ---------- */
  var revealTargets = document.querySelectorAll(
    '.sec__title, .intro__q, .intro__body, .day__labels, .scene, .day__tagline, .how, .effect__lead, .card, .foot .wrap'
  );
  function countUp(node) {
    var to = +node.getAttribute('data-count');
    if (reduce) { node.textContent = '−' + to; return; }
    var t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = '−' + Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduce) {
    revealTargets.forEach(function (n) { n.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target;
        n.classList.add('in');
        if (n.classList.contains('card')) {
          var c = n.querySelector('[data-count]'); if (c) countUp(c);
          var ch = n.querySelector('.chart'); if (ch) ch.classList.add('in');
        }
        io.unobserve(n);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach(function (n) { io.observe(n); });
  } else {
    document.querySelectorAll('.chart').forEach(function (c) { c.classList.add('in'); });
  }

  /* ---------- 발표 내비게이션 ---------- */
  var stops = Array.prototype.slice.call(document.querySelectorAll('.stop'));
  var count = document.querySelector('.pager__count');
  var bar = document.querySelector('.progress span');
  var cur = 0, navLock = null;

  function currentIndex() {
    var line = window.innerHeight * 0.4, idx = 0;
    stops.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) idx = stops.length - 1;
    return idx;
  }
  function render() {
    count.textContent = (cur + 1) + ' / ' + stops.length;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  function setActiveRow(target) {
    var isRow = target && target.classList.contains('day__row');
    document.body.classList.toggle('presenting', !!isRow);
    document.querySelectorAll('.day__row.is-active').forEach(function (r) { r.classList.remove('is-active'); });
    if (isRow) {
      target.classList.add('is-active');
      target.querySelectorAll('.scene').forEach(function (s) { s.classList.add('in'); });
    }
  }
  function go(i) {
    cur = Math.max(0, Math.min(stops.length - 1, i));
    var s = stops[cur];
    var isRow = s.classList.contains('day__row');
    s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: isRow ? 'center' : 'start' });
    setActiveRow(s);
    clearTimeout(navLock);
    navLock = setTimeout(function () { navLock = null; }, 900);
    render();
  }
  window.addEventListener('scroll', function () {
    if (!navLock) cur = currentIndex();
    render();
  }, { passive: true });
  ['wheel', 'touchmove'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!navLock) setActiveRow(null); }, { passive: true });
  });

  document.querySelectorAll('.pager__btn[data-dir]').forEach(function (b) {
    b.addEventListener('click', function () { go(cur + (+b.getAttribute('data-dir'))); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey && tag !== 'button')) {
      e.preventDefault(); go(cur + 1);
    } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey && tag !== 'button')) {
      e.preventDefault(); go(cur - 1);
    } else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(stops.length - 1); }
    else if (k === 'f' || k === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      else document.exitFullscreen && document.exitFullscreen();
    } else if (k === 't' || k === 'T') { toggleTimer(); }
    else if (k === 'r' || k === 'R') { resetTimer(); }
  });

  /* ---------- 5분 발표 타이머 ---------- */
  var timerBtn = document.querySelector('.pager__timer');
  var LIMIT = 5 * 60, elapsed = 0, startAt = null, tick = null;
  function fmt(sec) {
    var s = Math.abs(Math.round(sec));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function drawTimer() {
    var used = elapsed + (startAt ? (Date.now() - startAt) / 1000 : 0);
    var left = LIMIT - used;
    timerBtn.textContent = left >= 0 ? fmt(left) : '+' + fmt(-left);
    timerBtn.classList.toggle('over', left < 0);
  }
  function toggleTimer() {
    if (startAt) { elapsed += (Date.now() - startAt) / 1000; startAt = null; clearInterval(tick); }
    else { startAt = Date.now(); tick = setInterval(drawTimer, 250); }
    timerBtn.classList.toggle('running', !!startAt);
    drawTimer();
  }
  function resetTimer() {
    clearInterval(tick); startAt = null; elapsed = 0;
    timerBtn.classList.remove('running');
    drawTimer();
  }
  timerBtn.addEventListener('click', toggleTimer);
  timerBtn.addEventListener('dblclick', resetTimer);

  cur = currentIndex();
  render();
})();
