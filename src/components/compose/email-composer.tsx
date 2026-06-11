"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { sendEmail } from "@/lib/actions/emails";
import { replaceVariables } from "@/lib/services/variable-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HtmlEmailPreview } from "@/components/templates/html-email-preview";
import { toast } from "sonner";
import type { Contact, EmailTemplate, TemplateVariable } from "@prisma/client";

type TemplateWithRelations = EmailTemplate & {
  variables: TemplateVariable[];
  department: { name: string };
};

interface EmailComposerProps {
  templates: TemplateWithRelations[];
  contacts: Contact[];
}

export function EmailComposer({ templates, contacts }: EmailComposerProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [contactId, setContactId] = useState("");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setBody(
        template.templateType === "HTML" && template.htmlContent
          ? template.htmlContent
          : template.body
      );
      const vars: Record<string, string> = {};
      template.variables.forEach((v) => {
        vars[v.variableName] = "";
      });
      setVariables(vars);
    }
  }

  function handleContactChange(id: string) {
    setContactId(id);
    const contact = contacts.find((c) => c.id === id);
    if (contact) {
      setTo(contact.email);
      setVariables((prev) => ({
        ...prev,
        client_name: contact.name,
        candidate_name: contact.name,
        employee_name: contact.name,
        company_name: contact.company || "",
      }));
    }
  }

  const previewSubject = useMemo(
    () => replaceVariables(subject, variables),
    [subject, variables]
  );

  const previewBody = useMemo(() => {
    const content =
      selectedTemplate?.templateType === "HTML"
        ? selectedTemplate.htmlContent || body
        : body;
    return replaceVariables(content, variables);
  }, [body, variables, selectedTemplate]);

  async function handleSend() {
    if (!templateId || !to) {
      toast.error("Template and recipient are required");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("templateId", templateId);
    formData.set("contactId", contactId);
    formData.set("to", to);
    formData.set("cc", cc);
    formData.set("bcc", bcc);
    formData.set("subject", subject);
    formData.set("body", body);
    formData.set("variables", JSON.stringify(variables));

    if (attachments) {
      Array.from(attachments).forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const result = await sendEmail(formData);
    if (result.success) {
      toast.success("Email sent successfully");
      router.push("/history");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={templateId} onValueChange={handleTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select approved template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.department.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Contact</Label>
          <Select value={contactId} onValueChange={handleContactChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact (optional)" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>CC</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>BCC</Label>
            <Input value={bcc} onChange={(e) => setBcc(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        {selectedTemplate && selectedTemplate.variables.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedTemplate.variables.map((v) => (
                <div key={v.id} className="space-y-1">
                  <Label className="text-xs">
                    {v.label || v.variableName}
                  </Label>
                  <Input
                    value={variables[v.variableName] || ""}
                    onChange={(e) =>
                      setVariables((prev) => ({
                        ...prev,
                        [v.variableName]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedTemplate?.templateType !== "HTML" && (
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Attachments</Label>
          <Input
            type="file"
            multiple
            accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => setAttachments(e.target.files)}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setShowPreview(true)} variant="outline">
            Preview
          </Button>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <p>
                <strong>To:</strong> {to}
              </p>
              {cc && (
                <p>
                  <strong>CC:</strong> {cc}
                </p>
              )}
              <p>
                <strong>Subject:</strong> {previewSubject}
              </p>
            </div>
            {selectedTemplate?.templateType === "HTML" ? (
              <HtmlEmailPreview html={previewBody} />
            ) : (
              <div className="whitespace-pre-wrap rounded-lg border p-4 text-sm">
                {previewBody}
              </div>
            )}
            {attachments && attachments.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Attachments: {Array.from(attachments).map((f) => f.name).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
