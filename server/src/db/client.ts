import { PrismaClient } from '@prisma/client';

// Prisma сама найдет process.env.DATABASE_URL
export const prisma = new PrismaClient();