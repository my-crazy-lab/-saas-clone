import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SurveyBuilderPage from '../src/pages/surveys/SurveyBuilderPage'
import { useSurveyStore } from '../src/stores/surveyStore'

// Mock the survey store
jest.mock('../src/stores/surveyStore')
const mockUseSurveyStore = useSurveyStore as jest.MockedFunction<typeof useSurveyStore>

// Mock react-router-dom
const mockNavigate = jest.fn()
const mockParams = { id: 'test-survey-id' }
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock @dnd-kit
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    setNodeRef: jest.fn(),
    isOver: false,
  }),
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
  }),
  verticalListSortingStrategy: 'vertical',
}))

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('SurveyBuilderPage', () => {
  const mockSurvey = {
    id: 'test-survey-id',
    title: 'Test Survey',
    description: 'Test Description',
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
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'user-id',
    isActive: true,
    expiresAt: null
  }

  const mockQuestions = [
    {
      id: 'question-1',
      questionText: 'What is your name?',
      type: 'SHORT_TEXT' as const,
      isRequired: true,
      order: 1,
      options: {},
      conditionalLogic: null,
      surveyId: 'test-survey-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'question-2',
      questionText: 'How satisfied are you?',
      type: 'LIKERT_SCALE' as const,
      isRequired: true,
      order: 2,
      options: {
        scale: 5,
        labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
      },
      conditionalLogic: null,
      surveyId: 'test-survey-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const mockStore = {
    currentSurvey: mockSurvey,
    questions: mockQuestions,
    isLoading: false,
    error: null,
    setSurvey: jest.fn(),
    setQuestions: jest.fn(),
    addQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    reorderQuestions: jest.fn(),
    clearSurvey: jest.fn(),
  }

  beforeEach(() => {
    mockUseSurveyStore.mockReturnValue(mockStore)
    jest.clearAllMocks()
  })

  it('renders survey builder interface', () => {
    renderWithProviders(<SurveyBuilderPage />)

    expect(screen.getByText('Survey Builder')).toBeInTheDocument()
    expect(screen.getByText('Test Survey')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('displays existing questions', () => {
    renderWithProviders(<SurveyBuilderPage />)

    expect(screen.getByText('What is your name?')).toBeInTheDocument()
    expect(screen.getByText('How satisfied are you?')).toBeInTheDocument()
    expect(screen.getByText('SHORT_TEXT')).toBeInTheDocument()
    expect(screen.getByText('LIKERT_SCALE')).toBeInTheDocument()
  })

  it('shows question type selector', () => {
    renderWithProviders(<SurveyBuilderPage />)

    expect(screen.getByText('Add Question')).toBeInTheDocument()
    
    // Click add question button
    const addButton = screen.getByText('Add Question')
    fireEvent.click(addButton)

    // Should show question type options
    expect(screen.getByText('Multiple Choice (Single)')).toBeInTheDocument()
    expect(screen.getByText('Multiple Choice (Multiple)')).toBeInTheDocument()
    expect(screen.getByText('Likert Scale')).toBeInTheDocument()
    expect(screen.getByText('Short Text')).toBeInTheDocument()
    expect(screen.getByText('Long Text')).toBeInTheDocument()
  })

  it('allows editing survey details', async () => {
    renderWithProviders(<SurveyBuilderPage />)

    // Click edit survey button
    const editButton = screen.getByText('Edit Survey')
    fireEvent.click(editButton)

    // Should show edit form
    const titleInput = screen.getByDisplayValue('Test Survey')
    const descriptionInput = screen.getByDisplayValue('Test Description')

    expect(titleInput).toBeInTheDocument()
    expect(descriptionInput).toBeInTheDocument()

    // Update title
    fireEvent.change(titleInput, { target: { value: 'Updated Survey Title' } })
    
    // Save changes
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    // Should call update function
    await waitFor(() => {
      expect(mockStore.setSurvey).toHaveBeenCalled()
    })
  })

  it('allows adding new questions', async () => {
    renderWithProviders(<SurveyBuilderPage />)

    // Click add question
    const addButton = screen.getByText('Add Question')
    fireEvent.click(addButton)

    // Select question type
    const shortTextOption = screen.getByText('Short Text')
    fireEvent.click(shortTextOption)

    // Fill question form
    const questionTextInput = screen.getByPlaceholderText('Enter your question...')
    fireEvent.change(questionTextInput, { target: { value: 'New test question' } })

    // Mark as required
    const requiredCheckbox = screen.getByLabelText('Required')
    fireEvent.click(requiredCheckbox)

    // Save question
    const saveQuestionButton = screen.getByText('Add Question')
    fireEvent.click(saveQuestionButton)

    // Should call add question function
    await waitFor(() => {
      expect(mockStore.addQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          questionText: 'New test question',
          type: 'SHORT_TEXT',
          isRequired: true
        })
      )
    })
  })

  it('allows editing existing questions', async () => {
    renderWithProviders(<SurveyBuilderPage />)

    // Click edit button on first question
    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    // Should show edit form
    const questionTextInput = screen.getByDisplayValue('What is your name?')
    expect(questionTextInput).toBeInTheDocument()

    // Update question text
    fireEvent.change(questionTextInput, { target: { value: 'What is your full name?' } })

    // Save changes
    const saveButton = screen.getByText('Save Changes')
    fireEvent.click(saveButton)

    // Should call update function
    await waitFor(() => {
      expect(mockStore.updateQuestion).toHaveBeenCalledWith(
        'question-1',
        expect.objectContaining({
          questionText: 'What is your full name?'
        })
      )
    })
  })

  it('allows deleting questions', async () => {
    renderWithProviders(<SurveyBuilderPage />)

    // Click delete button on first question
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    // Should show confirmation dialog
    expect(screen.getByText('Are you sure you want to delete this question?')).toBeInTheDocument()

    // Confirm deletion
    const confirmButton = screen.getByText('Delete Question')
    fireEvent.click(confirmButton)

    // Should call delete function
    await waitFor(() => {
      expect(mockStore.deleteQuestion).toHaveBeenCalledWith('question-1')
    })
  })

  it('shows preview mode', () => {
    renderWithProviders(<SurveyBuilderPage />)

    // Click preview button
    const previewButton = screen.getByText('Preview')
    fireEvent.click(previewButton)

    // Should show preview interface
    expect(screen.getByText('Survey Preview')).toBeInTheDocument()
    expect(screen.getByText('Back to Editor')).toBeInTheDocument()
  })

  it('handles loading state', () => {
    mockUseSurveyStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
      currentSurvey: null,
      questions: []
    })

    renderWithProviders(<SurveyBuilderPage />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles error state', () => {
    mockUseSurveyStore.mockReturnValue({
      ...mockStore,
      error: 'Failed to load survey',
      currentSurvey: null,
      questions: []
    })

    renderWithProviders(<SurveyBuilderPage />)

    expect(screen.getByText('Error: Failed to load survey')).toBeInTheDocument()
  })

  it('navigates back to surveys list', () => {
    renderWithProviders(<SurveyBuilderPage />)

    const backButton = screen.getByText('Back to Surveys')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/surveys')
  })
})
