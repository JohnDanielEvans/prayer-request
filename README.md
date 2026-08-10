# Prayer Request Widget

An embeddable React widget that categorizes prayer requests as they're submitted.
Drop it into a React app as a component, into any website with one script tag, or
take the hook and render your own UI.

```bash
npm install
npm start          # demo site at localhost:3000 -- no API key needed
```

The demo runs an offline provider, so it works immediately with no key, no
network calls, and no cost.

---

## Why this exists

A church collects prayer requests through a form and ends up with a list nobody
can act on. Sorting them by need — health, grief, finances, gratitude — is a
small classification problem, and the useful version of it has to live *inside*
an existing website rather than as a standalone app.

So the deliverable here isn't a page. It's a component that survives contact
with a host site you don't control.

---

## Three ways to use it

### 1. React component

```bash
npm install prayer-request-widget
```

```jsx
import { PrayerRequestWidget } from 'prayer-request-widget';
import 'prayer-request-widget/styles.css';

export function PrayerPage() {
  return (
    <PrayerRequestWidget
      provider="endpoint"
      endpoint="/api/categorize"
      theme="auto"
      accent="#0f766e"
      onResult={(r) => console.log(r.category.label, r.confidence)}
    />
  );
}
```

React stays external, so the host app's copy is the only one on the page.

### 2. One script tag — any website

For WordPress, Squarespace, or a hand-written HTML page. React is bundled in.

```html
<div
  data-prayer-widget
  data-provider="endpoint"
  data-endpoint="/api/categorize"
  data-theme="dark"
  data-accent="#7c3aed"
></div>

<script src="https://your-cdn.com/prayer-widget.js" defer></script>
```

Every `[data-prayer-widget]` on the page mounts automatically. `data-max-length="400"`
becomes `maxLength: 400`; booleans and numbers are coerced.

Or mount it yourself:

```html
<div id="prayer"></div>
<script src="prayer-widget.js"></script>
<script>
  const widget = PrayerWidget.mount('#prayer', {
    endpoint: '/api/categorize',
    categories: ['Health', 'Family', 'Missions'],
  });
  // widget.update({ theme: 'dark' });
  // widget.unmount();
</script>
```

**This build renders inside a shadow root by default.** That's the only reliable
way to keep a host page's stylesheet — a Bootstrap reset, an old theme,
`* { box-sizing: content-box !important }` — from reaching in and wrecking the
layout. `examples/embed.html` demonstrates this against a deliberately hostile
host page, including a `shadow: false` mount so you can see what it prevents.

### 3. Headless hook

Already have a design system? Take the logic and render your own markup.

```jsx
import { usePrayerRequests } from 'prayer-request-widget';

const { requests, submit, retry, remove, clear, stats, isBusy, error } =
  usePrayerRequests({ provider: 'endpoint', endpoint: '/api/categorize' });
```

You keep categorization, optimistic updates, retry with backoff, abort on
unmount, and localStorage persistence.

---

## Where the API key lives

**This is the important part, and it's what the first version of this project got
wrong.**

Anything prefixed `VITE_` or `REACT_APP_` is compiled into the JavaScript you
serve. It is visible in devtools, in the network tab, and in your source maps.
A key in front-end code is a key anyone can take and bill to you.

| Provider | Key location | Use for |
| --- | --- | --- |
| `mock` *(default)* | none | Demos, tests, local work. Offline keyword scoring. |
| `endpoint` | your server | **Production.** |
| `openai` | the browser | Local development only. Warns in the console. |

The `endpoint` provider posts to a URL you own:

```
POST /api/categorize
  → { "text": "...", "categories": [{ "id", "label", "description" }] }
  ← { "category": "health", "confidence": 0.92, "summary": "..." }
```

`server/` has two working implementations:

- **`node-proxy.mjs`** — zero dependencies, runs with `node server/node-proxy.mjs`.
  Includes CORS allow-listing, a request-size cap, and per-IP rate limiting.
- **`vercel-function.js`** — the same endpoint as a serverless function. Drop it
  in as `api/categorize.js` and set `OPENAI_API_KEY` in your project settings.

```bash
OPENAI_API_KEY=sk-... npm run proxy
```

Both refuse to echo upstream errors to the client, since those can leak key
metadata.

---

## Props

### Categorization

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `provider` | `'mock' \| 'endpoint' \| 'openai' \| fn` | `'mock'` | Or your own `async ({ text, categories, signal }) => ({ categoryId, confidence, summary })`. |
| `endpoint` | `string` | — | Required for `provider="endpoint"`. |
| `apiKey` | `string` | — | `provider="openai"` only. Dev only. |
| `model` | `string` | `'gpt-4o-mini'` | |
| `headers` | `object` | — | Extra headers for your endpoint (auth, CSRF). |
| `retries` | `number` | `3` | |
| `categories` | `array` | 9 defaults | Strings, objects, or a mix. |

### Appearance

| Prop | Type | Default |
| --- | --- | --- |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` |
| `accent` | CSS color | `#2563eb` |
| `radius` | `'sm' \| 'md' \| 'lg' \| 'xl'` or CSS length | `'md'` |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` |
| `fontFamily` | `string` | system stack |
| `maxWidth` | `number \| string` | `34rem` |
| `showHeader` `showStats` `showTimestamps` `showPrivacyNote` `showClear` | `boolean` | `true` |

### Copy

`title`, `subtitle`, `placeholder`, `submitLabel`, `helperText`, `emptyText`,
`privacyNote` — all strings, all overridable for localization.

### Behavior

| Prop | Type | Default |
| --- | --- | --- |
| `maxLength` | `number` | `600` |
| `persist` | `boolean` | `true` |
| `storageKey` | `string` | `'prayer-request-widget:v2'` |
| `disabled` | `boolean` | `false` |
| `onSubmit` `onResult` `onError` | function | — |
| `className` `style` | — | — |

### Theming with CSS

Every token is a custom property on the widget root, so you can override from
your own stylesheet without touching props:

```css
.my-page .prw-widget {
  --prw-accent: #7c3aed;
  --prw-radius: 4px;
  --prw-max-width: 40rem;
}
```

### Custom categories

```jsx
<PrayerRequestWidget
  categories={[
    'Health',
    'Family',
    { id: 'missions', label: 'Missions', hue: 190,
      description: 'Sending, support, and field workers.' },
  ]}
/>
```

Bare strings are expanded into full records. Custom categories get a hue derived
from their name, so colors are stable across reloads. An `other` bucket is always
appended — the UI can never receive a category it can't render.

---

## What's handled

- **Style isolation, both directions.** CSS Modules scope the widget's rules;
  the embed build's shadow root blocks the host's.
- **Works with no backend.** The offline provider scores requests against
  category keywords. Real classification is a config change, not a rewrite.
- **Failure is a state, not a crash.** Retries use exponential backoff with
  jitter, honor `Retry-After`, time out at 30s, and surface a per-item retry
  button. Unmounting aborts in-flight requests.
- **Models don't always follow instructions.** The response parser handles fenced
  JSON, prose wrappers, `"Category: Health."`, and unknown labels, falling back
  to keyword scoring before returning *Other*.
- **Optimistic UI.** Submitted text renders immediately in a pending state.
- **Accessible.** Labelled controls, `aria-live` announcements, visible focus
  rings, keyboard operation, hover-independent controls on touch, and honored
  `prefers-reduced-motion`.
- **Privacy.** Requests are personal. Persistence is localStorage-only and
  clearable from the UI; the demo sends nothing anywhere.

---

## Scripts

```bash
npm start          # demo site (Vite dev server)
npm test           # provider and normalizer tests (32 tests)
npm run proxy      # the server-side categorization endpoint
npm run build      # all three targets
```

| Target | Output | Contents |
| --- | --- | --- |
| `build:demo` | `dist-demo/` | The portfolio site. |
| `build:lib` | `dist/` | ES + CJS package. React external. ~11 kB gzipped. |
| `build:embed` | `dist-embed/` | Single-file IIFE, React bundled, CSS inlined. ~58 kB gzipped. |

---

## Layout

```
src/
├── index.js                 Public API for React consumers
├── embed.jsx                Script-tag entry: mount(), autoMount(), shadow DOM
├── widget/                  UI components + scoped CSS module
├── lib/
│   ├── categories.js        Canonical categories, hues, keywords
│   ├── normalize.js         Loose JSON parsing, category matching, scoring
│   ├── providers/           mock · endpoint · openai
│   ├── http.js              Retry, backoff, abort, timeout
│   ├── storage.js           Fail-safe localStorage
│   ├── theme.js             CSS custom property generation
│   └── usePrayerRequests.js All state, exported for headless use
└── demo/                    The portfolio site
server/                      Zero-dep Node proxy + serverless function
examples/embed.html          Embed test against a hostile host page
```

---

## Notes on v2

This replaces the original Create React App version. CRA is deprecated and can't
produce a library or embed build; the `config-overrides.js` browserify polyfills
existed only because Node SDK code was being pulled into the bundle. Moving to
Vite removed all of it — the dependency tree went from ~1,500 packages to 101,
with zero runtime dependencies.

`npm start` still works the way it always did.

## License

MIT
