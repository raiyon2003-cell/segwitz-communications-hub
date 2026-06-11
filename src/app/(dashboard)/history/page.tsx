import { getEmailHistory } from "@/lib/actions/emails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { EmailStatus } from "@prisma/client";
import Link from "next/link";

const statusVariant: Record<EmailStatus, "success" | "destructive" | "secondary"> = {
  SENT: "success",
  FAILED: "destructive",
  PENDING: "secondary",
};

export default async function HistoryPage() {
  const { emails } = await getEmailHistory({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email History</h1>
          <p className="text-muted-foreground">View all sent communications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/api/export/history?format=csv">Export CSV</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/api/export/history?format=xlsx">Export Excel</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Sent By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Message ID</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No emails sent yet
                </TableCell>
              </TableRow>
            ) : (
              emails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>{email.recipient}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {email.subject}
                  </TableCell>
                  <TableCell>{email.template?.name || "—"}</TableCell>
                  <TableCell>{email.department?.name || "—"}</TableCell>
                  <TableCell>
                    {email.sentBy.firstName} {email.sentBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[email.status]}>
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate font-mono text-xs">
                    {email.brevoMessageId || "—"}
                  </TableCell>
                  <TableCell>{formatDateTime(email.sentAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
