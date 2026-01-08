interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-11 h-6 rounded-[0.2rem] transition-all relative flex-shrink-0 ${
        checked ? 'bg-[#253ff6]' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-[0.2rem] bg-white shadow-sm transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}
