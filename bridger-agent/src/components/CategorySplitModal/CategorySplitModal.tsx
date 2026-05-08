"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Category, CategoryAllocation } from "@/types/transaction";

type SplitRow = { categoryId: string; dollars: string };

type Props = {
  totalAmountCents: number;
  categoryList: Category[];
  initialSplits: CategoryAllocation[];
  onSubmit: (splits: CategoryAllocation[]) => void;
  onClose: () => void;
};

function centsToDisplay(cents: number): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

function parseDollars(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

export function CategorySplitModal({ totalAmountCents, categoryList, initialSplits, onSubmit, onClose }: Props) {
  const totalAbs = Math.abs(totalAmountCents);

  const [rows, setRows] = useState<SplitRow[]>(() => {
    if (initialSplits.length > 0) {
      return initialSplits.map((s) => ({
        categoryId: s.categoryId,
        dollars: centsToDisplay(s.amountCents),
      }));
    }
    return [{ categoryId: categoryList[0]?.id ?? "", dollars: centsToDisplay(totalAbs) }];
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const allocatedCents = rows.reduce((sum, r) => sum + parseDollars(r.dollars), 0);
  const remainingCents = totalAbs - allocatedCents;
  const canSubmit = remainingCents === 0 && rows.every((r) => r.categoryId !== "");

  function updateRow(i: number, patch: Partial<SplitRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { categoryId: categoryList[0]?.id ?? "", dollars: "0.00" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    const splits: CategoryAllocation[] = rows.map((r) => ({
      categoryId: r.categoryId,
      amountCents: parseDollars(r.dollars),
    }));
    onSubmit(splits);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Split Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="text-sm text-gray-500">
          Total: <span className="font-medium text-gray-800">${centsToDisplay(totalAbs)}</span>
        </div>

        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2">
              <select
                value={row.categoryId}
                onChange={(e) => updateRow(i, { categoryId: e.target.value })}
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
              >
                {categoryList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center border border-gray-200 rounded px-2 py-1.5 focus-within:border-blue-400">
                  <span className="text-sm text-gray-400 mr-0.5">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.dollars}
                    onChange={(e) => updateRow(i, { dollars: e.target.value })}
                    className="w-24 text-sm focus:outline-none"
                  />
                </div>
                {remainingCents > 0 && parseDollars(row.dollars) === 0 && (
                  <button
                    onClick={() => updateRow(i, { dollars: (remainingCents / 100).toFixed(2) })}
                    className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Use remaining (${(remainingCents / 100).toFixed(2)})
                  </button>
                )}
              </div>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="py-1.5 text-gray-300 hover:text-red-400 text-sm transition-colors"
                >✕</button>
              )}
            </div>
          ))}
        </div>

        {remainingCents !== 0 && (
          <button onClick={addRow} className="text-sm text-blue-600 hover:text-blue-700 self-start">
            + Add split
          </button>
        )}

        <div className={`text-sm ${remainingCents === 0 ? "text-green-600" : "text-amber-600"}`}>
          {remainingCents === 0
            ? "Fully allocated"
            : remainingCents > 0
            ? `Remaining: $${(remainingCents / 100).toFixed(2)}`
            : `Over by: $${(Math.abs(remainingCents) / 100).toFixed(2)}`}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
