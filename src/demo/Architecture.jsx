/**
 * The whole path a message takes, in one glance. The colour split is the point:
 * it shows which side of the line the API key lives on.
 */
const STEPS = [
  { label: 'Your website', note: 'Where the form sits', side: 'client' },
  { label: 'The widget', note: 'Takes the message', side: 'client' },
  { label: 'Your server', note: 'Keeps your key safe', side: 'server' },
  { label: 'The classifier', note: 'Reads and labels it', side: 'server' },
  { label: 'Back to the page', note: 'Checked, then shown', side: 'server' },
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
        <span>
          <span className="arch-key arch-key-client" /> In the browser — no
          secrets here
        </span>
        <span>
          <span className="arch-key arch-key-server" /> Yours — the key lives
          here
        </span>
      </p>
    </div>
  );
}
