"use client";

type ChipOption = {
  label: string;
  value: string;
};

type ChipSelectorProps = {
  name: string;
  label: string;
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
};

export function ChipSelector({ name, label, value, options, onChange }: ChipSelectorProps) {
  return (
    <div className="field">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="chip-selector" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "selection-chip active" : "selection-chip"}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
