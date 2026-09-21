-- 管理画面（/admin）で行った操作の監査ログ。
-- 管理画面は Cloudflare Access で認証するため、操作者は Account ではなく
-- Access が認証したメールアドレスを文字列で持つ（外部キーは張らない）。
-- 既存テーブルへの変更はなく、追加のみの安全なマイグレーション。

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actorEmail_idx" ON "AdminAuditLog"("actorEmail");
