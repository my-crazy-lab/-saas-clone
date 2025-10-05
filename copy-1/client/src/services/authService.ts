import { apiClient } from '@/utils/api'
import { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data
    }
    
    throw new Error(response.error || 'Login failed')
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    
    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      return response.data
    }
    
    throw new Error(response.error || 'Registration failed')
  }

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    
    // Redirect to login page
    window.location.href = '/login'
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile')
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get profile')
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', data)
    
    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update profile')
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await apiClient.post('/auth/change-password', data)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to change password')
    }
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh')
    
    if (response.success && response.data) {
      localStorage.setItem('auth_token', response.data.token)
      return response.data.token
    }
    
    throw new Error(response.error || 'Failed to refresh token')
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
    return null
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    const user = this.getCurrentUser()
    return !!(token && user)
  }

  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]!))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch {
      return true
    }
  }
}

export const authService = new AuthService()
export default authService
