import { useMemo, useState } from 'react';
import { PrayerRequestWidget } from '../widget/PrayerRequestWidget.jsx';
import { CodeBlock } from './CodeBlock.jsx';
import { SAMPLE_REQUESTS } from './samples.js';

const ACCENTS = [
  { value: '#2563eb', name: 'Blue' },
  { value: '#0f766e', name: 'Teal' },
  { value: '#7c3aed', name: 'Violet' },
  { value: '#b45309', name: 'Amber' },
  { value: '#be123c', name: 'Rose' },
];

/**
 * Configure the widget, see it change, copy the exact code that produces what
 * you're looking at. The generated snippets are derived from the same state the
 * preview renders from, so they can't drift.
 */
export function Playground() {
  const [config, setConfig] = useState({
    theme: 'light',
    accent: '#2563eb',
    density: 'comfortable',
    radius: 'md',
    showStats: true,
    showHeader: true,
    showTimestamps: true,
  });
  const [tab, setTab] = useState('react');
  const [seed, setSeed] = useState(0);

  const set = (key) => (value) => setConfig((c) => ({ ...c, [key]: value }));

  const snippets = useMemo(() => buildSnippets(config), [config]);

  return (
    <div className="playground">
      {/* The sticky panel needs a non-sticky grid item to sit inside:
          a sticky grid item is constrained by the whole grid, so it would
          slide down over the code block in the second row. */}
      <div className="playground-sidebar">
        <div className="playground-controls">
          <h3 className="controls-title">Configure</h3>

          <Control label="Theme">
            <Segmented
              value={config.theme}
              onChange={set('theme')}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto' },
              ]}
            />
          </Control>

          <Control label="Accent">
            <div className="swatches">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.value}
                  type="button"
                  className={`swatch ${config.accent === accent.value ? 'is-active' : ''}`}
                  style={{ '--swatch': accent.value }}
                  onClick={() => set('accent')(accent.value)}
                  title={accent.name}
                >
                  <span className="sr-only">{accent.name}</span>
                </button>
              ))}
            </div>
          </Control>

          <Control label="Density">
            <Segmented
              value={config.density}
              onChange={set('density')}
              options={[
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
          </Control>

          <Control label="Corners">
            <Segmented
              value={config.radius}
              onChange={set('radius')}
              options={[
                { value: 'sm', label: 'Sharp' },
                { value: 'md', label: 'Medium' },
                { value: 'xl', label: 'Round' },
              ]}
            />
          </Control>

          <Control label="Show">
            <div className="toggles">
              <Toggle
                label="Header"
                checked={config.showHeader}
                onChange={set('showHeader')}
              />
              <Toggle
                label="Breakdown"
                checked={config.showStats}
                onChange={set('showStats')}
              />
              <Toggle
                label="Timestamps"
                checked={config.showTimestamps}
                onChange={set('showTimestamps')}
              />
            </div>
          </Control>

          <Control label="Try an example">
            <div className="samples">
              {SAMPLE_REQUESTS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  className="sample"
                  onClick={() => copyToField(sample.text)}
                  title={sample.text}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <p className="control-hint">
              Fills the field below. The demo runs the offline provider, so
              nothing you type leaves this page.
            </p>
          </Control>
        </div>
      </div>

      <div
        className={`playground-preview ${config.theme === 'dark' ? 'is-dark' : ''}`}
      >
        <div className="preview-chrome">
          <span className="preview-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="preview-url">your-church.org/prayer</span>
          <button
            type="button"
            className="preview-reset"
            onClick={() => setSeed((s) => s + 1)}
            title="Reset the widget"
          >
            Reset
          </button>
        </div>

        <div className="preview-stage">
          <PrayerRequestWidget
            key={seed}
            provider="mock"
            persist={false}
            {...config}
          />
        </div>
      </div>

      <div className="playground-code">
        <div className="tabs" role="tablist">
          {[
            { id: 'react', label: 'React' },
            { id: 'html', label: 'Any website' },
            { id: 'headless', label: 'Headless' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              className={`tab ${tab === option.id ? 'is-active' : ''}`}
              onClick={() => setTab(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <CodeBlock
          code={snippets[tab]}
          label={tab === 'html' ? 'index.html' : 'App.jsx'}
        />
      </div>
    </div>
  );
}

function Control({ label, children }) {
  return (
    <div className="control">
      <span className="control-label">{label}</span>
      {children}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segment ${value === option.value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * The demo widget owns its own textarea state, so the sample buttons write into
 * the DOM node and dispatch the event React listens for. Fine for a demo affordance.
 */
function copyToField(text) {
  const textarea = document.querySelector('.preview-stage textarea');
  if (!textarea) return;

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  ).set;
  setter.call(textarea, text);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function buildSnippets(config) {
  const props = [
    'provider="endpoint"',
    'endpoint="/api/categorize"',
    `theme="${config.theme}"`,
    `accent="${config.accent}"`,
    config.density !== 'comfortable' && `density="${config.density}"`,
    config.radius !== 'md' && `radius="${config.radius}"`,
    !config.showHeader && 'showHeader={false}',
    !config.showStats && 'showStats={false}',
    !config.showTimestamps && 'showTimestamps={false}',
  ].filter(Boolean);

  const react = `import { PrayerRequestWidget } from 'prayer-request-widget';
import 'prayer-request-widget/styles.css';

export function PrayerPage() {
  return (
    <PrayerRequestWidget
      ${props.join('\n      ')}
      onResult={(result) => console.log(result.category.label)}
    />
  );
}`;

  const dataAttrs = [
    'data-prayer-widget',
    'data-provider="endpoint"',
    'data-endpoint="/api/categorize"',
    `data-theme="${config.theme}"`,
    `data-accent="${config.accent}"`,
    config.density !== 'comfortable' && `data-density="${config.density}"`,
    config.radius !== 'md' && `data-radius="${config.radius}"`,
    !config.showHeader && 'data-show-header="false"',
    !config.showStats && 'data-show-stats="false"',
    !config.showTimestamps && 'data-show-timestamps="false"',
  ].filter(Boolean);

  const html = `<!-- Anywhere on the page -->
<div
  ${dataAttrs.join('\n  ')}
></div>

<script src="https://your-cdn.com/prayer-widget.js" defer></script>`;

  const headless = `import { usePrayerRequests } from 'prayer-request-widget';

// Same categorization, retry, and persistence -- your own markup.
export function CustomPrayerBoard() {
  const { requests, submit, stats } = usePrayerRequests({
    provider: 'endpoint',
    endpoint: '/api/categorize',
  });

  return (
    <div>
      <MyForm onSubmit={submit} />
      {stats.byCategory.map(({ category, count }) => (
        <MyBar key={category.id} label={category.label} count={count} />
      ))}
      {requests.map((r) => (
        <MyCard key={r.id} text={r.text} category={r.category} />
      ))}
    </div>
  );
}`;

  return { react, html, headless };
}
