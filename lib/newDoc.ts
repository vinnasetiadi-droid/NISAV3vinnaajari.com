export function newDocHTML(title = "New Document") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @font-face { font-family: 'General Sans'; src: url('/fonts/GeneralSans-Semibold.otf') format('opentype'); font-weight: 600; font-display: swap; }
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 760px; margin: 48px auto;
         padding: 0 28px; color: #1e293b; line-height: 1.75; background: #fff; }
  h1 { font-family: 'General Sans', system-ui, sans-serif; font-weight: 600; letter-spacing: -0.02em;
       font-size: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; color: #0f172a; }
  [contenteditable]:focus { outline: none; }
  .hint { color: #94a3b8; font-style: italic; font-size: 14px; }
  /* dark mode (di-inject NISA saat tema gelap) */
  body[data-theme="dark"] { background: #0b0e14; color: #e2e8f0; }
  body[data-theme="dark"] h1 { color: #f8fafc; border-color: #1e293b; }
  body[data-theme="dark"] .hint { color: #64748b; }
</style>
</head>
<body contenteditable="true">
  <h1>${title}</h1>
  <p class="hint">Start writing here… (this document can be edited directly)</p>
</body>
</html>`;
}
