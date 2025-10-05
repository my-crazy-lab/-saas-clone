import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';

// Mock Redis to avoid connection issues in tests
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    on: jest.fn(),
  },
}));

const prisma = new PrismaClient();

beforeAll(async () => {
  // Set up test database with unique name
  const testDbName = `test_${Date.now()}.db`;
  process.env.DATABASE_URL = `file:./${testDbName}`;
  process.env.NODE_ENV = 'test';

  // Run migrations
  execSync('npx prisma db push --force-reset', {
    cwd: join(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
});

beforeEach(async () => {
  // Clean up database before each test
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.metricsCache.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();

  // Clean up test database files
  try {
    const fs = require('fs');
    const path = require('path');
    const files = fs.readdirSync('./');
    files.forEach((file: string) => {
      if (file.startsWith('test_') && file.endsWith('.db')) {
        fs.unlinkSync(path.join('./', file));
      }
    });
  } catch (error) {
    // Ignore cleanup errors
  }
});

export { prisma };
