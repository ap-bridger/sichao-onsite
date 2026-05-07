import { prisma } from "@/lib/db";
import type { Category, Prisma, Transaction, Vendor } from "@prisma/client";

export type { Category, Transaction, Vendor };

export type TransactionSortBy = "DESCRIPTION" | "AMOUNT" | "DATE";
export type SortOrder = "ASC" | "DESC";

const buildTransactionOrderBy = (
  sortBy: TransactionSortBy,
  direction: "asc" | "desc"
): Prisma.TransactionOrderByWithRelationInput => {
  switch (sortBy) {
    case "DESCRIPTION":
      return { description: direction };
    case "AMOUNT":
      return { amountCents: direction };
    case "DATE":
      return { date: direction };
  }
};

export const getAllTransactions = async (
  _parent: unknown,
  args: {
    page: number;
    pageSize: number;
    sortBy: TransactionSortBy;
    sortOrder: SortOrder;
  }
): Promise<Transaction[]> => {
  const { page, pageSize, sortBy, sortOrder } = args;
  const direction = sortOrder === "ASC" ? "asc" : "desc";
  return prisma.transaction.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: [buildTransactionOrderBy(sortBy, direction), { id: "asc" }],
  });
};

export const getCategoryList = async (): Promise<Category[]> => {
  return prisma.category.findMany();
};

export const getVendorList = async (): Promise<Vendor[]> => {
  return prisma.vendor.findMany();
};

export const addVendor = async (
  _parent: unknown,
  args: { name: string }
): Promise<Vendor> => {
  return prisma.vendor.create({
    data: { id: crypto.randomUUID(), name: args.name },
  });
};

export const addCategory = async (
  _parent: unknown,
  args: { name: string }
): Promise<Category> => {
  return prisma.category.create({
    data: { id: crypto.randomUUID(), name: args.name },
  });
};

export const updateTransaction = async (
  _parent: unknown,
  args: {
    id: string;
    input: {
      actualVendorId?: string | null;
      actualCategory?: string | null;
    };
  }
): Promise<Transaction> => {
  const { id, input } = args;
  const data: Prisma.TransactionUncheckedUpdateInput = {};
  if (input.actualVendorId !== undefined) {
    data.actualVendorId = input.actualVendorId;
  }
  if (input.actualCategory !== undefined) {
    data.actualCategory = input.actualCategory;
  }
  return prisma.transaction.update({ where: { id }, data });
};
