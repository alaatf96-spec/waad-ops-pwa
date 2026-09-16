# Force latest Waad Ops on laptop Chrome

GitHub Pages already serves the Teacher folders / + / sync build. If the laptop still shows the **old UI**, the service worker is serving a stale precache.

## Verify you have the new build

1. Open https://alaatf96-spec.github.io/waad-ops-pwa/
2. Unlock as usual.
3. On the **home** screen, check the footer line: `Build: <git-hash> · <ISO-time>`.
4. You should also see the **Teacher folders** tile (third tile).

If the footer is missing or Teacher folders is missing → clear site data (below).

## Hard clear site data (Chrome laptop)

1. Open https://alaatf96-spec.github.io/waad-ops-pwa/
2. Click the **padlock / tune icon** left of the URL → **Site settings**  
   *or* go to `chrome://settings/content/all` and search `alaatf96-spec.github.io`
3. Click **Delete data** / **Clear data** for `alaatf96-spec.github.io` (cookies + cached images/files + storage).
4. Optional belt-and-suspenders:
   - `chrome://serviceworker-internals` → find `alaatf96-spec.github.io` → **Unregister**
   - `chrome://apps` → if Waad Ops was installed as an app, remove it, then re-open the URL
5. Close the tab completely, reopen:
   https://alaatf96-spec.github.io/waad-ops-pwa/?v=refresh
6. Confirm home footer `Build:` matches the latest deploy hash (see git `main`).

## Quick try first (sometimes enough)

- `Ctrl+Shift+R` (hard reload) on the PWA tab
- Or DevTools → Application → Service Workers → **Update** → check **Update on reload** → reload twice

## After update

New builds register with `skipWaiting` + `clients.claim` and auto-reload when a new SW activates. Still clear site data if a sticky old SW remains.
