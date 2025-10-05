import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page not found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        <Link to="/" className="btn btn-primary">
          <HomeIcon className="w-4 h-4 mr-2" />
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
