import {
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
export function TextField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        {...props}
        id={id}
        aria-describedby={
          [props['aria-describedby'], hint ? `${id}-hint` : ''].filter(Boolean).join(' ') ||
          undefined
        }
      />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea {...props} id={id} />
    </label>
  );
}
export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  return children ? (
    <p className="field-error" role="alert" id={id}>
      {children}
    </p>
  ) : null;
}
