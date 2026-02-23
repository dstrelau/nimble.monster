import Link from "next/link";
import { notFound } from "next/navigation";
import { uploadOfficialContentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdmin } from "@/lib/auth";

const adminLinks = [
  { href: "/admin/awards", label: "Awards" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/paperforge", label: "Paperforge" },
];

export default async function AdminPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  return (
    <div className="py-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Official Content</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadOfficialContentAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">JSON File</Label>
                {/* biome-ignore lint/correctness/useUniqueElementIds: Server component renders once */}
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".json"
                  required
                />
              </div>
              <Button type="submit">Upload and Preview</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              Upload a JSON file containing official content. The content type
              (monsters, ancestries, backgrounds, subclasses, or spell-schools)
              is auto-detected from the file.
            </p>
            <p className="text-sm text-muted-foreground">
              The file must follow the JSONAPI format with a &quot;data&quot;
              array where each item has a &quot;type&quot; field.
            </p>
            <p className="text-sm text-muted-foreground">
              When re-uploading, existing official content with the same name
              will be updated instead of duplicated.
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Other Admin Tools</h2>
        <ul className="space-y-2">
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-primary hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
