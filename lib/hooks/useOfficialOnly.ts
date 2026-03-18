"use client";

import { createContext, useContext } from "react";

export const OfficialOnlyContext = createContext(false);

export function useOfficialOnly() {
  return useContext(OfficialOnlyContext);
}
