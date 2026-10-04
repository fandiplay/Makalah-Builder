/* store.js: state makalah di localStorage + dokumen default. */

const DB_KEY = 'makalah:v1';
const FORMAT = { paper: 'A4', font: 'Times New Roman', size: 12, spacing: 1.5, margin: { top: 3, right: 3, bottom: 3, left: 4 } };

const PENGANTAR_TEMPLATE = [
  'Puji syukur kami panjatkan ke hadirat Allah SWT atas limpahan rahmat dan karunia-Nya sehingga makalah yang berjudul "{{judul}}" ini dapat kami selesaikan dengan baik. Shalawat serta salam semoga senantiasa tercurah kepada Nabi Muhammad SAW, keluarga, para sahabat, dan seluruh umatnya hingga akhir zaman.',
  'Makalah ini disusun untuk memenuhi tugas mata kuliah {{matkul}} dengan dosen pengampu {{dosen}}. Kami menyampaikan terima kasih kepada beliau atas bimbingan, arahan, dan koreksi selama proses penyusunan makalah ini.',
  'Kami juga menyampaikan terima kasih kepada seluruh pihak yang telah membantu, baik berupa pemikiran, referensi, maupun dukungan, sehingga makalah ini dapat terselesaikan. Kami menyadari bahwa makalah ini masih jauh dari sempurna. Oleh karena itu, kritik dan saran yang membangun sangat kami harapkan demi perbaikan pada penulisan berikutnya.'
].join('\n\n');

function uid() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function todayID() {
  try {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return new Date().toDateString();
  }
}

function newDoc() {
  return {
    id: uid(),
    updatedAt: Date.now(),
    judul: '', subjudul: '',
    matkul: '', dosen: '',
    logo: null,
    anggota: [{ nama: '', nim: '' }],
    prodi: '', fakultas: '',
    institusi: 'Institut Agama Islam Negeri Antasari Banjarmasin',
    kota: 'Banjarmasin',
    tahun: String(new Date().getFullYear()),
    kata: { basmalah: true, teks: PENGANTAR_TEMPLATE, tanggal: todayID(), penulis: 'Tim Penulis' },
    bab1: { latar: '', rumusan: [''], tujuan: [''], manfaat: '' },
    bab2: { pref: 'alpha', subbab: [{ judul: '', isi: '' }] },
    bab3: { kesimpulan: '', saran: '' },
    pustaka: [{ penulis: '', tahun: '', judul: '', penerbit: '', url: '' }]
  };
}

/* localStorage bisa menolak (mode privat, kuota penuh, iframe tanpa storage).
   Baca/write dibungkus try-catch dan jatuh ke memori: draf tetap bisa diedit,
   app.js memberi tahu lewat Store.degraded saat penyimpanan ditolak. */
const Store = {
  degraded: false,
  mem: { docs: {}, current: null },

  read() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      const db = raw ? JSON.parse(raw) : null;
      return db && db.docs ? db : { docs: {}, current: null };
    } catch (e) {
      this.degraded = true;
      return this.mem;
    }
  },

  write(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      return true;
    } catch (e) {
      this.degraded = true;
      this.mem = db;
      return false;
    }
  },

  list() {
    return Object.values(this.read().docs)
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },

  get(id) { return this.read().docs[id] || null; },

  put(doc) {
    const db = this.read();
    doc.updatedAt = Date.now();
    db.docs[doc.id] = doc;
    db.current = doc.id;
    return this.write(db);
  },

  remove(id) {
    const db = this.read();
    delete db.docs[id];
    if (db.current === id) db.current = Object.keys(db.docs)[0] || null;
    this.write(db);
  }
};