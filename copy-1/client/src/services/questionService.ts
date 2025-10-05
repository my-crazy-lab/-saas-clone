import { apiClient } from '@/utils/api'
import { Question, CreateQuestionForm } from '@/types'

class QuestionService {
  async createQuestion(surveyId: string, data: CreateQuestionForm): Promise<Question> {
    const response = await apiClient.post<Question>(`/surveys/${surveyId}/questions`, data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to create question')
  }

  async getQuestions(surveyId: string): Promise<Question[]> {
    const response = await apiClient.get<Question[]>(`/surveys/${surveyId}/questions`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get questions')
  }

  async getQuestion(surveyId: string, questionId: string): Promise<Question> {
    const response = await apiClient.get<Question>(`/surveys/${surveyId}/questions/${questionId}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get question')
  }

  async updateQuestion(surveyId: string, questionId: string, data: Partial<CreateQuestionForm>): Promise<Question> {
    const response = await apiClient.put<Question>(`/surveys/${surveyId}/questions/${questionId}`, data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update question')
  }

  async deleteQuestion(surveyId: string, questionId: string): Promise<void> {
    const response = await apiClient.delete(`/surveys/${surveyId}/questions/${questionId}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete question')
    }
  }

  async reorderQuestions(surveyId: string, questionIds: string[]): Promise<Question[]> {
    const response = await apiClient.post<Question[]>(`/surveys/${surveyId}/questions/reorder`, {
      questionIds,
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to reorder questions')
  }
}

export const questionService = new QuestionService()
export default questionService
