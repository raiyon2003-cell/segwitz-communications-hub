import { getSettings } from "@/lib/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure company and Brevo integration
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
