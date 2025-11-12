import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-redundant-type-constituents
  var prisma: PrismaClient | undefined;
}

// Prisma Client singleton pattern for development hot-reload
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const prisma: PrismaClient =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  global.prisma ||
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  global.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await prisma.$disconnect();
}
