import { getDepartments } from "@/lib/actions/departments";
import { getCategories } from "@/lib/actions/templates";
import { TemplateForm } from "@/components/templates/template-form";

export default async function NewTemplatePage() {
  const [departments, categories] = await Promise.all([
    getDepartments(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Template</h1>
        <p className="text-muted-foreground">
          Create a new email template with variables
        </p>
      </div>
      <TemplateForm departments={departments} categories={categories} />
    </div>
  );
}
