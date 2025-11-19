"use client";

import OBR from "@owlbear-rodeo/sdk";
import type React from "react";
import { useEffect, useState } from "react";

export function PluginGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (OBR.isAvailable) {
      if (OBR.isReady) {
        setReady(true);
      } else {
        OBR.onReady(() => {
          setReady(true);
        });
      }
    }
  }, []);

  if (ready) {
    return <>{children}</>;
  } else {
    return null;
  }
}
