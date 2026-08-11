import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * One config, three build targets. Pick with BUILD_TARGET:
 *
 *   demo  -> the portfolio site in src/demo (default for `vite dev`)
 *   lib   -> ES + CJS package for React consumers; React stays external
 *   embed -> single-file IIFE for plain HTML sites; React is bundled in
 */
const target = process.env.BUILD_TARGET ?? 'demo';

/**
 * Vite's library mode emits CSS as a sibling .css file. That's correct for the
 * `lib` target (bundlers pick it up via the "./styles.css" export), but for the
 * one-script-tag `embed` target it would force the host page to add a <link>.
 *
 * So for `embed` we lift the CSS text into the JS bundle as a global. embed.jsx
 * then decides where it belongs -- inside the widget's shadow root when we own
 * one, otherwise the document head.
 */
function inlineCssAsGlobal() {
  return {
    name: 'inline-css-as-global',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const cssFiles = Object.keys(bundle).filter((f) => f.endsWith('.css'));
      if (cssFiles.length === 0) return;

      const css = cssFiles
        .map((file) => {
          const asset = bundle[file];
          delete bundle[file];
          return typeof asset.source === 'string'
            ? asset.source
            : Buffer.from(asset.source).toString('utf8');
        })
        .join('\n');

      const entry = Object.values(bundle).find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry
      );
      if (!entry) return;

      entry.code = `globalThis.__SMART_INTAKE_CSS__=${JSON.stringify(css)};\n${entry.code}`;
    },
  };
}

const shared = {
  plugins: [react()],
  css: {
    modules: {
      // Readable in devtools, still collision-proof on a host page.
      generateScopedName: 'si-[local]-[hash:base64:5]',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
};

export default defineConfig(() => {
  if (target === 'lib') {
    return {
      ...shared,
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        lib: {
          entry: 'src/index.js',
          name: 'SmartIntakeWidget',
          formats: ['es', 'cjs'],
          fileName: (format) =>
            format === 'es'
              ? 'smart-intake-widget.js'
              : 'smart-intake-widget.cjs',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
          output: {
            // Without this, CJS consumers would need `.default` to reach the
            // component even when importing it by name.
            exports: 'named',
            assetFileNames: 'smart-intake-widget.[ext]',
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
      },
    };
  }

  if (target === 'embed') {
    return {
      ...shared,
      plugins: [react(), inlineCssAsGlobal()],
      define: {
        // React reads this; without it the IIFE ships the dev build.
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        outDir: 'dist-embed',
        emptyOutDir: true,
        sourcemap: true,
        cssCodeSplit: false,
        lib: {
          entry: 'src/embed.jsx',
          name: 'SmartIntake',
          formats: ['iife'],
          fileName: () => 'smart-intake.js',
        },
      },
    };
  }

  // demo / dev server
  return {
    ...shared,
    build: {
      outDir: 'dist-demo',
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
