# NISA V.3 — Neural Interactive Systematic Assistant

**Your AI Operating System.** One workspace, many capabilities — from education to professional.

UI berbahasa desain **glassmorphism** (terinspirasi Pippit AI & Google Labs): panel kaca blur di atas mesh gradient, kontrol berbentuk pill, dan serif display kontras tinggi.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — buat akun, lalu mulai chat.

## Mode live vs demo

- **Demo (default):** tanpa API key, chat dibalas mock dan `/quiz` + `/anagram` memakai generator bawaan — semua fitur UI tetap berfungsi.
- **Live:** isi `ANTHROPIC_API_KEY` di `.env.local` (lihat placeholder), restart dev server. Chat streaming langsung dari Claude (`claude-sonnet-5`, bisa dioverride via `NISA_MODEL`). API key hanya dipakai di server (API route), tidak pernah terkirim ke browser.

## Data

Semua data (akun, percakapan, artifacts, Drive) disimpan di **localStorage** browser — tanpa database. Password disimpan sebagai hash SHA-256. Batas upload 2 MB/file (batas praktis localStorage).

## Fitur

- **Auth** — sign up / sign in, halaman hero dark glass.
- **Chat** — streaming + stop, token meter (x/100k), auto-title, TLDR, Copy, Share, Compact, New Doc.
- **Response modes** — Auto, Brainstorm, Comprehensive, Deep, Plan, Ringkas, Socratic (ikon slider).
- **Templates** (ikon tongkat), **recent prompts** (ikon jam pasir), lampiran file (klip).
- **Slash commands** — `/` memunculkan agents & skills. `/quiz <topik>` (dengan kartu pertanyaan elicitation) menghasilkan kuis siap cetak + kunci jawaban; `/anagram <topik>` menghasilkan game Word Builder yang playable.
- **Artifacts** — panel pratinjau kaca dengan versi (v1, v2…), Edit (simpan versi baru), tampilan HTML, Export (.html / print), buka tab baru; otomatis tersimpan ke Drive.
- **Drive** — meter storage per kategori, unggah drag & drop (terindeks untuk @mention), tab Documents / Artifacts / Attachments, folder.
- **@mention** dokumen Drive di chat; **⌘K** command palette; status bar server MCP; tema **light/dark**.

## Struktur

- `app/` — routes (auth, app, drive, api/chat|title|health)
- `components/` — shell (rail/status/palette), sidebar, chat, artifact
- `lib/` — store (zustand+localStorage), engine streaming, registry, template artifact (quiz & word builder), mock demo
