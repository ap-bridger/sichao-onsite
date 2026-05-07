import { Vendor, Category } from "@/types/transaction";

export const VENDOR_OPTIONS: Vendor[] = [
  { id: 1, name: "Amazon",      lastUsed: new Date("2024-10-30").getTime() },
  { id: 2, name: "Whole Foods", lastUsed: new Date("2024-11-01").getTime() },
  { id: 3, name: "Netflix",     lastUsed: new Date("2024-10-28").getTime() },
  { id: 4, name: "Target",      lastUsed: new Date("2024-10-25").getTime() },
  { id: 5, name: "Uber",        lastUsed: new Date("2024-10-20").getTime() },
  { id: 6, name: "Starbucks",   lastUsed: new Date("2024-10-18").getTime() },
  { id: 7, name: "Costco",      lastUsed: new Date("2024-10-15").getTime() },
  { id: 8, name: "Apple",       lastUsed: new Date("2024-10-10").getTime() },
];

export const CATEGORY_OPTIONS: Category[] = [
  { id: 1, name: "Shopping" },
  { id: 2, name: "Groceries" },
  { id: 3, name: "Entertainment" },
  { id: 4, name: "Utilities" },
  { id: 5, name: "Dining" },
  { id: 6, name: "Transport" },
  { id: 7, name: "Health" },
  { id: 8, name: "Travel" },
];
