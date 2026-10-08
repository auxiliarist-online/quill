import '@fontsource/dancing-script/400.css'
import '@fontsource/pinyon-script/400.css'
import '@fontsource/homemade-apple/400.css'
import '@fontsource/caveat/400.css'
import '@fontsource/im-fell-english/400.css'

export interface Script {
  id: string
  name: string
  family: string
  /** Scripts differ a lot in apparent size; this evens them out. */
  scale: number
}

export const SCRIPTS: Script[] = [
  { id: 'dancing', name: 'Flowing', family: '"Dancing Script", cursive', scale: 1.15 },
  { id: 'pinyon', name: 'Copperplate', family: '"Pinyon Script", cursive', scale: 1.25 },
  { id: 'homemade', name: 'Handwritten', family: '"Homemade Apple", cursive', scale: 0.9 },
  { id: 'caveat', name: 'Notebook', family: 'Caveat, cursive', scale: 1.3 },
  { id: 'fell', name: 'Old book', family: '"IM Fell English", serif', scale: 1 },
]

export const SIZES = [0.85, 1, 1.2, 1.45]

export function script(id: string): Script {
  return SCRIPTS.find((s) => s.id === id) ?? SCRIPTS[0]
}
