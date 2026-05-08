import { prisma } from "@/lib/db";
import type { Category, Prisma, Transaction, Vendor } from "@prisma/client";

export type { Category, Transaction, Vendor };

export type CategoryAllocation = {
  categoryId: string;
  amountCents: number;
};

export type TransactionSortBy = "DESCRIPTION" | "AMOUNT" | "DATE" | "VENDOR" | "CATEGORY";
export type SortOrder = "ASC" | "DESC";

export const transactionFieldResolvers = {
  predictedCategory: (parent: Transaction): CategoryAllocation[] =>
    JSON.parse(parent.predictedCategory) as CategoryAllocation[],
  actualCategory: (parent: Transaction): CategoryAllocation[] | null =>
    parent.actualCategory === null
      ? null
      : (JSON.parse(parent.actualCategory) as CategoryAllocation[]),
};

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
    case "VENDOR":
      return { actualVendor: { name: direction } };
  }
};

async function getAllTransactionsSortedByCategory(
  page: number,
  pageSize: number,
  direction: "asc" | "desc",
  bankAccountId?: string,
  status?: string
): Promise<{ items: Transaction[]; total: number }> {
  const conditions: string[] = [];
  const filterParams: unknown[] = [];
  if (bankAccountId) {
    conditions.push("t.bankAccountId = ?");
    filterParams.push(bankAccountId);
  }
  if (status) {
    conditions.push("t.status = ?");
    filterParams.push(status);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDir = direction === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * pageSize;

  const [items, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<Transaction[]>(
      `SELECT t.* FROM "Transaction" t
       LEFT JOIN "Category" c
         ON c.id = json_extract(COALESCE(t.actualCategory, t.predictedCategory), '$[0].categoryId')
       ${where}
       ORDER BY c.name ${orderDir}, t.id ASC
       LIMIT ? OFFSET ?`,
      ...filterParams,
      pageSize,
      offset
    ),
    prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "Transaction" t ${where}`,
      ...filterParams
    ),
  ]);

  return { items, total: Number(countRows[0].count) };
}

export const getAllTransactions = async (
  _parent: unknown,
  args: {
    page: number;
    pageSize: number;
    sortBy: TransactionSortBy;
    sortOrder: SortOrder;
    bankAccountId?: string;
    status?: string;
  }
): Promise<{ items: Transaction[]; total: number }> => {
  const { page, pageSize, sortBy, sortOrder, bankAccountId, status } = args;
  const direction = sortOrder === "ASC" ? "asc" : "desc";

  if (sortBy === "CATEGORY") {
    return getAllTransactionsSortedByCategory(page, pageSize, direction, bankAccountId, status);
  }

  const where: Prisma.TransactionWhereInput = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (status) where.status = status;
  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [buildTransactionOrderBy(sortBy, direction), { id: "asc" }],
    }),
    prisma.transaction.count({ where }),
  ]);
  return { items, total };
};

export const getDistinctBankAccountIds = async (): Promise<string[]> => {
  const rows = await prisma.transaction.findMany({
    select: { bankAccountId: true },
    distinct: ["bankAccountId"],
    orderBy: { bankAccountId: "asc" },
  });
  return rows.map((r) => r.bankAccountId);
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
      actualCategory?: CategoryAllocation[] | null;
      needsInfo?: boolean;
      status?: string;
    };
  }
): Promise<Transaction> => {
  const { id, input } = args;
  const data: Prisma.TransactionUncheckedUpdateInput = {};
  if (input.actualVendorId !== undefined) {
    data.actualVendorId = input.actualVendorId;
  }
  if (input.actualCategory !== undefined) {
    data.actualCategory =
      input.actualCategory === null ? null : JSON.stringify(input.actualCategory);
  }
  if (input.needsInfo !== undefined) {
    data.needsInfo = input.needsInfo;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  return prisma.transaction.update({ where: { id }, data });
};
