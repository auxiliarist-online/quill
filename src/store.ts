// Poems and settings live on the phone, in IndexedDB. Nothing leaves the
// device except through an export the writer starts.
import { createStore, del, entries, get, set, type UseStore } from 'idb-keyval'

export interface Poem {
  id: string
  text: string
  created: number
  updated: number
}

export interface Settings {
  font: string
  size: number
  currentId: string | null
}

export const DEFAULT_SETTINGS: Settings = { font: 'dancing', size: 1, currentId: null }

const POEM = 'poem:'

export class Store {
  private db: UseStore

  constructor(db: UseStore = createStore('quill', 'kv')) {
    this.db = db
  }

  async settings(): Promise<Settings> {
    return { ...DEFAULT_SETTINGS, ...(await get<Partial<Settings>>('settings', this.db)) }
  }

  saveSettings(settings: Settings): Promise<void> {
    return set('settings', settings, this.db)
  }

  get(id: string): Promise<Poem | undefined> {
    return get<Poem>(POEM + id, this.db)
  }

  save(poem: Poem): Promise<void> {
    return set(POEM + poem.id, poem, this.db)
  }

  delete(id: string): Promise<void> {
    return del(POEM + id, this.db)
  }

  /** Newest first. */
  async list(): Promise<Poem[]> {
    const all = await entries<string, Poem>(this.db)
    return all
      .filter(([key]) => String(key).startsWith(POEM))
      .map(([, poem]) => poem)
      .sort((a, b) => b.updated - a.updated)
  }
}

export function newPoem(now = Date.now()): Poem {
  return { id: crypto.randomUUID(), text: '', created: now, updated: now }
}

/** A poem's title is its first line with words in it. */
export function titleOf(text: string): string {
  const line = text.split('\n').find((l) => l.trim())
  return line ? line.trim().slice(0, 80) : 'Untitled'
}
