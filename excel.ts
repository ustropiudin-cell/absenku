import * as XLSX from "xlsx";

export type LaporanRow = {
  tanggal: string;
  nis: string;
  nama: string;
  kelas: string;
  mapel: string;
  status: string;
  waktu: string;
};

export function exportExcel(rows: LaporanRow[], fileName: string) {
  const data = rows.map((r) => ({
    Tanggal: r.tanggal,
    NIS: r.nis,
    Nama: r.nama,
    Kelas: r.kelas,
    "Mata Pelajaran": r.mapel,
    Status: r.status,
    "Waktu Scan": r.waktu,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 24 }, { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Presensi");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
