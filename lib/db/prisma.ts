import { PrismaClient } from "@/lib/prisma";
import { createRetryWrapper } from "./retry";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();
export const prisma = createRetryWrapper(basePrisma);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
