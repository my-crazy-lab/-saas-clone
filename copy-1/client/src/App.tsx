import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layout components
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Dashboard pages
import DashboardPage from './pages/dashboard/DashboardPage'
import SurveysPage from './pages/surveys/SurveysPage'
import SurveyBuilderPage from './pages/surveys/SurveyBuilderPage'
import SurveyResponsesPage from './pages/surveys/SurveyResponsesPage'
import SurveyAnalyticsPage from './pages/surveys/SurveyAnalyticsPage'
import ProfilePage from './pages/profile/ProfilePage'

// Public pages
import PublicSurveyPage from './pages/public/PublicSurveyPage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <PublicLayout>
            <RegisterPage />
          </PublicLayout>
        </PublicRoute>
      } />
      
      {/* Public survey route */}
      <Route path="/survey/:id" element={
        <PublicLayout>
          <PublicSurveyPage />
        </PublicLayout>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="surveys" element={<SurveysPage />} />
        <Route path="surveys/new" element={<SurveyBuilderPage />} />
        <Route path="surveys/:id/edit" element={<SurveyBuilderPage />} />
        <Route path="surveys/:id/responses" element={<SurveyResponsesPage />} />
        <Route path="surveys/:id/analytics" element={<SurveyAnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      
      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
