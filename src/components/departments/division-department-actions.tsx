"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  updateDivision,
  updateDepartment,
  deleteDivision,
  deleteDepartment,
} from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TableRowActions } from "@/components/shared/table-row-actions";

interface DivisionActionsProps {
  divisionId: string;
  divisionName: string;
}

export function DivisionActions({
  divisionId,
  divisionName,
}: DivisionActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(divisionName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await updateDivision(divisionId, { name: name.trim() });
    setSaving(false);
    if (result.success) {
      toast.success("Division updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Division</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TableRowActions
        itemName={divisionName}
        canEdit={false}
        canView={false}
        onDelete={() => deleteDivision(divisionId)}
        deleteSuccessMessage="Division deleted"
      />
    </div>
  );
}

interface DepartmentActionsProps {
  departmentId: string;
  departmentName: string;
  divisionId: string;
}

export function DepartmentActions({
  departmentId,
  departmentName,
  divisionId,
}: DepartmentActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(departmentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await updateDepartment(departmentId, {
      name: name.trim(),
      divisionId,
    });
    setSaving(false);
    if (result.success) {
      toast.success("Department updated");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TableRowActions
        itemName={departmentName}
        canEdit={false}
        canView={false}
        onDelete={() => deleteDepartment(departmentId)}
        deleteSuccessMessage="Department deleted"
      />
    </div>
  );
}
