import { PrismaClient, UserRole, QuestionType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@surveybuilder.com' },
    update: {},
    create: {
      email: 'admin@surveybuilder.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@surveybuilder.com' },
    update: {},
    create: {
      email: 'demo@surveybuilder.com',
      name: 'Demo User',
      password: demoPassword,
      role: UserRole.USER,
    },
  })

  // Create sample survey
  const survey = await prisma.survey.create({
    data: {
      title: 'Customer Satisfaction Survey',
      description: 'Help us improve our services by sharing your feedback',
      userId: demoUser.id,
      theme: {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'Inter',
      },
      settings: {
        allowAnonymous: true,
        showProgressBar: true,
        randomizeQuestions: false,
      },
    },
  })

  // Create sample questions
  const questions = [
    {
      questionText: 'How satisfied are you with our service?',
      type: QuestionType.LIKERT_SCALE,
      options: {
        scale: 5,
        labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
      },
      isRequired: true,
      order: 1,
    },
    {
      questionText: 'Which features do you use most often?',
      type: QuestionType.MULTIPLE_CHOICE_MULTIPLE,
      options: {
        choices: [
          'Survey Builder',
          'Analytics Dashboard',
          'Data Export',
          'Email Distribution',
          'QR Code Generation',
        ],
      },
      isRequired: false,
      order: 2,
    },
    {
      questionText: 'What is your overall rating?',
      type: QuestionType.RATING,
      options: {
        maxRating: 5,
        icon: 'star',
      },
      isRequired: true,
      order: 3,
    },
    {
      questionText: 'Any additional comments or suggestions?',
      type: QuestionType.LONG_TEXT,
      options: {
        placeholder: 'Please share your thoughts...',
        maxLength: 1000,
      },
      isRequired: false,
      order: 4,
    },
  ]

  for (const questionData of questions) {
    await prisma.question.create({
      data: {
        ...questionData,
        surveyId: survey.id,
      },
    })
  }

  // Create sample responses
  const response1 = await prisma.response.create({
    data: {
      surveyId: survey.id,
      isComplete: true,
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '192.168.1.1',
        device: 'desktop',
      },
    },
  })

  const response2 = await prisma.response.create({
    data: {
      surveyId: survey.id,
      userId: demoUser.id,
      isComplete: true,
      metadata: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        ipAddress: '192.168.1.2',
        device: 'mobile',
      },
    },
  })

  // Get questions for answers
  const surveyQuestions = await prisma.question.findMany({
    where: { surveyId: survey.id },
    orderBy: { order: 'asc' },
  })

  // Create sample answers for response 1
  await prisma.answer.createMany({
    data: [
      {
        responseId: response1.id,
        questionId: surveyQuestions[0]!.id,
        answerJson: { value: 4 },
        score: 4,
      },
      {
        responseId: response1.id,
        questionId: surveyQuestions[1]!.id,
        answerJson: { values: ['Survey Builder', 'Analytics Dashboard'] },
      },
      {
        responseId: response1.id,
        questionId: surveyQuestions[2]!.id,
        answerJson: { value: 5 },
        score: 5,
      },
      {
        responseId: response1.id,
        questionId: surveyQuestions[3]!.id,
        answerText: 'Great tool! Very easy to use and the analytics are helpful.',
      },
    ],
  })

  // Create sample answers for response 2
  await prisma.answer.createMany({
    data: [
      {
        responseId: response2.id,
        questionId: surveyQuestions[0]!.id,
        answerJson: { value: 5 },
        score: 5,
      },
      {
        responseId: response2.id,
        questionId: surveyQuestions[1]!.id,
        answerJson: { values: ['Survey Builder', 'Data Export', 'QR Code Generation'] },
      },
      {
        responseId: response2.id,
        questionId: surveyQuestions[2]!.id,
        answerJson: { value: 4 },
        score: 4,
      },
      {
        responseId: response2.id,
        questionId: surveyQuestions[3]!.id,
        answerText: 'Would love to see more question types and better mobile experience.',
      },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Admin user: admin@surveybuilder.com (password: admin123)`)
  console.log(`👤 Demo user: demo@surveybuilder.com (password: demo123)`)
  console.log(`📊 Sample survey created with ${questions.length} questions`)
  console.log(`📝 ${2} sample responses created`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
