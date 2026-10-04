/* doc.js: mengubah data draf menjadi blok dokumen (paragraf/heading/butir).
   Semua isi dokumen disusun sebagai teks polos agar pagination tetap akurat. */

const Doc = {
  ARAB: 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ',

  letters(n) {
    let s = '';
    do { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } while (n >= 0);
    return s;
  },

  subLabel(pref, i) {
    return pref === 'num' ? '2.' + (i + 1) : this.letters(i) + '.';
  },

  /* Ganti {{token}} dengan isi draf; yang kosong jadi [penanda] supaya
     kekosongan terlihat di PDF, bukan jadi teks palsu. */
  subst(text, doc) {
    const vals = {
      judul: doc.judul, subjudul: doc.subjudul, matkul: doc.matkul, dosen: doc.dosen,
      prodi: doc.prodi, fakultas: doc.fakultas, institusi: doc.institusi,
      kota: doc.kota, tahun: doc.tahun,
      penulis: doc.kata.penulis || 'Tim Penulis'
    };
    return String(text).replace(/\{\{(\w+)\}\}/g, (m, k) => {
      const v = vals[k];
      if (v && String(v).trim()) return String(v);
      return '[' + (k === 'judul' ? 'judul makalah' : k) + ']';
    });
  },

  /* ---------- cover ---------- */
  coverBlocks(doc) {
    const b = [];
    const push = (node, keep) => b.push({ node, keep: keep !== false });

    push(el('p', 'c-judul', doc.judul.trim().toUpperCase() || '[JUDUL MAKALAH]'));
    if (doc.subjudul.trim()) push(el('p', 'c-sub', doc.subjudul.trim()));
    push(el('p', 'gap-1'));
    push(el('p', 'no-indent', 'MAKALAH'), true);
    push(el('p', 'no-indent', 'Disusun untuk Memenuhi Tugas Mata Kuliah'));
    push(el('p', 'no-indent', doc.matkul.trim() || '[mata kuliah]'), true);
    push(el('p', 'no-indent', 'Dosen Pengampu: ' + (doc.dosen.trim() || '[nama dosen, gelar]')));
    push(el('p', 'gap-2'));
    push(el('p', 'no-indent', 'Disusun oleh:'));
    doc.anggota.forEach((a, i) => {
      push(el('p', 'c-anggota', (i + 1) + '. ' + (a.nama.trim() || '[nama anggota]')), true);
      push(el('p', 'c-nim', a.nim.trim() ? 'NIM. ' + a.nim.trim() : 'NIM. [nim]'));
    });
    push(el('p', 'gap-3'));
    push(el('p', 'c-kampus', doc.prodi.trim() || '[program studi]'), true);
    push(el('p', 'no-indent', doc.fakultas.trim() || '[fakultas]'), true);
    push(el('p', 'no-indent', doc.institusi.trim() || '[institusi]'), true);
    push(el('p', 'no-indent', [doc.kota.trim() || '[kota]', doc.tahun.trim() || String(new Date().getFullYear())].join(', ')), false);

    // Logo diletakkan di paling atas cover
    b.unshift({ node: logoNode(doc.logo), keep: true });
    return b;
  },

  /* ---------- kata pengantar ---------- */
  kataBlocks(doc) {
    const b = [];
    b.push({ node: el('h2', 'h-bab', 'KATA PENGANTAR'), keep: true });
    if (doc.kata.basmalah) {
      const p = el('p', 'cover-arab');
      p.innerHTML = this.ARAB + '<br><span style="font-size:11pt">Assalamu\'alaikum Warahmatullahi Wabarakatuh</span>';
      b.push({ node: p, keep: true });
    }
    const teks = this.subst(doc.kata.teks, doc).trim();
    paras(teks).forEach(p => b.push({ node: p }));
    if (!teks) b.push({ node: el('p', 'para empty-slot', '[Kata pengantar belum diisi]'), keep: true });

    b.push({ node: el('p', 'sign', [doc.kota.trim() || '[kota]', doc.kata.tanggal.trim()].filter(Boolean).join(', ')), keep: true });
    b.push({ node: el('p', 'sign-space'), keep: true });
    b.push({ node: el('p', 'sign', 'Penulis,'), keep: true });
    b.push({ node: el('p', 'sign sign-name', doc.kata.penulis.trim() || 'Tim Penulis') });
    return b;
  },

  /* ---------- daftar isi ---------- */
  tocBlocks(entries) {
    const b = [{ node: el('h2', 'h-bab', 'DAFTAR ISI'), keep: true }];
    entries.forEach(e => {
      const row = el('p', 'toc-item' + (e.level > 1 ? ' lvl-2' : ''));
      row.appendChild(el('span', 'toc-label', e.label));
      row.appendChild(el('span', 'toc-dots'));
      row.appendChild(el('span', 'toc-page', e.page));
      b.push({ node: row, keep: e.level === 1 });
    });
    return b;
  },

  /* ---------- isi: Bab I - III + Daftar Pustaka ---------- */
  bodyBlocks(doc) {
    const b = [];
    const heads = [];
    const addHead = (node, label, level, brk) => { b.push({ node, keep: true, brk: !!brk }); heads.push({ node, label, level }); };
    const bab = (lines, isNew) => {
      const h = el('h2', 'h-bab' + (isNew ? ' bab-new' : ''));
      lines.forEach(l => h.appendChild(el('span', 'line', l)));
      return h;
    };
    const sub = (label, title) => el('h3', 'h-sub', (label ? label + ' ' : '') + title);

    addHead(bab(['BAB I', 'PENDAHULUAN'], false), 'BAB I PENDAHULUAN', 1);
    addHead(sub('A.', 'Latar Belakang'), 'A. Latar Belakang', 2);
    pushParas(b, doc.bab1.latar);
    addHead(sub('B.', 'Rumusan Masalah'), 'B. Rumusan Masalah', 2);
    pushItems(b, doc.bab1.rumusan);
    addHead(sub('C.', 'Tujuan Penulisan'), 'C. Tujuan Penulisan', 2);
    pushItems(b, doc.bab1.tujuan);
    addHead(sub('D.', 'Manfaat Penulisan'), 'D. Manfaat Penulisan', 2);
    pushParas(b, doc.bab1.manfaat);

    addHead(bab(['BAB II', 'PEMBAHASAN'], true), 'BAB II PEMBAHASAN', 1, 1);
    const subs = doc.bab2.subbab.filter(s => (s.judul || '').trim() || (s.isi || '').trim());
    if (!subs.length) b.push({ node: el('p', 'para empty-slot', '[Belum ada subbab. Tambahkan di form Bab II.]') });
    subs.forEach((s, i) => {
      const label = this.subLabel(doc.bab2.pref, i);
      addHead(sub(label, s.judul.trim() || '[judul subbab]'), label + ' ' + (s.judul.trim() || '[judul subbab]'), 2);
      pushParas(b, s.isi);
    });

    addHead(bab(['BAB III', 'PENUTUP'], true), 'BAB III PENUTUP', 1, 1);
    addHead(sub('A.', 'Kesimpulan'), 'A. Kesimpulan', 2);
    pushParas(b, doc.bab3.kesimpulan);
    addHead(sub('B.', 'Saran'), 'B. Saran', 2);
    pushParas(b, doc.bab3.saran);

    addHead(bab(['DAFTAR PUSTAKA'], true), 'DAFTAR PUSTAKA', 1, 1);
    const refs = doc.pustaka.filter(r => (r.judul || '').trim() || (r.penulis || '').trim());
    if (!refs.length) b.push({ node: el('p', 'para empty-slot', '[Belum ada referensi. Tambahkan di form Daftar Pustaka.]') });
    refs.forEach((r, i) => {
      const p = el('p', 'ref');
      const penulis = r.penulis.trim() || '[nama penulis]';
      const tahun = r.tahun.trim() || '[tahun]';
      const judul = r.judul.trim() || '[judul sumber]';
      const terbit = r.penerbit.trim() || '[penerbit]';
      p.appendChild(document.createTextNode(penulis + ' (' + tahun + '). '));
      p.appendChild(el('em', '', judul));
      p.appendChild(document.createTextNode('. ' + terbit + '.'));
      if (r.url.trim()) p.appendChild(document.createTextNode(' ' + r.url.trim()));
      b.push({ node: p });
    });

    return { blocks: b, heads };
  },

  /* ---------- cek kelengkapan ---------- */
  /* field = data-path asli supaya tombol checklist bisa langsung fokus ke kolomnya. */
  missing(doc) {
    const m = [];
    const add = (sec, field, label, ok) => { if (!ok) m.push({ sec, field, label }); };
    add('cover', 'judul', 'Judul makalah', !!doc.judul.trim());
    add('cover', 'matkul', 'Mata kuliah', !!doc.matkul.trim());
    add('cover', 'dosen', 'Dosen pengampu', !!doc.dosen.trim());
    add('cover', 'anggota.0.nama', 'Anggota tim (nama + NIM)', doc.anggota.some(a => a.nama.trim() && a.nim.trim()));
    add('cover', 'prodi', 'Program studi', !!doc.prodi.trim());
    add('bab1', 'bab1.latar', 'Latar belakang', !!doc.bab1.latar.trim());
    add('bab1', 'bab1.rumusan.0', 'Rumusan masalah', doc.bab1.rumusan.some(t => t.trim()));
    add('bab2', 'bab2.subbab.0.judul', 'Subbab pembahasan', doc.bab2.subbab.some(s => s.judul.trim() || s.isi.trim()));
    add('bab3', 'bab3.kesimpulan', 'Kesimpulan', !!doc.bab3.kesimpulan.trim());
    add('pustaka', 'pustaka.0.judul', 'Referensi minimal 1', doc.pustaka.some(r => r.judul.trim() || r.penulis.trim()));
    return m;
  }
};

/* ---------- util DOM ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function paras(text) {
  const t = String(text || '').replace(/\r/g, '');
  const chunks = t.split(/\n[ \t]*\n+/).map(s => s.trim()).filter(Boolean);
  if (!chunks.length) return [];
  return chunks.map(c => el('p', 'para', c.replace(/\n[ \t]*/g, ' ')));
}

function pushParas(blocks, text) {
  const list = paras(text);
  if (!list.length) blocks.push({ node: el('p', 'para empty-slot', '[Bagian ini belum diisi]') });
  list.forEach(node => blocks.push({ node }));
}

function pushItems(blocks, arr) {
  const list = (arr || []).map(t => String(t || '').trim()).filter(Boolean);
  if (!list.length) { blocks.push({ node: el('p', 'para empty-slot', '[Belum diisi]') }); return; }
  list.forEach((t, i) => blocks.push({ node: el('p', 'li', (i + 1) + '. ' + t) }));
}

function logoNode(dataUrl) {
  const p = el('p', 'logo');
  if (dataUrl) {
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Logo kampus';
    p.appendChild(img);
  } else {
    p.appendChild(el('div', 'logo-ph', 'LOGO KAMPUS\n(belum diunggah)')); // white-space: pre-line di print.css
  }
  return p;
}