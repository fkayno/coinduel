-- CreateTable
CREATE TABLE "VideoSignal" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPresence" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPresence_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateIndex
CREATE INDEX "VideoSignal_matchId_id_idx" ON "VideoSignal"("matchId", "id");

-- AddForeignKey
ALTER TABLE "VideoSignal" ADD CONSTRAINT "VideoSignal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPresence" ADD CONSTRAINT "VideoPresence_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
