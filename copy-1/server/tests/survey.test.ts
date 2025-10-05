import request from 'supertest'
import app from '../src/index'
import './setup'

describe('Survey Management', () => {
  let token: string
  let userId: string

  beforeEach(async () => {
    // Create a test user and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
    
    token = response.body.data.token
    userId = response.body.data.user.id
  })

  describe('POST /api/surveys', () => {
    it('should create a new survey', async () => {
      const surveyData = {
        title: 'Customer Satisfaction Survey',
        description: 'Help us improve our services',
        isPublic: true,
        theme: {
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'Inter'
        },
        settings: {
          allowAnonymous: true,
          showProgressBar: true,
          randomizeQuestions: false
        }
      }

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send(surveyData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(surveyData.title)
      expect(response.body.data.userId).toBe(userId)
    })

    it('should not create survey without authentication', async () => {
      const surveyData = {
        title: 'Test Survey',
        description: 'Test Description',
        isPublic: true
      }

      const response = await request(app)
        .post('/api/surveys')
        .send(surveyData)
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/surveys', () => {
    beforeEach(async () => {
      // Create test surveys
      await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Survey 1',
          description: 'Description 1',
          isPublic: true
        })

      await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Survey 2',
          description: 'Description 2',
          isPublic: false
        })
    })

    it('should get user surveys with pagination', async () => {
      const response = await request(app)
        .get('/api/surveys?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.surveys).toHaveLength(2)
      expect(response.body.data.pagination.total).toBe(2)
    })

    it('should filter surveys by search term', async () => {
      const response = await request(app)
        .get('/api/surveys?search=Survey 1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.surveys).toHaveLength(1)
      expect(response.body.data.surveys[0].title).toBe('Survey 1')
    })
  })

  describe('PUT /api/surveys/:id', () => {
    let surveyId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Original Title',
          description: 'Original Description',
          isPublic: true
        })
      
      surveyId = response.body.data.id
    })

    it('should update survey', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        isPublic: false
      }

      const response = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.isPublic).toBe(false)
    })

    it('should not update survey of another user', async () => {
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
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' })
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/surveys/:id', () => {
    let surveyId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Survey to Delete',
          description: 'This will be deleted',
          isPublic: true
        })
      
      surveyId = response.body.data.id
    })

    it('should delete survey', async () => {
      const response = await request(app)
        .delete(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted')

      // Verify survey is deleted
      await request(app)
        .get(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })
  })

  describe('POST /api/surveys/:id/duplicate', () => {
    let surveyId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Original Survey',
          description: 'Original Description',
          isPublic: true
        })
      
      surveyId = response.body.data.id

      // Add a question to the survey
      await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          questionText: 'How satisfied are you?',
          type: 'LIKERT_SCALE',
          isRequired: true,
          order: 1,
          options: {
            scale: 5,
            labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
          }
        })
    })

    it('should duplicate survey with questions', async () => {
      const response = await request(app)
        .post(`/api/surveys/${surveyId}/duplicate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('Original Survey (Copy)')
      expect(response.body.data.id).not.toBe(surveyId)

      // Verify questions were duplicated
      const questionsResponse = await request(app)
        .get(`/api/surveys/${response.body.data.id}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(questionsResponse.body.data).toHaveLength(1)
      expect(questionsResponse.body.data[0].questionText).toBe('How satisfied are you?')
    })
  })
})
