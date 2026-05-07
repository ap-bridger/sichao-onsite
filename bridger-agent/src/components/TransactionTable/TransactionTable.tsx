"use client";

import { Transaction, Vendor, Category } from '@/types/transaction'
import { EditableDropdown } from '@/components/EditableDropdown/EditableDropdown'

const STATUS_STYLES: Record<Transaction['status'], string> = {
  Posted:   'bg-green-100 text-green-800',
  Pending:  'bg-yellow-100 text-yellow-800',
  Excluded: 'bg-gray-100 text-gray-600',
}

const COLUMNS = [
  'ID', 'Date', 'Amount', 'Description', 'From',
  'Category', 'Bank Acct', 'Status', 'Require Info',
]

type Update = { from?: Vendor; actualCategory?: Category }
type Props = {
  transactions: Transaction[]
  onUpdate: (id: number, patch: Update) => void
  vendorOptions: Vendor[]
  categoryOptions: Category[]
  onAddVendor: (name: string) => Promise<Vendor>
  onAddCategory: (name: string) => Promise<Category>
}

export function TransactionTable({ transactions, onUpdate, vendorOptions, categoryOptions, onAddVendor, onAddCategory }: Props) {
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
              <td className="px-4 py-3 text-gray-500">{tx.id}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString()}
              </td>
              <td className={`px-4 py-3 whitespace-nowrap font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {tx.amount < 0 ? '-' : '+'}$
                {Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">{tx.description}</td>
              <td className="px-4 py-3">
                <EditableDropdown
                  value={tx.from.name}
                  options={vendorOptions}
                  onChange={(v) => onUpdate(tx.id, { from: { id: v.id, name: v.name, lastUsed: Date.now() } })}
                  onAddNew={onAddVendor}
                />
              </td>
              <td className="px-4 py-3">
                <EditableDropdown
                  value={(tx.actualCategory ?? tx.predictedCategory).name}
                  options={categoryOptions}
                  onChange={(c) => onUpdate(tx.id, { actualCategory: c })}
                  onAddNew={onAddCategory}
                />
              </td>
              <td className="px-4 py-3">{tx.bankAcct}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[tx.status]}`}>
                  {tx.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {tx.requireInfo ? (
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
