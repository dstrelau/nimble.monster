import { lazy, type SVGProps } from "react";
import { ICONS, type IconData } from "@/components/icons";

interface GameIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  iconId: string;
  className?: string;
}

// Cache for lazy-loaded icon components to prevent re-creation
const iconComponentCache = new Map();

export function GameIcon({ iconId, className, ...props }: GameIconProps) {
  const iconData: IconData | undefined = ICONS.find(
    (icon) => icon.id === iconId
  );

  if (!iconData) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-200 rounded text-gray-400`}
        title="Icon not found"
      >
        ?
      </div>
    );
  }

  // Get or create cached lazy component
  const cacheKey = `${iconData.contributor}/${iconData.componentName}`;
  if (!iconComponentCache.has(cacheKey)) {
    const path = `./icons/${iconData.contributor}/${iconData.componentName}`;
    const IconComponent = lazy(() =>
      import(path)
        .then((module) => ({
          default: (props: SVGProps<SVGSVGElement>) => {
            const Component = module[iconData.componentName];
            return <Component {...props} />;
          },
        }))
        .catch(() => ({ default: () => <div>?</div> }))
    );
    iconComponentCache.set(cacheKey, IconComponent);
  }

  const IconComponent = iconComponentCache.get(cacheKey);

  return <IconComponent {...props} className={className} />;
}
