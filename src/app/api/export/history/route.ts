import { NextRequest, NextResponse } from "next/server";
import { getEmailHistoryForExport } from "@/lib/actions/emails";
import { getSession } from "@/lib/auth/session";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") || "csv";
  const emails = await getEmailHistoryForExport();

  const rows = emails.map((e) => ({
    Recipient: e.recipient,
    Subject: e.subject,
    Template: e.template?.name || "",
    Department: e.department?.name || "",
    "Sent By": `${e.sentBy.firstName} ${e.sentBy.lastName}`,
    Status: e.status,
    "Sent Date": e.sentAt.toISOString(),
    "Brevo Message ID": e.brevoMessageId || "",
  }));

  if (format === "xlsx") {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Email History");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="email-history.xlsx"',
      },
    });
  }

  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="email-history.csv"',
    },
  });
}
