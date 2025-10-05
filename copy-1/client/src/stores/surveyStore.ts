import { create } from 'zustand'
import { Survey, Question, CreateSurveyForm, CreateQuestionForm, PaginationState } from '@/types'
import { surveyService } from '@/services/surveyService'
import { questionService } from '@/services/questionService'

interface SurveyState {
  surveys: Survey[]
  currentSurvey: Survey | null
  questions: Question[]
  isLoading: boolean
  error: string | null
  pagination: PaginationState
}

interface SurveyActions {
  // Survey actions
  createSurvey: (data: CreateSurveyForm) => Promise<Survey>
  getSurveys: (page?: number, limit?: number) => Promise<void>
  getSurvey: (id: string) => Promise<Survey>
  updateSurvey: (id: string, data: Partial<CreateSurveyForm>) => Promise<Survey>
  deleteSurvey: (id: string) => Promise<void>
  duplicateSurvey: (id: string) => Promise<Survey>
  
  // Question actions
  createQuestion: (surveyId: string, data: CreateQuestionForm) => Promise<Question>
  getQuestions: (surveyId: string) => Promise<void>
  updateQuestion: (surveyId: string, questionId: string, data: Partial<CreateQuestionForm>) => Promise<Question>
  deleteQuestion: (surveyId: string, questionId: string) => Promise<void>
  reorderQuestions: (surveyId: string, questionIds: string[]) => Promise<void>
  
  // UI actions
  setCurrentSurvey: (survey: Survey | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type SurveyStore = SurveyState & SurveyActions

export const useSurveyStore = create<SurveyStore>((set) => ({
  // Initial state
  surveys: [],
  currentSurvey: null,
  questions: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Survey actions
  createSurvey: async (data: CreateSurveyForm) => {
    try {
      set({ isLoading: true, error: null })
      const survey = await surveyService.createSurvey(data)
      set((state) => ({
        surveys: [survey, ...state.surveys],
        isLoading: false,
      }))
      return survey
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create survey',
        isLoading: false,
      })
      throw error
    }
  },

  getSurveys: async (page = 1, limit = 10) => {
    try {
      set({ isLoading: true, error: null })
      const response = await surveyService.getSurveys({ page, limit })
      set({
        surveys: response.data || [],
        pagination: response.pagination,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get surveys',
        isLoading: false,
      })
      throw error
    }
  },

  getSurvey: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const survey = await surveyService.getSurvey(id)
      set({
        currentSurvey: survey,
        questions: survey.questions || [],
        isLoading: false,
      })
      return survey
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get survey',
        isLoading: false,
      })
      throw error
    }
  },

  updateSurvey: async (id: string, data: Partial<CreateSurveyForm>) => {
    try {
      set({ isLoading: true, error: null })
      const survey = await surveyService.updateSurvey(id, data)
      set((state) => ({
        surveys: state.surveys.map((s) => (s.id === id ? survey : s)),
        currentSurvey: state.currentSurvey?.id === id ? survey : state.currentSurvey,
        isLoading: false,
      }))
      return survey
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update survey',
        isLoading: false,
      })
      throw error
    }
  },

  deleteSurvey: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      await surveyService.deleteSurvey(id)
      set((state) => ({
        surveys: state.surveys.filter((s) => s.id !== id),
        currentSurvey: state.currentSurvey?.id === id ? null : state.currentSurvey,
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete survey',
        isLoading: false,
      })
      throw error
    }
  },

  duplicateSurvey: async (id: string) => {
    try {
      set({ isLoading: true, error: null })
      const survey = await surveyService.duplicateSurvey(id)
      set((state) => ({
        surveys: [survey, ...state.surveys],
        isLoading: false,
      }))
      return survey
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to duplicate survey',
        isLoading: false,
      })
      throw error
    }
  },

  // Question actions
  createQuestion: async (surveyId: string, data: CreateQuestionForm) => {
    try {
      set({ isLoading: true, error: null })
      const question = await questionService.createQuestion(surveyId, data)
      set((state) => ({
        questions: [...state.questions, question].sort((a, b) => a.order - b.order),
        isLoading: false,
      }))
      return question
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create question',
        isLoading: false,
      })
      throw error
    }
  },

  getQuestions: async (surveyId: string) => {
    try {
      set({ isLoading: true, error: null })
      const questions = await questionService.getQuestions(surveyId)
      set({
        questions,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get questions',
        isLoading: false,
      })
      throw error
    }
  },

  updateQuestion: async (surveyId: string, questionId: string, data: Partial<CreateQuestionForm>) => {
    try {
      set({ isLoading: true, error: null })
      const question = await questionService.updateQuestion(surveyId, questionId, data)
      set((state) => ({
        questions: state.questions.map((q) => (q.id === questionId ? question : q)),
        isLoading: false,
      }))
      return question
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update question',
        isLoading: false,
      })
      throw error
    }
  },

  deleteQuestion: async (surveyId: string, questionId: string) => {
    try {
      set({ isLoading: true, error: null })
      await questionService.deleteQuestion(surveyId, questionId)
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== questionId),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete question',
        isLoading: false,
      })
      throw error
    }
  },

  reorderQuestions: async (surveyId: string, questionIds: string[]) => {
    try {
      set({ isLoading: true, error: null })
      const questions = await questionService.reorderQuestions(surveyId, questionIds)
      set({
        questions,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reorder questions',
        isLoading: false,
      })
      throw error
    }
  },

  // UI actions
  setCurrentSurvey: (survey: Survey | null) => set({ currentSurvey: survey }),
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}))
