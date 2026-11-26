# 🥽 EduVision AR Pro — Media Pembelajaran Interaktif SD (Kelas 1–6)

**EduVision AR Pro** adalah aplikasi web media pembelajaran interaktif bergaya **Apple VisionOS** untuk siswa Sekolah Dasar (Kelas 1–6). Anak dapat masuk ke dalam layar melalui kamera AR (*mirrored*) atau dunia virtual 2D, lalu **mencubit, memegang, dan memindahkan objek jawaban** dari jarak jauh menggunakan gerakan tangan (MediaPipe Hands) maupun mouse/layar sentuh.

## ✨ Fitur Utama
- **Kamera AR & 3 Dunia Virtual 2D**: Latar webcam *mirrored* layar penuh dengan transisi mulus ke dunia virtual **Luar Angkasa**, **Bawah Laut**, dan **Hutan Ajaib** (otomatis aktif jika kamera tidak tersedia).
- **Pelacakan Tangan Holografik (Pinch-to-Grab)**: Menggunakan **MediaPipe Hands** untuk mendeteksi hingga 2 tangan secara bersamaan, lengkap dengan kerangka tangan tipis VisionOS, efek riak energi saat mencubit, fitur **Magnet Assist**, dan pengaturan sensitivitas cubitan.
- **3 Mode Permainan**:
  1. **Single-Screen**: Belajar mandiri dengan 1 Portal Jawaban.
  2. **Split-Screen Duel**: 2 anak bermain berdampingan di depan 1 kamera (Pemain 1 vs Pemain 2).
  3. **Mode Klasifikasi**: Memilah objek melayang ke Portal Kategori Kiri vs Portal Kategori Kanan.
- **Mesin Adaptif Python (Pyodide)**: Menjalankan `python/adaptive_engine.py` langsung di browser melalui WebAssembly untuk membangkitkan soal kurikulum SD Kelas 1–6 (Matematika, IPA, Bahasa Inggris, Campuran) dengan **Dynamic Difficulty Adjustment (DDA)**.
- **Audio & Aksesibilitas**: Efek suara Web Audio API + pembaca soal otomatis Bahasa Indonesia (`SpeechSynthesis`).
- **Rapor Mini & Inspektor Python**: Rekap nilai tersimpan otomatis di `localStorage`, dilengkapi panel inspeksi kode & log Python secara langsung.

## 📁 Struktur Folder
```text
eduvision-ar-pro/
├── index.html                 # Struktur utama aplikasi & HUD VisionOS
├── vercel.json                # Konfigurasi deployment Vercel (Permissions-Policy kamera)
├── package.json               # Metadata proyek & script server lokal
├── .gitignore                 # Daftar file yang diabaikan Git
├── README.md                  # Dokumentasi proyek
├── css/
│   ├── variables.css          # Token warna, glassmorphism, dan tipografi
│   ├── style.css              # Tata letak responsif mobile-first & panel HUD
│   └── animations.css         # Animasi transisi, pulse, dan umpan balik visual
├── js/
│   ├── main.js                # Orkestrator aplikasi, state, dan game loop
│   ├── camera-hands.js        # Webcam AR, MediaPipe Hands, & Pointer Events
│   ├── canvas-engine.js       # Mesin visualisasi 2D, dunia virtual, fisika objek & partikel
│   ├── audio-engine.js        # Synthesizer efek suara & narator Bahasa Indonesia
│   ├── python-bridge.js       # Jembatan Pyodide (WebAssembly) + fallback otomatis
│   └── storage.js             # Penyimpanan skor, Rapor Mini, & pengaturan
└── python/
    └── adaptive_engine.py     # Algoritma kurikulum SD 1-6 & Dynamic Difficulty Adjustment
```

## 🚀 Cara Menjalankan di Komputer Lokal
Karena aplikasi menggunakan ES Modules (`type="module"`) dan `fetch()` untuk memuat skrip Python, jalankan melalui web server lokal (jangan buka langsung dengan klik ganda `file://`):

**Opsi 1 — Menggunakan Node.js:**
```bash
npm run dev
```
Lalu buka `http://localhost:3000`.

**Opsi 2 — Menggunakan Python:**
```bash
python -m http.server 3000
```
Lalu buka `http://localhost:3000`.

## 🌐 Cara Deploy ke GitHub & Vercel
1. Buat repositori baru di [GitHub](https://github.com/new) (misalnya `eduvision-ar-pro`).
2. Ekstrak seluruh isi folder `eduvision-ar-pro` dan unggah (push) ke repositori GitHub tersebut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: EduVision AR Pro"
   git branch -M main
   git remote add origin https://github.com/USERNAME/eduvision-ar-pro.git
   git push -u origin main
   ```
3. Buka [Vercel](https://vercel.com), klik **Add New Project**, pilih repositori `eduvision-ar-pro`, lalu klik **Deploy**.
4. Tidak perlu konfigurasi *Build Command* khusus karena 100% statis. Vercel otomatis menyediakan **HTTPS**, sehingga kamera AR dan pelacakan tangan MediaPipe langsung berjalan di laptop, tablet, maupun ponsel!
