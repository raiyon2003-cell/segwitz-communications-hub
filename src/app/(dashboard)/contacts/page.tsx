import Link from "next/link";
import { getContacts } from "@/lib/actions/contacts";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ContactsPage() {
  const { contacts } = await getContacts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database</p>
        </div>
        <Button asChild>
          <Link href="/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Link>
        </Button>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
