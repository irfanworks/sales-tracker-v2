"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";

export type CustomerPickerOption = {
  id: string;
  name: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Remote searchable customer picker. Optionally seed with the currently
 * selected customer so edit forms do not need the full master list.
 */
export function CustomerSelectAutocomplete({
  valueId,
  valueLabel,
  onSelect,
  disabled,
  placeholder = "Search customer…",
  required,
}: {
  valueId: string;
  valueLabel?: string;
  onSelect: (customer: { id: string; name: string } | null) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(valueLabel ?? "");
  const [selectedLabel, setSelectedLabel] = useState(valueLabel ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<CustomerPickerOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(valueLabel ?? "");
    setSelectedLabel(valueLabel ?? "");
  }, [valueId, valueLabel]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/customers/search?q=${encodeURIComponent(q)}&limit=20`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const body = (await res.json()) as { customers?: CustomerPickerOption[] };
        setSuggestions(body.customers ?? []);
        setActiveIndex(0);
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedLabel]);

  function pick(customer: CustomerPickerOption) {
    onSelect(customer);
    setQuery(customer.name);
    setSelectedLabel(customer.name);
    setOpen(false);
    setActiveIndex(0);
  }

  function clear() {
    onSelect(null);
    setQuery("");
    setSelectedLabel("");
    setSuggestions([]);
    setOpen(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery(selectedLabel);
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
            if (valueId && normalize(next) !== normalize(selectedLabel)) {
              onSelect(null);
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
          {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-slate-400" />}
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
          {query.trim().length < 1 ? (
            <li className="px-3.5 py-3 text-[13px] text-slate-500">
              Type at least 1 character to search.
            </li>
          ) : loading && suggestions.length === 0 ? (
            <li className="px-3.5 py-3 text-[13px] text-slate-500">Searching…</li>
          ) : suggestions.length === 0 ? (
            <li className="px-3.5 py-3 text-[13px] text-slate-500">
              No customers match “{query}”.
            </li>
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

      {valueId && selectedLabel && (
        <p className="pipeline-hint !mt-1.5">
          Selected: <span className="font-medium text-slate-600">{selectedLabel}</span>
        </p>
      )}
    </div>
  );
}
