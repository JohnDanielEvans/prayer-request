# Smart Intake

An embeddable component that classifies, tags and prioritizes incoming requests
the moment they're submitted. Drop it into a React app as a component, into any
website with one script tag, or take the hook and render your own UI.

```bash
npm install
npm start          # demo site at localhost:3000 -- no API key needed
```

The demo runs an offline classifier, so it works immediately with no key, no
network calls, and no cost.

---

## What it does

Someone submits a message:

> "My invoice is showing the wrong amount — we were charged twice for March."

Your application receives:

```json
{
  "category":   "billing",
  "priority":   "high",
  "tags":       ["invoice", "payment"],
  "confidence": 0.94,
  "summary":    "Invoice shows the wrong amount"
}
```

Categories are yours to define. The same component handles a support desk, an
inbound sales form, a community organisation's front door, or a prayer request
board — those are the four presets in the demo, and each is just a props object.

---

## Three ways to use it

### 1. React component

```bash
npm install smart-intake-widget
```

```jsx
import { IntakeWidget } from 'smart-intake-widget';
import 'smart-intake-widget/styles.css';

export function ContactPage() {
  return (
    <IntakeWidget
      provider="endpoint"
      endpoint="/api/classify"
      title="How can we help?"
      categories={['Billing', 'Technical Support', 'Account', 'Bug Report']}
      onClassified={(result) => {
        routeToTeam(result.category.id, result.priority);
      }}
    />
  );
}
```

React stays external, so the host app's copy is the only one on the page.

### 2. One script tag — any website

For WordPress, Squarespace, or a hand-written HTML page. React is bundled in.

```html
<div
  data-intake-widget
  data-provider="endpoint"
  data-endpoint="/api/classify"
  data-title="How can we help?"
  data-categories="Billing,Technical Support,Account,Bug Report"
  data-theme="dark"
></div>

<script src="https://your-cdn.com/smart-intake.js" defer></script>
```

Every `[data-intake-widget]` on the page mounts automatically.
`data-max-length="400"` becomes `maxLength: 400`; booleans and numbers are coerced.

Or mount it yourself:

```html
<div id="intake"></div>
<script src="smart-intake.js"></script>
<script>
  const widget = SmartIntake.mount('#intake', {
    endpoint: '/api/classify',
    categories: ['Billing', 'Support'],
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

```jsx
import { useIntake } from 'smart-intake-widget';

const { submissions, submit, retry, remove, clear, stats, isBusy, error } =
  useIntake({
    provider: 'endpoint',
    endpoint: '/api/classify',
    categories,
    onClassified: (result) => sendToBackend(result),
  });
```

You keep classification, optimistic updates, retry with backoff, abort on
unmount, and localStorage persistence.

---

## The classification result

```ts
{
  category:   IntakeCategory   // always one of yours
  priority:   'low' | 'normal' | 'high' | 'urgent'
  tags:       string[]         // lowercase, hyphenated, max 4
  confidence: number | null    // 0..1, see the caveat below
  summary:    string | null
}
```

Every field passes through one validation funnel (`toClassification()`) before
the UI sees it, so no provider — model, your endpoint, or the offline heuristic
— can leak an unvalidated field through.

| Field | How it's constrained |
| --- | --- |
| `category` | Matched against your configured list by id, label, fuzzy slug, then keyword score. Unknown answers fall to your catch-all bucket. A classifier cannot invent a category. |
| `priority` | Coerced to the four-value enum. Synonyms (`critical`, `P1`, `medium`) map in; unrecognized values are discarded, not trusted. Categories declare a floor, and urgency wording in the message can raise it. |
| `tags` | Lowercased, hyphenated, deduped, capped at 4 and 24 characters. Free-form rather than a fixed vocabulary, but never unbounded. |
| `confidence` | Clamped to 0..1. |
| `summary` | Trimmed string or null. |

**On confidence:** when it comes from a model this is *self-reported* and **not
calibrated** — an LLM answering `0.94` is not right 94% of the time. It's shown
as a soft signal and labelled in the UI as the classifier's own estimate. The
offline provider's number is a different thing: a deterministic function of
keyword match strength. It's kept because it's real, and documented because it
would be misleading otherwise.

---

## Where the API key lives

**This is the most important decision in the project.**

Anything prefixed `VITE_` or `REACT_APP_` is compiled into the JavaScript you
serve. It's visible in devtools, in the network tab, and in your source maps. A
key in front-end code is a key anyone can take and bill to you.

```
Host site  →  Intake widget  │  Your server  →  Classifier  →  validated result
   browser — no secrets      │   secrets live here
```

| Provider | Key location | Use for |
| --- | --- | --- |
| `mock` *(default)* | none | Demos, tests, local work. Offline keyword scoring. |
| `endpoint` | your server | **Production.** |
| `openai` | the browser | Local development only. Warns in the console. |

```
POST /api/classify
  → { "text": "...", "categories": [{ "id", "label", "description" }] }
  ← { "category": "billing", "priority": "high",
      "tags": ["invoice"], "confidence": 0.94, "summary": "..." }
```

`server/` has two working implementations:

- **`node-proxy.mjs`** — zero dependencies, `node server/node-proxy.mjs`. CORS
  allow-listing, request-size cap, per-IP rate limiting, and category input
  bounded and normalized. It imports the widget's own prompt and validators, so
  server and browser agree on what a valid result is.
- **`vercel-function.js`** — the same endpoint as a serverless function with no
  imports from this repo, so it can be copied out standalone.

```bash
OPENAI_API_KEY=sk-... npm run proxy
```

Both validate the model's answer server-side *and* refuse to echo upstream
errors to the client, since those can leak key metadata.

---

## Presets

Four demo presets, each a plain props object — `Support`, `Sales`, `Community`,
`Prayer`. Switching preset in the demo re-renders the same `<IntakeWidget>` with
different data; there is no per-preset component or branch anywhere.

```jsx
import { presetProps } from 'smart-intake-widget';

<IntakeWidget {...presetProps('support')} provider="endpoint" endpoint="/api/classify" />
```

The Prayer preset is the use case this project started as. It's kept as proof
that the same component covers something genuinely different in tone and
vocabulary from a support desk.

### Custom categories

```jsx
<IntakeWidget
  categories={[
    'Billing',
    'Technical Support',
    { id: 'logistics', label: 'Logistics', hue: 190,
      defaultPriority: 'high',
      description: 'Shipping, delivery and returns.',
      keywords: ['shipping', 'delivery', 'tracking', 'return'],
      tagRules: [{ tag: 'tracking', match: ['tracking', 'where is'] }],
    },
  ]}
/>
```

Bare strings are expanded into full records. Custom categories get a hue derived
from their name, so colors are stable across reloads. Exactly one catch-all
bucket is guaranteed — mark one `fallback: true`, or a generic `General` is
appended.

| Category field | Purpose |
| --- | --- |
| `id` `label` | Identity. The classifier must return the id verbatim. |
| `hue` | 0–360. Badge colors derive from it in both themes. |
| `description` | Tooltip, and the definition given to the model. |
| `defaultPriority` | Floor for anything landing here. A bug report isn't "low". |
| `keywords` | Offline category matching. |
| `tagRules` | `{ tag, match[] }` — offline tag extraction. |
| `fallback` | Marks the catch-all. |

---

## Props

### Classification

| Prop | Type | Default |
| --- | --- | --- |
| `provider` | `'mock' \| 'endpoint' \| 'openai' \| fn` | `'mock'` |
| `endpoint` | `string` | — |
| `apiKey` | `string` | — (dev only) |
| `model` | `string` | `'gpt-4o-mini'` |
| `headers` | `object` | — |
| `retries` | `number` | `3` |
| `categories` | `array` | Support preset |

A custom provider is `async ({ text, categories, signal }) => ClassificationResult`.
Return through `toClassification()` to get the same validation as the built-ins.

### Appearance

| Prop | Type | Default |
| --- | --- | --- |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` |
| `accent` | CSS color | `#2563eb` |
| `radius` | `'sm' \| 'md' \| 'lg' \| 'xl'` or length | `'md'` |
| `density` | `'comfortable' \| 'compact'` | `'comfortable'` |
| `fontFamily` `maxWidth` | — | system stack / `34rem` |
| `showHeader` `showStats` `showTimestamps` `showPrivacyNote` `showClear` `showJson` | `boolean` | `true` |

### Copy

`title`, `subtitle`, `placeholder`, `submitLabel`, `helperText`, `emptyText`,
`privacyNote` — all strings, all overridable for localization.

### Behavior

| Prop | Type | Default |
| --- | --- | --- |
| `maxLength` | `number` | `600` |
| `persist` | `boolean` | `true` |
| `storageKey` | `string` | `'smart-intake:v1'` |
| `disabled` | `boolean` | `false` |
| `onSubmit` `onClassified` `onError` | function | — |

### Theming with CSS

Every token is a custom property on the widget root:

```css
.my-page .si-widget {
  --si-accent: #7c3aed;
  --si-radius: 4px;
  --si-max-width: 40rem;
}
```

---

## What's handled

- **Style isolation, both directions.** CSS Modules scope the widget's rules;
  the embed build's shadow root blocks the host's.
- **Works with no backend.** The offline classifier scores messages against
  category keywords and tag rules. Real classification is a config change.
- **Failure is a state, not a crash.** Retries use exponential backoff with
  jitter, honor `Retry-After`, time out at 30s, and surface a per-item retry
  button. Unmounting aborts in-flight requests. HTML error pages never leak into
  the user-facing message.
- **Classifiers don't follow instructions.** The parser handles fenced JSON,
  prose wrappers and `"Category: Billing."`; a priority of `"banana"` is
  discarded rather than trusted.
- **Optimistic UI.** Submitted text renders immediately in a pending state.
- **Accessible.** Labelled controls, `aria-live` announcements, visible focus
  rings, keyboard operation, hover-independent controls on touch, honored
  `prefers-reduced-motion`, and a screen-reader prefix on priority badges so
  "High" never reads as a bare adjective.
- **Privacy.** Persistence is localStorage-only and clearable from the UI.

---

## Scripts

```bash
npm start          # demo site (Vite dev server)
npm test           # 121 tests: schema, classifier, presets, category resolution
npm run proxy      # the server-side classification endpoint
npm run build      # all three targets, plus staging for deploy
npm run build:site # what a static host runs: site + embed script
```

| Target | Output | Contents |
| --- | --- | --- |
| `build:site` | `dist-demo/` | **What the host deploys** — the case-study site plus the embed script and `/embed.html`. |
| `build:demo` | `dist-demo/` | The case-study site alone. |
| `build:lib` | `dist/` | ES + CJS package, React external. ~18 kB gzipped. |
| `build:embed` | `dist-embed/` | Single-file IIFE, React bundled, CSS inlined. ~61 kB gzipped. |

---

## Layout

```
src/
├── index.js                 Public API
├── embed.jsx                Script-tag entry: mount(), autoMount(), shadow DOM
├── widget/                  UI components + scoped CSS module
├── lib/
│   ├── product.js           Naming, in one place
│   ├── classification.js    Priority/tag/confidence schema and validators
│   ├── categories.js        IntakeCategory shape + defaults
│   ├── presets.js           The four demo presets
│   ├── normalize.js         Category matching, keyword scoring, tags, urgency
│   ├── providers/           mock · endpoint · openai · shared validation funnel
│   ├── http.js              Retry, backoff, abort, timeout
│   ├── storage.js           Fail-safe localStorage
│   ├── theme.js             CSS custom property generation
│   └── useIntake.js         All state, exported for headless use
└── demo/                    The case-study site
server/                      Zero-dep Node proxy + serverless function
examples/embed.html          Embed test against a hostile host page
scripts/stage-embed.mjs      Copies the embed script into the deployed site
```

## Naming

"Smart Intake" is a working name, not a brand. It lives in `src/lib/product.js`
along with the package name, embed global and storage key. Two things can't be
centralized there and are noted in that file: the `si-` CSS class prefix
(`vite.config.js`) and the `--si-` custom property prefix
(`src/widget/widget.module.css`).

## License

MIT
