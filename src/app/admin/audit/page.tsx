/**
 * 監査ログ。管理画面から行った書き込み操作の記録。
 *
 * 管理画面は他人のデータに触れるので、「誰が・いつ・何をしたか」を必ず残す。
 * ログ自体は管理画面からは消せない（消したい場合はDBを直接操作する）。
 */

import { getAdminAuditLogs } from "@/actions/admin/queries";
import {
  EmptyRow,
  PageHeader,
  Panel,
  TableWrap,
  Td,
  Th,
} from "@/components/features/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import {
  isMutatingAdminAction,
  toAdminAuditActionLabel,
} from "@/lib/admin-audit";
import { formatDateTimeForDisplay } from "@/lib/date-utils";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();

  return (
    <>
      <PageHeader
        title="監査ログ"
        description="管理画面から行った操作の記録（直近100件）"
      />

      <Panel title={`${logs.length}件`}>
        <TableWrap>
          <thead>
            <tr>
              <Th>日時</Th>
              <Th>操作者</Th>
              <Th>操作</Th>
              <Th>内容</Th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <EmptyRow colSpan={4}>
                まだ管理画面から操作は行われていません
              </EmptyRow>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-t">
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {formatDateTimeForDisplay(log.createdAt)}
                  </Td>
                  <Td className="whitespace-nowrap">{log.actorEmail}</Td>
                  <Td>
                    <Badge
                      variant={
                        isMutatingAdminAction(log.action)
                          ? "default"
                          : "secondary"
                      }
                    >
                      {toAdminAuditActionLabel(log.action)}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">{log.summary}</Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
