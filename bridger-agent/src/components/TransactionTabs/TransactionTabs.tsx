"use client";

import { useState, useMemo } from "react";
import { Transaction, Vendor, Category } from "@/types/transaction";
import { TransactionTable } from "@/components/TransactionTable/TransactionTable";
import { VENDOR_OPTIONS, CATEGORY_OPTIONS } from "@/components/TransactionTable/cell-data";

type Status = Transaction["status"];

const STATUSES: Status[] = ["Pending", "Posted", "Excluded"];

const STATUS_PILL: Record<Status, { active: string; idle: string }> = {
  Pending:  { active: "bg-yellow-100 text-yellow-800 ring-yellow-300",  idle: "text-yellow-700 hover:bg-yellow-50" },
  Posted:   { active: "bg-green-100  text-green-800  ring-green-300",   idle: "text-green-700  hover:bg-green-50"  },
  Excluded: { active: "bg-gray-100   text-gray-700   ring-gray-300",    idle: "text-gray-500   hover:bg-gray-50"   },
};

type Props = { transactions: Transaction[] };

export function TransactionTabs({ transactions }: Props) {
  const accounts = useMemo(() => {
    const seen = new Set<number>();
    const ordered: number[] = [];
    for (const tx of transactions) {
      if (!seen.has(tx.bankAcct)) {
        seen.add(tx.bankAcct);
        ordered.push(tx.bankAcct);
      }
    }
    return ordered;
  }, [transactions]);

  const [txList, setTxList] = useState<Transaction[]>(transactions);
  const [vendorOptions, setVendorOptions] = useState<Vendor[]>(VENDOR_OPTIONS);
  const [categoryOptions, setCategoryOptions] = useState<Category[]>(CATEGORY_OPTIONS);
  const [activeAcct, setActiveAcct] = useState<number>(accounts[0]);
  const [activeStatus, setActiveStatus] = useState<Status>("Pending");

  function switchTab(acct: number) {
    setActiveAcct(acct);
    setActiveStatus("Pending");
  }

  async function addVendor(name: string): Promise<Vendor> {
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const vendor: Vendor = await res.json();
    setVendorOptions((prev) => [...prev, vendor]);
    return vendor;
  }

  async function addCategory(name: string): Promise<Category> {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const category: Category = await res.json();
    setCategoryOptions((prev) => [...prev, category]);
    return category;
  }

  function handleUpdate(id: number, patch: { from?: Vendor; actualCategory?: Category }) {
    setTxList((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx))
    );
  }

  const filtered = useMemo(
    () => txList.filter((tx) => tx.bankAcct === activeAcct && tx.status === activeStatus),
    [txList, activeAcct, activeStatus]
  );

  return (
    <div>
      {/* Account tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {accounts.map((acct) => (
          <button
            key={acct}
            onClick={() => switchTab(acct)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              acct === activeAcct
                ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            Acct ···{acct}
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
                isActive
                  ? `${styles.active} ring-1`
                  : styles.idle
              }`}
            >
              {status}
            </button>
          );
        })}
      </div>

      <TransactionTable
        transactions={filtered}
        onUpdate={handleUpdate}
        vendorOptions={vendorOptions}
        categoryOptions={categoryOptions}
        onAddVendor={addVendor}
        onAddCategory={addCategory}
      />
    </div>
  );
}
