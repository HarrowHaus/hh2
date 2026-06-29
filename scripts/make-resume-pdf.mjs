// Generates a minimal, valid placeholder résumé PDF (public/files/resume.pdf)
// with a correct xref table. No deps. The real résumé replaces this later.
// Run: node scripts/make-resume-pdf.mjs
import { writeFileSync, mkdirSync } from 'node:fs'

const lines = [
  'BT',
  '/F1 26 Tf',
  '72 730 Td',
  '(RESUME) Tj',
  '/F1 12 Tf',
  '0 -40 Td',
  '([ placeholder \\226 the real resume goes here ]) Tj',
  '0 -22 Td',
  '(Name / role / years / contact.) Tj',
  '0 -22 Td',
  '(Open in Notepad-land it is a real PDF, rendered by pdf.js.) Tj',
  'ET',
]
const stream = lines.join('\n')

const bodies = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
]

let pdf = '%PDF-1.4\n'
const offsets = []
bodies.forEach((body, i) => {
  offsets[i] = Buffer.byteLength(pdf, 'latin1')
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
})
const xref = Buffer.byteLength(pdf, 'latin1')
pdf += 'xref\n'
pdf += `0 ${bodies.length + 1}\n`
pdf += '0000000000 65535 f \n'
offsets.forEach((off) => {
  pdf += `${String(off).padStart(10, '0')} 00000 n \n`
})
pdf += `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

mkdirSync('public/files', { recursive: true })
writeFileSync('public/files/resume.pdf', Buffer.from(pdf, 'latin1'))
console.log('wrote public/files/resume.pdf', Buffer.byteLength(pdf, 'latin1'), 'bytes')
