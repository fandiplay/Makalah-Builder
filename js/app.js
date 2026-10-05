/* app.js: perakitan UI: dashboard, form accordion, pratinjau & cetak. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const TOKENS_BY_TPL = {
  sma: [['judul', 'judul'], ['mapel', 'mapel'], ['guru', 'guru'], ['sekolah', 'sekolah'], ['kelas', 'kelas'], ['siswa', 'siswa'], ['tahunAjaran', 'tahunAjaran']],
  kampus: [['judul', 'judul'], ['matkul', 'matkul'], ['dosen', 'dosen'], ['prodi', 'prodi'], ['kampus', 'institusi'], ['kota', 'kota'], ['penulis', 'penulis']]
};
const tokensFor = tpl => TOKENS_BY_TPL[tpl] || TOKENS_BY_TPL.sma;

/* Skema form per template. Satu sumber kebenaran untuk markup, daftar isi,
   dan checklist. Style dokumen identik; yang berbeda hanya field identitas. */
const FORM_BY_TPL = {
  sma: [
    {
      id: 'cover', title: 'Cover / Halaman Judul', meta: d => (d.judul ? 'judul terisi' : 'judul kosong'), fields: [
        { p: 'jenisKarya', t: 'text', label: 'Jenis Karya', ph: 'contoh: Makalah / Tugas Akhir' },
        { p: 'judul', t: 'text', label: 'Judul Makalah', ph: 'contoh: Pengaruh Media Sosial terhadap Prestasi Belajar', hint: 'Di cover otomatis jadi kapital, TNR 16pt bold, di atas logo.' },
        { p: 'subjudul', t: 'text', label: 'Subjudul (opsional)' },
        { p: 'logo', t: 'logo', label: 'Logo Sekolah', hint: 'PNG/JPG, otomatis dikecilkan. Kosong = pakai penanda [LOGO SEKOLAH].' },
        { p: 'siswaAnggota', t: 'membersSma', label: 'Siswa', add: 'Tambah Siswa', req: true, hint: 'Tambah siswa bila makalah dikerjakan bersama. No. absen boleh diisi per siswa.' },
        { p: 'kelas', t: 'text', label: 'Kelas', ph: 'contoh: XI IPA 1', req: true },
        { p: 'mapel', t: 'text', label: 'Mata Pelajaran', ph: 'contoh: Biologi', req: true },
        { p: 'guru', t: 'text', label: 'Guru Pembimbing', ph: 'contoh: Dra. Siti Aminah, M.Pd.', hint: 'Tulis lengkap dengan gelar.', req: true },
        { p: 'sekolah', t: 'text', label: 'Nama Sekolah', ph: 'contoh: SMA Negeri 1 Banjarmasin', req: true },
        { p: 'kota', t: 'text', label: 'Kota' },
        { p: 'tahunAjaran', t: 'text', label: 'Tahun Ajaran', ph: 'contoh: 2024/2025', hint: 'Dicetak di dasar halaman cover.' }
      ]
    },
    {
      id: 'kata', title: 'Kata Pengantar', meta: d => 'bismillah ' + (d.kata.basmalah ? 'aktif' : 'nonaktif'), fields: [
        { p: 'kata.basmalah', t: 'check', label: 'Tampilkan lafadz Bismillah di atas' },
        { p: 'kata.teks', t: 'area', label: 'Isi Kata Pengantar', rows: 10, tokens: true, hint: 'Placeholder diisi otomatis dari data cover. {{judul}}, {{mapel}}, {{guru}} dan lainnya.' },
        { p: 'kata.tanggal', t: 'text', label: 'Tanggal' },
        { p: 'kata.penulis', t: 'text', label: 'Penulis pada tanda tangan', ph: 'kosong = pakai nama siswa' }
      ]
    },
    {
      id: 'bab1', title: 'Bab I Pendahuluan', fields: [
        { p: 'bab1.latar', t: 'area', label: 'Latar Belakang', rows: 8, ph: 'Tulis dipisah baris kosong untuk paragraf baru.', req: true },
        { p: 'bab1.rumusan', t: 'items', label: 'Rumusan Masalah', add: 'Tambah Butir', itemPh: 'Butir pertanyaan 1', req: true },
        { p: 'bab1.tujuan', t: 'items', label: 'Tujuan Penulisan', add: 'Tambah Butir', itemPh: 'Tujuan 1' },
        { p: 'bab1.manfaat', t: 'area', label: 'Manfaat Penulisan', rows: 5 }
      ]
    },
    {
      id: 'bab2', title: 'Bab II Pembahasan', meta: d => d.bab2.subbab.length + ' subbab', fields: [
        { p: 'bab2.pref', t: 'select', label: 'Penomoran subbab', options: [['alpha', 'A, B, C, ...'], ['num', '2.1, 2.2, ...']] },
        { p: 'bab2.subbab', t: 'subbab', label: 'Subbab / Topik', add: 'Tambah Subbab', req: true }
      ]
    },
    {
      id: 'bab3', title: 'Bab III Penutup', fields: [
        { p: 'bab3.kesimpulan', t: 'area', label: 'Kesimpulan', rows: 6, req: true },
        { p: 'bab3.saran', t: 'area', label: 'Saran', rows: 5 }
      ]
    },
    {
      id: 'pustaka', title: 'Daftar Pustaka', meta: d => d.pustaka.length + ' referensi', fields: [
        { p: 'pustaka', t: 'refs', label: 'Referensi', add: 'Tambah Referensi', hint: 'Disusun otomatis: Penulis (Tahun). Judul. Penerbit. Tautan.' }
      ]
    }
  ],
  kampus: [
    {
      id: 'cover', title: 'Cover / Halaman Judul', meta: d => (d.judul ? 'judul terisi' : 'judul kosong'), fields: [
        { p: 'judul', t: 'text', label: 'Judul Makalah', ph: 'contoh: Penerapan Metode Pembelajaran Active Learning', hint: 'Di cover otomatis jadi kapital, TNR 16pt bold.' },
        { p: 'subjudul', t: 'text', label: 'Subjudul (opsional)' },
        { p: 'matkul', t: 'text', label: 'Mata Kuliah', req: true },
        { p: 'dosen', t: 'text', label: 'Dosen Pengampu', ph: 'contoh: Dr. H. Ahmad Fauzi, M.Pd.', hint: 'Tulis lengkap dengan gelar, mengikuti berkas resmi.', req: true },
        { p: 'logo', t: 'logo', label: 'Logo Kampus', hint: 'PNG/JPG, otomatis dikecilkan. Logo dicetak di tengah sebelum daftar anggota.' },
        { p: 'anggota', t: 'members', label: 'Anggota Tim', add: 'Tambah Anggota', req: true, hint: 'Tulis NIM langsung di dalam nama, misalnya: Ahmad Rizki (123456789).' },
        { p: 'prodi', t: 'text', label: 'Program Studi', req: true },
        { p: 'fakultas', t: 'text', label: 'Fakultas' },
        { p: 'institusi', t: 'text', label: 'Institusi / Universitas' },
        { p: 'kota', t: 'text', label: 'Kota' },
        { p: 'tahun', t: 'text', label: 'Tahun' }
      ]
    },
    {
      id: 'kata', title: 'Kata Pengantar', meta: d => 'bismillah ' + (d.kata.basmalah ? 'aktif' : 'nonaktif'), fields: [
        { p: 'kata.basmalah', t: 'check', label: 'Tampilkan lafadz Bismillah di atas' },
        { p: 'kata.teks', t: 'area', label: 'Isi Kata Pengantar', rows: 10, tokens: true, hint: 'Placeholder diisi otomatis dari data cover. {{judul}}, {{matkul}}, {{dosen}} dan lainnya.' },
        { p: 'kata.tanggal', t: 'text', label: 'Tanggal' },
        { p: 'kata.penulis', t: 'text', label: 'Penulis pada tanda tangan' }
      ]
    },
    {
      id: 'bab1', title: 'Bab I Pendahuluan', fields: [
        { p: 'bab1.latar', t: 'area', label: 'Latar Belakang', rows: 8, ph: 'Tulis dipisah baris kosong untuk paragraf baru.', req: true },
        { p: 'bab1.rumusan', t: 'items', label: 'Rumusan Masalah', add: 'Tambah Butir', itemPh: 'Butir pertanyaan 1', req: true },
        { p: 'bab1.tujuan', t: 'items', label: 'Tujuan Penulisan', add: 'Tambah Butir', itemPh: 'Tujuan 1' },
        { p: 'bab1.manfaat', t: 'area', label: 'Manfaat Penulisan', rows: 5 }
      ]
    },
    {
      id: 'bab2', title: 'Bab II Pembahasan', meta: d => d.bab2.subbab.length + ' subbab', fields: [
        { p: 'bab2.pref', t: 'select', label: 'Penomoran subbab', options: [['alpha', 'A, B, C, ...'], ['num', '2.1, 2.2, ...']] },
        { p: 'bab2.subbab', t: 'subbab', label: 'Subbab / Topik', add: 'Tambah Subbab', req: true }
      ]
    },
    {
      id: 'bab3', title: 'Bab III Penutup', fields: [
        { p: 'bab3.kesimpulan', t: 'area', label: 'Kesimpulan', rows: 6, req: true },
        { p: 'bab3.saran', t: 'area', label: 'Saran', rows: 5 }
      ]
    },
    {
      id: 'pustaka', title: 'Daftar Pustaka', meta: d => d.pustaka.length + ' referensi', fields: [
        { p: 'pustaka', t: 'refs', label: 'Referensi', add: 'Tambah Referensi', hint: 'Disusun otomatis: Penulis (Tahun). Judul. Penerbit. Tautan.' }
      ]
    }
  ]
};

let FORM = FORM_BY_TPL.sma; /* diganti saat editor dibuka sesuai template draf */
const formFor = tpl => FORM_BY_TPL[tpl] || FORM_BY_TPL.sma;

const App = {
  doc: null,
  tab: 'form',
  fit: 1,
  paperDirty: true,
  buildTimer: 0,
  saveTimer: 0
};

/* ============================== util ============================== */
function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function set(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((o, k) => (o[k] = o[k] || {}), obj);
  parent[last] = val;
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}
/* Draf lama bisa kehilangan field baru: gabungkan dengan default supaya
   form tidak pernah render undefined. */
const kk = path => path.split('.')[0];
const BLANK = {
  'anggota': { nama: '', nim: '' }, 'siswaAnggota': { nama: '', absen: '' }, 'bab1.rumusan': [''], 'bab1.tujuan': [''],
  'bab2.subbab': { judul: '', isi: '' }, 'pustaka': { penulis: '', tahun: '', judul: '', penerbit: '', url: '' }
};
function hydrate(raw) {
  const base = newDocFor((raw && raw.template) || 'sma');
  const d = Object.assign(base, raw || {});
  ['kata', 'bab1', 'bab2', 'bab3'].forEach(k => { d[k] = Object.assign(base[k], (raw && raw[k]) || {}); });
  d.id = (raw && raw.id) || base.id;
  d.logo = (raw && raw.logo) || null;

  /* Migrasi draf SMA lama: satu field siswa + absen menjadi daftar siswa. */
  if (d.template === 'sma') {
    if (!Array.isArray(d.siswaAnggota) || !d.siswaAnggota.length) {
      d.siswaAnggota = [{
        nama: typeof d.siswa === 'string' ? d.siswa : '',
        absen: typeof d.absen === 'string' ? d.absen : ''
      }];
    } else {
      d.siswaAnggota = d.siswaAnggota.map(x => ({
        nama: String((x && x.nama) || ''),
        absen: String((x && x.absen) || '')
      }));
    }
  }

  /* Draf kuliah lama tetap dibaca, tetapi NIM lama tidak lagi ditampilkan/ditulis di cover. */
  if (Array.isArray(d.anggota)) {
    d.anggota = d.anggota.map(x => ({ nama: String((x && x.nama) || '') }));
  }

  for (const path in BLANK) {
    const v = get(d, path);
    if (Array.isArray(BLANK[path])) {
      if (!Array.isArray(v) || !v.length) set(d, path, ['']);
    } else if (!Array.isArray(v) || !v.length) {
      set(d, path, [Object.assign({}, BLANK[path])]);
    }
  }
  return d;
}

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('is-hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('is-hidden'), 3200);
}

/* ============================== dashboard ============================== */
function renderDash() {
  const docs = Store.list();
  const list = $('#draftList');
  list.innerHTML = '';
  docs.forEach(d => {
    const title = (d.judul || '').trim() || 'Makalah tanpa judul';
    const tplLabel = d.template === 'kampus' ? 'Kuliah' : 'SMA';
    const sub = d.matkul || d.mapel;
    const li = document.createElement('li');
    li.className = 'card draft';
    li.innerHTML =
      '<a class="draft-main" href="#/d/' + esc(d.id) + '">' +
        '<strong>' + esc(title) + '</strong>' +
        '<span><span class="badge">' + tplLabel + '</span>' + (sub ? ' ' + esc(sub) + ' &middot; ' : ' ') + 'diperbarui ' + esc(fmtTime(d.updatedAt)) + '</span>' +
      '</a>' +
      '<button type="button" class="btn-mini" data-act="del" data-id="' + esc(d.id) + '" aria-label="Hapus draf ' + esc(title) + '">Hapus</button>';
    list.appendChild(li);
  });
  $('#draftEmpty').classList.toggle('is-hidden', docs.length > 0);
  $('#draftCount').textContent = docs.length ? docs.length + ' draf tersimpan' : '';
}

/* ============================== editor ============================== */
function renderForm() {
  const form = $('#form');
  FORM = formFor(App.doc.template);
  form.innerHTML = '';
  FORM.forEach(sec => {
    const d = document.createElement('details');
    d.className = 'sec';
    d.id = 'sec-' + sec.id;
    d.open = sec.id === 'cover';
    const sum = document.createElement('summary');
    sum.innerHTML = '<span>' + esc(sec.title) + '</span>' + (sec.meta ? '<span class="sec-meta"></span>' : '');
    d.appendChild(sum);
    const body = document.createElement('div');
    body.className = 'sec-body';
    sec.fields.forEach(f => body.appendChild(renderField(f)));
    d.appendChild(body);
    form.appendChild(d);
  });
  updateSectionMeta();
  updateChecklist();
}

function renderField(f) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = 'f-' + f.p.replace(/\./g, '-');

  if (f.t === 'check') {
    const lab = document.createElement('label');
    lab.className = 'check';
    lab.htmlFor = id;
    lab.innerHTML = '<input type="checkbox" id="' + id + '" data-path="' + f.p + '"><span>' + esc(f.label) + '</span>';
    wrap.appendChild(lab);
    lab.querySelector('input').checked = !!get(App.doc, f.p);
    return wrap;
  }

  const lab = document.createElement('label');
  lab.className = 'field-label';
  lab.htmlFor = id;
  lab.textContent = f.label + (f.req ? ' *' : '');
  wrap.appendChild(lab);

  if (f.t === 'text' || f.t === 'select') {
    const inp = document.createElement(f.t === 'text' ? 'input' : 'select');
    inp.id = id;
    inp.dataset.path = f.p;
    if (f.t === 'text') { inp.type = 'text'; inp.placeholder = f.ph || ''; }
    else {
      f.options.forEach(o => {
        const op = document.createElement('option');
        op.value = o[0];
        op.textContent = o[1];
        inp.appendChild(op);
      });
    }
    inp.value = get(App.doc, f.p) ?? '';
    wrap.appendChild(inp);
  } else if (f.t === 'area') {
    const ta = document.createElement('textarea');
    ta.id = id;
    ta.rows = f.rows || 6;
    ta.dataset.path = f.p;
    ta.placeholder = f.ph || '';
    ta.value = get(App.doc, f.p) || '';
    wrap.appendChild(ta);
    if (f.tokens) {
      const box = document.createElement('div');
      box.className = 'tokens';
      tokensFor(App.doc.template).forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'token';
        btn.dataset.act = 'token';
        btn.dataset.tok = '{{' + t[0] + '}}';
        btn.textContent = '{{' + t[1] + '}}';
        btn.title = 'Sisipkan ' + t[1] + ' ke teks';
        box.appendChild(btn);
      });
      wrap.appendChild(box);
    }
  } else if (f.t === 'logo') {
    const img = document.createElement('img');
    img.id = 'logoPreview';
    img.alt = 'Pratinjau logo';
    img.className = 'logo-preview';
    img.src = App.doc.logo || logoPlaceholderDataUrl();
    img.style.display = App.doc.logo ? 'block' : 'none';
    wrap.appendChild(img);
    const row = document.createElement('div');
    row.className = 'logo-row';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/png,image/jpeg';
    file.id = id;
    file.className = 'file-input';
    file.addEventListener('change', onLogoPick);
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'btn-mini';
    clear.dataset.act = 'logo-clear';
    clear.textContent = 'Hapus logo';
    clear.disabled = !App.doc.logo;
    row.appendChild(file);
    row.appendChild(clear);
    wrap.appendChild(row);
  } else {
    // daftar dinamis: items / members / subbab / refs
    const host = document.createElement('div');
    host.id = 'list-' + f.p.replace(/\./g, '-');
    host.dataset.list = f.p;
    wrap.appendChild(host);
    renderList(host, f);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn-ghost';
    add.dataset.act = 'add';
    add.dataset.path = f.p;
    add.dataset.kind = f.t;
    add.textContent = '+ ' + f.add;
    wrap.appendChild(add);
  }

  if (f.hint) {
    const h = document.createElement('span');
    h.className = 'hint';
    h.textContent = f.hint;
    wrap.appendChild(h);
  }
  return wrap;
}

const REFS = [['penulis', 'Penulis'], ['tahun', 'Tahun'], ['judul', 'Judul'], ['penerbit', 'Penerbit'], ['url', 'Tautan (opsional)']];

function renderList(host, f) {
  const arr = get(App.doc, f.p) || [];
  host.innerHTML = '';
  arr.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'row-item';
    const head = document.createElement('div');
    head.className = 'row-head';
    const label = f.t === 'items' ? 'Butir ' + (i + 1) : f.t === 'subbab' ? 'Subbab ' + (i + 1) : f.t === 'refs' ? 'Referensi ' + (i + 1) : 'Anggota ' + (i + 1);
    head.appendChild(el('span', 'row-no', f.t === 'subbab'
      ? label + ' · ' + Doc.subLabel(App.doc.bab2.pref || 'alpha', i)
      : label));
    [['up', '↑'], ['down', '↓'], ['del', '×']].forEach(([act, ch]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-mini icon-btn';
      b.dataset.act = act;
      b.dataset.path = f.p;
      b.dataset.i = String(i);
      b.textContent = ch;
      b.setAttribute('aria-label', (act === 'del' ? 'Hapus ' : 'Geser ') + label);
      b.disabled = (act === 'up' && i === 0) || (act === 'down' && i === arr.length - 1);
      head.appendChild(b);
    });
    row.appendChild(head);

    if (f.t === 'items') {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.dataset.path = f.p + '.' + i;
      inp.placeholder = f.itemPh || '';
      inp.value = item || '';
      row.appendChild(inp);
    } else {
      (f.t === 'members' ? [['nama', 'Nama lengkap (NIM dalam kurung, opsional)']]
        : f.t === 'membersSma' ? [['nama', 'Nama lengkap'], ['absen', 'No. absen (opsional)']]
        : f.t === 'subbab' ? [['judul', 'Judul subbab'], ['isi', 'Isi uraian (baris kosong = paragraf baru)']]
        : REFS).forEach(([k, ph]) => {
        const box = document.createElement(k === 'isi' ? 'textarea' : 'input');
        if (k === 'isi') box.rows = 4; else box.type = 'text';
        box.dataset.path = f.p + '.' + i + '.' + k;
        box.placeholder = ph;
        box.setAttribute('aria-label', ph);
        box.value = item[k] || '';
        row.appendChild(box);
      });
    }
    host.appendChild(row);
  });
}

function listField(path) {
  return formFor(App.doc.template).flatMap(s => s.fields).find(f => f.p === path);
}

function onFieldInput(e) {
  const t = e.target;
  const path = t.dataset.path;
  if (!path || !App.doc) return;
  set(App.doc, path, t.type === 'checkbox' ? t.checked : t.value);
  if (t.tagName === 'SELECT') updateSectionMeta();
  touch();
}

function onLogoPick(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type)) { toast('Format logo harus PNG atau JPG.'); e.target.value = ''; return; }
  if (file.size > 5 * 1024 * 1024) { toast('Logo terlalu besar (maks 5 MB).'); e.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => shrinkImage(reader.result, 400).then(url => {
    App.doc.logo = url;
    const prev = $('#logoPreview');
    if (prev) { prev.src = url; prev.style.display = 'block'; }
    const clear = $('[data-act="logo-clear"]');
    if (clear) clear.disabled = false;
    touch();
  }).catch(() => toast('Logo gagal diproses.'));
  reader.readAsDataURL(file);
}

/* Perkecil logo supaya muat di localStorage (PNG 400px biasanya < 60 KB). */
function shrinkImage(dataUrl, maxW) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(maxW, img.width || maxW);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = Math.round((img.height / img.width) * w);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try { resolve(c.toDataURL('image/png')); } catch (err) { reject(err); }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function logoPlaceholderDataUrl() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#fff" stroke="#d6d3d1" stroke-dasharray="4 3"/><text x="40" y="46" font-size="9" text-anchor="middle" fill="#78716c" font-family="sans-serif">LOGO</text></svg>');
}

/* ---------- interaksi daftar (tambah / hapus / geser / sisip token) ---------- */
function onFormAction(e) {
  const b = e.target.closest('[data-act]');
  if (!b || !App.doc) return;
  const act = b.dataset.act;
  const path = b.dataset.path;
  const f = path ? listField(path) : null;

  if (act === 'logo-clear') {
    App.doc.logo = null;
    const prev = $('#logoPreview');
    if (prev) { prev.src = logoPlaceholderDataUrl(); prev.style.display = 'none'; }
    b.disabled = true;
    touch();
    return;
  }
  if (act === 'token') {
    const ta = $('textarea[data-path="kata.teks"]');
    if (!ta) return;
    const tok = b.dataset.tok;
    const s = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
    const en = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
    ta.value = ta.value.slice(0, s) + tok + ta.value.slice(en);
    set(App.doc, 'kata.teks', ta.value);
    ta.focus();
    touch();
    return;
  }
  if (!f) return;
  const arr = get(App.doc, path) || [];
  const i = Number(b.dataset.i);
  const blank = {
    anggota: { nama: '' },
    membersSma: { nama: '', absen: '' },
    items: '',
    subbab: { judul: '', isi: '' },
    refs: { penulis: '', tahun: '', judul: '', penerbit: '', url: '' }
  }[f.t];

  if (act === 'add') arr.push(typeof blank === 'string' ? '' : Object.assign({}, blank));
  else if (act === 'del') {
    if (arr.length === 1 && !confirm('Hapus item terakhir? Kolomnya akan dikosongkan, bukan hilang.')) return;
    arr.splice(i, 1);
    if (!arr.length) arr.push(typeof blank === 'string' ? '' : Object.assign({}, blank));
  } else if (act === 'up' && i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
  else if (act === 'down' && i < arr.length - 1) { const t = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = t; }
  else return;

  set(App.doc, path, arr);
  renderList($('#list-' + path.replace(/\./g, '-')), f);
  updateSectionMeta();
  updateChecklist();
  touch();
  const ctrls = $$('#list-' + path.replace(/\./g, '-') + ' input, #list-' + path.replace(/\./g, '-') + ' textarea');
  if (ctrls.length) ctrls[Math.max(0, ctrls.length - ({ subbab: 1, refs: 5, members: 1, membersSma: 2 }[f.t] || 1))].focus();
}

/* ---------- checklist ---------- */
function updateChecklist() {
  const box = $('#checklist');
  if (!box || !App.doc) return;
  const missing = Doc.missing(App.doc);
  const total = 9;
  const done = total - missing.length;
  box.className = 'card checklist';
  box.innerHTML = '';
  const title = document.createElement('p');
  title.className = 'checklist-title';
  title.textContent = missing.length ? 'Kelengkapan: ' + done + '/' + total + ' terisi' : 'Semua bagian wajib sudah terisi';
  box.appendChild(title);
  if (!missing.length) return;
  const ul = document.createElement('ul');
  missing.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = '<button type="button" data-sec="' + m.sec + '" data-field="' + esc(m.field) + '">' +
      '<span class="mark no">!</span><span>' + esc(m.label) + '</span></button>';
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

function openTo(sec, field) {
  const d = $('#sec-' + sec);
  if (!d) return;
  d.open = true;
  d.querySelector('summary').focus();
  d.scrollIntoView({ block: 'start', behavior: 'smooth' });
  if (field) {
    const target = $('#form [data-path="' + field + '"]');
    if (target) setTimeout(() => {
      target.focus();
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 320);
  }
}

function updateSectionMeta() {
  $$('#form details.sec').forEach((d, i) => {
    const meta = d.querySelector('.sec-meta');
    const sec = FORM[i];
    if (meta && sec && sec.meta) meta.textContent = sec.meta(App.doc);
  });
}

/* ---------- simpan + bangun kertas ---------- */
function touch() {
  $('#docTitle').textContent = (App.doc.judul || '').trim() || 'Makalah tanpa judul';
  clearTimeout(App.saveTimer);
  App.saveTimer = setTimeout(() => {
    const ok = Store.put(App.doc);
    $('#saveStatus').textContent = ok
      ? 'Tersimpan otomatis ' + fmtTime(App.doc.updatedAt).split(',').pop().trim()
      : 'Penyimpanan penuh: draf hanya bertahan selama tab ini terbuka';
    if (Store.degraded && ok) $('#saveStatus').textContent = 'Penyimpanan browser diblokir, draf sementara';
    updateChecklist();
    updateSectionMeta();
  }, 400);
  App.paperDirty = true;
  clearTimeout(App.buildTimer);
  $('#paperStatus').textContent = 'Menyusun halaman...';
  App.buildTimer = setTimeout(buildPaper, 450);
}

function buildPaper() {
  if (!App.doc) return;
  const doc = App.doc;
  const host = $('#sheets');
  const wrap = $('#paperWrap');
  let heads = [];

  // Urutan hitung: isi dulu karena nomor halamannya dibutuhkan Daftar Isi,
  // lalu cover dan prakata. Sheet disusun ulang ke urutan dokumen di bawah.
  const res = Pager.build(host, [
    {
      id: 'body', scheme: 'arabic', base: 1,
      blocks: () => { const r = Doc.bodyBlocks(doc); heads = r.heads; return r.blocks; }
    },
    { id: 'cover', scheme: 'none', templateClass: doc.template, blocks: () => Doc.coverBlocks(doc) },
    { id: 'kata', scheme: 'roman', base: 2, blocks: () => Doc.kataBlocks(doc) },
    {
      id: 'toc', scheme: 'roman',
      base: r => 2 + r.find(x => x.id === 'kata').sheets.length,
      blocks: r => {
        const body = r.find(x => x.id === 'body');
        Pager.mapHeads(heads, body.sheets);
        const kataPages = r.find(x => x.id === 'kata').sheets.length;
        const entries = [
          { label: 'KATA PENGANTAR', level: 1, page: 'ii' },
          { label: 'DAFTAR ISI', level: 1, page: romanize(2 + kataPages) }
        ].concat(heads.map(h => ({ label: h.label, level: h.level, page: h.page ? String(h.page) : '-' })));
        return Doc.tocBlocks(entries);
      }
    }
  ]);

  ['cover', 'kata', 'toc', 'body'].forEach(id => {
    res.filter(x => x.id === id).forEach(x => x.sheets.forEach(sh => host.appendChild(sh)));
  });

  const total = res.reduce((n, x) => n + x.sheets.length, 0);
  App.paperDirty = false;
  $('#paperStatus').textContent = total + ' halaman A4';
  const z = $('#zoom');
  applyZoom(z.dataset.touched ? Number(z.value) : App.fit);
}

function applyZoom(k) {
  const host = $('#sheets');
  const wrap = $('#paperWrap');
  host.style.transform = 'scale(' + k + ')';
  wrap.style.height = Math.ceil(host.offsetHeight * k) + 'px';
}

function fitZoom() {
  const wrap = $('#paperWrap');
  if (!wrap.clientWidth) return; // pane masih tersembunyi
  const k = Math.min(1, (wrap.clientWidth - 26) / (21 * cmPx()));
  App.fit = k;
  const z = $('#zoom');
  z.value = String(k);
  delete z.dataset.touched;
  applyZoom(k);
}

/* ---------- cetak ---------- */
function printDoc() {
  if (!App.doc) return;
  if (App.paperDirty) buildPaper();
  const missing = Doc.missing(App.doc);
  document.title = 'Makalah - ' + ((App.doc.judul || '').trim() || App.doc.id);
  window.print();
  if (missing.length) {
    setTimeout(() => toast(missing.length + ' bagian masih kosong, ditandai di dalam PDF dengan [ ... ]'), 600);
  }
}

/* ============================== router ============================== */
function route() {
  const m = location.hash.match(/^#\/d\/(.+)$/);
  if (!m) return showDash();
  let id = m[1];
  const newMatch = id.match(/^new(?:\/(sma|kampus))?$/);
  if (newMatch) {
    const tpl = newMatch[1] || 'sma'; /* #/d/new tanpa template = SMA (default) */
    const doc = newDocFor(tpl);
    Store.put(doc);
    history.replaceState(null, '', '#/d/' + doc.id);
    id = doc.id;
  }
  const doc = Store.get(id);
  if (!doc) { toast('Draf tidak ditemukan.'); location.hash = '#/'; return; }
  showEditor(hydrate(doc));
}

function showDash() {
  App.doc = null;
  $('#viewEditor').classList.add('is-hidden');
  $('#viewDash').classList.remove('is-hidden');
  renderDash();
}

function showEditor(doc) {
  App.doc = doc;
  $('#viewDash').classList.add('is-hidden');
  $('#viewEditor').classList.remove('is-hidden');
  $('#saveStatus').textContent = 'Tersimpan otomatis ' + fmtTime(doc.updatedAt).split(',').pop().trim();
  syncTemplatePicker();
  renderForm();
  buildPaper();
  fitZoom();
  updatePanes();
}

/* ---------- pemilih template ---------- */
function syncTemplatePicker() {
  const sel = $('#tplPick');
  if (sel && App.doc) sel.value = App.doc.template || 'sma';
}

/* Ganti template draf yang sedang dibuka. Field isian yang tidak dipakai
   template baru tetap tersimpan di draf (tidak dihapus), jadi bolak-balik
   template tidak menghilangkan data. */
function setTemplate(tpl) {
  if (!App.doc || App.doc.template === tpl) return;
  App.doc.template = tpl;
  renderForm();
  syncTemplatePicker();
  touch();
}

function updatePanes() {
  const wide = matchMedia('(min-width:1024px)').matches;
  const paper = $('#panePaper');
  const off = !wide;
  $('#tabs').classList.toggle('is-hidden', wide);
  $('#paneForm').classList.toggle('is-offpane', off && App.tab !== 'form');
  paper.classList.toggle('is-offpane', off && App.tab !== 'paper');
  $('#paneForm').setAttribute('aria-hidden', String(off && App.tab !== 'form'));
  paper.setAttribute('aria-hidden', String(off && App.tab !== 'paper'));
  $('#tabForm').setAttribute('aria-selected', String(App.tab === 'form'));
  $('#tabPaper').setAttribute('aria-selected', String(App.tab === 'paper'));
  if (!paper.classList.contains('is-offpane')) requestAnimationFrame(fitZoom);
}

/* ============================== boot ============================== */
function boot() {
  $('#draftList').addEventListener('click', e => {
    const b = e.target.closest('[data-act="del"]');
    if (!b) return;
    const doc = Store.get(b.dataset.id);
    if (!doc) return;
    if (!confirm('Hapus draf "' + ((doc.judul || '').trim() || 'tanpa judul') + '"? Tindakan ini tidak bisa dibatalkan.')) return;
    Store.remove(doc.id);
    renderDash();
    toast('Draf dihapus.');
  });

  $('#form').addEventListener('input', onFieldInput);
  $('#form').addEventListener('change', onFieldInput);
  $('#form').addEventListener('click', onFormAction);
  $('#checklist').addEventListener('click', e => {
    const b = e.target.closest('[data-sec]');
    if (!b) return;
    App.tab = 'form';
    updatePanes();
    openTo(b.dataset.sec, b.dataset.field);
  });

  $('#tplPick').addEventListener('change', e => setTemplate(e.target.value));
  $('#tabForm').addEventListener('click', () => { App.tab = 'form'; updatePanes(); });
  $('#tabPaper').addEventListener('click', () => { App.tab = 'paper'; updatePanes(); if (App.paperDirty) buildPaper(); fitZoom(); });
  $('#btnPrint').addEventListener('click', printDoc);
  $('#btnFit').addEventListener('click', fitZoom);
  $('#zoom').addEventListener('input', e => {
    e.target.dataset.touched = '1';
    applyZoom(Number(e.target.value));
  });

  matchMedia('(min-width:1024px)').addEventListener('change', () => { updatePanes(); fitZoom(); });
  addEventListener('resize', () => { if (!$('#zoom').dataset.touched) fitZoom(); });
  addEventListener('hashchange', route);

  // Cetak dari mana pun (Ctrl+P / menu cetak HP): pastikan kertas siap dulu.
  addEventListener('beforeprint', () => {
    if (!App.doc) {
      const cur = Store.read().current;
      if (cur && Store.get(cur)) showEditor(hydrate(Store.get(cur)));
    }
    if (App.doc && App.paperDirty) buildPaper();
  });
  addEventListener('afterprint', () => { document.title = 'Makalah Editor'; });

  route();
  if (Store.degraded) toast('Penyimpanan lokal tidak tersedia, draf hanya bertahan selama tab ini terbuka.');
}

document.addEventListener('DOMContentLoaded', boot);