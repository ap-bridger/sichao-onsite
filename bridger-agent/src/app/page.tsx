"use client";

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/client/graphql/apollo-client";
import { TransactionTabs } from "@/components/TransactionTabs/TransactionTabs";

export default function Home() {
  return (
    <ApolloProvider client={apolloClient}>
      <main className="p-8">
        <h1 className="text-2xl font-semibold mb-6">Transactions</h1>
        <TransactionTabs />
      </main>
    </ApolloProvider>
  );
}
