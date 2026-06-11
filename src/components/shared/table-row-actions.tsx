"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TableRowActionsProps {
  itemName: string;
  editHref?: string;
  onEdit?: () => void;
  viewHref?: string;
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
  canEdit?: boolean;
  canDelete?: boolean;
  canView?: boolean;
  deleteDescription?: string;
  deleteSuccessMessage?: string;
}

export function TableRowActions({
  itemName,
  editHref,
  onEdit,
  viewHref,
  onDelete,
  canEdit = true,
  canDelete = true,
  canView = false,
  deleteDescription,
  deleteSuccessMessage = "Deleted successfully",
}: TableRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  if (!canEdit && !canDelete && !canView) return null;

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    const result = await onDelete();
    setDeleting(false);
    if (result.success) {
      toast.success(deleteSuccessMessage);
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Delete failed");
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {canView && viewHref && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={viewHref}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Link>
        </Button>
      )}

      {canEdit && editHref && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={editHref}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
      )}

      {canEdit && onEdit && !editHref && (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
      )}

      {canDelete && onDelete && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {itemName}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDescription ||
                  `This action cannot be undone. "${itemName}" will be permanently removed.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
