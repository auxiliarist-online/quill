import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { DOCX_TYPE, fileName, toDocx, toText } from './export'
import { SCRIPTS, SIZES, script } from './fonts'
import { Store, newPoem, titleOf, type Poem, type Settings } from './store'

const SAVE_DELAY = 400
const STILL_AFTER = 2500

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const page = $<HTMLTextAreaElement>('poem')
const seal = $<HTMLButtonElement>('seal')
const menu = $<HTMLDivElement>('menu')
const poemsList = $<HTMLUListElement>('poems')
const scriptsBox = $<HTMLDivElement>('scripts')
const sizesBox = $<HTMLDivElement>('sizes')
const note = $<HTMLDivElement>('note')

const store = new Store()
let settings: Settings
let poem: Poem
let saveTimer: number | undefined
let stillTimer: number | undefined
let noteTimer: number | undefined

// --- Writing -----------------------------------------------------------------

function applyLook(): void {
  const s = script(settings.font)
  document.documentElement.style.setProperty('--font', s.family)
  document.documentElement.style.setProperty('--scale', String(s.scale * SIZES[settings.size]))
}

async function open(next: Poem): Promise<void> {
  await flush()
  // A poem left empty isn't worth keeping.
  if (poem && poem.id !== next.id && !poem.text.trim()) await store.delete(poem.id)
  poem = next
  page.value = poem.text
  settings.currentId = poem.id
  await store.saveSettings(settings)
}

async function flush(): Promise<void> {
  if (saveTimer === undefined) return
  clearTimeout(saveTimer)
  saveTimer = undefined
  await store.save(poem)
}

page.addEventListener('input', () => {
  poem.text = page.value
  poem.updated = Date.now()
  clearTimeout(saveTimer)
  saveTimer = window.setTimeout(flush, SAVE_DELAY)

  document.body.classList.add('writing')
  clearTimeout(stillTimer)
  stillTimer = window.setTimeout(() => document.body.classList.remove('writing'), STILL_AFTER)
})

// Android can close a backgrounded app without warning; save first.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flush()
})
window.addEventListener('pagehide', () => void flush())

// --- Menu ----------------------------------------------------------------------

function showMenu(): void {
  renderMenu()
  menu.hidden = false
  // So Android's back gesture closes the menu instead of leaving the app.
  history.pushState({ menu: true }, '')
}

function hideMenu(): void {
  if (menu.hidden) return
  menu.hidden = true
  if (history.state?.menu) history.back()
}

window.addEventListener('popstate', () => {
  menu.hidden = true
})

seal.addEventListener('click', showMenu)
menu.addEventListener('click', (e) => {
  if (e.target === menu) hideMenu()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideMenu()
})

function when(time: number): string {
  const d = new Date(time)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

function chip(label: string, pressed: boolean, family?: string): HTMLButtonElement {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  b.setAttribute('aria-pressed', String(pressed))
  if (family) b.style.fontFamily = family
  return b
}

async function renderPoems(): Promise<void> {
  await flush()
  const poems = (await store.list()).filter((p) => p.text.trim() || p.id === poem.id)
  poemsList.replaceChildren(
    ...poems.map((p) => {
      const li = document.createElement('li')
      li.classList.toggle('current', p.id === poem.id)

      const openBtn = document.createElement('button')
      openBtn.type = 'button'
      openBtn.className = 'open'
      openBtn.textContent = titleOf(p.text)
      openBtn.addEventListener('click', async () => {
        await open(p)
        hideMenu()
      })

      const date = document.createElement('span')
      date.className = 'when'
      date.textContent = when(p.updated)

      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'remove'
      remove.textContent = '×'
      remove.setAttribute('aria-label', `Delete “${titleOf(p.text)}”`)
      remove.addEventListener('click', async () => {
        if (!confirm(`Delete “${titleOf(p.text)}”? This can't be undone.`)) return
        await store.delete(p.id)
        if (p.id === poem.id) {
          saveTimer = undefined
          const rest = await store.list()
          await open(rest[0] ?? newPoem())
        }
        await renderPoems()
      })

      li.append(openBtn, date, remove)
      return li
    }),
  )
  if (!poems.length) {
    const li = document.createElement('li')
    li.className = 'empty'
    li.textContent = 'No poems yet.'
    poemsList.append(li)
  }
}

function renderMenu(): void {
  void renderPoems()

  scriptsBox.replaceChildren(
    ...SCRIPTS.map((s) => {
      const b = chip(s.name, s.id === settings.font, s.family)
      b.addEventListener('click', () => {
        settings.font = s.id
        applyLook()
        void store.saveSettings(settings)
        renderMenu()
      })
      return b
    }),
  )

  sizesBox.replaceChildren(
    ...SIZES.map((_, i) => {
      const b = chip('Aa', i === settings.size)
      b.style.fontSize = `${14 + i * 3}px`
      b.setAttribute('aria-label', ['Small', 'Medium', 'Large', 'Largest'][i])
      b.addEventListener('click', () => {
        settings.size = i
        applyLook()
        void store.saveSettings(settings)
        renderMenu()
      })
      return b
    }),
  )
}

// --- Actions -------------------------------------------------------------------

function say(message: string): void {
  note.textContent = message
  note.classList.add('show')
  clearTimeout(noteTimer)
  noteTimer = window.setTimeout(() => note.classList.remove('show'), 2600)
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** The share sheet, where Proton Drive is a target. Chrome only shares some
 *  file types (not .docx), so this sends plain text, which Proton Docs opens. */
async function share(): Promise<void> {
  const name = fileName(poem.text, 'txt')
  const file = new File([toText(poem.text)], name, { type: 'text/plain' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: titleOf(poem.text) })
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') say("Couldn't share the poem.")
    }
    return
  }
  download(file, name)
  say(`Saved ${name} to Downloads`)
}

async function saveDocx(): Promise<void> {
  const name = fileName(poem.text, 'docx')
  download(new Blob([await toDocx(poem.text)], { type: DOCX_TYPE }), name)
  say(`Saved ${name} to Downloads`)
}

menu.addEventListener('click', async (e) => {
  const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action
  if (!action) return
  if (action === 'new') {
    await open(newPoem())
    hideMenu()
    page.focus()
    return
  }
  await flush()
  if (!poem.text.trim()) {
    say('Nothing to send yet.')
    return
  }
  hideMenu()
  if (action === 'share') await share()
  if (action === 'docx') await saveDocx()
})

// --- Start ---------------------------------------------------------------------

async function start(): Promise<void> {
  settings = await store.settings()
  applyLook()
  const current = settings.currentId ? await store.get(settings.currentId) : undefined
  const latest = current ?? (await store.list())[0]
  await open(latest ?? newPoem())
  // Ask the browser not to clear our storage when space runs low.
  void navigator.storage?.persist?.()
}

registerSW({ immediate: true })
void start()
