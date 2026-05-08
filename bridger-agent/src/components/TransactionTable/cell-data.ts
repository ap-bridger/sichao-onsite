import { Vendor, Category } from "@/types/transaction";

export const VENDOR_OPTIONS: Vendor[] = [
  { id: "1", name: "Amazon",      lastTimeUsed: "2024-10-30" },
  { id: "2", name: "Whole Foods", lastTimeUsed: "2024-11-01" },
  { id: "3", name: "Netflix",     lastTimeUsed: "2024-10-28" },
  { id: "4", name: "Target",      lastTimeUsed: "2024-10-25" },
  { id: "5", name: "Uber",        lastTimeUsed: "2024-10-20" },
  { id: "6", name: "Starbucks",   lastTimeUsed: "2024-10-18" },
  { id: "7", name: "Costco",      lastTimeUsed: "2024-10-15" },
  { id: "8", name: "Apple",       lastTimeUsed: "2024-10-10" },
];

export const CATEGORY_OPTIONS: Category[] = [
  { id: "1", name: "Shopping" },
  { id: "2", name: "Groceries" },
  { id: "3", name: "Entertainment" },
  { id: "4", name: "Utilities" },
  { id: "5", name: "Dining" },
  { id: "6", name: "Transport" },
  { id: "7", name: "Health" },
  { id: "8", name: "Travel" },
];
