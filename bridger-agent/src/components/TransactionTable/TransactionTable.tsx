"use client";

import { useState } from 'react'
import { Transaction, Vendor, Category, CategoryAllocation } from '@/types/transaction'
import { EditableDropdown } from '@/components/EditableDropdown/EditableDropdown'
import { CategorySplitModal } from '@/components/CategorySplitModal/CategorySplitModal'

const STATUS_STYLES: Record<Transaction['status'], string> = {
  Posted:   'bg-green-100 text-green-800',
  Pending:  'bg-yellow-100 text-yellow-800',
  Excluded: 'bg-gray-100 text-gray-600',
}

export type SortKey = 'date' | 'amount' | 'description' | 'vendor' | 'category'
export type SortDirection = 'asc' | 'desc'

type ColumnDef = { label: string; sortKey: SortKey | null }

const COLUMN_DEFS: ColumnDef[] = [
  { label: 'Date',        sortKey: 'date'     },
  { label: 'Amount',      sortKey: 'amount'   },
  { label: 'Description', sortKey: 'description' as SortKey },
  { label: 'Vendor',      sortKey: 'vendor'   },
  { label: 'Category',    sortKey: 'category' },
  { label: 'Needs Info',  sortKey: null       },
]

type Update = { actualVendorId?: string; actualCategory?: CategoryAllocation[]; needsInfo?: boolean; status?: string }
type Props = {
  transactions: Transaction[]
  vendorList: Vendor[]
  categoryList: Category[]
  onUpdate: (id: string, patch: Update) => void
  onAddVendor: (name: string) => Promise<Vendor>
  onAddCategory: (name: string) => Promise<Category>
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  sortKey?: SortKey
  sortDirection?: SortDirection
  onSortChange?: (key: SortKey) => void
  showActions?: boolean
  collapsingIds?: Set<string>
}

export function TransactionTable({ transactions, vendorList, categoryList, onUpdate, onAddVendor, onAddCategory, selectedIds, onSelectionChange, sortKey, sortDirection, onSortChange, showActions, collapsingIds }: Props) {
  const [splitTxId, setSplitTxId] = useState<string | null>(null);
  const splitTx = splitTxId ? transactions.find((t) => t.id === splitTxId) ?? null : null;

  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const allSelected = selectable && transactions.length > 0 && transactions.every((tx) => selectedIds.has(tx.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(transactions.map((tx) => tx.id)));
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange(next);
  }

  function vendorName(tx: Transaction): string {
    const id = tx.actualVendorId ?? tx.predictedVendorId;
    return vendorList.find((v) => v.id === id)?.name ?? '—';
  }

  function categoryName(tx: Transaction): string {
    const alloc = (tx.actualCategory ?? tx.predictedCategory)[0];
    return categoryList.find((c) => c.id === alloc?.categoryId)?.name ?? '—';
  }

  return (
    <>
    {splitTx && (
      <CategorySplitModal
        totalAmountCents={splitTx.amountCents}
        categoryList={categoryList}
        initialSplits={splitTx.actualCategory ?? splitTx.predictedCategory}
        onSubmit={(splits) => {
          onUpdate(splitTx.id, { actualCategory: splits });
          setSplitTxId(null);
        }}
        onClose={() => setSplitTxId(null)}
      />
    )}
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="table-auto w-full text-sm text-left">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
          <tr>
            {selectable && (
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                />
              </th>
            )}
            {COLUMN_DEFS.map(({ label, sortKey: colSortKey }) => (
              <th key={label} className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                {colSortKey && onSortChange ? (
                  <button
                    onClick={() => onSortChange(colSortKey)}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    {label}
                    <span className="text-xs">
                      {sortKey === colSortKey
                        ? sortDirection === 'asc' ? '↑' : '↓'
                        : <span className="text-gray-300">↕</span>}
                    </span>
                  </button>
                ) : label}
              </th>
            ))}
            {showActions && (
              <th className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr
              key={tx.id}
              className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              style={{
                transition: 'opacity 300ms ease-out, transform 300ms ease-out',
                opacity: collapsingIds?.has(tx.id) ? 0 : 1,
                transform: collapsingIds?.has(tx.id) ? 'scaleY(0.3) translateY(-8px)' : 'scaleY(1) translateY(0)',
                transformOrigin: 'top',
                pointerEvents: collapsingIds?.has(tx.id) ? 'none' : undefined,
              }}
            >
              {selectable && (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(tx.id)}
                    onChange={() => toggleRow(tx.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                {(() => {
                  const d = new Date(Number(tx.date));
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, '0');
                  const dd = String(d.getDate()).padStart(2, '0');
                  const hh = String(d.getHours()).padStart(2, '0');
                  const min = String(d.getMinutes()).padStart(2, '0');
                  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
                })()}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap font-medium ${tx.amountCents < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {tx.amountCents < 0 ? '-' : '+'}$
                {(Math.abs(tx.amountCents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">{tx.description}</td>
              <td className="px-4 py-3">
                <EditableDropdown
                  value={vendorName(tx)}
                  options={vendorList}
                  onChange={(v) => onUpdate(tx.id, { actualVendorId: v.id })}
                  onAddNew={onAddVendor}
                />
              </td>
              <td className="px-4 py-3">
                {(tx.actualCategory ?? tx.predictedCategory).length > 1 ? (
                  <button
                    onClick={() => setSplitTxId(tx.id)}
                    className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
                  >
                    Multiple
                  </button>
                ) : (
                  <EditableDropdown
                    value={categoryName(tx)}
                    options={categoryList}
                    onSplit={() => setSplitTxId(tx.id)}
                    onChange={(c) => {
                      const alloc = tx.actualCategory ?? tx.predictedCategory;
                      const updated = alloc.length > 0
                        ? [{ categoryId: c.id, amountCents: alloc[0].amountCents }, ...alloc.slice(1)]
                        : [{ categoryId: c.id, amountCents: Math.abs(tx.amountCents) }];
                      onUpdate(tx.id, { actualCategory: updated });
                    }}
                    onAddNew={onAddCategory}
                  />
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {tx.needsInfo ? (
                  <span className="text-blue-600 font-bold">✓</span>
                ) : tx.status === 'Pending' ? (
                  <button
                    onClick={() => onUpdate(tx.id, { needsInfo: true })}
                    className="px-2 py-0.5 text-xs font-medium rounded border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors whitespace-nowrap"
                  >
                    Request Info
                  </button>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              {showActions && (() => {
                const hasVendor = vendorName(tx) !== '—';
                const hasCategory = categoryName(tx) !== '—';
                const canPost = hasVendor && hasCategory;
                const missing = [
                  !hasVendor && 'vendor',
                  !hasCategory && 'category',
                ].filter(Boolean).join(' and ');
                return (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="relative group inline-block">
                        <button
                          disabled={!canPost}
                          onClick={() => canPost && onUpdate(tx.id, { status: 'POSTED' })}
                          className={`px-2 py-0.5 text-xs font-medium rounded border transition-colors ${
                            canPost
                              ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          Post
                        </button>
                        {!canPost && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 invisible group-hover:visible z-20 pointer-events-none">
                            Missing {missing} before posting
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onUpdate(tx.id, { status: 'EXCLUDED' })}
                        className="px-2 py-0.5 text-xs font-medium rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 transition-colors"
                      >
                        Exclude
                      </button>
                    </div>
                  </td>
                );
              })()}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  )
}
