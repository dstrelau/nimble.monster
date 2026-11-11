import { z } from "zod";

export const sourceInputSchema = z.object({
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  license: z.string().min(1),
  link: z.url(),
});

export const sourceIdSchema = z.string().min(1);
