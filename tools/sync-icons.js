#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../assets/game-icons");
const COMPONENTS_DIR = path.join(__dirname, "../components/icons");
const INDEX_FILE = path.join(COMPONENTS_DIR, "index.ts");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAllSvgFiles(dir) {
  const results = [];

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith(".svg")) {
        const relativePath = path.relative(ASSETS_DIR, fullPath);
        const pathParts = relativePath.split(path.sep);
        const contributor = pathParts[0];
        const filename = pathParts[pathParts.length - 1];
        const name = path.basename(filename, ".svg");

        results.push({
          path: relativePath,
          contributor,
          filename,
          name: name.replace(/-/g, " "),
          searchName: name.replace(/-/g, "").toLowerCase(),
          id: name,
        });
      }
    }
  }

  walk(dir);
  return results;
}

function createIconComponent(iconData) {
  const sourcePath = path.join(ASSETS_DIR, iconData.path);
  const svgContent = fs.readFileSync(sourcePath, "utf8");

  // Clean up the SVG content for React
  const cleanedSvg = svgContent
    .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .trim();

  // Extract viewBox and other attributes
  const viewBoxMatch = cleanedSvg.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 512 512";

  // Extract path data or other SVG content and clean up styling
  let svgInnerContent = cleanedSvg
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");

  // Remove existing fill attributes and background rectangles to allow CSS styling
  svgInnerContent = svgInnerContent
    .replace(/fill="[^"]*"/g, "")
    .replace(/fill-opacity="[^"]*"/g, "")
    .replace(/<path d="M0 0h512v512H0z"[^>]*\/?>/, "") // Remove common background rectangle
    .replace(
      /<rect[^>]*x="0"[^>]*y="0"[^>]*width="512"[^>]*height="512"[^>]*\/?>/,
      ""
    ) // Remove background rect
    .replace(/stroke-width="/g, 'strokeWidth="')
    .replace(/stroke-opacity="/g, 'strokeOpacity="')
    .replace(/fill-opacity="/g, 'fillOpacity="')
    .replace(/stroke-linecap="/g, 'strokeLinecap="')
    .replace(/stroke-linejoin="/g, 'strokeLinejoin="')
    .replace(/stroke-dasharray="/g, 'strokeDasharray="')
    .replace(/stroke-dashoffset="/g, 'strokeDashoffset="')
    .replace(/\s+/g, " ")
    .trim();

  // Generate component name from icon ID
  let componentName = iconData.id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // Ensure component name doesn't start with a number
  if (/^\d/.test(componentName)) {
    componentName = "Icon" + componentName;
  }

  const componentCode = `import type { SVGProps } from 'react';

export function ${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="${viewBox}"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      ${svgInnerContent}
    </svg>
  );
}
`;

  // Create directory structure
  const contributorDir = path.join(COMPONENTS_DIR, iconData.contributor);
  ensureDir(contributorDir);

  // Write component file
  const componentPath = path.join(contributorDir, `${componentName}.tsx`);
  fs.writeFileSync(componentPath, componentCode);

  // Update the icon data with component info
  iconData.componentName = componentName;
  iconData.componentPath = `@/components/icons/${iconData.contributor}/${componentName}`;
}

function main() {
  console.log("Syncing game icons...");

  // Ensure components directory exists
  ensureDir(COMPONENTS_DIR);

  // Get all SVG files
  console.log("Scanning for SVG files...");
  const icons = getAllSvgFiles(ASSETS_DIR);
  console.log(`Found ${icons.length} icons`);

  // Create React components
  console.log("Creating React components...");
  icons.forEach(createIconComponent);

  // Create TypeScript index with icon metadata
  console.log("Creating TypeScript index...");
  const iconEntries = icons
    .map(
      (icon) => `  "${icon.id}": {
    name: "${icon.name}",
    contributor: "${icon.contributor}",
    componentName: "${icon.componentName}",
    componentPath: "${icon.componentPath}"
  }`
    )
    .join(",\n");

  const indexContent = `// Auto-generated icon index
export interface IconData {
  name: string;
  contributor: string;
  componentName: string;
  componentPath: string;
}

export const ICONS: Record<string, IconData> = {
${iconEntries}
};

export const ICON_LIST = Object.keys(ICONS);
export const ICON_COUNT = ${icons.length};
`;

  fs.writeFileSync(INDEX_FILE, indexContent);

  console.log(`Sync complete! ${icons.length} React components created.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
