import { greetings } from "@/server/modules/greet/api";
import {
  addCategory,
  addVendor,
  getAllTransactions,
  getCategoryList,
  getDistinctBankAccountIds,
  getVendorList,
  transactionFieldResolvers,
  updateTransaction,
} from "@/server/modules/transactions/api";
import { createSchema, createYoga } from "graphql-yoga";

const { handleRequest } = createYoga<{
  params: Promise<Record<string, string>>;
}>({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      enum TransactionSortBy {
        DESCRIPTION
        AMOUNT
        DATE
        VENDOR
        CATEGORY
      }

      enum SortOrder {
        ASC
        DESC
      }

      type Vendor {
        id: ID!
        name: String!
        lastTimeUsed: String
      }

      type Category {
        id: ID!
        name: String!
      }

      type CategoryAllocation {
        categoryId: String!
        amountCents: Int!
      }

      type Transaction {
        id: ID!
        bankAccountId: String!
        date: String!
        amountCents: Int!
        description: String!
        predictedVendorId: String
        predictedCategory: [CategoryAllocation!]!
        status: String!
        needsInfo: Boolean!
        actualVendorId: String
        actualCategory: [CategoryAllocation!]
      }

      type TransactionPage {
        items: [Transaction!]!
        total: Int!
      }

      type Query {
        greetings: String
        getAllTransactions(
          page: Int!
          pageSize: Int!
          sortBy: TransactionSortBy!
          sortOrder: SortOrder!
          bankAccountId: String
          status: String
          description: String
        ): TransactionPage!
        getDistinctBankAccountIds: [String!]!
        getCategoryList: [Category!]!
        getVendorList: [Vendor!]!
      }

      input CategoryAllocationInput {
        categoryId: String!
        amountCents: Int!
      }

      input UpdateTransactionInput {
        actualVendorId: String
        actualCategory: [CategoryAllocationInput!]
        needsInfo: Boolean
        status: String
      }

      type Mutation {
        addVendor(name: String!): Vendor!
        addCategory(name: String!): Category!
        updateTransaction(id: ID!, input: UpdateTransactionInput!): Transaction!
      }
    `,
    resolvers: {
      Query: {
        greetings,
        getAllTransactions,
        getDistinctBankAccountIds,
        getCategoryList,
        getVendorList,
      },
      Mutation: {
        addVendor,
        addCategory,
        updateTransaction,
      },
      Transaction: transactionFieldResolvers,
    },
  }),

  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",

  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },
});

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as OPTIONS,
};
