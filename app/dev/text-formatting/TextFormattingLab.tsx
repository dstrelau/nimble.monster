"use client";

import { useState } from "react";
import { ModeToggle } from "@/components/layout/ModeToggle";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/shared/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { CompactComponentDemos } from "./CompactComponentDemos";
import {
  type CatalogField,
  FORMATTED_TEXT_ENTITY_CATALOG,
  type RenderMode,
} from "./catalog";
import {
  FORMATTING_FIXTURES,
  type FormattingFixture,
  LAB_CONDITIONS,
} from "./fixtures";

const WIDTH_CLASSES = {
  narrow: "w-full sm:w-80",
  standard: "w-full sm:w-md",
  wide: "w-full sm:w-2xl",
} as const;

type PreviewWidth = keyof typeof WIDTH_CLASSES;

const PARAGRAPH_SAMPLE =
  "The first paragraph establishes the effect.\n\nThe second paragraph explains what happens next.";

function isPreviewWidth(value: string): value is PreviewWidth {
  return value in WIDTH_CLASSES;
}

function LabSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const id = title.toLowerCase().replaceAll(" ", "-");
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2 id={id} className="font-slab text-2xl font-bold">
          {title}
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FormattingFixtureCard({
  fixture,
  width,
  compactParagraphs,
  headings,
  showSource,
}: {
  fixture: FormattingFixture;
  width: PreviewWidth;
  compactParagraphs: boolean;
  headings: boolean;
  showSource: boolean;
}) {
  return (
    <Card className={WIDTH_CLASSES[width]} data-formatting-fixture={fixture.id}>
      <CardHeader>
        <CardTitle>{fixture.name}</CardTitle>
        <CardDescription>{fixture.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-dashed p-3">
          <FormattedText
            content={fixture.content}
            conditions={LAB_CONDITIONS}
            blockStyles={!compactParagraphs}
            enableHeadings={Boolean(fixture.headings && headings)}
          />
        </div>
        {showSource && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
            {fixture.content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function statusForMode(mode: RenderMode) {
  if (mode === "compact") {
    return {
      label: "Compact by design",
      detail: "Parsed paragraphs intentionally stay inline in this context.",
      variant: "outline" as const,
    };
  }
  if (mode === "prefixed") {
    return {
      label: "Prefixed paragraphs",
      detail: "The label stays with paragraph one; later paragraphs follow.",
      variant: "secondary" as const,
    };
  }
  return {
    label: "Block paragraphs",
    detail: "Blank-line-separated content displays as visible paragraphs.",
    variant: "secondary" as const,
  };
}

function EntityContextPreview({
  entity,
  field,
  width,
}: {
  entity: string;
  field: CatalogField;
  width: PreviewWidth;
}) {
  const status = statusForMode(field.mode);
  return (
    <Card
      className={WIDTH_CLASSES[width]}
      data-entity-context={`${entity}:${field.name}`}
      data-render-mode={field.mode}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{field.name}</CardTitle>
            <CardDescription>{entity}</CardDescription>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">{status.detail}</p>
        <div className="rounded-md border border-dashed p-3">
          {field.mode === "prefixed" ? (
            <PrefixedFormattedText
              prefix={<strong>Example:</strong>}
              content={PARAGRAPH_SAMPLE}
              conditions={[]}
              noInteractive
            />
          ) : (
            <FormattedText
              content={PARAGRAPH_SAMPLE}
              conditions={[]}
              blockStyles={field.mode !== "compact"}
              className={cn(
                field.mode === "compact" && "inline [&_div]:inline [&_p]:inline"
              )}
              noInteractive
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TextFormattingLab() {
  const [width, setWidth] = useState<PreviewWidth>("standard");
  const [compactParagraphs, setCompactParagraphs] = useState(false);
  const [headings, setHeadings] = useState(true);
  const [showSource, setShowSource] = useState(false);

  const fields = FORMATTED_TEXT_ENTITY_CATALOG.flatMap((entry) =>
    entry.fields.map((field) => ({ entity: entry.entity, field }))
  );
  const compactCount = fields.filter(
    ({ field }) => field.mode === "compact"
  ).length;

  return (
    <div className="space-y-10 pb-12" data-testid="text-formatting-lab">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Development lab
        </p>
        <h1 className="font-slab text-4xl font-bold">Text formatting</h1>
        <p className="max-w-3xl text-muted-foreground">
          Database-free fixtures for reviewing parser behavior, responsive text
          layout, and every production entity context that uses FormattedText.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {FORMATTING_FIXTURES.length} syntax fixtures
          </Badge>
          <Badge variant="outline">
            {FORMATTED_TEXT_ENTITY_CATALOG.length} entity types
          </Badge>
          <Badge variant="secondary">
            {fields.length - compactCount} paragraph contexts
          </Badge>
          <Badge variant="outline">{compactCount} compact contexts</Badge>
        </div>
      </header>

      <Card
        aria-label="Text formatting lab controls"
        className="sticky top-2 z-20 bg-card/95 shadow-md backdrop-blur"
      >
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Theme</span>
            <ModeToggle />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Preview width</span>
            <ToggleGroup
              type="single"
              value={width}
              onValueChange={(value) => {
                if (isPreviewWidth(value)) setWidth(value);
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="narrow">Narrow</ToggleGroupItem>
              <ToggleGroupItem value="standard">Standard</ToggleGroupItem>
              <ToggleGroupItem value="wide">Wide</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Label>
            <Checkbox
              checked={compactParagraphs}
              onCheckedChange={(checked) =>
                setCompactParagraphs(checked === true)
              }
            />
            Compact syntax paragraphs
          </Label>
          <Label>
            <Checkbox
              checked={headings}
              onCheckedChange={(checked) => setHeadings(checked === true)}
            />
            Enable heading fixture
          </Label>
          <Label>
            <Checkbox
              checked={showSource}
              onCheckedChange={(checked) => setShowSource(checked === true)}
            />
            Show fixture source
          </Label>
        </CardContent>
      </Card>

      <LabSection
        title="Syntax fixtures"
        description="Curated parser and wrapping cases rendered through the real FormattedText component. Controls apply to every fixture at once."
      >
        <div className="flex flex-wrap items-start gap-4">
          {FORMATTING_FIXTURES.map((fixture) => (
            <FormattingFixtureCard
              key={fixture.id}
              fixture={fixture}
              width={width}
              compactParagraphs={compactParagraphs}
              headings={headings}
              showSource={showSource}
            />
          ))}
        </div>
      </LabSection>

      <CompactComponentDemos />

      <LabSection
        title="Entity embedding contexts"
        description="Every entity field that renders FormattedText, labeled with its intentional block, prefixed, or compact paragraph behavior."
      >
        <div className="flex flex-wrap items-start gap-4">
          {fields.map(({ entity, field }) => (
            <EntityContextPreview
              key={`${entity}:${field.name}`}
              entity={entity}
              field={field}
              width={width}
            />
          ))}
        </div>
      </LabSection>
    </div>
  );
}
