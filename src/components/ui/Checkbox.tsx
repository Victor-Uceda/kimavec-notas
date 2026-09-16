import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, ariaLabel }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel || 'Marcar tarea'}
      onClick={() => onChange(!checked)}
      className={`relative flex items-center justify-center w-[18px] h-[18px] rounded-checkbox transition-colors duration-150 shrink-0 ${
        checked
          ? 'bg-app-action-primary text-white border border-app-action-primary'
          : 'bg-transparent border-[1.5px] border-app-border-subtle hover:border-app-text-secondary'
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </button>
  );
};
