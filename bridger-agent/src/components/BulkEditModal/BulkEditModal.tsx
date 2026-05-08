"use client";

import { useState } from 'react'
import { Transaction, Vendor, Category, CategoryAllocation } from '@/types/transaction'

type Patch = { actualVendorId?: string; actualCategory?: CategoryAllocation[] }

type Props = {
  selectedTransactions: Transaction[]
  vendorList: Vendor[]
  categoryList: Category[]
  onSubmit: (patch: Patch) => void
  onApplyAndPost: (patch: Patch) => void
  onPost: () => void
  onExclude: () => void
  onClose: () => void
}

export function BulkEditModal({ selectedTransactions, vendorList, categoryList, onSubmit, onApplyAndPost, onPost, onExclude, onClose }: Props) {
  const [vendorId, setVendorId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const selectedCount = selectedTransactions.length;

  function hasVendor(tx: Transaction): boolean {
    const id = tx.actualVendorId ?? tx.predictedVendorId;
    return !!id && vendorList.some((v) => v.id === id);
  }

  function hasCategory(tx: Transaction): boolean {
    const alloc = (tx.actualCategory ?? tx.predictedCategory)[0];
    return !!alloc?.categoryId && categoryList.some((c) => c.id === alloc.categoryId);
  }

  const unpostable = selectedTransactions.filter((tx) => !hasVendor(tx) || !hasCategory(tx));
  const canPost = unpostable.length === 0;
  const postTooltip = unpostable.length === 1
    ? '1 transaction is missing vendor or category'
    : `${unpostable.length} transactions are missing vendor or category`;

  const canSubmit = vendorId !== '' || categoryId !== '';
  const canApplyAndPost = vendorId !== '' && categoryId !== '';

  function buildPatch(): Patch {
    const patch: Patch = {};
    if (vendorId) patch.actualVendorId = vendorId;
    if (categoryId) patch.actualCategory = [{ categoryId, amountCents: 0 }];
    return patch;
  }

  function handleSubmit() { onSubmit(buildPatch()); }
  function handleApplyAndPost() { onApplyAndPost(buildPatch()); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            Bulk Edit — {selectedCount} transactions
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Fields left blank will not be changed.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No change —</option>
              {vendorList.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— No change —</option>
              {categoryList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply to {selectedCount}
          </button>
          {canApplyAndPost && (
            <button
              onClick={handleApplyAndPost}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Apply &amp; Post {selectedCount}
            </button>
          )}
        </div>

        <div className="border-t border-gray-200 mt-5 pt-4">
          <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Mark {selectedCount} selected transactions as</span>
            <div className="relative group inline-block">
              <button
                disabled={!canPost}
                onClick={() => canPost && onPost()}
                className={`px-3 py-1.5 text-sm font-medium rounded border transition-colors ${
                  canPost
                    ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                }`}
              >
                Posted
              </button>
              {!canPost && (
                <div className="absolute bottom-full left-0 mb-1.5 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 invisible group-hover:visible z-20 pointer-events-none">
                  {postTooltip}
                </div>
              )}
            </div>
            <button
              onClick={onExclude}
              className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-100 transition-colors"
            >
              Excluded
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
