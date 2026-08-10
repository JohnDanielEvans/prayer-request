import { useId, useRef, useState } from 'react';
import { SendIcon, SpinnerIcon } from './Icons.jsx';
import styles from './widget.module.css';

export function RequestForm({
  onSubmit,
  placeholder,
  submitLabel,
  helperText,
  maxLength,
  isBusy,
  disabled,
}) {
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const remaining = maxLength ? maxLength - value.length : null;
  const nearLimit = remaining !== null && remaining <= 40;

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (isEmpty || disabled) return;

    onSubmit(trimmed);
    setValue('');
    setTouched(false);
    // Keep focus in the field: people often submit several requests in a row.
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    // Cmd/Ctrl+Enter submits, matching every other comment box on the web.
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  const showEmptyError = touched && isEmpty;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldWrap}>
        <label className={styles.srOnly} htmlFor={fieldId}>
          {placeholder}
        </label>
        <textarea
          id={fieldId}
          ref={textareaRef}
          className={styles.textarea}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength || undefined}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
          disabled={disabled}
          aria-describedby={helperId}
          aria-invalid={showEmptyError || undefined}
        />
        {remaining !== null && (
          <span
            className={`${styles.counter} ${nearLimit ? styles.counterWarn : ''}`}
            aria-hidden="true"
          >
            {remaining}
          </span>
        )}
      </div>

      <div className={styles.formFooter}>
        <p className={styles.helper} id={helperId}>
          {showEmptyError ? 'Please write your request first.' : helperText}
        </p>
        <button
          className={styles.submit}
          type="submit"
          disabled={disabled || isEmpty}
        >
          {isBusy ? (
            <SpinnerIcon className={styles.spinning} />
          ) : (
            <SendIcon />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
