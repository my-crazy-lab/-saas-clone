import { apiClient } from '@/utils/api'
import { SurveyAnalytics, Answer, Question } from '@/types'

class AnalyticsService {
  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const response = await apiClient.get<SurveyAnalytics>(`/analytics/${surveyId}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get survey analytics')
  }

  async getQuestionAnalytics(surveyId: string, questionId: string): Promise<{
    question: Question
    answers: Answer[]
    totalAnswers: number
  }> {
    const response = await apiClient.get<{
      question: Question
      answers: Answer[]
      totalAnswers: number
    }>(`/analytics/${surveyId}/questions/${questionId}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get question analytics')
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
