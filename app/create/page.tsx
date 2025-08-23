import { Ghost, Users } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreateCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function CreateCard({ href, icon, title, description }: CreateCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            What would you like to create?
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CreateCard
            href="/monsters/new"
            icon={<Ghost className="h-16 w-16" />}
            title="Monster"
            description="Traditional monsters and Solo Legendaries."
          />
          <CreateCard
            href="/companions/new"
            icon={<Users className="h-16 w-16" />}
            title="Companion"
            description="NPC adventuring companions."
          />
        </div>
      </div>
    </div>
  );
}
