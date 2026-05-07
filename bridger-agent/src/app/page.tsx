"use client";

import { TransactionTabs } from "@/components/TransactionTabs/TransactionTabs";
import { SAMPLE_TRANSACTIONS } from "@/components/TransactionTable/sample-data";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Transactions</h1>
      <TransactionTabs transactions={SAMPLE_TRANSACTIONS} />
    </main>
  );
}
