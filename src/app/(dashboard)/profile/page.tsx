import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";

export default async function ProfilePage() {
  const session = await getSession();
  const user = session!.dbUser;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">Name: </span>
            {user.firstName} {user.lastName}
          </div>
          <div>
            <span className="text-muted-foreground">Email: </span>
            {user.email}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Role: </span>
            <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
          </div>
          {user.department && (
            <div>
              <span className="text-muted-foreground">Department: </span>
              {user.department.division.name} / {user.department.name}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
