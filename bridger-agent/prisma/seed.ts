import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const BANK_ACCOUNTS = [
  "chase-checking-1234",
  "chase-savings-5678",
  "amex-biz-9012",
];

const CATEGORY_NAMES = [
  "Office Supplies",
  "Software & Subscriptions",
  "Travel",
  "Meals & Entertainment",
  "Marketing",
  "Equipment",
  "Utilities",
  "Professional Services",
  "Rent",
  "Insurance",
];

const VENDOR_NAMES = [
  "Amazon",
  "Costco",
  "Stripe",
  "AWS",
  "Slack",
  "Notion",
  "Shell",
  "Delta Airlines",
  "Marriott",
  "Starbucks",
  "Adobe",
  "Linear",
  "GitHub",
  "Uber",
  "DoorDash",
];

type TxnSpec = {
  bankAccountId: string;
  daysAgo: number;
  amountCents: number;
  description: string;
  predictedVendor: string | null;
  predictedSplits: { category: string; amountCents: number }[];
  needsInfo: boolean;
};

const TRANSACTIONS: TxnSpec[] = [
  // Single-category predictions
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 1, amountCents: 12999, description: "AMAZON.COM*ABC123", predictedVendor: "Amazon", predictedSplits: [{ category: "Office Supplies", amountCents: 12999 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 2, amountCents: 4500, description: "STARBUCKS #15", predictedVendor: "Starbucks", predictedSplits: [{ category: "Meals & Entertainment", amountCents: 4500 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 3, amountCents: 9900, description: "SLACK SUBSCR", predictedVendor: "Slack", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 9900 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 4, amountCents: 250000, description: "AWS USAGE 04/26", predictedVendor: "AWS", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 250000 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 5, amountCents: 18750, description: "GITHUB.COM", predictedVendor: "GitHub", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 18750 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[2], daysAgo: 6, amountCents: 142100, description: "DELTA 0064771234", predictedVendor: "Delta Airlines", predictedSplits: [{ category: "Travel", amountCents: 142100 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[2], daysAgo: 7, amountCents: 32500, description: "UBER TRIP HELP.UBER.CO", predictedVendor: "Uber", predictedSplits: [{ category: "Travel", amountCents: 32500 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 15, amountCents: 8500, description: "ADOBE *CREATIVE CLOUD", predictedVendor: "Adobe", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 8500 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 16, amountCents: 1500, description: "NOTION LABS", predictedVendor: "Notion", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 1500 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 17, amountCents: 9750, description: "LINEAR.APP", predictedVendor: "Linear", predictedSplits: [{ category: "Software & Subscriptions", amountCents: 9750 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[2], daysAgo: 18, amountCents: 5500, description: "SHELL OIL 12345", predictedVendor: "Shell", predictedSplits: [{ category: "Travel", amountCents: 5500 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 19, amountCents: 200000, description: "STRIPE PAYOUT", predictedVendor: "Stripe", predictedSplits: [{ category: "Professional Services", amountCents: 200000 }], needsInfo: false },

  // Split-category predictions
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 8, amountCents: 47500, description: "COSTCO WHSE #421", predictedVendor: "Costco", predictedSplits: [{ category: "Office Supplies", amountCents: 22500 }, { category: "Meals & Entertainment", amountCents: 25000 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[2], daysAgo: 9, amountCents: 88000, description: "MARRIOTT NYC TIMES SQ", predictedVendor: "Marriott", predictedSplits: [{ category: "Travel", amountCents: 65000 }, { category: "Meals & Entertainment", amountCents: 23000 }], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 10, amountCents: 60000, description: "AMAZON.COM*XYZ", predictedVendor: "Amazon", predictedSplits: [{ category: "Office Supplies", amountCents: 30000 }, { category: "Equipment", amountCents: 30000 }], needsInfo: false },

  // No predictions
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 11, amountCents: 21500, description: "POS DEBIT 4567 UNKNOWN MERCH", predictedVendor: null, predictedSplits: [], needsInfo: false },
  { bankAccountId: BANK_ACCOUNTS[2], daysAgo: 12, amountCents: 9999, description: "SQ *MYSTERY VENDOR", predictedVendor: null, predictedSplits: [], needsInfo: false },

  // Needs info
  { bankAccountId: BANK_ACCOUNTS[1], daysAgo: 13, amountCents: 350000, description: "WIRE XFER OUT TO 1234567890", predictedVendor: null, predictedSplits: [], needsInfo: true },
  { bankAccountId: BANK_ACCOUNTS[0], daysAgo: 14, amountCents: 4999, description: "DOORDASH*MERCHANT", predictedVendor: "DoorDash", predictedSplits: [{ category: "Meals & Entertainment", amountCents: 4999 }], needsInfo: true },
];

async function main() {
  // Clean slate for the seeded tables (Greet is left untouched).
  await prisma.transaction.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();

  const categories = await Promise.all(
    CATEGORY_NAMES.map((name) =>
      prisma.category.create({ data: { id: randomUUID(), name } }),
    ),
  );
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const now = Date.now();
  const vendors = await Promise.all(
    VENDOR_NAMES.map((name, i) =>
      prisma.vendor.create({
        data: {
          id: randomUUID(),
          name,
          // Stagger lastTimeUsed so a few are recent and a few aren't.
          lastTimeUsed:
            i % 4 === 3 ? null : new Date(now - i * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  );
  const vendorByName = new Map(vendors.map((v) => [v.name, v]));

  for (const t of TRANSACTIONS) {
    const date = new Date(now - t.daysAgo * 24 * 60 * 60 * 1000);
    const predictedCategory = t.predictedSplits.map((s) => {
      const cat = categoryByName.get(s.category);
      if (!cat) throw new Error(`Unknown category in seed: ${s.category}`);
      return { categoryId: cat.id, amountCents: s.amountCents };
    });
    const predictedVendorId = t.predictedVendor
      ? vendorByName.get(t.predictedVendor)?.id ?? null
      : null;
    if (t.predictedVendor && !predictedVendorId) {
      throw new Error(`Unknown vendor in seed: ${t.predictedVendor}`);
    }

    await prisma.transaction.create({
      data: {
        id: randomUUID(),
        bankAccountId: t.bankAccountId,
        date,
        amountCents: t.amountCents,
        description: t.description,
        predictedVendorId,
        predictedCategory: JSON.stringify(predictedCategory),
        status: "PENDING",
        needsInfo: t.needsInfo,
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories, ${vendors.length} vendors, ${TRANSACTIONS.length} transactions across ${BANK_ACCOUNTS.length} bank accounts.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
