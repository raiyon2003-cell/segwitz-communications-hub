"use client";

import { deleteTemplate } from "@/lib/actions/templates";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableRowActions } from "@/components/shared/table-row-actions";
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

type TemplateRow = {
  id: string;
  name: string;
  templateType: string;
  status: TemplateStatus;
  updatedAt: Date;
  department: { name: string };
  category: { name: string };
  _count: { sentEmails: number };
};

interface TemplatesTableProps {
  templates: TemplateRow[];
  canEdit: boolean;
  canDelete: boolean;
}

export function TemplatesTable({
  templates,
  canEdit,
  canDelete,
}: TemplatesTableProps) {
  return (
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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground"
              >
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
                  <TableRowActions
                    itemName={t.name}
                    viewHref={`/templates/${t.id}`}
                    editHref={canEdit ? `/templates/${t.id}/edit` : undefined}
                    canEdit={canEdit}
                    canView
                    canDelete={canDelete}
                    onDelete={
                      canDelete ? () => deleteTemplate(t.id) : undefined
                    }
                    deleteSuccessMessage="Template deleted"
                    deleteDescription={`"${t.name}" will be permanently deleted. Sent email history will be kept without this template link.`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
