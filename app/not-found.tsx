import { Telescope } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <Telescope className="size-32 text-muted-foreground" />
      <div className="flex items-center gap-4">
        <h1 className="text-6xl font-bold">404</h1>
        <div className="w-px h-16 bg-border" />
        <p className="text-xl text-muted-foreground">
          This page could not be found.
        </p>
      </div>
    </div>
  );
}
