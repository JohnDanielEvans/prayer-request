import { useEffect, useState } from 'react';

export function CodeBlock({ code, language = 'jsx', label }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="code">
      <figcaption className="code-bar">
        <span className="code-label">{label ?? language}</span>
        <button type="button" className="code-copy" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="code-body">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
