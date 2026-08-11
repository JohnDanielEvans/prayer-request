import { createRoot } from 'react-dom/client';
import { IntakeWidget } from './widget/IntakeWidget.jsx';

/**
 * The no-build path: one script tag on any website, React bundled in.
 *
 *   <div id="intake"></div>
 *   <script src="smart-intake.js"></script>
 *   <script>SmartIntake.mount('#intake', { endpoint: '/api/classify' });</script>
 *
 * Or fully declarative, with no JS of your own:
 *
 *   <div data-intake-widget data-endpoint="/api/classify" data-theme="dark"></div>
 *
 * By default the widget renders inside a shadow root. That is the only way to
 * guarantee a stranger's stylesheet -- a Bootstrap reset, a WordPress theme,
 * `* { box-sizing: content-box }` -- can't reach in and break the layout.
 */

const mounted = new WeakMap();

export function mount(target, options = {}) {
  const host = resolveHost(target);
  if (!host) {
    console.error('[SmartIntake] mount target not found:', target);
    return null;
  }

  // Re-mounting the same node should replace, not stack.
  mounted.get(host)?.unmount();

  const { shadow = true, ...props } = options;
  const container = shadow ? attachShadowContainer(host) : host;
  if (!shadow) injectStylesInto(document.head);

  const root = createRoot(container);
  root.render(<IntakeWidget {...props} />);

  const instance = {
    unmount() {
      root.unmount();
      mounted.delete(host);
      if (shadow) host.shadowRoot?.replaceChildren();
    },
    update(nextProps) {
      root.render(<IntakeWidget {...props} {...nextProps} />);
    },
  };

  mounted.set(host, instance);
  return instance;
}

/** Mounts every `[data-intake-widget]` on the page. Runs automatically on load. */
export function autoMount(scope = document) {
  return Array.from(scope.querySelectorAll('[data-intake-widget]'))
    .filter((el) => !mounted.has(el))
    .map((el) => mount(el, readOptions(el)));
}

function resolveHost(target) {
  if (typeof target === 'string') return document.querySelector(target);
  if (target instanceof Element) return target;
  return null;
}

function attachShadowContainer(host) {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  root.replaceChildren();
  injectStylesInto(root);

  const container = document.createElement('div');
  root.appendChild(container);
  return container;
}

/**
 * The build lifts the widget CSS into this global (see inlineCssAsGlobal in
 * vite.config.js) so a single file carries both markup and styles.
 */
function injectStylesInto(node) {
  const css = globalThis.__SMART_INTAKE_CSS__;
  if (!css) return;
  if (node.querySelector?.('style[data-smart-intake-styles]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-smart-intake-styles', '');
  style.textContent = css;
  node.appendChild(style);
}

/** `data-max-length="400"` -> `{ maxLength: 400 }`, with types coerced. */
function readOptions(el) {
  const options = {};

  for (const [key, raw] of Object.entries(el.dataset)) {
    if (key === 'intakeWidget') continue;

    if (key === 'categories') {
      // Either JSON, or a plain comma-separated list.
      options[key] = raw.trim().startsWith('[')
        ? safeParse(raw)
        : raw.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (raw === 'true' || raw === 'false') {
      options[key] = raw === 'true';
    } else if (raw !== '' && !Number.isNaN(Number(raw))) {
      options[key] = Number(raw);
    } else {
      options[key] = raw;
    }
  }

  return options;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[SmartIntake] could not parse data-categories:', raw);
    return undefined;
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoMount(), { once: true });
  } else {
    autoMount();
  }
}

// Named exports only: the IIFE global is `SmartIntake`, so a default export
// here would push the API down to `SmartIntake.default.mount`.
