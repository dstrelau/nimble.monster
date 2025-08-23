import { Crown, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            What would you like to create?
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose between creating a traditional monster or an adventuring
            companion.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Crown className="h-6 w-6" />
                Monster
              </CardTitle>
              <CardDescription>
                Create traditional monsters with full stat blocks, legendary
                variants, and complex abilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standard and Legendary variants</li>
                <li>• Full movement and armor stats</li>
                <li>• Bloodied and Last Stand mechanics</li>
                <li>• Family system support</li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/monsters/new">Create Monster</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Users className="h-6 w-6" />
                Companion
              </CardTitle>
              <CardDescription>
                Create adventuring companions with simplified stats, wound
                tracking, and unique dying rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pocket Friend mechanics</li>
                <li>• Wound tracking system</li>
                <li>• Primary stat focus</li>
                <li>• Special dying rules</li>
              </ul>
              <Button asChild className="w-full" size="lg">
                <Link href="/companions/new">Create Companion</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
