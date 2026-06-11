import { getDashboardStats } from "@/lib/actions/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Communication overview and activity
        </p>
      </div>

      <StatsCards
        emailsSentToday={stats.emailsSentToday}
        failedToday={stats.failedToday}
        emailsSentMonth={stats.emailsSentMonth}
      />

      <DashboardCharts
        mostUsedTemplates={stats.mostUsedTemplates}
        emailsByDepartment={stats.emailsByDepartment}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Sends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentSends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent emails</p>
            ) : (
              stats.recentSends.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{email.recipient}</p>
                    <p className="text-xs text-muted-foreground">
                      {email.template?.name || email.subject}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(email.sentAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Failures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failures</p>
            ) : (
              stats.recentFailures.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{email.recipient}</p>
                    <p className="text-xs text-muted-foreground">
                      {email.errorMessage || "Send failed"}
                    </p>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
