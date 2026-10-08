import 'fake-indexeddb/auto'
import { createStore } from 'idb-keyval'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, Store, newPoem, titleOf } from '../src/store'

const fresh = () => new Store(createStore(`test-${crypto.randomUUID()}`, 'kv'))

describe('Store', () => {
  it('starts with default settings and remembers changes', async () => {
    const store = fresh()
    expect(await store.settings()).toEqual(DEFAULT_SETTINGS)
    await store.saveSettings({ ...DEFAULT_SETTINGS, font: 'pinyon' })
    expect((await store.settings()).font).toBe('pinyon')
  })

  it('lists poems newest first, without settings', async () => {
    const store = fresh()
    const old = { ...newPoem(1000), text: 'old' }
    const recent = { ...newPoem(2000), text: 'recent' }
    await store.save(old)
    await store.save(recent)
    await store.saveSettings(DEFAULT_SETTINGS)
    expect((await store.list()).map((p) => p.text)).toEqual(['recent', 'old'])
  })

  it('deletes a poem', async () => {
    const store = fresh()
    const poem = newPoem()
    await store.save(poem)
    await store.delete(poem.id)
    expect(await store.get(poem.id)).toBeUndefined()
  })
})

describe('titleOf', () => {
  it('is the first line with words, trimmed', () => {
    expect(titleOf('\n   \n  Ode to Rain  \nsecond')).toBe('Ode to Rain')
    expect(titleOf('')).toBe('Untitled')
  })
})
