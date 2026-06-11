import { getCommunicationTimeline } from "@/lib/actions/emails";
import { getContacts } from "@/lib/actions/contacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const params = await searchParams;
  const [timeline, { contacts }] = await Promise.all([
    getCommunicationTimeline(params.contactId),
    getContacts({ pageSize: 100 }),
  ]);

  const grouped = timeline.reduce(
    (acc, item) => {
      const date = formatDate(item.occurredAt);
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, typeof timeline>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communication Timeline</h1>
        <p className="text-muted-foreground">
          Chronological communication history
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href="/timeline"
          className={`rounded-full px-3 py-1 text-sm ${
            !params.contactId
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          All Contacts
        </a>
        {contacts.map((c) => (
          <a
            key={c.id}
            href={`/timeline?contactId=${c.id}`}
            className={`rounded-full px-3 py-1 text-sm ${
              params.contactId === c.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

      <div className="space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground">No communication history yet</p>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {date}
              </h3>
              <div className="space-y-3 border-l-2 border-primary/20 pl-6">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                        {item.sentEmail && (
                          <Badge
                            variant={
                              item.sentEmail.status === "SENT"
                                ? "success"
                                : "destructive"
                            }
                          >
                            {item.sentEmail.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>{item.contact.name}</p>
                      {item.description && <p>{item.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
