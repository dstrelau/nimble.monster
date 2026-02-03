import { notFound } from "next/navigation";
import { uploadOfficialMonstersAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdmin } from "@/lib/auth";

export default async function AdminMonstersPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Official Monsters</h1>
        <p className="text-muted-foreground">Upload official monster content</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Monster JSON</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadOfficialMonstersAction} className="space-y-4">
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
            <p>Upload a JSON file containing official monsters.</p>
            <p className="text-sm text-muted-foreground">
              The file must follow the JSONAPI format with a &quot;data&quot;
              array of monster objects.
            </p>
            <p className="text-sm text-muted-foreground">
              When re-uploading, existing official monsters with the same name
              will be updated instead of duplicated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
