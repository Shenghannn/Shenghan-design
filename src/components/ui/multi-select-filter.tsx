import { Check, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "../../lib/cn";
import { useExclusiveFilterPanel } from "./exclusive-filter-group";
import { SelectChevron } from "./select-chevron";

export type MultiSelectFilterOption = string | { label: string; value: string };

function normalizeOptions(options: MultiSelectFilterOption[]) {
  return options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
}

type MultiSelectFilterProps = {
  placeholder: string;
  options: MultiSelectFilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  filterPanelId?: string;
  display?: "count" | "tags";
  clearable?: boolean;
};

export function MultiSelectFilter({
  placeholder,
  options,
  value,
  onChange,
  className,
  filterPanelId,
  display = "count",
  clearable = false,
}: MultiSelectFilterProps) {
  const autoId = useId();
  const panelId = filterPanelId ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const { open, setOpen, toggle } = useExclusiveFilterPanel(panelId);
  const normalizedOptions = normalizeOptions(options);
  const canClear = clearable && value.length > 0;
  const label = value.length === 0 ? placeholder : `${placeholder}(${value.length})`;
  const visibleTags = value.slice(0, 1);
  const hiddenCount = Math.max(value.length - visibleTags.length, 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open, setOpen]);

  function toggleOption(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);
  }

  return (
    <div ref={rootRef} className={cn("group relative", className ?? "w-[190px]")}>
      <button
        type="button"
        className="field-control relative flex w-full items-center justify-between gap-2 pr-10 text-left"
        onClick={toggle}
      >
        {display === "tags" && value.length ? (
          <span className="flex min-w-0 items-center gap-1">
            {visibleTags.map((item) => (
              <span
                key={item}
                className="inline-flex max-w-[120px] items-center rounded-sm bg-bg-page px-2 py-0.5 text-small text-text-primary"
              >
                <span className="truncate">{item}</span>
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-sm bg-bg-page px-2 py-0.5 text-small text-text-primary">
                + {hiddenCount}
              </span>
            ) : null}
          </span>
        ) : (
          <span className={cn("min-w-0 flex-1 truncate", value.length ? "text-text-primary" : "text-text-placeholder")}>
            {display === "count" ? label : placeholder}
          </span>
        )}
        <SelectChevron open={open} hideOnHover={canClear} />
      </button>
      {canClear ? (
        <button
          type="button"
          aria-label={`清空${placeholder}`}
          className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary group-hover:flex"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange([]);
            setOpen(false);
          }}
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      ) : null}
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 max-h-[260px] w-full min-w-[220px] overflow-auto rounded-sm border border-border bg-white p-2 shadow-md">
          {normalizedOptions.map((option) => {
            const checked = value.includes(option.value);
            if (display === "tags") {
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-sm px-3 text-left text-small transition hover:bg-bg-hover",
                    checked ? "font-medium text-primary" : "text-text-primary",
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span className="truncate">{option.label}</span>
                  <span className="inline-flex w-4 shrink-0 justify-center text-primary">
                    {checked ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                  </span>
                </button>
              );
            }

            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-small hover:bg-bg-hover"
              >
                <input type="checkbox" checked={checked} onChange={() => toggleOption(option.value)} />
                <span className="truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
