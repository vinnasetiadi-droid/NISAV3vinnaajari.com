import type { AnagramData } from "./types";

/**
 * Self-contained "Word Builder" anagram game (colorful tiles, hint/clear/skip/check,
 * score + streak + timer, completion screen) — mirrors the NISA mock screenshots.
 */
export function wordBuilderHTML(data: AnagramData): string {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(data.title)}</title>
<style>
  * { box-sizing:border-box; user-select:none; }
  body { margin:0; min-height:100vh; font-family:ui-monospace,'SF Mono',Menlo,Consolas,monospace;
         background:linear-gradient(135deg,#fde68a 0%,#bbf7d0 45%,#a5f3fc 100%);
         display:flex; flex-direction:column; }
  .top { display:flex; align-items:center; gap:10px; padding:18px 22px; }
  .badge { background:#312e81; color:#fff; font-size:11px; font-weight:800; border-radius:8px; padding:6px 7px; }
  .title { font-size:21px; font-weight:800; color:#1e293b; letter-spacing:-.3px; }
  .sp { flex:1; }
  .pill { background:rgba(255,255,255,.92); border-radius:999px; padding:8px 16px; font-weight:800;
          font-size:15px; color:#334155; box-shadow:0 4px 14px rgba(15,23,42,.12); }
  .stage { flex:1; display:flex; align-items:center; justify-content:center; padding:20px; }
  .card { background:#fff; border-radius:22px; box-shadow:0 24px 60px rgba(15,23,42,.18);
          padding:26px 30px 30px; width:min(620px,94vw); animation:pop .35s ease-out both; }
  @keyframes pop { from { opacity:0; transform:scale(.94) translateY(10px); } to { opacity:1; transform:none; } }
  .row1 { display:flex; align-items:center; gap:12px; margin-bottom:22px; }
  .lvl { font-size:11px; font-weight:800; color:#fff; border-radius:999px; padding:6px 12px; letter-spacing:.6px; }
  .lvl.EASY { background:#22c55e; } .lvl.MEDIUM { background:#f59e0b; } .lvl.HARD { background:#ef4444; }
  .cat { color:#64748b; font-weight:700; font-size:14px; }
  .timer { margin-left:auto; color:#475569; font-weight:800; font-size:15px; }
  .slots, .tiles { display:flex; gap:9px; justify-content:center; flex-wrap:wrap; }
  .slots { margin-bottom:26px; min-height:56px; }
  .slot { width:52px; height:56px; border:2.5px dashed #cbd5e1; border-radius:12px; background:#f8fafc;
          display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:#1e293b;
          cursor:pointer; transition:all .12s; }
  .slot.filled { border-style:solid; border-color:#818cf8; background:#eef2ff; }
  .tiles { margin-bottom:26px; min-height:60px; }
  .tile { width:52px; height:56px; border-radius:12px; color:#fff; font-size:24px; font-weight:800;
          display:flex; align-items:center; justify-content:center; cursor:pointer;
          box-shadow:0 5px 0 rgba(0,0,0,.22); transition:transform .1s, opacity .15s; }
  .tile:active { transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.22); }
  .tile.used { opacity:0; pointer-events:none; transform:scale(.6); }
  .btns { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:16px; }
  .btn { border:none; font:inherit; font-weight:800; font-size:14.5px; border-radius:14px; padding:12px 20px;
         cursor:pointer; box-shadow:0 5px 0 rgba(0,0,0,.16); transition:transform .1s; color:#334155; background:#e2e8f0; }
  .btn:active { transform:translateY(3px); box-shadow:0 2px 0 rgba(0,0,0,.16); }
  .btn.hint { background:#fbbf24; color:#78350f; }
  .btn.check { background:#22c55e; color:#fff; }
  .foot { text-align:center; font-weight:800; color:#334155; font-size:15px; min-height:22px; }
  .shake { animation:shake .4s; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  .flash { animation:flash .5s; }
  @keyframes flash { 0%{background:#dcfce7} 100%{background:#fff} }
  .done { text-align:center; padding:34px 26px; }
  .done h2 { font-size:30px; margin:0 0 18px; color:#1e293b; }
  .score-big { font-size:64px; font-weight:800; color:#6366f1; margin-bottom:14px; }
  .done p { font-weight:800; color:#475569; margin:0 0 24px; }
  .again { background:#22c55e; color:#fff; border:none; font:inherit; font-weight:800; font-size:16px;
           border-radius:14px; padding:14px 26px; cursor:pointer; box-shadow:0 6px 0 rgba(0,0,0,.16); }
  .again:active { transform:translateY(3px); }
  .popup { position:fixed; left:50%; top:26%; transform:translateX(-50%); font-size:30px; font-weight:800;
           color:#16a34a; pointer-events:none; opacity:0; }
  .popup.show { animation:rise 1s ease-out; }
  @keyframes rise { 0%{opacity:0; transform:translate(-50%,10px)} 25%{opacity:1} 100%{opacity:0; transform:translate(-50%,-40px)} }
</style>
</head>
<body>
  <div class="top">
    <span class="badge">abc</span>
    <span class="title">${esc(data.title)}</span>
    <span class="sp"></span>
    <span class="pill">⭐ <span id="score">0</span></span>
    <span class="pill">🔥 <span id="streak">0</span></span>
    <span class="pill"><span id="idx">1</span> / <span id="total">10</span></span>
  </div>
  <div class="stage"><div class="card" id="card"></div></div>
  <div class="popup" id="popup"></div>

<script>
  var DATA = ${json};
  var COLORS = ['#6366f1','#ec4899','#f59e0b','#22c55e','#14b8a6','#a855f7','#ef4444','#3b82f6'];
  var BASE = { EASY: 60, MEDIUM: 100, HARD: 140 };
  var state;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function reset() {
    state = { i: 0, score: 0, streak: 0, hints: 3, t0: Date.now(), timer: null, slots: [], used: [], letters: [] };
    document.getElementById('total').textContent = DATA.words.length;
    loadWord();
  }

  function cur() { return DATA.words[state.i]; }

  function loadWord() {
    var w = cur();
    state.slots = new Array(w.word.length).fill(null); // indices into letters
    state.letters = shuffle(w.word.toUpperCase().split(''));
    state.used = new Array(state.letters.length).fill(false);
    state.t0 = Date.now();
    render();
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () {
      var el = document.getElementById('sec');
      if (el) el.textContent = Math.floor((Date.now() - state.t0) / 1000) + 's';
    }, 500);
  }

  function render() {
    var w = cur();
    document.getElementById('score').textContent = state.score;
    document.getElementById('streak').textContent = state.streak;
    document.getElementById('idx').textContent = state.i + 1;
    var h = '';
    h += '<div class="row1"><span class="lvl ' + w.level + '">' + w.level + '</span>';
    h += '<span class="cat">' + w.category + '</span>';
    h += '<span class="timer"><span id="sec">0s</span></span></div>';
    h += '<div class="slots" id="slots"></div>';
    h += '<div class="tiles" id="tiles"></div>';
    h += '<div class="btns">';
    h += '<button class="btn hint" id="bHint">💡 Hint (' + state.hints + ')</button>';
    h += '<button class="btn" id="bClear">↺ Clear</button>';
    h += '<button class="btn" id="bSkip">Skip ⏭</button>';
    h += '<button class="btn check" id="bCheck">Check ✓</button>';
    h += '</div>';
    h += '<div class="foot" id="foot">Unscramble the word! 🧩</div>';
    var card = document.getElementById('card');
    card.innerHTML = h;
    card.classList.remove('shake');

    var slots = document.getElementById('slots');
    state.slots.forEach(function (li, si) {
      var d = document.createElement('div');
      d.className = 'slot' + (li != null ? ' filled' : '');
      d.textContent = li != null ? state.letters[li] : '';
      d.onclick = function () { if (state.slots[si] != null) { state.used[state.slots[si]] = false; state.slots[si] = null; render(); } };
      slots.appendChild(d);
    });
    var tiles = document.getElementById('tiles');
    state.letters.forEach(function (L, ti) {
      var d = document.createElement('div');
      d.className = 'tile' + (state.used[ti] ? ' used' : '');
      d.style.background = COLORS[ti % COLORS.length];
      d.textContent = L;
      d.onclick = function () { place(ti); };
      tiles.appendChild(d);
    });
    document.getElementById('bHint').onclick = hint;
    document.getElementById('bClear').onclick = function () { state.slots = state.slots.map(function(){return null;}); state.used = state.used.map(function(){return false;}); render(); };
    document.getElementById('bSkip').onclick = function () { state.streak = 0; next(); };
    document.getElementById('bCheck').onclick = check;
  }

  function place(ti) {
    if (state.used[ti]) return;
    var si = state.slots.indexOf(null);
    if (si === -1) return;
    state.slots[si] = ti; state.used[ti] = true; render();
  }

  function hint() {
    if (state.hints <= 0) return;
    var w = cur().word.toUpperCase();
    for (var si = 0; si < w.length; si++) {
      var li = state.slots[si];
      if (li != null && state.letters[li] === w[si]) continue;
      if (li != null) { state.used[li] = false; state.slots[si] = null; }
      for (var ti = 0; ti < state.letters.length; ti++) {
        if (!state.used[ti] && state.letters[ti] === w[si]) { state.slots[si] = ti; state.used[ti] = true; break; }
      }
      break;
    }
    state.hints--; state.score = Math.max(0, state.score - 15);
    document.getElementById('foot').textContent = '💡 ' + cur().hint;
    var f = document.getElementById('foot');
    render();
    document.getElementById('foot').textContent = '💡 ' + cur().hint;
  }

  function check() {
    var w = cur().word.toUpperCase();
    var guess = state.slots.map(function (li) { return li == null ? ' ' : state.letters[li]; }).join('');
    if (guess === w) {
      var secs = Math.floor((Date.now() - state.t0) / 1000);
      var gained = BASE[cur().level] + state.streak * 10 + Math.max(0, 25 - secs);
      state.score += gained; state.streak++;
      var p = document.getElementById('popup');
      p.textContent = '+' + gained; p.classList.remove('show'); void p.offsetWidth; p.classList.add('show');
      document.getElementById('card').classList.add('flash');
      setTimeout(next, 550);
    } else {
      state.streak = 0;
      var c = document.getElementById('card');
      c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      document.getElementById('foot').textContent = 'Belum tepat — coba lagi! 🙈';
      document.getElementById('streak').textContent = '0';
    }
  }

  function next() {
    if (state.i + 1 >= DATA.words.length) { finish(); return; }
    state.i++; loadWord();
  }

  function finish() {
    if (state.timer) clearInterval(state.timer);
    document.getElementById('idx').textContent = DATA.words.length;
    var h = '<div class="done">';
    h += '<h2>🎉 You did it!</h2>';
    h += '<div class="score-big">' + state.score + '</div>';
    h += '<p>You solved all the words! ⭐</p>';
    h += '<button class="again" id="bAgain">Play again 🔁</button>';
    h += '</div>';
    document.getElementById('card').innerHTML = h;
    document.getElementById('bAgain').onclick = reset;
  }

  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('bCheck')) return;
    if (e.key === 'Enter') { check(); return; }
    if (e.key === 'Backspace') {
      for (var si = state.slots.length - 1; si >= 0; si--) {
        if (state.slots[si] != null) { state.used[state.slots[si]] = false; state.slots[si] = null; render(); break; }
      }
      return;
    }
    var k = e.key.toUpperCase();
    if (k.length === 1 && k >= 'A' && k <= 'Z') {
      for (var ti = 0; ti < state.letters.length; ti++) {
        if (!state.used[ti] && state.letters[ti] === k) { place(ti); break; }
      }
    }
  });

  reset();
</script>
</body>
</html>`;
}

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
