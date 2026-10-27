"use server";

import { listAllSources } from "./repository";

export const getAllSources = async () => {
  return listAllSources();
};
