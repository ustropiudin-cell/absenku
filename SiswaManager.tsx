"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Kelas = { id: string; nama_kelas: string };
type Siswa = {
  id: string;
  nis: string;
  nama: string;
  kelas_id: string | null;
  aktif: boolean;
  qr_code: string;
  kelas: { nama_kelas: string } | null;
};

export default function SiswaManager({
  initialSiswa,
  kelasList,
}: {
  initialSiswa: Siswa[];
  kelasList: Kelas[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState<Siswa | null>(null);
  const [nis, setNis] = useState("");
  const [nama, setNama] = useState("");
  const [kelasId, setKelasId] = useState(kelasList[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("semua");

  function resetForm() {
    setEditing(null);
    setNis("");
    setNama("");
    setKelasId(kelasList[0]?.id ?? "");
    setError(null);
  }

  function startEdit(s: Siswa) {
    setEditing(s);
    setNis(s.nis);
    setNama(s.nama);
    setKelasId(s.kelas_id ?? "");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (editing) {
      const { error } = await supabase
        .from("siswa")
        .update({ nis, nama, kelas_id: kelasId || null })
        .eq("id", editing.id);
      setSaving(false);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase
        .from("siswa")
        .insert({ nis, nama, kelas_id: kelasId || null });
      setSaving(false);
      if (error) return setError(error.message);
    }

    resetForm();
    router.refresh();
  }

  async function handleToggleAktif(s: Siswa) {
    await supabase.from("siswa").update({ aktif: !s.aktif }).eq("id", s.id);
    router.refresh();
  }

  async function handleDelete(s: Siswa) {
    if (!confirm(`Hapus data siswa "${s.nama}"? Semua riwayat presensinya juga akan terhapus.`)) return;
    await supabase.from("siswa").delete().eq("id", s.id);
    router.refresh();
  }

  const filtered = initialSiswa.filter((s) => {
    const matchQuery =
      s.nama.toLowerCase().includes(query.toLowerCase()) ||
      s.nis.toLowerCase().includes(query.toLowerCase());
    const matchKelas = filterKelas === "semua" || s.kelas_id === filterKelas;
    return matchQuery && matchKelas;
  });

  return (
    <div className="p-8 grid lg:grid-cols-[320px_1fr] gap-6">
      {/* Form tambah/edit */}
      <div className="rounded-lg border border-ink-900/10 bg-white p-5 h-fit">
        <h2 className="text-sm font-semibold text-ink-950">
          {editing ? "Ubah data siswa" : "Tambah siswa"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-950/60 mb-1">NIS</label>
            <input
              required
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm focus-ring"
              placeholder="Contoh: 2024001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-950/60 mb-1">Nama lengkap</label>
            <input
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm focus-ring"
              placeholder="Nama siswa"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-950/60 mb-1">Kelas</label>
            <select
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm focus-ring bg-white"
            >
              <option value="">Belum ditentukan</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-ink-950 text-chalk-50 text-sm font-medium py-2 hover:bg-ink-900 disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : editing ? "Simpan perubahan" : "Tambah siswa"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-ink-900/15 text-sm px-3 hover:bg-ink-950/5"
              >
                Batal
              </button>
            )}
          </div>
        </form>
        <p className="text-xs text-ink-950/40 mt-3">
          Kode QR dibuat otomatis saat siswa ditambahkan. Cetak kartunya di
          halaman <span className="font-medium">Kartu QR</span>.
        </p>
      </div>

      {/* Daftar siswa */}
      <div>
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau NIS…"
            className="rounded-md border border-ink-900/15 px-3 py-2 text-sm w-56 focus-ring bg-white"
          />
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="rounded-md border border-ink-900/15 px-3 py-2 text-sm focus-ring bg-white"
          >
            <option value="semua">Semua kelas</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
          <span className="ml-auto self-center text-xs text-ink-950/40">
            {filtered.length} siswa
          </span>
        </div>

        <div className="rounded-lg border border-ink-900/10 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-left text-ink-950/50">
                <th className="px-5 py-3 font-medium">NIS</th>
                <th className="px-5 py-3 font-medium">Nama</th>
                <th className="px-5 py-3 font-medium">Kelas</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-950/40">
                    Belum ada siswa yang cocok.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-ink-950/60">{s.nis}</td>
                  <td className="px-5 py-3 text-ink-950 font-medium">{s.nama}</td>
                  <td className="px-5 py-3 text-ink-950/70">{s.kelas?.nama_kelas ?? "—"}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleAktif(s)}
                      className={`text-xs font-medium rounded-sm px-2 py-0.5 ${
                        s.aktif
                          ? "bg-green-100 text-green-700"
                          : "bg-ink-950/10 text-ink-950/50"
                      }`}
                    >
                      {s.aktif ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right space-x-3">
                    <button
                      onClick={() => startEdit(s)}
                      className="text-xs font-medium text-ink-950/60 hover:text-ink-950"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
