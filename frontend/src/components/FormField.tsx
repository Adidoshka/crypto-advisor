import type { ReactNode } from 'react';

// Shared between Login and Register, which previously duplicated this labeled-input-with-icon block 2-3x each.
export default function FormField({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  rightElement,
  helperText,
}: {
  label: string;
  icon: ReactNode;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  rightElement?: ReactNode;
  helperText?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 ${rightElement ? 'pr-10' : 'pr-3'} py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition`}
        />
        {rightElement}
      </div>
      {helperText && <p className="text-xs text-slate-500 mt-1.5">{helperText}</p>}
    </div>
  );
}
