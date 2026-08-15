# Presensi — Aplikasi Presensi Online (QR Code)

Aplikasi presensi berbasis QR Code untuk sekolah. Guru memindai kartu QR
siswa untuk mencatat kehadiran; admin mengelola siswa, guru, kelas, mapel,
dan rekap laporan. Siswa **tidak login** — mereka cukup punya kartu QR.

**Stack:** Next.js 14 (App Router) di Vercel + Supabase (Auth, Postgres, RLS).

---

## 1. Siapkan Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, salin seluruh isi file `supabase/schema.sql`, lalu jalankan (Run).
   Ini akan membuat semua tabel, trigger, dan aturan keamanan (Row Level Security).
3. Buka **Project Settings → API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan pernah dipakai di client!)
4. (Opsional tapi disarankan) Di **Authentication → Providers → Email**, matikan
   "Confirm email" saat masih tahap uji coba supaya akun langsung aktif tanpa
   verifikasi email.

### Buat akun admin pertama

1. Jalankan aplikasi (lihat langkah 3), buka halaman **Buat akun**, daftar
   dengan email admin kamu. Akun ini otomatis mendapat peran "guru".
2. Kembali ke **SQL Editor** Supabase, jalankan:
   ```sql
   update public.profiles set role = 'admin' where email = 'emailkamu@sekolah.sch.id';
   ```
3. Login ulang. Kamu sekarang punya akses penuh sebagai Admin (menu Siswa,
   Kartu QR, Kelas & Mapel, Akun Guru akan muncul di sidebar).

Setelah itu, akun guru lain **tidak perlu mendaftar sendiri** — admin
membuatkannya langsung dari halaman **Akun Guru** di dashboard.

---

## 2. Jalankan secara lokal

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan nilai dari Supabase (langkah 1.3)
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

> Kamera untuk pindai QR butuh HTTPS atau `localhost` — jadi untuk uji coba
> lokal, `localhost` sudah cukup. Untuk uji coba dari HP di jaringan yang
> sama, gunakan HTTPS (lihat catatan di bagian Troubleshooting).

---

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "Aplikasi presensi online siap deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti `USERNAME/NAMA-REPO` dengan repository GitHub kamu (buat dulu repo
kosong di GitHub jika belum ada).

---

## 4. Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) dan import repository GitHub yang baru dipush.
2. Vercel otomatis mendeteksi framework Next.js — tidak perlu ubah build settings.
3. Di bagian **Environment Variables**, tambahkan tiga variabel yang sama seperti `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Klik **Deploy**. Setelah selesai, aplikasi bisa diakses lewat domain `*.vercel.app` (otomatis HTTPS, sehingga kamera QR scanner bisa langsung dipakai dari HP).

---

## Struktur fitur

| Halaman | Peran | Fungsi |
|---|---|---|
| `/login` | Semua | Masuk / buat akun (akun baru = guru) |
| `/dashboard` | Admin & Guru | Ringkasan statistik hari ini |
| `/dashboard/presensi` | Admin & Guru | Pindai QR untuk mencatat kehadiran |
| `/dashboard/laporan` | Admin & Guru | Rekap presensi + ekspor Excel/PDF |
| `/dashboard/siswa` | Admin | Kelola data siswa |
| `/dashboard/kartu` | Admin | Cetak kartu QR siswa |
| `/dashboard/kelas` | Admin | Kelola kelas, mapel, jadwal |
| `/dashboard/guru` | Admin | Buat/hapus akun guru |

## Alur pemakaian harian

1. **Admin** menambahkan siswa di halaman **Siswa**, lalu mencetak kartu QR
   mereka di halaman **Kartu QR** (bisa langsung print dari browser).
2. **Guru** membuka halaman **Presensi**, memilih kelas + mata pelajaran,
   menekan "Mulai pindai", lalu memindai kartu QR tiap siswa satu per satu.
3. Data otomatis masuk ke **Laporan**, bisa difilter per tanggal/kelas/mapel
   dan diekspor ke Excel atau PDF kapan saja.

## Troubleshooting

- **Kamera tidak muncul saat pindai** — pastikan diakses lewat HTTPS (Vercel
  sudah otomatis HTTPS) dan browser mendapat izin akses kamera.
- **"Sudah presensi hari ini"** — satu siswa hanya bisa presensi sekali per
  mata pelajaran per hari (dicegah otomatis oleh database).
- **Tidak bisa membuat akun guru baru** — pastikan environment variable
  `SUPABASE_SERVICE_ROLE_KEY` sudah diisi dengan benar di Vercel.
- **Menu admin tidak muncul** — pastikan sudah menjalankan query
  `update public.profiles set role = 'admin' ...` di SQL Editor Supabase.
