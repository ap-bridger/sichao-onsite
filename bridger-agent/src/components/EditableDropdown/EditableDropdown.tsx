"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type Option = { id: string; name: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (option: Option) => void;
  onAddNew: (name: string) => Promise<Option>;
  onSplit?: () => void;
};

export function EditableDropdown({ value, options, onChange, onAddNew, onSplit }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openMenu() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen((o) => !o);
  }

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );
  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showAddNew = query.trim() !== "" && !exactMatch;

  function select(option: Option) {
    onChange(option);
    setOpen(false);
    setQuery("");
  }

  async function addNew() {
    setAdding(true);
    try {
      const saved = await onAddNew(query.trim());
      onChange(saved);
      setOpen(false);
      setQuery("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openMenu}
        className="flex items-center gap-1 group whitespace-nowrap"
      >
        <span>{value}</span>
        <span className="text-gray-300 group-hover:text-gray-500 text-xs transition-colors">▾</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuStyle.top, left: menuStyle.left, zIndex: 9999 }}
          className="w-52 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          {onSplit && (
            <div className="px-2 pt-2 pb-1 border-b border-gray-100">
              <button
                onClick={() => { onSplit(); setOpen(false); setQuery(""); }}
                className="w-full text-left px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Split
              </button>
            </div>
          )}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or add…"
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-blue-400"
            />
          </div>
          <ul className="max-h-44 overflow-y-auto py-1">
            {filtered.map((option) => (
              <li key={option.id}>
                <button
                  onClick={() => select(option)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 transition-colors ${
                    option.name === value ? "font-semibold text-blue-600" : "text-gray-700"
                  }`}
                >
                  {option.name}
                </button>
              </li>
            ))}
            {showAddNew && (
              <li>
                <button
                  onClick={addNew}
                  disabled={adding}
                  className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <span className="font-bold">{adding ? "…" : "+"}</span>
                  <span>{adding ? "Adding…" : `Add \u201c${query.trim()}\u201d`}</span>
                </button>
              </li>
            )}
            {filtered.length === 0 && !showAddNew && (
              <li className="px-3 py-2 text-xs text-gray-400">No options</li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}
