import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertTriangle, Calendar } from "lucide-react";

interface StatsCardsProps {
  emailsSentToday: number;
  failedToday: number;
  emailsSentMonth: number;
}

export function StatsCards({
  emailsSentToday,
  failedToday,
  emailsSentMonth,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Emails Sent Today",
      value: emailsSentToday,
      icon: Mail,
      iconClass: "text-brand-steel-teal",
      accentClass: "border-l-brand-steel-teal",
    },
    {
      title: "Failed Today",
      value: failedToday,
      icon: AlertTriangle,
      iconClass: "text-destructive",
      accentClass: "border-l-destructive",
    },
    {
      title: "Sent This Month",
      value: emailsSentMonth,
      icon: Calendar,
      iconClass: "text-brand-lime",
      accentClass: "border-l-brand-lime",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={`brand-card-elevated border-l-4 ${stat.accentClass}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.iconClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
