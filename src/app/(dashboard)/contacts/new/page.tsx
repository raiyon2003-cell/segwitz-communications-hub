import { ContactForm } from "@/components/contacts/contact-form";

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Contact</h1>
        <p className="text-muted-foreground">Add a new contact</p>
      </div>
      <ContactForm />
    </div>
  );
}
