export default function Field({ label, value, children }) {
  const hasValue = value !== null && value !== undefined && String(value).trim() !== ''
  return (
    <div className="field">
      {hasValue && <div className="field-label">{label}</div>}
      {children}
    </div>
  )
}

