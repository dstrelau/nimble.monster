import {
  BookUser,
  Box,
  Drama,
  Gem,
  Ghost,
  HeartHandshake,
  ListChecks,
  Scroll,
  Split,
  Users,
  WandSparkles,
} from "lucide-react";
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
        <div className="max-w-3xl mx-auto">
          <h2 className="w-full text-4xl text-center font-bold mb-4">
            What would you like to create?
          </h2>

          <div className="flex flex-wrap justify-center gap-6">
            <CreateCard
              href="/monsters/new"
              icon={<Ghost className="size-16" />}
              title="Monster"
              description="Traditional monsters and Solo Legendaries."
            />
            <CreateCard
              href="/families/new"
              icon={<Users className="size-16" />}
              title="Family"
              description="Monster groups with shared abilities."
              disabled={!isAuthenticated}
              disabledMessage="You must signin to create a Family."
            />
            <CreateCard
              href="/items/new"
              icon={<Gem className="size-16" />}
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
              description="Organize your favorites."
              disabled={!isAuthenticated}
              disabledMessage="You must signin to create a Collection."
            />

            <h2 className="w-full text-4xl text-center font-bold mb-4">
              Heroes
            </h2>

            <CreateCard
              href="/ancestries/new"
              icon={<Scroll className="size-16" />}
              title="Ancestry"
              description="Race or species"
            />
            <CreateCard
              href="/backgrounds/new"
              icon={<Drama className="size-16" />}
              title="Background"
              description="Character history"
            />
            <CreateCard
              href="/classes/new"
              icon={<BookUser className="size-16" />}
              title="Class"
              description="Defining character abilities"
              disabledMessage="You must signin to create a Class."
            />
            <CreateCard
              href="/class-options/new"
              icon={<ListChecks className="size-16" />}
              title="Class Options"
              description="Class-specific ability lists"
              disabledMessage="You must signin to create Class Options."
            />
            <CreateCard
              href="/subclasses/new"
              icon={<Split className="size-16" />}
              title="Subclass"
              description="Specialized class paths"
              disabledMessage="You must signin to create a Subclass."
            />
            <CreateCard
              href="/spell-schools/new"
              icon={<WandSparkles className="size-16" />}
              title="Spells"
              description="Schools of magic"
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
