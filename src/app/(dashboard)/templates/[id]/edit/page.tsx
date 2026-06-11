import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/actions/templates";
import { getDepartments } from "@/lib/actions/departments";
import { getCategories } from "@/lib/actions/templates";
import { TemplateForm } from "@/components/templates/template-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, departments, categories] = await Promise.all([
    getTemplate(id),
    getDepartments(),
    getCategories(),
  ]);

  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Template</h1>
        <p className="text-muted-foreground">{template.name}</p>
      </div>
      <TemplateForm
        departments={departments}
        categories={categories}
        defaultValues={{
          id: template.id,
          name: template.name,
          departmentId: template.departmentId,
          categoryId: template.categoryId,
          subject: template.subject,
          body: template.body,
          templateType: template.templateType,
          htmlContent: template.htmlContent || undefined,
        }}
      />
    </div>
  );
}
