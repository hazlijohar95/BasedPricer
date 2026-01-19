/**
 * ValidatedInput component
 * A reusable input with built-in validation and error display
 */

import { useState, useCallback, useEffect } from 'react';
import { Warning, Info } from '@phosphor-icons/react';
import type { ValidationResult } from '../../utils/validation';

type InputType = 'text' | 'number' | 'email' | 'password';

interface ValidatedInputProps {
  /** Input value */
  value: string | number;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Validation function */
  validate?: (value: string | number) => ValidationResult;
  /** Input type */
  type?: InputType;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text shown below input */
  helpText?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Additional class names */
  className?: string;
  /** Input name */
  name?: string;
  /** Minimum value (for number inputs) */
  min?: number;
  /** Maximum value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number | string;
  /** Whether to show validation on blur only */
  validateOnBlur?: boolean;
  /** Whether to treat warnings as errors */
  treatWarningsAsErrors?: boolean;
  /** Prefix content (e.g., currency symbol) */
  prefix?: React.ReactNode;
  /** Suffix content (e.g., unit label) */
  suffix?: React.ReactNode;
}

export function ValidatedInput({
  value,
  onChange,
  validate,
  type = 'text',
  label,
  placeholder,
  helpText,
  disabled = false,
  required = false,
  className = '',
  name,
  min,
  max,
  step,
  validateOnBlur = false,
  treatWarningsAsErrors = false,
  prefix,
  suffix,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  // Run validation
  const runValidation = useCallback((val: string | number) => {
    if (!validate) {
      setValidation({ isValid: true });
      return;
    }
    const result = validate(val);
    setValidation(result);
  }, [validate]);

  // Run validation when value changes (unless validateOnBlur)
  // This intentionally updates state based on prop changes for real-time validation feedback
  useEffect(() => {
    if (!validateOnBlur) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runValidation(value);
    }
  }, [value, runValidation, validateOnBlur]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number'
      ? (e.target.value === '' ? 0 : Number(e.target.value))
      : e.target.value;
    onChange(newValue);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      runValidation(value);
    }
  };

  // Determine if we should show error styling
  const showError = touched && !validation.isValid && (treatWarningsAsErrors || validation.error?.startsWith('Value'));
  const showWarning = touched && !validation.isValid && !showError && validation.error;

  // Build input classes
  const inputClasses = [
    'input-field w-full',
    showError && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
    showWarning && 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20',
    disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
    prefix && 'pl-8',
    suffix && 'pr-12',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}

        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
          aria-invalid={showError}
          aria-describedby={validation.error ? `${name}-error` : undefined}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>

      {/* Help text or validation message */}
      {touched && validation.error ? (
        <div
          id={`${name}-error`}
          className={`flex items-center gap-1.5 mt-1.5 text-xs ${
            showError ? 'text-red-600' : 'text-amber-600'
          }`}
          role={showError ? 'alert' : 'status'}
        >
          {showError ? (
            <Warning size={14} weight="fill" />
          ) : (
            <Info size={14} weight="fill" />
          )}
          {validation.error}
        </div>
      ) : helpText ? (
        <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>
      ) : null}
    </div>
  );
}

/**
 * Simplified version for number inputs with common patterns
 */
interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export function NumberInput({
  value,
  onChange,
  label,
  min,
  max,
  step = 1,
  placeholder,
  helpText,
  disabled,
  className = '',
  prefix,
  suffix,
}: NumberInputProps) {
  // Simple validation based on min/max
  const validate = (val: string | number): ValidationResult => {
    const num = typeof val === 'string' ? Number(val) : val;
    if (isNaN(num)) {
      return { isValid: false, error: 'Must be a valid number' };
    }
    if (min !== undefined && num < min) {
      return { isValid: false, error: `Value must be at least ${min}` };
    }
    if (max !== undefined && num > max) {
      return { isValid: false, error: `Value must be at most ${max}` };
    }
    return { isValid: true };
  };

  return (
    <ValidatedInput
      type="number"
      value={value}
      onChange={(v) => onChange(typeof v === 'number' ? v : Number(v))}
      validate={validate}
      label={label}
      placeholder={placeholder}
      helpText={helpText}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={className}
      prefix={prefix}
      suffix={suffix}
    />
  );
}

/**
 * Currency input with proper formatting
 */
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  currencySymbol?: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  currencySymbol = 'RM',
  placeholder = '0.00',
  helpText,
  disabled,
  className = '',
}: CurrencyInputProps) {
  return (
    <NumberInput
      value={value}
      onChange={onChange}
      label={label}
      min={0}
      step={0.01}
      placeholder={placeholder}
      helpText={helpText}
      disabled={disabled}
      className={className}
      prefix={currencySymbol}
    />
  );
}
