"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { templateSchema } from "@/lib/validators";
import { createTemplate, updateTemplate } from "@/lib/actions/templates";
import { validateHtmlFile } from "@/lib/services/html-sanitizer";
import { HtmlEmailPreview } from "@/components/templates/html-email-preview";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";
import type { EmailCategory, Department } from "@prisma/client";

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  departments: (Department & { division: { name: string } })[];
  categories: EmailCategory[];
  defaultValues?: Partial<TemplateFormData> & { id?: string };
}

export function TemplateForm({
  departments,
  categories,
  defaultValues,
}: TemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [htmlContent, setHtmlContent] = useState(
    defaultValues?.htmlContent || ""
  );
  const [htmlFileName, setHtmlFileName] = useState("");
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [templateType, setTemplateType] = useState<"RICH_TEXT" | "HTML">(
    defaultValues?.templateType || "RICH_TEXT"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      departmentId: defaultValues?.departmentId || "",
      categoryId: defaultValues?.categoryId || "",
      subject: defaultValues?.subject || "",
      body: defaultValues?.body || "",
      templateType: defaultValues?.templateType || "RICH_TEXT",
    },
  });

  async function onSubmit(data: TemplateFormData) {
    if (templateType === "HTML" && !htmlContent.trim()) {
      toast.error("Please upload an HTML file first");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.set("templateType", templateType);
    if (htmlContent) formData.set("htmlContent", htmlContent);
    if (htmlFile) formData.append("htmlFile", htmlFile);
    assetFiles.forEach((file) => formData.append("assetFiles", file));

    const result = defaultValues?.id
      ? await updateTemplate(defaultValues.id, formData)
      : await createTemplate(formData);

    if (result.success) {
      toast.success(
        defaultValues?.id ? "Template updated" : "Template created"
      );
      router.push("/templates");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  const handleHtmlUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validationError = validateHtmlFile(file);
      if (validationError) {
        toast.error(validationError);
        e.target.value = "";
        return;
      }

      setUploading(true);
      try {
        const text = await file.text();
        setHtmlFile(file);
        setHtmlFileName(file.name);
        setHtmlContent(text);
        setTemplateType("HTML");
        setValue("templateType", "HTML");
        setShowPreview(false);
        toast.success(`Loaded ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      } catch {
        toast.error("Failed to read HTML file");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [setValue]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Template Name</Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={watch("departmentId")}
            onValueChange={(v) => setValue("departmentId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.division.name} / {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={watch("categoryId")}
            onValueChange={(v) => setValue("categoryId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.department} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input {...register("subject")} placeholder="Hello {{client_name}}" />
        </div>
      </div>

      <Tabs
        value={templateType}
        onValueChange={(v) => {
          setTemplateType(v as "RICH_TEXT" | "HTML");
          setValue("templateType", v as "RICH_TEXT" | "HTML");
        }}
      >
        <TabsList>
          <TabsTrigger value="RICH_TEXT">Rich Text</TabsTrigger>
          <TabsTrigger value="HTML">HTML Template</TabsTrigger>
        </TabsList>
        <TabsContent value="RICH_TEXT" className="space-y-4">
          <div className="space-y-2">
            <Label>Email Body</Label>
            <Textarea
              {...register("body")}
              rows={10}
              placeholder="Dear {{client_name}}, ..."
            />
          </div>
        </TabsContent>
        <TabsContent value="HTML" className="space-y-4">
          <div className="space-y-2">
            <Label>Upload HTML File</Label>
            <Input
              type="file"
              accept=".html,text/html"
              onChange={handleHtmlUpload}
              disabled={uploading}
            />
            {htmlFileName && (
              <p className="text-sm text-muted-foreground">
                Loaded: {htmlFileName} ({(htmlContent.length / 1024).toFixed(0)}{" "}
                KB)
              </p>
            )}
            {uploading && (
              <p className="text-sm text-muted-foreground">Reading file...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Upload Image Assets (optional)</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAssetFiles(files);
                setShowPreview(false);
              }}
            />
            <p className="text-xs text-muted-foreground">
              If your HTML references local images (e.g. assets/logo.png), upload
              those files here. They will be hosted and linked automatically.
            </p>
            {assetFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {assetFiles.length} asset file(s) selected:{" "}
                {assetFiles.map((f) => f.name).join(", ")}
              </p>
            )}
          </div>

          {htmlContent && (
            <>
              <div className="space-y-2">
                <Label>HTML Source</Label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => {
                    setHtmlContent(e.target.value);
                    setShowPreview(false);
                  }}
                  rows={8}
                  className="max-h-48 font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Edit the HTML source above. Click Preview when ready.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Plain Text Fallback</Label>
                <Textarea
                  value={watch("body") || ""}
                  onChange={(e) => setValue("body", e.target.value)}
                  rows={3}
                  placeholder="Plain text version for email clients that don't support HTML"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Preview</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                  >
                    {showPreview ? "Refresh Preview" : "Show Preview"}
                  </Button>
                </div>
                {showPreview && <HtmlEmailPreview html={htmlContent} />}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || uploading}>
          {loading ? "Saving..." : defaultValues?.id ? "Update" : "Create"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
