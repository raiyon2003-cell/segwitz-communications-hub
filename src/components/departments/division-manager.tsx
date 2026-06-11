"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDivision,
  createDepartment,
  deleteDivision,
  deleteDepartment,
} from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  DivisionActions,
  DepartmentActions,
} from "@/components/departments/division-department-actions";
import type { Division, Department } from "@prisma/client";

type DivisionWithDepts = Division & { departments: Department[] };

interface DivisionManagerProps {
  divisions: DivisionWithDepts[];
}

export function DivisionManager({ divisions }: DivisionManagerProps) {
  const router = useRouter();
  const [divisionName, setDivisionName] = useState("");
  const [deptName, setDeptName] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  async function handleCreateDivision() {
    if (!divisionName.trim()) return;
    const result = await createDivision({ name: divisionName });
    if (result.success) {
      toast.success("Division created");
      setDivisionName("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleCreateDepartment() {
    if (!deptName.trim() || !selectedDivision) return;
    const result = await createDepartment({
      name: deptName,
      divisionId: selectedDivision,
    });
    if (result.success) {
      toast.success("Department created");
      setDeptName("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Division</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            placeholder="Division name"
            value={divisionName}
            onChange={(e) => setDivisionName(e.target.value)}
          />
          <Button onClick={handleCreateDivision}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Department</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <Select value={selectedDivision} onValueChange={setSelectedDivision}>
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Department name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            className="min-w-[200px] flex-1"
          />
          <Button onClick={handleCreateDepartment}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {divisions.map((division) => (
          <Card key={division.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{division.name}</CardTitle>
              <DivisionActions
                divisionId={division.id}
                divisionName={division.name}
              />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {division.departments.map((dept) => (
                  <li
                    key={dept.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    {dept.name}
                    <DepartmentActions
                      departmentId={dept.id}
                      departmentName={dept.name}
                      divisionId={division.id}
                    />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
