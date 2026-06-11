"use client";

import { deleteContact } from "@/lib/actions/contacts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableRowActions } from "@/components/shared/table-row-actions";
import type { Contact } from "@prisma/client";

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.company || "—"}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{c.contactType}</Badge>
                </TableCell>
                <TableCell>
                  <TableRowActions
                    itemName={c.name}
                    editHref={`/contacts/${c.id}/edit`}
                    onDelete={() => deleteContact(c.id)}
                    deleteSuccessMessage="Contact deleted"
                    deleteDescription={`"${c.name}" will be removed from your contact database. Linked email history will be kept.`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
