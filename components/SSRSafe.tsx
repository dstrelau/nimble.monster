"use client";
import { useEffect, useState } from "react";

interface SSRSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SSRSafe wrapper for components that have hydration issues with SSR.
 * 
 * Use this to wrap any interactive component (like tooltips, popovers, etc.)
 * that uses browser APIs or complex state that differs between server and client.
 * 
 * @param children - The component to render after hydration
 * @param fallback - Optional fallback to render during SSR (defaults to children without interactivity)
 */
export function SSRSafe({ children, fallback }: SSRSafeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to detect if we're running on the client after hydration.
 * Useful for conditional rendering of client-only features.
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}