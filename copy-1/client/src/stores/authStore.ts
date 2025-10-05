import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { authService, LoginCredentials, RegisterData } from '@/services/authService'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })
          const { user, token } = await authService.login(credentials)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null })
          const { user, token } = await authService.register(data)
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        authService.logout()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      refreshProfile: async () => {
        try {
          set({ isLoading: true, error: null })
          const user = await authService.getProfile()
          set({ user, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh profile',
            isLoading: false,
          })
          throw error
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null })
          const user = await authService.updateProfile(data)
          set({ user, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update profile',
            isLoading: false,
          })
          throw error
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null })
          await authService.changePassword({ currentPassword, newPassword })
          set({ isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to change password',
            isLoading: false,
          })
          throw error
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Initialize auth state from localStorage on app start
export const initializeAuth = () => {
  const token = authService.getToken()
  const user = authService.getCurrentUser()
  
  if (token && user && !authService.isTokenExpired()) {
    useAuthStore.setState({
      user,
      token,
      isAuthenticated: true,
    })
  } else {
    // Clear invalid auth data
    authService.logout()
  }
}
