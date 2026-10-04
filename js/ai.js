/* ai.js: fitur "Tulis dengan AI" + pengaturan AI. Vanilla JS, tanpa library.

   Aturan keamanan:
   - API key hanya disimpan di localStorage key "makalah.aiconfig.v1" (terpisah
     dari draf) dan hanya dipakai sebagai header. Tidak pernah masuk URL,
     draft, PDF, atau console.
   - Semua teks hasil AI dirender lewat textContent (tidak ada innerHTML),
     jadi konten model tidak bisa disuntik sebagai HTML.
   - Hasil AI tidak pernah menimpa field secara langsung: selalu lewat dialog
     pratinjau (Terapkan / Ulangi / Batal) dan bisa di-urungkan. */

(function () {
  'use strict';

  var AI_KEY = 'makalah.aiconfig.v1';
  var AI_TIMEOUT = 60000; /* 60 detik */

  var AI_DEFAULTS = {
    openai: { base: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
    anthropic: { base: 'https://api.anthropic.com', model: 'claude-3-5-haiku-latest' }
  };

  /* ---------- config (terpisah dari draf) ---------- */
  function aiLoad() {
    var raw = null;
    try { raw = localStorage.getItem(AI_KEY); } catch (e) { /* storage diblokir */ }
    var c = {};
    try { c = raw ? JSON.parse(raw) : {}; } catch (e) { c = {}; }
    if (!c || typeof c !== 'object') c = {};
    var fmt = c.fmt === 'anthropic' ? 'anthropic' : 'openai';
    return {
      fmt: fmt,
      base: typeof c.base === 'string' && c.base.trim() ? c.base.trim() : AI_DEFAULTS[fmt].base,
      key: typeof c.key === 'string' ? c.key : '',
      model: typeof c.model === 'string' && c.model.trim() ? c.model.trim() : AI_DEFAULTS[fmt].model
    };
  }

  function aiSave(cfg) {
    try {
      localStorage.setItem(AI_KEY, JSON.stringify({ fmt: cfg.fmt, base: cfg.base, key: cfg.key, model: cfg.model }));
      return true;
    } catch (e) { return false; }
  }

  function aiClear() {
    try { localStorage.removeItem(AI_KEY); } catch (e) { /* abaikan */ }
  }

  /* Buang spasi, "/" di akhir, dan "/chat/completions" atau "/messages"
     yang ikut tertempel saat pengguna menyalin dari dashboard provider. */
  function aiNormBase(u) {
    var s = String(u == null ? '' : u).trim().replace(/\s+/g, '');
    s = s.replace(/\/+$/, '');
    s = s.replace(/\/chat\/completions$/i, '');
    s = s.replace(/\/messages$/i, '');
    s = s.replace(/\/+$/, '');
    return s;
  }

  function aiEndpoint(fmt, base) {
    var b = aiNormBase(base);
    if (fmt === 'anthropic') return b + (/\/v1$/i.test(b) ? '/messages' : '/v1/messages');
    return b + '/chat/completions';
  }

  /* ---------- pemanggilan API ---------- */
  function aiFetch(url, opts) {
    var ac = new AbortController();
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; ac.abort(); }, AI_TIMEOUT);
    var done = function (v) { clearTimeout(timer); return v; };
    return fetch(url, Object.assign({ signal: ac.signal }, opts)).then(
      function (r) {
        return r.text().then(function (txt) { return done({ status: r.status, text: txt }); });
      },
      function () { return done({ status: 0, text: '', net: true, timedOut: timedOut }); }
    );
  }

  /* Status HTTP dipetakan ke pesan Bahasa Indonesia yang ramah. */
  function aiHttpMsg(status) {
    if (status === 401) return 'API Key ditolak (401). Periksa ulang di Pengaturan AI.';
    if (status === 403) return 'Akses ditolak (403). API Key tidak punya izin untuk model ini.';
    if (status === 404) return 'Endpoint tidak ditemukan (404). Periksa Base URL di Pengaturan AI.';
    if (status === 429) return 'Terlalu banyak permintaan (429). Tunggu sebentar lalu coba lagi.';
    if (status === 413) return 'Permintaan terlalu besar (413). Kuncikan model yang lebih hemat.';
    if (status >= 500) return 'Server AI sedang bermasalah (' + status + '). Coba lagi nanti.';
    return 'Permintaan ditolak server (' + status + '). Periksa pengaturan AI.';
  }

  function aiErrMsg(r) {
    if (r.net && r.timedOut) return 'Server AI tidak menjawab dalam 60 detik. Coba lagi atau ganti model.';
    if (r.net) return 'Gagal menghubungi server AI. Periksa internet, Base URL, dan izin CORS server.';
    if (r.status < 200 || r.status >= 300) return aiHttpMsg(r.status);
    return 'Balasan AI tidak bisa dibaca. Coba Ulangi.';
  }

  function aiBody(cfg, messages, maxTokens) {
    if (cfg.fmt === 'anthropic') {
      return JSON.stringify({
        model: cfg.model,
        max_tokens: maxTokens || 4000,
        system: messages[0].content,
        messages: [{ role: 'user', content: messages[1].content }]
      });
    }
    return JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens || 4000,
      temperature: 0.7,
      messages: messages
    });
  }

  function aiHeaders(cfg) {
    var h = { 'Content-Type': 'application/json' };
    if (cfg.fmt === 'anthropic') {
      h['x-api-key'] = cfg.key;
      h['anthropic-version'] = '2023-06-01';
    } else {
      h['Authorization'] = 'Bearer ' + cfg.key;
    }
    return h;
  }

  function aiPickText(cfg, data) {
    if (cfg.fmt === 'anthropic') {
      if (data && Array.isArray(data.content)) {
        for (var i = 0; i < data.content.length; i++) {
          if (data.content[i] && typeof data.content[i].text === 'string') return data.content[i].text;
        }
      }
      return '';
    }
    if (data && data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || '';
    return '';
  }

  /* balasan -> teks, atau objek { error: pesanFriendly }. */
  function aiChat(cfg, system, user, maxTokens) {
    var body = aiBody(cfg, [{ role: 'system', content: system }, { role: 'user', content: user }], maxTokens);
    return aiFetch(aiEndpoint(cfg.fmt, cfg.base), { method: 'POST', headers: aiHeaders(cfg), body: body })
      .then(function (r) {
        if (r.net) return { error: aiErrMsg(r) };
        if (r.status < 200 || r.status >= 300) return { error: aiHttpMsg(r.status) };
        var data = null;
        try { data = JSON.parse(r.text); } catch (e) { data = null; }
        var text = aiPickText(cfg, data);
        if (typeof text !== 'string' || !text.trim()) return { error: 'Balasan AI kosong. Coba Ulangi.' };
        return { text: text };
      });
  }

  function aiTest(cfg) {
    var messages = [{ role: 'system', content: 'Balas satu kata.' }, { role: 'user', content: 'Balas: OK' }];
    var body = aiBody(cfg, messages, 8);
    return aiFetch(aiEndpoint(cfg.fmt, cfg.base), { method: 'POST', headers: aiHeaders(cfg), body: body })
      .then(function (r) {
        if (r.net) return { error: aiErrMsg(r) };
        if (r.status < 200 || r.status >= 300) return { error: aiHttpMsg(r.status) };
        return { ok: true, model: cfg.model };
      });
  }

  /* ---------- skema tiap bagian ---------- */
  /* kind: text | area | items | subbab | refs. Key JSON = data-path, jadi
     pemetaan ke draft cukup membaca kunci yang sama. */
  var AI_SECTIONS = {
    cover: {
      title: 'Cover / Halaman Judul',
      fields: [
        { path: 'judul', label: 'Judul makalah', kind: 'text' },
        { path: 'subjudul', label: 'Subjudul', kind: 'text' }
      ]
    },
    kata: {
      title: 'Kata Pengantar',
      fields: [{ path: 'kata.teks', label: 'Isi kata pengantar', kind: 'area' }]
    },
    bab1: {
      title: 'Bab I Pendahuluan',
      fields: [
        { path: 'bab1.latar', label: 'Latar belakang', kind: 'area' },
        { path: 'bab1.rumusan', label: 'Rumusan masalah', kind: 'items' },
        { path: 'bab1.tujuan', label: 'Tujuan penulisan', kind: 'items' },
        { path: 'bab1.manfaat', label: 'Manfaat penulisan', kind: 'area' }
      ]
    },
    bab2: {
      title: 'Bab II Pembahasan',
      fields: [{ path: 'bab2.subbab', label: 'Subbab / topik', kind: 'subbab' }]
    },
    bab3: {
      title: 'Bab III Penutup',
      fields: [
        { path: 'bab3.kesimpulan', label: 'Kesimpulan', kind: 'area' },
        { path: 'bab3.saran', label: 'Saran', kind: 'area' }
      ]
    },
    pustaka: {
      title: 'Daftar Pustaka',
      fields: [{ path: 'pustaka', label: 'Referensi', kind: 'refs' }]
    }
  };

  var AI_SYSTEM = [
    'Kamu penulis makalah akademik berbahasa Indonesia yang baku, formal, dan netral.',
    'Balas HANYA satu objek JSON valid. Tanpa penjelasan, tanpa pembungkus markdown.',
    'Pisahkan paragraf di dalam nilai teks dengan "\\n\\n".',
    'Jangan mengarang fakta: nama orang, nama sekolah atau kampus, judul buku, dan angka statistik.',
    'Nama yang tidak tersedia biarkan string kosong, jangan dikarang.',
    'Gunakan gaya akademik yang lazim untuk jenjang yang diminta.'
  ].join(' ');

  function aiSchemaText(fields) {
    return fields.map(function (f) {
      switch (f.kind) {
        case 'text': return '  "' + f.path + '": "judul singkat, huruf besar di awal, tanpa kutip"';
        case 'area': return '  "' + f.path + '": "paragraf 1\\n\\nparagraf 2"';
        case 'items': return '  "' + f.path + '": ["butir 1", "butir 2"]';
        case 'subbab': return '  "' + f.path + '": [{ "judul": "…", "isi": "paragraf 1\\n\\nparagraf 2" }]';
        case 'refs': return '  "' + f.path + '": [{ "penulis": "Nama", "tahun": "2024", "judul": "Judul Buku", "penerbit": "Penerbit", "url": "" }]';
      }
      return '  "' + f.path + '": ""';
    }).join(',\n');
  }

  function aiGuidance(f) {
    if (f.kind === 'text') return 'Judul ringkas dan spesifik, maksimal sekitar 12 kata.';
    if (f.kind === 'area') return 'Tulis 2-4 paragraf, masing-masing 3-6 kalimat, tidak mengulang isi bagian lain.';
    if (f.kind === 'items') return 'Buat 3-5 butir. Rumusan masalah berbentuk kalimat tanya; tujuan berbentuk tujuan konkret.';
    if (f.kind === 'subbab') return 'Buat 2-3 subbab. Judul subbab berupa frasa, isi 2-4 paragraf.';
    if (f.kind === 'refs') return 'Buat 3-5 referensi umum yang nyata dan sering dipakai di kampus. Penulis tanpa gelar, tahun 4 digit, url boleh kosong.';
    return '';
  }

  function cut(s, n) {
    var t = String(s == null ? '' : s).trim();
    return t.length > n ? t.slice(0, n).trim() + '…' : t;
  }

  function aiExisting(f) {
    var v = get(App.doc, f.path);
    if (f.kind === 'items') return (Array.isArray(v) ? v : []).map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n');
    if (f.kind === 'subbab') {
      return (Array.isArray(v) ? v : []).map(function (s, i) {
        return (i + 1) + '. ' + (s.judul || '') + (s.isi ? ' — ' + cut(s.isi, 160) : '');
      }).join('\n');
    }
    if (f.kind === 'refs') {
      return (Array.isArray(v) ? v : []).map(function (r, i) {
        return (i + 1) + '. ' + (r.penulis || '') + ' (' + (r.tahun || '…') + '). ' + (r.judul || '') + '. ' + (r.penerbit || '') + '.';
      }).join('\n');
    }
    return cut(v, 800);
  }

  function aiContext() {
    var d = App.doc || {};
    var sma = d.template !== 'kampus';
    var L = [];
    L.push('- Jenjang: ' + (sma ? 'SMA' : 'perguruan tinggi / kampus'));
    L.push('- Jenis karya: ' + ((d.jenisKarya || '').trim() || 'Makalah'));
    L.push('- Judul: ' + ((d.judul || '').trim() || '(belum diisi)'));
    if ((d.subjudul || '').trim()) L.push('- Subjudul: ' + d.subjudul.trim());
    if ((sma ? d.mapel : d.matkul || '').trim()) L.push('- Mata ' + (sma ? 'pelajaran' : 'kuliah') + ': ' + (sma ? d.mapel : d.matkul).trim());
    if ((sma ? d.guru : d.dosen || '').trim()) L.push('- Pembimbing: ' + (sma ? d.guru : d.dosen).trim());
    if ((sma ? d.sekolah : d.institusi || '').trim()) L.push('- Institusi: ' + (sma ? d.sekolah : d.institusi).trim());
    if ((d.prodi || '').trim()) L.push('- Program studi: ' + d.prodi.trim());
    if ((d.kota || '').trim()) L.push('- Kota: ' + d.kota.trim());
    L.push('');
    L.push('Isi yang sudah ada di draf (boleh dirujuk, jangan diulang kata per kata):');
    L.push('Latar belakang: ' + (cut(d.bab1 && d.bab1.latar, 400) || '(kosong)'));
    L.push('Rumusan masalah: ' + ((d.bab1 && d.bab1.rumusan || []).filter(Boolean).join('; ') || '(kosong)'));
    L.push('Subbab pembahasan: ' + (((d.bab2 && d.bab2.subbab) || []).map(function (s) { return s.judul; }).filter(Boolean).join('; ') || '(kosong)'));
    L.push('Kesimpulan: ' + (cut(d.bab3 && d.bab3.kesimpulan, 300) || '(kosong)'));
    return L.join('\n');
  }

  function aiPrompt(secId, userPrompt, projectValues) {
    var sec = AI_SECTIONS[secId];
    var L = [];
    L.push('Bagian yang harus ditulis: ' + sec.title);
    if (userPrompt) {
      L.push('');
      L.push('Instruksi pengguna:');
      L.push(String(userPrompt).trim());
    }
    L.push('');
    L.push('Data draf:');
    L.push(aiContext());
    if (projectValues && typeof projectValues === 'object') {
      L.push('');
      L.push('Isi yang sudah dihasilkan AI dalam proses ini. Gunakan agar bagian berikutnya konsisten:');
      Object.keys(projectValues).forEach(function (k) {
        var v = projectValues[k];
        if (Array.isArray(v)) L.push(k + ': ' + JSON.stringify(v));
        else if (v != null && String(v).trim()) L.push(k + ': ' + String(v));
      });
    }
    L.push('');
    L.push('Tulis hanya kunci JSON berikut (tidak boleh ada kunci lain):');
    L.push('{');
    L.push(aiSchemaText(sec.fields));
    L.push('}');
    L.push('');
    sec.fields.forEach(function (f) {
      L.push('- ' + f.path + ': ' + aiGuidance(f));
    });
    L.push('');
    L.push('Isi bagian ini saat ini (boleh diperbaiki atau dipertahankan, kosong = tulis baru):');
    sec.fields.forEach(function (f) {
      L.push(f.path + ':\n' + (aiExisting(f) || '(kosong)'));
    });
    L.push('');
    L.push('Balas sekarang dengan objek JSON saja.');
    return L.join('\n');
  }

  function aiParseJSON(txt) {
    var s = String(txt || '').trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    var a = s.indexOf('{');
    var b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }

  /* ---------- dialog (satu elemen dipakai untuk pengaturan & pratinjau) ---------- */
  var dlg = null;

  function aiEnsureDialog() {
    if (dlg) return dlg;
    var ov = document.createElement('div');
    ov.id = 'aiDialog';
    ov.className = 'ai-overlay is-hidden';
    ov.setAttribute('aria-hidden', 'true');

    var sheet = document.createElement('div');
    sheet.className = 'ai-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'aiDialogTitle');

    var head = document.createElement('div');
    head.className = 'ai-sheet-head';
    var title = document.createElement('h2');
    title.id = 'aiDialogTitle';
    title.className = 'ai-dialog-title';
    head.appendChild(title);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-mini icon-btn ai-close';
    close.setAttribute('aria-label', 'Tutup');
    close.textContent = '×';
    close.addEventListener('click', aiClose);
    head.appendChild(close);

    var body = document.createElement('div');
    body.className = 'ai-sheet-body';

    var foot = document.createElement('div');
    foot.className = 'ai-sheet-foot';

    sheet.appendChild(head);
    sheet.appendChild(body);
    sheet.appendChild(foot);
    ov.appendChild(sheet);
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) { if (e.target === ov) aiClose(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.classList.contains('is-hidden')) aiClose(); });

    dlg = { ov: ov, title: title, body: body, foot: foot, onClose: null };
    return dlg;
  }

  function aiOpen(titleText, onClose) {
    var d = aiEnsureDialog();
    d.title.textContent = titleText;
    d.body.textContent = '';
    d.foot.textContent = '';
    d.onClose = onClose || null;
    d.ov.classList.remove('is-hidden');
    d.ov.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function aiClose() {
    if (!dlg) return;
    dlg.ov.classList.add('is-hidden');
    dlg.ov.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var cb = dlg.onClose;
    dlg.onClose = null;
    if (cb) cb();
  }

  function aiBtn(label, cls, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---------- pengaturan ---------- */
  function aiField(labelText, control, hintText) {
    var w = document.createElement('div');
    w.className = 'field';
    var l = document.createElement('label');
    l.className = 'field-label';
    l.textContent = labelText;
    l.setAttribute('for', control.id);
    w.appendChild(l);
    w.appendChild(control);
    if (hintText) {
      var h = document.createElement('span');
      h.className = 'hint';
      h.textContent = hintText;
      w.appendChild(h);
    }
    return w;
  }

  function aiOpenSettings() {
    var cfg = aiLoad();
    aiOpen('Pengaturan AI');

    var sel = document.createElement('select');
    sel.id = 'aiCfgFmt';
    [['openai', 'OpenAI-compatible'], ['anthropic', 'Anthropic']].forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0];
      op.textContent = o[1];
      sel.appendChild(op);
    });
    sel.value = cfg.fmt;
    sel.addEventListener('change', function () {
      var f = sel.value;
      /* Isi default hanya kalau isian masih persis default format sebelumnya. */
      if (base.value === AI_DEFAULTS.openai.base || base.value === AI_DEFAULTS.anthropic.base) base.value = AI_DEFAULTS[f].base;
      if (model.value === AI_DEFAULTS.openai.model || model.value === AI_DEFAULTS.anthropic.model) model.value = AI_DEFAULTS[f].model;
    });

    var base = document.createElement('input');
    base.type = 'text';
    base.id = 'aiCfgBase';
    base.value = cfg.base;
    base.placeholder = AI_DEFAULTS.openai.base;
    base.autocomplete = 'off';
    base.spellcheck = false;

    var key = document.createElement('input');
    key.type = 'password';
    key.id = 'aiCfgKey';
    key.value = cfg.key;
    key.placeholder = 'Tempel API key di sini';
    key.autocomplete = 'off';
    key.spellcheck = false;

    var showBtn = aiBtn('Tampilkan', 'btn-mini ai-key-toggle', function () {
      var show = key.type === 'password';
      key.type = show ? 'text' : 'password';
      showBtn.textContent = show ? 'Sembunyikan' : 'Tampilkan';
    });

    var keyRow = document.createElement('div');
    keyRow.className = 'ai-keyrow';
    keyRow.appendChild(key);
    keyRow.appendChild(showBtn);

    var model = document.createElement('input');
    model.type = 'text';
    model.id = 'aiCfgModel';
    model.value = cfg.model;
    model.placeholder = AI_DEFAULTS.openai.model;
    model.autocomplete = 'off';
    model.spellcheck = false;

    var read = function () {
      return { fmt: sel.value, base: aiNormBase(base.value), key: key.value.trim(), model: model.value.trim() };
    };

    dlg.body.appendChild(aiField('Format API', sel, 'OpenAI-compatible: endpoint /chat/completions. Anthropic: /v1/messages.'));
    dlg.body.appendChild(aiField('Base URL', base, 'Contoh OpenAI: https://api.openai.com/v1 · Anthropic: https://api.anthropic.com. Slash di akhir dan /chat/completions ikut tertempel otomatis dibuang.'));
    dlg.body.appendChild(aiField('API Key', keyRow, 'Disimpan hanya di browser ini (localStorage "makalah.aiconfig.v1"), terpisah dari draf. Tidak ikut ke PDF.'));
    dlg.body.appendChild(aiField('Model', model, 'Contoh: gpt-4o-mini atau claude-3-5-haiku-latest.'));

    dlg.foot.appendChild(aiBtn('Hapus Config', 'btn-danger', function () {
      if (!confirm('Hapus konfigurasi AI (termasuk API key) dari browser ini?')) return;
      aiClear();
      aiClose();
      toast('Konfigurasi AI dihapus.');
    }));
    dlg.foot.appendChild(aiBtn('Tes Koneksi', 'btn-ghost', function (e) {
      var c = read();
      if (!c.key) { toast('Isi API key dulu.'); return; }
      var b = e.currentTarget;
      b.disabled = true;
      b.textContent = 'Menguji…';
      aiTest(c).then(function (r) {
        b.disabled = false;
        b.textContent = 'Tes Koneksi';
        if (r.ok) { toast('Koneksi berhasil. Model ' + r.model + ' siap dipakai.'); aiSave(c); }
        else toast(r.error);
      });
    }));
    dlg.foot.appendChild(aiBtn('Simpan', 'btn-primary', function () {
      var c = read();
      if (!c.key) { toast('Isi API key dulu.'); return; }
      if (!c.model) { toast('Isi nama model dulu.'); return; }
      base.value = c.base;
      aiSave(c);
      aiClose();
      toast('Pengaturan AI disimpan.');
    }));

    setTimeout(function () { sel.focus(); }, 30);
  }

  /* ---------- pratinjau hasil AI ---------- */
  var run = { secId: null, values: null, snapshot: null, busy: false, seq: 0 };

  function aiBusyView(msg) {
    run.busy = true;
    dlg.body.textContent = '';
    var p = document.createElement('p');
    p.className = 'ai-status';
    p.textContent = msg;
    dlg.body.appendChild(p);
    dlg.foot.textContent = '';
  }

  function aiErrorView(msg, onAgain) {
    run.busy = false;
    dlg.body.textContent = '';
    var p = document.createElement('p');
    p.className = 'ai-status ai-status-err';
    p.textContent = msg;
    dlg.body.appendChild(p);
    dlg.foot.textContent = '';
    dlg.foot.appendChild(aiBtn('Tutup', 'btn-ghost', aiClose));
    if (onAgain) dlg.foot.appendChild(aiBtn('Ulangi', 'btn-primary', onAgain));
  }

  function aiRenderPreview(sec, values) {
    run.busy = false;
    run.values = values;
    dlg.body.textContent = '';
    sec.fields.forEach(function (f) {
      var v = values[f.path];
      var box = document.createElement('div');
      box.className = 'ai-view';
      var l = document.createElement('p');
      l.className = 'ai-view-label';
      l.textContent = f.label;
      box.appendChild(l);

      if (f.kind === 'items' || f.kind === 'subbab' || f.kind === 'refs') {
        var arr = Array.isArray(v) ? v : [];
        if (!arr.length) {
          var em = document.createElement('p');
          em.className = 'ai-view-val ai-view-empty';
          em.textContent = '(AI tidak menghasilkan isi)';
          box.appendChild(em);
        }
        arr.forEach(function (item, i) {
          var line = document.createElement('p');
          line.className = 'ai-view-val';
          if (f.kind === 'items') line.textContent = (i + 1) + '. ' + item;
          else if (f.kind === 'subbab') line.textContent = (i + 1) + '. ' + ((item && item.judul) || '(tanpa judul)') + '\n' + ((item && item.isi) || '');
          else line.textContent = (i + 1) + '. ' + [(item && item.penulis) || '', (item && item.tahun) || '', (item && item.judul) || '', (item && item.penerbit) || ''].filter(Boolean).join('. ') + '.';
          box.appendChild(line);
        });
      } else {
        var t = document.createElement('p');
        t.className = 'ai-view-val';
        t.textContent = String(v == null ? '' : v).trim() || '(AI tidak menghasilkan isi)';
        box.appendChild(t);
      }
      dlg.body.appendChild(box);
    });

    dlg.foot.textContent = '';
    dlg.foot.appendChild(aiBtn('Batal', 'btn-ghost', aiClose));
    dlg.foot.appendChild(aiBtn('Ulangi', 'btn-ghost', function () { aiGenerate(run.secId); }));
    dlg.foot.appendChild(aiBtn('Terapkan', 'btn-primary', aiApply));
  }

  function aiNormalize(f, v) {
    if (f.kind === 'items') {
      var a = Array.isArray(v) ? v : [v];
      a = a.map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean);
      return a.length ? a : [''];
    }
    if (f.kind === 'subbab') {
      var s = (Array.isArray(v) ? v : []).map(function (x) {
        return { judul: String((x && x.judul) || '').trim(), isi: String((x && x.isi) || '').trim() };
      }).filter(function (x) { return x.judul || x.isi; });
      return s.length ? s : [{ judul: '', isi: '' }];
    }
    if (f.kind === 'refs') {
      var r = (Array.isArray(v) ? v : []).map(function (x) {
        return {
          penulis: String((x && x.penulis) || '').trim(),
          tahun: String((x && x.tahun) || '').trim(),
          judul: String((x && x.judul) || '').trim(),
          penerbit: String((x && x.penerbit) || '').trim(),
          url: String((x && x.url) || '').trim()
        };
      }).filter(function (x) { return x.judul || x.penulis; });
      return r.length ? r : [{ penulis: '', tahun: '', judul: '', penerbit: '', url: '' }];
    }
    return String(v == null ? '' : v).trim();
  }

  /* Terapkan lewat jalur yang sama dengan ketikan manual: set() ke App.doc,
     lalu sentuh input/daftar di form, lalu touch() (simpan + bangun ulang PDF). */
  function aiWriteField(f, value) {
    var p = f.path;
    set(App.doc, p, value);
    aiSyncField(f);
  }

  function aiSyncField(f) {
    var p = f.path;
    if (f.kind === 'items' || f.kind === 'subbab' || f.kind === 'refs') {
      var host = $('#list-' + p.replace(/\./g, '-'));
      var lf = listField(p);
      if (host && lf) renderList(host, lf);
      return;
    }
    var node = $('#form [data-path="' + p + '"]');
    if (node && 'value' in node) node.value = get(App.doc, p) == null ? '' : get(App.doc, p);
  }

  function aiApply() {
    var sec = AI_SECTIONS[run.secId];
    var values = run.values;
    if (!sec || !values) return;

    run.snapshot = sec.fields.map(function (f) {
      return { f: f, v: JSON.parse(JSON.stringify(get(App.doc, f.path) == null ? null : get(App.doc, f.path))) };
    });

    sec.fields.forEach(function (f) {
      if (!(f.path in values)) return;
      aiWriteField(f, aiNormalize(f, values[f.path]));
    });
    updateSectionMeta();
    updateChecklist();
    touch();

    /* Status "sudah diterapkan": dari sini bisa di-urungkan. */
    dlg.title.textContent = 'Diterapkan — ' + sec.title;
    dlg.body.textContent = '';
    var p = document.createElement('p');
    p.className = 'ai-status';
    p.textContent = 'Isi bagian ini sudah diperbarui dan tersimpan. Urungkan kalau tidak jadi.';
    dlg.body.appendChild(p);

    dlg.foot.textContent = '';
    dlg.foot.appendChild(aiBtn('Selesai', 'btn-ghost', aiClose));
    dlg.foot.appendChild(aiBtn('Urungkan', 'btn-danger', function () {
      run.snapshot.forEach(function (s) { set(App.doc, s.f.path, s.v); aiSyncField(s.f); });
      updateSectionMeta();
      updateChecklist();
      touch();
      toast('Perubahan AI dibatalkan.');
      aiClose();
    }));
  }

  function aiGenerate(secId) {
    var cfg = aiLoad();
    if (!cfg.key) {
      aiOpenSettings();
      toast('Isi pengaturan AI dulu.');
      return;
    }
    if (!App.doc) { toast('Buka draf dulu.'); return; }

    /* seq: kalau diklik lagi sebelum balasan pertama tiba, yang lama diabaikan. */
    var seq = ++run.seq;

    run.secId = secId;
    aiOpen('Menulis dengan AI — ' + AI_SECTIONS[secId].title);
    aiBusyView('✨ AI sedang menulis… (maks 60 detik)');

    aiChat(cfg, AI_SYSTEM, aiPrompt(secId), 4000).then(function (r) {
      if (seq !== run.seq) return;
      if (r.error) { aiErrorView(r.error, function () { aiGenerate(secId); }); return; }
      var data = aiParseJSON(r.text);
      if (!data || typeof data !== 'object') { aiErrorView('Balasan AI bukan JSON yang valid. Tekan Ulangi.', function () { aiGenerate(secId); }); return; }
      var sec = AI_SECTIONS[secId];
      var any = sec.fields.some(function (f) {
        var v = data[f.path];
        return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0;
      });
      if (!any) { aiErrorView('AI tidak menghasilkan isi untuk bagian ini. Tekan Ulangi.', function () { aiGenerate(secId); }); return; }
      aiRenderPreview(sec, data);
    });
  }

  /* ---------- satu tombol AI untuk seluruh makalah ---------- */
  var project = { prompt: '', values: {}, busy: false, seq: 0 };

  function aiProjectFields() {
    var out = [];
    Object.keys(AI_SECTIONS).forEach(function (secId) {
      AI_SECTIONS[secId].fields.forEach(function (f) { out.push({ secId: secId, f: f }); });
    });
    return out;
  }

  function aiProjectOpen() {
    var cfg = aiLoad();
    if (!cfg.key) {
      aiOpenSettings();
      toast('Isi pengaturan AI dulu.');
      return;
    }
    if (!App.doc) { toast('Buka draf dulu.'); return; }

    aiOpen('Mulai dengan AI');

    var label = document.createElement('p');
    label.className = 'ai-status';
    label.textContent = 'Jelaskan makalah yang kamu mau. AI akan menyusun semua bagian sekaligus dari satu instruksi.';
    dlg.body.appendChild(label);

    var ta = document.createElement('textarea');
    ta.id = 'aiProjectPrompt';
    ta.className = 'ai-project-prompt';
    ta.placeholder = 'Contoh: Buat makalah SMA tentang dampak media sosial terhadap prestasi belajar. Gunakan bahasa formal dan pembahasan yang cukup lengkap.';
    ta.value = '';
    dlg.body.appendChild(ta);

    var hint = document.createElement('p');
    hint.className = 'hint ai-project-hint';
    hint.textContent = 'Isi data pribadi seperti nama, sekolah, NIM, atau dosen tetap dimasukkan manual di form agar AI tidak mengarang.';
    dlg.body.appendChild(hint);

    dlg.foot.textContent = '';
    dlg.foot.appendChild(aiBtn('Batal', 'btn-ghost', aiClose));
    var go = aiBtn('✨ Mulai', 'btn-primary', function () {
      var prompt = ta.value.trim();
      if (!prompt) { toast('Tulis prompt makalah dulu.'); ta.focus(); return; }
      aiProjectGenerate(prompt);
    });
    dlg.foot.appendChild(go);
    setTimeout(function () { ta.focus(); }, 30);
  }

  function aiProjectPreview() {
    project.busy = false;
    dlg.title.textContent = 'Hasil AI — Periksa sebelum diterapkan';
    dlg.body.textContent = '';

    Object.keys(AI_SECTIONS).forEach(function (secId) {
      var sec = AI_SECTIONS[secId];
      sec.fields.forEach(function (f) {
        var v = project.values[f.path];
        var box = document.createElement('div');
        box.className = 'ai-view';
        var l = document.createElement('p');
        l.className = 'ai-view-label';
        l.textContent = sec.title + ' · ' + f.label;
        box.appendChild(l);
        if (f.kind === 'items' || f.kind === 'subbab' || f.kind === 'refs') {
          var arr = Array.isArray(v) ? v : [];
          if (!arr.length) {
            var em = document.createElement('p');
            em.className = 'ai-view-val ai-view-empty';
            em.textContent = '(kosong)';
            box.appendChild(em);
          }
          arr.forEach(function (item, i) {
            var line = document.createElement('p');
            line.className = 'ai-view-val';
            if (f.kind === 'items') line.textContent = (i + 1) + '. ' + item;
            else if (f.kind === 'subbab') line.textContent = (i + 1) + '. ' + ((item && item.judul) || '(tanpa judul)') + '\\n' + ((item && item.isi) || '');
            else line.textContent = (i + 1) + '. ' + [(item && item.penulis) || '', (item && item.tahun) || '', (item && item.judul) || '', (item && item.penerbit) || ''].filter(Boolean).join('. ') + '.';
            box.appendChild(line);
          });
        } else {
          var t = document.createElement('p');
          t.className = 'ai-view-val';
          t.textContent = String(v == null ? '' : v).trim() || '(kosong)';
          box.appendChild(t);
        }
        dlg.body.appendChild(box);
      });
    });

    dlg.foot.textContent = '';
    dlg.foot.appendChild(aiBtn('Batal', 'btn-ghost', aiProjectCancel));
    dlg.foot.appendChild(aiBtn('Ulangi', 'btn-ghost', function () { aiProjectGenerate(project.prompt); }));
    dlg.foot.appendChild(aiBtn('Terapkan Semua', 'btn-primary', aiProjectApply));
  }

  function aiProjectGenerate(prompt) {
    var cfg = aiLoad();
    var seq = ++project.seq;
    project.prompt = prompt;
    project.values = {};
    project.busy = true;
    aiOpen('Menyusun makalah dengan AI');
    aiBusyView('✨ AI sedang menyiapkan makalah…');

    var fields = aiProjectFields();
    var i = 0;

    function next() {
      if (seq !== project.seq) return;
      if (i >= fields.length) {
        aiProjectPreview();
        return;
      }
      var item = fields[i++];
      var label = item.f.label;
      dlg.body.textContent = '';
      var p = document.createElement('p');
      p.className = 'ai-status';
      p.textContent = '✨ Menulis ' + label + ' (' + i + '/' + fields.length + ')…';
      dlg.body.appendChild(p);

      aiChat(cfg, AI_SYSTEM, aiPrompt(item.secId, prompt, project.values), 4000).then(function (r) {
        if (seq !== project.seq) return;
        if (r.error) {
          project.busy = false;
          aiErrorView(r.error, function () { aiProjectGenerate(project.prompt); });
          return;
        }
        var data = aiParseJSON(r.text);
        if (!data || typeof data !== 'object' || !(item.f.path in data)) {
          project.busy = false;
          aiErrorView('Balasan AI tidak valid untuk bagian ' + label + '. Tekan Ulangi.', function () { aiProjectGenerate(project.prompt); });
          return;
        }
        project.values[item.f.path] = aiNormalize(item.f, data[item.f.path]);
        next();
      });
    }
    next();
  }

  function aiProjectApply() {
    var fields = aiProjectFields();
    fields.forEach(function (item) {
      var value = project.values[item.f.path];
      if (value !== undefined) aiWriteField(item.f, value);
    });
    updateSectionMeta();
    updateChecklist();
    touch();
    toast('Makalah AI diterapkan dan disimpan.');
    aiClose();
  }

  function aiProjectCancel() {
    project.seq++;
    project.busy = false;
    aiClose();
  }

  /* ---------- tombol per bagian form ---------- */

  /* ---------- tombol pengaturan ---------- */
  function aiAddSettingsButtons() {
    var dash = document.querySelector('#viewDash .appbar-inner');
    if (dash && !dash.querySelector('.ai-settings-dash')) {
      var b1 = document.createElement('button');
      b1.type = 'button';
      b1.className = 'btn-ghost ai-settings-dash';
      b1.textContent = '⚙ Pengaturan AI';
      b1.addEventListener('click', aiOpenSettings);
      dash.appendChild(b1);
    }
    var ed = document.querySelector('#viewEditor .editor-appbar-inner');
    if (ed && !ed.querySelector('.ai-start-edit')) {
      var start = document.createElement('button');
      start.type = 'button';
      start.className = 'btn-primary ai-start-edit';
      start.textContent = '✨ Mulai AI';
      start.title = 'Masukkan satu prompt untuk menyusun seluruh makalah';
      start.addEventListener('click', aiProjectOpen);
      ed.appendChild(start);
    }
    if (ed && !ed.querySelector('.ai-settings-edit')) {
      var b2 = document.createElement('button');
      b2.type = 'button';
      b2.className = 'btn-mini icon-btn ai-settings-edit';
      b2.textContent = '⚙';
      b2.title = 'Pengaturan AI';
      b2.setAttribute('aria-label', 'Pengaturan AI');
      b2.addEventListener('click', aiOpenSettings);
      ed.appendChild(b2);
    }
  }

  /* ---------- init ---------- */
  function aiInit() {
    aiAddSettingsButtons();
  }

  /*自查 guard: file tetap bisa diimpor untuk cek helper tanpa browser.
     Jalankan: node -e "require('./js/ai.js')" */
  if (typeof module === 'object' && module.exports) {
    module.exports = { normBase: aiNormBase, parseJSON: aiParseJSON, httpMsg: aiHttpMsg, errMsg: aiErrMsg, endpoint: aiEndpoint, normalize: aiNormalize };
  } else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', aiInit);
  }
})();
