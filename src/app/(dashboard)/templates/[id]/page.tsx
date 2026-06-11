import { notFound } from "next/navigation";
import Link from "next/link";
import { getTemplate } from "@/lib/actions/templates";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateActions } from "@/components/templates/template-actions";
import { hasPermission } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";
import { HtmlEmailPreview } from "@/components/templates/html-email-preview";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, session] = await Promise.all([
    getTemplate(id),
    getSession(),
  ]);

  if (!template) notFound();

  const canEdit = hasPermission(session!.dbUser.role, "templates.edit");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground">
            {template.department.division.name} / {template.department.name} ·{" "}
            {template.category.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{template.status.replace("_", " ")}</Badge>
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/templates/${id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <TemplateActions
        templateId={id}
        status={template.status}
        userRole={session!.dbUser.role}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Subject: </span>
              {template.subject}
            </div>
            <div>
              <span className="text-muted-foreground">Type: </span>
              {template.templateType}
            </div>
            <div>
              <span className="text-muted-foreground">Owner: </span>
              {template.owner.firstName} {template.owner.lastName}
            </div>
            <div>
              <span className="text-muted-foreground">Updated: </span>
              {formatDateTime(template.updatedAt)}
            </div>
            {template.htmlFileUrl && (
              <div>
                <a
                  href={template.htmlFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Download HTML File
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variables</CardTitle>
          </CardHeader>
          <CardContent>
            {template.variables.length === 0 ? (
              <p className="text-sm text-muted-foreground">No variables</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {template.variables.map((v) => (
                  <Badge key={v.id} variant="outline">
                    {`{{${v.variableName}}}`}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {template.templateType === "HTML" && template.htmlContent ? (
            <HtmlEmailPreview html={template.htmlContent} />
          ) : (
            <div className="whitespace-pre-wrap rounded-lg border p-4">
              {template.body}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
