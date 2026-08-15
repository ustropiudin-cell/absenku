"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Kelas = { id: string; nama_kelas: string };
type Mapel = { id: string; nama_mapel: string };
type Scanned = {
  id: string;
  nama: string;
  nis: string;
  waktu: string;
  status: "hadir" | "duplikat" | "gagal";
  pesan?: string;
};

export default function PresensiScanner({
  kelasList,
  mapelList,
  guruId,
}: {
  kelasList: Kelas[];
  mapelList: Mapel[];
  guruId: string;
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [kelasId, setKelasId] = useState(kelasList[0]?.id ?? "");
  const [mapelId, setMapelId] = useState(mapelList[0]?.id ?? "");
  const [scanning, setScanning] = useState(false);
  const [totalSiswaKelas, setTotalSiswaKelas] = useState(0);
  const [hasil, setHasil] = useState<Scanned[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      if (!kelasId) return setTotalSiswaKelas(0);
      const { count } = await supabase
        .from("siswa")
        .select("*", { count: "exact", head: true })
        .eq("kelas_id", kelasId)
        .eq("aktif", true);
      if (!cancelled) setTotalSiswaKelas(count ?? 0);
    }
    loadCount();
    return () => {
      cancelled = true;
    };
  }, [kelasId]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    setCameraError(null);
    if (!kelasId || !mapelId) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const instance = new Html5Qrcode("qr-reader");
    scannerRef.current = instance;

    try {
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => handleScan(decodedText),
        () => {
          /* ignore per-frame decode errors */
        }
      );
      setScanning(true);
    } catch (err: any) {
      setCameraError(
        "Tidak bisa mengakses kamera. Pastikan izin kamera diberikan dan situs diakses lewat HTTPS."
      );
    }
  }

  async function stopScanner() {
    const instance = scannerRef.current;
    if (instance) {
      try {
        await instance.stop();
        instance.clear();
      } catch {
        // sudah berhenti, aman diabaikan
      }
    }
    setScanning(false);
  }

  async function handleScan(qrCode: string) {
    if (busyRef.current) return;
    busyRef.current = true;

    const { data: siswa } = await supabase
      .from("siswa")
      .select("id, nis, nama, kelas_id, aktif")
      .eq("qr_code", qrCode)
      .maybeSingle();

    if (!siswa || !siswa.aktif) {
      pushHasil({ id: qrCode, nama: "Tidak dikenali", nis: "—", waktu: jam(), status: "gagal", pesan: "Kode QR tidak terdaftar" });
      setTimeout(() => (busyRef.current = false), 1200);
      return;
    }

    if (siswa.kelas_id !== kelasId) {
      pushHasil({ id: siswa.id, nama: siswa.nama, nis: siswa.nis, waktu: jam(), status: "gagal", pesan: "Bukan siswa kelas ini" });
      setTimeout(() => (busyRef.current = false), 1200);
      return;
    }

    const { error } = await supabase.from("presensi").insert({
      siswa_id: siswa.id,
      kelas_id: kelasId,
      mapel_id: mapelId,
      guru_id: guruId,
      tanggal: today,
      status: "hadir",
    });

    if (error) {
      const duplikat = error.code === "23505";
      pushHasil({
        id: siswa.id,
        nama: siswa.nama,
        nis: siswa.nis,
        waktu: jam(),
        status: duplikat ? "duplikat" : "gagal",
        pesan: duplikat ? "Sudah presensi hari ini" : error.message,
      });
    } else {
      pushHasil({ id: siswa.id, nama: siswa.nama, nis: siswa.nis, waktu: jam(), status: "hadir" });
    }

    setTimeout(() => (busyRef.current = false), 1200);
  }

  function pushHasil(item: Scanned) {
    setHasil((prev) => [item, ...prev].slice(0, 30));
  }

  function jam() {
    return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  const jumlahHadir = new Set(hasil.filter((h) => h.status === "hadir").map((h) => h.id)).size;

  return (
    <div className="p-8 grid lg:grid-cols-[380px_1fr] gap-6">
      <div className="space-y-4">
        <div className="rounded-lg border border-ink-900/10 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ink-950">Sesi presensi</h2>
          <div>
            <label className="block text-xs font-medium text-ink-950/60 mb-1">Kelas</label>
            <select
              value={kelasId}
              disabled={scanning}
              onChange={(e) => setKelasId(e.target.value)}
              className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm bg-white focus-ring disabled:opacity-50"
            >
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-950/60 mb-1">Mata pelajaran</label>
            <select
              value={mapelId}
              disabled={scanning}
              onChange={(e) => setMapelId(e.target.value)}
              className="w-full rounded-md border border-ink-900/15 px-3 py-2 text-sm bg-white focus-ring disabled:opacity-50"
            >
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama_mapel}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-ink-950/40">
            Tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {!scanning ? (
            <button
              onClick={startScanner}
              disabled={!kelasId || !mapelId}
              className="w-full rounded-md bg-ink-950 text-chalk-50 text-sm font-medium py-2.5 hover:bg-ink-900 disabled:opacity-50"
            >
              Mulai pindai
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="w-full rounded-md border border-red-200 text-red-600 text-sm font-medium py-2.5 hover:bg-red-50"
            >
              Hentikan pindai
            </button>
          )}
          {cameraError && <p className="text-xs text-red-600">{cameraError}</p>}
        </div>

        <div className="rounded-lg border border-ink-900/10 bg-white p-5">
          <div id="qr-reader" className="rounded-md overflow-hidden bg-ink-950/5 min-h-[220px]" />
          {!scanning && (
            <p className="text-xs text-ink-950/40 text-center mt-3">
              Kamera akan aktif setelah kamu menekan &ldquo;Mulai pindai&rdquo;.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-ink-900/10 bg-white p-5 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-950/50">Sudah hadir</span>
          <span className="font-display text-xl font-semibold text-ink-950">
            {jumlahHadir} <span className="text-ink-950/40 text-sm font-sans font-normal">/ {totalSiswaKelas}</span>
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ink-950 mb-3">Hasil pindai</h2>
        <div className="rounded-lg border border-ink-900/10 bg-white overflow-hidden">
          {hasil.length === 0 ? (
            <p className="text-sm text-ink-950/40 px-5 py-10 text-center">
              Belum ada yang dipindai pada sesi ini.
            </p>
          ) : (
            <ul className="divide-y divide-ink-900/5">
              {hasil.map((h, i) => (
                <li key={`${h.id}-${i}`} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-950">{h.nama}</p>
                    <p className="text-xs text-ink-950/40">{h.nis !== "—" ? `NIS ${h.nis} · ` : ""}{h.waktu}</p>
                  </div>
                  <span
                    className={`text-xs font-medium rounded-sm px-2 py-0.5 ${
                      h.status === "hadir"
                        ? "bg-green-100 text-green-700"
                        : h.status === "duplikat"
                        ? "bg-amber-400/15 text-amber-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {h.status === "hadir" ? "Hadir dicatat" : h.pesan}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
