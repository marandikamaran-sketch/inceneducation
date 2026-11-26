# EduVision AR Pro — Panduan Deploy GitHub Pages & Vercel

Proyek pada kode yang diberikan adalah situs statis (HTML, CSS, dan JavaScript di browser). Tidak memerlukan Node.js, database, server API, atau proses build.

## Struktur folder

Simpan seluruh kode HTML EduVision yang diberikan sebagai `index.html`, lalu susun folder seperti ini:

```text
eduvision-ar-pro/
├── index.html       # seluruh HTML/CSS/JavaScript aplikasi
├── .nojekyll        # file kosong untuk GitHub Pages
└── README.md
```

Penting: nama file harus tepat `index.html` dan berada di folder paling atas (root), bukan di dalam folder `src`, `public`, atau folder lain.

## Deploy ke GitHub Pages

1. Buat repositori GitHub baru. Untuk GitHub Free, gunakan repositori Public.
2. Unggah `index.html`, `.nojekyll`, dan `README.md` ke root repositori.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`, kemudian klik **Save**.
6. Tunggu workflow Pages selesai, lalu buka alamat situs yang ditampilkan di halaman Pages.

Setiap kali `index.html` diperbarui dan di-push ke branch `main`, GitHub Pages akan menerbitkan pembaruan.

## Deploy ke Vercel

1. Masuk ke Vercel dan pilih **Add New → Project**.
2. Impor repositori GitHub yang berisi `index.html`.
3. Pada pengaturan proyek, pilih **Framework Preset: Other**.
4. Biarkan **Build Command** kosong.
5. Biarkan **Install Command** kosong.
6. Isi **Output Directory** dengan `.` (titik) bila diminta; jika Vercel sudah mengenali root secara otomatis, biarkan nilai default yang sesuai.
7. Klik **Deploy**.

Setelah repositori tersambung, commit baru ke branch produksi yang dipilih akan memicu deployment baru.

## Catatan penting untuk fitur kamera

- Akses kamera browser membutuhkan secure context (HTTPS, atau localhost saat pengembangan). Alamat GitHub Pages dan Vercel menggunakan HTTPS.
- Saat pertama kali menjalankan mode Kamera AR, izinkan akses kamera pada browser.
- Aplikasi memuat Tailwind CSS, Google Fonts, MediaPipe Hands, dan Pyodide dari CDN. Perangkat harus terhubung ke internet agar semua pustaka tersebut dapat dimuat.
- Jika kamera tidak tersedia atau izin ditolak, gunakan tombol **Mulai Dunia Virtual 2D**. Interaksi mouse dan layar sentuh tetap dapat digunakan.
- GitHub Pages dan Vercel hanya menayangkan file situs. Riwayat rapor pada kode awal disimpan di `localStorage` browser/perangkat, bukan disinkronkan ke akun guru atau perangkat lain.

## Jangan lakukan ini

- Jangan mengganti nama `index.html` menjadi `home.html`.
- Jangan meletakkan file utama hanya di folder `src`.
- Jangan mengisi Build Command dengan `npm run build` karena proyek ini tidak memiliki proses build.
- Jangan menambahkan `package.json` atau framework baru hanya untuk menayangkan HTML ini.
