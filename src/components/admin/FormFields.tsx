import styles from './FormFields.module.css'

interface FieldProps {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  hint?: string
}

export function TextField({ label, name, defaultValue, required, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>
      {hint && <p className={styles.hint}>{hint}</p>}
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className={styles.input}
      />
    </div>
  )
}

export function TextareaField({ label, name, defaultValue, required, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>
      {hint && <p className={styles.hint}>{hint}</p>}
      <textarea
        name={name}
        defaultValue={defaultValue ?? ''}
        required={required}
        className={styles.textarea}
        rows={5}
      />
    </div>
  )
}

interface SelectFieldProps extends FieldProps {
  options: { value: string; label: string }[]
}

export function SelectField({ label, name, defaultValue, required, options }: SelectFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}{required && <span className={styles.req}>*</span>}</label>
      <select name={name} defaultValue={defaultValue ?? ''} required={required} className={styles.select}>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

export function CheckboxField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: boolean }) {
  return (
    <div className={styles.checkboxField}>
      <input
        type="checkbox"
        name={name}
        id={name}
        defaultChecked={defaultValue ?? false}
        className={styles.checkbox}
      />
      <label htmlFor={name} className={styles.checkboxLabel}>{label}</label>
    </div>
  )
}

export function NumberField({ label, name, defaultValue, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {hint && <p className={styles.hint}>{hint}</p>}
      <input
        type="number"
        name={name}
        defaultValue={defaultValue ?? ''}
        className={`${styles.input} ${styles.numberInput}`}
      />
    </div>
  )
}
