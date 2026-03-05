import {
  BookOpen,
  Ellipsis,
  List,
  Map as MapIcon,
  Settings,
  Shield,
  Sparkles,
  Sword,
  User,
} from "lucide-react";

export function ReferenceCategoryIcon({
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
    case "settings":
      return <Settings {...props} />;
    case "list":
      return <List {...props} />;
    case "ellipsis":
      return <Ellipsis {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
