import { useMemo, useState } from 'react';
import { IntakeWidget } from '../widget/IntakeWidget.jsx';
import { CodeBlock } from './CodeBlock.jsx';
import { PRESETS, getPreset, presetProps } from '../lib/presets.js';
import { PACKAGE_NAME } from '../lib/product.js';
import { samplesFor } from './samples.js';

const ACCENTS = [
  { value: '#2563eb', name: 'Blue' },
  { value: '#0f766e', name: 'Teal' },
  { value: '#7c3aed', name: 'Violet' },
  { value: '#b45309', name: 'Amber' },
  { value: '#be123c', name: 'Rose' },
];

/**
 * Configure the widget, watch it change, copy the exact code that produces what
 * you're looking at.
 *
 * The preset selector is the important control: switching it changes props on
 * the same `<IntakeWidget>`. There is no per-preset component or branch anywhere
 * below this line -- that is the claim the demo exists to make, so it has to be
 * literally true here.
 */
export function Playground() {
  const [presetId, setPresetId] = useState('support');
  const [config, setConfig] = useState({
    theme: 'light',
    accent: getPreset('support').accent,
    density: 'comfortable',
    radius: 'md',
    showStats: true,
    showHeader: true,
    showJson: true,
  });
  const [tab, setTab] = useState('react');
  // Bumped on preset change and on Reset so the widget remounts with clean
  // state. Without it, results classified under the previous preset's
  // categories would linger beside results from the new one.
  const [generation, setGeneration] = useState(0);

  const preset = getPreset(presetId);
  const set = (key) => (value) => setConfig((c) => ({ ...c, [key]: value }));

  const choosePreset = (id) => {
    setPresetId(id);
    setConfig((c) => ({ ...c, accent: getPreset(id).accent }));
    setGeneration((g) => g + 1);
  };

  const snippets = useMemo(() => buildSnippets(presetId, config), [presetId, config]);
  const samples = samplesFor(presetId);

  return (
    <div className="playground">
      <div className="playground-sidebar">
        <div className="playground-controls">
          <h3 className="controls-title">Configure</h3>

          <Control label="Preset">
            <div className="presets">
              {PRESETS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`preset ${presetId === option.id ? 'is-active' : ''}`}
                  onClick={() => choosePreset(option.id)}
                  aria-pressed={presetId === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="control-hint">{preset.blurb}</p>
          </Control>

          <Control label="Categories">
            <ul className="cat-list">
              {preset.categories.map((category) => (
                <li
                  key={category.id}
                  className="cat-pill"
                  style={{ '--hue': category.hue }}
                  title={category.description}
                >
                  {category.label}
                </li>
              ))}
            </ul>
          </Control>

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
              <Toggle label="Header" checked={config.showHeader} onChange={set('showHeader')} />
              <Toggle label="Breakdown" checked={config.showStats} onChange={set('showStats')} />
              <Toggle label="JSON view" checked={config.showJson} onChange={set('showJson')} />
            </div>
          </Control>

          <Control label="Try an example">
            <div className="samples">
              {samples.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  className="sample"
                  onClick={() => fillField(sample.text)}
                  title={sample.text}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <p className="control-hint">
              Fills the field. The demo runs the offline classifier, so nothing
              you type leaves this page.
            </p>
          </Control>
        </div>
      </div>

      <div className={`playground-preview ${config.theme === 'dark' ? 'is-dark' : ''}`}>
        <div className="preview-chrome">
          <span className="preview-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="preview-url">{urlFor(presetId)}</span>
          <button
            type="button"
            className="preview-reset"
            onClick={() => setGeneration((g) => g + 1)}
            title="Clear results and start over"
          >
            Reset
          </button>
        </div>

        <div className="preview-stage">
          <IntakeWidget
            key={`${presetId}-${generation}`}
            provider="mock"
            persist={false}
            {...presetProps(presetId)}
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
        <CodeBlock code={snippets[tab]} label={tab === 'html' ? 'index.html' : 'App.jsx'} />
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

const HOSTS = {
  support: 'app.example.com/support',
  sales: 'example.com/contact',
  community: 'example.org/get-help',
  prayer: 'your-church.org/prayer',
};

function urlFor(presetId) {
  return HOSTS[presetId] ?? HOSTS.support;
}

/**
 * The widget owns its own textarea state, so the sample buttons write into the
 * DOM node and dispatch the event React listens for. Fine as a demo affordance.
 */
function fillField(text) {
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

function buildSnippets(presetId, config) {
  const preset = getPreset(presetId);
  const categoryList = preset.categories.map((c) => `  '${c.label}',`).join('\n');

  const props = [
    'provider="endpoint"',
    'endpoint="/api/classify"',
    `title=${JSON.stringify(preset.prompt)}`,
    'categories={categories}',
    `theme="${config.theme}"`,
    `accent="${config.accent}"`,
    config.density !== 'comfortable' && `density="${config.density}"`,
    config.radius !== 'md' && `radius="${config.radius}"`,
    !config.showHeader && 'showHeader={false}',
    !config.showStats && 'showStats={false}',
    !config.showJson && 'showJson={false}',
  ].filter(Boolean);

  const react = `import { IntakeWidget } from '${PACKAGE_NAME}';
import '${PACKAGE_NAME}/styles.css';

const categories = [
${categoryList}
];

export function ContactPage() {
  return (
    <IntakeWidget
      ${props.join('\n      ')}
      onClassified={(result) => {
        // { category, priority, tags, confidence, summary }
        routeToTeam(result.category.id, result.priority);
      }}
    />
  );
}`;

  const dataAttrs = [
    'data-intake-widget',
    'data-provider="endpoint"',
    'data-endpoint="/api/classify"',
    `data-title="${preset.prompt}"`,
    `data-categories="${preset.categories.map((c) => c.label).join(',')}"`,
    `data-theme="${config.theme}"`,
    `data-accent="${config.accent}"`,
    config.density !== 'comfortable' && `data-density="${config.density}"`,
    !config.showHeader && 'data-show-header="false"',
    !config.showStats && 'data-show-stats="false"',
    !config.showJson && 'data-show-json="false"',
  ].filter(Boolean);

  const html = `<!-- Anywhere on the page -->
<div
  ${dataAttrs.join('\n  ')}
></div>

<script src="https://your-cdn.com/smart-intake.js" defer></script>`;

  const headless = `import { useIntake } from '${PACKAGE_NAME}';

// Same classification, retry and persistence -- your own markup.
export function CustomIntake() {
  const { submissions, submit, stats, isBusy } = useIntake({
    provider: 'endpoint',
    endpoint: '/api/classify',
    categories,
    onClassified: (result) => {
      // { category, priority, tags, confidence, summary }
      sendToBackend(result);
    },
  });

  return (
    <>
      <MyForm onSubmit={submit} busy={isBusy} />
      {submissions.map((item) => (
        <MyRow
          key={item.id}
          text={item.text}
          category={item.category?.label}
          priority={item.priority}
          tags={item.tags}
        />
      ))}
    </>
  );
}`;

  return { react, html, headless };
}
