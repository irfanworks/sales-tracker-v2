"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

export type CustomerPickerOption = {
  id: string;
  name: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/** Searchable customer picker — selects an existing customer by id (Pipeline / Prospect). */
export function CustomerSelectAutocomplete({
  customers,
  valueId,
  onSelect,
  disabled,
  placeholder = "Search customer…",
  required,
}: {
  customers: CustomerPickerOption[];
  valueId: string;
  onSelect: (customerId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => customers.find((c) => c.id === valueId) ?? null,
    [customers, valueId]
  );

  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Keep input in sync when parent resets / loads edit value
  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.id, selected?.name]);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((c) => normalize(c.name).includes(q));
  }, [customers, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        // Snap back to selected name if user abandoned mid-type
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected?.name]);

  function pick(customer: CustomerPickerOption) {
    onSelect(customer.id);
    setQuery(customer.name);
    setOpen(false);
    setActiveIndex(0);
  }

  function clear() {
    onSelect("");
    setQuery("");
    setOpen(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(selected?.name ?? "");
      return;
    }

    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const choice = suggestions[activeIndex] ?? suggestions[0];
      if (choice) pick(choice);
    }
  }

  const showList = open && !disabled;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden required field so native form validation still works */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={valueId}
          onChange={() => {}}
          required
        />
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            setActiveIndex(0);
            // Typing away from selection clears id until they pick again
            if (selected && normalize(next) !== normalize(selected.name)) {
              onSelect("");
            }
          }}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="input-field !pl-10 !pr-16"
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && suggestions[activeIndex]
              ? `${listboxId}-opt-${suggestions[activeIndex].id}`
              : undefined
          }
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {valueId && !disabled && (
            <button
              type="button"
              onClick={clear}
              className="rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear customer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              setOpen((o) => !o);
              inputRef.current?.focus();
            }}
            className="rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
            aria-label="Toggle customer list"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border-soft bg-card py-1.5 shadow-elevated animate-fade-in"
        >
          {suggestions.length === 0 ? (
            <li className="px-3.5 py-3 text-[13px] text-slate-500">No customers match “{query}”.</li>
          ) : (
            suggestions.map((customer, index) => {
              const isActive = index === activeIndex;
              const isSelected = customer.id === valueId;
              return (
                <li
                  key={customer.id}
                  id={`${listboxId}-opt-${customer.id}`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(customer)}
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                      isActive ? "bg-cyan-50 text-cyan-950" : "text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0 truncate font-medium">{customer.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-cyan-700" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}

      {selected && (
        <p className="pipeline-hint !mt-1.5">
          Selected: <span className="font-medium text-slate-600">{selected.name}</span>
        </p>
      )}
    </div>
  );
}
