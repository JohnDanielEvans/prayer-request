import { Playground } from './Playground.jsx';
import { CodeBlock } from './CodeBlock.jsx';
import { DEFAULT_CATEGORIES } from '../lib/categories.js';
import heroImage from '../assets/images/church-bg.jpg';

export function App() {
  return (
    <>
      <a className="skip-link" href="#demo">
        Skip to the demo
      </a>

      <header
        className="hero"
        style={{ '--hero-image': `url(${heroImage})` }}
      >
        <div className="hero-inner">
          <p className="eyebrow">React component · Embeddable widget</p>
          {/* No manual line break -- the max-width on .hero h1 does the
              wrapping, and a <br> would break badly between breakpoints. */}
          <h1>Prayer requests, sorted the moment someone hits submit.</h1>
          <p className="hero-sub">
            A church gets hundreds of requests and no way to see the shape of
            them. This widget classifies each one as it arrives — and drops into
            a React app as a component, or into any website with a single script
            tag.
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
              <strong>3</strong> integration paths
            </li>
            <li>
              <strong>0</strong> runtime dependencies
            </li>
            <li>
              <strong>0</strong> keys in the browser
            </li>
          </ul>
        </div>
      </header>

      <main>
        <section className="section" id="demo">
          <div className="section-head">
            <h2>Live demo</h2>
            <p>
              Change the configuration and the code updates with it. This
              instance runs the offline provider — no API key, no network, no
              cost.
            </p>
          </div>
          <Playground />
        </section>

        <section className="section section-alt" id="integrate">
          <div className="section-head">
            <h2>Three ways in</h2>
            <p>
              The same component, packaged for whatever the host site actually
              is.
            </p>
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
              <code className="inline-code">npm i prayer-request-widget</code>
            </article>

            <article className="card">
              <span className="card-num">02</span>
              <h3>One script tag</h3>
              <p>
                For WordPress, Squarespace, or a hand-written HTML page. React
                is bundled in and the widget renders inside a{' '}
                <strong>shadow root</strong>, so the host's stylesheet can't
                reach in and break it.
              </p>
              <code className="inline-code">&lt;div data-prayer-widget&gt;</code>
            </article>

            <article className="card">
              <span className="card-num">03</span>
              <h3>Headless hook</h3>
              <p>
                Already have a design system? Take{' '}
                <code>usePrayerRequests()</code> and render your own markup. You
                keep the categorization, optimistic updates, retry, and
                persistence.
              </p>
              <code className="inline-code">usePrayerRequests(&#123;...&#125;)</code>
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
                devtools, in the network tab, and in your source maps. Anyone
                can lift it and bill their usage to you.
              </p>
              <CodeBlock
                label="dev only"
                code={`// fine on localhost, never on a deployed site
<PrayerRequestWidget
  provider="openai"
  apiKey={import.meta.env.VITE_OPENAI_API_KEY}
/>`}
              />
            </div>

            <div className="split-col">
              <h3 className="good-title">Key on a server you own</h3>
              <p className="split-text">
                The widget posts text to your endpoint; your endpoint holds the
                key. You get rate limiting, logging, and the ability to swap
                models without shipping new front-end code.{' '}
                <code>server/</code> has a zero-dependency Node proxy and a
                serverless function, both ready to run.
              </p>
              <CodeBlock
                label="production"
                code={`<PrayerRequestWidget
  provider="endpoint"
  endpoint="/api/categorize"
/>`}
              />
            </div>
          </div>
        </section>

        <section className="section section-alt section-centered">
          <div className="section-head">
            <h2>Categories</h2>
            <p>
              Nine defaults, each with its own hue. Pass your own list to replace
              them — colors are derived from the category name, so custom sets
              stay visually consistent.
            </p>
          </div>

          <ul className="category-grid">
            {DEFAULT_CATEGORIES.map((category) => (
              <li
                key={category.id}
                className="category-chip"
                style={{ '--hue': category.hue }}
              >
                <span className="category-name">{category.label}</span>
                <span className="category-desc">{category.description}</span>
              </li>
            ))}
          </ul>

          <CodeBlock
            label="custom categories"
            code={`<PrayerRequestWidget
  categories={[
    'Health',
    'Family',
    { id: 'missions', label: 'Missions', hue: 190,
      description: 'Sending, support, and field workers.' },
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
              build renders into a shadow root so the host's reset can't get in.
              All theming is CSS custom properties on the widget root — never on{' '}
              <code>:root</code> or <code>body</code>.
            </Detail>

            <Detail title="It works before it works">
              The offline provider scores requests against category keywords, so
              the widget is demoable with no key, no network, and no cost. That's
              what you're using right now.
            </Detail>

            <Detail title="Failure is a state, not a crash">
              Rate limits are the normal case with a free-tier key. Requests
              retry with exponential backoff and jitter, honor{' '}
              <code>Retry-After</code>, time out at 30s, and surface a per-item
              retry button. Unmounting aborts in-flight calls.
            </Detail>

            <Detail title="Models don't always follow instructions">
              The prompt asks for JSON, but the normalizer still handles fenced
              blocks, prose wrappers, <code>"Category: Health."</code>, and
              unknown labels — falling back to keyword scoring before it gives up
              and returns <em>Other</em>.
            </Detail>

            <Detail title="Optimistic, then correct">
              Your words appear the instant you submit, with a pending state that
              resolves into a category. Nothing waits on the round trip.
            </Detail>

            <Detail title="Accessible by default">
              Labelled controls, <code>aria-live</code> status announcements,
              visible focus rings, full keyboard operation, hover-independent
              controls on touch, and honored{' '}
              <code>prefers-reduced-motion</code>.
            </Detail>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-head">
            <h2>Run it</h2>
          </div>
          <CodeBlock
            label="terminal"
            language="bash"
            code={`npm install
npm start                 # demo site, offline provider, no key needed

# Optional: real categorization, key kept server-side
OPENAI_API_KEY=sk-... npm run proxy

npm test                  # provider and normalizer tests
npm run build             # demo + npm package + single-file embed`}
          />
        </section>
      </main>

      <footer className="footer">
        <p>
          Built by John Evans · MIT licensed ·{' '}
          <a href="#demo">Back to the demo</a>
        </p>
        <p className="footer-fine">
          Prayer requests are personal. Nothing typed into this demo is sent
          anywhere or stored beyond your own browser.
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
