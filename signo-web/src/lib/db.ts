import { PrismaClient } from '@/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { env } from '@/lib/env'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma() {
  const adapter = new PrismaBetterSqlite3({ url: env().DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
