import React from 'react'

const SurveyBuilderPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Builder</h1>
          <p className="text-gray-600">Create and customize your survey.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Survey Builder</h3>
            <p className="text-gray-600">Drag-and-drop survey builder coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyBuilderPage
