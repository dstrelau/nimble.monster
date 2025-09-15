"use client";
import { type SVGProps, useEffect, useState } from "react";
import { ICONS, type IconData } from "@/components/icons";

interface GameIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  iconId: string;
  className?: string;
}

// Cache for loaded SVG content
const svgCache = new Map<string, string>();

export function GameIcon({ iconId, className, ...props }: GameIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const iconData: IconData | undefined = ICONS.find(
    (icon) => icon.id === iconId
  );

  useEffect(() => {
    if (!iconData) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    if (svgCache.has(iconData.svgPath)) {
      const cachedContent = svgCache.get(iconData.svgPath);
      if (cachedContent) {
        setSvgContent(cachedContent);
        setIsLoading(false);
        return;
      }
    }

    // Load pre-cleaned SVG content
    fetch(iconData.svgPath)
      .then((response) => response.text())
      .then((svg) => {
        const innerContent = svg
          .replace(/<svg[^>]*>/, "")
          .replace(/<\/svg>$/, "")
          .trim();

        svgCache.set(iconData.svgPath, innerContent);
        setSvgContent(innerContent);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [iconData]);

  if (!iconData || (!isLoading && !svgContent)) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-200 rounded text-gray-400`}
        title="Icon not found"
      >
        ∅
      </div>
    );
  }

  if (isLoading) {
    return <div className={className} title="Loading..."></div>;
  }

  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      {...props}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG content from trusted static assets
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
