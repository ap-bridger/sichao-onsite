/*
  Warnings:

  - You are about to drop the column `actualCategoryId` on the `Transaction` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankAccountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "predictedVendorId" TEXT,
    "predictedCategory" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "needsInfo" BOOLEAN NOT NULL,
    "actualVendorId" TEXT,
    "actualCategory" TEXT,
    CONSTRAINT "Transaction_predictedVendorId_fkey" FOREIGN KEY ("predictedVendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_actualVendorId_fkey" FOREIGN KEY ("actualVendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("actualVendorId", "amountCents", "bankAccountId", "date", "description", "id", "needsInfo", "predictedCategory", "predictedVendorId", "status") SELECT "actualVendorId", "amountCents", "bankAccountId", "date", "description", "id", "needsInfo", "predictedCategory", "predictedVendorId", "status" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
