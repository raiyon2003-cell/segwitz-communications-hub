"use client";

import { useRouter } from "next/navigation";
import { deleteTemplate } from "@/lib/actions/templates";
import { TableRowActions } from "@/components/shared/table-row-actions";

interface TemplateDeleteButtonProps {
  templateId: string;
  templateName: string;
}

export function TemplateDeleteButton({
  templateId,
  templateName,
}: TemplateDeleteButtonProps) {
  const router = useRouter();

  return (
    <TableRowActions
      itemName={templateName}
      canEdit={false}
      canView={false}
      onDelete={async () => {
        const result = await deleteTemplate(templateId);
        if (result.success) {
          router.push("/templates");
        }
        return result;
      }}
      deleteSuccessMessage="Template deleted"
    />
  );
}
