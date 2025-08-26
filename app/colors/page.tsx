import { ModeToggle } from "@/components/app/ModeToggle";

const colorVariables = [
  // Theme colors
  { name: "success", variable: "--color-success" },
  { name: "success-foreground", variable: "--color-success-foreground" },
  { name: "warning", variable: "--color-warning" },
  { name: "warning-foreground", variable: "--color-warning-foreground" },
  { name: "error", variable: "--color-error" },
  { name: "error-foreground", variable: "--color-error-foreground" },
  { name: "icon", variable: "--color-icon" },
  { name: "hp", variable: "--color-hp" },
  { name: "header", variable: "--color-header" },
  { name: "header-foreground", variable: "--color-header-foreground" },
  { name: "flame", variable: "--color-flame" },
  { name: "flame-fill", variable: "--color-flame-fill" },
  
  // Root colors
  { name: "background", variable: "--background" },
  { name: "foreground", variable: "--foreground" },
  { name: "border", variable: "--border" },
  { name: "card", variable: "--card" },
  { name: "card-foreground", variable: "--card-foreground" },
  { name: "popover", variable: "--popover" },
  { name: "popover-foreground", variable: "--popover-foreground" },
  { name: "primary", variable: "--primary" },
  { name: "primary-foreground", variable: "--primary-foreground" },
  { name: "accent", variable: "--accent" },
  { name: "accent-foreground", variable: "--accent-foreground" },
  { name: "muted", variable: "--muted" },
  { name: "muted-foreground", variable: "--muted-foreground" },
  { name: "input", variable: "--input" },
  { name: "ring", variable: "--ring" },
];

export default function ColorsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Color Palette</h1>
        <ModeToggle />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorVariables.map(({ name, variable }) => (
          <div key={name} className="border rounded-lg p-4 bg-card">
            <div 
              className="w-full h-16 rounded-md mb-3 border"
              style={{ backgroundColor: `var(${variable})` }}
            />
            <h3 className="font-medium text-card-foreground">{name}</h3>
            <code className="text-sm text-muted-foreground">{variable}</code>
          </div>
        ))}
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Color Usage Examples</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-card border rounded-lg">
              <h3 className="text-card-foreground font-medium mb-2">Card Example</h3>
              <p className="text-muted-foreground">This card uses card and card-foreground colors.</p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="text-foreground font-medium mb-2">Muted Background</h3>
              <p className="text-muted-foreground">This uses muted background with muted-foreground text.</p>
            </div>
            
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="text-accent-foreground font-medium mb-2">Accent Background</h3>
              <p className="text-accent-foreground">This uses accent background with accent-foreground text.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-primary rounded-lg">
              <h3 className="text-primary-foreground font-medium mb-2">Primary Background</h3>
              <p className="text-primary-foreground">This uses primary background with primary-foreground text.</p>
            </div>
            
            <div className="p-4 border-2 border-success bg-success/10 rounded-lg">
              <h3 className="text-success-foreground font-medium mb-2">Success State</h3>
              <p className="text-foreground">Success colors for positive feedback.</p>
            </div>
            
            <div className="p-4 border-2 border-warning bg-warning/10 rounded-lg">
              <h3 className="text-warning-foreground font-medium mb-2">Warning State</h3>
              <p className="text-foreground">Warning colors for cautionary messages.</p>
            </div>
            
            <div className="p-4 border-2 border-error bg-error/10 rounded-lg">
              <h3 className="text-error-foreground font-medium mb-2">Error State</h3>
              <p className="text-foreground">Error colors for error messages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}