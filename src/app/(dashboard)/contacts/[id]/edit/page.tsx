import { notFound } from "next/navigation";
import { getContactForEdit } from "@/lib/actions/contacts";
import { ContactForm } from "@/components/contacts/contact-form";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await getContactForEdit(id);
  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Contact</h1>
        <p className="text-muted-foreground">{contact.name}</p>
      </div>
      <ContactForm contact={contact} />
    </div>
  );
}
