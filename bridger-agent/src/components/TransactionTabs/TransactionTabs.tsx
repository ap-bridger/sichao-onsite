"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Transaction, Vendor, Category, CategoryAllocation } from "@/types/transaction";
import { TransactionTable } from "@/components/TransactionTable/TransactionTable";
import {
  GET_ALL_TRANSACTIONS,
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
  const { data: txData, loading: txLoading, error: txError } = useQuery(GET_ALL_TRANSACTIONS);
  const { data: vendorData } = useQuery(GET_VENDOR_LIST);
  const { data: catData } = useQuery(GET_CATEGORY_LIST);

  const [txList, setTxList] = useState<Transaction[] | null>(null);
  const [vendorList, setVendorList] = useState<Vendor[] | null>(null);
  const [categoryList, setCategoryList] = useState<Category[] | null>(null);

  const [addVendorMutation] = useMutation(ADD_VENDOR);
  const [addCategoryMutation] = useMutation(ADD_CATEGORY);
  const [updateTxMutation] = useMutation(UPDATE_TRANSACTION);

  const transactions: Transaction[] = useMemo(() => {
    if (txList !== null) return txList;
    if (!txData?.getAllTransactions) return [];
    const mapped = txData.getAllTransactions.map(mapTransaction);
    return mapped;
  }, [txData, txList]);

  useMemo(() => {
    if (txList === null && txData?.getAllTransactions) {
      setTxList(txData.getAllTransactions.map(mapTransaction));
    }
  }, [txData, txList]);

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

  const accounts = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const tx of transactions) {
      if (!seen.has(tx.bankAccountId)) {
        seen.add(tx.bankAccountId);
        ordered.push(tx.bankAccountId);
      }
    }
    return ordered;
  }, [transactions]);

  const [activeAcct, setActiveAcct] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<Status>("Pending");

  const currentAcct = activeAcct ?? accounts[0] ?? null;

  function switchTab(acct: string) {
    setActiveAcct(acct);
    setActiveStatus("Pending");
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

  function handleUpdate(id: string, patch: { actualVendorId?: string; actualCategory?: CategoryAllocation[] }) {
    setTxList((prev) =>
      (prev ?? transactions).map((tx) => (tx.id === id ? { ...tx, ...patch } : tx))
    );
    const input: Record<string, unknown> = {};
    if (patch.actualVendorId !== undefined) input.actualVendorId = patch.actualVendorId;
    if (patch.actualCategory !== undefined) input.actualCategory = patch.actualCategory;
    updateTxMutation({ variables: { id, input } }).catch(console.error);
  }

  const filtered = useMemo(
    () => transactions.filter((tx) => tx.bankAccountId === currentAcct && tx.status === activeStatus),
    [transactions, currentAcct, activeStatus]
  );

  if (txLoading) return <p className="text-sm text-gray-500">Loading transactions…</p>;
  if (txError) return <p className="text-sm text-red-500">Error: {txError.message}</p>;

  return (
    <div>
      {/* Account tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {accounts.map((acct) => (
          <button
            key={acct}
            onClick={() => switchTab(acct)}
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
              onClick={() => setActiveStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? `${styles.active} ring-1` : styles.idle
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      <TransactionTable
        transactions={filtered}
        vendorList={vendors}
        categoryList={categories}
        onUpdate={handleUpdate}
        onAddVendor={addVendor}
        onAddCategory={addCategory}
      />
    </div>
  );
}
