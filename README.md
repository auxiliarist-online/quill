# Quill

A quiet page for writing poems on a phone: parchment, a script hand, and nothing else on screen. Tap the faint ❦ in the corner for the menu (new poem, your poems, script, size, export). It disappears while you write.

Poems are saved on the phone as you type (IndexedDB) and the app works offline once installed.

## Getting poems into Proton Drive

Proton Drive has no API third-party apps can sign in to yet ([SDK status](https://github.com/ProtonDriveApps/sdk)), so export goes through the phone:

- **Send to Proton Drive** opens the share sheet with a plain `.txt` copy; choose Proton Drive. In Drive, "Open in Docs" turns it into a Proton Doc. (Chrome on Android won't share `.docx` from a web app, which is why this is text.)
- **Save as .docx** downloads a Word file in the default font, one paragraph per line, for uploading from the Proton Drive app.

When Proton opens its SDK to third-party sign-in, a direct save can replace the share step.

## Develop

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # export and storage tests
npm run typecheck
npm run build      # static site in dist/, with a service worker for offline use
```

Icons are generated from `public/icon.svg` with `npx pwa-assets-generator`.

Fonts (SIL Open Font License or Apache 2.0, via Fontsource): Dancing Script, Pinyon Script, Homemade Apple, Caveat, IM Fell English.
