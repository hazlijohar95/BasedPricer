import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  valueColor?: string;
  icon?: ReactNode;
  borderColor?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  valueColor = 'text-gray-900',
  icon,
  borderColor,
}: StatCardProps) {
  return (
    <div
      className={`card p-5 ${borderColor ? `border-l-[3px] ${borderColor}` : ''}`}
    >
      {icon && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{label}</p>
          {icon}
        </div>
      )}
      {!icon && <p className="text-sm text-gray-500">{label}</p>}
      <p className={`text-2xl font-semibold ${valueColor} ${icon ? 'mt-2' : 'mt-1'}`}>
        {value}
      </p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}
