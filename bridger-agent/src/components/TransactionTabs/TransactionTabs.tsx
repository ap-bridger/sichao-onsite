"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Transaction, Vendor, Category, CategoryAllocation } from "@/types/transaction";
import { TransactionTable, SortKey, SortDirection } from "@/components/TransactionTable/TransactionTable";
import { BulkEditModal } from "@/components/BulkEditModal/BulkEditModal";
import { Pagination } from "@/components/Pagination/Pagination";
import {
  GET_ALL_TRANSACTIONS,
  GET_DISTINCT_BANK_ACCOUNT_IDS,
  GET_VENDOR_LIST,
  GET_CATEGORY_LIST,
  ADD_VENDOR,
  ADD_CATEGORY,
  UPDATE_TRANSACTION,
} from "@/client/graphql/queries";

type Status = Transaction["status"];

const STATUSES: Status[] = ["Pending", "Posted", "Excluded"];

const STATUS_PILL: Record<Status, { active: string; idle: string }> = {
  Pending:  { active: "bg-yellow-100 text-yellow-800 ring-yellow-300",  idle: "text-yellow-700 hover:bg-yellow-50" },
  Posted:   { active: "bg-green-100  text-green-800  ring-green-300",   idle: "text-green-700  hover:bg-green-50"  },
  Excluded: { active: "bg-gray-100   text-gray-700   ring-gray-300",    idle: "text-gray-500   hover:bg-gray-50"   },
};

const STATUS_MAP: Record<string, Status> = {
  PENDING: "Pending",
  POSTED: "Posted",
  EXCLUDED: "Excluded",
};

function mapTransaction(t: any): Transaction {
  return {
    id: t.id,
    bankAccountId: t.bankAccountId,
    date: t.date,
    amountCents: t.amountCents,
    description: t.description,
    predictedVendorId: t.predictedVendorId ?? null,
    actualVendorId: t.actualVendorId ?? null,
    predictedCategory: t.predictedCategory ?? [],
    actualCategory: t.actualCategory ?? null,
    status: STATUS_MAP[t.status] ?? "Pending",
    needsInfo: t.needsInfo ?? false,
  };
}

export function TransactionTabs() {
  const [activeAcct, setActiveAcct] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<Status>("Pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [localPatches, setLocalPatches] = useState<Record<string, Partial<Transaction>>>({});
  const [collapsingIds, setCollapsingIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [sortMap, setSortMap] = useState<Record<string, { sortKey: SortKey; sortDirection: SortDirection }>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: acctData, loading: acctLoading } = useQuery(GET_DISTINCT_BANK_ACCOUNT_IDS);
  const accounts: string[] = acctData?.getDistinctBankAccountIds ?? [];
  const currentAcct = activeAcct ?? accounts[0] ?? null;

  const tabKey = `${currentAcct}:${activeStatus}`;
  const { sortKey = 'date', sortDirection = 'desc' } = sortMap[tabKey] ?? {};
  const serverSortKey = sortKey.toUpperCase();

  const txVariables = useMemo(() => ({
    page,
    pageSize,
    sortBy: serverSortKey,
    sortOrder: sortDirection.toUpperCase(),
    bankAccountId: currentAcct ?? undefined,
    status: activeStatus.toUpperCase(),
    description: debouncedSearch || undefined,
  }), [page, pageSize, serverSortKey, sortDirection, currentAcct, activeStatus, debouncedSearch]);

  const { data: txData, loading: txLoading, error: txError } = useQuery(GET_ALL_TRANSACTIONS, {
    variables: txVariables,
    skip: !currentAcct,
    fetchPolicy: "cache-and-network",
  });

  const { data: vendorData } = useQuery(GET_VENDOR_LIST);
  const { data: catData } = useQuery(GET_CATEGORY_LIST);

  const [vendorList, setVendorList] = useState<Vendor[] | null>(null);
  const [categoryList, setCategoryList] = useState<Category[] | null>(null);

  const [addVendorMutation] = useMutation(ADD_VENDOR);
  const [addCategoryMutation] = useMutation(ADD_CATEGORY);
  const [updateTxMutation] = useMutation(UPDATE_TRANSACTION);

  const vendors: Vendor[] = useMemo(() => {
    if (vendorList !== null) return vendorList;
    return vendorData?.getVendorList ?? [];
  }, [vendorData, vendorList]);

  useMemo(() => {
    if (vendorList === null && vendorData?.getVendorList) {
      setVendorList(vendorData.getVendorList);
    }
  }, [vendorData, vendorList]);

  const categories: Category[] = useMemo(() => {
    if (categoryList !== null) return categoryList;
    return catData?.getCategoryList ?? [];
  }, [catData, categoryList]);

  useMemo(() => {
    if (categoryList === null && catData?.getCategoryList) {
      setCategoryList(catData.getCategoryList);
    }
  }, [catData, categoryList]);

  const rawItems: Transaction[] = useMemo(() => {
    return (txData?.getAllTransactions?.items ?? []).map(mapTransaction);
  }, [txData]);

  const total: number = txData?.getAllTransactions?.total ?? 0;

  const transactions: Transaction[] = useMemo(() => {
    return rawItems
      .filter((tx) => activeStatus !== 'Pending' || !removedIds.has(tx.id))
      .map((tx) => localPatches[tx.id] ? { ...tx, ...localPatches[tx.id] } : tx);
  }, [rawItems, localPatches, removedIds, activeStatus]);

  function switchTab(acct: string) {
    setActiveAcct(acct);
    setActiveStatus("Pending");
    setPage(1);
    setSelectedIds(new Set());
    setSearchTerm("");
  }

  function switchStatus(status: Status) {
    setActiveStatus(status);
    setPage(1);
    setSelectedIds(new Set());
    setSearchTerm("");
  }

  function handleSortChange(key: SortKey) {
    setSortMap((prev) => ({
      ...prev,
      [tabKey]: {
        sortKey: key,
        sortDirection: key === sortKey ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc',
      },
    }));
    setPage(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    setSelectedIds(new Set());
  }

  function handleSearchChange(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
    setSelectedIds(new Set());
  }

  async function addVendor(name: string): Promise<Vendor> {
    const { data } = await addVendorMutation({ variables: { name } });
    const vendor: Vendor = data.addVendor;
    setVendorList((prev) => [...(prev ?? vendors), vendor]);
    return vendor;
  }

  async function addCategory(name: string): Promise<Category> {
    const { data } = await addCategoryMutation({ variables: { name } });
    const category: Category = data.addCategory;
    setCategoryList((prev) => [...(prev ?? categories), category]);
    return category;
  }

  function handleBulkUpdate(patch: { actualVendorId?: string; actualCategory?: CategoryAllocation[] }) {
    selectedIds.forEach((id) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      const resolvedPatch = { ...patch };
      if (patch.actualCategory) {
        resolvedPatch.actualCategory = [{ categoryId: patch.actualCategory[0].categoryId, amountCents: Math.abs(tx.amountCents) }];
      }
      handleUpdate(id, resolvedPatch);
    });
    setSelectedIds(new Set());
    setBulkEditOpen(false);
  }

  function handleBulkApplyAndPost(patch: { actualVendorId?: string; actualCategory?: CategoryAllocation[] }) {
    selectedIds.forEach((id) => {
      const tx = transactions.find((t) => t.id === id);
      if (!tx) return;
      const resolvedPatch = { ...patch };
      if (patch.actualCategory) {
        resolvedPatch.actualCategory = [{ categoryId: patch.actualCategory[0].categoryId, amountCents: Math.abs(tx.amountCents) }];
      }
      handleUpdate(id, resolvedPatch);
      handleUpdate(id, { status: 'POSTED' });
    });
    setSelectedIds(new Set());
    setBulkEditOpen(false);
  }

  function handleBulkPost() {
    selectedIds.forEach((id) => handleUpdate(id, { status: 'POSTED' }));
    setSelectedIds(new Set());
    setBulkEditOpen(false);
  }

  function handleBulkExclude() {
    selectedIds.forEach((id) => handleUpdate(id, { status: 'EXCLUDED' }));
    setSelectedIds(new Set());
    setBulkEditOpen(false);
  }

  function handleUpdate(id: string, patch: { actualVendorId?: string; actualCategory?: CategoryAllocation[]; needsInfo?: boolean; status?: string }) {
    if (patch.status !== undefined) {
      setCollapsingIds((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setRemovedIds((prev) => new Set([...prev, id]));
        setCollapsingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }, 350);
    } else {
      setLocalPatches((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
    }
    const input: Record<string, unknown> = {};
    if (patch.actualVendorId !== undefined) input.actualVendorId = patch.actualVendorId;
    if (patch.actualCategory !== undefined) input.actualCategory = patch.actualCategory;
    if (patch.needsInfo !== undefined) input.needsInfo = patch.needsInfo;
    if (patch.status !== undefined) input.status = patch.status;
    updateTxMutation({ variables: { id, input } }).catch(console.error);
  }

  if (acctLoading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (txError) return <p className="text-sm text-red-500">Error: {txError.message}</p>;

  return (
    <div>
      {/* Account tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {accounts.map((acct) => (
          <button
            key={acct}
            onClick={() => switchTab(acct)}
            title={acct}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              acct === currentAcct
                ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Acct ···{acct.slice(-4)}
          </button>
        ))}
      </div>

      {/* Status pills */}
      <div className="flex gap-2 mb-4">
        {STATUSES.map((status) => {
          const styles = STATUS_PILL[status];
          const isActive = status === activeStatus;
          return (
            <button
              key={status}
              onClick={() => switchStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? `${styles.active} ring-1` : styles.idle
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      {/* Search + bulk edit row */}
      <div className="flex items-center justify-between mb-2 h-8">
        {activeStatus === "Pending" ? (
          <div className="relative w-64">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search description…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        ) : (
          <div />
        )}
        {selectedIds.size > 1 && (
          <button
            onClick={() => setBulkEditOpen(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Bulk Edit ({selectedIds.size})
          </button>
        )}
      </div>

      <TransactionTable
        transactions={transactions}
        vendorList={vendors}
        categoryList={categories}
        onUpdate={handleUpdate}
        onAddVendor={addVendor}
        onAddCategory={addCategory}
        selectedIds={activeStatus === "Pending" ? selectedIds : undefined}
        onSelectionChange={activeStatus === "Pending" ? setSelectedIds : undefined}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        showActions={activeStatus === "Pending"}
        collapsingIds={collapsingIds}
      />

      {txLoading && (
        <p className="text-sm text-gray-400 mt-2">Loading…</p>
      )}

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {bulkEditOpen && (
        <BulkEditModal
          selectedTransactions={transactions.filter((tx) => selectedIds.has(tx.id))}
          vendorList={vendors}
          categoryList={categories}
          onSubmit={handleBulkUpdate}
          onApplyAndPost={handleBulkApplyAndPost}
          onPost={handleBulkPost}
          onExclude={handleBulkExclude}
          onClose={() => setBulkEditOpen(false)}
        />
      )}
    </div>
  );
}
