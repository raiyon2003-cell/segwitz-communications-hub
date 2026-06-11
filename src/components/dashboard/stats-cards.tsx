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
      color: "text-blue-600",
    },
    {
      title: "Failed Today",
      value: failedToday,
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Sent This Month",
      value: emailsSentMonth,
      icon: Calendar,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
