import { greetings } from "@/server/modules/greet/api";
import {
  addCategory,
  addVendor,
  getAllTransactions,
  getCategoryList,
  getVendorList,
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

      type Transaction {
        id: ID!
        bankAccountId: String!
        date: String!
        amountCents: Int!
        description: String!
        predictedVendorId: String
        predictedCategory: String!
        status: String!
        needsInfo: Boolean!
        actualVendorId: String
        actualCategory: String
      }

      type Query {
        greetings: String
        getAllTransactions(
          page: Int!
          pageSize: Int!
          sortBy: TransactionSortBy!
          sortOrder: SortOrder!
        ): [Transaction!]!
        getCategoryList: [Category!]!
        getVendorList: [Vendor!]!
      }

      input UpdateTransactionInput {
        actualVendorId: String
        actualCategory: String
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
        getCategoryList,
        getVendorList,
      },
      Mutation: {
        addVendor,
        addCategory,
        updateTransaction,
      },
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
