import { Box, Ghost, HeartHandshake, Shield, Users } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";

interface CreateCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  disabledMessage?: string;
}

function CreateCard({
  href,
  icon,
  title,
  description,
  disabled,
  disabledMessage,
}: CreateCardProps) {
  const cardContent = (
    <Card
      className={`transition-shadow h-full ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-lg cursor-pointer"}`}
    >
      <CardHeader className="text-center align-center grow-1">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );

  if (disabled && disabledMessage) {
    return (
      <div className="basis-64 block">
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>{disabledMessage}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Link href={href} className="basis-64 block">
      {cardContent}
    </Link>
  );
}

export default async function CreatePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user?.id;

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              What would you like to create?
            </h1>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <CreateCard
              href="/monsters/new"
              icon={<Ghost className="size-16" />}
              title="Monster"
              description="Traditional monsters and Solo Legendaries."
            />
            <CreateCard
              href="/items/new"
              icon={<Shield className="size-16" />}
              title="Item"
              description="Magical items and equipment."
            />
            <CreateCard
              href="/companions/new"
              icon={<HeartHandshake className="size-16" />}
              title="Companion"
              description="NPC adventuring companions."
            />
            <CreateCard
              href="/collections/new"
              icon={<Box className="size-16" />}
              title="Collection"
              description="Organize monsters into collections."
              disabled={!isAuthenticated}
              disabledMessage="You must signin to create a Collection."
            />
            <CreateCard
              href="/families/new"
              icon={<Users className="size-16" />}
              title="Family"
              description="Create monster families with shared abilities."
              disabled={!isAuthenticated}
              disabledMessage="You must signin to create a Family."
            />
            {/*<CreateCard
              href="/subclasses/new"
              icon={<HandFist className="size-16" />}
              title="Subclass"
              description="Create custom character subclasses with abilities."
              disabled={!isAuthenticated}
              disabledMessage="You must signin to create a Subclass."
            /> */}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
