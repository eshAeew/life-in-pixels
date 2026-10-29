import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select option...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[11px] font-semibold text-[#78716C] block mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full px-3.5 py-2.5 bg-white hover:bg-[#FAF9F5] rounded-xl border border-[#EFECE6] text-xs text-[#292524] flex items-center justify-between transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#FFB7B2]"
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="text-[#FFB7B2]">{selectedOption.icon}</span>
          )}
          <span className="font-medium text-[#292524]">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#78716C] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full bg-[#FFFFFF] border border-[#EFECE6] rounded-2xl shadow-lg p-1.5 max-h-56 overflow-y-auto no-scrollbar animate-fade-in"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFB7B2]/20 text-[#292524] font-semibold'
                    : 'text-[#78716C] hover:bg-[#FAF9F5] hover:text-[#292524]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && (
                    <span className="text-[#292524]">{option.icon}</span>
                  )}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.sublabel && (
                      <div className="text-[10px] text-[#A8A29E] font-normal">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} className="text-[#292524] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
