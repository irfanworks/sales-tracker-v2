"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { customerDetailPath } from "@/lib/customerPaths";

export interface CustomerNameOption {
  id: string;
  name: string;
  slug?: string | null;
  sector?: string | null;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function findExactCustomerMatch(name: string, existingCustomers: CustomerNameOption[]) {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  return existingCustomers.find((c) => normalizeName(c.name) === normalized) ?? null;
}

export function CustomerNameAutocomplete({
  value,
  onChange,
  existingCustomers,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  existingCustomers: CustomerNameOption[];
  disabled?: boolean;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedInput = normalizeName(value);
  const suggestions =
    normalizedInput.length > 0
      ? existingCustomers
          .filter((c) => normalizeName(c.name).includes(normalizedInput))
          .slice(0, 8)
      : [];

  const exactMatch = findExactCustomerMatch(value, existingCustomers);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(customer: CustomerNameOption) {
    onChange(customer.name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id="customer-name"
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="input-field"
        placeholder="Start typing to search existing customers..."
        required
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((customer, index) => (
            <li key={customer.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(customer)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-cyan-50 ${
                  index === activeIndex ? "bg-cyan-50" : ""
                }`}
              >
                <span className="font-medium text-slate-800">{customer.name}</span>
                {customer.sector && (
                  <span className="text-xs text-slate-500">{customer.sector}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {exactMatch && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This customer already exists.{" "}
            <Link
              href={customerDetailPath(exactMatch)}
              className="font-medium text-cyan-800 underline hover:text-cyan-900"
            >
              View existing customer
            </Link>
            {" "}instead of creating a duplicate.
          </p>
        </div>
      )}
    </div>
  );
}
