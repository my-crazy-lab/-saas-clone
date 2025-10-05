import React from 'react'

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account settings.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Settings</h3>
            <p className="text-gray-600">Profile management coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
