import { notFound } from "next/navigation";
import { AdminRowActionButton } from "@/components/admin/AdminRowActionButton";
import { EditSourceDialog } from "@/components/admin/EditSourceDialog";
import { SourceForm } from "@/components/admin/SourceForm";
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
import { getAllSources } from "@/lib/db/source";

export default async function AdminSourcesPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  const sources = await getAllSources();

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Source Management</h1>
        <p className="text-muted-foreground">
          Create and manage content sources
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Source</CardTitle>
          </CardHeader>
          <CardContent>
            <SourceForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell>{source.abbreviation}</TableCell>
                  <TableCell>{source.license}</TableCell>
                  <TableCell>
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {source.link}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditSourceDialog source={source} />
                      <AdminRowActionButton
                        action={{ kind: "deleteSource", id: source.id }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
