import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type AdminActionMenuItem = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

export function AdminActionMenu({ items }: { items: AdminActionMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative flex justify-center" ref={menuRef}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        title="Thao tác khác"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 text-sm shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={(event) => {
                event.stopPropagation();
                setIsOpen(false);
                item.onClick();
              }}
              className={`block w-full px-3 py-2 text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                item.tone === "danger"
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
