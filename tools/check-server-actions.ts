#!/usr/bin/env node

import path from "node:path";
import { API } from "typescript/unstable/sync";
import * as ast from "typescript/unstable/ast";
import { serverActionBaseline } from "./server-action-baseline.js";

interface DirectiveInventory {
  moduleDirectives: number;
  inlineDirectives: number;
  callableExports: number;
}

const root = process.cwd();
const baselineCategoryByFile = new Map<string, string>();
for (const [category, files] of Object.entries(serverActionBaseline)) {
  for (const file of Object.keys(files)) {
    baselineCategoryByFile.set(file, category);
  }
}

function isUseServerDirective(node: ast.Node): boolean {
  return (
    ast.isExpressionStatement(node) &&
    ast.isStringLiteral(node.expression) &&
    node.expression.text === "use server"
  );
}

function countCallableExports(sourceFile: ast.SourceFile): number {
  let count = 0;
  for (const statement of sourceFile.statements) {
    let exported = false;
    statement.forEachChild((child) => {
      if (child.kind === ast.SyntaxKind.ExportKeyword) exported = true;
    });
    if (exported && ast.isFunctionDeclaration(statement)) {
      count += 1;
    } else if (exported && ast.isVariableStatement(statement)) {
      count += statement.declarationList.declarations.length;
    } else if (ast.isExportDeclaration(statement)) {
      const clause = statement.exportClause;
      if (!clause || ast.isNamespaceExport(clause)) {
        throw new Error(
          `${sourceFile.fileName}: use server modules may not use wildcard exports`
        );
      }
      count += clause.elements.filter(
        (element) => !statement.isTypeOnly && !element.isTypeOnly
      ).length;
    }
  }
  return count;
}

function inventorySourceFile(
  sourceFile: ast.SourceFile
): DirectiveInventory | null {
  const moduleDirectives = sourceFile.statements.filter(
    isUseServerDirective
  ).length;
  let inlineDirectives = 0;

  function visit(node: ast.Node): void {
    if (
      node !== sourceFile &&
      ast.isFunctionLikeDeclaration(node) &&
      node.body &&
      ast.isBlock(node.body)
    ) {
      inlineDirectives += node.body.statements.filter(
        isUseServerDirective
      ).length;
    }
    node.forEachChild(visit);
  }
  visit(sourceFile);

  if (moduleDirectives === 0 && inlineDirectives === 0) return null;
  return {
    moduleDirectives,
    inlineDirectives,
    callableExports: moduleDirectives ? countCallableExports(sourceFile) : 0,
  };
}

const api = new API();
let failed = false;
try {
  const snapshot = api.updateSnapshot({ openProjects: ["tsconfig.json"] });
  const project = snapshot.getProjects()[0];
  if (!project) throw new Error("Could not load tsconfig.json");

  const actual = new Map<string, DirectiveInventory>();
  for (const absoluteFile of project.program.getSourceFileNames()) {
    if (!absoluteFile.startsWith(`${root}${path.sep}`)) continue;
    const file = path.relative(root, absoluteFile);
    const sourceFile = project.program.getSourceFile(absoluteFile);
    if (!sourceFile) continue;
    const inventory = inventorySourceFile(sourceFile);
    if (inventory) actual.set(file, inventory);
  }

  for (const [file, inventory] of actual) {
    const category = baselineCategoryByFile.get(file);
    if (!category) {
      console.error(`New use server boundary: ${file}`);
      failed = true;
      continue;
    }
    const expected = serverActionBaseline[category][file];
    if (
      inventory.moduleDirectives !== 1 ||
      inventory.inlineDirectives !== 0 ||
      inventory.callableExports !== expected
    ) {
      console.error(
        `${file}: expected 1 module directive, 0 inline directives, and ${expected} callable exports; found ${inventory.moduleDirectives}, ${inventory.inlineDirectives}, and ${inventory.callableExports}`
      );
      failed = true;
    }
  }

  for (const file of baselineCategoryByFile.keys()) {
    if (!actual.has(file)) {
      console.error(
        `${file}: baseline is stale after removing use server; lower tools/server-action-baseline.js`
      );
      failed = true;
    }
  }

  snapshot.dispose();
} finally {
  api.close();
}

if (failed) process.exitCode = 1;
else console.log("Server Action inventory matches the checked-in baseline.");
