# Template Makalah SMA

Cover dengan **judul di atas logo** dan **footer tahun ajaran** di bagian bawah.

## Isi Folder
- `makalah.tex` — versi LaTeX (compile ke PDF)
- `makalah.html` — versi HTML/CSS (print ke PDF dari browser)
- `assets/` — taruh logo di sini, mis. `assets/logo.png`

## Data yang Perlu Diganti

### Versi LaTeX (`makalah.tex`)
Semua data ada di blok `GANTI DATA DI BAWAH INI` (bagian atas file):

| Perintah | Contoh isi |
|---|---|
| `\judulMakalah` | PENGARUH MEDIA SOSIAL ... |
| `\namaSiswa` / `\kelasSiswa` / `\nomorAbsen` | data siswa |
| `\namaSekolah` / `\namaGuru` | data sekolah |
| `\tahunAjaran` | 2024/2025 |
| `\logoFile` | `assets/logo.png` |

Compile:
```bash
pdflatex makalah.tex    # jalankan 2x agar daftar isi benar
```

### Versi HTML (`makalah.html`)
1. Buka file di browser.
2. Cari teks placeholder (mis. `Nama Lengkap Siswa`, `SMA Negeri 1 Contoh`, `2024/2025`) lalu ganti.
3. Untuk logo: hapus komentar pada baris `<img src="assets/logo.png" ...>` dan hapus teks "Logo Sekolah".
4. Print / Save as PDF: `Ctrl+P` → pilih **Save as PDF**, ukuran **A4**, matikan header/footer browser.

## Mencetak ke PDF dengan Cepat (opsi)
Hasil paling rapi biasanya dari LaTeX. Jika tidak ada LaTeX, versi HTML sudah cukup baik
untuk dikumpulkan karena margin, font, dan ukuran sudah diatur ke A4.
