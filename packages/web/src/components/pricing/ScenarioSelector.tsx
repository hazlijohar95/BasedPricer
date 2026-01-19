/**
 * ScenarioSelector component
 * Allows users to switch between different pricing scenarios (Early Stage, Growth, Mature)
 */

export interface Scenario {
  name: string;
  distribution: Record<string, number>;
  monthlyChurnRate: number;
  conversionRate: number;
}

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioSelector({ scenarios, selectedScenario, onSelect }: ScenarioSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-[0.2rem]">
      {scenarios.map((s) => (
        <button
          key={s.name}
          onClick={() => onSelect(s)}
          className={`px-4 py-1.5 text-sm font-medium rounded-[0.2rem] transition-all duration-200 ${
            selectedScenario.name === s.name
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
