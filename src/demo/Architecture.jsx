/**
 * The whole architecture in one glance: where the request goes, and — the point
 * of the diagram — which side of the line the API key lives on.
 */
const STEPS = [
  { label: 'Host site', note: 'Any page, any stack', side: 'client' },
  { label: 'Intake widget', note: 'Shadow DOM, scoped CSS', side: 'client' },
  { label: 'Your server', note: 'Holds the API key', side: 'server' },
  { label: 'Classifier', note: 'Model provider', side: 'server' },
  { label: 'Structured result', note: 'Validated, then rendered', side: 'server' },
];

export function Architecture() {
  return (
    <div className="architecture">
      <ol className="arch-flow">
        {STEPS.map((step, index) => (
          <li key={step.label} className={`arch-step arch-${step.side}`}>
            <span className="arch-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="arch-label">{step.label}</span>
            <span className="arch-note">{step.note}</span>
          </li>
        ))}
      </ol>

      <p className="arch-caption">
        <span className="arch-key arch-key-client" /> Browser — no secrets
        <span className="arch-key arch-key-server" /> Yours — secrets live here
      </p>

      <ul className="arch-methods">
        <li>React component</li>
        <li>Script embed</li>
        <li>Headless hook</li>
      </ul>
    </div>
  );
}
