import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/PageHeader";
import PresensiScanner from "./PresensiScanner";

export default async function PresensiPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: kelas }, { data: mapel }] = await Promise.all([
    supabase.from("kelas").select("id, nama_kelas").order("nama_kelas"),
    supabase.from("mapel").select("id, nama_mapel").order("nama_mapel"),
  ]);

  const hasData = (kelas?.length ?? 0) > 0 && (mapel?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        eyebrow="PINDAI"
        title="Presensi"
        description="Pilih kelas dan mata pelajaran, lalu pindai kartu QR siswa satu per satu."
      />
      {hasData ? (
        <PresensiScanner kelasList={kelas ?? []} mapelList={mapel ?? []} guruId={profile.id} />
      ) : (
        <div className="p-8">
          <div className="rounded-lg border border-dashed border-ink-900/20 bg-white p-10 text-center text-sm text-ink-950/50">
            Belum ada data kelas atau mata pelajaran. Minta admin menambahkannya
            terlebih dahulu di halaman <span className="font-medium">Kelas & Mapel</span>.
          </div>
        </div>
      )}
    </div>
  );
}
