import Link from "next/link";
import { getTemplates } from "@/lib/actions/templates";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { TemplatesTable } from "@/components/templates/templates-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TemplatesPage() {
  const session = await getSession();
  const { templates } = await getTemplates();
  const canCreate = hasPermission(session!.dbUser.role, "templates.create");
  const canEdit = hasPermission(session!.dbUser.role, "templates.edit");
  const canDelete = hasPermission(session!.dbUser.role, "templates.delete");

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

      <TemplatesTable
        templates={templates}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
