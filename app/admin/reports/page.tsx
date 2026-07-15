import { notFound } from "next/navigation";
import { Link } from "@/components/layout/Link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdmin } from "@/lib/auth";
import { getAllReports } from "@/lib/services/reports";

const REASON_LABELS: Record<string, string> = {
  inappropriate: "Inappropriate content",
  spam: "Spam",
  plagiarism: "Plagiarism or stolen content",
  inaccurate: "Inaccurate or broken stats",
  other: "Other",
};

export default async function AdminReportsPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  const reports = await getAllReports();

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">
          Reports submitted by users flagging content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Reported At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.entityTypeLabel}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={report.entityUrl}>{report.entityName}</Link>
                  </TableCell>
                  <TableCell>
                    {report.reporterName ??
                      report.reporterUsername ??
                      "Unknown"}
                  </TableCell>
                  <TableCell>
                    {REASON_LABELS[report.reason] ?? report.reason}
                  </TableCell>
                  <TableCell>{report.details}</TableCell>
                  <TableCell>{report.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
