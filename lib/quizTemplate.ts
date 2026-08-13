import type { QuizData } from "./types";

/**
 * Render a self-contained, printable quiz HTML document
 * (Student / Answer key toggle + print buttons, like the NISA mock).
 */
export function quizHTML(data: QuizData): string {
  const total = data.questions.reduce((n, q) => n + q.points, 0);
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(data.title)}</title>
<style>
  @font-face { font-family:'General Sans'; src:url('/fonts/GeneralSans-Semibold.otf') format('opentype'); font-weight:600; font-display:swap; }
  :root { --ink:#1e293b; --line:#e2e8f0; --brand:#0d9488; --deep:#115e59; --accent:#9a3412; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; color:var(--ink);
         background:linear-gradient(160deg,#f0fdfa 0%,#eef2ff 100%); padding:20px; }
  .toolbar { max-width:820px; margin:0 auto 16px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .toolbar .sp { flex:1; }
  button { font:inherit; cursor:pointer; border-radius:10px; padding:8px 14px; border:1px solid var(--line);
           background:rgba(255,255,255,.8); backdrop-filter:blur(8px); font-weight:600; font-size:13px; }
  button.primary { background:var(--brand); border-color:var(--brand); color:#fff; }
  button.deep { background:var(--deep); border-color:var(--deep); color:#fff; }
  button.on { background:var(--brand); border-color:var(--brand); color:#fff; }
  .chip { border:1px solid var(--line); background:rgba(255,255,255,.7); border-radius:999px;
          padding:7px 14px; font-size:12.5px; font-weight:600; color:#475569; cursor:pointer; }
  .chip.on { background:#fef3c7; border-color:#fcd34d; color:#92400e; }
  .paper { max-width:820px; margin:0 auto; background:#fff; border-radius:14px;
           box-shadow:0 10px 40px rgba(15,23,42,.12); padding:44px 48px; }
  h1 { font-family:'General Sans',system-ui,sans-serif; font-weight:600; letter-spacing:-0.02em; font-size:27px; margin:0 0 6px; color:#0f172a; }
  .meta { color:#64748b; font-size:13.5px; margin-bottom:18px; }
  .idrow { display:flex; gap:28px; font-size:14px; padding:14px 0; border-top:1px solid var(--line);
           border-bottom:1px solid var(--line); margin-bottom:18px; flex-wrap:wrap; }
  .idrow b { font-weight:600; }
  .blank { display:inline-block; min-width:150px; border-bottom:1.5px solid #94a3b8; height:16px; }
  .instr { background:#f1f5f9; border-radius:10px; padding:14px 18px; font-size:14px; margin-bottom:26px; }
  .classroom .instr { background:#fef9c3; }
  .q { display:flex; gap:10px; margin-bottom:26px; page-break-inside:avoid; }
  .qn { font-weight:700; }
  .qbody { flex:1; }
  .qp { font-size:14.5px; line-height:1.55; margin-bottom:10px; }
  .pts { color:#94a3b8; font-size:12px; white-space:nowrap; padding-top:2px; }
  .opt { display:flex; gap:8px; font-size:14px; padding:3.5px 8px; margin-left:2px; border-radius:8px; align-items:baseline; }
  .opt .L { font-weight:700; color:var(--accent); }
  .key .opt.correct { background:#dcfce7; font-weight:600; }
  .key .opt.correct:after { content:'✓'; color:#16a34a; font-weight:800; margin-left:auto; }
  .tf { display:flex; gap:26px; font-size:14px; margin-left:2px; }
  .tf span { display:flex; align-items:center; gap:7px; }
  .o { width:15px; height:15px; border:1.6px solid #94a3b8; border-radius:50%; display:inline-block; }
  .key .tf .correct .o { background:#16a34a; border-color:#16a34a; }
  .key .tf .correct { font-weight:700; color:#15803d; }
  .fill-line { border-bottom:1.5px solid #94a3b8; height:26px; margin:12px 0 4px; }
  .essay-line { border-bottom:1px solid var(--line); height:30px; }
  .ans { display:none; margin-top:8px; font-size:13.5px; color:#15803d; font-style:italic; }
  .expl { display:none; margin-top:4px; font-size:12.5px; color:#64748b; }
  .key .ans, .key .expl { display:block; }
  .classroom .paper { background:#fffdf5; }
  .classroom h1 { color:#7c2d12; }
  .footer { margin-top:34px; padding-top:14px; border-top:1px dashed var(--line); color:#94a3b8;
            font-size:12px; display:flex; justify-content:space-between; }
  @media print {
    body { background:#fff; padding:0; }
    .toolbar { display:none; }
    .paper { box-shadow:none; border-radius:0; padding:24px 8px; max-width:none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button id="bStudent" class="on">🧑‍🎓 Student</button>
    <button id="bKey">🔑 Answer key</button>
    <span class="sp"></span>
    <span class="chip" id="bTheme">Classroom theme</span>
    <button class="primary" id="bPrintS">🖨 Print student</button>
    <button class="deep" id="bPrintK">🖨 Print answer key</button>
  </div>

  <div class="paper" id="paper">
    <h1>${esc(data.title)}</h1>
    <div class="meta">${esc(data.subject)} · ${esc(data.grade)} · ${total} points · ${data.minutes} min</div>
    <div class="idrow">
      <span><b>Name:</b> <span class="blank"></span></span>
      <span><b>Date:</b> <span class="blank" style="min-width:110px"></span></span>
      <span><b>Score:</b> <span class="blank" style="min-width:60px"></span> / ${total}</span>
    </div>
    <div class="instr">${esc(
      data.instructions ||
        `Read each question carefully. You have ${data.minutes} minutes to complete this quiz. Work honestly and carefully!`
    )}</div>
    <div id="qs"></div>
    <div class="footer"><span>${esc(data.title)}</span><span>Made with NISA · Neural Interactive Systematic Assistant</span></div>
  </div>

<script>
  var DATA = ${json};
  var LETTERS = ['A','B','C','D','E','F'];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc2(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  var qs = document.getElementById('qs');
  DATA.questions.forEach(function (q, i) {
    var row = el('div', 'q');
    row.appendChild(el('div', 'qn', (i + 1) + '.'));
    var body = el('div', 'qbody');
    body.appendChild(el('div', 'qp', esc2(q.prompt)));
    if (q.type === 'mc' && q.options) {
      q.options.forEach(function (o, j) {
        var correct = q.answer != null && (o === q.answer || LETTERS[j] === String(q.answer).toUpperCase());
        var opt = el('div', 'opt' + (correct ? ' correct' : ''));
        opt.appendChild(el('span', 'L', LETTERS[j] + '.'));
        opt.appendChild(el('span', null, esc2(o)));
        body.appendChild(opt);
      });
    } else if (q.type === 'tf') {
      var t = el('div', 'tf');
      var isTrue = /^(true|benar)$/i.test(String(q.answer || ''));
      t.appendChild(el('span', isTrue ? 'correct' : '', '<span class="o"></span> True'));
      t.appendChild(el('span', !isTrue ? 'correct' : '', '<span class="o"></span> False'));
      body.appendChild(t);
    } else if (q.type === 'fill') {
      body.appendChild(el('div', 'fill-line'));
      body.appendChild(el('div', 'ans', 'Answer: ' + esc2(q.answer || '')));
    } else {
      for (var k = 0; k < 3; k++) body.appendChild(el('div', 'essay-line'));
      if (q.answer) body.appendChild(el('div', 'ans', 'Sample answer: ' + esc2(q.answer)));
    }
    if (q.type === 'mc' || q.type === 'tf') {
      var a2 = el('div', 'ans', 'Answer: ' + esc2(q.answer || ''));
      body.appendChild(a2);
    }
    if (q.explanation) body.appendChild(el('div', 'expl', '💡 ' + esc2(q.explanation)));
    row.appendChild(body);
    row.appendChild(el('div', 'pts', q.points + (q.points > 1 ? ' pts' : ' pt')));
    qs.appendChild(row);
  });

  var bS = document.getElementById('bStudent'), bK = document.getElementById('bKey');
  function setMode(key) {
    document.body.classList.toggle('key', key);
    bS.classList.toggle('on', !key);
    bK.classList.toggle('on', key);
  }
  bS.onclick = function () { setMode(false); };
  bK.onclick = function () { setMode(true); };
  document.getElementById('bTheme').onclick = function () {
    document.body.classList.toggle('classroom');
    this.classList.toggle('on');
  };
  document.getElementById('bPrintS').onclick = function () { setMode(false); setTimeout(function(){window.print();}, 60); };
  document.getElementById('bPrintK').onclick = function () { setMode(true); setTimeout(function(){window.print();}, 60); };
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
