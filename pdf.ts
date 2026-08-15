import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LaporanRow } from "./excel";

export function exportPdf(rows: LaporanRow[], title: string, fileName: string) {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Dibuat ${new Date().toLocaleString("id-ID")}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Tanggal", "NIS", "Nama", "Kelas", "Mapel", "Status", "Waktu"]],
    body: rows.map((r) => [r.tanggal, r.nis, r.nama, r.kelas, r.mapel, r.status, r.waktu]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 44, 37] },
    alternateRowStyles: { fillColor: [247, 245, 239] },
  });

  doc.save(`${fileName}.pdf`);
}
