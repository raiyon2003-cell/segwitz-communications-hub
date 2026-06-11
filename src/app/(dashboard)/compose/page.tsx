import { getTemplates } from "@/lib/actions/templates";
import { getContacts } from "@/lib/actions/contacts";
import { EmailComposer } from "@/components/compose/email-composer";

export default async function ComposePage() {
  const [{ templates }, { contacts }] = await Promise.all([
    getTemplates({ status: "APPROVED" }),
    getContacts({ pageSize: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compose Email</h1>
        <p className="text-muted-foreground">
          Select a template, fill variables, and send
        </p>
      </div>
      <EmailComposer templates={templates} contacts={contacts} />
    </div>
  );
}
