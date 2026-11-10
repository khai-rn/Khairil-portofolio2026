# Dokumentasi Upgrade — Personal Journal & Blog System ("A Journal of Becoming")

Sistem Jurnal Pribadi dan Blog editorial yang terintegrasi secara mulus ke dalam website portofolio pribadi Khairil Rahman (`https://khairil-portofolio2026.vercel.app`).

---

## 1. Filosofi & Konsep
- **Nama Jurnal:** *"A Journal of Becoming"*
- **Tagline:** *"Documenting life, one day at a time."*
- **Tujuan:** Dokumentasi kehidupan sehari-hari, pemikiran pribadi, apa yang dipelajari, refleksi hidup, dan arsip fotografi.
- **Desain:** *Editorial Minimalism* dengan kartu kaca (*liquid-glass*), tipografi bersih (`Outfit` & `DM Sans`), dan visual responsif penuh.
- **Non-Destructive:** 100% tata letak portofolio asli (`index.html`, `all-about-me.html`, `design.html`, dll.) tetap utuh dan terlindungi.

---

## 2. Struktur Rute & Halaman

### A. Halaman Publik (Tanpa Login — Terbuka untuk Semua Pengunjung)
| URL / File | Deskripsi |
| :--- | :--- |
| `index.html#blog` | Bagian blog di beranda dengan filter kategori dinamis & pencarian real-time |
| `journal.html` | Halaman katalog jurnal lengkap dengan **Tampilan Grid** dan **Tampilan Kalender** |
| `blog-post.html?slug=...` | Pembaca artikel detail dinamis dengan galeri foto, waktu baca, mood, dan share link |

### B. Halaman Admin Terproteksi (Khusus Pemilik Jurnal)
| URL / File | Deskripsi |
| :--- | :--- |
| `admin/blog/login.html` | Autentikasi aman pemilik jurnal via Supabase Auth |
| `admin/blog/index.html` | Dasbor ringkasan: statistik total, publik, draf, privat, tabel entri, dan tab kalender |
| `admin/blog/editor.html` | Editor Rich Text (Quill/Tiptap), panduan refleksi one-click, upload cover & galeri foto |
| `admin/blog/media.html` | **Media Library:** Manajemen cloud storage foto, auto-kompresi WebP, relasi jurnal |

---

## 3. Fitur Utama

### 1. Kalender Jurnal Interaktif (*Personal Journal Calendar*)
- Tampilan bulanan dengan navigasi bulan (`◀` / `▶`), tombol **"Hari Ini"**, dan tahun.
- Indikator titik tanggal:
  - **Titik Cyan:** Tanggal memiliki catatan jurnal.
  - **Titik Amber:** Tanggal memiliki dokumentasi foto.
- **Perilaku Klik Tanggal:**
  - Jika belum ada entri: menampilkan pesan kosong yang rapi + tombol *"Tulis Sesuatu di Tanggal Ini"* (untuk admin).
  - Jika ada entri: menampilkan feed kronologis tanggal tersebut lengkap dengan foto sampul, kategori, kutipan, dan tombol buka artikel.
- Tersedia di halaman publik (`journal.html`) dan panel admin (`admin/blog/index.html`).

### 2. Cloud Storage & Optimasi Foto WebP
- File disimpan di **Supabase Storage** (bukan di database SQL).
- Folder otomatis rapi: `[content_type]/[YYYY]/[MM]/[timestamp]_[id].webp`.
- **Image Optimizer:** Kompresi otomatis file kamera besar menjadi WebP ringan (~200–400KB) dengan penghematan ukuran hingga 80–90%, lengkap dengan thumbnail 480px.
- **Pemisahan Bucket:**
  - `public-blog-images` untuk foto publik & galeri umum (Global CDN).
  - `private-blog-images` untuk foto catatan privat (Signed URL sementara).

### 3. Sistem Privasi & Keamanan (RLS)
- **🌍 PUBLIK:** Terbuka untuk semua pembaca tanpa login.
- **🔗 UNLISTED:** Hanya bisa diakses melalui URL khusus dengan token rahasia (*unguessable*). Tidak muncul di pencarian atau katalog publik.
- **🔒 PRIVAT:** Terkunci di level database Postgres via Row-Level Security (RLS). Pengunjung umum menerima 0 baris data jika mencoba mengakses.

---

## 4. Panduan Menjalankan Skrip Database di Supabase

Jika belum menjalankan skrip migrasi di Supabase:

1. Buka [Supabase SQL Editor](https://supabase.com/dashboard/project/zaepmjogneoloqlbrahm/sql).
2. Jalankan isi file `supabase/migrations/20261110_journal_system.sql`.
3. Jalankan isi file `supabase/storage_setup.sql`.
4. Jalankan isi file `supabase/migrations/20261111_media_system_upgrade.sql`.

---

## 5. Deployment ke Vercel

Proyek ini dibangun sebagai situs web statis murni tanpa ketergantungan build runner berat (*zero-config static deployment*).

Untuk memperbarui ke Vercel:
```bash
git add .
git commit -m "Upgrade: Add Personal Journal system with Calendar, Media Library, and Supabase integration"
git push origin main
```
Vercel akan langsung mendeteksi commit baru di GitHub dan melakukan deployment otomatis dalam hitungan detik!

