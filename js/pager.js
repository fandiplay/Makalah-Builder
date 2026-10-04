/* pager.js: mesin pagination client-side.
   Mengukur tinggi tiap blok terhadap tinggi area isi (23,7 cm), lalu memecah
   paragraf yang terlalu panjang pada batas kata. Semua satuan absolut (cm),
   jadi tinggi hasil ukur = tinggi saat dicetak pada skala 100%. */

const PAGE = { w: 21, h: 29.7, top: 3, right: 3, bottom: 3, left: 4 };
const BODY_CM = PAGE.h - PAGE.top - PAGE.bottom; /* 23,7 cm */

let _cmPx = null;
function cmPx() {
  if (_cmPx == null) {
    const probe = el('div');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:10cm;height:0';
    document.body.appendChild(probe);
    _cmPx = probe.getBoundingClientRect().width / 10;
    probe.remove();
  }
  return _cmPx;
}
const BODY_PX = () => BODY_CM * cmPx();

function romanize(n) {
  const map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

const Pager = {
  /* sections: [{ id, blocks, scheme: 'none'|'roman'|'arabic', base }]
     base = nomor halaman awal bagian tersebut (cover tidak bernomor).
     blocks: [{ node, keep }], keep = menempel ke blok berikutnya.
     Balikan: [{ id, sheets: [sheetEl], labels: [...] }] */
  build(host, sections) {
    const px = BODY_PX();
    host.innerHTML = '';
    host.classList.add('building');
    const out = [];

    for (const sec of sections) {
      // blocks/base boleh berupa fungsi: Daftar Isi butuh nomor halaman isi & prakata.
      const blocks = typeof sec.blocks === 'function' ? sec.blocks(out) : sec.blocks;
      const base = typeof sec.base === 'function' ? sec.base(out) : (sec.base || 1);
      const ctx = { px, sec, sheets: [], host };
      ctx.mk = () => {
        const sh = el('div', 'sheet' + (sec.id === 'cover' ? ' cover' : ''));
        const body = el('div', 'pg-body');
        sh.appendChild(body);
        host.appendChild(sh);
        const rec = { sheet: sh, body };
        ctx.sheets.push(rec);
        return rec;
      };
      ctx.cur = ctx.mk();

      for (const unit of groupUnits(blocks)) {
        // brk = blok wajib mulai halaman baru (setiap BAB, daftar pustaka)
        if (unit.brk && ctx.cur.body.children.length) ctx.cur = ctx.mk();
        let placed = false;
        while (!placed) {
          if (fits(ctx.cur.body, unit.nodes, px)) { placed = true; continue; }
          if (ctx.cur.body.children.length === 0) {
            // Tidak muat walau di halaman kosong: pasang yang muat, pecah sisanya
            let k = 0;
            while (k < unit.nodes.length && fitsOne(ctx.cur.body, unit.nodes[k], px)) k++;
            const rest = unit.nodes.slice(k);
            if (rest.length && canSplit(rest[0])) {
              splitUnit(rest[0], ctx);
              rest.slice(1).forEach(n => ctx.cur.body.appendChild(n));
            } else {
              unit.nodes.forEach(n => ctx.cur.body.appendChild(n));
            }
            ctx.cur = ctx.mk();
            placed = true;
            continue;
          }
          ctx.cur = ctx.mk();
        }
      }

      const used = ctx.sheets.filter(s => s.body.children.length > 0);
      ctx.sheets.slice(used.length).forEach(s => s.sheet.remove());
      const labels = used.map((s, i) => labelFor(sec, base, i));
      used.forEach((s, i) => {
        if (sec.scheme === 'none') return;
        // Nomor di bawah untuk halaman pembuka bab & prakata, di kanan atas untuk isi lanjutan.
        const pos = sec.scheme === 'roman' ? 'bottom'
          : (s.body.firstElementChild && s.body.firstElementChild.classList.contains('h-bab') ? 'bottom' : 'top');
        s.sheet.appendChild(el('span', 'pgnum ' + pos, labels[i]));
      });
      out.push({ id: sec.id, sheets: used.map(s => s.sheet), labels });
    }

    host.classList.remove('building');
    return out;
  },

  /* Nomor halaman tiap heading isi, untuk dipakai Daftar Isi. */
  mapHeads(heads, sheets) {
    sheets.forEach((sheet, i) => {
      heads.forEach(h => { if (h.page == null && sheet.contains(h.node)) h.page = i + 1; });
    });
  }
};

function groupUnits(blocks) {
  const units = [];
  for (let i = 0; i < blocks.length;) {
    const b = blocks[i];
    if (b.keep && blocks[i + 1]) {
      units.push({ nodes: [b.node, blocks[i + 1].node], brk: !!b.brk });
      i += 2; // blok berikutnya sudah ikut, jangan diproses lagi
    } else {
      units.push({ nodes: [b.node], brk: !!b.brk });
      i += 1;
    }
  }
  return units;
}

function fits(body, nodes, px) {
  nodes.forEach(n => body.appendChild(n));
  // clientHeight (px) sama dengan tinggi kotak 23,7 cm yang dipakai printer;
  // scrollHeight selalu bulat ke atas, jadi toleransi 1 px.
  const limit = body.clientHeight || px;
  const ok = body.scrollHeight <= limit + 1;
  if (!ok) nodes.forEach(n => body.removeChild(n));
  return ok;
}

const fitsOne = (body, node, px) => fits(body, [node], px);

/* Ukur satu blok lalu lepas kembali: dipakai binary search saat memecah paragraf. */
function measure(body, node, px) {
  body.appendChild(node);
  const limit = body.clientHeight || px;
  const ok = body.scrollHeight <= limit + 1;
  body.removeChild(node);
  return ok;
}

/* Batas: hanya paragraf polos (tanpa elemen anak seperti <em>) yang dipecah,
   sehingga gaya di dalam paragraf tidak ikut hilang. Paragraf ber-<em> yang
   panjang akan tetap dipotong oleh batas halaman (konten paling bawah hilang)
   -> ganti blok rich text bila hal ini perlu. */
function canSplit(node) {
  return !node.children.length && node.textContent.trim().split(/\s+/).length > 3;
}

function splitUnit(node, ctx) {
  let rest = node.textContent.trim().split(/\s+/);
  while (rest.length) {
    let lo = 1, hi = rest.length, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (measure(ctx.cur.body, cloneText(node, rest.slice(0, mid)), ctx.px)) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    if (best === 0) {
      if (ctx.cur.body.children.length) { ctx.cur = ctx.mk(); continue; }
      best = 1; // satu kata pun tidak muat: taruh juga, tidak ada pilihan lain
    }
    ctx.cur.body.appendChild(cloneText(node, rest.slice(0, best)));
    rest = rest.slice(best);
    if (rest.length) ctx.cur = ctx.mk();
  }
}

function cloneText(node, words) {
  const c = node.cloneNode(false);
  c.textContent = words.join(' ');
  return c;
}

const labelFor = (sec, base, i) => {
  const n = (base || 1) + i;
  return sec.scheme === 'roman' ? romanize(n) : String(n);
};