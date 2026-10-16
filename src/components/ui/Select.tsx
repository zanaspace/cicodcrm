"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/primitives/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/primitives/popover";

interface SelectProps {
  options: string[];
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  /** Accessible name when there is no visible <label>. */
  ariaLabel?: string;
  /** Show a filter box at the top of the list (useful for long lists such as countries). */
  searchable?: boolean;
  invalid?: boolean;
  /** Disabled: greyed out, not focusable, cannot be opened. A `title` still shows on hover. */
  disabled?: boolean;
  /** Tooltip on the control (shown even when disabled, e.g. "Requires full Settings access"). */
  title?: string;
}

/** Radix Select rejects "" as an item value, so an empty option is mapped to this sentinel. */
const EMPTY = "__crm_select_empty__";
const toItem = (v: string) => (v === "" ? EMPTY : v);
const fromItem = (v: string) => (v === EMPTY ? "" : v);

/** Trigger look shared by both modes (CRM field: 1.5px input border, card background). */
const TRIGGER =
  "flex items-center justify-between gap-2 h-full min-h-10 w-full rounded-md border-[1.5px] border-[var(--input)] bg-[var(--card)] dark:bg-[var(--card)] dark:hover:bg-[var(--card)] px-4 py-2 text-[0.85rem] text-[var(--foreground)] cursor-pointer transition-colors text-left shadow-none whitespace-normal focus:outline-none focus-visible:ring-0 focus-visible:border-[var(--ring)] data-[state=open]:border-[var(--ring)] data-[state=open]:shadow-[0_0_0_1px_var(--ring)] disabled:pointer-events-none disabled:opacity-50";

const LIST = "min-w-[180px] max-h-[240px] overflow-y-auto bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-md shadow-lg z-50";

const OPTION = "px-3 py-2 text-[0.85rem] cursor-pointer rounded transition-colors text-[var(--foreground)]";
const OPTION_SELECTED = "bg-[rgba(242,169,59,0.08)] text-[var(--primary)] font-semibold";

/**
 * Single-choice dropdown. Value-based API (`onChange(value)`), controlled when `value` is passed.
 * - Default: the shadcn/ui select primitive (Radix Select: listbox semantics, typeahead, arrow keys, Esc).
 * - `searchable`: a combobox on the shadcn/ui popover primitive with a filter box and arrow-key navigation.
 */
export function Select({ options, placeholder = "Select...", value, onChange, className, ariaLabel, searchable, invalid, disabled, title }: SelectProps) {
  const [internal, setInternal] = React.useState(value || "");

  // Controlled when `value` is passed, so external resets show up.
  const selected = value !== undefined ? value : internal;

  const handleSelect = (option: string) => {
    setInternal(option);
    if (onChange) onChange(option);
  };

  const label = (
    <span className={cn("truncate min-w-0", !selected ? "text-[var(--muted-foreground)]" : "font-medium")}>
      {selected || placeholder}
    </span>
  );

  if (searchable) {
    return (
      <SearchableSelect
        options={options}
        selected={selected}
        onSelect={handleSelect}
        className={className}
        ariaLabel={ariaLabel}
        invalid={invalid}
        disabled={disabled}
        title={title}
        label={label}
      />
    );
  }

  return (
    <div title={title} className={cn("relative w-full select-none", disabled && "cursor-not-allowed", className)}>
      <SelectRoot value={selected ? toItem(selected) : ""} onValueChange={(v) => handleSelect(fromItem(v))} disabled={disabled}>
        <SelectTrigger
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          className={cn(TRIGGER, "data-[size=default]:h-full [&>svg]:opacity-100", invalid ? "border-[var(--destructive)]" : "")}
        >
          {/* Children override the primitive's value rendering, so a value missing from `options` still shows. */}
          <SelectValue placeholder={label}>{selected ? label : undefined}</SelectValue>
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={4}
          className={cn(LIST, "w-[var(--radix-select-trigger-width)] max-h-[min(240px,var(--radix-select-content-available-height))]")}
        >
          {options.map((opt) => (
            <SelectItem
              key={opt}
              value={toItem(opt)}
              className={cn(
                OPTION,
                "pl-3 pr-8 focus:bg-[var(--accent)] focus:text-[var(--accent-foreground)] data-[state=checked]:bg-[rgba(242,169,59,0.08)] data-[state=checked]:text-[var(--primary)] data-[state=checked]:font-semibold [&_svg:not([class*='text-'])]:text-[var(--primary)]",
              )}
            >
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}

function SearchableSelect({
  options,
  selected,
  onSelect,
  className,
  ariaLabel,
  invalid,
  disabled,
  title,
  label,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  title?: string;
  label: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listId = React.useId();
  const listRef = React.useRef<HTMLDivElement>(null);

  const visible = query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options;

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    setQuery("");
    if (open) setActive(Math.max(0, options.indexOf(selected)));
  };

  const choose = (opt: string) => {
    onSelect(opt);
    setOpen(false);
  };

  // Keep the highlighted option in view while moving with the keyboard.
  React.useEffect(() => {
    if (!isOpen) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, isOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.min(visible.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : visible.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[active] !== undefined) choose(visible[active]);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div title={title} className={cn("relative w-full select-none", disabled && "cursor-not-allowed", className)}>
      {/* modal: lets the list scroll when the select sits inside a Modal/Drawer (their scroll lock would block it). */}
      <Popover open={isOpen} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            className={cn(TRIGGER, invalid ? "border-[var(--destructive)]" : "")}
          >
            {label}
            <ChevronDown className="w-4 h-4 shrink-0 text-[var(--muted-foreground)] pointer-events-none" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className={cn(LIST, "p-1 w-[var(--radix-popover-trigger-width)] overflow-hidden flex flex-col max-h-[min(280px,var(--radix-popover-content-available-height))]")}
        >
          <input
            autoFocus
            role="combobox"
            aria-label={ariaLabel ? `Filter ${ariaLabel}` : "Filter options"}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={visible[active] !== undefined ? optionId(active) : undefined}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Type to filter…"
            className="w-full h-8 mb-1 px-2 shrink-0 rounded border border-[var(--input)] bg-[var(--background)] text-[0.82rem] focus:outline-none focus:border-[var(--ring)]"
          />
          <div ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} className="overflow-y-auto min-h-0">
            {visible.length === 0 && <div className="px-3 py-2 text-[0.82rem] text-[var(--muted-foreground)]">No matches</div>}
            {visible.map((opt, i) => (
              <div
                key={opt}
                id={optionId(i)}
                data-index={i}
                role="option"
                aria-selected={selected === opt}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(opt)}
                className={cn(
                  OPTION,
                  "flex items-center justify-between gap-2",
                  selected === opt ? OPTION_SELECTED : i === active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "",
                  selected === opt && i === active && "ring-1 ring-inset ring-[var(--ring)]",
                )}
              >
                <span className="truncate">{opt}</span>
                {selected === opt && <Check className="w-4 h-4 shrink-0" />}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
