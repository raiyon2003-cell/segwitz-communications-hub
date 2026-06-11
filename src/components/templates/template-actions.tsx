"use client";

import { useRouter } from "next/navigation";
import {
  submitTemplateForApproval,
  approveTemplate,
  archiveTemplate,
} from "@/lib/actions/templates";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TemplateStatus } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@prisma/client";

interface TemplateActionsProps {
  templateId: string;
  status: TemplateStatus;
  userRole: Role;
}

export function TemplateActions({
  templateId,
  status,
  userRole,
}: TemplateActionsProps) {
  const router = useRouter();

  async function handleAction(action: () => Promise<{ success: boolean; error?: string }>) {
    const result = await action();
    if (result.success) {
      toast.success("Action completed");
      router.refresh();
    } else {
      toast.error(result.error || "Action failed");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <Button
          size="sm"
          onClick={() =>
            handleAction(() => submitTemplateForApproval(templateId))
          }
        >
          Submit for Approval
        </Button>
      )}
      {status === "PENDING_APPROVAL" &&
        hasPermission(userRole, "templates.approve") && (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleAction(() => approveTemplate(templateId))}
          >
            Approve
          </Button>
        )}
      {status === "APPROVED" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction(() => archiveTemplate(templateId))}
        >
          Archive
        </Button>
      )}
    </div>
  );
}
