import { getApprovedTemplateSummaries } from "@/lib/actions/templates";
import { getContactsForCompose } from "@/lib/actions/contacts";
import { EmailComposer } from "@/components/compose/email-composer";

export default async function ComposePage() {
  const [templateSummaries, contacts] = await Promise.all([
    getApprovedTemplateSummaries(),
    getContactsForCompose(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compose Email</h1>
        <p className="text-muted-foreground">
          Select a template, fill variables, and send
        </p>
      </div>
      <EmailComposer templateSummaries={templateSummaries} contacts={contacts} />
    </div>
  );
}
