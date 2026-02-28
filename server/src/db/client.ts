import { PrismaClient } from '@prisma/client';

// Prisma 7 сама подхватит DATABASE_URL из окружения, 
// если мы передадим его в конструктор вот так:
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});