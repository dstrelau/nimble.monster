import {
  BookOpen,
  BookOpenCheck,
  Coins,
  Hammer,
  List,
  Map as MapIcon,
  Shield,
  Sparkles,
  Sword,
  Swords,
  User,
  WandSparkles,
} from "lucide-react";
import { Goblin } from "@/components/icons/goblin";

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const props = { className: className ?? "size-6" };
  switch (icon) {
    case "sword":
      return <Sword {...props} />;
    case "user":
      return <User {...props} />;
    case "sparkles":
      return <Sparkles {...props} />;
    case "wand-sparkles":
      return <WandSparkles {...props} />;
    case "coins":
      return <Coins {...props} />;
    case "goblin":
      return <Goblin {...props} />;
    case "shield":
      return <Shield {...props} />;
    case "map":
      return <MapIcon {...props} />;
    case "book-open":
      return <BookOpen {...props} />;
    case "book-open-check":
      return <BookOpenCheck {...props} />;
    case "swords":
      return <Swords {...props} />;
    case "hammer":
      return <Hammer {...props} />;
    case "list":
      return <List {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
