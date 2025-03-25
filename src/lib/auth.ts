import type { UseQueryResult } from "@tanstack/react-query";
import { createContext } from "react";
import type { User } from "./types";

export const AuthContext = createContext<UseQueryResult<User, Error>>(
  undefined!,
);
