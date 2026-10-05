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
     kekosongan terlihat di PDF, bukan jadi teks palsu. Token mengikuti
     template: SMA pakai mapel/guru/sekolah, kampus pakai matkul/dosen/prodi. */
  subst(text, doc) {
    const sma = doc.template === 'sma';
    const vals = {
      judul: doc.judul, subjudul: doc.subjudul,
      matkul: sma ? doc.mapel : doc.matkul,
      dosen: sma ? doc.guru : doc.dosen,
      mapel: doc.mapel, guru: doc.guru, sekolah: doc.sekolah,
      prodi: doc.prodi, fakultas: doc.fakultas, institusi: doc.institusi,
      kelas: doc.kelas, siswa: doc.siswa,
      kota: doc.kota, tahun: sma ? doc.tahunAjaran : doc.tahun,
      tahunAjaran: doc.tahunAjaran,
      penulis: doc.kata.penulis || (sma ? ((doc.siswaAnggota || []).map(a => a.nama).filter(Boolean).join(', ')) : '') || 'Tim Penulis'
    };
    return String(text).replace(/\{\{(\w+)\}\}/g, (m, k) => {
      const v = vals[k];
      if (v && String(v).trim()) return String(v);
      return '[' + (k === 'judul' ? 'judul makalah' : k) + ']';
    });
  },

  /* ---------- cover ---------- */
  coverBlocks(doc) {
    return doc.template === 'sma' ? this.coverSma(doc) : this.coverKampus(doc);
  },

  /* Cover SMA: judul di atas logo, lalu identitas siswa & sekolah,
     penutup baris tahun ajaran di dasar halaman. */
  coverSma(doc) {
    const b = [];
    const push = (node, keep) => b.push({ node, keep: keep !== false });

    if ((doc.jenisKarya || '').trim()) push(el('p', 'c-jenis', doc.jenisKarya.trim().toUpperCase()), true);
    push(el('p', 'c-judul', doc.judul.trim().toUpperCase() || '[JUDUL MAKALAH]'));
    if (doc.subjudul.trim()) push(el('p', 'c-sub', doc.subjudul.trim()));

    const students = Array.isArray(doc.siswaAnggota) && doc.siswaAnggota.length
      ? doc.siswaAnggota
      : [{ nama: doc.siswa || '', absen: doc.absen || '' }];

    /* Logo tetap di tengah dan dibuat lebih kecil agar daftar siswa panjang tetap muat. */
    const logo = logoNode(doc.logo, 'Logo Sekolah');
    logo.classList.add('logo-sma', 'logo-count-' + Math.min(students.length, 7));
    push(logo);
    push(el('p', 'gap-1'));
    push(el('p', 'no-indent', 'Disusun oleh:'), true);

    students.forEach((s, i) => {
      const name = String(s.nama || '').trim() || '[nama siswa]';
      const absen = String(s.absen || '').trim();
      push(el('p', 'c-siswa' + (students.length > 3 ? ' c-member-compact' : ''), absen ? name + ' (Absen ' + absen + ')' : name), true);
    });

    push(el('p', 'gap-2'));
    push(el('p', 'no-indent', 'Kelas ' + (doc.kelas.trim() || '[kelas]')), true);
    push(el('p', 'no-indent', 'Mata Pelajaran: ' + (doc.mapel.trim() || '[mata pelajaran]')), true);
    push(el('p', 'no-indent', 'Guru Pembimbing: ' + (doc.guru.trim() || '[nama guru, gelar]')), true);
    push(el('p', 'gap-2'));
    push(el('p', 'c-kampus', doc.sekolah.trim().toUpperCase() || '[NAMA SEKOLAH]'), true);
    push(el('p', 'no-indent', doc.kota.trim() || '[kota]'), true);
    push(el('p', 'cover-tahun', 'TAHUN AJARAN ' + (doc.tahunAjaran.trim() || defaultTahunAjaran())), true);
    return b;
  },

  coverKampus(doc) {
    const b = [];
    const push = (node, keep) => b.push({ node, keep: keep !== false });

    push(el('p', 'c-judul', doc.judul.trim().toUpperCase() || '[JUDUL MAKALAH]'));
    if (doc.subjudul.trim()) push(el('p', 'c-sub', doc.subjudul.trim()));
    push(el('p', 'gap-1'));
    push(el('p', 'no-indent', 'MAKALAH'), true);
    push(el('p', 'no-indent', 'Disusun untuk Memenuhi Tugas Mata Kuliah'));
    push(el('p', 'no-indent', doc.matkul.trim() || '[mata kuliah]'), true);
    push(el('p', 'no-indent', 'Dosen Pengampu: ' + (doc.dosen.trim() || '[nama dosen, gelar]')), true);

    /* Logo kampus harus berada di tengah tepat sebelum "Disusun oleh". */
    const logo = logoNode(doc.logo, 'Logo Kampus');
    logo.classList.add('logo-kampus');
    push(logo, true);
    push(el('p', 'gap-1'));
    push(el('p', 'no-indent', 'Disusun oleh:'), true);

    doc.anggota.forEach((a, i) => {
      push(el('p', 'c-anggota', (i + 1) + '. ' + (String(a.nama || '').trim() || '[nama anggota]')), true);
    });

    push(el('p', 'gap-2'));
    push(el('p', 'c-kampus', doc.prodi.trim() || '[program studi]'), true);
    push(el('p', 'no-indent', doc.fakultas.trim() || '[fakultas]'), true);
    push(el('p', 'no-indent', doc.institusi.trim() || '[institusi]'), true);
    push(el('p', 'no-indent', [doc.kota.trim() || '[kota]', doc.tahun.trim() || String(new Date().getFullYear())].join(', ')), false);
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
    return doc.template === 'sma' ? this.missingSma(doc) : this.missingKampus(doc);
  },

  missingSma(doc) {
    const m = [];
    const add = (sec, field, label, ok) => { if (!ok) m.push({ sec, field, label }); };
    add('cover', 'judul', 'Judul makalah', !!doc.judul.trim());
    add('cover', 'mapel', 'Mata pelajaran', !!doc.mapel.trim());
    add('cover', 'guru', 'Guru pembimbing', !!doc.guru.trim());
    add('cover', 'siswa', 'Nama siswa', !!doc.siswa.trim());
    add('cover', 'kelas', 'Kelas', !!doc.kelas.trim());
    add('cover', 'sekolah', 'Nama sekolah', !!doc.sekolah.trim());
    add('bab1', 'bab1.latar', 'Latar belakang', !!doc.bab1.latar.trim());
    add('bab1', 'bab1.rumusan.0', 'Rumusan masalah', doc.bab1.rumusan.some(t => t.trim()));
    add('bab2', 'bab2.subbab.0.judul', 'Subbab pembahasan', doc.bab2.subbab.some(s => s.judul.trim() || s.isi.trim()));
    add('bab3', 'bab3.kesimpulan', 'Kesimpulan', !!doc.bab3.kesimpulan.trim());
    add('pustaka', 'pustaka.0.judul', 'Referensi minimal 1', doc.pustaka.some(r => r.judul.trim() || r.penulis.trim()));
    return m;
  },

  missingKampus(doc) {
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

function logoNode(dataUrl, label) {
  const p = el('p', 'logo');
  if (dataUrl) {
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = label || 'Logo';
    p.appendChild(img);
  } else {
    p.appendChild(el('div', 'logo-ph', (label || 'LOGO').toUpperCase() + '\n(belum diunggah)'));
  }
  return p;
}