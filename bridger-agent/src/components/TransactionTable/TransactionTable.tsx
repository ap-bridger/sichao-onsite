"use client";

import { Transaction, Vendor, Category, CategoryAllocation } from '@/types/transaction'
import { EditableDropdown } from '@/components/EditableDropdown/EditableDropdown'

const STATUS_STYLES: Record<Transaction['status'], string> = {
  Posted:   'bg-green-100 text-green-800',
  Pending:  'bg-yellow-100 text-yellow-800',
  Excluded: 'bg-gray-100 text-gray-600',
}

const COLUMNS = [
  'ID', 'Date', 'Amount', 'Description', 'From',
  'Category', 'Bank Acct', 'Status', 'Needs Info',
]

type Update = { actualVendorId?: string; actualCategory?: CategoryAllocation[] }
type Props = {
  transactions: Transaction[]
  vendorList: Vendor[]
  categoryList: Category[]
  onUpdate: (id: string, patch: Update) => void
  onAddVendor: (name: string) => Promise<Vendor>
  onAddCategory: (name: string) => Promise<Category>
}

export function TransactionTable({ transactions, vendorList, categoryList, onUpdate, onAddVendor, onAddCategory }: Props) {
  function vendorName(tx: Transaction): string {
    const id = tx.actualVendorId ?? tx.predictedVendorId;
    return vendorList.find((v) => v.id === id)?.name ?? '—';
  }

  function categoryName(tx: Transaction): string {
    const alloc = (tx.actualCategory ?? tx.predictedCategory)[0];
    return categoryList.find((c) => c.id === alloc?.categoryId)?.name ?? '—';
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="table-auto w-full text-sm text-left">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col} className="px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={tx.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-gray-500 text-xs">{tx.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString()}
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
                <EditableDropdown
                  value={categoryName(tx)}
                  options={categoryList}
                  onChange={(c) => {
                    const alloc = tx.actualCategory ?? tx.predictedCategory;
                    const updated = alloc.length > 0
                      ? [{ categoryId: c.id, amountCents: alloc[0].amountCents }, ...alloc.slice(1)]
                      : [{ categoryId: c.id, amountCents: Math.abs(tx.amountCents) }];
                    onUpdate(tx.id, { actualCategory: updated });
                  }}
                  onAddNew={onAddCategory}
                />
              </td>
              <td className="px-4 py-3">{tx.bankAccountId}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tx.status]}`}>
                  {tx.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {tx.needsInfo ? (
                  <span className="text-blue-600 font-bold">✓</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
