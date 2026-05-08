import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type FilterSelectProps<T extends string> = {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  options: Array<SelectOption<T>>;
  onSelect: (value: T) => void;
  selectedValue?: T;
  menuWidthClass?: string;
  menuClassName?: string;
  align?: "left" | "right";
  leadingIcon?: ReactNode;
  buttonClassName?: string;
};

export function FilterSelect<T extends string>({
  label,
  isOpen,
  onToggle,
  onClose,
  options,
  onSelect,
  selectedValue,
  menuWidthClass = "w-36",
  menuClassName,
  align = "left",
  leadingIcon,
  buttonClassName,
}: FilterSelectProps<T>) {
  const alignmentClass = align === "left" ? "left-0" : "right-0";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground ${buttonClassName ?? ""}`}
      >
        {leadingIcon}
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${alignmentClass} top-[calc(100%+4px)] z-20 ${menuWidthClass} rounded-lg border border-border bg-card py-1 shadow-lg ${menuClassName ?? ""}`}
        >
          {options.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onSelect(item.value);
                onClose();
              }}
              className={`flex w-full items-start justify-between gap-3 px-3 text-left text-foreground hover:bg-muted ${
                item.description ? "py-3" : "py-2"
              }`}
            >
              <span className="flex min-w-0 items-start gap-3">
                {item.icon ? (
                  <span className="mt-0.5 text-muted-foreground">{item.icon}</span>
                ) : null}
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-5">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </span>
              {selectedValue === item.value ? (
                <Check className="mt-0.5 h-4 w-4 flex-none" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
