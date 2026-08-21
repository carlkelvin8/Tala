import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      row.push(field)
      field = ""
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      if (row.some((cell) => cell !== "")) rows.push(row)
      row = []
    } else {
      field += char
    }
  }
  row.push(field)
  if (row.some((cell) => cell !== "")) rows.push(row)
  return rows
}

export function exportPdf(title: string, subtitle: string, rows: string[][], filename: string) {
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" })
  const dateGenerated = new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(subtitle, 14, 25)
  doc.text(`Generated: ${dateGenerated}`, 14, 31)

  autoTable(doc, {
    head: rows.length ? [rows[0]] : [],
    body: rows.slice(1),
    startY: 36,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `${filename} — Page ${page} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    )
  }

  doc.save(`${filename}.pdf`)
}

export function exportExcel(rows: string[][], filename: string, sheetName = "Report") {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  if (rows.length) {
    worksheet["!cols"] = rows[0].map((_, colIndex) => ({
      wch: Math.min(50, Math.max(10, ...rows.slice(0, 200).map((row) => (row[colIndex] ?? "").length + 2)))
    }))
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
