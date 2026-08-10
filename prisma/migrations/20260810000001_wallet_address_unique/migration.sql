-- Verified beforehand: zero duplicate walletAddress values currently exist,
-- so this is safe. NULLs are unaffected by the unique constraint.
DROP INDEX "User_walletAddress_idx";

CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
