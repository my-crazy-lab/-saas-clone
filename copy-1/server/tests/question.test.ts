import request from 'supertest'
import app from '../src/index'
import './setup'

describe('Question Management', () => {
  let token: string
  let surveyId: string

  beforeEach(async () => {
    // Create a test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
    
    token = userResponse.body.data.token

    // Create a test survey
    const surveyResponse = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Survey',
        description: 'Test Description',
        isPublic: true
      })

    surveyId = surveyResponse.body.data.id
  })

  describe('POST /api/surveys/:surveyId/questions', () => {
    it('should create a multiple choice question', async () => {
      const questionData = {
        questionText: 'What is your favorite color?',
        type: 'MULTIPLE_CHOICE_SINGLE',
        isRequired: true,
        order: 1,
        options: {
          choices: ['Red', 'Blue', 'Green', 'Yellow']
        }
      }

      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send(questionData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.questionText).toBe(questionData.questionText)
      expect(response.body.data.type).toBe(questionData.type)
      expect(response.body.data.surveyId).toBe(surveyId)
    })

    it('should create a Likert scale question', async () => {
      const questionData = {
        questionText: 'How satisfied are you with our service?',
        type: 'LIKERT_SCALE',
        isRequired: true,
        order: 1,
        options: {
          scale: 5,
          labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
        }
      }

      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send(questionData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('LIKERT_SCALE')
      expect(response.body.data.options.scale).toBe(5)
    })

    it('should create a text question', async () => {
      const questionData = {
        questionText: 'Please provide additional feedback',
        type: 'LONG_TEXT',
        isRequired: false,
        order: 2,
        options: {
          placeholder: 'Enter your feedback here...',
          maxLength: 1000
        }
      }

      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send(questionData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.type).toBe('LONG_TEXT')
      expect(response.body.data.isRequired).toBe(false)
    })

    it('should not create question for non-existent survey', async () => {
      const questionData = {
        questionText: 'Test Question',
        type: 'SHORT_TEXT',
        isRequired: true,
        order: 1
      }

      const response = await request(app)
        .post('/api/surveys/non-existent-id/questions')
        .set('Authorization', `Bearer ${token}`)
        .send(questionData)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/surveys/:surveyId/questions', () => {
    beforeEach(async () => {
      // Create test questions
      await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question 1',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 1
        })

      await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question 2',
          type: 'MULTIPLE_CHOICE_SINGLE',
          isRequired: false,
          order: 2,
          options: {
            choices: ['Option 1', 'Option 2']
          }
        })
    })

    it('should get all questions for a survey', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].order).toBe(1)
      expect(response.body.data[1].order).toBe(2)
    })

    it('should return questions in order', async () => {
      const response = await request(app)
        .get(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const questions = response.body.data
      expect(questions[0].questionText).toBe('Question 1')
      expect(questions[1].questionText).toBe('Question 2')
    })
  })

  describe('PUT /api/surveys/:surveyId/questions/:id', () => {
    let questionId: string

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Original Question',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 1
        })

      questionId = response.body.data.id
    })

    it('should update question', async () => {
      const updateData = {
        questionText: 'Updated Question',
        isRequired: false,
        options: {
          placeholder: 'Updated placeholder'
        }
      }

      const response = await request(app)
        .put(`/api/surveys/${surveyId}/questions/${questionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.questionText).toBe(updateData.questionText)
      expect(response.body.data.isRequired).toBe(false)
    })

    it('should not update question of another user survey', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
        })

      const otherToken = otherUserResponse.body.data.token

      const response = await request(app)
        .put(`/api/surveys/${surveyId}/questions/${questionId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ questionText: 'Hacked Question' })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/surveys/:surveyId/questions/:id', () => {
    let questionId: string

    beforeEach(async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question to Delete',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 1
        })

      questionId = response.body.data.id
    })

    it('should delete question', async () => {
      const response = await request(app)
        .delete(`/api/surveys/${surveyId}/questions/${questionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted')

      // Verify question is deleted
      const questionsResponse = await request(app)
        .get(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(questionsResponse.body.data).toHaveLength(0)
    })
  })

  describe('POST /api/surveys/:surveyId/questions/reorder', () => {
    let question1Id: string
    let question2Id: string
    let question3Id: string

    beforeEach(async () => {
      // Create three questions
      const q1Response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question 1',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 1
        })

      const q2Response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question 2',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 2
        })

      const q3Response = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'Question 3',
          type: 'SHORT_TEXT',
          isRequired: true,
          order: 3
        })

      question1Id = q1Response.body.data.id
      question2Id = q2Response.body.data.id
      question3Id = q3Response.body.data.id
    })

    it('should reorder questions', async () => {
      // Reorder: 3, 1, 2
      const reorderData = {
        questionIds: [question3Id, question1Id, question2Id]
      }

      const response = await request(app)
        .post(`/api/surveys/${surveyId}/questions/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send(reorderData)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify new order
      const questionsResponse = await request(app)
        .get(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const questions = questionsResponse.body.data
      expect(questions[0].questionText).toBe('Question 3')
      expect(questions[1].questionText).toBe('Question 1')
      expect(questions[2].questionText).toBe('Question 2')
    })
  })
})
