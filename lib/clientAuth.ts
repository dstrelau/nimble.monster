"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import type { User } from "@/lib/types";

export const AuthContext = createContext<UseQueryResult<User, Error> | null>(
  null
);

export function useAuth() {
  return useContext(AuthContext);
}
