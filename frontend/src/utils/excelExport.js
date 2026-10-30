/**
 * Tiện ích xuất dữ liệu ra file Excel (.csv với UTF-8 BOM)
 * Tương thích 100% với Microsoft Excel, Google Sheets, LibreOffice Calc
 */

function escapeCsvField(val) {
  if (val == null) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function exportToExcel({ filename, headers, rows }) {
  const bom = '\uFEFF' // UTF-8 Byte Order Mark để Microsoft Excel mở trực tiếp không bị lỗi font tiếng Việt
  const headerLine = headers.map(escapeCsvField).join(',')
  const bodyLines = rows.map((row) => row.map(escapeCsvField).join(','))
  const csvContent = [headerLine, ...bodyLines].join('\r\n')

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
