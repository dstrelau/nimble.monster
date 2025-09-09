import { ModeToggle } from "@/components/app/ModeToggle";
import { Button } from "@/components/ui/button";

const componentColors = [
  {
    backgroundVar: "--background",
    foregroundVar: "--foreground",
  },
  {
    backgroundVar: "--card",
    foregroundVar: "--card-foreground",
  },
  {
    backgroundVar: "--popover",
    foregroundVar: "--popover-foreground",
  },
  {
    backgroundVar: "--primary",
    foregroundVar: "--primary-foreground",
  },
  {
    backgroundVar: "--secondary",
    foregroundVar: "--secondary-foreground",
  },
  {
    backgroundVar: "--accent",
    foregroundVar: "--accent-foreground",
  },
  {
    backgroundVar: "--muted",
    foregroundVar: "--muted-foreground",
  },
  {
    backgroundVar: "--destructive",
    foregroundVar: "--destructive-foreground",
  },
];

const colorPairs = [
  {
    backgroundVar: "--color-success",
    foregroundVar: "--color-success-foreground",
  },
  {
    backgroundVar: "--color-warning",
    foregroundVar: "--color-warning-foreground",
  },
  {
    backgroundVar: "--color-error",
    foregroundVar: "--color-error-foreground",
  },
  {
    backgroundVar: "--color-header",
    foregroundVar: "--color-header-foreground",
  },
];

const singleColors = [
  { name: "icon", variable: "--color-icon" },
  { name: "hp", variable: "--color-hp" },
  { name: "flame", variable: "--color-flame" },
  { name: "flame-fill", variable: "--color-flame-fill" },
  { name: "border", variable: "--border" },
  { name: "input", variable: "--input" },
  { name: "ring", variable: "--ring" },
];

const buttonVariants = [
  { variant: "default" as const, label: "Default" },
  { variant: "destructive" as const, label: "Destructive" },
  { variant: "outline" as const, label: "Outline" },
  { variant: "secondary" as const, label: "Secondary" },
  { variant: "ghost" as const, label: "Ghost" },
  { variant: "link" as const, label: "Link" },
];

const buttonSizes = [
  { size: "sm" as const, label: "Small" },
  { size: "default" as const, label: "Default" },
  { size: "lg" as const, label: "Large" },
  { size: "icon" as const, label: "🎲" },
];

export default function ColorsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Component Colors</h1>
        <ModeToggle />
      </div>

      {[
        { title: "Component Colors", data: componentColors },
        { title: "Color Pairs", data: colorPairs },
      ].map(({ title, data }) => (
        <div key={title} className="space-y-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(({ backgroundVar, foregroundVar }) => (
              <div
                key={backgroundVar + foregroundVar}
                className="border rounded-lg p-4 bg-card"
              >
                <div
                  className="w-full h-16 rounded-md mb-3 border flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `var(${backgroundVar}, linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3))`,
                    color: `var(${foregroundVar}, linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3))`,
                  }}
                >
                  <span className="font-medium relative z-10">Sample Text</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <code>{backgroundVar}</code>
                  <br />
                  <code>{foregroundVar}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <h1 className="text-3xl font-bold">Other Colors</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {singleColors.map(({ name, variable }) => (
          <div key={name} className="border rounded-lg p-4 bg-card">
            <div
              className="w-full h-16 rounded-md mb-3 border relative overflow-hidden"
              style={{
                background: `var(${variable}, linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3))`,
              }}
            />
            <h3 className="font-medium text-card-foreground">{name}</h3>
            <code className="text-sm text-muted-foreground">{variable}</code>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Button Variants</h2>
        <div className="flex">
          {buttonVariants.map(({ variant, label }) => (
            <div key={variant} className="p-4">
              <Button key={variant} variant={variant}>
                {label} Button
              </Button>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold mt-8 mb-4">Button Sizes</h3>
        <div className="flex flex-wrap gap-4 items-center p-4 bg-card border rounded-lg">
          {buttonSizes.map(({ size, label }) => (
            <Button key={size} size={size}>
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
