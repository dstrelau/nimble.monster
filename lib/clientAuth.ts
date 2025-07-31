"use client";

import { createContext, useContext } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { User } from "@/lib/types";

export const AuthContext = createContext<UseQueryResult<User, Error>>(
  undefined!,
);

export function useAuth() {
  return useContext(AuthContext);
}
