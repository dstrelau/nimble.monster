import { PrismaClient } from "@/lib/prisma";
import { createRetryWrapper } from "./retry";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();
export const prisma = createRetryWrapper(basePrisma);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export * from "./collection";
export * from "./companion";
export * from "./condition";
export * from "./family";
export * from "./item";
export * from "./monster";
export * from "./subclass";
export * from "./user";
