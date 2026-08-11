import { Playground } from './Playground.jsx';
import { Architecture } from './Architecture.jsx';
import { CodeBlock } from './CodeBlock.jsx';
import { PRESETS } from '../lib/presets.js';
import { PACKAGE_NAME, PRODUCT_NAME } from '../lib/product.js';
import { PRIORITIES } from '../lib/classification.js';

export function App() {
  return (
    <>
      <a className="skip-link" href="#demo">
        Skip to the demo
      </a>

      <header className="hero">
        <div className="hero-inner">
          <p className="eyebrow">{PRODUCT_NAME} · Embeddable React component</p>
          <h1>Turn any contact form into a smart intake form.</h1>
          <p className="hero-sub">
            An embeddable component that classifies, tags and prioritizes
            incoming requests the moment they're submitted. Use the React
            component, add one script tag, or go headless.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#demo">
              Try it live
            </a>
            <a className="btn btn-ghost" href="#integrate">
              How to embed
            </a>
          </div>
          <ul className="hero-stats">
            <li>
              <strong>3</strong> Integration methods
            </li>
            <li>
              <strong>0</strong> Frontend secrets
            </li>
            <li>
              <strong>{PRESETS.length}</strong> Demo presets
            </li>
          </ul>
        </div>
      </header>

      <main>
        <section className="section section-centered" id="architecture">
          <div className="section-head">
            <h2>How it fits together</h2>
            <p>
              The widget never talks to a model directly. It posts to a server
              you own, which holds the key and returns a validated result.
            </p>
          </div>
          <Architecture />
        </section>

        <section className="section section-alt" id="demo">
          <div className="section-head">
            <h2>Live demo</h2>
            <p>
              Switch preset and the same component re-renders with different
              categories, copy and colors — no per-use-case code anywhere. This
              instance runs the offline classifier: no API key, no network, no
              cost.
            </p>
          </div>
          <Playground />
        </section>

        <section className="section" id="result">
          <div className="section-head">
            <h2>What comes back</h2>
            <p>
              Not just a category. Every submission resolves to a structured,
              validated result your application can act on.
            </p>
          </div>

          <div className="split">
            <div className="split-col">
              <h3>The message</h3>
              <p className="quote">
                “My invoice is showing the wrong amount — we were charged twice
                for March.”
              </p>
              <h3 className="mt">The result</h3>
              <CodeBlock
                label="onClassified(result)"
                code={`{
  category:   "billing",
  priority:   "high",
  tags:       ["invoice", "payment"],
  confidence: 0.94,
  summary:    "Invoice shows the wrong amount"
}`}
              />
            </div>

            <div className="split-col">
              <h3>Every field is validated</h3>
              <ul className="check-list">
                <li>
                  <strong>category</strong> is matched against your configured
                  list. A classifier cannot invent one — unknown answers fall to
                  your catch-all bucket.
                </li>
                <li>
                  <strong>priority</strong> is coerced to{' '}
                  {PRIORITIES.map((p) => (
                    <code key={p}>{p}</code>
                  ))}
                  . Synonyms like “critical” and “P1” map in; anything
                  unrecognized is discarded rather than trusted.
                </li>
                <li>
                  <strong>tags</strong> are lowercased, hyphenated, deduped and
                  capped at four. Free-form, but never unbounded.
                </li>
                <li>
                  <strong>confidence</strong> is the classifier's own estimate.
                  It is <em>not</em> a calibrated probability, and the UI labels
                  it as such rather than implying more than it means.
                </li>
              </ul>
              <p className="split-text">
                One validation funnel handles all of it, so no provider — model,
                your endpoint, or the offline heuristic — can leak an
                unvalidated field into the UI.
              </p>
            </div>
          </div>
        </section>

        <section className="section section-alt section-centered" id="integrate">
          <div className="section-head">
            <h2>Three ways in</h2>
            <p>The same component, packaged for whatever the host site actually is.</p>
          </div>

          <div className="cards">
            <article className="card">
              <span className="card-num">01</span>
              <h3>React component</h3>
              <p>
                Install the package, import the component and its stylesheet.
                React stays external, so the host app's copy is the only one on
                the page.
              </p>
              <code className="inline-code">npm i {PACKAGE_NAME}</code>
            </article>

            <article className="card">
              <span className="card-num">02</span>
              <h3>One script tag</h3>
              <p>
                For WordPress, Squarespace, or a hand-written HTML page. React is
                bundled in and the widget renders inside a{' '}
                <strong>shadow root</strong>, so the host's stylesheet can't
                reach in and break it.
              </p>
              <code className="inline-code">&lt;div data-intake-widget&gt;</code>
            </article>

            <article className="card">
              <span className="card-num">03</span>
              <h3>Headless hook</h3>
              <p>
                Already have a design system? Take <code>useIntake()</code> and
                render your own markup. You keep the classification, optimistic
                updates, retry and persistence.
              </p>
              <code className="inline-code">useIntake(&#123;...&#125;)</code>
            </article>
          </div>
        </section>

        <section className="section" id="security">
          <div className="section-head">
            <h2>Where the API key lives</h2>
            <p>
              The single most important decision in this project, and the one
              most browser-side AI demos get wrong.
            </p>
          </div>

          <div className="split">
            <div className="split-col">
              <h3 className="bad-title">Key in the front end</h3>
              <p className="split-text">
                Anything prefixed <code>VITE_</code> or <code>REACT_APP_</code>{' '}
                is compiled into the JavaScript you serve. It's visible in
                devtools, in the network tab, and in your source maps. Anyone can
                lift it and bill their usage to you.
              </p>
              <CodeBlock
                label="dev only"
                code={`// fine on localhost, never on a deployed site
<IntakeWidget
  provider="openai"
  apiKey={import.meta.env.VITE_OPENAI_API_KEY}
/>`}
              />
            </div>

            <div className="split-col">
              <h3 className="good-title">Key on a server you own</h3>
              <p className="split-text">
                The widget posts text to your endpoint; your endpoint holds the
                key, validates the model's answer against your category list, and
                returns a clean result. <code>server/</code> has a
                zero-dependency Node proxy and a serverless function, both ready
                to run.
              </p>
              <CodeBlock
                label="production"
                code={`<IntakeWidget
  provider="endpoint"
  endpoint="/api/classify"
/>`}
              />
            </div>
          </div>
        </section>

        <section className="section section-alt section-centered" id="presets">
          <div className="section-head">
            <h2>Presets are configuration, not code</h2>
            <p>
              Each of these is the same component with a different props object.
              Categories carry their own color, keywords, tag rules and default
              priority.
            </p>
          </div>

          <ul className="preset-grid">
            {PRESETS.map((preset) => (
              <li key={preset.id} className="preset-card">
                <h3>{preset.label}</h3>
                <p className="preset-prompt">“{preset.prompt}”</p>
                <ul className="preset-cats">
                  {preset.categories.map((category) => (
                    <li key={category.id} style={{ '--hue': category.hue }}>
                      {category.label}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <CodeBlock
            label="custom categories"
            code={`<IntakeWidget
  categories={[
    'Billing',
    'Technical Support',
    { id: 'logistics', label: 'Logistics', hue: 190,
      defaultPriority: 'high',
      description: 'Shipping, delivery and returns.',
      keywords: ['shipping', 'delivery', 'tracking', 'return'],
      tagRules: [{ tag: 'tracking', match: ['tracking', 'where is'] }] },
  ]}
/>`}
          />
        </section>

        <section className="section" id="details">
          <div className="section-head">
            <h2>Details that took the longest</h2>
            <p>The parts a screenshot doesn't show.</p>
          </div>

          <div className="detail-list">
            <Detail title="Style isolation, both directions">
              CSS Modules keep the widget's rules off the host page. The embed
              build renders into a shadow root so the host's reset can't get in —
              no Bootstrap button rule, no{' '}
              <code>* &#123; box-sizing: content-box !important &#125;</code>.
              All theming is CSS custom properties on the widget root, never on{' '}
              <code>:root</code> or <code>body</code>.
            </Detail>

            <Detail title="It works before it works">
              The offline classifier scores messages against category keywords
              and tag rules, so the widget is demoable with no key, no network
              and no cost. That's what you're using right now — and it's what the
              test suite runs against.
            </Detail>

            <Detail title="Failure is a state, not a crash">
              Rate limits are the normal case with a free-tier key. Requests
              retry with exponential backoff and jitter, honor{' '}
              <code>Retry-After</code>, time out at 30s, and surface a per-item
              retry button. Unmounting aborts in-flight calls.
            </Detail>

            <Detail title="Classifiers don't follow instructions">
              The prompt asks for JSON, but the parser still handles fenced
              blocks, prose wrappers and <code>"Category: Billing."</code>. A
              priority of “banana” is discarded rather than trusted; a category
              outside your list falls back instead of rendering something
              impossible.
            </Detail>

            <Detail title="Priority has a floor">
              A bug report doesn't become low-priority because someone was
              polite about it. Categories declare a default, urgency wording can
              raise it, and the classifier's own answer is honored only once it
              survives validation.
            </Detail>

            <Detail title="Optimistic, then correct">
              Your message appears the instant you submit, with a pending state
              that resolves into a full classification. Nothing waits on the
              round trip.
            </Detail>

            <Detail title="Accessible by default">
              Labelled controls, <code>aria-live</code> status announcements,
              visible focus rings, full keyboard operation, hover-independent
              controls on touch, and honored{' '}
              <code>prefers-reduced-motion</code>. Priority badges carry a
              screen-reader prefix so “High” never reads as a bare adjective.
            </Detail>

            <Detail title="Switching preset can't leave residue">
              Changing preset remounts the widget on a composite key, so results
              classified under the previous category set can't linger beside the
              new ones.
            </Detail>
          </div>
        </section>

        <section className="section section-alt section-centered">
          <div className="section-head">
            <h2>Run it</h2>
          </div>
          <CodeBlock
            label="terminal"
            language="bash"
            code={`npm install
npm start                 # demo site, offline classifier, no key needed

# Optional: real classification, key kept server-side
OPENAI_API_KEY=sk-... npm run proxy

npm test                  # schema, classifier and preset tests
npm run build             # demo + npm package + single-file embed`}
          />
        </section>
      </main>

      <footer className="footer">
        <p>
          Built by John Evans · MIT licensed · <a href="#demo">Back to the demo</a>
        </p>
        <p className="footer-fine">
          Nothing typed into this demo is sent anywhere or stored beyond your own
          browser.
        </p>
      </footer>
    </>
  );
}

function Detail({ title, children }) {
  return (
    <article className="detail">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
