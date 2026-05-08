import { gql } from "@apollo/client";

export const GET_ALL_TRANSACTIONS = gql`
  query GetAllTransactions($page: Int!, $pageSize: Int!, $sortBy: TransactionSortBy!, $sortOrder: SortOrder!, $bankAccountId: String, $status: String) {
    getAllTransactions(page: $page, pageSize: $pageSize, sortBy: $sortBy, sortOrder: $sortOrder, bankAccountId: $bankAccountId, status: $status) {
      items {
        id
        bankAccountId
        date
        amountCents
        description
        predictedVendorId
        predictedCategory { categoryId amountCents }
        actualVendorId
        actualCategory { categoryId amountCents }
        status
        needsInfo
      }
      total
    }
  }
`;

export const GET_DISTINCT_BANK_ACCOUNT_IDS = gql`
  query GetDistinctBankAccountIds {
    getDistinctBankAccountIds
  }
`;

export const GET_VENDOR_LIST = gql`
  query GetVendorList {
    getVendorList { id name lastTimeUsed }
  }
`;

export const GET_CATEGORY_LIST = gql`
  query GetCategoryList {
    getCategoryList { id name }
  }
`;

export const ADD_VENDOR = gql`
  mutation AddVendor($name: String!) {
    addVendor(name: $name) { id name lastTimeUsed }
  }
`;

export const ADD_CATEGORY = gql`
  mutation AddCategory($name: String!) {
    addCategory(name: $name) { id name }
  }
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, input: $input) {
      id
      actualVendorId
      actualCategory { categoryId amountCents }
    }
  }
`;
