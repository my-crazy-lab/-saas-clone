import React from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

const SurveysPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600">Create and manage your surveys.</p>
        </div>
        <Link to="/surveys/new" className="btn btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Survey
        </Link>
      </div>

      {/* Empty State */}
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first survey.</p>
            <Link to="/surveys/new" className="btn btn-primary">
              Create Your First Survey
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveysPage
