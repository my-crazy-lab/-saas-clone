import { apiClient } from '@/utils/api'
import { Response, SubmitResponseForm, PaginatedResponse } from '@/types'

export interface GetResponsesParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class ResponseService {
  async submitResponse(surveyId: string, data: SubmitResponseForm): Promise<Response> {
    const response = await apiClient.post<Response>(`/surveys/${surveyId}/submit`, data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to submit response')
  }

  async getResponses(surveyId: string, params: GetResponsesParams = {}): Promise<PaginatedResponse<Response>> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = `/surveys/${surveyId}/responses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiClient.get<Response[]>(url)
    
    if (response.success) {
      return response as PaginatedResponse<Response>
    }
    
    throw new Error(response.error || 'Failed to get responses')
  }

  async getResponse(surveyId: string, responseId: string): Promise<Response> {
    const response = await apiClient.get<Response>(`/surveys/${surveyId}/responses/${responseId}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get response')
  }

  async deleteResponse(surveyId: string, responseId: string): Promise<void> {
    const response = await apiClient.delete(`/surveys/${surveyId}/responses/${responseId}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete response')
    }
  }

  async exportResponses(surveyId: string): Promise<void> {
    try {
      await apiClient.downloadFile(`/surveys/${surveyId}/responses/export`, `survey-${surveyId}-responses.csv`)
    } catch (error) {
      throw new Error('Failed to export responses')
    }
  }
}

export const responseService = new ResponseService()
export default responseService
