# Transactions API

GraphQL endpoint: `POST /api/graphql`.

`predictedCategory` / `actualCategory` are stored as JSON in the DB but exposed as typed lists; encode/decode happens at the resolver boundary.

```ts
type CategoryAllocation = { categoryId: string; amountCents: number };
```

## Queries

```graphql
# Paginated list. All four args required. Sort is stable (id ASC tiebreaker).
{
  getAllTransactions(page: 1, pageSize: 10, sortBy: DATE, sortOrder: DESC) {
    id description amountCents
    predictedCategory { categoryId amountCents }
    actualCategory    { categoryId amountCents }
  }
}

{ getCategoryList { id name } }
{ getVendorList   { id name lastTimeUsed } }
```

`sortBy`: `DESCRIPTION` | `AMOUNT` | `DATE`. `sortOrder`: `ASC` | `DESC`.

## Mutations

```graphql
mutation { addVendor(name: "Acme")   { id name } }
mutation { addCategory(name: "Rent") { id name } }
```

`updateTransaction` does a partial update. For each field in `input`: omit = no change, `null` = clear, value = set.

```graphql
mutation {
  updateTransaction(
    id: "TXN_ID"
    input: {
      actualVendorId: "VENDOR_ID"
      actualCategory: [
        { categoryId: "CAT_A", amountCents: 12500 }
        { categoryId: "CAT_B", amountCents: 7500 }
      ]
    }
  ) {
    id actualVendorId
    actualCategory { categoryId amountCents }
  }
}
```
