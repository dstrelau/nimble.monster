import {
  BookOpen,
  BookOpenCheck,
  Crown,
  Ellipsis,
  Hammer,
  List,
  Map as MapIcon,
  Shield,
  Sparkles,
  Sword,
  Swords,
  User,
} from "lucide-react";

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
    case "crown":
      return <Crown {...props} />;
    case "list":
      return <List {...props} />;
    case "ellipsis":
      return <Ellipsis {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
