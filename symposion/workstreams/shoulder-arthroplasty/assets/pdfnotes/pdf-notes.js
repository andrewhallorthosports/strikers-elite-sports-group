/* Symposion full-text viewer with shared notes (release 0.16).
   Loaded on demand by a review page. Needs pdf.js beside it (pdf.min.js, pdf.worker.min.js, same origin, no outside host).
   SymposionPdf.open({ base, fn, key, slug, file, label, auth, rpc })
     base  folder holding this file and pdf.js, with a trailing slash
     fn    URL of the symposion-pdf edge function; key  the publishable key
     auth  () => ({ id, pass })   the signed-in person and passcode, read each time
     rpc   (name, args) => Promise   the page's own database caller (throws Error(code) on an error reply)
   Notes are highlights, margin notes and replies. They live in public.symposion_pdf_notes; who may see which is decided by the database. */
(function () {
  if (window.SymposionPdf) return;
  const COL = { yellow: "#ffe34d", green: "#7fd98a", blue: "#80bfff", pink: "#ff9fcb" };
  const ERR = { bad_passcode: "Your passcode was not accepted. Sign in again.", person_gone: "Your registration could not be found.", no_file: "This paper is not available.",
    too_many: "Too many in a short time. Please wait a few minutes.", bad_note: "That note could not be saved.", bad_reply: "That reply could not be saved.",
    bad_recipients: "Choose between one and ten recipients.", not_yours: "Only the author of a note can retract it.", hash_mismatch: "The stored file does not match its recorded fingerprint.",
    storage: "The file could not be read from storage.", render: "The marked-up copy could not be made." };
  const say = (e) => ERR[e && e.message] || ERR[e] || "Something went wrong. Please try again.";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const when = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
  const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const CSS = `
.pn-ov{position:fixed;inset:0;z-index:2000;background:#15181d;color:#e8eaed;display:flex;flex-direction:column;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.pn-ov *{box-sizing:border-box}
.pn-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;background:#20242b;border-bottom:1px solid #343a44}
.pn-title{font-weight:600;flex:1 1 220px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pn-bar button,.pn-ov .pn-btn{background:#2d333c;color:#e8eaed;border:1px solid #444c58;border-radius:6px;padding:6px 10px;font:inherit;cursor:pointer}
.pn-bar button:hover,.pn-ov .pn-btn:hover{background:#38404b}
.pn-bar button:disabled,.pn-ov .pn-btn:disabled{opacity:.45;cursor:default}
.pn-bar input[type=number]{width:56px;background:#15181d;color:inherit;border:1px solid #444c58;border-radius:6px;padding:5px}
.pn-main{flex:1;display:flex;min-height:0}
.pn-stage{flex:1;overflow:auto;padding:16px;display:flex;justify-content:center;align-items:flex-start;background:#0f1115}
.pn-page{position:relative;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.6)}
.pn-page canvas{display:block}
.pn-text{position:absolute;inset:0;overflow:hidden;line-height:1;opacity:1;user-select:text}
.pn-text span,.pn-text br{color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0 0}
.pn-text ::selection{background:rgba(70,130,255,.35)}
.pn-hl{position:absolute;inset:0;pointer-events:none}
.pn-hl i{position:absolute;mix-blend-mode:multiply;opacity:.5}
.pn-hl i.on{outline:2px solid #3b82f6;opacity:.8}
.pn-side{width:340px;max-width:42vw;border-left:1px solid #343a44;background:#1a1d23;overflow:auto;padding:10px}
.pn-side h3{margin:4px 0 8px;font-size:14px}
.pn-note{border:1px solid #343a44;border-radius:8px;padding:8px;margin:0 0 8px;background:#20242b;cursor:pointer}
.pn-note.on{border-color:#3b82f6}
.pn-chip{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:baseline}
.pn-meta{font-size:12px;color:#aab1bb}
.pn-q{font-size:12.5px;color:#c4cad3;border-left:3px solid #444c58;padding-left:6px;margin:5px 0;max-height:4.4em;overflow:hidden}
.pn-body{white-space:pre-wrap;margin:4px 0}
.pn-rp{margin:6px 0 0 12px;padding-left:8px;border-left:2px solid #444c58}
.pn-acts{display:flex;gap:8px;margin-top:4px}
.pn-acts button{background:none;border:0;color:#8ab4f8;padding:0;cursor:pointer;font:inherit;font-size:12.5px}
.pn-msg{padding:6px 12px;font-size:13px}
.pn-msg.warn{background:#4a3410;color:#ffd9a0}.pn-msg.bad{background:#4a1a1a;color:#ffb4b4}.pn-msg.info{background:#1b2a3d;color:#bcd6f5}
.pn-float{position:fixed;z-index:2100;background:#20242b;border:1px solid #444c58;border-radius:8px;padding:6px;display:flex;gap:6px;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,.5)}
.pn-float b{width:22px;height:22px;border-radius:50%;border:2px solid #20242b;cursor:pointer;outline:1px solid #666}
.pn-form textarea,.pn-dlg textarea{width:100%;min-height:80px;background:#15181d;color:inherit;border:1px solid #444c58;border-radius:6px;padding:6px;font:inherit}
.pn-dlgback{position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}
.pn-dlg{background:#20242b;border:1px solid #444c58;border-radius:10px;padding:16px;max-width:520px;width:100%;max-height:90vh;overflow:auto}
.pn-dlg label.r{display:flex;gap:8px;padding:3px 0;align-items:center}
@media (max-width:820px){.pn-main{flex-direction:column}.pn-side{width:auto;max-width:none;max-height:38vh;border-left:0;border-top:1px solid #343a44}}
`;

  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("script")); document.head.appendChild(s); });
  }

  async function open(o) {
    if (!document.getElementById("pn-css")) { const st = document.createElement("style"); st.id = "pn-css"; st.textContent = CSS; document.head.appendChild(st); }
    const ov = document.createElement("div"); ov.className = "pn-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", o.label || "Full text");
    ov.innerHTML = `<div class="pn-bar"><span class="pn-title">${esc(o.label || o.file)}</span>
      <button data-a="prev" title="Previous page">&lsaquo;</button><span>Page <input data-a="pg" type="number" min="1" value="1"> of <span data-a="n">…</span></span><button data-a="next" title="Next page">&rsaquo;</button>
      <button data-a="zout" title="Zoom out">&minus;</button><button data-a="zin" title="Zoom in">+</button>
      <button data-a="pnote" title="Add a note to this page">Note on this page</button>
      <button data-a="dl" title="Download this paper with the notes marked on it">Download marked-up</button>
      <button data-a="send" title="Email a marked-up copy to co-authors">Send to co-authors…</button>
      <button data-a="close" title="Close (Esc)">Close</button></div>
      <div data-a="msgs"></div>
      <div class="pn-main"><div class="pn-stage" data-a="stage"><div class="pn-msg info">Opening the paper…</div></div><aside class="pn-side"><h3>Notes <span class="pn-meta" data-a="cnt"></span></h3><div data-a="list"></div></aside></div>`;
    const prevFocus = document.activeElement;
    document.body.appendChild(ov);
    const $ = (a) => ov.querySelector(`[data-a="${a}"]`);
    const S = { pdf: null, page: 1, zoom: 1, notes: [], blind: false, intact: true, colour: "yellow", active: null, token: 0, closed: false };
    const A = () => o.auth();
    const base = () => ({ p_slug: o.slug, p_person: A().id, p_pass: A().pass });
    const edge = (b, raw) => fetch(o.fn, { method: "POST", headers: { apikey: o.key, Authorization: "Bearer " + o.key, "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ slug: o.slug, person: A().id, pass: A().pass }, b)) });
    const banner = (cls, t) => { const m = $("msgs"); m.innerHTML = t ? `<div class="pn-msg ${cls}">${esc(t)}</div>` : ""; };
    function close() {
      if (S.closed) return; S.closed = true; document.removeEventListener("keydown", onKey, true); document.removeEventListener("selectionchange", onSel);
      ov.remove(); document.querySelectorAll(".pn-float,.pn-dlgback").forEach((x) => x.remove()); if (S.pdf) S.pdf.destroy(); if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
    function onKey(e) { if (e.key === "Escape" && !document.querySelector(".pn-dlgback")) { e.preventDefault(); e.stopPropagation(); close(); } }
    document.addEventListener("keydown", onKey, true);

    try {
      if (!window.pdfjsLib) await loadScript(o.base + "pdf.min.js");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = o.base + "pdf.worker.min.js";
      const r = await edge({ action: "url", file: o.file }); const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "storage");
      const f = await fetch(d.url); if (!f.ok) throw new Error("storage");
      const bytes = await f.arrayBuffer();
      const sha = hex(await crypto.subtle.digest("SHA-512", bytes));
      if (sha !== d.sha512) { banner("bad", "This file does not match its recorded fingerprint, so it has been withheld. Report this to the Symposion Project Administrator (AJH)."); $("stage").innerHTML = ""; return; }
      S.pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
    } catch (e) { banner("bad", say(e)); $("stage").innerHTML = ""; return; }
    $("n").textContent = S.pdf.numPages; $("pg").max = S.pdf.numPages;
    await loadNotes(); await show(1);

    async function loadNotes() {
      try { const d = await o.rpc("symposion_pdf_notes", Object.assign(base(), { p_file: o.file })); S.notes = d.notes || []; S.blind = !!d.blind; S.intact = d.intact !== false; }
      catch (e) { banner("bad", say(e)); return; }
      banner(S.intact ? (S.blind ? "info" : "") : "bad", !S.intact ? "The note record has failed its integrity check. Report this to the Symposion Project Administrator (AJH)." : S.blind ? "While your coding sets are open you see only your own notes here; everyone else's become visible when you complete them." : "");
      list();
    }
    function tops() { return S.notes.filter((n) => n.kind !== "reply"); }
    function repl(seq) { return S.notes.filter((n) => n.kind === "reply" && n.reply_to === seq); }
    function list() {
      const t = tops(); $("cnt").textContent = t.length ? `(${t.length})` : "";
      $("list").innerHTML = t.length ? t.map((n) => `<div class="pn-note${S.active === n.seq ? " on" : ""}" data-seq="${n.seq}" data-pg="${n.page}">
        <div class="pn-meta"><span class="pn-chip" style="background:${COL[n.colour] || COL.yellow}"></span>${esc(n.by)} &middot; p.${n.page} &middot; ${esc(when(n.at))}</div>
        ${n.quote ? `<div class="pn-q">${esc(n.quote)}</div>` : ""}${n.body ? `<div class="pn-body">${esc(n.body)}</div>` : ""}
        ${repl(n.seq).map((r) => `<div class="pn-rp"><div class="pn-meta">${esc(r.by)} &middot; ${esc(when(r.at))}</div><div class="pn-body">${esc(r.body)}</div></div>`).join("")}
        <div class="pn-acts"><button data-do="reply">Reply</button>${n.mine ? `<button data-do="retract">Retract</button>` : ""}</div></div>`).join("") : `<div class="pn-meta">No notes yet. Select text in the paper to highlight it or add a note.</div>`;
    }
    async function show(n) {
      try { await draw(n); } catch (e) { if (S.closed || (e && /Cancelled|destroyed/i.test(e.name + e.message))) return; banner("bad", "This page could not be displayed."); }
    }
    async function draw(n) {
      n = Math.max(1, Math.min(S.pdf.numPages, n | 0 || 1)); S.page = n; $("pg").value = n; const tok = ++S.token;
      const stage = $("stage"), page = await S.pdf.getPage(n);
      const v1 = page.getViewport({ scale: 1 }), avail = Math.max(280, Math.min(stage.clientWidth - 32, 1000));
      const sc = (avail / v1.width) * S.zoom, vp = page.getViewport({ scale: sc }), dpr = window.devicePixelRatio || 1;
      const wrap = document.createElement("div"); wrap.className = "pn-page"; wrap.style.width = vp.width + "px"; wrap.style.height = vp.height + "px";
      const cv = document.createElement("canvas"); cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr); cv.style.width = vp.width + "px"; cv.style.height = vp.height + "px";
      const tx = document.createElement("div"); tx.className = "pn-text"; tx.style.setProperty("--scale-factor", sc);
      const hl = document.createElement("div"); hl.className = "pn-hl";
      wrap.append(cv, tx, hl);
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null }).promise;
      if (tok !== S.token || S.closed) return;
      stage.innerHTML = ""; stage.appendChild(wrap); S.wrap = wrap; S.tx = tx; S.hl = hl;
      const content = await page.getTextContent();
      await window.pdfjsLib.renderTextLayer({ textContentSource: content, container: tx, viewport: vp, textDivs: [] }).promise;
      marks(); stage.scrollTop = 0;
    }
    function marks() {
      if (!S.hl) return; S.hl.innerHTML = "";
      tops().filter((n) => n.page === S.page).forEach((n) => (n.rects || []).forEach((q) => {
        const i = document.createElement("i"); i.style.cssText = `left:${q.x * 100}%;top:${q.y * 100}%;width:${q.w * 100}%;height:${q.h * 100}%;background:${COL[n.colour] || COL.yellow}`;
        if (S.active === n.seq) i.className = "on"; S.hl.appendChild(i);
      }));
    }
    async function post(kind, extra) {
      try {
        const d = await o.rpc("symposion_pdf_note_post", Object.assign(base(), { p_file: o.file, p_page: S.page, p_kind: kind, p_quote: "", p_prefix: "", p_suffix: "", p_rects: [], p_colour: S.colour, p_body: "", p_reply_to: null }, extra));
        S.active = d.note && d.note.seq; await loadNotes(); marks(); return true;
      } catch (e) { banner("bad", say(e)); return false; }
    }
    // ----- selecting text -----
    let pending = null;
    function clearFloat() { document.querySelectorAll(".pn-float").forEach((x) => x.remove()); }
    function onSel() {
      const sel = window.getSelection(); clearFloat(); pending = null;
      if (!sel || sel.isCollapsed || !S.tx || !S.tx.contains(sel.anchorNode) || !S.tx.contains(sel.focusNode)) return;
      const raw = sel.toString(), quote = raw.replace(/\s+/g, " ").trim(); if (!quote) return;
      const range = sel.getRangeAt(0), b = S.wrap.getBoundingClientRect(), seen = new Set(), rects = [];
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue;
        const q = { x: +((r.left - b.left) / b.width).toFixed(4), y: +((r.top - b.top) / b.height).toFixed(4), w: +(r.width / b.width).toFixed(4), h: +(r.height / b.height).toFixed(4) };
        if (q.x < 0 || q.y < 0 || q.x > 1 || q.y > 1) continue; q.w = Math.min(q.w, 1 - q.x); q.h = Math.min(q.h, 1 - q.y);
        const k = [q.x, q.y, q.w, q.h].join(); if (!seen.has(k)) { seen.add(k); rects.push(q); }
      }
      if (!rects.length) return;
      const full = S.tx.textContent, i = full.indexOf(raw);
      pending = { quote: quote.slice(0, 2000), prefix: i > 0 ? full.slice(Math.max(0, i - 40), i) : "", suffix: i >= 0 ? full.slice(i + raw.length, i + raw.length + 40) : "", rects: rects.slice(0, 40) };
      const last = range.getBoundingClientRect(), fl = document.createElement("div"); fl.className = "pn-float";
      fl.style.left = Math.max(8, Math.min(innerWidth - 280, last.left)) + "px"; fl.style.top = Math.min(innerHeight - 50, last.bottom + 8) + "px";
      fl.innerHTML = Object.keys(COL).map((c) => `<b data-c="${c}" title="Highlight ${c}" style="background:${COL[c]}"></b>`).join("") + `<button class="pn-btn" data-do="selnote">Add note…</button>`;
      fl.addEventListener("mousedown", (e) => e.preventDefault());
      fl.addEventListener("click", async (e) => {
        const c = e.target.dataset.c, p = pending; if (!p) return;
        if (c) { S.colour = c; clearFloat(); getSelection().removeAllRanges(); await post("highlight", { p_quote: p.quote, p_prefix: p.prefix, p_suffix: p.suffix, p_rects: p.rects, p_colour: c }); }
        else if (e.target.dataset.do === "selnote") { clearFloat(); getSelection().removeAllRanges(); form("Add a note", async (t) => post("note", { p_quote: p.quote, p_prefix: p.prefix, p_suffix: p.suffix, p_rects: p.rects, p_body: t })); }
      });
      document.body.appendChild(fl);
    }
    document.addEventListener("selectionchange", onSel);
    // ----- small dialogs -----
    function dialog(html) { const b = document.createElement("div"); b.className = "pn-dlgback"; b.innerHTML = `<div class="pn-dlg" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(b); return b; }
    function form(title, onSave) {
      const d = dialog(`<h3 style="margin:0 0 8px">${esc(title)}</h3><div class="pn-form"><textarea maxlength="4000" aria-label="${esc(title)}"></textarea></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="pn-btn" data-x>Cancel</button><button class="pn-btn" data-ok style="background:#2b5fb4">Save</button></div>`);
      const ta = d.querySelector("textarea"); ta.focus();
      d.querySelector("[data-x]").onclick = () => d.remove();
      d.querySelector("[data-ok]").onclick = async (e) => { const t = ta.value.trim(); if (!t) return; e.target.disabled = true; if (await onSave(t)) d.remove(); else e.target.disabled = false; };
    }
    // ----- toolbar and list events -----
    ov.addEventListener("click", async (e) => {
      const a = e.target.closest("[data-a]"), dn = e.target.closest("[data-do]"), card = e.target.closest(".pn-note");
      if (dn && card && !dn.closest(".pn-float")) {
        const seq = +card.dataset.seq;
        if (dn.dataset.do === "reply") form("Reply", (t) => post("reply", { p_reply_to: seq, p_body: t, p_page: +card.dataset.pg }));
        if (dn.dataset.do === "retract") { if (!confirm("Retract this note? It will no longer be shown, though the record that it was made is kept.")) return; try { await o.rpc("symposion_pdf_note_retract", Object.assign(base(), { p_seq: seq })); await loadNotes(); marks(); } catch (er) { banner("bad", say(er)); } }
        return;
      }
      if (card) { S.active = +card.dataset.seq; const pg = +card.dataset.pg; if (pg !== S.page) await show(pg); list(); marks(); return; }
      if (!a) return; const k = a.dataset.a;
      if (k === "prev") show(S.page - 1); else if (k === "next") show(S.page + 1);
      else if (k === "zin") { S.zoom = Math.min(2.5, S.zoom + 0.15); show(S.page); } else if (k === "zout") { S.zoom = Math.max(0.5, S.zoom - 0.15); show(S.page); }
      else if (k === "close") close();
      else if (k === "pnote") form("Note on page " + S.page, (t) => post("note", { p_body: t }));
      else if (k === "dl") download(a);
      else if (k === "send") sendDialog();
    });
    $("pg").addEventListener("change", (e) => show(+e.target.value));
    async function download(btn) {
      btn.disabled = true; const t = btn.textContent; btn.textContent = "Preparing…";
      try { const r = await edge({ action: "download", file: o.file }); if (!r.ok) throw new Error((await r.json()).error || "render");
        const u = URL.createObjectURL(await r.blob()), l = document.createElement("a"); l.href = u; l.download = (o.label || o.file).replace(/[^A-Za-z0-9._-]+/g, "_") + "_marked-up.pdf"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
      } catch (e) { banner("bad", say(e)); }
      btn.disabled = false; btn.textContent = t;
    }
    async function sendDialog() {
      let people; try { people = (await o.rpc("symposion_pdf_recipients", base())).people || []; } catch (e) { banner("bad", say(e)); return; }
      const d = dialog(`<h3 style="margin:0 0 6px">Send a marked-up copy</h3>
        <p class="pn-meta">The full paper, with the notes you are able to see marked on it, is emailed from Symposion with your name as the sender. It is for use within the research team only. Choose the co-authors to send it to.</p>
        <div data-r>${people.length ? people.map((p) => `<label class="r"><input type="checkbox" value="${esc(p.id)}"> ${esc(p.label)}${p.self ? " (you)" : ""}</label>`).join("") : "<p class='pn-meta'>No co-author has an email address registered yet.</p>"}</div>
        <label style="display:block;margin:10px 0 4px" class="pn-meta">Message (optional)</label><textarea maxlength="1500" data-m></textarea>
        <div data-s class="pn-meta" style="margin-top:6px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="pn-btn" data-x>Close</button><button class="pn-btn" data-ok style="background:#2b5fb4">Send</button></div>`);
      const s = d.querySelector("[data-s]");
      d.querySelector("[data-x]").onclick = () => d.remove();
      d.querySelector("[data-ok]").onclick = async (e) => {
        const ids = Array.from(d.querySelectorAll("[data-r] input:checked")).map((x) => x.value);
        if (!ids.length) { s.textContent = "Tick at least one person."; return; } if (ids.length > 10) { s.textContent = "Choose no more than ten."; return; }
        e.target.disabled = true; s.textContent = "Sending…";
        try {
          const q = await o.rpc("symposion_pdf_send", Object.assign(base(), { p_file: o.file, p_recipients: ids, p_message: d.querySelector("[data-m]").value }));
          const r = await edge({ action: "send" }); const out = await r.json();
          s.textContent = !r.ok ? say(out.error) : out.configured === false ? "Queued; the email service is not set up yet, so it will go when it is." : `Sent to ${out.sent} ${out.sent === 1 ? "person" : "people"}${out.failed ? `; ${out.failed} could not be sent and will be retried` : ""}${q.skipped ? `; ${q.skipped} had no address` : ""}.`;
        } catch (er) { s.textContent = say(er); }
        e.target.disabled = false;
      };
    }
  }
  window.SymposionPdf = { open, version: "0.16" };
})();
