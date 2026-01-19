type BillingCycle = 'monthly' | 'annual';

interface BillingCycleToggleProps {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  discount?: number;
  size?: 'sm' | 'md';
}

export function BillingCycleToggle({
  value,
  onChange,
  discount = 17,
  size = 'md',
}: BillingCycleToggleProps) {
  const isSmall = size === 'sm';

  return (
    <div className={`inline-flex items-center bg-gray-100 p-1 rounded-[0.2rem] ${
      isSmall ? '' : 'bg-gray-100/80'
    }`}>
      <button
        onClick={() => onChange('monthly')}
        className={`${isSmall ? 'px-4 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'} font-medium rounded-[0.2rem] transition-all duration-200 ${
          value === 'monthly'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange('annual')}
        className={`${isSmall ? 'px-4 py-1.5 text-xs' : 'px-6 py-2.5 text-sm'} font-medium rounded-[0.2rem] transition-all duration-200 flex items-center gap-1.5 ${
          value === 'annual'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Annual
        <span className={`${isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'} bg-emerald-500 text-white rounded-[0.2rem] font-semibold`}>
          -{discount}%
        </span>
      </button>
    </div>
  );
}
