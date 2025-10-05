import { apiClient } from '@/utils/api'
import { Survey, CreateSurveyForm, PaginatedResponse } from '@/types'

export interface GetSurveysParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class SurveyService {
  async createSurvey(data: CreateSurveyForm): Promise<Survey> {
    const response = await apiClient.post<Survey>('/surveys', data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to create survey')
  }

  async getSurveys(params: GetSurveysParams = {}): Promise<PaginatedResponse<Survey>> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = `/surveys${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiClient.get<Survey[]>(url)
    
    if (response.success) {
      return response as PaginatedResponse<Survey>
    }
    
    throw new Error(response.error || 'Failed to get surveys')
  }

  async getSurvey(id: string): Promise<Survey> {
    const response = await apiClient.get<Survey>(`/surveys/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get survey')
  }

  async updateSurvey(id: string, data: Partial<CreateSurveyForm>): Promise<Survey> {
    const response = await apiClient.put<Survey>(`/surveys/${id}`, data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update survey')
  }

  async deleteSurvey(id: string): Promise<void> {
    const response = await apiClient.delete(`/surveys/${id}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete survey')
    }
  }

  async duplicateSurvey(id: string): Promise<Survey> {
    const response = await apiClient.post<Survey>(`/surveys/${id}/duplicate`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to duplicate survey')
  }

  async getPublicSurvey(id: string): Promise<Survey> {
    const response = await apiClient.get<Survey>(`/public/survey/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get public survey')
  }

  async generateQRCode(id: string, size: number = 200): Promise<{ qrCode: string; url: string }> {
    const response = await apiClient.get<{ qrCode: string; url: string }>(`/public/survey/${id}/qr?size=${size}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate QR code')
  }

  async generateEmbedCode(id: string, width: string = '100%', height: string = '600px'): Promise<{
    embedCode: string
    scriptCode: string
    url: string
    preview: string
  }> {
    const response = await apiClient.get<{
      embedCode: string
      scriptCode: string
      url: string
      preview: string
    }>(`/public/survey/${id}/embed?width=${width}&height=${height}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate embed code')
  }

  async getSurveyStats(id: string): Promise<{
    totalResponses: number
    completedResponses: number
    completionRate: number
  }> {
    const response = await apiClient.get<{
      totalResponses: number
      completedResponses: number
      completionRate: number
    }>(`/public/survey/${id}/stats`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get survey stats')
  }
}

export const surveyService = new SurveyService()
export default surveyService
