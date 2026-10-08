// Plain copies of a poem for Proton Drive: no parchment, no script font.
// Each line is its own paragraph with no extra spacing, so stanza breaks are
// exactly the blank lines the writer typed.
import { titleOf } from './store'

export const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function lines(text: string): string[] {
  const all = text.replace(/\r\n?/g, '\n').split('\n')
  while (all.length && !all[all.length - 1].trim()) all.pop()
  return all
}

/** A file name from the poem's title, safe on any file system. */
export function fileName(text: string, ext: 'txt' | 'docx'): string {
  const base = titleOf(text)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/, '')
    .slice(0, 60)
  return `${base || 'Untitled'}.${ext}`
}

export function toText(text: string): Blob {
  return new Blob([lines(text).join('\n') + '\n'], { type: 'text/plain' })
}

/** The .docx library is large, so it's loaded only when someone exports. */
export async function toDocx(text: string): Promise<Blob> {
  const { Document, Packer, Paragraph, Tab, TextRun } = await import('docx')
  const paragraphs = lines(text).map(
    (line) =>
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: line
          ? [
              new TextRun({
                children: line.split('\t').flatMap((part, i) => (i ? [new Tab(), part] : [part])),
              }),
            ]
          : [],
      }),
  )
  const doc = new Document({
    title: titleOf(text),
    creator: 'Quill',
    sections: [{ children: paragraphs }],
  })
  return Packer.toBlob(doc)
}
