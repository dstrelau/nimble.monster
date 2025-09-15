#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../assets/game-icons");
const PUBLIC_DIR = path.join(__dirname, "../public/game-icons");
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
          svgPath: `/game-icons/${relativePath}`,
        });
      }
    }
  }

  walk(dir);
  return results;
}

function cleanSvgContent(svgContent) {
  // Clean the SVG: remove background and apply proper styling
  return (
    svgContent
      // Remove the black background rectangle
      .replace(/<path d="M0 0h512v512H0z"[^>]*\/?>/, "")
      // Remove explicit white fills to let CSS styling take over
      .replace(/fill="#fff"/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

function copySvgFiles() {
  console.log("Copying and cleaning SVG files to public directory...");

  // Remove existing public directory
  if (fs.existsSync(PUBLIC_DIR)) {
    fs.rmSync(PUBLIC_DIR, { recursive: true });
  }

  // Ensure public directory exists
  ensureDir(PUBLIC_DIR);

  // Walk through all SVG files and copy them with cleaning
  function walkAndCopy(sourceDir, targetDir) {
    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        ensureDir(targetPath);
        walkAndCopy(sourcePath, targetPath);
      } else if (file.endsWith(".svg")) {
        // Read, clean, and write SVG
        const svgContent = fs.readFileSync(sourcePath, "utf8");
        const cleanedSvg = cleanSvgContent(svgContent);
        fs.writeFileSync(targetPath, cleanedSvg);
      }
    }
  }

  walkAndCopy(ASSETS_DIR, PUBLIC_DIR);

  console.log("SVG files copied and cleaned to public/game-icons/");
}

function main() {
  console.log("Syncing game icons...");

  // Ensure directories exist
  ensureDir(COMPONENTS_DIR);

  // Get all SVG files
  console.log("Scanning for SVG files...");
  const icons = getAllSvgFiles(ASSETS_DIR);
  console.log(`Found ${icons.length} icons`);

  // Copy SVG files to public directory
  copySvgFiles();

  // Create TypeScript index with icon metadata
  console.log("Creating TypeScript index...");

  // Extract only the needed properties for the interface
  const cleanedIcons = icons.map((icon) => ({
    id: icon.id,
    name: icon.name,
    contributor: icon.contributor,
    svgPath: icon.svgPath,
  }));

  const indexContent = `// Auto-generated icon index for SVG files
export interface IconData {
  id: string;
  name: string;
  contributor: string;
  svgPath: string;
}

export const ICONS: IconData[] = ${JSON.stringify(cleanedIcons, null, 2)};

export const ICON_COUNT = ${cleanedIcons.length};
`;

  fs.writeFileSync(INDEX_FILE, indexContent);

  console.log(`Sync complete! ${icons.length} SVG files indexed.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
