"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema } from "@/lib/validators";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: {
    companyName: string;
    brevoSenderName: string;
    brevoSenderEmail: string;
    brevoReplyToEmail: string;
    hasBrevoApiKey: boolean;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: settings.companyName,
      brevoSenderName: settings.brevoSenderName,
      brevoSenderEmail: settings.brevoSenderEmail,
      brevoReplyToEmail: settings.brevoReplyToEmail,
    },
  });

  async function onSubmit(data: SettingsFormData) {
    setLoading(true);
    const result = await updateSettings(data);
    if (result.success) {
      toast.success("Settings saved");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input {...register("companyName")} />
            {errors.companyName && (
              <p className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brevo Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Brevo API Key</Label>
            <Input
              type="password"
              {...register("brevoApiKey")}
              placeholder={
                settings.hasBrevoApiKey
                  ? "••••••••••••••••"
                  : "Enter API key"
              }
            />
            {settings.hasBrevoApiKey && (
              <p className="text-xs text-muted-foreground">
                API key is configured. Leave blank to keep current key.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Sender Name</Label>
            <Input {...register("brevoSenderName")} />
          </div>
          <div className="space-y-2">
            <Label>Sender Email</Label>
            <Input type="email" {...register("brevoSenderEmail")} />
          </div>
          <div className="space-y-2">
            <Label>Reply-To Email</Label>
            <Input type="email" {...register("brevoReplyToEmail")} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
