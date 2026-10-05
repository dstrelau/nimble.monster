"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/shared/FormattedText";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LAB_CONDITIONS } from "../text-formatting/fixtures";
import {
  casesToContent,
  REJECTED_URL_CASES,
  type ReferenceExample,
  referenceCases,
} from "./fixtures";

interface EntityReferencesLabProps {
  examples: ReferenceExample[];
}

export function EntityReferencesLab({ examples }: EntityReferencesLabProps) {
  const [selected, setSelected] = useState("all");
  const [width, setWidth] = useState("standard");
  const [mode, setMode] = useState("block");
  const [showSource, setShowSource] = useState(false);
  const visible =
    selected === "all"
      ? examples
      : examples.filter((example) => example.key === selected);
  const panels = visible.map((example) => ({
    key: example.key,
    title: example.label,
    cases: referenceCases(example),
    available: example.available,
    privateId: example.privateId,
  }));
  panels.push({
    key: "rejected",
    title: "URLs that stay literal",
    cases: REJECTED_URL_CASES,
    available: true,
    privateId: undefined,
  });

  return (
    <div className="space-y-6 pb-12" data-testid="entity-references-lab">
      <header className="space-y-2">
        <h1 className="font-slab text-4xl font-bold">Entity references</h1>
        <p className="max-w-3xl text-muted-foreground">
          Full Nexus URLs and @ references through the production renderer. Real
          public dev records are compared with missing and nonpublic references.
          Nothing is saved.
        </p>
      </header>
      <Card aria-label="Reference preview controls">
        <CardContent className="flex flex-wrap items-center gap-4">
          <ModeToggle />
          <Label>
            Content type
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger aria-label="Content type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All content types</SelectItem>
                {examples.map((example) => (
                  <SelectItem key={example.key} value={example.key}>
                    {example.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <Label>
            Preview width
            <Select value={width} onValueChange={setWidth}>
              <SelectTrigger aria-label="Preview width">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="narrow">Narrow</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label>
            Text context
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger aria-label="Text context">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block paragraphs</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="prefixed">Prefixed</SelectItem>
              </SelectContent>
            </Select>
          </Label>
          <Label>
            <Checkbox
              checked={showSource}
              onCheckedChange={(value) => setShowSource(value === true)}
            />
            Show source
          </Label>
        </CardContent>
      </Card>
      {panels.map((panel) => {
        const content = casesToContent(panel.cases);
        return (
          <Card key={panel.key} data-reference-panel={panel.key}>
            <CardHeader>
              <CardTitle>{panel.title}</CardTitle>
              {!panel.available && (
                <p className="text-sm text-muted-foreground">
                  No public record in this dev database; these examples exercise
                  unresolved output.
                </p>
              )}
              {panel.key !== "rejected" && !panel.privateId && (
                <p className="text-sm text-muted-foreground">
                  No nonpublic record available for this type.
                </p>
              )}
              <Badge variant="outline" className="w-fit">
                {panel.cases.length} cases × 2 interaction modes
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid items-start gap-6 lg:grid-cols-2">
                {[false, true].map((noInteractive) => (
                  <section
                    key={String(noInteractive)}
                    data-reference-mode={
                      noInteractive ? "noninteractive" : "interactive"
                    }
                    className={cn(
                      "w-full min-w-0",
                      width === "narrow" && "max-w-80",
                      width === "standard" && "max-w-md"
                    )}
                  >
                    <h2 className="mb-3 font-semibold">
                      {noInteractive ? "Noninteractive" : "Interactive"}
                    </h2>
                    <div className="rounded-md border border-dashed p-3 break-words">
                      {mode === "prefixed" ? (
                        <PrefixedFormattedText
                          prefix={<strong>References.</strong>}
                          content={content}
                          conditions={LAB_CONDITIONS}
                          noInteractive={noInteractive}
                        />
                      ) : (
                        <FormattedText
                          content={content}
                          conditions={LAB_CONDITIONS}
                          noInteractive={noInteractive}
                          blockStyles={mode !== "compact"}
                        />
                      )}
                    </div>
                  </section>
                ))}
              </div>
              {showSource && (
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
                  {content}
                </pre>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
