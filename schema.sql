-- =========================================================
-- SKEMA DATABASE: Aplikasi Presensi Online (Admin & Guru)
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. PROFILES (akun Admin & Guru, 1:1 dengan auth.users)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'guru' check (role in ('admin', 'guru')),
  created_at timestamptz not null default now()
);

-- Saat user baru dibuat di auth.users, otomatis buat row profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'guru')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2. KELAS & MAPEL
-- ---------------------------------------------------------
create table if not exists public.kelas (
  id uuid primary key default gen_random_uuid(),
  nama_kelas text not null,
  wali_kelas_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.mapel (
  id uuid primary key default gen_random_uuid(),
  nama_mapel text not null,
  kode text,
  created_at timestamptz not null default now()
);

-- Jadwal: mapel apa, di kelas mana, diajar guru mana
create table if not exists public.jadwal (
  id uuid primary key default gen_random_uuid(),
  kelas_id uuid not null references public.kelas(id) on delete cascade,
  mapel_id uuid not null references public.mapel(id) on delete cascade,
  guru_id uuid not null references public.profiles(id) on delete cascade,
  hari text not null check (hari in ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')),
  jam_mulai time not null,
  jam_selesai time not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. SISWA (tidak login, hanya data + kode QR unik)
-- ---------------------------------------------------------
create table if not exists public.siswa (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  nama text not null,
  kelas_id uuid references public.kelas(id) on delete set null,
  qr_code text not null unique default encode(gen_random_bytes(12), 'hex'),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_siswa_kelas on public.siswa(kelas_id);
create index if not exists idx_siswa_qr on public.siswa(qr_code);

-- ---------------------------------------------------------
-- 4. PRESENSI (hasil scan QR)
-- ---------------------------------------------------------
create table if not exists public.presensi (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references public.siswa(id) on delete cascade,
  kelas_id uuid not null references public.kelas(id) on delete cascade,
  mapel_id uuid references public.mapel(id) on delete set null,
  guru_id uuid not null references public.profiles(id) on delete cascade,
  tanggal date not null default current_date,
  waktu_scan timestamptz not null default now(),
  status text not null default 'hadir' check (status in ('hadir','terlambat','izin','sakit','alpa')),
  keterangan text,
  created_at timestamptz not null default now(),
  unique (siswa_id, mapel_id, tanggal)
);

create index if not exists idx_presensi_tanggal on public.presensi(tanggal);
create index if not exists idx_presensi_kelas on public.presensi(kelas_id);
create index if not exists idx_presensi_siswa on public.presensi(siswa_id);

-- ---------------------------------------------------------
-- 5. HELPER FUNCTION: cek role user yang sedang login
-- ---------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.kelas enable row level security;
alter table public.mapel enable row level security;
alter table public.jadwal enable row level security;
alter table public.siswa enable row level security;
alter table public.presensi enable row level security;

-- PROFILES: semua user login boleh baca semua profile (untuk tampilkan nama guru/wali kelas),
-- tapi hanya admin yang boleh insert/update/delete profil orang lain.
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- KELAS & MAPEL & JADWAL: semua user login boleh baca. Hanya admin boleh ubah.
create policy "kelas_select" on public.kelas for select using (auth.role() = 'authenticated');
create policy "kelas_admin_write" on public.kelas for all using (public.is_admin()) with check (public.is_admin());

create policy "mapel_select" on public.mapel for select using (auth.role() = 'authenticated');
create policy "mapel_admin_write" on public.mapel for all using (public.is_admin()) with check (public.is_admin());

create policy "jadwal_select" on public.jadwal for select using (auth.role() = 'authenticated');
create policy "jadwal_admin_write" on public.jadwal for all using (public.is_admin()) with check (public.is_admin());

-- SISWA: semua user login boleh baca (guru perlu cari siswa saat scan). Hanya admin boleh ubah data siswa.
create policy "siswa_select" on public.siswa for select using (auth.role() = 'authenticated');
create policy "siswa_admin_write" on public.siswa for all using (public.is_admin()) with check (public.is_admin());

-- PRESENSI: guru boleh baca semua (untuk laporan) & insert presensi dengan guru_id = dirinya sendiri.
-- Admin boleh melakukan apapun (termasuk edit/hapus untuk koreksi).
create policy "presensi_select" on public.presensi for select using (auth.role() = 'authenticated');
create policy "presensi_insert_own" on public.presensi
  for insert with check (guru_id = auth.uid());
create policy "presensi_update_admin" on public.presensi
  for update using (public.is_admin());
create policy "presensi_delete_admin" on public.presensi
  for delete using (public.is_admin());

-- ---------------------------------------------------------
-- 7. AKUN ADMIN PERTAMA
-- ---------------------------------------------------------
-- 1) Daftar dulu lewat halaman /login (tab "Buat akun") memakai email admin kamu.
-- 2) Setelah itu jalankan query ini (ganti email-nya) supaya rolenya jadi admin:
--
-- update public.profiles set role = 'admin' where email = 'admin@sekolahmu.sch.id';
