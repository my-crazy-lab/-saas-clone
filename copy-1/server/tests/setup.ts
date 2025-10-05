import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Setup test database
  await prisma.$connect()
})

afterAll(async () => {
  // Cleanup test database
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up data before each test
  await prisma.answer.deleteMany()
  await prisma.response.deleteMany()
  await prisma.question.deleteMany()
  await prisma.survey.deleteMany()
  await prisma.user.deleteMany()
})

export { prisma }
