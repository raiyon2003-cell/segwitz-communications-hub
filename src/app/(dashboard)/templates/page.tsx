import Link from "next/link";
import { getTemplates } from "@/lib/actions/templates";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { TemplateStatus } from "@prisma/client";

const statusVariant: Record<
  TemplateStatus,
  "default" | "secondary" | "success" | "warning" | "outline"
> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  ARCHIVED: "outline",
};

export default async function TemplatesPage() {
  const session = await getSession();
  const { templates } = await getTemplates();
  const canCreate = hasPermission(session!.dbUser.role, "templates.create");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-muted-foreground">
            Manage email templates and approvals
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No templates found
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.department.name}</TableCell>
                  <TableCell>{t.category.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[t.status]}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{t.templateType}</TableCell>
                  <TableCell>{t._count.sentEmails}</TableCell>
                  <TableCell>{formatDate(t.updatedAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/templates/${t.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
