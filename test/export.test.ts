import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { fileName, toDocx, toText } from '../src/export'

const POEM = 'The River at Dusk\n\n  slow water,\tslow light\nthe heron waits\n\n\n'

async function documentXml(text: string): Promise<string> {
  const zip = await JSZip.loadAsync(await (await toDocx(text)).arrayBuffer())
  return zip.file('word/document.xml')!.async('string')
}

describe('toText', () => {
  it('keeps every line and stanza break, drops trailing blank lines', async () => {
    expect(await toText(POEM).text()).toBe(
      'The River at Dusk\n\n  slow water,\tslow light\nthe heron waits\n',
    )
  })

  it('normalizes Windows line endings', async () => {
    expect(await toText('a\r\nb').text()).toBe('a\nb\n')
  })
})

describe('toDocx', () => {
  it('writes one paragraph per line, blank lines included', async () => {
    const xml = await documentXml(POEM)
    expect(xml.match(/<w:p>|<w:p /g)).toHaveLength(4)
    expect(xml).toContain('The River at Dusk')
    expect(xml).toContain('the heron waits')
  })

  it('keeps leading spaces and turns tabs into real tabs', async () => {
    const xml = await documentXml(POEM)
    expect(xml).toMatch(/<w:t xml:space="preserve">  slow water,<\/w:t>/)
    expect(xml).toContain('<w:tab/>')
  })

  it('adds no space between lines and sets no font, so the default is used', async () => {
    const xml = await documentXml(POEM)
    expect(xml).toContain('w:after="0"')
    expect(xml).not.toContain('w:rFonts')
  })
})

describe('fileName', () => {
  it('uses the first line as the title', () => {
    expect(fileName(POEM, 'docx')).toBe('The River at Dusk.docx')
  })

  it('removes characters file systems reject', () => {
    expect(fileName('What? / Why: "now"...', 'txt')).toBe('What Why now.txt')
  })

  it('falls back to Untitled', () => {
    expect(fileName('\n  \n', 'txt')).toBe('Untitled.txt')
  })
})
