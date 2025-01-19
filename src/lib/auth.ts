import { UseQueryResult } from "@tanstack/react-query";
import { createContext } from "react";
import { User } from "./types";

export const AuthContext = createContext<UseQueryResult<User, Error>>(
  undefined!,
);
